import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";

const taskArea = v.union(v.literal("home"), v.literal("family"), v.literal("health"), v.literal("money"), v.literal("meals"), v.literal("shopping"), v.literal("other"));

type AppCtx = QueryCtx | MutationCtx;

async function requireMembership(ctx: AppCtx, householdId: Id<"households">) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Not authenticated");

  const user = await ctx.db
    .query("users")
    .withIndex("by_tokenIdentifier", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
    .unique();
  if (!user) throw new Error("User profile not found");

  const membership = await ctx.db
    .query("householdMembers")
    .withIndex("by_householdId_and_userId", (q) => q.eq("householdId", householdId).eq("userId", user._id))
    .unique();
  if (!membership) throw new Error("Not a member of this household");

  return user;
}

export const listOpen = query({
  args: { householdId: v.id("households"), limit: v.optional(v.number()) },
  returns: v.array(v.object({
    _id: v.id("tasks"),
    _creationTime: v.number(),
    title: v.string(),
    notes: v.optional(v.string()),
    area: taskArea,
    assignedTo: v.optional(v.id("users")),
    sharedResponsibility: v.boolean(),
    dueAt: v.optional(v.number()),
  })),
  handler: async (ctx, args) => {
    await requireMembership(ctx, args.householdId);
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_householdId_and_status", (q) => q.eq("householdId", args.householdId).eq("status", "open"))
      .order("desc")
      .take(Math.min(args.limit ?? 50, 100));

    return tasks.map(({ _id, _creationTime, title, notes, area, assignedTo, sharedResponsibility, dueAt }) => ({
      _id, _creationTime, title, notes, area, assignedTo, sharedResponsibility, dueAt,
    }));
  },
});

export const create = mutation({
  args: {
    householdId: v.id("households"),
    title: v.string(),
    notes: v.optional(v.string()),
    area: taskArea,
    assignedTo: v.optional(v.id("users")),
    sharedResponsibility: v.boolean(),
    dueAt: v.optional(v.number()),
  },
  returns: v.id("tasks"),
  handler: async (ctx, args) => {
    const user = await requireMembership(ctx, args.householdId);
    return await ctx.db.insert("tasks", { ...args, status: "open", createdBy: user._id });
  },
});

export const complete = mutation({
  args: { taskId: v.id("tasks") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task) throw new Error("Task not found");
    await requireMembership(ctx, task.householdId);
    await ctx.db.patch(args.taskId, { status: "done", completedAt: Date.now() });
    return null;
  },
});

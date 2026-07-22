import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireMembership } from "./lib/access";

const mentalLoadKind = v.union(
  v.literal("task"),
  v.literal("remember"),
  v.literal("decision"),
  v.literal("buy"),
  v.literal("arrange"),
);

function cleanTitle(value: string): string {
  const title = value.trim().replace(/\s+/g, " ");
  if (title.length < 1 || title.length > 140) {
    throw new Error("Keep each open loop between 1 and 140 characters.");
  }
  return title;
}

export const list = query({
  args: { householdId: v.id("households") },
  handler: async (ctx, args) => {
    const { userId } = await requireMembership(ctx, args.householdId);
    const items = await ctx.db
      .query("mentalLoadItems")
      .withIndex("by_household_id", (query) =>
        query.eq("householdId", args.householdId),
      )
      .collect();

    return items
      .sort((left, right) => {
        if (left.status !== right.status) {
          return left.status === "open" ? -1 : 1;
        }

        if (left.status === "done") {
          return (
            (right.completedAt ?? right.updatedAt) -
            (left.completedAt ?? left.updatedAt)
          );
        }

        const leftDue = left.dueAt ?? Number.MAX_SAFE_INTEGER;
        const rightDue = right.dueAt ?? Number.MAX_SAFE_INTEGER;
        if (leftDue !== rightDue) return leftDue - rightDue;
        return right.createdAt - left.createdAt;
      })
      .map((item) => ({
        itemId: item._id,
        title: item.title,
        kind: item.kind,
        status: item.status,
        dueAt: item.dueAt,
        completedAt: item.completedAt,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        isMine: item.ownerUserId === userId,
      }));
  },
});

export const create = mutation({
  args: {
    householdId: v.id("households"),
    title: v.string(),
    kind: mentalLoadKind,
    dueAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { userId } = await requireMembership(ctx, args.householdId);
    const now = Date.now();

    if (args.dueAt !== undefined && !Number.isFinite(args.dueAt)) {
      throw new Error("The due date is not valid.");
    }

    return await ctx.db.insert("mentalLoadItems", {
      householdId: args.householdId,
      title: cleanTitle(args.title),
      kind: args.kind,
      status: "open",
      ownerUserId: userId,
      createdByUserId: userId,
      dueAt: args.dueAt,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const setStatus = mutation({
  args: {
    householdId: v.id("households"),
    itemId: v.id("mentalLoadItems"),
    status: v.union(v.literal("open"), v.literal("done")),
  },
  handler: async (ctx, args) => {
    await requireMembership(ctx, args.householdId);
    const item = await ctx.db.get(args.itemId);

    if (!item || item.householdId !== args.householdId) {
      throw new Error("That open loop could not be found.");
    }

    const now = Date.now();
    await ctx.db.patch(args.itemId, {
      status: args.status,
      completedAt: args.status === "done" ? now : item.completedAt,
      updatedAt: now,
    });
  },
});

export const remove = mutation({
  args: {
    householdId: v.id("households"),
    itemId: v.id("mentalLoadItems"),
  },
  handler: async (ctx, args) => {
    await requireMembership(ctx, args.householdId);
    const item = await ctx.db.get(args.itemId);

    if (!item || item.householdId !== args.householdId) {
      throw new Error("That open loop could not be found.");
    }

    await ctx.db.delete(args.itemId);
  },
});

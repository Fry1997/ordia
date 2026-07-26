import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireHouseholdAdult, requireHouseholdMember, requireUser } from "./lib/access";

const roleValidator = v.union(v.literal("owner"), v.literal("adult"), v.literal("member"));

export const listMine = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("households"),
      name: v.string(),
      timeZone: v.string(),
      role: roleValidator,
    }),
  ),
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    const memberships = await ctx.db
      .query("householdMembers")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .take(50);

    const rows = await Promise.all(
      memberships.map(async (membership) => {
        const household = await ctx.db.get(membership.householdId);
        return household
          ? {
              _id: household._id,
              name: household.name,
              timeZone: household.timeZone,
              role: membership.role,
            }
          : null;
      }),
    );

    return rows.filter((row): row is NonNullable<typeof row> => row !== null);
  },
});

export const create = mutation({
  args: { name: v.string(), timeZone: v.string() },
  returns: v.id("households"),
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const name = args.name.trim();
    if (name.length < 2) {
      throw new Error("Give the household a name");
    }

    const now = Date.now();
    const householdId = await ctx.db.insert("households", {
      name,
      timeZone: args.timeZone || "Europe/London",
      createdBy: userId,
      updatedAt: now,
    });
    await ctx.db.insert("householdMembers", {
      householdId,
      userId,
      role: "owner",
      joinedAt: now,
    });
    return householdId;
  },
});

export const rename = mutation({
  args: { householdId: v.id("households"), name: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireHouseholdAdult(ctx, args.householdId);
    const name = args.name.trim();
    if (name.length < 2) {
      throw new Error("Give the household a name");
    }
    await ctx.db.patch(args.householdId, { name, updatedAt: Date.now() });
    return null;
  },
});

export const createInvite = mutation({
  args: { householdId: v.id("households"), role: roleValidator },
  returns: v.string(),
  handler: async (ctx, args) => {
    const userId = await requireHouseholdAdult(ctx, args.householdId);
    const code = crypto.randomUUID().replaceAll("-", "").slice(0, 10).toUpperCase();
    await ctx.db.insert("householdInvites", {
      householdId: args.householdId,
      code,
      role: args.role === "owner" ? "adult" : args.role,
      createdBy: userId,
      createdAt: Date.now(),
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
    });
    return code;
  },
});

export const acceptInvite = mutation({
  args: { code: v.string() },
  returns: v.id("households"),
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const code = args.code.trim().toUpperCase();
    const invite = await ctx.db
      .query("householdInvites")
      .withIndex("by_code", (q) => q.eq("code", code))
      .unique();

    if (!invite || invite.acceptedAt || invite.expiresAt < Date.now()) {
      throw new Error("This invite is invalid or has expired");
    }

    const existing = await ctx.db
      .query("householdMembers")
      .withIndex("by_householdId_and_userId", (q) =>
        q.eq("householdId", invite.householdId).eq("userId", userId),
      )
      .unique();

    if (!existing) {
      await ctx.db.insert("householdMembers", {
        householdId: invite.householdId,
        userId,
        role: invite.role,
        joinedAt: Date.now(),
      });
    }

    await ctx.db.patch(invite._id, { acceptedBy: userId, acceptedAt: Date.now() });
    return invite.householdId;
  },
});

export const listMembers = query({
  args: { householdId: v.id("households") },
  returns: v.array(
    v.object({
      userId: v.id("users"),
      name: v.optional(v.string()),
      email: v.optional(v.string()),
      role: roleValidator,
    }),
  ),
  handler: async (ctx, args) => {
    await requireHouseholdMember(ctx, args.householdId);
    const memberships = await ctx.db
      .query("householdMembers")
      .withIndex("by_householdId", (q) => q.eq("householdId", args.householdId))
      .take(50);

    return await Promise.all(
      memberships.map(async (membership) => {
        const user = await ctx.db.get(membership.userId);
        return {
          userId: membership.userId,
          role: membership.role,
          ...(user?.name ? { name: user.name } : {}),
          ...(user?.email ? { email: user.email } : {}),
        };
      }),
    );
  },
});

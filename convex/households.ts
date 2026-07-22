import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { cleanName, requireMembership, requireUserId } from "./lib/access";

const householdSummaryValidator = v.object({
  householdId: v.id("households"),
  name: v.string(),
  role: v.union(v.literal("owner"), v.literal("admin"), v.literal("member")),
  joinedAt: v.number(),
});

const memberValidator = v.object({
  membershipId: v.id("householdMemberships"),
  userId: v.id("users"),
  displayName: v.string(),
  email: v.union(v.string(), v.null()),
  role: v.union(v.literal("owner"), v.literal("admin"), v.literal("member")),
  joinedAt: v.number(),
});

export const listMine = query({
  args: {},
  returns: v.array(householdSummaryValidator),
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);
    const memberships = await ctx.db
      .query("householdMemberships")
      .withIndex("by_user_id", (query) => query.eq("userId", userId))
      .take(100);

    const activeMemberships = memberships.filter(
      (membership) => membership.status === "active",
    );

    const rows = await Promise.all(
      activeMemberships.map(async (membership) => {
        const household = await ctx.db.get(membership.householdId);
        return household
          ? {
              householdId: household._id,
              name: household.name,
              role: membership.role,
              joinedAt: membership.joinedAt,
            }
          : null;
      }),
    );

    return rows.filter((row): row is NonNullable<typeof row> => row !== null);
  },
});

export const create = mutation({
  args: {
    householdName: v.string(),
    displayName: v.string(),
  },
  returns: v.id("households"),
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const householdName = cleanName(args.householdName, "Household name");
    const displayName = cleanName(args.displayName, "Display name");
    const now = Date.now();

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user_id", (query) => query.eq("userId", userId))
      .unique();

    if (profile) {
      await ctx.db.patch(profile._id, { displayName, updatedAt: now });
    } else {
      await ctx.db.insert("profiles", {
        userId,
        displayName,
        createdAt: now,
        updatedAt: now,
      });
    }

    const householdId = await ctx.db.insert("households", {
      name: householdName,
      createdByUserId: userId,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("householdMemberships", {
      householdId,
      userId,
      role: "owner",
      status: "active",
      joinedAt: now,
    });

    return householdId;
  },
});

export const listMembers = query({
  args: { householdId: v.id("households") },
  returns: v.array(memberValidator),
  handler: async (ctx, args) => {
    await requireMembership(ctx, args.householdId);
    const memberships = await ctx.db
      .query("householdMemberships")
      .withIndex("by_household_id", (query) =>
        query.eq("householdId", args.householdId),
      )
      .take(100);

    const activeMemberships = memberships.filter(
      (membership) => membership.status === "active",
    );

    return await Promise.all(
      activeMemberships.map(async (membership) => {
        const [user, profile] = await Promise.all([
          ctx.db.get(membership.userId),
          ctx.db
            .query("profiles")
            .withIndex("by_user_id", (query) =>
              query.eq("userId", membership.userId),
            )
            .unique(),
        ]);

        return {
          membershipId: membership._id,
          userId: membership.userId,
          displayName:
            profile?.displayName ?? user?.name ?? user?.email ?? "Household member",
          email: user?.email ?? null,
          role: membership.role,
          joinedAt: membership.joinedAt,
        };
      }),
    );
  },
});

export const rename = mutation({
  args: { householdId: v.id("households"), name: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireMembership(ctx, args.householdId, ["owner", "admin"]);
    await ctx.db.patch(args.householdId, {
      name: cleanName(args.name, "Household name"),
      updatedAt: Date.now(),
    });
    return null;
  },
});

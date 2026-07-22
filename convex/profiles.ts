import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { cleanName, requireUserId } from "./lib/access";

const viewerValidator = v.union(
  v.null(),
  v.object({
    userId: v.id("users"),
    email: v.union(v.string(), v.null()),
    displayName: v.union(v.string(), v.null()),
  }),
);

export const viewer = query({
  args: {},
  returns: viewerValidator,
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);
    const [user, profile] = await Promise.all([
      ctx.db.get(userId),
      ctx.db
        .query("profiles")
        .withIndex("by_user_id", (query) => query.eq("userId", userId))
        .unique(),
    ]);

    return {
      userId,
      email: user?.email ?? null,
      displayName: profile?.displayName ?? user?.name ?? null,
    };
  },
});

export const upsert = mutation({
  args: { displayName: v.string() },
  returns: v.id("profiles"),
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const displayName = cleanName(args.displayName, "Display name");
    const existing = await ctx.db
      .query("profiles")
      .withIndex("by_user_id", (query) => query.eq("userId", userId))
      .unique();
    const now = Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, { displayName, updatedAt: now });
      return existing._id;
    }

    return await ctx.db.insert("profiles", {
      userId,
      displayName,
      createdAt: now,
      updatedAt: now,
    });
  },
});

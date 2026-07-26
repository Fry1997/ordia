import { v } from "convex/values";
import { query } from "./_generated/server";
import { requireUser } from "./lib/access";

export const me = query({
  args: {},
  returns: v.object({
    _id: v.id("users"),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
  }),
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("Account not found");
    }
    return {
      _id: user._id,
      ...(user.name ? { name: user.name } : {}),
      ...(user.email ? { email: user.email } : {}),
    };
  },
});

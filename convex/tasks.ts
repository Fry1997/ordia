import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const today = query({ args: { householdId: v.id("households") }, handler: async (ctx, args) => ctx.db.query("tasks").withIndex("by_household_status", q => q.eq("householdId", args.householdId).eq("status", "open")).collect() });
export const complete = mutation({ args: { taskId: v.id("tasks"), completionData: v.optional(v.any()) }, handler: async (ctx, args) => ctx.db.patch(args.taskId, { status: "done", completionData: args.completionData }) });

import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({ args: { householdId: v.id("households") }, handler: async (ctx, args) => ctx.db.query("areas").withIndex("by_household", q => q.eq("householdId", args.householdId)).collect() });
export const create = mutation({ args: { householdId: v.id("households"), userId: v.id("users"), name: v.string(), description: v.optional(v.string()), parentAreaId: v.optional(v.id("areas")) }, handler: async (ctx, args) => ctx.db.insert("areas", { householdId: args.householdId, createdBy: args.userId, name: args.name, description: args.description, parentAreaId: args.parentAreaId }) });

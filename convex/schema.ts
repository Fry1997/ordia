import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({ email: v.string(), name: v.string() }).index("by_email", ["email"]),
  households: defineTable({ name: v.string(), createdBy: v.id("users") }),
  memberships: defineTable({ householdId: v.id("households"), userId: v.id("users"), role: v.union(v.literal("owner"), v.literal("member")) }).index("by_user", ["userId"]).index("by_household", ["householdId"]),
  areas: defineTable({ householdId: v.id("households"), name: v.string(), description: v.optional(v.string()), parentAreaId: v.optional(v.id("areas")), createdBy: v.id("users"), archivedAt: v.optional(v.number()) }).index("by_household", ["householdId"]).index("by_parent", ["parentAreaId"]),
  records: defineTable({ householdId: v.id("households"), areaId: v.id("areas"), kind: v.string(), title: v.string(), data: v.any(), updatedBy: v.id("users") }).index("by_area", ["areaId"]),
  rules: defineTable({ householdId: v.id("households"), areaId: v.id("areas"), name: v.string(), trigger: v.any(), effects: v.array(v.any()), enabled: v.boolean() }).index("by_area", ["areaId"]),
  tasks: defineTable({ householdId: v.id("households"), areaId: v.id("areas"), title: v.string(), context: v.optional(v.string()), dueAt: v.optional(v.number()), assignedTo: v.optional(v.id("users")), sourceRuleId: v.optional(v.id("rules")), status: v.union(v.literal("open"), v.literal("done"), v.literal("cancelled")), completionData: v.optional(v.any()) }).index("by_household_status", ["householdId", "status"]).index("by_area", ["areaId"]),
});

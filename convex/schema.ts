import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const role = v.union(v.literal("owner"), v.literal("adult"), v.literal("member"));
const taskStatus = v.union(v.literal("open"), v.literal("done"), v.literal("archived"));
const taskArea = v.union(v.literal("home"), v.literal("family"), v.literal("health"), v.literal("money"), v.literal("meals"), v.literal("shopping"), v.literal("other"));

export default defineSchema({
  users: defineTable({
    tokenIdentifier: v.string(),
    name: v.string(),
    email: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
  }).index("by_tokenIdentifier", ["tokenIdentifier"]),

  households: defineTable({
    name: v.string(),
    createdBy: v.id("users"),
  }).index("by_createdBy", ["createdBy"]),

  householdMembers: defineTable({
    householdId: v.id("households"),
    userId: v.id("users"),
    role,
  })
    .index("by_householdId", ["householdId"])
    .index("by_userId", ["userId"])
    .index("by_householdId_and_userId", ["householdId", "userId"]),

  tasks: defineTable({
    householdId: v.id("households"),
    title: v.string(),
    notes: v.optional(v.string()),
    area: taskArea,
    status: taskStatus,
    createdBy: v.id("users"),
    assignedTo: v.optional(v.id("users")),
    sharedResponsibility: v.boolean(),
    dueAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
  })
    .index("by_householdId_and_status", ["householdId", "status"])
    .index("by_householdId_and_assignedTo_and_status", ["householdId", "assignedTo", "status"]),

  shoppingLists: defineTable({
    householdId: v.id("households"),
    name: v.string(),
    archived: v.boolean(),
  }).index("by_householdId_and_archived", ["householdId", "archived"]),

  shoppingItems: defineTable({
    listId: v.id("shoppingLists"),
    householdId: v.id("households"),
    name: v.string(),
    quantity: v.optional(v.string()),
    checked: v.boolean(),
    addedBy: v.id("users"),
  })
    .index("by_listId_and_checked", ["listId", "checked"])
    .index("by_householdId", ["householdId"]),

  mealPlans: defineTable({
    householdId: v.id("households"),
    date: v.string(),
    title: v.string(),
    notes: v.optional(v.string()),
    createdBy: v.id("users"),
  }).index("by_householdId_and_date", ["householdId", "date"]),
});

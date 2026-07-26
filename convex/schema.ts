import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const role = v.union(v.literal("owner"), v.literal("adult"), v.literal("member"));
const itineraryKind = v.union(
  v.literal("reminder"),
  v.literal("check"),
  v.literal("event"),
  v.literal("chore"),
);
const completionMode = v.union(
  v.literal("none"),
  v.literal("manual"),
  v.literal("checklist"),
  v.literal("manual_or_checklist"),
);
const scheduleType = v.union(
  v.literal("fixed"),
  v.literal("relative"),
  v.literal("rolling"),
);
const recurrenceType = v.union(
  v.literal("none"),
  v.literal("daily"),
  v.literal("weekly"),
  v.literal("monthly"),
);
const rollingUnit = v.union(v.literal("day"), v.literal("week"), v.literal("month"));
const relativeDirection = v.union(v.literal("before"), v.literal("after"));

export default defineSchema({
  ...authTables,

  households: defineTable({
    name: v.string(),
    createdBy: v.id("users"),
    timeZone: v.string(),
    updatedAt: v.number(),
  }).index("by_createdBy", ["createdBy"]),

  householdMembers: defineTable({
    householdId: v.id("households"),
    userId: v.id("users"),
    role,
    joinedAt: v.number(),
  })
    .index("by_householdId", ["householdId"])
    .index("by_userId", ["userId"])
    .index("by_householdId_and_userId", ["householdId", "userId"]),

  householdInvites: defineTable({
    householdId: v.id("households"),
    code: v.string(),
    role,
    createdBy: v.id("users"),
    createdAt: v.number(),
    expiresAt: v.number(),
    acceptedBy: v.optional(v.id("users")),
    acceptedAt: v.optional(v.number()),
  })
    .index("by_code", ["code"])
    .index("by_householdId", ["householdId"]),

  locations: defineTable({
    householdId: v.id("households"),
    name: v.string(),
    address: v.optional(v.string()),
    phone: v.optional(v.string()),
    contactLabel: v.optional(v.string()),
    notes: v.optional(v.string()),
    archived: v.boolean(),
    createdBy: v.id("users"),
    updatedAt: v.number(),
  }).index("by_householdId_and_archived", ["householdId", "archived"]),

  itineraryItems: defineTable({
    householdId: v.id("households"),
    title: v.string(),
    details: v.optional(v.string()),
    kind: itineraryKind,
    completionMode,
    scheduleType,
    active: v.boolean(),
    createdBy: v.id("users"),
    assignedTo: v.optional(v.id("users")),
    locationId: v.optional(v.id("locations")),

    allDay: v.boolean(),
    startDate: v.optional(v.string()),
    startMinute: v.optional(v.number()),
    endMinute: v.optional(v.number()),
    recurrenceType,
    recurrenceInterval: v.number(),
    recurrenceWeekdays: v.array(v.number()),

    anchorItemId: v.optional(v.id("itineraryItems")),
    relativeDirection: v.optional(relativeDirection),
    relativeOffsetMinutes: v.optional(v.number()),

    rollingUnit: v.optional(rollingUnit),
    rollingInterval: v.optional(v.number()),
    nextDueAt: v.optional(v.number()),
    resetOnCompletion: v.boolean(),

    rotationLabels: v.array(v.string()),
    rotationAnchorDate: v.optional(v.string()),
    updatedAt: v.number(),
  })
    .index("by_householdId_and_active", ["householdId", "active"])
    .index("by_anchorItemId_and_active", ["anchorItemId", "active"])
    .index("by_householdId_and_nextDueAt", ["householdId", "nextDueAt"]),

  checklistItems: defineTable({
    householdId: v.id("households"),
    itineraryItemId: v.id("itineraryItems"),
    parentItemId: v.optional(v.id("checklistItems")),
    label: v.string(),
    requiredQuantity: v.number(),
    sortOrder: v.number(),
    active: v.boolean(),
  })
    .index("by_itineraryItemId_and_active", ["itineraryItemId", "active"])
    .index("by_parentItemId", ["parentItemId"]),

  itemCompletions: defineTable({
    householdId: v.id("households"),
    itineraryItemId: v.id("itineraryItems"),
    completedBy: v.id("users"),
    completedAt: v.number(),
    note: v.optional(v.string()),
  })
    .index("by_itineraryItemId_and_completedAt", ["itineraryItemId", "completedAt"])
    .index("by_householdId_and_completedAt", ["householdId", "completedAt"]),
});

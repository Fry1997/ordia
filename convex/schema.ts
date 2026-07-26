import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const role = v.union(v.literal("owner"), v.literal("adult"), v.literal("member"));
const taskStatus = v.union(v.literal("open"), v.literal("done"), v.literal("archived"));
const taskArea = v.union(v.literal("home"), v.literal("family"), v.literal("health"), v.literal("money"), v.literal("meals"), v.literal("shopping"), v.literal("other"));
const itineraryKind = v.union(v.literal("reminder"), v.literal("check"), v.literal("event"), v.literal("chore"));
const completionMode = v.union(v.literal("none"), v.literal("manual"), v.literal("checklist"), v.literal("manual_or_checklist"));
const scheduleType = v.union(v.literal("fixed"), v.literal("relative"), v.literal("rolling"));
const recurrenceType = v.union(v.literal("none"), v.literal("daily"), v.literal("weekly"), v.literal("monthly"));
const rollingUnit = v.union(v.literal("day"), v.literal("week"), v.literal("month"));
const relativePoint = v.union(v.literal("start"), v.literal("end"), v.literal("due"));
const relativeDirection = v.union(v.literal("before"), v.literal("after"));
const occurrenceStatus = v.union(v.literal("pending"), v.literal("completed"), v.literal("skipped"));
const checklistMode = v.union(v.literal("prepare"), v.literal("review"), v.literal("custom"));
const attentionStatus = v.union(v.literal("open"), v.literal("resolved"));

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
    timeZone: v.optional(v.string()),
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

  locations: defineTable({
    householdId: v.id("households"),
    name: v.string(),
    address: v.optional(v.string()),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
    phone: v.optional(v.string()),
    roomName: v.optional(v.string()),
    notes: v.optional(v.string()),
    archived: v.boolean(),
    createdBy: v.id("users"),
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
    sharedResponsibility: v.boolean(),
    locationId: v.optional(v.id("locations")),
    checklistTemplateId: v.optional(v.id("checklistTemplates")),

    allDay: v.optional(v.boolean()),
    startMinute: v.optional(v.number()),
    endMinute: v.optional(v.number()),
    recurrenceType: v.optional(recurrenceType),
    recurrenceInterval: v.optional(v.number()),
    recurrenceWeekdays: v.optional(v.array(v.number())),
    recurrenceAnchorDate: v.optional(v.string()),

    anchorItemId: v.optional(v.id("itineraryItems")),
    relativePoint: v.optional(relativePoint),
    relativeDirection: v.optional(relativeDirection),
    relativeOffsetMinutes: v.optional(v.number()),
    inheritRotation: v.optional(v.boolean()),

    rollingUnit: v.optional(rollingUnit),
    rollingInterval: v.optional(v.number()),
    nextDueAt: v.optional(v.number()),
    resetRollingScheduleOnCompletion: v.optional(v.boolean()),
  })
    .index("by_householdId_and_active", ["householdId", "active"])
    .index("by_anchorItemId_and_active", ["anchorItemId", "active"])
    .index("by_householdId_and_nextDueAt", ["householdId", "nextDueAt"]),

  itineraryOccurrences: defineTable({
    householdId: v.id("households"),
    itemId: v.id("itineraryItems"),
    localDate: v.string(),
    timelineAt: v.number(),
    startsAt: v.optional(v.number()),
    endsAt: v.optional(v.number()),
    dueAt: v.optional(v.number()),
    status: occurrenceStatus,
    completedAt: v.optional(v.number()),
    completedBy: v.optional(v.id("users")),
    completionSource: v.optional(v.union(v.literal("manual"), v.literal("checklist"))),
    rotationOptionId: v.optional(v.id("rotationOptions")),
    anchorOccurrenceId: v.optional(v.id("itineraryOccurrences")),
  })
    .index("by_householdId_and_timelineAt", ["householdId", "timelineAt"])
    .index("by_itemId_and_localDate", ["itemId", "localDate"])
    .index("by_itemId_and_status", ["itemId", "status"]),

  rotationOptions: defineTable({
    householdId: v.id("households"),
    itemId: v.id("itineraryItems"),
    position: v.number(),
    label: v.string(),
    details: v.optional(v.string()),
  })
    .index("by_itemId_and_position", ["itemId", "position"])
    .index("by_householdId", ["householdId"]),

  notificationRules: defineTable({
    householdId: v.id("households"),
    itemId: v.id("itineraryItems"),
    trigger: v.union(v.literal("before_start"), v.literal("before_due"), v.literal("at_start")),
    offsetMinutes: v.number(),
    enabled: v.boolean(),
  }).index("by_itemId_and_enabled", ["itemId", "enabled"]),

  kits: defineTable({
    householdId: v.id("households"),
    name: v.string(),
    notes: v.optional(v.string()),
    archived: v.boolean(),
    createdBy: v.id("users"),
  }).index("by_householdId_and_archived", ["householdId", "archived"]),

  kitItems: defineTable({
    householdId: v.id("households"),
    kitId: v.id("kits"),
    parentItemId: v.optional(v.id("kitItems")),
    name: v.string(),
    targetQuantity: v.optional(v.number()),
    unitLabel: v.optional(v.string()),
    sortOrder: v.number(),
    active: v.boolean(),
  })
    .index("by_kitId_and_active", ["kitId", "active"])
    .index("by_parentItemId", ["parentItemId"]),

  checklistTemplates: defineTable({
    householdId: v.id("households"),
    name: v.string(),
    mode: checklistMode,
    kitId: v.optional(v.id("kits")),
    archived: v.boolean(),
    createdBy: v.id("users"),
  }).index("by_householdId_and_archived", ["householdId", "archived"]),

  checklistTemplateItems: defineTable({
    householdId: v.id("households"),
    templateId: v.id("checklistTemplates"),
    kitItemId: v.optional(v.id("kitItems")),
    parentTemplateItemId: v.optional(v.id("checklistTemplateItems")),
    label: v.optional(v.string()),
    requiredQuantity: v.optional(v.number()),
    sortOrder: v.number(),
    active: v.boolean(),
  })
    .index("by_templateId_and_active", ["templateId", "active"])
    .index("by_parentTemplateItemId", ["parentTemplateItemId"]),

  checklistRuns: defineTable({
    householdId: v.id("households"),
    occurrenceId: v.id("itineraryOccurrences"),
    templateId: v.id("checklistTemplates"),
    status: v.union(v.literal("open"), v.literal("completed")),
    completedAt: v.optional(v.number()),
    completedBy: v.optional(v.id("users")),
  })
    .index("by_occurrenceId", ["occurrenceId"])
    .index("by_householdId_and_status", ["householdId", "status"]),

  checklistRunItems: defineTable({
    householdId: v.id("households"),
    runId: v.id("checklistRuns"),
    templateItemId: v.id("checklistTemplateItems"),
    kitItemId: v.optional(v.id("kitItems")),
    checked: v.boolean(),
    checkedQuantity: v.optional(v.number()),
    needsAttention: v.boolean(),
    note: v.optional(v.string()),
  })
    .index("by_runId", ["runId"])
    .index("by_kitItemId_and_needsAttention", ["kitItemId", "needsAttention"]),

  kitItemAttention: defineTable({
    householdId: v.id("households"),
    kitItemId: v.id("kitItems"),
    sourceRunItemId: v.id("checklistRunItems"),
    status: attentionStatus,
    note: v.optional(v.string()),
    createdAt: v.number(),
    resolvedAt: v.optional(v.number()),
    resolvedBy: v.optional(v.id("users")),
  })
    .index("by_householdId_and_status", ["householdId", "status"])
    .index("by_kitItemId_and_status", ["kitItemId", "status"]),

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
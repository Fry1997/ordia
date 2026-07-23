import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const membershipRole = v.union(
  v.literal("owner"),
  v.literal("admin"),
  v.literal("member"),
);

const invitationRole = v.union(v.literal("admin"), v.literal("member"));

const mentalLoadKind = v.union(
  v.literal("task"),
  v.literal("remember"),
  v.literal("decision"),
  v.literal("buy"),
  v.literal("arrange"),
);

const visibility = v.union(v.literal("private"), v.literal("household"));
const responsibilityStatus = v.union(v.literal("active"), v.literal("paused"));
const taskStatus = v.union(v.literal("open"), v.literal("done"));
const routineStatus = v.union(v.literal("active"), v.literal("paused"));
const knowledgeKind = v.union(
  v.literal("place"),
  v.literal("thing"),
  v.literal("meal"),
  v.literal("restaurant"),
  v.literal("takeaway"),
  v.literal("snack"),
  v.literal("activity"),
  v.literal("drink"),
  v.literal("ingredient"),
  v.literal("product"),
  v.literal("service"),
  v.literal("fact"),
  v.literal("decision"),
  v.literal("note"),
);
const preferenceKind = v.union(
  v.literal("favourite"),
  v.literal("likes"),
  v.literal("usually"),
  v.literal("dislikes"),
  v.literal("avoids"),
  v.literal("needs"),
  v.literal("only_if"),
);

export default defineSchema({
  ...authTables,

  profiles: defineTable({
    userId: v.id("users"),
    displayName: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user_id", ["userId"]),

  households: defineTable({
    name: v.string(),
    createdByUserId: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_created_by_user_id", ["createdByUserId"]),

  householdMemberships: defineTable({
    householdId: v.id("households"),
    userId: v.id("users"),
    role: membershipRole,
    status: v.union(v.literal("active"), v.literal("removed")),
    joinedAt: v.number(),
    invitedByUserId: v.optional(v.id("users")),
  })
    .index("by_household_id", ["householdId"])
    .index("by_user_id", ["userId"])
    .index("by_household_id_and_user_id", ["householdId", "userId"]),

  householdInvitations: defineTable({
    householdId: v.id("households"),
    emailNormalized: v.string(),
    role: invitationRole,
    tokenHash: v.string(),
    invitedByUserId: v.id("users"),
    expiresAt: v.number(),
    status: v.union(
      v.literal("pending"),
      v.literal("accepted"),
      v.literal("revoked"),
      v.literal("expired"),
    ),
    createdAt: v.number(),
    acceptedAt: v.optional(v.number()),
    acceptedByUserId: v.optional(v.id("users")),
  })
    .index("by_token_hash", ["tokenHash"])
    .index("by_household_id_and_status", ["householdId", "status"])
    .index("by_email_normalized_and_status", ["emailNormalized", "status"]),

  mentalLoadItems: defineTable({
    householdId: v.id("households"),
    title: v.string(),
    kind: mentalLoadKind,
    status: taskStatus,
    ownerUserId: v.id("users"),
    createdByUserId: v.id("users"),
    dueAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_household_id", ["householdId"])
    .index("by_household_id_and_status", ["householdId", "status"]),

  householdPeople: defineTable({
    householdId: v.id("households"),
    name: v.string(),
    relationship: v.optional(v.string()),
    birthDate: v.optional(v.string()),
    note: v.optional(v.string()),
    visibility,
    linkedUserId: v.optional(v.id("users")),
    createdByUserId: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_household_id", ["householdId"])
    .index("by_linked_user_id", ["linkedUserId"]),

  responsibilities: defineTable({
    householdId: v.id("households"),
    name: v.string(),
    description: v.optional(v.string()),
    status: responsibilityStatus,
    ownerPersonId: v.optional(v.id("householdPeople")),
    nextDueAt: v.optional(v.number()),
    createdByUserId: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_household_id", ["householdId"])
    .index("by_household_id_and_status", ["householdId", "status"]),

  routines: defineTable({
    householdId: v.id("households"),
    name: v.string(),
    description: v.optional(v.string()),
    scheduleText: v.string(),
    steps: v.array(v.string()),
    status: routineStatus,
    responsibilityId: v.optional(v.id("responsibilities")),
    personId: v.optional(v.id("householdPeople")),
    nextDueAt: v.optional(v.number()),
    createdByUserId: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_household_id", ["householdId"])
    .index("by_responsibility_id", ["responsibilityId"])
    .index("by_person_id", ["personId"]),

  tasks: defineTable({
    householdId: v.id("households"),
    title: v.string(),
    notes: v.optional(v.string()),
    status: taskStatus,
    dueAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    responsibilityId: v.optional(v.id("responsibilities")),
    routineId: v.optional(v.id("routines")),
    personId: v.optional(v.id("householdPeople")),
    ownerPersonId: v.optional(v.id("householdPeople")),
    createdByUserId: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_household_id", ["householdId"])
    .index("by_household_id_and_status", ["householdId", "status"])
    .index("by_responsibility_id", ["responsibilityId"])
    .index("by_routine_id", ["routineId"])
    .index("by_person_id", ["personId"]),

  knowledgeItems: defineTable({
    householdId: v.id("households"),
    kind: knowledgeKind,
    name: v.string(),
    detail: v.optional(v.string()),
    createdByUserId: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_household_id", ["householdId"])
    .index("by_household_id_and_kind", ["householdId", "kind"]),

  preferences: defineTable({
    householdId: v.id("households"),
    personId: v.optional(v.id("householdPeople")),
    subjectItemId: v.optional(v.id("knowledgeItems")),
    subjectName: v.string(),
    kind: preferenceKind,
    detail: v.optional(v.string()),
    visibility,
    createdByUserId: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_household_id", ["householdId"])
    .index("by_person_id", ["personId"])
    .index("by_subject_item_id", ["subjectItemId"]),

  playbooks: defineTable({
    householdId: v.id("households"),
    name: v.string(),
    notes: v.optional(v.string()),
    steps: v.array(v.string()),
    linkedItemId: v.optional(v.id("knowledgeItems")),
    responsibilityId: v.optional(v.id("responsibilities")),
    createdByUserId: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_household_id", ["householdId"])
    .index("by_linked_item_id", ["linkedItemId"])
    .index("by_responsibility_id", ["responsibilityId"]),
});
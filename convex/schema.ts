import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const membershipRole = v.union(
  v.literal("owner"),
  v.literal("admin"),
  v.literal("member"),
);

const invitationRole = v.union(v.literal("admin"), v.literal("member"));

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
    token: v.string(),
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
    .index("by_token", ["token"])
    .index("by_household_id_and_status", ["householdId", "status"])
    .index("by_email_normalized_and_status", ["emailNormalized", "status"]),
});

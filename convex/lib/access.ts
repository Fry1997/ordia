import { getAuthUserId } from "@convex-dev/auth/server";
import type { Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";

export type MembershipRole = "owner" | "admin" | "member";

type ReadContext = QueryCtx | MutationCtx;

export async function requireUserId(ctx: ReadContext): Promise<Id<"users">> {
  const userId = await getAuthUserId(ctx);
  if (userId === null) {
    throw new Error("You must be signed in.");
  }
  return userId;
}

export async function getMembership(
  ctx: ReadContext,
  householdId: Id<"households">,
  userId: Id<"users">,
) {
  const membership = await ctx.db
    .query("householdMemberships")
    .withIndex("by_household_id_and_user_id", (query) =>
      query.eq("householdId", householdId).eq("userId", userId),
    )
    .unique();

  return membership;
}

export async function getActiveMembership(
  ctx: ReadContext,
  householdId: Id<"households">,
  userId: Id<"users">,
) {
  const membership = await getMembership(ctx, householdId, userId);
  return membership?.status === "active" ? membership : null;
}

export async function requireMembership(
  ctx: ReadContext,
  householdId: Id<"households">,
  allowedRoles?: MembershipRole[],
) {
  const userId = await requireUserId(ctx);
  const membership = await getActiveMembership(ctx, householdId, userId);

  if (membership === null) {
    throw new Error("You do not have access to this household.");
  }

  if (allowedRoles && !allowedRoles.includes(membership.role)) {
    throw new Error("You do not have permission to do that.");
  }

  return { userId, membership };
}

export function cleanName(value: string, label: string): string {
  const cleaned = value.trim().replace(/\s+/g, " ");
  if (cleaned.length < 1 || cleaned.length > 80) {
    throw new Error(`${label} must be between 1 and 80 characters.`);
  }
  return cleaned;
}

export function normalizeEmail(value: string): string {
  const email = value.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Enter a valid email address.");
  }
  return email;
}

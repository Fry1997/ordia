import { getAuthUserId } from "@convex-dev/auth/server";
import type { Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";

type AppCtx = QueryCtx | MutationCtx;

export async function requireUser(ctx: AppCtx): Promise<Id<"users">> {
  const userId = await getAuthUserId(ctx);
  if (!userId) {
    throw new Error("Not authenticated");
  }
  return userId;
}

export async function requireHouseholdMember(
  ctx: AppCtx,
  householdId: Id<"households">,
): Promise<{ userId: Id<"users">; role: "owner" | "adult" | "member" }> {
  const userId = await requireUser(ctx);
  const membership = await ctx.db
    .query("householdMembers")
    .withIndex("by_householdId_and_userId", (q) =>
      q.eq("householdId", householdId).eq("userId", userId),
    )
    .unique();

  if (!membership) {
    throw new Error("You do not have access to this household");
  }

  return { userId, role: membership.role };
}

export async function requireHouseholdAdult(
  ctx: AppCtx,
  householdId: Id<"households">,
): Promise<Id<"users">> {
  const membership = await requireHouseholdMember(ctx, householdId);
  if (membership.role === "member") {
    throw new Error("An adult household member is required for this change");
  }
  return membership.userId;
}

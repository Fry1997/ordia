import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import {
  getMembership,
  normalizeEmail,
  requireMembership,
  requireUserId,
} from "./lib/access";

const invitationRole = v.union(v.literal("admin"), v.literal("member"));
const invitationStatus = v.union(
  v.literal("pending"),
  v.literal("accepted"),
  v.literal("revoked"),
  v.literal("expired"),
);

function createToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export const create = mutation({
  args: {
    householdId: v.id("households"),
    email: v.string(),
    role: invitationRole,
  },
  returns: v.object({
    invitationId: v.id("householdInvitations"),
    token: v.string(),
    expiresAt: v.number(),
  }),
  handler: async (ctx, args) => {
    const { userId } = await requireMembership(ctx, args.householdId, [
      "owner",
      "admin",
    ]);
    const emailNormalized = normalizeEmail(args.email);
    const now = Date.now();
    const expiresAt = now + 7 * 24 * 60 * 60 * 1000;

    const existingPending = await ctx.db
      .query("householdInvitations")
      .withIndex("by_email_normalized_and_status", (query) =>
        query.eq("emailNormalized", emailNormalized).eq("status", "pending"),
      )
      .take(20);

    for (const invitation of existingPending) {
      if (invitation.householdId === args.householdId) {
        await ctx.db.patch(invitation._id, { status: "revoked" });
      }
    }

    const token = createToken();
    const invitationId = await ctx.db.insert("householdInvitations", {
      householdId: args.householdId,
      emailNormalized,
      role: args.role,
      token,
      invitedByUserId: userId,
      expiresAt,
      status: "pending",
      createdAt: now,
    });

    return { invitationId, token, expiresAt };
  },
});

export const listForHousehold = query({
  args: { householdId: v.id("households") },
  returns: v.array(
    v.object({
      invitationId: v.id("householdInvitations"),
      email: v.string(),
      role: invitationRole,
      status: invitationStatus,
      expiresAt: v.number(),
      createdAt: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    await requireMembership(ctx, args.householdId, ["owner", "admin"]);
    const rows = await ctx.db
      .query("householdInvitations")
      .withIndex("by_household_id_and_status", (query) =>
        query.eq("householdId", args.householdId).eq("status", "pending"),
      )
      .take(100);

    return rows.map((invitation) => ({
      invitationId: invitation._id,
      email: invitation.emailNormalized,
      role: invitation.role,
      status: invitation.expiresAt <= Date.now() ? "expired" : invitation.status,
      expiresAt: invitation.expiresAt,
      createdAt: invitation.createdAt,
    }));
  },
});

export const preview = query({
  args: { token: v.string() },
  returns: v.union(
    v.null(),
    v.object({
      householdName: v.string(),
      email: v.string(),
      role: invitationRole,
      status: invitationStatus,
      expiresAt: v.number(),
      signedInEmail: v.union(v.string(), v.null()),
      canAccept: v.boolean(),
    }),
  ),
  handler: async (ctx, args) => {
    const invitation = await ctx.db
      .query("householdInvitations")
      .withIndex("by_token", (query) => query.eq("token", args.token))
      .unique();

    if (!invitation) {
      return null;
    }

    const household = await ctx.db.get(invitation.householdId);
    if (!household) {
      return null;
    }

    const userId = await requireUserId(ctx);
    const user = await ctx.db.get(userId);
    const signedInEmail = user?.email?.trim().toLowerCase() ?? null;
    const expired = invitation.expiresAt <= Date.now();
    const status = expired ? "expired" : invitation.status;

    return {
      householdName: household.name,
      email: invitation.emailNormalized,
      role: invitation.role,
      status,
      expiresAt: invitation.expiresAt,
      signedInEmail,
      canAccept:
        status === "pending" && signedInEmail === invitation.emailNormalized,
    };
  },
});

export const accept = mutation({
  args: { token: v.string() },
  returns: v.id("households"),
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const invitation = await ctx.db
      .query("householdInvitations")
      .withIndex("by_token", (query) => query.eq("token", args.token))
      .unique();

    if (!invitation || invitation.status !== "pending") {
      throw new Error("This invitation is no longer available.");
    }
    if (invitation.expiresAt <= Date.now()) {
      await ctx.db.patch(invitation._id, { status: "expired" });
      throw new Error("This invitation has expired.");
    }

    const user = await ctx.db.get(userId);
    const email = user?.email?.trim().toLowerCase();
    if (!email || email !== invitation.emailNormalized) {
      throw new Error(`Sign in as ${invitation.emailNormalized} to accept this invitation.`);
    }

    const existingMembership = await getMembership(
      ctx,
      invitation.householdId,
      userId,
    );
    const now = Date.now();

    if (!existingMembership) {
      await ctx.db.insert("householdMemberships", {
        householdId: invitation.householdId,
        userId,
        role: invitation.role,
        status: "active",
        joinedAt: now,
        invitedByUserId: invitation.invitedByUserId,
      });
    } else if (existingMembership.status === "removed") {
      await ctx.db.patch(existingMembership._id, {
        role: invitation.role,
        status: "active",
        joinedAt: now,
        invitedByUserId: invitation.invitedByUserId,
      });
    }

    await ctx.db.patch(invitation._id, {
      status: "accepted",
      acceptedAt: now,
      acceptedByUserId: userId,
    });

    return invitation.householdId;
  },
});

export const revoke = mutation({
  args: {
    householdId: v.id("households"),
    invitationId: v.id("householdInvitations"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireMembership(ctx, args.householdId, ["owner", "admin"]);
    const invitation = await ctx.db.get(args.invitationId);
    if (!invitation || invitation.householdId !== args.householdId) {
      throw new Error("Invitation not found.");
    }
    if (invitation.status === "pending") {
      await ctx.db.patch(invitation._id, { status: "revoked" });
    }
    return null;
  },
});

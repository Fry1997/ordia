import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import { mutation } from "./_generated/server";

const TARGET_EMAIL = "cjfry97@gmail.com";
const REQUIRED_CONFIRMATION =
  "Delete the incomplete Ordia account for cjfry97@gmail.com.";

export const deleteIncompleteAccount = mutation({
  args: {
    targetEmail: v.string(),
    confirmation: v.string(),
  },
  handler: async (ctx, args) => {
    if (
      args.targetEmail.trim().toLowerCase() !== TARGET_EMAIL ||
      args.confirmation !== REQUIRED_CONFIRMATION
    ) {
      throw new Error("Account cleanup confirmation did not match.");
    }

    const passwordAccounts = await ctx.db
      .query("authAccounts")
      .withIndex("providerAndAccountId", (query) =>
        query.eq("provider", "password").eq("providerAccountId", TARGET_EMAIL),
      )
      .collect();

    const usersByEmail = await ctx.db
      .query("users")
      .withIndex("email", (query) => query.eq("email", TARGET_EMAIL))
      .collect();

    const userIds = new Set<Id<"users">>([
      ...passwordAccounts.map((account) => account.userId),
      ...usersByEmail.map((user) => user._id),
    ]);

    if (userIds.size === 0) {
      const rateLimits = await ctx.db.query("authRateLimits").collect();
      const matchingRateLimits = rateLimits.filter((entry) =>
        entry.identifier.toLowerCase().includes(TARGET_EMAIL),
      );
      for (const entry of matchingRateLimits) {
        await ctx.db.delete(entry._id);
      }
      return {
        ok: true,
        status: "not-found",
        email: TARGET_EMAIL,
        deleted: { rateLimits: matchingRateLimits.length },
        remaining: { users: 0, passwordAccounts: 0 },
      };
    }

    const ids = [...userIds];
    const profiles: Doc<"profiles">[] = [];
    const memberships: Doc<"householdMemberships">[] = [];
    const households: Doc<"households">[] = [];

    for (const userId of ids) {
      profiles.push(
        ...(await ctx.db
          .query("profiles")
          .withIndex("by_user_id", (query) => query.eq("userId", userId))
          .collect()),
      );
      memberships.push(
        ...(await ctx.db
          .query("householdMemberships")
          .withIndex("by_user_id", (query) => query.eq("userId", userId))
          .collect()),
      );
      households.push(
        ...(await ctx.db
          .query("households")
          .withIndex("by_created_by_user_id", (query) =>
            query.eq("createdByUserId", userId),
          )
          .collect()),
      );
    }

    if (memberships.length > 0 || households.length > 0) {
      throw new Error(
        "Safety stop: this Ordia account has household data and is not an incomplete account.",
      );
    }

    const accounts: Doc<"authAccounts">[] = [];
    const sessions: Doc<"authSessions">[] = [];
    for (const userId of ids) {
      accounts.push(
        ...(await ctx.db
          .query("authAccounts")
          .withIndex("userIdAndProvider", (query) =>
            query.eq("userId", userId),
          )
          .collect()),
      );
      sessions.push(
        ...(await ctx.db
          .query("authSessions")
          .withIndex("userId", (query) => query.eq("userId", userId))
          .collect()),
      );
    }

    let verificationCodesDeleted = 0;
    for (const account of accounts) {
      const codes = await ctx.db
        .query("authVerificationCodes")
        .withIndex("accountId", (query) => query.eq("accountId", account._id))
        .collect();
      for (const code of codes) {
        await ctx.db.delete(code._id);
        verificationCodesDeleted += 1;
      }
    }

    let refreshTokensDeleted = 0;
    for (const session of sessions) {
      const refreshTokens = await ctx.db
        .query("authRefreshTokens")
        .withIndex("sessionId", (query) => query.eq("sessionId", session._id))
        .collect();
      for (const token of refreshTokens) {
        await ctx.db.delete(token._id);
        refreshTokensDeleted += 1;
      }
    }

    const sessionIds = new Set<Id<"authSessions">>(
      sessions.map((session) => session._id),
    );
    const verifiers = await ctx.db.query("authVerifiers").collect();
    const matchingVerifiers = verifiers.filter(
      (verifier) => verifier.sessionId && sessionIds.has(verifier.sessionId),
    );
    for (const verifier of matchingVerifiers) {
      await ctx.db.delete(verifier._id);
    }

    for (const account of accounts) {
      await ctx.db.delete(account._id);
    }
    for (const session of sessions) {
      await ctx.db.delete(session._id);
    }
    for (const profile of profiles) {
      await ctx.db.delete(profile._id);
    }
    for (const userId of ids) {
      await ctx.db.delete(userId);
    }

    const rateLimits = await ctx.db.query("authRateLimits").collect();
    const matchingRateLimits = rateLimits.filter((entry) =>
      entry.identifier.toLowerCase().includes(TARGET_EMAIL),
    );
    for (const entry of matchingRateLimits) {
      await ctx.db.delete(entry._id);
    }

    const remainingUsers = await ctx.db
      .query("users")
      .withIndex("email", (query) => query.eq("email", TARGET_EMAIL))
      .collect();
    const remainingAccounts = await ctx.db
      .query("authAccounts")
      .withIndex("providerAndAccountId", (query) =>
        query.eq("provider", "password").eq("providerAccountId", TARGET_EMAIL),
      )
      .collect();

    return {
      ok: remainingUsers.length === 0 && remainingAccounts.length === 0,
      status: "deleted",
      email: TARGET_EMAIL,
      deleted: {
        users: ids.length,
        profiles: profiles.length,
        accounts: accounts.length,
        sessions: sessions.length,
        refreshTokens: refreshTokensDeleted,
        verificationCodes: verificationCodesDeleted,
        verifiers: matchingVerifiers.length,
        rateLimits: matchingRateLimits.length,
      },
      remaining: {
        users: remainingUsers.length,
        passwordAccounts: remainingAccounts.length,
      },
    };
  },
});

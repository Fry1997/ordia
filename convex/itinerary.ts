import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";
import { requireHouseholdAdult, requireHouseholdMember } from "./lib/access";

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

const checklistInput = v.object({
  label: v.string(),
  requiredQuantity: v.number(),
  parentIndex: v.optional(v.number()),
});

const commonArgs = {
  householdId: v.id("households"),
  title: v.string(),
  details: v.optional(v.string()),
  kind: itineraryKind,
  completionMode,
  scheduleType,
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
  checklistItems: v.array(checklistInput),
};

const checklistOutput = v.object({
  _id: v.id("checklistItems"),
  parentItemId: v.optional(v.id("checklistItems")),
  label: v.string(),
  requiredQuantity: v.number(),
  sortOrder: v.number(),
});

const itemOutput = v.object({
  _id: v.id("itineraryItems"),
  title: v.string(),
  details: v.optional(v.string()),
  kind: itineraryKind,
  completionMode,
  scheduleType,
  locationId: v.optional(v.id("locations")),
  location: v.optional(
    v.object({
      name: v.string(),
      address: v.optional(v.string()),
      phone: v.optional(v.string()),
      contactLabel: v.optional(v.string()),
    }),
  ),
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
  checklistItems: v.array(checklistOutput),
});

type ItemArgs = {
  householdId: Id<"households">;
  title: string;
  details?: string;
  kind: "reminder" | "check" | "event" | "chore";
  completionMode: "none" | "manual" | "checklist" | "manual_or_checklist";
  scheduleType: "fixed" | "relative" | "rolling";
  locationId?: Id<"locations">;
  allDay: boolean;
  startDate?: string;
  startMinute?: number;
  endMinute?: number;
  recurrenceType: "none" | "daily" | "weekly" | "monthly";
  recurrenceInterval: number;
  recurrenceWeekdays: number[];
  anchorItemId?: Id<"itineraryItems">;
  relativeDirection?: "before" | "after";
  relativeOffsetMinutes?: number;
  rollingUnit?: "day" | "week" | "month";
  rollingInterval?: number;
  nextDueAt?: number;
  resetOnCompletion: boolean;
  rotationLabels: string[];
  rotationAnchorDate?: string;
  checklistItems: Array<{ label: string; requiredQuantity: number; parentIndex?: number }>;
};

function addInterval(from: number, amount: number, unit: "day" | "week" | "month") {
  const date = new Date(from);
  if (unit === "day") date.setUTCDate(date.getUTCDate() + amount);
  if (unit === "week") date.setUTCDate(date.getUTCDate() + amount * 7);
  if (unit === "month") date.setUTCMonth(date.getUTCMonth() + amount);
  return date.getTime();
}

function cleanText(value?: string) {
  const text = value?.trim();
  return text ? text : null;
}

async function validateItemArgs(
  ctx: MutationCtx,
  args: ItemArgs,
  itemId?: Id<"itineraryItems">,
) {
  await requireHouseholdAdult(ctx, args.householdId);
  if (args.title.trim().length < 2) throw new Error("Give the item a title");
  if (args.recurrenceInterval < 1) throw new Error("Repeat interval must be at least 1");
  if (args.startMinute !== undefined && (args.startMinute < 0 || args.startMinute > 1439)) {
    throw new Error("Start time is invalid");
  }
  if (args.endMinute !== undefined && (args.endMinute < 0 || args.endMinute > 1439)) {
    throw new Error("End time is invalid");
  }
  if (
    args.startMinute !== undefined &&
    args.endMinute !== undefined &&
    args.endMinute < args.startMinute
  ) {
    throw new Error("The end of a time window must be after its start");
  }
  if (args.kind === "reminder" && args.completionMode !== "none") {
    throw new Error("Reminders do not need completing");
  }
  if (args.kind === "check" && args.completionMode === "none") {
    throw new Error("Checks need a completion method");
  }
  if (args.scheduleType === "relative") {
    if (!args.anchorItemId || !args.relativeDirection || args.relativeOffsetMinutes === undefined) {
      throw new Error("Choose the item this is linked to and its offset");
    }
    if (args.anchorItemId === itemId) throw new Error("An item cannot be linked to itself");
    const anchor = await ctx.db.get(args.anchorItemId);
    if (!anchor || anchor.householdId !== args.householdId || !anchor.active) {
      throw new Error("The linked item is not available");
    }
  }
  if (args.scheduleType === "rolling") {
    if (!args.rollingUnit || !args.rollingInterval || args.rollingInterval < 1) {
      throw new Error("Choose a valid rolling interval");
    }
  }
  if (args.locationId) {
    const location = await ctx.db.get(args.locationId);
    if (!location || location.householdId !== args.householdId || location.archived) {
      throw new Error("The selected place is not available");
    }
  }
  for (const [index, row] of args.checklistItems.entries()) {
    if (!row.label.trim()) throw new Error("Checklist items need a label");
    if (row.requiredQuantity < 1) throw new Error("Checklist quantities must be at least 1");
    if (row.parentIndex !== undefined && (row.parentIndex < 0 || row.parentIndex >= index)) {
      throw new Error("Checklist groups must appear before their child items");
    }
  }
}

function buildItemDocument(
  args: ItemArgs,
  createdBy: Id<"users">,
  active: boolean,
  now: number,
  existingNextDueAt?: number,
): Omit<Doc<"itineraryItems">, "_id" | "_creationTime"> {
  const details = cleanText(args.details);
  const startDate = cleanText(args.startDate);
  const rotationAnchorDate = cleanText(args.rotationAnchorDate);
  const rotationLabels = args.rotationLabels.map((label) => label.trim()).filter(Boolean);
  const nextDueAt =
    args.scheduleType === "rolling" && args.rollingUnit && args.rollingInterval
      ? args.nextDueAt ?? existingNextDueAt ?? addInterval(now, args.rollingInterval, args.rollingUnit)
      : null;

  return {
    householdId: args.householdId,
    title: args.title.trim(),
    kind: args.kind,
    completionMode: args.completionMode,
    scheduleType: args.scheduleType,
    active,
    createdBy,
    allDay: args.allDay,
    recurrenceType: args.recurrenceType,
    recurrenceInterval: args.recurrenceInterval,
    recurrenceWeekdays: args.recurrenceWeekdays,
    resetOnCompletion: args.resetOnCompletion,
    rotationLabels,
    updatedAt: now,
    ...(details ? { details } : {}),
    ...(args.locationId ? { locationId: args.locationId } : {}),
    ...(args.scheduleType === "fixed" && startDate ? { startDate } : {}),
    ...(args.scheduleType === "fixed" && args.startMinute !== undefined
      ? { startMinute: args.startMinute }
      : {}),
    ...(args.scheduleType === "fixed" && args.endMinute !== undefined
      ? { endMinute: args.endMinute }
      : {}),
    ...(args.scheduleType === "relative" && args.anchorItemId
      ? { anchorItemId: args.anchorItemId }
      : {}),
    ...(args.scheduleType === "relative" && args.relativeDirection
      ? { relativeDirection: args.relativeDirection }
      : {}),
    ...(args.scheduleType === "relative" && args.relativeOffsetMinutes !== undefined
      ? { relativeOffsetMinutes: args.relativeOffsetMinutes }
      : {}),
    ...(args.scheduleType === "rolling" && args.rollingUnit
      ? { rollingUnit: args.rollingUnit }
      : {}),
    ...(args.scheduleType === "rolling" && args.rollingInterval
      ? { rollingInterval: args.rollingInterval }
      : {}),
    ...(nextDueAt ? { nextDueAt } : {}),
    ...(rotationAnchorDate ? { rotationAnchorDate } : {}),
  };
}

async function replaceChecklist(
  ctx: MutationCtx,
  householdId: Id<"households">,
  itineraryItemId: Id<"itineraryItems">,
  rows: ItemArgs["checklistItems"],
) {
  const existing = await ctx.db
    .query("checklistItems")
    .withIndex("by_itineraryItemId_and_active", (q) =>
      q.eq("itineraryItemId", itineraryItemId).eq("active", true),
    )
    .take(250);
  for (const row of existing) {
    await ctx.db.patch(row._id, { active: false });
  }

  const inserted: Id<"checklistItems">[] = [];
  for (const [index, row] of rows.entries()) {
    const parentItemId =
      row.parentIndex === undefined ? null : inserted[row.parentIndex] ?? null;
    const id = await ctx.db.insert("checklistItems", {
      householdId,
      itineraryItemId,
      label: row.label.trim(),
      requiredQuantity: row.requiredQuantity,
      sortOrder: index,
      active: true,
      ...(parentItemId ? { parentItemId } : {}),
    });
    inserted.push(id);
  }
}

export const list = query({
  args: { householdId: v.id("households") },
  returns: v.array(itemOutput),
  handler: async (ctx, args) => {
    await requireHouseholdMember(ctx, args.householdId);
    const items = await ctx.db
      .query("itineraryItems")
      .withIndex("by_householdId_and_active", (q) =>
        q.eq("householdId", args.householdId).eq("active", true),
      )
      .take(200);

    return await Promise.all(
      items.map(async (item) => {
        const [location, checklistItems] = await Promise.all([
          item.locationId ? ctx.db.get(item.locationId) : null,
          ctx.db
            .query("checklistItems")
            .withIndex("by_itineraryItemId_and_active", (q) =>
              q.eq("itineraryItemId", item._id).eq("active", true),
            )
            .take(250),
        ]);

        const locationValue = location
          ? {
              name: location.name,
              ...(location.address ? { address: location.address } : {}),
              ...(location.phone ? { phone: location.phone } : {}),
              ...(location.contactLabel ? { contactLabel: location.contactLabel } : {}),
            }
          : null;

        return {
          _id: item._id,
          title: item.title,
          kind: item.kind,
          completionMode: item.completionMode,
          scheduleType: item.scheduleType,
          allDay: item.allDay,
          recurrenceType: item.recurrenceType,
          recurrenceInterval: item.recurrenceInterval,
          recurrenceWeekdays: item.recurrenceWeekdays,
          resetOnCompletion: item.resetOnCompletion,
          rotationLabels: item.rotationLabels,
          checklistItems: checklistItems
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map((row) => ({
              _id: row._id,
              label: row.label,
              requiredQuantity: row.requiredQuantity,
              sortOrder: row.sortOrder,
              ...(row.parentItemId ? { parentItemId: row.parentItemId } : {}),
            })),
          ...(item.details ? { details: item.details } : {}),
          ...(item.locationId ? { locationId: item.locationId } : {}),
          ...(locationValue ? { location: locationValue } : {}),
          ...(item.startDate ? { startDate: item.startDate } : {}),
          ...(item.startMinute !== undefined ? { startMinute: item.startMinute } : {}),
          ...(item.endMinute !== undefined ? { endMinute: item.endMinute } : {}),
          ...(item.anchorItemId ? { anchorItemId: item.anchorItemId } : {}),
          ...(item.relativeDirection ? { relativeDirection: item.relativeDirection } : {}),
          ...(item.relativeOffsetMinutes !== undefined
            ? { relativeOffsetMinutes: item.relativeOffsetMinutes }
            : {}),
          ...(item.rollingUnit ? { rollingUnit: item.rollingUnit } : {}),
          ...(item.rollingInterval ? { rollingInterval: item.rollingInterval } : {}),
          ...(item.nextDueAt ? { nextDueAt: item.nextDueAt } : {}),
          ...(item.rotationAnchorDate ? { rotationAnchorDate: item.rotationAnchorDate } : {}),
        };
      }),
    );
  },
});

export const create = mutation({
  args: commonArgs,
  returns: v.id("itineraryItems"),
  handler: async (ctx, args) => {
    await validateItemArgs(ctx, args);
    const userId = await requireHouseholdAdult(ctx, args.householdId);
    const now = Date.now();
    const itemId = await ctx.db.insert(
      "itineraryItems",
      buildItemDocument(args, userId, true, now),
    );
    await replaceChecklist(ctx, args.householdId, itemId, args.checklistItems);
    return itemId;
  },
});

export const update = mutation({
  args: { itemId: v.id("itineraryItems"), ...commonArgs },
  returns: v.null(),
  handler: async (ctx, args) => {
    const item = await ctx.db.get(args.itemId);
    if (!item || !item.active) throw new Error("Itinerary item not found");
    if (item.householdId !== args.householdId) throw new Error("Household mismatch");
    await validateItemArgs(ctx, args, args.itemId);

    await ctx.db.replace(
      args.itemId,
      buildItemDocument(args, item.createdBy, true, Date.now(), item.nextDueAt),
    );
    await replaceChecklist(ctx, args.householdId, args.itemId, args.checklistItems);
    return null;
  },
});

export const archive = mutation({
  args: { itemId: v.id("itineraryItems") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const item = await ctx.db.get(args.itemId);
    if (!item) throw new Error("Itinerary item not found");
    await requireHouseholdAdult(ctx, item.householdId);
    await ctx.db.patch(args.itemId, { active: false, updatedAt: Date.now() });
    return null;
  },
});

export const complete = mutation({
  args: { itemId: v.id("itineraryItems"), note: v.optional(v.string()) },
  returns: v.null(),
  handler: async (ctx, args) => {
    const item = await ctx.db.get(args.itemId);
    if (!item || !item.active) throw new Error("Itinerary item not found");
    const { userId } = await requireHouseholdMember(ctx, item.householdId);
    if (item.completionMode === "none") throw new Error("This item does not need completing");

    const completedAt = Date.now();
    const note = cleanText(args.note);
    await ctx.db.insert("itemCompletions", {
      householdId: item.householdId,
      itineraryItemId: item._id,
      completedBy: userId,
      completedAt,
      ...(note ? { note } : {}),
    });

    if (
      item.scheduleType === "rolling" &&
      item.resetOnCompletion &&
      item.rollingUnit &&
      item.rollingInterval
    ) {
      await ctx.db.patch(item._id, {
        nextDueAt: addInterval(completedAt, item.rollingInterval, item.rollingUnit),
        updatedAt: completedAt,
      });
    }
    return null;
  },
});

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireHouseholdAdult, requireHouseholdMember } from "./lib/access";

const locationFields = {
  name: v.string(),
  address: v.optional(v.string()),
  phone: v.optional(v.string()),
  contactLabel: v.optional(v.string()),
  notes: v.optional(v.string()),
};

function optionalText(value?: string) {
  const text = value?.trim();
  return text ? text : null;
}

export const list = query({
  args: { householdId: v.id("households") },
  returns: v.array(
    v.object({
      _id: v.id("locations"),
      name: v.string(),
      address: v.optional(v.string()),
      phone: v.optional(v.string()),
      contactLabel: v.optional(v.string()),
      notes: v.optional(v.string()),
    }),
  ),
  handler: async (ctx, args) => {
    await requireHouseholdMember(ctx, args.householdId);
    const rows = await ctx.db
      .query("locations")
      .withIndex("by_householdId_and_archived", (q) =>
        q.eq("householdId", args.householdId).eq("archived", false),
      )
      .take(100);
    return rows.map((row) => ({
      _id: row._id,
      name: row.name,
      ...(row.address ? { address: row.address } : {}),
      ...(row.phone ? { phone: row.phone } : {}),
      ...(row.contactLabel ? { contactLabel: row.contactLabel } : {}),
      ...(row.notes ? { notes: row.notes } : {}),
    }));
  },
});

export const create = mutation({
  args: { householdId: v.id("households"), ...locationFields },
  returns: v.id("locations"),
  handler: async (ctx, args) => {
    const userId = await requireHouseholdAdult(ctx, args.householdId);
    const name = args.name.trim();
    if (!name) throw new Error("Give this place a name");
    const address = optionalText(args.address);
    const phone = optionalText(args.phone);
    const contactLabel = optionalText(args.contactLabel);
    const notes = optionalText(args.notes);

    return await ctx.db.insert("locations", {
      householdId: args.householdId,
      name,
      archived: false,
      createdBy: userId,
      updatedAt: Date.now(),
      ...(address ? { address } : {}),
      ...(phone ? { phone } : {}),
      ...(contactLabel ? { contactLabel } : {}),
      ...(notes ? { notes } : {}),
    });
  },
});

export const update = mutation({
  args: { locationId: v.id("locations"), ...locationFields },
  returns: v.null(),
  handler: async (ctx, args) => {
    const location = await ctx.db.get(args.locationId);
    if (!location) throw new Error("Place not found");
    await requireHouseholdAdult(ctx, location.householdId);
    const name = args.name.trim();
    if (!name) throw new Error("Give this place a name");
    const address = optionalText(args.address);
    const phone = optionalText(args.phone);
    const contactLabel = optionalText(args.contactLabel);
    const notes = optionalText(args.notes);

    await ctx.db.replace(args.locationId, {
      householdId: location.householdId,
      name,
      archived: location.archived,
      createdBy: location.createdBy,
      updatedAt: Date.now(),
      ...(address ? { address } : {}),
      ...(phone ? { phone } : {}),
      ...(contactLabel ? { contactLabel } : {}),
      ...(notes ? { notes } : {}),
    });
    return null;
  },
});

export const archive = mutation({
  args: { locationId: v.id("locations") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const location = await ctx.db.get(args.locationId);
    if (!location) throw new Error("Place not found");
    await requireHouseholdAdult(ctx, location.householdId);
    await ctx.db.patch(args.locationId, { archived: true, updatedAt: Date.now() });
    return null;
  },
});

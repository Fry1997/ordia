import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { requireMembership } from "./lib/access";

const visibility = v.union(v.literal("private"), v.literal("household"));
const personRelationship = v.union(
  v.literal("self"),
  v.literal("partner"),
  v.literal("child"),
  v.literal("parent"),
  v.literal("sibling"),
  v.literal("family"),
  v.literal("friend"),
  v.literal("professional"),
  v.literal("other"),
);
const responsibilityDomain = v.union(
  v.literal("home"),
  v.literal("family"),
  v.literal("finance"),
  v.literal("food"),
  v.literal("health"),
  v.literal("transport"),
  v.literal("education"),
  v.literal("admin"),
  v.literal("pets"),
  v.literal("work"),
  v.literal("other"),
);
const responsibilityHealth = v.union(
  v.literal("on_track"),
  v.literal("attention"),
  v.literal("blocked"),
);
const reviewCadence = v.union(
  v.literal("none"),
  v.literal("weekly"),
  v.literal("monthly"),
  v.literal("quarterly"),
  v.literal("yearly"),
);
const routineFrequency = v.union(
  v.literal("daily"),
  v.literal("weekly"),
  v.literal("fortnightly"),
  v.literal("monthly"),
  v.literal("interval"),
);
const routinePhase = v.union(
  v.literal("preparation"),
  v.literal("occurrence"),
  v.literal("follow_up"),
);
const taskStatus = v.union(
  v.literal("open"),
  v.literal("in_progress"),
  v.literal("waiting"),
  v.literal("done"),
);
const taskPriority = v.union(
  v.literal("low"),
  v.literal("normal"),
  v.literal("high"),
  v.literal("urgent"),
);
const serviceMode = v.union(
  v.literal("dine_in"),
  v.literal("takeaway"),
  v.literal("delivery"),
);
const orderMethod = v.union(
  v.literal("direct_phone"),
  v.literal("direct_web"),
  v.literal("delivery_app"),
  v.literal("walk_in"),
  v.literal("at_table"),
  v.literal("other"),
);
const foodKind = v.union(
  v.literal("meal"),
  v.literal("takeaway_item"),
  v.literal("snack"),
  v.literal("drink"),
  v.literal("ingredient"),
);
const preferenceCategory = v.union(
  v.literal("meal"),
  v.literal("takeaway"),
  v.literal("snack"),
  v.literal("activity"),
  v.literal("drink"),
  v.literal("restaurant"),
  v.literal("ingredient"),
);
const preferenceRelation = v.union(
  v.literal("favourite"),
  v.literal("likes"),
  v.literal("usually"),
  v.literal("dislikes"),
  v.literal("avoids"),
  v.literal("needs"),
  v.literal("only_if"),
);
const preferenceSource = v.union(
  v.literal("observed"),
  v.literal("told_by_person"),
  v.literal("household_knowledge"),
);

function clean(value: string, label: string, max = 100): string {
  const result = value.trim().replace(/\s+/g, " ");
  if (result.length < 1 || result.length > max) {
    throw new Error(`${label} must be between 1 and ${max} characters.`);
  }
  return result;
}

function optionalClean(value: string | undefined, max = 240): string | undefined {
  if (value === undefined) return undefined;
  const result = value.trim().replace(/\s+/g, " ");
  if (!result) return undefined;
  if (result.length > max) throw new Error(`Keep that field under ${max} characters.`);
  return result;
}

function validDate(value: number | undefined, label: string): number | undefined {
  if (value === undefined) return undefined;
  if (!Number.isFinite(value)) throw new Error(`${label} is not valid.`);
  return value;
}

async function assertPerson(
  ctx: Parameters<typeof requireMembership>[0],
  householdId: Id<"households">,
  personId: Id<"domainPeople"> | undefined,
) {
  if (!personId) return;
  const person = await ctx.db.get(personId);
  if (!person || person.householdId !== householdId) throw new Error("Person not found in this household.");
}

async function assertResponsibility(
  ctx: Parameters<typeof requireMembership>[0],
  householdId: Id<"households">,
  responsibilityId: Id<"responsibilityAreas"> | undefined,
) {
  if (!responsibilityId) return;
  const responsibility = await ctx.db.get(responsibilityId);
  if (!responsibility || responsibility.householdId !== householdId) {
    throw new Error("Responsibility not found in this household.");
  }
}

async function assertRoutine(
  ctx: Parameters<typeof requireMembership>[0],
  householdId: Id<"households">,
  routineId: Id<"routineDefinitions"> | undefined,
) {
  if (!routineId) return;
  const routine = await ctx.db.get(routineId);
  if (!routine || routine.householdId !== householdId) throw new Error("Routine not found in this household.");
}

async function assertRestaurant(
  ctx: Parameters<typeof requireMembership>[0],
  householdId: Id<"households">,
  restaurantId: Id<"restaurants"> | undefined,
) {
  if (!restaurantId) return;
  const restaurant = await ctx.db.get(restaurantId);
  if (!restaurant || restaurant.householdId !== householdId) {
    throw new Error("Restaurant not found in this household.");
  }
}

export const workspace = query({
  args: { householdId: v.id("households") },
  handler: async (ctx, args) => {
    const { userId } = await requireMembership(ctx, args.householdId);
    const [
      peopleRows,
      responsibilityRows,
      routineRows,
      variantRows,
      stepRows,
      taskRows,
      restaurantRows,
      foodRows,
      activityRows,
      preferenceRows,
      orderRows,
      orderLineRows,
    ] = await Promise.all([
      ctx.db.query("domainPeople").withIndex("by_household_id", (q) => q.eq("householdId", args.householdId)).collect(),
      ctx.db.query("responsibilityAreas").withIndex("by_household_id", (q) => q.eq("householdId", args.householdId)).collect(),
      ctx.db.query("routineDefinitions").withIndex("by_household_id", (q) => q.eq("householdId", args.householdId)).collect(),
      ctx.db.query("routineVariants").collect(),
      ctx.db.query("routineStepTemplates").collect(),
      ctx.db.query("domainTasks").withIndex("by_household_id", (q) => q.eq("householdId", args.householdId)).collect(),
      ctx.db.query("restaurants").withIndex("by_household_id", (q) => q.eq("householdId", args.householdId)).collect(),
      ctx.db.query("foodItems").withIndex("by_household_id", (q) => q.eq("householdId", args.householdId)).collect(),
      ctx.db.query("activities").withIndex("by_household_id", (q) => q.eq("householdId", args.householdId)).collect(),
      ctx.db.query("personPreferences").withIndex("by_household_id", (q) => q.eq("householdId", args.householdId)).collect(),
      ctx.db.query("restaurantOrderProfiles").withIndex("by_household_id", (q) => q.eq("householdId", args.householdId)).collect(),
      ctx.db.query("restaurantOrderLines").collect(),
    ]);

    const people = peopleRows
      .filter((person) => person.visibility === "household" || person.createdByUserId === userId)
      .sort((a, b) => a.name.localeCompare(b.name));
    const visiblePersonIds = new Set(people.map((person) => person._id));
    const preferences = preferenceRows.filter(
      (preference) =>
        visiblePersonIds.has(preference.personId) &&
        (preference.visibility === "household" || preference.createdByUserId === userId),
    );
    const variants = variantRows.filter((variant) => variant.householdId === args.householdId);
    const steps = stepRows.filter((step) => step.householdId === args.householdId);
    const orderLines = orderLineRows.filter((line) => line.householdId === args.householdId);

    return {
      people: people.map((person) => ({
        personId: person._id,
        name: person.name,
        relationship: person.relationship,
        birthDate: person.birthDate,
        visibility: person.visibility,
        linkedUserId: person.linkedUserId,
      })),
      responsibilities: responsibilityRows
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((item) => ({
          responsibilityId: item._id,
          name: item.name,
          domain: item.domain,
          status: item.status,
          health: item.health,
          ownerPersonId: item.ownerPersonId,
          backupPersonId: item.backupPersonId,
          reviewCadence: item.reviewCadence,
          nextReviewAt: item.nextReviewAt,
          openTaskCount: taskRows.filter(
            (task) => task.responsibilityId === item._id && task.status !== "done",
          ).length,
          routineCount: routineRows.filter((routine) => routine.responsibilityId === item._id).length,
        })),
      routines: routineRows
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((routine) => ({
          routineId: routine._id,
          name: routine.name,
          status: routine.status,
          responsibilityId: routine.responsibilityId,
          personId: routine.personId,
          frequency: routine.frequency,
          interval: routine.interval,
          weekdays: routine.weekdays,
          dayOfMonth: routine.dayOfMonth,
          timeLocal: routine.timeLocal,
          startsOn: routine.startsOn,
          alternating: routine.alternating,
          nextOccurrenceAt: routine.nextOccurrenceAt,
          variants: variants
            .filter((variant) => variant.routineId === routine._id)
            .sort((a, b) => a.sequencePosition - b.sequencePosition)
            .map((variant) => ({
              variantId: variant._id,
              name: variant.name,
              sequencePosition: variant.sequencePosition,
            })),
          steps: steps
            .filter((step) => step.routineId === routine._id)
            .sort((a, b) => a.position - b.position)
            .map((step) => ({
              stepId: step._id,
              variantId: step.variantId,
              title: step.title,
              phase: step.phase,
              offsetDays: step.offsetDays,
              timeLocal: step.timeLocal,
              assigneePersonId: step.assigneePersonId,
              position: step.position,
            })),
        })),
      tasks: taskRows
        .sort((a, b) => {
          if (a.status === "done" && b.status !== "done") return 1;
          if (a.status !== "done" && b.status === "done") return -1;
          return (a.dueAt ?? Number.MAX_SAFE_INTEGER) - (b.dueAt ?? Number.MAX_SAFE_INTEGER);
        })
        .map((task) => ({
          taskId: task._id,
          title: task.title,
          status: task.status,
          priority: task.priority,
          startAt: task.startAt,
          dueAt: task.dueAt,
          estimatedMinutes: task.estimatedMinutes,
          responsibilityId: task.responsibilityId,
          routineId: task.routineId,
          concernsPersonId: task.concernsPersonId,
          accountablePersonId: task.accountablePersonId,
          assigneePersonId: task.assigneePersonId,
          completedAt: task.completedAt,
        })),
      restaurants: restaurantRows
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((restaurant) => ({
          restaurantId: restaurant._id,
          name: restaurant.name,
          cuisine: restaurant.cuisine,
          serviceModes: restaurant.serviceModes,
          preferredOrderMethod: restaurant.preferredOrderMethod,
          phone: restaurant.phone,
          website: restaurant.website,
          addressLine: restaurant.addressLine,
          postcode: restaurant.postcode,
          parkingGuidance: restaurant.parkingGuidance,
          bookingGuidance: restaurant.bookingGuidance,
          preferenceCount: preferences.filter((preference) => preference.restaurantId === restaurant._id).length,
          orderCount: orderRows.filter((order) => order.restaurantId === restaurant._id).length,
        })),
      foodItems: foodRows
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((item) => ({
          foodItemId: item._id,
          name: item.name,
          kind: item.kind,
          brand: item.brand,
          defaultPreparation: item.defaultPreparation,
        })),
      activities: activityRows
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((item) => ({ activityId: item._id, name: item.name, venue: item.venue })),
      preferences: preferences.map((preference) => ({
        preferenceId: preference._id,
        personId: preference.personId,
        category: preference.category,
        relation: preference.relation,
        foodItemId: preference.foodItemId,
        restaurantId: preference.restaurantId,
        activityId: preference.activityId,
        preparationPreference: preference.preparationPreference,
        avoidFoodItemIds: preference.avoidFoodItemIds,
        source: preference.source,
        lastConfirmedAt: preference.lastConfirmedAt,
        visibility: preference.visibility,
      })),
      orderProfiles: orderRows
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((order) => ({
          orderProfileId: order._id,
          restaurantId: order.restaurantId,
          name: order.name,
          scope: order.scope,
          personId: order.personId,
          orderMethod: order.orderMethod,
          lines: orderLines
            .filter((line) => line.orderProfileId === order._id)
            .sort((a, b) => a.position - b.position)
            .map((line) => ({
              lineId: line._id,
              quantity: line.quantity,
              itemName: line.itemName,
              variant: line.variant,
              modifications: line.modifications,
              forPersonIds: line.forPersonIds,
              position: line.position,
            })),
        })),
    };
  },
});

export const createPerson = mutation({
  args: {
    householdId: v.id("households"),
    name: v.string(),
    relationship: personRelationship,
    birthDate: v.optional(v.string()),
    visibility,
  },
  handler: async (ctx, args) => {
    const { userId } = await requireMembership(ctx, args.householdId);
    const now = Date.now();
    return await ctx.db.insert("domainPeople", {
      householdId: args.householdId,
      name: clean(args.name, "Name", 80),
      relationship: args.relationship,
      birthDate: optionalClean(args.birthDate, 20),
      visibility: args.visibility,
      createdByUserId: userId,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const createResponsibility = mutation({
  args: {
    householdId: v.id("households"),
    name: v.string(),
    domain: responsibilityDomain,
    health: responsibilityHealth,
    ownerPersonId: v.optional(v.id("domainPeople")),
    backupPersonId: v.optional(v.id("domainPeople")),
    reviewCadence,
    nextReviewAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { userId } = await requireMembership(ctx, args.householdId);
    await assertPerson(ctx, args.householdId, args.ownerPersonId);
    await assertPerson(ctx, args.householdId, args.backupPersonId);
    if (args.ownerPersonId && args.ownerPersonId === args.backupPersonId) {
      throw new Error("Choose a different backup person or leave backup empty.");
    }
    const now = Date.now();
    return await ctx.db.insert("responsibilityAreas", {
      householdId: args.householdId,
      name: clean(args.name, "Responsibility name", 100),
      domain: args.domain,
      status: "active",
      health: args.health,
      ownerPersonId: args.ownerPersonId,
      backupPersonId: args.backupPersonId,
      reviewCadence: args.reviewCadence,
      nextReviewAt: validDate(args.nextReviewAt, "Next review"),
      createdByUserId: userId,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const setResponsibilityHealth = mutation({
  args: {
    householdId: v.id("households"),
    responsibilityId: v.id("responsibilityAreas"),
    health: responsibilityHealth,
  },
  handler: async (ctx, args) => {
    await requireMembership(ctx, args.householdId);
    const item = await ctx.db.get(args.responsibilityId);
    if (!item || item.householdId !== args.householdId) throw new Error("Responsibility not found.");
    await ctx.db.patch(item._id, { health: args.health, updatedAt: Date.now() });
  },
});

export const createRoutine = mutation({
  args: {
    householdId: v.id("households"),
    name: v.string(),
    responsibilityId: v.optional(v.id("responsibilityAreas")),
    personId: v.optional(v.id("domainPeople")),
    frequency: routineFrequency,
    interval: v.number(),
    weekdays: v.array(v.number()),
    dayOfMonth: v.optional(v.number()),
    timeLocal: v.optional(v.string()),
    startsOn: v.string(),
    alternating: v.boolean(),
    nextOccurrenceAt: v.optional(v.number()),
    variants: v.array(v.object({ name: v.string() })),
    steps: v.array(
      v.object({
        title: v.string(),
        phase: routinePhase,
        offsetDays: v.number(),
        timeLocal: v.optional(v.string()),
        assigneePersonId: v.optional(v.id("domainPeople")),
        variantIndex: v.optional(v.number()),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const { userId } = await requireMembership(ctx, args.householdId);
    await assertResponsibility(ctx, args.householdId, args.responsibilityId);
    await assertPerson(ctx, args.householdId, args.personId);
    if (!Number.isInteger(args.interval) || args.interval < 1 || args.interval > 52) {
      throw new Error("Interval must be a whole number between 1 and 52.");
    }
    const weekdays = [...new Set(args.weekdays)].filter((day) => Number.isInteger(day) && day >= 0 && day <= 6);
    if ((args.frequency === "weekly" || args.frequency === "fortnightly") && weekdays.length === 0) {
      throw new Error("Choose at least one weekday.");
    }
    if (args.frequency === "monthly" && (!args.dayOfMonth || args.dayOfMonth < 1 || args.dayOfMonth > 31)) {
      throw new Error("Choose a valid day of the month.");
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(args.startsOn)) throw new Error("Choose a valid start date.");
    if (args.alternating && args.variants.length < 2) {
      throw new Error("An alternating routine needs at least two named variants.");
    }
    if (args.steps.length < 1) throw new Error("Add at least one routine step.");
    const now = Date.now();
    const routineId = await ctx.db.insert("routineDefinitions", {
      householdId: args.householdId,
      name: clean(args.name, "Routine name", 100),
      status: "active",
      responsibilityId: args.responsibilityId,
      personId: args.personId,
      frequency: args.frequency,
      interval: args.interval,
      weekdays,
      dayOfMonth: args.dayOfMonth,
      timeLocal: optionalClean(args.timeLocal, 8),
      startsOn: args.startsOn,
      alternating: args.alternating,
      nextOccurrenceAt: validDate(args.nextOccurrenceAt, "Next occurrence"),
      createdByUserId: userId,
      createdAt: now,
      updatedAt: now,
    });

    const variantIds: Array<Id<"routineVariants">> = [];
    if (args.alternating) {
      for (let index = 0; index < args.variants.length; index += 1) {
        variantIds.push(
          await ctx.db.insert("routineVariants", {
            householdId: args.householdId,
            routineId,
            name: clean(args.variants[index].name, "Variant name", 60),
            sequencePosition: index,
            createdAt: now,
          }),
        );
      }
    }

    for (let index = 0; index < args.steps.length; index += 1) {
      const step = args.steps[index];
      await assertPerson(ctx, args.householdId, step.assigneePersonId);
      if (!Number.isInteger(step.offsetDays) || step.offsetDays < -30 || step.offsetDays > 30) {
        throw new Error("Routine step offsets must be between 30 days before and 30 days after.");
      }
      const variantId =
        step.variantIndex === undefined ? undefined : variantIds[step.variantIndex];
      if (step.variantIndex !== undefined && variantId === undefined) {
        throw new Error("A routine step refers to a missing variant.");
      }
      await ctx.db.insert("routineStepTemplates", {
        householdId: args.householdId,
        routineId,
        variantId,
        title: clean(step.title, "Step", 120),
        phase: step.phase,
        offsetDays: step.offsetDays,
        timeLocal: optionalClean(step.timeLocal, 8),
        assigneePersonId: step.assigneePersonId,
        position: index,
        createdAt: now,
      });
    }
    return routineId;
  },
});

export const createTask = mutation({
  args: {
    householdId: v.id("households"),
    title: v.string(),
    priority: taskPriority,
    startAt: v.optional(v.number()),
    dueAt: v.optional(v.number()),
    estimatedMinutes: v.optional(v.number()),
    responsibilityId: v.optional(v.id("responsibilityAreas")),
    routineId: v.optional(v.id("routineDefinitions")),
    concernsPersonId: v.optional(v.id("domainPeople")),
    accountablePersonId: v.optional(v.id("domainPeople")),
    assigneePersonId: v.optional(v.id("domainPeople")),
  },
  handler: async (ctx, args) => {
    const { userId } = await requireMembership(ctx, args.householdId);
    await assertResponsibility(ctx, args.householdId, args.responsibilityId);
    await assertRoutine(ctx, args.householdId, args.routineId);
    await assertPerson(ctx, args.householdId, args.concernsPersonId);
    await assertPerson(ctx, args.householdId, args.accountablePersonId);
    await assertPerson(ctx, args.householdId, args.assigneePersonId);
    if (
      args.estimatedMinutes !== undefined &&
      (!Number.isInteger(args.estimatedMinutes) || args.estimatedMinutes < 1 || args.estimatedMinutes > 10080)
    ) {
      throw new Error("Estimated time must be between 1 minute and one week.");
    }
    const now = Date.now();
    return await ctx.db.insert("domainTasks", {
      householdId: args.householdId,
      title: clean(args.title, "Task", 140),
      status: "open",
      priority: args.priority,
      startAt: validDate(args.startAt, "Start time"),
      dueAt: validDate(args.dueAt, "Due time"),
      estimatedMinutes: args.estimatedMinutes,
      responsibilityId: args.responsibilityId,
      routineId: args.routineId,
      concernsPersonId: args.concernsPersonId,
      accountablePersonId: args.accountablePersonId,
      assigneePersonId: args.assigneePersonId,
      createdByUserId: userId,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const setTaskStatus = mutation({
  args: {
    householdId: v.id("households"),
    taskId: v.id("domainTasks"),
    status: taskStatus,
  },
  handler: async (ctx, args) => {
    await requireMembership(ctx, args.householdId);
    const task = await ctx.db.get(args.taskId);
    if (!task || task.householdId !== args.householdId) throw new Error("Task not found.");
    const now = Date.now();
    await ctx.db.patch(task._id, {
      status: args.status,
      completedAt: args.status === "done" ? now : undefined,
      updatedAt: now,
    });
  },
});

export const createRestaurant = mutation({
  args: {
    householdId: v.id("households"),
    name: v.string(),
    cuisine: v.optional(v.string()),
    serviceModes: v.array(serviceMode),
    preferredOrderMethod: v.optional(orderMethod),
    phone: v.optional(v.string()),
    website: v.optional(v.string()),
    addressLine: v.optional(v.string()),
    postcode: v.optional(v.string()),
    parkingGuidance: v.optional(v.string()),
    bookingGuidance: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { userId } = await requireMembership(ctx, args.householdId);
    if (args.serviceModes.length < 1) throw new Error("Choose at least one service mode.");
    const now = Date.now();
    return await ctx.db.insert("restaurants", {
      householdId: args.householdId,
      name: clean(args.name, "Restaurant name", 100),
      cuisine: optionalClean(args.cuisine, 60),
      serviceModes: [...new Set(args.serviceModes)],
      preferredOrderMethod: args.preferredOrderMethod,
      phone: optionalClean(args.phone, 40),
      website: optionalClean(args.website, 200),
      addressLine: optionalClean(args.addressLine, 160),
      postcode: optionalClean(args.postcode, 20),
      parkingGuidance: optionalClean(args.parkingGuidance, 240),
      bookingGuidance: optionalClean(args.bookingGuidance, 240),
      createdByUserId: userId,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const createPreference = mutation({
  args: {
    householdId: v.id("households"),
    personId: v.id("domainPeople"),
    category: preferenceCategory,
    relation: preferenceRelation,
    targetName: v.optional(v.string()),
    restaurantId: v.optional(v.id("restaurants")),
    brand: v.optional(v.string()),
    preparationPreference: v.optional(v.string()),
    source: preferenceSource,
    lastConfirmedAt: v.optional(v.number()),
    visibility,
  },
  handler: async (ctx, args) => {
    const { userId } = await requireMembership(ctx, args.householdId);
    await assertPerson(ctx, args.householdId, args.personId);
    await assertRestaurant(ctx, args.householdId, args.restaurantId);
    const now = Date.now();
    let foodItemId: Id<"foodItems"> | undefined;
    let activityId: Id<"activities"> | undefined;

    if (args.category === "restaurant") {
      if (!args.restaurantId) throw new Error("Choose a restaurant.");
    } else if (args.category === "activity") {
      const name = clean(args.targetName ?? "", "Activity", 100);
      activityId = await ctx.db.insert("activities", {
        householdId: args.householdId,
        name,
        createdByUserId: userId,
        createdAt: now,
        updatedAt: now,
      });
    } else {
      const name = clean(args.targetName ?? "", "Preference subject", 100);
      const kind =
        args.category === "takeaway"
          ? "takeaway_item"
          : args.category === "meal"
            ? "meal"
            : args.category;
      foodItemId = await ctx.db.insert("foodItems", {
        householdId: args.householdId,
        name,
        kind,
        brand: optionalClean(args.brand, 80),
        defaultPreparation: optionalClean(args.preparationPreference, 240),
        createdByUserId: userId,
        createdAt: now,
        updatedAt: now,
      });
    }

    return await ctx.db.insert("personPreferences", {
      householdId: args.householdId,
      personId: args.personId,
      category: args.category,
      relation: args.relation,
      foodItemId,
      restaurantId: args.restaurantId,
      activityId,
      preparationPreference: optionalClean(args.preparationPreference, 240),
      avoidFoodItemIds: [],
      source: args.source,
      lastConfirmedAt: validDate(args.lastConfirmedAt, "Last confirmed date"),
      visibility: args.visibility,
      createdByUserId: userId,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const createOrderProfile = mutation({
  args: {
    householdId: v.id("households"),
    restaurantId: v.id("restaurants"),
    name: v.string(),
    scope: v.union(v.literal("household"), v.literal("person")),
    personId: v.optional(v.id("domainPeople")),
    orderMethod: v.optional(orderMethod),
    lines: v.array(
      v.object({
        quantity: v.number(),
        itemName: v.string(),
        variant: v.optional(v.string()),
        modifications: v.array(v.string()),
        forPersonIds: v.array(v.id("domainPeople")),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const { userId } = await requireMembership(ctx, args.householdId);
    await assertRestaurant(ctx, args.householdId, args.restaurantId);
    await assertPerson(ctx, args.householdId, args.personId);
    if (args.scope === "person" && !args.personId) throw new Error("Choose who this order belongs to.");
    if (args.lines.length < 1) throw new Error("Add at least one order line.");
    const now = Date.now();
    const profileId = await ctx.db.insert("restaurantOrderProfiles", {
      householdId: args.householdId,
      restaurantId: args.restaurantId,
      name: clean(args.name, "Order name", 100),
      scope: args.scope,
      personId: args.scope === "person" ? args.personId : undefined,
      orderMethod: args.orderMethod,
      createdByUserId: userId,
      createdAt: now,
      updatedAt: now,
    });

    for (let index = 0; index < args.lines.length; index += 1) {
      const line = args.lines[index];
      if (!Number.isInteger(line.quantity) || line.quantity < 1 || line.quantity > 99) {
        throw new Error("Each order quantity must be between 1 and 99.");
      }
      for (const personId of line.forPersonIds) await assertPerson(ctx, args.householdId, personId);
      await ctx.db.insert("restaurantOrderLines", {
        householdId: args.householdId,
        orderProfileId: profileId,
        quantity: line.quantity,
        itemName: clean(line.itemName, "Order item", 100),
        variant: optionalClean(line.variant, 80),
        modifications: line.modifications.map((item) => clean(item, "Modification", 120)),
        forPersonIds: [...new Set(line.forPersonIds)],
        position: index,
        createdAt: now,
      });
    }
    return profileId;
  },
});

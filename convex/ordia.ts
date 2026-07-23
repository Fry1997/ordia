import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireMembership } from "./lib/access";

const visibility = v.union(v.literal("private"), v.literal("household"));
const responsibilityStatus = v.union(v.literal("active"), v.literal("paused"));
const routineStatus = v.union(v.literal("active"), v.literal("paused"));
const taskStatus = v.union(v.literal("open"), v.literal("done"));
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

function cleanText(value: string, label: string, maximum = 140): string {
  const cleaned = value.trim().replace(/\s+/g, " ");
  if (cleaned.length < 1 || cleaned.length > maximum) {
    throw new Error(`${label} must be between 1 and ${maximum} characters.`);
  }
  return cleaned;
}

function optionalText(value: string | undefined, maximum = 1000): string | undefined {
  const cleaned = value?.trim();
  if (!cleaned) return undefined;
  if (cleaned.length > maximum) {
    throw new Error(`Keep supporting detail under ${maximum} characters.`);
  }
  return cleaned;
}

function cleanSteps(steps: string[]): string[] {
  const cleaned = steps
    .map((step) => step.trim().replace(/\s+/g, " "))
    .filter(Boolean);
  if (cleaned.length > 30) {
    throw new Error("Keep each routine or playbook to 30 steps or fewer.");
  }
  if (cleaned.some((step) => step.length > 240)) {
    throw new Error("Keep each step under 240 characters.");
  }
  return cleaned;
}

function validTimestamp(value: number | undefined, label: string): number | undefined {
  if (value === undefined) return undefined;
  if (!Number.isFinite(value)) throw new Error(`${label} is not valid.`);
  return value;
}

export const overview = query({
  args: { householdId: v.id("households") },
  handler: async (ctx, args) => {
    const { userId } = await requireMembership(ctx, args.householdId);

    const [people, responsibilities, routines, tasks, knowledgeItems, preferences, playbooks] =
      await Promise.all([
        ctx.db
          .query("householdPeople")
          .withIndex("by_household_id", (q) => q.eq("householdId", args.householdId))
          .take(250),
        ctx.db
          .query("responsibilities")
          .withIndex("by_household_id", (q) => q.eq("householdId", args.householdId))
          .take(250),
        ctx.db
          .query("routines")
          .withIndex("by_household_id", (q) => q.eq("householdId", args.householdId))
          .take(250),
        ctx.db
          .query("tasks")
          .withIndex("by_household_id", (q) => q.eq("householdId", args.householdId))
          .take(500),
        ctx.db
          .query("knowledgeItems")
          .withIndex("by_household_id", (q) => q.eq("householdId", args.householdId))
          .take(500),
        ctx.db
          .query("preferences")
          .withIndex("by_household_id", (q) => q.eq("householdId", args.householdId))
          .take(500),
        ctx.db
          .query("playbooks")
          .withIndex("by_household_id", (q) => q.eq("householdId", args.householdId))
          .take(250),
      ]);

    const visiblePeople = people.filter(
      (person) => person.visibility === "household" || person.createdByUserId === userId,
    );
    const visiblePeopleIds = new Set(visiblePeople.map((person) => person._id));
    const visiblePreferences = preferences.filter(
      (preference) =>
        (preference.visibility === "household" || preference.createdByUserId === userId) &&
        (preference.personId === undefined || visiblePeopleIds.has(preference.personId)),
    );

    return {
      people: visiblePeople
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((person) => ({
          personId: person._id,
          name: person.name,
          relationship: person.relationship,
          birthDate: person.birthDate,
          note: person.note,
          visibility: person.visibility,
          isMine: person.createdByUserId === userId,
        })),
      responsibilities: responsibilities
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((responsibility) => ({
          responsibilityId: responsibility._id,
          name: responsibility.name,
          description: responsibility.description,
          status: responsibility.status,
          ownerPersonId: responsibility.ownerPersonId,
          nextDueAt: responsibility.nextDueAt,
        })),
      routines: routines
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((routine) => ({
          routineId: routine._id,
          name: routine.name,
          description: routine.description,
          scheduleText: routine.scheduleText,
          steps: routine.steps,
          status: routine.status,
          responsibilityId: routine.responsibilityId,
          personId: routine.personId,
          nextDueAt: routine.nextDueAt,
        })),
      tasks: tasks
        .sort((a, b) => {
          if (a.status !== b.status) return a.status === "open" ? -1 : 1;
          const leftDue = a.dueAt ?? Number.MAX_SAFE_INTEGER;
          const rightDue = b.dueAt ?? Number.MAX_SAFE_INTEGER;
          if (leftDue !== rightDue) return leftDue - rightDue;
          return b.createdAt - a.createdAt;
        })
        .map((task) => ({
          taskId: task._id,
          title: task.title,
          notes: task.notes,
          status: task.status,
          dueAt: task.dueAt,
          completedAt: task.completedAt,
          responsibilityId: task.responsibilityId,
          routineId: task.routineId,
          personId: task.personId,
          ownerPersonId: task.ownerPersonId,
        })),
      knowledgeItems: knowledgeItems
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((item) => ({
          itemId: item._id,
          kind: item.kind,
          name: item.name,
          detail: item.detail,
        })),
      preferences: visiblePreferences
        .sort((a, b) => b.updatedAt - a.updatedAt)
        .map((preference) => ({
          preferenceId: preference._id,
          personId: preference.personId,
          subjectItemId: preference.subjectItemId,
          subjectName: preference.subjectName,
          kind: preference.kind,
          detail: preference.detail,
          visibility: preference.visibility,
          isMine: preference.createdByUserId === userId,
        })),
      playbooks: playbooks
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((playbook) => ({
          playbookId: playbook._id,
          name: playbook.name,
          notes: playbook.notes,
          steps: playbook.steps,
          linkedItemId: playbook.linkedItemId,
          responsibilityId: playbook.responsibilityId,
        })),
    };
  },
});

export const createPerson = mutation({
  args: {
    householdId: v.id("households"),
    name: v.string(),
    relationship: v.optional(v.string()),
    birthDate: v.optional(v.string()),
    note: v.optional(v.string()),
    visibility,
  },
  handler: async (ctx, args) => {
    const { userId } = await requireMembership(ctx, args.householdId);
    const now = Date.now();
    return await ctx.db.insert("householdPeople", {
      householdId: args.householdId,
      name: cleanText(args.name, "Name", 80),
      relationship: optionalText(args.relationship, 80),
      birthDate: optionalText(args.birthDate, 20),
      note: optionalText(args.note),
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
    description: v.optional(v.string()),
    ownerPersonId: v.optional(v.id("householdPeople")),
    nextDueAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { userId } = await requireMembership(ctx, args.householdId);
    if (args.ownerPersonId) {
      const owner = await ctx.db.get(args.ownerPersonId);
      if (!owner || owner.householdId !== args.householdId) {
        throw new Error("That responsibility owner could not be found.");
      }
    }
    const now = Date.now();
    return await ctx.db.insert("responsibilities", {
      householdId: args.householdId,
      name: cleanText(args.name, "Responsibility name", 100),
      description: optionalText(args.description),
      status: "active",
      ownerPersonId: args.ownerPersonId,
      nextDueAt: validTimestamp(args.nextDueAt, "Next date"),
      createdByUserId: userId,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const createTask = mutation({
  args: {
    householdId: v.id("households"),
    title: v.string(),
    notes: v.optional(v.string()),
    dueAt: v.optional(v.number()),
    responsibilityId: v.optional(v.id("responsibilities")),
    routineId: v.optional(v.id("routines")),
    personId: v.optional(v.id("householdPeople")),
    ownerPersonId: v.optional(v.id("householdPeople")),
  },
  handler: async (ctx, args) => {
    const { userId } = await requireMembership(ctx, args.householdId);
    const linkedIds = [args.personId, args.ownerPersonId].filter(
      (id): id is NonNullable<typeof id> => id !== undefined,
    );
    for (const personId of linkedIds) {
      const person = await ctx.db.get(personId);
      if (!person || person.householdId !== args.householdId) {
        throw new Error("A linked person could not be found.");
      }
    }
    if (args.responsibilityId) {
      const responsibility = await ctx.db.get(args.responsibilityId);
      if (!responsibility || responsibility.householdId !== args.householdId) {
        throw new Error("That responsibility could not be found.");
      }
    }
    if (args.routineId) {
      const routine = await ctx.db.get(args.routineId);
      if (!routine || routine.householdId !== args.householdId) {
        throw new Error("That routine could not be found.");
      }
    }
    const now = Date.now();
    return await ctx.db.insert("tasks", {
      householdId: args.householdId,
      title: cleanText(args.title, "Task", 160),
      notes: optionalText(args.notes),
      status: "open",
      dueAt: validTimestamp(args.dueAt, "Due date"),
      responsibilityId: args.responsibilityId,
      routineId: args.routineId,
      personId: args.personId,
      ownerPersonId: args.ownerPersonId,
      createdByUserId: userId,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const createRoutine = mutation({
  args: {
    householdId: v.id("households"),
    name: v.string(),
    description: v.optional(v.string()),
    scheduleText: v.string(),
    steps: v.array(v.string()),
    responsibilityId: v.optional(v.id("responsibilities")),
    personId: v.optional(v.id("householdPeople")),
    nextDueAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { userId } = await requireMembership(ctx, args.householdId);
    if (args.responsibilityId) {
      const responsibility = await ctx.db.get(args.responsibilityId);
      if (!responsibility || responsibility.householdId !== args.householdId) {
        throw new Error("That responsibility could not be found.");
      }
    }
    if (args.personId) {
      const person = await ctx.db.get(args.personId);
      if (!person || person.householdId !== args.householdId) {
        throw new Error("That person could not be found.");
      }
    }
    const now = Date.now();
    return await ctx.db.insert("routines", {
      householdId: args.householdId,
      name: cleanText(args.name, "Routine name", 100),
      description: optionalText(args.description),
      scheduleText: cleanText(args.scheduleText, "Schedule", 180),
      steps: cleanSteps(args.steps),
      status: "active",
      responsibilityId: args.responsibilityId,
      personId: args.personId,
      nextDueAt: validTimestamp(args.nextDueAt, "Next date"),
      createdByUserId: userId,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const createKnowledgeItem = mutation({
  args: {
    householdId: v.id("households"),
    kind: knowledgeKind,
    name: v.string(),
    detail: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { userId } = await requireMembership(ctx, args.householdId);
    const now = Date.now();
    return await ctx.db.insert("knowledgeItems", {
      householdId: args.householdId,
      kind: args.kind,
      name: cleanText(args.name, "Name", 120),
      detail: optionalText(args.detail),
      createdByUserId: userId,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const createPreference = mutation({
  args: {
    householdId: v.id("households"),
    personId: v.optional(v.id("householdPeople")),
    subjectItemId: v.optional(v.id("knowledgeItems")),
    subjectName: v.string(),
    kind: preferenceKind,
    detail: v.optional(v.string()),
    visibility,
  },
  handler: async (ctx, args) => {
    const { userId } = await requireMembership(ctx, args.householdId);
    if (args.personId) {
      const person = await ctx.db.get(args.personId);
      if (!person || person.householdId !== args.householdId) {
        throw new Error("That person could not be found.");
      }
    }
    if (args.subjectItemId) {
      const subject = await ctx.db.get(args.subjectItemId);
      if (!subject || subject.householdId !== args.householdId) {
        throw new Error("That linked item could not be found.");
      }
    }
    const now = Date.now();
    return await ctx.db.insert("preferences", {
      householdId: args.householdId,
      personId: args.personId,
      subjectItemId: args.subjectItemId,
      subjectName: cleanText(args.subjectName, "Preference subject", 120),
      kind: args.kind,
      detail: optionalText(args.detail),
      visibility: args.visibility,
      createdByUserId: userId,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const createPlaybook = mutation({
  args: {
    householdId: v.id("households"),
    name: v.string(),
    notes: v.optional(v.string()),
    steps: v.array(v.string()),
    linkedItemId: v.optional(v.id("knowledgeItems")),
    responsibilityId: v.optional(v.id("responsibilities")),
  },
  handler: async (ctx, args) => {
    const { userId } = await requireMembership(ctx, args.householdId);
    if (args.linkedItemId) {
      const item = await ctx.db.get(args.linkedItemId);
      if (!item || item.householdId !== args.householdId) {
        throw new Error("That linked library item could not be found.");
      }
    }
    if (args.responsibilityId) {
      const responsibility = await ctx.db.get(args.responsibilityId);
      if (!responsibility || responsibility.householdId !== args.householdId) {
        throw new Error("That responsibility could not be found.");
      }
    }
    const now = Date.now();
    return await ctx.db.insert("playbooks", {
      householdId: args.householdId,
      name: cleanText(args.name, "Playbook name", 120),
      notes: optionalText(args.notes),
      steps: cleanSteps(args.steps),
      linkedItemId: args.linkedItemId,
      responsibilityId: args.responsibilityId,
      createdByUserId: userId,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const setTaskStatus = mutation({
  args: {
    householdId: v.id("households"),
    taskId: v.id("tasks"),
    status: taskStatus,
  },
  handler: async (ctx, args) => {
    await requireMembership(ctx, args.householdId);
    const task = await ctx.db.get(args.taskId);
    if (!task || task.householdId !== args.householdId) {
      throw new Error("That task could not be found.");
    }
    const now = Date.now();
    await ctx.db.patch(args.taskId, {
      status: args.status,
      completedAt: args.status === "done" ? now : undefined,
      updatedAt: now,
    });
    return null;
  },
});

export const setResponsibilityStatus = mutation({
  args: {
    householdId: v.id("households"),
    responsibilityId: v.id("responsibilities"),
    status: responsibilityStatus,
  },
  handler: async (ctx, args) => {
    await requireMembership(ctx, args.householdId);
    const responsibility = await ctx.db.get(args.responsibilityId);
    if (!responsibility || responsibility.householdId !== args.householdId) {
      throw new Error("That responsibility could not be found.");
    }
    await ctx.db.patch(args.responsibilityId, { status: args.status, updatedAt: Date.now() });
    return null;
  },
});

export const setRoutineStatus = mutation({
  args: {
    householdId: v.id("households"),
    routineId: v.id("routines"),
    status: routineStatus,
  },
  handler: async (ctx, args) => {
    await requireMembership(ctx, args.householdId);
    const routine = await ctx.db.get(args.routineId);
    if (!routine || routine.householdId !== args.householdId) {
      throw new Error("That routine could not be found.");
    }
    await ctx.db.patch(args.routineId, { status: args.status, updatedAt: Date.now() });
    return null;
  },
});
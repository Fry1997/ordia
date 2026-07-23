"use client";

import {
  ArrowLeft,
  CalendarDays,
  Car,
  Check,
  ChevronDown,
  CircleAlert,
  Clock3,
  Heart,
  LoaderCircle,
  MapPin,
  Plus,
  Repeat2,
  ShieldCheck,
  Trash2,
  UserRound,
  Utensils,
  X,
} from "lucide-react";
import { FormEvent, ReactNode, useMemo, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import type {
  CreatorKind,
  DomainWorkspaceData,
  OrderMethod,
  PreferenceCategory,
  PreferenceRelation,
  PreferenceSource,
  ResponsibilityDomain,
  ResponsibilityHealth,
  ReviewCadence,
  RoutineFrequency,
  RoutinePhase,
  ServiceMode,
  TaskPriority,
  Visibility,
} from "./types";

type DomainCreatorProps = {
  householdId: Id<"households">;
  kind: CreatorKind;
  data: DomainWorkspaceData;
  responsibilityId?: Id<"responsibilityAreas">;
  personId?: Id<"domainPeople">;
  restaurantId?: Id<"restaurants">;
  onClose: () => void;
  onSaved?: () => void;
};

const creatorCopy: Record<CreatorKind, { eyebrow: string; title: string; intro: string }> = {
  responsibility: {
    eyebrow: "Ongoing stewardship",
    title: "Create a responsibility",
    intro:
      "Define who keeps this area healthy, how often it is reviewed and whether it currently needs attention. Tasks and routines establish its actual scope.",
  },
  routine: {
    eyebrow: "Repeated process",
    title: "Build a routine",
    intro:
      "Model the schedule, alternating variants and each generated action separately. A routine is a task-producing system, not a paragraph.",
  },
  task: {
    eyebrow: "Concrete action",
    title: "Create a task",
    intro:
      "Record the finish line, timing, priority and the difference between who is accountable and who is doing it this time.",
  },
  person: {
    eyebrow: "Household person",
    title: "Add a person",
    intro:
      "A person can exist in Ordia without an account. Their record becomes the anchor for responsibilities, tasks, preferences and routines.",
  },
  restaurant: {
    eyebrow: "Household place",
    title: "Add a restaurant",
    intro:
      "Keep practical ordering and visit information as structured household knowledge rather than one person’s memory.",
  },
  preference: {
    eyebrow: "Person-to-thing relationship",
    title: "Record a preference",
    intro:
      "A favourite or preference is a relationship with evidence, context and specific preparation details—not a loose note on a person.",
  },
  order: {
    eyebrow: "Reusable ordering knowledge",
    title: "Build an usual order",
    intro:
      "Capture the exact quantities, variants, modifications and who each line is for so ordering is reproducible by anyone.",
  },
};

export function DomainCreator(props: DomainCreatorProps) {
  const copy = creatorCopy[props.kind];
  return (
    <div className="dx-drawer-backdrop" role="presentation" onMouseDown={props.onClose}>
      <aside
        className="dx-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dx-creator-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="dx-drawer-header">
          <button className="dx-icon-button" type="button" onClick={props.onClose} aria-label="Close">
            <X size={19} />
          </button>
          <div>
            <span>{copy.eyebrow}</span>
            <h2 id="dx-creator-title">{copy.title}</h2>
          </div>
        </header>
        <p className="dx-drawer-intro">{copy.intro}</p>
        <div className="dx-drawer-body">
          {props.kind === "responsibility" && <ResponsibilityForm {...props} />}
          {props.kind === "routine" && <RoutineForm {...props} />}
          {props.kind === "task" && <TaskForm {...props} />}
          {props.kind === "person" && <PersonForm {...props} />}
          {props.kind === "restaurant" && <RestaurantForm {...props} />}
          {props.kind === "preference" && <PreferenceForm {...props} />}
          {props.kind === "order" && <OrderForm {...props} />}
        </div>
      </aside>
    </div>
  );
}

function ResponsibilityForm({ householdId, data, onClose, onSaved }: DomainCreatorProps) {
  const create = useMutation(api.domain.createResponsibility);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSubmitting(true);
    setError(null);
    try {
      await create({
        householdId,
        name: required(form, "name"),
        domain: required(form, "domain") as ResponsibilityDomain,
        health: required(form, "health") as ResponsibilityHealth,
        ownerPersonId: idValue<"domainPeople">(form, "ownerPersonId"),
        backupPersonId: idValue<"domainPeople">(form, "backupPersonId"),
        reviewCadence: required(form, "reviewCadence") as ReviewCadence,
        nextReviewAt: dateValue(form, "nextReviewAt"),
      });
      onSaved?.();
      onClose();
    } catch (caught) {
      setError(errorText(caught));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="dx-entity-form" onSubmit={submit}>
      <FormSection
        icon={<Car size={18} />}
        number="01"
        title="Identity"
        copy="A responsibility is a durable area of life, not a project or task."
      >
        <Field label="Responsibility name" hint="Use a stable area, such as Car maintenance or Nursery.">
          <input name="name" placeholder="Car maintenance" required autoFocus />
        </Field>
        <ChoiceGrid<ResponsibilityDomain>
          label="Household domain"
          name="domain"
          defaultValue="transport"
          choices={[
            ["home", "Home"],
            ["family", "Family"],
            ["finance", "Finance"],
            ["food", "Food"],
            ["health", "Health"],
            ["transport", "Transport"],
            ["education", "Education"],
            ["admin", "Admin"],
            ["pets", "Pets"],
            ["work", "Work"],
            ["other", "Other"],
          ]}
        />
      </FormSection>

      <FormSection
        icon={<UserRound size={18} />}
        number="02"
        title="Stewardship"
        copy="The steward keeps the area healthy. The backup can recover context when the steward is unavailable."
      >
        <div className="dx-two-column">
          <Field label="Steward">
            <PersonSelect name="ownerPersonId" people={data.people} empty="Not assigned yet" />
          </Field>
          <Field label="Backup">
            <PersonSelect name="backupPersonId" people={data.people} empty="No backup" />
          </Field>
        </div>
      </FormSection>

      <FormSection
        icon={<CircleAlert size={18} />}
        number="03"
        title="Health and review"
        copy="Health describes the current state. Review cadence prevents quiet areas becoming forgotten problems."
      >
        <ChoiceGrid<ResponsibilityHealth>
          label="Current health"
          name="health"
          defaultValue="on_track"
          choices={[
            ["on_track", "On track"],
            ["attention", "Needs attention"],
            ["blocked", "Blocked"],
          ]}
        />
        <div className="dx-two-column">
          <Field label="Review cadence">
            <select name="reviewCadence" defaultValue="monthly">
              <option value="none">No scheduled review</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="yearly">Yearly</option>
            </select>
          </Field>
          <Field label="Next review">
            <input name="nextReviewAt" type="date" />
          </Field>
        </div>
      </FormSection>
      <FormActions submitting={submitting} error={error} label="Create responsibility" />
    </form>
  );
}

function PersonForm({ householdId, onClose, onSaved }: DomainCreatorProps) {
  const create = useMutation(api.domain.createPerson);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSubmitting(true);
    setError(null);
    try {
      await create({
        householdId,
        name: required(form, "name"),
        relationship: required(form, "relationship") as
          | "self"
          | "partner"
          | "child"
          | "parent"
          | "sibling"
          | "family"
          | "friend"
          | "professional"
          | "other",
        birthDate: optional(form, "birthDate"),
        visibility: required(form, "visibility") as Visibility,
      });
      onSaved?.();
      onClose();
    } catch (caught) {
      setError(errorText(caught));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="dx-entity-form" onSubmit={submit}>
      <FormSection icon={<UserRound size={18} />} number="01" title="Person" copy="Create the person as a household entity before attaching knowledge to them.">
        <div className="dx-two-column">
          <Field label="Name"><input name="name" placeholder="Spencer" required autoFocus /></Field>
          <Field label="Date of birth"><input name="birthDate" type="date" /></Field>
        </div>
        <ChoiceGrid
          label="Relationship to this household"
          name="relationship"
          defaultValue="child"
          choices={[
            ["self", "Me"],
            ["partner", "Partner"],
            ["child", "Child"],
            ["parent", "Parent"],
            ["sibling", "Sibling"],
            ["family", "Other family"],
            ["friend", "Friend"],
            ["professional", "Professional"],
            ["other", "Other"],
          ]}
        />
      </FormSection>
      <FormSection icon={<ShieldCheck size={18} />} number="02" title="Record visibility" copy="Inviting someone later does not grant them access to private records written about them.">
        <ChoiceGrid<Visibility>
          label="Who can see the person record?"
          name="visibility"
          defaultValue="private"
          choices={[
            ["private", "Only me"],
            ["household", "Household members"],
          ]}
        />
      </FormSection>
      <FormActions submitting={submitting} error={error} label="Add person" />
    </form>
  );
}

function TaskForm({ householdId, data, responsibilityId, personId, onClose, onSaved }: DomainCreatorProps) {
  const create = useMutation(api.domain.createTask);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSubmitting(true);
    setError(null);
    try {
      await create({
        householdId,
        title: required(form, "title"),
        priority: required(form, "priority") as TaskPriority,
        startAt: dateTimeValue(form, "startAt"),
        dueAt: dateTimeValue(form, "dueAt"),
        estimatedMinutes: integerValue(form, "estimatedMinutes"),
        responsibilityId: idValue<"responsibilityAreas">(form, "responsibilityId"),
        routineId: idValue<"routineDefinitions">(form, "routineId"),
        concernsPersonId: idValue<"domainPeople">(form, "concernsPersonId"),
        accountablePersonId: idValue<"domainPeople">(form, "accountablePersonId"),
        assigneePersonId: idValue<"domainPeople">(form, "assigneePersonId"),
      });
      onSaved?.();
      onClose();
    } catch (caught) {
      setError(errorText(caught));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="dx-entity-form" onSubmit={submit}>
      <FormSection icon={<Check size={18} />} number="01" title="Finish line" copy="A task should describe one observable action that can become done.">
        <Field label="Task"><input name="title" placeholder="Book the car MOT" required autoFocus /></Field>
        <ChoiceGrid<TaskPriority>
          label="Priority"
          name="priority"
          defaultValue="normal"
          choices={[
            ["low", "Low"],
            ["normal", "Normal"],
            ["high", "High"],
            ["urgent", "Urgent"],
          ]}
        />
      </FormSection>
      <FormSection icon={<CalendarDays size={18} />} number="02" title="Timing" copy="Start time controls when it becomes relevant. Due time marks the actual deadline.">
        <div className="dx-three-column">
          <Field label="Start"><input name="startAt" type="datetime-local" /></Field>
          <Field label="Due"><input name="dueAt" type="datetime-local" /></Field>
          <Field label="Estimated minutes"><input name="estimatedMinutes" type="number" min="1" step="5" placeholder="30" /></Field>
        </div>
      </FormSection>
      <FormSection icon={<ArrowLeft size={18} />} number="03" title="Connections and ownership" copy="Accountability means ensuring closure. Assignee means doing this instance of the work.">
        <div className="dx-two-column">
          <Field label="Responsibility">
            <ResponsibilitySelect name="responsibilityId" responsibilities={data.responsibilities} defaultValue={responsibilityId} />
          </Field>
          <Field label="Generated by routine">
            <RoutineSelect name="routineId" routines={data.routines} />
          </Field>
          <Field label="Concerns">
            <PersonSelect name="concernsPersonId" people={data.people} empty="No person" defaultValue={personId} />
          </Field>
          <Field label="Accountable person">
            <PersonSelect name="accountablePersonId" people={data.people} empty="Not assigned" />
          </Field>
          <Field label="Doing it this time">
            <PersonSelect name="assigneePersonId" people={data.people} empty="Not assigned" />
          </Field>
        </div>
      </FormSection>
      <FormActions submitting={submitting} error={error} label="Create task" />
    </form>
  );
}

type RoutineStepDraft = {
  key: number;
  title: string;
  phase: RoutinePhase;
  offsetDays: number;
  timeLocal: string;
  assigneePersonId: string;
  variantIndex: string;
};

function RoutineForm({ householdId, data, responsibilityId, personId, onClose, onSaved }: DomainCreatorProps) {
  const create = useMutation(api.domain.createRoutine);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [frequency, setFrequency] = useState<RoutineFrequency>("weekly");
  const [alternating, setAlternating] = useState(false);
  const [variants, setVariants] = useState(["Black bin", "Green bin"]);
  const [weekdays, setWeekdays] = useState<number[]>([3]);
  const [steps, setSteps] = useState<RoutineStepDraft[]>([
    { key: 1, title: "Check which collection is due", phase: "preparation", offsetDays: -1, timeLocal: "19:00", assigneePersonId: "", variantIndex: "" },
    { key: 2, title: "Empty indoor bins", phase: "preparation", offsetDays: -1, timeLocal: "19:15", assigneePersonId: "", variantIndex: "" },
    { key: 3, title: "Put the correct bin out", phase: "preparation", offsetDays: -1, timeLocal: "20:00", assigneePersonId: "", variantIndex: "" },
    { key: 4, title: "Bring the bin back in", phase: "follow_up", offsetDays: 0, timeLocal: "18:00", assigneePersonId: "", variantIndex: "" },
  ]);

  function updateStep(key: number, patch: Partial<RoutineStepDraft>) {
    setSteps((current) => current.map((step) => (step.key === key ? { ...step, ...patch } : step)));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSubmitting(true);
    setError(null);
    try {
      await create({
        householdId,
        name: required(form, "name"),
        responsibilityId: idValue<"responsibilityAreas">(form, "responsibilityId"),
        personId: idValue<"domainPeople">(form, "personId"),
        frequency,
        interval: integerValue(form, "interval") ?? 1,
        weekdays,
        dayOfMonth: integerValue(form, "dayOfMonth"),
        timeLocal: optional(form, "timeLocal"),
        startsOn: required(form, "startsOn"),
        alternating,
        nextOccurrenceAt: dateTimeFromDateAndTime(required(form, "startsOn"), optional(form, "timeLocal")),
        variants: alternating ? variants.filter(Boolean).map((name) => ({ name })) : [],
        steps: steps.map((step) => ({
          title: step.title,
          phase: step.phase,
          offsetDays: step.offsetDays,
          timeLocal: step.timeLocal || undefined,
          assigneePersonId: step.assigneePersonId
            ? (step.assigneePersonId as Id<"domainPeople">)
            : undefined,
          variantIndex: step.variantIndex === "" ? undefined : Number(step.variantIndex),
        })),
      });
      onSaved?.();
      onClose();
    } catch (caught) {
      setError(errorText(caught));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="dx-entity-form" onSubmit={submit}>
      <FormSection icon={<Repeat2 size={18} />} number="01" title="Routine identity" copy="Name the repeated process and connect it to the durable responsibility or person it serves.">
        <Field label="Routine name"><input name="name" placeholder="Bin day" required autoFocus /></Field>
        <div className="dx-two-column">
          <Field label="Responsibility">
            <ResponsibilitySelect name="responsibilityId" responsibilities={data.responsibilities} defaultValue={responsibilityId} />
          </Field>
          <Field label="Centred on a person">
            <PersonSelect name="personId" people={data.people} empty="No specific person" defaultValue={personId} />
          </Field>
        </div>
      </FormSection>

      <FormSection icon={<CalendarDays size={18} />} number="02" title="Schedule engine" copy="The schedule is stored as data so Ordia can calculate occurrences and generate work later.">
        <ChoiceGrid<RoutineFrequency>
          label="Frequency"
          name="frequencyChoice"
          defaultValue="weekly"
          onChange={setFrequency}
          choices={[
            ["daily", "Daily"],
            ["weekly", "Weekly"],
            ["fortnightly", "Fortnightly"],
            ["monthly", "Monthly"],
            ["interval", "Custom interval"],
          ]}
        />
        <div className="dx-three-column">
          <Field label="Repeat every"><input name="interval" type="number" min="1" max="52" defaultValue="1" /></Field>
          <Field label="Starts on"><input name="startsOn" type="date" required /></Field>
          <Field label="Occurrence time"><input name="timeLocal" type="time" defaultValue="07:00" /></Field>
        </div>
        {(frequency === "weekly" || frequency === "fortnightly") && (
          <WeekdayPicker value={weekdays} onChange={setWeekdays} />
        )}
        {frequency === "monthly" && (
          <Field label="Day of month"><input name="dayOfMonth" type="number" min="1" max="31" defaultValue="1" /></Field>
        )}
      </FormSection>

      <FormSection icon={<Repeat2 size={18} />} number="03" title="Alternating cycle" copy="Use named variants when the same routine alternates between different versions, such as black and green bin collections.">
        <label className="dx-switch-row">
          <input type="checkbox" checked={alternating} onChange={(event) => setAlternating(event.target.checked)} />
          <span><strong>This routine alternates</strong><small>Each occurrence moves to the next named variant.</small></span>
        </label>
        {alternating && (
          <div className="dx-variant-grid">
            {variants.map((variant, index) => (
              <Field key={index} label={`Variant ${index + 1}`}>
                <input
                  value={variant}
                  onChange={(event) => setVariants((current) => current.map((item, itemIndex) => itemIndex === index ? event.target.value : item))}
                  placeholder={index === 0 ? "Black bin" : "Green bin"}
                  required
                />
              </Field>
            ))}
            <button className="dx-secondary-button" type="button" onClick={() => setVariants((current) => [...current, ""])}>
              <Plus size={16} /> Add variant
            </button>
          </div>
        )}
      </FormSection>

      <FormSection icon={<Clock3 size={18} />} number="04" title="Generated steps" copy="Every step has its own phase, timing offset, optional variant and assignee. These will become real task instances for each occurrence.">
        <div className="dx-step-builder">
          {steps.map((step, index) => (
            <article className="dx-step-editor" key={step.key}>
              <div className="dx-step-number">{String(index + 1).padStart(2, "0")}</div>
              <div className="dx-step-fields">
                <Field label="Action"><input value={step.title} onChange={(event) => updateStep(step.key, { title: event.target.value })} required /></Field>
                <div className="dx-four-column">
                  <Field label="Phase">
                    <select value={step.phase} onChange={(event) => updateStep(step.key, { phase: event.target.value as RoutinePhase })}>
                      <option value="preparation">Preparation</option>
                      <option value="occurrence">Occurrence day</option>
                      <option value="follow_up">Follow-up</option>
                    </select>
                  </Field>
                  <Field label="Day offset"><input type="number" min="-30" max="30" value={step.offsetDays} onChange={(event) => updateStep(step.key, { offsetDays: Number(event.target.value) })} /></Field>
                  <Field label="Time"><input type="time" value={step.timeLocal} onChange={(event) => updateStep(step.key, { timeLocal: event.target.value })} /></Field>
                  <Field label="Variant">
                    <select value={step.variantIndex} disabled={!alternating} onChange={(event) => updateStep(step.key, { variantIndex: event.target.value })}>
                      <option value="">Every variant</option>
                      {variants.map((variant, variantIndex) => <option value={variantIndex} key={variantIndex}>{variant || `Variant ${variantIndex + 1}`}</option>)}
                    </select>
                  </Field>
                </div>
                <Field label="Default assignee">
                  <PersonSelect name={`stepAssignee-${step.key}`} people={data.people} empty="Unassigned" value={step.assigneePersonId} onChange={(value) => updateStep(step.key, { assigneePersonId: value })} />
                </Field>
              </div>
              <button className="dx-icon-button danger" type="button" onClick={() => setSteps((current) => current.filter((item) => item.key !== step.key))} aria-label="Remove step">
                <Trash2 size={17} />
              </button>
            </article>
          ))}
          <button
            className="dx-add-row"
            type="button"
            onClick={() => setSteps((current) => [...current, { key: Date.now(), title: "", phase: "occurrence", offsetDays: 0, timeLocal: "", assigneePersonId: "", variantIndex: "" }])}
          >
            <Plus size={17} /> Add another step
          </button>
        </div>
      </FormSection>
      <FormActions submitting={submitting} error={error} label="Create routine" />
    </form>
  );
}

function RestaurantForm({ householdId, onClose, onSaved }: DomainCreatorProps) {
  const create = useMutation(api.domain.createRestaurant);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [serviceModes, setServiceModes] = useState<ServiceMode[]>(["takeaway"]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSubmitting(true);
    setError(null);
    try {
      await create({
        householdId,
        name: required(form, "name"),
        cuisine: optional(form, "cuisine"),
        serviceModes,
        preferredOrderMethod: optional(form, "preferredOrderMethod") as OrderMethod | undefined,
        phone: optional(form, "phone"),
        website: optional(form, "website"),
        addressLine: optional(form, "addressLine"),
        postcode: optional(form, "postcode"),
        parkingGuidance: optional(form, "parkingGuidance"),
        bookingGuidance: optional(form, "bookingGuidance"),
      });
      onSaved?.();
      onClose();
    } catch (caught) {
      setError(errorText(caught));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="dx-entity-form" onSubmit={submit}>
      <FormSection icon={<Utensils size={18} />} number="01" title="Restaurant identity" copy="The restaurant becomes a reusable entity that preferences and usual orders can point to.">
        <div className="dx-two-column">
          <Field label="Restaurant name"><input name="name" placeholder="Mario’s" required autoFocus /></Field>
          <Field label="Cuisine"><input name="cuisine" placeholder="Italian" /></Field>
        </div>
        <CheckboxGrid<ServiceMode>
          label="Available service modes"
          values={serviceModes}
          onChange={setServiceModes}
          choices={[
            ["dine_in", "Dine in"],
            ["takeaway", "Takeaway"],
            ["delivery", "Delivery"],
          ]}
        />
        <Field label="Preferred way to order">
          <select name="preferredOrderMethod" defaultValue="direct_web">
            <option value="">No preference</option>
            <option value="direct_phone">Call directly</option>
            <option value="direct_web">Order on their website</option>
            <option value="delivery_app">Delivery app</option>
            <option value="walk_in">Walk in</option>
            <option value="at_table">At the table</option>
            <option value="other">Other</option>
          </select>
        </Field>
      </FormSection>
      <FormSection icon={<MapPin size={18} />} number="02" title="Contact and arrival" copy="Store the practical details someone else would otherwise need to ask for.">
        <div className="dx-two-column">
          <Field label="Phone"><input name="phone" type="tel" /></Field>
          <Field label="Website"><input name="website" type="url" placeholder="https://" /></Field>
          <Field label="Address"><input name="addressLine" /></Field>
          <Field label="Postcode"><input name="postcode" /></Field>
        </div>
        <div className="dx-two-column">
          <Field label="Parking guidance" hint="Specific arrival knowledge, not a general note."><textarea name="parkingGuidance" placeholder="Use the library car park after 6 pm" /></Field>
          <Field label="Booking guidance" hint="What someone needs to know before booking."><textarea name="bookingGuidance" placeholder="Book Friday evenings at least a week ahead" /></Field>
        </div>
      </FormSection>
      <FormActions submitting={submitting} error={error} label="Add restaurant" />
    </form>
  );
}

function PreferenceForm({ householdId, data, personId, restaurantId, onClose, onSaved }: DomainCreatorProps) {
  const create = useMutation(api.domain.createPreference);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState<PreferenceCategory>(restaurantId ? "restaurant" : "meal");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSubmitting(true);
    setError(null);
    try {
      await create({
        householdId,
        personId: requiredId<"domainPeople">(form, "personId"),
        category,
        relation: required(form, "relation") as PreferenceRelation,
        targetName: category === "restaurant" ? undefined : required(form, "targetName"),
        restaurantId: category === "restaurant" ? requiredId<"restaurants">(form, "restaurantId") : undefined,
        brand: optional(form, "brand"),
        preparationPreference: optional(form, "preparationPreference"),
        source: required(form, "source") as PreferenceSource,
        lastConfirmedAt: dateValue(form, "lastConfirmedAt"),
        visibility: required(form, "visibility") as Visibility,
      });
      onSaved?.();
      onClose();
    } catch (caught) {
      setError(errorText(caught));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="dx-entity-form" onSubmit={submit}>
      <FormSection icon={<Heart size={18} />} number="01" title="Relationship" copy="Record who the preference belongs to, the category and the strength of the relationship.">
        <div className="dx-two-column">
          <Field label="Person"><PersonSelect name="personId" people={data.people} empty="Choose a person" defaultValue={personId} required /></Field>
          <Field label="Relationship">
            <select name="relation" defaultValue="favourite">
              <option value="favourite">Favourite</option>
              <option value="likes">Likes</option>
              <option value="usually">Usually chooses</option>
              <option value="dislikes">Dislikes</option>
              <option value="avoids">Avoids</option>
              <option value="needs">Needs</option>
              <option value="only_if">Only if</option>
            </select>
          </Field>
        </div>
        <ChoiceGrid<PreferenceCategory>
          label="Category"
          name="categoryChoice"
          defaultValue={category}
          onChange={setCategory}
          choices={[
            ["meal", "Meal"],
            ["takeaway", "Takeaway item"],
            ["snack", "Snack"],
            ["activity", "Activity"],
            ["drink", "Drink"],
            ["restaurant", "Restaurant"],
            ["ingredient", "Ingredient"],
          ]}
        />
      </FormSection>
      <FormSection icon={<Utensils size={18} />} number="02" title="Subject and specifics" copy="The subject becomes its own entity. Preparation details describe the relationship rather than hiding it in a general note.">
        {category === "restaurant" ? (
          <Field label="Restaurant"><RestaurantSelect name="restaurantId" restaurants={data.restaurants} defaultValue={restaurantId} required /></Field>
        ) : (
          <div className="dx-two-column">
            <Field label={category === "activity" ? "Activity" : "Item name"}><input name="targetName" placeholder={preferencePlaceholder(category)} required /></Field>
            {category !== "activity" && <Field label="Brand or source"><input name="brand" placeholder="Optional" /></Field>}
          </div>
        )}
        <Field label="Preparation or ordering preference" hint="Examples: plain only, apples peeled, sauce on the side.">
          <textarea name="preparationPreference" placeholder="Plain only; no visible sauce" />
        </Field>
      </FormSection>
      <FormSection icon={<ShieldCheck size={18} />} number="03" title="Source and visibility" copy="Source makes it clear whether this was observed, stated by the person or passed through household knowledge.">
        <div className="dx-three-column">
          <Field label="Source">
            <select name="source" defaultValue="observed">
              <option value="observed">Observed</option>
              <option value="told_by_person">Told by the person</option>
              <option value="household_knowledge">Household knowledge</option>
            </select>
          </Field>
          <Field label="Last confirmed"><input name="lastConfirmedAt" type="date" /></Field>
          <Field label="Visibility">
            <select name="visibility" defaultValue="private">
              <option value="private">Only me</option>
              <option value="household">Household</option>
            </select>
          </Field>
        </div>
      </FormSection>
      <FormActions submitting={submitting} error={error} label="Save preference" />
    </form>
  );
}

type OrderLineDraft = {
  key: number;
  quantity: number;
  itemName: string;
  variant: string;
  modification: string;
  forPersonIds: string[];
};

function OrderForm({ householdId, data, restaurantId, personId, onClose, onSaved }: DomainCreatorProps) {
  const create = useMutation(api.domain.createOrderProfile);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scope, setScope] = useState<"household" | "person">(personId ? "person" : "household");
  const [lines, setLines] = useState<OrderLineDraft[]>([
    { key: 1, quantity: 1, itemName: "", variant: "", modification: "", forPersonIds: personId ? [personId] : [] },
  ]);

  function updateLine(key: number, patch: Partial<OrderLineDraft>) {
    setLines((current) => current.map((line) => line.key === key ? { ...line, ...patch } : line));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSubmitting(true);
    setError(null);
    try {
      await create({
        householdId,
        restaurantId: requiredId<"restaurants">(form, "restaurantId"),
        name: required(form, "name"),
        scope,
        personId: scope === "person" ? requiredId<"domainPeople">(form, "personId") : undefined,
        orderMethod: optional(form, "orderMethod") as OrderMethod | undefined,
        lines: lines.map((line) => ({
          quantity: line.quantity,
          itemName: line.itemName,
          variant: line.variant || undefined,
          modifications: line.modification.trim() ? [line.modification.trim()] : [],
          forPersonIds: line.forPersonIds as Id<"domainPeople">[],
        })),
      });
      onSaved?.();
      onClose();
    } catch (caught) {
      setError(errorText(caught));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="dx-entity-form" onSubmit={submit}>
      <FormSection icon={<Utensils size={18} />} number="01" title="Order profile" copy="An order profile belongs to a real restaurant and can represent the household’s usual order or one person’s regular choice.">
        <Field label="Restaurant"><RestaurantSelect name="restaurantId" restaurants={data.restaurants} defaultValue={restaurantId} required /></Field>
        <div className="dx-two-column">
          <Field label="Order name"><input name="name" placeholder="Usual family order" required autoFocus /></Field>
          <Field label="Preferred ordering method">
            <select name="orderMethod" defaultValue="direct_web">
              <option value="">Use restaurant default</option>
              <option value="direct_phone">Call directly</option>
              <option value="direct_web">Restaurant website</option>
              <option value="delivery_app">Delivery app</option>
              <option value="walk_in">Walk in</option>
              <option value="at_table">At the table</option>
              <option value="other">Other</option>
            </select>
          </Field>
        </div>
        <ChoiceGrid<"household" | "person">
          label="Who is this order for?"
          name="scopeChoice"
          defaultValue={scope}
          onChange={setScope}
          choices={[["household", "Whole household"], ["person", "One person"]]}
        />
        {scope === "person" && <Field label="Person"><PersonSelect name="personId" people={data.people} empty="Choose a person" defaultValue={personId} required /></Field>}
      </FormSection>
      <FormSection icon={<Utensils size={18} />} number="02" title="Order lines" copy="Each line has a quantity, item, variant, modification and the people it covers. No knowledge is buried in a paragraph.">
        <div className="dx-order-builder">
          {lines.map((line, index) => (
            <article className="dx-order-line" key={line.key}>
              <div className="dx-order-line-index">{index + 1}</div>
              <div className="dx-order-line-fields">
                <div className="dx-order-main-row">
                  <Field label="Qty"><input type="number" min="1" max="99" value={line.quantity} onChange={(event) => updateLine(line.key, { quantity: Number(event.target.value) })} /></Field>
                  <Field label="Menu item"><input value={line.itemName} onChange={(event) => updateLine(line.key, { itemName: event.target.value })} placeholder="Super Saver deal" required /></Field>
                  <Field label="Size or variant"><input value={line.variant} onChange={(event) => updateLine(line.key, { variant: event.target.value })} placeholder="Large" /></Field>
                </div>
                <Field label="Modification"><input value={line.modification} onChange={(event) => updateLine(line.key, { modification: event.target.value })} placeholder="No coriander on one meal" /></Field>
                <PersonCheckboxes people={data.people} value={line.forPersonIds} onChange={(forPersonIds) => updateLine(line.key, { forPersonIds })} />
              </div>
              <button className="dx-icon-button danger" type="button" onClick={() => setLines((current) => current.filter((item) => item.key !== line.key))} aria-label="Remove line"><Trash2 size={17} /></button>
            </article>
          ))}
          <button className="dx-add-row" type="button" onClick={() => setLines((current) => [...current, { key: Date.now(), quantity: 1, itemName: "", variant: "", modification: "", forPersonIds: [] }])}>
            <Plus size={17} /> Add order line
          </button>
        </div>
      </FormSection>
      <FormActions submitting={submitting} error={error} label="Save usual order" />
    </form>
  );
}

function FormSection({ icon, number, title, copy, children }: { icon: ReactNode; number: string; title: string; copy: string; children: ReactNode }) {
  return (
    <section className="dx-form-section">
      <header>
        <span className="dx-form-section-icon">{icon}</span>
        <div><small>{number}</small><h3>{title}</h3><p>{copy}</p></div>
      </header>
      <div className="dx-form-section-body">{children}</div>
    </section>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return <label className="dx-field"><span>{label}</span>{children}{hint && <small>{hint}</small>}</label>;
}

function ChoiceGrid<T extends string>({ label, name, choices, defaultValue, onChange }: { label: string; name: string; choices: Array<[T, string]>; defaultValue: T; onChange?: (value: T) => void }) {
  return (
    <fieldset className="dx-choice-fieldset">
      <legend>{label}</legend>
      <div className="dx-choice-grid">
        {choices.map(([value, text]) => (
          <label key={value}>
            <input type="radio" name={name} value={value} defaultChecked={value === defaultValue} onChange={() => onChange?.(value)} />
            <span>{text}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function CheckboxGrid<T extends string>({ label, choices, values, onChange }: { label: string; choices: Array<[T, string]>; values: T[]; onChange: (values: T[]) => void }) {
  return (
    <fieldset className="dx-choice-fieldset">
      <legend>{label}</legend>
      <div className="dx-choice-grid">
        {choices.map(([value, text]) => (
          <label key={value}>
            <input
              type="checkbox"
              checked={values.includes(value)}
              onChange={(event) => onChange(event.target.checked ? [...values, value] : values.filter((item) => item !== value))}
            />
            <span>{text}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function WeekdayPicker({ value, onChange }: { value: number[]; onChange: (days: number[]) => void }) {
  const days = [[1, "Mon"], [2, "Tue"], [3, "Wed"], [4, "Thu"], [5, "Fri"], [6, "Sat"], [0, "Sun"]] as const;
  return (
    <fieldset className="dx-choice-fieldset">
      <legend>Occurs on</legend>
      <div className="dx-weekday-grid">
        {days.map(([day, label]) => (
          <label key={day}>
            <input type="checkbox" checked={value.includes(day)} onChange={(event) => onChange(event.target.checked ? [...value, day] : value.filter((item) => item !== day))} />
            <span>{label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function PersonSelect({ name, people, empty, defaultValue, required: isRequired, value, onChange }: {
  name: string;
  people: DomainWorkspaceData["people"];
  empty: string;
  defaultValue?: Id<"domainPeople">;
  required?: boolean;
  value?: string;
  onChange?: (value: string) => void;
}) {
  return (
    <div className="dx-select-wrap">
      <select
        name={name}
        defaultValue={value === undefined ? defaultValue ?? "" : undefined}
        value={value}
        onChange={onChange ? (event) => onChange(event.target.value) : undefined}
        required={isRequired}
      >
        <option value="">{empty}</option>
        {people.map((person) => <option value={person.personId} key={person.personId}>{person.name}</option>)}
      </select>
      <ChevronDown size={16} />
    </div>
  );
}

function ResponsibilitySelect({ name, responsibilities, defaultValue }: { name: string; responsibilities: DomainWorkspaceData["responsibilities"]; defaultValue?: Id<"responsibilityAreas"> }) {
  return (
    <div className="dx-select-wrap"><select name={name} defaultValue={defaultValue ?? ""}><option value="">No responsibility</option>{responsibilities.map((item) => <option value={item.responsibilityId} key={item.responsibilityId}>{item.name}</option>)}</select><ChevronDown size={16} /></div>
  );
}

function RoutineSelect({ name, routines }: { name: string; routines: DomainWorkspaceData["routines"] }) {
  return <div className="dx-select-wrap"><select name={name} defaultValue=""><option value="">No routine</option>{routines.map((item) => <option value={item.routineId} key={item.routineId}>{item.name}</option>)}</select><ChevronDown size={16} /></div>;
}

function RestaurantSelect({ name, restaurants, defaultValue, required: isRequired }: { name: string; restaurants: DomainWorkspaceData["restaurants"]; defaultValue?: Id<"restaurants">; required?: boolean }) {
  return <div className="dx-select-wrap"><select name={name} defaultValue={defaultValue ?? ""} required={isRequired}><option value="">Choose a restaurant</option>{restaurants.map((item) => <option value={item.restaurantId} key={item.restaurantId}>{item.name}</option>)}</select><ChevronDown size={16} /></div>;
}

function PersonCheckboxes({ people, value, onChange }: { people: DomainWorkspaceData["people"]; value: string[]; onChange: (value: string[]) => void }) {
  return (
    <fieldset className="dx-person-checkboxes">
      <legend>People covered by this line</legend>
      <div>{people.map((person) => <label key={person.personId}><input type="checkbox" checked={value.includes(person.personId)} onChange={(event) => onChange(event.target.checked ? [...value, person.personId] : value.filter((id) => id !== person.personId))} /><span>{person.name}</span></label>)}</div>
    </fieldset>
  );
}

function FormActions({ submitting, error, label }: { submitting: boolean; error: string | null; label: string }) {
  return (
    <footer className="dx-form-actions">
      {error && <div className="dx-form-error"><CircleAlert size={17} /> {error}</div>}
      <button className="dx-primary-button" type="submit" disabled={submitting}>
        {submitting ? <LoaderCircle className="spin" size={18} /> : <Check size={18} />}
        {label}
      </button>
    </footer>
  );
}

function required(form: FormData, name: string): string {
  const value = String(form.get(name) ?? "").trim();
  if (!value) throw new Error("Complete the required fields.");
  return value;
}
function optional(form: FormData, name: string): string | undefined {
  const value = String(form.get(name) ?? "").trim();
  return value || undefined;
}
function idValue<T extends "domainPeople" | "responsibilityAreas" | "routineDefinitions" | "restaurants">(form: FormData, name: string): Id<T> | undefined {
  const value = optional(form, name);
  return value as Id<T> | undefined;
}
function requiredId<T extends "domainPeople" | "restaurants">(form: FormData, name: string): Id<T> {
  return required(form, name) as Id<T>;
}
function integerValue(form: FormData, name: string): number | undefined {
  const value = optional(form, name);
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.round(parsed) : undefined;
}
function dateValue(form: FormData, name: string): number | undefined {
  const value = optional(form, name);
  return value ? new Date(`${value}T12:00:00`).getTime() : undefined;
}
function dateTimeValue(form: FormData, name: string): number | undefined {
  const value = optional(form, name);
  return value ? new Date(value).getTime() : undefined;
}
function dateTimeFromDateAndTime(date: string, time?: string): number | undefined {
  const result = new Date(`${date}T${time || "09:00"}:00`).getTime();
  return Number.isFinite(result) ? result : undefined;
}
function errorText(caught: unknown): string {
  return caught instanceof Error ? caught.message : "Ordia could not save that yet.";
}
function preferencePlaceholder(category: PreferenceCategory): string {
  if (category === "meal") return "Macaroni cheese";
  if (category === "takeaway") return "Chicken nuggets";
  if (category === "snack") return "Apples";
  if (category === "activity") return "Swimming";
  if (category === "drink") return "Warm milk";
  return "Coriander";
}

"use client";

import {
  Activity,
  BookOpen,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  Circle,
  ClipboardList,
  Copy,
  FolderKanban,
  GlassWater,
  Heart,
  Home,
  Library,
  Lightbulb,
  Link2,
  LoaderCircle,
  MapPin,
  Package,
  Pause,
  Play,
  Plus,
  Repeat2,
  ShoppingBag,
  Sparkles,
  StickyNote,
  UserRoundPlus,
  UsersRound,
  Utensils,
} from "lucide-react";
import { FormEvent, ReactNode, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

export type ConnectedWorkspaceProps = {
  householdId: Id<"households">;
  householdName: string;
  role: "owner" | "admin" | "member";
};

type Tab = "today" | "capture" | "responsibilities" | "people" | "library" | "household";
type CaptureType =
  | "task"
  | "responsibility"
  | "routine"
  | "person"
  | "preference"
  | "library"
  | "playbook";
type KnowledgeKind =
  | "place"
  | "thing"
  | "meal"
  | "restaurant"
  | "takeaway"
  | "snack"
  | "activity"
  | "drink"
  | "ingredient"
  | "product"
  | "service"
  | "fact"
  | "decision"
  | "note";
type PreferenceKind =
  | "favourite"
  | "likes"
  | "usually"
  | "dislikes"
  | "avoids"
  | "needs"
  | "only_if";

type Person = {
  personId: Id<"householdPeople">;
  name: string;
  relationship?: string;
  birthDate?: string;
  note?: string;
  visibility: "private" | "household";
  isMine: boolean;
};

type Responsibility = {
  responsibilityId: Id<"responsibilities">;
  name: string;
  description?: string;
  status: "active" | "paused";
  ownerPersonId?: Id<"householdPeople">;
  nextDueAt?: number;
};

type Routine = {
  routineId: Id<"routines">;
  name: string;
  description?: string;
  scheduleText: string;
  steps: string[];
  status: "active" | "paused";
  responsibilityId?: Id<"responsibilities">;
  personId?: Id<"householdPeople">;
  nextDueAt?: number;
};

type Task = {
  taskId: Id<"tasks">;
  title: string;
  notes?: string;
  status: "open" | "done";
  dueAt?: number;
  completedAt?: number;
  responsibilityId?: Id<"responsibilities">;
  routineId?: Id<"routines">;
  personId?: Id<"householdPeople">;
  ownerPersonId?: Id<"householdPeople">;
};

type KnowledgeItem = {
  itemId: Id<"knowledgeItems">;
  kind: KnowledgeKind;
  name: string;
  detail?: string;
};

type Preference = {
  preferenceId: Id<"preferences">;
  personId?: Id<"householdPeople">;
  subjectItemId?: Id<"knowledgeItems">;
  subjectName: string;
  kind: PreferenceKind;
  detail?: string;
  visibility: "private" | "household";
  isMine: boolean;
};

type Playbook = {
  playbookId: Id<"playbooks">;
  name: string;
  notes?: string;
  steps: string[];
  linkedItemId?: Id<"knowledgeItems">;
  responsibilityId?: Id<"responsibilities">;
};

type Overview = {
  people: Person[];
  responsibilities: Responsibility[];
  routines: Routine[];
  tasks: Task[];
  knowledgeItems: KnowledgeItem[];
  preferences: Preference[];
  playbooks: Playbook[];
};

const tabs: Array<{ id: Tab; label: string; icon: typeof Home }> = [
  { id: "today", label: "Today", icon: CalendarDays },
  { id: "capture", label: "Capture", icon: Sparkles },
  { id: "responsibilities", label: "Responsibilities", icon: FolderKanban },
  { id: "people", label: "People", icon: UsersRound },
  { id: "library", label: "Library", icon: Library },
  { id: "household", label: "Household", icon: Home },
];

const captureTypes: Array<{ id: CaptureType; label: string; description: string }> = [
  { id: "task", label: "Task", description: "One concrete action with a finish line." },
  {
    id: "responsibility",
    label: "Responsibility",
    description: "An ongoing area that needs stewardship.",
  },
  { id: "routine", label: "Routine", description: "A repeated household process." },
  { id: "person", label: "Person", description: "Your record of someone in household life." },
  {
    id: "preference",
    label: "Preference",
    description: "How someone likes, avoids or needs something.",
  },
  {
    id: "library",
    label: "Place or thing",
    description: "A reusable reference item such as a restaurant or car.",
  },
  {
    id: "playbook",
    label: "Playbook",
    description: "Practical knowledge for how your household handles something.",
  },
];

const knowledgeLabels: Record<KnowledgeKind, string> = {
  place: "Place",
  thing: "Thing",
  meal: "Meal",
  restaurant: "Restaurant",
  takeaway: "Takeaway",
  snack: "Snack",
  activity: "Activity",
  drink: "Drink",
  ingredient: "Ingredient",
  product: "Product",
  service: "Service",
  fact: "Fact",
  decision: "Decision",
  note: "Note",
};

const preferenceLabels: Record<PreferenceKind, string> = {
  favourite: "Favourite",
  likes: "Likes",
  usually: "Usually chooses",
  dislikes: "Dislikes",
  avoids: "Avoids",
  needs: "Needs",
  only_if: "Only if",
};

export function ConnectedWorkspace({
  householdId,
  householdName,
  role,
}: ConnectedWorkspaceProps) {
  const overview = useQuery(api.ordia.overview, { householdId }) as Overview | undefined;
  const [tab, setTab] = useState<Tab>("today");
  const [captureType, setCaptureType] = useState<CaptureType>("task");
  const [selectedResponsibilityId, setSelectedResponsibilityId] =
    useState<Id<"responsibilities"> | null>(null);
  const [selectedPersonId, setSelectedPersonId] = useState<Id<"householdPeople"> | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<Id<"knowledgeItems"> | null>(null);

  if (overview === undefined) {
    return (
      <section className="ordia-loading-card">
        <LoaderCircle className="spin" size={22} />
        Building your household map…
      </section>
    );
  }

  function openCapture(type: CaptureType) {
    setCaptureType(type);
    setTab("capture");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="ordia-product-shell">
      <div className="ordia-product-bar">
        <div>
          <span className="ordia-product-eyebrow">{householdName}</span>
          <strong>{tabLabel(tab)}</strong>
        </div>
        <button className="ordia-add-button" type="button" onClick={() => openCapture("task")}>
          <Plus size={18} /> Add
        </button>
      </div>

      <div className="ordia-product-layout">
        <nav className="ordia-side-nav" aria-label="Ordia sections">
          {tabs.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                className={tab === item.id ? "active" : ""}
                type="button"
                onClick={() => setTab(item.id)}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <section className="ordia-view">
          {tab === "today" && (
            <TodayView overview={overview} householdId={householdId} onCapture={openCapture} />
          )}
          {tab === "capture" && (
            <CaptureView
              householdId={householdId}
              overview={overview}
              captureType={captureType}
              setCaptureType={setCaptureType}
            />
          )}
          {tab === "responsibilities" && (
            <ResponsibilitiesView
              householdId={householdId}
              overview={overview}
              selectedId={selectedResponsibilityId}
              setSelectedId={setSelectedResponsibilityId}
              onCapture={openCapture}
            />
          )}
          {tab === "people" && (
            <PeopleView
              overview={overview}
              selectedId={selectedPersonId}
              setSelectedId={setSelectedPersonId}
              onCapture={openCapture}
            />
          )}
          {tab === "library" && (
            <LibraryView
              overview={overview}
              selectedId={selectedItemId}
              setSelectedId={setSelectedItemId}
              onCapture={openCapture}
            />
          )}
          {tab === "household" && (
            <HouseholdView householdId={householdId} householdName={householdName} role={role} />
          )}
        </section>
      </div>

      <nav className="ordia-bottom-nav" aria-label="Ordia sections">
        {tabs.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              className={tab === item.id ? "active" : ""}
              type="button"
              onClick={() => setTab(item.id)}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

function TodayView({
  overview,
  householdId,
  onCapture,
}: {
  overview: Overview;
  householdId: Id<"households">;
  onCapture: (type: CaptureType) => void;
}) {
  const setTaskStatus = useMutation(api.ordia.setTaskStatus);
  const today = startOfDay(Date.now());
  const tomorrow = addDays(today, 1);
  const nextWeek = addDays(today, 7);
  const openTasks = overview.tasks.filter((task) => task.status === "open");
  const overdue = openTasks.filter((task) => task.dueAt !== undefined && task.dueAt < today);
  const dueToday = openTasks.filter(
    (task) => task.dueAt !== undefined && task.dueAt >= today && task.dueAt < tomorrow,
  );
  const upcoming = openTasks.filter(
    (task) => task.dueAt !== undefined && task.dueAt >= tomorrow && task.dueAt < nextWeek,
  );
  const unscheduled = openTasks.filter((task) => task.dueAt === undefined);
  const activeRoutines = overview.routines.filter((routine) => routine.status === "active").slice(0, 4);
  const bestNext = overdue[0] ?? dueToday[0] ?? upcoming[0] ?? unscheduled[0];

  async function complete(taskId: Id<"tasks">) {
    await setTaskStatus({ householdId, taskId, status: "done" });
  }

  return (
    <div className="ordia-page-stack">
      <PageIntro
        kicker="Household attention"
        title="Today"
        copy="The useful edge of everything Ordia knows: what needs attention, what repeats and what can be closed next."
        action={
          <button className="ordia-primary" type="button" onClick={() => onCapture("task")}>
            <Plus size={18} /> Capture a task
          </button>
        }
      />

      <div className="ordia-stat-grid">
        <StatCard label="Open tasks" value={openTasks.length} detail="Across this household" />
        <StatCard label="Due today" value={dueToday.length} detail="Needs attention now" />
        <StatCard label="Active routines" value={overview.routines.filter((r) => r.status === "active").length} detail="Repeated processes" />
        <StatCard label="Responsibilities" value={overview.responsibilities.filter((r) => r.status === "active").length} detail="Areas being held" />
      </div>

      {bestNext && (
        <section className="ordia-best-next">
          <div className="ordia-best-icon"><Sparkles size={20} /></div>
          <div>
            <span>Best next action</span>
            <strong>{bestNext.title}</strong>
            <small>{taskContext(bestNext, overview)}</small>
          </div>
          <button type="button" onClick={() => void complete(bestNext.taskId)}>
            <Check size={18} /> Done
          </button>
        </section>
      )}

      <div className="ordia-two-column">
        <section className="ordia-card">
          <SectionHeading icon={<ClipboardList size={20} />} title="Tasks" count={openTasks.length} />
          {openTasks.length === 0 ? (
            <EmptyState
              title="Nothing is asking for action"
              copy="Capture a concrete task or create a responsibility to start building household context."
              action="Add a task"
              onAction={() => onCapture("task")}
            />
          ) : (
            <div className="ordia-task-groups">
              <TaskGroup title="Overdue" tasks={overdue} overview={overview} onComplete={complete} />
              <TaskGroup title="Today" tasks={dueToday} overview={overview} onComplete={complete} />
              <TaskGroup title="Next seven days" tasks={upcoming} overview={overview} onComplete={complete} />
              <TaskGroup title="No date" tasks={unscheduled} overview={overview} onComplete={complete} />
            </div>
          )}
        </section>

        <section className="ordia-card">
          <SectionHeading icon={<Repeat2 size={20} />} title="Routines in motion" count={activeRoutines.length} />
          {activeRoutines.length === 0 ? (
            <EmptyState
              title="No routines yet"
              copy="Turn repeated knowledge—bin day, nursery pickup, bedtime—into a reusable process."
              action="Create a routine"
              onAction={() => onCapture("routine")}
            />
          ) : (
            <div className="ordia-list">
              {activeRoutines.map((routine) => (
                <article className="ordia-list-row" key={routine.routineId}>
                  <div className="ordia-round-icon"><Repeat2 size={17} /></div>
                  <div>
                    <strong>{routine.name}</strong>
                    <span>{routine.scheduleText}</span>
                    <small>{routine.steps.length} saved step{routine.steps.length === 1 ? "" : "s"}</small>
                  </div>
                  <DatePill value={routine.nextDueAt} fallback="Active" />
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function CaptureView({
  householdId,
  overview,
  captureType,
  setCaptureType,
}: {
  householdId: Id<"households">;
  overview: Overview;
  captureType: CaptureType;
  setCaptureType: (type: CaptureType) => void;
}) {
  const createTask = useMutation(api.ordia.createTask);
  const createResponsibility = useMutation(api.ordia.createResponsibility);
  const createRoutine = useMutation(api.ordia.createRoutine);
  const createPerson = useMutation(api.ordia.createPerson);
  const createKnowledgeItem = useMutation(api.ordia.createKnowledgeItem);
  const createPreference = useMutation(api.ordia.createPreference);
  const createPlaybook = useMutation(api.ordia.createPlaybook);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setSubmitting(true);
    setMessage(null);
    setError(null);

    try {
      if (captureType === "task") {
        await createTask({
          householdId,
          title: value(data, "title"),
          notes: optionalValue(data, "notes"),
          dueAt: dateValue(data, "dueAt"),
          responsibilityId: idValue<"responsibilities">(data, "responsibilityId"),
          routineId: idValue<"routines">(data, "routineId"),
          personId: idValue<"householdPeople">(data, "personId"),
          ownerPersonId: idValue<"householdPeople">(data, "ownerPersonId"),
        });
      } else if (captureType === "responsibility") {
        await createResponsibility({
          householdId,
          name: value(data, "name"),
          description: optionalValue(data, "description"),
          ownerPersonId: idValue<"householdPeople">(data, "ownerPersonId"),
          nextDueAt: dateValue(data, "nextDueAt"),
        });
      } else if (captureType === "routine") {
        await createRoutine({
          householdId,
          name: value(data, "name"),
          description: optionalValue(data, "description"),
          scheduleText: value(data, "scheduleText"),
          steps: linesValue(data, "steps"),
          responsibilityId: idValue<"responsibilities">(data, "responsibilityId"),
          personId: idValue<"householdPeople">(data, "personId"),
          nextDueAt: dateValue(data, "nextDueAt"),
        });
      } else if (captureType === "person") {
        await createPerson({
          householdId,
          name: value(data, "name"),
          relationship: optionalValue(data, "relationship"),
          birthDate: optionalValue(data, "birthDate"),
          note: optionalValue(data, "note"),
          visibility: value(data, "visibility") === "household" ? "household" : "private",
        });
      } else if (captureType === "library") {
        await createKnowledgeItem({
          householdId,
          kind: value(data, "kind") as KnowledgeKind,
          name: value(data, "name"),
          detail: optionalValue(data, "detail"),
        });
      } else if (captureType === "preference") {
        const subjectItemId = idValue<"knowledgeItems">(data, "subjectItemId");
        const linkedItem = overview.knowledgeItems.find((item) => item.itemId === subjectItemId);
        await createPreference({
          householdId,
          personId: idValue<"householdPeople">(data, "personId"),
          subjectItemId,
          subjectName: linkedItem?.name ?? value(data, "subjectName"),
          kind: value(data, "preferenceKind") as PreferenceKind,
          detail: optionalValue(data, "detail"),
          visibility: value(data, "visibility") === "household" ? "household" : "private",
        });
      } else {
        await createPlaybook({
          householdId,
          name: value(data, "name"),
          notes: optionalValue(data, "notes"),
          steps: linesValue(data, "steps"),
          linkedItemId: idValue<"knowledgeItems">(data, "linkedItemId"),
          responsibilityId: idValue<"responsibilities">(data, "responsibilityId"),
        });
      }
      form.reset();
      setMessage(`${captureTypes.find((item) => item.id === captureType)?.label ?? "Item"} saved and linked to this household.`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Ordia could not save that yet.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="ordia-page-stack">
      <PageIntro
        kicker="Get it out of your head"
        title="Capture"
        copy="Start with the thing you know. Add connections now or later; useful information should never require a perfect filing decision."
      />

      <div className="ordia-capture-layout">
        <div className="ordia-capture-types">
          {captureTypes.map((item) => (
            <button
              key={item.id}
              className={captureType === item.id ? "active" : ""}
              type="button"
              onClick={() => {
                setCaptureType(item.id);
                setMessage(null);
                setError(null);
              }}
            >
              <strong>{item.label}</strong>
              <span>{item.description}</span>
            </button>
          ))}
        </div>

        <form className="ordia-capture-card" onSubmit={handleSubmit}>
          <div className="ordia-capture-heading">
            <span className="ordia-round-icon"><CaptureIcon type={captureType} /></span>
            <div>
              <span>New {captureTypes.find((item) => item.id === captureType)?.label.toLowerCase()}</span>
              <h2>{capturePrompt(captureType)}</h2>
            </div>
          </div>

          <CaptureFields type={captureType} overview={overview} />

          {error && <div className="form-error">{error}</div>}
          {message && <div className="ordia-success"><CheckCircle2 size={18} /> {message}</div>}
          <button className="ordia-primary ordia-save" disabled={submitting} type="submit">
            {submitting ? <LoaderCircle className="spin" size={18} /> : <Check size={18} />}
            Save to Ordia
          </button>
        </form>
      </div>
    </div>
  );
}

function CaptureFields({ type, overview }: { type: CaptureType; overview: Overview }) {
  if (type === "task") {
    return (
      <div className="ordia-form-grid">
        <Field label="What needs doing?" wide><input name="title" placeholder="Book the car MOT" required /></Field>
        <Field label="Due date"><input name="dueAt" type="date" /></Field>
        <Field label="Responsibility"><EntitySelect name="responsibilityId" empty="No responsibility" items={overview.responsibilities.map((item) => ({ id: item.responsibilityId, label: item.name }))} /></Field>
        <Field label="Generated by routine"><EntitySelect name="routineId" empty="No routine" items={overview.routines.map((item) => ({ id: item.routineId, label: item.name }))} /></Field>
        <Field label="Concerns"><EntitySelect name="personId" empty="No person" items={overview.people.map((item) => ({ id: item.personId, label: item.name }))} /></Field>
        <Field label="Owner"><EntitySelect name="ownerPersonId" empty="Unassigned" items={overview.people.map((item) => ({ id: item.personId, label: item.name }))} /></Field>
        <Field label="Useful detail" wide><textarea name="notes" placeholder="Anything needed to complete it without asking someone else" /></Field>
      </div>
    );
  }

  if (type === "responsibility") {
    return (
      <div className="ordia-form-grid">
        <Field label="Responsibility name" wide><input name="name" placeholder="Car maintenance" required /></Field>
        <Field label="Steward"><EntitySelect name="ownerPersonId" empty="No named owner" items={overview.people.map((item) => ({ id: item.personId, label: item.name }))} /></Field>
        <Field label="Next important date"><input name="nextDueAt" type="date" /></Field>
        <Field label="What does this area cover?" wide><textarea name="description" placeholder="MOT, servicing, tyres, insurance, repairs and useful garage knowledge" /></Field>
      </div>
    );
  }

  if (type === "routine") {
    return (
      <div className="ordia-form-grid">
        <Field label="Routine name" wide><input name="name" placeholder="Bin day" required /></Field>
        <Field label="Schedule"><input name="scheduleText" placeholder="Every Wednesday; black and green alternate" required /></Field>
        <Field label="Next occurrence"><input name="nextDueAt" type="date" /></Field>
        <Field label="Responsibility"><EntitySelect name="responsibilityId" empty="No responsibility" items={overview.responsibilities.map((item) => ({ id: item.responsibilityId, label: item.name }))} /></Field>
        <Field label="Person"><EntitySelect name="personId" empty="No person" items={overview.people.map((item) => ({ id: item.personId, label: item.name }))} /></Field>
        <Field label="Why or when does this happen?" wide><textarea name="description" placeholder="Alternating household waste collection" /></Field>
        <Field label="Steps — one per line" wide><textarea name="steps" placeholder={"Check which bin is due\nEmpty indoor bins\nPut the correct bin out Tuesday evening\nBring it back Wednesday evening"} /></Field>
      </div>
    );
  }

  if (type === "person") {
    return (
      <div className="ordia-form-grid">
        <Field label="Name"><input name="name" placeholder="Spencer" required /></Field>
        <Field label="Relationship"><input name="relationship" placeholder="Child, partner, grandparent…" /></Field>
        <Field label="Date of birth"><input name="birthDate" type="date" /></Field>
        <Field label="Who can see this record?"><select name="visibility" defaultValue="private"><option value="private">Only me</option><option value="household">Household members</option></select></Field>
        <Field label="Useful context" wide><textarea name="note" placeholder="Anything worth retaining about this person" /></Field>
        <div className="ordia-privacy-note"><Lightbulb size={17} /><span>Inviting this person later will not automatically reveal a private record or private preferences you created about them.</span></div>
      </div>
    );
  }

  if (type === "preference") {
    return (
      <div className="ordia-form-grid">
        <Field label="Whose preference?"><EntitySelect name="personId" empty="Whole household" items={overview.people.map((item) => ({ id: item.personId, label: item.name }))} /></Field>
        <Field label="Relationship"><select name="preferenceKind" defaultValue="favourite">{Object.entries(preferenceLabels).map(([id, label]) => <option value={id} key={id}>{label}</option>)}</select></Field>
        <Field label="Link to an existing item" wide><EntitySelect name="subjectItemId" empty="Enter a new subject below" items={overview.knowledgeItems.map((item) => ({ id: item.itemId, label: `${item.name} · ${knowledgeLabels[item.kind]}` }))} /></Field>
        <Field label="Subject"><input name="subjectName" placeholder="Chicken nuggets" /></Field>
        <Field label="Who can see it?"><select name="visibility" defaultValue="private"><option value="private">Only me</option><option value="household">Household members</option></select></Field>
        <Field label="Specifics" wide><textarea name="detail" placeholder="Plain only; no visible sauce" /></Field>
      </div>
    );
  }

  if (type === "library") {
    return (
      <div className="ordia-form-grid">
        <Field label="Type"><select name="kind" defaultValue="place">{Object.entries(knowledgeLabels).map(([id, label]) => <option value={id} key={id}>{label}</option>)}</select></Field>
        <Field label="Name"><input name="name" placeholder="Mario’s" required /></Field>
        <Field label="What should the household know?" wide><textarea name="detail" placeholder="Italian restaurant; order direct; parking behind the library" /></Field>
      </div>
    );
  }

  return (
    <div className="ordia-form-grid">
      <Field label="Playbook name" wide><input name="name" placeholder="Usual family order at Mario’s" required /></Field>
      <Field label="Linked place or thing"><EntitySelect name="linkedItemId" empty="No linked library item" items={overview.knowledgeItems.map((item) => ({ id: item.itemId, label: item.name }))} /></Field>
      <Field label="Responsibility"><EntitySelect name="responsibilityId" empty="No responsibility" items={overview.responsibilities.map((item) => ({ id: item.responsibilityId, label: item.name }))} /></Field>
      <Field label="Steps or components — one per line" wide><textarea name="steps" placeholder={"3 × Super Saver deal\n1 × extra fries\nNo coriander on Victoria’s meal\nOrder direct rather than through an app"} /></Field>
      <Field label="Supporting knowledge" wide><textarea name="notes" placeholder="Why this works, exceptions, prices or reminders" /></Field>
    </div>
  );
}

function ResponsibilitiesView({
  householdId,
  overview,
  selectedId,
  setSelectedId,
  onCapture,
}: {
  householdId: Id<"households">;
  overview: Overview;
  selectedId: Id<"responsibilities"> | null;
  setSelectedId: (id: Id<"responsibilities"> | null) => void;
  onCapture: (type: CaptureType) => void;
}) {
  const setStatus = useMutation(api.ordia.setResponsibilityStatus);
  const selected = overview.responsibilities.find((item) => item.responsibilityId === selectedId) ?? null;

  if (selected) {
    const owner = overview.people.find((person) => person.personId === selected.ownerPersonId);
    const tasks = overview.tasks.filter((task) => task.responsibilityId === selected.responsibilityId);
    const routines = overview.routines.filter((routine) => routine.responsibilityId === selected.responsibilityId);
    const playbooks = overview.playbooks.filter((playbook) => playbook.responsibilityId === selected.responsibilityId);
    return (
      <div className="ordia-page-stack">
        <button className="ordia-back" type="button" onClick={() => setSelectedId(null)}>← All responsibilities</button>
        <PageIntro
          kicker="Responsibility"
          title={selected.name}
          copy={selected.description ?? "An ongoing area of household life."}
          action={
            <button
              className="ordia-secondary"
              type="button"
              onClick={() => void setStatus({ householdId, responsibilityId: selected.responsibilityId, status: selected.status === "active" ? "paused" : "active" })}
            >
              {selected.status === "active" ? <Pause size={17} /> : <Play size={17} />}
              {selected.status === "active" ? "Pause" : "Reactivate"}
            </button>
          }
        />
        <div className="ordia-detail-facts">
          <Fact label="Steward" value={owner?.name ?? "No named owner"} />
          <Fact label="Status" value={selected.status} />
          <Fact label="Next date" value={formatDate(selected.nextDueAt, "Not scheduled")} />
          <Fact label="Connected records" value={`${tasks.length + routines.length + playbooks.length}`} />
        </div>
        <div className="ordia-two-column">
          <DetailSection title="Tasks" icon={<ClipboardList size={19} />} empty="No tasks linked yet.">
            {tasks.map((task) => <CompactRecord key={task.taskId} title={task.title} meta={formatDate(task.dueAt, task.status)} />)}
          </DetailSection>
          <DetailSection title="Routines" icon={<Repeat2 size={19} />} empty="No routines linked yet.">
            {routines.map((routine) => <CompactRecord key={routine.routineId} title={routine.name} meta={routine.scheduleText} />)}
          </DetailSection>
        </div>
        <DetailSection title="Playbooks" icon={<BookOpen size={19} />} empty="No practical know-how linked yet.">
          {playbooks.map((playbook) => <CompactRecord key={playbook.playbookId} title={playbook.name} meta={`${playbook.steps.length} steps`} />)}
        </DetailSection>
      </div>
    );
  }

  return (
    <div className="ordia-page-stack">
      <PageIntro
        kicker="Ongoing stewardship"
        title="Responsibilities"
        copy="Durable areas of household life. Tasks finish; responsibilities remain visible so knowledge and ownership do not disappear with the last checkbox."
        action={<button className="ordia-primary" type="button" onClick={() => onCapture("responsibility")}><Plus size={18} /> New responsibility</button>}
      />
      {overview.responsibilities.length === 0 ? (
        <EmptyState title="Create the first responsibility" copy="Try car maintenance, nursery, food planning, bills, birthdays or household waste." action="Add responsibility" onAction={() => onCapture("responsibility")} />
      ) : (
        <div className="ordia-entity-grid">
          {overview.responsibilities.map((responsibility) => {
            const owner = overview.people.find((person) => person.personId === responsibility.ownerPersonId);
            const taskCount = overview.tasks.filter((task) => task.responsibilityId === responsibility.responsibilityId && task.status === "open").length;
            const routineCount = overview.routines.filter((routine) => routine.responsibilityId === responsibility.responsibilityId).length;
            return (
              <button className="ordia-entity-card" type="button" key={responsibility.responsibilityId} onClick={() => setSelectedId(responsibility.responsibilityId)}>
                <div className="ordia-entity-card-top"><span className="ordia-round-icon"><FolderKanban size={18} /></span><StatusPill status={responsibility.status} /></div>
                <h3>{responsibility.name}</h3>
                <p>{responsibility.description ?? "No description yet."}</p>
                <div className="ordia-card-owner"><span>{owner?.name ?? "Unassigned"}</span><DatePill value={responsibility.nextDueAt} fallback="No next date" /></div>
                <div className="ordia-card-metrics"><span>{routineCount} routines</span><span>{taskCount} open tasks</span><ChevronRight size={17} /></div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function PeopleView({
  overview,
  selectedId,
  setSelectedId,
  onCapture,
}: {
  overview: Overview;
  selectedId: Id<"householdPeople"> | null;
  setSelectedId: (id: Id<"householdPeople"> | null) => void;
  onCapture: (type: CaptureType) => void;
}) {
  const selected = overview.people.find((person) => person.personId === selectedId) ?? null;

  if (selected) {
    const preferences = overview.preferences.filter((preference) => preference.personId === selected.personId);
    const favourites = preferences.filter((preference) => preference.kind === "favourite");
    const tasks = overview.tasks.filter((task) => task.personId === selected.personId || task.ownerPersonId === selected.personId);
    const routines = overview.routines.filter((routine) => routine.personId === selected.personId);
    return (
      <div className="ordia-page-stack">
        <button className="ordia-back" type="button" onClick={() => setSelectedId(null)}>← All people</button>
        <section className="ordia-person-hero">
          <div className="ordia-person-avatar large">{initials(selected.name)}</div>
          <div><span className="ordia-product-eyebrow">{selected.relationship ?? "Person"}</span><h1>{selected.name}</h1><p>{selected.note ?? "A person in your household knowledge map."}</p></div>
          <span className="ordia-privacy-pill">{selected.visibility === "private" ? "Only you" : "Household"}</span>
        </section>
        <div className="ordia-two-column">
          <DetailSection title="Favourites" icon={<Heart size={19} />} empty="No favourites captured yet.">
            {favourites.map((preference) => <CompactRecord key={preference.preferenceId} title={preference.subjectName} meta={preference.detail ?? "Favourite"} />)}
          </DetailSection>
          <DetailSection title="Preferences and needs" icon={<Sparkles size={19} />} empty="No preferences captured yet.">
            {preferences.filter((item) => item.kind !== "favourite").map((preference) => <CompactRecord key={preference.preferenceId} title={`${preferenceLabels[preference.kind]} ${preference.subjectName}`} meta={preference.detail ?? "No detail"} />)}
          </DetailSection>
          <DetailSection title="Routines" icon={<Repeat2 size={19} />} empty="No routines connected.">
            {routines.map((routine) => <CompactRecord key={routine.routineId} title={routine.name} meta={routine.scheduleText} />)}
          </DetailSection>
          <DetailSection title="Tasks" icon={<ClipboardList size={19} />} empty="No tasks connected.">
            {tasks.map((task) => <CompactRecord key={task.taskId} title={task.title} meta={formatDate(task.dueAt, task.status)} />)}
          </DetailSection>
        </div>
      </div>
    );
  }

  return (
    <div className="ordia-page-stack">
      <PageIntro kicker="Knowledge centred on people" title="People" copy="Create useful household records whether or not someone uses Ordia. Private records remain yours unless you explicitly share them." action={<button className="ordia-primary" type="button" onClick={() => onCapture("person")}><Plus size={18} /> Add person</button>} />
      {overview.people.length === 0 ? (
        <EmptyState title="Add someone you organise life around" copy="A person can have favourites, needs, routines and linked tasks without needing an Ordia account." action="Add person" onAction={() => onCapture("person")} />
      ) : (
        <div className="ordia-people-grid">
          {overview.people.map((person) => {
            const preferenceCount = overview.preferences.filter((preference) => preference.personId === person.personId).length;
            const routineCount = overview.routines.filter((routine) => routine.personId === person.personId).length;
            return (
              <button className="ordia-person-card" type="button" key={person.personId} onClick={() => setSelectedId(person.personId)}>
                <div className="ordia-person-avatar">{initials(person.name)}</div>
                <div><strong>{person.name}</strong><span>{person.relationship ?? "Person"}</span></div>
                <small>{preferenceCount} preferences · {routineCount} routines</small>
                <span className="ordia-mini-privacy">{person.visibility === "private" ? "Private" : "Shared"}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function LibraryView({
  overview,
  selectedId,
  setSelectedId,
  onCapture,
}: {
  overview: Overview;
  selectedId: Id<"knowledgeItems"> | null;
  setSelectedId: (id: Id<"knowledgeItems"> | null) => void;
  onCapture: (type: CaptureType) => void;
}) {
  const selected = overview.knowledgeItems.find((item) => item.itemId === selectedId) ?? null;

  if (selected) {
    const preferences = overview.preferences.filter((preference) => preference.subjectItemId === selected.itemId);
    const playbooks = overview.playbooks.filter((playbook) => playbook.linkedItemId === selected.itemId);
    return (
      <div className="ordia-page-stack">
        <button className="ordia-back" type="button" onClick={() => setSelectedId(null)}>← Library</button>
        <PageIntro kicker={knowledgeLabels[selected.kind]} title={selected.name} copy={selected.detail ?? "A connected household reference item."} />
        <div className="ordia-two-column">
          <DetailSection title="Who relates to this" icon={<UsersRound size={19} />} empty="No preferences linked yet.">
            {preferences.map((preference) => {
              const person = overview.people.find((item) => item.personId === preference.personId);
              return <CompactRecord key={preference.preferenceId} title={person?.name ?? "Household"} meta={`${preferenceLabels[preference.kind]}${preference.detail ? ` · ${preference.detail}` : ""}`} />;
            })}
          </DetailSection>
          <DetailSection title="Playbooks" icon={<BookOpen size={19} />} empty="No playbook linked yet.">
            {playbooks.map((playbook) => <CompactRecord key={playbook.playbookId} title={playbook.name} meta={`${playbook.steps.length} saved steps`} />)}
          </DetailSection>
        </div>
        {playbooks.map((playbook) => (
          <section className="ordia-card" key={playbook.playbookId}>
            <SectionHeading icon={<BookOpen size={20} />} title={playbook.name} count={playbook.steps.length} />
            {playbook.notes && <p className="ordia-muted-copy">{playbook.notes}</p>}
            <ol className="ordia-step-list">{playbook.steps.map((step, index) => <li key={`${playbook.playbookId}-${index}`}><span>{index + 1}</span>{step}</li>)}</ol>
          </section>
        ))}
      </div>
    );
  }

  return (
    <div className="ordia-page-stack">
      <PageIntro kicker="Household memory" title="Library" copy="Places, things, meals, services, facts and decisions become useful when Ordia can show every preference and playbook connected to them." action={<div className="ordia-action-pair"><button className="ordia-secondary" type="button" onClick={() => onCapture("playbook")}><BookOpen size={17} /> Playbook</button><button className="ordia-primary" type="button" onClick={() => onCapture("library")}><Plus size={18} /> Add item</button></div>} />
      {overview.knowledgeItems.length === 0 && overview.playbooks.length === 0 ? (
        <EmptyState title="Build reusable household memory" copy="Add a restaurant, car, meal or service—then connect preferences and practical playbooks to it." action="Add a library item" onAction={() => onCapture("library")} />
      ) : (
        <>
          <div className="ordia-library-grid">
            {overview.knowledgeItems.map((item) => {
              const preferenceCount = overview.preferences.filter((preference) => preference.subjectItemId === item.itemId).length;
              const playbookCount = overview.playbooks.filter((playbook) => playbook.linkedItemId === item.itemId).length;
              return (
                <button className="ordia-library-card" type="button" key={item.itemId} onClick={() => setSelectedId(item.itemId)}>
                  <span className="ordia-library-icon"><KnowledgeIcon kind={item.kind} /></span>
                  <div><small>{knowledgeLabels[item.kind]}</small><h3>{item.name}</h3><p>{item.detail ?? "No detail yet."}</p></div>
                  <footer><span>{preferenceCount} preferences</span><span>{playbookCount} playbooks</span><ChevronRight size={17} /></footer>
                </button>
              );
            })}
          </div>
          {overview.playbooks.length > 0 && (
            <section className="ordia-card">
              <SectionHeading icon={<BookOpen size={20} />} title="Playbooks" count={overview.playbooks.length} />
              <div className="ordia-list">{overview.playbooks.map((playbook) => <article className="ordia-list-row" key={playbook.playbookId}><span className="ordia-round-icon"><BookOpen size={17} /></span><div><strong>{playbook.name}</strong><span>{playbook.notes ?? "Reusable practical household knowledge"}</span></div><small>{playbook.steps.length} steps</small></article>)}</div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

function HouseholdView({
  householdId,
  householdName,
  role,
}: {
  householdId: Id<"households">;
  householdName: string;
  role: "owner" | "admin" | "member";
}) {
  const members = useQuery(api.households.listMembers, { householdId });
  const [now] = useState(() => Date.now());
  const canInvite = role === "owner" || role === "admin";
  const invitations = useQuery(
    api.invitations.listForHousehold,
    canInvite ? { householdId, now } : "skip",
  );
  const createInvitation = useMutation(api.invitations.create);
  const revokeInvitation = useMutation(api.invitations.revoke);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function invite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setError(null);
    try {
      const result = await createInvitation({
        householdId,
        email: value(data, "email"),
        role: value(data, "role") === "admin" ? "admin" : "member",
      });
      setInviteLink(`${window.location.origin}/join/${result.token}`);
      form.reset();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not create that invitation.");
    }
  }

  return (
    <div className="ordia-page-stack">
      <PageIntro kicker="Optional collaboration" title="Household" copy={`Ordia remains useful with one user. Invite someone to ${householdName} only when shared access would make household knowledge easier to use.`} />
      <div className="ordia-two-column">
        <section className="ordia-card">
          <SectionHeading icon={<UsersRound size={20} />} title="App members" count={members?.length ?? 0} />
          <div className="ordia-list">
            {members?.map((member) => (
              <article className="ordia-list-row" key={member.membershipId}>
                <div className="ordia-person-avatar small">{initials(member.displayName)}</div>
                <div><strong>{member.displayName}</strong><span>{member.email ?? "No email"}</span></div>
                <StatusPill status={member.role} />
              </article>
            ))}
          </div>
        </section>
        <section className="ordia-card">
          <SectionHeading icon={<UserRoundPlus size={20} />} title="Invite someone" />
          {!canInvite ? (
            <p className="ordia-muted-copy">Only owners and admins can create invitation links.</p>
          ) : (
            <>
              <p className="ordia-muted-copy">An invitation grants access to household-shared records. It does not reveal person records or preferences marked “Only me”.</p>
              <form className="ordia-invite-form" onSubmit={invite}>
                <input name="email" type="email" placeholder="person@example.com" required />
                <select name="role" defaultValue="member"><option value="member">Member</option><option value="admin">Admin</option></select>
                <button className="ordia-primary" type="submit"><Link2 size={17} /> Create link</button>
              </form>
              {error && <div className="form-error">{error}</div>}
              {inviteLink && (
                <div className="ordia-invite-result"><code>{inviteLink}</code><button type="button" onClick={async () => { await navigator.clipboard.writeText(inviteLink); setCopied(true); }}>{copied ? <Check size={16} /> : <Copy size={16} />}{copied ? "Copied" : "Copy"}</button></div>
              )}
            </>
          )}
        </section>
      </div>
      {canInvite && invitations && invitations.length > 0 && (
        <section className="ordia-card">
          <SectionHeading icon={<Link2 size={20} />} title="Pending invitations" count={invitations.length} />
          <div className="ordia-list">{invitations.map((invitation) => <article className="ordia-list-row" key={invitation.invitationId}><div><strong>{invitation.email}</strong><span>{invitation.role} · expires {formatDate(invitation.expiresAt, "")}</span></div><button className="ordia-text-button" type="button" onClick={() => void revokeInvitation({ householdId, invitationId: invitation.invitationId })}>Revoke</button></article>)}</div>
        </section>
      )}
    </div>
  );
}

function PageIntro({
  kicker,
  title,
  copy,
  action,
}: {
  kicker: string;
  title: string;
  copy: string;
  action?: ReactNode;
}) {
  return (
    <header className="ordia-page-intro">
      <div><span>{kicker}</span><h1>{title}</h1><p>{copy}</p></div>
      {action && <div className="ordia-page-action">{action}</div>}
    </header>
  );
}

function StatCard({ label, value, detail }: { label: string; value: number; detail: string }) {
  return <article className="ordia-stat-card"><span>{label}</span><strong>{value}</strong><small>{detail}</small></article>;
}

function SectionHeading({ icon, title, count }: { icon: ReactNode; title: string; count?: number }) {
  return <div className="ordia-section-heading"><span>{icon}</span><h2>{title}</h2>{count !== undefined && <small>{count}</small>}</div>;
}

function EmptyState({ title, copy, action, onAction }: { title: string; copy: string; action: string; onAction: () => void }) {
  return <div className="ordia-empty"><Sparkles size={23} /><strong>{title}</strong><p>{copy}</p><button type="button" onClick={onAction}>{action}</button></div>;
}

function TaskGroup({
  title,
  tasks,
  overview,
  onComplete,
}: {
  title: string;
  tasks: Task[];
  overview: Overview;
  onComplete: (taskId: Id<"tasks">) => Promise<void>;
}) {
  if (tasks.length === 0) return null;
  return (
    <div className="ordia-task-group">
      <h3>{title}<span>{tasks.length}</span></h3>
      {tasks.map((task) => (
        <article className="ordia-task-row" key={task.taskId}>
          <button type="button" aria-label={`Complete ${task.title}`} onClick={() => void onComplete(task.taskId)}><Circle size={20} /></button>
          <div><strong>{task.title}</strong><span>{taskContext(task, overview)}</span></div>
          <DatePill value={task.dueAt} fallback="Any time" />
        </article>
      ))}
    </div>
  );
}

function DetailSection({ title, icon, empty, children }: { title: string; icon: ReactNode; empty: string; children: ReactNode }) {
  const childCount = Array.isArray(children) ? children.length : children ? 1 : 0;
  return <section className="ordia-card"><SectionHeading icon={icon} title={title} />{childCount === 0 ? <p className="ordia-muted-copy">{empty}</p> : <div className="ordia-compact-list">{children}</div>}</section>;
}

function CompactRecord({ title, meta }: { title: string; meta: string }) {
  return <article><strong>{title}</strong><span>{meta}</span></article>;
}

function Fact({ label, value }: { label: string; value: string }) {
  return <article><span>{label}</span><strong>{value}</strong></article>;
}

function StatusPill({ status }: { status: string }) {
  return <span className={`ordia-status ordia-status-${status}`}>{status}</span>;
}

function DatePill({ value, fallback }: { value?: number; fallback: string }) {
  return <span className="ordia-date-pill">{formatDate(value, fallback)}</span>;
}

function Field({ label, wide, children }: { label: string; wide?: boolean; children: ReactNode }) {
  return <label className={wide ? "wide" : ""}><span>{label}</span>{children}</label>;
}

function EntitySelect({
  name,
  empty,
  items,
}: {
  name: string;
  empty: string;
  items: Array<{ id: string; label: string }>;
}) {
  return <select name={name} defaultValue=""><option value="">{empty}</option>{items.map((item) => <option value={item.id} key={item.id}>{item.label}</option>)}</select>;
}

function CaptureIcon({ type }: { type: CaptureType }) {
  if (type === "responsibility") return <FolderKanban size={19} />;
  if (type === "routine") return <Repeat2 size={19} />;
  if (type === "person") return <UsersRound size={19} />;
  if (type === "preference") return <Heart size={19} />;
  if (type === "library") return <Library size={19} />;
  if (type === "playbook") return <BookOpen size={19} />;
  return <ClipboardList size={19} />;
}

function KnowledgeIcon({ kind }: { kind: KnowledgeKind }) {
  if (kind === "restaurant" || kind === "meal" || kind === "takeaway" || kind === "snack") return <Utensils size={19} />;
  if (kind === "place") return <MapPin size={19} />;
  if (kind === "activity") return <Activity size={19} />;
  if (kind === "drink") return <GlassWater size={19} />;
  if (kind === "product") return <ShoppingBag size={19} />;
  if (kind === "fact" || kind === "decision" || kind === "note") return <StickyNote size={19} />;
  return <Package size={19} />;
}

function capturePrompt(type: CaptureType): string {
  if (type === "responsibility") return "What area needs ongoing stewardship?";
  if (type === "routine") return "What happens repeatedly?";
  if (type === "person") return "Who should household knowledge centre around?";
  if (type === "preference") return "What should not need remembering twice?";
  if (type === "library") return "What place, thing or fact should be reusable?";
  if (type === "playbook") return "How does your household usually handle this?";
  return "What needs a clear finish line?";
}

function tabLabel(tab: Tab): string {
  return tabs.find((item) => item.id === tab)?.label ?? "Ordia";
}

function taskContext(task: Task, overview: Overview): string {
  const responsibility = overview.responsibilities.find((item) => item.responsibilityId === task.responsibilityId);
  const person = overview.people.find((item) => item.personId === task.personId);
  return [responsibility?.name, person?.name].filter(Boolean).join(" · ") || "Household task";
}

function value(data: FormData, key: string): string {
  return String(data.get(key) ?? "").trim();
}

function optionalValue(data: FormData, key: string): string | undefined {
  const result = value(data, key);
  return result || undefined;
}

function idValue<T extends "responsibilities" | "routines" | "householdPeople" | "knowledgeItems">(
  data: FormData,
  key: string,
): Id<T> | undefined {
  const result = value(data, key);
  return result ? (result as Id<T>) : undefined;
}

function linesValue(data: FormData, key: string): string[] {
  return value(data, key).split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
}

function dateValue(data: FormData, key: string): number | undefined {
  const raw = value(data, key);
  if (!raw) return undefined;
  const timestamp = new Date(`${raw}T12:00:00`).getTime();
  return Number.isFinite(timestamp) ? timestamp : undefined;
}

function formatDate(value: number | undefined, fallback: string): string {
  if (value === undefined) return fallback;
  const date = new Date(value);
  const today = startOfDay(Date.now());
  const dateStart = startOfDay(value);
  const difference = Math.round((dateStart - today) / 86_400_000);
  if (difference === 0) return "Today";
  if (difference === 1) return "Tomorrow";
  if (difference === -1) return "Yesterday";
  return date.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

function startOfDay(value: number): number {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

function addDays(value: number, days: number): number {
  return value + days * 86_400_000;
}

function initials(name: string): string {
  return name.split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "").join("");
}
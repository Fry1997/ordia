"use client";

import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  Car,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Circle,
  Clock3,
  Copy,
  Heart,
  Home,
  LoaderCircle,
  LogOut,
  Menu,
  MoreHorizontal,
  Plus,
  Repeat2,
  Settings2,
  ShieldCheck,
  Sparkles,
  UserRound,
  UserRoundPlus,
  UsersRound,
  Utensils,
  X,
} from "lucide-react";
import { FormEvent, ReactNode, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { DomainCreator } from "./DomainCreator";
import type {
  CreatorKind,
  DomainPerson,
  DomainPreference,
  DomainResponsibility,
  DomainRestaurant,
  DomainRoutine,
  DomainTask,
  DomainWorkspaceData,
  OrderProfile,
  ResponsibilityDomain,
  ResponsibilityHealth,
  RoutinePhase,
} from "./types";

type Section = "today" | "responsibilities" | "routines" | "people" | "dining" | "household";
type CreatorContext = {
  kind: CreatorKind;
  responsibilityId?: Id<"responsibilityAreas">;
  personId?: Id<"domainPeople">;
  restaurantId?: Id<"restaurants">;
};

type DomainWorkspaceProps = {
  householdId: Id<"households">;
  householdName: string;
  role: "owner" | "admin" | "member";
  onSignOut: () => void;
};

const sections: Array<{ id: Section; label: string; icon: typeof Home }> = [
  { id: "today", label: "Today", icon: CalendarDays },
  { id: "responsibilities", label: "Responsibilities", icon: ShieldCheck },
  { id: "routines", label: "Routines", icon: Repeat2 },
  { id: "people", label: "People", icon: UsersRound },
  { id: "dining", label: "Food & places", icon: Utensils },
  { id: "household", label: "Household", icon: Home },
];

const domainLabels: Record<ResponsibilityDomain, string> = {
  home: "Home",
  family: "Family",
  finance: "Finance",
  food: "Food",
  health: "Health",
  transport: "Transport",
  education: "Education",
  admin: "Admin",
  pets: "Pets",
  work: "Work",
  other: "Other",
};

const healthLabels: Record<ResponsibilityHealth, string> = {
  on_track: "On track",
  attention: "Needs attention",
  blocked: "Blocked",
};

export function DomainWorkspace({ householdId, householdName, role, onSignOut }: DomainWorkspaceProps) {
  const data = useQuery(api.domain.workspace, { householdId }) as DomainWorkspaceData | undefined;
  const [section, setSection] = useState<Section>("today");
  const [creator, setCreator] = useState<CreatorContext | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedResponsibilityId, setSelectedResponsibilityId] = useState<Id<"responsibilityAreas"> | null>(null);
  const [selectedRoutineId, setSelectedRoutineId] = useState<Id<"routineDefinitions"> | null>(null);
  const [selectedPersonId, setSelectedPersonId] = useState<Id<"domainPeople"> | null>(null);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<Id<"restaurants"> | null>(null);

  const selectedResponsibility = data?.responsibilities.find((item) => item.responsibilityId === selectedResponsibilityId) ?? data?.responsibilities[0];
  const selectedRoutine = data?.routines.find((item) => item.routineId === selectedRoutineId) ?? data?.routines[0];
  const selectedPerson = data?.people.find((item) => item.personId === selectedPersonId) ?? data?.people[0];
  const selectedRestaurant = data?.restaurants.find((item) => item.restaurantId === selectedRestaurantId) ?? data?.restaurants[0];

  function navigate(next: Section) {
    setSection(next);
    setMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (!data) {
    return <div className="dx-full-loading"><LoaderCircle className="spin" size={24} /><span>Assembling your household system…</span></div>;
  }

  return (
    <div className="dx-shell">
      <aside className={`dx-sidebar ${menuOpen ? "open" : ""}`}>
        <div className="dx-brand-row">
          <div className="dx-brand-mark" aria-hidden="true"><span /><span /><span /></div>
          <div><strong>Ordia</strong><small>Household intelligence</small></div>
          <button className="dx-sidebar-close" type="button" onClick={() => setMenuOpen(false)}><X size={19} /></button>
        </div>

        <nav className="dx-navigation" aria-label="Ordia sections">
          <span className="dx-nav-label">Workspace</span>
          {sections.slice(0, 5).map((item) => {
            const Icon = item.icon;
            return (
              <button key={item.id} className={section === item.id ? "active" : ""} type="button" onClick={() => navigate(item.id)}>
                <Icon size={18} /><span>{item.label}</span>
                {item.id === "responsibilities" && data.responsibilities.filter((value) => value.health !== "on_track").length > 0 && (
                  <em>{data.responsibilities.filter((value) => value.health !== "on_track").length}</em>
                )}
              </button>
            );
          })}
        </nav>

        <div className="dx-sidebar-spacer" />
        <nav className="dx-navigation dx-navigation-secondary">
          <span className="dx-nav-label">Account</span>
          <button className={section === "household" ? "active" : ""} type="button" onClick={() => navigate("household")}>
            <Home size={18} /><span>Household</span>
          </button>
          <button type="button" onClick={onSignOut}><LogOut size={18} /><span>Sign out</span></button>
        </nav>
        <div className="dx-household-stamp"><span>{householdName.slice(0, 1).toUpperCase()}</span><div><strong>{householdName}</strong><small>{role}</small></div></div>
      </aside>

      {menuOpen && <button className="dx-mobile-scrim" type="button" aria-label="Close menu" onClick={() => setMenuOpen(false)} />}

      <main className="dx-main">
        <header className="dx-topbar">
          <button className="dx-mobile-menu" type="button" onClick={() => setMenuOpen(true)}><Menu size={20} /></button>
          <div><span>{householdName}</span><strong>{sections.find((item) => item.id === section)?.label}</strong></div>
          <QuickCreate onCreate={(kind) => setCreator({ kind })} />
        </header>

        <div className="dx-content">
          {section === "today" && <TodayView householdId={householdId} data={data} openCreator={setCreator} navigate={navigate} />}
          {section === "responsibilities" && (
            <ResponsibilitiesView
              householdId={householdId}
              data={data}
              selected={selectedResponsibility}
              onSelect={setSelectedResponsibilityId}
              openCreator={setCreator}
            />
          )}
          {section === "routines" && (
            <RoutinesView data={data} selected={selectedRoutine} onSelect={setSelectedRoutineId} openCreator={setCreator} />
          )}
          {section === "people" && (
            <PeopleView data={data} selected={selectedPerson} onSelect={setSelectedPersonId} openCreator={setCreator} />
          )}
          {section === "dining" && (
            <DiningView data={data} selected={selectedRestaurant} onSelect={setSelectedRestaurantId} openCreator={setCreator} />
          )}
          {section === "household" && <HouseholdView householdId={householdId} householdName={householdName} role={role} />}
        </div>
      </main>

      <nav className="dx-bottom-nav" aria-label="Mobile navigation">
        {sections.slice(0, 5).map((item) => {
          const Icon = item.icon;
          return <button key={item.id} className={section === item.id ? "active" : ""} type="button" onClick={() => navigate(item.id)}><Icon size={19} /><span>{item.label === "Responsibilities" ? "Areas" : item.label === "Food & places" ? "Places" : item.label}</span></button>;
        })}
      </nav>

      {creator && (
        <DomainCreator
          householdId={householdId}
          kind={creator.kind}
          data={data}
          responsibilityId={creator.responsibilityId}
          personId={creator.personId}
          restaurantId={creator.restaurantId}
          onClose={() => setCreator(null)}
        />
      )}
    </div>
  );
}

function TodayView({ householdId, data, openCreator, navigate }: {
  householdId: Id<"households">;
  data: DomainWorkspaceData;
  openCreator: (context: CreatorContext) => void;
  navigate: (section: Section) => void;
}) {
  const setStatus = useMutation(api.domain.setTaskStatus);
  const now = Date.now();
  const dayEnd = startOfTomorrow();
  const openTasks = data.tasks.filter((task) => task.status !== "done");
  const dueTasks = openTasks.filter((task) => task.dueAt !== undefined && task.dueAt < dayEnd);
  const unscheduled = openTasks.filter((task) => task.dueAt === undefined);
  const nextTasks = [...dueTasks, ...unscheduled].slice(0, 6);
  const attentionAreas = data.responsibilities.filter((item) => item.health !== "on_track");
  const upcomingRoutines = [...data.routines]
    .filter((item) => item.status === "active")
    .sort((a, b) => (a.nextOccurrenceAt ?? Number.MAX_SAFE_INTEGER) - (b.nextOccurrenceAt ?? Number.MAX_SAFE_INTEGER))
    .slice(0, 4);
  const greeting = new Date().getHours() < 12 ? "Good morning" : new Date().getHours() < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="dx-page">
      <section className="dx-hero">
        <div>
          <span className="dx-eyebrow">{formatLongDate(now)}</span>
          <h1>{greeting}.</h1>
          <p>Ordia is showing what needs attention, what repeats next and where household knowledge is currently fragile.</p>
        </div>
        <button className="dx-primary-button" type="button" onClick={() => openCreator({ kind: "task" })}><Plus size={18} /> Add a task</button>
      </section>

      <section className="dx-signal-grid">
        <SignalCard label="Open work" value={openTasks.length} detail={dueTasks.length ? `${dueTasks.length} due or overdue` : "Nothing overdue"} tone={dueTasks.length ? "warm" : "calm"} />
        <SignalCard label="Responsibility health" value={attentionAreas.length} detail={attentionAreas.length ? "areas need attention" : "all areas on track"} tone={attentionAreas.length ? "alert" : "calm"} />
        <SignalCard label="Routine systems" value={data.routines.filter((item) => item.status === "active").length} detail="active repeated processes" tone="lilac" />
        <SignalCard label="Retained knowledge" value={data.preferences.length + data.orderProfiles.length} detail="preferences and usual orders" tone="paper" />
      </section>

      <div className="dx-dashboard-grid">
        <section className="dx-panel dx-panel-large">
          <PanelHeading eyebrow="Action" title="What needs doing" action={<button className="dx-text-button" type="button" onClick={() => openCreator({ kind: "task" })}>New task <Plus size={15} /></button>} />
          {nextTasks.length === 0 ? (
            <EmptyState icon={<CheckCircle2 size={24} />} title="No open tasks" copy="Create a task from a responsibility, routine or person when a concrete action appears." action="Create task" onAction={() => openCreator({ kind: "task" })} />
          ) : (
            <div className="dx-task-list">
              {nextTasks.map((task) => (
                <TaskRow key={task.taskId} task={task} data={data} onComplete={() => void setStatus({ householdId, taskId: task.taskId, status: "done" })} />
              ))}
            </div>
          )}
        </section>

        <section className="dx-panel">
          <PanelHeading eyebrow="Stewardship" title="Areas needing attention" action={<button className="dx-text-button" type="button" onClick={() => navigate("responsibilities")}>View all <ArrowRight size={15} /></button>} />
          {attentionAreas.length === 0 ? <div className="dx-quiet-state"><CheckCircle2 size={21} /><span>Every active responsibility is marked on track.</span></div> : (
            <div className="dx-compact-list">{attentionAreas.slice(0, 4).map((item) => <ResponsibilityMini key={item.responsibilityId} item={item} data={data} />)}</div>
          )}
        </section>

        <section className="dx-panel">
          <PanelHeading eyebrow="Repeated work" title="Next routines" action={<button className="dx-text-button" type="button" onClick={() => openCreator({ kind: "routine" })}>New routine <Plus size={15} /></button>} />
          {upcomingRoutines.length === 0 ? <div className="dx-quiet-state"><Repeat2 size={21} /><span>No routine systems have been created yet.</span></div> : (
            <div className="dx-compact-list">{upcomingRoutines.map((routine) => <RoutineMini key={routine.routineId} routine={routine} data={data} />)}</div>
          )}
        </section>

        <section className="dx-panel dx-knowledge-panel">
          <div className="dx-knowledge-copy"><span className="dx-eyebrow">Knowledge resilience</span><h2>Can someone else act without asking you?</h2><p>Usual orders, individual preferences and routine steps turn tacit household knowledge into something reusable.</p></div>
          <div className="dx-knowledge-actions">
            <button type="button" onClick={() => openCreator({ kind: "preference" })}><Heart size={18} /><span><strong>Preference</strong><small>Record exactly how someone likes something.</small></span><ChevronRight size={17} /></button>
            <button type="button" onClick={() => openCreator({ kind: "order" })}><Utensils size={18} /><span><strong>Usual order</strong><small>Build a repeatable restaurant order.</small></span><ChevronRight size={17} /></button>
          </div>
        </section>
      </div>
    </div>
  );
}

function ResponsibilitiesView({ householdId, data, selected, onSelect, openCreator }: {
  householdId: Id<"households">;
  data: DomainWorkspaceData;
  selected?: DomainResponsibility;
  onSelect: (id: Id<"responsibilityAreas">) => void;
  openCreator: (context: CreatorContext) => void;
}) {
  const setHealth = useMutation(api.domain.setResponsibilityHealth);
  const tasks = selected ? data.tasks.filter((task) => task.responsibilityId === selected.responsibilityId) : [];
  const routines = selected ? data.routines.filter((routine) => routine.responsibilityId === selected.responsibilityId) : [];

  return (
    <div className="dx-page">
      <PageHeading eyebrow="Durable ownership" title="Responsibilities" copy="Responsibilities are the ongoing areas someone must keep healthy. Tasks and routines define what the area actually contains." action={<button className="dx-primary-button" type="button" onClick={() => openCreator({ kind: "responsibility" })}><Plus size={18} /> New responsibility</button>} />
      {data.responsibilities.length === 0 ? (
        <LargeEmpty icon={<ShieldCheck size={27} />} title="Build the household’s responsibility map" copy="Start with a stable area such as Car maintenance, Nursery, Household waste or Birthdays and gifts." action="Create first responsibility" onAction={() => openCreator({ kind: "responsibility" })} />
      ) : (
        <div className="dx-master-detail">
          <div className="dx-master-list">
            {data.responsibilities.map((item) => (
              <button key={item.responsibilityId} className={selected?.responsibilityId === item.responsibilityId ? "active" : ""} type="button" onClick={() => onSelect(item.responsibilityId)}>
                <DomainIcon domain={item.domain} />
                <span><strong>{item.name}</strong><small>{domainLabels[item.domain]} · {personName(data, item.ownerPersonId) || "No steward"}</small></span>
                <HealthPill health={item.health} />
              </button>
            ))}
          </div>
          {selected && (
            <article className="dx-detail-card">
              <header className="dx-detail-hero">
                <DomainIcon domain={selected.domain} large />
                <div><span className="dx-eyebrow">{domainLabels[selected.domain]} responsibility</span><h2>{selected.name}</h2><p>{selected.openTaskCount} open tasks · {selected.routineCount} routine systems</p></div>
                <button className="dx-icon-button" type="button"><MoreHorizontal size={19} /></button>
              </header>

              <section className="dx-detail-section">
                <DetailSectionHeading title="Current health" copy="Health is an explicit state, not inferred from a description." />
                <div className="dx-health-control">
                  {(["on_track", "attention", "blocked"] as ResponsibilityHealth[]).map((health) => (
                    <button key={health} className={selected.health === health ? `active ${health}` : health} type="button" onClick={() => void setHealth({ householdId, responsibilityId: selected.responsibilityId, health })}>
                      <span />{healthLabels[health]}
                    </button>
                  ))}
                </div>
              </section>

              <section className="dx-detail-section">
                <DetailSectionHeading title="Stewardship" copy="Who keeps the area healthy and who can recover it when needed." />
                <div className="dx-steward-grid">
                  <PersonToken label="Steward" person={findPerson(data, selected.ownerPersonId)} empty="Not assigned" />
                  <PersonToken label="Backup" person={findPerson(data, selected.backupPersonId)} empty="No backup" />
                  <div className="dx-key-value"><span>Review rhythm</span><strong>{reviewLabel(selected.reviewCadence)}</strong><small>{selected.nextReviewAt ? `Next ${formatDate(selected.nextReviewAt)}` : "No date scheduled"}</small></div>
                </div>
              </section>

              <section className="dx-detail-section">
                <DetailSectionHeading title="Open work" copy="Concrete actions connected to this responsibility." action={<button className="dx-text-button" type="button" onClick={() => openCreator({ kind: "task", responsibilityId: selected.responsibilityId })}>Add task <Plus size={15} /></button>} />
                {tasks.length === 0 ? <InlineEmpty copy="No tasks are currently connected." /> : <div className="dx-task-list compact">{tasks.slice(0, 8).map((task) => <TaskRow key={task.taskId} task={task} data={data} />)}</div>}
              </section>

              <section className="dx-detail-section">
                <DetailSectionHeading title="Routine systems" copy="Repeated processes that keep this area healthy." action={<button className="dx-text-button" type="button" onClick={() => openCreator({ kind: "routine", responsibilityId: selected.responsibilityId })}>Build routine <Plus size={15} /></button>} />
                {routines.length === 0 ? <InlineEmpty copy="No routine systems are connected yet." /> : <div className="dx-routine-strip">{routines.map((routine) => <RoutineMini key={routine.routineId} routine={routine} data={data} />)}</div>}
              </section>
            </article>
          )}
        </div>
      )}
    </div>
  );
}

function RoutinesView({ data, selected, onSelect, openCreator }: {
  data: DomainWorkspaceData;
  selected?: DomainRoutine;
  onSelect: (id: Id<"routineDefinitions">) => void;
  openCreator: (context: CreatorContext) => void;
}) {
  return (
    <div className="dx-page">
      <PageHeading eyebrow="Repeatable systems" title="Routines" copy="A routine combines a calculable schedule, optional alternating variants and the task templates generated around every occurrence." action={<button className="dx-primary-button" type="button" onClick={() => openCreator({ kind: "routine" })}><Plus size={18} /> Build routine</button>} />
      {data.routines.length === 0 ? (
        <LargeEmpty icon={<Repeat2 size={27} />} title="Model a repeated household process" copy="Bin day, nursery pickup, bedtime and monthly car checks should be systems—not remembered from scratch each time." action="Build first routine" onAction={() => openCreator({ kind: "routine" })} />
      ) : (
        <div className="dx-master-detail">
          <div className="dx-master-list">
            {data.routines.map((routine) => (
              <button key={routine.routineId} className={selected?.routineId === routine.routineId ? "active" : ""} type="button" onClick={() => onSelect(routine.routineId)}>
                <span className="dx-round-icon lilac"><Repeat2 size={18} /></span>
                <span><strong>{routine.name}</strong><small>{scheduleLabel(routine)}</small></span>
                <ChevronRight size={17} />
              </button>
            ))}
          </div>
          {selected && <RoutineDetail routine={selected} data={data} openCreator={openCreator} />}
        </div>
      )}
    </div>
  );
}

function RoutineDetail({ routine, data, openCreator }: { routine: DomainRoutine; data: DomainWorkspaceData; openCreator: (context: CreatorContext) => void }) {
  const grouped = groupSteps(routine);
  return (
    <article className="dx-detail-card">
      <header className="dx-detail-hero">
        <span className="dx-round-icon lilac large"><Repeat2 size={23} /></span>
        <div><span className="dx-eyebrow">Repeated household process</span><h2>{routine.name}</h2><p>{scheduleLabel(routine)}</p></div>
        <button className="dx-icon-button" type="button"><MoreHorizontal size={19} /></button>
      </header>
      <section className="dx-schedule-card">
        <div><CalendarDays size={19} /><span><small>Frequency</small><strong>{scheduleLabel(routine)}</strong></span></div>
        <div><Clock3 size={19} /><span><small>Occurrence time</small><strong>{routine.timeLocal || "Not set"}</strong></span></div>
        <div><ArrowRight size={19} /><span><small>Next occurrence</small><strong>{routine.nextOccurrenceAt ? formatDate(routine.nextOccurrenceAt) : "Calculated when scheduled"}</strong></span></div>
      </section>
      {routine.alternating && (
        <section className="dx-detail-section">
          <DetailSectionHeading title="Alternating cycle" copy="Each occurrence advances to the next named variant." />
          <div className="dx-variant-cycle">{routine.variants.map((variant, index) => <div key={variant.variantId}><span>{index + 1}</span><strong>{variant.name}</strong>{index < routine.variants.length - 1 && <ArrowRight size={16} />}</div>)}</div>
        </section>
      )}
      <section className="dx-detail-section">
        <DetailSectionHeading title="Generated task sequence" copy="Each action has its own phase and timing relative to the occurrence." action={<button className="dx-text-button" type="button" onClick={() => openCreator({ kind: "task", routineId: routine.routineId } as CreatorContext)}>Add one-off task <Plus size={15} /></button>} />
        <div className="dx-phase-stack">
          {(["preparation", "occurrence", "follow_up"] as RoutinePhase[]).map((phase) => grouped[phase].length > 0 && (
            <section key={phase} className="dx-phase-group">
              <header><span>{phaseLabel(phase)}</span><small>{phaseCopy(phase)}</small></header>
              {grouped[phase].map((step) => {
                const variant = routine.variants.find((item) => item.variantId === step.variantId);
                return <article key={step.stepId}><span className="dx-step-dot" /><div><strong>{step.title}</strong><small>{offsetLabel(step.offsetDays)}{step.timeLocal ? ` · ${step.timeLocal}` : ""}{variant ? ` · ${variant.name} only` : ""}</small></div><em>{personName(data, step.assigneePersonId) || "Unassigned"}</em></article>;
              })}
            </section>
          ))}
        </div>
      </section>
    </article>
  );
}

function PeopleView({ data, selected, onSelect, openCreator }: {
  data: DomainWorkspaceData;
  selected?: DomainPerson;
  onSelect: (id: Id<"domainPeople">) => void;
  openCreator: (context: CreatorContext) => void;
}) {
  const preferences = selected ? data.preferences.filter((item) => item.personId === selected.personId) : [];
  const tasks = selected ? data.tasks.filter((item) => item.concernsPersonId === selected.personId) : [];
  const routines = selected ? data.routines.filter((item) => item.personId === selected.personId) : [];
  return (
    <div className="dx-page">
      <PageHeading eyebrow="People-centred context" title="People" copy="People are household entities whether or not they use Ordia. Their preferences and routines remain separately permissioned knowledge." action={<button className="dx-primary-button" type="button" onClick={() => openCreator({ kind: "person" })}><Plus size={18} /> Add person</button>} />
      {data.people.length === 0 ? (
        <LargeEmpty icon={<UsersRound size={27} />} title="Add the people your household knowledge concerns" copy="Start with yourself, a partner or a child. Inviting an account is optional and separate." action="Add first person" onAction={() => openCreator({ kind: "person" })} />
      ) : (
        <div className="dx-master-detail">
          <div className="dx-master-list dx-person-list">
            {data.people.map((person) => (
              <button key={person.personId} className={selected?.personId === person.personId ? "active" : ""} type="button" onClick={() => onSelect(person.personId)}>
                <PersonAvatar person={person} />
                <span><strong>{person.name}</strong><small>{relationshipLabel(person.relationship)}{person.birthDate ? ` · ${ageLabel(person.birthDate)}` : ""}</small></span>
                {person.visibility === "private" && <ShieldCheck size={15} />}
              </button>
            ))}
          </div>
          {selected && (
            <article className="dx-detail-card">
              <header className="dx-person-hero"><PersonAvatar person={selected} large /><div><span className="dx-eyebrow">{relationshipLabel(selected.relationship)}</span><h2>{selected.name}</h2><p>{selected.birthDate ? `${ageLabel(selected.birthDate)} · born ${formatBirthDate(selected.birthDate)}` : "Date of birth not recorded"}</p></div><span className={`dx-visibility-pill ${selected.visibility}`}><ShieldCheck size={14} /> {selected.visibility === "private" ? "Private to you" : "Household visible"}</span></header>
              <div className="dx-person-actions">
                <button type="button" onClick={() => openCreator({ kind: "preference", personId: selected.personId })}><Heart size={18} /><span><strong>Add preference</strong><small>Favourite, likes, avoids or needs</small></span></button>
                <button type="button" onClick={() => openCreator({ kind: "task", personId: selected.personId })}><Check size={18} /><span><strong>Add task</strong><small>A concrete action concerning {selected.name}</small></span></button>
                <button type="button" onClick={() => openCreator({ kind: "routine", personId: selected.personId })}><Repeat2 size={18} /><span><strong>Build routine</strong><small>A repeated process centred on {selected.name}</small></span></button>
              </div>
              <section className="dx-detail-section">
                <DetailSectionHeading title="Favourites and preferences" copy="Every preference points to a real subject and records source, visibility and preparation specifics." />
                {preferences.length === 0 ? <InlineEmpty copy="No preferences have been recorded." /> : <PreferenceGrid preferences={preferences} data={data} />}
              </section>
              <div className="dx-two-detail-sections">
                <section className="dx-detail-section"><DetailSectionHeading title="Related tasks" copy={`${tasks.length} tasks concern ${selected.name}.`} />{tasks.length ? <div className="dx-task-list compact">{tasks.slice(0, 6).map((task) => <TaskRow key={task.taskId} task={task} data={data} />)}</div> : <InlineEmpty copy="No connected tasks." />}</section>
                <section className="dx-detail-section"><DetailSectionHeading title="Routines" copy={`${routines.length} repeated processes are centred here.`} />{routines.length ? <div className="dx-compact-list">{routines.map((routine) => <RoutineMini key={routine.routineId} routine={routine} data={data} />)}</div> : <InlineEmpty copy="No connected routines." />}</section>
              </div>
            </article>
          )}
        </div>
      )}
    </div>
  );
}

function DiningView({ data, selected, onSelect, openCreator }: {
  data: DomainWorkspaceData;
  selected?: DomainRestaurant;
  onSelect: (id: Id<"restaurants">) => void;
  openCreator: (context: CreatorContext) => void;
}) {
  const preferences = selected ? data.preferences.filter((item) => item.restaurantId === selected.restaurantId) : [];
  const orders = selected ? data.orderProfiles.filter((item) => item.restaurantId === selected.restaurantId) : [];
  return (
    <div className="dx-page">
      <PageHeading eyebrow="Shared practical knowledge" title="Food & places" copy="Restaurants, individual preferences and usual household orders stay connected, so ordering knowledge is not gated to one person." action={<button className="dx-primary-button" type="button" onClick={() => openCreator({ kind: "restaurant" })}><Plus size={18} /> Add restaurant</button>} />
      {data.restaurants.length === 0 ? (
        <LargeEmpty icon={<Utensils size={27} />} title="Create a real restaurant record" copy="Then connect individual favourites and build a reusable family order from exact order lines." action="Add first restaurant" onAction={() => openCreator({ kind: "restaurant" })} />
      ) : (
        <div className="dx-master-detail">
          <div className="dx-master-list">
            {data.restaurants.map((restaurant) => (
              <button key={restaurant.restaurantId} className={selected?.restaurantId === restaurant.restaurantId ? "active" : ""} type="button" onClick={() => onSelect(restaurant.restaurantId)}>
                <span className="dx-round-icon peach"><Utensils size={18} /></span>
                <span><strong>{restaurant.name}</strong><small>{restaurant.cuisine || "Restaurant"} · {restaurant.orderCount} saved order{restaurant.orderCount === 1 ? "" : "s"}</small></span>
                <ChevronRight size={17} />
              </button>
            ))}
          </div>
          {selected && (
            <article className="dx-detail-card">
              <header className="dx-restaurant-hero"><span className="dx-round-icon peach large"><Utensils size={23} /></span><div><span className="dx-eyebrow">{selected.cuisine || "Restaurant"}</span><h2>{selected.name}</h2><div className="dx-tag-row">{selected.serviceModes.map((mode) => <span key={mode}>{serviceModeLabel(mode)}</span>)}</div></div><button className="dx-icon-button" type="button"><MoreHorizontal size={19} /></button></header>
              <div className="dx-place-facts">
                <PlaceFact label="Preferred order method" value={orderMethodLabel(selected.preferredOrderMethod)} />
                <PlaceFact label="Phone" value={selected.phone || "Not recorded"} />
                <PlaceFact label="Address" value={[selected.addressLine, selected.postcode].filter(Boolean).join(", ") || "Not recorded"} />
                <PlaceFact label="Parking" value={selected.parkingGuidance || "Not recorded"} />
                <PlaceFact label="Booking" value={selected.bookingGuidance || "Not recorded"} />
              </div>
              <div className="dx-person-actions">
                <button type="button" onClick={() => openCreator({ kind: "order", restaurantId: selected.restaurantId })}><Utensils size={18} /><span><strong>Build usual order</strong><small>Quantities, variants and modifications</small></span></button>
                <button type="button" onClick={() => openCreator({ kind: "preference", restaurantId: selected.restaurantId })}><Heart size={18} /><span><strong>Add person preference</strong><small>Who likes or avoids this place</small></span></button>
              </div>
              <section className="dx-detail-section">
                <DetailSectionHeading title="Usual orders" copy="Reusable ordering plans that anyone can follow." />
                {orders.length === 0 ? <InlineEmpty copy="No usual orders have been built yet." /> : <div className="dx-order-profile-list">{orders.map((order) => <OrderProfileCard key={order.orderProfileId} order={order} data={data} />)}</div>}
              </section>
              <section className="dx-detail-section">
                <DetailSectionHeading title="Who relates to this restaurant" copy="Favourites and preferences aggregate automatically around the restaurant entity." />
                {preferences.length === 0 ? <InlineEmpty copy="No person preferences are linked yet." /> : <PreferenceGrid preferences={preferences} data={data} />}
              </section>
            </article>
          )}
        </div>
      )}
    </div>
  );
}

function HouseholdView({ householdId, householdName, role }: { householdId: Id<"households">; householdName: string; role: "owner" | "admin" | "member" }) {
  const members = useQuery(api.households.listMembers, { householdId });
  const now = useMemo(() => Date.now(), []);
  const invitations = useQuery(api.invitations.listForHousehold, role === "owner" || role === "admin" ? { householdId, now } : "skip");
  const createInvitation = useMutation(api.invitations.create);
  const revokeInvitation = useMutation(api.invitations.revoke);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setError(null);
    try {
      const result = await createInvitation({ householdId, email: String(data.get("email") ?? ""), role: data.get("role") === "admin" ? "admin" : "member" });
      setInviteLink(`${window.location.origin}/join/${result.token}`);
      form.reset();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not create the invitation.");
    }
  }

  return (
    <div className="dx-page">
      <PageHeading eyebrow="Optional collaboration" title="Household access" copy="Ordia remains useful to one person. Invite others only when shared app access helps; person records and private knowledge are separate from membership." />
      <div className="dx-household-grid">
        <section className="dx-panel"><PanelHeading eyebrow="Members with app access" title={householdName} /><div className="dx-member-stack">{members === undefined ? <LoaderCircle className="spin" size={20} /> : members.map((member) => <article key={member.membershipId}><span>{member.displayName.slice(0, 1).toUpperCase()}</span><div><strong>{member.displayName}</strong><small>{member.email || "No email"}</small></div><em>{member.role}</em></article>)}</div></section>
        <section className="dx-panel"><PanelHeading eyebrow="Shared access" title="Invite someone" />{role === "member" ? <div className="dx-quiet-state"><ShieldCheck size={21} /><span>Only owners and admins can create invitations.</span></div> : <><p className="dx-panel-copy">Membership gives access to household-visible records. It never exposes private person records or private preferences.</p><form className="dx-invite-form" onSubmit={submit}><label><span>Email address</span><input name="email" type="email" required placeholder="partner@example.com" /></label><label><span>Access level</span><select name="role"><option value="member">Member</option><option value="admin">Admin</option></select></label>{error && <div className="form-error">{error}</div>}<button className="dx-primary-button" type="submit"><UserRoundPlus size={18} /> Create invitation</button></form>{inviteLink && <div className="dx-invite-result"><code>{inviteLink}</code><button type="button" onClick={() => void navigator.clipboard.writeText(inviteLink)}><Copy size={16} /> Copy</button></div>}<div className="dx-pending-list">{invitations?.map((invitation) => <article key={invitation.invitationId}><div><strong>{invitation.email}</strong><small>{invitation.role} · expires {formatDate(invitation.expiresAt)}</small></div><button type="button" onClick={() => void revokeInvitation({ householdId, invitationId: invitation.invitationId })}>Revoke</button></article>)}</div></>}</section>
      </div>
    </div>
  );
}

function QuickCreate({ onCreate }: { onCreate: (kind: CreatorKind) => void }) {
  const [open, setOpen] = useState(false);
  return <div className="dx-quick-create"><button className="dx-primary-button" type="button" onClick={() => setOpen((value) => !value)}><Plus size={18} /> New <ChevronDown size={15} /></button>{open && <div className="dx-quick-menu">{([
    ["task", Check, "Task", "One concrete action"],
    ["responsibility", ShieldCheck, "Responsibility", "An area to keep healthy"],
    ["routine", Repeat2, "Routine", "A repeated task system"],
    ["person", UserRound, "Person", "A household person record"],
    ["restaurant", Utensils, "Restaurant", "A structured place record"],
    ["preference", Heart, "Preference", "How someone relates to something"],
  ] as Array<[CreatorKind, typeof Check, string, string]>).map(([kind, Icon, label, copy]) => <button key={kind} type="button" onClick={() => { onCreate(kind); setOpen(false); }}><Icon size={18} /><span><strong>{label}</strong><small>{copy}</small></span></button>)}</div>}</div>;
}

function TaskRow({ task, data, onComplete }: { task: DomainTask; data: DomainWorkspaceData; onComplete?: () => void }) {
  const responsibility = data.responsibilities.find((item) => item.responsibilityId === task.responsibilityId);
  return <article className={`dx-task-row priority-${task.priority}`}><button className="dx-task-check" type="button" onClick={onComplete} disabled={!onComplete}>{task.status === "done" ? <Check size={15} /> : <Circle size={15} />}</button><div><strong>{task.title}</strong><span>{responsibility?.name || "Unlinked task"}{task.assigneePersonId ? ` · ${personName(data, task.assigneePersonId)} is doing it` : ""}</span></div><div className="dx-task-time"><strong>{task.dueAt ? relativeDate(task.dueAt) : "No deadline"}</strong>{task.estimatedMinutes && <small>{task.estimatedMinutes} min</small>}</div></article>;
}

function ResponsibilityMini({ item, data }: { item: DomainResponsibility; data: DomainWorkspaceData }) {
  return <article className="dx-mini-row"><DomainIcon domain={item.domain} /><div><strong>{item.name}</strong><small>{personName(data, item.ownerPersonId) || "No steward"} · {item.openTaskCount} open tasks</small></div><HealthPill health={item.health} /></article>;
}

function RoutineMini({ routine, data }: { routine: DomainRoutine; data: DomainWorkspaceData }) {
  const responsibility = data.responsibilities.find((item) => item.responsibilityId === routine.responsibilityId);
  return <article className="dx-mini-row"><span className="dx-round-icon lilac"><Repeat2 size={17} /></span><div><strong>{routine.name}</strong><small>{scheduleLabel(routine)}{responsibility ? ` · ${responsibility.name}` : ""}</small></div><em>{routine.steps.length} steps</em></article>;
}

function PreferenceGrid({ preferences, data }: { preferences: DomainPreference[]; data: DomainWorkspaceData }) {
  return <div className="dx-preference-grid">{preferences.map((preference) => <article key={preference.preferenceId} className={`relation-${preference.relation}`}><Heart size={16} /><div><span>{relationLabel(preference.relation)}</span><strong>{preferenceTarget(preference, data)}</strong>{preference.preparationPreference && <p>{preference.preparationPreference}</p>}<small>{sourceLabel(preference.source)}{preference.lastConfirmedAt ? ` · confirmed ${formatDate(preference.lastConfirmedAt)}` : ""}</small></div>{preference.visibility === "private" && <ShieldCheck size={14} />}</article>)}</div>;
}

function OrderProfileCard({ order, data }: { order: OrderProfile; data: DomainWorkspaceData }) {
  return <article className="dx-order-profile"><header><div><span>{order.scope === "household" ? "Household order" : personName(data, order.personId)}</span><h3>{order.name}</h3></div><em>{orderMethodLabel(order.orderMethod)}</em></header><div className="dx-order-lines">{order.lines.map((line) => <div key={line.lineId}><span>{line.quantity}</span><div><strong>{line.itemName}{line.variant ? ` · ${line.variant}` : ""}</strong>{line.modifications.map((item) => <small key={item}>{item}</small>)}{line.forPersonIds.length > 0 && <em>For {line.forPersonIds.map((id) => personName(data, id)).join(", ")}</em>}</div></div>)}</div></article>;
}

function PageHeading({ eyebrow, title, copy, action }: { eyebrow: string; title: string; copy: string; action?: ReactNode }) {
  return <header className="dx-page-heading"><div><span className="dx-eyebrow">{eyebrow}</span><h1>{title}</h1><p>{copy}</p></div>{action}</header>;
}
function PanelHeading({ eyebrow, title, action }: { eyebrow: string; title: string; action?: ReactNode }) {
  return <header className="dx-panel-heading"><div><span>{eyebrow}</span><h2>{title}</h2></div>{action}</header>;
}
function DetailSectionHeading({ title, copy, action }: { title: string; copy: string; action?: ReactNode }) {
  return <header className="dx-detail-section-heading"><div><h3>{title}</h3><p>{copy}</p></div>{action}</header>;
}
function SignalCard({ label, value, detail, tone }: { label: string; value: number; detail: string; tone: string }) {
  return <article className={`dx-signal-card ${tone}`}><span>{label}</span><strong>{value}</strong><small>{detail}</small></article>;
}
function EmptyState({ icon, title, copy, action, onAction }: { icon: ReactNode; title: string; copy: string; action: string; onAction: () => void }) {
  return <div className="dx-empty-state"><span>{icon}</span><h3>{title}</h3><p>{copy}</p><button type="button" onClick={onAction}>{action} <ArrowRight size={15} /></button></div>;
}
function LargeEmpty(props: { icon: ReactNode; title: string; copy: string; action: string; onAction: () => void }) {
  return <section className="dx-large-empty"><div className="dx-empty-orbit"><span>{props.icon}</span></div><span className="dx-eyebrow">Start the model</span><h2>{props.title}</h2><p>{props.copy}</p><button className="dx-primary-button" type="button" onClick={props.onAction}><Plus size={18} /> {props.action}</button></section>;
}
function InlineEmpty({ copy }: { copy: string }) { return <div className="dx-inline-empty"><Circle size={16} /><span>{copy}</span></div>; }
function HealthPill({ health }: { health: ResponsibilityHealth }) { return <span className={`dx-health-pill ${health}`}><i />{healthLabels[health]}</span>; }
function PersonAvatar({ person, large }: { person: DomainPerson; large?: boolean }) { return <span className={`dx-person-avatar ${large ? "large" : ""}`}>{person.name.slice(0, 1).toUpperCase()}</span>; }
function PersonToken({ label, person, empty }: { label: string; person?: DomainPerson; empty: string }) { return <div className="dx-person-token"><span>{label}</span>{person ? <><PersonAvatar person={person} /><strong>{person.name}</strong><small>{relationshipLabel(person.relationship)}</small></> : <><span className="dx-person-avatar empty"><UserRound size={17} /></span><strong>{empty}</strong></>}</div>; }
function PlaceFact({ label, value }: { label: string; value: string }) { return <div><span>{label}</span><strong>{value}</strong></div>; }
function DomainIcon({ domain, large }: { domain: ResponsibilityDomain; large?: boolean }) { const Icon = domain === "transport" ? Car : domain === "food" ? Utensils : domain === "family" ? UsersRound : domain === "health" ? Heart : domain === "home" ? Home : domain === "admin" || domain === "finance" ? Settings2 : Sparkles; return <span className={`dx-domain-icon domain-${domain} ${large ? "large" : ""}`}><Icon size={large ? 23 : 18} /></span>; }

function findPerson(data: DomainWorkspaceData, id?: Id<"domainPeople">) { return data.people.find((item) => item.personId === id); }
function personName(data: DomainWorkspaceData, id?: Id<"domainPeople">) { return findPerson(data, id)?.name || ""; }
function reviewLabel(value: DomainResponsibility["reviewCadence"]) { return value === "none" ? "No scheduled review" : `${value.slice(0, 1).toUpperCase()}${value.slice(1)} review`; }
function scheduleLabel(routine: DomainRoutine): string {
  const prefix = routine.interval > 1 ? `Every ${routine.interval} ` : "Every ";
  if (routine.frequency === "daily") return routine.interval === 1 ? "Every day" : `${prefix}days`;
  if (routine.frequency === "weekly" || routine.frequency === "fortnightly") {
    const days = routine.weekdays.map((day) => ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][day]).join(", ");
    return routine.frequency === "fortnightly" ? `Every other ${days || "week"}` : `${prefix}${days || "week"}`;
  }
  if (routine.frequency === "monthly") return `${prefix}month on day ${routine.dayOfMonth || 1}`;
  return `${prefix}days`;
}
function groupSteps(routine: DomainRoutine) { return {
  preparation: routine.steps.filter((step) => step.phase === "preparation"),
  occurrence: routine.steps.filter((step) => step.phase === "occurrence"),
  follow_up: routine.steps.filter((step) => step.phase === "follow_up"),
}; }
function phaseLabel(phase: RoutinePhase) { return phase === "preparation" ? "Preparation" : phase === "occurrence" ? "Occurrence day" : "Follow-up"; }
function phaseCopy(phase: RoutinePhase) { return phase === "preparation" ? "Actions before the main occurrence" : phase === "occurrence" ? "Actions on the occurrence date" : "Actions that close the loop afterwards"; }
function offsetLabel(value: number) { return value === 0 ? "Occurrence day" : value < 0 ? `${Math.abs(value)} day${Math.abs(value) === 1 ? "" : "s"} before` : `${value} day${value === 1 ? "" : "s"} after`; }
function relationshipLabel(value: DomainPerson["relationship"]) { return ({ self: "You", partner: "Partner", child: "Child", parent: "Parent", sibling: "Sibling", family: "Family", friend: "Friend", professional: "Professional", other: "Other" } as const)[value]; }
function ageLabel(birthDate: string) { const born = new Date(`${birthDate}T12:00:00`); const now = new Date(); let years = now.getFullYear() - born.getFullYear(); if (now.getMonth() < born.getMonth() || (now.getMonth() === born.getMonth() && now.getDate() < born.getDate())) years -= 1; return `${Math.max(0, years)} years old`; }
function formatBirthDate(value: string) { return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric" }).format(new Date(`${value}T12:00:00`)); }
function preferenceTarget(preference: DomainPreference, data: DomainWorkspaceData) { if (preference.restaurantId) return data.restaurants.find((item) => item.restaurantId === preference.restaurantId)?.name || "Restaurant"; if (preference.foodItemId) return data.foodItems.find((item) => item.foodItemId === preference.foodItemId)?.name || "Food item"; if (preference.activityId) return data.activities.find((item) => item.activityId === preference.activityId)?.name || "Activity"; return "Preference"; }
function relationLabel(value: DomainPreference["relation"]) { return ({ favourite: "Favourite", likes: "Likes", usually: "Usually chooses", dislikes: "Dislikes", avoids: "Avoids", needs: "Needs", only_if: "Only if" } as const)[value]; }
function sourceLabel(value: DomainPreference["source"]) { return value === "observed" ? "Observed" : value === "told_by_person" ? "Told by the person" : "Household knowledge"; }
function serviceModeLabel(value: DomainRestaurant["serviceModes"][number]) { return value === "dine_in" ? "Dine in" : value === "takeaway" ? "Takeaway" : "Delivery"; }
function orderMethodLabel(value?: DomainRestaurant["preferredOrderMethod"]) { if (!value) return "Not recorded"; return ({ direct_phone: "Call directly", direct_web: "Restaurant website", delivery_app: "Delivery app", walk_in: "Walk in", at_table: "At the table", other: "Other" } as const)[value]; }
function formatDate(value: number) { return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: new Date(value).getFullYear() !== new Date().getFullYear() ? "numeric" : undefined }).format(new Date(value)); }
function formatLongDate(value: number) { return new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long" }).format(new Date(value)); }
function relativeDate(value: number) { const today = new Date(); const due = new Date(value); const startToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime(); const startDue = new Date(due.getFullYear(), due.getMonth(), due.getDate()).getTime(); const days = Math.round((startDue - startToday) / 86400000); if (days < 0) return `${Math.abs(days)}d overdue`; if (days === 0) return "Today"; if (days === 1) return "Tomorrow"; return formatDate(value); }
function startOfTomorrow() { const date = new Date(); return new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1).getTime(); }

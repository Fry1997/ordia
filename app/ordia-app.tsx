"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { anyApi } from "convex/server";
import {
  AuthLoading,
  Authenticated,
  Unauthenticated,
  useMutation,
  useQuery,
} from "convex/react";
import {
  CalendarClock,
  Check,
  ChevronDown,
  ClipboardCheck,
  Edit3,
  Home,
  LogOut,
  MapPin,
  Navigation,
  Plus,
  Repeat2,
  Settings,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";

const api = {
  account: { me: anyApi.account.me },
  households: {
    listMine: anyApi.households.listMine,
    create: anyApi.households.create,
    rename: anyApi.households.rename,
    createInvite: anyApi.households.createInvite,
    acceptInvite: anyApi.households.acceptInvite,
    listMembers: anyApi.households.listMembers,
  },
  locations: {
    list: anyApi.locations.list,
    create: anyApi.locations.create,
    update: anyApi.locations.update,
    archive: anyApi.locations.archive,
  },
  itinerary: {
    list: anyApi.itinerary.list,
    create: anyApi.itinerary.create,
    update: anyApi.itinerary.update,
    archive: anyApi.itinerary.archive,
    complete: anyApi.itinerary.complete,
  },
};

type Household = {
  _id: string;
  name: string;
  timeZone: string;
  role: "owner" | "adult" | "member";
};

type Place = {
  _id: string;
  name: string;
  address?: string;
  phone?: string;
  contactLabel?: string;
  notes?: string;
};

type ChecklistItem = {
  _id: string;
  parentItemId?: string;
  label: string;
  requiredQuantity: number;
  sortOrder: number;
};

type ItineraryItem = {
  _id: string;
  title: string;
  details?: string;
  kind: "reminder" | "check" | "event" | "chore";
  completionMode: "none" | "manual" | "checklist" | "manual_or_checklist";
  scheduleType: "fixed" | "relative" | "rolling";
  locationId?: string;
  location?: Omit<Place, "_id" | "notes">;
  allDay: boolean;
  startDate?: string;
  startMinute?: number;
  endMinute?: number;
  recurrenceType: "none" | "daily" | "weekly" | "monthly";
  recurrenceInterval: number;
  recurrenceWeekdays: number[];
  anchorItemId?: string;
  relativeDirection?: "before" | "after";
  relativeOffsetMinutes?: number;
  rollingUnit?: "day" | "week" | "month";
  rollingInterval?: number;
  nextDueAt?: number;
  resetOnCompletion: boolean;
  rotationLabels: string[];
  rotationAnchorDate?: string;
  checklistItems: ChecklistItem[];
};

type Tab = "itinerary" | "places" | "household";

type DraftChecklistRow = {
  label: string;
  requiredQuantity: number;
  parentIndex?: number;
};

export function OrdiaApp() {
  return (
    <>
      <AuthLoading>
        <main className="loading-page"><span className="wordmark">Ordia</span><p>Opening your household…</p></main>
      </AuthLoading>
      <Unauthenticated><SignIn /></Unauthenticated>
      <Authenticated><Workspace /></Authenticated>
    </>
  );
}

function SignIn() {
  const { signIn } = useAuthActions();
  const [mode, setMode] = useState<"signIn" | "signUp">("signUp");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const data = new FormData(event.currentTarget);
    data.set("flow", mode);
    try {
      await signIn("password", data);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not continue");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-intro">
        <span className="wordmark">Ordia</span>
        <h1>Your household, held in one place.</h1>
        <p>Nothing is pre-filled. Create the people, places, routines and checks that belong to your home.</p>
      </section>
      <section className="auth-card">
        <div className="segmented">
          <button className={mode === "signUp" ? "active" : ""} onClick={() => setMode("signUp")} type="button">Create account</button>
          <button className={mode === "signIn" ? "active" : ""} onClick={() => setMode("signIn")} type="button">Sign in</button>
        </div>
        <form className="form-stack" onSubmit={submit}>
          {mode === "signUp" && <label>Name<input name="name" autoComplete="name" required minLength={2} /></label>}
          <label>Email<input name="email" type="email" autoComplete="email" required /></label>
          <label>Password<input name="password" type="password" autoComplete={mode === "signUp" ? "new-password" : "current-password"} required minLength={10} /></label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="primary-button" disabled={pending} type="submit">{pending ? "Working…" : mode === "signUp" ? "Create account" : "Sign in"}</button>
        </form>
      </section>
    </main>
  );
}

function Workspace() {
  const { signOut } = useAuthActions();
  const account = useQuery(api.account.me, {}) as { name?: string; email?: string } | undefined;
  const households = useQuery(api.households.listMine, {}) as Household[] | undefined;
  const [selectedId, setSelectedId] = useState<string>();
  const [tab, setTab] = useState<Tab>("itinerary");

  useEffect(() => {
    if (!selectedId && households?.length) setSelectedId(households[0]._id);
    if (selectedId && households && !households.some((household) => household._id === selectedId)) {
      setSelectedId(households[0]?._id);
    }
  }, [households, selectedId]);

  if (!households) return <main className="loading-page"><span className="wordmark">Ordia</span><p>Loading your account…</p></main>;
  if (households.length === 0) return <HouseholdOnboarding accountName={account?.name} onReady={setSelectedId} onSignOut={() => void signOut()} />;

  const household = households.find((row) => row._id === selectedId) ?? households[0];

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand"><span>O</span><strong>Ordia</strong></div>
        <nav>
          <button className={tab === "itinerary" ? "active" : ""} onClick={() => setTab("itinerary")}><CalendarClock size={19} /> Itinerary</button>
          <button className={tab === "places" ? "active" : ""} onClick={() => setTab("places")}><MapPin size={19} /> Places</button>
          <button className={tab === "household" ? "active" : ""} onClick={() => setTab("household")}><Users size={19} /> Household</button>
        </nav>
        <button className="sign-out" onClick={() => void signOut()}><LogOut size={18} /> Sign out</button>
      </aside>

      <section className="workspace">
        <header className="workspace-header">
          <div>
            <p className="eyebrow">{account?.name ? `${account.name}'s household` : "Your household"}</p>
            <div className="household-picker">
              <Home size={20} />
              <select value={household._id} onChange={(event) => setSelectedId(event.target.value)} aria-label="Household">
                {households.map((row) => <option key={row._id} value={row._id}>{row.name}</option>)}
              </select>
              <ChevronDown size={16} />
            </div>
          </div>
          <span className="role-badge">{household.role}</span>
        </header>

        {tab === "itinerary" && <ItineraryView household={household} />}
        {tab === "places" && <PlacesView household={household} />}
        {tab === "household" && <HouseholdView household={household} />}
      </section>
    </main>
  );
}

function HouseholdOnboarding({ accountName, onReady, onSignOut }: { accountName?: string; onReady: (id: string) => void; onSignOut: () => void }) {
  const createHousehold = useMutation(api.households.create);
  const acceptInvite = useMutation(api.households.acceptInvite);
  const [error, setError] = useState("");

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    try {
      const id = await createHousehold({
        name: String(data.get("name") ?? ""),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/London",
      });
      onReady(String(id));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not create household");
    }
  }

  async function join(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    try {
      const id = await acceptInvite({ code: String(data.get("code") ?? "") });
      onReady(String(id));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not join household");
    }
  }

  return (
    <main className="onboarding-page">
      <header><span className="wordmark">Ordia</span><button className="text-button" onClick={onSignOut}>Sign out</button></header>
      <section className="onboarding-copy">
        <p className="eyebrow">Welcome{accountName ? `, ${accountName}` : ""}</p>
        <h1>Start with the household itself.</h1>
        <p>Create a new shared home, or join one using an invite code from another member.</p>
      </section>
      <div className="onboarding-grid">
        <form className="setup-card" onSubmit={create}>
          <Home size={24} />
          <h2>Create a household</h2>
          <label>Household name<input name="name" placeholder="e.g. The Fry household" required minLength={2} /></label>
          <button className="primary-button" type="submit">Create household</button>
        </form>
        <form className="setup-card" onSubmit={join}>
          <Users size={24} />
          <h2>Join a household</h2>
          <label>Invite code<input name="code" placeholder="10-character code" required /></label>
          <button className="secondary-button" type="submit">Join household</button>
        </form>
      </div>
      {error && <p className="form-error" role="alert">{error}</p>}
    </main>
  );
}

function ItineraryView({ household }: { household: Household }) {
  const items = useQuery(api.itinerary.list, { householdId: household._id }) as ItineraryItem[] | undefined;
  const places = useQuery(api.locations.list, { householdId: household._id }) as Place[] | undefined;
  const completeItem = useMutation(api.itinerary.complete);
  const archiveItem = useMutation(api.itinerary.archive);
  const [editing, setEditing] = useState<ItineraryItem | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const sorted = useMemo(() => [...(items ?? [])].sort((a, b) => itemSortKey(a) - itemSortKey(b)), [items]);

  if (!items || !places) return <SectionLoading />;

  async function complete(item: ItineraryItem) {
    setError("");
    try {
      await completeItem({ itemId: item._id });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not complete item");
    }
  }

  async function archive(item: ItineraryItem) {
    if (!window.confirm(`Remove “${item.title}”?`)) return;
    try {
      await archiveItem({ itemId: item._id });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not remove item");
    }
  }

  return (
    <section>
      <div className="section-title">
        <div><p className="eyebrow">Itinerary</p><h1>The detail around your day</h1><p>Only household-created reminders, checks, events and rolling chores appear here.</p></div>
        <button className="primary-button compact" onClick={() => { setEditing(null); setCreating(true); }}><Plus size={17} /> Add item</button>
      </div>

      {error && <p className="form-error" role="alert">{error}</p>}
      {(creating || editing) && (
        <ItemEditor
          key={editing?._id ?? "new"}
          householdId={household._id}
          items={items}
          places={places}
          initial={editing}
          onClose={() => { setEditing(null); setCreating(false); }}
        />
      )}

      {sorted.length === 0 ? (
        <EmptyState icon={<CalendarClock size={26} />} title="No itinerary items yet" copy="Add the first real reminder, linked check, bin rotation or periodic chore for this household." action="Add first item" onAction={() => setCreating(true)} />
      ) : (
        <div className="entity-list">
          {sorted.map((item) => {
            const anchor = item.anchorItemId ? items.find((candidate) => candidate._id === item.anchorItemId) : undefined;
            return (
              <article className="entity-card" key={item._id}>
                <div className="entity-icon">{item.kind === "check" ? <ClipboardCheck size={20} /> : item.kind === "chore" ? <Repeat2 size={20} /> : <CalendarClock size={20} />}</div>
                <div className="entity-main">
                  <div className="entity-heading"><span className="kind-badge">{item.kind}</span>{item.rotationLabels.length > 0 && <span className="soft-badge">Rotates: {item.rotationLabels.join(" / ")}</span>}</div>
                  <h2>{item.title}</h2>
                  <p>{scheduleSummary(item, anchor)}</p>
                  {item.details && <p className="entity-details">{item.details}</p>}
                  {item.checklistItems.length > 0 && <p className="checklist-summary"><Check size={14} /> {item.checklistItems.length} checklist item{item.checklistItems.length === 1 ? "" : "s"}</p>}
                  {item.location && <LocationActions location={item.location} />}
                </div>
                <div className="entity-actions">
                  {item.completionMode !== "none" && <button title="Mark complete" onClick={() => void complete(item)}><Check size={17} /></button>}
                  <button title="Edit" onClick={() => { setCreating(false); setEditing(item); }}><Edit3 size={17} /></button>
                  <button className="danger" title="Remove" onClick={() => void archive(item)}><Trash2 size={17} /></button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

function ItemEditor({ householdId, items, places, initial, onClose }: { householdId: string; items: ItineraryItem[]; places: Place[]; initial: ItineraryItem | null; onClose: () => void }) {
  const createItem = useMutation(api.itinerary.create);
  const updateItem = useMutation(api.itinerary.update);
  const [kind, setKind] = useState<ItineraryItem["kind"]>(initial?.kind ?? "reminder");
  const [scheduleType, setScheduleType] = useState<ItineraryItem["scheduleType"]>(initial?.scheduleType ?? "fixed");
  const [completion, setCompletion] = useState<ItineraryItem["completionMode"]>(initial?.completionMode ?? "none");
  const [rows, setRows] = useState<DraftChecklistRow[]>(() => checklistDraft(initial));
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  function changeKind(next: ItineraryItem["kind"]) {
    setKind(next);
    if (next === "reminder" || next === "event") setCompletion("none");
    if (next === "check" && completion === "none") setCompletion("manual_or_checklist");
    if (next === "chore" && completion === "none") setCompletion("manual");
    if (next === "chore") setScheduleType("rolling");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const data = new FormData(event.currentTarget);
    const payload: Record<string, unknown> = {
      householdId,
      title: String(data.get("title") ?? ""),
      kind,
      completionMode: completion,
      scheduleType,
      allDay: data.get("allDay") === "on",
      recurrenceType: String(data.get("recurrenceType") ?? "none"),
      recurrenceInterval: numberValue(data.get("recurrenceInterval"), 1),
      recurrenceWeekdays: [],
      resetOnCompletion: data.get("resetOnCompletion") === "on",
      rotationLabels: splitLabels(String(data.get("rotationLabels") ?? "")),
      checklistItems: rows.filter((row) => row.label.trim()).map((row) => ({ ...row, requiredQuantity: Math.max(1, row.requiredQuantity) })),
    };

    addText(payload, "details", data.get("details"));
    addText(payload, "locationId", data.get("locationId"));
    addText(payload, "rotationAnchorDate", data.get("rotationAnchorDate"));

    if (scheduleType === "fixed") {
      addText(payload, "startDate", data.get("startDate"));
      addTime(payload, "startMinute", data.get("startTime"));
      addTime(payload, "endMinute", data.get("endTime"));
    }
    if (scheduleType === "relative") {
      addText(payload, "anchorItemId", data.get("anchorItemId"));
      payload.relativeDirection = String(data.get("relativeDirection") ?? "before");
      payload.relativeOffsetMinutes = numberValue(data.get("relativeOffsetMinutes"), 5);
    }
    if (scheduleType === "rolling") {
      payload.rollingUnit = String(data.get("rollingUnit") ?? "week");
      payload.rollingInterval = numberValue(data.get("rollingInterval"), 1);
      const due = String(data.get("nextDueDate") ?? "");
      if (due) payload.nextDueAt = new Date(`${due}T09:00:00`).getTime();
    }

    try {
      if (initial) await updateItem({ itemId: initial._id, ...payload });
      else await createItem(payload);
      onClose();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save item");
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="editor" onSubmit={submit}>
      <header><div><p className="eyebrow">{initial ? "Edit item" : "New item"}</p><h2>{initial ? initial.title : "Add to the household itinerary"}</h2></div><button className="icon-button" type="button" onClick={onClose}><X size={18} /></button></header>
      <div className="form-grid">
        <label className="span-two">Title<input name="title" defaultValue={initial?.title} required /></label>
        <label>Type<select value={kind} onChange={(event) => changeKind(event.target.value as ItineraryItem["kind"])}><option value="reminder">Reminder</option><option value="check">Check</option><option value="event">Event</option><option value="chore">Chore</option></select></label>
        <label>Completion<select value={completion} onChange={(event) => setCompletion(event.target.value as ItineraryItem["completionMode"])} disabled={kind === "reminder" || kind === "event"}><option value="none">No completion</option><option value="manual">Manual</option><option value="checklist">When checklist is complete</option><option value="manual_or_checklist">Manual or checklist</option></select></label>
        <label className="span-two">Details<textarea name="details" defaultValue={initial?.details} rows={3} /></label>
        <label>Schedule<select value={scheduleType} onChange={(event) => setScheduleType(event.target.value as ItineraryItem["scheduleType"])}><option value="fixed">Fixed time or pattern</option><option value="relative">Relative to another item</option><option value="rolling">Due from last completion</option></select></label>
        <label>Saved place<select name="locationId" defaultValue={initial?.locationId ?? ""}><option value="">No place</option>{places.map((place) => <option key={place._id} value={place._id}>{place.name}</option>)}</select></label>

        {scheduleType === "fixed" && <>
          <label>Date<input name="startDate" type="date" defaultValue={initial?.startDate} /></label>
          <label>Starts<input name="startTime" type="time" defaultValue={minuteToTime(initial?.startMinute)} /></label>
          <label>Window ends<input name="endTime" type="time" defaultValue={minuteToTime(initial?.endMinute)} /></label>
          <label>Repeats<select name="recurrenceType" defaultValue={initial?.recurrenceType ?? "none"}><option value="none">Does not repeat</option><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option></select></label>
          <label>Every<input name="recurrenceInterval" type="number" min={1} defaultValue={initial?.recurrenceInterval ?? 1} /></label>
          <label className="checkbox-label"><input name="allDay" type="checkbox" defaultChecked={initial?.allDay} /> All day</label>
        </>}

        {scheduleType === "relative" && <>
          <label className="span-two">Linked to<select name="anchorItemId" defaultValue={initial?.anchorItemId ?? ""} required><option value="">Choose an item</option>{items.filter((item) => item._id !== initial?._id).map((item) => <option key={item._id} value={item._id}>{item.title}</option>)}</select></label>
          <label>Direction<select name="relativeDirection" defaultValue={initial?.relativeDirection ?? "before"}><option value="before">Before</option><option value="after">After</option></select></label>
          <label>Minutes offset<input name="relativeOffsetMinutes" type="number" min={0} defaultValue={initial?.relativeOffsetMinutes ?? 5} /></label>
          <input name="recurrenceType" type="hidden" value="none" /><input name="recurrenceInterval" type="hidden" value="1" />
        </>}

        {scheduleType === "rolling" && <>
          <label>Every<input name="rollingInterval" type="number" min={1} defaultValue={initial?.rollingInterval ?? 1} /></label>
          <label>Unit<select name="rollingUnit" defaultValue={initial?.rollingUnit ?? "week"}><option value="day">Days</option><option value="week">Weeks</option><option value="month">Months</option></select></label>
          <label>Next due<input name="nextDueDate" type="date" defaultValue={timestampToDate(initial?.nextDueAt)} /></label>
          <label className="checkbox-label"><input name="resetOnCompletion" type="checkbox" defaultChecked={initial?.resetOnCompletion ?? true} /> Reset from completion date</label>
          <input name="recurrenceType" type="hidden" value="none" /><input name="recurrenceInterval" type="hidden" value="1" />
        </>}

        <label className="span-two">Rotation labels<textarea name="rotationLabels" defaultValue={initial?.rotationLabels.join("\n")} placeholder={"Optional, one per line\ne.g. Black bins\nGreen bins"} rows={3} /></label>
        <label>Rotation starts<input name="rotationAnchorDate" type="date" defaultValue={initial?.rotationAnchorDate} /></label>
      </div>

      {(completion === "checklist" || completion === "manual_or_checklist") && <section className="checklist-editor">
        <div><p className="eyebrow">Checklist</p><h3>Items and nested groups</h3></div>
        {rows.map((row, index) => <div className="checklist-edit-row" key={index}>
          <input aria-label={`Checklist item ${index + 1}`} value={row.label} onChange={(event) => setRows((current) => current.map((entry, entryIndex) => entryIndex === index ? { ...entry, label: event.target.value } : entry))} placeholder="Item or group name" />
          <input aria-label="Quantity" type="number" min={1} value={row.requiredQuantity} onChange={(event) => setRows((current) => current.map((entry, entryIndex) => entryIndex === index ? { ...entry, requiredQuantity: Number(event.target.value) } : entry))} />
          <select aria-label="Parent group" value={row.parentIndex ?? ""} onChange={(event) => setRows((current) => current.map((entry, entryIndex) => entryIndex === index ? { ...entry, parentIndex: event.target.value === "" ? undefined : Number(event.target.value) } : entry))}><option value="">Top level</option>{rows.slice(0, index).map((candidate, candidateIndex) => <option key={candidateIndex} value={candidateIndex}>Inside: {candidate.label || `Item ${candidateIndex + 1}`}</option>)}</select>
          <button type="button" className="icon-button danger" onClick={() => setRows((current) => current.filter((_, entryIndex) => entryIndex !== index).map((entry) => entry.parentIndex !== undefined && entry.parentIndex > index ? { ...entry, parentIndex: entry.parentIndex - 1 } : entry.parentIndex === index ? { ...entry, parentIndex: undefined } : entry))}><Trash2 size={16} /></button>
        </div>)}
        <button className="secondary-button compact" type="button" onClick={() => setRows((current) => [...current, { label: "", requiredQuantity: 1 }])}><Plus size={16} /> Add checklist item</button>
      </section>}

      {error && <p className="form-error" role="alert">{error}</p>}
      <footer><button className="text-button" type="button" onClick={onClose}>Cancel</button><button className="primary-button" disabled={pending} type="submit">{pending ? "Saving…" : "Save item"}</button></footer>
    </form>
  );
}

function PlacesView({ household }: { household: Household }) {
  const places = useQuery(api.locations.list, { householdId: household._id }) as Place[] | undefined;
  const createPlace = useMutation(api.locations.create);
  const updatePlace = useMutation(api.locations.update);
  const archivePlace = useMutation(api.locations.archive);
  const [editing, setEditing] = useState<Place | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");

  if (!places) return <SectionLoading />;

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const payload: Record<string, unknown> = { name: String(data.get("name") ?? "") };
    addText(payload, "address", data.get("address"));
    addText(payload, "phone", data.get("phone"));
    addText(payload, "contactLabel", data.get("contactLabel"));
    addText(payload, "notes", data.get("notes"));
    try {
      if (editing) await updatePlace({ locationId: editing._id, ...payload });
      else await createPlace({ householdId: household._id, ...payload });
      setEditing(null); setShowForm(false);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Could not save place"); }
  }

  async function remove(place: Place) {
    if (!window.confirm(`Remove “${place.name}”?`)) return;
    try { await archivePlace({ locationId: place._id }); } catch (caught) { setError(caught instanceof Error ? caught.message : "Could not remove place"); }
  }

  return <section>
    <div className="section-title"><div><p className="eyebrow">Saved places</p><h1>Useful context, ready when needed</h1><p>Addresses, phone numbers and contact details can be attached to itinerary items.</p></div><button className="primary-button compact" onClick={() => { setEditing(null); setShowForm(true); }}><Plus size={17} /> Add place</button></div>
    {error && <p className="form-error">{error}</p>}
    {(showForm || editing) && <form className="editor" onSubmit={save} key={editing?._id ?? "new-place"}><header><h2>{editing ? "Edit place" : "Add a saved place"}</h2><button type="button" className="icon-button" onClick={() => { setEditing(null); setShowForm(false); }}><X size={18} /></button></header><div className="form-grid"><label>Name<input name="name" defaultValue={editing?.name} required /></label><label>Address<input name="address" defaultValue={editing?.address} /></label><label>Phone<input name="phone" type="tel" defaultValue={editing?.phone} /></label><label>Contact or room name<input name="contactLabel" defaultValue={editing?.contactLabel} /></label><label className="span-two">Notes<textarea name="notes" defaultValue={editing?.notes} rows={3} /></label></div><footer><button className="text-button" type="button" onClick={() => { setEditing(null); setShowForm(false); }}>Cancel</button><button className="primary-button" type="submit">Save place</button></footer></form>}
    {places.length === 0 ? <EmptyState icon={<MapPin size={26} />} title="No saved places" copy="Add a nursery, school, surgery or anywhere else your household regularly needs." action="Add first place" onAction={() => setShowForm(true)} /> : <div className="entity-grid">{places.map((place) => <article className="place-card" key={place._id}><MapPin size={21} /><div><h2>{place.name}</h2><p>{place.address || "No address added"}</p>{place.contactLabel && <small>{place.contactLabel}</small>}<LocationActions location={place} /></div><div className="entity-actions"><button onClick={() => { setEditing(place); setShowForm(false); }}><Edit3 size={17} /></button><button className="danger" onClick={() => void remove(place)}><Trash2 size={17} /></button></div></article>)}</div>}
  </section>;
}

function HouseholdView({ household }: { household: Household }) {
  const members = useQuery(api.households.listMembers, { householdId: household._id }) as Array<{ userId: string; name?: string; email?: string; role: string }> | undefined;
  const rename = useMutation(api.households.rename);
  const createInvite = useMutation(api.households.createInvite);
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState("");

  if (!members) return <SectionLoading />;

  async function renameHousehold(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const data = new FormData(event.currentTarget);
    try { await rename({ householdId: household._id, name: String(data.get("name") ?? "") }); } catch (caught) { setError(caught instanceof Error ? caught.message : "Could not rename household"); }
  }

  async function invite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const data = new FormData(event.currentTarget);
    try { setInviteCode(String(await createInvite({ householdId: household._id, role: String(data.get("role") ?? "adult") }))); } catch (caught) { setError(caught instanceof Error ? caught.message : "Could not create invite"); }
  }

  return <section>
    <div className="section-title"><div><p className="eyebrow">Household</p><h1>People sharing the load</h1><p>Manage the household name and invite another real account.</p></div></div>
    {error && <p className="form-error">{error}</p>}
    <div className="settings-grid">
      <form className="settings-card" onSubmit={renameHousehold}><Settings size={21} /><h2>Household details</h2><label>Name<input name="name" defaultValue={household.name} /></label><button className="secondary-button" type="submit">Save name</button></form>
      <form className="settings-card" onSubmit={invite}><Users size={21} /><h2>Invite someone</h2><label>Access<select name="role"><option value="adult">Adult</option><option value="member">Member</option></select></label><button className="primary-button" type="submit">Generate invite code</button>{inviteCode && <div className="invite-code"><small>Valid for seven days</small><strong>{inviteCode}</strong></div>}</form>
    </div>
    <div className="members-list"><h2>Members</h2>{members.map((member) => <article key={member.userId}><span className="member-avatar">{initials(member.name || member.email || "Member")}</span><div><strong>{member.name || "Unnamed member"}</strong><small>{member.email}</small></div><span className="role-badge">{member.role}</span></article>)}</div>
  </section>;
}

function LocationActions({ location }: { location: Partial<Place> & { name: string } }) {
  const destination = location.address || location.name;
  const encoded = encodeURIComponent(destination);
  return <div className="location-actions">{destination && <><a href={`https://maps.apple.com/?daddr=${encoded}`} target="_blank" rel="noreferrer"><Navigation size={14} /> Apple</a><a href={`https://www.google.com/maps/dir/?api=1&destination=${encoded}`} target="_blank" rel="noreferrer">Google</a><a href={`https://waze.com/ul?q=${encoded}&navigate=yes`} target="_blank" rel="noreferrer">Waze</a></>}{location.phone && <a href={`tel:${location.phone}`}>{location.contactLabel ? `Call ${location.contactLabel}` : "Call"}</a>}</div>;
}

function EmptyState({ icon, title, copy, action, onAction }: { icon: React.ReactNode; title: string; copy: string; action: string; onAction: () => void }) {
  return <section className="empty-state"><span>{icon}</span><h2>{title}</h2><p>{copy}</p><button className="primary-button" onClick={onAction}>{action}</button></section>;
}

function SectionLoading() { return <section className="section-loading"><p>Loading household data…</p></section>; }

function checklistDraft(initial: ItineraryItem | null): DraftChecklistRow[] {
  if (!initial) return [];
  const idToIndex = new Map(initial.checklistItems.map((row, index) => [row._id, index]));
  return initial.checklistItems.map((row) => ({ label: row.label, requiredQuantity: row.requiredQuantity, parentIndex: row.parentItemId ? idToIndex.get(row.parentItemId) : undefined }));
}

function itemSortKey(item: ItineraryItem) {
  if (item.nextDueAt) return item.nextDueAt;
  if (item.startDate) return new Date(`${item.startDate}T00:00:00`).getTime() + (item.startMinute ?? 0) * 60_000;
  return Number.MAX_SAFE_INTEGER;
}

function scheduleSummary(item: ItineraryItem, anchor?: ItineraryItem) {
  if (item.scheduleType === "relative") return `${item.relativeOffsetMinutes ?? 0} minutes ${item.relativeDirection ?? "before"} ${anchor?.title ?? "linked item"}`;
  if (item.scheduleType === "rolling") return `Every ${item.rollingInterval ?? 1} ${plural(item.rollingUnit ?? "week", item.rollingInterval ?? 1)}${item.nextDueAt ? ` · next due ${new Date(item.nextDueAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}` : ""}`;
  const time = item.startMinute === undefined ? "" : minuteToTime(item.startMinute);
  const window = item.endMinute === undefined ? time : `${time}–${minuteToTime(item.endMinute)}`;
  const repeat = item.recurrenceType === "none" ? "" : ` · every ${item.recurrenceInterval > 1 ? `${item.recurrenceInterval} ` : ""}${plural(item.recurrenceType.replace("ly", "") as string, item.recurrenceInterval)}`;
  return `${item.startDate ? new Date(`${item.startDate}T12:00:00`).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }) : "Unscheduled"}${window ? ` · ${window}` : ""}${repeat}`;
}

function minuteToTime(value?: number) { if (value === undefined) return ""; return `${String(Math.floor(value / 60)).padStart(2, "0")}:${String(value % 60).padStart(2, "0")}`; }
function timestampToDate(value?: number) { if (!value) return ""; const date = new Date(value); return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`; }
function splitLabels(value: string) { return value.split(/[\n,]/).map((label) => label.trim()).filter(Boolean); }
function numberValue(value: FormDataEntryValue | null, fallback: number) { const parsed = Number(value); return Number.isFinite(parsed) ? parsed : fallback; }
function addText(target: Record<string, unknown>, key: string, value: FormDataEntryValue | null) { const text = String(value ?? "").trim(); if (text) target[key] = text; }
function addTime(target: Record<string, unknown>, key: string, value: FormDataEntryValue | null) { const text = String(value ?? ""); if (!text) return; const [hours, minutes] = text.split(":").map(Number); target[key] = hours * 60 + minutes; }
function plural(word: string, count: number) { return count === 1 ? word : `${word}s`; }
function initials(value: string) { return value.split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join(""); }

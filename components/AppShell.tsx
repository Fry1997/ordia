"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, CalendarDays, Car, Check, ChevronRight, CirclePlus, Home, Printer, Search, ShoppingBasket, Sparkles, Trash2, Users } from "lucide-react";

type Area = { id: string; title: string; summary: string; icon: typeof Car; records: { label: string; value: string }[]; rules: { title: string; detail: string }[] };
type Task = { id: number; title: string; area: string; timing: string; done: boolean };

const areas: Area[] = [
  { id: "nursery", title: "Nursery", summary: "Dates, bags, contacts and what needs replacing.", icon: Users, records: [{ label: "Next closure", value: "31 August" }, { label: "Bag", value: "Spare clothes, bottle, comforter" }, { label: "Collection", value: "12:45" }], rules: [{ title: "Replace used spare clothes", detail: "Create work after an accident or water-play day." }, { title: "Closure cover", detail: "Surface childcare planning six weeks before a closure." }] },
  { id: "car", title: "Car", summary: "MOT, servicing, insurance and useful details.", icon: Car, records: [{ label: "MOT expires", value: "18 October 2026" }, { label: "Registration", value: "AB12 CDE" }, { label: "Tyre pressure", value: "33 PSI" }], rules: [{ title: "Book MOT", detail: "Create a task six weeks before expiry." }, { title: "Record the result", detail: "Completion asks for the new expiry and stores the certificate." }] },
  { id: "bins", title: "Bins", summary: "Collection rhythm without keeping it in your head.", icon: Trash2, records: [{ label: "Collection", value: "Wednesday" }, { label: "Next bin", value: "Green" }, { label: "Pattern", value: "Alternating weekly" }], rules: [{ title: "Put the right bin out", detail: "Tuesday evening, based on the alternating pattern." }, { title: "Bring bins back", detail: "Wednesday evening after collection." }] },
  { id: "food", title: "Food", summary: "Meals, recipes, regular buys and the shopping list.", icon: ShoppingBasket, records: [{ label: "Plan", value: "4 meals planned" }, { label: "Shopping", value: "11 items" }, { label: "Regular buy", value: "Milk every 4 days" }], rules: [{ title: "Build shopping suggestions", detail: "Use meal ingredients and regular purchases." }] },
  { id: "printer", title: "Printer", summary: "The small thing this household chooses to track.", icon: Printer, records: [{ label: "Black cartridge", value: "HP 305" }, { label: "Colour cartridge", value: "HP 305 Tri-colour" }, { label: "Preferred shop", value: "Amazon" }], rules: [{ title: "Order ink", detail: "Create a contextual purchase when stock reaches one cartridge." }] },
];

const initialTasks: Task[] = [
  { id: 1, title: "Put the green bin out", area: "Bins", timing: "Tonight", done: false },
  { id: 2, title: "Replace nursery spare clothes", area: "Nursery", timing: "Before tomorrow", done: false },
  { id: 3, title: "Book the car MOT", area: "Car", timing: "Due this week", done: false },
];

export function AppShell() {
  const [view, setView] = useState<"today" | "areas">("today");
  const [activeArea, setActiveArea] = useState<Area | null>(null);
  const [tasks, setTasks] = useState(initialTasks);
  const openTasks = useMemo(() => tasks.filter((task) => !task.done), [tasks]);

  const toggleTask = (id: number) => setTasks((current) => current.map((task) => task.id === id ? { ...task, done: !task.done } : task));

  return <div className="app">
    <header className="topbar"><div className="brand">ordia</div><div className="household"><span>Fry household</span><div className="avatar">C</div></div></header>
    <div className="layout">
      <aside className="sidebar"><nav className="nav">
        <button className={view === "today" && !activeArea ? "active" : ""} onClick={() => { setView("today"); setActiveArea(null); }}><Home size={18}/>Today</button>
        <button className={view === "areas" || activeArea ? "active" : ""} onClick={() => { setView("areas"); setActiveArea(null); }}><Sparkles size={18}/>Areas</button>
        <button><CalendarDays size={18}/>Calendar</button><button><Search size={18}/>Search</button>
      </nav></aside>
      <main className="main">
        {activeArea ? <AreaView area={activeArea} onBack={() => setActiveArea(null)} /> : view === "today" ? <>
          <div className="eyebrow">Tuesday, 25 July</div><h1 className="headline">What needs attention.</h1><p className="lead">A calm view of the work your household has generated, with the context needed to finish it.</p>
          <section className="section"><div className="section-head"><h2>Today</h2><span className="quiet">{openTasks.length} remaining</span></div><div className="task-list">{tasks.map((task) => <article className={`task ${task.done ? "done" : ""}`} key={task.id}><button aria-label={`Complete ${task.title}`} className="check" onClick={() => toggleTask(task.id)}>{task.done ? <Check size={15}/> : null}</button><div><div className="task-title">{task.title}</div><div className="task-meta">{task.area} · {task.timing}</div></div><span className="pill">Ready</span></article>)}</div></section>
          <AreasSection onOpen={setActiveArea}/>
        </> : <><div className="eyebrow">Your household</div><h1 className="headline">Areas</h1><p className="lead">Create the places where your household naturally looks for knowledge and work.</p><AreasSection onOpen={setActiveArea}/></>}
      </main>
    </div><button className="fab" aria-label="Add"><CirclePlus/></button>
  </div>;
}

function AreasSection({ onOpen }: { onOpen: (area: Area) => void }) { return <section className="section"><div className="section-head"><h2>Areas</h2><span className="quiet">Created by your household</span></div><div className="areas">{areas.map((area) => { const Icon = area.icon; return <button className="area" key={area.id} onClick={() => onOpen(area)}><div className="area-icon"><Icon size={20}/></div><div><div className="area-title">{area.title}</div><div className="area-copy">{area.summary}</div></div></button>; })}<button className="area add"><div className="area-icon"><CirclePlus size={20}/></div><div><div className="area-title">Create an area</div><div className="area-copy">Name it the way your household thinks about it.</div></div></button></div></section>; }

function AreaView({ area, onBack }: { area: Area; onBack: () => void }) { const Icon = area.icon; return <div className="panel"><button className="back" onClick={onBack}><ArrowLeft size={17}/>All areas</button><div className="area-header"><div><div className="area-icon"><Icon size={20}/></div><h1 className="headline">{area.title}</h1><p className="lead">{area.summary}</p></div><button className="primary">Add to {area.title}</button></div><section className="section"><div className="section-head"><h2>What this household knows</h2><span className="quiet">Living record</span></div><div className="record-grid">{area.records.map((record) => <article className="record" key={record.label}><div className="record-label">{record.label}</div><div className="record-value">{record.value}</div></article>)}</div></section><section className="section"><div className="section-head"><h2>What Ordia does with it</h2><span className="quiet">Rules</span></div>{area.rules.map((rule) => <div className="rule" key={rule.title}><div><strong>{rule.title}</strong><span>{rule.detail}</span></div><div style={{display:"flex",alignItems:"center",gap:8}}><span className="status">Active</span><ChevronRight size={17}/></div></div>)}</section></div>; }

"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Archive,
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleEllipsis,
  Clock3,
  Database,
  FileText,
  Home,
  Layers3,
  ListChecks,
  Menu,
  PackageCheck,
  Plus,
  Search,
  ShieldAlert,
  ShoppingBag,
  Sparkles,
  X,
} from "lucide-react";
import {
  areas,
  capabilities,
  entities,
  entityRegistry,
  getArea,
  getEntity,
  getEntityDefinition,
  nurseryBagItems,
  workItems,
  type WorkItem,
} from "@/lib/ordia-domain";

type View = "today" | "areas" | "atlas" | "emergency";

const navItems: { id: View; label: string; icon: typeof Home }[] = [
  { id: "today", label: "Today", icon: Clock3 },
  { id: "areas", label: "Areas", icon: Layers3 },
  { id: "atlas", label: "System atlas", icon: Database },
  { id: "emergency", label: "Emergency", icon: ShieldAlert },
];

function StatusDot({ urgency }: { urgency: WorkItem["urgency"] }) {
  return <span className={`ordia-status-dot ${urgency}`} aria-hidden />;
}

export default function PrototypePage() {
  const [view, setView] = useState<View>("today");
  const [selectedArea, setSelectedArea] = useState<string | null>(null);
  const [selectedEntity, setSelectedEntity] = useState<string | null>(null);
  const [completed, setCompleted] = useState<string[]>([]);
  const [bagChecked, setBagChecked] = useState<string[]>(["water", "comforter", "underwear", "socks"]);
  const [bagOpen, setBagOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [mobileNav, setMobileNav] = useState(false);

  const activeWork = workItems.filter((item) => !completed.includes(item.id));
  const selectedAreaData = selectedArea ? getArea(selectedArea) : undefined;
  const selectedEntityData = selectedEntity ? getEntity(selectedEntity) : undefined;
  const selectedDefinition = selectedEntityData ? getEntityDefinition(selectedEntityData.type) : undefined;

  const searchResults = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return [];
    return entities.filter((entity) =>
      [entity.name, entity.subtitle, entity.status, ...entity.tags, ...entity.facts.map((fact) => fact.value)]
        .join(" ")
        .toLowerCase()
        .includes(normalized),
    );
  }, [query]);

  function openArea(areaId: string) {
    setSelectedArea(areaId);
    setSelectedEntity(null);
    setView("areas");
    setMobileNav(false);
  }

  function openEntity(entityId: string) {
    const entity = getEntity(entityId);
    if (!entity) return;
    setSelectedArea(entity.areaId);
    setSelectedEntity(entityId);
    setView("areas");
    setSearchOpen(false);
  }

  function completeWork(id: string) {
    if (id === "w1") {
      setBagOpen(true);
      return;
    }
    setCompleted((current) => [...current, id]);
  }

  function completeBagCheck() {
    if (bagChecked.length !== nurseryBagItems.length) return;
    setCompleted((current) => [...current, "w1"]);
    setBagOpen(false);
  }

  return (
    <main className="ordia-root">
      <aside className={`ordia-sidebar ${mobileNav ? "is-open" : ""}`}>
        <div className="ordia-wordmark">
          <span className="ordia-mark">O</span>
          <span>Ordia</span>
          <button className="ordia-mobile-close" onClick={() => setMobileNav(false)} aria-label="Close menu">
            <X size={19} />
          </button>
        </div>

        <nav className="ordia-nav" aria-label="Main navigation">
          {navItems.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={view === id && !selectedEntity ? "active" : ""}
              onClick={() => {
                setView(id);
                setSelectedArea(null);
                setSelectedEntity(null);
                setMobileNav(false);
              }}
            >
              <Icon size={18} strokeWidth={1.8} />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        <div className="ordia-sidebar-section">
          <span className="ordia-sidebar-label">Your areas</span>
          {areas.slice(0, 6).map((area) => (
            <button key={area.id} className="ordia-area-link" onClick={() => openArea(area.id)}>
              <span className={`ordia-area-pip ${area.accent}`} />
              <span>{area.name}</span>
              {area.attention > 0 && <small>{area.attention}</small>}
            </button>
          ))}
        </div>

        <div className="ordia-household-switch">
          <span className="ordia-avatar">CF</span>
          <div>
            <strong>Fry household</strong>
            <span>4 members</span>
          </div>
          <CircleEllipsis size={18} />
        </div>
      </aside>

      <section className="ordia-main">
        <header className="ordia-topbar">
          <button className="ordia-mobile-menu" onClick={() => setMobileNav(true)} aria-label="Open menu">
            <Menu size={20} />
          </button>
          <button className="ordia-search-trigger" onClick={() => setSearchOpen(true)}>
            <Search size={18} />
            <span>Find anything in your household</span>
            <kbd>⌘ K</kbd>
          </button>
          <button className="ordia-add-button">
            <Plus size={18} />
            <span>Add</span>
          </button>
        </header>

        <div className="ordia-content">
          {view === "today" && !selectedEntity && <TodayView work={activeWork} completedCount={completed.length} onOpen={openEntity} onComplete={completeWork} />}
          {view === "areas" && !selectedEntity && !selectedArea && <AreasView onOpen={openArea} />}
          {view === "areas" && selectedAreaData && !selectedEntity && <AreaView areaId={selectedAreaData.id} onBack={() => setSelectedArea(null)} onOpen={openEntity} />}
          {selectedEntityData && selectedDefinition && <EntityView entityId={selectedEntityData.id} onBack={() => setSelectedEntity(null)} />}
          {view === "atlas" && !selectedEntity && <AtlasView />}
          {view === "emergency" && !selectedEntity && <EmergencyView onOpen={openEntity} />}
        </div>
      </section>

      {searchOpen && (
        <div className="ordia-overlay" onMouseDown={() => setSearchOpen(false)}>
          <section className="ordia-command" onMouseDown={(event) => event.stopPropagation()}>
            <div className="ordia-command-input">
              <Search size={19} />
              <input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search ink, warranty, Spencer, MOT…" />
              <button onClick={() => setSearchOpen(false)}><X size={18} /></button>
            </div>
            <div className="ordia-command-body">
              {!query && (
                <div className="ordia-command-empty">
                  <Sparkles size={20} />
                  <p>Search understands names, facts, tags and linked household context.</p>
                </div>
              )}
              {query && searchResults.length === 0 && <p className="ordia-muted">Nothing found for “{query}”.</p>}
              {searchResults.map((entity) => (
                <button key={entity.id} className="ordia-search-result" onClick={() => openEntity(entity.id)}>
                  <div>
                    <strong>{entity.name}</strong>
                    <span>{getArea(entity.areaId)?.name} · {getEntityDefinition(entity.type)?.label}</span>
                  </div>
                  <ChevronRight size={18} />
                </button>
              ))}
            </div>
          </section>
        </div>
      )}

      {bagOpen && (
        <div className="ordia-overlay" onMouseDown={() => setBagOpen(false)}>
          <section className="ordia-sheet" onMouseDown={(event) => event.stopPropagation()}>
            <div className="ordia-sheet-head">
              <div>
                <span className="ordia-kicker">Today’s occurrence</span>
                <h2>Check Spencer’s nursery bag</h2>
                <p>The template persists. These ticks belong only to this morning’s check.</p>
              </div>
              <button onClick={() => setBagOpen(false)}><X size={19} /></button>
            </div>
            <div className="ordia-checklist">
              {nurseryBagItems.map((item) => {
                const checked = bagChecked.includes(item.id);
                return (
                  <button
                    key={item.id}
                    className={checked ? "checked" : ""}
                    onClick={() => setBagChecked((current) => checked ? current.filter((id) => id !== item.id) : [...current, item.id])}
                  >
                    <span className="ordia-checkbox">{checked && <Check size={16} />}</span>
                    <span><strong>{item.label}</strong><small>{item.detail}</small></span>
                  </button>
                );
              })}
            </div>
            <div className="ordia-sheet-footer">
              <span>{bagChecked.length} of {nurseryBagItems.length} confirmed</span>
              <button className="ordia-primary" disabled={bagChecked.length !== nurseryBagItems.length} onClick={completeBagCheck}>
                Sign off bag as ready <CheckCircle2 size={17} />
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}

function TodayView({ work, completedCount, onOpen, onComplete }: { work: WorkItem[]; completedCount: number; onOpen: (id: string) => void; onComplete: (id: string) => void }) {
  const now = work.filter((item) => item.urgency !== "soon");
  const soon = work.filter((item) => item.urgency === "soon");
  return (
    <>
      <div className="ordia-page-head">
        <div>
          <span className="ordia-kicker">Friday, 24 July</span>
          <h1>Good morning.</h1>
          <p>{now.length ? `${now.length} things need attention. Everything else can wait.` : "Nothing needs your attention right now."}</p>
        </div>
        {completedCount > 0 && <div className="ordia-complete-note"><CheckCircle2 size={18} /> {completedCount} signed off</div>}
      </div>

      <section className="ordia-section">
        <div className="ordia-section-title"><h2>Needs attention</h2><span>{now.length}</span></div>
        <div className="ordia-work-list">
          {now.map((item) => (
            <article className="ordia-work-row" key={item.id}>
              <button className="ordia-complete-control" onClick={() => onComplete(item.id)} aria-label={`Complete ${item.title}`}><span /></button>
              <button className="ordia-work-copy" onClick={() => onOpen(item.entityId)}>
                <span className="ordia-work-meta"><StatusDot urgency={item.urgency} />{getArea(item.areaId)?.name} · {item.kind}</span>
                <strong>{item.title}</strong>
                <small>{item.context}</small>
              </button>
              <div className="ordia-work-time"><Clock3 size={15} />{item.when}</div>
              <button className="ordia-row-arrow" onClick={() => onOpen(item.entityId)}><ArrowRight size={18} /></button>
            </article>
          ))}
        </div>
      </section>

      <section className="ordia-section ordia-upcoming">
        <div className="ordia-section-title"><h2>Later</h2><span>{soon.length}</span></div>
        {soon.map((item) => (
          <button className="ordia-quiet-row" key={item.id} onClick={() => onOpen(item.entityId)}>
            <span><strong>{item.title}</strong><small>{getArea(item.areaId)?.name} · {item.when}</small></span>
            <ChevronRight size={18} />
          </button>
        ))}
      </section>

      <section className="ordia-context-strip">
        <div><CalendarDays size={19} /><span><strong>Next date</strong>MOT preferred completion · 14 August</span></div>
        <div><PackageCheck size={19} /><span><strong>Ready state</strong>Nursery bag awaiting today’s check</span></div>
        <div><ShoppingBag size={19} /><span><strong>Shopping</strong>1 household supply needs ordering</span></div>
      </section>
    </>
  );
}

function AreasView({ onOpen }: { onOpen: (id: string) => void }) {
  return (
    <>
      <div className="ordia-page-head">
        <div><span className="ordia-kicker">The household, organised your way</span><h1>Areas</h1><p>Each area is a place to look. Typed things inside it retain their own behaviour.</p></div>
        <button className="ordia-secondary"><Plus size={17} /> New area</button>
      </div>
      <div className="ordia-area-grid">
        {areas.map((area) => (
          <button key={area.id} className={`ordia-area-card ${area.accent}`} onClick={() => onOpen(area.id)}>
            <div className="ordia-area-card-top"><span className={`ordia-area-symbol ${area.accent}`}>{area.name.slice(0, 1)}</span>{area.attention > 0 && <span className="ordia-attention">{area.attention} needs attention</span>}</div>
            <div><h2>{area.name}</h2><p>{area.summary}</p></div>
            <div className="ordia-area-card-foot"><span>{area.entityIds.length} connected things</span><ArrowRight size={18} /></div>
          </button>
        ))}
      </div>
    </>
  );
}

function AreaView({ areaId, onBack, onOpen }: { areaId: string; onBack: () => void; onOpen: (id: string) => void }) {
  const area = getArea(areaId)!;
  const areaEntities = entities.filter((entity) => entity.areaId === areaId);
  const work = workItems.filter((item) => item.areaId === areaId);
  return (
    <>
      <button className="ordia-back" onClick={onBack}><ArrowLeft size={17} /> All areas</button>
      <div className="ordia-area-hero">
        <span className={`ordia-area-symbol large ${area.accent}`}>{area.name.slice(0, 1)}</span>
        <div><span className="ordia-kicker">Household area</span><h1>{area.name}</h1><p>{area.summary}</p></div>
        <button className="ordia-secondary"><Plus size={17} /> Add to {area.name}</button>
      </div>

      {work.length > 0 && (
        <section className="ordia-section">
          <div className="ordia-section-title"><h2>Current attention</h2><span>{work.length}</span></div>
          <div className="ordia-area-attention-list">
            {work.map((item) => (
              <button key={item.id} onClick={() => onOpen(item.entityId)}>
                <StatusDot urgency={item.urgency} />
                <span><strong>{item.title}</strong><small>{item.when} · {item.context}</small></span>
                <ChevronRight size={18} />
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="ordia-section">
        <div className="ordia-section-title"><h2>What lives here</h2><span>{areaEntities.length}</span></div>
        <div className="ordia-entity-grid">
          {areaEntities.map((entity) => {
            const definition = getEntityDefinition(entity.type);
            return (
              <button key={entity.id} className="ordia-entity-card" onClick={() => onOpen(entity.id)}>
                <span className="ordia-entity-type">{definition?.label}</span>
                <h3>{entity.name}</h3>
                <p>{entity.subtitle}</p>
                <div><span className="ordia-state">{entity.status}</span><ArrowRight size={17} /></div>
              </button>
            );
          })}
        </div>
      </section>
    </>
  );
}

function EntityView({ entityId, onBack }: { entityId: string; onBack: () => void }) {
  const entity = getEntity(entityId)!;
  const area = getArea(entity.areaId)!;
  const definition = getEntityDefinition(entity.type)!;
  return (
    <>
      <button className="ordia-back" onClick={onBack}><ArrowLeft size={17} /> {area.name}</button>
      <div className="ordia-entity-head">
        <div>
          <span className="ordia-kicker">{area.name} · {definition.label}</span>
          <h1>{entity.name}</h1>
          <p>{entity.subtitle}</p>
        </div>
        <span className="ordia-large-state">{entity.status}</span>
      </div>

      <div className="ordia-detail-layout">
        <div>
          <section className="ordia-detail-section">
            <div className="ordia-section-title"><h2>Known facts</h2></div>
            <dl className="ordia-facts">
              {entity.facts.map((fact) => <div key={fact.label}><dt>{fact.label}</dt><dd>{fact.value}</dd></div>)}
            </dl>
          </section>
          <section className="ordia-detail-section">
            <div className="ordia-section-title"><h2>Connected context</h2></div>
            <div className="ordia-links">
              {entity.links.map((link) => <div key={`${link.relation}-${link.target}`}><span>{link.relation}</span><strong>{link.target}</strong><ChevronRight size={16} /></div>)}
            </div>
          </section>
          {entity.id === "mot-workflow" && <MotFlow />}
          {entity.id === "nursery-bag" && <BagModel />}
          {entity.id === "bin-routine" && <BinFlow />}
          {entity.id === "printer-ink" && <StockModel />}
        </div>
        <aside className="ordia-type-panel">
          <span className="ordia-kicker">Functional type</span>
          <h2>{definition.label}</h2>
          <p>{definition.description}</p>
          <div className="ordia-type-block"><strong>Capabilities</strong>{definition.capabilities.map((item) => <span key={item}>{item}</span>)}</div>
          <div className="ordia-type-block"><strong>Lifecycle</strong><div className="ordia-chip-wrap">{definition.lifecycle.map((item) => <small key={item}>{item}</small>)}</div></div>
          <div className="ordia-type-block"><strong>Can generate</strong>{definition.generates.map((item) => <span key={item}>→ {item}</span>)}</div>
        </aside>
      </div>
    </>
  );
}

function MotFlow() {
  return <section className="ordia-detail-section"><div className="ordia-section-title"><h2>Operational flow</h2></div><div className="ordia-flow"><div className="active"><small>Now</small><strong>Book MOT</strong><span>Reminder every 3 days</span></div><ArrowRight size={18} /><div><small>After booking</small><strong>Attend appointment</strong><span>Date captured from outcome</span></div><ArrowRight size={18} /><div><small>After attendance</small><strong>Update record</strong><span>Certificate + new expiry</span></div></div></section>;
}

function BagModel() {
  return <section className="ordia-detail-section"><div className="ordia-section-title"><h2>Persistent template</h2><span>6 items</span></div><div className="ordia-template-list">{nurseryBagItems.map((item) => <div key={item.id}><ListChecks size={17} /><span><strong>{item.label}</strong><small>{item.detail}</small></span><span>{item.required ? "Required" : "Optional"}</span></div>)}</div></section>;
}

function BinFlow() {
  return <section className="ordia-detail-section"><div className="ordia-section-title"><h2>This occurrence</h2></div><div className="ordia-timeline"><div><span>Tue · 19:00</span><strong>Prepare green collection</strong><p>Gather garden waste, empty relevant indoor bins and put bin at kerb.</p></div><div><span>Wed · morning</span><strong>Collection event</strong><p>The rotation advances only when this occurrence resolves.</p></div><div><span>Wed · 18:00</span><strong>Bring bin back in</strong><p>A separate follow-up because it happens later and can be forgotten independently.</p></div></div></section>;
}

function StockModel() {
  return <section className="ordia-detail-section"><div className="ordia-section-title"><h2>Stock logic</h2></div><div className="ordia-stock"><div><span>Black</span><strong>1</strong><small>Above threshold</small></div><div className="empty"><span>Colour</span><strong>0</strong><small>Purchase action generated</small></div></div><div className="ordia-rule-line"><span>When quantity reaches 0</span><ArrowRight size={17} /><strong>Add contextual purchase action</strong><ArrowRight size={17} /><span>Purchase writes quantity, retailer and price back</span></div></section>;
}

function AtlasView() {
  const [family, setFamily] = useState<string>("All");
  const families = ["All", ...Array.from(new Set(entityRegistry.map((entity) => entity.family)))];
  const visible = family === "All" ? entityRegistry : entityRegistry.filter((entity) => entity.family === family);
  return (
    <>
      <div className="ordia-page-head">
        <div><span className="ordia-kicker">The functional household ontology</span><h1>System atlas</h1><p>{entityRegistry.length} typed entities, {capabilities.length} reusable capabilities and explicit operational behaviour.</p></div>
      </div>
      <div className="ordia-atlas-summary">
        <div><strong>{entityRegistry.length}</strong><span>concrete types</span></div><div><strong>{families.length - 1}</strong><span>domain families</span></div><div><strong>{capabilities.length}</strong><span>capability modules</span></div><div><strong>1</strong><span>connected household graph</span></div>
      </div>
      <div className="ordia-filter-row">{families.map((item) => <button className={family === item ? "active" : ""} key={item} onClick={() => setFamily(item)}>{item}</button>)}</div>
      <div className="ordia-atlas-grid">
        {visible.map((definition) => (
          <article key={definition.type} className="ordia-atlas-card">
            <span>{definition.family}</span><h2>{definition.label}</h2><p>{definition.description}</p>
            <div><strong>{definition.fields.length}</strong><small>structured fields</small><strong>{definition.capabilities.length}</strong><small>capabilities</small><strong>{definition.generates.length}</strong><small>outputs</small></div>
            <details><summary>Functional definition</summary><h4>Lifecycle</h4><p>{definition.lifecycle.join(" → ")}</p><h4>Relationships</h4><p>{definition.relationships.join(" · ")}</p><h4>Generates</h4><p>{definition.generates.join(" · ")}</p></details>
          </article>
        ))}
      </div>
    </>
  );
}

function EmergencyView({ onOpen }: { onOpen: (id: string) => void }) {
  const emergencyEntities = entities.filter((entity) => entity.tags.includes("emergency"));
  return (
    <>
      <div className="ordia-page-head emergency">
        <div><span className="ordia-kicker">Fast, curated household access</span><h1>Emergency</h1><p>One projection of the same records. Nothing is duplicated or moved from its real home.</p></div>
        <AlertTriangle size={34} />
      </div>
      <div className="ordia-emergency-grid">
        <section><span>Home & appliances</span>{emergencyEntities.map((entity) => <button key={entity.id} onClick={() => onOpen(entity.id)}><div><strong>{entity.name}</strong><small>{entity.facts[1]?.value}</small></div><ChevronRight size={18} /></button>)}</section>
        <section><span>Quick knowledge</span><button><div><strong>Water stopcock</strong><small>Under kitchen sink · red lever</small></div><ChevronRight size={18} /></button><button><div><strong>Fuse box</strong><small>Hall cupboard · upper shelf</small></div><ChevronRight size={18} /></button><button><div><strong>Home insurance</strong><small>Policy and 24-hour claim line</small></div><ChevronRight size={18} /></button></section>
      </div>
      <div className="ordia-emergency-note"><FileText size={19} /><span><strong>Designed for pressure</strong>Large targets, verified facts, emergency contacts and offline-ready documents — sourced from records elsewhere in the household graph.</span></div>
    </>
  );
}

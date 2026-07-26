import Link from "next/link";
import { CalendarDays, Check, ChevronRight, Circle, Plus, ShoppingBasket, Sparkles, Users } from "lucide-react";

const responsibilities = [
  { title: "Book Rory's dentist appointment", meta: "Health · This week", owner: "You", urgent: true },
  { title: "Choose meals for next week", meta: "Meals · Sunday", owner: "Together", urgent: false },
  { title: "Renew home insurance", meta: "Home · 12 days", owner: "Connor", urgent: false },
];

const spaces = [
  { title: "Shopping", detail: "8 items", icon: ShoppingBasket },
  { title: "Meals", detail: "3 evenings open", icon: CalendarDays },
  { title: "Household", detail: "6 active", icon: Users },
];

export default function Home() {
  return (
    <main className="shell">
      <aside className="rail">
        <div className="brand-mark">O</div>
        <nav aria-label="Primary navigation">
          <button className="rail-button active" aria-label="Today"><Sparkles size={20} /></button>
          <button className="rail-button" aria-label="Household"><Users size={20} /></button>
          <button className="rail-button" aria-label="Shopping"><ShoppingBasket size={20} /></button>
          <Link className="rail-button" aria-label="Itinerary" href="/itinerary"><CalendarDays size={20} /></Link>
        </nav>
        <div className="avatar">VF</div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">Sunday, 26 July</p>
            <h1>Good morning, Victoria.</h1>
            <p className="lede">Here’s what needs holding today. Not everything needs doing now.</p>
          </div>
          <button className="primary"><Plus size={18} /> Add something</button>
        </header>

        <section className="pulse-card">
          <div className="pulse-copy">
            <span className="signal"><Sparkles size={16} /> Household pulse</span>
            <h2>Today is manageable.</h2>
            <p>One time-sensitive task, two shared decisions and a shopping list already in progress.</p>
          </div>
          <div className="balance">
            <span>Load this week</span>
            <div className="balance-row"><strong>You</strong><div className="bar"><i style={{ width: "58%" }} /></div><b>58%</b></div>
            <div className="balance-row"><strong>Connor</strong><div className="bar"><i style={{ width: "42%" }} /></div><b>42%</b></div>
          </div>
        </section>

        <div className="content-grid">
          <section className="panel attention">
            <div className="section-heading">
              <div><p className="eyebrow">Needs attention</p><h2>The things currently being carried</h2></div>
              <button className="text-button">View all <ChevronRight size={16} /></button>
            </div>
            <div className="task-list">
              {responsibilities.map((item) => (
                <article className="task" key={item.title}>
                  <button className="complete" aria-label={`Complete ${item.title}`}><Circle size={20} /></button>
                  <div className="task-copy"><h3>{item.title}</h3><p>{item.meta}</p></div>
                  <span className={item.owner === "Together" ? "owner together" : "owner"}>{item.owner}</span>
                  {item.urgent && <span className="urgent">Soon</span>}
                </article>
              ))}
            </div>
            <button className="quiet-add"><Plus size={17} /> Capture something on your mind</button>
          </section>

          <aside className="panel today">
            <p className="eyebrow">Today</p>
            <h2>A lighter view</h2>
            <div className="today-item done"><span><Check size={16} /></span><div><strong>Nursery bag packed</strong><small>Completed by Connor</small></div></div>
            <div className="today-item"><span>11:30</span><div><strong>Rory swimming</strong><small>Wellingborough Leisure Centre</small></div></div>
            <div className="today-item"><span>17:30</span><div><strong>Dinner</strong><small>No meal chosen yet</small></div></div>
            <Link className="quiet-add" href="/itinerary"><CalendarDays size={17} /> Open household itinerary</Link>
          </aside>
        </div>

        <section className="spaces-section">
          <div className="section-heading"><div><p className="eyebrow">Shared spaces</p><h2>The practical parts of life</h2></div></div>
          <div className="space-grid">
            {spaces.map(({ title, detail, icon: Icon }) => (
              <button className="space-card" key={title}><span className="space-icon"><Icon size={21} /></span><span><strong>{title}</strong><small>{detail}</small></span><ChevronRight size={18} /></button>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
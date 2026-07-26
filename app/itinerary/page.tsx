import Link from "next/link";
import {
  ArrowLeft,
  CalendarClock,
  Check,
  ChevronRight,
  Circle,
  Clock3,
  MapPin,
  Navigation,
  Phone,
  Plus,
  Repeat2,
  RotateCcw,
  Sparkles,
  TriangleAlert,
} from "lucide-react";
import styles from "./itinerary.module.css";

const nurseryItems = [
  { label: "Spare clothes", detail: "7 of 9 packed", done: false, warning: true },
  { label: "Water bottle", detail: "Packed", done: true, warning: false },
  { label: "Comforter", detail: "Packed", done: true, warning: false },
];

export default function ItineraryPage() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <Link className={styles.back} href="/"><ArrowLeft size={16} /> Home</Link>
          <p className={styles.eyebrow}>Sunday, 26 July</p>
          <h1>Your household itinerary</h1>
          <p className={styles.intro}>The useful detail around your day, without filling your calendar with every step.</p>
        </div>
        <button className={styles.primary}><Plus size={18} /> Add itinerary item</button>
      </header>

      <section className={styles.summary}>
        <div>
          <span><Sparkles size={16} /> Today&apos;s rhythm</span>
          <h2>Two things need attention before you leave.</h2>
          <p>Ordia keeps the checks, useful details and linked reminders beside the moment they support.</p>
        </div>
        <div className={styles.summaryStat}>
          <strong>08:00–08:15</strong>
          <small>Leave for nursery</small>
        </div>
      </section>

      <div className={styles.layout}>
        <section className={styles.timelinePanel}>
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.eyebrow}>Today</p>
              <h2>Before nursery</h2>
            </div>
            <button className={styles.textButton}>Edit routine</button>
          </div>

          <article className={`${styles.timelineItem} ${styles.checkItem}`}>
            <div className={styles.timeMarker}><span>07:55</span><i /></div>
            <div className={styles.itemCard}>
              <div className={styles.itemTopline}>
                <span className={styles.kind}><Check size={14} /> Check</span>
                <span className={styles.linked}><Clock3 size={13} /> Due before leaving</span>
              </div>
              <div className={styles.itemHeading}>
                <button className={styles.outerCheck} aria-label="Mark nursery bag check complete"><Circle size={22} /></button>
                <div>
                  <h3>Check Spencer&apos;s nursery bag</h3>
                  <p>The outer check clears automatically when the list is complete, or can be cleared manually.</p>
                </div>
              </div>

              <div className={styles.checklist}>
                {nurseryItems.map((item) => (
                  <button className={styles.checkRow} key={item.label}>
                    <span className={item.done ? styles.checkedCircle : styles.emptyCircle}>{item.done && <Check size={13} />}</span>
                    <span><strong>{item.label}</strong><small>{item.detail}</small></span>
                    {item.warning ? <TriangleAlert className={styles.warningIcon} size={17} /> : <ChevronRight size={16} />}
                  </button>
                ))}
                <button className={styles.openList}>Open full bag check <ChevronRight size={16} /></button>
              </div>

              <div className={styles.attentionNotice}>
                <TriangleAlert size={16} />
                <span><strong>Two things need replacing.</strong> These were marked after the last nursery day.</span>
              </div>
            </div>
          </article>

          <article className={styles.timelineItem}>
            <div className={styles.timeMarker}><span>08:00</span><i /></div>
            <div className={styles.itemCard}>
              <div className={styles.itemTopline}>
                <span className={`${styles.kind} ${styles.reminderKind}`}><CalendarClock size={14} /> Reminder</span>
                <span className={styles.noCheck}>No completion needed</span>
              </div>
              <div className={styles.itemHeading}>
                <div className={styles.eventIcon}><Navigation size={19} /></div>
                <div>
                  <h3>Leave for nursery</h3>
                  <p>Leave between 08:00 and 08:15</p>
                </div>
              </div>
              <div className={styles.placeCard}>
                <div className={styles.placeCopy}>
                  <MapPin size={17} />
                  <span><strong>Spencer&apos;s Nursery</strong><small>Preschool room · Saved place</small></span>
                </div>
                <div className={styles.placeActions}>
                  <button><Navigation size={15} /> Navigate</button>
                  <button><Phone size={15} /> Call</button>
                </div>
              </div>
            </div>
          </article>
        </section>

        <aside className={styles.sideColumn}>
          <section className={styles.sidePanel}>
            <p className={styles.eyebrow}>Coming rhythm</p>
            <h2>Linked and rotating</h2>

            <article className={styles.compactItem}>
              <span className={styles.compactIcon}><Repeat2 size={18} /></span>
              <div><strong>Take recycling bins out</strong><small>Tuesday evening · Linked to bin day</small></div>
              <span className={styles.badge}>Green</span>
            </article>

            <article className={styles.compactItem}>
              <span className={styles.compactIcon}><CalendarClock size={18} /></span>
              <div><strong>Bin day</strong><small>Wednesday · Alternates weekly</small></div>
              <span className={styles.badge}>Green</span>
            </article>
          </section>

          <section className={styles.sidePanel}>
            <p className={styles.eyebrow}>Chores</p>
            <h2>Due from the last completion</h2>
            <article className={styles.chore}>
              <div className={styles.choreHeader}>
                <span className={styles.compactIcon}><RotateCcw size={18} /></span>
                <span><strong>Clean the fridge</strong><small>Every 4 weeks</small></span>
              </div>
              <div className={styles.dueRow}><span>Next due</span><strong>In 11 days</strong></div>
              <p>Completing it early restarts the four-week sequence from that day.</p>
              <button className={styles.doneButton}><Check size={16} /> Mark done today</button>
            </article>
          </section>
        </aside>
      </div>
    </main>
  );
}
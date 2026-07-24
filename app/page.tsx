import Link from "next/link";
import { ArrowRight, CircleUserRound, Link2, Orbit, ShieldCheck } from "lucide-react";
import { Brand } from "@/components/Brand";

const principles = [
  {
    icon: CircleUserRound,
    title: "Knowledge that can act",
    body: "Typed household records retain the exact context, rules and outcomes that everyday work depends on.",
  },
  {
    icon: Link2,
    title: "One connected household",
    body: "Areas are places to look. Relationships let the same fact support tasks, emergencies, shopping and planning.",
  },
  {
    icon: ShieldCheck,
    title: "Work that closes the loop",
    body: "Cadence, thresholds and deadlines create contextual work whose sign-off updates the household record.",
  },
];

export default function HomePage() {
  return (
    <main className="landing-shell">
      <nav className="landing-nav">
        <Brand />
        <div className="header-actions">
          <Link className="text-link" href="/prototype">
            Open prototype
          </Link>
          <Link className="text-link" href="/signin">
            Sign in
          </Link>
        </div>
      </nav>

      <section className="hero-grid">
        <div className="hero-copy">
          <div className="eyebrow">
            <Orbit size={16} /> The household operating system
          </div>
          <h1>Home life, held together.</h1>
          <p className="hero-lead">
            Ordia keeps the knowledge behind household life, knows when it matters,
            and gives the right person enough context to act without asking someone
            else to remember it for them.
          </p>
          <div className="hero-actions">
            <Link className="primary-button" href="/prototype">
              Explore the new Ordia <ArrowRight size={18} />
            </Link>
            <span className="supporting-copy">A functional prototype of the new household model.</span>
          </div>
        </div>

        <div className="context-orbit" aria-label="Ordia household model illustration">
          <div className="orbit-ring orbit-one" />
          <div className="orbit-ring orbit-two" />
          <div className="orbit-ring orbit-three" />
          <div className="orbit-core">
            <span>Household</span>
            <strong>Living context</strong>
          </div>
          <div className="orbit-node node-one">Knowledge</div>
          <div className="orbit-node node-two">Rules</div>
          <div className="orbit-node node-three">Work</div>
          <div className="orbit-node node-four">History</div>
        </div>
      </section>

      <section className="principle-grid">
        {principles.map(({ icon: Icon, title, body }) => (
          <article className="principle-card" key={title}>
            <Icon size={21} />
            <h2>{title}</h2>
            <p>{body}</p>
          </article>
        ))}
      </section>
    </main>
  );
}

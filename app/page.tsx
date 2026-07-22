import Link from "next/link";
import { ArrowRight, CircleUserRound, Link2, Orbit, ShieldCheck } from "lucide-react";
import { Brand } from "@/components/Brand";

const principles = [
  {
    icon: CircleUserRound,
    title: "Know the people",
    body: "Preferences, needs and context that make thoughtful action possible.",
  },
  {
    icon: Link2,
    title: "Share the understanding",
    body: "One household record that both partners can build and use.",
  },
  {
    icon: ShieldCheck,
    title: "Keep access intentional",
    body: "Household membership and roles define who can see and change shared information.",
  },
];

export default function HomePage() {
  return (
    <main className="landing-shell">
      <nav className="landing-nav">
        <Brand />
        <Link className="text-link" href="/signin">
          Sign in
        </Link>
      </nav>

      <section className="hero-grid">
        <div className="hero-copy">
          <div className="eyebrow">
            <Orbit size={16} /> Shared household context
          </div>
          <h1>The life you share, understood by both of you.</h1>
          <p className="hero-lead">
            Ordia gives a household one place for the people, responsibilities and
            context behind everyday life — so care does not depend on one person
            remembering everything.
          </p>
          <div className="hero-actions">
            <Link className="primary-button" href="/signin?flow=signUp">
              Create your household <ArrowRight size={18} />
            </Link>
            <span className="supporting-copy">Private by default. Shared by invitation.</span>
          </div>
        </div>

        <div className="context-orbit" aria-label="Ordia household model illustration">
          <div className="orbit-ring orbit-one" />
          <div className="orbit-ring orbit-two" />
          <div className="orbit-ring orbit-three" />
          <div className="orbit-core">
            <span>Household</span>
            <strong>Shared context</strong>
          </div>
          <div className="orbit-node node-one">People</div>
          <div className="orbit-node node-two">Ownership</div>
          <div className="orbit-node node-three">Routines</div>
          <div className="orbit-node node-four">Dates</div>
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

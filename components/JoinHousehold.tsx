"use client";

import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { ArrowRight, CircleAlert, LoaderCircle, Users } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { api } from "@/convex/_generated/api";
import { Brand } from "@/components/Brand";

export function JoinHousehold({ token }: { token: string }) {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const preview = useQuery(api.invitations.preview, isAuthenticated ? { token } : "skip");
  const accept = useMutation(api.invitations.accept);
  const router = useRouter();
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (isLoading) {
    return (
      <JoinState>
        <LoaderCircle className="spin" size={28} />
        <p>Checking invitation…</p>
      </JoinState>
    );
  }

  if (!isAuthenticated) {
    return (
      <JoinState>
        <Users size={30} />
        <h1>You have been invited to an Ordia household.</h1>
        <p>Sign in with the invited email address before accepting.</p>
        <Link
          className="primary-button"
          href={`/signin?next=${encodeURIComponent(`/join/${token}`)}`}
        >
          Sign in to continue <ArrowRight size={18} />
        </Link>
      </JoinState>
    );
  }

  if (preview === undefined) {
    return (
      <JoinState>
        <LoaderCircle className="spin" size={28} />
        <p>Opening invitation…</p>
      </JoinState>
    );
  }

  if (preview === null) {
    return (
      <JoinState>
        <CircleAlert size={30} />
        <h1>This invitation cannot be found.</h1>
        <p>Ask the household owner to create a new invitation link.</p>
        <Link className="secondary-button" href="/app">Open Ordia</Link>
      </JoinState>
    );
  }

  return (
    <JoinState>
      <div className="join-household-icon"><Users size={28} /></div>
      <span className="section-kicker">Household invitation</span>
      <h1>Join {preview.householdName}</h1>
      <p>
        This invitation grants <strong>{preview.role}</strong> access to the shared
        household space for <strong>{preview.email}</strong>.
      </p>

      {preview.status !== "pending" ? (
        <div className="form-error">This invitation is {preview.status}.</div>
      ) : !preview.canAccept ? (
        <div className="form-error">
          You are signed in as {preview.signedInEmail ?? "an account without an email"}.
          Sign in as {preview.email} to accept.
        </div>
      ) : null}

      {error && <div className="form-error">{error}</div>}

      <button
        className="primary-button full-width"
        disabled={!preview.canAccept || accepting}
        onClick={async () => {
          setAccepting(true);
          setError(null);
          try {
            await accept({ token });
            router.replace("/app");
          } catch (caught) {
            setError(caught instanceof Error ? caught.message : "Could not accept invitation.");
            setAccepting(false);
          }
        }}
      >
        {accepting ? <LoaderCircle className="spin" size={18} /> : <ArrowRight size={18} />}
        Accept invitation
      </button>
    </JoinState>
  );
}

function JoinState({ children }: { children: ReactNode }) {
  return (
    <main className="join-shell">
      <Brand />
      <section className="join-card">{children}</section>
    </main>
  );
}

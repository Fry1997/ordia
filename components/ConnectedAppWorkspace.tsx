"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import {
  Authenticated,
  AuthLoading,
  Unauthenticated,
  useMutation,
  useQuery,
} from "convex/react";
import { ChevronDown, Home, LoaderCircle, LogOut, Plus } from "lucide-react";
import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { api } from "@/convex/_generated/api";
import { Brand } from "@/components/Brand";
import { ConnectedWorkspace } from "@/components/ConnectedWorkspace";

export function ConnectedAppWorkspace() {
  return (
    <>
      <AuthLoading>
        <FullPageLoading label="Loading Ordia…" />
      </AuthLoading>
      <Unauthenticated>
        <main className="centered-state">
          <Brand />
          <h1>Your session has ended.</h1>
          <p>Sign in again to access your household.</p>
          <Link className="primary-button" href="/signin?next=/app">
            Sign in
          </Link>
        </main>
      </Unauthenticated>
      <Authenticated>
        <WorkspaceContent />
      </Authenticated>
    </>
  );
}

function WorkspaceContent() {
  const viewer = useQuery(api.profiles.viewer, {});
  const households = useQuery(api.households.listMine, {});
  const createHousehold = useMutation(api.households.create);
  const { signOut } = useAuthActions();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const selectedHousehold = useMemo(() => {
    if (!households?.length) return null;
    return (
      households.find((household) => household.householdId === selectedId) ??
      households[0]
    );
  }, [households, selectedId]);

  if (viewer === undefined || households === undefined) {
    return <FullPageLoading label="Gathering your household context…" />;
  }

  if (households.length === 0) {
    return (
      <HouseholdOnboarding
        initialDisplayName={viewer?.displayName ?? ""}
        onCreate={async (displayName, householdName) => {
          await createHousehold({ displayName, householdName });
        }}
        onSignOut={() => void signOut()}
      />
    );
  }

  if (!selectedHousehold) {
    return <FullPageLoading label="Opening household…" />;
  }

  return (
    <main className="app-shell connected-app-shell">
      <header className="app-header connected-app-header">
        <Brand />
        <div className="connected-header-actions">
          {households.length > 1 && (
            <label className="household-switcher compact-switcher">
              <span>Household</span>
              <div>
                <select
                  value={selectedHousehold.householdId}
                  onChange={(event) => setSelectedId(event.target.value)}
                >
                  {households.map((household) => (
                    <option key={household.householdId} value={household.householdId}>
                      {household.name}
                    </option>
                  ))}
                </select>
                <ChevronDown size={16} />
              </div>
            </label>
          )}
          <button
            className="icon-button"
            type="button"
            onClick={() => setShowCreate((value) => !value)}
          >
            <Plus size={18} />
            <span className="desktop-only">New household</span>
          </button>
          <button className="icon-button" type="button" onClick={() => void signOut()}>
            <LogOut size={18} />
            <span className="desktop-only">Sign out</span>
          </button>
        </div>
      </header>

      {showCreate && (
        <InlineHouseholdCreator
          initialDisplayName={viewer?.displayName ?? ""}
          onCancel={() => setShowCreate(false)}
          onCreate={async (displayName, householdName) => {
            const householdId = await createHousehold({ displayName, householdName });
            setSelectedId(householdId);
            setShowCreate(false);
          }}
        />
      )}

      <ConnectedWorkspace
        householdId={selectedHousehold.householdId}
        householdName={selectedHousehold.name}
        role={selectedHousehold.role}
      />
    </main>
  );
}

function HouseholdOnboarding({
  initialDisplayName,
  onCreate,
  onSignOut,
}: {
  initialDisplayName: string;
  onCreate: (displayName: string, householdName: string) => Promise<void>;
  onSignOut: () => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setSubmitting(true);
    setError(null);
    try {
      await onCreate(
        String(formData.get("displayName") ?? ""),
        String(formData.get("householdName") ?? ""),
      );
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not create the household.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="onboarding-shell">
      <header className="app-header onboarding-header">
        <Brand />
        <button className="icon-button" type="button" onClick={onSignOut}>
          <LogOut size={18} /> Sign out
        </button>
      </header>
      <section className="onboarding-card connected-onboarding-card">
        <div className="onboarding-symbol" aria-hidden="true"><Home size={28} /></div>
        <span className="section-kicker">Create your household map</span>
        <h1>Give household knowledge somewhere to live.</h1>
        <p>
          Use Ordia alone or together. A household connects responsibilities, routines,
          people, preferences, places and practical know-how without requiring anyone
          else to join the app.
        </p>
        <form className="form-stack" onSubmit={submit}>
          <label><span>Your name</span><input name="displayName" defaultValue={initialDisplayName} placeholder="Connor" required /></label>
          <label><span>Household name</span><input name="householdName" placeholder="The Fry household" required /></label>
          {error && <div className="form-error">{error}</div>}
          <button className="primary-button full-width" disabled={submitting} type="submit">
            {submitting ? <LoaderCircle className="spin" size={18} /> : <Plus size={18} />}
            Create household
          </button>
        </form>
      </section>
    </main>
  );
}

function InlineHouseholdCreator({
  initialDisplayName,
  onCreate,
  onCancel,
}: {
  initialDisplayName: string;
  onCreate: (displayName: string, householdName: string) => Promise<void>;
  onCancel: () => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  return (
    <form
      className="inline-create-panel"
      onSubmit={async (event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        setSubmitting(true);
        try {
          await onCreate(
            String(formData.get("displayName") ?? ""),
            String(formData.get("householdName") ?? ""),
          );
        } finally {
          setSubmitting(false);
        }
      }}
    >
      <input name="displayName" type="hidden" value={initialDisplayName} />
      <label><span>New household name</span><input name="householdName" placeholder="Another organising space" required /></label>
      <div className="button-row">
        <button className="secondary-button" type="button" onClick={onCancel}>Cancel</button>
        <button className="primary-button" disabled={submitting} type="submit">{submitting ? <LoaderCircle className="spin" size={18} /> : <Plus size={18} />}Create</button>
      </div>
    </form>
  );
}

function FullPageLoading({ label }: { label: string }) {
  return <main className="centered-state"><LoaderCircle className="spin" size={30} /><p>{label}</p></main>;
}
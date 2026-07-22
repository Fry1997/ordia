"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import {
  Authenticated,
  AuthLoading,
  Unauthenticated,
  useMutation,
  useQuery,
} from "convex/react";
import {
  Check,
  ChevronDown,
  Copy,
  Home,
  Link2,
  LoaderCircle,
  LogOut,
  Plus,
  ShieldCheck,
  UserRoundPlus,
  Users,
} from "lucide-react";
import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Brand } from "@/components/Brand";

export function AppWorkspace() {
  return (
    <>
      <AuthLoading>
        <FullPageLoading label="Loading your shared space…" />
      </AuthLoading>
      <Unauthenticated>
        <main className="centered-state">
          <Brand />
          <h1>Your session has ended.</h1>
          <p>Sign in again to access your households.</p>
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
    <main className="app-shell">
      <header className="app-header">
        <Brand />
        <div className="header-actions">
          <button className="icon-button" onClick={() => setShowCreate((value) => !value)}>
            <Plus size={18} />
            <span className="desktop-only">New household</span>
          </button>
          <button className="icon-button" onClick={() => void signOut()}>
            <LogOut size={18} />
            <span className="desktop-only">Sign out</span>
          </button>
        </div>
      </header>

      <section className="workspace-heading">
        <div>
          <span className="section-kicker">Your shared space</span>
          <h1>{selectedHousehold.name}</h1>
          <p>
            Membership is the foundation. Everything Ordia stores next will belong
            to a household and inherit its access rules.
          </p>
        </div>
        <label className="household-switcher">
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
      </section>

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

      <HouseholdOverview
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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
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
        <button className="icon-button" onClick={onSignOut}>
          <LogOut size={18} /> Sign out
        </button>
      </header>
      <section className="onboarding-card">
        <div className="onboarding-symbol" aria-hidden="true">
          <Home size={28} />
        </div>
        <span className="section-kicker">Create the shared boundary</span>
        <h1>Start with your household.</h1>
        <p>
          A household is the secure container for people, preferences, routines,
          responsibilities and everything else you choose to share.
        </p>
        <form className="form-stack" onSubmit={handleSubmit}>
          <label>
            <span>Your name</span>
            <input
              name="displayName"
              defaultValue={initialDisplayName}
              placeholder="Connor"
              required
            />
          </label>
          <label>
            <span>Household name</span>
            <input name="householdName" placeholder="The Fry household" required />
          </label>
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
      <label>
        <span>New household name</span>
        <input name="householdName" placeholder="Another shared space" required />
      </label>
      <div className="button-row">
        <button className="secondary-button" type="button" onClick={onCancel}>
          Cancel
        </button>
        <button className="primary-button" disabled={submitting} type="submit">
          {submitting ? <LoaderCircle className="spin" size={18} /> : <Plus size={18} />}
          Create
        </button>
      </div>
    </form>
  );
}

function HouseholdOverview({
  householdId,
  householdName,
  role,
}: {
  householdId: Id<"households">;
  householdName: string;
  role: "owner" | "admin" | "member";
}) {
  const members = useQuery(api.households.listMembers, { householdId });
  const [now] = useState(() => Date.now());
  const invitations = useQuery(
    api.invitations.listForHousehold,
    role === "owner" || role === "admin" ? { householdId, now } : "skip",
  );
  const createInvitation = useMutation(api.invitations.create);
  const revokeInvitation = useMutation(api.invitations.revoke);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const canInvite = role === "owner" || role === "admin";

  async function handleInvite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    setInviteError(null);
    setCopied(false);
    try {
      const result = await createInvitation({
        householdId,
        email: String(formData.get("email") ?? ""),
        role: formData.get("role") === "admin" ? "admin" : "member",
      });
      const link = `${window.location.origin}/join/${result.token}`;
      setInviteLink(link);
      form.reset();
    } catch (caught) {
      setInviteError(caught instanceof Error ? caught.message : "Could not create invitation.");
    }
  }

  return (
    <div className="workspace-grid">
      <section className="surface-card members-card">
        <div className="surface-heading">
          <div>
            <span className="section-kicker">People with access</span>
            <h2>Household members</h2>
          </div>
          <div className="count-badge">
            <Users size={15} /> {members?.length ?? 0}
          </div>
        </div>

        <div className="member-list">
          {members === undefined ? (
            <InlineLoading />
          ) : (
            members.map((member) => (
              <article className="member-row" key={member.membershipId}>
                <div className="member-avatar">
                  {member.displayName.slice(0, 1).toUpperCase()}
                </div>
                <div className="member-copy">
                  <strong>{member.displayName}</strong>
                  <span>{member.email ?? "No email recorded"}</span>
                </div>
                <span className={`role-pill role-${member.role}`}>{member.role}</span>
              </article>
            ))
          )}
        </div>
      </section>

      <section className="surface-card invitation-card">
        <div className="surface-heading">
          <div>
            <span className="section-kicker">Shared access</span>
            <h2>Invite someone</h2>
          </div>
          <UserRoundPlus size={21} />
        </div>

        {canInvite ? (
          <>
            <p className="surface-intro">
              Invitations are tied to an email address and expire after seven days.
            </p>
            <form className="form-stack compact-form" onSubmit={handleInvite}>
              <label>
                <span>Email address</span>
                <input name="email" type="email" placeholder="partner@example.com" required />
              </label>
              <label>
                <span>Access level</span>
                <select name="role" defaultValue="member">
                  <option value="member">Member — use shared household data</option>
                  <option value="admin">Admin — also manage invitations</option>
                </select>
              </label>
              {inviteError && <div className="form-error">{inviteError}</div>}
              <button className="primary-button full-width" type="submit">
                <Link2 size={18} /> Create invitation link
              </button>
            </form>

            {inviteLink && (
              <div className="invite-result">
                <div>
                  <span>Invitation ready</span>
                  <code>{inviteLink}</code>
                </div>
                <button
                  className="secondary-button"
                  type="button"
                  onClick={async () => {
                    await navigator.clipboard.writeText(inviteLink);
                    setCopied(true);
                  }}
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
            )}

            <div className="pending-list">
              <h3>Pending invitations</h3>
              {invitations === undefined ? (
                <InlineLoading />
              ) : invitations.length === 0 ? (
                <p className="empty-copy">No one is waiting to join {householdName}.</p>
              ) : (
                invitations.map((invitation) => (
                  <article className="pending-row" key={invitation.invitationId}>
                    <div>
                      <strong>{invitation.email}</strong>
                      <span>
                        {invitation.role} · expires {new Date(invitation.expiresAt).toLocaleDateString()}
                      </span>
                    </div>
                    <button
                      className="text-button"
                      type="button"
                      onClick={() =>
                        void revokeInvitation({
                          householdId,
                          invitationId: invitation.invitationId,
                        })
                      }
                    >
                      Revoke
                    </button>
                  </article>
                ))
              )}
            </div>
          </>
        ) : (
          <div className="permission-note">
            <ShieldCheck size={22} />
            <div>
              <strong>Your access is protected.</strong>
              <p>Only household owners and admins can invite additional members.</p>
            </div>
          </div>
        )}
      </section>

      <section className="surface-card foundation-card">
        <div className="surface-heading">
          <div>
            <span className="section-kicker">What this unlocks</span>
            <h2>The household becomes the relational root.</h2>
          </div>
        </div>
        <div className="foundation-flow">
          <div><span>01</span><strong>People</strong><p>Profiles, relationships and private visibility.</p></div>
          <div><span>02</span><strong>Context</strong><p>Preferences, needs, stresses and key facts.</p></div>
          <div><span>03</span><strong>Ownership</strong><p>Responsibilities, routines, dates and handovers.</p></div>
          <div><span>04</span><strong>Action</strong><p>Meals, lists, reminders and practical execution.</p></div>
        </div>
      </section>
    </div>
  );
}

function FullPageLoading({ label }: { label: string }) {
  return (
    <main className="centered-state">
      <LoaderCircle className="spin" size={30} />
      <p>{label}</p>
    </main>
  );
}

function InlineLoading() {
  return (
    <div className="inline-loading">
      <LoaderCircle className="spin" size={18} /> Loading…
    </div>
  );
}

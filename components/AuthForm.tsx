"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth } from "convex/react";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

function safeDestination(value: string | null): string {
  return value?.startsWith("/") && !value.startsWith("//") ? value : "/app";
}

export function AuthForm() {
  const { signIn } = useAuthActions();
  const { isAuthenticated, isLoading } = useConvexAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialFlow = searchParams.get("flow") === "signUp" ? "signUp" : "signIn";
  const [flow, setFlow] = useState<"signIn" | "signUp">(initialFlow);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const destination = safeDestination(searchParams.get("next"));

  useEffect(() => {
    if (isAuthenticated) {
      router.replace(destination);
    }
  }, [destination, isAuthenticated, router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    const formData = new FormData(event.currentTarget);
    formData.set("flow", flow);

    try {
      await signIn("password", formData);
    } catch (caught) {
      console.error(caught);
      setError(
        flow === "signIn"
          ? "We could not sign you in. Check your email and password, or create an account instead."
          : "We could not create that account. The email may already be registered.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (isLoading || isAuthenticated) {
    return (
      <div className="auth-loading">
        <LoaderCircle className="spin" size={24} />
        <span>Opening Ordia…</span>
      </div>
    );
  }

  return (
    <div className="auth-panel">
      <div className="auth-heading">
        <span className="auth-kicker">{flow === "signIn" ? "Welcome back" : "Begin together"}</span>
        <h1>{flow === "signIn" ? "Sign in to Ordia" : "Create your Ordia account"}</h1>
        <p>
          {flow === "signIn"
            ? "Return to the household context you share."
            : "You will create or join a household after signing up."}
        </p>
      </div>

      <form className="form-stack" onSubmit={handleSubmit}>
        <label>
          <span>Email address</span>
          <input name="email" type="email" autoComplete="email" required />
        </label>
        <label>
          <span>Password</span>
          <input
            name="password"
            type="password"
            minLength={8}
            autoComplete={flow === "signIn" ? "current-password" : "new-password"}
            required
          />
        </label>
        {error && <div className="form-error">{error}</div>}
        <button className="primary-button full-width" disabled={submitting} type="submit">
          {submitting ? (
            <>
              <LoaderCircle className="spin" size={18} /> Working…
            </>
          ) : (
            <>
              {flow === "signIn" ? "Sign in" : "Create account"} <ArrowRight size={18} />
            </>
          )}
        </button>
      </form>

      <button
        className="quiet-button"
        type="button"
        onClick={() => {
          setError(null);
          setFlow(flow === "signIn" ? "signUp" : "signIn");
        }}
      >
        {flow === "signIn"
          ? "New to Ordia? Create an account"
          : "Already have an account? Sign in"}
      </button>
    </div>
  );
}

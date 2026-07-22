"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth } from "convex/react";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

function safeDestination(value: string | null): string {
  return value?.startsWith("/") && !value.startsWith("//") ? value : "/app";
}

function errorDetail(caught: unknown): string {
  if (caught instanceof Error) return caught.message;
  if (typeof caught === "string") return caught;

  try {
    return JSON.stringify(caught);
  } catch {
    return "Unknown authentication error";
  }
}

function friendlyError(
  flow: "signIn" | "signUp",
  primaryDetail: string,
  recoveryDetail?: string,
): string {
  const combined = `${primaryDetail} ${recoveryDetail ?? ""}`.toLowerCase();

  if (
    combined.includes("jwt_private_key") ||
    combined.includes("jwks") ||
    combined.includes("invalidcharactererror") ||
    combined.includes("failed to execute 'atob'") ||
    combined.includes("redirect")
  ) {
    return "Ordia's authentication service is not configured correctly yet. This is a system issue rather than a problem with your details.";
  }

  if (
    combined.includes("already") ||
    combined.includes("account exists") ||
    combined.includes("accountalready")
  ) {
    return "An account already exists for this email. Try signing in with the same password.";
  }

  if (
    combined.includes("invalidsecret") ||
    combined.includes("invalid password") ||
    combined.includes("incorrect password") ||
    combined.includes("accountnotfound")
  ) {
    return flow === "signUp"
      ? "The account appears to exist already, but that password did not sign it in. Use Sign in and check the password."
      : "The email or password did not match an Ordia account.";
  }

  return flow === "signIn"
    ? "We could not sign you in. Check your email and password, or create an account instead."
    : "We could not complete account creation. The diagnostic detail below will identify the cause.";
}

function credentials(email: string, password: string, flow: "signIn" | "signUp") {
  const data = new FormData();
  data.set("email", email);
  data.set("password", password);
  data.set("flow", flow);
  return data;
}

const convexBackend = (() => {
  const value = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!value) return "not configured";

  try {
    return new URL(value).hostname;
  } catch {
    return "invalid backend URL";
  }
})();

export function AuthForm() {
  const { signIn } = useAuthActions();
  const { isAuthenticated, isLoading } = useConvexAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialFlow = searchParams.get("flow") === "signUp" ? "signUp" : "signIn";
  const [flow, setFlow] = useState<"signIn" | "signUp">(initialFlow);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [technicalDetail, setTechnicalDetail] = useState<string | null>(null);
  const destination = safeDestination(searchParams.get("next"));

  useEffect(() => {
    if (isAuthenticated) {
      router.replace(destination);
    }
  }, [destination, isAuthenticated, router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setTechnicalDetail(null);
    setSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim().toLowerCase();
    const password = String(formData.get("password") ?? "");

    try {
      await signIn("password", credentials(email, password, flow));
    } catch (caught) {
      const primaryDetail = errorDetail(caught);
      console.error(caught);

      if (flow === "signUp") {
        try {
          // A failed token/redirect step can happen after the password account has
          // already been written. Recover by attempting the corresponding sign-in.
          await signIn("password", credentials(email, password, "signIn"));
          return;
        } catch (recoveryCaught) {
          const recoveryDetail = errorDetail(recoveryCaught);
          console.error(recoveryCaught);
          setError(friendlyError(flow, primaryDetail, recoveryDetail));
          setTechnicalDetail(
            `Signup: ${primaryDetail}\nSign-in recovery: ${recoveryDetail}\nBackend: ${convexBackend}`,
          );
        }
      } else {
        setError(friendlyError(flow, primaryDetail));
        setTechnicalDetail(`Sign in: ${primaryDetail}\nBackend: ${convexBackend}`);
      }
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
        {technicalDetail && (
          <details className="auth-error-details">
            <summary>Show technical detail</summary>
            <pre>{technicalDetail}</pre>
          </details>
        )}
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
          setTechnicalDetail(null);
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

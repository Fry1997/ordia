import { Suspense } from "react";
import { Brand } from "@/components/Brand";
import { AuthForm } from "@/components/AuthForm";

export default function SignInPage() {
  return (
    <main className="auth-shell">
      <div className="auth-brand-row">
        <Brand />
      </div>
      <Suspense fallback={<div className="auth-loading">Opening sign in…</div>}>
        <AuthForm />
      </Suspense>
      <p className="auth-footnote">
        Ordia uses your account only to identify you and protect access to the
        households you belong to.
      </p>
    </main>
  );
}

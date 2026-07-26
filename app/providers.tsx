"use client";

import { ConvexAuthNextjsProvider } from "@convex-dev/auth/nextjs";
import { ConvexReactClient } from "convex/react";
import { useState, type ReactNode } from "react";

function ConfiguredProvider({ children, url }: { children: ReactNode; url: string }) {
  const [client] = useState(() => new ConvexReactClient(url));
  return <ConvexAuthNextjsProvider client={client}>{children}</ConvexAuthNextjsProvider>;
}

export function Providers({ children }: { children: ReactNode }) {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) {
    return (
      <main className="configuration-page">
        <section className="configuration-card">
          <span className="wordmark">Ordia</span>
          <h1>Connect the Ordia database</h1>
          <p>
            This build no longer uses demo records. Add the Ordia Convex deployment URL as
            <code>NEXT_PUBLIC_CONVEX_URL</code> in Vercel, then redeploy.
          </p>
        </section>
      </main>
    );
  }
  return <ConfiguredProvider url={url}>{children}</ConfiguredProvider>;
}

import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const response = await fetch(
    "https://limitless-woodpecker-997.convex.site/auth-diagnostic",
    { cache: "no-store" },
  );

  const body = await response.text();
  return new NextResponse(body, {
    status: response.status,
    headers: {
      "content-type": response.headers.get("content-type") ?? "application/json",
      "cache-control": "no-store",
    },
  });
}

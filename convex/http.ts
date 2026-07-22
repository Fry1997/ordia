import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { auth } from "./auth";

const http = httpRouter();
auth.addHttpRoutes(http);

function decodePemBody(value: string): ArrayBuffer {
  const base64 = value
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "")
    .replace(/\s/g, "");
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes.buffer;
}

const authDiagnostic = httpAction(async () => {
  const privateKey = process.env.JWT_PRIVATE_KEY ?? "";
  const jwksRaw = process.env.JWKS ?? "";
  const siteUrl = process.env.SITE_URL ?? null;
  const convexSiteUrl = process.env.CONVEX_SITE_URL ?? null;
  const errors: string[] = [];

  let privateKeyImported = false;
  let publicKeyImported = false;
  let pairMatches = false;
  let jwksKeyCount = 0;

  try {
    const privateCryptoKey = await crypto.subtle.importKey(
      "pkcs8",
      decodePemBody(privateKey),
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      false,
      ["sign"],
    );
    privateKeyImported = true;

    const parsed = JSON.parse(jwksRaw) as { keys?: JsonWebKey[] };
    jwksKeyCount = Array.isArray(parsed.keys) ? parsed.keys.length : 0;
    const publicJwk = parsed.keys?.[0];
    if (!publicJwk) {
      throw new Error("JWKS does not contain a public key");
    }

    const publicCryptoKey = await crypto.subtle.importKey(
      "jwk",
      publicJwk,
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      false,
      ["verify"],
    );
    publicKeyImported = true;

    const payload = new TextEncoder().encode("ordia-auth-diagnostic");
    const signature = await crypto.subtle.sign(
      "RSASSA-PKCS1-v1_5",
      privateCryptoKey,
      payload,
    );
    pairMatches = await crypto.subtle.verify(
      "RSASSA-PKCS1-v1_5",
      publicCryptoKey,
      signature,
      payload,
    );
  } catch (error) {
    errors.push(error instanceof Error ? error.message : String(error));
  }

  return new Response(
    JSON.stringify(
      {
        privateKeyPresent: privateKey.length > 0,
        privateKeyLength: privateKey.length,
        privateKeyHasBeginMarker: privateKey.includes("-----BEGIN PRIVATE KEY-----"),
        privateKeyHasEndMarker: privateKey.includes("-----END PRIVATE KEY-----"),
        privateKeyImported,
        jwksPresent: jwksRaw.length > 0,
        jwksLength: jwksRaw.length,
        jwksKeyCount,
        publicKeyImported,
        pairMatches,
        siteUrl,
        convexSiteUrl,
        errors,
      },
      null,
      2,
    ),
    {
      status: 200,
      headers: {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "no-store",
      },
    },
  );
});

http.route({ path: "/auth-diagnostic", method: "GET", handler: authDiagnostic });

export default http;

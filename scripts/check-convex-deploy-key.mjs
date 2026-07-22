import { spawnSync } from "node:child_process";
import { generateKeyPairSync } from "node:crypto";

const rawValue = process.env.CONVEX_DEPLOY_KEY ?? "";
const deployKey = rawValue.trim().replace(/%7C/gi, "|");
const prefix = deployKey.includes(":")
  ? deployKey.slice(0, deployKey.indexOf(":"))
  : "none";
const hasPipe = deployKey.includes("|");
const startsWithProductionPrefix = deployKey.startsWith("prod:");
const wasUrlEncoded = rawValue !== deployKey && /%7C/i.test(rawValue);

console.log(
  `[convex-deploy-check] present=${deployKey.length > 0} length=${deployKey.length} prefix=${prefix} hasPipe=${hasPipe} startsWithProd=${startsWithProductionPrefix} normalizedEncodedPipe=${wasUrlEncoded}`,
);

if (!deployKey) {
  console.error(
    "[convex-deploy-check] CONVEX_DEPLOY_KEY is not available to this Vercel build.",
  );
  process.exit(1);
}

if (!startsWithProductionPrefix) {
  console.error(
    "[convex-deploy-check] The available key is not a production deploy key.",
  );
  process.exit(1);
}

if (!hasPipe || deployKey.length < 40) {
  console.error(
    "[convex-deploy-check] The available key is truncated or malformed.",
  );
  process.exit(1);
}

const childEnv = {
  ...process.env,
  CONVEX_DEPLOY_KEY: deployKey,
};

function runConvex(args, { capture = false, secretValues = [] } = {}) {
  const result = spawnSync("npx", ["convex", ...args], {
    encoding: "utf8",
    stdio: capture ? ["ignore", "pipe", "pipe"] : "inherit",
    env: childEnv,
    shell: process.platform === "win32",
  });

  if (result.error) {
    throw new Error(`Could not start Convex CLI: ${result.error.message}`);
  }

  if ((result.status ?? 1) !== 0) {
    let detail = `${result.stderr ?? ""}${result.stdout ?? ""}`.trim();
    for (const secret of secretValues) {
      if (secret) detail = detail.split(secret).join("[redacted]");
    }
    throw new Error(
      detail
        ? `Convex CLI failed: ${detail}`
        : `Convex CLI exited with status ${result.status ?? 1}.`,
    );
  }

  return result.stdout?.trimEnd() ?? "";
}

function readConvexEnv(name) {
  const result = spawnSync("npx", ["convex", "env", "get", name], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    env: childEnv,
    shell: process.platform === "win32",
  });

  if (result.error) {
    throw new Error(`Could not inspect Convex environment variables: ${result.error.message}`);
  }

  return (result.status ?? 1) === 0 ? result.stdout.trimEnd() : null;
}

function setConvexEnv(name, value, { secret = false } = {}) {
  runConvex(["env", "set", name, value], {
    capture: true,
    secretValues: secret ? [value] : [],
  });
  console.log(
    `[convex-auth-bootstrap] ${name} ${secret ? "securely " : ""}configured.`,
  );
}

function resolveSiteUrl() {
  const host =
    process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL ?? "";
  if (!host) {
    throw new Error(
      "Vercel did not provide VERCEL_PROJECT_PRODUCTION_URL or VERCEL_URL.",
    );
  }
  return /^https?:\/\//i.test(host) ? host : `https://${host}`;
}

function bootstrapConvexAuth() {
  console.log("[convex-auth-bootstrap] Checking production auth configuration.");

  const existingPrivateKey = readConvexEnv("JWT_PRIVATE_KEY");
  const existingJwks = readConvexEnv("JWKS");

  if ((existingPrivateKey === null) !== (existingJwks === null)) {
    throw new Error(
      "Convex Auth is partially configured: JWT_PRIVATE_KEY and JWKS must either both exist or both be absent.",
    );
  }

  if (existingPrivateKey === null && existingJwks === null) {
    const { privateKey, publicKey } = generateKeyPairSync("rsa", {
      modulusLength: 2048,
      publicExponent: 0x10001,
    });

    const privateKeyValue = privateKey
      .export({ type: "pkcs8", format: "pem" })
      .toString()
      .trimEnd()
      .replace(/\n/g, " ");
    const publicJwk = publicKey.export({ format: "jwk" });
    const jwksValue = JSON.stringify({
      keys: [{ use: "sig", alg: "RS256", ...publicJwk }],
    });

    setConvexEnv("JWT_PRIVATE_KEY", privateKeyValue, { secret: true });
    setConvexEnv("JWKS", jwksValue, { secret: true });
    console.log("[convex-auth-bootstrap] New production signing pair created.");
  } else {
    console.log(
      "[convex-auth-bootstrap] Existing production signing pair retained.",
    );
  }

  const siteUrl = resolveSiteUrl();
  const existingSiteUrl = readConvexEnv("SITE_URL");
  if (existingSiteUrl !== siteUrl) {
    setConvexEnv("SITE_URL", siteUrl);
  } else {
    console.log("[convex-auth-bootstrap] SITE_URL is already correct.");
  }
}

try {
  console.log(
    "[convex-deploy-check] Key shape looks valid; bootstrapping Convex Auth.",
  );
  bootstrapConvexAuth();
  console.log("[convex-deploy-check] Continuing to Convex deploy.");
  runConvex(["deploy", "--cmd", "npm run build"]);
} catch (error) {
  console.error(
    `[convex-deploy-check] ${error instanceof Error ? error.message : String(error)}`,
  );
  process.exit(1);
}

import { spawnSync } from "node:child_process";
import { generateKeyPairSync } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";

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

if (!deployKey || !startsWithProductionPrefix || !hasPipe || deployKey.length < 40) {
  console.error("[convex-deploy-check] CONVEX_DEPLOY_KEY is missing or malformed.");
  process.exit(1);
}

const childEnv = {
  ...process.env,
  CONVEX_DEPLOY_KEY: deployKey,
};

function runConvex(
  args,
  { capture = false, input, secrets = [] } = {},
) {
  const result = spawnSync("npx", ["convex", ...args], {
    encoding: "utf8",
    stdio: capture ? ["pipe", "pipe", "pipe"] : "inherit",
    input,
    env: childEnv,
    shell: process.platform === "win32",
  });

  if (result.error) {
    throw new Error(`Could not start Convex CLI: ${result.error.message}`);
  }

  if ((result.status ?? 1) !== 0) {
    let detail = `${result.stderr ?? ""}${result.stdout ?? ""}`.trim();
    for (const secret of secrets) {
      if (secret) detail = detail.split(secret).join("[redacted]");
    }
    throw new Error(detail || `Convex CLI exited with status ${result.status ?? 1}.`);
  }

  return result.stdout?.trimEnd() ?? "";
}

function getProductionEnv(name) {
  const result = spawnSync(
    "npx",
    ["convex", "env", "--prod", "get", name],
    {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      env: childEnv,
      shell: process.platform === "win32",
    },
  );

  if (result.error) {
    throw new Error(`Could not inspect Convex production environment: ${result.error.message}`);
  }

  if ((result.status ?? 1) !== 0) return null;

  const value = result.stdout.trimEnd();
  return value.length > 0 ? value : null;
}

function setProductionEnv(name, value, { secret = false } = {}) {
  // Convex officially supports omitting the value argument and piping it via stdin.
  // This is required for PEM values, which begin with dashes and would otherwise
  // be interpreted by the CLI as command-line options.
  runConvex(["env", "--prod", "set", name], {
    capture: true,
    input: `${value}\n`,
    secrets: secret ? [value] : [],
  });

  const stored = getProductionEnv(name);
  if (stored !== value) {
    throw new Error(`${name} was not persisted to the production deployment.`);
  }

  console.log(
    `[convex-auth-bootstrap] ${name} ${secret ? "securely " : ""}stored and verified in production.`,
  );
}

function ensureProductionAuth() {
  console.log("[convex-auth-bootstrap] Verifying production authentication variables.");

  let privateKeyValue = getProductionEnv("JWT_PRIVATE_KEY");
  let jwksValue = getProductionEnv("JWKS");

  if (!privateKeyValue || !jwksValue) {
    const { privateKey, publicKey } = generateKeyPairSync("rsa", {
      modulusLength: 2048,
      publicExponent: 0x10001,
    });

    privateKeyValue = privateKey
      .export({ type: "pkcs8", format: "pem" })
      .toString()
      .trimEnd()
      .replace(/\n/g, " ");

    const publicJwk = publicKey.export({ format: "jwk" });
    jwksValue = JSON.stringify({
      keys: [{ use: "sig", ...publicJwk }],
    });

    setProductionEnv("JWT_PRIVATE_KEY", privateKeyValue, { secret: true });
    setProductionEnv("JWKS", jwksValue, { secret: true });
  } else {
    console.log("[convex-auth-bootstrap] Existing signing pair retained.");
  }

  const siteUrl = "https://ordia-nine.vercel.app";
  if (getProductionEnv("SITE_URL") !== siteUrl) {
    setProductionEnv("SITE_URL", siteUrl);
  } else {
    console.log("[convex-auth-bootstrap] SITE_URL is already correct.");
  }

  if (
    !getProductionEnv("JWT_PRIVATE_KEY") ||
    !getProductionEnv("JWKS") ||
    getProductionEnv("SITE_URL") !== siteUrl
  ) {
    throw new Error("Production authentication variables failed final verification.");
  }
}

function sanitiseFailure(error) {
  let message = error instanceof Error ? error.message : String(error);
  message = message.split(deployKey).join("[deploy-key-redacted]");
  message = message.replace(/prod:[^\s"']+/g, "[deploy-key-redacted]");
  message = message.replace(/-----BEGIN [^-]+-----[\s\S]*?-----END [^-]+-----/g, "[pem-redacted]");
  return message.slice(0, 1200);
}

mkdirSync("public", { recursive: true });

try {
  ensureProductionAuth();
  writeFileSync(
    "public/auth-bootstrap-status.json",
    JSON.stringify(
      {
        ok: true,
        stage: "production-auth-environment-write",
        variablesVerified: true,
      },
      null,
      2,
    ),
  );
  console.log("[convex-deploy-check] Auth variables verified; continuing to Convex deploy.");
  runConvex(["deploy", "--cmd", "npm run build"]);
} catch (error) {
  const safeMessage = sanitiseFailure(error);
  console.error(`[convex-deploy-check] ${safeMessage}`);
  writeFileSync(
    "public/auth-bootstrap-status.json",
    JSON.stringify(
      {
        ok: false,
        stage: "production-auth-environment-write",
        message: safeMessage,
      },
      null,
      2,
    ),
  );
  console.log("[convex-deploy-check] Publishing sanitised bootstrap diagnostic.");
  runConvex(["deploy", "--cmd", "npm run build"]);
}

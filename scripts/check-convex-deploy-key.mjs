import { spawnSync } from "node:child_process";

const rawValue = process.env.CONVEX_DEPLOY_KEY ?? "";
const value = rawValue.trim().replace(/%7C/gi, "|");
const prefix = value.includes(":") ? value.slice(0, value.indexOf(":")) : "none";
const hasPipe = value.includes("|");
const startsWithProductionPrefix = value.startsWith("prod:");
const wasUrlEncoded = rawValue !== value && /%7C/i.test(rawValue);

console.log(
  `[convex-deploy-check] present=${value.length > 0} length=${value.length} prefix=${prefix} hasPipe=${hasPipe} startsWithProd=${startsWithProductionPrefix} normalizedEncodedPipe=${wasUrlEncoded}`,
);

if (!value) {
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

if (!hasPipe || value.length < 40) {
  console.error(
    "[convex-deploy-check] The available key is truncated or malformed.",
  );
  process.exit(1);
}

console.log("[convex-deploy-check] Key shape looks valid; continuing to Convex deploy.");

const result = spawnSync(
  "npx",
  ["convex", "deploy", "--cmd", "npm run build"],
  {
    stdio: "inherit",
    env: {
      ...process.env,
      CONVEX_DEPLOY_KEY: value,
    },
    shell: process.platform === "win32",
  },
);

if (result.error) {
  console.error(`[convex-deploy-check] Could not start Convex deploy: ${result.error.message}`);
  process.exit(1);
}

process.exit(result.status ?? 1);

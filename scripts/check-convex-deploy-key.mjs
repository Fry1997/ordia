import { spawnSync } from "node:child_process";

const isPreview = process.env.VERCEL_ENV === "preview";

if (isPreview) {
  console.log(
    "[convex-deploy-check] Preview build detected; compiling without deploying Convex functions.",
  );
  const result = spawnSync("npm", ["run", "build"], {
    stdio: "inherit",
    env: {
      ...process.env,
      NEXT_PUBLIC_CONVEX_URL:
        process.env.NEXT_PUBLIC_CONVEX_URL ??
        "https://ordia-build-placeholder.convex.cloud",
    },
    shell: process.platform === "win32",
  });

  if (result.error) {
    console.error(
      `[convex-deploy-check] Could not start preview build: ${result.error.message}`,
    );
    process.exit(1);
  }

  process.exit(result.status ?? 1);
}

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
    "[convex-deploy-check] CONVEX_DEPLOY_KEY is not available to this production build.",
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

const result = spawnSync(
  "npx",
  ["convex", "deploy", "--cmd", "npm run build"],
  {
    stdio: "inherit",
    env: {
      ...process.env,
      CONVEX_DEPLOY_KEY: deployKey,
    },
    shell: process.platform === "win32",
  },
);

if (result.error) {
  console.error(
    `[convex-deploy-check] Could not start Convex CLI: ${result.error.message}`,
  );
  process.exit(1);
}

process.exit(result.status ?? 1);

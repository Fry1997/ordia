import { spawnSync } from "node:child_process";

const hasDeployKey = Boolean(process.env.CONVEX_DEPLOY_KEY);
const command = hasDeployKey
  ? [
      "convex",
      "deploy",
      "--cmd-url-env-var-name",
      "NEXT_PUBLIC_CONVEX_URL",
      "--cmd",
      "next build",
    ]
  : ["next", "build"];

if (!hasDeployKey) {
  console.warn(
    "CONVEX_DEPLOY_KEY is not configured. Building the frontend without deploying the Ordia backend.",
  );
}

const result = spawnSync("npx", command, {
  stdio: "inherit",
  shell: process.platform === "win32",
  env: process.env,
});

if (result.error) {
  throw result.error;
}

process.exit(result.status ?? 1);

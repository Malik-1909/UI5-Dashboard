import { execSync } from "node:child_process";

function getEnv(name) {
  const value = process.env[name];
  return typeof value === "string" ? value.trim() : "";
}

function parseRemote(remoteUrl) {
  const sshMatch = remoteUrl.match(/^git@github\.com:([^/]+)\/(.+?)(?:\.git)?$/);
  if (sshMatch) {
    return { owner: sshMatch[1], repo: sshMatch[2] };
  }

  const httpsMatch = remoteUrl.match(/^https:\/\/github\.com\/([^/]+)\/(.+?)(?:\.git)?$/);
  if (httpsMatch) {
    return { owner: httpsMatch[1], repo: httpsMatch[2] };
  }

  throw new Error(`Unsupported origin URL format: ${remoteUrl}`);
}

function getRepoFromGit() {
  const remoteUrl = execSync("git config --get remote.origin.url", {
    encoding: "utf8"
  }).trim();

  if (!remoteUrl) {
    throw new Error("No remote.origin.url found.");
  }

  return parseRemote(remoteUrl);
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const refArg = args.find((arg) => !arg.startsWith("-"));
  const ref = refArg || "main";
  const { owner, repo } = getRepoFromGit();
  const url = `https://api.github.com/repos/${owner}/${repo}/actions/workflows/btp-keepalive.yml/dispatches`;

  if (dryRun) {
    console.log(`[dry-run] Would dispatch workflow: ${owner}/${repo} @ ${ref}`);
    return;
  }

  const token = getEnv("GITHUB_TOKEN") || getEnv("GH_TOKEN");
  if (!token) {
    throw new Error(
      "Missing token. Set GITHUB_TOKEN (or GH_TOKEN) with Actions write permission."
    );
  }

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ ref })
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Workflow dispatch failed (${response.status}): ${body}`);
  }

  console.log(`BTP keep-alive workflow started for ${owner}/${repo} on ref '${ref}'.`);
  console.log(`Check: https://github.com/${owner}/${repo}/actions/workflows/btp-keepalive.yml`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});

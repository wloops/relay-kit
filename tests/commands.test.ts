import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { promisify } from "node:util";
import { runAsk } from "../src/commands/ask.js";
import { runDoctor } from "../src/commands/doctor.js";
import { runInit } from "../src/commands/init.js";
import { runResume } from "../src/commands/resume.js";
import { runReview } from "../src/commands/review.js";
import { runStart } from "../src/commands/start.js";

const execFileAsync = promisify(execFile);

async function tempProject(prefix = "relay-project-"): Promise<string> {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), prefix));
  await fs.writeFile(
    path.join(root, "package.json"),
    JSON.stringify({ name: "demo-project", scripts: { build: "node -e \"console.log('build ok')\"", test: "node -e \"console.log('test ok')\"" } }, null, 2),
  );
  return root;
}

async function read(filePath: string): Promise<string> {
  return fs.readFile(filePath, "utf8");
}

async function git(root: string, args: string[]): Promise<void> {
  await execFileAsync("git", args, { cwd: root, windowsHide: true });
}

async function initGit(root: string): Promise<void> {
  await git(root, ["init"]);
  await git(root, ["config", "user.email", "relay@example.test"]);
  await git(root, ["config", "user.name", "Relay Test"]);
}

async function updateConfig(root: string, patch: Record<string, unknown>): Promise<void> {
  const configPath = path.join(root, ".relay", "config.json");
  const config = JSON.parse(await read(configPath)) as Record<string, unknown>;
  await fs.writeFile(configPath, `${JSON.stringify({ ...config, ...patch }, null, 2)}\n`, "utf8");
}

test("init creates project config, state, handoff directory, AGENTS block and project skills", async () => {
  const root = await tempProject();
  await runInit(root, { mode: "simple" });

  const config = JSON.parse(await read(path.join(root, ".relay", "config.json"))) as { mode: string; skills: { install: { claudeUser: boolean; codexUser: boolean } } };
  const state = JSON.parse(await read(path.join(root, ".relay", "state.json"))) as { currentRun: string; currentLane: string; mode: string };

  assert.equal(config.mode, "simple");
  assert.equal(config.skills.install.claudeUser, false);
  assert.equal(config.skills.install.codexUser, false);
  assert.equal(state.currentRun, "");
  assert.equal(state.currentLane, "main");
  assert.equal(state.mode, "simple");
  assert.match(await read(path.join(root, "AGENTS.md")), /relay-kit:start/);
  assert.match(await read(path.join(root, ".relayignore")), /\.env\.\*/);
  assert.ok(await exists(path.join(root, "docs", "agent-handoffs", "runs")));
  assert.ok(await exists(path.join(root, ".relay", "skills", "relay-planner", "SKILL.md")));
  assert.ok(await exists(path.join(root, ".claude", "skills", "relay-delegator", "SKILL.md")));
  assert.ok(await exists(path.join(root, ".agents", "skills", "relay-reviewer", "SKILL.md")));
});

test("init keeps an existing .relayignore even with force", async () => {
  const root = await tempProject();
  await fs.writeFile(path.join(root, ".relayignore"), "custom-secrets/\n", "utf8");

  const first = await runInit(root, { mode: "simple" });
  assert.match(first.summary, /\.relayignore \(kept existing\)/);
  await runInit(root, { mode: "simple", force: true });

  assert.equal(await read(path.join(root, ".relayignore")), "custom-secrets/\n");
});

test("init is idempotent for AGENTS injection and requires force for managed config", async () => {
  const root = await tempProject();
  await runInit(root, { mode: "simple" });
  await assert.rejects(() => runInit(root, { mode: "simple" }), /already initialized/);
  await runInit(root, { mode: "simple", force: true });
  const agents = await read(path.join(root, "AGENTS.md"));
  assert.equal((agents.match(/relay-kit:start/g) ?? []).length, 1);
});

test("start, ask, resume, review and doctor produce the MVP handoff files", async () => {
  const root = await tempProject();
  await runInit(root, { mode: "simple" });
  const start = await runStart(root, { title: "Implement demo", scope: "src/**", blockedScope: "Do not change config." });
  assert.match(await read(start.file), /Implement demo/);

  const ask = await runAsk(root);
  assert.match(await read(ask.file), /No build\/test command was run/);

  const askWithBuild = await runAsk(root, { run: "build", force: true });
  assert.match(await read(askWithBuild.file), /build ok/);

  const decisionPath = path.join(path.dirname(ask.file), "ADVISOR_DECISION.md");
  await fs.writeFile(decisionPath, "# ADVISOR_DECISION\n\n## Prompt For Executor\nContinue with src/index.ts only.\n", "utf8");
  const resume = await runResume(root);
  assert.match(await read(resume.file), /Continue with src\/index.ts only/);

  const review = await runReview(root);
  assert.match(await read(review.file), /REVIEW_REQUEST/);

  const doctor = await runDoctor(root);
  assert.match(doctor, /relay doctor/);
  assert.match(doctor, /package script: build/);
});

test("ask and review apply advisorignore, redaction and configured truncation", async () => {
  const root = await tempProject("relay-safety-");
  await initGit(root);
  await runInit(root, { mode: "simple" });
  await runStart(root, { title: "Safety context", scope: "src/**" });
  await fs.mkdir(path.join(root, "src"), { recursive: true });
  await fs.writeFile(path.join(root, "src", "index.ts"), "export const value = 'ok';\n", "utf8");
  await fs.writeFile(path.join(root, "debug.log"), "baseline\n", "utf8");
  await git(root, ["add", "src/index.ts"]);
  await git(root, ["add", "-f", "debug.log"]);
  await git(root, ["commit", "-m", "baseline"]);

  await fs.appendFile(path.join(root, ".relayignore"), "secrets/\n", "utf8");
  await fs.mkdir(path.join(root, "secrets"), { recursive: true });
  await fs.writeFile(path.join(root, "secrets", "data.txt"), "token=ignored-secret\n", "utf8");
  await fs.writeFile(path.join(root, ".env"), "OPENAI_API_KEY=env-secret\n", "utf8");
  await fs.writeFile(path.join(root, "debug.log"), "token=log-secret\n", "utf8");
  await fs.writeFile(
    path.join(root, "src", "index.ts"),
    "export const token = 'src-secret-123456';\nexport const ok = true;\n",
    "utf8",
  );
  await fs.writeFile(
    path.join(root, "build-log.js"),
    [
      "console.log('line1');",
      "console.log('API_KEY=build-secret-123456');",
      "console.log('line3');",
      "console.log('line4');",
    ].join("\n"),
    "utf8",
  );
  await updateConfig(root, { buildCommand: "node build-log.js", maxLogLines: 2, maxDiffLines: 8 });

  const ask = await runAsk(root, { run: "build" });
  const askContent = await read(ask.file);

  assert.match(askContent, /## Context Safety/);
  assert.match(askContent, /default rules \+ \.relayignore/);
  assert.match(askContent, /API_KEY=\[REDACTED\]/);
  assert.match(askContent, /truncated 2 lines/);
  assert.doesNotMatch(askContent, /build-secret-123456|env-secret|log-secret|ignored-secret|debug\.log|secrets\/data\.txt|line3/);

  const review = await runReview(root);
  const reviewContent = await read(review.file);

  assert.match(reviewContent, /## Context Safety/);
  assert.match(reviewContent, /token = '\[REDACTED\]'/);
  assert.doesNotMatch(reviewContent, /src-secret-123456|env-secret|log-secret|ignored-secret|debug\.log|secrets\/data\.txt/);
});

test("openspec mode reads the selected change into executor handoff", async () => {
  const root = await tempProject("relay-openspec-");
  const changeDir = path.join(root, "openspec", "changes", "add-demo");
  await fs.mkdir(changeDir, { recursive: true });
  await fs.writeFile(path.join(changeDir, "proposal.md"), "Proposal body", "utf8");
  await fs.writeFile(path.join(changeDir, "design.md"), "Design body", "utf8");
  await fs.writeFile(path.join(changeDir, "tasks.md"), "- [ ] Task body", "utf8");

  await runInit(root, { mode: "openspec" });
  const start = await runStart(root, { change: "add-demo", title: "Apply add-demo" });
  const content = await read(start.file);
  assert.match(content, /OpenSpec Change: add-demo/);
  assert.match(content, /Proposal body/);
  assert.match(content, /Task body/);
});

test("with-openspec guidance does not create openspec directory silently", async () => {
  const root = await tempProject();
  const result = await runInit(root, { withOpenspec: true });
  assert.match(result.summary, /did not create openspec/);
  assert.equal(await exists(path.join(root, "openspec")), false);
});

test("init rejects openspec mode when openspec structure is missing", async () => {
  const root = await tempProject();
  await assert.rejects(() => runInit(root, { mode: "openspec" }), /openspec\/ was not detected/);
});

test("ask, resume and review reject when there is no current run", async () => {
  const root = await tempProject();
  await runInit(root, { mode: "simple" });

  await assert.rejects(() => runAsk(root), /No current run/);
  await assert.rejects(() => runResume(root), /No current run/);
  await assert.rejects(() => runReview(root), /No current run/);
});

test("ask rejects unsupported --run target", async () => {
  const root = await tempProject();
  await runInit(root, { mode: "simple" });
  await runStart(root, { title: "Invalid run target" });

  await assert.rejects(() => runAsk(root, { run: "lint" as never }), /--run must be build or test/);
});

test("resume supports --from and rejects empty or incomplete decisions", async () => {
  const root = await tempProject();
  await runInit(root, { mode: "simple" });
  await runStart(root, { title: "Resume edge cases" });

  const explicitDecision = path.join(root, "decision.md");
  await fs.writeFile(explicitDecision, "# ADVISOR_DECISION\n\n## Prompt For Executor\nUse the explicit decision source.\n", "utf8");
  const resume = await runResume(root, { from: explicitDecision });
  assert.match(await read(resume.file), /explicit decision source/);

  const emptyDecision = path.join(root, "empty-decision.md");
  await fs.writeFile(emptyDecision, "", "utf8");
  await assert.rejects(() => runResume(root, { from: emptyDecision, force: true }), /missing or empty/);

  const incompleteDecision = path.join(root, "incomplete-decision.md");
  await fs.writeFile(incompleteDecision, "# ADVISOR_DECISION\n\n## Recommended Path\nKeep going.\n", "utf8");
  await assert.rejects(() => runResume(root, { from: incompleteDecision, force: true }), /Prompt For Executor/);
});

test("doctor reports warnings when config and state are missing", async () => {
  const root = await tempProject();
  const doctor = await runDoctor(root);

  assert.match(doctor, /warn \.relay\/config\.json/);
  assert.match(doctor, /warn \.relay\/state\.json/);
});

async function exists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

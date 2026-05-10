import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { runAsk } from "../src/commands/ask.js";
import { runDoctor } from "../src/commands/doctor.js";
import { runInit } from "../src/commands/init.js";
import { runResume } from "../src/commands/resume.js";
import { runReview } from "../src/commands/review.js";
import { runStart } from "../src/commands/start.js";

async function tempProject(prefix = "advisor-project-"): Promise<string> {
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

test("init creates project config, state, handoff directory, AGENTS block and project skills", async () => {
  const root = await tempProject();
  await runInit(root, { mode: "simple" });

  const config = JSON.parse(await read(path.join(root, ".advisor-kit", "config.json"))) as { mode: string; skills: { install: { claudeUser: boolean; codexUser: boolean } } };
  const state = JSON.parse(await read(path.join(root, ".advisor-kit", "state.json"))) as { currentRun: string; currentLane: string; mode: string };

  assert.equal(config.mode, "simple");
  assert.equal(config.skills.install.claudeUser, false);
  assert.equal(config.skills.install.codexUser, false);
  assert.equal(state.currentRun, "");
  assert.equal(state.currentLane, "main");
  assert.equal(state.mode, "simple");
  assert.match(await read(path.join(root, "AGENTS.md")), /advisor-kit:start/);
  assert.ok(await exists(path.join(root, "docs", "agent-handoffs", "runs")));
  assert.ok(await exists(path.join(root, ".advisor-kit", "skills", "advisor-planner", "SKILL.md")));
  assert.ok(await exists(path.join(root, ".claude", "skills", "advisor-delegator", "SKILL.md")));
  assert.ok(await exists(path.join(root, ".agents", "skills", "advisor-reviewer", "SKILL.md")));
});

test("init is idempotent for AGENTS injection and requires force for managed config", async () => {
  const root = await tempProject();
  await runInit(root, { mode: "simple" });
  await assert.rejects(() => runInit(root, { mode: "simple" }), /already initialized/);
  await runInit(root, { mode: "simple", force: true });
  const agents = await read(path.join(root, "AGENTS.md"));
  assert.equal((agents.match(/advisor-kit:start/g) ?? []).length, 1);
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
  assert.match(doctor, /advisor doctor/);
  assert.match(doctor, /package script: build/);
});

test("openspec mode reads the selected change into executor handoff", async () => {
  const root = await tempProject("advisor-openspec-");
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

  const explicitDecision = path.join(root, "advisor-decision.md");
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

  assert.match(doctor, /warn \.advisor-kit\/config\.json/);
  assert.match(doctor, /warn \.advisor-kit\/state\.json/);
});

async function exists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

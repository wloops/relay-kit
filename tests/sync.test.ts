import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { runInit } from "../src/commands/init.js";
import { runSync } from "../src/commands/sync.js";

async function tempProject(prefix = "advisor-sync-"): Promise<string> {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), prefix));
  await fs.writeFile(path.join(root, "package.json"), JSON.stringify({ name: "sync-demo" }, null, 2), "utf8");
  return root;
}

async function exists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function writeSkill(root: string, skill: string, content = "# Skill\n"): Promise<void> {
  const dir = path.join(root, ".advisor-kit", "skills", skill);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, "SKILL.md"), content, "utf8");
}

async function read(filePath: string): Promise<string> {
  return fs.readFile(filePath, "utf8");
}

test("sync --skills uses configured project targets by default", async () => {
  const root = await tempProject();
  await runInit(root, { mode: "simple" });

  const result = await runSync(root, { skills: true });

  assert.match(result.summary, /target: configured/);
  assert.match(result.summary, /\.claude\/skills/);
  assert.match(result.summary, /\.agents\/skills/);
  assert.doesNotMatch(result.summary, /\.codex\/skills/);
  assert.ok(await exists(path.join(root, ".advisor-kit", "skills-sync.json")));
});

test("sync --skills honors explicit project targets", async () => {
  const root = await tempProject();
  await runInit(root, { mode: "simple" });
  await writeSkill(root, "advisor-extra", "# Extra\n");

  await runSync(root, { skills: true, target: "claude" });

  assert.ok(await exists(path.join(root, ".claude", "skills", "advisor-extra", "SKILL.md")));
  assert.equal(await exists(path.join(root, ".agents", "skills", "advisor-extra", "SKILL.md")), false);

  await writeSkill(root, "advisor-extra-all", "# Extra all\n");
  await runSync(root, { skills: true, target: "all" });

  assert.ok(await exists(path.join(root, ".claude", "skills", "advisor-extra-all", "SKILL.md")));
  assert.ok(await exists(path.join(root, ".agents", "skills", "advisor-extra-all", "SKILL.md")));
  assert.equal(await exists(path.join(root, ".codex", "skills", "advisor-extra-all", "SKILL.md")), false);
});

test("sync --skills writes user targets only when user scope is explicit", async () => {
  const root = await tempProject();
  const homeDir = await fs.mkdtemp(path.join(os.tmpdir(), "advisor-sync-home-"));
  await runInit(root, { mode: "simple" });
  await writeSkill(root, "advisor-user", "# User skill\n");

  await runSync(root, { skills: true, homeDir });

  assert.equal(await exists(path.join(homeDir, ".claude", "skills")), false);
  assert.equal(await exists(path.join(homeDir, ".agents", "skills")), false);

  await runSync(root, { skills: true, target: "all", scope: "user", homeDir });

  assert.ok(await exists(path.join(homeDir, ".claude", "skills", "advisor-user", "SKILL.md")));
  assert.ok(await exists(path.join(homeDir, ".agents", "skills", "advisor-user", "SKILL.md")));
  assert.equal(await exists(path.join(homeDir, ".codex", "skills")), false);
});

test("sync --skills --scope user requires configured user targets or explicit target", async () => {
  const root = await tempProject();
  const homeDir = await fs.mkdtemp(path.join(os.tmpdir(), "advisor-sync-home-"));
  await runInit(root, { mode: "simple" });

  await assert.rejects(
    () => runSync(root, { skills: true, scope: "user", homeDir }),
    /No user-level skills targets are enabled/,
  );
});

test("sync --skills --dry-run reports work without writing files or manifest", async () => {
  const root = await tempProject();
  await runInit(root, { mode: "simple" });
  await writeSkill(root, "advisor-dry-run", "# Dry run\n");

  const result = await runSync(root, { skills: true, target: "codex", dryRun: true });

  assert.match(result.summary, /dry-run: yes/);
  assert.match(result.summary, /create codex\/project advisor-dry-run\/SKILL.md/);
  assert.equal(await exists(path.join(root, ".agents", "skills", "advisor-dry-run", "SKILL.md")), false);
  assert.equal(await exists(path.join(root, ".advisor-kit", "skills-sync.json")), false);
});

test("sync --skills protects user-modified targets and --force overwrites after review", async () => {
  const root = await tempProject();
  await runInit(root, { mode: "simple" });

  await runSync(root, { skills: true, target: "claude" });

  const source = path.join(root, ".advisor-kit", "skills", "advisor-planner", "SKILL.md");
  const target = path.join(root, ".claude", "skills", "advisor-planner", "SKILL.md");
  await fs.writeFile(source, "# Source changed\n", "utf8");
  await fs.writeFile(target, "# User changed\n", "utf8");

  await assert.rejects(() => runSync(root, { skills: true, target: "claude" }), /conflict/);
  assert.equal(await read(target), "# User changed\n");

  const forced = await runSync(root, { skills: true, target: "claude", force: true });
  assert.match(forced.summary, /update claude\/project advisor-planner\/SKILL.md/);
  assert.equal(await read(target), "# Source changed\n");
});

test("sync validates supported flags and source availability", async () => {
  const root = await tempProject();

  await assert.rejects(() => runSync(root, { skills: true }), /Missing \.advisor-kit\/config\.json/);

  await runInit(root, { mode: "simple" });
  await assert.rejects(() => runSync(root, { skills: true, target: "other" as never }), /--target must be/);
  await assert.rejects(() => runSync(root, { skills: true, scope: "global" as never }), /--scope must be/);
  await assert.rejects(() => runSync(root), /currently supports only --skills/);

  await fs.rm(path.join(root, ".advisor-kit", "skills"), { recursive: true, force: true });
  await assert.rejects(() => runSync(root, { skills: true }), /Run advisor init first/);
});

import type { Command } from "commander";
import path from "node:path";
import { AGENTS_START_MARKER, CONFIG_FILE, DEFAULT_SKILLS, STATE_FILE } from "../core/constants.js";
import { loadConfig } from "../core/config.js";
import { pathExists, readTextIfExists } from "../core/fs.js";
import { listOpenSpecChanges } from "../core/openspec.js";
import { detectProject } from "../core/project.js";
import { getRunContext } from "../core/runs.js";
import { loadState } from "../core/state.js";

export function registerDoctorCommand(program: Command): void {
  program
    .command("doctor")
    .description("Check advisor-kit project integration status.")
    .action(async () => {
      console.log(await runDoctor(process.cwd()));
    });
}

export async function runDoctor(root: string): Promise<string> {
  const project = await detectProject(root);
  const checks: string[] = [];
  const configExists = await pathExists(path.join(root, CONFIG_FILE));
  const stateExists = await pathExists(path.join(root, STATE_FILE));

  checks.push(formatCheck(configExists, CONFIG_FILE, "Run advisor init."));
  checks.push(formatCheck(stateExists, STATE_FILE, "Run advisor init."));

  const agents = await readTextIfExists(path.join(root, "AGENTS.md"));
  checks.push(formatCheck(agents.includes(AGENTS_START_MARKER), "AGENTS.md advisor-kit block", "Run advisor init --force."));

  if (configExists && stateExists) {
    const config = await loadConfig(root);
    const state = await loadState(root);
    checks.push(formatCheck(await pathExists(path.join(root, config.handoffDir, "runs")), `${config.handoffDir}/runs`, "Run advisor init."));

    for (const target of [".advisor-kit/skills", ".claude/skills", ".agents/skills"]) {
      for (const skill of DEFAULT_SKILLS) {
        checks.push(formatCheck(await pathExists(path.join(root, target, skill, "SKILL.md")), `${target}/${skill}`, "Run advisor init --force."));
      }
    }

    if (state.currentRun) {
      const run = getRunContext(root, config, state.currentRun, state.currentLane);
      checks.push(formatCheck(await pathExists(run.laneDir), `current lane ${path.relative(root, run.laneDir)}`, "Run advisor start."));
      checks.push(formatPending(!(await pathExists(path.join(run.laneDir, "ASK_ADVISOR.md"))), "ASK_ADVISOR.md", "Advisor response may be needed."));
      checks.push(formatPending(!(await pathExists(path.join(run.laneDir, "ADVISOR_DECISION.md"))), "ADVISOR_DECISION.md", "Run advisor resume if ready."));
    }
  }

  checks.push(formatCheck(project.hasPackageJson, "package.json", "CLI works without it, but build/test detection will be limited."));
  checks.push(formatCheck(project.packageScripts.build !== undefined, "package script: build", "Add a build script to enable advisor ask --run build."));
  checks.push(formatCheck(project.packageScripts.test !== undefined, "package script: test", "Add a test script to enable advisor ask --run test."));

  if (project.hasOpenSpec) {
    const changes = await listOpenSpecChanges(root);
    checks.push(`ok   OpenSpec changes: ${changes.length ? changes.join(", ") : "(none)"}`);
  } else {
    checks.push("warn OpenSpec: not detected; simple mode is supported.");
  }

  return ["advisor doctor", ...checks].join("\n");
}

function formatCheck(ok: boolean, label: string, fix: string): string {
  return ok ? `ok   ${label}` : `warn ${label} - ${fix}`;
}

function formatPending(clear: boolean, fileName: string, fix: string): string {
  return clear ? `ok   no pending ${fileName}` : `warn pending ${fileName} - ${fix}`;
}

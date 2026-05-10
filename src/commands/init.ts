import type { Command } from "commander";
import fs from "node:fs/promises";
import path from "node:path";
import { AGENTS_END_MARKER, AGENTS_START_MARKER, CONFIG_FILE, DEFAULT_HANDOFF_DIR, STATE_FILE } from "../core/constants.js";
import { createDefaultConfig, writeConfig } from "../core/config.js";
import { ensureDir, pathExists, readTextIfExists, safeWriteFile } from "../core/fs.js";
import { detectProject } from "../core/project.js";
import { createDefaultState, writeState } from "../core/state.js";
import { loadTemplate } from "../core/templates.js";
import { installProjectSkills } from "../core/skills.js";
import type { AdvisorMode } from "../core/types.js";

interface InitOptions {
  mode?: AdvisorMode;
  withOpenspec?: boolean;
  yes?: boolean;
  force?: boolean;
}

export function registerInitCommand(program: Command): void {
  program
    .command("init")
    .description("Initialize advisor-kit in the current project.")
    .option("--mode <mode>", "Initialization mode: simple or openspec.")
    .option("--with-openspec", "Show OpenSpec setup guidance without silently creating openspec/.")
    .option("--yes", "Accept non-destructive defaults.")
    .option("--force", "Overwrite advisor-kit managed files.")
    .action(async (options: InitOptions) => {
      const result = await runInit(process.cwd(), options);
      console.log(result.summary);
    });
}

export async function runInit(root: string, options: InitOptions = {}): Promise<{ summary: string }> {
  const project = await detectProject(root);
  const mode = resolveMode(project.hasOpenSpec, options.mode);

  if (options.mode === "openspec" && !project.hasOpenSpec) {
    throw new Error("Cannot use --mode openspec because openspec/ was not detected.");
  }

  const config = createDefaultConfig(project, mode);
  const state = createDefaultState(mode);
  await ensureDir(path.join(root, ".advisor-kit"));

  if (!options.force && ((await pathExists(path.join(root, CONFIG_FILE))) || (await pathExists(path.join(root, STATE_FILE))))) {
    throw new Error("advisor-kit is already initialized. Use --force to rewrite managed config/state files.");
  }

  await writeConfig(root, config);
  await writeState(root, state);
  await ensureDir(path.join(root, DEFAULT_HANDOFF_DIR, "runs"));
  await injectAgentsRules(root, options.force);
  const skillTargets = await installProjectSkills(root, config, { force: options.force });

  const guidance =
    options.withOpenspec && !project.hasOpenSpec
      ? "\nOpenSpec was requested, but advisor-kit did not create openspec/. Install/init OpenSpec explicitly, then rerun advisor init --mode openspec --force."
      : "";

  return {
    summary: [
      `advisor init complete (${mode}).`,
      `Config: ${CONFIG_FILE}`,
      `State: ${STATE_FILE}`,
      `Skills: ${skillTargets.map((target) => path.relative(root, target)).join(", ")}`,
      guidance,
    ]
      .filter(Boolean)
      .join("\n"),
  };
}

function resolveMode(hasOpenSpec: boolean, requested?: AdvisorMode): AdvisorMode {
  if (requested && requested !== "simple" && requested !== "openspec") {
    throw new Error("--mode must be simple or openspec.");
  }

  return requested ?? (hasOpenSpec ? "openspec" : "simple");
}

async function injectAgentsRules(root: string, force = false): Promise<void> {
  const agentsPath = path.join(root, "AGENTS.md");
  const existing = await readTextIfExists(agentsPath);
  const block = (await loadTemplate("AGENTS.advisor.md")).trim();

  if (existing.includes(AGENTS_START_MARKER) && existing.includes(AGENTS_END_MARKER)) {
    if (!force) {
      return;
    }

    const pattern = new RegExp(`${escapeRegExp(AGENTS_START_MARKER)}[\\s\\S]*?${escapeRegExp(AGENTS_END_MARKER)}`);
    await fs.writeFile(agentsPath, `${existing.replace(pattern, block).trim()}\n`, "utf8");
    return;
  }

  const next = existing.trim() ? `${existing.trim()}\n\n${block}\n` : `${block}\n`;
  // AGENTS.md may already exist with user rules; force only bypasses safeWriteFile's create-only guard for this merged content.
  await safeWriteFile(root, "AGENTS.md", next, { force: true });
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

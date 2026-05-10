import type { Command } from "commander";
import fs from "node:fs/promises";
import path from "node:path";
import {
  RELAYIGNORE_FILE,
  AGENTS_END_MARKER,
  AGENTS_START_MARKER,
  CONFIG_FILE,
  DEFAULT_RELAYIGNORE_CONTENT,
  DEFAULT_HANDOFF_DIR,
  STATE_FILE,
} from "../core/constants.js";
import { createDefaultConfig, writeConfig } from "../core/config.js";
import { ensureDir, pathExists, readTextIfExists, safeWriteFile } from "../core/fs.js";
import { detectProject } from "../core/project.js";
import { createDefaultState, writeState } from "../core/state.js";
import { loadTemplate } from "../core/templates.js";
import { installProjectSkills } from "../core/skills.js";
import type { RelayMode } from "../core/types.js";

interface InitOptions {
  mode?: RelayMode;
  withOpenspec?: boolean;
  yes?: boolean;
  force?: boolean;
}

export function registerInitCommand(program: Command): void {
  program
    .command("init")
    .description("Initialize relay-kit in the current project.")
    .option("--mode <mode>", "Initialization mode: simple or openspec.")
    .option("--with-openspec", "Show OpenSpec setup guidance without silently creating openspec/.")
    .option("--yes", "Accept non-destructive defaults.")
    .option("--force", "Overwrite relay-kit managed files.")
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
  await ensureDir(path.join(root, ".relay"));

  if (!options.force && ((await pathExists(path.join(root, CONFIG_FILE))) || (await pathExists(path.join(root, STATE_FILE))))) {
    throw new Error("relay-kit is already initialized. Use --force to rewrite managed config/state files.");
  }

  await writeConfig(root, config);
  await writeState(root, state);
  await ensureDir(path.join(root, DEFAULT_HANDOFF_DIR, "runs"));
  const relayIgnoreStatus = await ensureRelayIgnore(root);
  await injectAgentsRules(root, options.force);
  const skillTargets = await installProjectSkills(root, config, { force: options.force });

  const guidance =
    options.withOpenspec && !project.hasOpenSpec
      ? "\nOpenSpec was requested, but relay-kit did not create openspec/. Install/init OpenSpec explicitly, then rerun relay init --mode openspec --force."
      : "";

  return {
    summary: [
      `relay init complete (${mode}).`,
      `Config: ${CONFIG_FILE}`,
      `State: ${STATE_FILE}`,
      `Relay ignore: ${relayIgnoreStatus}`,
      `Skills: ${skillTargets.map((target) => path.relative(root, target)).join(", ")}`,
      guidance,
    ]
      .filter(Boolean)
      .join("\n"),
  };
}

async function ensureRelayIgnore(root: string): Promise<string> {
  if (await pathExists(path.join(root, RELAYIGNORE_FILE))) {
    return `${RELAYIGNORE_FILE} (kept existing)`;
  }

  await safeWriteFile(root, RELAYIGNORE_FILE, DEFAULT_RELAYIGNORE_CONTENT);
  return RELAYIGNORE_FILE;
}

function resolveMode(hasOpenSpec: boolean, requested?: RelayMode): RelayMode {
  if (requested && requested !== "simple" && requested !== "openspec") {
    throw new Error("--mode must be simple or openspec.");
  }

  return requested ?? (hasOpenSpec ? "openspec" : "simple");
}

async function injectAgentsRules(root: string, force = false): Promise<void> {
  const agentsPath = path.join(root, "AGENTS.md");
  const existing = await readTextIfExists(agentsPath);
  const block = (await loadTemplate("AGENTS.relay.md")).trim();

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

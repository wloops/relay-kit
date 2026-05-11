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
  OPENSPEC_DIR,
} from "../core/constants.js";
import { createDefaultConfig, writeConfig } from "../core/config.js";
import { ensureDir, pathExists, readTextIfExists, safeWriteFile } from "../core/fs.js";
import { initOpenSpecStructure } from "../core/openspec.js";
import { detectProject } from "../core/project.js";
import { createDefaultState, writeState } from "../core/state.js";
import { loadTemplate } from "../core/templates.js";
import { installProjectSkills, installOpenspecFiles } from "../core/skills.js";
import type { RelayMode, OpenSpecSyncMode } from "../core/types.js";

interface InitOptions {
  mode?: RelayMode;
  withOpenspec?: boolean;
  yes?: boolean;
  force?: boolean;
  openspecSync?: OpenSpecSyncMode;
}

export function registerInitCommand(program: Command): void {
  program
    .command("init")
    .description("Initialize relay-kit in the current project.")
    .option("--mode <mode>", "Initialization mode: simple or openspec.")
    .option("--with-openspec", "Show OpenSpec setup guidance.")
    .option("--openspec-sync <mode>", "How to handle existing openspec CLI: use_relay, use_external, skip.")
    .option("--yes", "Accept non-destructive defaults.")
    .option("--force", "Overwrite relay-kit managed files.")
    .action(async (options: InitOptions) => {
      const result = await runInit(process.cwd(), options);
      console.log(result.summary);
    });
}

export async function runInit(root: string, options: InitOptions = {}): Promise<{ summary: string }> {
  const project = await detectProject(root);
  const mode = await resolveModeInteractive(project.hasOpenSpec, options);

  const config = createDefaultConfig(project, mode);
  const state = createDefaultState(mode);
  await ensureDir(path.join(root, ".relay"));

  if (!options.force && ((await pathExists(path.join(root, CONFIG_FILE))) || (await pathExists(path.join(root, STATE_FILE))))) {
    throw new Error("relay-kit is already initialized. Use --force to rewrite managed config/state files.");
  }

  const openspecInitNotes: string[] = [];

  if (mode === "openspec") {
    if (!project.hasOpenSpec) {
      await initOpenSpecStructure(root);
      openspecInitNotes.push(`Created ${OPENSPEC_DIR}/ structure (changes/, specs/, archive/).`);
    }
    await detectAndHandleExternalOpenspec(root, options, openspecInitNotes);
    const openspecTargets = await installOpenspecFiles(root, { force: options.force });
    openspecInitNotes.push(`OpenSpec files installed to: ${openspecTargets.map((t) => path.relative(root, t)).join(", ")}`);
  }

  await writeConfig(root, config);
  await writeState(root, state);
  await ensureDir(path.join(root, DEFAULT_HANDOFF_DIR, "runs"));
  const relayIgnoreStatus = await ensureRelayIgnore(root);
  await injectAgentsRules(root, options.force);
  const skillTargets = await installProjectSkills(root, config, { force: options.force });

  const guidance =
    options.withOpenspec && mode !== "openspec"
      ? "\nOpenSpec was requested but not selected. Run relay init --mode openspec to enable OpenSpec mode."
      : "";

  return {
    summary: [
      `relay init complete (${mode}).`,
      `Config: ${CONFIG_FILE}`,
      `State: ${STATE_FILE}`,
      `Relay ignore: ${relayIgnoreStatus}`,
      `Skills: ${skillTargets.map((target) => path.relative(root, target)).join(", ")}`,
      ...openspecInitNotes,
      guidance,
    ]
      .filter(Boolean)
      .join("\n"),
  };
}

async function resolveModeInteractive(hasOpenSpec: boolean, options: InitOptions): Promise<RelayMode> {
  if (options.mode === "simple") return "simple";
  if (options.mode === "openspec") return "openspec";

  if (hasOpenSpec) return "openspec";

  if (options.withOpenspec) return "simple";

  if (options.yes) return "simple";

  return promptModeSelection();
}

async function promptModeSelection(): Promise<RelayMode> {
  const readline = await import("node:readline");

  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    return "openspec";
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const question = (q: string): Promise<string> =>
    new Promise((resolve) => rl.question(q, resolve));

  console.log();
  console.log("Select initialization mode:");
  console.log("  1. Simple mode  — relay-kit standalone (no OpenSpec)");
  console.log("  2. OpenSpec mode — integrated with OpenSpec for spec-driven development (recommended)");

  let answer: string;
  try {
    answer = await question("Choose mode (1/2, default 2): ");
  } finally {
    rl.close();
  }

  const trimmed = answer.trim();
  if (trimmed === "1" || trimmed.toLowerCase() === "simple") {
    return "simple";
  }

  return "openspec";
}

async function detectAndHandleExternalOpenspec(
  root: string,
  options: InitOptions,
  notes: string[],
): Promise<void> {
  const externalCliPath = await findExternalOpenspecCli();

  if (!externalCliPath) {
    notes.push("No external openspec CLI detected. Using relay-kit built-in implementation.");
    return;
  }

  const syncMode = options.openspecSync ?? (options.yes ? "use_relay" : undefined);

  if (syncMode) {
    if (syncMode === "use_relay") {
      notes.push("External openspec CLI found but relay-kit built-in will be used.");
    } else if (syncMode === "use_external") {
      notes.push("Using external openspec CLI. Upgrade relay-kit to switch to built-in.");
    }
    return;
  }

  const readline = await import("node:readline");

  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    notes.push("External openspec CLI detected. Using relay-kit built-in (non-TTY default).");
    return;
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const question = (q: string): Promise<string> =>
    new Promise((resolve) => rl.question(q, resolve));

  console.log();
  console.log(`External openspec CLI detected at: ${externalCliPath}`);
  console.log("relay-kit now has built-in OpenSpec support.");
  console.log("  1. Use relay-kit built-in (recommended) — no external dependency needed");
  console.log("  2. Use external openspec CLI — keep existing setup");
  console.log("  3. Skip — don't set up OpenSpec");

  let answer: string;
  try {
    answer = await question("Choose option (1/2/3, default 1): ");
  } finally {
    rl.close();
  }

  const trimmed = answer.trim();
  if (trimmed === "2" || trimmed.toLowerCase() === "external") {
    notes.push("Using external openspec CLI. Run relay init --openspec-sync use_relay to switch.");
    return;
  }

  if (trimmed === "3" || trimmed.toLowerCase() === "skip") {
    notes.push("OpenSpec CLI handling skipped.");
    return;
  }

  notes.push("Using relay-kit built-in OpenSpec implementation.");
}

async function findExternalOpenspecCli(): Promise<string | null> {
  const whichCmd = process.platform === "win32" ? "where.exe" : "which";
  try {
    const { execFile } = await import("node:child_process");
    const { stdout } = await new Promise<{ stdout: string }>((resolve, reject) => {
      execFile(whichCmd, ["openspec"], { timeout: 5000 }, (error, stdout) => {
        if (error) reject(error);
        else resolve({ stdout });
      });
    });

    const first = stdout.split("\n")[0]?.trim();
    if (!first) return null;

    if (first.includes("node_modules\\relay-kit") || first.includes("node_modules/relay-kit")) {
      return null;
    }

    return first;
  } catch {
    return null;
  }
}

async function ensureRelayIgnore(root: string): Promise<string> {
  if (await pathExists(path.join(root, RELAYIGNORE_FILE))) {
    return `${RELAYIGNORE_FILE} (kept existing)`;
  }

  await safeWriteFile(root, RELAYIGNORE_FILE, DEFAULT_RELAYIGNORE_CONTENT);
  return RELAYIGNORE_FILE;
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
  await safeWriteFile(root, "AGENTS.md", next, { force: true });
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

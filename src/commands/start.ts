import type { Command } from "commander";
import path from "node:path";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { DEFAULT_LANE } from "../core/constants.js";
import { copyToClipboard } from "../core/clipboard.js";
import { loadConfig } from "../core/config.js";
import { safeWriteFile } from "../core/fs.js";
import { formatOpenSpecContext, readOpenSpecContext, resolveOpenSpecChange } from "../core/openspec.js";
import { createRunId, createRunStructure } from "../core/runs.js";
import { loadState, updateState } from "../core/state.js";
import { loadTemplate, renderTemplate } from "../core/templates.js";

interface StartOptions {
  title?: string;
  scope?: string;
  blockedScope?: string;
  change?: string;
  copy?: boolean;
  force?: boolean;
}

export function registerStartCommand(program: Command): void {
  program
    .command("start")
    .description("Start a relay handoff run and create an executor task.")
    .option("--title <title>", "Simple mode task title.")
    .option("--scope <scope>", "Allowed implementation scope.")
    .option("--blocked-scope <scope>", "Scope that must not be changed.")
    .option("--change <change>", "OpenSpec change name.")
    .option("--copy", "Copy generated handoff content to clipboard.")
    .option("--force", "Overwrite generated run files.")
    .action(async (options: StartOptions) => {
      const result = await runStart(process.cwd(), options);
      console.log(result.summary);
    });
}

export async function runStart(root: string, options: StartOptions = {}): Promise<{ file: string; summary: string }> {
  const config = await loadConfig(root);
  const state = await loadState(root);
  const mode = state.mode || config.mode;
  const answers = mode === "simple" ? await collectSimpleInputs(options) : options;
  const title = answers.title || (mode === "openspec" ? "OpenSpec handoff" : "Untitled task");
  const runId = createRunId(title);
  const run = await createRunStructure(root, config, runId, DEFAULT_LANE, { force: options.force });

  let change = options.change || state.currentChange;
  let openSpecText = "";

  if (mode === "openspec") {
    change = await resolveOpenSpecChange(root, change || undefined);
    openSpecText = formatOpenSpecContext(await readOpenSpecContext(root, change));
  }

  const content = renderTemplate(await loadTemplate("EXECUTOR_TASK.template.md"), {
    projectName: config.projectName,
    runId,
    lane: DEFAULT_LANE,
    mode,
    change: change || "",
    taskTitle: title,
    allowedScope: [answers.scope || "Follow the current task only.", openSpecText].filter(Boolean).join("\n\n"),
    blockedScope: answers.blockedScope || "Do not expand scope beyond EXECUTOR_TASK.md.",
  });

  const relative = path.relative(root, path.join(run.laneDir, "EXECUTOR_TASK.md"));
  const file = await safeWriteFile(root, relative, content, { force: options.force });
  await updateState(root, { currentRun: runId, currentLane: DEFAULT_LANE, mode, currentChange: change || "" });

  const copied = options.copy ? await copyToClipboard(content) : undefined;

  return {
    file,
    summary: [`Created ${path.relative(root, file)}`, copied === false ? "Clipboard copy failed; file was still generated." : ""]
      .filter(Boolean)
      .join("\n"),
  };
}

async function collectSimpleInputs(options: StartOptions): Promise<StartOptions> {
  if (options.title && options.scope && options.blockedScope) {
    return options;
  }

  if (!input.isTTY || !output.isTTY) {
    return options;
  }

  const rl = createInterface({ input, output });

  try {
    return {
      ...options,
      title: options.title || (await rl.question("Task title: ")),
      scope: options.scope || (await rl.question("Allowed scope: ")),
      blockedScope: options.blockedScope || (await rl.question("Blocked scope: ")),
    };
  } finally {
    rl.close();
  }
}

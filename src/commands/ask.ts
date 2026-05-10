import type { Command } from "commander";
import path from "node:path";
import { copyToClipboard } from "../core/clipboard.js";
import { runShellCommand } from "../core/command-runner.js";
import { loadConfig } from "../core/config.js";
import { safeWriteFile, readTextIfExists } from "../core/fs.js";
import { collectGitContext } from "../core/git.js";
import { formatOpenSpecContext, readOpenSpecContext } from "../core/openspec.js";
import { getRunContext } from "../core/runs.js";
import { loadState } from "../core/state.js";
import { loadTemplate, renderTemplate } from "../core/templates.js";

interface AskOptions {
  run?: "build" | "test";
  copy?: boolean;
  force?: boolean;
}

export function registerAskCommand(program: Command): void {
  program
    .command("ask")
    .description("Create an advisor escalation request when the executor is stuck.")
    .option("--run <target>", "Explicitly run build or test before generating ASK_ADVISOR.md.")
    .option("--copy", "Copy generated content to clipboard.")
    .option("--force", "Overwrite ASK_ADVISOR.md.")
    .action(async (options: AskOptions) => {
      const result = await runAsk(process.cwd(), options);
      console.log(result.summary);
    });
}

export async function runAsk(root: string, options: AskOptions = {}): Promise<{ file: string; summary: string }> {
  if (options.run && options.run !== "build" && options.run !== "test") {
    throw new Error("--run must be build or test.");
  }

  const config = await loadConfig(root);
  const state = await loadState(root);
  const run = requireCurrentRun(root, config, state.currentRun, state.currentLane);
  const git = await collectGitContext(root, config.maxDiffLines);
  const currentTask = await readTextIfExists(path.join(run.laneDir, "EXECUTOR_TASK.md"));
  const commandResult = await maybeRunCommand(root, config, options.run);
  const openSpecText =
    state.mode === "openspec" && state.currentChange
      ? formatOpenSpecContext(await readOpenSpecContext(root, state.currentChange))
      : "";

  const errorLog = commandResult
    ? [`Command: ${commandResult.command}`, `Exit Code: ${commandResult.exitCode}`, commandResult.output].join("\n")
    : "No build/test command was run. Pass --run build or --run test to include command output.";

  const content = renderTemplate(await loadTemplate("ASK_ADVISOR.template.md"), {
    projectName: config.projectName,
    runId: state.currentRun,
    lane: state.currentLane,
    branch: git.branch,
    currentTask: [currentTask || "(missing EXECUTOR_TASK.md)", openSpecText].filter(Boolean).join("\n\n"),
    errorLog,
    gitStatus: git.status || "(clean)",
    gitDiffStat: git.diffStat || "(no diff)",
  });

  const relative = path.relative(root, path.join(run.laneDir, "ASK_ADVISOR.md"));
  const file = await safeWriteFile(root, relative, content, { force: options.force });
  const copied = options.copy ? await copyToClipboard(content) : undefined;

  return {
    file,
    summary: [`Created ${path.relative(root, file)}`, copied === false ? "Clipboard copy failed; file was still generated." : ""]
      .filter(Boolean)
      .join("\n"),
  };
}

function requireCurrentRun(root: string, config: Awaited<ReturnType<typeof loadConfig>>, runId: string, lane: string) {
  if (!runId) {
    throw new Error("No current run. Run advisor start first.");
  }

  return getRunContext(root, config, runId, lane);
}

async function maybeRunCommand(
  root: string,
  config: Awaited<ReturnType<typeof loadConfig>>,
  target?: "build" | "test",
) {
  if (!target) {
    return undefined;
  }

  const command = target === "build" ? config.buildCommand : config.testCommand;

  if (!command) {
    throw new Error(`No ${target} command configured or detected.`);
  }

  return runShellCommand(root, command);
}

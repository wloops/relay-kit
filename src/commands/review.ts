import type { Command } from "commander";
import path from "node:path";
import { copyToClipboard } from "../core/clipboard.js";
import { loadConfig } from "../core/config.js";
import { createContextSafety } from "../core/context-safety.js";
import { readTextIfExists, safeWriteFile } from "../core/fs.js";
import { collectGitContext } from "../core/git.js";
import { formatOpenSpecContext, readOpenSpecContext } from "../core/openspec.js";
import { getRunContext } from "../core/runs.js";
import { loadState } from "../core/state.js";
import { loadTemplate, renderTemplate } from "../core/templates.js";

interface ReviewOptions {
  copy?: boolean;
  force?: boolean;
}

export function registerReviewCommand(program: Command): void {
  program
    .command("review")
    .description("Create a relay review request for the current implementation.")
    .option("--copy", "Copy generated content to clipboard.")
    .option("--force", "Overwrite REVIEW_REQUEST.md.")
    .action(async (options: ReviewOptions) => {
      const result = await runReview(process.cwd(), options);
      console.log(result.summary);
    });
}

export async function runReview(root: string, options: ReviewOptions = {}): Promise<{ file: string; summary: string }> {
  const config = await loadConfig(root);
  const state = await loadState(root);

  if (!state.currentRun) {
    throw new Error("No current run. Run relay start first.");
  }

  const run = getRunContext(root, config, state.currentRun, state.currentLane);
  const contextSafety = await createContextSafety(root, config);
  const git = await collectGitContext(root, {
    maxDiffLines: config.maxDiffLines,
    gitExcludePathspecs: contextSafety.ignore.gitExcludePathspecs,
    shouldIgnorePath: contextSafety.shouldIgnorePath,
    redactText: contextSafety.redactText,
  });
  const task = contextSafety.redactText(await readTextIfExists(path.join(run.laneDir, "EXECUTOR_TASK.md")));
  const openSpecText =
    state.mode === "openspec" && state.currentChange
      ? contextSafety.redactText(formatOpenSpecContext(await readOpenSpecContext(root, state.currentChange)))
      : "";

  const content = renderTemplate(await loadTemplate("REVIEW_REQUEST.template.md"), {
    projectName: config.projectName,
    runId: state.currentRun,
    lane: state.currentLane,
    ignoreRulesStatus: contextSafety.ignoreRulesStatus,
    redactionRulesStatus: contextSafety.redactionRulesStatus,
    gitDiffStat: git.diffStat || "(no diff)",
    gitDiff: [git.diff || "(no diff)", task ? `\n\n# Current Executor Task\n${task}` : "", openSpecText].filter(Boolean).join("\n"),
  });
  const relative = path.relative(root, path.join(run.laneDir, "REVIEW_REQUEST.md"));
  const file = await safeWriteFile(root, relative, content, { force: options.force });
  const copied = options.copy ? await copyToClipboard(content) : undefined;

  return {
    file,
    summary: [`Created ${path.relative(root, file)}`, copied === false ? "Clipboard copy failed; file was still generated." : ""]
      .filter(Boolean)
      .join("\n"),
  };
}

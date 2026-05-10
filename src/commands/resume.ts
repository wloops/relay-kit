import type { Command } from "commander";
import path from "node:path";
import { copyToClipboard } from "../core/clipboard.js";
import { loadConfig } from "../core/config.js";
import { readTextIfExists, safeWriteFile } from "../core/fs.js";
import { getRunContext } from "../core/runs.js";
import { loadState } from "../core/state.js";
import { loadTemplate, renderTemplate } from "../core/templates.js";

interface ResumeOptions {
  from?: string;
  copy?: boolean;
  force?: boolean;
}

export function registerResumeCommand(program: Command): void {
  program
    .command("resume")
    .description("Create a resume prompt from a relay decision.")
    .option("--from <path>", "Read Advisor decision from a specific file.")
    .option("--copy", "Copy generated content to clipboard.")
    .option("--force", "Overwrite RESUME_PROMPT.md.")
    .action(async (options: ResumeOptions) => {
      const result = await runResume(process.cwd(), options);
      console.log(result.summary);
    });
}

export async function runResume(root: string, options: ResumeOptions = {}): Promise<{ file: string; summary: string }> {
  const config = await loadConfig(root);
  const state = await loadState(root);

  if (!state.currentRun) {
    throw new Error("No current run. Run relay start first.");
  }

  const run = getRunContext(root, config, state.currentRun, state.currentLane);
  const sourcePath = options.from ? path.resolve(root, options.from) : path.join(run.laneDir, "ADVISOR_DECISION.md");
  const decision = await readTextIfExists(sourcePath);

  if (!decision.trim()) {
    throw new Error(`Decision is missing or empty: ${path.relative(root, sourcePath)}`);
  }

  const prompt = extractPromptForExecutor(decision);

  if (!prompt.trim()) {
    throw new Error("Decision does not contain a non-empty 'Prompt For Executor' section.");
  }

  const content = renderTemplate(await loadTemplate("RESUME_PROMPT.template.md"), {
    promptForExecutor: prompt,
  });
  const relative = path.relative(root, path.join(run.laneDir, "RESUME_PROMPT.md"));
  const file = await safeWriteFile(root, relative, content, { force: options.force });
  const copied = options.copy ? await copyToClipboard(content) : undefined;

  return {
    file,
    summary: [`Created ${path.relative(root, file)}`, copied === false ? "Clipboard copy failed; file was still generated." : ""]
      .filter(Boolean)
      .join("\n"),
  };
}

export function extractPromptForExecutor(decision: string): string {
  const heading = /^## Prompt For Executor\s*$/im.exec(decision);

  if (!heading) {
    return "";
  }

  const bodyStart = heading.index + heading[0].length;
  const rest = decision.slice(bodyStart);
  const nextHeading = /^##\s.+$/im.exec(rest);
  return rest.slice(0, nextHeading?.index).trim();
}

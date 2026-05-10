import path from "node:path";
import { DEFAULT_LANE } from "./constants.js";
import { ensureDir, safeWriteFile } from "./fs.js";
import { loadTemplate, renderTemplate } from "./templates.js";
import type { RelayConfig, RunContext } from "./types.js";

export function slugify(value: string): string {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);

  return slug || "task";
}

export function createRunId(title: string, date = new Date()): string {
  const day = date.toISOString().slice(0, 10);
  return `${day}-${slugify(title)}`;
}

export function getRunContext(root: string, config: RelayConfig, runId: string, lane = DEFAULT_LANE): RunContext {
  const runDir = path.join(root, config.handoffDir, "runs", runId);
  return {
    runId,
    lane,
    runDir,
    laneDir: path.join(runDir, "lanes", lane),
  };
}

export async function createRunStructure(
  root: string,
  config: RelayConfig,
  runId: string,
  lane = DEFAULT_LANE,
  options: { force?: boolean } = {},
): Promise<RunContext> {
  const context = getRunContext(root, config, runId, lane);
  await ensureDir(context.laneDir);
  await ensureDir(path.join(context.runDir, "history"));

  const runRelative = path.relative(root, path.join(context.runDir, "RUN.md"));
  await safeWriteFile(root, runRelative, `# RUN\n\n- Run: ${runId}\n- Lane: ${lane}\n`, options);

  const board = renderTemplate(await loadTemplate("TASK_BOARD.template.md"), { runId });
  const boardRelative = path.relative(root, path.join(context.runDir, "TASK_BOARD.md"));
  await safeWriteFile(root, boardRelative, board, options);

  return context;
}

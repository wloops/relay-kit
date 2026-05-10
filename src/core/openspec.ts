import fs from "node:fs/promises";
import path from "node:path";
import { filterExcludedLines } from "./excludes.js";
import { pathExists, readTextIfExists } from "./fs.js";

export interface OpenSpecContext {
  change: string;
  proposal: string;
  design: string;
  tasks: string;
}

export async function listOpenSpecChanges(root: string): Promise<string[]> {
  const changesDir = path.join(root, "openspec", "changes");

  if (!(await pathExists(changesDir))) {
    return [];
  }

  const entries = await fs.readdir(changesDir, { withFileTypes: true });
  return entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort();
}

export async function resolveOpenSpecChange(root: string, requested?: string): Promise<string> {
  if (requested) {
    const changeDir = path.join(root, "openspec", "changes", requested);

    if (!(await pathExists(changeDir))) {
      throw new Error(`OpenSpec change not found: ${requested}`);
    }

    return requested;
  }

  const changes = await listOpenSpecChanges(root);

  if (changes.length === 1) {
    return changes[0];
  }

  if (changes.length === 0) {
    throw new Error("No OpenSpec changes found.");
  }

  throw new Error(`Multiple OpenSpec changes found. Specify one with --change: ${changes.join(", ")}`);
}

export async function readOpenSpecContext(root: string, change: string): Promise<OpenSpecContext> {
  const changeDir = path.join(root, "openspec", "changes", change);
  return {
    change,
    proposal: filterExcludedLines(await readTextIfExists(path.join(changeDir, "proposal.md"))),
    design: filterExcludedLines(await readTextIfExists(path.join(changeDir, "design.md"))),
    tasks: filterExcludedLines(await readTextIfExists(path.join(changeDir, "tasks.md"))),
  };
}

export function formatOpenSpecContext(context?: OpenSpecContext): string {
  if (!context) {
    return "";
  }

  return [
    `# OpenSpec Change: ${context.change}`,
    "## proposal.md",
    context.proposal || "(missing)",
    "## design.md",
    context.design || "(missing)",
    "## tasks.md",
    context.tasks || "(missing)",
  ].join("\n\n");
}

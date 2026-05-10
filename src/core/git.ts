import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { filterExcludedLines } from "./excludes.js";

const execFileAsync = promisify(execFile);
const EXCLUDED_PATHSPECS = [
  ":(exclude).env",
  ":(exclude).env.*",
  ":(exclude)node_modules/**",
  ":(exclude)dist/**",
  ":(exclude)build/**",
  ":(exclude)coverage/**",
];

async function git(root: string, args: string[]): Promise<string> {
  try {
    const { stdout, stderr } = await execFileAsync("git", args, {
      cwd: root,
      maxBuffer: 1024 * 1024 * 5,
      windowsHide: true,
    });

    return `${stdout}${stderr}`.trim();
  } catch (error) {
    if (error && typeof error === "object" && "stdout" in error) {
      const failed = error as { stdout?: string; stderr?: string };
      return `${failed.stdout ?? ""}${failed.stderr ?? ""}`.trim();
    }

    return "";
  }
}

export interface GitContext {
  branch: string;
  status: string;
  diffStat: string;
  diff: string;
}

export async function collectGitContext(root: string, maxDiffLines: number): Promise<GitContext> {
  const insideWorkTree = await git(root, ["rev-parse", "--is-inside-work-tree"]);

  if (insideWorkTree.trim() !== "true") {
    return {
      branch: "(not a git repository)",
      status: "",
      diffStat: "",
      diff: "",
    };
  }

  const branch = filterExcludedLines(await git(root, ["branch", "--show-current"])) || "(unknown)";
  const status = filterExcludedLines(await git(root, ["status", "--short", "--", ".", ...EXCLUDED_PATHSPECS]));
  const diffStat = filterExcludedLines(await git(root, ["diff", "--stat", "--", ".", ...EXCLUDED_PATHSPECS]));
  const diff = filterExcludedLines(await git(root, ["diff", "--", ".", ...EXCLUDED_PATHSPECS]));
  const truncatedDiff = truncateLines(diff, maxDiffLines);

  return {
    branch,
    status,
    diffStat,
    diff: truncatedDiff,
  };
}

export function truncateLines(text: string, maxLines: number): string {
  const lines = text.split(/\r?\n/);

  if (lines.length <= maxLines) {
    return text;
  }

  return `${lines.slice(0, maxLines).join("\n")}\n... truncated ${lines.length - maxLines} lines ...`;
}

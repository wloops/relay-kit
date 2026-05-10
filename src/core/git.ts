import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { filterExcludedLines, isExcludedPath } from "./excludes.js";

const execFileAsync = promisify(execFile);

export interface GitContextOptions {
  maxDiffLines: number;
  gitExcludePathspecs?: string[];
  shouldIgnorePath?: (candidate: string) => boolean;
  redactText?: (value: string) => string;
}

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

export async function collectGitContext(root: string, options: GitContextOptions | number): Promise<GitContext> {
  const contextOptions = typeof options === "number" ? { maxDiffLines: options } : options;
  const insideWorkTree = await git(root, ["rev-parse", "--is-inside-work-tree"]);

  if (insideWorkTree.trim() !== "true") {
    return {
      branch: "(not a git repository)",
      status: "",
      diffStat: "",
      diff: "",
    };
  }

  const pathspecs = contextOptions.gitExcludePathspecs ?? [];
  const branch = sanitizeGitText(await git(root, ["branch", "--show-current"]), contextOptions) || "(unknown)";
  const status = sanitizeGitText(await git(root, ["status", "--short", "--", ".", ...pathspecs]), contextOptions);
  const diffStat = sanitizeGitText(await git(root, ["diff", "--stat", "--", ".", ...pathspecs]), contextOptions);
  const diff = sanitizeGitDiff(await git(root, ["diff", "--", ".", ...pathspecs]), contextOptions);
  const truncatedDiff = truncateLines(diff, contextOptions.maxDiffLines);

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

function sanitizeGitText(text: string, options: GitContextOptions): string {
  const filtered = filterIgnoredLines(filterExcludedLines(text), options.shouldIgnorePath);
  return applyRedaction(filtered, options).trim();
}

function sanitizeGitDiff(text: string, options: GitContextOptions): string {
  const filtered = filterIgnoredLines(filterIgnoredDiffBlocks(text, options.shouldIgnorePath), options.shouldIgnorePath);
  return applyRedaction(filtered, options).trim();
}

function applyRedaction(text: string, options: GitContextOptions): string {
  return options.redactText ? options.redactText(text) : text;
}

function filterIgnoredLines(text: string, shouldIgnorePath?: (candidate: string) => boolean): string {
  return text
    .split(/\r?\n/)
    .filter((line) => !lineReferencesIgnoredPath(line, shouldIgnorePath ?? (() => false)))
    .join("\n")
    .trim();
}

function filterIgnoredDiffBlocks(text: string, shouldIgnorePath?: (candidate: string) => boolean): string {
  const lines = text.split(/\r?\n/);
  const kept: string[] = [];
  let skipping = false;
  const ignore = shouldIgnorePath ?? (() => false);

  for (const line of lines) {
    if (line.startsWith("diff --git ")) {
      skipping = lineReferencesIgnoredPath(line, ignore);
    }

    if (!skipping) {
      kept.push(line);
    }
  }

  return kept.join("\n").trim();
}

function lineReferencesIgnoredPath(line: string, shouldIgnorePath: (candidate: string) => boolean): boolean {
  return extractCandidatePaths(line).some((candidate) => shouldIgnorePath(candidate) || isExcludedPath(candidate));
}

function extractCandidatePaths(line: string): string[] {
  const candidates = new Set<string>();
  const statusPath = line.match(/^[ MADRCU?!]{1,2}\s+(.+)$/)?.[1];

  if (statusPath) {
    for (const part of statusPath.split(/\s+->\s+/)) {
      candidates.add(stripGitPathDecorations(part));
    }
  }

  const diffPaths = line.matchAll(/\b[ab]\/([^\s]+)/g);
  for (const match of diffPaths) {
    candidates.add(stripGitPathDecorations(match[1]));
  }

  const statPath = line.includes("|") ? line.split("|")[0]?.trim() : "";
  if (statPath) {
    candidates.add(stripGitPathDecorations(statPath));
  }

  return [...candidates].filter(Boolean);
}

function stripGitPathDecorations(value: string): string {
  return value.replace(/^"|"$/g, "").replace(/\\/g, "/").trim();
}

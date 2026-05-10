import path from "node:path";
import { EXCLUDED_NAMES } from "./constants.js";

function normalizePath(value: string): string {
  return value.replace(/\\/g, "/");
}

export function isExcludedPath(candidate: string): boolean {
  const normalized = normalizePath(candidate);
  const parts = normalized.split("/").filter(Boolean);
  const basename = parts.at(-1) ?? normalized;

  if (basename === ".env" || basename.startsWith(".env.")) {
    return true;
  }

  return parts.some((part) => EXCLUDED_NAMES.has(part));
}

export function filterExcludedLines(text: string): string {
  return text
    .split(/\r?\n/)
    .filter((line) => {
      // Git output and diff headers can expose sensitive paths even when file content is excluded.
      return !isExcludedPath(line);
    })
    .join("\n")
    .trim();
}

export function assertInsideRoot(root: string, target: string): string {
  const resolvedRoot = path.resolve(root);
  const resolvedTarget = path.resolve(root, target);
  const relative = path.relative(resolvedRoot, resolvedTarget);

  if (relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative))) {
    return resolvedTarget;
  }

  throw new Error(`Refusing to write outside project root: ${target}`);
}

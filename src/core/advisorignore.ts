import path from "node:path";
import { ADVISORIGNORE_FILE, EXCLUDED_GLOBS } from "./constants.js";
import { pathExists, readTextIfExists, stripBom } from "./fs.js";

export interface AdvisorIgnoreRule {
  pattern: string;
  raw: string;
  directory: boolean;
  rootOnly: boolean;
  hasGlob: boolean;
}

export interface AdvisorIgnoreMatcher {
  hasAdvisorIgnore: boolean;
  patterns: string[];
  gitExcludePathspecs: string[];
  shouldIgnorePath(candidate: string): boolean;
}

export async function loadAdvisorIgnoreMatcher(root: string, extraPatterns: string[] = []): Promise<AdvisorIgnoreMatcher> {
  const advisorIgnorePath = path.join(root, ADVISORIGNORE_FILE);
  const hasAdvisorIgnore = await pathExists(advisorIgnorePath);
  const advisorIgnorePatterns = hasAdvisorIgnore ? parseAdvisorIgnore(await readTextIfExists(advisorIgnorePath)) : [];
  const patterns = uniquePatterns([...EXCLUDED_GLOBS, ...extraPatterns, ...advisorIgnorePatterns]);
  const rules = patterns.map(parseRule).filter((rule): rule is AdvisorIgnoreRule => Boolean(rule));

  return {
    hasAdvisorIgnore,
    patterns,
    gitExcludePathspecs: buildGitExcludePathspecs(rules),
    shouldIgnorePath(candidate: string): boolean {
      const normalized = normalizePath(candidate);
      return rules.some((rule) => matchesRule(rule, normalized));
    },
  };
}

export function parseAdvisorIgnore(content: string): string[] {
  return stripBom(content)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"))
    .filter((line) => !line.startsWith("!"));
}

export function normalizePath(value: string): string {
  return value.replace(/\\/g, "/").replace(/^\.\//, "").replace(/^\/+/, "");
}

function parseRule(rawPattern: string): AdvisorIgnoreRule | undefined {
  const raw = rawPattern.trim();

  if (!raw || raw.startsWith("#") || raw.startsWith("!")) {
    return undefined;
  }

  const rootOnly = raw.startsWith("/");
  const directory = raw.endsWith("/");
  const pattern = normalizePath(raw).replace(/\/$/, "");

  if (!pattern) {
    return undefined;
  }

  return {
    pattern,
    raw,
    directory,
    rootOnly,
    hasGlob: pattern.includes("*"),
  };
}

function matchesRule(rule: AdvisorIgnoreRule, candidate: string): boolean {
  const normalized = normalizePath(candidate);
  const parts = normalized.split("/").filter(Boolean);

  if (rule.directory) {
    if (rule.hasGlob || rule.pattern.includes("/")) {
      return pathMatchesPattern(normalized, rule.pattern) || normalized.startsWith(`${rule.pattern}/`);
    }

    return parts.includes(rule.pattern);
  }

  if (rule.hasGlob) {
    const target = rule.pattern.includes("/") || rule.rootOnly ? normalized : parts.at(-1) ?? normalized;
    return pathMatchesPattern(target, rule.pattern);
  }

  if (rule.pattern.includes("/") || rule.rootOnly) {
    return normalized === rule.pattern;
  }

  return parts.includes(rule.pattern);
}

function pathMatchesPattern(candidate: string, pattern: string): boolean {
  return globToRegExp(pattern).test(candidate);
}

function globToRegExp(pattern: string): RegExp {
  const source = pattern
    .split("*")
    .map((part) => part.replace(/[.+?^${}()|[\]\\]/g, "\\$&"))
    .join(".*");
  return new RegExp(`^${source}$`);
}

function buildGitExcludePathspecs(rules: AdvisorIgnoreRule[]): string[] {
  const pathspecs: string[] = [];

  for (const rule of rules) {
    const pattern = gitGlobForRule(rule);
    pathspecs.push(`:(exclude,glob)${pattern}`);

    if (!rule.rootOnly && !pattern.startsWith("**/")) {
      pathspecs.push(`:(exclude,glob)**/${pattern}`);
    }
  }

  return [...new Set(pathspecs)];
}

function gitGlobForRule(rule: AdvisorIgnoreRule): string {
  if (rule.directory) {
    return `${rule.pattern}/**`;
  }

  return rule.pattern;
}

function uniquePatterns(patterns: string[]): string[] {
  return [...new Set(patterns.map((pattern) => pattern.trim()).filter(Boolean))];
}

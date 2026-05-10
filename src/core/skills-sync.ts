import crypto from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { ADVISOR_DIR } from "./constants.js";
import { ensureDir, pathExists, readJsonIfExists, writeJsonFile } from "./fs.js";
import type { AdvisorConfig } from "./types.js";

export type SkillSyncTool = "claude" | "codex";
export type SkillSyncTargetOption = SkillSyncTool | "all";
export type SkillSyncScope = "project" | "user";
export type SkillSyncAction = "create" | "update" | "unchanged" | "conflict" | "skip";

export interface SkillSyncOptions {
  target?: SkillSyncTargetOption;
  scope?: SkillSyncScope;
  dryRun?: boolean;
  force?: boolean;
  homeDir?: string;
}

export interface SkillSyncTarget {
  tool: SkillSyncTool;
  scope: SkillSyncScope;
  root: string;
}

export interface SkillSyncEntry {
  action: SkillSyncAction;
  tool: SkillSyncTool;
  scope: SkillSyncScope;
  skill: string;
  relativePath: string;
  sourcePath: string;
  targetPath: string;
  reason: string;
}

export interface SkillSyncReport {
  sourceRoot: string;
  targetOption: SkillSyncTargetOption | "configured";
  scope: SkillSyncScope;
  dryRun: boolean;
  force: boolean;
  targets: SkillSyncTarget[];
  entries: SkillSyncEntry[];
  summary: Record<SkillSyncAction, number>;
}

interface SkillSourceFile {
  skill: string;
  relativePath: string;
  absolutePath: string;
  hash: string;
  content: Buffer;
}

interface SkillSyncManifest {
  version: 1;
  records: Record<string, SkillSyncManifestRecord>;
}

interface SkillSyncManifestRecord {
  sourceHash: string;
  targetHash: string;
  syncedAt: string;
}

export class SkillSyncConflictError extends Error {
  constructor(public readonly report: SkillSyncReport) {
    super("Skills sync encountered conflicts. Re-run with --force to overwrite conflicted files.");
  }
}

const MANIFEST_FILE = path.join(ADVISOR_DIR, "skills-sync.json");
const ACTIONS: SkillSyncAction[] = ["create", "update", "unchanged", "conflict", "skip"];

export async function syncSkills(root: string, config: AdvisorConfig, options: SkillSyncOptions = {}): Promise<SkillSyncReport> {
  const sourceRoot = path.join(root, ADVISOR_DIR, "skills");
  const scope = options.scope ?? "project";
  const targets = resolveSkillSyncTargets(root, config, { ...options, scope });
  const sources = await collectSkillSourceFiles(sourceRoot);
  const manifest = await readManifest(root);
  const report = await planSkillSync(sourceRoot, sources, targets, manifest, options.target ?? "configured", scope, options);

  if (!options.force && report.summary.conflict > 0) {
    throw new SkillSyncConflictError(report);
  }

  if (!options.dryRun) {
    await applySkillSync(report, sources, manifest);
    await writeJsonFile(path.join(root, MANIFEST_FILE), manifest);
  }

  return report;
}

export function resolveSkillSyncTargets(root: string, config: AdvisorConfig, options: SkillSyncOptions = {}): SkillSyncTarget[] {
  const scope = options.scope ?? "project";
  const homeDir = options.homeDir ?? os.homedir();
  const tools = resolveTools(config, options.target, scope);

  return tools.map((tool) => ({
    tool,
    scope,
    root: resolveTargetRoot(root, homeDir, tool, scope),
  }));
}

export function formatSkillSyncReport(report: SkillSyncReport): string {
  const targetLabels = report.targets.map((target) => pathLabel(target.root)).join(", ") || "(none)";
  const lines = [
    "advisor sync --skills",
    `source: ${pathLabel(report.sourceRoot)}`,
    `scope: ${report.scope}`,
    `target: ${report.targetOption}`,
    `dry-run: ${report.dryRun ? "yes" : "no"}`,
    `force: ${report.force ? "yes" : "no"}`,
    `targets: ${targetLabels}`,
    `summary: create ${report.summary.create}, update ${report.summary.update}, unchanged ${report.summary.unchanged}, conflict ${report.summary.conflict}, skip ${report.summary.skip}`,
  ];

  if (report.entries.length) {
    lines.push("files:");
    for (const entry of report.entries) {
      lines.push(`- ${entry.action} ${entry.tool}/${entry.scope} ${entry.skill}/${entry.relativePath} -> ${pathLabel(entry.targetPath)} (${entry.reason})`);
    }
  }

  if (report.summary.conflict > 0) {
    lines.push("conflicts:");
    for (const entry of report.entries.filter((item) => item.action === "conflict")) {
      lines.push(`- ${pathLabel(entry.targetPath)}`);
    }
    lines.push("Use --force to overwrite conflicted files after reviewing them.");
  }

  return lines.join("\n");
}

function resolveTools(config: AdvisorConfig, target: SkillSyncTargetOption | undefined, scope: SkillSyncScope): SkillSyncTool[] {
  if (target) {
    if (target === "all") {
      return ["claude", "codex"];
    }

    return [target];
  }

  if (scope === "project") {
    return [
      config.skills.install.claudeProject ? "claude" : undefined,
      config.skills.install.codexProject ? "codex" : undefined,
    ].filter((tool): tool is SkillSyncTool => Boolean(tool));
  }

  const tools = [
    config.skills.install.claudeUser ? "claude" : undefined,
    config.skills.install.codexUser ? "codex" : undefined,
  ].filter((tool): tool is SkillSyncTool => Boolean(tool));

  if (tools.length === 0) {
    throw new Error("No user-level skills targets are enabled. Pass --target claude, --target codex, or --target all with --scope user.");
  }

  return tools;
}

function resolveTargetRoot(root: string, homeDir: string, tool: SkillSyncTool, scope: SkillSyncScope): string {
  if (scope === "user") {
    return path.join(homeDir, tool === "claude" ? ".claude" : ".agents", "skills");
  }

  return path.join(root, tool === "claude" ? ".claude" : ".agents", "skills");
}

async function collectSkillSourceFiles(sourceRoot: string): Promise<SkillSourceFile[]> {
  if (!(await pathExists(sourceRoot))) {
    throw new Error("Missing .advisor-kit/skills. Run advisor init first.");
  }

  const entries = await fs.readdir(sourceRoot, { withFileTypes: true });
  const files: SkillSourceFile[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory() || !entry.name.startsWith("advisor-")) {
      continue;
    }

    const skillRoot = path.join(sourceRoot, entry.name);
    if (!(await pathExists(path.join(skillRoot, "SKILL.md")))) {
      continue;
    }

    files.push(...(await collectFiles(skillRoot, entry.name, "")));
  }

  if (files.length === 0) {
    throw new Error("No advisor skills found in .advisor-kit/skills.");
  }

  return files;
}

async function collectFiles(skillRoot: string, skill: string, relativeDir: string): Promise<SkillSourceFile[]> {
  const dir = path.join(skillRoot, relativeDir);
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files: SkillSourceFile[] = [];

  for (const entry of entries) {
    const relativePath = path.join(relativeDir, entry.name);
    const absolutePath = path.join(skillRoot, relativePath);

    if (entry.isDirectory()) {
      files.push(...(await collectFiles(skillRoot, skill, relativePath)));
      continue;
    }

    if (!entry.isFile()) {
      continue;
    }

    const content = await fs.readFile(absolutePath);
    files.push({
      skill,
      relativePath,
      absolutePath,
      content,
      hash: hashBuffer(content),
    });
  }

  return files;
}

async function planSkillSync(
  sourceRoot: string,
  sources: SkillSourceFile[],
  targets: SkillSyncTarget[],
  manifest: SkillSyncManifest,
  targetOption: SkillSyncTargetOption | "configured",
  scope: SkillSyncScope,
  options: SkillSyncOptions,
): Promise<SkillSyncReport> {
  const entries: SkillSyncEntry[] = [];
  const summary = createEmptySummary();

  for (const target of targets) {
    for (const source of sources) {
      const targetPath = path.join(target.root, source.skill, source.relativePath);
      const recordKey = manifestKey(target, source.skill, source.relativePath);
      const record = manifest.records[recordKey];
      const targetExists = await pathExists(targetPath);
      const targetHash = targetExists ? hashBuffer(await fs.readFile(targetPath)) : "";
      const action = resolveAction(source.hash, targetExists, targetHash, record, Boolean(options.force));
      const reason = actionReason(action, targetExists, record, Boolean(options.force));

      entries.push({
        action,
        tool: target.tool,
        scope: target.scope,
        skill: source.skill,
        relativePath: normalizeRelative(source.relativePath),
        sourcePath: source.absolutePath,
        targetPath,
        reason,
      });
      summary[action] += 1;
    }
  }

  return {
    sourceRoot,
    targetOption,
    scope,
    dryRun: Boolean(options.dryRun),
    force: Boolean(options.force),
    targets,
    entries,
    summary,
  };
}

async function applySkillSync(report: SkillSyncReport, sources: SkillSourceFile[], manifest: SkillSyncManifest): Promise<void> {
  const sourceByKey = new Map(sources.map((source) => [`${source.skill}/${normalizeRelative(source.relativePath)}`, source]));
  const syncedAt = new Date().toISOString();

  for (const entry of report.entries) {
    const source = sourceByKey.get(`${entry.skill}/${entry.relativePath}`);
    if (!source) {
      continue;
    }

    if (entry.action === "create" || entry.action === "update") {
      await ensureDir(path.dirname(entry.targetPath));
      await fs.writeFile(entry.targetPath, source.content);
    }

    if (entry.action === "create" || entry.action === "update" || entry.action === "unchanged") {
      manifest.records[manifestKey(entry, entry.skill, entry.relativePath)] = {
        sourceHash: source.hash,
        targetHash: source.hash,
        syncedAt,
      };
    }
  }
}

function resolveAction(
  sourceHash: string,
  targetExists: boolean,
  targetHash: string,
  record: SkillSyncManifestRecord | undefined,
  force: boolean,
): SkillSyncAction {
  if (!targetExists) {
    return "create";
  }

  if (targetHash === sourceHash) {
    return "unchanged";
  }

  if (record?.targetHash === targetHash || force) {
    return "update";
  }

  return "conflict";
}

function actionReason(action: SkillSyncAction, targetExists: boolean, record: SkillSyncManifestRecord | undefined, force: boolean): string {
  if (action === "create") return "target file does not exist";
  if (action === "unchanged") return record ? "target already matches source" : "target matches source; recording sync state";
  if (action === "update") return force ? "force enabled" : "target unchanged since last sync";
  if (action === "conflict") return targetExists ? "target differs and is not safe to overwrite" : "not applicable";
  return "skipped";
}

async function readManifest(root: string): Promise<SkillSyncManifest> {
  const manifest = await readJsonIfExists<SkillSyncManifest>(path.join(root, MANIFEST_FILE));

  if (!manifest || manifest.version !== 1 || typeof manifest.records !== "object") {
    return { version: 1, records: {} };
  }

  return manifest;
}

function manifestKey(target: Pick<SkillSyncTarget, "scope" | "tool">, skill: string, relativePath: string): string {
  return `${target.scope}:${target.tool}:${skill}/${normalizeRelative(relativePath)}`;
}

function hashBuffer(value: Buffer): string {
  return `sha256:${crypto.createHash("sha256").update(value).digest("hex")}`;
}

function createEmptySummary(): Record<SkillSyncAction, number> {
  return Object.fromEntries(ACTIONS.map((action) => [action, 0])) as Record<SkillSyncAction, number>;
}

function normalizeRelative(value: string): string {
  return value.replace(/\\/g, "/");
}

function pathLabel(value: string): string {
  return value.replace(/\\/g, "/");
}

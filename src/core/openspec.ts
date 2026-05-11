import fs from "node:fs/promises";
import path from "node:path";
import {
  OPENSPEC_CHANGES_DIR,
  OPENSPEC_SPECS_DIR,
  OPENSPEC_ARCHIVE_DIR,
  OPENSPEC_CONFIG_FILE,
  OPENSPEC_DEFAULT_SCHEMA,
  OPENSPEC_DIR,
} from "./constants.js";
import { filterExcludedLines } from "./excludes.js";
import { ensureDir, pathExists, readTextIfExists } from "./fs.js";
import {
  getArtifact,
  getArtifactTemplate,
  getDefaultSchema,
  getSchema,
  getApplyRequires,
  getApplyInstruction,
} from "./schema.js";
import type {
  OpenSpecContext,
  OpenSpecChangeConfig,
  OpenSpecStatusResult,
  ArtifactStatus,
  InstructionsResult,
  ApplyInstructionsResult,
  TaskInfo,
  OpenSpecListEntry,
} from "./types.js";

export type { OpenSpecContext };

export function formatDate(date: Date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

export async function initOpenSpecStructure(root: string): Promise<void> {
  await ensureDir(path.join(root, OPENSPEC_DIR));
  await ensureDir(path.join(root, OPENSPEC_CHANGES_DIR));
  await ensureDir(path.join(root, OPENSPEC_SPECS_DIR));
  await ensureDir(path.join(root, OPENSPEC_ARCHIVE_DIR));

  const gitkeepFiles = [OPENSPEC_CHANGES_DIR, OPENSPEC_SPECS_DIR, OPENSPEC_ARCHIVE_DIR];
  for (const dir of gitkeepFiles) {
    const gitkeep = path.join(root, dir, ".gitkeep");
    if (!(await pathExists(gitkeep))) {
      await fs.writeFile(gitkeep, "", "utf8");
    }
  }
}

export async function newChange(
  root: string,
  name: string,
  schema: string = OPENSPEC_DEFAULT_SCHEMA,
): Promise<string> {
  if (!/^[a-z]/.test(name)) {
    throw new Error("Change name must start with a letter.");
  }

  if (!/^[a-z0-9][-a-z0-9]*$/.test(name)) {
    throw new Error("Change name must be kebab-case (lowercase letters, digits, hyphens).");
  }

  const changeDir = path.join(root, OPENSPEC_CHANGES_DIR, name);
  if (await pathExists(changeDir)) {
    throw new Error(`Change already exists: ${name}`);
  }

  const schemaDef = getSchema(schema);
  if (!schemaDef) {
    throw new Error(`Unknown schema: ${schema}. Available: ${["spec-driven"].join(", ")}`);
  }

  await ensureDir(changeDir);

  const config: OpenSpecChangeConfig = {
    schema,
    created: formatDate(),
  };

  await fs.writeFile(
    path.join(changeDir, OPENSPEC_CONFIG_FILE),
    `schema: ${config.schema}\ncreated: ${config.created}\n`,
    "utf8",
  );

  return changeDir;
}

export async function listOpenSpecChanges(root: string): Promise<string[]> {
  const changesDir = path.join(root, OPENSPEC_CHANGES_DIR);

  if (!(await pathExists(changesDir))) {
    return [];
  }

  const entries = await fs.readdir(changesDir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory() && entry.name !== "archive")
    .map((entry) => entry.name)
    .sort();
}

export async function listOpenSpecChangesDetailed(root: string): Promise<OpenSpecListEntry[]> {
  const names = await listOpenSpecChanges(root);
  const entries: OpenSpecListEntry[] = [];

  for (const name of names) {
    const config = await readChangeConfig(root, name);
    entries.push({
      name,
      schema: config?.schema ?? OPENSPEC_DEFAULT_SCHEMA,
      created: config?.created ?? "",
    });
  }

  return entries;
}

export async function resolveOpenSpecChange(root: string, requested?: string): Promise<string> {
  if (requested) {
    const changeDir = path.join(root, OPENSPEC_CHANGES_DIR, requested);

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

async function readChangeConfig(root: string, change: string): Promise<OpenSpecChangeConfig | null> {
  const configPath = path.join(root, OPENSPEC_CHANGES_DIR, change, OPENSPEC_CONFIG_FILE);
  const content = await readTextIfExists(configPath);
  if (!content) return null;

  const schemaMatch = content.match(/^schema:\s*(.+)$/m);
  const createdMatch = content.match(/^created:\s*(.+)$/m);

  return {
    schema: schemaMatch?.[1]?.trim() ?? OPENSPEC_DEFAULT_SCHEMA,
    created: createdMatch?.[1]?.trim() ?? "",
  };
}

export async function getChangeStatus(root: string, change: string): Promise<OpenSpecStatusResult> {
  const changeDir = path.join(root, OPENSPEC_CHANGES_DIR, change);
  if (!(await pathExists(changeDir))) {
    throw new Error(`Change not found: ${change}`);
  }

  const config = await readChangeConfig(root, change);
  const schemaName = config?.schema ?? OPENSPEC_DEFAULT_SCHEMA;
  const schemaDef = getSchema(schemaName);

  if (!schemaDef) {
    throw new Error(`Unknown schema: ${schemaName}`);
  }

  const applyRequires = getApplyRequires(schemaDef);
  const artifacts: ArtifactStatus[] = [];

  for (const artifact of schemaDef.artifacts) {
    const status = await computeArtifactStatus(root, change, artifact);
    artifacts.push(status);
  }

  return {
    changeName: change,
    schemaName,
    applyRequires,
    artifacts,
  };
}

async function computeArtifactStatus(
  root: string,
  change: string,
  artifact: { id: string; generates: string; requires: string[] },
): Promise<ArtifactStatus> {
  const changeDir = path.join(root, OPENSPEC_CHANGES_DIR, change);

  if (artifact.id === "specs") {
    const specsDir = path.join(changeDir, "specs");
    if (!(await pathExists(specsDir))) {
      // Check if all required deps are done first
      const depsOk = artifact.requires.length === 0;
      return { id: artifact.id, status: depsOk ? "ready" : "blocked" };
    }

    const entries = await fs.readdir(specsDir, { withFileTypes: true });
    const hasFiles = entries.some(
      (entry) => entry.isFile() && entry.name.endsWith(".md"),
    );
    return { id: artifact.id, status: hasFiles ? "done" : "ready" };
  }

  const filePath = path.join(changeDir, artifact.generates);
  const fileExists = await pathExists(filePath);

  if (fileExists) {
    return { id: artifact.id, status: "done" };
  }

  const allDepsDone = await checkDepsDone(root, change, artifact.requires);
  return { id: artifact.id, status: allDepsDone ? "ready" : "blocked" };
}

async function checkDepsDone(root: string, change: string, deps: string[]): Promise<boolean> {
  if (deps.length === 0) return true;

  const changeDir = path.join(root, OPENSPEC_CHANGES_DIR, change);
  const schemaDef = getDefaultSchema();

  for (const depId of deps) {
    const depArtifact = getArtifact(schemaDef, depId);
    if (!depArtifact) continue;

    if (depArtifact.id === "specs") {
      const specsDir = path.join(changeDir, "specs");
      if (!(await pathExists(specsDir))) return false;
      const entries = await fs.readdir(specsDir, { withFileTypes: true });
      if (!entries.some((e) => e.isFile() && e.name.endsWith(".md"))) return false;
      continue;
    }

    const depPath = path.join(changeDir, depArtifact.generates);
    if (!(await pathExists(depPath))) return false;
  }

  return true;
}

export async function getInstructions(
  root: string,
  change: string,
  artifactId: string,
): Promise<InstructionsResult> {
  const config = await readChangeConfig(root, change);
  const schemaName = config?.schema ?? OPENSPEC_DEFAULT_SCHEMA;
  const schemaDef = getSchema(schemaName);

  if (!schemaDef) {
    throw new Error(`Unknown schema: ${schemaName}`);
  }

  const artifact = getArtifact(schemaDef, artifactId);
  if (!artifact) {
    throw new Error(`Unknown artifact: ${artifactId} in schema ${schemaName}`);
  }

  const template = getArtifactTemplate(artifact.template);

  const changeDir = path.join(root, OPENSPEC_CHANGES_DIR, change);
  const outputPath = artifactId === "specs"
    ? path.join(changeDir, "specs")
    : path.join(changeDir, artifact.generates);

  return {
    artifactId,
    context: `Project: ${root}. Change: ${change}. Schema: ${schemaName}.`,
    rules: "Keep artifacts concise. Follow the template structure.",
    template,
    instruction: artifact.instruction,
    outputPath,
    dependencies: artifact.requires,
  };
}

export async function getApplyInstructions(
  root: string,
  change: string,
): Promise<ApplyInstructionsResult> {
  const config = await readChangeConfig(root, change);
  const schemaName = config?.schema ?? OPENSPEC_DEFAULT_SCHEMA;
  const schemaDef = getSchema(schemaName);

  if (!schemaDef) {
    throw new Error(`Unknown schema: ${schemaName}`);
  }

  const changeDir = path.join(root, OPENSPEC_CHANGES_DIR, change);
  const status = await getChangeStatus(root, change);

  const applyReq = getApplyRequires(schemaDef);
  const allRequiredDone = applyReq.every((id) => {
    const artifact = status.artifacts.find((a) => a.id === id);
    return artifact?.status === "done";
  });

  const contextFiles: Record<string, string[]> = {};
  for (const artifact of schemaDef.artifacts) {
    if (artifact.id === "specs") {
      const specsDir = path.join(changeDir, "specs");
      if (await pathExists(specsDir)) {
        const entries = await fs.readdir(specsDir, { withFileTypes: true });
        const mdFiles = entries
          .filter((e) => e.isFile() && e.name.endsWith(".md"))
          .map((e) => path.join(specsDir, e.name));
        if (mdFiles.length > 0) {
          contextFiles[artifact.id] = mdFiles;
        }
      }
      continue;
    }

    const filePath = path.join(changeDir, artifact.generates);
    if (await pathExists(filePath)) {
      contextFiles[artifact.id] = [filePath];
    }
  }

  const tasks = await parseTasks(root, change);

  let state: ApplyInstructionsResult["state"] = "ready";
  if (!allRequiredDone) {
    state = "blocked";
  } else if (tasks.length > 0 && tasks.every((t) => t.completed)) {
    state = "all_done";
  }

  return {
    schemaName,
    changeName: change,
    state,
    contextFiles,
    total: tasks.length,
    complete: tasks.filter((t) => t.completed).length,
    remaining: tasks.filter((t) => !t.completed).length,
    tasks,
    instruction: getApplyInstruction(schemaDef),
  };
}

async function parseTasks(root: string, change: string): Promise<TaskInfo[]> {
  const tasksPath = path.join(root, OPENSPEC_CHANGES_DIR, change, "tasks.md");
  const content = await readTextIfExists(tasksPath);
  if (!content) return [];

  const tasks: TaskInfo[] = [];
  const checkboxRe = /^-\s*\[(x|\s)\]\s+(\S+)\s+(.+)$/;

  for (const line of content.split("\n")) {
    const match = line.match(checkboxRe);
    if (match) {
      tasks.push({
        index: match[2],
        description: match[3].trim(),
        completed: match[1].toLowerCase() === "x",
      });
    }
  }

  return tasks;
}

export async function archiveChange(root: string, change: string): Promise<string> {
  const changeDir = path.join(root, OPENSPEC_CHANGES_DIR, change);
  if (!(await pathExists(changeDir))) {
    throw new Error(`Change not found: ${change}`);
  }

  const dateStr = formatDate();
  const archiveName = `${dateStr}-${change}`;
  const archiveDir = path.join(root, OPENSPEC_ARCHIVE_DIR, archiveName);

  if (await pathExists(archiveDir)) {
    throw new Error(`Archive already exists: ${archiveName}`);
  }

  await ensureDir(path.join(root, OPENSPEC_ARCHIVE_DIR));
  await fs.rename(changeDir, archiveDir);

  return archiveDir;
}

export async function readOpenSpecContext(root: string, change: string): Promise<OpenSpecContext> {
  return {
    change,
    proposal: filterExcludedLines(
      await readTextIfExists(path.join(root, OPENSPEC_CHANGES_DIR, change, "proposal.md")),
    ),
    design: filterExcludedLines(
      await readTextIfExists(path.join(root, OPENSPEC_CHANGES_DIR, change, "design.md")),
    ),
    tasks: filterExcludedLines(
      await readTextIfExists(path.join(root, OPENSPEC_CHANGES_DIR, change, "tasks.md")),
    ),
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

import path from "node:path";
import {
  CONFIG_FILE,
  DEFAULT_HANDOFF_DIR,
  DEFAULT_LANE,
  DEFAULT_MAX_DIFF_LINES,
  DEFAULT_MAX_LOG_LINES,
  EXCLUDED_GLOBS,
} from "./constants.js";
import { readJsonIfExists, writeJsonFile } from "./fs.js";
import type { RelayConfig, RelayMode, ProjectInfo } from "./types.js";

export function createDefaultConfig(project: ProjectInfo, mode: RelayMode): RelayConfig {
  return {
    projectName: project.name,
    language: "zh",
    mode,
    handoffDir: DEFAULT_HANDOFF_DIR,
    openSpecDir: "openspec",
    sourceDirs: ["src", "apps", "packages"],
    packageManager: project.packageManager === "unknown" ? "auto" : project.packageManager,
    devCommand: project.packageScripts.dev ? packageScript(project.packageManager, "dev") : "",
    buildCommand: project.packageScripts.build ? packageScript(project.packageManager, "build") : "",
    testCommand: project.packageScripts.test ? packageScript(project.packageManager, "test") : "",
    defaultExecutor: "opencode",
    defaultAdvisor: "",
    maxDiffLines: DEFAULT_MAX_DIFF_LINES,
    maxLogLines: DEFAULT_MAX_LOG_LINES,
    includeGitDiff: true,
    includeOpenSpec: mode === "openspec",
    includePackageScripts: true,
    runLayout: "runs-lanes",
    defaultLane: DEFAULT_LANE,
    excludePatterns: EXCLUDED_GLOBS,
    skills: {
      install: {
        manager: true,
        claudeProject: true,
        codexProject: true,
        claudeUser: false,
        codexUser: false,
      },
      enabled: ["relay-planner", "relay-delegator", "relay-escalation", "relay-reviewer"],
      optional: ["relay-lane-planner", "relay-docs"],
    },
  };
}

export async function loadConfig(root: string): Promise<RelayConfig> {
  const config = await readJsonIfExists<RelayConfig>(path.join(root, CONFIG_FILE));

  if (!config) {
    throw new Error("Missing .relay/config.json. Run relay init first.");
  }

  return normalizeConfig(config);
}

export async function writeConfig(root: string, config: RelayConfig): Promise<void> {
  await writeJsonFile(path.join(root, CONFIG_FILE), config);
}

function packageScript(packageManager: ProjectInfo["packageManager"], script: string): string {
  const runner = packageManager === "unknown" ? "npm" : packageManager;
  return `${runner} run ${script}`;
}

function normalizeConfig(config: RelayConfig): RelayConfig {
  return {
    ...config,
    maxDiffLines: config.maxDiffLines ?? DEFAULT_MAX_DIFF_LINES,
    maxLogLines: config.maxLogLines ?? DEFAULT_MAX_LOG_LINES,
    excludePatterns: config.excludePatterns ?? EXCLUDED_GLOBS,
  };
}

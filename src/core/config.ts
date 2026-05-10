import path from "node:path";
import { CONFIG_FILE, DEFAULT_HANDOFF_DIR, DEFAULT_LANE, EXCLUDED_GLOBS } from "./constants.js";
import { readJsonIfExists, writeJsonFile } from "./fs.js";
import type { AdvisorConfig, AdvisorMode, ProjectInfo } from "./types.js";

export function createDefaultConfig(project: ProjectInfo, mode: AdvisorMode): AdvisorConfig {
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
    maxDiffLines: 500,
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
      enabled: ["advisor-planner", "advisor-delegator", "advisor-escalation", "advisor-reviewer"],
      optional: ["advisor-lane-planner", "advisor-docs"],
    },
  };
}

export async function loadConfig(root: string): Promise<AdvisorConfig> {
  const config = await readJsonIfExists<AdvisorConfig>(path.join(root, CONFIG_FILE));

  if (!config) {
    throw new Error("Missing .advisor-kit/config.json. Run advisor init first.");
  }

  return config;
}

export async function writeConfig(root: string, config: AdvisorConfig): Promise<void> {
  await writeJsonFile(path.join(root, CONFIG_FILE), config);
}

function packageScript(packageManager: ProjectInfo["packageManager"], script: string): string {
  const runner = packageManager === "unknown" ? "npm" : packageManager;
  return `${runner} run ${script}`;
}

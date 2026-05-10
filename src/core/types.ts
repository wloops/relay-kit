export type RelayMode = "simple" | "openspec";
export type AdvisorMode = RelayMode;
export type PackageManager = "pnpm" | "npm" | "yarn" | "bun" | "unknown";

export interface RelayConfig {
  projectName: string;
  language: string;
  mode: RelayMode;
  handoffDir: string;
  openSpecDir: string;
  sourceDirs: string[];
  packageManager: PackageManager | "auto";
  devCommand: string;
  buildCommand: string;
  testCommand: string;
  defaultExecutor: string;
  defaultAdvisor: string;
  maxDiffLines: number;
  maxLogLines: number;
  includeGitDiff: boolean;
  includeOpenSpec: boolean;
  includePackageScripts: boolean;
  runLayout: "runs-lanes";
  defaultLane: string;
  excludePatterns: string[];
  skills: {
    install: {
      manager: boolean;
      claudeProject: boolean;
      codexProject: boolean;
      claudeUser: boolean;
      codexUser: boolean;
    };
    enabled: string[];
    optional: string[];
  };
}

export type AdvisorConfig = RelayConfig;

export interface DirectFixEntry {
  timestamp: string;
  reason: "small_patch" | "executor_failure" | "architecture" | "user_request";
  files: string[];
  summary: string;
}

export interface RelayState {
  currentRun: string;
  currentLane: string;
  mode: RelayMode;
  currentChange: string;
  updatedAt: string;
  advisorMode: "review" | "direct_fix";
  executorFailures: {
    currentTask: number;
    totalEscalations: number;
  };
  directFixLog: DirectFixEntry[];
}

export type AdvisorState = RelayState;

export interface ProjectInfo {
  root: string;
  name: string;
  hasGit: boolean;
  hasPackageJson: boolean;
  packageManager: PackageManager;
  packageScripts: Record<string, string>;
  hasOpenSpec: boolean;
}

export interface RunContext {
  runId: string;
  lane: string;
  runDir: string;
  laneDir: string;
}

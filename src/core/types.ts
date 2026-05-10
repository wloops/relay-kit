export type AdvisorMode = "simple" | "openspec";
export type PackageManager = "pnpm" | "npm" | "yarn" | "bun" | "unknown";

export interface AdvisorConfig {
  projectName: string;
  language: string;
  mode: AdvisorMode;
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

export interface AdvisorState {
  currentRun: string;
  currentLane: string;
  mode: AdvisorMode;
  currentChange: string;
  updatedAt: string;
}

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

export const ADVISOR_DIR = ".advisor-kit";
export const CONFIG_FILE = `${ADVISOR_DIR}/config.json`;
export const STATE_FILE = `${ADVISOR_DIR}/state.json`;
export const DEFAULT_HANDOFF_DIR = "docs/agent-handoffs";
export const DEFAULT_LANE = "main";
export const AGENTS_START_MARKER = "<!-- advisor-kit:start -->";
export const AGENTS_END_MARKER = "<!-- advisor-kit:end -->";

export const DEFAULT_SKILLS = [
  "advisor-planner",
  "advisor-delegator",
  "advisor-escalation",
  "advisor-reviewer",
] as const;

export const EXCLUDED_NAMES = new Set([
  ".env",
  "node_modules",
  "dist",
  "build",
  "coverage",
]);

export const EXCLUDED_GLOBS = [
  ".env",
  ".env.*",
  "node_modules/**",
  "dist/**",
  "build/**",
  "coverage/**",
];

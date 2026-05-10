export const ADVISOR_DIR = ".advisor-kit";
export const ADVISORIGNORE_FILE = ".advisorignore";
export const CONFIG_FILE = `${ADVISOR_DIR}/config.json`;
export const STATE_FILE = `${ADVISOR_DIR}/state.json`;
export const DEFAULT_HANDOFF_DIR = "docs/agent-handoffs";
export const DEFAULT_LANE = "main";
export const DEFAULT_MAX_DIFF_LINES = 500;
export const DEFAULT_MAX_LOG_LINES = 160;
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
  ".git",
  "node_modules",
  "dist",
  "build",
  "coverage",
]);

export const EXCLUDED_GLOBS = [
  ".env",
  ".env.*",
  "node_modules/",
  "dist/",
  "build/",
  "coverage/",
  ".git/",
  "*.pem",
  "*.key",
  "*.crt",
  "*.p12",
  "*.log",
];

export const DEFAULT_ADVISORIGNORE_CONTENT = `# advisor-kit context ignore rules
.env
.env.*
node_modules/
dist/
build/
coverage/
.git/
*.pem
*.key
*.crt
*.p12
*.log
`;

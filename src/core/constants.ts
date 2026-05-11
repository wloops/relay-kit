export const RELAY_DIR = ".relay";
export const RELAYIGNORE_FILE = ".relayignore";
export const CONFIG_FILE = `${RELAY_DIR}/config.json`;
export const STATE_FILE = `${RELAY_DIR}/state.json`;
export const DEFAULT_HANDOFF_DIR = "docs/agent-handoffs";
export const DEFAULT_LANE = "main";
export const DEFAULT_MAX_DIFF_LINES = 500;
export const DEFAULT_MAX_LOG_LINES = 160;
export const AGENTS_START_MARKER = "<!-- relay-kit:start -->";
export const AGENTS_END_MARKER = "<!-- relay-kit:end -->";

export const OPENSPEC_DIR = "openspec";
export const OPENSPEC_CHANGES_DIR = `${OPENSPEC_DIR}/changes`;
export const OPENSPEC_SPECS_DIR = `${OPENSPEC_DIR}/specs`;
export const OPENSPEC_ARCHIVE_DIR = `${OPENSPEC_DIR}/changes/archive`;
export const OPENSPEC_CONFIG_FILE = ".openspec.yaml";
export const OPENSPEC_DEFAULT_SCHEMA = "spec-driven";

export const DEFAULT_SKILLS = [
  "relay-planner",
  "relay-delegator",
  "relay-escalation",
  "relay-reviewer",
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

export const DEFAULT_RELAYIGNORE_CONTENT = `# relay-kit context ignore rules
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

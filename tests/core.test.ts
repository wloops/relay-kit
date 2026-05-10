import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { loadRelayIgnoreMatcher, parseRelayIgnore } from "../src/core/relayignore.js";
import { createDefaultConfig, loadConfig } from "../src/core/config.js";
import { createDefaultState } from "../src/core/state.js";
import { assertInsideRoot, isExcludedPath } from "../src/core/excludes.js";
import { safeWriteFile, stripBom } from "../src/core/fs.js";
import { redactSensitiveText } from "../src/core/redaction.js";
import { loadTemplate, renderTemplate } from "../src/core/templates.js";
import type { AdvisorConfig, ProjectInfo } from "../src/core/types.js";

async function tempDir(): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), "relay-core-"));
}

test("excludes sensitive files and build output paths", () => {
  assert.equal(isExcludedPath(".env"), true);
  assert.equal(isExcludedPath(".env.local"), true);
  assert.equal(isExcludedPath(".git/config"), true);
  assert.equal(isExcludedPath("certs/client.pem"), true);
  assert.equal(isExcludedPath("debug.log"), true);
  assert.equal(isExcludedPath("src/index.ts"), false);
  assert.equal(isExcludedPath("node_modules/pkg/index.js"), true);
  assert.equal(isExcludedPath("dist/cli.js"), true);
  assert.equal(isExcludedPath("build/app.js"), true);
  assert.equal(isExcludedPath("coverage/report.json"), true);
});

test("relayignore combines default rules with project rules without negating safety defaults", async () => {
  const root = await tempDir();
  await fs.writeFile(path.join(root, ".relayignore"), "# custom\nsecrets/\n*.tmp\n!*.pem\n", "utf8");

  const matcher = await loadRelayIgnoreMatcher(root, ["generated/"]);

  assert.deepEqual(parseRelayIgnore("# comment\n\nlogs/\n!*.pem\n"), ["logs/"]);
  assert.equal(matcher.hasRelayIgnore, true);
  assert.equal(matcher.shouldIgnorePath("secrets/api.txt"), true);
  assert.equal(matcher.shouldIgnorePath("nested/cache.tmp"), true);
  assert.equal(matcher.shouldIgnorePath("generated/output.txt"), true);
  assert.equal(matcher.shouldIgnorePath("C:\\repo\\.env.local"), true);
  assert.equal(matcher.shouldIgnorePath("keys/service.pem"), true);
  assert.equal(matcher.shouldIgnorePath("src/index.ts"), false);
});

test("redacts common sensitive values while preserving surrounding context", () => {
  const input = [
    "OPENAI_API_KEY=sk-live-secret",
    "Authorization: Bearer abcdef123456",
    "\"password\": \"hunter2\"",
    "-----BEGIN PRIVATE KEY-----\nsecret-body\n-----END PRIVATE KEY-----",
    "normal line",
  ].join("\n");

  const output = redactSensitiveText(input);

  assert.match(output, /OPENAI_API_KEY=\[REDACTED\]/);
  assert.match(output, /Bearer \[REDACTED\]/);
  assert.match(output, /"password": "\[REDACTED\]"/);
  assert.match(output, /\[REDACTED_PRIVATE_KEY\]/);
  assert.match(output, /normal line/);
  assert.doesNotMatch(output, /sk-live-secret|abcdef123456|hunter2|secret-body/);
});

test("loadConfig backfills maxLogLines for older config files", async () => {
  const root = await tempDir();
  const project: ProjectInfo = {
    root,
    name: "legacy",
    hasGit: false,
    hasPackageJson: true,
    packageManager: "npm",
    packageScripts: {},
    hasOpenSpec: false,
  };
  const legacyConfig = createDefaultConfig(project, "simple") as Partial<AdvisorConfig>;
  delete legacyConfig.maxLogLines;
  await fs.mkdir(path.join(root, ".relay"), { recursive: true });
  await fs.writeFile(path.join(root, ".relay", "config.json"), JSON.stringify(legacyConfig, null, 2), "utf8");

  const loaded = await loadConfig(root);

  assert.equal(loaded.maxDiffLines, 500);
  assert.equal(loaded.maxLogLines, 160);
});

test("safeWriteFile keeps writes inside the project root", async () => {
  const root = await tempDir();
  await safeWriteFile(root, "nested/file.txt", "ok");
  assert.equal(await fs.readFile(path.join(root, "nested", "file.txt"), "utf8"), "ok");
  assert.throws(() => assertInsideRoot(root, "../outside.txt"), /outside project root/);
});

test("safeWriteFile refuses accidental overwrite without force", async () => {
  const root = await tempDir();
  await safeWriteFile(root, "file.txt", "one");
  await assert.rejects(() => safeWriteFile(root, "file.txt", "two"), /without --force/);
  await safeWriteFile(root, "file.txt", "two", { force: true });
  assert.equal(await fs.readFile(path.join(root, "file.txt"), "utf8"), "two");
});

test("template renderer replaces known placeholders and reports missing template", async () => {
  assert.equal(renderTemplate("Hello {{name}} {{missing}}", { name: "Advisor" }), "Hello Advisor ");
  await assert.rejects(() => loadTemplate("DOES_NOT_EXIST.template.md"), /Missing template/);
});

test("stripBom removes UTF-8 BOM before JSON parsing", () => {
  assert.deepEqual(JSON.parse(stripBom("\ufeff{\"ok\":true}")), { ok: true });
});

test("createDefaultState initializes new state-tracking fields", () => {
  const state = createDefaultState("simple");

  assert.equal(state.advisorMode, "review");
  assert.deepEqual(state.executorFailures, { currentTask: 0, totalEscalations: 0 });
  assert.deepEqual(state.directFixLog, []);
  assert.ok(state.updatedAt);
});

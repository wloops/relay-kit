import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { assertInsideRoot, isExcludedPath } from "../src/core/excludes.js";
import { safeWriteFile, stripBom } from "../src/core/fs.js";
import { loadTemplate, renderTemplate } from "../src/core/templates.js";

async function tempDir(): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), "advisor-core-"));
}

test("excludes sensitive files and build output paths", () => {
  assert.equal(isExcludedPath(".env"), true);
  assert.equal(isExcludedPath(".env.local"), true);
  assert.equal(isExcludedPath("src/index.ts"), false);
  assert.equal(isExcludedPath("node_modules/pkg/index.js"), true);
  assert.equal(isExcludedPath("dist/cli.js"), true);
  assert.equal(isExcludedPath("build/app.js"), true);
  assert.equal(isExcludedPath("coverage/report.json"), true);
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

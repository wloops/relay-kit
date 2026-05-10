import fs from "node:fs/promises";
import path from "node:path";
import { pathExists, stripBom } from "./fs.js";
import type { PackageManager, ProjectInfo } from "./types.js";

async function readPackageScripts(root: string): Promise<Record<string, string>> {
  const packageJsonPath = path.join(root, "package.json");

  if (!(await pathExists(packageJsonPath))) {
    return {};
  }

  const packageJson = JSON.parse(stripBom(await fs.readFile(packageJsonPath, "utf8"))) as {
    scripts?: Record<string, string>;
  };

  return packageJson.scripts ?? {};
}

async function detectPackageManager(root: string): Promise<PackageManager> {
  if (await pathExists(path.join(root, "pnpm-lock.yaml"))) return "pnpm";
  if (await pathExists(path.join(root, "package-lock.json"))) return "npm";
  if (await pathExists(path.join(root, "yarn.lock"))) return "yarn";
  if (await pathExists(path.join(root, "bun.lockb"))) return "bun";
  return "unknown";
}

export async function detectProject(root = process.cwd()): Promise<ProjectInfo> {
  const resolvedRoot = path.resolve(root);
  const packageJsonPath = path.join(resolvedRoot, "package.json");
  const packageJson = (await pathExists(packageJsonPath))
    ? (JSON.parse(stripBom(await fs.readFile(packageJsonPath, "utf8"))) as { name?: string })
    : {};

  return {
    root: resolvedRoot,
    name: packageJson.name ?? path.basename(resolvedRoot),
    hasGit: await pathExists(path.join(resolvedRoot, ".git")),
    hasPackageJson: await pathExists(packageJsonPath),
    packageManager: await detectPackageManager(resolvedRoot),
    packageScripts: await readPackageScripts(resolvedRoot),
    hasOpenSpec: await hasOpenSpecStructure(resolvedRoot),
  };
}

export async function hasOpenSpecStructure(root: string): Promise<boolean> {
  return (
    (await pathExists(path.join(root, "openspec"))) &&
    ((await pathExists(path.join(root, "openspec", "changes"))) ||
      (await pathExists(path.join(root, "openspec", "specs"))))
  );
}

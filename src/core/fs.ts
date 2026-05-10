import { constants as fsConstants } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import { assertInsideRoot } from "./excludes.js";

export async function pathExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath, fsConstants.F_OK);
    return true;
  } catch {
    return false;
  }
}

export async function ensureDir(dirPath: string): Promise<void> {
  await fs.mkdir(dirPath, { recursive: true });
}

export async function readTextIfExists(filePath: string): Promise<string> {
  if (!(await pathExists(filePath))) {
    return "";
  }
  return fs.readFile(filePath, "utf8");
}

export async function readJsonIfExists<T>(filePath: string): Promise<T | undefined> {
  if (!(await pathExists(filePath))) {
    return undefined;
  }
  return JSON.parse(stripBom(await fs.readFile(filePath, "utf8"))) as T;
}

export async function writeJsonFile(filePath: string, value: unknown): Promise<void> {
  await ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

export async function safeWriteFile(
  root: string,
  relativePath: string,
  content: string,
  options: { force?: boolean } = {},
): Promise<string> {
  const target = assertInsideRoot(root, relativePath);
  await ensureDir(path.dirname(target));

  if (!options.force && (await pathExists(target))) {
    throw new Error(`Refusing to overwrite existing file without --force: ${relativePath}`);
  }

  await fs.writeFile(target, content, "utf8");
  return target;
}

export async function copyDirectory(source: string, target: string, options: { force?: boolean } = {}): Promise<void> {
  if (!(await pathExists(source))) {
    throw new Error(`Missing source directory: ${source}`);
  }

  await ensureDir(target);
  const entries = await fs.readdir(source, { withFileTypes: true });

  for (const entry of entries) {
    const sourcePath = path.join(source, entry.name);
    const targetPath = path.join(target, entry.name);

    if (entry.isDirectory()) {
      await copyDirectory(sourcePath, targetPath, options);
      continue;
    }

    if (!entry.isFile()) {
      continue;
    }

    if (!options.force && (await pathExists(targetPath))) {
      continue;
    }

    await fs.copyFile(sourcePath, targetPath);
  }
}

export function stripBom(value: string): string {
  return value.charCodeAt(0) === 0xfeff ? value.slice(1) : value;
}

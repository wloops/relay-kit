import fsSync from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

export function getPackageRoot(): string {
  const moduleDir = path.dirname(fileURLToPath(import.meta.url));
  const candidates = [
    moduleDir,
    path.resolve(moduleDir, ".."),
    path.resolve(moduleDir, "..", ".."),
  ];

  for (const candidate of candidates) {
    if (fsSync.existsSync(path.join(candidate, "templates")) && fsSync.existsSync(path.join(candidate, "skills"))) {
      return candidate;
    }
  }

  // Keep the source-tree default in error paths so missing template messages stay actionable.
  return path.resolve(moduleDir, "..", "..");
}

export function renderTemplate(template: string, values: Record<string, string>): string {
  return template.replace(/\{\{([A-Za-z0-9_]+)\}\}/g, (_, rawKey: string) => {
    return values[rawKey] ?? "";
  });
}

export async function loadTemplate(name: string): Promise<string> {
  const templatePath = path.join(getPackageRoot(), "templates", name);

  try {
    return await fs.readFile(templatePath, "utf8");
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(`Missing template ${name}: ${detail}`);
  }
}

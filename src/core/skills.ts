import path from "node:path";
import { DEFAULT_SKILLS } from "./constants.js";
import { copyDirectory, ensureDir } from "./fs.js";
import { getPackageRoot } from "./templates.js";
import type { AdvisorConfig } from "./types.js";

export async function installProjectSkills(
  root: string,
  config: AdvisorConfig,
  options: { force?: boolean } = {},
): Promise<string[]> {
  const sourceRoot = path.join(getPackageRoot(), "skills");
  const targets: string[] = [];

  if (config.skills.install.manager) targets.push(path.join(root, ".advisor-kit", "skills"));
  if (config.skills.install.claudeProject) targets.push(path.join(root, ".claude", "skills"));
  if (config.skills.install.codexProject) targets.push(path.join(root, ".agents", "skills"));

  for (const targetRoot of targets) {
    await ensureDir(targetRoot);

    for (const skill of DEFAULT_SKILLS) {
      await copyDirectory(path.join(sourceRoot, skill), path.join(targetRoot, skill), options);
    }
  }

  return targets;
}

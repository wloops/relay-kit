import path from "node:path";
import { DEFAULT_HANDOFF_DIR, DEFAULT_SKILLS } from "./constants.js";
import { copyDirectory, ensureDir, pathExists } from "./fs.js";
import { getPackageRoot } from "./templates.js";
import type { RelayConfig } from "./types.js";

export async function installProjectSkills(
  root: string,
  config: RelayConfig,
  options: { force?: boolean } = {},
): Promise<string[]> {
  const sourceRoot = path.join(getPackageRoot(), "skills");
  const targets: string[] = [];

  if (config.skills.install.manager) targets.push(path.join(root, ".relay", "skills"));
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

export async function installOpenspecFiles(
  root: string,
  options: { force?: boolean } = {},
): Promise<string[]> {
  const pkgRoot = getPackageRoot();
  const installed: string[] = [];

  const specs = [
    { source: path.join(pkgRoot, ".opencode"), target: path.join(root, ".opencode") },
    { source: path.join(pkgRoot, ".claude"), target: path.join(root, ".claude") },
    { source: path.join(pkgRoot, ".codex"), target: path.join(root, ".codex") },
  ];

  for (const spec of specs) {
    if (!(await pathExists(spec.source))) continue;

    await copyDirectory(spec.source, spec.target, options);
    installed.push(spec.target);
  }

  return installed;
}

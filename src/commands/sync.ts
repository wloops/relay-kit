import type { Command } from "commander";
import path from "node:path";
import { loadConfig } from "../core/config.js";
import { installOpenspecFiles } from "../core/skills.js";
import { formatSkillSyncReport, SkillSyncConflictError, syncSkills, type SkillSyncScope, type SkillSyncTargetOption } from "../core/skills-sync.js";

interface SyncOptions {
  skills?: boolean;
  openspec?: boolean;
  all?: boolean;
  target?: SkillSyncTargetOption;
  scope?: SkillSyncScope;
  dryRun?: boolean;
  force?: boolean;
  homeDir?: string;
}

export function registerSyncCommand(program: Command): void {
  program
    .command("sync")
    .description("Synchronize relay-kit managed resources.")
    .option("--skills", "Synchronize relay Skills from .relay/skills.")
    .option("--openspec", "Synchronize OpenSpec command/skill files.")
    .option("--all", "Synchronize everything (skills + OpenSpec files).")
    .option("--target <target>", "Skill target: claude, codex, or all.")
    .option("--scope <scope>", "Skill sync scope: project or user.", "project")
    .option("--dry-run", "Preview the sync plan without writing files.")
    .option("--force", "Overwrite conflicted skill files.")
    .action(async (options: SyncOptions) => {
      const result = await runSync(process.cwd(), options);
      console.log(result.summary);
    });
}

export async function runSync(root: string, options: SyncOptions = {}): Promise<{ summary: string }> {
  const runSkills = options.all || options.skills;
  const runOpenspec = options.all || options.openspec;

  if (!runSkills && !runOpenspec) {
    throw new Error("Specify --skills, --openspec, or --all.");
  }

  const lines: string[] = [];

  if (runSkills) {
    validateTarget(options.target);
    validateScope(options.scope);

    const config = await loadConfig(root);

    try {
      const report = await syncSkills(root, config, options);
      lines.push(formatSkillSyncReport(report));
    } catch (error) {
      if (error instanceof SkillSyncConflictError) {
        throw new Error(`${formatSkillSyncReport(error.report)}\n${error.message}`);
      }
      throw error;
    }
  }

  if (runOpenspec) {
    const installed = await installOpenspecFiles(root, { force: options.force });
    lines.push(`relay sync --openspec: installed ${installed.length} directories.`);
    for (const dir of installed) {
      lines.push(`  ${path.relative(root, dir)}`);
    }
  }

  return { summary: lines.join("\n") };
}

function validateTarget(target: string | undefined): asserts target is SkillSyncTargetOption | undefined {
  if (target === undefined || target === "claude" || target === "codex" || target === "all") {
    return;
  }

  throw new Error("--target must be claude, codex, or all.");
}

function validateScope(scope: string | undefined): asserts scope is SkillSyncScope | undefined {
  if (scope === undefined || scope === "project" || scope === "user") {
    return;
  }

  throw new Error("--scope must be project or user.");
}

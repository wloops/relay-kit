import type { Command } from "commander";
import {
  newChange,
  getChangeStatus,
  listOpenSpecChangesDetailed,
  getInstructions,
  getApplyInstructions,
  archiveChange,
} from "../core/openspec.js";
import { getAvailableSchemas } from "../core/schema.js";

interface OpenspecNewOptions {
  schema?: string;
}

interface OpenspecStatusOptions {
  change?: string;
  json?: boolean;
}

interface OpenspecInstructionsOptions {
  change?: string;
  json?: boolean;
}

interface OpenspecArchiveOptions {
  change?: string;
}

export function registerOpenspecCommand(program: Command): void {
  const openspecCmd = program
    .command("openspec")
    .description("Manage OpenSpec changes (built-in).")
    .action(() => {
      console.log("Usage: relay openspec <action> [options]\n");
      console.log("Actions:");
      console.log("  new-change <name>   Create a new OpenSpec change");
      console.log("  status              Show artifact completion status");
      console.log("  list                List active changes");
      console.log("  instructions <id>   Get artifact creation instructions");
      console.log("  apply-instructions  Get apply instructions for a change");
      console.log("  archive <name>      Archive a completed change");
      console.log("  schemas             List available schemas");
    });

  openspecCmd
    .command("new-change <name>")
    .description("Create a new OpenSpec change.")
    .option("--schema <schema>", "Schema name (default: spec-driven).")
    .action(async (name: string, options: OpenspecNewOptions) => {
      const result = await newChange(process.cwd(), name, options.schema);
      console.log(`Created change: ${name}\nSchema: ${options.schema ?? "spec-driven"}\nPath: ${result}`);
    });

  openspecCmd
    .command("status")
    .description("Display artifact completion status for a change.")
    .option("--change <change>", "Change name.")
    .option("--json", "Output as JSON.")
    .action(async (options: OpenspecStatusOptions) => {
      const change = options.change ?? (await resolveCurrentChange());
      const status = await getChangeStatus(process.cwd(), change);

      if (options.json) {
        console.log(JSON.stringify(status, null, 2));
        return;
      }

      console.log(`Change: ${change}`);
      console.log(`Schema: ${status.schemaName}`);
      console.log(`Apply Requires: ${status.applyRequires.join(", ")}`);
      console.log();
      for (const artifact of status.artifacts) {
        console.log(`  ${artifact.id}: ${artifact.status}`);
      }
    });

  openspecCmd
    .command("list")
    .description("List active OpenSpec changes.")
    .option("--json", "Output as JSON.")
    .action(async (options: { json?: boolean }) => {
      const entries = await listOpenSpecChangesDetailed(process.cwd());

      if (options.json) {
        console.log(JSON.stringify(entries, null, 2));
        return;
      }

      if (entries.length === 0) {
        console.log("No active changes.");
        return;
      }

      for (const entry of entries) {
        console.log(`  ${entry.name}  (schema: ${entry.schema}, created: ${entry.created})`);
      }
    });

  openspecCmd
    .command("instructions <artifactId>")
    .description("Output enriched instructions for creating an artifact.")
    .option("--change <change>", "Change name.")
    .option("--json", "Output as JSON.")
    .action(async (artifactId: string, options: OpenspecInstructionsOptions) => {
      const change = options.change ?? (await resolveCurrentChange());
      const instructions = await getInstructions(process.cwd(), change, artifactId);

      if (options.json) {
        console.log(JSON.stringify(instructions, null, 2));
        return;
      }

      console.log(`Artifact: ${instructions.artifactId}`);
      console.log(`Output: ${instructions.outputPath}`);
      console.log(`Dependencies: ${instructions.dependencies.join(", ") || "(none)"}`);
      console.log();
      console.log("## Instruction");
      console.log(instructions.instruction);
      console.log();
      console.log("## Template");
      console.log(instructions.template);
    });

  openspecCmd
    .command("apply-instructions")
    .description("Output apply instructions for a change.")
    .option("--change <change>", "Change name.")
    .option("--json", "Output as JSON.")
    .action(async (options: OpenspecInstructionsOptions) => {
      const change = options.change ?? (await resolveCurrentChange());
      const instructions = await getApplyInstructions(process.cwd(), change);

      if (options.json) {
        console.log(JSON.stringify(instructions, null, 2));
        return;
      }

      console.log(`Change: ${instructions.changeName}`);
      console.log(`Schema: ${instructions.schemaName}`);
      console.log(`State: ${instructions.state}`);
      console.log(`Progress: ${instructions.complete}/${instructions.total} tasks complete`);
      console.log();
      console.log("## Instruction");
      console.log(instructions.instruction);
      if (instructions.tasks.length > 0) {
        console.log();
        console.log("## Tasks");
        for (const task of instructions.tasks) {
          console.log(`  - [${task.completed ? "x" : " "}] ${task.index} ${task.description}`);
        }
      }
    });

  openspecCmd
    .command("archive <name>")
    .description("Archive a completed change.")
    .action(async (name: string, _options: OpenspecArchiveOptions) => {
      const archiveDir = await archiveChange(process.cwd(), name);
      console.log(`Archived change "${name}" to ${archiveDir}`);
    });

  openspecCmd
    .command("schemas")
    .description("List available workflow schemas.")
    .action(() => {
      const schemas = getAvailableSchemas();
      for (const schema of schemas) {
        console.log(`${schema.name}: ${schema.description}`);
        console.log(`  Artifacts: ${schema.artifacts.map((a) => a.id).join(", ")}`);
        console.log();
      }
    });
}

async function resolveCurrentChange(): Promise<string> {
  const { resolveOpenSpecChange } = await import("../core/openspec.js");
  return resolveOpenSpecChange(process.cwd());
}

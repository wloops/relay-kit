import type { Command } from "commander";

export function registerInitCommand(program: Command): void {
  program
    .command("init")
    .description("Initialize advisor-kit in the current project.")
    .action(() => {
      console.log("advisor init: placeholder");
    });
}

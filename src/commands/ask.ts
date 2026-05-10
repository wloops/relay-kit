import type { Command } from "commander";

export function registerAskCommand(program: Command): void {
  program
    .command("ask")
    .description("Create an advisor escalation request when the executor is stuck.")
    .action(() => {
      console.log("advisor ask: placeholder");
    });
}

import type { Command } from "commander";

export function registerStartCommand(program: Command): void {
  program
    .command("start")
    .description("Start an advisor handoff run and create an executor task.")
    .action(() => {
      console.log("advisor start: placeholder");
    });
}

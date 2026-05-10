import type { Command } from "commander";

export function registerResumeCommand(program: Command): void {
  program
    .command("resume")
    .description("Create a resume prompt from an advisor decision.")
    .action(() => {
      console.log("advisor resume: placeholder");
    });
}

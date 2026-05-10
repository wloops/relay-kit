import type { Command } from "commander";

export function registerDoctorCommand(program: Command): void {
  program
    .command("doctor")
    .description("Check advisor-kit project integration status.")
    .action(() => {
      console.log("advisor doctor: placeholder");
    });
}

import type { Command } from "commander";

export function registerReviewCommand(program: Command): void {
  program
    .command("review")
    .description("Create an advisor review request for the current implementation.")
    .action(() => {
      console.log("advisor review: placeholder");
    });
}

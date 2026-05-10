import { Command } from "commander";
import { registerAskCommand } from "./commands/ask.js";
import { registerDoctorCommand } from "./commands/doctor.js";
import { registerInitCommand } from "./commands/init.js";
import { registerResumeCommand } from "./commands/resume.js";
import { registerReviewCommand } from "./commands/review.js";
import { registerStartCommand } from "./commands/start.js";

const program = new Command();

program
  .name("advisor")
  .description("Skills-first, CLI-assisted AI programming advisor workflow toolkit.")
  .version("0.1.0");

registerInitCommand(program);
registerStartCommand(program);
registerAskCommand(program);
registerResumeCommand(program);
registerReviewCommand(program);
registerDoctorCommand(program);

program.parseAsync(process.argv).catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});

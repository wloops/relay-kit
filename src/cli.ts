import { Command } from "commander";
import { registerAskCommand } from "./commands/ask.js";
import { registerDoctorCommand } from "./commands/doctor.js";
import { registerInitCommand } from "./commands/init.js";
import { registerResumeCommand } from "./commands/resume.js";
import { registerReviewCommand } from "./commands/review.js";
import { registerStartCommand } from "./commands/start.js";
import { registerSyncCommand } from "./commands/sync.js";

const program = new Command();

program
  .name("relay")
  .description("Skills-first, CLI-assisted AI programming relay workflow toolkit.")
  .version("0.2.0");

registerInitCommand(program);
registerStartCommand(program);
registerAskCommand(program);
registerResumeCommand(program);
registerReviewCommand(program);
registerDoctorCommand(program);
registerSyncCommand(program);

program.parseAsync(process.argv).catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});

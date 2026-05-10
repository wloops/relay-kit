import { exec } from "node:child_process";
import { promisify } from "node:util";
import { truncateLines } from "./git.js";

const execAsync = promisify(exec);

export interface CommandResult {
  command: string;
  exitCode: number;
  output: string;
}

export async function runShellCommand(root: string, command: string): Promise<CommandResult> {
  try {
    const { stdout, stderr } = await execAsync(command, {
      cwd: root,
      maxBuffer: 1024 * 1024 * 2,
      windowsHide: true,
    });

    return { command, exitCode: 0, output: truncateLines(`${stdout}${stderr}`.trim(), 160) };
  } catch (error) {
    const failed = error as { code?: number; stdout?: string; stderr?: string };
    return {
      command,
      exitCode: typeof failed.code === "number" ? failed.code : 1,
      output: truncateLines(`${failed.stdout ?? ""}${failed.stderr ?? ""}`.trim(), 160),
    };
  }
}

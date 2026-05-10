import { exec } from "node:child_process";
import { promisify } from "node:util";
import { truncateLines } from "./git.js";

const execAsync = promisify(exec);

export interface CommandResult {
  command: string;
  exitCode: number;
  output: string;
}

export interface RunShellCommandOptions {
  maxLogLines: number;
  redactText?: (value: string) => string;
}

export async function runShellCommand(
  root: string,
  command: string,
  options: RunShellCommandOptions = { maxLogLines: 160 },
): Promise<CommandResult> {
  try {
    const { stdout, stderr } = await execAsync(command, {
      cwd: root,
      maxBuffer: 1024 * 1024 * 2,
      windowsHide: true,
    });

    return { command, exitCode: 0, output: sanitizeCommandOutput(`${stdout}${stderr}`.trim(), options) };
  } catch (error) {
    const failed = error as { code?: number; stdout?: string; stderr?: string };
    return {
      command,
      exitCode: typeof failed.code === "number" ? failed.code : 1,
      output: sanitizeCommandOutput(`${failed.stdout ?? ""}${failed.stderr ?? ""}`.trim(), options),
    };
  }
}

function sanitizeCommandOutput(output: string, options: RunShellCommandOptions): string {
  const redacted = options.redactText ? options.redactText(output) : output;
  return truncateLines(redacted, options.maxLogLines);
}

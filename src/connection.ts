import { execFile } from "node:child_process";

const DEFAULT_OBSIDIAN_PATH = "/Applications/Obsidian.app/Contents/MacOS/Obsidian";

export interface ExecOptions {
  obsidianPath?: string;
  vault?: string;
}

export async function obsidian(
  args: string[],
  opts: ExecOptions = {}
): Promise<string> {
  const bin = opts.obsidianPath ?? DEFAULT_OBSIDIAN_PATH;
  const fullArgs = opts.vault ? [`vault=${opts.vault}`, ...args] : args;

  return new Promise((resolve, reject) => {
    execFile(bin, fullArgs, { timeout: 10_000 }, (error, stdout, stderr) => {
      if (error) {
        const msg = stderr?.trim() || stdout?.trim() || error.message;
        if (error.killed) {
          reject(new Error(`Obsidian CLI timed out (10s): ${args[0]}`));
        } else {
          reject(new Error(msg));
        }
      } else if (isCliError(stdout)) {
        reject(new Error(stdout.trim().slice("Error: ".length)));
      } else {
        resolve(stdout);
      }
    });
  });
}

/**
 * The Obsidian CLI exits 0 even when a command fails, printing a single
 * `Error: ...` line to stdout instead. Eval results are prefixed with `=> `,
 * so they never match. The only false positive is a note whose entire
 * content is one line starting with "Error: ".
 */
export function isCliError(stdout: string): boolean {
  const text = stdout.trim();
  return text.startsWith("Error: ") && !text.includes("\n");
}

/** Return a structured MCP tool error. */
export function toolError(message: string) {
  return { content: [{ type: "text" as const, text: message }], isError: true as const };
}

/** Return a structured MCP tool result. */
export function toolResult(text: string, fallback?: string) {
  return { content: [{ type: "text" as const, text: text || fallback || "" }] };
}

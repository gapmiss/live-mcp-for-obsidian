import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { execFile } from "node:child_process";
import { mkdir, writeFile, rm } from "node:fs/promises";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { obsidian, toolError, type ExecOptions } from "../connection.js";

interface Session {
  framesDir: string;
  fps: number;
  timer: ReturnType<typeof setInterval>;
  frameIndex: number;
  capturing: boolean;
  pending: Promise<void> | null;
}

const sessions = new Map<string, Session>();

function ffmpeg(args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile("ffmpeg", args, { maxBuffer: 10 * 1024 * 1024 }, (err, stdout, stderr) => {
      if (err) reject(new Error(`ffmpeg failed: ${err.message}\n${stderr}`));
      else resolve(stdout + stderr);
    });
  });
}

async function captureFrame(session: Session, opts: ExecOptions): Promise<void> {
  if (!session.capturing) return;
  const idx = session.frameIndex++;
  try {
    const params = JSON.stringify({ format: "jpeg", quality: 80 });
    const stdout = await obsidian(
      ["dev:cdp", "method=Page.captureScreenshot", `params=${params}`],
      opts,
    );
    const json = JSON.parse(stdout);
    const filename = `frame-${String(idx).padStart(5, "0")}.jpg`;
    await writeFile(join(session.framesDir, filename), Buffer.from(json.data, "base64"));
  } catch {
    // skip dropped frames
  }
}

export function registerRecordingTools(server: McpServer, opts: ExecOptions) {
  server.registerTool(
    "obsidian_start_recording",
    {
      description:
        "Start recording Obsidian screen frames. Returns a session ID to use with obsidian_stop_recording.",
      inputSchema: {
        fps: z.number().min(1).max(15).optional().describe("Frames per second (default: 5)"),
      },
    },
    async ({ fps: fpsArg }) => {
      const fps = fpsArg ?? 5;
      const sessionId = `rec-${Date.now()}`;
      const framesDir = join(tmpdir(), `storycast-${sessionId}`);
      await mkdir(framesDir, { recursive: true });

      const session: Session = {
        framesDir,
        fps,
        frameIndex: 0,
        capturing: true,
        pending: null,
        timer: setInterval(() => {
          if (session.pending) return;
          session.pending = captureFrame(session, opts).finally(() => {
            session.pending = null;
          });
        }, 1000 / fps),
      };

      sessions.set(sessionId, session);

      return {
        content: [
          {
            type: "text" as const,
            text: `Recording started at ${fps} fps.\nSession: ${sessionId}\nUse obsidian_stop_recording with this session ID to finish and encode the video.`,
          },
        ],
      };
    },
  );

  server.registerTool(
    "obsidian_stop_recording",
    {
      description:
        "Stop a recording session and encode the captured frames to video. Returns the output file path.",
      inputSchema: {
        session: z.string().describe("Session ID from obsidian_start_recording"),
        output: z.string().optional().describe("Output file path (default: recording-<session>.mp4)"),
        format: z.enum(["mp4", "webm", "gif"]).optional().describe("Output format (default: mp4)"),
      },
    },
    async ({ session: sessionId, output, format: fmt }) => {
      const session = sessions.get(sessionId);
      if (!session) {
        return toolError(`No active session: ${sessionId}`);
      }

      session.capturing = false;
      clearInterval(session.timer);
      if (session.pending) await session.pending;
      sessions.delete(sessionId);

      if (session.frameIndex === 0) {
        await rm(session.framesDir, { recursive: true, force: true });
        return toolError("No frames captured. Is Obsidian running?");
      }

      const format = fmt ?? "mp4";
      const outputPath = resolve(output ?? `recording-${sessionId}.${format}`);
      const inputPattern = `${session.framesDir}/frame-%05d.jpg`;

      try {
        if (format === "mp4") {
          await ffmpeg([
            "-y", "-framerate", String(session.fps),
            "-i", inputPattern,
            "-c:v", "libx264", "-pix_fmt", "yuv420p", "-vsync", "cfr",
            outputPath,
          ]);
        } else if (format === "webm") {
          await ffmpeg([
            "-y", "-framerate", String(session.fps),
            "-i", inputPattern,
            "-c:v", "libvpx-vp9", "-pix_fmt", "yuv420p", "-vsync", "cfr",
            outputPath,
          ]);
        } else if (format === "gif") {
          const palette = `${session.framesDir}/palette.png`;
          const gifFps = Math.min(session.fps, 10);
          await ffmpeg([
            "-y", "-framerate", String(session.fps),
            "-i", inputPattern,
            "-vf", `fps=${gifFps},palettegen`,
            palette,
          ]);
          await ffmpeg([
            "-y", "-framerate", String(session.fps),
            "-i", inputPattern, "-i", palette,
            "-filter_complex", `fps=${gifFps}[x];[x][1:v]paletteuse`,
            outputPath,
          ]);
        }

        await rm(session.framesDir, { recursive: true, force: true });

        return {
          content: [
            {
              type: "text" as const,
              text: `Recording saved: ${outputPath}\n${session.frameIndex} frames at ${session.fps} fps`,
            },
          ],
        };
      } catch (e) {
        return toolError(`Encoding failed: ${e instanceof Error ? e.message : e}`);
      }
    },
  );

  server.registerTool(
    "obsidian_record",
    {
      description:
        "Record Obsidian for a specified duration and encode to video. Simpler alternative to start/stop for fixed-duration recordings.",
      inputSchema: {
        duration: z.number().min(1).max(120).describe("Recording duration in seconds"),
        output: z.string().optional().describe("Output file path (default: recording.mp4)"),
        fps: z.number().min(1).max(15).optional().describe("Frames per second (default: 5)"),
        format: z.enum(["mp4", "webm", "gif"]).optional().describe("Output format (default: mp4)"),
      },
    },
    async ({ duration, output, fps: fpsArg, format: fmt }) => {
      const fps = fpsArg ?? 5;
      const format = fmt ?? "mp4";
      const outputPath = resolve(output ?? `recording.${format}`);
      const framesDir = join(tmpdir(), `storycast-${Date.now()}`);
      await mkdir(framesDir, { recursive: true });

      const session: Session = {
        framesDir,
        fps,
        frameIndex: 0,
        capturing: true,
        pending: null,
        timer: null!,
      };

      session.timer = setInterval(() => {
        if (session.pending) return;
        session.pending = captureFrame(session, opts).finally(() => {
          session.pending = null;
        });
      }, 1000 / fps);

      await new Promise((r) => setTimeout(r, duration * 1000));

      session.capturing = false;
      clearInterval(session.timer);
      if (session.pending) await session.pending;

      if (session.frameIndex === 0) {
        await rm(framesDir, { recursive: true, force: true });
        return toolError("No frames captured. Is Obsidian running?");
      }

      const inputPattern = `${framesDir}/frame-%05d.jpg`;

      try {
        if (format === "mp4") {
          await ffmpeg([
            "-y", "-framerate", String(fps),
            "-i", inputPattern,
            "-c:v", "libx264", "-pix_fmt", "yuv420p", "-vsync", "cfr",
            outputPath,
          ]);
        } else if (format === "webm") {
          await ffmpeg([
            "-y", "-framerate", String(fps),
            "-i", inputPattern,
            "-c:v", "libvpx-vp9", "-pix_fmt", "yuv420p", "-vsync", "cfr",
            outputPath,
          ]);
        } else if (format === "gif") {
          const palette = `${framesDir}/palette.png`;
          const gifFps = Math.min(fps, 10);
          await ffmpeg([
            "-y", "-framerate", String(fps),
            "-i", inputPattern,
            "-vf", `fps=${gifFps},palettegen`,
            palette,
          ]);
          await ffmpeg([
            "-y", "-framerate", String(fps),
            "-i", inputPattern, "-i", palette,
            "-filter_complex", `fps=${gifFps}[x];[x][1:v]paletteuse`,
            outputPath,
          ]);
        }

        await rm(framesDir, { recursive: true, force: true });

        return {
          content: [
            {
              type: "text" as const,
              text: `Recording saved: ${outputPath}\n${session.frameIndex} frames, ${duration}s at ${fps} fps`,
            },
          ],
        };
      } catch (e) {
        return toolError(`Encoding failed: ${e instanceof Error ? e.message : e}`);
      }
    },
  );
}

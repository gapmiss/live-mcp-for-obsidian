import { describe, it, expect, vi, beforeEach } from "vitest";
import { obsidian, toolError, toolResult } from "./connection.js";
import { execFile } from "node:child_process";

vi.mock("node:child_process", () => ({
  execFile: vi.fn(),
}));

const mockExecFile = vi.mocked(execFile);

describe("obsidian()", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("resolves with stdout on success", async () => {
    mockExecFile.mockImplementation((_bin, _args, _opts, cb: any) => {
      cb(null, "output text", "");
      return {} as any;
    });

    const result = await obsidian(["version"]);
    expect(result).toBe("output text");
  });

  it("passes arguments to the binary", async () => {
    mockExecFile.mockImplementation((_bin, _args, _opts, cb: any) => {
      cb(null, "", "");
      return {} as any;
    });

    await obsidian(["read", "file=Test"]);
    expect(mockExecFile).toHaveBeenCalledWith(
      "/Applications/Obsidian.app/Contents/MacOS/Obsidian",
      ["read", "file=Test"],
      { timeout: 10_000 },
      expect.any(Function)
    );
  });

  it("prepends vault argument when specified", async () => {
    mockExecFile.mockImplementation((_bin, _args, _opts, cb: any) => {
      cb(null, "", "");
      return {} as any;
    });

    await obsidian(["status"], { vault: "My Vault" });
    expect(mockExecFile).toHaveBeenCalledWith(
      expect.any(String),
      ["vault=My Vault", "status"],
      expect.any(Object),
      expect.any(Function)
    );
  });

  it("uses custom obsidian path", async () => {
    mockExecFile.mockImplementation((_bin, _args, _opts, cb: any) => {
      cb(null, "", "");
      return {} as any;
    });

    await obsidian(["status"], { obsidianPath: "/custom/path" });
    expect(mockExecFile).toHaveBeenCalledWith(
      "/custom/path",
      ["status"],
      expect.any(Object),
      expect.any(Function)
    );
  });

  it("rejects with stderr on CLI error", async () => {
    mockExecFile.mockImplementation((_bin, _args, _opts, cb: any) => {
      cb(new Error("exit code 1"), "", "File not found");
      return {} as any;
    });

    await expect(obsidian(["read", "file=missing"])).rejects.toThrow("File not found");
  });

  it("rejects with stdout when stderr is empty", async () => {
    mockExecFile.mockImplementation((_bin, _args, _opts, cb: any) => {
      cb(new Error("exit code 1"), "Error: no such file", "");
      return {} as any;
    });

    await expect(obsidian(["read", "file=missing"])).rejects.toThrow("Error: no such file");
  });

  it("rejects with error.message as fallback", async () => {
    mockExecFile.mockImplementation((_bin, _args, _opts, cb: any) => {
      cb(new Error("something went wrong"), "", "");
      return {} as any;
    });

    await expect(obsidian(["read"])).rejects.toThrow("something went wrong");
  });

  it("reports timeout with descriptive message", async () => {
    mockExecFile.mockImplementation((_bin, _args, _opts, cb: any) => {
      const error = new Error("TIMEOUT") as Error & { killed: boolean };
      error.killed = true;
      cb(error, "", "");
      return {} as any;
    });

    await expect(obsidian(["eval", "code=hang()"])).rejects.toThrow(
      "Obsidian CLI timed out (10s): eval"
    );
  });
});

describe("toolError()", () => {
  it("returns MCP error structure", () => {
    const result = toolError("something broke");
    expect(result).toEqual({
      content: [{ type: "text", text: "something broke" }],
      isError: true,
    });
  });
});

describe("toolResult()", () => {
  it("returns MCP result structure", () => {
    const result = toolResult("hello");
    expect(result).toEqual({
      content: [{ type: "text", text: "hello" }],
    });
  });

  it("uses fallback when text is empty", () => {
    const result = toolResult("", "default");
    expect(result).toEqual({
      content: [{ type: "text", text: "default" }],
    });
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import { execFile } from "node:child_process";

vi.mock("node:child_process", () => ({
  execFile: vi.fn(),
}));

import { createServer } from "./index.js";

const mockExecFile = vi.mocked(execFile);

/** Call obsidian_search and return the args it passed to the CLI. */
async function searchArgs(input: Record<string, unknown>, stdout = "a.md\n") {
  mockExecFile.mockImplementation((_bin, _args, _opts, cb: any) => {
    cb(null, stdout, "");
    return {} as any;
  });
  const server = createServer();
  const tool = (server as any)._registeredTools["obsidian_search"];
  const result = await tool.handler(input, {});
  return { args: mockExecFile.mock.calls[0][1], result };
}

describe("obsidian_search", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uses the native search command", async () => {
    const { args } = await searchArgs({ query: "invoice" });
    expect(args).toEqual(["search", "query=invoice"]);
  });

  it("passes the query as a single argument, not through a shell or eval", async () => {
    const query = `"; process.exit(1); "`;
    const { args } = await searchArgs({ query });
    expect(args).toEqual(["search", `query=${query}`]);
  });

  it("passes folder, limit, case, total, and format", async () => {
    const { args } = await searchArgs({
      query: "x",
      path: "Projects",
      limit: 5,
      case: true,
      total: true,
      format: "json",
    });
    expect(args).toEqual(["search", "query=x", "path=Projects", "limit=5", "case", "total", "format=json"]);
  });

  it("switches to search:context and drops total", async () => {
    const { args } = await searchArgs({ query: "x", context: true, total: true });
    expect(args).toEqual(["search:context", "query=x"]);
  });

  it("returns a tool error when the CLI reports one", async () => {
    const { result } = await searchArgs({ query: "x", path: "Nope" }, 'Error: Folder "Nope" not found.\n');
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toBe('Search failed: Folder "Nope" not found.');
  });
});

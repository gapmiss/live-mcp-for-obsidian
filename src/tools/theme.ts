import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { obsidian, type ExecOptions } from "../connection.js";

export function registerThemeTools(server: McpServer, opts: ExecOptions) {
  server.registerTool(
    "obsidian_theme",
    {
      description: "Show active theme info or get details about a specific theme",
      inputSchema: {
        name: z.string().optional().describe("Theme name for details"),
      },
      annotations: { readOnlyHint: true },
    },
    async ({ name }) => {
      const args = ["theme"];
      if (name) args.push(`name=${name}`);
      const result = await obsidian(args, opts);
      return { content: [{ type: "text" as const, text: result }] };
    }
  );

  server.registerTool(
    "obsidian_themes",
    {
      description: "List installed themes",
      inputSchema: {
        versions: z.boolean().optional().describe("Include version numbers"),
      },
      annotations: { readOnlyHint: true },
    },
    async ({ versions }) => {
      const args = ["themes"];
      if (versions) args.push("versions");
      const result = await obsidian(args, opts);
      return { content: [{ type: "text" as const, text: result }] };
    }
  );

  server.registerTool(
    "obsidian_snippets",
    {
      description: "List installed CSS snippets",
      annotations: { readOnlyHint: true },
    },
    async () => {
      const result = await obsidian(["snippets"], opts);
      return { content: [{ type: "text" as const, text: result }] };
    }
  );
}

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { obsidian, toolError, type ExecOptions } from "../connection.js";

export function registerStatusTools(server: McpServer, opts: ExecOptions) {
  server.registerTool(
    "obsidian_status",
    {
      description: "Get Obsidian version, vault name, path, file/folder counts, and size",
      annotations: { readOnlyHint: true },
    },
    async () => {
      try {
        const [version, vault] = await Promise.all([
          obsidian(["version"], opts),
          obsidian(["vault"], opts),
        ]);
        return {
          content: [{ type: "text" as const, text: `Version: ${version.trim()}\n\n${vault}` }],
        };
      } catch (e) {
        return toolError(`Failed to get Obsidian status: ${e instanceof Error ? e.message : e}`);
      }
    }
  );

  server.registerTool(
    "obsidian_vaults",
    {
      description: "List all known vaults",
      annotations: { readOnlyHint: true },
    },
    async () => {
      try {
        const result = await obsidian(["vaults", "verbose"], opts);
        return { content: [{ type: "text" as const, text: result }] };
      } catch (e) {
        return toolError(`Failed to list vaults: ${e instanceof Error ? e.message : e}`);
      }
    }
  );
}

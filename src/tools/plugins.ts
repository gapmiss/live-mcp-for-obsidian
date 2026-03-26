import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { obsidian, type ExecOptions } from "../connection.js";

export function registerPluginTools(server: McpServer, opts: ExecOptions) {
  server.registerTool(
    "obsidian_plugins",
    {
      description: "List installed plugins with enabled/disabled state",
      inputSchema: {
        filter: z.enum(["core", "community"]).optional().describe("Filter by plugin type"),
        versions: z.boolean().optional().describe("Include version numbers"),
        format: z.enum(["json", "tsv", "csv"]).optional().describe("Output format"),
      },
      annotations: { readOnlyHint: true },
    },
    async ({ filter, versions, format }) => {
      const args = ["plugins"];
      if (filter) args.push(`filter=${filter}`);
      if (versions) args.push("versions");
      if (format) args.push(`format=${format}`);
      const result = await obsidian(args, opts);
      return { content: [{ type: "text" as const, text: result }] };
    }
  );

  server.registerTool(
    "obsidian_plugin_info",
    {
      description: "Get detailed info about a specific plugin",
      inputSchema: {
        id: z.string().describe("Plugin ID"),
      },
      annotations: { readOnlyHint: true },
    },
    async ({ id }) => {
      const result = await obsidian(["plugin", `id=${id}`], opts);
      return { content: [{ type: "text" as const, text: result }] };
    }
  );

  server.registerTool(
    "obsidian_plugin_enable",
    {
      description: "Enable a plugin",
      inputSchema: {
        id: z.string().describe("Plugin ID"),
      },
    },
    async ({ id }) => {
      const result = await obsidian(["plugin:enable", `id=${id}`], opts);
      return { content: [{ type: "text" as const, text: result || "Enabled" }] };
    }
  );

  server.registerTool(
    "obsidian_plugin_disable",
    {
      description: "Disable a plugin",
      inputSchema: {
        id: z.string().describe("Plugin ID"),
      },
    },
    async ({ id }) => {
      const result = await obsidian(["plugin:disable", `id=${id}`], opts);
      return { content: [{ type: "text" as const, text: result || "Disabled" }] };
    }
  );

  server.registerTool(
    "obsidian_plugin_reload",
    {
      description: "Reload a plugin (useful during development)",
      inputSchema: {
        id: z.string().describe("Plugin ID"),
      },
    },
    async ({ id }) => {
      const result = await obsidian(["plugin:reload", `id=${id}`], opts);
      return { content: [{ type: "text" as const, text: result || "Reloaded" }] };
    }
  );

  server.registerTool(
    "obsidian_commands",
    {
      description: "List available Obsidian commands, optionally filtered by prefix",
      inputSchema: {
        filter: z.string().optional().describe("Filter commands by ID prefix"),
      },
      annotations: { readOnlyHint: true },
    },
    async ({ filter }) => {
      const args = ["commands"];
      if (filter) args.push(`filter=${filter}`);
      const result = await obsidian(args, opts);
      return { content: [{ type: "text" as const, text: result }] };
    }
  );

  server.registerTool(
    "obsidian_command",
    {
      description: "Execute an Obsidian command by ID",
      inputSchema: {
        id: z.string().describe("Command ID to execute"),
      },
    },
    async ({ id }) => {
      const result = await obsidian(["command", `id=${id}`], opts);
      return { content: [{ type: "text" as const, text: result || "Executed" }] };
    }
  );
}

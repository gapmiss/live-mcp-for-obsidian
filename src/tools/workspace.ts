import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { obsidian, type ExecOptions } from "../connection.js";

export function registerWorkspaceTools(server: McpServer, opts: ExecOptions) {
  server.registerTool(
    "obsidian_tabs",
    {
      description: "List open tabs in the main editor area. Use 'all' to include sidebar panels.",
      inputSchema: {
        ids: z.boolean().optional().describe("Include tab IDs"),
        all: z.boolean().optional().describe("Include sidebar panels (default: main editor only)"),
      },
      annotations: { readOnlyHint: true },
    },
    async ({ ids, all }) => {
      if (all) {
        const args = ["tabs"];
        if (ids) args.push("ids");
        const result = await obsidian(args, opts);
        return { content: [{ type: "text" as const, text: result }] };
      }
      // Main editor tabs only via rootSplit
      const code = `(() => {
        const leaves = [];
        function collect(split) {
          if (!split) return;
          if (split.children) { split.children.forEach(collect); return; }
          if (split.view) {
            const v = split.view;
            const info = { type: v.getViewType(), display: v.getDisplayText() };
            ${ids ? "info.id = split.id;" : ""}
            const f = v.file || (v.getState && v.getState().file);
            if (f) info.file = typeof f === 'string' ? f : f.path;
            leaves.push(info);
          }
        }
        collect(app.workspace.rootSplit);
        if (leaves.length === 0) return 'No tabs open';
        return leaves.map(l => {
          let line = '[' + l.type + '] ' + l.display;
          if (l.file) line += ' (' + l.file + ')';
          ${ids ? "if (l.id) line += ' #' + l.id;" : ""}
          return line;
        }).join('\\n');
      })()`;
      const result = await obsidian(["eval", `code=${code}`], opts);
      return { content: [{ type: "text" as const, text: result }] };
    }
  );

  server.registerTool(
    "obsidian_workspace",
    {
      description: "Show the workspace tree layout",
      inputSchema: {
        ids: z.boolean().optional().describe("Include workspace item IDs"),
      },
      annotations: { readOnlyHint: true },
    },
    async ({ ids }) => {
      const args = ["workspace"];
      if (ids) args.push("ids");
      const result = await obsidian(args, opts);
      return { content: [{ type: "text" as const, text: result }] };
    }
  );

  server.registerTool(
    "obsidian_open",
    {
      description: "Open a file in Obsidian",
      inputSchema: {
        file: z.string().optional().describe("File name (resolved like wikilinks)"),
        path: z.string().optional().describe("Exact file path"),
        newtab: z.boolean().optional().describe("Open in new tab"),
      },
    },
    async ({ file, path, newtab }) => {
      const args = ["open"];
      if (file) args.push(`file=${file}`);
      if (path) args.push(`path=${path}`);
      if (newtab) args.push("newtab");
      const result = await obsidian(args, opts);
      return { content: [{ type: "text" as const, text: result || "Opened" }] };
    }
  );
}

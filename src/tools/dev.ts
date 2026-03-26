import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { obsidian, toolError, type ExecOptions } from "../connection.js";

export function registerDevTools(server: McpServer, opts: ExecOptions) {
  server.registerTool(
    "obsidian_eval",
    {
      description: "Execute JavaScript in Obsidian and return the result",
      inputSchema: {
        code: z.string().describe("JavaScript code to execute"),
      },
    },
    async ({ code }) => {
      try {
        const result = await obsidian(["eval", `code=${code}`], opts);
        return { content: [{ type: "text" as const, text: result }] };
      } catch (e) {
        return toolError(`Eval failed: ${e instanceof Error ? e.message : e}`);
      }
    }
  );

  server.registerTool(
    "obsidian_dom",
    {
      description: "Query DOM elements by CSS selector",
      inputSchema: {
        selector: z.string().describe("CSS selector"),
        text: z.boolean().optional().describe("Return text content instead of HTML"),
        all: z.boolean().optional().describe("Return all matches instead of first"),
        attr: z.string().optional().describe("Get a specific attribute value"),
        css: z.string().optional().describe("Get a CSS property value"),
      },
      annotations: { readOnlyHint: true },
    },
    async ({ selector, text, all, attr, css }) => {
      const args = ["dev:dom", `selector=${selector}`];
      if (text) args.push("text");
      if (all) args.push("all");
      if (attr) args.push(`attr=${attr}`);
      if (css) args.push(`css=${css}`);
      const result = await obsidian(args, opts);
      return { content: [{ type: "text" as const, text: result }] };
    }
  );

  server.registerTool(
    "obsidian_console",
    {
      description: "Show captured console messages from Obsidian",
      inputSchema: {
        level: z.enum(["log", "warn", "error", "info", "debug"]).optional().describe("Filter by log level"),
        limit: z.number().optional().describe("Max messages (default: 50)"),
        clear: z.boolean().optional().describe("Clear the console buffer"),
      },
      annotations: { readOnlyHint: true },
    },
    async ({ level, limit, clear }) => {
      const args = ["dev:console"];
      if (level) args.push(`level=${level}`);
      if (limit) args.push(`limit=${limit}`);
      if (clear) args.push("clear");
      const result = await obsidian(args, opts);
      return { content: [{ type: "text" as const, text: result || "No console messages" }] };
    }
  );

  server.registerTool(
    "obsidian_errors",
    {
      description: "Show captured errors from Obsidian",
      inputSchema: {
        clear: z.boolean().optional().describe("Clear the error buffer"),
      },
      annotations: { readOnlyHint: true },
    },
    async ({ clear }) => {
      const args = ["dev:errors"];
      if (clear) args.push("clear");
      const result = await obsidian(args, opts);
      return { content: [{ type: "text" as const, text: result || "No errors" }] };
    }
  );

  server.registerTool(
    "obsidian_screenshot",
    {
      description: "Take a screenshot of Obsidian",
      inputSchema: {
        path: z.string().optional().describe("Output file path"),
      },
      annotations: { readOnlyHint: true },
    },
    async ({ path }) => {
      const args = ["dev:screenshot"];
      if (path) args.push(`path=${path}`);
      const result = await obsidian(args, opts);
      return { content: [{ type: "text" as const, text: result || "Screenshot taken" }] };
    }
  );

  server.registerTool(
    "obsidian_css",
    {
      description: "Inspect CSS with source locations for a selector",
      inputSchema: {
        selector: z.string().describe("CSS selector"),
        prop: z.string().optional().describe("Filter by property name"),
      },
      annotations: { readOnlyHint: true },
    },
    async ({ selector, prop }) => {
      const args = ["dev:css", `selector=${selector}`];
      if (prop) args.push(`prop=${prop}`);
      const result = await obsidian(args, opts);
      return { content: [{ type: "text" as const, text: result }] };
    }
  );

  server.registerTool(
    "obsidian_cdp",
    {
      description: "Run a Chrome DevTools Protocol command directly",
      inputSchema: {
        method: z.string().describe("CDP method to call (e.g. 'Page.reload')"),
        params: z.string().optional().describe("Method parameters as JSON"),
      },
    },
    async ({ method, params }) => {
      try {
        const args = ["dev:cdp", `method=${method}`];
        if (params) args.push(`params=${params}`);
        const result = await obsidian(args, opts);
        return { content: [{ type: "text" as const, text: result }] };
      } catch (e) {
        return toolError(`CDP command failed: ${e instanceof Error ? e.message : e}`);
      }
    }
  );

  server.registerTool(
    "obsidian_debug",
    {
      description: "Attach or detach the Chrome DevTools Protocol debugger",
      inputSchema: {
        on: z.boolean().optional().describe("Attach debugger"),
        off: z.boolean().optional().describe("Detach debugger"),
      },
    },
    async ({ on, off }) => {
      const args = ["dev:debug"];
      if (on) args.push("on");
      if (off) args.push("off");
      const result = await obsidian(args, opts);
      return { content: [{ type: "text" as const, text: result || "Done" }] };
    }
  );

  server.registerTool(
    "obsidian_mobile",
    {
      description: "Toggle mobile emulation on or off",
      inputSchema: {
        on: z.boolean().optional().describe("Enable mobile emulation"),
        off: z.boolean().optional().describe("Disable mobile emulation"),
      },
    },
    async ({ on, off }) => {
      const args = ["dev:mobile"];
      if (on) args.push("on");
      if (off) args.push("off");
      const result = await obsidian(args, opts);
      return { content: [{ type: "text" as const, text: result || "Done" }] };
    }
  );

  server.registerTool(
    "obsidian_devtools",
    {
      description: "Toggle Electron DevTools open/closed",
    },
    async () => {
      const result = await obsidian(["devtools"], opts);
      return { content: [{ type: "text" as const, text: result || "DevTools toggled" }] };
    }
  );
}

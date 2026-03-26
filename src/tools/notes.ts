import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { obsidian, type ExecOptions } from "../connection.js";

export function registerNoteTools(server: McpServer, opts: ExecOptions) {
  server.registerTool(
    "obsidian_properties",
    {
      description: "List properties in the vault or for a specific file",
      inputSchema: {
        file: z.string().optional().describe("File name"),
        path: z.string().optional().describe("File path"),
        name: z.string().optional().describe("Get count for a specific property"),
        total: z.boolean().optional().describe("Return property count only"),
        counts: z.boolean().optional().describe("Include occurrence counts"),
        format: z.enum(["yaml", "json", "tsv"]).optional().describe("Output format"),
        active: z.boolean().optional().describe("Show properties for active file"),
      },
      annotations: { readOnlyHint: true },
    },
    async ({ file, path, name, total, counts, format, active }) => {
      const args = ["properties"];
      if (file) args.push(`file=${file}`);
      if (path) args.push(`path=${path}`);
      if (name) args.push(`name=${name}`);
      if (total) args.push("total");
      if (counts) args.push("counts");
      if (format) args.push(`format=${format}`);
      if (active) args.push("active");
      const result = await obsidian(args, opts);
      return { content: [{ type: "text" as const, text: result }] };
    }
  );

  server.registerTool(
    "obsidian_property_set",
    {
      description: "Set a property on a file",
      inputSchema: {
        name: z.string().describe("Property name"),
        value: z.string().describe("Property value"),
        type: z.enum(["text", "list", "number", "checkbox", "date", "datetime"]).optional().describe("Property type"),
        file: z.string().optional().describe("File name"),
        path: z.string().optional().describe("File path"),
      },
    },
    async ({ name, value, type, file, path }) => {
      const args = ["property:set", `name=${name}`, `value=${value}`];
      if (type) args.push(`type=${type}`);
      if (file) args.push(`file=${file}`);
      if (path) args.push(`path=${path}`);
      const result = await obsidian(args, opts);
      return { content: [{ type: "text" as const, text: result || "Property set" }] };
    }
  );

  server.registerTool(
    "obsidian_tags",
    {
      description: "List tags in the vault or for a specific file",
      inputSchema: {
        file: z.string().optional().describe("File name"),
        path: z.string().optional().describe("File path"),
        counts: z.boolean().optional().describe("Include tag counts"),
        sort: z.enum(["count"]).optional().describe("Sort by count"),
        format: z.enum(["json", "tsv", "csv"]).optional().describe("Output format"),
        active: z.boolean().optional().describe("Show tags for active file"),
      },
      annotations: { readOnlyHint: true },
    },
    async ({ file, path, counts, sort, format, active }) => {
      const args = ["tags"];
      if (file) args.push(`file=${file}`);
      if (path) args.push(`path=${path}`);
      if (counts) args.push("counts");
      if (sort) args.push(`sort=${sort}`);
      if (format) args.push(`format=${format}`);
      if (active) args.push("active");
      const result = await obsidian(args, opts);
      return { content: [{ type: "text" as const, text: result }] };
    }
  );

  server.registerTool(
    "obsidian_links",
    {
      description: "List outgoing links from a file",
      inputSchema: {
        file: z.string().optional().describe("File name"),
        path: z.string().optional().describe("File path"),
        total: z.boolean().optional().describe("Return link count only"),
      },
      annotations: { readOnlyHint: true },
    },
    async ({ file, path, total }) => {
      const args = ["links"];
      if (file) args.push(`file=${file}`);
      if (path) args.push(`path=${path}`);
      if (total) args.push("total");
      const result = await obsidian(args, opts);
      return { content: [{ type: "text" as const, text: result }] };
    }
  );

  server.registerTool(
    "obsidian_backlinks",
    {
      description: "List backlinks to a file",
      inputSchema: {
        file: z.string().optional().describe("File name"),
        path: z.string().optional().describe("File path"),
        counts: z.boolean().optional().describe("Include link counts"),
        total: z.boolean().optional().describe("Return backlink count only"),
        format: z.enum(["json", "tsv", "csv"]).optional().describe("Output format"),
      },
      annotations: { readOnlyHint: true },
    },
    async ({ file, path, counts, total, format }) => {
      const args = ["backlinks"];
      if (file) args.push(`file=${file}`);
      if (path) args.push(`path=${path}`);
      if (counts) args.push("counts");
      if (total) args.push("total");
      if (format) args.push(`format=${format}`);
      const result = await obsidian(args, opts);
      return { content: [{ type: "text" as const, text: result }] };
    }
  );

  server.registerTool(
    "obsidian_outline",
    {
      description: "Show headings for a file",
      inputSchema: {
        file: z.string().optional().describe("File name"),
        path: z.string().optional().describe("File path"),
        format: z.enum(["tree", "md", "json"]).optional().describe("Output format"),
      },
      annotations: { readOnlyHint: true },
    },
    async ({ file, path, format }) => {
      const args = ["outline"];
      if (file) args.push(`file=${file}`);
      if (path) args.push(`path=${path}`);
      if (format) args.push(`format=${format}`);
      const result = await obsidian(args, opts);
      return { content: [{ type: "text" as const, text: result }] };
    }
  );

  server.registerTool(
    "obsidian_tasks",
    {
      description: "List tasks in the vault or a specific file",
      inputSchema: {
        file: z.string().optional().describe("Filter by file name"),
        path: z.string().optional().describe("Filter by file path"),
        done: z.boolean().optional().describe("Show completed tasks"),
        todo: z.boolean().optional().describe("Show incomplete tasks"),
        verbose: z.boolean().optional().describe("Group by file with line numbers"),
        format: z.enum(["json", "tsv", "csv"]).optional().describe("Output format"),
        active: z.boolean().optional().describe("Show tasks for active file"),
        daily: z.boolean().optional().describe("Show tasks from daily note"),
      },
      annotations: { readOnlyHint: true },
    },
    async ({ file, path, done, todo, verbose, format, active, daily }) => {
      const args = ["tasks"];
      if (file) args.push(`file=${file}`);
      if (path) args.push(`path=${path}`);
      if (done) args.push("done");
      if (todo) args.push("todo");
      if (verbose) args.push("verbose");
      if (format) args.push(`format=${format}`);
      if (active) args.push("active");
      if (daily) args.push("daily");
      const result = await obsidian(args, opts);
      return { content: [{ type: "text" as const, text: result }] };
    }
  );

  server.registerTool(
    "obsidian_daily",
    {
      description: "Open or read the daily note",
      inputSchema: {
        read: z.boolean().optional().describe("Read contents instead of opening"),
      },
    },
    async ({ read }) => {
      const cmd = read ? "daily:read" : "daily";
      const result = await obsidian([cmd], opts);
      return { content: [{ type: "text" as const, text: result || "Daily note opened" }] };
    }
  );

  server.registerTool(
    "obsidian_daily_append",
    {
      description: "Append content to the daily note",
      inputSchema: {
        content: z.string().describe("Content to append"),
        inline: z.boolean().optional().describe("Append without newline"),
      },
    },
    async ({ content, inline: isInline }) => {
      const args = ["daily:append", `content=${content}`];
      if (isInline) args.push("inline");
      const result = await obsidian(args, opts);
      return { content: [{ type: "text" as const, text: result || "Appended to daily note" }] };
    }
  );
}

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { obsidian, toolError, type ExecOptions } from "../connection.js";

export function registerVaultTools(server: McpServer, opts: ExecOptions) {
  server.registerTool(
    "obsidian_files",
    {
      description: "List files in the vault, optionally filtered by folder or extension",
      inputSchema: {
        folder: z.string().optional().describe("Filter by folder path"),
        ext: z.string().optional().describe("Filter by extension (e.g. 'md')"),
        total: z.boolean().optional().describe("Return only the file count"),
      },
      annotations: { readOnlyHint: true },
    },
    async ({ folder, ext, total }) => {
      const args = ["files"];
      if (folder) args.push(`folder=${folder}`);
      if (ext) args.push(`ext=${ext}`);
      if (total) args.push("total");
      const result = await obsidian(args, opts);
      return { content: [{ type: "text" as const, text: result }] };
    }
  );

  server.registerTool(
    "obsidian_read",
    {
      description: "Read the contents of a file",
      inputSchema: {
        file: z.string().optional().describe("File name (resolved like wikilinks)"),
        path: z.string().optional().describe("Exact file path"),
      },
      annotations: { readOnlyHint: true },
    },
    async ({ file, path }) => {
      try {
        const args = ["read"];
        if (file) args.push(`file=${file}`);
        if (path) args.push(`path=${path}`);
        const result = await obsidian(args, opts);
        return { content: [{ type: "text" as const, text: result }] };
      } catch (e) {
        return toolError(`Failed to read file: ${e instanceof Error ? e.message : e}`);
      }
    }
  );

  server.registerTool(
    "obsidian_create",
    {
      description: "Create a new file in the vault",
      inputSchema: {
        name: z.string().optional().describe("File name"),
        path: z.string().optional().describe("File path"),
        content: z.string().optional().describe("Initial content"),
        template: z.string().optional().describe("Template to use"),
        overwrite: z.boolean().optional().describe("Overwrite if exists"),
        open: z.boolean().optional().describe("Open after creating"),
      },
    },
    async ({ name, path, content, template, overwrite, open }) => {
      try {
        const args = ["create"];
        if (name) args.push(`name=${name}`);
        if (path) args.push(`path=${path}`);
        if (content) args.push(`content=${content}`);
        if (template) args.push(`template=${template}`);
        if (overwrite) args.push("overwrite");
        if (open) args.push("open");
        const result = await obsidian(args, opts);
        return { content: [{ type: "text" as const, text: result || "Created" }] };
      } catch (e) {
        return toolError(`Failed to create file: ${e instanceof Error ? e.message : e}`);
      }
    }
  );

  server.registerTool(
    "obsidian_append",
    {
      description: "Append content to a file",
      inputSchema: {
        file: z.string().optional().describe("File name"),
        path: z.string().optional().describe("File path"),
        content: z.string().describe("Content to append"),
        inline: z.boolean().optional().describe("Append without newline"),
      },
    },
    async ({ file, path, content, inline: isInline }) => {
      const args = ["append"];
      if (file) args.push(`file=${file}`);
      if (path) args.push(`path=${path}`);
      args.push(`content=${content}`);
      if (isInline) args.push("inline");
      const result = await obsidian(args, opts);
      return { content: [{ type: "text" as const, text: result || "Appended" }] };
    }
  );

  server.registerTool(
    "obsidian_prepend",
    {
      description: "Prepend content to a file",
      inputSchema: {
        file: z.string().optional().describe("File name"),
        path: z.string().optional().describe("File path"),
        content: z.string().describe("Content to prepend"),
        inline: z.boolean().optional().describe("Prepend without newline"),
      },
    },
    async ({ file, path, content, inline: isInline }) => {
      const args = ["prepend"];
      if (file) args.push(`file=${file}`);
      if (path) args.push(`path=${path}`);
      args.push(`content=${content}`);
      if (isInline) args.push("inline");
      const result = await obsidian(args, opts);
      return { content: [{ type: "text" as const, text: result || "Prepended" }] };
    }
  );

  server.registerTool(
    "obsidian_delete",
    {
      description: "Delete a file (moves to trash by default)",
      inputSchema: {
        file: z.string().optional().describe("File name"),
        path: z.string().optional().describe("File path"),
        permanent: z.boolean().optional().describe("Skip trash, delete permanently"),
      },
      annotations: { destructiveHint: true },
    },
    async ({ file, path, permanent }) => {
      try {
        const args = ["delete"];
        if (file) args.push(`file=${file}`);
        if (path) args.push(`path=${path}`);
        if (permanent) args.push("permanent");
        const result = await obsidian(args, opts);
        return { content: [{ type: "text" as const, text: result || "Deleted" }] };
      } catch (e) {
        return toolError(`Failed to delete file: ${e instanceof Error ? e.message : e}`);
      }
    }
  );

  server.registerTool(
    "obsidian_move",
    {
      description: "Move or rename a file",
      inputSchema: {
        file: z.string().optional().describe("File name"),
        path: z.string().optional().describe("File path"),
        to: z.string().describe("Destination folder or path"),
      },
      annotations: { destructiveHint: true },
    },
    async ({ file, path, to }) => {
      const args = ["move"];
      if (file) args.push(`file=${file}`);
      if (path) args.push(`path=${path}`);
      args.push(`to=${to}`);
      const result = await obsidian(args, opts);
      return { content: [{ type: "text" as const, text: result || "Moved" }] };
    }
  );

  server.registerTool(
    "obsidian_search",
    {
      description: "Search files, tags, properties, or links in the vault",
      inputSchema: {
        query: z.string().describe("Search query"),
      },
      annotations: { readOnlyHint: true },
    },
    async ({ query }) => {
      try {
        const safe = JSON.stringify(query);
        const code = `((q) => app.vault.getMarkdownFiles().filter(f => f.path.includes(q) || f.basename.includes(q)).map(f => f.path).join('\\n'))(${safe})`;
        const result = await obsidian(["eval", `code=${code}`], opts);
        return { content: [{ type: "text" as const, text: result || "No results" }] };
      } catch (e) {
        return toolError(`Search failed: ${e instanceof Error ? e.message : e}`);
      }
    }
  );
}

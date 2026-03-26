import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { obsidian, type ExecOptions } from "../connection.js";

export function registerMemoryTools(server: McpServer, opts: ExecOptions) {
  server.registerTool(
    "obsidian_briefing",
    {
      description: "Get a snapshot of the current Obsidian state: active file, open tabs, daily note, recent files, vault stats, and CLAUDE.md instructions if present. Call this at the start of a session for instant context.",
      annotations: { readOnlyHint: true },
    },
    async () => {
      const sections: string[] = [];

      // Active file
      try {
        const active = await obsidian(
          [
            "eval",
            "code=(() => { const f = app.workspace.getActiveFile(); return f ? f.path : 'None'; })()",
          ],
          opts
        );
        sections.push(`## Active file\n${active.trim()}`);
      } catch {
        sections.push("## Active file\nUnable to determine");
      }

      // Open tabs
      try {
        const tabs = await obsidian(["tabs"], opts);
        sections.push(`## Open tabs\n${tabs.trim()}`);
      } catch {
        // skip
      }

      // Daily note — check existence without creating/opening
      try {
        const daily = await obsidian(
          [
            "eval",
            "code=(() => { const dp = app.internalPlugins.getEnabledPluginById('daily-notes'); if (!dp) return 'No daily notes plugin'; const fmt = dp.options.format || 'YYYY-MM-DD'; const folder = dp.options.folder || ''; const name = window.moment().format(fmt); const path = folder ? folder + '/' + name + '.md' : name + '.md'; const file = app.vault.getAbstractFileByPath(path); return file ? 'Exists: ' + path : 'Not created: ' + path; })()",
          ],
          opts
        );
        sections.push(`## Daily note\n${daily.trim()}`);
      } catch {
        sections.push("## Daily note\nUnable to check");
      }

      // Recent files (last 10 modified)
      try {
        const recent = await obsidian(
          [
            "eval",
            "code=app.vault.getMarkdownFiles().sort((a,b) => b.stat.mtime - a.stat.mtime).slice(0,10).map(f => f.path).join('\\n')",
          ],
          opts
        );
        sections.push(`## Recent files\n${recent.trim()}`);
      } catch {
        // skip
      }

      // Vault stats
      try {
        const total = await obsidian(["files", "ext=md", "total"], opts);
        sections.push(`## Vault\n${total.trim()} markdown files`);
      } catch {
        // skip
      }

      // CLAUDE.md instructions (user-maintained persistent preferences)
      try {
        const claude = await obsidian(["read", "path=CLAUDE.md"], opts);
        if (claude.trim() && !claude.includes("not found")) {
          sections.push(`## CLAUDE.md\n${claude.trim()}`);
        }
      } catch {
        // No CLAUDE.md — that's fine
      }

      return {
        content: [
          {
            type: "text" as const,
            text: sections.join("\n\n"),
          },
        ],
      };
    }
  );
}

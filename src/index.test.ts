import { describe, it, expect, vi } from "vitest";

vi.mock("node:child_process", () => ({
  execFile: vi.fn(),
}));

import { createServer } from "./index.js";

describe("createServer()", () => {
  it("creates an MCP server", () => {
    const server = createServer();
    expect(server).toBeDefined();
  });

  it("registers all expected tools", () => {
    const server = createServer();
    const tools = (server as any)._registeredTools;
    expect(tools).toBeDefined();

    const expectedTools = [
      // Status
      "obsidian_status",
      "obsidian_vaults",
      // Workspace
      "obsidian_tabs",
      "obsidian_workspace",
      "obsidian_open",
      // Vault
      "obsidian_files",
      "obsidian_read",
      "obsidian_create",
      "obsidian_append",
      "obsidian_prepend",
      "obsidian_delete",
      "obsidian_move",
      "obsidian_search",
      // Plugins
      "obsidian_plugins",
      "obsidian_plugin_info",
      "obsidian_plugin_enable",
      "obsidian_plugin_disable",
      "obsidian_plugin_reload",
      "obsidian_commands",
      "obsidian_command",
      // Theme
      "obsidian_theme",
      "obsidian_themes",
      "obsidian_snippets",
      // Notes
      "obsidian_properties",
      "obsidian_property_set",
      "obsidian_tags",
      "obsidian_links",
      "obsidian_backlinks",
      "obsidian_outline",
      "obsidian_tasks",
      "obsidian_daily",
      "obsidian_daily_append",
      // Dev
      "obsidian_eval",
      "obsidian_dom",
      "obsidian_console",
      "obsidian_errors",
      "obsidian_screenshot",
      "obsidian_css",
      "obsidian_cdp",
      "obsidian_debug",
      "obsidian_mobile",
      "obsidian_devtools",
      // Memory
      "obsidian_briefing",
    ];

    for (const name of expectedTools) {
      expect(tools[name], `missing tool: ${name}`).toBeDefined();
    }
    expect(Object.keys(tools)).toHaveLength(expectedTools.length);
  });

  it("passes exec options through", () => {
    const server = createServer({
      obsidianPath: "/custom/obsidian",
      vault: "Test Vault",
    });
    expect(server).toBeDefined();
  });
});

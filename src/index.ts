import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ExecOptions } from "./connection.js";
import { registerStatusTools } from "./tools/status.js";
import { registerWorkspaceTools } from "./tools/workspace.js";
import { registerVaultTools } from "./tools/vault.js";
import { registerPluginTools } from "./tools/plugins.js";
import { registerThemeTools } from "./tools/theme.js";
import { registerNoteTools } from "./tools/notes.js";
import { registerDevTools } from "./tools/dev.js";
import { registerMemoryTools } from "./tools/memory.js";

export function createServer(opts: ExecOptions = {}): McpServer {
  const server = new McpServer({
    name: "live-mcp-for-obsidian",
    version: "0.1.0",
  });

  registerStatusTools(server, opts);
  registerWorkspaceTools(server, opts);
  registerVaultTools(server, opts);
  registerPluginTools(server, opts);
  registerThemeTools(server, opts);
  registerNoteTools(server, opts);
  registerDevTools(server, opts);
  registerMemoryTools(server, opts);

  return server;
}

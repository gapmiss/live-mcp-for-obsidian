# Security

## Trust model

This server sits between your AI assistant and your running Obsidian app:

```
You → MCP client (Claude Code, Claude Desktop) → this server → Obsidian CLI → Obsidian
```

**Your MCP client is the gatekeeper.** The server doesn't authenticate anyone. It runs whatever tool calls the client sends. That means:

- Only register it with MCP clients you trust.
- Your client's permission prompts are what stand between a request and your vault. Claude Code and Claude Desktop show each tool call and its arguments before running it.
- There's no network listener. The server only talks over stdio to the process that started it.

Tools are tagged with MCP hints. Read-only tools are marked `readOnlyHint`, and `obsidian_delete` and `obsidian_move` are marked `destructiveHint`. Clients can use these hints to decide when to ask, but it's up to each client whether it does.

## Powerful tools

A few tools go well beyond reading and writing notes. They're there on purpose, because full app automation needs them. Here's what each one can do.

### `obsidian_eval`

Runs any JavaScript in Obsidian's app window. That code has full access to Obsidian's `app` API, the DOM, and whatever Node.js APIs Electron exposes there. Nothing restricts what it can do. It can read, change, or delete any file Obsidian can reach.

**Why it exists:** The other 45 tools can't cover everything. Eval handles the rest, including clicking around the UI.

**What to do:** Read the `code` argument before approving it.

### `obsidian_cdp`

Sends raw Chrome DevTools Protocol commands to Obsidian's window. It can inspect and change the page at a low level.

**Why it exists:** Advanced debugging and profiling for plugin and theme developers. Screenshots and recordings use CDP internally too.

### `obsidian_delete`

Moves files to the system trash by default. It only deletes permanently if `permanent: true` is passed explicitly.

## Input handling

- **No shell injection.** Every call to the Obsidian CLI and to ffmpeg uses Node's `execFile()`, which doesn't go through a shell. An argument like `content=foo; rm -rf /` is passed as plain text.
- **Generated JavaScript is escaped.** `obsidian_tabs`, `obsidian_screenshot`, and `obsidian_briefing` build small JavaScript snippets. The only user input in them, the screenshot CSS selector, is escaped with `JSON.stringify()` so it stays a string.
- **Paths are handled by Obsidian.** Note paths go straight to the Obsidian CLI, which resolves them inside the vault. The server itself only writes files in two cases: screenshots and recordings, saved to the path you give or a default location.

## Timeouts

Each call to the Obsidian CLI times out after 10 seconds, so a hung Obsidian can't block your client forever.

Recording is the exception. `obsidian_record` intentionally runs for up to 120 seconds, and ffmpeg encoding has no timeout.

## Reporting a vulnerability

Please open an issue on the [GitHub repository](https://github.com/gapmiss/live-mcp-for-obsidian/issues) or contact the maintainer directly.

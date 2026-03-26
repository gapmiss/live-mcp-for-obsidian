# Security

## Trust model

This MCP server acts as a bridge between an AI assistant (the MCP client) and a running Obsidian instance. The trust chain is:

```
User → MCP Client (Claude Code / Claude Desktop) → This Server → Obsidian CLI → Obsidian App
```

**The MCP client is the trust boundary.** This server does not authenticate callers — it trusts that the MCP client only sends requests the user has approved. All tool calls from the MCP client are executed against the Obsidian CLI without additional authorization.

This means:
- The server should only be registered with MCP clients you trust
- Tool calls are gated by the MCP client's permission system (e.g. Claude Code prompts for approval on destructive actions)
- There is no network listener — the server communicates exclusively via stdio

## Powerful tools

Several tools provide capabilities that go beyond reading and writing notes. These are intentional and necessary for the server's purpose (full app automation), but users should understand their scope.

### `obsidian_eval`

Executes arbitrary JavaScript in Obsidian's main process. This has full access to Obsidian's `app.*` API, the DOM, and Node.js built-ins available in Electron's renderer process. There are no restrictions on what code can be executed.

**Why it exists:** Many automation tasks require access to Obsidian's internal APIs that aren't exposed through dedicated CLI commands. This is the escape hatch for anything not covered by the other 42 tools.

**Mitigation:** The MCP client controls what code is sent. Claude Code and Claude Desktop present tool calls to the user for approval before execution.

### `obsidian_cdp`

Sends raw Chrome DevTools Protocol commands to Obsidian's Electron window. This can inspect and manipulate the renderer process at a low level.

**Why it exists:** Enables advanced debugging, performance profiling, and DOM manipulation for plugin and theme development.

### `obsidian_delete`

Moves files to the system trash by default. The `permanent` flag must be explicitly set to `true` to bypass trash. The tool is annotated with `destructiveHint: true`, which MCP clients use to require user confirmation.

## Input handling

- **No shell injection risk.** All CLI calls use Node.js `execFile()`, which passes arguments directly to the process without a shell. Arguments like `content=foo; rm -rf /` are treated as literal strings.

- **JavaScript injection in `obsidian_search` is mitigated.** The search tool constructs JavaScript code that runs via `obsidian_eval`. User input is escaped using `JSON.stringify()` to prevent injection through the query parameter.

- **Path handling is delegated to the CLI.** File paths are passed directly to the Obsidian CLI, which resolves them within the vault. This server does not perform file system operations directly.

## Timeout

All CLI calls have a 10-second timeout. If the Obsidian binary does not respond within 10 seconds, the call is killed and an error is returned. This prevents hung processes from blocking the MCP client.

## Reporting vulnerabilities

If you discover a security issue, please open an issue on the GitHub repository or contact the maintainer directly.

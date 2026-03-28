# live-mcp-for-obsidian

A live connection between AI assistants and your running Obsidian instance.

> [!IMPORTANT]
> **Disclaimer:** This project is not created by, affiliated with, or endorsed by Obsidian or Dynalist Inc. "Obsidian" is a trademark of Dynalist Inc. This project uses Obsidian's native CLI interface for interoperability.

Most Obsidian MCP servers treat your vault as a folder of files — read, write, search. This one connects to the **live application**. It can read your notes, but it can also click buttons, manage plugins, take screenshots, execute JavaScript, inspect the DOM, emulate mobile, and control the full Obsidian UI. 43 tools, zero plugins required.

## How is this different?

There are 20+ Obsidian MCP servers in the community. Nearly all of them do the same thing: expose vault files over HTTP or stdio so an AI can read and write markdown.

This server operates at a fundamentally different level:

|                           | File-based MCP servers | live-mcp-for-obsidian                  |
| ------------------------- | ---------------------- | -------------------------------------- |
| Read/write notes          | Yes                    | Yes                                    |
| Search vault              | Yes                    | Yes                                    |
| Interact with plugins     | No                     | Yes — enable, disable, reload, inspect |
| Click UI elements         | No                     | Yes — any button, menu, or control     |
| Take screenshots          | No                     | Yes — full window or targeted element  |
| Execute JavaScript        | No                     | Yes — full `app.*` API access          |
| Inspect DOM/CSS           | No                     | Yes — like Chrome DevTools             |
| Mobile emulation          | No                     | Yes — test mobile layouts              |
| Console/error capture     | No                     | Yes — live debugging                   |
| Requires Obsidian plugins | Usually                | No — uses native CLI                   |

**It's the difference between a file server and full app automation.**

## Remote access

With SSH access to the machine running Obsidian, you get full remote control — every tool works over an SSH session. No HTTP server, no OAuth, no Cloudflare Tunnel, no Tailscale. Just SSH in, run Claude Code, and you have a live connection to your Obsidian instance from anywhere.

## Requirements

- **Obsidian 1.12.4+** (with CLI support)
- **Node.js 18+**
- **macOS** (Linux/Windows: adjust the Obsidian binary path)

## Install

### Claude Code

```bash
claude mcp add obsidian-live -- npx live-mcp-for-obsidian
```

With a specific vault:

```bash
claude mcp add obsidian-live -- npx live-mcp-for-obsidian --vault "My Vault"
```

This registers the server in your user-level config (`~/.claude.json`), making it available in every Claude Code session on your machine. To limit it to a single project, add `--scope project` which writes to `.mcp.json` in the current directory instead.

### Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "obsidian-live": {
      "command": "npx",
      "args": ["live-mcp-for-obsidian"]
    }
  }
}
```

With a specific vault:

```json
{
  "mcpServers": {
    "obsidian-live": {
      "command": "npx",
      "args": ["live-mcp-for-obsidian", "--vault", "My Vault"]
    }
  }
}
```

### From source

```bash
git clone https://github.com/gapmiss/live-mcp-for-obsidian.git
cd live-mcp-for-obsidian
npm install
npm run build
claude mcp add obsidian-live -- node ./build/cli.js
```

### CLI Options

| Flag              | Default                                              | Description                     |
| ----------------- | ---------------------------------------------------- | ------------------------------- |
| `--obsidian-path` | `/Applications/Obsidian.app/Contents/MacOS/Obsidian` | Path to Obsidian binary         |
| `--vault`, `-v`   | Active vault                                         | Target a specific vault by name |

## What can it do?

### Vault management

> "What files are in my Projects folder?"
> "Create a new note called 'Meeting Notes' with a template"
> "Move all files from Inbox/ to Archive/"
> "Show me orphaned notes with no backlinks"
> "What are my incomplete tasks across the vault?"

### Daily notes

> "Read my daily note"
> "Append '- Called dentist to reschedule' to today's daily note"
> "What tasks are on today's daily note?"

### Session briefing

> "Give me a briefing"

One call to `obsidian_briefing` returns the active file, open tabs, daily note status, recent files, vault stats, and any persistent instructions from a `CLAUDE.md` file in your vault root. Instant situational awareness — no setup, no storage, ~300 tokens.

### Live UI automation

> "Click the p2p-share status bar item and select 'Pair with device'"
> "Toggle the theme mode button"
> "Open the command palette and run 'Graph view: Open local graph'"

The assistant can interact with any UI element via `obsidian_eval` — clicking buttons, opening menus, filling inputs, navigating the interface. Anything you can do with a mouse, the assistant can do programmatically.

### Plugin development

> "Reload my plugin so I can test the changes"
> "What commands does my plugin register?"
> "Take a screenshot of `.my-plugin-settings` so I can see how my settings tab looks"
> "Show me the console errors after I triggered that bug"
> "What CSS is applied to `.my-plugin-container`?"
> "Toggle mobile emulation so I can test the mobile layout"

Full Chrome DevTools capabilities — DOM inspection, CSS debugging, console/error capture, screenshots, and arbitrary JS evaluation — plus Obsidian-specific tools like plugin reload and command listing.

### Screenshots

> "Take a screenshot"
> "Screenshot just the `.workspace-leaf.mod-active` element"
> "Take a jpeg screenshot at 80% quality"
> "Screenshot the sidebar: `.workspace-split.mod-left-split`"

`obsidian_screenshot` uses Chrome DevTools Protocol for capture, supporting full-window or element-targeted screenshots via CSS selector. Choose between png, jpeg, or webp output, and control compression quality for jpeg/webp. Element targeting finds the first visible match — useful in Obsidian where multiple hidden duplicates of a selector may exist.

### Theme development

> "What CSS variables does the current theme define for text colors?"
> "Inspect the computed styles on the sidebar"
> "Screenshot the `.workspace-leaf-content`, then switch to dark mode and take another"
> "Show me the CSS source locations for `.workspace-leaf`"

### Knowledge base queries

> "List all tags sorted by frequency"
> "What properties does this note have?"
> "Show me the outline of my 'Architecture' note"
> "What notes link to 'Project Alpha'?"
> "Find all unresolved links in my vault"

### Automation

> "Execute the 'daily-notes:open' command"
> "Disable the 'calendar' plugin"
> "Set the 'status' property to 'done' on this note"
> "Enable the minimal theme"

The `obsidian_command` tool can trigger any registered command, and `obsidian_eval` can run arbitrary JavaScript for anything not covered by a dedicated tool.

## Tools Reference

### Status & Vaults

| Tool              | Description                                                          |
| ----------------- | -------------------------------------------------------------------- |
| `obsidian_status` | Get Obsidian version, vault name, path, file/folder counts, and size |
| `obsidian_vaults` | List all known vaults                                                |

### Workspace

| Tool                 | Description                             |
| -------------------- | --------------------------------------- |
| `obsidian_tabs`      | List all open tabs with their view type |
| `obsidian_workspace` | Show the workspace tree layout          |
| `obsidian_open`      | Open a file in Obsidian                 |

### Files & Vault

| Tool               | Description                                            |
| ------------------ | ------------------------------------------------------ |
| `obsidian_files`   | List files, optionally filtered by folder or extension |
| `obsidian_read`    | Read the contents of a file                            |
| `obsidian_create`  | Create a new file in the vault                         |
| `obsidian_append`  | Append content to a file                               |
| `obsidian_prepend` | Prepend content to a file                              |
| `obsidian_delete`  | Delete a file (moves to trash by default)              |
| `obsidian_move`    | Move or rename a file                                  |
| `obsidian_search`  | Search files, tags, properties, or links in the vault  |

### Notes & Metadata

| Tool                    | Description                                         |
| ----------------------- | --------------------------------------------------- |
| `obsidian_properties`   | List properties in the vault or for a specific file |
| `obsidian_property_set` | Set a property on a file                            |
| `obsidian_tags`         | List tags in the vault or for a specific file       |
| `obsidian_links`        | List outgoing links from a file                     |
| `obsidian_backlinks`    | List backlinks to a file                            |
| `obsidian_outline`      | Show headings for a file                            |
| `obsidian_tasks`        | List tasks in the vault or a specific file          |
| `obsidian_daily`        | Open or read the daily note                         |
| `obsidian_daily_append` | Append content to the daily note                    |

### Plugins & Commands

| Tool                      | Description                                            |
| ------------------------- | ------------------------------------------------------ |
| `obsidian_plugins`        | List installed plugins with enabled/disabled state     |
| `obsidian_plugin_info`    | Get detailed info about a specific plugin              |
| `obsidian_plugin_enable`  | Enable a plugin                                        |
| `obsidian_plugin_disable` | Disable a plugin                                       |
| `obsidian_plugin_reload`  | Reload a plugin (useful during development)            |
| `obsidian_commands`       | List available commands, optionally filtered by prefix |
| `obsidian_command`        | Execute an Obsidian command by ID                      |

### Themes & Appearance

| Tool                | Description                                                  |
| ------------------- | ------------------------------------------------------------ |
| `obsidian_theme`    | Show active theme info or get details about a specific theme |
| `obsidian_themes`   | List installed themes                                        |
| `obsidian_snippets` | List installed CSS snippets                                  |

### Developer Tools

| Tool                  | Description                                          |
| --------------------- | ---------------------------------------------------- |
| `obsidian_eval`       | Execute JavaScript in Obsidian and return the result |
| `obsidian_dom`        | Query DOM elements by CSS selector                   |
| `obsidian_console`    | Show captured console messages                       |
| `obsidian_errors`     | Show captured errors                                 |
| `obsidian_screenshot` | Take a screenshot of the full window or a specific element via CSS selector. Supports png/jpeg/webp output and quality control. |
| `obsidian_css`        | Inspect CSS with source locations for a selector     |
| `obsidian_cdp`        | Run a Chrome DevTools Protocol command directly      |
| `obsidian_debug`      | Attach or detach the CDP debugger                    |
| `obsidian_mobile`     | Toggle mobile emulation on or off                    |
| `obsidian_devtools`   | Toggle Electron DevTools open/closed                 |

### Memory

| Tool                | Description                                                                                    |
| ------------------- | ---------------------------------------------------------------------------------------------- |
| `obsidian_briefing` | Snapshot of current state: active file, tabs, daily note, recent files, vault stats, CLAUDE.md |

## How It Works

This server is a thin MCP wrapper around Obsidian's native CLI. Each tool maps to one or more CLI commands:

```
obsidian_read { file: "My Note" }
  → obsidian read file="My Note"

obsidian_plugin_reload { id: "my-plugin" }
  → obsidian plugin:reload id=my-plugin

obsidian_dom { selector: ".workspace-leaf", text: true }
  → obsidian dev:dom selector=".workspace-leaf" text

obsidian_screenshot { selector: ".workspace-leaf", format: "jpeg", quality: 80 }
  → CDP Page.captureScreenshot with element clip region
```

No network servers, no ports, no plugins to install. The CLI communicates with the running Obsidian instance directly.

## FAQ

**Is this safe?** This server runs locally and communicates only via stdio — there's no network exposure. Destructive tools like `obsidian_delete` require confirmation from your MCP client before executing. See [SECURITY.md](SECURITY.md) for the full trust model.

**Why does it need `obsidian_eval`?** Obsidian has 800+ API methods. 42 tools cover the common operations. Eval is the escape hatch for everything else — and it's what makes use cases like "click that button" or "check the graph view" possible.

**What if I don't want the powerful tools?** Your MCP client controls which tool calls are approved. Claude Code and Claude Desktop both show you the tool call and its arguments before executing. You can deny any call you're not comfortable with.

## Security

This server executes commands against a running Obsidian instance. Tools like `obsidian_eval` and `obsidian_cdp` are powerful by design — they provide full JavaScript execution and DevTools access for app automation.

See [SECURITY.md](SECURITY.md) for the full trust model, input handling details, and security considerations.

## Disclaimer

This project is not created by, affiliated with, or endorsed by [Obsidian](https://obsidian.md/) or Dynalist Inc. "Obsidian" is a trademark of Dynalist Inc. This project uses Obsidian's native CLI interface for interoperability purposes only.

## License

MIT

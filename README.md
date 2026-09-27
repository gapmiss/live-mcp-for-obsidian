# live-mcp-for-obsidian

Connect Claude (or any MCP client) to your running Obsidian app.

> [!IMPORTANT]
> **Disclaimer:** This project is not created by, affiliated with, or endorsed by Obsidian or Dynalist Inc. "Obsidian" is a trademark of Dynalist Inc. This project uses Obsidian's native CLI interface for interoperability.

Most Obsidian MCP servers treat your vault as a folder of markdown files. This one talks to the app itself. It can read and write notes, and it can also manage plugins, run commands, click through the UI, take screenshots, record video, inspect the DOM and CSS, and run JavaScript inside Obsidian.

46 tools. No Obsidian plugin to install.

## Demo

https://github.com/user-attachments/assets/297fb0d5-f089-45b5-8038-5de2cbc0f4b7

[More demos](./demo.md)

## How is this different?

|                           | File-based MCP servers | live-mcp-for-obsidian                 |
| ------------------------- | ---------------------- | ------------------------------------- |
| Read and write notes      | Yes                    | Yes                                   |
| Find notes                | Yes                    | Yes                                   |
| Manage plugins            | No                     | Enable, disable, reload, inspect      |
| Click UI elements         | No                     | Any button, menu, or control          |
| Screenshots               | No                     | Whole window or a single element      |
| Screen recording          | No                     | MP4, WebM, or GIF                     |
| Run JavaScript            | No                     | Full access to Obsidian's `app` API   |
| Inspect DOM and CSS       | No                     | Like Chrome DevTools                  |
| Mobile emulation          | No                     | Test mobile layouts on desktop        |
| Console and error capture | No                     | Yes                                   |
| Needs an Obsidian plugin  | Usually                | No, it uses Obsidian's built-in CLI   |

## Requirements

- **Obsidian 1.12.4 or later**, open and running
- **Node.js 18 or later**
- **macOS** works out of the box. On Linux or Windows, point `--obsidian-path` at your Obsidian binary.
- **ffmpeg**, only for the three recording tools (`brew install ffmpeg`)

## Install

### Claude Code

```bash
claude mcp add obsidian-live -- npx live-mcp-for-obsidian
```

To pin it to one vault:

```bash
claude mcp add obsidian-live -- npx live-mcp-for-obsidian --vault "My Vault"
```

This makes the server available in every Claude Code session. To limit it to one project, add `--scope project`, which writes to `.mcp.json` in the current folder.

### Claude Desktop

Add this to `claude_desktop_config.json`:

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

To pin it to one vault, change `args` to `["live-mcp-for-obsidian", "--vault", "My Vault"]`.

### From source

```bash
git clone https://github.com/gapmiss/live-mcp-for-obsidian.git
cd live-mcp-for-obsidian
npm install
npm run build
claude mcp add obsidian-live -- node ./build/cli.js
```

### Options

| Flag              | Default                                              | What it does                   |
| ----------------- | ---------------------------------------------------- | ------------------------------ |
| `--obsidian-path` | `/Applications/Obsidian.app/Contents/MacOS/Obsidian` | Where the Obsidian binary is   |
| `--vault`, `-v`   | Obsidian's active vault                              | Which vault to work with       |

## What you can ask for

> "Give me a briefing"
> "Append 'Called the dentist' to today's daily note"
> "What are my open tasks in Projects/?"
> "Reload my-plugin and show me any console errors"
> "Screenshot the left sidebar"
> "What CSS is applied to `.workspace-leaf`?"
> "Start recording, open the graph view, then stop"
> "Toggle mobile emulation"

The [user guide](USER-GUIDE.md) walks through each area, with tips on screenshots, recording, multiple vaults, token usage, and troubleshooting.

## Tools

| Area               | Tools |
| ------------------ | ----- |
| Status             | `obsidian_status`, `obsidian_vaults` |
| Workspace          | `obsidian_tabs`, `obsidian_workspace`, `obsidian_open` |
| Files              | `obsidian_files`, `obsidian_read`, `obsidian_create`, `obsidian_append`, `obsidian_prepend`, `obsidian_delete`, `obsidian_move`, `obsidian_search` |
| Notes and metadata | `obsidian_properties`, `obsidian_property_set`, `obsidian_tags`, `obsidian_links`, `obsidian_backlinks`, `obsidian_outline`, `obsidian_tasks`, `obsidian_daily`, `obsidian_daily_append` |
| Plugins            | `obsidian_plugins`, `obsidian_plugin_info`, `obsidian_plugin_enable`, `obsidian_plugin_disable`, `obsidian_plugin_reload`, `obsidian_commands`, `obsidian_command` |
| Themes             | `obsidian_theme`, `obsidian_themes`, `obsidian_snippets` |
| Developer          | `obsidian_eval`, `obsidian_dom`, `obsidian_console`, `obsidian_errors`, `obsidian_screenshot`, `obsidian_css`, `obsidian_cdp`, `obsidian_debug`, `obsidian_mobile`, `obsidian_devtools` |
| Briefing           | `obsidian_briefing` |
| Recording          | `obsidian_record`, `obsidian_start_recording`, `obsidian_stop_recording` |

Every tool's parameters are listed in the [tool reference](USER-GUIDE.md#tool-reference).

## How it works

Obsidian ships with a command-line interface that talks to the running app. This server wraps it. Each tool call becomes one or more CLI calls:

```
obsidian_read { file: "My Note" }
  → obsidian read file="My Note"

obsidian_plugin_reload { id: "my-plugin" }
  → obsidian plugin:reload id=my-plugin
```

Screenshots and recordings go through the Chrome DevTools Protocol, which the CLI also exposes.

The server communicates with your MCP client over stdio. It doesn't open any ports.

### Remote use

Because everything runs through a local CLI, SSH is all you need for remote access. SSH into the machine running Obsidian, start Claude Code there, and every tool works. There's no HTTP server or tunnel to set up.

## FAQ

**Is it safe?**
It runs locally with no network listener. Your MCP client shows you each tool call before it runs, and you can deny any of them. `obsidian_eval` and `obsidian_cdp` can do almost anything inside Obsidian, so read those calls before approving them. See [SECURITY.md](SECURITY.md).

**Why include `obsidian_eval` at all?**
The other 45 tools cover the common tasks. Eval covers everything else, and it's what makes requests like "click that button" possible.

**Can I turn off the powerful tools?**
Deny them when your client asks. In Claude Code you can also pre-approve only the tools you're comfortable with. See [Permissions and safety](USER-GUIDE.md#permissions-and-safety).

**Does it cost a lot of tokens?**
Usually not. Most tools return a few words or a short list. The exceptions are big reads and vault-wide listings. The guide covers [how to keep them small](USER-GUIDE.md#keeping-token-usage-low).

## License

MIT

# User guide

This guide covers everything you need to use live-mcp-for-obsidian day to day. If you haven't installed it yet, start with the [README](README.md#install).

- [Before you start](#before-you-start)
- [Your first session](#your-first-session)
- [How to point at a file](#how-to-point-at-a-file)
- [Working with notes](#working-with-notes)
- [Plugins and commands](#plugins-and-commands)
- [Themes and CSS](#themes-and-css)
- [Driving the UI](#driving-the-ui)
- [Screenshots](#screenshots)
- [Screen recording](#screen-recording)
- [Multiple vaults](#multiple-vaults)
- [Keeping token usage low](#keeping-token-usage-low)
- [Permissions and safety](#permissions-and-safety)
- [Troubleshooting](#troubleshooting)
- [Tool reference](#tool-reference)

## Before you start

You need three things:

1. **Obsidian 1.12.4 or later, open and running.** The server talks to the live app, so Obsidian has to be open with the vault you want loaded.
2. **Node.js 18 or later.**
3. **ffmpeg**, but only if you want screen recordings. Install it with `brew install ffmpeg` on macOS.

To check that the Obsidian CLI works on your machine, run this in a terminal:

```bash
/Applications/Obsidian.app/Contents/MacOS/Obsidian version
```

If that prints a version number, you're set. If Obsidian lives somewhere else, use that path here and pass it to the server with `--obsidian-path`.

## Your first session

Ask your assistant for a briefing:

> "Give me a briefing on my Obsidian vault"

This calls `obsidian_briefing`, which returns:

- the file you have open
- your open tabs
- whether today's daily note exists yet (it checks without creating it)
- the 10 most recently modified notes
- how many markdown notes are in the vault
- the contents of `CLAUDE.md` at the vault root, if you have one

It costs a few hundred tokens and saves the assistant from asking a string of questions.

### Using a vault CLAUDE.md

If you create a note called `CLAUDE.md` at the root of your vault, the briefing includes it every time. Use it for standing instructions, for example:

```markdown
- Daily notes live in Journal/. Use the format YYYY-MM-DD.
- New meeting notes go in Meetings/ and use the "Meeting" template.
- Never delete anything in Archive/.
```

Keep it short. The whole file is sent on every briefing.

## How to point at a file

Most tools accept either `file` or `path`:

- **`file`** matches by name, the same way a `[[wikilink]]` does. `file: "Meeting Notes"` finds `Work/2026/Meeting Notes.md`.
- **`path`** is the exact path from the vault root, including the extension: `path: "Work/2026/Meeting Notes.md"`.

If you leave both out, most tools act on **the file you have open in Obsidian**. That means you can say "what tags does this note have?" and it just works.

When writing content, use `\n` for a new line and `\t` for a tab.

## Working with notes

### Reading and finding

> "What's in my Projects folder?"
> "Read my 'Roadmap' note"
> "Find notes with 'invoice' in the name"

`obsidian_files` lists files and can filter by `folder` or `ext`. `obsidian_read` returns a note's full text.

`obsidian_search` matches the **file name or path** of markdown notes. It's case-sensitive and does not search inside notes. To find text inside notes, ask the assistant to use `obsidian_eval` or read the likely candidates.

### Writing

> "Create a note called 'Standup' in Meetings/ using my Meeting template"
> "Add '- [ ] Email Sam' to the end of my Roadmap note"
> "Move Inbox/idea.md to Projects/"

`obsidian_create` can use a template, overwrite an existing file, and open the new note. `obsidian_append` and `obsidian_prepend` add text to the end or start of a note. Pass `inline: true` to join onto the existing line instead of starting a new one.

`obsidian_delete` sends files to the system trash. It only skips the trash if `permanent: true` is set.

### Daily notes

> "Read today's daily note"
> "Append 'Called the dentist' to my daily note"
> "What tasks are on today's daily note?"

`obsidian_daily` opens today's note (with `read: true` it returns the text instead). `obsidian_daily_append` adds to it. Both rely on Obsidian's Daily notes core plugin being enabled.

### Tags, properties, links, and tasks

> "List all tags, most used first"
> "Set status to done on this note"
> "What links to 'Project Alpha'?"
> "Show my open tasks across the vault"

| Question                         | Tool                    |
| -------------------------------- | ----------------------- |
| Which tags exist, and how often? | `obsidian_tags`         |
| What's in this note's frontmatter? | `obsidian_properties` |
| Change a frontmatter value       | `obsidian_property_set` |
| What does this note link to?     | `obsidian_links`        |
| What links to this note?         | `obsidian_backlinks`    |
| What are this note's headings?   | `obsidian_outline`      |
| What tasks are open or done?     | `obsidian_tasks`        |

`obsidian_property_set` accepts a `type` (`text`, `list`, `number`, `checkbox`, `date`, `datetime`) so the property shows up correctly in Obsidian.

## Plugins and commands

> "Which community plugins do I have enabled?"
> "Disable the calendar plugin"
> "Reload my-plugin"
> "What commands does the templater plugin add?"
> "Run the command that opens the local graph"

Plugin tools take a plugin **ID** (like `calendar` or `obsidian-git`), not its display name. `obsidian_plugins` shows the IDs.

`obsidian_commands` lists command IDs. Use `filter` with a prefix like `daily-notes` to narrow it down. `obsidian_command` runs one by ID.

### For plugin developers

A typical loop looks like this:

1. Rebuild your plugin.
2. "Reload my-plugin and show me any errors."
3. "Take a screenshot of `.my-plugin-view`."
4. "What CSS is applied to `.my-plugin-view .header`?"

`obsidian_plugin_reload`, `obsidian_errors`, `obsidian_console`, `obsidian_screenshot`, and `obsidian_css` cover most of it. `obsidian_mobile` switches on mobile emulation so you can check small-screen layouts without a phone.

## Themes and CSS

> "Which theme am I using?"
> "List my CSS snippets"
> "What's the computed color of `.nav-file-title`?"
> "Where is the padding on `.workspace-leaf` coming from?"

`obsidian_css` shows the rules that apply to a selector along with the stylesheet each one comes from. `obsidian_dom` with `css: "color"` returns a single computed value.

## Driving the UI

> "Click the sync icon in the status bar"
> "Open the command palette"
> "Collapse the left sidebar"

There's no dedicated "click" tool. The assistant uses `obsidian_eval` to run JavaScript inside Obsidian, which can click elements, fill in inputs, and call Obsidian's `app` API. It usually finds the right element with `obsidian_dom` first.

It helps to describe things the way they appear on screen ("the gear icon at the bottom left") or to give a CSS selector if you know one.

## Screenshots

> "Take a screenshot"
> "Screenshot just the left sidebar"
> "Take a JPEG screenshot at quality 80"

`obsidian_screenshot` saves an image and returns the file path. By default it goes to your system's temp folder. Pass `path` to save it somewhere else.

To capture one element, pass a CSS `selector`. Obsidian often keeps hidden copies of the same element, so the tool picks the first one that's actually visible.

Formats are `png` (default), `jpeg`, and `webp`. `quality` (1 to 100) applies to JPEG and WebP only.

## Screen recording

Recording needs `ffmpeg` on your `PATH`.

There are two ways to record.

**Fixed length.** Use this when you know how long you need:

> "Record Obsidian for 10 seconds as a GIF"

`obsidian_record` captures for `duration` seconds (1 to 120), then encodes. The call doesn't return until it's done.

**Start and stop.** Use this when you want to record something the assistant is doing:

> "Start recording, open the graph view, zoom in, then stop recording"

`obsidian_start_recording` returns a session ID. The assistant does its work, then calls `obsidian_stop_recording` with that ID.

Options for both:

| Option   | Values                  | Default |
| -------- | ----------------------- | ------- |
| `fps`    | 1 to 15                 | 5       |
| `format` | `mp4`, `webm`, `gif`    | `mp4`   |
| `output` | a file path             | see below |

GIFs are capped at 10 fps to keep the file size sane.

**Where recordings go.** Without `output`, the file is saved in the directory the server was started from:

- `obsidian_record` saves `recording.mp4` (or `.webm`/`.gif`), **replacing any earlier recording with the same name**.
- `obsidian_stop_recording` saves `recording-rec-<timestamp>.mp4`.

Some clients start the server in a folder you can't write to. To be safe, ask for a full path: "record for 5 seconds and save it to ~/Desktop/demo.mp4".

**Things to know:**

- If your MCP client gives up on long requests, a long `obsidian_record` may look like it failed even though it finished. Use start/stop for anything longer than a few seconds.
- If Obsidian is busy and a frame can't be captured, that frame is skipped. You get a shorter video instead of an error.
- If no frames were captured at all, you get an error asking whether Obsidian is running.
- Recording sessions live in the server's memory. If the server restarts mid-recording, that session is gone.

## Multiple vaults

By default the server works with whichever vault Obsidian considers active. To pin it to one vault, add `--vault "Vault Name"` when you register it. See the [README](README.md#install) for examples.

`obsidian_vaults` lists every vault Obsidian knows about.

You can register the server more than once with different names (`obsidian-work`, `obsidian-personal`), each pinned to a different vault.

## Keeping token usage low

Every tool call costs tokens: the request, and whatever comes back. Most tools in this server return very little. Write operations reply with a word or two ("Created", "Enabled"), and screenshots return just a file path.

A few tools can return a lot, depending on your vault:

| Tool                | What makes it big      | How to shrink it                                          |
| ------------------- | ---------------------- | --------------------------------------------------------- |
| `obsidian_files`    | Number of files        | Use `folder` or `ext`, or `total: true` for just a count   |
| `obsidian_read`     | Length of the note     | Nothing built in. Long notes come back in full.            |
| `obsidian_tasks`    | Tasks across the vault | Use `file`, `path`, `active`, `daily`, `todo`, or `done`   |
| `obsidian_commands` | Installed plugins      | Use `filter` with a command ID prefix                      |
| `obsidian_dom`      | Size of the page       | Use `text: true`, and avoid `all: true` on broad selectors |
| `obsidian_eval`, `obsidian_cdp` | Whatever the code returns | Return only what you need                   |
| `obsidian_briefing` | Your vault CLAUDE.md   | Keep CLAUDE.md short                                       |

Handy options:

- **`total: true`** returns a count instead of a list. Works on `obsidian_files`, `obsidian_links`, and `obsidian_backlinks`.
- **`active: true`** limits `obsidian_tasks`, `obsidian_tags`, and `obsidian_properties` to the open note. `obsidian_tasks` also takes `daily: true`.
- **`format`** gives compact tables on list tools. `tsv` works on tags, tasks, properties, plugins, and backlinks. `csv` works on all of those except properties.
- **`limit`** caps `obsidian_console` (it defaults to 50 messages).

In practice: start with a briefing, filter lists, and ask for counts when a count is all you need.

## Permissions and safety

Your MCP client decides which tool calls run. Claude Code and Claude Desktop both show you the tool name and its arguments and let you approve or deny it.

The two tools worth paying attention to are:

- **`obsidian_eval`** runs any JavaScript inside Obsidian. It can do anything Obsidian can do, including changing or deleting files.
- **`obsidian_cdp`** sends raw Chrome DevTools Protocol commands to the Obsidian window.

Read these before approving them. Everything else does what its name says.

In Claude Code, you can pre-approve the read-only tools so they stop prompting. Add entries like these to `permissions.allow` in your settings:

```json
"mcp__obsidian-live__obsidian_read",
"mcp__obsidian-live__obsidian_files",
"mcp__obsidian-live__obsidian_briefing"
```

The prefix matches the name you registered the server with.

See [SECURITY.md](SECURITY.md) for the full trust model.

## Troubleshooting

**"Obsidian CLI timed out (10s)"**
Each call to Obsidian gets 10 seconds. Make sure Obsidian is open and not stuck on a dialog. Very large vaults can make vault-wide listings slow, so try a filter.

**Tools fail with a "not found" or "spawn" error**
The server can't find the Obsidian binary. Pass the right location with `--obsidian-path`. On Linux and Windows you always need to set this, since the default is the macOS path.

**It's working on the wrong vault**
Add `--vault "Vault Name"` to the server config, or switch vaults in Obsidian.

**"ffmpeg failed"**
Install ffmpeg and make sure your MCP client can see it on its `PATH`. Apps launched from the Dock sometimes don't get the same `PATH` as your terminal.

**"No frames captured. Is Obsidian running?"**
Every frame failed. Check that Obsidian is open and responsive.

**Search finds nothing**
`obsidian_search` only matches file names and paths, and it's case-sensitive. See [Reading and finding](#reading-and-finding).

**Daily note tools don't work**
Turn on the Daily notes core plugin in Obsidian's settings.

## Tool reference

Parameters marked with `*` are required. Unless noted, `file` and `path` are optional and default to the open note.

### Status

| Tool              | What it does                                    | Parameters |
| ----------------- | ----------------------------------------------- | ---------- |
| `obsidian_status` | Obsidian version, vault name, path, counts, size | none      |
| `obsidian_vaults` | Every vault Obsidian knows about               | none       |

### Workspace

| Tool                 | What it does                                   | Parameters                  |
| -------------------- | ---------------------------------------------- | --------------------------- |
| `obsidian_tabs`      | Open tabs in the main editor                   | `ids`, `all` (include sidebars) |
| `obsidian_workspace` | The full workspace layout as a tree            | `ids`                       |
| `obsidian_open`      | Open a file                                    | `file`, `path`, `newtab`    |

### Files

| Tool               | What it does                              | Parameters                                                   |
| ------------------ | ----------------------------------------- | ------------------------------------------------------------ |
| `obsidian_files`   | List files                                | `folder`, `ext`, `total`                                     |
| `obsidian_read`    | Read a file                               | `file`, `path`                                               |
| `obsidian_create`  | Create a file                             | `name`, `path`, `content`, `template`, `overwrite`, `open`   |
| `obsidian_append`  | Add text to the end                       | `file`, `path`, `content`*, `inline`                         |
| `obsidian_prepend` | Add text to the start                     | `file`, `path`, `content`*, `inline`                         |
| `obsidian_delete`  | Move to trash, or delete for good         | `file`, `path`, `permanent`                                  |
| `obsidian_move`    | Move or rename                            | `file`, `path`, `to`*                                        |
| `obsidian_search`  | Find notes by name or path (case-sensitive) | `query`*                                                   |

### Notes and metadata

| Tool                    | What it does                   | Parameters                                                              |
| ----------------------- | ------------------------------ | ----------------------------------------------------------------------- |
| `obsidian_properties`   | List frontmatter properties    | `file`, `path`, `name`, `total`, `counts`, `format` (yaml/json/tsv), `active` |
| `obsidian_property_set` | Set a property                 | `name`*, `value`*, `type`, `file`, `path`                               |
| `obsidian_tags`         | List tags                      | `file`, `path`, `counts`, `sort` (count), `format` (json/tsv/csv), `active` |
| `obsidian_links`        | Outgoing links from a note     | `file`, `path`, `total`                                                 |
| `obsidian_backlinks`    | Notes that link to a note      | `file`, `path`, `counts`, `total`, `format` (json/tsv/csv)              |
| `obsidian_outline`      | A note's headings              | `file`, `path`, `format` (tree/md/json)                                 |
| `obsidian_tasks`        | List tasks                     | `file`, `path`, `done`, `todo`, `verbose`, `format` (json/tsv/csv), `active`, `daily` |
| `obsidian_daily`        | Open today's note, or read it  | `read`                                                                  |
| `obsidian_daily_append` | Add text to today's note       | `content`*, `inline`                                                    |

### Plugins and commands

| Tool                      | What it does                   | Parameters                                          |
| ------------------------- | ------------------------------ | --------------------------------------------------- |
| `obsidian_plugins`        | List plugins and their state   | `filter` (core/community), `versions`, `format` (json/tsv/csv) |
| `obsidian_plugin_info`    | Details about one plugin       | `id`*                                               |
| `obsidian_plugin_enable`  | Turn a plugin on               | `id`*                                               |
| `obsidian_plugin_disable` | Turn a plugin off              | `id`*                                               |
| `obsidian_plugin_reload`  | Reload a plugin                | `id`*                                               |
| `obsidian_commands`       | List command IDs               | `filter` (ID prefix)                                |
| `obsidian_command`        | Run a command                  | `id`*                                               |

### Themes

| Tool                | What it does                               | Parameters |
| ------------------- | ------------------------------------------ | ---------- |
| `obsidian_theme`    | The active theme, or details on one theme  | `name`     |
| `obsidian_themes`   | List installed themes                      | `versions` |
| `obsidian_snippets` | List CSS snippets                          | none       |

### Developer tools

| Tool                  | What it does                                  | Parameters                                   |
| --------------------- | --------------------------------------------- | -------------------------------------------- |
| `obsidian_eval`       | Run JavaScript in Obsidian                    | `code`*                                      |
| `obsidian_dom`        | Look up elements by CSS selector              | `selector`*, `text`, `all`, `attr`, `css`    |
| `obsidian_console`    | Recent console messages                       | `level`, `limit` (default 50), `clear`       |
| `obsidian_errors`     | Recent errors                                 | `clear`                                      |
| `obsidian_screenshot` | Save a screenshot, return its path            | `path`, `selector`, `format`, `quality`      |
| `obsidian_css`        | CSS rules for a selector, with their sources  | `selector`*, `prop`                          |
| `obsidian_cdp`        | Send a Chrome DevTools Protocol command       | `method`*, `params` (JSON string)            |
| `obsidian_debug`      | Attach or detach the CDP debugger             | `on`, `off`                                  |
| `obsidian_mobile`     | Turn mobile emulation on or off               | `on`, `off`                                  |
| `obsidian_devtools`   | Open or close Obsidian's DevTools window      | none                                         |

### Briefing

| Tool                | What it does                         | Parameters |
| ------------------- | ------------------------------------ | ---------- |
| `obsidian_briefing` | A snapshot of where things stand     | none       |

### Recording

| Tool                       | What it does                             | Parameters                                   |
| -------------------------- | ---------------------------------------- | -------------------------------------------- |
| `obsidian_record`          | Record for a set time, then encode       | `duration`* (1 to 120), `fps`, `format`, `output` |
| `obsidian_start_recording` | Start recording, return a session ID     | `fps`                                        |
| `obsidian_stop_recording`  | Stop, encode, and return the file path   | `session`*, `format`, `output`               |

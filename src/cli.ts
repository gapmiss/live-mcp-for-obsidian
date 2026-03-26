#!/usr/bin/env node

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { createServer } from "./index.js";

const argv = await yargs(hideBin(process.argv))
  .option("obsidian-path", {
    type: "string",
    default: "/Applications/Obsidian.app/Contents/MacOS/Obsidian",
    describe: "Path to Obsidian binary",
  })
  .option("vault", {
    alias: "v",
    type: "string",
    describe: "Target a specific vault by name",
  })
  .help()
  .parseAsync();

const server = createServer({
  obsidianPath: argv["obsidian-path"],
  vault: argv.vault,
});

const transport = new StdioServerTransport();
await server.connect(transport);

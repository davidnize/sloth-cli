#!/usr/bin/env node

import { pathToFileURL } from "node:url";

const COMMANDS = new Set(["tidy", "digest", "cards"]);

function usage() {
  return `Usage: sloth <command>

Commands:
  tidy
  digest
  cards`;
}

export function run(argv = process.argv.slice(2), io = console) {
  const [command] = argv;

  if (!command || command === "--help") {
    io.log(usage());
    return 0;
  }

  if (!COMMANDS.has(command)) {
    io.error(usage());
    return 1;
  }

  io.log("not implemented yet");
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = run();
}

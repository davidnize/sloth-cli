#!/usr/bin/env node

import { pathToFileURL } from "node:url";
import { tidy } from "./tidy.js";
import { digest } from "./digest.js";

const COMMANDS = new Set(["tidy", "digest"]);

function usage() {
  return `Usage: sloth <command>

Commands:
  tidy <folder> [--apply]
  digest <file>`;
}

export async function run(argv = process.argv.slice(2), io = console) {
  const [command] = argv;

  if (!command || command === "--help") {
    io.log(usage());
    return 0;
  }

  if (!COMMANDS.has(command)) {
    io.error(usage());
    return 1;
  }

  if (command === "tidy") {
    const args = argv.slice(1);
    let folder;
    let apply = false;

    for (const arg of args) {
      if (arg === "--apply") {
        apply = true;
        continue;
      }
      if (arg.startsWith("-") || folder) {
        io.error(usage());
        return 1;
      }
      folder = arg;
    }

    if (!folder) {
      io.error(usage());
      return 1;
    }

    await tidy(folder, { apply, io });
    return 0;
  }

  if (command === "digest") {
    const args = argv.slice(1);
    if (args.length !== 1) {
      io.error("Missing file path. Usage: sloth digest <file>");
      return 1;
    }

    try {
      await digest(args[0], { io });
      return 0;
    } catch (error) {
      io.error(error?.message ?? String(error));
      return 1;
    }
  }

  io.log("not implemented yet");
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  run()
    .then((exitCode) => {
      process.exitCode = exitCode;
    })
    .catch((error) => {
      console.error(error?.message ?? String(error));
      process.exitCode = 1;
    });
}

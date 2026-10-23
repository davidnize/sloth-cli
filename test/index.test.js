import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const cliPath = path.resolve(__dirname, "../src/index.js");

function runCli(args) {
  return spawnSync(process.execPath, [cliPath, ...args], { encoding: "utf8" });
}

test("supported non-tidy commands print not implemented yet", () => {
  for (const command of ["cards"]) {
    const result = runCli([command]);
    assert.equal(result.status, 0);
    assert.match(result.stdout, /not implemented yet/);
  }
});

test("tidy without folder prints usage and fails", () => {
  const result = runCli(["tidy"]);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Usage: sloth <command>/);
});

test("--help prints usage", () => {
  const result = runCli(["--help"]);
  assert.equal(result.status, 0);
  assert.match(result.stdout, /Usage: sloth <command>/);
});

test("unknown commands print usage and fail", () => {
  const result = runCli(["unknown"]);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Usage: sloth <command>/);
});

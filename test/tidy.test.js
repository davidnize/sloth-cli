import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { tidy } from "../src/tidy.js";

async function createTempFolder() {
  return fs.mkdtemp(path.join(os.tmpdir(), "sloth-tidy-test-"));
}

test("tidy dry run prints planned moves and changes nothing", async () => {
  const folder = await createTempFolder();
  const logs = [];
  await fs.writeFile(path.join(folder, "report.pdf"), "content");
  await fs.writeFile(path.join(folder, "photo.jpg"), "content");
  await fs.mkdir(path.join(folder, "nested"));
  await fs.writeFile(path.join(folder, ".hidden.txt"), "secret");

  await tidy(folder, {
    io: { log: (line) => logs.push(line) },
    askFn: async (prompt) => (prompt.includes("photo.jpg") ? "Images" : "Documents"),
  });

  assert.deepEqual(logs, ["photo.jpg -> Images/photo.jpg", "report.pdf -> Documents/report.pdf"]);
  assert.equal(await fs.stat(path.join(folder, "report.pdf")).then(() => true), true);
  assert.equal(await fs.stat(path.join(folder, "photo.jpg")).then(() => true), true);
  await assert.rejects(() => fs.stat(path.join(folder, "Documents")), /ENOENT/);
  await assert.rejects(() => fs.stat(path.join(folder, "Images")), /ENOENT/);
  await fs.rm(folder, { recursive: true, force: true });
});

test("tidy --apply creates folders and moves files", async () => {
  const folder = await createTempFolder();
  const logs = [];
  await fs.writeFile(path.join(folder, "report.pdf"), "content");

  await tidy(folder, {
    apply: true,
    io: { log: (line) => logs.push(line) },
    askFn: async () => "Documents",
  });

  assert.deepEqual(logs, [
    "report.pdf -> Documents/report.pdf",
    "Tip: run `sloth tidy <folder>` without --apply first to preview moves.",
  ]);
  assert.equal(await fs.readFile(path.join(folder, "Documents", "report.pdf"), "utf8"), "content");
  await assert.rejects(() => fs.stat(path.join(folder, "report.pdf")), /ENOENT/);
  await fs.rm(folder, { recursive: true, force: true });
});

test("tidy falls back to extension category when model answer is invalid", async () => {
  const folder = await createTempFolder();
  await fs.writeFile(path.join(folder, "script.js"), "console.log('x')");

  await tidy(folder, {
    apply: true,
    io: { log: () => {} },
    askFn: async () => "UnknownCategory",
  });

  assert.equal(await fs.readFile(path.join(folder, "Code", "script.js"), "utf8"), "console.log('x')");
  await fs.rm(folder, { recursive: true, force: true });
});

test("tidy never overwrites existing files", async () => {
  const folder = await createTempFolder();
  const logs = [];
  await fs.writeFile(path.join(folder, "song.mp3"), "original");
  await fs.mkdir(path.join(folder, "Audio"), { recursive: true });
  await fs.writeFile(path.join(folder, "Audio", "song.mp3"), "existing");

  await tidy(folder, {
    apply: true,
    io: { log: (line) => logs.push(line) },
    askFn: async () => "Audio",
  });

  assert.deepEqual(logs, [
    "song.mp3 -> Audio/song.mp3 (skipped: target exists)",
    "Tip: run `sloth tidy <folder>` without --apply first to preview moves.",
  ]);
  assert.equal(await fs.readFile(path.join(folder, "song.mp3"), "utf8"), "original");
  assert.equal(await fs.readFile(path.join(folder, "Audio", "song.mp3"), "utf8"), "existing");
  await fs.rm(folder, { recursive: true, force: true });
});

test("same input produces the same plan twice with mocked ask", async () => {
  const folder = await createTempFolder();
  const firstLogs = [];
  const secondLogs = [];
  let askCalls = 0;
  await fs.writeFile(path.join(folder, "holiday-selfie"), "content");
  await fs.writeFile(path.join(folder, "notes.txt"), "content");

  const askFn = async (prompt) => {
    askCalls += 1;
    if (prompt.includes("holiday-selfie")) {
      return "Images";
    }
    return "Documents";
  };

  await tidy(folder, { io: { log: (line) => firstLogs.push(line) }, askFn });
  await tidy(folder, { io: { log: (line) => secondLogs.push(line) }, askFn });

  assert.deepEqual(firstLogs, secondLogs);
  assert.equal(askCalls, 4);
  await fs.rm(folder, { recursive: true, force: true });
});

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { digest } from "../src/digest.js";

async function createTempFolder() {
  return fs.mkdtemp(path.join(os.tmpdir(), "sloth-digest-test-"));
}

test("digest prints exactly two lines from model response", async () => {
  const folder = await createTempFolder();
  const filePath = path.join(folder, "chat.txt");
  const logs = [];
  await fs.writeFile(filePath, "Team discussed launch timeline.");

  await digest(filePath, {
    io: { log: (line) => logs.push(line) },
    askFn: async () => "Launch planning\nPrepare release checklist by Friday",
  });

  assert.deepEqual(logs, ["Launch planning", "Prepare release checklist by Friday"]);
  await fs.rm(folder, { recursive: true, force: true });
});

test("digest trims long input and prints trim note", async () => {
  const folder = await createTempFolder();
  const filePath = path.join(folder, "notes.txt");
  const logs = [];
  const prefix = "A".repeat(200);
  const tail = "B".repeat(6000);
  let capturedPrompt = "";
  await fs.writeFile(filePath, `${prefix}${tail}`);

  await digest(filePath, {
    io: { log: (line) => logs.push(line) },
    askFn: async (prompt) => {
      capturedPrompt = prompt;
      return "Topic\nNo action needed";
    },
  });

  assert.equal(logs[0], "Note: file was trimmed to the last 6000 characters.");
  assert.deepEqual(logs.slice(1), ["Topic", "No action needed"]);
  assert.ok(capturedPrompt.includes(tail));
  assert.equal(capturedPrompt.includes(prefix), false);
  await fs.rm(folder, { recursive: true, force: true });
});

test("digest keeps only first two non-empty lines when model returns extra lines", async () => {
  const folder = await createTempFolder();
  const filePath = path.join(folder, "chat.txt");
  const logs = [];
  await fs.writeFile(filePath, "Status update");

  await digest(filePath, {
    io: { log: (line) => logs.push(line) },
    askFn: async () =>
      "\nMain topic\n\nAction item due Monday\nExtra detail should be ignored\nAnother line",
  });

  assert.deepEqual(logs, ["Main topic", "Action item due Monday"]);
  await fs.rm(folder, { recursive: true, force: true });
});

test("digest fails when file path is missing", async () => {
  await assert.rejects(() => digest(), /Missing file path/);
});

test("digest fails when file does not exist", async () => {
  const missingPath = path.join(os.tmpdir(), `sloth-missing-${Date.now()}.txt`);
  await assert.rejects(() => digest(missingPath), /File does not exist/);
});

test("digest fails when file is empty", async () => {
  const folder = await createTempFolder();
  const filePath = path.join(folder, "empty.txt");
  await fs.writeFile(filePath, "   \n\t");

  await assert.rejects(() => digest(filePath), /File is empty/);
  await fs.rm(folder, { recursive: true, force: true });
});

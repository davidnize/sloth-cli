import fs from "node:fs/promises";
import { ask } from "./ollama.js";

const MAX_DIGEST_CHARS = 6000;

function buildPrompt(text) {
  return (
    "Summarize the text below in exactly two short lines.\n" +
    "Line 1: main topic.\n" +
    'Line 2: any decision, task, or deadline mentioned. If none, write exactly "No action needed".\n' +
    "Return only those two lines.\n\n" +
    `Text:\n${text}`
  );
}

function firstTwoNonEmptyLines(text) {
  const lines = String(text ?? "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 2);

  return [lines[0] ?? "Main topic unclear", lines[1] ?? "No action needed"];
}

export async function digest(filePath, { io = console, askFn = ask } = {}) {
  if (!filePath) {
    throw new Error("Missing file path. Usage: sloth digest <file>");
  }

  let content;
  try {
    content = await fs.readFile(filePath, "utf8");
  } catch (error) {
    if (error?.code === "ENOENT") {
      throw new Error(`File does not exist: ${filePath}`);
    }
    throw error;
  }

  if (!content.trim()) {
    throw new Error(`File is empty: ${filePath}`);
  }

  let input = content;
  if (input.length > MAX_DIGEST_CHARS) {
    io.log("Note: file was trimmed to the last 6000 characters.");
    input = input.slice(-MAX_DIGEST_CHARS);
  }

  const response = await askFn(buildPrompt(input));
  const [line1, line2] = firstTwoNonEmptyLines(response);
  io.log(line1);
  io.log(line2);
}

import fs from "node:fs/promises";
import path from "node:path";
import { ask } from "./ollama.js";

const CATEGORIES = ["Documents", "Images", "Videos", "Audio", "Archives", "Code", "Other"];

const EXTENSION_CATEGORIES = new Map([
  [".pdf", "Documents"],
  [".doc", "Documents"],
  [".docx", "Documents"],
  [".txt", "Documents"],
  [".md", "Documents"],
  [".rtf", "Documents"],
  [".csv", "Documents"],
  [".xls", "Documents"],
  [".xlsx", "Documents"],
  [".ppt", "Documents"],
  [".pptx", "Documents"],
  [".jpg", "Images"],
  [".jpeg", "Images"],
  [".png", "Images"],
  [".gif", "Images"],
  [".webp", "Images"],
  [".svg", "Images"],
  [".bmp", "Images"],
  [".mp4", "Videos"],
  [".mkv", "Videos"],
  [".mov", "Videos"],
  [".avi", "Videos"],
  [".webm", "Videos"],
  [".mp3", "Audio"],
  [".wav", "Audio"],
  [".flac", "Audio"],
  [".ogg", "Audio"],
  [".m4a", "Audio"],
  [".zip", "Archives"],
  [".tar", "Archives"],
  [".gz", "Archives"],
  [".tgz", "Archives"],
  [".rar", "Archives"],
  [".7z", "Archives"],
  [".js", "Code"],
  [".mjs", "Code"],
  [".cjs", "Code"],
  [".ts", "Code"],
  [".tsx", "Code"],
  [".jsx", "Code"],
  [".py", "Code"],
  [".go", "Code"],
  [".java", "Code"],
  [".rb", "Code"],
  [".rs", "Code"],
  [".c", "Code"],
  [".cpp", "Code"],
  [".h", "Code"],
  [".hpp", "Code"],
  [".json", "Code"],
  [".yaml", "Code"],
  [".yml", "Code"],
  [".toml", "Code"],
  [".xml", "Code"],
  [".html", "Code"],
  [".css", "Code"],
  [".sh", "Code"],
]);

function categoryFromExtension(extension) {
  return EXTENSION_CATEGORIES.get(extension) ?? "Other";
}

function categoryFromModelAnswer(answer) {
  if (typeof answer !== "string") {
    return null;
  }
  const normalized = answer.trim();
  return CATEGORIES.includes(normalized) ? normalized : null;
}

async function pickCategory(fileName, extension, askFn) {
  const prompt =
    `Choose exactly one category for this file.\n` +
    `Documents: text files, reports, spreadsheets, and presentations.\n` +
    `Images: photos, graphics, screenshots, and illustrations.\n` +
    `Videos: movies, clips, screen recordings, and animations.\n` +
    `Audio: music, podcasts, voice notes, and sound clips.\n` +
    `Archives: compressed bundles and package archives.\n` +
    `Code: source code, markup, config, and scripts.\n` +
    `Other: anything that does not fit the categories above.\n` +
    `Examples: holiday-selfie -> Images, lecture-recording -> Videos, meeting-notes -> Documents.\n` +
    `Categories: ${CATEGORIES.join(", ")}\n` +
    `File name: ${fileName}\n` +
    `Extension: ${extension || "(none)"}\n` +
    `Answer with the category name only.`;

  try {
    const modelCategory = categoryFromModelAnswer(await askFn(prompt));
    if (modelCategory) {
      return modelCategory;
    }
  } catch {
    // Fallback handled below.
  }

  return categoryFromExtension(extension);
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function tidy(folder, { apply = false, io = console, askFn = ask } = {}) {
  const entries = await fs.readdir(folder, { withFileTypes: true });
  const visibleFiles = entries.filter((entry) => entry.isFile() && !entry.name.startsWith("."));
  const plannedMoves = [];

  for (const entry of visibleFiles) {
    const fileName = entry.name;
    const extension = path.extname(fileName).toLowerCase();
    const category = await pickCategory(fileName, extension, askFn);
    plannedMoves.push({ fileName, category });
  }

  for (const plan of plannedMoves) {
    const fileName = plan.fileName;
    const category = plan.category;
    const destination = `${category}/${fileName}`;
    const targetPath = path.join(folder, category, fileName);

    if (await fileExists(targetPath)) {
      io.log(`${fileName} -> ${destination} (skipped: target exists)`);
      continue;
    }

    io.log(`${fileName} -> ${destination}`);

    if (apply) {
      await fs.mkdir(path.join(folder, category), { recursive: true });
      await fs.rename(path.join(folder, fileName), targetPath);
    }
  }

  if (apply) {
    io.log("Tip: run `sloth tidy <folder>` without --apply first to preview moves.");
  }
}

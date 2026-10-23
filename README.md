# sloth-cli

A lazy local AI command-line tool powered by Gemma and Ollama. It does small chores for you, entirely on your own machine: no cloud, no API keys, no cost.

## Setup

1. Install [Ollama](https://ollama.com) and keep it running.
2. Pull the model: `ollama pull gemma3:1b`
3. Install Node.js 18 or newer, clone this repo, and run commands from its folder.

## Usage

```bash
node src/index.js <command>
```

Commands:

- `tidy <folder> [--apply]`
- `digest <file>`

## `tidy`

Sorts the files in a folder into category subfolders (Documents, Images, Videos, Audio, Archives, Code, Other). The local model picks each category, with a fallback to the file extension if its answer is invalid.

- `node src/index.js tidy <folder>` is a dry run and only prints the planned moves.
- `node src/index.js tidy <folder> --apply` creates the folders and moves the files.
- Existing files are never overwritten. The model runs with temperature 0 and a fixed seed, so a dry run and `--apply` give the same plan.

```bash
$ node src/index.js tidy ./Downloads
report.pdf -> Documents/report.pdf
photo.jpg -> Images/photo.jpg
```

## `digest`

Reads a text file, such as an exported chat or notes, and prints a two-line summary: the main topic, then any decision, task or deadline. Only the last 6000 characters are used for long files, since recent messages matter most.

```bash
$ node src/index.js digest chat.txt
Amina and Joe will meet at 3pm, with the report deadline being Friday noon.
No action needed
```

## Limitations

The default model is the small `gemma3:1b`, so results are not perfect. In the example above it missed the tasks in the chat, and it sometimes files extensionless files in the wrong category. A larger Gemma model should do better.

## Built with GitHub Copilot


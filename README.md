# sloth-cli

A lazy local AI command-line tool powered by Gemma and Ollama.

## Usage

```bash
sloth <command>
```

Available commands:

- `tidy`
- `digest`
- `cards`

## `sloth tidy`

Sort files in a folder into category subfolders using the local Gemma model through Ollama.

- `sloth tidy <folder>` runs in dry-run mode and only prints planned moves.
- `sloth tidy <folder> --apply` creates category folders and moves files.
- `sloth tidy` uses deterministic model settings so dry-run and `--apply` stay consistent for the same files.

Example dry run:

```bash
$ sloth tidy ./Downloads
report.pdf -> Documents/report.pdf
photo.jpg -> Images/photo.jpg
```

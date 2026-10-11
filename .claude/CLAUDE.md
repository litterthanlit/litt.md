# litt.md: repo rules

This repo is Nick's design language and taste, packaged as a Claude Code plugin.
The repo root is the plugin root, and the skill lives in `skills/litt-md/`.

## Layout rules

- Never add these at the repo root, because Claude Code auto-loads them as plugin components:
  `commands/`, `agents/`, `hooks/`, `bin/`, `workflows/`, `monitors/`, `themes/`, `output-styles/`, `settings.json`, `.mcp.json`.
  A root `bin/` also makes claude.ai refuse the plugin.
- Keep repo notes in this file (`.claude/CLAUDE.md`). A root `CLAUDE.md` triggers a validate warning.
- `evals/` stays at the root so it never ships inside the claude.ai zip.

## Content rules

- `skills/litt-md/assets/tokens.css` is the only place hex values live. Markdown names variables (`--accent`, `--surface-2`) and explains the reasoning.
- `taste/` is Nick's. Change it only through the protocol in `skills/litt-md/workflows/evolve.md`.
- Commit taste changes with a `taste:` prefix. Never push without asking.
- Refer to Nick by name or as "you". Never use gendered pronouns.

## Checks before committing

```
claude plugin validate .
node skills/litt-md/scripts/check.mjs        # every mechanical check (the list is in the script header)
```

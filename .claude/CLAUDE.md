# litt.md: repo rules

This repo is Nick's design language and taste, packaged as a Claude Code plugin.
The repo root is the plugin root, and the skill lives in `skills/litt-md/`.

## Layout rules

- Never add these at the repo root, because Claude Code auto-loads them as plugin components:
  `commands/`, `agents/`, `hooks/`, `bin/`, `workflows/`, `monitors/`, `themes/`, `output-styles/`, `settings.json`, `.mcp.json`.
  A root `bin/` also makes claude.ai refuse the plugin.
- Keep repo notes in this file (`.claude/CLAUDE.md`). A root `CLAUDE.md` triggers a validate warning.
- `evals/` stays at the root so it never ships inside the claude.ai zip.

## Gallery

`gallery/` is the components gallery: a Vite and React app that Vercel builds from the repo root with `vercel.json`. It is not a plugin component, it does not ship in the claude.ai zip, and there is no root `package.json`, so every gallery command takes `--prefix gallery`.

- Tokens flow one way. `gallery/scripts/sync-tokens.mjs` copies `skills/litt-md/assets/tokens.css` and `tailwind.css` (strict mode on) into the gitignored `gallery/src/styles/`. Never edit the copies. `predev`, `prebuild` and `verify` run the sync.
- Docs data flows one way too. `gallery/scripts/gen-docs.mjs` reads `gallery/src/components` and writes the gitignored `gallery/src/generated/docs.json` (props, defaults, JSDoc, files, packages). `predev`, `prebuild` and `verify` run it after the sync. Document a prop with JSDoc in the component, never in the page.
- Every page runs the locked tokens. Only the Playground (`tune: true`) overrides them, on its own page, and it removes every override when you leave.
- `gallery/src/motion/rules.ts` mirrors the motion bounds in `check.mjs` (check 9) and the radius rule (check 7). Change them together.
- No hex values and no off-scale radii in `gallery/src`. `npm run lint:litt --prefix gallery` fails on both.
- `vercel.json` is the deploy config: `npm ci`, then `verify` and `build`, output `gallery/dist`. A push to a branch makes a preview, and `main` is production.

## Content rules

- `skills/litt-md/assets/tokens.css` is the only place hex values live. Markdown names variables (`--accent`, `--surface-2`) and explains the reasoning.
- `taste/` is Nick's. Change it only through the protocol in `skills/litt-md/workflows/evolve.md`.
- Commit taste changes with a `taste:` prefix. Never push without asking.
- Refer to Nick by name or as "you". Never use gendered pronouns.

## Checks before committing

```
claude plugin validate .
node skills/litt-md/scripts/check.mjs        # every mechanical check (the list is in the script header)
npm ci --prefix gallery && npm run verify --prefix gallery && npm run build --prefix gallery   # when gallery/ or the tokens change
```

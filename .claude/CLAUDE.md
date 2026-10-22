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
- The registry flows one way too. `gallery/scripts/gen-registry.mjs` turns the components (and the blocks in `gallery/src/blocks/`, whole screens named after the page that shows them) into the shadcn registry in the gitignored `gallery/public/r/` (served at `https://littmd.vercel.app/r/`), with every litt token renamed `litt-…` so it never collides with a host app. `prebuild` and `verify` run it after the docs data. Never edit the output; fix the source or the generator. `npm run test:registry --prefix gallery` installs every item into fresh Vite and Next.js apps; run it when a component, the motion engine, the tokens or the generator change.
- Versions flow one way too. `gallery/CHANGELOG.md` (by hand, one release per date) gives every registry item its version; `gen-registry.mjs` stamps it into the item's `meta` and the top of every installed file, and keeps the committed `gallery/registry.lock.json`. An item whose files changed without a newer changelog line fails verify. Add the line, run verify, commit the lock with the change. A token change needs a `litt` line (evolve.md, Propagate).
- Agent docs flow one way too. `gallery/scripts/gen-llms.mjs` writes the gitignored `gallery/public/docs/<page>.md`, `llms.txt`, `llms-full.txt` and `changelog.md` from the pages' `meta` and `docs`, `docs.json` and the lock. `predev`, `prebuild` and `verify` run it last.
- `npm run test:motion --prefix gallery` (CI, after a build) fails if anything moves under reduced motion on any page or overlay; `--self-test` fails if it can no longer see motion with motion allowed.
- Every page runs the locked motion. Only the Playground (`tune: true`) overrides it, on its own page, and it removes every override when you leave. Type and shape are the one exception: the header's Customize panel lets a viewer try another typeface and radius on every page, saved in their browser and written on `<body>` (`gallery/src/gallery/customize-state.tsx`, with the pre-paint script in `gallery/index.html`). Its defaults are always the locked tokens.
- `gallery/src/motion/rules.ts` mirrors the motion bounds in `check.mjs` (check 9) and the radius rule (check 7). Change them together.
- No hex values and no off-scale radii in `gallery/src`. `npm run lint:litt --prefix gallery` fails on both. It also fails a `<Stage>` caption that names a control size (sm, md, lg) its demo doesn't render, so when a taste rule changes a size, fix the demo and the lint points at the stale caption. Its `--host` mode lints code in an app that installed the registry (the `litt-…` names), and `npm run test:lint --prefix gallery` (part of `verify`) self-tests both modes on `gallery/scripts/lint-fixtures/`.
- `npm run test:agents --prefix gallery` is the agent test: Claude (`claude -p`, with this repo as the plugin) gets a fresh Vite or Next.js app and a task from `evals/agents/`, and the result is graded with litt's own checks (the skill loaded, registry components installed and composed, the host lint, typecheck, build, Chromium screenshots, and an optional screenshot judge). It costs money and takes minutes per task; `--fake-agent ../evals/agents/fake-agent.mjs` tests the harness for free. Run it when the build workflow, the registry or the host lint change. `evals/agents/README.md` has the details.
- `vercel.json` is the deploy config: `npm ci`, then `verify` and `build`, output `gallery/dist`. `gallery/vercel.json` is the same config for a Vercel project whose Root Directory is `gallery` (what an import detects); the two differ only in paths, so change them together. A push to a branch makes a preview, and `main` is production.

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

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
- The overview is a wall of every component as a live tile: a page's `tile` (`<Page tile={…}>`, one object at real size) or its first demo. `npm run test:wall --prefix gallery` (CI, after a build) fails on more than one accent fill across the wall, a tile or page that scrolls sideways, or an empty tile.
- `#canvas` is the language canvas (`gallery/src/canvas/`, after the create-canvas skill): a freeform workspace of live previews for rethinking litt, not a page. It has no nav entry or wall tile, and the page checks never see it. Content lives in `registry.tsx` (ids, names, sizes, positions); experiments stay in the folder and use only tokens, and nothing in `src/components` changes for them; `canvas.tsx` is only the camera, the gestures and the saved layout (camera and positions, under `litt-gallery:canvas:language`). Candidate values under comparison (such as accents) carry `litt-allow` and move into `tokens.css` once picked.
- Every page runs the locked motion. Only the Playground (`tune: true`) overrides it, on its own page, and it removes every override when you leave. Three exceptions live in the header's Customize panel, on every page, saved in the viewer's browser (`gallery/src/gallery/customize-state.tsx`): type and shape, written on `<body>` (with the pre-paint script in `gallery/index.html`); the accent, Monochrome, Blue 4 or Pink (`data-accent="mono"` or `"pink"` on `<body>`, which tokens.css answers, R6; Blue 4 is no attribute); and motion's feel, Calm or Fun, which wraps the gallery in fun mode's `FunMode` (`gallery/src/motion/fun.tsx`, a trial; foundations.md, Motion). Its defaults are the locked tokens and Calm, except the accent: the gallery opens in Monochrome (`DEFAULT_ACCENT` in `customize-state.tsx`, and the pre-paint script in `index.html`), while the registry ships Blue 4 (Q16). `test:wall` sets Blue 4 and then pink before it loads, since in Monochrome the accent is the ink that checkboxes and switches fill with too.
- Fun mode's rule: it changes how things move, never how they look at rest. A component's fun path runs only when `useFun()` returns its motion, and the code that runs without it stays exactly as it was. Check it by screenshotting the affected pages with fun mode on, after they settle, against Calm: they must match to the pixel.
- The gallery itself does lead with fun mode when it is on, from each page's `meta.fun` (what to try there): a Fun group at the top of the sidebar and the phone menu, a Fun filter first on the overview, and that line under the page's title. These cues are gallery chrome, not components, and carry `data-fun-cue`: hide them (or leave the nav out) when you compare Calm and Fun. Give a page `meta.fun` when its component gets a fun path.
- `gallery/src/motion/rules.ts` mirrors the motion bounds in `check.mjs` (check 9) and the radius rule (check 7). Change them together.
- No hex values and no off-scale radii in `gallery/src`. `npm run lint:litt --prefix gallery` fails on both. The lint lives in the skill (`skills/litt-md/scripts/lint-litt.mjs`, so it ships with it); `gallery/scripts/lint-litt.mjs` only runs it. Its `--host` mode lints code in an app that installed the registry (the `litt-…` names), and `npm run test:lint --prefix gallery` (part of `verify`) self-tests both modes on `gallery/scripts/lint-fixtures/`.
- `skills/litt-md/scripts/litt-check.mjs` turns host mode into a score for any app (the skill's check mode, `workflows/check.md`). `npm run test:check --prefix gallery` (part of `verify`) self-tests it on the same fixtures. Change it with the lint when a host rule changes.
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

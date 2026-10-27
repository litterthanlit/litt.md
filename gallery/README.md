# litt.md Gallery

The components gallery for [litt.md](../README.md): every component litt.md specifies, on the locked v0.5 tokens, documented and installable, and a Playground for trying other motion and shape values. Light and material stay still. Only objects move.

Live at [littmd.vercel.app](https://littmd.vercel.app).

- **Stack:** React 19, Tailwind v4 (strict, tokens from litt.md), Motion 12, Radix primitives, Vite 6.
- **Tokens:** `../skills/litt-md/assets/tokens.css` owns every number. `npm run sync:tokens` copies it and `tailwind.css` into the gitignored `src/styles/`, with Tailwind's strict mode switched on, so `rounded-lg`, `text-sm` and `bg-blue-500` do not exist. Never edit the copies. `predev`, `prebuild` and `verify` run the sync, so the gallery cannot ship stale tokens. The footer reads its version from the `tokens.css` header.
- **Docs pages:** every component page is also its docs page: a Preview | Code switch on each demo, Use when and Skip when, Usage, Props, Keyboard and Accessibility, plus Copy prompt (a brief an agent can act on) and Source on GitHub. Props are not written by hand: `npm run gen:docs` reads the components with the TypeScript checker and writes the gitignored `src/generated/docs.json` (types, defaults, JSDoc, the files and packages each component needs). `predev`, `prebuild` and `verify` run it after the token sync. See CONTRIBUTING.md, "Document it".
- **Registry:** every component installs into any React + Tailwind v4 project with `npx shadcn@latest add https://littmd.vercel.app/r/<item>.json` (or `@litt/<item>` with `"registries": { "@litt": "https://littmd.vercel.app/r/{name}.json" }` in components.json). `npm run gen:registry` builds it into the gitignored `public/r/`, and `prebuild` and `verify` run it after the docs data. The shipped copy is namespaced (`--accent` becomes `--litt-accent`, `bg-surface-1` becomes `bg-litt-surface-1`), so it never collides with or restyles the host; a verifier fails the build if anything unprefixed survives. Fonts, the heading weights and the focus ring are the opt-in `base-styles` item. `npm run test:registry` proves it end to end: fresh Vite and Next.js apps, every item installed, typecheck, build, and a Chromium smoke test that also checks nothing in the host changed. It needs the network and takes about ten minutes, so it is not part of `verify`.
- **Versions:** `CHANGELOG.md` is the registry's changelog, written by hand: one release per date (`2026.10.19`), with `added`, `changed`, `fixed`, `breaking` and `removed` lines that name the items, and `Migrate:` steps for a breaking change. `scripts/changelog.mjs` parses it strictly. `gen-registry` gives every item the version of the newest release that names it, in its `meta` and in a comment at the top of every file it installs, and keeps `registry.lock.json` (committed): a hash of what each item installs. When an item's files change and the changelog has no newer entry for it, verify fails and names it. The newest release stays open: an item it already names may change again until the next release starts. Add the line, run verify, and commit the rewritten lock with the change. The Changelog page and `/changelog.md` show the same file.
- **Docs for agents:** `npm run gen:llms` writes the gitignored `public/docs/<page>.md` (each docs page as Markdown: install, usage, use and skip, props, keyboard, accessibility, motion), `public/llms.txt` (an index), `public/llms-full.txt` (everything) and `public/changelog.md`, from the pages' own `meta` and `docs`, `docs.json`, the lock, and the Copy prompt's functions. `predev`, `prebuild` and `verify` run it last. Every docs page links its Markdown beside Copy prompt, and the Vercel config serves the files with Markdown and text types and answers an `Accept: text/markdown` request for the home page with `llms.txt`.
- **Locked pages, one Playground:** every page runs the tokens. JS springs read the same custom properties as CSS (`src/motion/tokens.ts`), so there is one set of numbers. Only the Playground (`tune: true` in its page meta) overrides them, on its own page, and every override is removed when you leave it. Its Tune panel checks the values against the litt.md v0.5 rules and prints tokens to paste back into litt.md.
- **Motion:** three tiers (instant, responsive, expressive). Springs are time + bounce, so the same numbers work in Motion, Framer and CSS `linear()`. `src/motion/rules.ts` holds the limits the Tune panel checks. It mirrors the motion and radius checks in `../skills/litt-md/scripts/check.mjs`, and the two change together.
- **Checks:** `npm run verify` (sync, docs data, registry, typecheck, litt rule lint, and the lint's self-test). The lint fails off-scale radii, weights outside the three roles (400, `font-title` 500, `font-label` 600), offset shadows, raw or quoted colors, literal timings, and duration and ease classes that do not pair by tier. `--host` applies the same rules to code in an app that installed the registry, where every name carries `litt-`, and also fails the host's own shadcn tokens, Tailwind's default palette, sizes, radii and shadows, and a transition with no tier duration (it would run on Tailwind's 150ms default).
- **Accessibility:** `npm run test:a11y` runs axe-core (WCAG 2.0 to 2.2, A and AA) on every page of a build, in light and dark, desktop and phone, and fails on any violation. It renders each page as loaded, so open overlays are not covered. Playwright and axe-core are not dependencies here; CI installs them beside the gallery (`A11Y_TOOLS`).
- **Reduced motion:** `npm run test:motion` opens every page of a build with reduced motion on, on the desktop and a phone, clicks each page's own triggers (anything with `aria-haspopup`, a closed disclosure, a Replay button, the first button of each stage) and samples every element's transform, opacity and box on every frame. A value that changes on three frames in a row is motion, and fails; a jump does not. It also fails any transition or animation left with a duration. The loading spinner is the one exception. `--self-test` runs with motion allowed and fails unless it sees motion on the Dialog, Menu, Toast and List pages, so a blind check fails too.
- **Fun mode at rest:** `npm run test:fun` opens every page of a build twice, side by side, in Calm and in fun mode, in a window as tall as the page. It compares them on load and after the first plain button of each stage is pressed in both, once the page has been quiet for two seconds (no change to the DOM, no running animation or animation frame, no timeout waiting to fire), and fails on any pixel that differs (fun mode changes how things move, never how they look at rest). The fun cues and the sidebar's contents are left out, a picked fun cue (the overview's Fun filter) gives way to All, and Thinking's clock is hidden because it reads real time. Chromium runs without partial raster, which otherwise leaves a few pixels a few levels apart after different motion, and every page gets the first answer to each Google Fonts request, since Google now and then serves another build of Geist that draws every glyph a few levels apart. A failure names the stage and the box, and leaves both screenshots in `--out`. `--self-test` fails unless Calm against Calm matches everywhere, a stage title a pixel low is seen on every load, and the clock mask still matches on the Thinking page.
- **The wall:** `npm run test:wall` opens the overview of a build with every tile mounted, in light and dark, on the desktop and a phone, and fails on more than one accent fill on the wall (R6: the Button tile carries the wall's one) or two anywhere on the page within one screen of each other (the hero's Get started and the Button tile), a page or tile that scrolls sideways, a tile that draws nothing, or an error. A page whose first demo is a form ending in a primary button gives `<Page>` a `tile`: the component as one object.
- **The hero and search:** `npm run test:home` drives the overview's deck and the gallery's ⌘K search on a build, as a visitor would: each control on the deck changes the gallery (Fun mode, the theme, which the header's switch shares, the accent and the shape), Reset puts the locked tokens back, Get started reaches the steps, ⌘K opens one menu (also with the Command menu's own demo on screen) and a pick opens its page, on the desktop and a phone.
- **PR check:** `../.github/workflows/gallery.yml` runs on every pull request and every push to `main`: `check.mjs`, `npm ci`, `verify`, a check that `registry.lock.json` is committed, `build`, `test:a11y`, `test:wall`, `test:home` and `test:motion` with its self-test, and beside it a second job builds again and runs `test:fun` with its self-test. A Vercel preview can fail without marking the PR; this check does.
- **Agent test:** `npm run test:agents` gives Claude a fresh Vite or Next.js app and a task from `../evals/agents/`, then grades what it built: did the litt-md skill load, did it install and compose the registry's components instead of hand-made copies, is its own code on the tokens and motion tiers (the host lint), does it typecheck, build and load in Chromium without errors, and (with `--judge`) do the screenshots match the task's rubric. It spends money and minutes per task, so it is not part of `verify`. See `../evals/agents/README.md`.

See CONTRIBUTING.md for how components are built.

## Run

```bash
cd gallery
npm ci
npm run dev        # sync the tokens and docs data, then Vite on http://localhost:5173
npm run verify     # sync, docs data, registry and versions, agent docs, typecheck, litt rule lint
npm run build      # sync, docs data and registry, then dist/ (registry at dist/r/)
npm run preview    # serve dist/
npm run test:a11y       # axe on every page of dist/, light and dark, desktop and phone (needs Playwright and axe-core)
npm run test:motion     # nothing moves under reduced motion, on any page or overlay of dist/ (needs Playwright)
npm run test:wall       # the overview's wall: one accent fill, nothing sideways or empty (needs Playwright)
npm run test:home       # the overview's deck, Get started and ⌘K search, driven as a visitor would (needs Playwright)
npm run test:fun        # fun mode rests as Calm does, to the pixel, on every page of dist/ (needs Playwright)
npm run test:registry   # install every registry item into fresh Vite and Next.js apps (network, ~10 min)
npm run test:agents -- --tasks settings-dialog   # Claude builds a task in a fresh app, graded by litt's checks (paid)
npm run test:agents -- --fake-agent ../evals/agents/fake-agent.mjs --tasks settings-dialog   # the same harness, free
```

From the repo root, the same chain Vercel runs:

```bash
npm ci --prefix gallery && npm run verify --prefix gallery && npm run build --prefix gallery
```

`npm run shot -- --dist dist --page menu --out shots` screenshots a page from a build, in light and dark, desktop and phone, and reports console errors and horizontal overflow. It needs Playwright, which is not a dependency here.

## Change the tokens

Edit `../skills/litt-md/assets/tokens.css`, never the copy in `src/styles/`, and follow the Propagate steps in `../skills/litt-md/workflows/evolve.md`. The gallery picks the change up on the next `dev`, `build` or `verify`. If the motion or radius bounds in `check.mjs` change, update `src/motion/rules.ts` in the same commit.

## Deploy

Vercel builds the gallery with whichever config sits at the project's Root Directory, and both layouts work:

- **Root Directory empty (the repo root):** `../vercel.json`, with `--prefix gallery` commands and output `gallery/dist`. This is how the `litt.md` project is set up.
- **Root Directory `gallery`:** `vercel.json` in this folder, with the same commands run from here and output `dist`. Vercel picks this when you import the repo and accept the detected Vite app. Keep "Include files outside the Root Directory" on, because the build reads `../skills/litt-md/assets/`.

The two files differ only in paths; keep their headers identical. Either way:

- `framework` is `null`, so no framework preset applies.
- Install is `npm ci --prefix gallery`. Build is `npm run verify --prefix gallery && npm run build --prefix gallery`, so a type error or a litt rule violation fails the deploy.
- The output is `gallery/dist`. Files in `/assets/` are content-hashed and served with an immutable cache header.
- Routing is by hash (`#button`, `#playground`), so no rewrites are needed, and Vite's `base` is `/`.
- Every push builds: branches become previews and `main` is production. Node comes from the project setting, and `engines` asks for 20 or later when you run it locally.

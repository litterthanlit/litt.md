# litt.md Gallery

The components gallery for [litt.md](../README.md): every component litt.md specifies, on the locked v0.5 tokens, documented and installable, and a Playground for trying other motion and shape values. Light and material stay still. Only objects move.

Live at [littmd.vercel.app](https://littmd.vercel.app).

- **Stack:** React 19, Tailwind v4 (strict, tokens from litt.md), Motion 12, Radix primitives, Vite 6.
- **Tokens:** `../skills/litt-md/assets/tokens.css` owns every number. `npm run sync:tokens` copies it and `tailwind.css` into the gitignored `src/styles/`, with Tailwind's strict mode switched on, so `rounded-lg`, `text-sm` and `bg-blue-500` do not exist. Never edit the copies. `predev`, `prebuild` and `verify` run the sync, so the gallery cannot ship stale tokens. The footer reads its version from the `tokens.css` header.
- **Docs pages:** every component page is also its docs page: a Preview | Code switch on each demo, Use when and Skip when, Usage, Props, Keyboard and Accessibility, plus Copy prompt (a brief an agent can act on) and Source on GitHub. Props are not written by hand: `npm run gen:docs` reads the components with the TypeScript checker and writes the gitignored `src/generated/docs.json` (types, defaults, JSDoc, the files and packages each component needs). `predev`, `prebuild` and `verify` run it after the token sync. See CONTRIBUTING.md, "Document it".
- **Registry:** every component installs into any React + Tailwind v4 project with `npx shadcn@latest add https://littmd.vercel.app/r/<item>.json` (or `@litt/<item>` with `"registries": { "@litt": "https://littmd.vercel.app/r/{name}.json" }` in components.json). `npm run gen:registry` builds it into the gitignored `public/r/`, and `prebuild` and `verify` run it after the docs data. The shipped copy is namespaced (`--accent` becomes `--litt-accent`, `bg-surface-1` becomes `bg-litt-surface-1`), so it never collides with or restyles the host; a verifier fails the build if anything unprefixed survives. Fonts, weight 400 and the focus ring are the opt-in `base-styles` item. `npm run test:registry` proves it end to end: fresh Vite and Next.js apps, every item installed, typecheck, build, and a Chromium smoke test that also checks nothing in the host changed. It needs the network and takes about ten minutes, so it is not part of `verify`.
- **Locked pages, one Playground:** every page runs the tokens. JS springs read the same custom properties as CSS (`src/motion/tokens.ts`), so there is one set of numbers. Only the Playground (`tune: true` in its page meta) overrides them, on its own page, and every override is removed when you leave it. Its Tune panel checks the values against the litt.md v0.5 rules and prints tokens to paste back into litt.md.
- **Motion:** three tiers (instant, responsive, expressive). Springs are time + bounce, so the same numbers work in Motion, Framer and CSS `linear()`. `src/motion/rules.ts` holds the limits the Tune panel checks. It mirrors the motion and radius checks in `../skills/litt-md/scripts/check.mjs`, and the two change together.
- **Checks:** `npm run verify` (sync, docs data, registry, typecheck, litt rule lint, and the lint's self-test). The lint fails off-scale radii, weights above 400, offset shadows, raw or quoted colors, literal timings, and duration and ease classes that do not pair by tier. `--host` applies the same rules to code in an app that installed the registry, where every name carries `litt-`, and also fails the host's own shadcn tokens, Tailwind's default palette, sizes, radii and shadows, and a transition with no tier duration (it would run on Tailwind's 150ms default).
- **Accessibility:** `npm run test:a11y` runs axe-core (WCAG 2.0 to 2.2, A and AA) on every page of a build, in light and dark, desktop and phone, and fails on any violation. It renders each page as loaded, so open overlays are not covered. Playwright and axe-core are not dependencies here; CI installs them beside the gallery (`A11Y_TOOLS`).
- **PR check:** `../.github/workflows/gallery.yml` runs on every pull request and every push to `main`: `check.mjs`, `npm ci`, `verify`, `build` and `test:a11y`. A Vercel preview can fail without marking the PR; this check does.
- **Agent test:** `npm run test:agents` gives Claude a fresh Vite or Next.js app and a task from `../evals/agents/`, then grades what it built: did the litt-md skill load, did it install and compose the registry's components instead of hand-made copies, is its own code on the tokens and motion tiers (the host lint), does it typecheck, build and load in Chromium without errors, and (with `--judge`) do the screenshots match the task's rubric. It spends money and minutes per task, so it is not part of `verify`. See `../evals/agents/README.md`.

See CONTRIBUTING.md for how components are built.

## Run

```bash
cd gallery
npm ci
npm run dev        # sync the tokens and docs data, then Vite on http://localhost:5173
npm run verify     # sync, docs data, registry, typecheck, litt rule lint
npm run build      # sync, docs data and registry, then dist/ (registry at dist/r/)
npm run preview    # serve dist/
npm run test:a11y       # axe on every page of dist/, light and dark, desktop and phone (needs Playwright and axe-core)
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

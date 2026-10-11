# litt.md Gallery

The components gallery for [litt.md](../README.md): eight components on the locked v0.5 tokens, and a Playground for trying other motion and shape values. Light and material stay still. Only objects move.

- **Stack:** React 19, Tailwind v4 (strict, tokens from litt.md), Motion 12, Radix primitives, Vite 6.
- **Tokens:** `../skills/litt-md/assets/tokens.css` owns every number. `npm run sync:tokens` copies it and `tailwind.css` into the gitignored `src/styles/`, with Tailwind's strict mode switched on, so `rounded-lg`, `text-sm` and `bg-blue-500` do not exist. Never edit the copies. `predev`, `prebuild` and `verify` run the sync, so the gallery cannot ship stale tokens. The footer reads its version from the `tokens.css` header.
- **Locked pages, one Playground:** every page runs the tokens. JS springs read the same custom properties as CSS (`src/motion/tokens.ts`), so there is one set of numbers. Only the Playground (`tune: true` in its page meta) overrides them, on its own page, and every override is removed when you leave it. Its Tune panel checks the values against the litt.md v0.5 rules and prints tokens to paste back into litt.md.
- **Motion:** three tiers (instant, responsive, expressive). Springs are time + bounce, so the same numbers work in Motion, Framer and CSS `linear()`. `src/motion/rules.ts` holds the limits the Tune panel checks. It mirrors the motion and radius checks in `../skills/litt-md/scripts/check.mjs`, and the two change together.
- **Checks:** `npm run verify` (sync, typecheck, litt rule lint). The lint fails off-scale radii, weights above 400, offset shadows, raw or quoted colors, literal timings, and duration and ease classes that do not pair by tier.

See CONTRIBUTING.md for how components are built.

## Run

```bash
cd gallery
npm ci
npm run dev        # sync the tokens, then Vite on http://localhost:5173
npm run verify     # sync, typecheck, litt rule lint
npm run build      # sync, then dist/
npm run preview    # serve dist/
```

From the repo root, the same chain Vercel runs:

```bash
npm ci --prefix gallery && npm run verify --prefix gallery && npm run build --prefix gallery
```

`npm run shot -- --dist dist --page menu --out shots` screenshots a page from a build, in light and dark, desktop and phone, and reports console errors and horizontal overflow. It needs Playwright, which is not a dependency here.

## Change the tokens

Edit `../skills/litt-md/assets/tokens.css`, never the copy in `src/styles/`, and follow the Propagate steps in `../skills/litt-md/workflows/evolve.md`. The gallery picks the change up on the next `dev`, `build` or `verify`. If the motion or radius bounds in `check.mjs` change, update `src/motion/rules.ts` in the same commit.

## Deploy

Vercel builds the gallery from the repo root with `../vercel.json`:

- `framework` is `null`, so no framework preset applies.
- Install is `npm ci --prefix gallery`. Build is `npm run verify --prefix gallery && npm run build --prefix gallery`, so a type error or a litt rule violation fails the deploy.
- The output is `gallery/dist`. Files in `/assets/` are content-hashed and served with an immutable cache header.
- Routing is by hash (`#button`, `#playground`), so no rewrites are needed, and Vite's `base` is `/`.
- Every push builds: branches become previews and `main` is production. Node comes from the project setting, and `engines` asks for 20 or later when you run it locally.

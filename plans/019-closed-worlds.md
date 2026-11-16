# Plan 019: Six closed worlds, each its own player, docs and install

> **Executor instructions**: Read this plan, `.claude/CLAUDE.md`, `skills/litt-md/taste/litt-principles.md` and plan 018
> (which built the object this plan makes each world's front door). Each phase ends green and committed. Phase 4 ends
> in a STOP: it changes every registry item.

## Status

- **Priority**: P1 (Nick asked for it on 2026-11-15)
- **Effort**: XL
- **Risk**: MEDIUM to HIGH. Phases 1 to 3 are gallery chrome. Phase 4 changes what the registry installs.
- **Depends on**: plan 018, phase 1 and its per-world Playground (commit `bfb0882`).
- **Category**: direction

## Why

Nick, 2026-11-15, after the per-world Playground: "should we split the repos if we want to make each world completely
different?", then, to keeping one repo with a home per world: "yes do the best long-term solution please. reduce or
remove customisations for now. each world should have their own, strict tho. also not access other theme outside of
the current. screen of the "player" should only show the world inside just like components right now. there can be a
back home menu that goes to https://www.litt.design/systems/".

Nick's answers to the three questions that followed:
- docs: **one set per world**, `#device/button`, drawn only in that world; the shared set retires;
- Customize: **remove the panel, keep looks** in code, unused by the UI;
- a world's page: **only the player**, as the components site is, with a top row and a Home link.

## Decision: one repo, a home per world

Not six repos. A world may differ in everything a person sees and touches: its tokens, its bodies, its own parts, its
object, its principles. It shares only the contract: what a part is for, its props, roles, keys and states. Six repos
would copy the token pipeline, the registry generator, about fifteen browser checks, the lint and the versioning, and
the copies would drift. Split a world out only when it stops sharing the contract.

## Routes, after this plan

| Address | What it is |
|---|---|
| `#systems` (litt.design/systems/) | Home: the six worlds, each card opening its player. The Home link everywhere goes here. |
| `#<world>` | The world's player, alone on the page (plan 018's object, every component in the world). |
| `#<world>/<component>` | That component's docs, drawn only in that world. |
| `#<world>/about` | The world's system page (today's `#<world>`: scenes, foundations, Only here, Install). |
| `#changelog`, `#ai` | Site pages, in the gallery's own look. |
| `#playground/<world>`, `#<component>` | Retired: they open `#<world>` and `#flat/<component>`. |

Inside a world nothing links to another world. The only way out is Home.

## Phase 1. Strict worlds: no Customize

- [ ] The header's Customize button and panel, the overview's deck, the phone menu's entry and the search menu's look
      commands come out of the UI. `customize.tsx` and `deck.tsx` are deleted.
- [ ] `customize-state.tsx` keeps the theme (light, dark, system), and the look becomes the world's own: no storage,
      no link, each world's own accent, face, shape and Calm. `look.ts` keeps the looks, the `?look=` grammar and every
      sentence they produce (llms.txt's Looks, Copy prompt), unused by the UI.
- [ ] Checks that seeded a look (`wall`, `worlds`, `home`, `playground`, `study`, `shot`) stop relying on it; checks
      that test the grammar (`test:look`) stay.

## Phase 2. A world is its player

- [ ] `#<world>` draws only the player: no gallery header or sidebar. Its top row is the world's name, Menu, Details,
      Source and Home (https://www.litt.design/systems/). Nothing on it links to another world.
- [ ] The whole page wears the world (its ground, its face), not just the screen; `<html>` keeps the gallery's.
- [ ] The system page moves to `#<world>/about`, reached from Menu. `#playground/<world>` opens `#<world>`.
- [ ] The Tune panel leaves the UI with Customize (its code stays). Locking motion goes back to `tokens.css` by hand
      until a later plan brings it back inside a world.
- [ ] `test:playground` follows the routes; `test:worlds` checks `#<world>/about`.

## Phase 3. Docs per world

- [ ] `#<world>/<component>` draws the component's page wrapped in its world (lookAttributes, MaterialProvider and an
      OverlayRoot, as the player's screen is), only for components in that world (`inWorld`).
- [ ] app.tsx routes a world's sub-routes to the world (fixing the clash where `device/*` already meant the world
      page), and `#<component>` opens `#flat/<component>`.
- [ ] Details and Source on the player open `#<world>/<component>`. A docs page's way back is its world's player.
- [ ] The page checks (reflow, text-zoom, corners, gaps, reduced-motion, a11y) loop over the six worlds ×
      their components, filtered by `meta.worlds`, instead of the filenames alone.

## Phase 4. A home per world in the code, and an install per world (STOP before it)

Nick chose A on 2026-11-16 ("A, go ahead"). Done the same day, in four commits: the move, the generator, the test, the docs.

- [x] `gallery/src/worlds/<world>/`: the world's bodies (from `components/bodies/<part>.<world>.tsx`), its own parts,
      its object (`play-object/bodies/<world>.tsx`). Not under `src/gallery`, which gen-docs forbids components to import.
      Updates gen-registry's two body regexes and directory, study.mjs, and the collisions KNOWN paths.
      Done for the bodies: `src/worlds/<world>/<part>.tsx`, imported as `@/worlds/<world>/<part>`. A body still lands at
      `components/litt/bodies/<part>.<world>.tsx` in a host, and a comment's source path is turned back into that path,
      so a registry written before and after the move diffs empty. Two things stayed: the player bodies, because they
      import the player's gallery code (`body.ts`, `scrub.ts`) and `src/worlds` holds only what ships; and Device's own
      parts (seven-segment, tape-progress, agent-indicator, copy-button), because gen-docs, the registry and the docs
      pages all key a part on `src/components/<part>.tsx`, and their pages already say they are Device's (meta.worlds).
- [x] A per-world registry: `r/<world>/<part>.json` with the contract and only that world's body, and `r/<world>/litt.json`
      with `:root` and that world's tokens. This needs one of two shapes, which is Nick's call:
  - **A. Build-time rewrite.** gen-registry rewrites each contract's `byWorld` map and imports to the one world's body.
    No component changes; the generator grows.
  - **B. One body import.** Each contract imports `./body` and the gallery aliases it per world. Every component
    changes once; the generator stays simple.

  A, in `gen-registry.mjs` ("one world's install"): every `byWorld(material, map)` becomes `{ press: <the world's
  entry, else Press's> }`, then whatever only the dropped entries used goes (imports, Press's body and its helpers).
  The engines get a copy per world too, so nothing a world installs depends on `r/litt.json`. Every existing item,
  `registry.json` and lock entry is unchanged.
- [x] Item names and the lock become world-prefixed; CHANGELOG lines per world; `test:registry` installs each world.
      The old names stay beside them (`button` and `device-button`). The `worlds` scenario fails if a world's install
      brings another world's body or tokens.
- [ ] `taste/litt-principles.md` points each world's section at its folder (a `taste:` change, through evolve.md).
      Not done: it is Nick's, through evolve.md. Its line 113 still names `components/bodies/<part>.<world>.tsx`.

## Checks per phase

```
claude plugin validate .
node skills/litt-md/scripts/check.mjs
npm run verify --prefix gallery && npm run build --prefix gallery
npm run test:playground --prefix gallery && npm run test:playground --prefix gallery -- --self-test
for t in motion reflow text-zoom forced-colors focus gaps corners wall worlds home; do npm run test:$t --prefix gallery || break; done
npm run test:a11y --prefix gallery
```

Phases 1 to 3 leave `registry.lock.json` unchanged.

## STOP conditions

- Phase 4 starts only after Nick picks A or B.
- A check can only pass by weakening it: report.

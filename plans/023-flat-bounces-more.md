# Plan 023: Flat bounces more than the other worlds

> **Executor instructions**: Read `.claude/CLAUDE.md`, `skills/litt-md/taste/litt-principles.md` (Flat),
> `taste/profile.md` R4 and `workflows/evolve.md` (Propagate) first. Phase 1 ends in a STOP for Nick's eye.

## Status

- **Status**: DONE (2026-11-16). Nick picked 0.28 at 350ms, no bounce on small moves; phase 2 propagated it.
- **Priority**: P2 (Nick, 2026-11-16, PR #116)
- **Effort**: M
- **Risk**: MEDIUM. A rule change (R4) through Propagate; values in `tokens.css`.
- **Depends on**: nothing.
- **Category**: direction

## Why

Nick, 2026-11-16: "yes flat should be more bouncy I feel like", with Flat's direction: "light, easy to use, airy,
flat - no complications, fun and I want motion that matches that." Today every world's expressive spring is 350ms at
bounce 0.12, the cap R4 sets and `check.mjs` (check 9) and `gallery/src/motion/rules.ts` enforce. Responsive is bounce
0 everywhere.

## Phase 1. Candidates on the canvas (STOP for Nick's eye)

- [x] On `#canvas`, five candidates of Flat's expressive spring side by side, each running the same three moves:
      a mosaic dealing out of a tile, a dialog growing from its opener, a switch's thumb. Bounce 0.12 (today), 0.2,
      0.28, 0.36, 0.45, at 350ms and at 420ms. Values carry `litt-allow` until picked.
- [x] One candidate for the responsive spring with a little bounce (0.08) in Flat only, since the switch and
      segmented move on it: Nick judges whether Flat's small moves should bounce too.

Built in `gallery/src/canvas/flat-bounce.tsx`, placed in `registry.tsx` to the right of "Flat · the hand": "Flat bounce
· expressive, ten candidates" and "Flat bounce · responsive, today and 0.08". Nothing plays until pressed; nothing moves
under reduced motion. Bounce 0.08 on the responsive spring overshoots under 0.1%: it reads as a slightly quicker settle,
not a bounce.

**STOP**: Nick picks the values by eye.

## Phase 2. Propagate

Nick, 2026-11-16, after watching the canvas: "0.28 at 350ms, no bounce on small moves looks good", then "go".

- [x] `tokens.css`: Flat's `--spring-expressive: 350ms 0.28`, with its `--ease-expressive` and `--dur-expressive` (579ms),
      under `[data-material="flat"]`. The responsive spring stays at bounce 0. The reduced-motion block now names Flat,
      or Flat's settle would beat its zeros on `<html>`.
- [x] `check.mjs` check 9 and `rules.ts`: the expressive bounce bound is per world (`BOUNCE_CAP` and
      `EXPRESSIVE_BOUNCE`: Flat 0.28, the others 0.12); responsive 0 everywhere; settle limit unchanged. The Tune panel,
      the spring editor, the Playground's rows and `test:rules` read it. The motion dial reads the springs again when
      the world on `<html>` changes.
- [x] `profile.md` R4: Flat's exception, in Nick's words, in its own `taste:` commit (v1.15), with the journal and the
      `litt-principles.md` Flat line; `litt`, `motion`, `spring-editor`, `tune` and their world copies in the CHANGELOG.
      The world installs now keep the reduced-motion and more-contrast blocks (`gen-registry.mjs`, `worldCss`).
- [x] `test:motion` (reduced motion still stills it), `test:rules`.

## Open, for Nick

1. Type above 18px in Flat (R8), as Flat's references set their figures. A separate question; this plan does not
   change type.

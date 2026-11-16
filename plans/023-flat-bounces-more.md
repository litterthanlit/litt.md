# Plan 023: Flat bounces more than the other worlds

> **Executor instructions**: Read `.claude/CLAUDE.md`, `skills/litt-md/taste/litt-principles.md` (Flat),
> `taste/profile.md` R4 and `workflows/evolve.md` (Propagate) first. Phase 1 ends in a STOP for Nick's eye.

## Status

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

- [ ] On `#canvas`, five candidates of Flat's expressive spring side by side, each running the same three moves:
      a mosaic dealing out of a tile, a dialog growing from its opener, a switch's thumb. Bounce 0.12 (today), 0.2,
      0.28, 0.36, 0.45, at 350ms and at 420ms. Values carry `litt-allow` until picked.
- [ ] One candidate for the responsive spring with a little bounce (0.08) in Flat only, since the switch and
      segmented move on it: Nick judges whether Flat's small moves should bounce too.

**STOP**: Nick picks the values by eye.

## Phase 2. Propagate

- [ ] `tokens.css`: Flat's `--spring-expressive` (and responsive, if picked) under `[data-material="flat"]`.
- [ ] `check.mjs` check 9 and `rules.ts`: the bounce bound becomes per world (Flat's own cap, the others at 0.12).
- [ ] `profile.md` R4: Flat's exception, worded with Nick through `evolve.md`; a `taste:` commit; a `litt` CHANGELOG line.
- [ ] `test:motion` (reduced motion still stills it), `test:rules`.

## Open, for Nick

1. Type above 18px in Flat (R8), as Flat's references set their figures. A separate question; this plan does not
   change type.

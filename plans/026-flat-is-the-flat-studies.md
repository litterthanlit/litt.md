# 026. Flat is the Flat studies

Status: IN PROGRESS (phase 1, 2026-11-23).

## Nick's words

2026-11-23, on the Flat studies page (a claude.ai artifact, 23 studies after the components repo, redesigned in Flat):
"the flat studies should be the new flat, and rebuild everything from there". Asked which of the studies' rules replace
Flat's, Nick picked all four: bigger type, self-running demos, a snappier press, and the studies' gallery. Asked how far
the parts go: "add new ones, remove old. we're going to rebuild over next PR's". One PR per phase, off `main`.

## What already agrees

The studies' values were Flat's already: the ground and paper in both themes, the ink as the one accent, the Candy hues
on data only, the sunset ramp, the radii (16, 28, pill), Geist, the expressive spring (350ms, bounce 0.28), paper with
no edge and nothing cast, and paper turning to the bubble when set on paper. PR #171 put the wall's tiles on the ground.

## Phase 1. The rules and the tokens (this PR)

- [x] Journal: four entries dated 2026-11-23. Profile v1.22: the Type and Motion decisions, R4, R8 and the changelog;
      `litt-principles.md`, `material.md`, SKILL.md and `gen-llms.mjs` follow.
- [x] Flat's block in `tokens.css`: body and reading 15px, small 14, h2 to h4 16, display and h1 34px, the figure 48px;
      the page title and the figure at the label weight through `--type-display-weight`, `--type-h1-weight` and
      `--type-figure-weight` (the title weight in `:root`); `--press-scale` 0.96.
- [x] `check.mjs` check 6: the three weight tokens are the title weight in `:root` and may be the label weight only in
      Flat's block.
- [x] Flat's button shrinks to `--press-scale` when pressed.
- [x] `gallery/CHANGELOG.md`: `litt` and every world's `litt`, `base-styles`, `button`, `flat-button`.

Not taken: the studies' 75ms press and 250ms glide. A press rides the instant tier (100ms), the smallest litt has, and
the responsive spring (200ms visual) reads as the studies' 250ms ease-out glide.

## Phase 2. The studies' gallery

- [ ] A Flat tile: its stage on the ground (done in #171), its name and a muted tagline under it, left-aligned. The
      tagline is a new optional `meta.tagline` (one short line, the studies' voice), falling back to nothing.
- [ ] Tiles run by themselves under Flat until a hand arrives (R4's exception): `StillMotion` stays off for a Flat tile;
      a hand (pointer, key, wheel, focus) stops a demo's own loop for good; reduced motion stills it with a status.
      `test:motion` and `test:sound` must still pass: nothing moves under reduced motion, nothing sounds.
- [ ] The viewer: a Flat tile opens a full-screen sheet on the ground with Close on the left, the title centred, and
      Previous and Next circles on the right, stepping through the world's gallery view; Escape closes it and returns
      focus to the tile; its address deep-links. It replaces the mosaic under Flat.
- [ ] `test:wall`, `test:playground`, `test:focus`, `test:targets` and `test:a11y` on `#flat/*`.

## Phase 3 onward. The parts, a batch per PR

Add the studies Flat lacks as real components (a contract, Flat's body, a page, a registry item, an `added` changelog
line, at the top of `SET.flat`, per `.claude/CLAUDE.md`). The studies, against what exists today:

| Study | Today |
|---|---|
| Switch, One-time code (Code input), Command menu, Segmented control, Toast stack, Hold to confirm, Agent run, Copy button, Step sequencer, Agent indicators (`agent-indicator`) | Exists: rebuild Flat's body to the study |
| Gradient keys, Agent status, Fader, Ticker, Knob, Tape reels, VU meter, Agent shapes, Agent loaders, Dither card, Spotlight card, Number ticker, Magnetic button | New |

Suggested batches: agents (indicators, status, shapes, loaders, run); controls (fader, knob, switch, segmented,
magnetic button); readouts (VU meter, tape reels, number ticker, ticker); cards and pickers (gradient keys, dither card,
spotlight card, copy button, one-time code, command menu, toast stack, hold to confirm, step sequencer).

**STOP before removing anything**: list Flat's parts that have no study, and Nick picks which go. Removing a part from
Flat takes it out of `worlds` in its page's `meta`, out of `SET.flat`, and gives the `flat-<part>` item a `removed` line;
the part stays in the other worlds.

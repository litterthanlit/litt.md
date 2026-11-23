# 026. Flat is the Flat studies

Status: IN PROGRESS (phase 1 and phase 2, 2026-11-23).

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
- [x] Flat's block in `tokens.css`: body and reading 15px, small 14, h2 to h4 16, display and h1 34px, the in-card
      figure 28px (`--type-figure-size`) and the large standalone figure 48px (`--type-figure-lg-size`);
      the page title and figures at the label weight through `--type-display-weight`, `--type-h1-weight` and
      `--type-figure-weight` (the title weight in `:root`); `--press-scale` 0.96.
- [x] `check.mjs` check 6: the three weight tokens are the title weight in `:root` and may be the label weight only in
      Flat's block.
- [x] Flat's button shrinks to `--press-scale` when pressed.
- [x] `gallery/CHANGELOG.md`: `litt` and every world's `litt`, `base-styles`, `button`, `flat-button`.

Not taken: the studies' 75ms press and 250ms glide. A press rides the instant tier (100ms), the smallest litt has, and
the responsive spring (200ms visual) reads as the studies' 250ms ease-out glide.

## Phase 2. The studies' gallery

- [x] A Flat tile: its stage on the ground (#171), its name and its line under it, left-aligned. The line is the page's
      lede in Flat's words (`lineIn`), cut to one line, so no new field was needed; a page can still get a shorter one
      with `ledeByWorld.flat`. The List's shared lede said "raised"; it is now true of every body.
- [x] A Flat tile is never held still (`StillMotion` is off for it), so a demo that runs by itself runs. The demos that
      run themselves until a hand arrives come with the parts, in phase 3 (a gallery hook, never in a shipped part).
- [x] The viewer (`flat-viewer.tsx`): a Flat tile's ground or its expand button opens the component alone on the ground,
      growing out of the tile from 0.9 on the expressive spring; Close on the left, the name centred, Previous and Next
      on the right stepping through the whole view; its line and Open page under it; Esc and Close return focus to the
      tile. Only `#flat/components` has it; the overview keeps its mosaic.
- [ ] Deep links to an open component (`#flat/components/<id>`) are left out: the hash is the route, and a third part
      would touch `worldOfHash`, `canonical`, `routes.mjs` and `index.html`'s copy. Worth its own small PR if wanted.
- [x] `test:a11y`, `test:motion`, `test:targets`, `test:reflow`, `test:text-zoom`, `test:gaps`, `test:corners`,
      `test:wall` and `test:words` (Flat) on `#flat/components`.

## Phase 3 onward. The parts, a batch per PR

Add the studies Flat lacks as real components (a contract, Flat's body, a page, a registry item, an `added` changelog
line, at the top of `SET.flat`, per `.claude/CLAUDE.md`). The studies, against what exists after PR #170:

| Study | Today |
|---|---|
| Switch, One-time code (Code input), Segmented control, Toast stack, Hold to confirm, Agent run, Slider, Number ticker (Stat), Agent indicators (`assistant-status`), Agent status (`agent-status`), Agent loaders (`working-loader`), Magnetic button (`magnetic-button`), Spotlight card (`spotlight-card`) | Shipped in Flat (#170); add gallery-only self-running tile demos |
| Command menu, Copy button, Step sequencer | Exists: align Flat's body to the study |
| Gradient keys, Dither card, Ticker, Agent shapes, Fader, Knob, Tape reels, VU meter | New (decide which tool/audio studies enter Flat under the pattern-not-device rule) |

**STOP before removing anything**: list Flat's parts that have no study, and Nick picks which go. Removing a part from
Flat takes it out of `worlds` in its page's `meta`, out of `SET.flat`, and gives the `flat-<part>` item a `removed` line;
the part stays in the other worlds.

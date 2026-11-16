# Plan 022: Press goes back to its first boards, and a button has no outline

> **Executor instructions**: Read `.claude/CLAUDE.md`, `skills/litt-md/taste/litt-principles.md` (Press),
> `skills/litt-md/taste/journal.md` (the entries of 2026-10-26 and 2026-11-13 to 16) and `taste/profile.md` R3 first.
> Phase 1 is read-only and ends in a STOP.

## Status

- **Priority**: P1 (Nick, 2026-11-16, PR #116)
- **Effort**: M
- **Risk**: MEDIUM. Every Press component's look; Plain and the other worlds must not change.
- **Depends on**: nothing.
- **Category**: direction
- **State**: done (2026-11-16). Phase 1 compared `ef97e37` (26 October) with today; phase 2 took the button's plate,
  wall and lit edge off (PR #120); Nick said "Go" to the rest, and phase 3 took the 8 to 9 November cues off the
  switch, segmented control, checkbox and radio, and input. The slider stays as it is.

## Why

Nick, 2026-11-16: "I said it was overdesigned cause I liked the first press better. those outlines on the buttons
dont look good." `litt-principles.md`, Press: "The first Press is the measure. The boards of 26 October 2026
('Thats really strong! I love it!'). A raised thing says it is raised once, and a button has no outline around it."

The outline is most likely the button's plate: `button.tsx` draws a `--slot` border of 2px or 3px (`plateSize`)
around the block, and `disabledLook` keeps it when the block lies flat. Phase 1 confirms that against the boards.

## Phase 1. Find what changed since the first boards (read-only, STOP)

- [x] Find the 26 October boards in git (`git log --since=2026-10-25 --until=2026-10-28`, the canvas and the rebuild
      board the journal names) and build them at that commit.
- [x] Screenshot the same eight parts (button, switch, segmented, slider, surface, row, marks, input) then and now,
      light and dark, side by side, and list every cue added since: the plate, extra rims, walls, highlights, glow.
- [x] For each cue, say which journal entry or rule brought it in, so removing it does not undo something Nick asked for.

**STOP**: Nick picks from the side-by-side what goes. The button's outline goes regardless.

## Phase 2. Remove the outline, and what Nick picked

- [x] Press's button with no plate: the block stands on the surface, raised once by its cast. Keep its width (the
      plate's padding comes back) and its press (the sink, the wall going).
- [x] The same for every Press part that has a plate around a raised block (segmented, switch thumb, icon button).
- [x] `test:study`, `test:corners`, `test:forced-colors` (the plate may be what forced colors draws; give the block
      `outline: 1px solid transparent` so forced colors still shows an edge), a11y contrast on the block's edge
      (non-text contrast 3:1 against the surface, WCAG 1.4.11, now that the plate does not carry it).
- [x] CHANGELOG lines for every changed item.

## Phase 3. The rest of Press goes back (Nick: "Go")

- [x] Switch: the deep slot tray (`--slot`, `--slot-shade`) and the block's lit edge go; the tray is `--tray` with
      `--tray-shade` again. On and Off stay in the floor (R5).
- [x] Segmented: the empty bays (`--cut-shade`) and the block's `--highlight` go; the tray, the raised block and the
      drag stay.
- [x] Checkbox and radio: the ink fills the cut whole (no rim reading as a second outline; an error keeps its
      `--danger` edge on the ink); a radio is the checkbox's cut, round, not the deeper `--slot` cup. The ink marks (R6)
      and the raised bead stay.
- [x] Input: the cut inside the 3:1 control line again (`--field-line`, `--field-shade`, which under Press are
      `--line-control` and `--cut-shade`), not `--slot-shade` with a second `--field-shade`.
- [x] The secondary button: a 1px inset `--line-control` ring under `prefers-contrast: more` only, 3:1 or more against
      the surfaces in light and dark.
- [x] The slider is untouched (26 October's "this new slider looks like the move!").
- [x] Heat drew Press's bodies for these parts, so it has verbatim copies in `gallery/src/worlds/heat/`; every other
      world's pages for these parts are pixel-identical but for the version stamp.
- [x] CHANGELOG lines, the lock, verify, build, `test:study`, `test:corners` (the segmented break the bays made is gone
      from KNOWN), `test:forced-colors`, `test:focus`, `test:reflow`, `test:text-zoom`, `test:gaps`, a11y on the
      touched `#press/...` pages.

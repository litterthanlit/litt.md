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

## Why

Nick, 2026-11-16: "I said it was overdesigned cause I liked the first press better. those outlines on the buttons
dont look good." `litt-principles.md`, Press: "The first Press is the measure. The boards of 26 October 2026
('Thats really strong! I love it!'). A raised thing says it is raised once, and a button has no outline around it."

The outline is most likely the button's plate: `button.tsx` draws a `--slot` border of 2px or 3px (`plateSize`)
around the block, and `disabledLook` keeps it when the block lies flat. Phase 1 confirms that against the boards.

## Phase 1. Find what changed since the first boards (read-only, STOP)

- [ ] Find the 26 October boards in git (`git log --since=2026-10-25 --until=2026-10-28`, the canvas and the rebuild
      board the journal names) and build them at that commit.
- [ ] Screenshot the same eight parts (button, switch, segmented, slider, surface, row, marks, input) then and now,
      light and dark, side by side, and list every cue added since: the plate, extra rims, walls, highlights, glow.
- [ ] For each cue, say which journal entry or rule brought it in, so removing it does not undo something Nick asked for.

**STOP**: Nick picks from the side-by-side what goes. The button's outline goes regardless.

## Phase 2. Remove the outline, and what Nick picked

- [ ] Press's button with no plate: the block stands on the surface, raised once by its cast. Keep its width (the
      plate's padding comes back) and its press (the sink, the wall going).
- [ ] The same for every Press part that has a plate around a raised block (segmented, switch thumb, icon button).
- [ ] `test:study`, `test:corners`, `test:forced-colors` (the plate may be what forced colors draws; give the block
      `outline: 1px solid transparent` so forced colors still shows an edge), a11y contrast on the block's edge
      (non-text contrast 3:1 against the surface, WCAG 1.4.11, now that the plate does not carry it).
- [ ] CHANGELOG lines for every changed item.

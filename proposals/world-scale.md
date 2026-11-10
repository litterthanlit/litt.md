# Per-world scale, starting with Flat

Written 2026-11-10 for Nick. Nick, on the three worlds: "I want each system to not look like the other, and play on its strengths", "flat be like airy, easy to use". The worlds differ today in color, material, face, corner radius and the bodies of 19 controls. They do not differ in size: every world has the same type sizes, control heights and spacing unit, which is why Flat reads as Press without its borders.

This is a proposal, not a build. No token, rule or component changes here. Three candidate scales for Flat are live on the canvas (`#canvas`, the Flat scale rows; `gallery/src/canvas/scale.tsx`), each around the same settings panel and the same case study, beside Flat as it ships. Open `?look=flat#canvas` to compare them. Nick saw the same four applied to the live gallery on 2026-11-10 and chose Space; the table at the end records it.

## What was measured

| What | Where | Count | A world's token reaches it? |
|---|---|---|---|
| Text set by a role (`text-body`, `text-small`, `text-caption`…) | components and blocks | 539 uses | Yes: the `--type-*` tokens |
| Control heights by token (`h-control-md`…) | components and blocks | 187 uses | Yes: the `--control-*` tokens |
| Control-sized boxes by number (`h-8`, `size-11`…) | components and blocks | 55 uses | Only the spacing unit |
| Gaps and padding by number (`p-4`, `gap-6`…) | components and blocks | 1158 uses | Only the spacing unit |
| The page rhythm token (`py-section`) | the whole gallery | 0 uses | Nothing reads it |

Two things follow. Type and control height are cheap to make a world's own: a few lines in the world's block of `tokens.css` reach every part. Space is not: nearly every gap is a number on Tailwind's 4px unit, so the one lever that reaches them all is the unit itself.

litt.design, which Flat was modelled on, has litt's own type scale: 14px text, an 18px statement and 12px labels (its `app/globals.css`, read 2026-11-10). Its air is space: 144px to 176px above a section, and one idea per screen. That argues for trying space before size.

## The candidates

| Candidate | What it sets | On the 8px grid (R9)? | Under the 18px ceiling (R8)? | Elements wider than their box: settings, case study |
|---|---|---|---|---|
| Today | Nothing | Yes | Yes | 1, 5 |
| Space | The spacing unit 4px to 5px; 14px text on a 24px line | No: 8 becomes 10, 16 becomes 20 | Yes | 1, 5 |
| Type | Text 14 to 16 on a 24px line, small 13 to 14, control words to match; the title stays 18 | Yes | Yes, but "nearly everything is 14px" no longer holds | 1, 5 |
| Open | Space and Type together, md controls 44 to 48 | No | Yes | 1, 5 |

What the canvas cannot show: an overlay a part opens (a menu, the lightbox) is drawn outside its frame and keeps today's scale. Under Space and Open, a box sized by token (a 44px control) does not grow while a box sized by number beside it does, so a part that mixes the two can look uneven; the last column counts where content no longer fits.

No spacing unit between 4px and 8px keeps every step on the 8px grid. So "Flat has more space in every part" and "Flat keeps the 8px grid" cannot both be true: Flat either takes its own grid, or gets its air part by part, in its bodies and blocks.

## Decisions

| # | Question | Suggested | Decision |
|---|---|---|---|
| 1 | Does Flat take its own scale at all, as it took its own shape (v1.9) and its own face and accent (v1.11)? | Yes. Size and space are what a visitor reads first, before material. | **Yes**, by choosing Space. |
| 2 | Which candidate is closest to "airy, easy to use"? | Space. It is how litt.design gets its air, and it keeps R8's sizes. | **Space.** Nick, 2026-11-10: "go with space". |
| 3 | If space: Flat's own unit (5px, so a 10px grid), or the 4px unit with air built into Flat's bodies and blocks one at a time? | The unit, if the overflow counts stay near Today's: it reaches every part at once, and 68 parts have no Flat body yet. | **The unit**, as Space was shown: 5px. |
| 4 | Does Flat's text grow to 16? | No. Keep 14 on a 24px line; rank stays with weight and ink (R8). | **No**, as Space was shown. |
| 5 | Do Flat's md controls grow to 48? | No. 44 is the touch target, and the 28px pill is exact up to 56. | **No**, as Space was shown. |
| 6 | Which world next? | Device, tighter, once Flat's is in and seen. | |

## After the decision

The pick moves into the Flat block of `tokens.css` through `workflows/evolve.md` (Propagate): the profile's Fixed decisions and R8 or R9 say what Flat may do, `foundations.md` and Flat's Foundations lines in `gallery/src/gallery/look.ts` follow, the registry changelog gets a `litt` line, and `gallery/src/canvas/scale.tsx` and its entries go. The 55 control-sized boxes set by number are moved to the control tokens first if the unit changes, so a control and the box beside it grow together.

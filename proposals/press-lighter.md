# Press, lighter: fewer cues per object

Written 2026-11-13 for Nick. Reviewing litt.md against Emil Kowalski's design-engineering standards, Nick said: "I feel like we over-designed press". This proposal reads that against the code and offers a lighter Press for Nick to pick on the canvas. Nothing here changes yet.

## What Press is today

Press says the depth ladder (R3) with objects lit from the top (R2): trays and cuts sit down, blocks and caps stand up. The nouns themselves are used. Counted through the Tailwind utilities as well as `var()`, the cap family reaches eight components (slider, range chart, slide to confirm, pad, curve editor, spring editor, color picker, time scrubber), the slot eleven, the plate nine and `--block-press` about thirty. The nouns are not where the weight is.

The weight is in how many cues each object carries at once.

| Part | What draws it today | Cues |
|---|---|---|
| Secondary button | a 2-3px plate border (`--slot`), the block face, the top highlight, a 2-layer cast (`--block-lift`), a 2px wall along its foot | 5 at rest |
| Secondary button, pressed | the wall goes, the cast swaps to `--block-press`, the label drops 1px | 3 more, two of them snap |
| Primary button | the plate border, the accent face, the glow, an inset highlight, the wall | 5 at rest |
| Danger in a dialog | the danger block, then 8 `in-[[data-dialog-footer]]` overrides that take most of it off again | 8 overrides for one state |
| Slider cap | the cap, an inset highlight, an inset lower edge, a ring, a contact line, a 3px cast (`--cap-lift`, 5 layers), a grip line | 7 |
| Slider plate | `--plate-lift`, 4 layers, and a slot with 3 more (`--slot-shade`) and a shaded fill | 8 |

Per theme, the press tokens hold 28 shadow layers, and every dark value is written twice (the `[data-theme="dark"]` block and the `prefers-color-scheme` block).

## Why it reads as over-designed

1. **Cues stack instead of agreeing.** A button press changes three things, and two of them cannot animate: a background image (the wall) and a shadow held in a CSS variable snap, while the 1px label drop runs on the instant tween. The eye gets three small signals out of step instead of one clear one. Emil's rule is one press cue: the whole thing moves under the finger.
2. **Near-duplicate recipes.** `--key-lift` is `--block-lift` plus a darker lower edge, which the button already draws as its wall. `--plate-lift` is a taller block. `--cap-press` is a tighter `--cap-lift`. Each is tuned by hand in light and in dark, so every tweak is four edits.
3. **Details you notice.** Emil's polish is many details nobody consciously sees. A 2px wall, a half-pixel sink and five-layer casts are details you do see, so the craft shows instead of the content.
4. **The showcase already chose.** The gallery opens in Flat (`GALLERY_LOOK`), while the registry ships Press (Q17).

What is right about Press stays: "it needs to feel physical" (2026-10-24) and "this new slider looks like the move!" (2026-10-26). The cap leaning into a fast push, the 1:1 drag and the notches are good motion under a hand and are untouched here.

## The proposal: one cue per job

| Part | Before | After | Why |
|---|---|---|---|
| Button press | wall goes, cast swaps, label drops 1px | the whole button scales to `--press-scale` (0.98) on the instant tween, the cast tightens at once | One cue that moves the object, interruptible, and it already exists as a token |
| Button at rest | plate border, face, highlight, 2-layer cast, 2px wall | face, highlight, 2-layer cast | The wall and the plate border repeat what the cast says |
| Primary button | plate border, face, glow, inset highlight, wall | face, glow, inset highlight | The glow already marks it as the one primary action (R6) |
| Danger in a dialog | a block plus 8 overrides | the danger fill, as a variant of its own | Nothing to take off when nothing was put on |
| `--key-lift` | its own recipe | `var(--block-lift)` under Press | Same object; Device keeps its own key (`--device-key-lift`) |
| `--plate-lift` | 4 layers | `var(--block-lift)` under Press | A plate is a block; the cap on it gives the height |
| `--cap-lift` | 5 layers | 3: the highlight, a contact line, one cast up to 3px | Keeps the taller cast, drops the inner lower edge and the ring |
| `--cap-press` | its own recipe | `var(--block-press)` under Press | A held cap tightens like any pressed block |
| `--slot-fill-shade` | an inset shade | the empty shadow (`0 0 0 0 transparent`) | The fill is already a step darker |

Because `--key-lift`, `--plate-lift` and `--cap-press` become aliases in `tokens.css`, no component file changes for them. Only `tokens.css`, `button.tsx` and the dialog's danger action change. Shadow layers per theme go from 28 to 13.

What stays as it is: the tray, the cut, the block, the slot, the cap, the grip, the notches, Flat, Device, glass, the light and grain.

## How to decide

Put three columns on the language canvas (`#canvas`, `gallery/src/canvas/`): Press today, Press lighter and Flat, each showing the secondary and primary buttons (rest, hover, pressed), a segmented control, a field, a slider with its cap held, and a dialog's danger confirm, in light and dark. The canvas is where candidate values sit before they move into `tokens.css`. Nick presses each one and picks.

## Decisions for Nick

| # | Question | Recommendation |
|---|---|---|
| 1 | Does a press scale the whole button (0.98) or sink it? | **Scale.** It is one readable cue that interrupts cleanly. R4's "a press sinks it half a pixel" becomes "a press scales it to `--press-scale`". Device keeps its 2px key sink. |
| 2 | Drop the wall and the plate border from buttons? | **Yes.** The cast already says raised. |
| 3 | Fold `--key-lift`, `--plate-lift` and `--cap-press` into the block's tokens under Press? | **Yes, as aliases.** Names stay, so nothing breaks for installers. |
| 4 | If Press lighter wins, does the registry ship it as the default (Q17)? | **Decide after the canvas.** If Press lighter and Flat look like two strengths of one idea, Q17 gets easier. |

## Also deferred: reduced motion keeps its fades

The review also suggested that reduced motion keep opacity fades and still everything that travels, scales or rotates, since that is what the setting asks for. It is not in the motion fixes because it reverses a written rule, not a value. R4 says "reduced motion stills it all", `tokens.css` zeroes every `--dur-*`, the motion engine's `StillMotion` returns zero durations, and `test:motion` fails on any opacity change under reduced motion. Doing it means a fade token that survives the reduced-motion block (`--dur-fade`), the engine's `reduced` path keeping opacity on that token, and `test:motion` allowing opacity while still failing on transform. It is its own decision for Nick, and the change after that is mechanical.

## If Nick agrees

Run evolve: log the reactions, then Propagate. That covers the values in `tokens.css` (both themes, and the dark block written twice), `material.md` section 6 and its per-theme table, R3 and R4 in `profile.md`, `components.md` for the button, the canvas columns, and a `changed` line for `litt` and `button` in `gallery/CHANGELOG.md`. `test:corners` and the contrast checks run again under Press.

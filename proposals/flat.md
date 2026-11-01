# Flat: a second material

Written 2026-11-01 for Nick. Nick asked whether litt.md is becoming a UI builder, and the answer was configure, export, check: the Customize looks grow toward a theme you can hand to an agent, and litt's checks score what comes back. Nick: "yes that's what I meant, I want to implement flat design like the new litt.design page. gray, soft, animated thoughtfully. next will be components theme."

The reference is litt.design's work slider (#22, #23 in that repo): each project sits in one grey frame (a 4px inset around the picture, the inner corner the outer less the inset), nothing casts, hover steps the fill one grey darker on the instant tier, and the round Previous and Next buttons are the same grey. The page is neutral grey, not warm. Content swaps arrive in soft focus: the caption blurs in as the track moves.

Flat conflicts with a fixed decision, the Signature (material you can touch, R3's press material), so Nick decided each conflict:

| # | Question | Decision |
|---|---|---|
| 1 | Flat replaces the press material, or sits beside it? | **Beside it, as a choice.** A Material choice, Press or Flat, as `data-material="flat"`, which `tokens.css` answers by overriding the neutrals and the press tokens. It sits in Customize and in the `?look=` links. The gallery opens in Flat; the registry keeps shipping Press until Q17 is answered. |
| 2 | What does "animated thoughtfully" allow? | **Soft focus, on a hand.** A content swap that a hand causes (a carousel step, a caption change, a tab's panel) may arrive in soft focus: a fade with a blur of at most 4px, on the responsive spring. Never on material, never on scroll, and reduced motion stills it. R4 gains the line. |
| 3 | Which greys? | **Neutral grey, like litt.design.** Under Flat each neutral is its stone value at the same OKLCH lightness and chroma 0, in each theme. |

## What Flat is

Flat says the same depth ladder (R3) by fill alone: **grey is the object, a hairline is the place.** Nothing casts, nothing catches the light, and nothing sinks under a press. Floating things keep their glass, glow and ring, since an overlay still has to separate from the page.

| Depth | Press (today) | Flat |
|---|---|---|
| Sunken: a tray | a floor a step down, a hairline, the top wall's shade | no fill (`transparent`), a `--line-strong` hairline inside |
| Sunken: a cut (fields, boxes) | its floor and the top wall's shade inside the control line | `--surface-1` inside the control line, no shade |
| Sunken: a slot | a floor, the top wall's shade, the lit lower wall | `--surface-3`, no shade; the fill a step darker (`--fg` 14% into `--surface-3`) |
| Flat: the canvas and surfaces | a hairline and the top highlight | a hairline; no highlight |
| Raised: a block | white, a contact line and a soft cast | `--surface-3`, no cast; hover one step darker (the components' own 4% ink mix) |
| Raised: a cap and its plate | taller, a cast up to 3px | a mid grey cap (`--fg` 45% into `--surface-3`, 55% held), no cast |
| Floating | glass, a zero-offset glow and a ring | unchanged, minus the top highlight |

Every value with no shadow is the empty shadow `0 0 0 0 transparent`, never `none`, because components put these tokens inside comma lists (`var(--danger)` ring plus `var(--block-lift)`), where `none` voids the whole declaration. `--press-depth` is 0px. Translucent tokens (glass, glows, rings, notches) keep the stone ink: at 10% alpha or under, its hue does not show.

## How it is built

The house pattern for pink: each theme block in `tokens.css` declares mirrors (`--flat-canvas`, `--flat-surface-1` and so on, eleven neutrals), and one block, `:root[data-material="flat"], [data-material="flat"]`, maps the live names onto them and restates the press tokens and the derived tokens that read a neutral (`--focus-ring`, the five data tints). It comes last in the file, after monochrome, so on a nested element that carries both attributes it wins on order.

A host sets the attribute on `<html>`, like the accent. The gallery sets it on `<html>` too: it changes the canvas, as `data-theme` does, and the Playground's motion dial never touches the neutrals. An element that sets its own theme (`class="dark"`, `data-theme`) needs `data-material="flat"` too, as it needs `data-accent`. The gallery's previews get it from `lookAttributes`.

`check.mjs` holds Flat to the same bar as Press: every contrast and APCA pair runs again with the flat neutrals swapped in, each flat neutral has chroma 0 at its stone twin's lightness, the flat block maps every neutral, and nothing in it casts.

## Out of scope: the components theme (next)

Tokens alone make every component flat but keep their shapes. The components theme, next, carries litt.design's recipes into the components: a card as a grey frame with the content inset 4px, the round icon button, the card picker's frames, and `SoftSwap`, the motion engine's one soft focus (the only place a blur may animate, so the lint can keep failing a raw `filter` everywhere else). The last task of this plan screenshots every page in Flat and writes what it shows at the end of this file, as that plan's input.

## Opened

- **Q17.** The registry's default material. The gallery opens in Flat; installs get Press until a project sets `data-material="flat"`. *Suggested:* decide after the components theme, when Flat has its own recipes and can be judged whole.

## What the build showed

Built on `claude/brave-mendel-t92xdv` (taste v1.4). Eleven pages were shot in Monochrome on Press and on Flat (`node gallery/scripts/shot.mjs --look mono` and `--look mono-flat`), in both themes, on desktop and phone, plus the Dialog and the Menu open. No console errors and no sideways scroll. R1's check holds: with the press material gone, every page still reads as finished, because each control says its state in words.

| Page | What reads | What the components theme should change |
|---|---|---|
| Overview | The deck's Material row; picks and the slider in grey; the canvas a neutral grey | The hero says "warm stone, lit from above", which Flat is not: the line should follow the look. The deck is a white card with a hairline; litt.design would frame it in grey. |
| Button | The secondary is a grey fill on the canvas, litt.design's round buttons' grey; the destructive keeps its red words | litt.design's round icon button (the Previous and Next pair) has no litt component yet. Under Flat a press could scale (litt.design's 0.96) now that nothing sinks. |
| Switch | A grey block in a hairline tray that says On or Off | It reads, but On and Off weigh the same grey; the accent switch option carries the main choice. |
| Segmented | The picked segment is a grey fill in a hairline track, as on litt.design | Nothing. |
| Slider | A grey slot, the fill a step darker, a mid-grey cap with its grip | The plate around the slot is gone with its cast; a slider on a grey surface could lose its slot. Check it on `--surface-3`. |
| Checkbox and radio | Unchanged: ink marks in white cuts inside the control line | Nothing. |
| Input, Select | Fields unchanged but for the inner shade; the Select trigger is a grey block, as a raised thing should be | Nothing. |
| Card picker | The pick is a grey fill inside a hairline | The litt.design frame (a grey card, the content inset 4px) is the natural pick here. |
| Card | White with a hairline, as in Press | The litt.design card recipe: one grey frame, the cover inset 4px at the control radius, the label under it, hover one grey darker. |
| Dialog, Menu | Glass, glow and ring as in Press, minus the highlight | Nothing. |

Still to build in the components theme: `SoftSwap` (soft focus on a swap a hand causes, R4) and its first users (a carousel step and its caption, a tab's panel).

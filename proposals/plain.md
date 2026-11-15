# Plain: a fourth world with almost no UI

Written 2026-11-15 for Nick. Nick: "let's build another world: minimal UI / no UI, looks like html, simple, to the point, easy to use". Asked which HTML, Nick chose **styled plain HTML** (a well-made README, not raw browser defaults and not a brutalist document), the name **Plain**, and a first slice of **tokens, the world page and this plan**, with Plain's own bodies to follow.

## What Plain is

| | Press | Flat | Device | **Plain** |
|---|---|---|---|---|
| What it is | The instrument | The page, designed | The machine | **The page, as HTML draws it** |
| For | Product UI, dashboards | Sites, portfolios, reading | Agents, terminals, tools | **Docs, forms, admin, internal tools** |
| Tagline | Lit from above. Objects you can hold. | Grey is the object. Nothing casts. | Hardware. Keys, wells and LCD glass. | **No UI. A page that works.** |
| Accent | Blue 4 | The ink | Orange | **Link blue** (`#0000ee`; a pale blue in dark) |
| Face | Helvetica Neue | Geist | Geist Mono | **The system's** (`system-ui`, nothing to load) |
| Shape | 4px and 8px | The pill | 4px and 8px | **Square** (0) |
| Depth | Lit, cast | Fill alone | Hardware | **One 1px line, no fills, no frames** |
| Motion | Weight | From where you touched | Mechanisms in steps | **None** |

The rule that makes it Plain: **the browser already designed a page that works; Plain keeps it and takes the noise out.** A link is underlined and blue. A control is one 1px line, with nothing inside it but its words. A table is lines and a caption. An overlay is the page again inside one line. Nothing moves, so a state changes the moment you ask.

## What shipped in this slice

- **Tokens** (`tokens.css`): `--plain-*` in both themes, the plain block after Device (neutrals, link blue, the system face, radii 0, glass, shadows and grain to nothing, the depth ladder as 1px lines, every motion tier at 0), Blue 4, pink and monochrome restated after it, the reduced-transparency, more-contrast and no-color-mix fallbacks, and underlined links in the base layer.
- **Checks** (`check.mjs`): check 5 runs every pair under Plain light and dark; check 14 holds the block (mapped, after Device, square, lines only, still, the accents restated); check 9 reads the locked tiers without it; check 13 knows the fourth face.
- **The look** (`look.ts`, `index.html`, `test-look.mjs`): `plain` and `-plain` in the link's grammar (`?look=plain`, `pink-plain-fun`), 28 looks, Copy setup and `llms.txt` say it, the pre-paint script paints it and `#plain` opens in it. Customize's shape locks to Square under Plain.
- **Motion** (`deal.ts`, `motion/index.tsx`): `Material` gains `"plain"`; under Plain the dial is held still, so every part that asks the engine changes at once, overlays neither grow nor slide, and a deal resolves at once. `byWorld` falls back to Press's body.
- **The world page** (`00-plain.tsx`, `systems/plain.tsx`): five scenes, a request form, a help page, search, records and preferences, with Settings as its hero block, Foundations and Only here from `look.ts`.
- **Registry**: `litt`, `base-styles`, `motion`, `chart` and `file-drop` lines in the changelog.

## Stripped further (same day)

Nick, shown the first slice: "strip it down even more". A control has no fill of its own any more (the button face's grey is gone: `--block` is the page), its line is drawn inside its box so the Press plate never shows as a second frame, a group has no frame (`--tray-shade` is empty), the primary action has no glow ring, and a button has no wall along its foot (`--block-wall`, 2px elsewhere and 0 here). The current tab keeps a line on three sides, a folder tab.

## What is not right yet

Plain draws Press's **bodies** in its own tokens, so structure Press bakes into a part still shows: a switch is still a block in a tray with On and Off beside it, and a slider sits in a box. That is the work of the next waves, as Bodies did for Flat and Device (`worlds.md`, decisions 13 and 15).

## Next: Plain's bodies, in waves

Each Plain body is the HTML element it stands for, styled no further than a careful stylesheet would: the test is that it could pass for a native control with a 1px border.

1. **Controls on every form:** Button (one rectangle, a 1px line, the face, pressed the line goes to the ink), Input and Textarea, Select (a native-looking box with a chevron), Checkbox and radio (square and round boxes, a tick in the ink), Switch (a checkbox with On and Off in words), Segmented (a row of buttons sharing lines), Tabs (an underlined link row).
2. **Overlays:** Dialog (a box with a title bar line, no scrim blur), Menu and Select's list (a bordered list, the row under the hand in the face's grey), Tooltip (a `title`-like box), Toast (a line of text in a bordered box at the foot).
3. **Data:** Table (lines and a caption, as the Records scene), Chart (lines and bars in the data hues on white, no grid fill), Progress (a native-looking bar).
4. **Plain-only parts:** a document layout (a 65ch column, `h1` to `h3` by weight, a table of contents in links), a definition list, a form summary of errors as a list of links.

## Decisions for Nick

| # | Question | Recommendation |
|---|---|---|
| 1 | Body text at 16px, the browser's own size, under Plain only? | **No, for now.** It would break R8's 14px rule and the per-world scale is still being judged on Flat (`world-scale.md`). Revisit once Flat's scale lands. |
| 2 | Visited links in purple? | **No.** It is honest HTML, but a second link color competes with the data hues; keep one link blue. |
| 3 | Is the gallery's own chrome (the sidebar, the header) Plain on Plain pages? | **Yes**, as it is for every world: you arrive in the world. |
| 4 | Wave order | Controls, then overlays, then data, then the Plain-only parts. |

## Questions for Nick's tests

1. On `#plain`, does it read as HTML, or as a theme with square corners?
2. Is link blue right in dark, or should Plain's dark be a lighter page?
3. With the motion gone, does anything feel broken rather than calm (a menu that snaps, a toast that just appears)?

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

## No UI, a prototype on the canvas

Nick: "what if it was no ui at all". On `#canvas`, below Press's columns, three screens (a request, search, preferences) as Plain ships them beside No UI (`gallery/src/canvas/no-ui.tsx`): nothing drawn but type and the browser's own controls. An action is an underlined word in link blue, the main one with an arrow; a field is one line under what you type; a choice is words, the current one in the ink and the rest underlined; the checkbox and the select are the browser's. The rule that keeps it usable: what a hand can use is underlined or in link blue, and nothing else is (WCAG 1.4.11). Nothing in `src/components` changes for it. If Nick picks it, it becomes Plain's bodies, starting with Button, Input, Switch, Tabs and Segmented, and a check holds the rule.

## Wave 1 shipped: quiet form controls

Nick picked No UI ("I love it") and asked for the first wave; then, shown it with link-blue underlines on every control, asked for it "more tasteful and simple, a bit like mercuryos.com", with a reference: a column of grey words, the current one in the ink inside four corner marks. So Plain's controls are **quiet**: a control is its words, grey until it matters, and the one that matters (the main action, the current choice, the row under the hand) is the ink held in four corner brackets. Blue is left to links in running text, which stay underlined (WCAG 1.4.1); a link that stands alone is its words.

| Part | Plain body (`gallery/src/components/bodies/<part>.plain.tsx`) |
|---|---|
| Button | Its words. Primary is the ink at the title weight inside four 6px corner marks; secondary and ghost grey, taking the ink and the marks under the hand; danger red. No fill, line or side padding. |
| Input, Textarea, Field | One 1px `--line-control` rule under what you type, drawn as a background so it never moves the text; 2px in `--focus` on focus, in `--danger` on an error. The label above at the text weight. |
| Select | The field's rule with a chevron; the list is the page inside one line; rows are grey, the current one the ink with its check, the row under the hand or the keys in corner marks (no wash, no ring). |
| Checkbox, radio | A square or circle in one line; checked, the line goes to the ink and an ink tick or dot sits in it, never a fill. |
| Switch | Two words, On and Off: the side it is on in the ink inside corner marks, the other grey. Still one `role="switch"` button. |
| Segmented, Tabs | Grey words in a line, the chosen one in the ink inside corner marks; no rule, tray or frame. |

The marks are the word's own color (`currentColor`), eight 1px bars drawn as one background, so they move nothing and follow forced colors. The chosen word keeps the text weight, so picking never reflows the row. On Plain's page the first screen has no accent fill at all, and `test:worlds` expects none there.

## Wave 2 shipped: overlays

Each overlay is the page again inside one 1px `--line-control` line, square, with no shadow, blur or glass (Plain's tokens already make `litt-glass` that, so most panels needed no class). Menu, context menu and command menu rows are grey words; the row under the hand or the keys is the ink inside corner marks, and the glide draws no wash or ring (forced colors keeps its Highlight). The command menu's search is one line under the words. A dialog's scrim is a flat 8% wash of the ink with no blur, and a sheet's grabber a 1px line. A tooltip is a `title`-like box in one line. Built by five parallel agents, one per file set, each adding only `in-[[data-material=plain]]:` classes so Press, Flat and Device are untouched.

## What is not right yet

The other parts still draw Press's **bodies** in Plain's tokens, so structure Press bakes into a part still shows: a slider sits in a box, a card is a grey fill, a tag is a chip. That is wave 3, as Bodies did for Flat and Device (`worlds.md`, decisions 13 and 15). No check holds the quiet rule yet (one framed thing per group, grey for the rest); it should come with wave 3.

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

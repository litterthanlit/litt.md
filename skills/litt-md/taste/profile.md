# litt.md taste profile

> v0.11 · built from 2 interviews, 3 audits (8 sources), 1 type trial (14 faces), 1 components trial (8 components), 1 motion proposal (14 decisions), 1 open-decisions review (26 decisions), 1 tag trial (4 options), 1 reference set (5 shots), 66 journal entries · October 2026

This is Nick's design language, written as rules you can check. Every rule has an ID (`P#`) so journal entries can point at it, and a **Check** line so a critique can say pass or fail rather than "feels off".

## Point of view

**Technical precision, lit from above.** The structure is exact and quiet: an 8px grid, hairlines, tight type, one font family at one weight. The one place it gets bold is light and material. Surfaces have physicality: glass that floats, a soft light source falling from the top, edges that catch the light, a trace of grain. Color barely appears, and where it does, it behaves like light or carries data.

Five words: **precise, lit, airy, calm, exact.**

## Fixed decisions

| Area | Decision | Why |
|---|---|---|
| Character | Technical precision (Linear/Vercel lineage) | Interfaces should feel engineered and inevitable, not decorated. |
| Themes | Light and dark are both first-class | Neither theme is an afterthought or a mechanical inversion. |
| Type | Hanken Grotesk + Geist Mono, nothing else, weight 400 only; display stops at 40 | One grotesk carries everything; mono is for code, keys, data and tags. Heavier weights read too wide (P9), and poster-sized headlines are out. |
| Signature | Light and material | This is where the boldness goes, and it is what separates litt.md from generic dark mode. |
| Color | Cool neutrals (OKLCH hue about 262), monochrome chrome, one accent per project. Litt's own accent is cobalt. Five data hues carry data and never chrome (P11) | Hierarchy comes from tone. The accent is chosen per project; Litt's own sits on nearly the neutrals' hue, so the light it casts stays cool. Color that says something (which series, which category, how much) earns its place; color on chrome is decoration. |
| Density | Airy | One idea per section, with generous negative space. |
| Shape | Slight radius: controls 4px (tags and chips too), surfaces 8px, pills only for avatars, icon-only buttons and switches. Radio marks and slider thumbs are circles | A little radius softens the precision and stays exact. A surface is a control plus the 4px inset, so corners nest. Two sizes and the pill, nothing in between. A switch keeps its familiar shape, because it must read as a switch at a glance. |
| Motion | Sweet spot, three tiers. Instant: 100ms ease-out tween. Responsive: spring, 200ms, bounce 0. Expressive: spring, 350ms, bounce 0.12, one moment per view. Exits run at 0.75× and never bounce. On phones the modal is a bottom sheet that rises by its own height on the expressive spring, never uses up the view's one moment, and drags down to dismiss | Fast by default, with one signature moment per view. Motion confirms actions and never performs. Only transform and opacity animate, plus color fades at instant. |

## Signature rules

**P1. Light, not paint.** The accent appears mostly as light: a tinted radial falloff, a focus halo, a glow on the one primary action. Large flat fills of accent are rare: at most one per view, and only on the primary action. Checkboxes, radios and switches fill with `--fg` when on, never the accent, because a form can hold many of them.
- *Check:* count the accent fills in the view. More than one fails, and a checked checkbox, radio or switch in the accent counts as one. Accent used only as text color or flat icon color, with no light anywhere, is a missed opportunity. A data hue (P11) is not the accent and does not count.

**P2. One light source per view.** Light comes from the top. Highlights sit on top edges (`--highlight`), the radial light is anchored at the top, and no two glows contradict each other.
- *Check:* glows come from more than one direction, or a highlight sits on a bottom edge → fail.

**P3. Glass is earned.** Only surfaces that float above content get glass: the sticky header, the command menu, popovers, modals and toasts. Cards in the page flow are solid surfaces.
- *Check:* glass on a non-floating element → fail.

**P4. Depth without drop shadows.** Raised cards carry no shadow: a hairline and the top highlight do the work, plus stepped surfaces (`--surface-1` to `--surface-3`). Floating surfaces (menus, popovers, toasts, modals) get a zero-offset glow plus a 1px ring (`--shadow-tooltip`, `--shadow-float`, `--shadow-modal`), so the light stays even on every side.
- *Check:* any outer shadow with a non-zero x or y offset fails. The only inset layers allowed are the top highlight (`inset 0 1px 0`) and the hairline (`inset 0 0 0 1px`). An outer glow on a card in the page flow fails. Accent glows come under P1. The check script scans the assets.

**P5. Material is static.** Glow, grain and gradients never animate, pulse or follow the cursor. Light is architecture, not effect.
- *Check:* any animation or transition on background-image, filter, or glow opacity → fail.

**P6. Precision.** Spacing sits on the 8px grid (4px allowed inside components). Borders are 1px hairlines. Tracking tightens as size grows (see the type tokens). Edges align to the column grid.
- *Check:* spacing values off the scale (for example 20px, 28px, 36px; `p-5`, `p-7`) → fail. A 2px or heavier border used decoratively → fail.

**P7. Airy rhythm.** One idea per section. Section spacing is 128px desktop, 96px tablet, 64px mobile (`--section-y`). The default composition is asymmetric and left-aligned. Centered layouts are reserved for a single short statement.
- *Check:* more than one headline-level idea in a section → fail. A page where every section is centered → fail.

**P8. Designed, not inverted.** Each theme has its own material values: grain is 2% in light and 4% in dark, the light tint is 12% in light and 22% in dark, glass opacity and borders are tuned separately. A theme produced by flipping the other's colors fails.
- *Check:* both themes are specified for every surface and material token in `tokens.css`. The check script verifies this.

**P9. One weight.** Hanken Grotesk and Geist Mono at 400 only. Heavier weights read too wide. Hierarchy comes from scale, color and tracking, never weight. That includes labels, buttons, headings and the wordmark.
- *Check:* any computed font-weight above 400 fails, including browser defaults on `h1`–`h6`, `b`, `strong` and `th` (`tokens.css` resets them). `font-medium`, `font-semibold` or `font-bold` in markup fails. The check script scans the assets.

**P10. Roomy controls.** Buttons and inputs share one height scale: sm 32, md 44, lg 56 (`--control-*`). The label is trimmed to its cap height (`.litt-trim`), so at sm and md the side padding roughly equals the air above and below it: sm pad 12, md pad 16. An lg button runs wider, pad 32 (`--button-pad-lg`), because at 56 tall a near-square box reads as a block; an lg field keeps pad 24. Hero CTAs and the submit of a page form use lg, and go full width in narrow forms. A dialog is compact: its fields and actions use md. A field is lg only when it shares a row with an lg button (the inline form). Labels stay 400 and small, so the box carries the presence.
- *Check:* control heights come only from the scale. For every sm and md button, side padding ÷ vertical air (from the trimmed label to the edge) sits between 0.85 and 1.25; for an lg button it sits between 1.3 and 1.6. A hero or page-form CTA below lg fails, and so does an lg field or button in a dialog.

**P11. Color carries data.** Beyond the one accent, color appears only where it says something: which series or category a mark belongs to, how much (a step of a heat scale), which side of a goal a value falls on, or who or what a thing is (a category tag, an avatar). It comes from the five data hues, `--data-blue`, `--data-amber`, `--data-teal`, `--data-violet` and `--data-rose`, assigned in that order and never cycled. Each has a mark tone (3:1 on every surface), a `-text` tone (4.5:1, also on its own tint) and a `-tint` fill. Chrome never takes a data hue: buttons, controls, surfaces, borders, nav, rails, gridlines and running text stay neutral, and the accent keeps the primary action. Within one chart or one list a hue means one thing. Status stays with success, warning and danger, and a word. A single quantity may stay in the foreground, which is the quiet default.
- *Check:* a data hue on a button, a control's fill, a surface, a border, a nav row, a rail or a gradient fails. One hue for two meanings in a chart or a list fails, and so does a hue picked only to brighten. A color outside the five fails, and a sixth series folds into "Other" or a second chart. A hue's mark tone or tint used as text fails (the lint checks it): text in a hue takes its `-text` tone.

## Do

- Let type do the hierarchy. Use scale jumps (40 against 15) first, then color (`--fg` against `--fg-muted`), then tracking. Never weight.
- Use `--fg-subtle` for supporting text and `--fg-muted` for body. Keep pure `--fg` for headlines and key values.
- Give the primary action the only accent fill on the page, and let it glow (`--glow`).
- Put busy content behind glass, because that is where glass earns its blur.
- Use the mono (`--font-mono`) for real code, keyboard shortcuts (`⌘K`), numbers in tables, and version strings.
- Design the empty, loading, error and focus states with the same care as the default.
- Keep a visible focus ring: 2px `--focus` at a 2px offset.
- In menus, the command menu and dense lists, use one highlight that glides from row to row. Airy content layouts keep the per-row fill.
- Keep corners concentric. A surface is 8px, and a control 4px inside it sits 4px from its edge.
- Give each view one expressive moment: a dialog, a toast or a list entrance. Everything else is instant or responsive. A phone sheet does not use it up: at a sheet's height the bounce is under a pixel, so it reads as placement.

## Don't

- Add a second typeface, a serif display, or a "fun" font for one section.
- Use a weight above 400 (medium, semibold or bold), even for a small label or button.
- Use gradients as decoration (purple-to-blue heroes, gradient text, gradient borders).
- Bounce a spring past 0.12, bounce on the responsive tier or on any exit, or give a view more than one expressive moment. The instant tween stays at or under 240ms.
- Animate layout properties (width, height, top, left), use `transition: all`, or animate anything but transform and opacity. Color, background-color, border-color, fill and the focus ring may fade at `--dur-instant`.
- Add motion that is not a response to the user: no scroll-triggered reveals, no looping autoplay, no parallax, no marquee, no pulsing or shimmering skeleton. The one expressive entrance per view plays once, on arrival.
- Use a radius off the scale. Controls are 4px, tags and chips included, surfaces 8px, and pills are only for avatars, icon-only buttons and switches.
- Mark a status or the current page with a dot. Say it in words (a tag), or step the text color.
- Put a drop shadow with an offset on anything, or any shadow on a card in the page flow.
- Fill backgrounds with accent color. Tint the light instead.
- Put a data hue on chrome (a button, a surface, a border, the nav), or give each row its own hue just to brighten the list.
- Put glass on static cards, or stack glass on glass.

## Generic-AI tells this language must avoid

Claude's default output drifts toward these. Each one is banned unless the session explicitly asks for it.

- Purple-to-blue gradient hero on white or black.
- Emoji as section markers or bullet icons.
- Everything centered, section after section.
- An accent bar or rail on the left edge of rounded cards.
- An arrow suffix (`→`) on every link and button.
- One radius (`rounded-lg`, 12px, 16px) applied to every element. Litt has two on purpose: 4px controls and 8px surfaces, plus the pill.
- The same uppercase mono eyebrow above every section ("01 / FEATURES").
- Three equal feature cards with an icon, a title and two lines, as the default answer to every section.
- One word of the headline picked out in accent color.
- Inter or Space Grotesk as the "safe" face. litt.md uses Hanken Grotesk.

## Open questions

The interview workflow works through these. When one is answered, move the answer into a rule (`P#`) or decision and delete it here.

- **Q1.** How often may uppercase mono labels appear? Never, once per view, or as a system for metadata only?
  - *Evidence:* v0.8 set tags in Geist Mono, in sentence case: mono as a system for metadata, without uppercase.
  - *Evidence:* Fluid Functionalism bans uppercase, eyebrow labels and letter-spacing outright, enforced by lint.
- **Q3.** Icon style: stroke weight (1.25, 1.5 or 2), set (Lucide, Phosphor, custom), and size relative to text.
  - *Evidence:* thin 1.5px line-icon sets recur on the Cosmos board (4 pins).
- **Q4.** Density in app UI versus marketing pages. Is "airy" a marketing rule only, with app screens allowed to go compact?
- **Q5.** Art direction for imagery: product screenshots only, 3D renders, photography, abstract light studies?
  - *Evidence:* product UI floating over atmospheric, blurred photography or painting shows up on the Cosmos board (about 8 pins) and on Cursor's hero.
- **Q6.** Does the glass, glow and grain signature apply to client work, or only to Litt's own properties?
- **Q7.** Texture: noise grain (P5 today) or a dot grid / dot matrix?
  - *Evidence:* the v0.11 reference set (five shots of dark data panels) uses dot matrices as data (a usage grid, a reply-time distribution) and a dot grid behind a 2D control. Litt now draws dots as marks and as a coordinate grid inside a control, not as page texture.
  - *Evidence:* litt.design has a dot-grid background, the Pinterest "OS" board is about half dot-matrix and pixel patterns, and dither appears on Cosmos.
- **Q8.** Light: one accent-tinted source from the top (P2 today), or soft multi-hue ambient fields?
  - *Evidence:* 2026-10-19, Nick on the gallery's lit, grained band at the top of every page: "remove the gradient from the page". The gallery now has no page light; the glass header is its only material. Open: should any page keep the radial light, or does light live only on objects (the primary glow, edges, glass)?
  - *Evidence:* litt.design uses peach and blue blobs at the sides, and Cosmos has warm gradient fields.
- **Q9.** Neutral temperature: the interview chose cool, but litt.design and Vercel are true neutral gray, and Cursor and Ramp are warm. Keep cool?
  - *Evidence:* 2026-10-19, Nick: "I think the design needs to feel more welcoming". Temperature is one lever; weight (Q20) is another.
  - *Evidence:* Fluid Functionalism is true neutral gray too (chroma 0).
- **Q11.** Exposed editorial structure (visible column rules, index numbers) shows up a lot on the Pinterest "web" board. Allow it as a secondary device on content pages, or keep the language purely light-and-material?
- **Q12.** Which theme comes first on marketing pages when the system preference is unknown? Cursor, Vercel and litt.design are all light-first.
- **Q14.** Mono: keep Geist Mono next to Hanken Grotesk, or switch to JetBrains Mono, Fragment Mono or IBM Plex Mono?
  - *Evidence:* Nick is "tired of Geist" but only replaced the sans. The type trial paired Hanken Grotesk with JetBrains Mono by default.

- **Q20.** One weight, but which? P9 holds everything at 400, from Nick's 2026-10-10 "fonts are too wide" about heavier weights. On 2026-10-19 Nick found 400 "too thin, as well as in button". Raise the one weight (450 or 500), or keep 400 and find the heft elsewhere (size, contrast)?
  - *Evidence:* Nick's own Frame 103 (2026-10-19) sets the button label at about 500, measured against Hanken Grotesk's stroke width. The same frame brings a navy-to-cobalt gradient brighter at the bottom (light from below, against P2), corners about 6px (against the 4px control radius) and no glow (against P1's glow on the primary action).
- **Q21.** Tags: since v0.8 they are the selected segment's look in mono (surface-1, hairline, top highlight). On 2026-10-19 Nick said they "feel off". They share that raised, edged look with the secondary button and the selected segment, so a label reads like a control. Quiet fill, outline only, or sans?
## Changelog

- **v0.11, October 2026.** Nick sent five reference shots of data panels (a rule builder with colored category tags, a voice pad on a dot grid, a reply-speed dot plot, a shortcut heatmap, a usage dot matrix and gauge, a deploy timeline) with "lets expand the components ... we stick to our design language, we can add some color too". New rule P11: color carries data. Five data hues (blue, amber, teal, violet, rose), fitted to litt's surfaces in both themes and checked for color-blind separation, each with a mark tone, a text tone and a tint. They mark series, categories, heat steps and identity, and never chrome; the accent still owns the primary action, and the dashboards step's foreground-only chart stays the default. The Color decision now reads "monochrome chrome". Tags take a hue for a category. The lint fails a hue's mark tone or tint used as text.
- **v0.10, October 2026.** Nick on the dark primary button: "I think the text gets lost a bit in the dark version of the button". Its dark text on a light cobalt passed 4.5:1 but read muddy. The accent is now a fill only: in both themes the primary action is a deep cobalt with white text, as in the reference, and it stays at least 3:1 against the page. A new `--accent-text` carries the accent as text (links): the accent itself in light, a lighter cobalt in dark. The lint fails the fill used as text.
- **v0.9, October 2026.** Nick, with a reference shot of a dashboard on a deep blue frame: "use this kind of blue", and "the large buttons are too square". Litt's own accent is now cobalt, on nearly the neutrals' hue, which closes Q2 (the placeholder signal blue is gone). Asked whether "too square" meant the corners or the shape, Nick chose wider over rounder corners and the pill: an lg button's side padding goes from 24 to 32 (`--button-pad-lg`), so P10's check gives lg its own range, and an lg field keeps 24. For the forms step Nick chose a pill track for the switch over the control radius, so switches join the pill list, and radio marks and slider thumbs are named as circles.
- **v0.8, October 2026.** Nick on the tags: "the dots are horrible and the rounded tags dont feel right", closer to the gallery's Preview/Code toggle, and "shouldnt tags also be in mono?". From a four-way tag trial he chose the selected segment's look in Geist Mono: 24px, the control radius, a surface-1 fill with the hairline and top highlight, caption size, status as colored text. Every dot goes: tags, toasts (an error's title is `--danger`) and the header's current page (the text color steps, and the menu shows a check). Filter chips take the control radius too, so pills are left for avatars and icon-only buttons. The Type and Shape decisions change accordingly.
- **v0.7, October 2026.** Nick accepted every recommendation in `proposals/open-decisions.md`, the open questions left by the agent tests and the phone build. Checkboxes, radios and switches fill with `--fg`, never the accent (P1). A dialog's fields and actions are md, lg is for hero CTAs and a page form's submit, and a field is lg only beside an lg button (P10). A phone sheet always rises on the expressive spring and does not use up the view's one moment; on the desktop a dialog takes the responsive tier when the moment is taken. A pressed row fills at its own hover fill, never below fg 6%, and a pressed button also fills, so a press shows under reduced motion. Sheets sit above the keyboard, and a toast that fires over a sheet docks at the top edge. Skeletons are static. Kbd moves to the caption size, toasts stay 5s, the dark tooltip ring is `--line-strong`, and a disabled button keeps its hairline. Landscape phones wait for a real-phone check.
- **v0.6, October 2026.** Nick accepted every recommendation in `proposals/responsive-motion.md`. Two device signals: `compact` (narrower than 640) and `coarse` (a finger). On compact screens the modal and popovers are bottom sheets that rise by their own height, the one exception to `--travel`, on the modal's expressive tier, and drag down to dismiss past `--dismiss-distance` (0.25) or faster than `--dismiss-velocity` (0.4 px/ms), both new tokens. Menus stay anchored, and a submenu replaces the list in place. The command menu sits at the top edge. On touch a tooltip opens on a 500ms hold, key hints hide, pressed rows fill, focus lands on the panel, and toasts swipe away. Travel is unchanged and sheets keep their glass. The spec lives in `system/foundations.md` section 6 and `system/components.md`.
- **v0.5, October 2026.** In the litt-ui gallery Nick said "sweet spot is where its at" and "add slight radius". Motion is now three tiers: instant (100ms tween), responsive (spring, 200ms, bounce 0) and expressive (spring, 350ms, bounce 0.12, one per view), with a 40ms stagger and 16px travel. Exits run at 0.75× the spring's time as an ease-out tween and never bounce. Springs are time plus bounce. Only transform and opacity animate, plus color, background-color, border-color, fill and the focus ring at instant. Menus, the command menu and dense lists get one gliding highlight; airy layouts keep the per-row fill. Shape is slight radius: controls 4px, surfaces 8px, pills unchanged, and the binary-radius rule is retired. `--dur-reveal` and `--dur-panel` became `--dur-responsive`, `--dur-max` is gone, and `--dur-exit-*` now derive from the springs. Q15 to Q19 closed.
- **v0.4, October 2026.** Nick said "Im tired of geist", then picked Hanken Grotesk from a 14-face type trial ("Hanken Grotesk is lit!"). The Type decision now reads Hanken Grotesk + Geist Mono; the mono stays until Q14 is settled. Nick also cut the display headline from 56→72 to 40, so h1 and h2 step down to 32 and 28 to keep the scale descending, and the "72 against 15" line now reads 40 against 15.
- **v0.3, October 2026.** From the Ramp audit, Nick chose a roomy button scale (new rule P10), glow + ring depth (P4 rewritten: no offset shadows, cards flat), and binary radius (Shape decision: everything square, pills only for chips, tags and avatars). Q10 and Q13 closed.
- **v0.2, October 2026.** Nick said "fonts are too wide, don't go over 400". New rule P9 caps every weight at 400. The Type decision now reads weight 400 only, and `tokens.css` keeps a single `--weight` token.
- **v0.1, October 2026.** First profile, from a 3-round interview. P1–P8 seeded. Q1–Q6 opened. First audit (Cursor, Vercel, litt.design, Cosmos UX, Pinterest web and OS) opened Q7–Q12 and added evidence to Q2, Q3 and Q5. No rule was changed.

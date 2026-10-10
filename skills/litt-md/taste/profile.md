# litt.md taste profile

> v0.1 · built from 1 interview (3 rounds), 1 audit (6 sources), 25 journal entries · October 2026

This is Nick's design language, written as rules you can check. Every rule has an ID (`P#`) so journal entries can point at it, and a **Check** line so a critique can say pass or fail rather than "feels off".

## Point of view

**Technical precision, lit from above.** The structure is exact and quiet: an 8px grid, hairlines, tight type, one font family. The one place it gets bold is light and material. Surfaces have physicality: glass that floats, a soft light source falling from the top, edges that catch the light, a trace of grain. Color barely appears, and where it does, it behaves like light.

Five words: **precise, lit, airy, calm, exact.**

## Fixed decisions

| Area | Decision | Why |
|---|---|---|
| Character | Technical precision (Linear/Vercel lineage) | Interfaces should feel engineered and inevitable, not decorated. |
| Themes | Light and dark are both first-class | Neither theme is an afterthought or a mechanical inversion. |
| Type | Geist + Geist Mono, nothing else | One grotesk carries everything; mono is for code, keys and data. |
| Signature | Light and material | This is where the boldness goes, and it is what separates litt.md from generic dark mode. |
| Color | Cool neutrals (OKLCH hue about 262), monochrome, one accent per project | Hierarchy comes from tone. The accent is chosen per project. |
| Density | Airy | One idea per section, with generous negative space. |
| Shape | Subtle radius: 6px controls, 8px cards, 12px panels | Precise without being sharp; friendly without being soft. |
| Motion | Invisible and fast: 100–200ms ease-out, 240ms ceiling | Motion confirms actions. It never performs. |

## Signature rules

**P1. Light, not paint.** The accent appears mostly as light: a tinted radial falloff, a focus halo, a glow on the one primary action. Large flat fills of accent are rare: at most one per view, and only on the primary action.
- *Check:* count the accent fills in the view. More than one fails. Accent used only as text color or flat icon color, with no light anywhere, is a missed opportunity.

**P2. One light source per view.** Light comes from the top. Highlights sit on top edges (`--highlight`), the radial light is anchored at the top, and no two glows contradict each other.
- *Check:* glows come from more than one direction, or a highlight sits on a bottom edge → fail.

**P3. Glass is earned.** Only surfaces that float above content get glass: the sticky header, the command menu, popovers, modals and toasts. Cards in the page flow are solid surfaces.
- *Check:* glass on a non-floating element → fail.

**P4. Depth without shadows.** In dark mode, depth comes from stepped surfaces (`--surface-1` to `--surface-3`) plus a top highlight. In light mode, add only the whisper of occlusion (`--occlusion`). Never use a drop shadow you can see from across the room.
- *Check:* a neutral (black or gray) `box-shadow` with blur over 32px, or with any blur at opacity over 0.12 → fail. A zero-blur contact ring (dark-mode `--occlusion`) is fine. Accent glows come under P1, not this rule.

**P5. Material is static.** Glow, grain and gradients never animate, pulse or follow the cursor. Light is architecture, not effect.
- *Check:* any animation or transition on background-image, filter, or glow opacity → fail.

**P6. Precision.** Spacing sits on the 8px grid (4px allowed inside components). Borders are 1px hairlines. Tracking tightens as size grows (see the type tokens). Edges align to the column grid.
- *Check:* spacing values off the scale (for example 20px, 28px, 36px; `p-5`, `p-7`) → fail. A 2px or heavier border used decoratively → fail.

**P7. Airy rhythm.** One idea per section. Section spacing is 128px desktop, 96px tablet, 64px mobile (`--section-y`). The default composition is asymmetric and left-aligned. Centered layouts are reserved for a single short statement.
- *Check:* more than one headline-level idea in a section → fail. A page where every section is centered → fail.

**P8. Designed, not inverted.** Each theme has its own material values: grain is 2% in light and 4% in dark, the light tint is 12% in light and 22% in dark, glass opacity and borders are tuned separately. A theme produced by flipping the other's colors fails.
- *Check:* both themes are specified for every surface and material token in `tokens.css`. The check script verifies this.

## Do

- Let type do the hierarchy. Use scale jumps (72 against 15) and weight (600 against 400) before color.
- Use `--fg-subtle` for supporting text and `--fg-muted` for body. Keep pure `--fg` for headlines and key values.
- Give the primary action the only accent fill on the page, and let it glow (`--glow`).
- Put busy content behind glass, because that is where glass earns its blur.
- Use Geist Mono for real code, keyboard shortcuts (`⌘K`), numbers in tables, and version strings.
- Design the empty, loading, error and focus states with the same care as the default.
- Keep a visible focus ring: 2px `--focus` at a 2px offset.

## Don't

- Add a second typeface, a serif display, or a "fun" font for one section.
- Use gradients as decoration (purple-to-blue heroes, gradient text, gradient borders).
- Animate anything for longer than 240ms, or animate layout properties (width, height, top, left).
- Add motion that is not a response to the user: no autoplaying reveals, no parallax, no marquee.
- Round everything. Pills are only for tags and avatars.
- Fill backgrounds with accent color. Tint the light instead.
- Put glass on static cards, or stack glass on glass.

## Generic-AI tells this language must avoid

Claude's default output drifts toward these. Each one is banned unless the session explicitly asks for it.

- Purple-to-blue gradient hero on white or black.
- Emoji as section markers or bullet icons.
- Everything centered, section after section.
- An accent bar or rail on the left edge of rounded cards.
- An arrow suffix (`→`) on every link and button.
- `rounded-lg` (or any single radius) applied to everything.
- The same uppercase mono eyebrow above every section ("01 / FEATURES").
- Three equal feature cards with an icon, a title and two lines, as the default answer to every section.
- One word of the headline picked out in accent color.
- Inter or Space Grotesk as the "safe" face. litt.md uses Geist.

## Open questions

The interview workflow works through these. When one is answered, move the answer into a rule (`P#`) or decision and delete it here.

- **Q1.** How often may uppercase mono labels appear? Never, once per view, or as a system for metadata only?
- **Q2.** What is the default accent for Litt's own properties (litt.design, templates)? `tokens.css` holds a placeholder signal blue until this is decided.
  - *Evidence:* litt.design already uses a lime accent, only on status dots.
- **Q3.** Icon style: stroke weight (1.25, 1.5 or 2), set (Lucide, Phosphor, custom), and size relative to text.
  - *Evidence:* thin 1.5px line-icon sets recur on the Cosmos board (4 pins).
- **Q4.** Density in app UI versus marketing pages. Is "airy" a marketing rule only, with app screens allowed to go compact?
- **Q5.** Art direction for imagery: product screenshots only, 3D renders, photography, abstract light studies?
  - *Evidence:* product UI floating over atmospheric, blurred photography or painting shows up on the Cosmos board (about 8 pins) and on Cursor's hero.
- **Q6.** Does the glass, glow and grain signature apply to client work, or only to Litt's own properties?
- **Q7.** Texture: noise grain (P5 today) or a dot grid / dot matrix?
  - *Evidence:* litt.design has a dot-grid background, the Pinterest "OS" board is about half dot-matrix and pixel patterns, and dither appears on Cosmos.
- **Q8.** Light: one accent-tinted source from the top (P2 today), or soft multi-hue ambient fields?
  - *Evidence:* litt.design uses peach and blue blobs at the sides, and Cosmos has warm gradient fields.
- **Q9.** Neutral temperature: the interview chose cool, but litt.design and Vercel are true neutral gray, and Cursor is warm. Keep cool?
- **Q10.** Radius: the interview chose 6/8/12, but litt.design uses 2px on data cells and 10px on covers. Should data and small cells be allowed to go sharper?
- **Q11.** Exposed editorial structure (visible column rules, index numbers) shows up a lot on the Pinterest "web" board. Allow it as a secondary device on content pages, or keep the language purely light-and-material?
- **Q12.** Which theme comes first on marketing pages when the system preference is unknown? Cursor, Vercel and litt.design are all light-first.

## Changelog

- **v0.1, October 2026.** First profile, from a 3-round interview. P1–P8 seeded. Q1–Q6 opened. First audit (Cursor, Vercel, litt.design, Cosmos UX, Pinterest web and OS) opened Q7–Q12 and added evidence to Q2, Q3 and Q5. No rule was changed.

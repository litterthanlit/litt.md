# Foundations

Every value lives in `assets/tokens.css`. This file names the variables and explains when to use each one. If a value here seems wrong, fix `tokens.css`, not this file.

## Contents
1. Type
2. Color
3. Space and layout
4. Shape
5. Motion
6. Motion on touch and small screens
7. Accessibility floor

---

## 1. Type

**Families.** `--font-sans` (Geist) for everything, headings included. `--font-mono` (Geist Mono) only for code, keyboard keys (`⌘K`), numbers in tables and data, version strings and token names. Tags are set in the sans. No third family, ever.

**Loading.** Geist comes from Google Fonts in the three weights: `family=Geist:wght@400;500;600&family=Geist+Mono:wght@400&display=swap`. In Next.js the `geist` package (`GeistSans`, `GeistMono`) is the same face, as on litt.design; in an app that installs the registry, `base-styles` loads it from `@fontsource/geist-sans`. The fallback is Helvetica Neue, Helvetica and Arial, as on litt.design. Declare no `cv` or `ss` features. Geist Mono loads at 400 only.

**Weight (P9).** Three weights, one per role, and nothing else.

| Token | Weight | Role |
|---|---|---|
| `--weight` | 400 | Text: reading, body, small, nav, descriptions |
| `--weight-title` | 500 | Titles: display, h1 to h4, the title in a title-and-description lockup, buttons, tab and segmented triggers, `b` and `strong` |
| `--weight-label` | 600 | 12px labels only: the caption step, tags, meta rows, table headers |

Nothing goes to 700 or above or below 400, running text never takes 500 or 600, and 600 never appears above the caption size. Geist Mono stays at 400, at the caption size too. `tokens.css` sets `h1`–`h6`, `b` and `strong` to the title weight and `th` to the label weight, and turns off faux bold. In Tailwind, display to h4 carry the title weight and the caption carries the label weight on their own; `font-title` and `font-label` set the role on anything else, and a mono caption adds `font-normal`.

**Scale.** Each step bundles size, a whole-pixel line height and tracking (`--type-<step>-size`, `-leading`, `-tracking`).

| Step | Size / leading | Weight | Use |
|---|---|---|---|
| display | 18 / 28 | 500 | One per page, the hero statement |
| h1 | 18 / 28 | 500 | Page title |
| h2 | 14 / 22 | 500 | Section title |
| h3 | 14 / 22 | 500 | Subsection, card group title |
| h4 | 14 / 22 | 500 | Section label in the asymmetric left column, a dialog's title |
| reading | 14 / 22 | 400 | Long-form text, at a `--measure` (65ch) line length |
| body | 14 / 22 | 400 | UI body: settings, lists, dialogs |
| small | 13 / 20 | 400 | Supporting text, table cells, helper text, nav |
| caption | 12 / 16 | 600 | Labels: meta rows, tags, table headers, timestamps |

**Restrained headlines.** Display and h1 are the ceiling at 18: nothing is set larger, at any breakpoint. h2 to h4 share one style on purpose. Below the page title, rank comes from weight, ink and space, not size, and the hero gets its presence from space, light and the product.

**Hierarchy order.** Get hierarchy from weight and ink first (a 500 title in `--fg` over 400 text in the grey), then from space (tight lockups, wide gaps), and only then from the one size step to the page title. There are two inks: `--fg` for titles and key values, and the grey for all other text. `--fg-muted` (body) and `--fg-subtle` (metadata) carry the same grey; use each name for its role, so a later split is one edit in `tokens.css`.

**Text spacing.** Tight lockups and wide gaps, on the 4px grid:
- A label sits 4px (`--space-1`) above its title, and a title 4px above its text, so a lockup reads as one unit.
- Blocks within a section sit 16px (`--space-4`) apart.
- A section heading sits 4px above its first content.
- The sections of a page sit 48px (`--space-12`) apart. A marketing page's full-width sections keep `--section-y` (P7, section 3).
- A page title sits 16px above its summary.

**Rules.**
- Display and headings use `text-wrap: balance`.
- Never set running text below 13px, or long text wider than `--measure`. The caption is for labels.
- Never pick out one word of a headline in accent or italic.
- Uppercase is not the default for labels (open question Q1). Sentence case everywhere.

## 2. Color

**Neutrals** sit on one OKLCH hue (about 60, a warm stone gray) at very low chroma: warm enough to feel friendly, gray enough that tone still does the hierarchy. Every role exists in both themes.

| Role | Variables | Use |
|---|---|---|
| Ground | `--canvas` | Page background |
| Surfaces | `--surface-1`, `--surface-2`, `--surface-3` | Raised cards, then nested or hover fills, then pressed fills or wells |
| Lines | `--line`, `--line-strong` | Decorative hairlines; dividers that need to be seen |
| Control line | `--line-control` | Outline of inputs, checkboxes, selects and switches (at least 3:1) |
| Text | `--fg`, `--fg-muted`, `--fg-subtle`, `--fg-disabled` | Two inks: `--fg` for titles and key values, one grey for body (`--fg-muted`) and supporting text (`--fg-subtle`). Disabled only |
| Accent | `--accent`, `--accent-hover`, `--accent-fg`, `--accent-text`, `--accent-tint` | The one primary action (a fill with `--accent-fg` on it), links (`--accent-text`), focus, the light source |
| Focus | `--focus`, `--focus-ring` | Keyboard focus indicator |
| Status | `--success`, `--warning`, `--danger` | State only: never decoration, never brand |
| Data hues | `--data-blue`, `--data-amber`, `--data-teal`, `--data-violet`, `--data-rose`, each with `-text` and `-tint` | Color that carries data (P11): series, categories, heat steps, identity. Never chrome |

**Accent per project.** Pick the accent at project start from the subject: the client's mark, the product's domain, or the material it sells. Set it in both themes so that:
- `--accent`, the fill, reaches at least 3:1 on `--canvas`, so the primary action stands out;
- `--accent-fg` reaches at least 4.5:1 on `--accent`;
- `--accent-text`, the accent as text (links), reaches at least 4.5:1 on `--canvas`. In light it is usually the accent itself. In dark it is usually lighter than the fill, because a fill dark enough for white text is too dark to read as text on a dark canvas. Never use `--accent` as a text color.

Run `node scripts/check.mjs` to confirm. Litt's own accent is cobalt: a cool light against the warm stone grays, so it reads clearly without a large fill. In both themes the primary action is a deep cobalt with white text, as in the reference it came from. Dark mode's links use a lighter cobalt (`--accent-text`), because the fill's cobalt is too dark to read as text there.

**Accent budget (P1).** At most one accent fill per view, on the primary action. The rest of the accent's presence is light: `--light`, `--glow`, `--focus`. Checkboxes, radios and switches fill with `--fg` when on, never the accent, and so does a slider's range: a form can hold many of them, and the accent stays on its submit.

**Data hues (P11).** Five hues carry data, in a fixed order: blue, amber, teal, violet, rose. The first series or category takes blue, the second amber, and so on; a hue is never cycled, and a sixth series folds into "Other" or a second chart. Each hue has three tones:
- the mark tone (`--data-blue`) for bars, dots, lines, heat cells and gauge ticks: at least 3:1 on canvas and every surface;
- the text tone (`--data-blue-text`) for a word in the hue, such as a category tag or a label that names a mark: at least 4.5:1 on canvas, surfaces and the hue's own tint;
- the tint (`--data-blue-tint`), the mark tone mixed into surface-1 by `--tint-strength` (12% light, 18% dark), as the fill behind the text tone.

They were fitted to litt's surfaces in each theme and checked for color-blind separation between neighbors in that order, and blue sits apart from the cobalt accent, so a chart never reads as a button. Teal keeps clear of the success green. A heat scale steps one hue's mark tone over transparent (30, 55, 80 and 100%) above an empty fg-8% cell. Chrome stays neutral: buttons, controls, surfaces, borders, nav, rails, gridlines and running text never take a hue, and a status keeps its own color and a word. A single quantity may stay in the foreground, which is the quiet default.

**Translucent tones.** For hover fills on neutral ground, mix from the foreground: `color-mix(in oklab, var(--fg) 6%, transparent)` for hover and 7–8% for selected. Never use rgba of a hard-coded color.

## 3. Space and layout

**Scale.** `--space-1` to `--space-40`: 4, 8, 12, 16, 24, 32, 48, 64, 96, 128, 160. The names match Tailwind's multiplier, so `--space-6` is `p-6`. Off-scale values (20, 28, 36, 40 as spacing) fail P6. 4px and 12px are for inside components only.

**Control heights (P10).** Buttons and inputs share one scale: `--control-sm` 32 (dense UI: table rows, toolbars), `--control-md` 44 (default), `--control-lg` 56 (hero CTAs only). A page form's submit and Cancel are md, like its fields, and so are a dialog's fields and actions. A field is lg only when it shares a row with an lg button (the inline form). Side padding is `--control-pad-sm/md/lg` (12 / 16 / 24) and label size `--control-text-sm/md/lg` (13 / 14 / 16), at the title weight. Labels are trimmed to the cap height with `.litt-trim`, so side padding roughly equals the visible air above and below the label: every size reads as evenly roomy. Grouped buttons sit `--control-group-gap` (12) apart; an icon sits `--control-gap` (8) from its label.

**Section rhythm (P7).** `--section-y` is the distance between sections: 64 mobile, 96 from 640px, 128 from 1024px. Apply it as padding-top on each section and padding-bottom on the last one. Never apply it to both sides, which doubles the gap.

**Grid.** 12 columns, `--grid-gap` between them (16 mobile, 24 from 640px), and `--gutter` page padding (16 / 24 / 32).

**Breakpoints.** 640 (`40rem`), 1024 (`64rem`), 1280 (`80rem`). Design mobile-first.

**Containers.**
- `--container-reading` (640) for articles and forms.
- `--container-content` (1080) for most pages.
- `--container-wide` (1280) for marketing and app shells.

**Composition defaults.**
- **Asymmetric split.** A 3/9 split: section label in columns 1–3 (sticky on desktop), content in columns 4–12. This is the default section layout.
- **Hero.** Copy in columns 1–5, the visual in columns 7–12, with column 6 left empty as air. On mobile, the copy stacks above the visual.
- **One idea per section.** One headline-level statement per section. If a section needs two, it is two sections.
- **Alignment.** Left-aligned by default. A centered layout is allowed only for a single short statement (a closing call to action or a quote), at most once per page.
- **Cards.** Not the default answer. Prefer lists, tables, or text with hairline dividers. Use cards only when items are independent objects (projects, products) that link somewhere.
- **Header.** Height `--header-h` (64), glass, sticky. Wordmark at left, nav after it, actions at right.

## 4. Shape

**Slight radius.** Two radii and a pill.

| Variable | Value | Use |
|---|---|---|
| `--radius-control` | 4px | Buttons, inputs, selects, tabs, tags, chips, kbd, menu rows, tooltips |
| `--radius-surface` | 8px | Cards, panels, menus, popovers, dialogs, toasts, the command menu |
| `--radius-pill` | 999px | Avatars, icon-only buttons and switches. Radio marks and slider thumbs are circles |

**Concentric.** A surface is the control radius plus the inset around it: 4 + 4 = 8. A control that sits 4px (`--space-1`) inside a surface keeps its corners parallel. This only matters near the edge (menu rows, a card cover, a segmented control). Elsewhere a control is just 4px. There are no other radii: no 6, 12 or 16.

- `tokens.css` gives `button`, `input`, `select` and `textarea` the control radius, and `.litt-raised` and `.litt-glass` the surface radius. A full-bleed bar like the header sets `border-radius: 0`.
- Borders are 1px (`--hairline`), drawn as `inset 0 0 0 1px var(--line)` so they don't change layout.
- In Tailwind: `rounded-control`, `rounded-surface`, `rounded-pill`, nothing else.

## 5. Motion

Fast by default, with one signature moment per view. Motion confirms an action and never performs.

| Tier | Type | Time | Bounce | Variables | Use |
|---|---|---|---|---|---|
| Instant | Tween | 100ms | none | `--dur-instant`, `--ease-out` | Hover, press, toggles, color fades |
| Responsive | Spring | 200ms | 0 | `--spring-responsive`, `--ease-responsive`, `--dur-responsive` | Menus, tabs, tooltips, the gliding highlight, filter and insert |
| Expressive | Spring | 350ms | 0.12 | `--spring-expressive`, `--ease-expressive`, `--dur-expressive` | One moment per view: dialog, toast or list entrance |

- **Springs are time plus bounce.** Motion takes `visualDuration` and `bounce`; Framer takes Time and Bounce. CSS can't run a spring, so `--ease-responsive` and `--ease-expressive` are `linear()` approximations, and `--dur-responsive` and `--dur-expressive` are their settle times. Use the `--spring-*` pair in JS and the `--ease-*` + `--dur-*` pair in CSS.
- **Exits.** An element leaving runs at `--exit` (0.75×) of the spring's visual time, as an `--ease-out` tween, and never bounces: `--dur-exit-responsive` (150ms), `--dur-exit-expressive` (263ms). Un-hover and un-press are not exits; they stay instant.
- **Stagger and travel.** `--stagger` (40ms) separates siblings in one cascade. `--travel` (16px) is the entrance offset. Menus and tooltips use a quarter of it.
- **Dismissal.** `--dismiss-distance` (0.25, a fraction of the surface's height or width) and `--dismiss-velocity` (0.4, pixels per millisecond) decide whether a released drag leaves or springs back. They are thresholds, not durations, so reduced motion does not change them.
- **Properties.** Transform and opacity animate. Color, background-color, border-color, fill and the focus ring may fade, at `--dur-instant` only. Never layout (width, height, top, left, margin, padding), never `transition: all`, never material (P5).
- **Press.** `transform: scale(var(--press-scale))` (0.98) on `:active`, instant tier. A state change never moves the box otherwise.
- **One expressive moment per view.** A second one uses the responsive tier. A sheet on a compact screen does not count (section 6).
- **Ceilings.** The instant tween stays at or under 240ms. Spring visual time stays at or under 350ms, and bounce at or under 0.12. `scripts/check.mjs` enforces both.
- **Never.** Scroll-triggered reveals, parallax, looping autoplay, marquee, bounce on exits or on the responsive tier, a pulsing or shimmering skeleton, cursor-following effects.
- **Reduced motion.** `tokens.css` sets every `--dur-*`, `--stagger` and `--travel` to 0 and the press scale to 1. In JS, let the library honor it (`MotionConfig reducedMotion="user"`, Framer `useReducedMotion()`).
- **Retired in v0.5.** `--dur-reveal` and `--dur-panel` became `--dur-responsive` (or `--dur-expressive` for a dialog). `--dur-max` has no replacement. The old `--dur-exit-reveal` and `--dur-exit-panel` became `--dur-exit-responsive` and `--dur-exit-expressive`.

## 6. Motion on touch and small screens

A phone changes how things are reached, not how litt moves. The tiers, tokens and rules in section 5 hold on every screen. This section adds two device signals and a short list of what changes with them.

**Two signals.** `compact` is a viewport narrower than 640 (`40rem`, the break the layout already uses). `coarse` is a primary pointer that is coarse: a finger. They are separate. A landscape phone is coarse and not compact. A narrow desktop window is compact and not coarse. A tablet in portrait (768 wide or more) is coarse and not compact: it keeps the centered dialog and the anchored popovers, as iPadOS does, with 44px targets and tooltips on a hold. Whether a short screen (a landscape phone) should count as compact waits for a real-phone check. In CSS use `max-sm:` and `pointer-coarse:`. In React use `useDevice()`, which returns both and is false on the server. Never read the user agent.

**Compact screens.**
- A modal becomes a bottom sheet. It rises from the bottom edge by its own height, always on the expressive spring, and it does not use up the view's expressive moment: at a sheet's height the bounce is under a pixel, so it reads as placement, and a sheet that rose at two speeds depending on the rest of the page would look broken. It moves by transform only. Its height never animates. It has one height: its content, up to the visible screen less `--space-6`.
- A sheet sits above the keyboard. Its bottom follows the visual viewport, so the keyboard never covers its footer or the field being typed in.
- Nothing else travels further than `--travel`. The sheet is the one exception, because it must come from the edge it is dragged back to.
- A menu stays beside its button. A popover becomes a sheet. The command menu moves to the top edge and follows the visible screen, so the keyboard never covers a row.

**Dragging.** While a finger is down, the surface follows it one to one, with no easing. On release:
- It leaves if it has travelled `--dismiss-distance` of its size, or moves faster than `--dismiss-velocity`. It carries on from where it is, on the exit token for its tier.
- Otherwise it springs back on the responsive tier with the speed it was released at. It never bounces.
- Pulled past rest it resists and stops at `--space-6`. A sheet hides that much below the screen edge, so no gap shows.
- A drag cannot start in a slider, in a region marked `data-no-drag`, or in a scrolling region that is not at its top. Drags are ignored for 500ms after the sheet opens.

**A gesture is never the only way.** Every swipe has a visible button (a close button, 44px on coarse screens). Esc and a tap on the scrim also close. The grabber is decoration and is hidden from assistive tech.

**Touch has no hover.** Nothing depends on it.
- A pressed row or card fills at its own hover fill, never below fg 6% (`:active` on coarse screens, instant tier, color only): a finger covers the row, and a fainter fill disappears under it. Buttons keep the press scale and also take their hover fill, so a press still shows under reduced motion, where the scale is 1.
- A tooltip opens on a 500ms press and hold, not on a tap, so a tap only does its action. Shortcut chips and key hints are hidden on coarse screens.

**Toasts over a sheet.** A toast that fires while a sheet is open on a compact screen docks at the top edge, where the command menu sits, and leaves upward, so it never covers the sheet's buttons.

**Focus.** On coarse screens focus lands on the panel, so the keyboard does not open under a sheet that is still moving. Mark a field `data-autofocus` when typing is the point.

**Reduced motion and transparency.** A sheet appears in place with no slide. A drag still follows the finger, and the release is instant. Glass turns solid, as everywhere.

## 7. Accessibility floor

These are not negotiable, whatever the taste:
- Body text reaches 4.5:1 or more, large text 3:1 or more, control outlines and the focus ring 3:1 or more, in both themes. Run `node scripts/check.mjs`.
- A visible focus indicator on every interactive element: `:focus-visible` gets a 2px `--focus` outline at 2px offset (already in `tokens.css`), or `--focus-ring` on inputs.
- Hit targets are at least 44px tall for primary controls (`--control-md`) and at least 32px for dense secondary ones (`--control-sm`).
- Use semantic elements first (`button`, `a`, `dialog`, `fieldset`); ARIA only to fill gaps.
- Respect `prefers-reduced-motion` and `prefers-reduced-transparency` (glass becomes solid).
- Never use color as the only signal. Pair status color with text or an icon.

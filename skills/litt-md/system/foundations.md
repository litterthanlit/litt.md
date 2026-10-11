# Foundations

Every value lives in `assets/tokens.css`. This file names the variables and explains when to use each one. If a value here seems wrong, fix `tokens.css`, not this file.

## Contents
1. Type
2. Color
3. Space and layout
4. Shape
5. Motion
6. Accessibility floor

---

## 1. Type

**Families.** `--font-sans` (Hanken Grotesk) for everything. `--font-mono` (Geist Mono) only for code, keyboard keys (`⌘K`), numbers in tables and data, version strings and token names. No third family, ever.

**Weight (P9).** One weight: `--weight` (400) for everything, including display, headings, labels, buttons and the wordmark. Medium, semibold and bold read too wide and are not part of the system. `tokens.css` resets the bold browser defaults (`h1`–`h6`, `b`, `strong`, `th`) and turns off faux bold. Only the 400 faces need to load.

**Scale.** Each step bundles size, leading and tracking (`--type-<step>-size`, `-leading`, `-tracking`). Tracking tightens as size grows (P6).

| Step | Size | Use |
|---|---|---|
| display | 40 | One per page, hero statement only. The same size at every breakpoint. |
| h1 | 32 | Page title |
| h2 | 28 | Section title on content pages |
| h3 | 24 | Subsection, card group title |
| h4 | 20 | Section label in the asymmetric left column |
| reading | 17 | Long-form text, at a `--measure` (65ch) line length |
| body | 15 | UI body: settings, lists, dialogs |
| small | 13 | Supporting text, table cells, helper text, nav |
| caption | 12 | Timestamps, fine print |

**Restrained headlines.** Display stops at 40. The hero gets its presence from space, light and the product, not from poster-sized type, so the jump to 15px body is enough on its own.

**Hierarchy order.** Get hierarchy from scale first, then color (`--fg` → `--fg-muted` → `--fg-subtle`), then tracking. Never from weight. When a label needs to stand out at the same size, make it `--fg` and its neighbours `--fg-subtle`.

**Rules.**
- Display and headings use `text-wrap: balance`.
- Never set body text below 13px, or long text wider than `--measure`.
- Never pick out one word of a headline in accent or italic.
- Uppercase is not the default for labels (open question Q1). Sentence case everywhere.

## 2. Color

**Neutrals** sit on one OKLCH hue (about 262, a cool blue-gray). Every role exists in both themes.

| Role | Variables | Use |
|---|---|---|
| Ground | `--canvas` | Page background |
| Surfaces | `--surface-1`, `--surface-2`, `--surface-3` | Raised cards, then nested or hover fills, then pressed fills or wells |
| Lines | `--line`, `--line-strong` | Decorative hairlines; dividers that need to be seen |
| Control line | `--line-control` | Outline of inputs, checkboxes and selects (at least 3:1) |
| Text | `--fg`, `--fg-muted`, `--fg-subtle`, `--fg-disabled` | Headlines and key values, body, supporting text, disabled only |
| Accent | `--accent`, `--accent-hover`, `--accent-fg`, `--accent-tint` | The one primary action, links, focus, the light source |
| Focus | `--focus`, `--focus-ring` | Keyboard focus indicator |
| Status | `--success`, `--warning`, `--danger` | State only: never decoration, never brand |

**Accent per project.** Pick the accent at project start from the subject: the client's mark, the product's domain, or the material it sells. Set it in both themes so that:
- `--accent` reaches at least 4.5:1 on `--canvas` if it is used for links, and at least 3:1 if used only for focus or glows;
- `--accent-fg` reaches at least 4.5:1 on `--accent`.

Run `node scripts/check.mjs` to confirm. The placeholder signal blue stays only until profile question Q2 is answered.

**Accent budget (P1).** At most one accent fill per view, on the primary action. The rest of the accent's presence is light: `--light`, `--glow`, `--focus`.

**Translucent tones.** For hover fills on neutral ground, mix from the foreground: `color-mix(in oklab, var(--fg) 6%, transparent)` for hover and 7–8% for selected. Never use rgba of a hard-coded color.

## 3. Space and layout

**Scale.** `--space-1` to `--space-40`: 4, 8, 12, 16, 24, 32, 48, 64, 96, 128, 160. The names match Tailwind's multiplier, so `--space-6` is `p-6`. Off-scale values (20, 28, 36, 40 as spacing) fail P6. 4px and 12px are for inside components only.

**Control heights (P10).** Buttons and inputs share one scale: `--control-sm` 32 (dense UI: table rows, toolbars), `--control-md` 44 (default), `--control-lg` 56 (hero and form CTAs). Side padding is `--control-pad-sm/md/lg` (12 / 16 / 24) and label size `--control-text-sm/md/lg` (13 / 15 / 16). Labels are trimmed to the cap height with `.litt-trim`, so side padding roughly equals the visible air above and below the label: every size reads as evenly roomy. Grouped buttons sit `--control-group-gap` (12) apart; an icon sits `--control-gap` (8) from its label.

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
| `--radius-control` | 4px | Buttons, inputs, selects, tabs, kbd, menu rows, tooltips |
| `--radius-surface` | 8px | Cards, panels, menus, popovers, dialogs, toasts, the command menu |
| `--radius-pill` | 999px | Chips, tags, avatars, status dots, icon-only buttons |

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
- **Properties.** Transform and opacity animate. Color, background-color, border-color, fill and the focus ring may fade, at `--dur-instant` only. Never layout (width, height, top, left, margin, padding), never `transition: all`, never material (P5).
- **Press.** `transform: scale(var(--press-scale))` (0.98) on `:active`, instant tier. A state change never moves the box otherwise.
- **One expressive moment per view.** A second one uses the responsive tier.
- **Ceilings.** The instant tween stays at or under 240ms. Spring visual time stays at or under 350ms, and bounce at or under 0.15. `scripts/check.mjs` enforces both.
- **Never.** Scroll-triggered reveals, parallax, looping autoplay, marquee, bounce on exits or on the responsive tier, skeleton shimmer longer than 240ms per pass, cursor-following effects.
- **Reduced motion.** `tokens.css` sets every `--dur-*`, `--stagger` and `--travel` to 0 and the press scale to 1. In JS, let the library honor it (`MotionConfig reducedMotion="user"`, Framer `useReducedMotion()`).
- **Retired in v0.5.** `--dur-reveal` and `--dur-panel` became `--dur-responsive` (or `--dur-expressive` for a dialog). `--dur-max` has no replacement. The old `--dur-exit-reveal` and `--dur-exit-panel` became `--dur-exit-responsive` and `--dur-exit-expressive`.

## 6. Accessibility floor

These are not negotiable, whatever the taste:
- Body text reaches 4.5:1 or more, large text 3:1 or more, control outlines and the focus ring 3:1 or more, in both themes. Run `node scripts/check.mjs`.
- A visible focus indicator on every interactive element: `:focus-visible` gets a 2px `--focus` outline at 2px offset (already in `tokens.css`), or `--focus-ring` on inputs.
- Hit targets are at least 44px tall for primary controls (`--control-md`) and at least 32px for dense secondary ones (`--control-sm`).
- Use semantic elements first (`button`, `a`, `dialog`, `fieldset`); ARIA only to fill gaps.
- Respect `prefers-reduced-motion` and `prefers-reduced-transparency` (glass becomes solid).
- Never use color as the only signal. Pair status color with text or an icon.

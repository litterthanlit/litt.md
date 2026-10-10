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

**Families.** `--font-sans` (Geist) for everything. `--font-mono` (Geist Mono) only for code, keyboard keys (`⌘K`), numbers in tables and data, version strings and token names. No third family, ever.

**Weights.** `--weight-regular` 400 is for body text. `--weight-medium` 500 is for labels, buttons, H3/H4 and emphasis in UI. `--weight-semibold` 600 is for display, H1 and H2. Bold (700+) is not part of the system.

**Scale.** Each step bundles size, leading and tracking (`--type-<step>-size`, `-leading`, `-tracking`). Tracking tightens as size grows (P6).

| Step | Size | Use |
|---|---|---|
| display | 56→72 fluid | One per page, hero statement only |
| h1 | 40 | Page title |
| h2 | 32 | Section title on content pages |
| h3 | 24 | Subsection, card group title |
| h4 | 20 | Section label in the asymmetric left column |
| reading | 17 | Long-form text, at a `--measure` (65ch) line length |
| body | 15 | UI body: settings, lists, dialogs |
| small | 13 | Supporting text, table cells, helper text, nav |
| caption | 12 | Timestamps, fine print |

**Hierarchy order.** Get hierarchy from scale first, then weight, then color (`--fg` → `--fg-muted` → `--fg-subtle`). Color is the last resort, never the first.

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

| Variable | Value role | Use |
|---|---|---|
| `--radius-control` | 6 | Buttons, inputs, chips, menu rows, kbd |
| `--radius-card` | 8 | Cards, list containers, tiles |
| `--radius-panel` | 12 | Large glass panels, modals, command menu, toasts |
| `--radius-pill` | 999 | Tags and avatars only |

- A nested radius is the outer radius minus the padding, never the same value. A card at 8 with 8px padding holds a 0–4 inner radius (use `--radius-control` if that reads better).
- Borders are 1px (`--hairline`), drawn as `inset 0 0 0 1px var(--line)` so they don't change layout.

## 5. Motion

Motion is invisible and fast. It confirms an action and never performs.

| Variable | Duration | Use |
|---|---|---|
| `--dur-instant` | 120ms | Hover, press, toggle |
| `--dur-reveal` | 160ms | Tooltip, dropdown, popover |
| `--dur-panel` | 200ms | Sheet, modal, command menu |
| `--dur-max` | 240ms | Hard ceiling. Nothing exceeds it, page transitions included. |
| `--dur-exit-reveal`, `--dur-exit-panel` | 128 / 160ms | Exits run at about 80% of the enter |

- **Easing.** `--ease-out` for everything. No spring overshoot, no bounce, no ease-in on entry.
- **Properties.** Only `opacity` and `transform` animate. Background-color and color transitions are allowed on hover. Never animate layout (width, height, top, left) or material (P5).
- **Press.** `transform: scale(var(--press-scale))` (0.98) on `:active`.
- **Entry.** A modal enters with opacity 0→1, translateY 4px→0 and scale 0.98→1 over `--dur-panel`. Nothing travels more than 8px.
- **Never.** Scroll-triggered reveals, parallax, autoplay, marquee, staggered list entrances, skeleton shimmer longer than 240ms per pass, cursor-following effects.
- **Reduced motion.** `tokens.css` sets every duration to 0 and the press scale to 1 under `prefers-reduced-motion: reduce`. Always use the variables, so this works automatically.

## 6. Accessibility floor

These are not negotiable, whatever the taste:
- Body text reaches 4.5:1 or more, large text 3:1 or more, control outlines and the focus ring 3:1 or more, in both themes. Run `node scripts/check.mjs`.
- A visible focus indicator on every interactive element: `:focus-visible` gets a 2px `--focus` outline at 2px offset (already in `tokens.css`), or `--focus-ring` on inputs.
- Hit targets are at least 40px tall for primary controls and at least 24px for dense secondary ones.
- Use semantic elements first (`button`, `a`, `dialog`, `fieldset`); ARIA only to fill gaps.
- Respect `prefers-reduced-motion` and `prefers-reduced-transparency` (glass becomes solid).
- Never use color as the only signal. Pair status color with text or an icon.

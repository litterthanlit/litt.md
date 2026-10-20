---
name: litt-md
description: litt.md is Nick's personal design language and taste for web and product UI, motion and interaction. Use it whenever you build, restyle or review anything visual for Nick (websites, landing pages, app screens, components, prototypes or Framer sites, in React, Tailwind, HTML or CSS), when choosing type, color, spacing, radius, glass, light, shadows or motion, or when critiquing a screenshot, URL or design. Also use it for taste work - interviewing Nick about preferences, auditing a reference site, moodboard or Nick's own work, logging a reaction such as love this, hate this or more like that, and distilling the taste journal into rules. Its rules override the visual defaults of frontend-design and design-systems. Signature - technical precision, warm stone neutrals, Geist in three weights, airy layouts, light and material, quick motion with one spring moment per view, light and dark both first-class.
allowed-tools: Bash(node ${CLAUDE_SKILL_DIR}/scripts/extract-styles.mjs *), Bash(node ${CLAUDE_SKILL_DIR}/scripts/check.mjs*)
---

# litt.md

**Technical precision, lit from above.** The structure is exact and quiet: an 8px grid, hairlines, one typeface in three weights by role, warm stone neutrals. The only bold move is light and material: glass that floats, a soft light falling from the top, edges that catch it, a trace of grain. Color barely appears, and where it does it behaves like light.

Skill directory: `${CLAUDE_SKILL_DIR}`. Every path below is relative to it.

## Precedence

1. Nick's words in this session.
2. The project's existing design system, if it has one. Map litt.md's rules onto it rather than replacing it.
3. litt.md (this skill).
4. The `design-systems` skill, for concrete patterns only (how Linear builds X). litt.md wins any conflict.

## Pick a mode, then read only these files

| Nick wants to… | Mode | Read |
|---|---|---|
| Build or restyle a page, component or prototype | **build** | `workflows/build.md`, `system/material.md`, `assets/tokens.css`. Add `system/components.md` for components and `system/framer.md` for Framer. In a React + Tailwind v4 project you can write to, install the components from the litt registry first (`workflows/build.md` §3). |
| Review a screenshot, URL, Framer page or code | **critique** | `workflows/critique.md`, `taste/profile.md` |
| Work on taste ("interview me", "refine my rules") | **interview** | `workflows/interview.md`, `taste/profile.md` |
| Break down a reference, moodboard or own work | **audit** | `workflows/audit.md` |
| React to something ("love this", "too much glow") | **log** | Nothing extra. Use the template below, plus `workflows/evolve.md` §1 if unsure where to write. |
| Turn the journal into rules ("distill", "update my rules") | **distill** | `workflows/evolve.md`, `taste/journal.md`, `taste/profile.md` |

The build and critique modes never need the journal. `system/foundations.md` holds the full type, color, layout and motion spec; read it when a value or usage rule is unclear.

## Quick log template

Append to `taste/journal.md` when the skill directory is a writable git checkout (see `workflows/evolve.md` §1). Otherwise, print it for Nick to paste:

```
- YYYY-MM-DD · area · subject · verdict · why (Nick's words or ?) · rule candidate or - · open · chat
```

`area` is one of: type, color, material, motion, layout, component, interaction, process.

## The eleven signature rules

1. **P1 Light, not paint.** The accent appears as light (`--light`, `--glow`, `--focus`). At most one accent fill per view, on the primary action. Checkboxes, radios and switches fill with `--fg`.
2. **P2 One light source.** Light comes from the top. Highlights sit on top edges only.
3. **P3 Glass is earned.** Glass only for floating surfaces: header, command menu, popovers, modals, toasts.
4. **P4 Depth without drop shadows.** Cards stay flat (hairline plus highlight). Floating surfaces get a zero-offset glow plus a 1px ring.
5. **P5 Material is static.** Glow, grain, gradients and light never animate.
6. **P6 Precision.** 8px grid (4px inside components), 1px hairlines, tracking tightens as size grows.
7. **P7 Airy rhythm.** One idea per section, 128 / 96 / 64px between sections, asymmetric and left-aligned by default.
8. **P8 Designed, not inverted.** Each theme has its own material strengths. Both are first-class.
9. **P9 Weight by role.** Text at 400 (`--weight`), titles, buttons and tabs at 500 (`--weight-title`), 12px labels at 600 (`--weight-label`). Nothing else: no bold, nothing below 400, no 600 above 12px. Below the page title, rank comes from weight, two inks and space.
10. **P10 Roomy controls.** Buttons and inputs share 32 / 44 / 56. Labels are trimmed to the cap height so padding equals the air around them at sm and md; an lg button runs wider (pad 32), so it never reads as a block. Hero CTAs are lg (56); a page form's submit and Cancel, and a dialog's fields and actions, are md (44).
11. **P11 Color carries data.** Beyond the one accent, color only says something: a series, a category, a heat step, a side of a goal, an identity. Five data hues in a fixed order (blue, amber, teal, violet, rose), each with a mark tone, a `-text` tone and a `-tint`. Never on chrome: buttons, surfaces, borders, nav and running text stay neutral. A single quantity stays in the foreground.
12. **P12 Selected is a raised segment.** The current page in any nav wears the segmented control's selected segment: `--fg` on a fill one step raised from its ground, with the hairline and the top highlight, kept on hover. The header's wordmark sits in the segmented track with one raised segment. Never a dot, an underline, the accent or a weight change.

Each rule's Check line, the dos and don'ts, and the open questions are in `taste/profile.md`.

## Fixed decisions

These change only when Nick changes them.
- **Character:** technical precision.
- **Themes:** light and dark both first-class.
- **Type:** Geist + Geist Mono only, in three weights by role (P9). Nothing is set above 18px: display and h1 are 18, the rest 14, 13 and 12. Mono is for code, keys, data, versions and token names, never tags.
- **Color:** warm stone neutrals at one OKLCH hue (about 60), monochrome chrome, one accent per project. Five data hues carry data, never chrome (P11).
- **Density:** airy.
- **Shape:** slight radius. Controls 4px (tags and chips too), surfaces 8px, pills only for avatars, icon-only buttons and switches.
- **Motion:** three tiers. Instant 100ms ease-out; responsive spring 200ms, bounce 0; expressive spring 350ms, bounce 0.12, one per view. Exits run at 0.75× and never bounce. Transform and opacity only, plus color fades at instant. On phones the modal is a bottom sheet that drags down to dismiss (`system/foundations.md` section 6).

## Never, unless Nick asks

- Purple-blue gradient heroes, gradient text, decorative gradients
- Emoji markers
- Everything centered
- Three equal icon cards as the default
- Accent rails on cards
- An arrow suffix on every link
- The same uppercase mono eyebrow over every section
- An accent-colored headline word
- A radius off the scale (anything but 4px controls, 8px surfaces or a pill)
- Drop shadows with an offset, or shadows on cards in the flow
- Bounce above 0.12, bounce on exits or the responsive tier, a second expressive moment per view, scroll reveals, parallax, marquee
- A second typeface
- A weight outside the three roles (bold, 700 and up, below 400, or 600 above 12px)
- Type above 18px

## Token quick view (values live only in `assets/tokens.css`)

- **Surfaces:** `--canvas`, `--surface-1`, `--surface-2`, `--surface-3`
- **Lines:** `--line`, `--line-strong`, `--line-control`
- **Text:** `--fg` (titles, key values), `--fg-muted` and `--fg-subtle` (one grey for all other text, two names), `--fg-disabled`
- **Accent:** `--accent` (a fill only), `--accent-hover`, `--accent-fg`, `--accent-text` (links and accent text), `--accent-tint`, `--focus`
- **Status:** `--success`, `--warning`, `--danger`
- **Data hues (P11):** `--data-blue`, `--data-amber`, `--data-teal`, `--data-violet`, `--data-rose`, each with `-text` (words in the hue) and `-tint` (the fill behind them); marks take the plain name
- **Material:** `--glass-bg`, `--glass-border`, `--highlight`, `--light`, `--glow`, `--grain`. Primitives: `.litt-glass`, `.litt-raised`, `.litt-lit`, `.litt-grain`, `.litt-grain-fade`, `.litt-trim`.
- **Depth:** `--shadow-tooltip`, `--shadow-float`, `--shadow-modal` (zero-offset glow + 1px ring)
- **Type:** `--font-sans` (Geist), `--font-mono` (Geist Mono), `--weight` (400), `--weight-title` (500), `--weight-label` (600), `--type-{display,h1,h2,h3,h4,reading,body,small,caption}-{size,leading,tracking}`
- **Space and layout:** `--space-{1,2,3,4,6,8,12,16,24,32,40}`, `--section-y`, `--gutter`, `--grid-gap`, `--container-{reading,content,wide}`
- **Shape:** `--radius-control` (4), `--radius-surface` (8), `--radius-pill`
- **Controls:** `--control-{sm,md,lg}` (32/44/56), `--control-pad-{sm,md,lg}` (12/16/24), `--button-pad-lg` (32), `--control-text-{sm,md,lg}`, `--control-gap`, `--control-group-gap`
- **Motion:** `--dur-{instant,responsive,expressive}`, `--dur-exit-{responsive,expressive}`, `--ease-{out,responsive,expressive}`, `--spring-{responsive,expressive}`, `--stagger`, `--travel`, `--exit`, `--press-scale`, `--dismiss-distance`, `--dismiss-velocity`

For Tailwind v4, use `assets/tailwind.css`, which provides `bg-canvas`, `text-fg-muted`, `border-line`, `h-control-md`, `rounded-control`, `rounded-surface`, `rounded-pill`, `ease-responsive`, `shadow-float`, `py-section`, `shadow-glow`, `font-title`, `font-label` and similar. Those plain names are for showing code and for projects without the registry. In a React project you can write to, do not copy the tokens: `npx shadcn@latest add @litt/<item>` (or `https://littmd.vercel.app/r/<item>.json`) installs the tested components and adds the same utilities under `litt-` names, such as `bg-litt-canvas` and `rounded-litt-control`. `workflows/build.md` §3 has the item table and the rules. To see everything rendered, open `assets/specimen.html`.

## Scripts

```bash
# Audit a site: measured fonts, sizes, colors, radii, shadows, transitions + screenshot
node ${CLAUDE_SKILL_DIR}/scripts/extract-styles.mjs site <url> --out captures/<slug>

# Audit a moodboard (Cosmos, Pinterest): scroll and save screenshots to read
node ${CLAUDE_SKILL_DIR}/scripts/extract-styles.mjs board <url> --out captures/<slug>

# After any change to tokens or docs: links, hex drift, dark parity, contrast, weights by role, radius, shadows, motion
node ${CLAUDE_SKILL_DIR}/scripts/check.mjs
```

The extract script needs Node 18+ and Playwright. Without them (for example on claude.ai), audit from screenshots Nick provides.

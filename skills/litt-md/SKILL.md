---
name: litt-md
description: litt.md is Nick's personal design language and taste for web and product UI, motion and interaction. Use it whenever you build, restyle or review anything visual for Nick (websites, landing pages, app screens, components, prototypes or Framer sites, in React, Tailwind, HTML or CSS), when choosing type, color, spacing, radius, glass, light, shadows or motion, or when critiquing a screenshot, URL or design. Also use it for taste work - interviewing Nick about preferences, auditing a reference site, moodboard or Nick's own work, logging a reaction such as love this, hate this or more like that, and distilling the taste journal into rules. Its rules override the visual defaults of frontend-design and design-systems. Signature - technical precision, cool neutrals, Hanken Grotesk, airy layouts, light and material, fast invisible motion, light and dark both first-class.
allowed-tools: Bash(node ${CLAUDE_SKILL_DIR}/scripts/extract-styles.mjs *), Bash(node ${CLAUDE_SKILL_DIR}/scripts/check.mjs*)
---

# litt.md

**Technical precision, lit from above.** The structure is exact and quiet: an 8px grid, hairlines, one typeface at one weight, cool neutrals. The only bold move is light and material: glass that floats, a soft light falling from the top, edges that catch it, a trace of grain. Color barely appears, and where it does it behaves like light.

Skill directory: `${CLAUDE_SKILL_DIR}`. Every path below is relative to it.

## Precedence

1. Nick's words in this session.
2. The project's existing design system, if it has one. Map litt.md's rules onto it rather than replacing it.
3. litt.md (this skill).
4. The `design-systems` skill, for concrete patterns only (how Linear builds X). litt.md wins any conflict.

## Pick a mode, then read only these files

| Nick wants to… | Mode | Read |
|---|---|---|
| Build or restyle a page, component or prototype | **build** | `workflows/build.md`, `system/material.md`, `assets/tokens.css`. Add `system/components.md` for components and `system/framer.md` for Framer. |
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

## The ten signature rules

1. **P1 Light, not paint.** The accent appears as light (`--light`, `--glow`, `--focus`). At most one accent fill per view, on the primary action.
2. **P2 One light source.** Light comes from the top. Highlights sit on top edges only.
3. **P3 Glass is earned.** Glass only for floating surfaces: header, command menu, popovers, modals, toasts.
4. **P4 Depth without drop shadows.** Cards stay flat (hairline plus highlight). Floating surfaces get a zero-offset glow plus a 1px ring.
5. **P5 Material is static.** Glow, grain, gradients and light never animate.
6. **P6 Precision.** 8px grid (4px inside components), 1px hairlines, tracking tightens as size grows.
7. **P7 Airy rhythm.** One idea per section, 128 / 96 / 64px between sections, asymmetric and left-aligned by default.
8. **P8 Designed, not inverted.** Each theme has its own material strengths. Both are first-class.
9. **P9 One weight.** Everything at 400, headings and buttons included. Hierarchy comes from size, color and tracking.
10. **P10 Roomy controls.** Buttons and inputs share 32 / 44 / 56. Labels are trimmed to the cap height so padding equals the air around them. Hero and form CTAs are lg (56).

Each rule's Check line, the dos and don'ts, and the open questions are in `taste/profile.md`.

## Fixed decisions

These change only when Nick changes them.
- **Character:** technical precision.
- **Themes:** light and dark both first-class.
- **Type:** Hanken Grotesk + Geist Mono only, at weight 400 only. Display stops at 40.
- **Color:** cool neutrals at one OKLCH hue (about 262), monochrome, one accent per project.
- **Density:** airy. **Shape:** square everywhere; pills only for chips, tags, avatars and icon-only buttons.
- **Motion:** 120–200ms ease-out, 240ms ceiling; transform and opacity only.

## Never, unless Nick asks

- Purple-blue gradient heroes, gradient text, decorative gradients
- Emoji markers
- Everything centered
- Three equal icon cards as the default
- Accent rails on cards
- An arrow suffix on every link
- The same uppercase mono eyebrow over every section
- An accent-colored headline word
- Rounded corners (anything other than square or pill)
- Drop shadows with an offset, or shadows on cards in the flow
- Springs, scroll reveals, parallax, marquee
- A second typeface
- Any font weight above 400

## Token quick view (values live only in `assets/tokens.css`)

- **Surfaces:** `--canvas`, `--surface-1`, `--surface-2`, `--surface-3`
- **Lines:** `--line`, `--line-strong`, `--line-control`
- **Text:** `--fg`, `--fg-muted`, `--fg-subtle`, `--fg-disabled`
- **Accent:** `--accent`, `--accent-hover`, `--accent-fg`, `--accent-tint`, `--focus`
- **Status:** `--success`, `--warning`, `--danger`
- **Material:** `--glass-bg`, `--glass-border`, `--highlight`, `--light`, `--glow`, `--grain`. Primitives: `.litt-glass`, `.litt-raised`, `.litt-lit`, `.litt-grain`, `.litt-grain-fade`, `.litt-trim`.
- **Depth:** `--shadow-tooltip`, `--shadow-float`, `--shadow-modal` (zero-offset glow + 1px ring)
- **Type:** `--font-sans`, `--font-mono`, `--type-{display,h1,h2,h3,h4,reading,body,small,caption}-{size,leading,tracking}`
- **Space and layout:** `--space-{1,2,3,4,6,8,12,16,24,32,40}`, `--section-y`, `--gutter`, `--grid-gap`, `--container-{reading,content,wide}`
- **Shape:** square by default; `--radius-pill` for chips, tags and avatars
- **Controls:** `--control-{sm,md,lg}` (32/44/56), `--control-pad-{sm,md,lg}` (12/16/24), `--control-text-{sm,md,lg}`, `--control-gap`, `--control-group-gap`
- **Motion:** `--dur-{instant,reveal,panel,max}`, `--ease-out`, `--press-scale`

For Tailwind v4, use `assets/tailwind.css`, which provides `bg-canvas`, `text-fg-muted`, `border-line`, `h-control-md`, `rounded-pill`, `shadow-float`, `py-section`, `shadow-glow` and similar. To see everything rendered, open `assets/specimen.html`.

## Scripts

```bash
# Audit a site: measured fonts, sizes, colors, radii, shadows, transitions + screenshot
node ${CLAUDE_SKILL_DIR}/scripts/extract-styles.mjs site <url> --out captures/<slug>

# Audit a moodboard (Cosmos, Pinterest): scroll and save screenshots to read
node ${CLAUDE_SKILL_DIR}/scripts/extract-styles.mjs board <url> --out captures/<slug>

# After any change to tokens or docs: links, hex drift, dark parity, contrast, weight, radius, shadows, motion
node ${CLAUDE_SKILL_DIR}/scripts/check.mjs
```

The extract script needs Node 18+ and Playwright. Without them (for example on claude.ai), audit from screenshots Nick provides.

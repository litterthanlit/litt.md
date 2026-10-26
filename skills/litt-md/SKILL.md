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
| Measure an app's code against litt ("how litt is my app", "check my app") | **check** | `workflows/check.md`. It runs `scripts/litt-check.mjs`: a score out of 100 with every finding and its fix. |
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

## The nine rules (profile v1.0)

1. **R1 Precise instruments.** Screens are exact and quiet; the controls are objects you can hold. Nothing is decorated, and every state of every object is designed (default, hover, pressed, focus, disabled, and empty, loading or error).
2. **R2 Light from the top.** One light from above. Raised things catch it on their top edge (`--highlight`), cut things (a slot, a tray) on their lower wall, floating things glow evenly. Each theme has its own light and material values. Material is still unless a hand is on it: glow, grain and gradients never animate.
3. **R3 The depth ladder.** Four depths, one recipe each. Sunken: a tray (`--tray`, `--tray-shade`) for choices, a cut (`--cut`, `--cut-shade`, inside the control line) for what you type or mark (fields, checkboxes, radios), or a slot (`--slot`, `--slot-shade`) for what fills. Flat: the canvas and surfaces with a hairline and the top highlight, never a shadow. Raised: a block (`--block-lift`, `--block-press`), or a cap and its plate (`--cap-lift`, `--plate-lift`); only raised things cast, straight down, at most 3px, and selected is raised (a switch's block, the selected segment, the current page). A select's trigger, a stepper's − and +, key caps and the tags in a field are raised too; a destructive action is a block with `--danger` words, and the danger fill is kept for a destructive dialog's confirm. Floating: glass on what floats over content, with a zero-offset glow and a ring. Every depth survives forced colors.
4. **R4 Motion answers a hand.** Three tiers answer a click: instant 100ms, responsive spring 200ms bounce 0, expressive spring 350ms bounce 0.12 once per view; exits at 0.75×, never bouncing. Under a hand a part follows 1:1, holds where it was taken, settles on the responsive spring, rests a little at its default and sinks half a pixel when pressed. Transform and opacity only, plus color fades at instant. Nothing moves on its own.
5. **R5 Say it in words.** A switch says On or Off, a slider its value, a status Ready or Failed. Never color, a dot or position alone. A word in a control is sentence case, 12px, the title weight.
6. **R6 One accent, as light.** One accent fill per view: the primary action with its glow, or the one main switch (no glow). Elsewhere it is light: the focus ring and links. Checkboxes, radios and other switches fill with `--fg`. Litt's accent is Blue 4, at least 0.12 (OKLab) from every data hue. A project may run monochrome (`[data-accent="mono"]`): the primary action in the ink.
7. **R7 Color carries data.** Beyond the one accent, color only says something: a series, a category, a heat step, a side of a goal, an identity. Five data hues in a fixed order (blue, amber, teal, violet, rose), each with a mark tone, a `-text` tone and a tint, never on chrome.
8. **R8 Weight, ink and space rank.** Text at 400 (`--weight`), titles, buttons, tabs and words in a control at 500 (`--weight-title`), 12px labels at 600 (`--weight-label`), nothing else. Two inks. Nearly everything 14px, one 18px title, nothing above 18. Lockups 4px, blocks 16px, sections 48px. Figures are tabular; the mono is for code only.
9. **R9 Exact, with room.** 8px grid (4px inside components), 1px hairlines, radii 4 / 8 / pill nested. Controls share 32 / 44 / 56 with trimmed labels (sm pad 12, md 16, an lg button 32); lg for hero CTAs only; touch targets at least 44px. Airy pages (128 / 96 / 64px between sections), compact tools.

Each rule's Check line, the generic-AI tells and the open questions are in `taste/profile.md`.

## Fixed decisions

These change only when Nick changes them.
- **Character:** precise instruments. Screens exact and quiet, the controls objects you can hold.
- **Themes:** light, dark and forced colors each designed.
- **Type:** Geist, with Geist Mono for code and terminal output only, in three weights by role (R8). Nothing is set above 18px: display and h1 are 18, the rest 14, 13 and 12. Numbers, keys, data and versions are Geist in tabular figures.
- **Signature:** material you can touch, lit from the top: trays, slots, blocks, caps and glass.
- **Color:** warm stone neutrals at one OKLCH hue (about 60), monochrome chrome, one accent per project; Litt's is Blue 4, or a project runs monochrome. Five data hues carry data, never chrome (R7).
- **Density:** airy pages, compact tools.
- **Shape:** slight radius. Controls 4px (tags and chips too), surfaces 8px, pills only for avatars and icon-only buttons. A block set into a control takes the control radius less its inset, never more than a quarter of its short side.
- **Motion:** three tiers for a click and a fourth kind under a hand (R4). Instant 100ms ease-out; responsive spring 200ms, bounce 0; expressive spring 350ms, bounce 0.12, one per view. Exits run at 0.75× and never bounce. Transform and opacity only, plus color fades at instant.

## Never, unless Nick asks

- Purple-blue gradient heroes, gradient text, decorative gradients
- Emoji markers
- Everything centered
- Three equal icon cards as the default
- Accent rails on cards
- An arrow suffix on every link
- The same uppercase mono eyebrow over every section
- An accent-colored headline word
- A radius off the scale (anything but 4px controls, 8px surfaces or a pill; a block set 2px into a control takes the control radius less 2px)
- A shadow that is not a step of the depth ladder: an offset on anything but a raised block, cap or plate, a cast more than 3px down, or any shadow on a card in the flow (`system/material.md` 6)
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
- **Data hues (R7):** `--data-blue`, `--data-amber`, `--data-teal`, `--data-violet`, `--data-rose`, each with `-text` (words in the hue) and `-tint` (the fill behind them); marks take the plain name
- **Material:** `--glass-bg`, `--glass-border`, `--highlight`, `--light`, `--glow`, `--grain`. Primitives: `.litt-glass`, `.litt-raised`, `.litt-lit`, `.litt-grain`, `.litt-grain-fade`, `.litt-trim`.
- **Depth:** `--shadow-tooltip`, `--shadow-float`, `--shadow-modal` (zero-offset glow + 1px ring)
- **Press** (the depth ladder's sunken and raised steps, R3): sunken `--tray`, `--tray-shade`, `--cut`, `--cut-shade`, `--slot`, `--slot-shade`, `--slot-fill`, `--slot-fill-shade`; raised `--block`, `--block-lift`, `--block-press`, `--key-lift`, `--cap`, `--cap-held`, `--cap-lift`, `--cap-press`, `--plate-lift`; marks `--cap-grip`, `--notch`, `--notch-home`. Monochrome: `[data-accent="mono"]`.
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

# Score an app's code against litt, out of 100, with every finding and its fix (workflows/check.md)
node ${CLAUDE_SKILL_DIR}/scripts/litt-check.mjs <app folder>
```

The extract script needs Node 18+ and Playwright. Without them (for example on claude.ai), audit from screenshots Nick provides. The app check needs only Node 18+.

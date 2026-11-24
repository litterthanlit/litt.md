---
name: litt-design-craft
description: Nick's overall design & UI engineering skill for building components, interfaces, prototypes, and apps across any world (Flat, Rack 2.0, Device, Press, Plain, or fresh products). Use whenever designing, building, restyling, or reviewing UI or interactive components for Nick so every screen feels simple, energetic, uplifting, emotionally resonant, easy to use and read, calm (not overwhelming), and free of unnecessary information.
---
# litt-design-craft — Simple, Uplifting, High-Craft UI

Design and build components, interfaces, and products that feel **simple, energetic, uplifting, emotionally inspiring, easy to use and read, never overwhelming, and free of unnecessary information**.

This skill applies to **everything visual** — across all `litt.md` worlds (Flat, Rack 2.0, Device, Press, Plain) and any standalone web app, tool, or prototype. Inside `litt.md`, pair it with [`skills/litt-md/SKILL.md`](../litt-md/SKILL.md), `taste/litt-principles.md`, and `assets/tokens.css`: `litt-md` governs the concrete tokens, worlds, and rules; `litt-design-craft` governs the human-centered craft bar, emotional tone, ruthless subtraction, and pre-ship engineering QA.

## 1. The Six Core Principles (Every Screen, Every Component)

### 1. Simple
- **One job per component.** Every component has one clear purpose and one clear primary interaction.
- **One container, one surface.** Never nest cards inside cards, boxes inside boxes, or chrome inside chrome.
- **Direct over indirect.** Prefer touching the object itself (dragging a layer, clicking a slice, scrubbing a timeline, typing straight into a field) over wiring up extra toolbars or settings modals.

### 2. Energetic & Uplifting
- **Design for energetic, uplifting people — never dull, heavy, or corporate.**
- **Colour feels alive and purposeful:** use clean, luminous, well-tuned colour families with high legibility (4.5:1 text on tint, 3:1 edges in both light and dark). Put colour on the **things people make, run, or care about** (agents, layers, projects, states, artwork), while keeping surrounding chrome calm so the colour lifts the whole screen.
- **Responsive, joyful tactile feel:** controls should feel alive the instant you touch them — crisp press response (`0.98` scale or physical sink), 1:1 pointer tracking, and world-matched motion that makes using the tool feel *good*.

### 3. Inspiring Emotion
- **Earn feeling through craft, never decoration.** Every design should leave a person feeling something real — delight, momentum, clarity, focus, or calm confidence.
- **Real content and living detail:** show real, tasteful visuals (long-exposure gradients, dithered art, crisp redlines, responsive layout frames, real domain copy) — never Lorem Ipsum, never dead grey placeholder boxes, never generic purple-blue AI gradients or emoji clutter.
- **One memorable moment per view:** one signature motion, figure, canvas, or tactile detail carries the emotional weight while everything around it stays quiet.

### 4. Easy to Use and Read
- **Zero learning curve:** a person should know what something does and complete it at a glance with zero explanation.
- **Plain, human words:** sentence case, short verbs, clear states (`Allow`, `Copied`, `Hold to send`, `Thinking it through`). Never jargon walls, never colour/dot-only status without a word.
- **Effortless legibility:** crisp contrast in both Light and Dark themes, tabular figures (`font-variant-numeric: tabular-nums`) on live numbers, clear spacing and alignment, comfortable hit targets, and native accessibility (real `<button>` / `<input>` / ARIA roles, keyboard navigation, single tab stop per composite).

### 5. Not Overwhelming
- **Visual quietness first:** generous breathing room, calm neutral grounds, and a clear visual hierarchy (at most 1–2 focal anchors per component).
- **At most one accent fill per view** for the primary action or active switch — never ten competing bright buttons fighting for attention.
- **Progressive disclosure:** show only what matters right now. Reveal details, secondary actions, history, or measurements only on hover, focus, drag, or open.

### 6. No Unnecessary Information
- **Ruthless subtraction:** before shipping, look at every label, icon, divider, border, badge, and helper line and ask: *if I delete this, does the user lose anything?* If not, delete it.
- **Say each thing once:** never repeat a title, count, unit, or status in two places.
- **Zero filler chrome:** cut decorative eyebrows (`FIG. 01`, `SECTION 02`), fake telemetry, redundant legends, debug labels, marketing fluff, and explanatory captions that tell the user what to admire.

## 2. How Each World Expresses These Principles

Choose the world that fits the product (or Nick's direction) — never mix worlds or force one world's clichés onto another:

| World | Emotional feel | Visual grammar | Motion personality |
|---|---|---|---|
| **Flat** | Light, airy, buoyant, friendly | Monochrome by default (`#ededed` / `#171717` ground, borderless white/black paper `16px`, pills `28px` & circles, ink accent, zero status dots, Candy hues only on series) | Expressive `350ms` (`0.28` bounce) arrivals growing from where you touched; `0` bounce on small moves & exits |
| **Rack 2.0** | Focused, sharp, uplifting pro-tool energy | Quiet grey modular panels (`6px`) & square controls (`2px`, `1px` `--edge`), sunlit yellow (`#ffc933`) lit key, **one strip + one surface + 6-hue layer-colour family** (`tint` + `1px` hue edge + `4.5:1` text) | On the beat: `0ms` 1:1 under a hand, `100ms` ease-out opacity cut-in, `75ms` cut-out, `60ms` beat stagger, zero springs; time moves it |
| **Device** | Tactile, machined, physical precision | Aluminium plate, recessed wells, keys on `2px` skirts, dark LCD glass, Geist Mono, orange lamp only | Crisp mechanical steps & detents; subtle synthesized click on press |
| **Press** | Calm, editorial, lit physical instrument | Warm stone neutrals lit from above (`--highlight` + one hero light/grain), `4px` controls / `8px` surfaces, zero outlines on raised blocks (`≤3px` cast), sunken trays/cuts/slots, floating frosted glass over real content, Blue 4 once per view | Weighted settle (`200ms` bounce `0`, `350ms` bounce `0.12` once per view, `150ms` exits) |
| **Plain** | Honest, effortless, zero friction | White paper, `1px` lines, system font, link blue | Still (`0ms`) — instant response |

### Rack 2.0 Quick Token Reference (6-Hue Layer-Colour Family)
When building in Rack 2.0, keep every coloured object (agent, layer, stage, branch, component) inside one consistent recipe (`background: var(--clip-<h>-tint); box-shadow: inset 0 0 0 1px var(--clip-<h>); color: var(--clip-<h>-text);`, `2px` edge when active) and keep colour identity fixed (e.g., Planner/Header purple, Researcher/Build blue, Coder/Deploy orange, Reviewer/Sidebar green, Card pink, Button cyan):
- **Light (`#c8c8c8` body / `#e2e2e2` panel / `#f3f3f3` cut):** blue `#2f7bf5`/`#1a4fb3`/`#d9e8ff`, orange `#cc610a`/`#9a4300`/`#ffe5cc`, cyan `#0e8a82`/`#0b6660`/`#d0f2ee`, purple `#7c5cf0`/`#4a2fb8`/`#e6defd`, green `#2f8a3c`/`#1f6a2b`/`#daf1d6`, pink `#e0438f`/`#9c1e5e`/`#fddbeb`, yellow `#ffc933` (`#111111` ink).
- **Dark (`#161616` body / `#262626` panel / `#1b1b1b` cut):** blue `#5a9bff`/`#b3d0ff`/`#16294a`, orange `#f59a4a`/`#ffd0a6`/`#3e2711`, cyan `#34c2b8`/`#98e6df`/`#0f3432`, purple `#a08cff`/`#d1c7ff`/`#2b2452`, green `#62bb6e`/`#b0e3b4`/`#17331b`, pink `#f070b0`/`#ffbadb`/`#3e1830`, yellow `#ffc933` (`#111111` ink).

## 3. Interaction & Restraint Guardrails

- **A hand always wins:** anything playing by itself (a gallery preview ghost) stops permanently on the first `pointerdown`, `keydown`, or `wheel` event. Shipped components never loop or shimmer without real live work running.
- **No cliché traps:**
  - Never lean literally on music/DAW hardware (BPM bars, metal mixer knobs, M/S racks) when designing software/agent/design tools.
  - Never clone reference infographics or copy decorative magazine layouts.
  - Never fall back to generic dark-purple SaaS templates, glow-heavy glassmorphism, or wall-of-widgets dashboards.
- **Reduced motion:** honor `prefers-reduced-motion: reduce` by zeroing durations, staggers, and ghosts cleanly.

## 4. Pre-Ship Craft & Engineering QA Checklist

Before presenting any component, preview, or PR to Nick:

1. **Subtraction pass:** remove at least 1–2 unnecessary labels, borders, metrics, or helper strings so the design breathes and reads effortlessly in 2 seconds.
2. **Dual-theme visual check:** render and visually inspect **both Light and Dark** screenshots in headless Chrome — verify zero clipping, zero unintended wrapping, and clean contrast on every state (default, active, hover, pressed, disabled, and inverted dark-mode switch thumbs).
3. **Zero negative clocks:** always clamp `dt = Math.max(0, Math.min(0.1, (now - last) / 1000))` in `requestAnimationFrame` loops and `Math.max(0, t)` in time formatters.
4. **Zero unreadable mid-transition keys:** keys that invert `ink` ↔ `panel` snap on the frame (`transition: none`) so they never flash unreadable mid-fade.
5. **Zero blank holes on live numbers or initial mount:** pre-populate digit spans during numeric updates (scope label CSS with `> span` so nested digit columns are never overridden) and eagerly mount visible viewport tiles alongside `IntersectionObserver`.
6. **Repo verification:** inside `litt.md`, remove temporary `dev.html` and run `node skills/litt-md/scripts/check.mjs` before committing.

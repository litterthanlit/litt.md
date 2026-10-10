# litt.md in Framer

Framer is Nick's main build tool. This file maps the system onto Framer's primitives, so a Framer build and a coded build look and behave the same. Values come from `assets/tokens.css`. Read the hex values there when creating styles.

## 1. Color styles (light and dark)

Create one color style per token, with both a light and a dark value (Framer color styles support a dark-mode value). Name them with the same path as the variables so a critique can map them one to one:

```
Canvas            → --canvas
Surface/1, /2, /3 → --surface-1 … --surface-3
Line/Default, /Strong, /Control → --line, --line-strong, --line-control
Text/Primary, /Muted, /Subtle, /Disabled → --fg, --fg-muted, --fg-subtle, --fg-disabled
Accent/Default, /Hover, /On, /Tint → --accent, --accent-hover, --accent-fg, --accent-tint
Status/Success, /Warning, /Danger
```

Set the project to follow the system theme. Preview both modes before publishing (P8).

## 2. Text styles

Font: **Geist** (Google Fonts, available in Framer) and **Geist Mono**. Create text styles from the scale in `foundations.md`, with the size, line height and letter spacing taken from the `--type-*` tokens. Framer takes letter spacing in em, so enter the token value directly (for example −0.03em for display).

```
Display  → H1 tag on the hero only (fluid: 72 desktop / 56 phone via breakpoints)
H1, H2, H3, H4 → their tags
Reading, Body, Small, Caption → P tag
Mono     → for kbd, data, versions
```

Weights: Regular 400, Medium 500, Semibold 600. Never Bold.

## 3. Layout

- **Breakpoints:** Desktop (1280 design width, from 1024 up), Tablet (from 640), Phone (390 design width). These match the section-y changes at 640 and 1024.
- **Page wrapper:** a Stack with max width 1280 (`--container-wide`), horizontal padding 32 / 24 / 16 by breakpoint, centered.
- **Sections:** a vertical Stack with top padding 128 / 96 / 64 (`--section-y`), and bottom padding only on the last section.
- **Asymmetric split:** a horizontal Stack where the label column is fixed at 25% width (sticky inside the section) and the content fills the rest. It stacks vertically on Phone.
- **Gaps:** only values from the space scale (4, 8, 12, 16, 24, 32, 48, 64, 96, 128).

## 4. Effects and material

| Material | Framer recipe |
|---|---|
| **Glass** | Frame fill = Surface/1 at 72% opacity, **Background Blur** 20, border 1px (white 8% dark / ink 7% light), **Inner Shadow** y 1, blur 0, white at 6% dark / 90% light (the highlight). Floating frames only. |
| **Raised card** | Fill Surface/1, border 1px Line/Default, inner shadow y 1 blur 0 (highlight). Light mode adds a drop shadow of y 1, blur 2, ink at 4%. |
| **Light source** | Add a second fill layer to the hero frame: a radial gradient centered at the top edge (position 50% / −10%), from the accent at 12% light / 22% dark to transparent by about 65%. |
| **Grain** | Add a top layer: an image fill using a 160px fractal-noise PNG tile at 2% light / 4% dark opacity, set to not capture pointer events. Export the tile once from `--grain` and reuse it. |
| **Glow (primary button)** | Border 1px accent at 55%, plus a drop shadow of y 8, blur 24, spread −8, accent at 28% light / 40% dark. One per page. |

Never animate these layers (P5).

## 5. Motion

- **Transition preset** (save as the default): **Tween**, duration `0.12`, bezier `0.25, 0.46, 0.45, 0.94`.
- Also save: Reveal `0.16`, Panel `0.2`, with the same curve. Nothing over `0.24`.
- **Never use springs.** Overshoot reads as performance, not confirmation.
- Hover variants change fill or color only. Press variants scale to `0.98`.
- **No** Appear effects, scroll transforms, parallax, ticker or marquee components (motion rules in `foundations.md`).
- Framer respects reduced motion for its own effects. Custom code components must check `useReducedMotion()`.

## 6. Custom code (optional)

To use the exact tokens in code components or embeds, paste `assets/tokens.css` into **Site Settings → General → Custom Code → End of head** inside a `<style>` tag. Code components can then use `var(--surface-2)`, `.litt-glass` and so on. When tokens change, re-paste the file (see the propagation checklist in `workflows/evolve.md`).

## 7. Framer review checklist
- [ ] Every color comes from a color style with both modes set.
- [ ] Every text layer uses a text style. No local overrides of size or tracking.
- [ ] Gaps and paddings are on the scale.
- [ ] Glass only on floating frames (header, menus, modals, toasts).
- [ ] One accent fill and one glow per page.
- [ ] Every transition uses the saved tween preset. No springs, no Appear effects.
- [ ] Preview in light, dark and Phone before publishing.

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

Font: **Hanken Grotesk** (Google Fonts, available in Framer) and **Geist Mono**. Create text styles from the scale in `foundations.md`, with the size, line height and letter spacing taken from the `--type-*` tokens. Framer takes letter spacing in em, so enter the token value directly (for example −0.025em for display).

```
Display  → H1 tag on the hero only (40 on every breakpoint)
H1, H2, H3, H4 → their tags
Reading, Body, Small, Caption → P tag
Mono     → for kbd, data, versions
```

Weight: Regular 400 only, for every text style (P9). Never Medium, Semibold or Bold. Hierarchy comes from size and color styles. Only add Hanken Grotesk Regular and Geist Mono Regular to the project.

## 3. Layout

- **Breakpoints:** Desktop (1280 design width, from 1024 up), Tablet (from 640), Phone (390 design width). These match the section-y changes at 640 and 1024.
- **Page wrapper:** a Stack with max width 1280 (`--container-wide`), horizontal padding 32 / 24 / 16 by breakpoint, centered.
- **Sections:** a vertical Stack with top padding 128 / 96 / 64 (`--section-y`), and bottom padding only on the last section.
- **Asymmetric split:** a horizontal Stack where the label column is fixed at 25% width (sticky inside the section) and the content fills the rest. It stacks vertically on Phone.
- **Gaps:** only values from the space scale (4, 8, 12, 16, 24, 32, 48, 64, 96, 128).

### Corners and controls
- **Corners:** controls (buttons, inputs, tabs) radius 4. Surfaces (cards, panels, menus, dialogs, toasts) radius 8. Tags and chips are controls at radius 4 too. Only avatars and icon-only buttons are fully round. A control 4px inside a surface keeps the corners concentric.
- **Button component:** one component with a Size variant.
  - sm: 32 tall, 12 side padding, 13px label.
  - md: 44 tall, 16 side padding, 15px label.
  - lg: 56 tall, 24 side padding, 16px label.
  - Labels are Regular 400 with the line height set to 1, so the padding reads as even air. Use lg for hero CTAs and form submits, full width in narrow forms.
- **Inputs:** the same heights as the buttons, so an lg input lines up with an lg button.

## 4. Effects and material

| Material | Framer recipe |
|---|---|
| **Glass** | Frame fill = Surface/1 at 72% opacity, **Background Blur** 20, border 1px (white 8% dark / ink 7% light), **Inner Shadow** y 1, blur 0, white at 6% dark / 90% light (the highlight). Floating frames only, radius 8 (0 on the full-bleed header). |
| **Raised card** | Radius 8. Fill Surface/1, border 1px Line/Default, inner shadow y 1 blur 0 (highlight). No drop shadow. |
| **Floating panel** (menu, toast, modal) | Radius 8 glass as above, plus drop shadows with **x 0, y 0**: blur 8 and 24 (menus) or 40 and 72 (modals), ink 6–10% light / black 30–50% dark, plus a 1px border ring. Never an offset shadow. |
| **Light source** | Add a second fill layer to the hero frame: a radial gradient centered at the top edge (position 50% / −10%), from the accent at 12% light / 22% dark to transparent by about 65%. |
| **Grain** | Add a top layer: an image fill using a 160px fractal-noise PNG tile at 2% light / 4% dark opacity, set to not capture pointer events. Export the tile once from `--grain` and reuse it. |
| **Glow (primary button)** | Border 1px accent at 55%, plus a drop shadow of x 0, y 0, blur 24, accent at 28% light / 40% dark. One per page. |

Never animate these layers (P5).

## 5. Motion

- **Save three transition presets.**
  - Instant: **Tween**, duration `0.1`, bezier `0.25, 0.46, 0.45, 0.94`. Hover, press, toggles.
  - Responsive: **Spring**, Time `0.2`, Bounce `0`. Menus, tabs, tooltips, the gliding highlight.
  - Expressive: **Spring**, Time `0.35`, Bounce `0.12`. One signature moment per view.
- **Exits** run at 0.75× the spring's time and never bounce: a Tween with the instant bezier at `0.15` (responsive) or `0.26` (expressive).
- The instant tween stays at `0.24` or under. Bounce stays at `0.12` or under, and is `0` on responsive and on every exit.
- Hover variants change fill or color only. Press variants scale to `0.98`.
- No scroll-triggered Appear effects, scroll transforms, parallax, ticker or marquee. The list entrance is one stagger group on load (`0.04`, Y `16`).
- Framer respects reduced motion for its own effects. Custom code components must check `useReducedMotion()`.

## 6. Custom code (optional)

To use the exact tokens in code components or embeds, paste `assets/tokens.css` into **Site Settings → General → Custom Code → End of head** inside a `<style>` tag. Code components can then use `var(--surface-2)`, `.litt-glass` and so on. When tokens change, re-paste the file (see the propagation checklist in `workflows/evolve.md`).

## 7. Framer review checklist
- [ ] Every color comes from a color style with both modes set.
- [ ] Every text layer uses a text style. No local overrides of size, tracking or weight. Nothing above Regular 400.
- [ ] Gaps and paddings are on the scale.
- [ ] Glass only on floating frames (header, menus, modals, toasts).
- [ ] Corners: 4 on controls, 8 on surfaces, pills only on avatars, icon-only buttons and switches. Buttons and inputs use the 32/44/56 sizes.
- [ ] No drop shadow with an x or y offset.
- [ ] One accent fill and one glow per page.
- [ ] Every transition uses one of the three saved presets. Bounce only on expressive, never on exits. No scroll Appear effects.
- [ ] Preview in light, dark and Phone before publishing.

# Material: the litt.md signature

Light and material are where litt.md spends its boldness. Everything else stays quiet so these few moves carry. The primitives live in `assets/tokens.css` as `.litt-glass`, `.litt-raised`, `.litt-lit`, `.litt-grain` and `.litt-grain-fade`. Use them rather than rebuilding the effects.

## The five materials

### 1. Light source: `--light`, `.litt-lit` (P1, P2)
An elliptical radial gradient anchored above the top edge, tinted with the accent at `--light-strength` (12% light, 22% dark), fading to transparent by about 65%.

- **Where:** once per view. Usually the hero, sometimes a closing section or a feature cover. Never on every card.
- **Direction:** always from the top. If a component has its own light (a card cover), it also comes from the top.
- **Do:** let it fall onto the most important content (headline, product visual).
- **Don't:** animate it, follow the cursor, add a second colored light, or use it as a full-bleed gradient wallpaper.

### 2. Glass: `.litt-glass` (P3)
`--glass-bg` (72% of the surface color) plus `blur(var(--glass-blur)) saturate(var(--glass-saturate))`, with a 1px `--glass-border`, a `--highlight` on the top edge and a zero-offset glow + ring around it (`--shadow-float`, or `--shadow-modal` via `--glass-shadow` on dialogs).

- **Allowed on:** sticky header, command menu, popovers, dropdowns, modals, toasts. These are things that float over content.
- **Never on:** cards in the page flow, sections, buttons, inputs, or glass on top of glass.
- **Put something behind it.** Glass over a flat background is just a gray box. It earns its blur when content passes underneath.
- **Implementation notes:**
  - The blur sits on `::before`, so the element does not become a containing block that traps fixed or absolute children (menus inside a glass header still position correctly).
  - Overlays go in the top layer (`<dialog>`, `popover`) so they blur the page itself.
  - The fallbacks are already in `tokens.css`: without backdrop-filter support the glass goes to about 94% opacity, and under `prefers-reduced-transparency` it becomes `--surface-1`.
  - `.litt-glass` sets `position: relative`. Override it with `sticky`, `absolute` or `fixed` as needed.

### 3. Edge highlight: `--highlight` (P2, P4)
A 1px inset line along the top edge (white at 90% in light, 6% in dark). It is how a raised surface catches the light from above.

- **Where:** raised surfaces (`.litt-raised`), secondary buttons, glass, the checked segment of a segmented control.
- **Never:** on the bottom or side edges, which would contradict the single light source.

### 4. Grain: `--grain`, `.litt-grain` (P5, P8)
A static SVG fractal-noise tile at `--grain-opacity` (2% light, 4% dark). It also dithers the banding that low-opacity gradients produce on dark screens.

- **Where:** lit areas (hero, covers). Add `.litt-grain-fade` where a lit section meets plain canvas, so no hard edge shows.
- **Never:** animated, on a `position: fixed` full-screen layer with blend modes (it repaints on scroll), or at an opacity you can consciously see.

### 5. Depth: glow + ring (P4)
- **Cards in the page flow:** no shadow at all. Depth comes from stepping `--surface-1` → `--surface-3`, the hairline and the top highlight.
- **Floating surfaces:** a zero-offset glow plus a 1px ring, so the surface lifts evenly on every side instead of casting a shadow in one direction.
  - `--shadow-tooltip`: a 2px glow and the ring.
  - `--shadow-float` (menus, popovers, toasts, the glass header): 8px and 24px glows and the ring.
  - `--shadow-modal` (dialogs, command menu): 40px and 72px glows and the ring.
- **Light:** cool ink at 6–10% for the glows and 6% for the ring.
- **Dark:** black at 30–50%. The glows darken the content around the panel, and the ring separates it.
- **Never:** a shadow with an x or y offset, or any outer shadow on a card in the flow (see the P4 check).

## The primary fill: `--accent-fill` (P1, P2)
Nick's Frame 103, kept as drawn: a vertical gradient from deep navy at the top (`--accent-top`) into the cobalt accent at the bottom (`--accent`), inside a 1px deep blue edge (`--accent-edge`), with an off-white label (`--accent-fg`). It is reserved for the one primary action in the view. It is the one surface brighter at its bottom than its top, so it reads as lit from within, and it carries no top highlight and no glow. Hover swaps to `--accent-fill-hover`, a step brighter at both ends; nothing animates (P5). Since v0.12 there is no `--glow`.

## Per-theme tuning (P8)

| Token | Light | Dark | Why |
|---|---|---|---|
| `--light-strength` | 12% | 22% | Light reads weaker on a bright canvas, so it needs less to show on dark |
| `--grain-opacity` | 0.02 | 0.04 | Noise is more visible on light grounds |
| `--accent-top`, `--accent` | deep navy into cobalt | lifted navy into a lighter cobalt | On a dark page the fill rises so the button still reads as the brightest object, and the label keeps 4.5:1 at both ends |
| `--glass-border` | dark ink at 7% | white at 8% | The edge is defined by ink in light and by light in dark |
| `--shadow-float`, `--shadow-modal` | ink glows at 6–10%, ink ring | black glows at 30–50%, black ring | Glows vanish on dark at low strength, so dark needs more energy and leans on the ring |

When tuning, change both columns deliberately. Never derive one from the other.

## Recipes

**Lit hero.**
```html
<section class="litt-lit litt-grain litt-grain-fade">…</section>
```

**Glass header.**
```css
.site-header { position: sticky; top: 0; z-index: 20; } /* plus class="litt-glass" */
```

**Floating menu over content.** Use `<dialog class="litt-glass">` at `--radius-surface`, with `background: transparent` and `--glass-shadow: var(--shadow-modal)`. The `::before` supplies the glass, and `::backdrop` is `color-mix(in oklab, var(--canvas) 55%, transparent)`, a tint with no blur, so there is no glass on glass.

**Primary button.**
```css
.btn-primary {
  background: var(--accent) var(--accent-fill); color: var(--accent-fg);
  box-shadow: inset 0 0 0 1px var(--accent-edge);
}
.btn-primary:hover { background: var(--accent-hover) var(--accent-fill-hover); }
```

## Self-check
- [ ] Exactly one light source in the view, from the top (the primary fill, bright at its bottom, is the one exception).
- [ ] Glass only on floating surfaces, with content behind it.
- [ ] Highlights only on top edges.
- [ ] Nothing material animates.
- [ ] No glow on the primary action, and one accent fill at most.
- [ ] Both themes look intentional, not inverted.

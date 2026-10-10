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
`--glass-bg` (72% of the surface color) plus `blur(var(--glass-blur)) saturate(var(--glass-saturate))`, with a 1px `--glass-border`, a `--highlight` on the top edge and `--occlusion` underneath.

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

### 5. Depth and occlusion: `--occlusion`, `--occlusion-subtle` (P4)
- **Dark:** depth comes from stepping `--surface-1` → `--surface-3` plus the highlight. `--occlusion` is a zero-blur contact ring (`0 0 0 1px` black at 40%) that separates floating glass from content. `--occlusion-subtle` is nothing.
- **Light:** `--occlusion` is a whisper (a 2px soft shadow at 4% plus a 24px shadow at 10% pulled in by 12px). `--occlusion-subtle` is just the 2px contact shadow.
- **Never:** a large, dark, visible drop shadow (see the P4 check).

## Glow: `--glow` (P1)
A 1px accent ring plus a soft accent light under the element. It is reserved for the one primary action in the view. Never use it on secondary buttons, cards, or more than one element. It does not animate on hover; only the background color changes (P5).

## Per-theme tuning (P8)

| Token | Light | Dark | Why |
|---|---|---|---|
| `--light-strength` | 12% | 22% | Light reads weaker on a bright canvas, so it needs less to show on dark |
| `--grain-opacity` | 0.02 | 0.04 | Noise is more visible on light grounds |
| `--glow-strength` | 28% | 40% | The glow needs more energy to read against dark |
| `--glass-border` | dark ink at 7% | white at 8% | The edge is defined by ink in light and by light in dark |
| `--occlusion` | soft shadow | contact ring | Shadows vanish on dark, so a ring separates instead |

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

**Floating menu over content.** Use `<dialog class="litt-glass">` with `border-radius: var(--radius-panel)` and `background: transparent`. The `::before` supplies the glass, and `::backdrop` is `color-mix(in oklab, var(--canvas) 55%, transparent)`, a tint with no blur, so there is no glass on glass.

**Primary button.**
```css
.btn-primary {
  background: var(--accent); color: var(--accent-fg);
  box-shadow: var(--glow), inset 0 1px 0 color-mix(in oklab, white 22%, transparent);
}
```

## Self-check
- [ ] Exactly one light source in the view, from the top.
- [ ] Glass only on floating surfaces, with content behind it.
- [ ] Highlights only on top edges.
- [ ] Nothing material animates.
- [ ] Glow on one element at most.
- [ ] Both themes look intentional, not inverted.

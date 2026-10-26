# Material: the litt.md signature

Material you can touch, lit from the top, is where litt.md spends its boldness (the Signature decision, R2, R3). Everything else stays quiet so these few moves carry. The primitives live in `assets/tokens.css` as `.litt-glass`, `.litt-raised`, `.litt-lit`, `.litt-grain` and `.litt-grain-fade`. Use them rather than rebuilding the effects.

## The six materials

### 1. Light source: `--light`, `.litt-lit` (R6, R2)
An elliptical radial gradient anchored above the top edge, tinted with the accent at `--light-strength` (12% light, 22% dark), fading to transparent by about 65%.

- **Where:** once per view. Usually the hero, sometimes a closing section or a feature cover. Never on every card.
- **Direction:** always from the top. If a component has its own light (a card cover), it also comes from the top.
- **Do:** let it fall onto the most important content (headline, product visual).
- **Don't:** animate it, follow the cursor, add a second colored light, or use it as a full-bleed gradient wallpaper.

### 2. Glass: `.litt-glass` (R3)
`--glass-bg` (72% of the surface color) plus `blur(var(--glass-blur)) saturate(var(--glass-saturate))`, with a 1px `--glass-border`, a `--highlight` on the top edge and a zero-offset glow + ring around it (`--shadow-float`, or `--shadow-modal` via `--glass-shadow` on dialogs).

- **Allowed on:** sticky header, command menu, popovers, dropdowns, modals, toasts. These are things that float over content.
- **Never on:** cards in the page flow, sections, buttons, inputs, or glass on top of glass.
- **Put something behind it.** Glass over a flat background is just a gray box. It earns its blur when content passes underneath.
- **Implementation notes:**
  - The blur sits on `::before`, so the element does not become a containing block that traps fixed or absolute children (menus inside a glass header still position correctly).
  - Overlays go in the top layer (`<dialog>`, `popover`) so they blur the page itself.
  - The fallbacks are already in `tokens.css`: without backdrop-filter support the glass goes to about 94% opacity, and under `prefers-reduced-transparency` it becomes `--surface-1`.
  - `.litt-glass` sets `position: relative`. Override it with `sticky`, `absolute` or `fixed` as needed.

### 3. Edge highlight: `--highlight` (R2, R3)
A 1px inset line along the top edge (white at 90% in light, 6% in dark). It is how a raised surface catches the light from above.

- **Where:** raised and flat things' top edges: surfaces (`.litt-raised`), glass, a block's and a cap's face.
- **Cut things** (a tray, a slot) catch the light the other way: on their lower wall, inside (`--slot-shade` carries it).
- **Never:** on the bottom edge of something raised, the top edge of something cut, or a side edge, which would contradict the single light source.

### 4. Grain: `--grain`, `.litt-grain` (R2)
A static SVG fractal-noise tile at `--grain-opacity` (2% light, 4% dark). It also dithers the banding that low-opacity gradients produce on dark screens.

- **Where:** lit areas (hero, covers). Add `.litt-grain-fade` where a lit section meets plain canvas, so no hard edge shows.
- **Never:** animated, on a `position: fixed` full-screen layer with blend modes (it repaints on scroll), or at an opacity you can consciously see.

### 5. Depth: glow + ring (R3)
- **Cards in the page flow:** no shadow at all. Depth comes from stepping `--surface-1` → `--surface-3`, the hairline and the top highlight.
- **Floating surfaces:** a zero-offset glow plus a 1px ring, so the surface lifts evenly on every side instead of casting a shadow in one direction.
  - `--shadow-tooltip`: a 2px glow and the ring.
  - `--shadow-float` (menus, popovers, toasts, the glass header): 8px and 24px glows and the ring.
  - `--shadow-modal` (dialogs, command menu): 40px and 72px glows and the ring.
- **Light:** the warm ink at 6–10% for the glows and 6% for the ring.
- **Dark:** black at 30–50%. The glows darken the content around the panel, and the ring separates it.
- **Never:** a shadow with an x or y offset on anything flat or floating, or any outer shadow on a card in the flow (see the R3 check). Only the raised step of the press material (6) casts, straight down and bounded.

### 6. Press: the depth ladder's sunken and raised steps (R3)
What a hand presses or moves is an object: something raised, sitting in or on something sunken, lit from the top (R2). After Nick's frames for the switch and the slider (journal, 2026-10-24: "it needs to feel physical"; 2026-10-26: "this new slider looks like the move!"). Only raised things cast, never sideways and never more than 3px down; the check script bounds every layer.

- **The tray** (`--tray`, `--tray-shade`): a floor one step below what it sits on, a hairline, and its top wall's shade on the floor (an inset 1px down, blurred 2px). In dark the floor is darker than the canvas and the hairline is light. Under a switch, a segmented control, segmented tabs, an option picker's words and slide to confirm.
- **The cut** (`--cut`, `--cut-shade`): the shallowest sunken step, for what you type or put a mark into: a field and everything built on it (a number field, a combobox, a date field, a code input, a token input, a file drop, the composer), a checkbox's box, a radio's ring and a color well. Its floor (white in light, a step below the surfaces in dark), the control line around it (`--line-control`, which stays at 3:1, so a field reads as a field), and its top wall's shade on the floor. Focus turns the line `--focus`; an error turns it `--danger`. Disabled, it lies flat on `--surface-2` with the plain hairline. Never the tray's grey floor: a field on a grey floor reads as disabled (journal, 2026-10-26, Q15).
- **Marks** stand flush in their cut: a checked box and a chosen radio fill with the ink (`--fg`) and their tick or bead is the page's color (R6); the radio's bead is a small raised block. Never the accent: a form can hold many.
- **The block** (`--block`, `--block-lift`): raised, low. In a tray it is set 2px in, with corners the control radius less those 2px, so they stay concentric with the tray's. A contact line under its edge and a soft cast, heavier below. While pressed or held the cast tightens (`--block-press`), at once, and it sinks `--press-depth` (half a pixel). In dark it is a lighter warm grey with the top highlight. A secondary button is a block on its own; so is a select's trigger (you press it, so it is raised, not cut), a stepper's − and +, a key cap (with a darker lower edge), a tag inside a field, the current page in a nav and in pagination, the selected row of a tree, an active table filter and a picked card: selected is raised. A destructive action is a block with words in `--danger` (R7).
- **The plate and the slot** (`--plate-lift`; `--slot`, `--slot-shade`): the slider's base is a plate, a block that stands taller, with a slot cut into it. The slot's top wall shades its floor and its lower wall catches the light, and the part the cap has pulled out is a step darker (`--slot-fill`, `--slot-fill-shade`).
- **The cap** (`--cap`, `--cap-lift`, `--cap-press`, `--cap-held`): what rides in the slot, 8px wide and taller than the plate, with a grip line down its face (`--cap-grip`). It casts up to 3px down; held, it sinks and its cast tightens; pushed fast it leans into the move, at most 4°.
- **Notches** (`--notch`, `--notch-home`): step marks under a slot, and a longer, darker one at home, the value the cap comes back to.
- **Where not:** cards and anything a hand does not press, move, type into or mark. A disabled control lies flat: there is nothing to push.
- **Never:** a block that casts sideways, a shade that comes from below, light on the top edge of something cut, or the press material on something a hand does not move.

## Glow: `--glow` (R6)
A 1px accent ring plus a soft, zero-offset accent light around the element. It is reserved for the one primary action in the view. Never use it on secondary buttons, cards, or more than one element. It does not animate on hover; only the background color changes (R2).

## Per-theme tuning (R2)

| Token | Light | Dark | Why |
|---|---|---|---|
| `--light-strength` | 12% | 22% | Light reads weaker on a bright canvas, so it needs less to show on dark |
| `--grain-opacity` | 0.02 | 0.04 | Noise is more visible on light grounds |
| `--glow-strength` | 28% | 40% | The glow needs more energy to read against dark |
| `--glass-border` | dark ink at 7% | white at 8% | The edge is defined by ink in light and by light in dark |
| `--shadow-float`, `--shadow-modal` | ink glows at 6–10%, ink ring | black glows at 30–50%, black ring | Glows vanish on dark at low strength, so dark needs more energy and leans on the ring |
| `--tray`, `--tray-shade` | a floor one step below the surfaces, ink hairline at 18%, ink shade at 20% | a floor below the canvas, white hairline at 7%, black shade at 80% | A sunken floor reads by its wall's shade on light, and by being the darkest thing on dark |
| `--cut`, `--cut-shade` | white, ink shade at 12% under the top wall, inside the control line | a floor below the surfaces, black shade at 80%, inside the control line | The control line carries the edge at 3:1 in both themes; the shade only says the floor sits lower |
| `--block`, `--block-lift` | white, ink contact at 22% and cast at 16% | a warm grey above the surfaces, the top highlight, black contact and cast at 55–70% | On light the cast lifts the block; on dark the block's own lightness does, and the cast only seats it |
| `--plate-lift`, `--cap-lift` | the block's white, a contact line and a cast up to 3px down at 16–24% ink | the block's grey (a cap a step lighter), the top highlight, black contact and cast at 55–70% | A cap and its plate stand taller than a block in a tray, so they cast further; on dark their lightness carries the height |
| `--slot`, `--slot-shade`, `--slot-fill` | a floor a step below the tray, an ink shade at 28% under the top wall, white at 80% on the lower wall, the fill a step darker | near black, a black shade at 90%, white at 7% on the lower wall, the fill a lighter warm grey | A cut reads by its two walls: shade under the top one, light on the lower one |

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
  background: var(--accent); color: var(--accent-fg);
  box-shadow: var(--glow), inset 0 1px 0 color-mix(in oklab, white 22%, transparent);
}
```

## Self-check
- [ ] Exactly one light source in the view, from the top.
- [ ] Glass only on floating surfaces, with content behind it.
- [ ] Raised things lit on their top edge, cut things on their lower wall, nothing lit from below.
- [ ] Every shadow is a step of the depth ladder; only raised things cast, straight down, at most 3px.
- [ ] Nothing material animates.
- [ ] Glow on one element at most.
- [ ] Both themes look intentional, not inverted.

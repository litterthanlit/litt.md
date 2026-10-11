# litt.md inspirations

Each entry is an audited reference: what to take from it and what to leave. Entries are written by `workflows/audit.md`. A pattern counts as evidence for a rule only when it has been **measured** (site mode) or **seen** (board mode). `secondhand` entries come from the older `design-systems` notes and should be re-audited before being cited as proof.

## Entry template

```
### Name · url · tag · YYYY-MM-DD
**What it is:** one line.
**Measured:** fonts · type sizes · colors (bg/fg/accent) · radii · shadows · transitions, or "unmeasured".
**Steal:** what to take, each linked to a rule (P#) or marked "new".
**Reject:** what to leave, and why (which rule or decision it breaks).
**Rule candidate:** a checkable sentence, or "-".
```

**Tags:** `reference` (a site Nick admires) · `moodboard` (Cosmos or Pinterest board) · `own-work` (Nick's shipped work, weighted higher) · `secondhand` (not yet measured)

---

## Seeds from design-systems (secondhand)

### Linear · linear.app · secondhand · 2026-10-09
**What it is:** an issue tracker; the reference point for "technical precision".
**Measured:** unmeasured. Notes say Inter Variable at 510/590, display tracking −0.022em, surfaces stepped from `#08090a`, and an indigo accent.
**Steal:**
- Surface-based elevation in dark mode (→ P4).
- A four-level text hierarchy (→ `--fg`, `--fg-muted`, `--fg-subtle`, `--fg-disabled`).
- Tracking that tightens on display sizes (→ P6).
- A glass header with a 1px light border (→ P3).
**Reject:**
- Indigo as the default accent. It is Linear's signature, and borrowing it makes litt.md read as a Linear clone.
- The 510/590 weights, which are tuned for Inter. Geist uses 400/500/600.
**Rule candidate:** -

### Raycast · raycast.com · secondhand · 2026-10-09
**What it is:** a macOS launcher with native-feeling glass panels.
**Measured:** unmeasured. Notes say panels are `rgba(30,30,30,.85)` with a 20px blur, a 1px border at 10% white, and a 10px radius.
**Steal:**
- Keyboard shortcut chips in mono (→ `kbd` component).
- A 1px light border on glass (→ `--glass-border`).
- Scale 0.98 on press, within the 120ms budget.
**Reject:**
- Selected rows filled with the accent (breaks P1). Use a surface step plus accent light instead.
**Rule candidate:** -

### Paper · paper.design · secondhand · 2026-10-09
**What it is:** a design tool with an editorial, warm-on-black site.
**Measured:** unmeasured. Notes say a `#080808` background, cream text `#f0efe4`, a 796px content width, and a 24px dot grid at 7% opacity.
**Steal:**
- A narrow measure for long-form text (→ `--measure` at 65ch, `--container-prose`).
- Texture as a quiet material layer. The dot grid is a cousin of grain, so it may be a P5-compatible alternative and is worth testing.
**Reject:**
- Warm cream text, because the neutrals are cool.
- Arrow-suffix links (a generic-AI tell).
- An oversized footer watermark (decorative; revisit once Q5 on art direction is answered).
**Rule candidate:** -

### Arc · arc.net · secondhand · 2026-10-09
**What it is:** a browser with a playful editorial site.
**Measured:** unmeasured. Notes say a serif display (Marlin Soft) with Inter, an off-white `#FFFCEC` background, and a `#3139FB` accent.
**Steal:**
- Restraint on button styling: one strong button, everything else quiet (→ P1).
**Reject:**
- The serif display face and the warm off-white (they break the type and neutrals decisions).
**Rule candidate:** -

---

## Audited references

Entries from `workflows/audit.md` go below this line, newest first.

### Fluid Functionalism · fluidfunctionalism.com, github.com/mickadesign/fluid-functionalism · reference · 2026-10-11
**What it is:** a shadcn/ui component registry by Micka, pitched as "refined UI components with satisfying hover". It ships with its own agent skill and audit scripts. Audited from the source (four parallel passes: motion, tokens, components, tooling) and measured on three live pages.

**Measured: live site (home, button, motion pages)**
- Type: Inter Variable. 13px body on about 70% of text, a 28px page title, no tracking anywhere.
- Weight: 400 on nearly everything. Headings and selected labels go to 550 or 700 through `wght` and `opsz`.
- Color: true neutral gray (chroma 0), not cool. Muted text is used on about two thirds of the text.
- Radius: 8px dominant, 12px containers, and a global Rounded/Pill switch.
- Shadows: small offset drops (0 1px 2px) in light, plus a dark recipe with an inset top highlight that strengthens with elevation.
- Transitions: 80ms on 358 of 378 transitions on the home page.

**Measured: source**
- Motion: three spring tiers in one file, 80 / 160 / 240ms. Exits run one tier quicker, at 60 / 120 / 160ms. The 240ms ceiling matches litt.md exactly.
- Controls: one height shared by buttons, inputs and menu rows: 36 default, 28 compact. Labels are trimmed to the cap height.
- Hover: one highlight element per list glides to the row nearest the pointer. It fades in where it starts and fades out in place, so the list never goes dark between rows.
- State without shift: a hidden heaviest-weight copy reserves the label's width while the visible label changes weight.
- Touch: field text goes to 16px on coarse pointers so iOS does not zoom. Hover-only controls stay visible when the device can't hover.
- Focus: a gate hides the focus ring in a popup opened by pointer until a navigation key is pressed.
- Tooling: a headless audit that flags off-scale durations, `transition: all`, per-row hover blink and selection shift, tested against a known-bad page and a known-good page.

**Steal:**
- A state change never moves the box: the label and icon keep the same width in every state (→ P9, new).
- Touch parity: hover fills only where hover exists, hover-revealed controls always visible on touch, 16px fields on coarse pointers (new).
- Focus by modality: a click never draws a ring, and a keyboard-highlighted row needs more than a faint fill (new).
- A floating surface opened inside another floating surface steps up one surface and stays solid (→ P3).
- Exits quicker than enters, entry offset from the side the popover actually opens on, and a 200ms tooltip delay (→ motion).
- Motion values audited mechanically, not just written down (→ check.mjs).

**Reject:**
- Weight as a state (400 → 550 on hover and selection). It breaks P9.
- Rounded radii and the Rounded/Pill switch. They break the binary radius.
- Offset drop shadows in light. They break P4.
- Bounce on the slow tier, looping shimmer and morphs, and blur on icon swaps. They break "invisible and fast".

**Question:**
- 80ms as the instant tier (Q15).
- The gliding hover highlight (Q16).
- Which properties may transition (Q17).
- Evidence for Q1 (it lints out uppercase and eyebrows entirely) and Q9 (true neutral gray).

**Rule candidate:** "Hover, selected and active change color or fill only. The label and icon box is identical in every state."

### Ramp · ramp.com, app.ramp.com/sign-in, support.ramp.com · reference · 2026-10-10
**What it is:** a fintech company with an in-house design system called Ryu. Nick likes the buttons: "feel more roomy".

**Measured: marketing site**
- Type: TWK Lausanne. Every element computes at weight 400, with zero tracking.
- Type scale: 64/48/40/28/24 for headlines, 20/18/16/14/13 for body.
- Text: ink `#0c0a08`; "hushed" text is the same ink at 60%.
- Colors: white page, warm grays `#f4f2f0` and `#d2cecb`, solar accent `#e4f222` on under 1% of the page area.
- Buttons, three tiers:
  - nav: 34px tall, 14px text;
  - body: 42.8px tall, 16px text, 16px padding all round, 6px radius;
  - hero: 52px tall, 20px padding, 8px radius, concentric inside a 12px-radius form.
- Button line-height is collapsed to the cap height (`leading-[.675rem]`), so the padding is all visible air. Optical padding is close to square, horizontal about 1.02–1.07 times vertical.
- Hover is a color-only 300ms fade, with no transform and no shadow.

**Measured: product (Ryu tokens on the sign-in page and help center)**
- Shared button and input heights: 24/32/40/56. The L button is 56px tall with 24px side padding and 16px text, a 3.5× height-to-text ratio and 1.5em side padding.
- Radius is binary: 0 on buttons, inputs, modals and menus; full round on chips, avatars and icon buttons; 4px only on nav and menu items.
- Weights: body 300, headings and controls 400.
- Hover is instant: the label gets an underline. Focus is a 2px inset outline.
- Tables: 64px rows, two-line cells (14px primary over 12px muted), numbers right-aligned.
- Status pills: tinted fill, a 1px border in the text color, and an icon.
- Shadows are zero-offset glows plus a 1px warm ring.
- Neutrals are warm (hue about 20–30°).
- Icons are 1.25px stroke at 16px.

**Why the buttons feel roomy:** at the default size Ramp's button is about the same as litt.md's (42.8 vs 40px, both weight 400). The roominess comes from four things:
1. a big hero tier (52–56px, 20–24px padding);
2. optical, near-square padding, because line-height is trimmed to the cap height;
3. small, light ink in a big box (the cap height is 22–29% of the button height);
4. full-width stacked buttons in forms and cards, where the label fills only 28–49% of the width.

**Steal:**
- A button size scale whose tiers grow in air faster than in text, with a large tier for the hero and primary CTA (new).
- Button and input heights from one shared scale (new).
- Text-box trim so spacing values equal visible space (new).
- Concentric radii, where the inner radius equals the outer radius minus the inset (→ components).
- Two-tone headlines: the first clause in ink, the second in the 60% "hushed" color. This is hierarchy by color, which fits P9.
- Shadows as zero-offset glows plus a 1px ring (→ P4).
- Status pills built from paired fg/bg tokens.
- The table recipe.
- Taste written as checkable criteria, with agents as a third user of the system. This confirms litt.md's own approach.

**Reject:**
- Warm neutrals (they break the cool decision; evidence for Q9).
- A 300ms hover fade (breaks the 240ms ceiling).
- Scroll-reveal entrances.
- A centered hero on secondary pages.

**Question:**
- The product's binary radius (0 or full round) contradicts the 6/8/12 decision. Raised as Q13.

**Rule candidate:** "Buttons come in sm/md/lg tiers on one height scale shared with inputs (32/44/56). Optical padding is near-square because line-height is trimmed to the cap height. Primary CTAs on marketing pages use the lg tier."

### Pinterest "OS" board · pinterest.com/litterthanli7/os · moodboard · 2026-10-10
**What it is:** 90 pins saved for "OS" work. Pinterest's own tags for it: "dot graph, data visualization design, dot matrix pattern".
**Measured:** partial. A login modal covers the board, so only the pins around its edges were read (about 15). No attempt was made to get past the login.
**Seen:**
- Dot-matrix and pixel patterns in roughly half the visible pins.
- Dark dashboards that show data as dot matrices in green on black ("Databases deployed").
- A radial dial UI with large numerals ("WOVE", 01–05, captioned "Ambient: already on and never turns off").
- A burst of fine lines on black, a blue line-wave, pixel glyph sets, kinetic type ("SPATIAL"), a retro media-player UI, and a network graph.
**Steal:**
- Dot-matrix as texture *and* as data visualization (new; see Q7).
- Fine hairline drawings on a dark ground (→ P6).
- Large numerals as a structural device.
**Reject:**
- Retro skeuomorphic player chrome (breaks the technical-precision character).
**Rule candidate:** "Texture is a dot grid or dot matrix, never photographic noise." This conflicts with the grain in P5, so it is a question first (Q7).

### Pinterest "web" board · pinterest.com/litterthanli7/web · moodboard · 2026-10-10
**What it is:** 97 pins of web and layout references.
**Measured:** partial. The same login modal covers it; about 20 pins were visible around it.
**Seen:**
- Swiss and editorial grids: "Visual Narratives", "What we do / How we work", red-accent deliverable spreads.
- Typographic posters ("The Submerged Sonata").
- NYC-subway-style signage.
- Monochrome glyph grids.
- Blurred blue glass shapes ("smarter trading"), and an orange sun glowing on a dark ground.
- A dot-matrix data dashboard, and an orange "72 Campaign Success" stat card.
**Steal:**
- Monochrome layouts with one saturated pop (red, orange, blue) (→ color decision, P1).
- Blurred light shapes behind content (→ P1, P2).
- Big numerals and stats as the hero of a card.
**Reject:**
- Poster-style distorted kinetic type for UI (more brand/editorial than product UI, which is out of scope).
**Rule candidate:** "Exposed editorial structure (visible column rules, index numbers) is allowed as a secondary device on content pages." This is a question, because the interview chose light and material over exposed structure (Q11).

### Cosmos "UX" board · cosmos.so/litterthanlit/ux · moodboard · 2026-10-10
**What it is:** 170 saved images of UI, brand and product work.
**Measured:** seen, not measured. About 50 pins read across 3 screenshots.
**Seen:**
- Light and dark grounds in roughly equal numbers.
- **UI panels floating over atmospheric imagery** in about 8 of 50 pins: a dark glass panel over a sunset sky, a white organisation picker over blurred flowers, a login card over blurred foliage.
- Soft warm gradient fields (peach, orange, pink) in about 6 pins. None are purple-to-blue.
- Brand-guideline grids and type specimens in about 6.
- **Thin-stroke line icon sets** in 4.
- Dither, pixel and halftone treatments in about 5 ("Titan", "History of Software Design").
- Big single-letter type in 3.
- Phones and laptops with gradient screens in about 5.
**Steal:**
- Glass panels over rich, blurred backdrops: this is exactly where glass earns its blur (→ P3).
- Atmospheric blurred photography as the backdrop for product shots (evidence for Q5).
- Thin 1.5px line icons (evidence for Q3).
- Warm light fields as the "light", rather than violet gradients (→ P1; see Q8).
**Reject:**
- Fully saturated rainbow gradient posters (break the monochrome color decision).
- Logo walls as a design element.
**Rule candidate:** "When a product UI is shown as a hero visual, it floats as glass over an atmospheric, blurred image, never over a flat fill."

### litt.design · www.litt.design · own-work · 2026-10-10
**What it is:** Nick's own portfolio, a Next.js site (not Framer).
**Measured:**
- Fonts: GeistSans only, at 400/500/600. Body is 14px/1.6, the intro 18px/1.6, meta text 12px.
- Background: `#f0f0f0` (rendered near `#fafafa`).
- Text: `#0a0a0a`, `#737373`, and `#0a0a0a` at 55% opacity.
- Accent: lime `#9bd62e`, used only on status dots beside project titles.
- Radii: 2px (dominant, on contribution-graph cells), 10px on project covers, 6/8px on a few elements.
- No shadows to speak of, apart from a soft one on the portrait.
- Transitions: 0.1s dominant, 0.15s and 0.2s, with `--duration-enter .21s`, `--duration-exit .15s`, `--duration-move .4s`.
- No backdrop filters, and no CSS gradients counted (the light blobs are probably canvas or images).
- Light theme only.
**Seen:**
- An expressive hand-brushed "Litt" wordmark above a precise Geist layout.
- Soft **multi-hue ambient light blobs** (peach top-left, blue top-right, warm center) over a **dot-grid background**.
- Left-aligned, asymmetric composition: a grayscale portrait on the left, the intro text column beside it.
- Small gray nav on the right.
- "Selected work" covers with a lime dot, the title and the year.
- A grayscale GitHub contribution grid.
- A "GitHub ↗" external link.
**Steal (what Nick already does, which is strong evidence):**
- Geist only (→ decision ✓).
- Fast 100ms transitions (→ motion ✓).
- Airy, left-aligned, asymmetric layout (→ P7 ✓).
- Monochrome with one accent used as a tiny signal (→ P1 ✓).
- Light as ambient atmosphere (→ the signature ✓).
- Dot-grid texture (→ Q7).
**Gaps against the profile (raised as questions, not changed):**
- The neutrals are true gray, not cool (Q9).
- There are several colored light sources at the sides, not one from the top (Q8).
- The texture is a dot grid, not grain (Q7).
- Radii are 2px and 10px, not 6/8/12 (Q10).
- `--duration-move` of 400ms exceeds the 240ms ceiling.
- Light theme only, where the profile treats both themes as first-class.
- The lime accent is a strong candidate for Litt's own default accent (Q2).
**Rule candidate:** "On Litt's own properties the accent is lime, used as a small signal (dots, focus) and as tinted light, never as a fill." This waits on Q2.

### Vercel · vercel.com · reference · 2026-10-10
**What it is:** a developer platform, and the home of Geist. Replaces the secondhand seed.
**Measured:**
- Fonts: GeistSans (90%) and Geist Mono (10%), at weights 400/450/500.
- Type: display at 56px/1.0 with **−0.06em** tracking (−3.36px), also 64px/1.0. Body is 14px/1.43 and 16/1.5.
- Colors: background `#fafafa`, text `#171717` / `#4d4d4d`, links `#0070f3`. True neutral.
- Radii: 6px plus pills.
- Shadows: essentially none.
- Transitions: 0.1s dominant (79 of 113), 0.2s and 0.3s.
- Light theme default.
**Seen:**
- A three-column hero: headline left, a central black triangle **lit by a soft white halo with a contact shadow**, a three-line list on the right.
- Black pill primary button with a white outline secondary.
- A logo row.
**Steal:**
- Geist (→ decision).
- 0.1s as the default duration (→ `--dur-instant`).
- A single lit object as the hero, where light *is* the visual (→ P1, P2).
- Discipline about contrast.
**Reject:**
- Pure `#000` and `#fff`, because litt.md's neutrals are cool.
- Pills on every button (litt.md uses 6px controls).
- Tinted drop shadows on colored cards (breaks P4).
**Rule candidate:** "Display tracking can go tighter than −0.03em: Vercel uses −0.06em at 56px." Test this in the next interview.

### Cursor · cursor.com · reference · 2026-10-10
**What it is:** an AI code editor's marketing site.
**Measured:**
- Fonts: CursorGothic (custom grotesk) 40%, system-ui 31%, berkeleyMono 12%, EB Garamond 5% (inside a demo).
- Type: body 16px/1.5, display 72px at −0.03em, 36px at −0.02em.
- Colors: background `#f7f7f4` / `#f2f1ed` (warm off-white), text `#26251e` (warm near-black), accent orange `#f54e00` (small amounts).
- Radii: 4px dominant, 8px, plus pills.
- Shadows: large and soft under the app windows (0 28px 70px at 14%).
- Transitions: 0.15s dominant, and **0.6s** on 32 elements.
- 22 gradient elements. Light theme.
**Seen:**
- A modest left-aligned headline (about 26px, not a display size).
- A product UI window floating over a **painterly landscape** backdrop.
- Dark pill primary button next to a light pill secondary with an arrow.
- A cookie banner covering the hero.
**Steal:**
- Product UI framed by an atmospheric art backdrop, the same pattern as the Cosmos board (evidence for Q5).
- A restrained headline size: the product is the hero, not the type.
- One warm accent used sparingly (→ P1).
**Reject:**
- Warm neutrals (they break the cool-neutral decision).
- Big soft drop shadows (break P4).
- 0.6s transitions (break the motion ceiling).
- An arrow suffix on the secondary button.
**Rule candidate:** "The product shot sits on an atmospheric image, not a flat canvas," which matches the Cosmos candidate.

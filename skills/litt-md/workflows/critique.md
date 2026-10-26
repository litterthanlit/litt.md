# Workflow: critique

Use this to review a screenshot, a URL, a Framer page or code against litt.md. It also serves as the self-check at the end of `build.md`. This file is self-contained: together with `taste/profile.md` it is all you need.

## Inputs

- **Screenshot or image:** look at it directly.
- **URL:** if Bash is available, run the extract script (the command is in SKILL.md) to get measured fonts, sizes, colors, radii, shadows and transitions plus a screenshot. Read the screenshot. Measured values beat guesses.
- **Code:** read the CSS and markup. For a whole app, run the check first (`workflows/check.md`): it finds every off-system color, radius, shadow, size, weight and timing mechanically, so the critique can spend its time on what a script cannot judge. For a file or two, grep for hex values, `rounded-`, `shadow`, `transition`, `duration`, `backdrop-filter`, `animation`.
- **Your own fresh output:** the same as code, plus screenshots if possible.

Critique what is there. When something can't be judged from the input (motion in a static screenshot), mark it `n/a`, not pass.

## Scorecard

Mark each line ✅ pass, ❌ fail or `n/a`. Every ❌ needs a one-line reason that points at a specific element.

**A. Signature (material and light)**
- [ ] **R1** Nothing is decorated: everything is an object a hand uses, the one light, content or data. Every state is designed.
- [ ] **R2** One light, from the top: highlights on the top edge of raised things, light on the lower wall of cut ones, an even glow on floating ones. Nothing material animates (glow, grain, gradients, light).
- [ ] **R3** Every shadow is a step of the depth ladder: sunken (tray, slot), flat (hairline and top highlight, no shadow), raised (a block, a cap, a plate: cast straight down, at most 3px), floating (glass with a zero-offset glow and a ring, only on what floats over content; no glass on glass). The current or selected item is the raised block.
- [ ] **R5** Every state, status and value is said in words; none is shown only by color, a dot or position.
- [ ] **R6** At most one accent fill in the view, on the primary action or the one switch that is the view's main choice (no glow on that switch). Checkboxes, radios and every other switch are neutral. Elsewhere the accent is light: the focus ring and links. Or the project runs monochrome, its primary action in the ink.

**B. Structure**
- [ ] **R9** Spacing on the 8px grid (4px inside components). 1px hairlines. Tracking tightens on large type.
- [ ] **R9** One idea per section. Section spacing near 128 / 96 / 64. Left-aligned and asymmetric by default; tools may be compact.
- [ ] Radius is on the scale: 4px controls, 8px surfaces (a surface is a control plus the 4px inset), pills only on avatars and icon-only buttons (tags and chips are 4px), and a block set into a control takes the control radius less its inset.
- [ ] **R9** Buttons and inputs sit on 32 / 44 / 56. Side padding is about equal to the air around the label. Hero CTAs are lg; a page form's buttons and a dialog's fields and actions are md.
- [ ] Cards used only for independent objects, not as the default layout.

**C. Themes**
- [ ] **R2** Both themes exist and each is tuned (material strengths differ). Neither is a mechanical inversion of the other.
- [ ] Neutrals are warm stone (gray with a trace of warmth), not cool blue-gray, not pure gray and not beige.

**D. Type**
- [ ] Geist and Geist Mono only. Mono used only for code and terminal output (code blocks, commands, logs, identifiers in code); numbers, keys, data, versions and tags are in Geist, numbers with tabular figures.
- [ ] Hierarchy comes from weight, two inks and space. Nearly everything is 14px, one display or page title per page, and nothing larger than 18.
- [ ] **R8** Weight by role: text at 400, titles, buttons, tabs and words in a control at 500, 12px labels at 600. No bold, nothing below 400, no 500 or 600 on running text, no 600 above 12px, and mono at 400.
- [ ] Lockups are tight and gaps wide: a label 4px above its title, a title 4px above its text, blocks 16px apart, sections 48px apart.
- [ ] Body text 13px or larger. Long text at a 65ch measure or narrower.

**E. Motion** (`n/a` for static input)
- [ ] **R4** Three tiers only for a click: instant tween (240ms or less), responsive spring (bounce 0), expressive spring (bounce 0.12 or less). Exits at 0.75× with no bounce.
- [ ] **R4** Under a hand, a dragged part follows 1:1 and never jumps under the pointer, then settles on the responsive spring. A press sinks it, at once.
- [ ] At most one expressive moment per view.
- [ ] Only transform and opacity animate. Color, fill and the focus ring fade at instant. No layout properties, no `transition: all`.
- [ ] No unprompted motion (scroll reveals, parallax, autoplay, marquee).
- [ ] Reduced motion respected.

**F. Generic-AI tells** (each one present is a ❌)
- [ ] No purple-blue gradient hero, gradient text, or decorative gradient.
- [ ] No emoji section markers. No accent rail on cards. No arrow suffix on every link.
- [ ] No repeated uppercase mono eyebrows. No accent word in the headline.
- [ ] No three-equal-icon-cards default. Not everything centered.
- [ ] At least one detail specific to the subject.

**G. Accessibility**
- [ ] Text contrast 4.5:1 or better (3:1 for large text). Control outlines and the focus ring 3:1 or better, in both themes.
- [ ] A visible focus state on every interactive element.
- [ ] Hit targets 44px or more for primary controls.
- [ ] Semantic structure (landmarks, headings in order, real buttons and links, labels on inputs).
- [ ] Color is never the only signal.

## Output format

```
## Critique: <subject>

**Verdict:** <one sentence: how close is this to litt.md, and what's the biggest gap>
**Score:** A x/5 · B x/5 · C x/2 · D x/5 · E x/6 · F x/5 · G x/5

### Fix first (ranked by impact)
1. <element> breaks <rule>. Fix: <specific change in token terms, e.g. "swap the purple gradient for `.litt-lit` on the hero; accent at 22% in dark">
2. …
3. …

### Working
- <what already matches the language, so it's kept>

### Taste questions
- <anything the profile doesn't cover yet, phrased as a this-or-that question for Nick>
```

Keep it to three fixes. More than that means the work needs a rebuild, not a critique, so say that instead.

## After the critique

- **Nick's reactions:** if Nick agrees or disagrees with a point ("no, I like that shadow"), that is taste data. Log it through `workflows/evolve.md`.
- **Gaps in the profile:** if a question surfaced that the profile doesn't answer, add it to the profile's open questions (through the evolve protocol).
- **Critiquing a reference:** critiquing Nick's *own work* or a *reference* Nick admires is an audit, not a critique. Switch to `workflows/audit.md` so the findings land in `inspirations.md`.

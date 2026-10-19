# Workflow: critique

Use this to review a screenshot, a URL, a Framer page or code against litt.md. It also serves as the self-check at the end of `build.md`. This file is self-contained: together with `taste/profile.md` it is all you need.

## Inputs

- **Screenshot or image:** look at it directly.
- **URL:** if Bash is available, run the extract script (the command is in SKILL.md) to get measured fonts, sizes, colors, radii, shadows and transitions plus a screenshot. Read the screenshot. Measured values beat guesses.
- **Code:** read the CSS and markup. Grep for hex values, `rounded-`, `shadow`, `transition`, `duration`, `backdrop-filter`, `animation`.
- **Your own fresh output:** the same as code, plus screenshots if possible.

Critique what is there. When something can't be judged from the input (motion in a static screenshot), mark it `n/a`, not pass.

## Scorecard

Mark each line ✅ pass, ❌ fail or `n/a`. Every ❌ needs a one-line reason that points at a specific element.

**A. Signature (light and material)**
- [ ] **P1** At most one accent fill in the view, on the primary action. Checkboxes, radios and switches are `--fg`, not accent. The primary is Frame 103's gradient inside its deep blue edge, never flat and never glowing. The accent otherwise appears as light (`--light`, focus).
- [ ] **P2** One light source, from the top. Highlights only on top edges.
- [ ] **P3** Glass only on floating surfaces, with content behind it. No glass on glass.
- [ ] **P4** No drop shadow with an offset. Cards in the flow have no shadow; floating surfaces use a zero-offset glow plus a 1px ring.
- [ ] **P5** Nothing material animates (glow, grain, gradients, light).

**B. Structure**
- [ ] **P6** Spacing on the 8px grid (4px inside components). 1px hairlines. Tracking tightens on large type.
- [ ] **P7** One idea per section. Section spacing near 128 / 96 / 64. Left-aligned and asymmetric by default.
- [ ] Radius is on the scale: 6px controls, 10px surfaces (a surface is a control plus the 4px inset), pills only on avatars, icon-only buttons and switches (tags and chips are 6px). No `rounded-lg`-style classes.
- [ ] **P10** Buttons and inputs sit on 32 / 44 / 56. Side padding is about equal to the air around the label. Hero CTAs and a page form's submit are lg; a dialog's fields and actions are md.
- [ ] Cards used only for independent objects, not as the default layout.

**C. Themes**
- [ ] **P8** Both themes exist and each is tuned (material strengths differ). Neither is a mechanical inversion of the other.
- [ ] Neutrals are cool (blue-gray), not warm and not pure gray.

**D. Type**
- [ ] Hanken Grotesk and Geist Mono only. Mono used only for code, keys and data.
- [ ] Hierarchy comes from scale and color. One display size per page, and nothing larger than 40.
- [ ] **P9** Everything at weight 550: nothing lighter, no semibold or bold, including headings, buttons and mono.
- [ ] Body text 13px or larger. Long text at a 65ch measure or narrower.

**E. Motion** (`n/a` for static input)
- [ ] Three tiers only: instant tween (240ms or less), responsive spring (bounce 0), expressive spring (bounce 0.12 or less). Exits at 0.75× with no bounce.
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
**Score:** A x/5 · B x/5 · C x/2 · D x/4 · E x/5 · F x/5 · G x/5

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

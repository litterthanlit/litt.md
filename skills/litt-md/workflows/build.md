# Workflow: build

Use this when building or restyling anything visual: a page, section, component, prototype or Framer site. The process is **plan → check against generic defaults → build → self-critique**. Never skip the plan. It is short, and it is where taste gets applied.

## 0. Read the situation

1. **Nick's words in this session win.** If they ask for something the profile forbids (a serif, a centered hero), do it, and offer to log it as a journal entry (it may be taste changing).
2. **An existing project system comes next.** If the project already has tokens or a design system, map litt.md onto it (its colors, its components) rather than replacing it. Apply litt.md's *rules* (the P# rules in `taste/profile.md`) within that system.
3. **Know the target.** Ask if it isn't obvious:
   - **Code (Tailwind v4):** copy `assets/tokens.css` and `assets/tailwind.css` into the project and import `tailwind.css`. Use token utilities (`bg-canvas`, `text-fg-muted`, `border-line`, `h-control-md`, `px-control-pad-md`, `shadow-float`, `py-section`). Leave corners square (no `rounded-*` class); `rounded-pill` only for chips, tags and avatars.
   - **Code (plain CSS or another framework):** copy `assets/tokens.css` and use the variables and `.litt-*` primitives.
   - **Framer:** read `system/framer.md` and work in Framer terms (color styles, text styles, stacks, tween presets).
4. **Client work or Litt's own?** Open question Q6 asks whether the full light-and-material signature applies to client work. Until it's answered, ask Nick the first time on any client project, then log the answer.

## 1. Write the token plan (before any markup)

Write it in the reply, or as the first comment in the main CSS file. Keep it to about 10 lines:

```
Accent:        <hex light> / <hex dark>, why it fits this subject
               (contrast: on canvas ≥ 4.5 if used for links; accent-fg on accent ≥ 4.5)
Light source:  where the one light falls (hero? cover?)
Glass:         which elements float (header, menus, modals, toasts), nothing else
Primary action: the one accent fill + glow in each view
Type steps:    which steps the page uses (display once, h2/h4 labels, body/reading)
Layout:        ASCII wireframe on the 12-col grid (asymmetric by default)
Specific detail: one element only THIS subject would have (from its content, not ornament)
```

**Example wireframe:**
```
| 1  2  3  4  5 | 6 | 7  8  9 10 11 12 |
| Headline      |   | Product visual   |   ← hero, lit from top
| lede · CTA    |   | (glass menu over)|
|---------------|---|------------------|
| Label (h4)    | Content (cols 4–12)  |   ← sections: 3/9 split
```

## 2. Check the plan against generic defaults

Go through the plan line by line. If any item matches, revise that line before building:

- [ ] Purple-to-blue gradient, gradient text, or a gradient used as decoration
- [ ] Everything centered
- [ ] Three equal icon cards as the answer to "features"
- [ ] An accent bar or rail on cards; an arrow suffix on every link
- [ ] The same uppercase mono eyebrow over every section
- [ ] One accent-colored word in the headline
- [ ] Rounded corners (`rounded-lg`, `rounded-md`, any radius other than square or pill)
- [ ] A drop shadow with an offset, or any shadow on a card in the flow
- [ ] Buttons off the 32/44/56 scale, or a hero/form CTA smaller than lg
- [ ] Any font weight above 400 (`font-medium`, `font-semibold`, `font-bold`, or 500/600 in CSS)
- [ ] More than one accent fill or glow per view
- [ ] Glass on something that doesn't float
- [ ] Motion that isn't a response to the user (reveals, parallax, marquee)
- [ ] Nothing in the design is specific to this subject

Then ask: **"If I removed the light and material, would this still look like every other dark SaaS page?"** If it would, the signature is decorative, not structural. Move the light so it lands on the content that matters.

## 3. Build

- **Semantic HTML first:** `header`, `nav`, `main`, `section` with `aria-labelledby`, `button` versus `a` used correctly, and `dialog` for modals.
- **Mobile-first:** start at 390px, then 640, then 1024. Check that nothing scrolls horizontally.
- **Primitives:** `.litt-lit`, `.litt-grain`, `.litt-grain-fade`, `.litt-glass`, `.litt-raised`. Component specs are in `system/components.md`, and working code is in `assets/specimen.html`.
- **Spacing** only from the scale. **Radius** square, or pill for chips, tags and avatars. **Controls** only from the 32/44/56 scale. **Color** only from tokens. Never write a hex value in a component.
- **Motion** only through the `--dur-*` and `--ease-out` variables, so reduced motion keeps working.
- **Performance:** lazy-load images below the fold (`loading="lazy"`), set explicit width and height on media, animate only opacity and transform, keep glass to a few elements per screen, and never put blend modes on fixed layers.

## 4. Self-critique

Before presenting:
1. If a browser is available, take Playwright screenshots in light and dark at 1440 and 390, and look at them.
2. Run the critique checklist in `workflows/critique.md` on your own output. Fix every **fail** in the Signature and Accessibility groups before showing Nick anything.
3. **Remove one thing.** Find the least necessary element (an extra label, a second button style, a divider) and delete it.

## 5. Present

Show the result plus 2–4 lines naming the decisions that applied the taste (where the light falls, what floats, the accent choice). If Nick reacts ("too much glow", "love the header"), log it with `workflows/evolve.md`. Use the quick template in SKILL.md for a single reaction.

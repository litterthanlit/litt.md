# Workflow: audit

Use this to break down a reference ("why does Cursor feel so good?"), a moodboard (Cosmos, Pinterest), or Nick's own shipped work (litt.design, Framer sites). The output is an entry in `taste/inspirations.md`, journal entries, and rule candidates. **Extract principles; never copy branding.**

## Modes

| Mode | Input | Tool | Tag |
|---|---|---|---|
| **site** | A live URL | Extract script, `site` mode: measured tokens plus a screenshot | `reference` or `own-work` |
| **board** | A Cosmos or Pinterest board URL | Extract script, `board` mode: scrolls and saves screenshots to read visually | `moodboard` |
| **screenshots** | Images Nick shares (or when a site blocks headless browsers) | Look at them directly | any |

Nick's own work is weighted higher than references: it shows what Nick actually does, not what Nick admires. A gap between the two is the most useful finding an audit can make.

## Steps

1. **Capture.** Run the extract script; the exact command is in SKILL.md. Screenshots go to `captures/` at the repo root (gitignored) or a temp directory, never into the skill folder. If you hit a login wall, a bot check or empty output, ask Nick for 3–6 screenshots instead.
2. **Look.** Read the screenshots. For boards, read every screenshot and note recurring patterns across pins (count them: "dark UI in 14 of 20 pins").
3. **Measure** (site mode). From the JSON, note:
   - the top font families and their usage share;
   - the type scale actually used;
   - background, foreground and accent colors (convert to the litt.md vocabulary: is the canvas cool, neutral or warm? is there one accent or several?);
   - radii (is there one dominant value?);
   - shadows (glows or drop shadows?);
   - transition durations and easing;
   - Framer `--token-*` variables if present.
4. **Judge against the profile.** For each notable pattern decide **Steal** (it supports or extends a rule; link P# or mark "new"), **Reject** (it breaks a rule or decision; say which), or **Question** (it challenges a decision in a way worth asking Nick about).
5. **Write the entry** in `taste/inspirations.md`, under "Audited references", newest first, using the template at the top of that file. A measured entry replaces any `secondhand` seed for the same site: keep the seed's Steal/Reject only where the measurement confirms it.
6. **Journal.** Add one journal entry per meaningful pattern (`source: audit:<slug>` or `own-work:<slug>`) with a rule candidate where there is one. Follow `workflows/evolve.md`.
7. **Contradictions become questions.** If a reference Nick loves (or Nick's own work) contradicts a fixed decision, don't change the decision. Add a `Q#` to the profile and ask Nick at the end of the audit.
8. **Report to Nick.** At most 5 findings, then the questions:

```
## Audit: <name>
**In one line:** <what makes it work>
**Measured:** <3–5 key numbers>
**Steal:** <2–3 items, with P# links>
**Reject:** <1–2 items and why>
**Questions for you:** <this-or-that questions raised by contradictions>
```

## Board-mode reading guide

When reading a moodboard, look across the whole set for:
- **Ground:** dark, light or mixed, and the temperature of the neutrals.
- **Light:** glows, gradients, spotlights, glass, and where light comes from.
- **Type:** grotesk, serif or mono; tight or loose tracking; scale contrast.
- **Layout:** centered or asymmetric; density; card use; grid visibility.
- **Color:** monochrome or accent-led; which hues recur.
- **Motion cues:** if the pins are videos or GIFs, look at speed and style.
- **Outliers:** pins that break the pattern. Ask Nick what they're saved for.

Report patterns as counts or proportions, not vibes.

## Ethics and scope

- Audits study *how* something works so the principle can be reused. Never lift logos, illustrations, copy or a distinctive brand color wholesale into litt.md.
- Respect robots and login walls. If a site blocks automated access, ask for screenshots rather than working around it.

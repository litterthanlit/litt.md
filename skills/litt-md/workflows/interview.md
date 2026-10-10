# Workflow: interview

Use this when Nick wants to work on their taste ("interview me", "let's refine the language", "ask me questions"), or when the profile has open questions blocking a decision. The goal is to turn instinct into **checkable rules**. Adjectives don't count.

## Format

- **Rounds.** 3–4 questions per round, 1–3 rounds per session. Stop when the answers start to repeat.
- **This versus that.** Every question offers 2–4 concrete options. If the AskUserQuestion tool is available, use it with **previews** (ASCII mockups or CSS snippets) so Nick compares real things. Otherwise, number the options in text with a 2–4 line preview each.
- **Always ask why.** After each round, ask one free-text follow-up on the most surprising answer: "Why that one?" The *why* is what generalizes. Record it verbatim in the journal.
- **Never lead.** Don't mark options "Recommended" in a taste question. Do point out evidence ("your journal leans X") and tensions ("this contradicts P3").
- **Start where it matters.** Pick questions in this order:
  1. Open questions `Q#` in `taste/profile.md`.
  2. Journal entries whose `why` is `?` (ask for the reason).
  3. Recent `open` journal entries that are close to becoming a rule.
  4. The question bank below.

## Writing answers back

Follow `workflows/evolve.md` (the write-back protocol). In short:
1. Every answer becomes one journal entry: `verdict: chose X over Y`, `why` in Nick's words, `source: interview`.
2. An answer that **settles an open question** moves into the profile right away, as a new rule `P#` with a **Check** line or as a row in Fixed decisions. Then delete the `Q#` and set the entry's status to `→ P#` or `→ decision`.
3. An answer that **contradicts an existing rule** doesn't overwrite it silently. Ask: "This conflicts with P3 (glass is earned). Update the rule, or is this an exception?" Then record what Nick decides.
4. Answers that are **preferences, not yet rules**, stay `open` in the journal until distill finds three consistent entries.

## Rule-writing standard

A good rule is short, specific, and checkable by looking at a screenshot or the CSS:
- ❌ "Typography should feel refined."
- ✅ "Uppercase appears only on kbd and status tags; section labels are sentence case. *Check:* any uppercase text outside kbd and tags fails."

## Question bank

Use these as starting points. Adapt the previews to Nick's current work.

**Type**
1. Uppercase mono labels: never / once per view / only for metadata in tables (settles Q1)
2. Display headline length: 3–5 words / one full sentence / a two-line statement with a line break
3. Links in body text: accent color / `--fg` with underline / `--fg-muted` with underline that darkens on hover
4. Numbers in UI: Geist with tabular-nums / Geist Mono everywhere / Mono only in tables

**Color**
5. Litt's own default accent: signal blue / electric violet / acid lime / warm white light with no hue (settles Q2)
6. Accent in dark mode: the same hue, lighter / a different hue tuned per theme / desaturated
7. Status colors: full color / desaturated to fit the cool neutrals / dot only, text stays neutral

**Material**
8. Light source strength: barely there / clearly visible / dramatic spotlight (show three hero previews)
9. Texture: grain / dot grid / none (Paper's dot grid against grain)
10. Glass tint: neutral / faintly accent-tinted / more transparent with stronger blur
11. Signature on client work: always / toned down / only Litt's own properties (settles Q6)

**Motion and interaction**
12. Hover feedback: fill change / text color only / underline / subtle 1px lift
13. Page transitions: none (instant) / 120ms crossfade / shared-element morph within 240ms
14. Command menu (⌘K): on every product / only on content-heavy sites / never on marketing sites

**Layout**
15. App density: same airy rhythm / compact (32–48px sections, 13px body) / user-selectable (settles Q4)
16. Feature sections: alternating image and text / a single long list with hairlines / bento grid
17. Footer: minimal one line / large closing statement / oversized wordmark

**Components and imagery**
18. Icon stroke: 1.25 / 1.5 / 2, and the set: Lucide / Phosphor / custom (settles Q3)
19. Buttons: solid accent primary / white-on-dark (inverted fg) primary with accent as light only / outline
20. Imagery: product UI only / abstract light studies / photography / 3D renders (settles Q5)

## Closing a session

End with a three-line summary for Nick:
- **New rules:** P# titles added or changed
- **Settled:** Q# closed
- **Still open:** what to ask next time

Then commit, if the protocol allows it.

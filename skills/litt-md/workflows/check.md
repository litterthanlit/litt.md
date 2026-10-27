# Workflow: check

Use this to measure an app's code against litt.md: "how litt is this app?", "check my app", "score my UI", "why doesn't this feel like litt?". It gives one score out of 100, by category, with every finding and its fix, then fixes what Nick approves. A screenshot or a URL is a critique (`critique.md`); this is for code you can read.

## 1. Run it

From the app's root, with Node 18+:

```bash
node ${CLAUDE_SKILL_DIR}/scripts/litt-check.mjs src        # or app, components, the folders that hold the UI
node ${CLAUDE_SKILL_DIR}/scripts/litt-check.mjs --json src # the same, as one JSON object, to read findings exactly
```

It reads the app's own `.ts`, `.tsx`, `.js`, `.jsx` and `.css` files and skips `node_modules`, build output and litt's installed files (`components/litt`, `components/litt-blocks`, `lib/litt`), which are litt already. No network and no AI: it runs `lint-litt.mjs` in host mode and scores what it finds.

## 2. Read the score

| Category | What it measures |
|---|---|
| motion | Transitions on the tiers and their eases, no literal timings, no `transition-all`, no layout animation, nothing that loops but a spinner |
| color | litt tokens instead of hex, color functions, Tailwind's palette or shadcn's tokens |
| shape | Radii on the scale (control, surface, pill), shadows with no offset |
| type | Sizes on litt's scale, weight by role (R8) |
| reduced motion | 0 or 100: the app moves, and nothing stops it under `prefers-reduced-motion` |

A category reads as how much of the app follows that rule: each styled file loses 20% per finding in it, and the category is the mean over the styled files. The total is the mean of the five. 90 and up reads as litt, 75 as close, 50 as needs work, under 50 as far from litt. An app that never installed litt scores low on color and shape on purpose: that is the distance to cover.

## 3. Report it

Lead with the score and the one sentence that matters, then the categories, then what to do. Keep it short:

- **The bulk fixes first.** The "most common" list is where the score moves fastest: `76 × text-sm` is one search and replace to `text-litt-small` or `text-litt-body` (decide by what the text is, not by its size).
- **Then the parts.** A file named for a part litt ships (`menubar.tsx`, `toast.tsx`) with many findings is usually a hand-rolled or stock shadcn copy. Installing `@litt/<part>` replaces it and its findings at once; say what changes for the code that uses it.
- **Then the rest,** worst files first.

Never invent findings the script did not print, and never hide one it did. Warnings cost nothing; mention them once.

## 4. Fix what Nick approves

Show each fix as a diff and apply it only after Nick says yes, a file or a bulk fix at a time:

1. Replace by meaning, not by number. `text-sm` on a caption is `text-litt-caption`, on body copy `text-litt-small` or `text-litt-body`; `bg-accent` as a hover fill is `bg-litt-surface-2`, as the primary action `bg-litt-accent`. When the meaning is unclear, ask.
2. Prefer installing a litt part over restyling a copy of one (`workflows/build.md` §3 has the items).
3. For reduced motion, move the app's own motion onto litt's tokens (`var(--litt-dur-…)` with `var(--litt-ease-…)`), which stop by themselves, or add a `prefers-reduced-motion: reduce` block for what cannot move.
4. Run the check again after each round and give the new score beside the old one. A fix that lowers another category is not a fix.

## 5. As a gate

`--min 75` exits 1 when the score is under 75, for a CI step or a pre-push hook. Agree the number with Nick first, and raise it as the app gets closer.

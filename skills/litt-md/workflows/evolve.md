# Workflow: evolve (the write-back protocol)

This is the only file that defines how litt.md changes. Interview, audit, critique and build all point here. It covers three operations: **log** (record one reaction), **distill** (turn patterns into rules), and **propagate** (keep tokens, specimen and docs in sync).

## 1. Can I write?

Find the skill's base directory. SKILL.md states it, and it is the folder containing SKILL.md. Write directly **only if both** of these hold:

1. The path is **not** inside a read-only or cached copy: `~/.claude/plugins/cache/`, `~/.claude/skills/synced/`, or `/mnt/skills/`.
2. It is a git checkout: `git -C <skill-dir> rev-parse --show-toplevel` succeeds.

- **If it's writable**, edit the files in place and commit from the repo root with a `taste:` prefix (for example `taste: log dislike of springy hovers`). **Never push without asking.** Offer to push at the end of the session.
- **If it's not writable**, output a paste-ready block instead, and tell Nick where it goes:

````
Add to taste/journal.md (litt.md repo):
```
- 2026-10-12 · motion · hover lift on cards · dislike · "feels like 2019 Dribbble" · cards never translate on hover · open · chat
```
````

Cached copies are wiped when the plugin updates, so anything written there is lost. The README explains the local-clone install that makes the repo writable from any project.

## 2. Log

Run this when Nick reacts to anything visual: "love this", "too heavy", "more like Cursor", "no springs", or a choice in an interview.

1. Write one entry per reaction, appended to the end of `taste/journal.md`, never edited later:
   ```
   - YYYY-MM-DD · area · subject · verdict · why · rule candidate · status · source
   ```
   - `area` is one of `type`, `color`, `material`, `motion`, `layout`, `component`, `interaction`, `process`.
   - Write the `why` in Nick's words, or `?` if Nick didn't say. Don't invent a reason.
   - `rule candidate` is a checkable sentence, or `-`.
   - `status` starts as `open`.
   - `source` is one of `chat`, `critique`, `interview`, `audit:<slug>`, `own-work:<slug>`.
2. Before writing, check whether this reaction contradicts a P# rule. If it does, say so and ask whether it is an exception or the rule is changing. Record the answer.
3. Confirm in one line: "Logged: motion · dislike springy hovers (3rd similar entry, ready to distill)."

## 3. Distill

Run this when Nick asks ("distill the journal", "update my rules"), or offer it when an `area` has three or more `open` entries pointing the same way.

1. Group the `open` entries by `area`, then by direction.
2. **Promote** a group of three or more consistent entries (with no unresolved contradiction) to a rule:
   - Give it the next free `P#`, a short title, one sentence of rule, and a **Check** line.
   - Add it to "Signature rules" in `taste/profile.md`, or to "Do / Don't" if it's narrower.
   - Set those entries' status to `→ P#`. This is the one allowed edit to old journal lines, and it changes only the status field.
3. **Contradictions** (entries pulling in opposite directions) become a `Q#` in "Open questions", and their entries get `→ Q#`.
4. **Changed rules:** if new evidence overturns an existing rule, rewrite it and note the change in the profile's Changelog with the entries that caused it.
5. **Provenance:** update the line at the top of `profile.md`, bumping the minor version and recounting:
   `> v0.2 · built from N interviews, M audits, K journal entries · <Month YYYY>`
6. Add a Changelog line: version, date, what changed.
7. **Propagate** (section 4) if any rule touches values.
8. Run the checks, then commit: `taste: distill v0.2 (P9 hover feedback, Q7 opened)`.

Show Nick the diff of `profile.md` before committing a distill. Rules are Nick's, so confirm them first.

## 4. Propagate

Whenever a value changes (a color, a duration, a radius, a material strength), update in this order:

1. **`assets/tokens.css`**, the only place values live. Change both theme blocks where relevant. The dark values appear twice (the `[data-theme="dark"]` block and the `prefers-color-scheme` block), and both must match.
2. **`assets/tailwind.css`**, only if a token was added, renamed or removed.
3. **`assets/specimen.html`**: if new tokens should be visible, add them. Values are read live, so changed values need no edit.
4. **SKILL.md**: the token quick view, if a name changed.
5. **`system/*.md`**: the rationale and any mention of the changed variable. Never paste hex values into Markdown.
6. **`taste/profile.md`**: any percentages or numbers quoted in rules (for example P8's per-theme strengths).

Then run:
```
node <skill-dir>/scripts/check.mjs
```
It verifies that linked files exist, that no Markdown hex is missing from tokens.css, that the dark blocks match, that every contrast pair passes, and that the assets keep the weight, radius, shadow and motion rules. Fix any failure before committing.

## 5. What never changes without Nick

- **Fixed decisions** (the table in `profile.md`): character, themes, type family, signature, color strategy, density, shape, motion. Evidence can raise a question about one, but only Nick changes it.
- Deleting journal entries.
- Pushing to the remote.

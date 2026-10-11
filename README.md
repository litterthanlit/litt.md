# litt.md

Nick's design language and taste for web and product UI, motion and interaction, packaged as a Claude skill that keeps developing.

> **Technical precision, lit from above.** The structure is exact and quiet: an 8px grid, hairlines, Hanken Grotesk, cool neutrals. The only bold move is light and material: glass that floats, light falling from the top, edges that catch it, a trace of grain. Motion is fast and invisible. Light and dark are both first-class.

Open [`skills/litt-md/assets/specimen.html`](skills/litt-md/assets/specimen.html) in a browser to see the whole system rendered.

## What's inside

```
skills/litt-md/
├── SKILL.md            router: which files to read for build / critique / interview / audit / log / distill
├── taste/              YOURS: changes as your taste develops
│   ├── profile.md      P# rules with checks, dos and don'ts, open questions, changelog
│   ├── journal.md      append-only log of reactions
│   └── inspirations.md audited references: Steal / Reject
├── system/             specs (variable names and reasoning; values live in tokens.css)
│   ├── foundations.md  type, color, space, layout, shape, motion, accessibility floor
│   ├── material.md     the signature: light, glass, highlight, grain, occlusion
│   ├── components.md   button, input, card, header, command menu, modal, toast…
│   └── framer.md       the same system in Framer terms
├── workflows/          how Claude works with it
│   ├── build.md        plan → check against generic defaults → build → self-critique
│   ├── critique.md     scored checklist
│   ├── interview.md    "this or that, and why?" taste sessions
│   ├── audit.md        break down sites, moodboards and your own work
│   └── evolve.md       the one write-back protocol: log, distill, propagate
├── assets/
│   ├── tokens.css      the ONLY place values live (plain CSS, both themes, material primitives)
│   ├── tailwind.css    Tailwind v4 mapping (bg-canvas, text-fg-muted, rounded-card, py-section…)
│   └── specimen.html   living specimen
└── scripts/
    ├── extract-styles.mjs  measure a site's real tokens / capture a moodboard (Playwright)
    └── check.mjs           links, hex drift, dark parity, contrast, weight, radius, shadows, motion
```

## Install

### Recommended: a local clone, so the taste can evolve from any project

Installed this way, Claude reads the files straight from your checkout. Reactions you log from any project land in this repo as `taste:` commits, not in a cache that gets thrown away when the plugin updates.

```bash
git clone https://github.com/litterthanlit/litt.md ~/code/litt.md
claude plugin marketplace add ~/code/litt.md
claude plugin install litt-md@litt
```

To avoid permission prompts when Claude writes to the journal from other projects, add the folder to `permissions.additionalDirectories` in `~/.claude/settings.json`:

```json
{ "permissions": { "additionalDirectories": ["~/code/litt.md"] } }
```

Edits take effect the next session, or straight away with `/reload-plugins`.

### From GitHub (read-only use, other machines)

```bash
claude plugin marketplace add litterthanlit/litt.md
claude plugin install litt-md@litt
```

This clones the default branch (`main`). Until the work is merged there, pin the branch instead: `claude plugin marketplace add litterthanlit/litt.md#claude/tender-davinci-p7ezt7`.

Auto-update is off by default for personal marketplaces. Pull new taste with `claude plugin update litt-md@litt`, or turn on auto-update in `/plugin` → Marketplaces.

### claude.ai and Cowork

Skills are read-only on claude.ai, so journal entries there come back as paste-ready blocks for you to add to this repo.
- **Preferred:** upload it as a plugin. A local Claude Code install automatically hides a synced plugin with the same name, so you don't get duplicates.
- **Alternative:** zip the skill folder alone and upload it as a skill:
  ```bash
  cd skills && zip -r ../dist/litt-md.zip litt-md
  ```
  If you also have the plugin installed locally, turn the synced copy off to avoid two `litt-md` skills loading.

## Use

Claude loads the skill on its own when you build, restyle or review UI. You can also call it directly with `/litt-md` (the full name is `/litt-md:litt-md`). Things to say:

| Say | What happens |
|---|---|
| "Build a pricing section for the studio site" | build: token plan, check against generic defaults, build, self-critique |
| "Critique this screenshot" / "critique cursor.com" | critique: scored checklist and the top three fixes |
| "Interview me about motion" | interview: this-or-that rounds that ask why; answers become rules |
| "Audit vercel.com" / "audit my Pinterest board" | audit: measured tokens or a moodboard read, Steal/Reject, rule candidates |
| "I hate that hover lift, log it" | log: one journal entry |
| "Distill my journal" | distill: three or more consistent entries become a rule; you approve the diff |

## How the taste evolves

1. **React.** Every "love this" or "too much glow" becomes one dated journal entry.
2. **Interview.** Sessions turn open questions into checkable rules.
3. **Audit.** Measured references and your own work feed `inspirations.md`. If an audit contradicts a rule, it becomes a question for you; it never changes the rule silently.
4. **Distill.** Three or more consistent reactions become a new `P#` rule. You approve it, and the profile's version and provenance line go up.
5. **Propagate.** A changed value goes into `tokens.css` first, then the specimen and docs. `check.mjs` keeps them honest.

## Develop

```bash
claude plugin validate .                                  # manifests and skill structure
node skills/litt-md/scripts/check.mjs                     # links, drift, parity, contrast, weight, radius, shadows, motion
claude --plugin-dir . plugin details litt-md              # component inventory and token cost
claude plugin eval .                                      # trigger evals in evals/
```

Repo rules for Claude live in [`.claude/CLAUDE.md`](.claude/CLAUDE.md).

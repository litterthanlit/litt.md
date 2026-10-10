# litt.md taste journal

This file is append-only: never edit or delete old entries. Each entry records one reaction. When three or more consistent entries share an `area` and a direction, `workflows/evolve.md` distills them into a rule in `profile.md` and changes their status to `→ P#`.

## Entry format

```
- YYYY-MM-DD · area · subject · verdict · why · rule candidate · status · source
```

- **area** is one of: `type`, `color`, `material`, `motion`, `layout`, `component`, `interaction`, `process`
- **verdict** is `love`, `like`, `meh`, `dislike`, `hate` or `chose X over Y`
- **why** is Nick's reason in their own words. Write `?` if it wasn't given, and ask next time.
- **rule candidate** is a checkable sentence or `-`
- **status** is `open` (not yet distilled), `→ P#` (folded into a rule), `→ decision` (a fixed decision in the profile) or `→ Q#` (raised an open question)
- **source** is `interview`, `audit:<slug>`, `critique`, `chat` or `own-work:<slug>`

## Entries

- 2026-10-09 · process · how to develop taste · chose all four: interview, reference audit, own-work analysis, living journal · ? · - · → decision · interview
- 2026-10-09 · process · scope of the language · chose web/product UI and motion/interaction over brand/editorial and voice/microcopy · ? · - · → decision · interview
- 2026-10-09 · process · relation to design-systems skill · chose separate skill with taste on top over replacing or merging · keeps "what I believe" apart from "what others do" · - · → decision · interview
- 2026-10-09 · layout · base character · chose technical precision over editorial warmth and hybrid · ? · structure is exact and quiet; boldness lives elsewhere · → decision · interview
- 2026-10-09 · color · default theme · chose both first-class over dark-first and light-first · ? · every token and material value exists for both themes · → P8 · interview
- 2026-10-09 · type · typography direction · chose one grotesk + mono over serif display + grotesk and characterful neo-grotesk · ? · one family carries everything · → decision · interview
- 2026-10-09 · motion · motion personality · chose invisible & fast over calm-base-expressive-moments and motion-led · ? · 100–200ms ease-out, nothing over 300ms, no decorative motion · → decision · interview
- 2026-10-09 · material · where the boldness goes · chose light & material over typographic contrast, exposed structure and interaction craft · ? · radial light from top, glass, top-edge highlight, grain · → P1, P2, P3 · interview
- 2026-10-09 · color · color strategy · chose mono + one accent per project over pure monochrome and a fixed Litt accent · ? · - · → decision · interview
- 2026-10-09 · layout · density · chose airy over balanced and compact · ? · 96–128px section spacing, few elements per view · → P7 · interview
- 2026-10-09 · component · corner radius · chose subtle 6–8px over sharp 0–4px and soft 12–16px · ? · - · → decision · interview
- 2026-10-09 · color · neutral temperature · chose cool (blue-gray) over true neutral and warm · ? · neutrals sit at one OKLCH hue around 262 · → decision · interview
- 2026-10-09 · type · font pair · chose Geist + Geist Mono over Inter + Berkeley Mono and Inter + Geist Mono · ? · - · → decision · interview
- 2026-10-10 · type · Geist on Nick's own site · confirms decision · ? · - · → decision · own-work:litt-design
- 2026-10-10 · motion · transition speed on Nick's own site · confirms 100ms default (370 of 416 transitions at 0.1s) · ? · --dur-instant stays 120ms or lower · → decision · own-work:litt-design
- 2026-10-10 · color · neutral temperature on Nick's own site · true-neutral grays, not cool · ? · - · → Q9 · own-work:litt-design
- 2026-10-10 · color · accent on Nick's own site · lime used only as small status dots · ? · Litt's own accent is lime, used as a signal and as light · → Q2 · own-work:litt-design
- 2026-10-10 · material · light on Nick's own site · multi-hue ambient blobs at the sides, not one source from the top · ? · - · → Q8 · own-work:litt-design
- 2026-10-10 · material · texture on Nick's own site · dot-grid background · ? · texture is a dot grid, not noise · → Q7 · own-work:litt-design
- 2026-10-10 · component · radius on Nick's own site · 2px data cells, 10px covers · ? · - · → Q10 · own-work:litt-design
- 2026-10-10 · material · saved boards · dot-matrix and pixel patterns recur (about half the visible OS pins, 5 of 50 on Cosmos) · ? · texture is a dot grid or dot matrix · → Q7 · audit:pinterest-os
- 2026-10-10 · material · saved boards · UI floating as glass over atmospheric blurred imagery (8 of 50 Cosmos pins, Cursor hero) · ? · product heroes float over an atmospheric image · open · audit:cosmos-ux
- 2026-10-10 · component · saved boards · thin 1.5px line-icon sets (4 Cosmos pins) · ? · icons are 1.5px stroke · → Q3 · audit:cosmos-ux
- 2026-10-10 · layout · saved boards · Swiss and editorial grids with exposed structure recur on the web board · ? · - · → Q11 · audit:pinterest-web
- 2026-10-10 · type · Vercel display tracking · −0.06em at 56px, tighter than the profile's −0.03em · ? · test tighter display tracking · open · audit:vercel
- 2026-10-10 · type · font weight · hate weights above 400 · "fonts are too wide" · no font-weight above 400; hierarchy from size, color and tracking · → P9 · chat

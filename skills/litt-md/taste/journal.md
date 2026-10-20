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
- 2026-10-10 · component · radius on Nick's own site · 2px data cells, 10px covers · ? · - · → decision · own-work:litt-design
- 2026-10-10 · material · saved boards · dot-matrix and pixel patterns recur (about half the visible OS pins, 5 of 50 on Cosmos) · ? · texture is a dot grid or dot matrix · → Q7 · audit:pinterest-os
- 2026-10-10 · material · saved boards · UI floating as glass over atmospheric blurred imagery (8 of 50 Cosmos pins, Cursor hero) · ? · product heroes float over an atmospheric image · open · audit:cosmos-ux
- 2026-10-10 · component · saved boards · thin 1.5px line-icon sets (4 Cosmos pins) · ? · icons are 1.5px stroke · → Q3 · audit:cosmos-ux
- 2026-10-10 · layout · saved boards · Swiss and editorial grids with exposed structure recur on the web board · ? · - · → Q11 · audit:pinterest-web
- 2026-10-10 · type · Vercel display tracking · −0.06em at 56px, tighter than the profile's −0.03em · ? · test tighter display tracking · open · audit:vercel
- 2026-10-10 · type · font weight · hate weights above 400 · "fonts are too wide" · no font-weight above 400; hierarchy from size, color and tracking · → P9 · chat
- 2026-10-10 · component · Ramp buttons · love · "feel more roomy" · buttons get a roomier size scale with a large tier and near-square optical padding · → P10 · chat
- 2026-10-10 · type · Ramp type weights · confirms P9 (marketing 400 only, product 300/400) · ? · - · → P9 · audit:ramp
- 2026-10-10 · type · Ramp two-tone headlines · second clause in 60% ink · ? · headline hierarchy by color, not weight · open · audit:ramp
- 2026-10-10 · material · Ramp shadows · zero-offset glow plus a 1px ring on floating surfaces · ? · floating surfaces use glow + ring, never offset drop shadows · → P4 · audit:ramp
- 2026-10-10 · component · Ramp product radius · binary: 0 on controls, full round on chips/avatars, 4px on nav items · ? · - · → decision · audit:ramp
- 2026-10-10 · component · button scale after the Ramp audit · chose a roomy size scale (sm 32 / md 44 / lg 56, shared with inputs, labels trimmed to cap height) over keeping one 40px size · "feel more roomy" · - · → P10 · interview
- 2026-10-10 · material · depth after the Ramp audit · chose zero-offset glow + 1px ring on floating surfaces over offset shadows · ? · - · → P4 · interview
- 2026-10-10 · component · corner radius after the Ramp audit · chose binary (0, or pill for chips and avatars) over keeping 6/8/12 and over splitting app and marketing · ? · - · → decision · interview
- 2026-10-10 · type · Geist as the sans · dislike · "Im tired of geist", wants to try Inter or another sans · - · → decision · chat
- 2026-10-10 · type · sans after the 14-face type trial · chose Hanken Grotesk over Geist, Inter, Instrument Sans, Spline Sans, Archivo and 9 others · "Hanken Grotesk is lit!" · - · → decision · chat
- 2026-10-10 · type · display size · chose 40 over 56→72 · ? · display never exceeds 40px · → decision · chat
- 2026-10-11 · motion · Fluid Functionalism durations · 80ms instant tier (358 of 378 live transitions), springs 80/160/240, exits one tier quicker · ? · --dur-instant drops below 120ms · → decision · audit:fluid-functionalism
- 2026-10-11 · interaction · Fluid Functionalism hover · one highlight glides between rows, fades in where it starts and out in place, the list never goes dark between rows · ? · lists of clickable rows use one gliding highlight moved by transform · → decision · audit:fluid-functionalism
- 2026-10-11 · motion · Fluid Functionalism animated properties · color and stroke fade at 80ms alongside transform and opacity · ? · - · → decision · audit:fluid-functionalism
- 2026-10-11 · interaction · Fluid Functionalism state without shift · a hidden heaviest-weight copy holds the label width while weight changes · ? · hover, selected and active change color or fill only; the label and icon box is identical in every state · open · audit:fluid-functionalism
- 2026-10-11 · interaction · Fluid Functionalism touch handling · hover-only controls stay visible under (hover: none); field text goes to 16px on coarse pointers · ? · hover fills sit inside @media (hover: hover); anything revealed on hover is visible under (hover: none) and on focus; inputs compute 16px or more under (pointer: coarse) · open · audit:fluid-functionalism
- 2026-10-11 · interaction · Fluid Functionalism focus gate · a popup opened by pointer shows no focus ring until a navigation key is pressed · ? · a click never draws a focus ring; a keyboard-highlighted menu row needs a 3:1 indicator, not a fill alone · open · audit:fluid-functionalism
- 2026-10-11 · material · Fluid Functionalism nested surfaces · a menu opened inside a dialog steps up one surface level instead of melting into it · ? · a floating surface opened inside another floating surface is solid and one step up, never glass on glass · open · audit:fluid-functionalism
- 2026-10-11 · motion · Fluid Functionalism popovers · exits one tier quicker, entry offset follows the side after collision flipping, tooltips open after 200ms with a 300ms skip window · ? · popover offset and origin follow the side it renders on; tooltips open after a 200ms delay · open · audit:fluid-functionalism
- 2026-10-11 · type · Fluid Functionalism line heights · whole-pixel leading so rows land on the grid (13/20, 12/16) · ? · size × leading is a whole pixel (body 15/24, small 13/20, caption 12/16, reading 17/28) · open · audit:fluid-functionalism
- 2026-10-11 · component · Fluid Functionalism press · a 1px inset shrink instead of a scale, because a 2% scale moves a 400px button 8px sideways · ? · press shrink on a button wider than 200px is 1px or less per side · open · audit:fluid-functionalism
- 2026-10-11 · type · Fluid Functionalism text lint · no letter-spacing, no uppercase, no eyebrow labels, enforced by ESLint · ? · - · → Q1 · audit:fluid-functionalism
- 2026-10-11 · color · Fluid Functionalism neutrals · true neutral gray at chroma 0 · ? · - · → Q9 · audit:fluid-functionalism
- 2026-10-11 · process · Fluid Functionalism audit tooling · motion values checked by script against known-bad and known-good pages · ? · check.mjs fails durations over 240ms, transition: all and animated layout properties · → decision · audit:fluid-functionalism
- 2026-10-11 · motion · motion personality after the motion lab · wants to try motion-led and find a sweet spot between it and invisible & fast · "we need a sweetspot" · - · → decision · chat
- 2026-10-11 · motion · motion dial in the litt-ui gallery · chose the sweet spot over invisible and expressive · "I think sweet spot is where its at" · instant 100ms; responsive spring 200ms bounce 0; expressive spring 350ms bounce 0.12, 40ms stagger, 16px travel · → decision · chat
- 2026-10-11 · component · corner radius in the litt-ui gallery · wants a slight radius back instead of binary square · "add slight radius" · controls about 4px, surfaces concentric at 8px, pills unchanged · → decision · chat
- 2026-10-11 · motion · litt-ui gallery lock · chose the gallery's settings for Q15 to Q17 (instant 100ms; one gliding highlight in menus, the command menu and dense lists; color-family fades at instant) and confirmed the Q18 and Q19 locks over keeping invisible and fast with square corners · ? · instant 100ms tween; responsive spring 200ms bounce 0; expressive spring 350ms bounce 0.12, 40ms stagger, 16px travel; exits 0.75× no bounce; controls 4px, surfaces 8px, pills unchanged · → decision · chat
- 2026-10-14 · motion · motion on phones and touch (proposals/responsive-motion.md, 14 decisions) · accepted every recommendation · ? · on compact screens the modal and popovers are bottom sheets that rise by their own height on the expressive tier and drag down to dismiss past --dismiss-distance or faster than --dismiss-velocity; menus stay anchored and submenus replace the list in place; the command menu sits at the top edge; on touch a tooltip opens on a 500ms hold, key hints hide, pressed rows fill, focus lands on the panel and toasts swipe away · → decision · chat
- 2026-10-15 · component · open decisions after the agent tests and the phone build (proposals/open-decisions.md, 26 decisions) · accepted every recommendation · ? · checkboxes, radios and switches fill with --fg, never the accent; a dialog's fields and actions are md, and a field is lg only beside an lg button; a pressed row fills at its hover fill, never below fg 6%; a phone sheet always rises on the expressive spring and does not use up the view's moment; skeletons are static · → decision · chat
- 2026-10-15 · component · tag shape · dislike pill tags · "the rounded tags dont feel right", wants them "closer to" the gallery's Preview/Code segmented control · tags take the control radius and the selected segment's look (surface-1, hairline, top highlight) · → decision · chat
- 2026-10-15 · type · tags in mono · chose C (segment look in Geist Mono) over B (segment look in sans), D (flat mono) and A (the pill) in a tag trial · "shouldnt tags also be in mono?" · tags are set in --font-mono at the caption size, sentence case · → decision · chat
- 2026-10-15 · component · status dots · hate · "the dots are horrible" · no dot marks a status or the current page: say it in words or step the text color · → decision · chat
- 2026-10-15 · component · filter chips · chose the control radius over the pill, to match the tags · ? · chips are rounded-control · → decision · chat
- 2026-10-15 · color · accent for Litt's own properties · love · "use this kind of blue" (a deep cobalt frame around a dashboard screenshot) · Litt's own accent is cobalt, near the neutrals' hue · → decision · chat
- 2026-10-15 · component · large buttons · dislike · "the large buttons are too square" · an lg button's side padding is wider than the air above and below its label · → decision · chat
- 2026-10-15 · component · lg button shape · chose wider (side padding 24 to 32, corners stay 4px) over rounder corners (8px) and the pill · ? · lg buttons take --button-pad-lg; lg fields keep --control-pad-lg · → decision · interview
- 2026-10-15 · component · switch track · chose the pill track over the control radius · ? · a switch's track and thumb are pills, filled with --fg when on · → decision · interview
- 2026-10-16 · color · dark primary button · dislike · "I think the text gets lost a bit in the dark version of the button" · the primary action is a deep cobalt with white text in both themes; accent text (links) takes its own --accent-text · → decision · chat
- 2026-10-17 · color · five reference shots of dark data panels (category tags in amber and blue, a blue dot plot, a blue key heatmap, a green dot matrix and gauge, a deploy timeline) · love · "we can add some color too", and "we stick to our design language" · beyond the one accent, color appears only where it carries data (a series, a category, a heat step, an identity), from a fixed set of data hues, never on chrome · → P11 · chat
- 2026-10-17 · color · hued meters in a storage breakdown (Meters by kind: a 4px rail per kind in one data hue on a neutral track, the label at the start and a mono reading at the end, wide air around it) · love · "This is so good!", "we should do more of whatever this is" · a data hue is drawn thin (a 4px rail, a 2px line, a small dot) on a neutral track, with the words and numbers neutral beside it · open · chat
- 2026-10-19 · type · Inter as the body face under Hanken Grotesk headlines (body-face trial) · like · "I think we should add inter as body" · Inter sets reading, body, small and caption text · → decision · chat
- 2026-10-19 · type · Inter after the type research (setting Inter; product type at Linear, Vercel, Stripe, Ramp and others; teardowns of emilkowal.ski and Quartz) and a split test of the real gallery · chose Inter · "inter is the way" · Inter is the sans, loaded with its optical-size axis and no cv or ss features · → decision · chat
- 2026-10-19 · type · type on Nick's own site (litt.design teardown: nearly everything at 14px, one 18px title, titles at 500, 12px labels at 600, two inks, lockups 4px and 2px apart, sections 40 to 56px apart). It is set in Geist, so what Nick likes is the setting, not the face · like · "I like the type in my portfolio" · text 400, titles 500, 12px labels 600; nothing above 18px; label 4px above title, title 4px above text · → P9 · own-work:litt-design
- 2026-10-19 · type · six-version type split test of the real gallery · chose Portfolio (litt.design's settings in Inter: 18 then 14 at 500, text 14/13/12, grey body, labels at 600) over Today, Report (40/30/22), One size (16), Quartz and Portfolio 400 · "portfolio wins" · weight by role: text 400, titles 500, 12px labels 600, nothing else; nothing set above 18px · → P9 · chat
- 2026-10-19 · type · tags in the sans · chose sans tags over the v0.8 mono tags · "also make the tags sans too" · tags are set in --font-sans at the caption size and --weight-label, sentence case, in the same 24px segment look · → decision · chat
- 2026-10-20 · type · Inter as the sans in v0.12 · dislike · "replace inter with geist just like on my portfolio" · --font-sans is Geist, the face on litt.design; the v0.12 setting (scale, weights by role, two inks) stays · → decision · chat
- 2026-10-20 · component · lg (56px) submit and Cancel on page forms, next to the v0.12 type that tops out at 18px · dislike · "why are some buttons so big, like on the form?", then "yes make the form buttons md" · a page form's submit and Cancel are md (44); lg is for hero CTAs only · → P10 · chat

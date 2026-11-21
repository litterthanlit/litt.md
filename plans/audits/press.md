# Press, audited: where it is weak to use and where it fails to land

The audit plan 026 asks for, done for Press on 2026-11-20 against the branch of pull request 150 at `de2db3e` (`main` plus the fixes for Heat), in the shape of `plans/audits/heat.md`. One world, walked through as a visitor, with each weakness measured, ranked and given a test that says when it is fixed.

Nothing was changed. Every fix below is a proposal. Several touch calls you left open in plan 024 (Press, phase 1, paused on 2026-11-17); those are marked **Nick** and are not reported as faults.

## Who Press is for, and when

Press is for product UI, settings and dashboards: the person running a deploy, flipping an environment, checking a release. It is what the registry installs. They meet it in the middle of a working day, looking for the one control they need, and they should know what each thing does before they touch it.

## The feeling Press is for

`litt-principles.md` says what Press is (depth says what a thing does, it feels physical, the first Press is the measure) but not what it should make a person feel. A line to judge by, proposed for Nick:

> A well-made instrument on a lit bench. You can tell what each part does before you touch it, and it gives a little under your hand.

Each finding below says whether it costs ease of use, this feeling, trust, or more than one.

## How it was read

- The built gallery already served at `localhost:4173`, driven with Chromium. Not rebuilt.
- Thirteen of Press's pages: the player (`#press`, Index and all twelve takes), `#press/components`, `#press/about`, the three Press-only parts (deploy-status, env-switch, release-rail) and seven shared parts (button, slider, menu, table, select, input, stat).
- Each at 1440 by 1000 and at 390 by 844 with touch, in dark and in light: 52 page states, plus each take in both themes, plus the player and Plain's player in greyscale with one face.
- Three tasks: step through the set with keys only on a desktop; open a part from Index on a phone and get to its page; find Install on a part's page on a phone.
- Measured in the page: text contrast (skipping `oklch` and `color(srgb …)` values and disabled controls), every control's size, name and 44px target box, page width and height, tab order, what the selector says, where a tap lands (`elementFromPoint` and real touch taps), how much of the screen a take covers, the arrow keys on each Press-only part, and the luminance of the plate against the page.
- Read in source: the Press body (`play-object/bodies/press.tsx`), the contract's Index and top row (`contract.tsx`), the three Press-only parts and their pages, `.litt-target` in `tokens.css`.

Not read: the other seventy or so part pages, a real phone, a screen reader's speech, whether a set "settles from above" as About's Motion line says, and accessibility (axe), reduced motion, forced colors, reflow at 320px and 200% text, which CI already runs on every page.

## What already works

Keep these.

- **Press's words are mostly true of Press.** The shared ledes and How it moves lines were written for this world, and here they hold: the slider is "a cap you hold, riding in a slot on a raised plate", the menu is glass, the button's press sinks the block half a pixel. Heat's worst finding (pages describing another world's materials) does not apply here.
- **The set speaks the deploy dashboard.** The lead stages say Canary traffic, Release actions, Deploy history, Deploy to production; About's scenes say harbor-web, Building, 3 seats left on Pro. It is the voice plan 024 drafted.
- **The deck names Press in greyscale.** With color and face taken away, the selector's tray with one raised block, the raised readout and the raised keys still say Press, by day.
- **It is as usable as the other worlds where it counts on a desktop.** Across all 52 states: no control without a name, no sideways scroll at 390, no script errors, and every text pair at 4.5 to 1 or better (the only pairs below are the labels of disabled fields, "Animation speed" and "Region", which are exempt).
- **Keys and Play behave.** The selector is one tab stop and says "Deploy status, 1 of 12". Play starts only when pressed and stepped 1 to 2 in 4.3s.
- **Install is one tap away on a phone.** On `#press/deploy-status` Install is 2,444px down; the jump row's Install link lands it at the top in one tap. Same on slider and table.
- **One accent fill.** Blue appears as a fill only on the Button take's primary.

## Findings, worst first

Severity: **High** costs the world its point or tells the visitor something false. **Medium** slows or confuses. **Low** is polish.

| # | Finding | Costs | Severity | Scope |
|---|---|---|---|---|
| 1 | On a phone, taps on the player land on the wrong control | ease | High | every world (contract), plus Press's keys |
| 2 | Deploy status is a control dressed as a status | trust, ease | High | Press-only part |
| 3 | Press's own radio groups ignore the arrow keys | ease, trust | High | Press-only parts |
| 4 | The front door is a list of words | the feeling | High | Press's Home |
| 5 | At rest the instrument is hard to see | the feeling | Medium | Press's body, partly **Nick** |
| 6 | Focus runs against the eye on the player | ease | Medium | Press's body |
| 7 | The readout is raised like a key | ease, the feeling | Medium | Press's body |
| 8 | Captions narrate the rules and other worlds | trust, the feeling | Medium | Press-only pages, and shared How it moves |
| 9 | Variants still speak the web studio | the feeling | Medium | **Nick** (plan 024, call 7) |
| 10 | A take fills a twentieth of its screen | the feeling | Medium | every world's screen, **Nick** |
| 11 | The selector is twelve numbers, on a phone twelve ticks | ease | Low | Press's body |
| 12 | The selector's Index is 28px with no 44px target | ease | Low | Press's body |
| 13 | Two names point somewhere else | ease | Low | every world (contract) |
| 14 | Anatomy's lines strike through Deploy status's words | ease | Low | Press-only page |

### 1. On a phone, taps on the player land on the wrong control (High)

`.litt-target` grows a control's hit area with an absolute `::before` of `max(100%, 44px)`, and its comment says the control must be positioned. Three kinds of control on the player are not:

- The top row's **Page** link (`LINK` in `contract.tsx`): its `::before` measures 390 by 844, the whole viewport. With Switch on the screen, a real tap on Components, About, Details, Index or the theme key each opened `#press/switch`. At Index the same taps open `#press/about`. The same holds in Flat, Plain, Device and Heat; in Rack, Play wins and starts playing.
- The **Index rows** (`ROW` in `HomeView`): the centre of every visible row hits the last row. A tap on Slider opened Table (`walk/phone.take-after-tap.png`). 0 of 8 visible rows receive their own tap, in every world drawn by `HomeView` (Heat draws its own Home and is fine, 12 of 12).
- Press's **Play, Previous and Next** (`keyBase` in `press.tsx`): Play's `::before` is also 390 by 844. Here it sits under the Page link's; it would take every tap if that one were fixed alone.

Task 2 (open a part from Index on a phone and get to its page) fails at its first step: every row opens Table. It only reaches a page because every tap in the top row opens one.

- **Fix.** Add `relative` to `ROW`, `LINK` and Press's `keyBase`, and make `.litt-target` safe on its own (it could set `position: relative` when the element is static, or a lint could fail a `litt-target` with no position class).
- **Fixed when.** A check at 390 by 844 with touch, on every player at Index and on a take, finds that the centre of every visible control in the top row, the deck and Index hits that control, and that no `::before` of a `litt-target` is larger than its element plus 44px.

### 2. Deploy status is a control dressed as a status (High)

The first take, where Play starts, is a deploy pipeline you can rewrite by clicking. Every stage is a button: click Live and the deploy is live. No product ships that. Beside it:

- **Raised means done, and also means press.** Build, Checks and Edge stand up as blocks identical to Rebuild and Promote next to them, while Live, the one stage you can still reach, lies flat. "Depth says what a thing does" reads backwards.
- **The state word is a stage name.** The header says "Edge". It does not say whether Edge is running, done or failed, and the footer's "19s · fra1" does not either. Principle 4: a state is a word.
- **Six tab stops** for one composite: four stages, Rebuild and Promote.
- **The page and the docs disagree.** The caption says "Click any stage or press Promote"; the keyboard docs say "Rebuild and Next stage".

- **Fix.** Make the stages a read-only list (`role="list"`, `aria-current="step"`), with the words of a state ("Deploying to edge, 19s"), and keep Rebuild and Promote as the only keys. Whether done stages stay raised is plan 024's call 1 (**Nick**); if they do, they should not look like the keys beside them.
- **Fixed when.** `#press/deploy-status` has two tab stops in its lead stage, no stage answers a click, and the header word is one of a fixed set of states.

### 3. Press's own radio groups ignore the arrow keys (High)

Environment switch and Release rail say `role="radiogroup"` with `role="radio"` items. A screen reader then tells the visitor to use the arrows. Measured on each page: every radio is its own tab stop (3 of 3, 4 of 4), and ArrowRight on the first moves neither the focus nor the choice. Their keyboard docs describe Tab, not arrows. The floor says one tab stop per composite and a body keeps its keys.

- **Fix.** A roving tab index with Left, Right, Up, Down, Home and End, as the shared Segmented does, or reuse Segmented's keys outright.
- **Fixed when.** On both pages, the group has one tab stop and ArrowRight moves the choice. A Press-only part could be added to `test:focus`.

### 4. The front door is a list of words (High)

`#press` opens on Index: twelve names with a line each in 13 and 12px type, on a screen whose lower 45% is empty at 1440 by 1000 (`shots/press.desk.dark.png`). The parts that are Press, the raised block, the cut, the cap in its slot, are one step away and unseen. Heat's version of this was fixed by letting Heat draw its own Home (`body.Home`). Press still draws the shared list.

- **Fix.** A Press Home in its own materials: the set as rows in one tray, the row under the hand or the keys raised as a block, and its part live beside it.
- **Fixed when.** `test:playground` finds, on `#press` at Index, a live part on the screen and exactly one row marked current.

### 5. At rest the instrument is hard to see (Medium, partly Nick)

"Lit from above. Objects you can hold." The object does not show:

- **By night** the plate (`--surface-1`) stands on the page (`--canvas`) at 1.05 to 1, and the screen's tray is 1.06 to 1 against the plate. The top highlight is a 6% white line. The plate disappears into the page (`grey.press.5.dark.png`).
- **By day** the page, the plate and every block are the same white. What draws them is hairlines: `--plate-lift` carries a 1px ring and `--tray-shade` a 1px ring at a darker ink, so the screen reads as a grey outline round a white box (`takes/light.04.png`). "A raised thing says it is raised once."

- **Fix.** In the body, without touching tokens: put the plate on a step the page is not (`--surface-2` by night, the tray's stone by day), or drop the bay round the screen so it is a window, not an outlined box. Changing `--plate-lift` or `--tray-shade` is a token change (**Nick**, through `evolve.md`).
- **Fixed when.** By eye against the 26 October boards, plus a floor: the plate at 1.2 to 1 or more against the page in both themes.

### 6. Focus runs against the eye on the player (Medium)

At 1440 wide, Tab goes along the top row (8 stops at y 24), drops to the selector at the foot (y 752), then Play (y 750), then climbs back to the screen (y 86). The body puts the deck first in the DOM and last on screen (`order-2`), as Heat's did before its fix.

- **Fix.** Draw the deck above the screen at every width, as the phone layout already does.
- **Fixed when.** `test:playground`'s order check (each tab stop at or below the one before it, or to its right) passes on `#press`.

### 7. The readout is raised like a key (Medium)

The readout ("05 / 12 Switch") is drawn as a raised block with `--block-lift`, the same face and cast as Play beside it. It is a `div` and does nothing when pressed. On the phone it is the largest raised thing on the deck (`walk/phone.take5.png`). In Press, raised means press.

- **Fix.** Set the readout into the plate as a cut, or as plain lettering on the plate.
- **Fixed when.** Every element on the deck drawn with `--block-lift` is a button.

### 8. Captions narrate the rules and other worlds (Medium)

Principle 6: no label that points at what to admire. Press's own pages describe the build instead of the part:

- "Zero outer boxes and zero colored badges … host, region, latency and load read cleanly on warm stone." (env-switch)
- "Live is stated in plain words on the right … no green status chips." (release-rail)
- "Each switch is a raised stone block crossing a recessed tray … neutral in a list, never taking the accent." (switch)
- Release rail's About: "built on round-2 Press discipline", a planning word.

And the shared How it moves on `#press/button` and `#press/slider` goes on to describe Flat and Device ("In Flat there is no block to push…", "Under Device it is a fader…"). CLAUDE.md: a page in a world shows that world only.

- **Fix.** Captions say what the part does with real data, in Press's voice. How it moves on a world's page carries that world's paragraph only (the per-world `meta` lines Heat now has).
- **Fixed when.** A check on `#press/*` finds no other world's name and none of "zero", "no outline", "never taking", "discipline" in visible text.

### 9. Variants still speak the web studio (Medium, Nick)

The lead stages speak deploys, but Variants on the shared set pages do not: "Open in Framer" on five of the nine shared set pages, "Export 24 images", "Animation speed", Northwind and Halo rows on Slider, "Studio" and "portfolio" on Table and Select. Plan 024's call 7 (voice: the deploy dashboard, not the web studio) is drafted and waiting on Nick, so this is not a fault yet.

- **Fixed when.** Nick answers call 7. A word list can then hold it.

### 10. A take fills a twentieth of its screen (Medium, Nick)

The screen is 1188 by 648. Measured by what each take paints: Menu 2.1%, Segmented 2.4%, Button 2.8%, Input and Select 4.2%, Environment switch 5.5%, Deploy status 6.8%, up to Table at 47%. The median is under 7%. This is the same as Heat's finding 7, left open as Nick's call (top-aligning takes, or a shorter screen).

- **Fixed when.** Nick picks. A floor in `test:playground` can hold it.

### 11. The selector is twelve numbers, on a phone twelve ticks (Low)

On a desktop the cells read 01 to 12; the names are only in a `title`. On a phone they are twelve identical 2px ticks (`walk/phone.take5.png`). You cannot aim at a part from the deck; the readout says where you are only after you move.

- **Fix.** Names in the cells at desktop widths, as Heat does; keep the ticks on the phone, with the readout.

### 12. The selector's Index is 28px with no 44px target (Low)

The Index key inside the tray is 47 by 28 on a phone and has no `litt-target`. It is the only way back to Index from the deck.

- **Fix.** Add `litt-target relative`.
- **Fixed when.** The 44px check in finding 1 covers it.

### 13. Two names point somewhere else (Low)

The selector's accessible name is "Components" (`contract.tsx`), the same as the top-row link that leaves for `#press/components`. At Index, the link named "Page" opens About.

- **Fix.** Name the selector "The set in Press". Hide Page at Index, or name it About there.

### 14. Anatomy's lines strike through Deploy status's words (Low)

On `#press/deploy-status`, callout 1's line runs through the middle of the tray, so Checks, Edge and Live read as struck out. Callout 3, "The status readout", points at the project name, not the state word.

- **Fix.** Anchor callouts on the part's edge, outside its words.

## Decisions that are Nick's

- Plan 024, call 1: whether a reached stage, a status or a stat's figure stays raised. Deploy status (finding 2) is the sharpest case.
- Plan 024, call 2: About's scenes show Building in a blue tint, Ready in green and Failed in red. Left as shipped.
- Plan 024, call 3: the primary's glow (fill, cast and halo) on Deploy to production. Left as shipped.
- Plan 024, call 7: the voice of Variants (finding 9).
- The plate and tray tokens by day and by night (finding 5), through `evolve.md`.
- How much of the screen a take should fill (finding 10, with Heat's 7).
- Whether Environment switch earns being Press-only. It is a segmented control with a readout and a meter; the test of a world-only part is that it would be wrong in the others.

## What to do first

1. **Finding 1**, because the phone player is broken in every world and three classes fix it.
2. **Findings 2 and 3**, because the first take Play shows tells a visitor something false, and the other two Press-only parts tell a screen reader something false.
3. **Finding 4**, because it is the first thing anyone sees of Press.

Findings 5, 9 and 10 wait on Nick in part. The rest are an afternoon each.

# Flat with colour, paper and a snappier hand

Written 2026-11-12 for Nick. On 2026-11-12 Nick posted two references for Flat, a screen recording of ToDesktop's feature cards and the Stageshow page at benji.org/stageshow, and said: "I found these I think would work great if we get some color in flat and just lightness, ease of use. also motion should be snappy maybe? not sure don't copy it bar for bar, just posting for a direction".

So this is a direction, not a spec, and the motion is a maybe. This is a proposal, not a build. Nothing in the tokens, the rules or the components changes until you pick. Six candidate looks and a piece for the hand are live on the language canvas (`#canvas`, the block out to the right of the scale rows; `gallery/src/canvas/flat-look*.ts(x)`). Open `?look=flat#canvas` and try each in light and dark.

## What the references do

Both were opened and looked at; nothing was copied from them.

- **Ground and paper.** The page is a very light grey. The working surfaces (a card, a field, a segmented control, a chart) are white and float a hair off it on a soft, wide, faint shadow. Almost nothing has a border.
- **One vivid colour does the work.** A saturated azure fills the primary button, the switch, the progress bar, the selected dots and the chart's line and its pale area. A chosen segment is a pale tint of it with the word in the colour.
- **State is colour in small doses.** Green for done, red for tripped, amber for waiting, each a small tinted pill with a word. The loudest action on white is a near-black pill.
- **Type.** A sans at a title weight, grey body, small spaced mono capitals for metadata.
- **Texture.** Dot matrices and a faint grid behind a surface.
- **Motion.** Quick state changes with a small spring; things change where they stand.

## What Flat is today

- Its accent is the ink (`--accent: var(--fg)`, decision 14), so the primary button and the focus ring are black or white.
- Every raised thing is a grey pill on a white page: `--block` and `--cut` are `--surface-3`, and every lift, shade and press depth is zero. Nothing stands up.
- Shape is Pill, the face is Geist, and its motion is the same spring tokens as every world.
- Space (a 5px unit) is chosen (`proposals/world-scale.md`) but not in the tokens yet.

The gap, in a line each: Flat has no colour; it is grey on white where the references are white on grey; and its motion is the common one.

## What the canvas can and cannot show

Each look is custom properties on a `data-material="flat"` frame, so every part inside reads them. What I found while building them:

- **The main switch cannot take a hue.** Flat's switch body (`gallery/src/components/bodies/switch.flat.tsx`) puts `bg-fg` and, for `tone="accent"`, `bg-accent` on the same element under the same variant; the stylesheet's order lets the ink win. Measured: a checked accent switch computes `rgb(15, 15, 15)` with `--accent` a blue on its frame. R3's Under Flat already says the main switch takes the accent, so this is a part bug, not a token question. The looks ask for the accent and show ink until the part is fixed.
- **Ticks and the slider stay ink.** Flat's checkbox and slider fill with `--fg` ("ink means on", R3), and R6 keeps checkboxes in ink because a form holds many. A hue there would need a part change, and I do not suggest it.
- **The chosen segment's tint and the tinted status pill** are scoped custom properties on a wrapper around the one part (`--block` and `--fg` around the Segmented, `--surface-3` around a Tag). Shipping either needs a token the part reads (say `--chosen` and `--chosen-ink`, and a status tint in Tag's Flat body).
- **Paper's shadow reaches only the sheets.** Flat's control bodies draw no token-driven shadow at rest (buttons, fields, the select's trigger and the segmented bubble have none, or `shadow-none`). So on paper the controls stand on their white fill alone, and the sheets (the canvas's own boxes) carry the shadow through `--paper-lift`. Shadowed paper controls would need one token read in each Flat body.
- **Overlays keep the page's look.** The select's list and the menu are drawn outside the frame.

## The looks

Every look but Today carries Space (the `SPACE` variables from `gallery/src/canvas/scale.tsx`). Each frame shows the same three things: controls (a Segmented, a Switch, a primary and a secondary Button, a link, three status Tags, a TextField, a Select, a Checkbox list with one ticked, a Slider), data (a StatGroup of four with a Sparkline, a LineChart and a short Table, as the Dashboard block arranges them) and a picture with words (the top of the Case study block with a long exposure, Yūyake, as its hero).

### Today

What Flat ships. Primary button `--fg` with `--canvas` words; the sheets white with a hairline.

### Colour in the data

Controls stay ink. The LineChart and the Sparkline take `hue: "blue"` (the first data hue, R7), status Tags become tinted pills (`--surface-3` mixed from the status colour at `--tint-strength` into `--surface-1`), and the picture carries the rest. The quietest step: no rule changes, since R7 already lets colour carry data and status keep its word. Cost: one token in Tag's Flat body for the status tint.

### An accent of its own

One vivid hue on the primary button, the focus ring, links and the chosen segment (`--accent-tint` behind it, `--accent-text` for its word). A picker shows three hues. Each is a full set in light and dark (`--accent`, `--accent-hover`, `--accent-fg`, `--accent-text`, `--accent-tint`, `--focus`), derived from one fill in OKLCH and stepped until every pair passed; hex lives in `gallery/src/canvas/flat-look-data.ts` until picked.

- **Azure.** Lighter and greener than Blue 4 (OKLCH lightness 0.554 against Blue 4's 0.536). It cannot be much brighter: white words on it stop at 4.5:1 just above this, so "a brighter, more azure blue" and "white words" meet here. It sits 0.08 (OKLab) from Blue 4 and 0.09 from the data blue, under R6's 0.12.
- **Violet.** A blue-violet that keeps 0.15 from the data violet and 0.13 from Blue 4. The only one of the three that clears R6 against every data hue and stays well apart from Press.
- **Vermilion.** Shu's middle stop. It passes every contrast pair, but sits 0.05 from `--danger` and 0.12 from `--warning`: next to a Failed tag the two reds read as one. Every warm hue that carries white words is near danger, pink or Device's orange; a gold (Yamabuki's) cannot stand 3:1 off a white page as a switch's fill and was dropped.

Cost: Flat leaves decision 14 (its accent is the ink), and the azure needs the data blue retuned under Flat if it is picked.

### Paper

No hue. Neutral greys (chroma 0), as Flat's are:

| Variable | Light | Dark |
|---|---|---|
| `--canvas` (the ground) | a very light grey, 1.12:1 against white | the darkest step |
| `--surface-1` (paper, the sheets) | white | a grey 1.10:1 off the ground |
| `--block`, `--cut`, `--field` | white | a grey 1.19:1 off the ground |
| `--surface-3` (the slot, a hovered row) | a step darker than the ground | a step lighter than paper |
| `--paper-lift` | one layer, 4px down and 20px wide at 7% black | the same at 60% black |

The shadow is written once, as `--paper-lift`, the same on every sheet. White paper on the ground is 1.12:1, so nothing relies on it for an edge: a field is carried by its label and its words, as Flat's grey field is today (1.17:1 on white); a switch that is off keeps its 3:1 outline (3.25:1 on the paper ground). In dark the shadow barely shows and the lightness steps do the work, so dark Paper is close to dark Flat today with lighter sheets.

What it changes: R3 forbids offset shadows and `proposals/flat.md` says nothing stands up in Flat. Cost: the shadow rule, and a token read in the Flat control bodies if controls should cast too.

### Paper with an accent

Paper and the azure together: the nearest to the references, shown so you can see the whole direction, not as the answer.

### The picture lends its colour

Paper, with the accent from the long exposure in the hero. A picker of six bold palettes changes the picture and the accent together. Each accent comes from the palette's middle stop and was stepped for contrast:

| Palette | Accent | What happened | Nearest neighbour (OKLab) |
|---|---|---|---|
| Beni | its middle stop as it is | nothing | `--danger` 0.05, pink 0.09 |
| Yamabuki | a darker step of the same gold | the gold carries white words at 2.65:1 and stands 2.4:1 off the page | `--warning` 0.04 |
| Ruri | as it is | nothing | Blue 4 0.10, data blue 0.11 |
| Moegi | a darker step of the same green | the green carries white words at 2.9:1 | `--success` 0.06 |
| Murasaki | as it is in light, a step lighter in dark | in dark it stood 2.9:1 off the paper | pink 0.14 |
| Hanabi | as it is | nothing | pink 0.04, `--danger` 0.10 |

Seen on the canvas: the accent and the picture belong together, but four of the six land on a status colour or another world's accent. Beni's button beside a Failed tag, Yamabuki's beside Waiting and Moegi's beside Done all read as status. It works as a project's choice, not as Flat's default.

## Measured contrast

Read from the rendered page by the canvas check (`gallery/.agent-shots/check-flat-looks.mjs`, local and gitignored), after keyboard focus on the Preview button. Words: the primary button's words on its fill. Link: accent text on the ground it sits on. Switch: the on fill against its ground (ink in every look, see above). Focus: the ring against the ground.

| Look | Light: words / link / switch / focus | Dark: words / link / switch / focus |
|---|---|---|
| Today | 19.17 / 19.17 / 19.17 / 19.17 | 18.75 / 17.92 / 17.92 / 17.92 |
| Colour in the data | 19.17 / 19.17 / 19.17 / 19.17 | 18.75 / 17.92 / 17.92 / 17.92 |
| Accent, azure | 4.86 / 5.30 / 19.17 / 4.86 | 4.86 / 5.69 / 17.92 / 4.72 |
| Accent, violet | 5.85 / 5.85 / 19.17 / 5.85 | 5.85 / 5.44 / 17.92 / 4.35 |
| Accent, vermilion | 4.81 / 5.24 / 19.17 / 4.81 | 4.81 / 5.62 / 17.92 / 4.39 |
| Paper | 17.12 / 17.12 / 17.12 / 17.12 | 18.53 / 18.53 / 18.53 / 18.53 |
| Paper with an accent | 4.86 / 4.74 / 17.12 / 4.34 | 4.86 / 5.89 / 18.53 / 4.89 |
| Picture, Beni | 5.18 / 4.74 / 17.12 / 4.63 | 5.18 / 5.71 / 18.53 / 4.56 |
| Picture, Yamabuki | 4.69 / 4.74 / 17.12 / 4.19 | 4.69 / 5.83 / 18.53 / 4.90 |
| Picture, Ruri | 5.26 / 4.82 / 17.12 / 4.70 | 5.26 / 5.75 / 18.53 / 4.86 |
| Picture, Moegi | 4.64 / 4.73 / 17.12 / 4.14 | 4.64 / 5.90 / 18.53 / 5.20 |
| Picture, Murasaki | 6.14 / 5.49 / 17.12 / 5.49 | 5.74 / 5.71 / 18.53 / 4.53 |
| Picture, Hanabi | 5.27 / 4.82 / 17.12 / 4.71 | 5.27 / 5.73 / 18.53 / 4.50 |

Pairs the check does not read, worked out from the same values:

| Pair | Light | Dark |
|---|---|---|
| A hue's fill against every ground (the switch, once fixed) | azure 4.34, violet 5.22, vermilion 4.30 | azure 3.69, violet 3.07, vermilion 3.72 |
| The chosen segment's word on its tint | azure 4.65, violet 5.08, vermilion 4.62 | azure 4.68, violet 4.61, vermilion 4.64 |
| The tint against the paper ground | 1.01 to 1.03: the word carries the choice | |
| Status words on their tint (Colour in the data) | done 4.51, failed 4.87, waiting 4.60 | done 6.75, failed 5.78, waiting 6.29 |
| White paper on the ground; the off switch's outline on it | 1.12; 3.25 | 1.10; 3.53 |

## The hand

One piece, "Flat · the hand, today and snappy": the same Segmented, Switch, Select, Menu and Slider twice, today on the left, the candidate on the right, inside the bounds in `gallery/src/motion/rules.ts`:

| | Today | Snappy |
|---|---|---|
| Instant | 100ms | 70ms |
| Responsive | 200ms, bounce 0, settles 425ms, exits 150ms | 140ms, bounce 0, settles 317ms, exits 105ms |
| Expressive | 350ms, bounce 0.12, settles 529ms, exits 263ms | 240ms, bounce 0.12, settles 333ms, exits 180ms |

About 30% quicker on every tier. The plan asked for a touch more bounce on the expressive spring; it is already at the ceiling (0.12), so it keeps it. Measured in the browser over three runs, the switch goes from the click to rest in 272 to 316ms today and 183 to 203ms snappy.

What a frame can reach: CSS reads `--dur-*` and `--ease-*` from the element, so the switch, the slider's cap and every hover, press and colour fade follow the frame. The segmented control's glide, the select's list and the menu are springs in script; they read the dial the page's motion provider parsed from `<html>` once, when it mounted, so a frame cannot reach them without a change in `gallery/src/motion`, and they move alike in both frames. The piece says so. Under reduced motion the snappy frame sets nothing, so it inherits the zeroed durations like every part; the check finds nothing moving in either frame.

## What each choice would change in the rules

Quoted from `skills/litt-md/taste/profile.md` and the proposals; wording to go through `skills/litt-md/workflows/evolve.md` only on your yes.

- **An accent for Flat.** Decision 14 (`proposals/worlds.md`) and the Color decision: "Flat the ink, monochrome, its primary action black on white". Proposed: "Flat <the hue>, light on paper, its primary action <the hue> with white words." R6's line "the ink under Flat (monochrome's tones)" changes the same way.
- **An offset shadow.** R3: "Only raised things cast, straight down, never more than 3px", and Flat's paragraph: "neither casts nor sinks". Proposed, for Flat: "Under Flat, paper (a sheet, a card, a panel) stands a hair off the ground on one soft shadow (`--paper-lift`), the same everywhere; controls do not cast."
- **Something stands up in Flat.** `proposals/flat.md`: "Grey is the object, a hairline is the place... nothing casts". Proposed: "White is the paper, grey is the ground; the grey bubble is what is chosen inside paper."
- **One accent fill per view.** R6 holds as written: the primary button is the one filled action; a switch that is on and a ticked box are state.

## How the worlds stay apart

Press is Blue 4 on raised blocks lit from above; Device is orange on an aluminium body with screens. A blue Flat, the azure most of all, sits 0.08 from Blue 4: side by side the two blues are close, and only the material tells them apart (paper and air against blocks and trays). That holds at the level of a page, not of a button. Decision 14 gave each world its own colour, so picking a blue for Flat needs a new answer there. The violet keeps Flat apart from Press and Device by colour alone. Staying ink, or colour in the data only, keeps the worlds apart as they are today.

## Decisions

| # | Question | Suggested | Decision |
|---|---|---|---|
| 1 | Colour: none, in the data only, an accent of its own, or the picture's? | In the data first, then an accent. Data colour costs no rule and answers "some color" at once; the picture's accent collides with status too often to be a default. | |
| 2 | Which hue, if an accent? | Violet: the only one apart from Press, Device, the data hues and status. Azure is closest to the references but blurs into Blue 4 and the data blue. Vermilion reads as danger. | |
| 3 | Paper or today's grey? | Paper. It is the lightness you asked for, and it reads as Flat, not Press: no blocks, no light, only white on grey. | |
| 4 | The shadow? | One soft layer on sheets only, as `--paper-lift`; controls stay flat. | |
| 5 | The hand? | Try the snappy side on the canvas; if it feels right, apply it to Flat only, and let the script springs follow through the motion engine. | |
| 6 | Space with it? | Yes, as already chosen. | |

## After the decision

A later plan applies the pick to the Flat block of `tokens.css` with Space, takes the rule changes through `workflows/evolve.md` as `taste:` commits, adds a changelog `litt` line, fixes the Flat switch's accent fill, adds the tokens the chosen tint and the status tint need, and removes these pieces from the canvas.

# The six worlds, audited

One file per world, each read as a visitor on a desktop and a phone, dark and light, on 2026-11-20. Plan 026 counts what is built. These read what is there: what is weak to use, and where a world fails to land the feeling it is for. Every finding has its evidence, a fix and a test for when it is fixed.

| World | File | Findings | The line proposed for what it should feel like |
|---|---|---|---|
| Heat | [heat.md](heat.md), fixes in [heat-fixes.md](heat-fixes.md) | 14, ten fixed | The minute before a race at night. Everything is black and still, and one amber thing is waiting for your hand. |
| Press | [press.md](press.md) | 14 | A well-made instrument on a lit bench. You can tell what each part does before you touch it, and it gives a little under your hand. |
| Flat | [flat.md](flat.md) | 10 | A clean grey table on a bright morning. Nothing in the way, and whatever you touch springs up to meet you. |
| Device | [device.md](device.md) | 10 | A well-made machine on the desk. A key goes down, the dial clicks, and the glass tells you what it is doing. |
| Plain | [plain.md](plain.md) | 11 | A page a careful person wrote. You read it, you use it, and nothing on it asks to be looked at. |
| Rack | [rack.md](rack.md) | 15 | An hour into a session. Grey all round, your clips in their colors, and every value a box you can grab and set on the beat. |

The six lines are proposals. Each is Nick's to accept or rewrite, and nothing in Plain is built from its file without Nick's yes.

## What every world shares

Found by more than one audit, so fixed once in the shared layer or once per body.

| Finding | Where it lives | Press | Flat | Device | Plain | Rack | Heat |
|---|---|---|---|---|---|---|---|
| On a phone a tap lands on the wrong control: a touch target (`litt-target`) on a control that is not positioned grows to the whole screen | the shared top row, the contract's Index rows and Page link, some bodies' keys | yes | yes | yes | yes | yes | top row only |
| The pages describe another world's materials and motion | `meta` lines with no line for the world | a little | 42 of 97 pages | 7 of 12 read | 18 of 22 read | 50 of 91 pages | fixed on 16, open on 37 |
| The front door (Index) is a list of words | each body | yes | yes | not raised | not raised | yes | fixed |
| Focus runs against the eye on the player | each body's order | yes | yes | Play then up, on purpose | yes | yes | fixed |
| A take is small on its screen | each body's screen | under 7% | 4.6% | 3 to 22% | 3.2% | not measured | 13.8%, open |
| The selector is named "Components", like a link beside it that goes elsewhere | the contract | yes | yes | not raised | yes | yes | not raised |
| Demos still speak the web studio | the pages' later stages and Variants | yes | yes | below the lead stage | yes | Inspector's lead | fixed on the set |

"Not raised" means that audit did not report it, not that it was checked and found absent.

## Reviewed

The five audits written by agents were checked on 2026-11-21: their main claims re-measured in the build, and the "not raised" cells above measured in all six worlds. The claims held. The cells: no world but Heat has a live part on its Index, focus climbs back up to the screen in all five others, and the selector is named "Components" in all six. Three findings no audit reported are in `shared-fixes.md`: every page in a world shares one title, Back loses your place in the player, and on a phone the list starts half a screen down.

## The plans

| Plan | For |
|---|---|
| [shared-fixes.md](shared-fixes.md) | What every world shares. Goes first |
| [press-fixes.md](press-fixes.md), [flat-fixes.md](flat-fixes.md), [device-fixes.md](device-fixes.md), [rack-fixes.md](rack-fixes.md) | Each world's own, after the shared plan |
| [plain-fixes.md](plain-fixes.md) | Plain's, as questions for Nick: nothing in it is built without a yes |
| [heat-fixes.md](heat-fixes.md) | Heat's, built |

Each world's plan ends its front door with a stop for Nick's look.

## What to do first

1. **The tap fault.** It makes most of a player unusable on a phone in five worlds, it is on `main`, and no check can see it, because every page check uses a mouse.
2. **Words that are true of each world.** The mechanism exists (`ledeByWorld`, `movesByWorld`, `summaryByWorld`) and `test:words` holds Heat. Each other world needs its lines written and the check widened to it.
3. **Each body's front door and order.** Heat shows the way: a body may draw Index itself, and the strip goes where the eye meets it first.

Then each world's own findings, in its file.

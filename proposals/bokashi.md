# Bokashi skies: moving pictures for Flat

Written 2026-11-11 for Nick. Nick, on Flat: "can you add some japanese moving gradients to the visuals in flat instead of the current ones". Asked what Japanese should mean, Nick chose bokashi skies: the gradation of a woodblock print, a deep band at the top fading down to pale paper, a second band rising from the horizon, some with a red sun, and a paper grain. Asked how they may move, since R2 and R4 keep gradients and unprompted motion still, Nick chose an exception for pictures: a picture is content, like a video, so it may drift slowly on its own, still under reduced motion and while off screen.

This is a proposal, not a build. Flat's screens keep their pictures and the profile keeps its rules until Nick has seen the skies move. Five skies are live on the canvas (`#canvas`, out to the left: "Bokashi · five skies, drifting" and "Bokashi · Flat's hero, today and as a sky"; `gallery/src/canvas/bokashi.tsx`).

## What a sky is

Paper, two bands and sometimes a sun, each its own layer, with a still grain over them. Only a layer's transform moves: the top band slides down about a tenth of its height and back over 34 seconds each way, the horizon band the other way over 27, the sun over 41, so the three never line up twice the same way. No gradient is animated and the grain never moves.

| Sky | Paper | Top band | Horizon band | Sun |
|---|---|---|---|---|
| Dawn | linen | midnight blue | light salmon | crimson |
| Indigo | alice blue | dark slate blue | light steel blue | none |
| Persimmon | old lace | firebrick | navajo white | none |
| Evening | lavender blush | indigo | light coral | orange red |
| Pine | ivory | dark slate grey | dark sea green | none |

The colors are CSS named colors for now, as the Case study's drawn pictures are, because a picture is not the interface. They are the nearest named colors to the pigments, not the pigments.

## What moving costs

- **Two rules change.** The wording below is proposed, not applied.
  - R2, after "glow, grain and gradients never animate, pulse or follow the cursor": "A picture is content, not material: a picture that is itself a gradient (Flat's bokashi skies) may drift, by transform only, and its grain stays still."
  - R4, after the list of motion that fails: "One exception: a picture may move on its own. It drifts slowly (twenty seconds or more each way), by transform only; it is still under reduced motion and while off screen; it can be paused; and it is never a control, never a state, and never the view's one expressive moment."
- **A pause control is required.** WCAG 2.2.2 asks that anything moving on its own for more than five seconds can be paused, stopped or hidden. On the canvas one button pauses every sky. On a real screen the control needs a place: on each picture, or once for the page.
- **The scenes' contract changes.** `gallery/src/gallery/systems/scene.ts` says a scene "moves nothing on its own (R4)"; a Flat scene with a sky needs the same exception written there.
- **The lightbox takes a still.** Carousel, Lightbox and the cards take an image address, not a live layer, so a sky opened large is a still picture of itself.
- **The checks.** `test:motion` runs under reduced motion, where a sky is still, so it stays green. Nothing in CI fails when something moves with motion allowed; the before-and-after picture comparisons the data plans use already run with motion reduced.

## Decisions

| # | Question | Suggested | Decision |
|---|---|---|---|
| 1 | Do the skies read as bokashi, and as Flat? | Judge on the canvas, in light and dark. | |
| 2 | Which skies go in? | Dawn for the hero; Indigo, Persimmon, Evening and Pine for the series and the covers. Drop any that reads as a web gradient, not a print. | |
| 3 | Is the drift the right speed and distance? | Slow enough that it is noticed only by looking. If it reads as a screensaver, halve the distance before changing the time. | |
| 4 | The R2 and R4 wording above | Approve or edit. It goes into `taste/profile.md` through `workflows/evolve.md`, as a `taste:` commit, only with Nick's yes. | |
| 5 | Where does the pause control live? | One small icon button on each moving picture, shown on hover and on keyboard focus and always reachable by keyboard, saying "Pause the picture" or "Play the picture". | |
| 6 | Are the colors named colors, or new picture tokens? | Named colors while they are stand-ins. If the skies become a part people install, give each pigment a token so both themes and the registry can carry it. | |
| 7 | Is a sky a part of its own, only in Flat? | Yes: Flat has no part of its own yet, and a sky is one that is wrong in Press and Device. It would be Flat's first Only here. | |

## A second candidate: long exposures

Nick, on seeing the skies, 2026-11-11: "Take inspo from my components repo". That repo (`litterthanlit/components`) has Gradient Keys: a launcher whose screen shows a long exposure, "a camera swung through foliage with the shutter open, in a traditional Japanese palette". It is a shader, not layers. Streaks fan from a point below and left of the frame, the fan turns slowly while the streaks flow along it, soft masses of light and dark drift behind, and thin glints pick out a few blades, in five stops from dark to light under a fine grain.

Nick, on seeing it on the canvas, the same day: "I like this! let's make it stronger tho and more diverse". So there are now five kinds of field, twelve palettes, and a strength.

It is live on the canvas under the skies, in four pieces: "Long exposure · as in Gradient Keys" (the fan as it was, the first five palettes), "Long exposure · five fields", "Long exposure · twelve palettes" (with buttons that switch the field for the whole wall) and "Long exposure · Flat's hero, today and as a long exposure" (any field, any palette, any strength). The code is `gallery/src/canvas/streaks.tsx` and the `streaks-*.ts` files beside it. The fan's shader is Gradient Keys', cut into shared parts and otherwise unchanged.

| Field | Japanese | What it is |
|---|---|---|
| Nagashi | 流し, the pan (as in nagashi-dori, a panned shot) | Nick's long exposure from Gradient Keys: a camera swung through foliage |
| Suminagashi | 墨流し, floating ink | ink dropped on water and combed: nested rings, bent by currents, a new ring always rising in each drop |
| Kasumi | 霞, mist | a sky deepening toward the top, two ranges of hills, and broken bands of mist sliding across their feet |
| Komorebi | 木漏れ日, light through leaves | large out-of-focus discs of light over dark foliage, in three depths, drifting and slowly swelling |
| Ame | 雨, rain | fine rain falling at a slant over a soft gradation, after a woodblock print: pale far streaks, dark near ones |

| Palette | Group | What it is |
|---|---|---|
| Wakatake 若竹 | soft | young bamboo greens; from Gradient Keys |
| Ai 藍 | soft | indigo, fading to asagi; from Gradient Keys |
| Sakura 桜 | soft | cherry, fading to gofun, the shell white; from Gradient Keys |
| Sumi 墨 | soft | ink, from full to paper |
| Fuji 藤 | soft | wisteria |
| Ruri 瑠璃 | pigment | lapis lazuli: a deep, vivid blue |
| Beni 紅 | pigment | safflower crimson |
| Yamabuki 山吹 | pigment | kerria gold |
| Yūyake 夕焼け | journey | sunset: indigo, violet, coral, gold |
| Ajisai 紫陽花 | journey | hydrangea: blue, violet, pink |
| Momiji 紅葉 | journey | autumn maples: deep green, rust, gold |
| Hotaru 蛍 | journey | fireflies: night blue to a yellow-green glow |

Every palette is five stops, dark to light. A pigment is one colour at full strength, deeper than the soft five; a journey passes through more than one hue.

What it has that the skies lack:

- It is Nick's own picture, already drawn and tuned, and the four new fields are drawn the same way, so they sit together.
- It has no sun. The components repo's `DESIGN.md` asks artwork to stay "clear of red, orange and the accent so it never reads as a signal"; Dawn's and Evening's suns do not. (The warm palettes below break this, and say so.)
- A new palette sweeps in over 600ms, and a new field fades in over the same, without the picture restarting; one field fills a frame of any shape.

What it costs that the skies do not:

- **It is WebGL.** One shared context serves every picture on a page: a single hidden WebGL canvas draws each field in turn and copies it into the field's own 2D canvas. A wall of twenty-three pictures costs one context, where a browser allows about sixteen. Each picture draws at its size on screen, so a zoomed-out canvas is cheap. Without WebGL, or if the context is lost, each picture is a still gradient of its palette.
- **The gradient itself moves, and so does the grain.** The skies move layers by transform, so the R2 wording above ("by transform only, and its grain stays still") does not cover this. For long exposures R2's sentence would be: "A picture is content, not material: a picture that is itself a gradient (Flat's long exposures) may stream, grain included." R4's exception stands with "by transform only" removed. Nothing flashes: in twenty seconds of every field, in Sumi at full strength, no quarter of the frame changes its brightness by more than about 2% in a third of a second (WCAG 2.3.1 draws the line at 10%).
- **Strength is one number.** From 0 to 1: a steeper tone curve, a deeper darkest stop, richer middle stops (in linear light, in the ramp, not a filter), and brighter, a few more, glints. It changes no speed. At 0 the fan is Gradient Keys' picture exactly.
- **Warm palettes are for Flat only.** Beni, Yamabuki, Yūyake and Momiji are warm. Flat's accent is the ink, so a warm picture there is only a picture; in Device (orange) or Press (blue) a picture near the accent would read as a signal.
- **Under a hand.** In Gradient Keys a hand lights the field under it and quickens it, and a press sends a ring. R2 says a gradient never follows the cursor, and the exception Nick chose covers a picture moving on its own. On the canvas the pictures only stream; the hero's Follow the hand button turns the rest on, so both can be felt.
- **Hex values.** A shader takes numbers, so the palettes are hex, marked as candidates. Picked palettes move into `tokens.css` as picture tokens (decision 6 becomes a yes).

| # | Question | Suggested | Decision |
|---|---|---|---|
| 8 | Skies, long exposures, or both? | Long exposures: they are Nick's already, and they suit Flat's airy look without a sun. Keep the skies on the canvas until this is settled, then remove the one not picked. | |
| 9 | Which palettes go in? | Sakura for the hero, with Ai and Wakatake, as before; add Ruri and Yūyake, the strongest of the new ones, and Momiji for autumn. Sumi suits Suminagashi best. Hotaru and Beni are the loudest; drop them first if the set is too many. | |
| 10 | Does a picture answer a hand? | Not in Flat: it only streams. Try Follow the hand on the hero before deciding. | |
| 11 | The R2 wording for a streaming gradient, above | Approve or edit, with decision 4. | |
| 12 | Is the stream the right speed? | It runs at Gradient Keys' resting speed. If it is busy behind text, slow it before dimming it. | |
| 13 | Which fields go in? | Nagashi and Kasumi first: the fan is Nick's, and Kasumi reads as a landscape in every palette. Ame is the most like a print and the calmest behind text. Komorebi is lovely in the warm palettes but nearest to a screensaver; Suminagashi is the busiest, best in Sumi or Ai only. | |
| 14 | What strength does Flat ship at? | 1 for a hero or a cover, where the picture is the point; about 0.5 behind text. The strength is one number per picture, so both can ship. | |

Whichever candidate is picked, the plan after the decision ships that one and removes the other from the canvas.

## After the decision

A second plan ships the skies: the picked skies as Flat's pictures (the hero on Flat's system page, the Case study and Collection screens), the pause control, the rule wording in the profile and in `foundations.md`, the scenes' contract, a changelog line, and this canvas experiment removed.

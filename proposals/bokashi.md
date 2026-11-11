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

## After the decision

A second plan ships the skies: the picked skies as Flat's pictures (the hero on Flat's system page, the Case study and Collection screens), the pause control, the rule wording in the profile and in `foundations.md`, the scenes' contract, a changelog line, and this canvas experiment removed.

# Device's parts, from the studies on litt.design

Engineering notes read from the source shown on three study pages on 2026-11-08, for the builders of the Device wave (`worlds.md`, Depth). Units are em, viewBox or percent as the source has them; "derived" marks arithmetic from the source's constants. Everything is driven by one `requestAnimationFrame` loop with `dt` clamped to 0.1s; no frame rate is stated. Rebuild each in litt's tokens (`--device-*`, `--field-*`, the LCD screen inks), as DOM and inline SVG, never canvas or WebGL, with no sound in this wave (sound is unit 4).

Pages: https://www.litt.design/studies/c/agent-indicators, https://www.litt.design/studies/c/tape-reels, https://www.litt.design/studies/c/copy-button.

## Agent indicators

**Shared.** DOM plus inline SVG; each frame writes only changed attributes (opacity, transform, r, data-step) or custom properties (`--l`, `--pk`); React never re-renders for animation. One shared loop for every indicator on the page, stopped when none is live (paused or off screen, by IntersectionObserver). On mount each drawer is stepped 1.2s ahead in 1/60s steps before first paint, so one is never seen at rest. Every indicator sits in a 5.6em by 2.6em inline-flex box so they can stand in for each other; LCD and window faces have a 0.55em radius. Phases: thinking is Segments, searching is Tuner, reading is Meters, reasoning is Matrix, running is Chase, writing is Reels.

**Segments (thinking).** Two figures, each an SVG of viewBox 43 by 66 at 64% of the module height, 0.2em apart: the "88" of the One-time code study. Seven polygons a to g, thickness 6.6, gap 1, columns x 5.5 and 31, rows y 5, 33, 61, slant 0.09. An 8-step chase clockwise from top left as (figure, segment): (0,a) (1,a) (1,b) (1,c) (1,d) (0,d) (0,e) (0,f). The head advances every 0.085s (a loop is 0.68s) at full brightness; every other segment multiplies by exp(-dt/0.11) each frame, an LCD fade; under 0.02 is written as 0. Unlit segments are the ink at 10%; lit ones the ink.

**Tuner (searching).** A smoked window, viewBox 56 by 26. Twenty-one ticks at x = 6 + 2.2i, every fifth major (y 17.5 to 22), the rest y 19.5 to 22, stroke 0.5 at 35%; a baseline x 6 to 50 at y 22, stroke 0.4 at 20%. A lamp at (50.5, 5.5), r 1.4, the ink with a 1.2px glow. A needle, a vertical line y 3.5 to 23.5, stroke 0.9, round caps, in the record accent, at translate(6 + 44x). Stations at 0.12, 0.31, 0.5, 0.69, 0.88 of the dial, visited 0 to 4 and back. The target seeks at 0.5 dial widths per second (0.12 to 0.31 takes about 0.38s) and dwells 0.7s at each. The needle is a spring k 110, c 14 (damping ratio about 0.67, "a little under critical"), integrated semi-implicitly in fixed 1/240s steps: v += (k(target - x) - c v) h; x += v h. While dwelling, near = max(0, 1 - |x - station| / 0.02); lock eases toward near with a 0.06s time constant; lamp opacity = 0.12 + 0.88 lock.

**Meters (reading).** An LCD with two horizontal bars, gap 0.45em, bar height 0.48em, vertical padding 0.65em; the track a 1px hairline at 15%. dB to fraction is piecewise linear: -60 to 0, -40 to 0.2, -20 to 0.4, -12 to 0.6, -6 to 0.8, 0 to 1. The fill is a clip-path inset from `--l`; the peak a 2px bar at `--pk` reaching 12% above and below the row. Tokens arrive in bursts of 0.5 to 1.6s, a chunk every 0.04 to 0.11s at -17 to -4 dB, channel 2 up to 3 dB lower, gaps of 0.15 to 0.65s between bursts; a chunk only raises the shown level. The level falls at 26 dB/s to a floor of -60; the peak holds 0.9s after its last rise, then falls at 12 dB/s. Bars and peaks are the ink.

**Matrix (reasoning).** A bezel of radius 0.6em, padding 0.16em, with inset shadows, holding an SVG of viewBox 55 by 25: 11 columns by 5 rows on a 5-unit pitch, dot radius 1.55, at 82% of the cell height; every dot has a ghost fill at 8%. Each dot's value is four sines: sin(0.55x + 1.3t) + sin(0.9y - 0.9t) + sin(0.35x + 0.6y + 0.7t) + sin(1.1d - 2.1t), where d = hypot(x - cx, 1.3(y - cy)), cx = 5 + 3.2 sin(0.45t), cy = 2 + 1.4 cos(0.6t). Target brightness = clamp((v - 0.9) / 1.2, 0, 1), eased with 1 - exp(-dt/0.08); under 0.03 is written as 0. Lit dots are the ink.

**Chase (running).** Eight wells of 0.56em, gap 0.12em, each holding a 0.3em light with the recess shade. A playhead lights one well every 0.16s; the row holds latched 0.4s; 0.25s dark; about 1.93s a cycle. Off is the meter-off tone; the playhead is the record accent with a 0.4em glow at 0ms; latched is the meter-on tone at 0ms; at rest all clear on the exit duration.

**Reels (writing).** A smoked window, viewBox 56 by 26. Reel centres (15, 11.5) and (41, 11.5); hub radius 3, full pack 8.5, flange 9.4, centre disk 2.9, three spokes at 0, 120 and 240 degrees of length 2.6, stroke 0.7. Tape path M(l + 0.35 rl, y + 0.94 rl) L23 23.2 L33 23.2 L(r - 0.35 rr, y + 0.94 rr); a 3 by 2 head at (26.5, 22.4). A record lamp at (51.8, 4.2), r 1.1, the record accent with a 1px glow, dimmed to 0.15 while rewinding. Progress starts at 0.08 and records at 1/9 of the tape per second (about 9s to full), reverses at 1, rewinds at 3.5 times that, goes forward again at 0. Pack radius r = sqrt(3² + p(8.5² - 3²)). Angular velocity = 268 × rate / r (about 9.9 rad/s at the hub, 3.5 at full pack); the angle accumulates and is written as rotate(deg cx cy) to 0.1 degree, modulo 360. Pack at 13%, flange 3%, spokes 55%, tape 30%, head 25% of white.

**Crossfade.** On a phase change the state swaps during render, so the new one never lags a frame. The outgoing stays 150ms and plays its enter in reverse on the exit duration; the incoming plays its enter already moving, thanks to the pre-roll. Both sit in one grid cell. The outer span is role="status" with the phase in sr-only words.

**Reduced motion and pause.** Under reduced motion the drawer pre-rolls 1.2s and holds that frame; its loop is never registered. `paused` stops an indicator's loop without unmounting it. Off screen stops its draws.

## Tape reels (progress)

**Geometry.** viewBox 200 by 110. Full pack R 38, hub 15. Reel centres (52, 46) and (148, 46). Guides at (13, 96) and (187, 96), radius 5; the tape runs at y 91 across an 18 by 9 head at the centre with a record light at (114, 96), radius 1.6. The container is full width with a 0.8em radius; the demo is at most 440px wide.

**Progress.** span = R² - hub² = 1219. Supply radius = sqrt(hub² + (1 - p) span), take-up = sqrt(hub² + p span), both 15 to 38. Angle per pack θ = 2(r - hub)/K with K = 2(R - hub)/(2π · 8) ≈ 0.915, so the tape is about 2.875 units thick and about 8 turns end to end; total length ≈ 1332 units.

**Physics.** The tape moves at constant speed, so each reel's angular velocity is (span / (K r)) × dp/dt, proportional to 1/r: the emptying reel speeds up, the filling one slows. Progress (in thousandths) is driven by a spring of stiffness 140, damping 24 (critically damped, ratio about 1.02). A drag jumps; any other change eases.

**Rendering.** Reels are div circles, not SVG, each setting `--r` and `--a`; the pack is radial and conic gradients masked by `--r`, the hub a conic mask driven by `--a` with three windows. The tape is an SVG polyline, stroke 1.6, with tangent points from supply to the left guide and from the right guide onto the take-up.

**Seek (optional).** The window becomes role="slider" 0 to 100; a drag is angle-based, progress per move = delta × (radius under the hand) / length, clockwise winds forward on either reel. Arrows ±0.01, Page keys ±0.1, Home 0, End 1.

**Reduced motion.** Changes jump; the demo sits at 0.64, paused. Demo timing for reference: export advances every 110ms by 0.022 to 0.048; done holds 1100ms; rewind runs 900ms.

## Copy button

**States.** Idle shows the copy glyph (two overlapping rounded squares, 16 viewBox, stroke 1.3); copied shows a check (path m3 8.5 3.2 3 L13 4.5, stroke 1.6, round caps, pathLength 1). The glyphs crossfade in opacity, scale and blur (off: 0.95, 0, 2px; on: 1, 1, 0) on the enter duration; the check draws in from dashoffset 1 to 0 on the move duration, ease-out, delayed 75ms. Copied holds 1800ms, then idle. A failed clipboard write changes nothing.

**Key.** 2.9em with a 0.7em radius. A press moves the key down 2px and switches to the pressed shade, 75ms on press and the exit duration on release. A rehearsal on mount (no copy): the key goes down at 400ms and up at 510ms showing the check; skipped under reduced motion and cancelled once a hand touches it.

**Glitch wave (the command on the LCD).** Glyphs from half-width katakana, digits and `:=*+<>` (the HD44780 ROM). Hiding runs right to left, showing decodes left to right. Each character starts min(18, 520/count) ms after its neighbour, the whole wave at most 520ms; a character glitches 140 + rand × 200 ms, swapping glyphs every 35 + rand × 50 ms with a flicker of 0.6 to 1.0; alpha leaving = flicker × (1 - 0.7p), arriving = flicker × (0.35 + 0.65p), quantised to 0.1. A hidden character keeps its width, so the line never moves. A second copy mid-wave reverses it from where it is. Spans in the DOM written from the loop, no re-render.

**Reduced motion.** No glitch: the command clears and returns at once; no rehearsal. Screen readers hear "Copy command", and "Copied" only on a real copy.

**Tokens.** Key face, key ink, key shade and its pressed form; LCD ink, LCD ground and edge shade; the prompt in the LCD's dim ink; the engraved glyph filter.

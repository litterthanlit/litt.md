# Plan 021: Device answers a key with a sound, and starts with it on

> **Executor instructions**: Read `.claude/CLAUDE.md`, `skills/litt-md/taste/litt-principles.md` (Device, and Sound)
> and `proposals/worlds.md` ("Sound, as a world's ability", decision 8) first. Phase 1 ends in a STOP for Nick's ear.

## Status

- **Priority**: P1 (Nick, 2026-11-16, PR #116)
- **Effort**: L
- **Risk**: MEDIUM. A new engine in `src/motion`, which ships in the `motion` registry item.
- **Depends on**: nothing.
- **Category**: direction

## Why

Nick, 2026-11-16: "yes we can have sound", then "start with sound for device". `litt-principles.md` now says: "Sound
answers a key. A click confirms a press faster than sight. Synthesized, and only in answer to a hand. It starts with
sound on, and the viewer can mute it." This replaces decision 8's silent start. Nothing plays it yet: litt has no
sound engine.

## Decisions already made

| Question | Answer | Source |
|---|---|---|
| Which world | Device only | decision 8, litt-principles |
| Files or synthesis | Synthesized with Web Audio. No audio files, so the registry ships no assets | proposals/worlds.md |
| When it plays | Only in answer to a pointer or key event, never on arrival or on its own | R4, litt-principles |
| Default | On, with a mute the viewer can reach | Nick, 2026-11-16 |
| Before the first press | Silent: a browser blocks audio until a gesture, so the first press both unlocks and plays | litt-principles |

## Phase 1. The engine and four sounds (STOP for Nick's ear)

- [ ] `gallery/src/motion/sound.ts`: one lazily created `AudioContext`, resumed inside the first gesture; `play(name)`
      is a no-op unless a pointerdown or keydown happened in the last 300ms; one `useSound()` hook that reads Device
      (`useMaterial`) and the mute.
- [ ] Four voices, each a few oscillator and noise envelopes under 80ms: a key's click (Button down), a switch's
      clack, a slider's notch tick, a digit's beep (code input). Values live in `tokens.css` as `--sound-*` (pitch,
      length, level), so `check.mjs` can bound them (level at most -12 dBFS, length at most 120ms).
- [ ] The mute: a key on Device's recorder body and in each Device page's top row, `aria-pressed`, stored per viewer
      (`litt-gallery:sound`). It is gallery chrome; a host app gets `SoundProvider muted`.
- [ ] `check.mjs` and a new `test:sound` (Playwright, with a stubbed `AudioContext`): nothing plays on load, nothing
      plays without a gesture in the last 300ms, nothing plays outside Device, and mute stops all of it.
- [ ] A page `#device/sound` to hear the four voices and tune them by ear.

**STOP**: Nick listens. Changes to a voice go into `tokens.css` and nowhere else.

## Phase 2. Every Device body that a hand works

- [ ] Wire the voices into the Device bodies (`gallery/src/worlds/device/` after plan 019 phase 4): Button, Switch,
      Slider (per notch), Segmented, Checkbox, Code input, the recorder's dial (per detent) and keys.
- [ ] CHANGELOG lines for every registry item that gains a sound.

## Open, for Nick

1. Does Play on the player make a sound per take it steps? The engine's rule says no (Play is not a hand), unless
   Nick wants it.

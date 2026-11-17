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

## Phase 1. The engine and four sounds (done 2026-11-17; STOP for Nick's ear)

- [x] `gallery/src/motion/sound.ts`: one lazily created `AudioContext`, made and resumed inside the first gesture;
      `play(name)` is a no-op unless a trusted pointerdown or keydown happened in the last 300ms; one `useSound()` hook
      that reads Device (`useMaterial`) and the mute (`SoundProvider muted`).
- [x] Four voices, each a few oscillator and noise envelopes under 80ms: a key's click (Button down, and up), a switch's
      clack, a slider's notch tick, a digit's beep (code input). Values live in `tokens.css` as `--sound-*` (pitch,
      length, level), and `check.mjs` (check 17) bounds them (level at most -12 dBFS, length at most 120ms).
- [x] The mute: a key in each Device page's top row (`world-site.tsx`, `mute.tsx`), `aria-pressed`, stored per viewer
      (`litt-gallery:sound`), on by default, and M where M is no page's own key. It is gallery chrome; a host app gets
      `SoundProvider muted`. **Not yet on Device's recorder body**: that file was being changed by another plan at the
      time, so the recorder's own mute key is left for phase 2 (or the recorder's next pass), and M is not bound on the
      player.
- [x] `check.mjs` and a new `test:sound` (Playwright, with a stubbed `AudioContext`): nothing plays on load, nothing
      plays without a gesture in the last 300ms, nothing plays outside Device, and mute stops all of it.
- [x] A page `#device/sound` to hear the four voices and tune them by ear.

What was decided on the way:

- **The values** are the components repo's (`src/lib/sound.ts`), measured at its tuned level in an OfflineAudioContext:
  key down (its `press`) 175 Hz, 46ms, -18 dBFS; key up (`release`) 320 Hz, 13ms, -24; switch (`toggle`) 700 Hz, 25ms,
  -21; notch (`tick`, at the knob's 0.55) 2900 Hz, 6ms, -27; digit 880 Hz, 53ms, -26 (the reference's code input plays
  a tick at 0.6; litt's digit adds the triangle beep of the reference's transport, as this plan asks for a beep).
- **Level is the peak you hear.** Each voice's shape keeps a measured unit peak, so a level token is the voice's peak in
  dBFS. The bus is dry and linear: no room, and no compressor (Chromium's pulled a -18 key 9 dB down, so the token
  would not say what you hear). Levels stop at -12 and at most four voices sound at once.
- **It does not ship yet.** `sound.ts` stays out of the `motion` registry item until a body plays it (phase 2): until
  then a host would get an engine nothing calls. The tokens ship (`litt`, `device-litt`), under Device alone.
- Nick's decision ("start with sound for device") already stood here; nothing in this plan needed changing for it.

**STOP**: Nick listens (`#device/sound`, or the WAVs rendered from the same code). Changes to a voice go into
`tokens.css` and nowhere else.

## Phase 2. Every Device body that a hand works

- [ ] Wire the voices into the Device bodies (`gallery/src/worlds/device/` after plan 019 phase 4): Button, Switch,
      Slider (per notch), Segmented, Checkbox, Code input, the recorder's dial (per detent) and keys.
- [ ] CHANGELOG lines for every registry item that gains a sound, and `sound.ts` joins the `motion` item (and each
      world's) with the first body that plays it.
- [ ] The mute key on Device's recorder body, and M on the player.

## Open, for Nick

1. Does Play on the player make a sound per take it steps? The engine's rule says no (Play is not a hand), unless
   Nick wants it.

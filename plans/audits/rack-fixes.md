# Rack's audit, fixed

The plan for `rack.md`. Read `shared-fixes.md` first. Rack follows Ableton Live: panels, clips, devices, values you set; color belongs to what the person makes and means one thing everywhere; things cut in and stop on the beat.

> **Executor instructions.** As `shared-fixes.md`. Nothing in Rack travels or eases.

## Buildable now

1. **Grids are one tab stop (finding 5).** The clip launcher is 20 tab stops and the step sequencer 32, and the arrows do nothing. Each becomes a grid: one stop, the arrows move a cell at a time, Home and End go to the row's ends, Space or Enter acts. Changelog lines for both and their Rack copies. Fixed when: a check tabs into each, and one more Tab leaves it.
2. **Small controls keep a finger's target (finding 8).** Sequencer steps (22px wide), the bypass (24 by 24) and the lane's chips get `litt-target relative`, or grow on a coarse pointer where a target would overlap its neighbour. `test:targets` then holds them.
3. **Color is owned, not dealt (finding 4).** A track has a color and keeps it: the player's lane colors a chip by the part's own track, not by its place, so Clip launcher, Pad and Switch stop sharing orange. A device gives each macro its own. The time scrubber's drop marker stops using warning amber and stops saying "Warning".
4. **Inspector leads with Rack (finding 3).** Its first stage is a toast tuner with "Invoice sent to Atelier Nord", springs and a float shadow. Under Rack it leads with a device's parameters (`byWorld`), and the toast tuner stays the shared demo.
5. **Focus on the selector can be seen (finding 6)** and **follows the eye (finding 7)**: the ring sits over the chips, not under them, and the lane goes above the screen.
6. **The lane and the launcher show what they hold (12, 13).** On a phone the launcher cuts 12 of 18 clip names: two lines, or the name on focus. The lane shows 10 of 13 chips with no edge: a cut edge, as Heat's strip has.
7. **Nothing eases (finding 14).** Under Rack the time scrubber stops at release; it settles for 400ms today.
8. **Rack-only words (finding 15).** Preset names in sentence case, no token names in the step sequencer's About, no em dash in the clip launcher's.

## The front door (finding 9)

Proposed: Index as a session. The set is a column of clips in their tracks' colors, grouped by track (the Rack-only parts, values, controls). The clip under the keys or the pointer is launched: it takes its lit state at once, with no travel, and its part is live in the device panel beside the session, as a device you have just selected. It is the one Index where color is right on the list itself, because in Rack color is the content.

**Stop for Nick's look** after this lands.

## Nick's calls, not built

- **What is on is ink, not color (finding 10).** A playing clip loses its track's color and a switch at On is ink. R6 and the proposal chose ink; the front door above would look better if a launched clip kept its color.

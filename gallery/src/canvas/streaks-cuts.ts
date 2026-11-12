/**
 * Cuts: the same long exposure, framed differently. A cut is the fan's geometry: where its root sits outside the frame
 * (in field units, where the frame's shorter side is 1.35 across, centred on 0), and multipliers on Gradient Keys' own
 * numbers for how fine the streaks are across, how long they are along, how fast the fan turns and how fast the
 * streaks flow. The sweep is where a new palette, or a pair's seam, runs along the streaks: from `sweep[0]` field
 * units from the root, over `sweep[1]`, chosen so a pair's seam sits inside the frame at 4 to 5 and at 2.4 to 1.
 *
 * The first cut is Nick's numbers, unchanged: with it the picture is Gradient Keys' exactly.
 */

export type Cut = {
  id: string;
  name: string;
  /** What the camera did, in a line. */
  note: string;
  root: readonly [number, number];
  /** When set, the root is measured from this corner of the frame (1, 1 is the top right), not from its middle. */
  corner?: readonly [number, number];
  /** Streaks across: above 1, finer and more of them. */
  across: number;
  /** Along the streaks: above 1, shorter. */
  along: number;
  /** How fast the fan turns; a negative one turns the other way. */
  turn: number;
  /** How fast the streaks flow out from the root. */
  flow: number;
  sweep: readonly [number, number];
};

export const CUTS: Cut[] = [
  { id: "pan", name: "Pan", note: "Gradient Keys' own: swung up and across, from below left", root: [-2.6, -1.4], across: 1, along: 1, turn: 1, flow: 1, sweep: [2.2, 1.6] },
  { id: "sweep", name: "Sweep", note: "Swung level, from far to the left", root: [-5.2, -0.35], across: 2.1, along: 0.8, turn: 0.5, flow: 1.1, sweep: [4.6, 1.2] },
  { id: "fall", name: "Fall", note: "Dropped straight down, from far above", root: [0.35, 5.0], across: 2.2, along: 0.8, turn: -0.5, flow: 1, sweep: [4.4, 1.2] },
  { id: "burst", name: "Burst", note: "Spun from just past the top right corner", corner: [1, 1], root: [0.3, 0.35], across: 0.65, along: 1.3, turn: -1.4, flow: 0.9, sweep: [0.7, 2.0] },
  { id: "close", name: "Close", note: "Nearer the leaves: fewer, broader streaks", root: [-2.2, -1.3], across: 0.5, along: 0.6, turn: 0.8, flow: 0.8, sweep: [1.6, 1.8] },
];

export const cutById = (id: string) => CUTS.find((c) => c.id === id) ?? CUTS[0]!;

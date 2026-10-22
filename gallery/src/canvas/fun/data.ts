/** Sample data for the fun mode lane, shared by each today/fun pair so the two draw the same thing. All made up. */
import type { FunPhase } from "./timeline";

/** A seeded generator (mulberry32), so every load draws the same data. */
function seeded(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ------------------------------------------------------------------ heatmap: deploys per day, 20 weeks */

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const WEEKS = Array.from({ length: 20 }, (_, i) => {
  const d = new Date(Date.UTC(2026, 9, 19) - (19 - i) * 7 * 86400000);
  return `week of ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
});
export const DEPLOYS = (() => {
  const rnd = seeded(11);
  return DAYS.map((label, r) => {
    const weekend = r >= 5;
    const values = WEEKS.map((_, c) => {
      const busy = 0.4 + 0.6 * Math.sin((c / 19) * Math.PI * 0.9 + 0.3); // a launch in the middle of the run
      const v = rnd() < (weekend ? 0.6 : 0.12) ? 0 : Math.round(rnd() * (weekend ? 3 : 9) * busy + (weekend ? 0 : 1));
      return v;
    });
    return { label, values, total: values.reduce((a, b) => a + b, 0) };
  });
})();

/* ------------------------------------------------------------------ timeline: one deploy */

export const DEPLOY: FunPhase[] = [
  {
    label: "Build",
    hue: "blue",
    steps: [
      { label: "Clone repository", seconds: 2 },
      { label: "Install dependencies", seconds: 9 },
      { label: "Run build commands", seconds: 19 },
    ],
  },
  {
    label: "Deploy",
    hue: "teal",
    steps: [
      { label: "Upload output", seconds: 6 },
      { label: "Assign atelier-nord.com", seconds: 2 },
    ],
  },
];

/* ------------------------------------------------------------------ bar list: shortcuts, week by week */

export const SHORTCUT_WEEKS: { label: string; value: number }[][] = [
  [
    { label: "Archive", value: 412 },
    { label: "Next and previous", value: 388 },
    { label: "Reply", value: 164 },
    { label: "Snooze", value: 96 },
  ],
  [
    { label: "Archive", value: 371 },
    { label: "Next and previous", value: 455 },
    { label: "Reply", value: 158 },
    { label: "Snooze", value: 210 },
  ],
  [
    { label: "Archive", value: 300 },
    { label: "Next and previous", value: 402 },
    { label: "Reply", value: 120 },
    { label: "Snooze", value: 380 },
  ],
];
export const SHORTCUT_KEYS: Record<string, string[]> = { Archive: ["E"], "Next and previous": ["J", "K"], Reply: ["R"], Snooze: ["H"] };

/* ------------------------------------------------------------------ stats: the last 14 days */

const series = (seed: number, base: number, swing: number) => {
  const rnd = seeded(seed);
  return Array.from({ length: 14 }, (_, i) => Math.max(0, Math.round(base + swing * Math.sin(i / 2.2 + seed) + (rnd() - 0.5) * swing)));
};
export const DEPLOYS_14 = series(1, 15, 7);
export const BANDWIDTH_14 = series(3, 30, 10);

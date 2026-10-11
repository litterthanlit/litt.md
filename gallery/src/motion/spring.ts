/**
 * Springs as time + bounce.
 *
 * One pair of numbers drives every output:
 * - Motion (React):  { type: "spring", visualDuration: time, bounce }
 * - Framer:          Spring transition, Time + Bounce fields
 * - Plain CSS:       an easing made with linear() plus a settle duration
 *
 * The conversion mirrors Motion's own: visualDuration sets the stiffness,
 * bounce sets the damping ratio (1 - bounce), mass is 1.
 */
export type Spring = { time: number; bounce: number }; // time in seconds, bounce 0..1

export function physics({ time, bounce }: Spring) {
  const root = (2 * Math.PI) / (Math.max(time, 0.01) * 1.2);
  const stiffness = root * root;
  const ratio = Math.min(1, Math.max(0.05, 1 - bounce));
  const damping = 2 * ratio * Math.sqrt(stiffness);
  return { stiffness, damping, mass: 1 };
}

/** Simulate 0 → 1 until it settles. Returns [t (s), x] samples and the settle time. */
export function simulate(spring: Spring, step = 1 / 240) {
  const { stiffness, damping, mass } = physics(spring);
  let x = 0, v = 0, t = 0;
  const pts: [number, number][] = [[0, 0]];
  while (t < 4) {
    const a = (-stiffness * (x - 1) - damping * v) / mass;
    v += a * step; x += v * step; t += step;
    pts.push([t, x]);
    if (t > spring.time * 0.5 && Math.abs(x - 1) < 0.001 && Math.abs(v) < 0.01) break;
  }
  return { pts, settle: t };
}

/** Peak overshoot as a fraction (0.12 = 12% past the target). */
export function overshoot(spring: Spring) {
  return Math.max(0, ...simulate(spring).pts.map(([, x]) => x - 1));
}

/** A CSS linear() easing that reproduces the spring, plus its settle duration in ms. */
export function toCss(spring: Spring, points = 40) {
  const { pts, settle } = simulate(spring);
  const out: string[] = [];
  for (let i = 0; i <= points; i++) {
    const idx = Math.round((i / points) * (pts.length - 1));
    out.push(+pts[idx][1].toFixed(4) + "");
  }
  return { easing: `linear(${out.join(", ")})`, duration: Math.round(settle * 1000) };
}

/** Sample for drawing: x normalised to the settle time. */
export function curve(spring: Spring, n = 48) {
  const { pts } = simulate(spring);
  return Array.from({ length: n + 1 }, (_, i) => {
    const p = pts[Math.round((i / n) * (pts.length - 1))];
    return [i / n, p[1]] as [number, number];
  });
}

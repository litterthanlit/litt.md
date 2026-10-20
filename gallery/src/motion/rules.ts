/**
 * The litt.md v0.5 motion and shape rules, as the Playground checks them.
 *
 * KEEP IN STEP WITH skills/litt-md/scripts/check.mjs. LIMITS mirrors its
 * check 9 (motion) and check 7 (radius): change a bound there and change it
 * here, in the same commit. workflows/evolve.md lists this file in the
 * Propagate step.
 *
 * What check.mjs enforces, and where it shows up below:
 * - instant is a tween of at most 240ms                      -> instantMs
 * - a spring's visual time is at most 350ms                  -> springMs
 * - a spring settles within 600ms                            -> settleMs
 * - bounce is at most 0.12, and exactly 0 on responsive      -> bounce
 * - an exit lasts round(visual time x --exit)                -> exit, and tokensSnippet
 * - corners are 0, --radius-control (4), --radius-surface
 *   (control + 4) or the pill                                -> control
 * - the last linear() stop is 1 and responsive never passes
 *   1                                                        -> spring.ts toCss
 *
 * One rule here is stricter than the script. check.mjs accepts any --exit
 * between 0 and 1. The profile fixes exits at 0.75x, so a different value is
 * flagged as a change from the locked rule. Anything that passes these rows
 * also passes check.mjs; the reverse can differ on exit alone.
 *
 * Stagger and travel are not hard rules in v0.5. They appear under
 * "Differs from locked" only.
 *
 * The typeface is the Type decision in the taste profile, not a check.mjs
 * bound: the sans is the face tokens.css sets. A trial face shows as a change,
 * and Lock it prints its --font-sans line.
 */
import { toCss } from "./spring";
import { surfaceRadius, type Dial, type Locked } from "./tokens";

export const LIMITS = {
  /** The instant tween, in ms. */
  instantMs: 240,
  /** A spring's visual time, in ms. */
  springMs: 350,
  /** The time a spring takes to settle, in ms. */
  settleMs: 600,
  /** Bounce ceiling. Responsive is exactly 0. */
  bounce: 0.12,
  /** Exits run at this fraction of the visual time. */
  exit: 0.75,
  /** --radius-control in px. The surface is this plus the 4px inset. */
  control: 4,
} as const;

export type RuleRow = { ok: boolean; text: string };

/** The sans the Playground shows, beside the one tokens.css locks. */
export type TypeChoice = { name: string; stack: string; locked: string };

const ms = (v: number) => `${Math.round(v)}ms`;
const sec = (v: number) => ms(v * 1000);
const num = (v: number) => String(+v.toFixed(2));

/** The settle time of each spring, in ms (the value for --dur-responsive and --dur-expressive). */
export function settleTimes(dial: Dial) {
  return { responsive: toCss(dial.responsive).duration, expressive: toCss(dial.expressive).duration };
}

/** What an exit lasts in ms for each tier: round(visual time x exit), as check.mjs derives it. */
export function exitTimes(dial: Dial) {
  const round = (t: number) => Math.round(Math.round(t * 1000) * dial.exit);
  return { responsive: round(dial.responsive.time), expressive: round(dial.expressive.time) };
}

/** One row per hard rule, in the order check.mjs reads them. */
export function checkRules(dial: Dial, radius: number, type?: TypeChoice): RuleRow[] {
  const settle = settleTimes(dial);
  const rows: RuleRow[] = [
    {
      ok: dial.instant <= LIMITS.instantMs,
      text: `Instant tween at most ${LIMITS.instantMs}ms: ${ms(dial.instant)}`,
    },
    {
      ok: Math.round(Math.max(dial.responsive.time, dial.expressive.time) * 1000) <= LIMITS.springMs,
      text: `Spring visual time at most ${LIMITS.springMs}ms: responsive ${sec(dial.responsive.time)}, expressive ${sec(dial.expressive.time)}`,
    },
    {
      ok: Math.max(settle.responsive, settle.expressive) <= LIMITS.settleMs,
      text: `Settle at most ${LIMITS.settleMs}ms: responsive ${ms(settle.responsive)}, expressive ${ms(settle.expressive)}`,
    },
    {
      ok: dial.responsive.bounce === 0,
      text: `Responsive bounce is 0: ${num(dial.responsive.bounce)}`,
    },
    {
      ok: dial.expressive.bounce <= LIMITS.bounce,
      text: `Expressive bounce at most ${LIMITS.bounce}: ${num(dial.expressive.bounce)}`,
    },
    {
      ok: dial.exit === LIMITS.exit,
      text: `Exits run at ${LIMITS.exit}x the spring time, as a tween that never bounces: ${num(dial.exit)}x`,
    },
    {
      ok: radius === LIMITS.control,
      text: `Controls ${LIMITS.control}px, surfaces ${surfaceRadius(LIMITS.control)}px, pills unchanged: ${radius}px controls, ${surfaceRadius(radius)}px surfaces`,
    },
  ];
  if (type) rows.push({ ok: type.name === type.locked, text: `The sans is ${type.locked}, with Geist Mono for code and data: ${type.name}` });
  return rows;
}

/** Every value that is not the locked one, in words. Empty when the dial matches the tokens. */
export function diffFromLocked(dial: Dial, radius: number, locked: Locked, type?: TypeChoice): string[] {
  const out: string[] = [];
  const d = locked.dial;
  const add = (label: string, now: string, was: string) => now !== was && out.push(`${label} ${was} → ${now}`);
  add("Instant", ms(dial.instant), ms(d.instant));
  add("Responsive time", sec(dial.responsive.time), sec(d.responsive.time));
  add("Responsive bounce", num(dial.responsive.bounce), num(d.responsive.bounce));
  add("Expressive time", sec(dial.expressive.time), sec(d.expressive.time));
  add("Expressive bounce", num(dial.expressive.bounce), num(d.expressive.bounce));
  add("Stagger", ms(dial.stagger), ms(d.stagger));
  add("Travel", `${dial.travel}px`, `${d.travel}px`);
  add("Exit", `${num(dial.exit)}x`, `${num(d.exit)}x`);
  add("Control radius", `${radius}px`, `${locked.radius}px`);
  if (type) add("Sans", type.name, type.locked);
  return out;
}

/** The tokens.css lines for this dial, ready to paste. Passes check.mjs when checkRules is all ok. */
export function tokensSnippet(dial: Dial, radius: number, type?: TypeChoice): string {
  const r = toCss(dial.responsive);
  const e = toCss(dial.expressive);
  const exit = exitTimes(dial);
  return [
    `/* Motion, from the litt.md Playground. Springs are time + bounce:`,
    `   Motion visualDuration + bounce, Framer Time + Bounce. */`,
    `--dur-instant: ${Math.round(dial.instant)}ms;`,
    `--spring-responsive: ${Math.round(dial.responsive.time * 1000)}ms ${num(dial.responsive.bounce)};`,
    `--dur-responsive: ${r.duration}ms;`,
    `--ease-responsive: ${r.easing};`,
    `--spring-expressive: ${Math.round(dial.expressive.time * 1000)}ms ${num(dial.expressive.bounce)};`,
    `--dur-expressive: ${e.duration}ms;`,
    `--ease-expressive: ${e.easing};`,
    `--exit: ${num(dial.exit)};`,
    `--dur-exit-responsive: ${exit.responsive}ms;`,
    `--dur-exit-expressive: ${exit.expressive}ms;`,
    `--stagger: ${Math.round(dial.stagger)}ms;`,
    `--travel: ${dial.travel}px;`,
    ``,
    `/* Shape: surfaces are controls plus the 4px inset. */`,
    `--radius-control: ${radius}px;`,
    `--radius-surface: ${surfaceRadius(radius)}px;`,
    ...(type && type.name !== type.locked
      ? [``, `/* Type: sizes, weights by role and tracking stay as they are. */`, `--font-sans: ${type.stack};`]
      : []),
  ].join("\n");
}

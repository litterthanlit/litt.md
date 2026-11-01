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
 *   (control + 4) or the pill, and a block set 2px into a
 *   control the control radius less 2px (it follows the
 *   control, so nothing here changes for it)                -> control, RADIUS_PILL, cornerRule
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
 * spaceRule is a profile rule that check.mjs does not bound: foundations.md
 * (Scale, R9) puts spacing on --space-1 to --space-40. SPACE_SCALE copies that
 * scale, and npm run test:rules fails when it, RADIUS_PILL or the corners
 * cornerRule accepts drift from tokens.css.
 *
 * The Playground checks the motion rows (checkRules). The radius and the
 * typeface are tuned in the Customize panel on every page, which checks them
 * with shapeRule and typeRule and copies them with customizeSnippet. The
 * typeface is the Type decision in the taste profile, not a check.mjs bound:
 * the sans is the face tokens.css sets.
 */
import { toCss, type Spring } from "./spring";
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
export function checkRules(dial: Dial): RuleRow[] {
  const settle = settleTimes(dial);
  return [
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
  ];
}

/** The two spring tiers. Instant is a tween, so it has no spring to check. */
export type SpringTier = "responsive" | "expressive";

/** One spring against its tier: the visual time, the settle and the bounce, the rows checkRules reads for that tier. */
export function springRules(spring: Spring, tier: SpringTier): RuleRow[] {
  const settle = toCss(spring).duration;
  return [
    {
      ok: Math.round(spring.time * 1000) <= LIMITS.springMs,
      text: `Visual time at most ${LIMITS.springMs}ms: ${sec(spring.time)}`,
    },
    {
      ok: settle <= LIMITS.settleMs,
      text: `Settles within ${LIMITS.settleMs}ms: ${ms(settle)}`,
    },
    tier === "responsive"
      ? { ok: spring.bounce === 0, text: `No bounce on the responsive tier: ${num(spring.bounce)}` }
      : { ok: spring.bounce <= LIMITS.bounce, text: `Bounce at most ${LIMITS.bounce}: ${num(spring.bounce)}` },
  ];
}

/**
 * The pill: half the tallest control (lg, 56), so every control on the scale rounds fully. Not 9999px: large
 * boxes on the control radius (a code block, a popover's inner area) would turn into stadiums and clip their text.
 */
export const PILL = 28;
/** The Customize panel's radius choices: the Playground's steps, then the pill. */
export const SHAPES = [0, 2, 4, 6, PILL] as const;
/** The surface radius for a control radius. A pill has no concentric surface, so cards and panels take 16px with it. */
export const shapeSurface = (control: number) => (control === PILL ? 16 : surfaceRadius(control));
/** A control radius in words: "Square", "4px", "Pill". */
export const shapeName = (control: number) => (control === 0 ? "Square" : control === PILL ? "Pill" : `${control}px`);

/** --radius-pill in px: avatars and icon-only buttons. Not PILL, the Customize panel's pill for controls. */
export const RADIUS_PILL = 999;

/** One component corner (check 7): 0, the control radius, the surface radius or the pill. */
export function cornerRule(px: number, subject: string): RuleRow {
  const surface = surfaceRadius(LIMITS.control);
  return {
    ok: px === 0 || px === LIMITS.control || px === surface || px === RADIUS_PILL,
    text: `${subject} on litt's corners, 0, ${LIMITS.control}px, ${surface}px or the pill: ${px === RADIUS_PILL ? "the pill" : `${px}px`}`,
  };
}

/** The spacing scale (foundations.md, Scale): each step in px, with its token. */
export const SPACE_SCALE = [
  [4, "--space-1"],
  [8, "--space-2"],
  [12, "--space-3"],
  [16, "--space-4"],
  [24, "--space-6"],
  [32, "--space-8"],
  [48, "--space-12"],
  [64, "--space-16"],
  [96, "--space-24"],
  [128, "--space-32"],
  [160, "--space-40"],
] as const;

/** One space (R9): none, or a step on the scale. Off it, the row names the steps on either side. */
export function spaceRule(px: number, subject: string): RuleRow {
  const text = `${subject} on the spacing scale: ${px}px`;
  if (px === 0 || SPACE_SCALE.some(([step]) => step === px)) return { ok: true, text };
  const below = SPACE_SCALE.filter(([step]) => step < px).pop();
  const above = SPACE_SCALE.find(([step]) => step > px);
  const near = [below, above].flatMap((s) => (s ? [`${s[0]}px`] : [])).join(" or ");
  return { ok: false, text: `${text}, use ${near}` };
}

/** The radius rule (check 7). */
export function shapeRule(radius: number): RuleRow {
  const now = radius === PILL ? "pill controls" : `${radius}px controls`;
  return {
    ok: radius === LIMITS.control,
    text: `Controls ${LIMITS.control}px, surfaces ${surfaceRadius(LIMITS.control)}px, pills unchanged: ${now}, ${shapeSurface(radius)}px surfaces`,
  };
}

/** The Type decision: the sans is the face tokens.css sets. */
export function typeRule(type: TypeChoice): RuleRow {
  return { ok: type.name === type.locked, text: `The sans is ${type.locked}, with Geist Mono for code and data: ${type.name}` };
}

/** Every value that is not the locked one, in words. Empty when the dial matches the tokens. */
export function diffFromLocked(dial: Dial, locked: Locked): string[] {
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
  return out;
}

/** The tokens.css lines for this dial, ready to paste. Passes check.mjs when checkRules is all ok. */
export function tokensSnippet(dial: Dial): string {
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
  ].join("\n");
}

/** The tokens.css lines for the Customize panel's choices: only what differs from the locked values. */
export function customizeSnippet(radius: number, lockedRadius: number, type: TypeChoice): string {
  const out: string[] = [];
  if (type.name !== type.locked) out.push(`/* Type: sizes, weights by role and tracking stay as they are. */`, `--font-sans: ${type.stack};`);
  if (radius !== lockedRadius) {
    if (out.length) out.push(``);
    const note = radius === PILL ? `/* Shape: pill controls (28px is half the 56px lg control); surfaces take 16px, since a pill has no concentric surface. */` : `/* Shape: surfaces are controls plus the 4px inset. */`;
    out.push(note, `--radius-control: ${radius}px;`, `--radius-surface: ${shapeSurface(radius)}px;`);
  }
  return out.join("\n");
}

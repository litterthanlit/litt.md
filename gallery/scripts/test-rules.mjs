#!/usr/bin/env node
/**
 * The shape rules in src/motion/rules.ts against the tokens they copy, under Node, with no build.
 *
 *   npm run test:rules
 *
 * It fails when:
 * - SPACE_SCALE is not tokens.css's --space-* steps, in order, with the same names and px,
 * - RADIUS_PILL is not --radius-pill, or LIMITS.control is not --radius-control,
 * - cornerRule turns down 0, the control, the surface or the pill, or accepts a corner check.mjs refuses,
 * - DEVICE_RADII_EM is not Device's --radius-plate, -well, -key and -chip in tokens.css (R9's exception), or cornerRule
 *   accepts an em radius in any world but Device, or turns one down under Device, or lets Device past its four,
 * - spaceRule turns down a step of the scale, or accepts a value foundations.md calls off the scale,
 *   or names the wrong steps beside it,
 * - EXPRESSIVE_BOUNCE is not check.mjs's per-world cap (BOUNCE_CAP, BOUNCE_DEFAULT), a world's own
 *   --spring-expressive in tokens.css does not pass springRules in that world, or springRules lets Flat
 *   past 0.28, any other world past 0.12, or any world bounce on the responsive tier.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const tokens = fs.readFileSync(path.join(root, "..", "skills", "litt-md", "assets", "tokens.css"), "utf8");
const checkMjs = fs.readFileSync(path.join(root, "..", "skills", "litt-md", "scripts", "check.mjs"), "utf8");

/* rules.ts imports spring.ts and tokens.ts, so it runs bundled. esbuild comes with Vite. */
const bundle = await build({ entryPoints: [path.join(root, "src", "motion", "rules.ts")], bundle: true, format: "esm", platform: "neutral", write: false, logLevel: "silent" });
const R = await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString("base64")}`);

const rootBlock = /:root\s*\{([\s\S]*?)\n\}/.exec(tokens)?.[1] ?? "";
const px = (name) => Number(new RegExp(`(?<![\\w-])${name}\\s*:\\s*(\\d+)px\\s*;`).exec(rootBlock)?.[1]);
const spaces = [...rootBlock.matchAll(/(?<![\w-])(--space-\d+)\s*:\s*(\d+)px\s*;/g)].map((m) => [Number(m[2]), m[1]]);
const [control, surface, pill] = [px("--radius-control"), px("--radius-surface"), px("--radius-pill")];

const problems = [];
const passed = [];
const check = (ok, claim) => (ok ? passed : problems).push(claim);
const words = (pairs) => pairs.map(([v, n]) => `${n} ${v}px`).join(", ");

check(spaces.length > 0 && control > 0 && surface > 0 && pill > 0, `tokens.css declares the spacing scale and the three radii (${spaces.length} steps, ${control}px, ${surface}px, ${pill}px)`);
check(JSON.stringify(R.SPACE_SCALE) === JSON.stringify(spaces), `SPACE_SCALE is tokens.css's scale: ${words(R.SPACE_SCALE)} (tokens.css: ${words(spaces)})`);
check(R.RADIUS_PILL === pill, `RADIUS_PILL is --radius-pill: ${R.RADIUS_PILL}px (tokens.css: ${pill}px)`);
check(R.LIMITS.control === control, `LIMITS.control is --radius-control: ${R.LIMITS.control}px (tokens.css: ${control}px)`);

for (const corner of [0, control, surface, pill]) check(R.cornerRule(corner, "Corner").ok, `cornerRule fits ${corner}px`);
/* check.mjs: there are no other radii, "no 6, 12 or 16". */
for (const corner of [2, 6, 12, 16, 24]) check(!R.cornerRule(corner, "Corner").ok, `cornerRule turns down ${corner}px`);
check(R.cornerRule(pill, "Corner").text === `Corner on litt's corners, 0, ${control}px, ${surface}px or the pill: the pill`, `cornerRule says the pill in words: "${R.cornerRule(pill, "Corner").text}"`);

/* R9's exception: Device's em radii, read from Device's block in tokens.css. */
const devBlock = /:root\[data-material="device"\],\s*\[data-material="device"\]\s*\{(?=\s*--canvas)([\s\S]*?)\n\}/.exec(tokens)?.[1] ?? "";
const devEm = Object.fromEntries([...devBlock.matchAll(/--radius-(plate|well|key|chip)\s*:\s*([\d.]+)em\s*;/g)].map((m) => [m[1], Number(m[2])]));
check(JSON.stringify(R.DEVICE_RADII_EM) === JSON.stringify(devEm), `DEVICE_RADII_EM is Device's block in tokens.css: ${JSON.stringify(R.DEVICE_RADII_EM)} (tokens.css: ${JSON.stringify(devEm)})`);
for (const [name, em] of Object.entries(R.DEVICE_RADII_EM)) {
  for (const size of [12, 14, 16]) {
    const corner = Math.round(em * size * 10) / 10;
    check(R.cornerRule(corner, "Corner", { world: "device", em: size }).ok, `cornerRule fits Device's ${name}, ${em}em at ${size}px (${corner}px)`);
    for (const world of ["press", "flat", "plain", "rack", "heat", undefined])
      if (![0, control, surface, pill].includes(corner)) check(!R.cornerRule(corner, "Corner", { world, em: size }).ok, `cornerRule turns down ${corner}px (Device's ${name} at ${size}px) in ${world ?? "no world"}`);
  }
}
for (const corner of [2, 6, 12, 16, 24]) check(!R.cornerRule(corner, "Corner", { world: "device", em: 13 }).ok || Object.values(R.DEVICE_RADII_EM).some((e) => Math.abs(e * 13 - corner) <= 0.5), `cornerRule under Device still turns down ${corner}px at 13px`);
check(!R.cornerRule(14, "Corner", { world: "device", em: 14 }).ok, "cornerRule under Device turns down 1em (14px at 14px), past its four");

for (const [step] of spaces) check(R.spaceRule(step, "Gap").ok, `spaceRule fits ${step}px`);
check(R.spaceRule(0, "Gap").ok, "spaceRule fits no space at all");
/* foundations.md, Scale: off-scale values (20, 28, 36, 40 as spacing) fail R9. */
for (const off of [20, 28, 36, 40, 2, 200]) check(!R.spaceRule(off, "Gap").ok, `spaceRule turns down ${off}px`);
check(R.spaceRule(20, "Padding").text === "Padding on the spacing scale: 20px, use 16px or 24px", `spaceRule names both steps beside 20px: "${R.spaceRule(20, "Padding").text}"`);
check(R.spaceRule(200, "Gap").text === "Gap on the spacing scale: 200px, use 160px", `spaceRule names the last step past the scale: "${R.spaceRule(200, "Gap").text}"`);

/* R4's bounce cap, per world: rules.ts and check.mjs say the same, and tokens.css keeps to it. */
const capSrc = /const BOUNCE_CAP = (\{[^}]*\}), BOUNCE_DEFAULT = ([\d.]+);/.exec(checkMjs);
const caps = capSrc ? Function(`return ${capSrc[1]}`)() : null;
const fallback = capSrc ? Number(capSrc[2]) : NaN;
check(!!caps, "check.mjs declares BOUNCE_CAP and BOUNCE_DEFAULT");
const worlds = Object.keys(R.EXPRESSIVE_BOUNCE);
for (const w of worlds) {
  const want = caps?.[w] ?? fallback;
  check(R.EXPRESSIVE_BOUNCE[w] === want, `EXPRESSIVE_BOUNCE.${w} is check.mjs's cap: ${R.EXPRESSIVE_BOUNCE[w]} (check.mjs: ${want})`);
}
for (const w of Object.keys(caps ?? {})) check(w in R.EXPRESSIVE_BOUNCE, `check.mjs's BOUNCE_CAP.${w} is a world in rules.ts`);
const springOf = (block) => {
  const m = /(?<![\w-])--spring-expressive\s*:\s*(\d+)ms\s+([\d.]+)\s*;/.exec(block);
  return m ? { time: Number(m[1]) / 1000, bounce: Number(m[2]) } : null;
};
const rootSpring = springOf(rootBlock);
for (const w of worlds) {
  const own = new RegExp(`:root\\[data-material="${w}"\\],\\s*\\[data-material="${w}"\\]\\s*\\{([^}]*)\\}`).exec(tokens)?.[1];
  const spring = (own && springOf(own)) ?? rootSpring;
  const rows = R.springRules(spring, "expressive", w);
  check(rows.every((r) => r.ok), `${w}'s expressive spring in tokens.css passes springRules in ${w}: ${spring.time * 1000}ms ${spring.bounce} (${rows.filter((r) => !r.ok).map((r) => r.text).join("; ") || "all fit"})`);
}
const bounces = (w, bounce, tier = "expressive") => R.springRules({ time: 0.35, bounce }, tier, w).at(-1).ok;
check(bounces("flat", 0.28), "springRules lets Flat bounce 0.28");
check(!bounces("flat", 0.3), "springRules turns down Flat at 0.3");
check(!bounces("press", 0.2), "springRules turns down Press at 0.2");
for (const w of worlds.filter((w) => w !== "flat")) check(bounces(w, 0.12) && !bounces(w, 0.13), `springRules holds ${w} at 0.12`);
for (const w of worlds) check(!bounces(w, 0.08, "responsive"), `springRules turns down a responsive bounce in ${w}`);
check(R.springRules({ time: 0.35, bounce: 0.3 }, "expressive", "flat").at(-1).text === "Bounce at most 0.28: 0.3", `springRules says Flat's cap in words: "${R.springRules({ time: 0.35, bounce: 0.3 }, "expressive", "flat").at(-1).text}"`);

for (const p of passed) console.log(`✓ ${p}`);
if (problems.length) {
  for (const p of problems) console.error(`✗ ${p}`);
  console.error(`\nrules: ${problems.length} problem${problems.length === 1 ? "" : "s"}.`);
  process.exit(1);
}
console.log(`\nrules: ${passed.length} claims hold.`);

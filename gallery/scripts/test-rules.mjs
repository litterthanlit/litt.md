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
 * - spaceRule turns down a step of the scale, or accepts a value foundations.md calls off the scale,
 *   or names the wrong steps beside it.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const tokens = fs.readFileSync(path.join(root, "..", "skills", "litt-md", "assets", "tokens.css"), "utf8");

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

for (const [step] of spaces) check(R.spaceRule(step, "Gap").ok, `spaceRule fits ${step}px`);
check(R.spaceRule(0, "Gap").ok, "spaceRule fits no space at all");
/* foundations.md, Scale: off-scale values (20, 28, 36, 40 as spacing) fail R9. */
for (const off of [20, 28, 36, 40, 2, 200]) check(!R.spaceRule(off, "Gap").ok, `spaceRule turns down ${off}px`);
check(R.spaceRule(20, "Padding").text === "Padding on the spacing scale: 20px, use 16px or 24px", `spaceRule names both steps beside 20px: "${R.spaceRule(20, "Padding").text}"`);
check(R.spaceRule(200, "Gap").text === "Gap on the spacing scale: 200px, use 160px", `spaceRule names the last step past the scale: "${R.spaceRule(200, "Gap").text}"`);

for (const p of passed) console.log(`✓ ${p}`);
if (problems.length) {
  for (const p of problems) console.error(`✗ ${p}`);
  console.error(`\nrules: ${problems.length} problem${problems.length === 1 ? "" : "s"}.`);
  process.exit(1);
}
console.log(`\nrules: ${passed.length} claims hold.`);

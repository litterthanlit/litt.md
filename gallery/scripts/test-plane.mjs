#!/usr/bin/env node
/**
 * The 3D plane projection math in src/canvas/plane.ts under Node, with no browser or DOMMatrix (plans/026).
 *
 *   npm run test:plane
 *
 * Verifies round-trip accuracy (project -> unproject within 0.5px, and in fact machine precision) across:
 * - 0° flat (Step In settled)
 * - 35° and 52° isometric tilts with Z rotation under perspective
 * - exploded Z-offsets on the slider track stratum
 * - #canvas camera zoom levels (0.5, 1, 2) with fractional pan offsets and item translation
 * - CSS matrix() / matrix3d() parsing and degenerate edge-on plane handling
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const bundle = await build({
  entryPoints: [path.join(root, "src", "canvas", "plane.ts")],
  bundle: true,
  format: "esm",
  platform: "neutral",
  write: false,
  logLevel: "silent",
});
const P = await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString("base64")}`);

const problems = [];
const passed = [];
const check = (ok, claim) => (ok ? passed : problems).push(claim);

const EPS = 0.5; // Plan 026 pass bar: within 0.5px

/** Builds a realistic #canvas -> item -> preview -> perspective stage -> tilted plate -> exploded track chain. */
function makeChain({ zoom, panX, panY, itemX, itemY, tiltX, tiltZ, perspectivePx, explodeZ }) {
  const plateTransform =
    tiltX === 0 && tiltZ === 0
      ? P.identity()
      : P.mul(P.rotateX(tiltX), P.rotateZ(tiltZ));
  const worldTransform = P.mul(P.translate(panX, panY, 0), P.scale(zoom, zoom, 1));
  return [
    /* 0: slider track (leaf), possibly lifted along Z in Explode mode */
    {
      offsetX: 28,
      offsetY: 112,
      originX: 120,
      originY: 22,
      transform: explodeZ ? P.translate(0, 0, explodeZ) : P.identity(),
    },
    /* 1: Device plate, tilted in Room mode or identity in Step In */
    {
      offsetX: 120,
      offsetY: 96,
      originX: 160,
      originY: 110,
      transform: plateTransform,
    },
    /* 2: perspective stage (applies perspective to its children) */
    {
      offsetX: 24,
      offsetY: 24,
      originX: 280,
      originY: 200,
      transform: P.identity(),
      perspective: perspectivePx,
      perspectiveOriginX: 280,
      perspectiveOriginY: 200,
    },
    /* 3: [data-canvas-item] translated to item position */
    {
      offsetX: 0,
      offsetY: 0,
      originX: 0,
      originY: 0,
      transform: P.translate(itemX, itemY, 0),
    },
    /* 4: #canvas world camera: translate3d(panX, panY, 0) scale(zoom) */
    {
      offsetX: 0,
      offsetY: 0,
      originX: 0,
      originY: 0,
      transform: worldTransform,
    },
  ];
}

const scenarios = [
  { name: "0° flat, zoom 1", zoom: 1, panX: 48, panY: 96, itemX: 0, itemY: 0, tiltX: 0, tiltZ: 0, perspectivePx: 0, explodeZ: 0 },
  { name: "0° flat, zoom 0.5, fractional pan", zoom: 0.5, panX: 137.4, panY: -82.6, itemX: 420, itemY: 180, tiltX: 0, tiltZ: 0, perspectivePx: 0, explodeZ: 0 },
  { name: "0° flat, zoom 2, fractional pan", zoom: 2, panX: -210.25, panY: 64.75, itemX: 120, itemY: 40, tiltX: 0, tiltZ: 0, perspectivePx: 0, explodeZ: 0 },
  { name: "35° isometric, zoom 1", zoom: 1, panX: 48, panY: 96, itemX: 0, itemY: 0, tiltX: 35, tiltZ: -25, perspectivePx: 1100, explodeZ: 0 },
  { name: "35° isometric, zoom 0.5, fractional pan", zoom: 0.5, panX: 215.3, panY: -44.7, itemX: 800, itemY: 320, tiltX: 35, tiltZ: -25, perspectivePx: 1100, explodeZ: 0 },
  { name: "35° isometric, zoom 2, fractional pan", zoom: 2, panX: -312.8, panY: 118.2, itemX: 240, itemY: 90, tiltX: 35, tiltZ: -25, perspectivePx: 1100, explodeZ: 0 },
  { name: "52° steep isometric + exploded Z=42px, zoom 1", zoom: 1, panX: 48, panY: 96, itemX: 0, itemY: 0, tiltX: 52, tiltZ: -35, perspectivePx: 1000, explodeZ: 42 },
  { name: "52° steep isometric + exploded Z=64px, zoom 0.5", zoom: 0.5, panX: -94.6, panY: 188.3, itemX: 600, itemY: 200, tiltX: 52, tiltZ: -35, perspectivePx: 1000, explodeZ: 64 },
  { name: "52° steep isometric + exploded Z=64px, zoom 2", zoom: 2, panX: 512.1, panY: -240.9, itemX: 160, itemY: 140, tiltX: 52, tiltZ: -35, perspectivePx: 1000, explodeZ: 64 },
];

const samplePoints = [
  [0, 22],
  [40, 22],
  [120, 22],
  [200, 22],
  [240, 22],
  [120, 0],
  [120, 44],
];

for (const s of scenarios) {
  const m = P.composeChain(makeChain(s));
  let maxErr = 0;
  let allResolved = true;
  for (const [u, v] of samplePoints) {
    const screen = P.projectPoint(m, u, v, 0);
    if (!screen) {
      allResolved = false;
      continue;
    }
    const back = P.unprojectToPlane(m, screen.x, screen.y);
    if (!back) {
      allResolved = false;
      continue;
    }
    maxErr = Math.max(maxErr, Math.hypot(back.u - u, back.v - v));
  }
  check(allResolved && maxErr <= EPS, `${s.name}: round-trip error ${maxErr.toExponential(2)}px <= ${EPS}px`);
}

/* CSS transform parsing */
const m2 = P.parseCssTransform("matrix(2, 0, 0, 2, 137.5, -42.25)");
const p2 = P.projectPoint(m2, 10, 20, 0);
check(p2 && Math.abs(p2.x - 157.5) < 1e-6 && Math.abs(p2.y - -2.25) < 1e-6, "parseCssTransform handles 2D matrix()");

const m3Expected = P.mul(P.translate(12, 34, 56), P.rotateX(35));
const m3 = P.parseCssTransform(`matrix3d(${m3Expected.join(", ")})`);
const p3a = P.projectPoint(m3Expected, 50, 15, 0);
const p3b = P.projectPoint(m3, 50, 15, 0);
check(p3a && p3b && Math.hypot(p3a.x - p3b.x, p3a.y - p3b.y) < 1e-6, "parseCssTransform handles 3D matrix3d()");

check(JSON.stringify(P.parseCssTransform("none")) === JSON.stringify(P.identity()), "parseCssTransform('none') returns identity");

/* Degenerate edge-on plane (rotateX 90deg -> local plane collapses to a horizontal line) returns null cleanly */
const edgeOn = P.rotateX(90);
check(P.unprojectToPlane(edgeOn, 100, 100) === null, "unprojectToPlane returns null for a degenerate 90° edge-on plane");

if (problems.length) {
  console.error(`test-plane: ${problems.length} failed, ${passed.length} passed`);
  for (const p of problems) console.error(`  ✗ ${p}`);
  process.exit(1);
}
console.log(`test-plane: ${passed.length} checks passed`);

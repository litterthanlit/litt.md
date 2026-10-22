/**
 * The canvas's saved layout: the camera and where each item was moved, keyed by registry id. Nothing else. Membership,
 * names and sizes come from the registry in source, and the theme from the gallery's own preference.
 *
 * A small versioned document under one key. Anything malformed, stale or out of bounds is dropped, and storage that is
 * off or full never breaks the canvas.
 */
import { bounded, boundPoint, finite, type Camera } from "./camera";

const KEY = "litt-gallery:canvas:playful";
const VERSION = 1;
/** A layout bigger than this is not one the canvas wrote. */
const MAX_BYTES = 32_000;
const MAX_ITEMS = 400;
const ID = /^[a-z0-9-]{1,64}$/;

export type Point = { x: number; y: number };
export type Layout = { camera: Camera | null; positions: Record<string, Point> };

export function loadLayout(ids: ReadonlySet<string>): Layout {
  const empty: Layout = { camera: null, positions: {} };
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(KEY);
  } catch {
    return empty;
  }
  if (!raw || raw.length > MAX_BYTES) return empty;
  let doc: unknown;
  try {
    doc = JSON.parse(raw);
  } catch {
    return empty;
  }
  if (!doc || typeof doc !== "object" || (doc as { v?: unknown }).v !== VERSION) return empty;
  const { camera, positions } = doc as { camera?: unknown; positions?: unknown };

  let cam: Camera | null = null;
  if (camera && typeof camera === "object") {
    const c = camera as Record<string, unknown>;
    if (finite(c.x) && finite(c.y) && finite(c.z)) cam = bounded({ x: c.x, y: c.y, z: c.z });
  }
  const out: Record<string, Point> = {};
  if (positions && typeof positions === "object" && !Array.isArray(positions)) {
    let n = 0;
    for (const [id, p] of Object.entries(positions as Record<string, unknown>)) {
      if (++n > MAX_ITEMS) break;
      /* Stale ids (an item removed from the registry) are ignored, never resurrected. */
      if (!ID.test(id) || !ids.has(id) || !p || typeof p !== "object") continue;
      const { x, y } = p as Record<string, unknown>;
      if (finite(x) && finite(y)) out[id] = { x: boundPoint(x), y: boundPoint(y) };
    }
  }
  return { camera: cam, positions: out };
}

export function saveLayout(layout: Layout) {
  const positions: Record<string, Point> = {};
  for (const [id, p] of Object.entries(layout.positions)) if (ID.test(id)) positions[id] = { x: boundPoint(p.x), y: boundPoint(p.y) };
  const camera = layout.camera ? bounded(layout.camera) : null;
  try {
    localStorage.setItem(KEY, JSON.stringify({ v: VERSION, camera, positions }));
  } catch {
    /* Storage is off or full: the layout holds for this visit. */
  }
}

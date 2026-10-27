/**
 * The canvas's saved layout: the camera and each item's position, by registry id. Nothing else is saved: membership,
 * names, sizes and content live in source (registry.tsx), and the theme is the gallery's own preference.
 *
 * A small versioned document under one key. Anything malformed, out of bounds or for an id the registry no longer has
 * is dropped, and storage that is missing or full never breaks the canvas.
 */

export type Point = { x: number; y: number };
export type Camera = { x: number; y: number; z: number };
export type Layout = { camera: Camera | null; positions: Record<string, Point> };

const KEY = "litt-gallery:canvas:language";
const VERSION = 1;
/** Bounds for anything read back or written: a camera or item further out than this is a bug, not a layout. */
export const LIMIT = 100_000;
export const Z_MIN = 0.1;
export const Z_MAX = 4;
const MAX_BYTES = 64 * 1024;

const finite = (n: unknown): n is number => typeof n === "number" && Number.isFinite(n) && Math.abs(n) <= LIMIT;

export function validCamera(c: unknown): Camera | null {
  if (!c || typeof c !== "object") return null;
  const { x, y, z } = c as Record<string, unknown>;
  if (!finite(x) || !finite(y) || typeof z !== "number" || !Number.isFinite(z) || z < Z_MIN || z > Z_MAX) return null;
  return { x, y, z };
}

/** The saved layout, kept only for ids the registry has now. */
export function loadLayout(ids: readonly string[]): Layout {
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
  const known = new Set(ids);
  const positions: Record<string, Point> = {};
  const saved = (doc as { positions?: unknown }).positions;
  if (saved && typeof saved === "object") {
    for (const [id, p] of Object.entries(saved as Record<string, unknown>)) {
      if (!known.has(id) || !p || typeof p !== "object") continue;
      const { x, y } = p as Record<string, unknown>;
      if (finite(x) && finite(y)) positions[id] = { x, y };
    }
  }
  return { camera: validCamera((doc as { camera?: unknown }).camera), positions };
}

export function saveLayout(layout: Layout) {
  try {
    const doc = JSON.stringify({ v: VERSION, camera: layout.camera, positions: layout.positions });
    if (doc.length <= MAX_BYTES) localStorage.setItem(KEY, doc);
  } catch {
    /* storage can be unavailable or full; the layout still holds until the page reloads */
  }
}

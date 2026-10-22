/**
 * The canvas camera: pure math, no DOM. The world is drawn with `translate(x, y) scale(z)`, so a world point p sits on
 * screen at p * z + (x, y). Every value is finite and bounded, so a stored or computed camera can never run away.
 */

export type Camera = { x: number; y: number; z: number };
export type Box = { x: number; y: number; width: number; height: number };

export const MIN_ZOOM = 0.1;
export const MAX_ZOOM = 3;
/** How far the camera or an item may sit from the origin, in px. */
export const MAX_OFFSET = 50_000;
export const HOME: Camera = { x: 48, y: 96, z: 1 };

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
export const finite = (n: unknown): n is number => typeof n === "number" && Number.isFinite(n);

export function bounded(c: Camera): Camera {
  return {
    x: clamp(finite(c.x) ? c.x : HOME.x, -MAX_OFFSET, MAX_OFFSET),
    y: clamp(finite(c.y) ? c.y : HOME.y, -MAX_OFFSET, MAX_OFFSET),
    z: clamp(finite(c.z) ? c.z : HOME.z, MIN_ZOOM, MAX_ZOOM),
  };
}

export const boundPoint = (n: number) => clamp(Math.round(n), -MAX_OFFSET, MAX_OFFSET);

/** Zooms to `z`, keeping the screen point (sx, sy) over the same world point. */
export function zoomAt(c: Camera, z: number, sx: number, sy: number): Camera {
  const next = clamp(z, MIN_ZOOM, MAX_ZOOM);
  const wx = (sx - c.x) / c.z;
  const wy = (sy - c.y) / c.z;
  return bounded({ x: sx - wx * next, y: sy - wy * next, z: next });
}

/** The camera that shows `box` whole inside a viewport of `w` by `h`, with `pad` px to spare, never zoomed past 1. */
export function fit(box: Box, w: number, h: number, pad = 48): Camera {
  if (box.width <= 0 || box.height <= 0 || w <= 0 || h <= 0) return HOME;
  const z = clamp(Math.min((w - pad * 2) / box.width, (h - pad * 2) / box.height, 1), MIN_ZOOM, MAX_ZOOM);
  return bounded({ x: (w - box.width * z) / 2 - box.x * z, y: (h - box.height * z) / 2 - box.y * z, z });
}

/** The camera moved just enough that `box` (in world space) is in view, with `pad` px to spare. */
export function reveal(c: Camera, box: Box, w: number, h: number, pad = 32): Camera {
  const left = box.x * c.z + c.x;
  const top = box.y * c.z + c.y;
  const right = left + box.width * c.z;
  const bottom = top + box.height * c.z;
  let dx = 0;
  let dy = 0;
  if (left < pad) dx = pad - left;
  else if (right > w - pad) dx = Math.max(w - pad - right, pad - left);
  if (top < pad) dy = pad - top;
  else if (bottom > h - pad) dy = Math.max(h - pad - bottom, pad - top);
  return dx || dy ? bounded({ ...c, x: c.x + dx, y: c.y + dy }) : c;
}

export function union(boxes: Box[]): Box {
  if (!boxes.length) return { x: 0, y: 0, width: 0, height: 0 };
  const x = Math.min(...boxes.map((b) => b.x));
  const y = Math.min(...boxes.map((b) => b.y));
  const right = Math.max(...boxes.map((b) => b.x + b.width));
  const bottom = Math.max(...boxes.map((b) => b.y + b.height));
  return { x, y, width: right - x, height: bottom - y };
}

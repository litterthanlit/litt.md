/**
 * Pure 4x4 projective matrix math and full-chain DOM plane projection for the Device Room prototype (plans/026).
 *
 * Everything in the math core runs on plain 16-element number arrays (column-major, matching CSS matrix3d order) with
 * zero DOM or DOMMatrix dependency, so `gallery/scripts/test-plane.mjs` verifies it directly in Node.
 *
 * When a pointer drags a slider sitting on a tilted, extruded or exploded 3D plane inside `#canvas` (which also wraps
 * every item in `translate3d(x, y, 0) scale(z)`), `unprojectToPlane(M, sx, sy)` inverts the exact 3x3 homography of
 * the element's local z=0 plane through the full accumulated ancestor chain — keeping drag 1:1 with the hand at any
 * tilt, Z-offset, pan or zoom.
 */

/** Column-major 4x4 matrix (m[col * 4 + row]), matching CSS `matrix3d(m0..m15)`. */
export type Mat4 = readonly [
  number, number, number, number,
  number, number, number, number,
  number, number, number, number,
  number, number, number, number,
];

export type TransformStep = {
  /** Layout offset of this element's border-box top-left inside its parent's border-box, scroll included. */
  offsetX: number;
  offsetY: number;
  /** Computed transform-origin in px. */
  originX: number;
  originY: number;
  originZ?: number;
  /** Computed 4x4 transform matrix of this element. */
  transform: Mat4;
  /** Computed CSS perspective on this element (applies to children, not itself). 0 or undefined = none. */
  perspective?: number;
  perspectiveOriginX?: number;
  perspectiveOriginY?: number;
};

export const identity = (): Mat4 => [
  1, 0, 0, 0,
  0, 1, 0, 0,
  0, 0, 1, 0,
  0, 0, 0, 1,
];

export function mul(a: Mat4, b: Mat4): Mat4 {
  const out = new Array<number>(16);
  for (let col = 0; col < 4; col++) {
    const b0 = b[col * 4];
    const b1 = b[col * 4 + 1];
    const b2 = b[col * 4 + 2];
    const b3 = b[col * 4 + 3];
    for (let row = 0; row < 4; row++) {
      out[col * 4 + row] =
        a[row] * b0 +
        a[4 + row] * b1 +
        a[8 + row] * b2 +
        a[12 + row] * b3;
    }
  }
  return out as unknown as Mat4;
}

export const translate = (x: number, y: number, z = 0): Mat4 => [
  1, 0, 0, 0,
  0, 1, 0, 0,
  0, 0, 1, 0,
  x, y, z, 1,
];

export const scale = (sx: number, sy = sx, sz = 1): Mat4 => [
  sx, 0, 0, 0,
  0, sy, 0, 0,
  0, 0, sz, 0,
  0, 0, 0, 1,
];

const DEG = Math.PI / 180;

export function rotateX(deg: number): Mat4 {
  const c = Math.cos(deg * DEG);
  const s = Math.sin(deg * DEG);
  return [
    1, 0, 0, 0,
    0, c, s, 0,
    0, -s, c, 0,
    0, 0, 0, 1,
  ];
}

export function rotateY(deg: number): Mat4 {
  const c = Math.cos(deg * DEG);
  const s = Math.sin(deg * DEG);
  return [
    c, 0, -s, 0,
    0, 1, 0, 0,
    s, 0, c, 0,
    0, 0, 0, 1,
  ];
}

export function rotateZ(deg: number): Mat4 {
  const c = Math.cos(deg * DEG);
  const s = Math.sin(deg * DEG);
  return [
    c, s, 0, 0,
    -s, c, 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1,
  ];
}

/** CSS `perspective(d)`: projects (x, y, z) by dividing by (1 - z/d). */
export function perspective(d: number): Mat4 {
  if (!Number.isFinite(d) || d <= 0) return identity();
  return [
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, -1 / d,
    0, 0, 0, 1,
  ];
}

/** Applies `matrix` around the 3D pivot (ox, oy, oz). */
export function aroundOrigin(matrix: Mat4, ox: number, oy: number, oz = 0): Mat4 {
  if (ox === 0 && oy === 0 && oz === 0) return matrix;
  return mul(translate(ox, oy, oz), mul(matrix, translate(-ox, -oy, -oz)));
}

/** Parses CSS `getComputedStyle(el).transform` (`none`, `matrix(...)`, or `matrix3d(...)`) into a Mat4. */
export function parseCssTransform(value: string): Mat4 {
  if (!value || value === "none") return identity();
  const m3 = /^matrix3d\(([^)]+)\)$/.exec(value.trim());
  if (m3) {
    const nums = m3[1].split(",").map((s) => parseFloat(s.trim()));
    if (nums.length === 16 && nums.every(Number.isFinite)) return nums as unknown as Mat4;
    return identity();
  }
  const m2 = /^matrix\(([^)]+)\)$/.exec(value.trim());
  if (m2) {
    const n = m2[1].split(",").map((s) => parseFloat(s.trim()));
    if (n.length === 6 && n.every(Number.isFinite)) {
      return [
        n[0], n[1], 0, 0,
        n[2], n[3], 0, 0,
        0, 0, 1, 0,
        n[4], n[5], 0, 1,
      ];
    }
  }
  return identity();
}

/**
 * Composes an ancestor chain ordered from leaf (`steps[0]`) to viewport root (`steps[n - 1]`) following CSS
 * Transforms Level 2: each parent's perspective applies to its children's coordinates before the parent's own transform.
 */
export function composeChain(steps: readonly TransformStep[]): Mat4 {
  let m = identity();
  for (let i = 0; i < steps.length; i++) {
    const s = steps[i];
    if (i > 0 && s.perspective && s.perspective > 0) {
      const p = aroundOrigin(perspective(s.perspective), s.perspectiveOriginX ?? 0, s.perspectiveOriginY ?? 0, 0);
      m = mul(p, m);
    }
    const t = aroundOrigin(s.transform, s.originX, s.originY, s.originZ ?? 0);
    m = mul(t, m);
    if (s.offsetX !== 0 || s.offsetY !== 0) {
      m = mul(translate(s.offsetX, s.offsetY, 0), m);
    }
  }
  return m;
}

/** Projects a point (u, v, z) in the leaf element's local coordinate space to viewport (x, y). */
export function projectPoint(m: Mat4, u: number, v: number, z = 0): { x: number; y: number; w: number } | null {
  const x = m[0] * u + m[4] * v + m[8] * z + m[12];
  const y = m[1] * u + m[5] * v + m[9] * z + m[13];
  const w = m[3] * u + m[7] * v + m[11] * z + m[15];
  if (Math.abs(w) < 1e-9) return null;
  return { x: x / w, y: y / w, w };
}

/**
 * Inverts the 3x3 projective homography of the element's local z=0 plane (`[u, v, 1] -> [X, Y, W]`), returning the
 * exact local (u, v) coordinates hit by the camera ray through viewport (sx, sy).
 */
export function unprojectToPlane(m: Mat4, sx: number, sy: number): { u: number; v: number } | null {
  const a = m[0], b = m[4], c = m[12];
  const d = m[1], e = m[5], f = m[13];
  const g = m[3], h = m[7], i = m[15];

  const A = e * i - f * h;
  const B = -(d * i - f * g);
  const C = d * h - e * g;
  const D = -(b * i - c * h);
  const E = a * i - c * g;
  const F = -(a * h - b * g);
  const G = b * f - c * e;
  const H = -(a * f - c * d);
  const I = a * e - b * d;

  const det = a * A + b * B + c * C;
  if (Math.abs(det) < 1e-12) return null;

  const uPrime = A * sx + D * sy + G;
  const vPrime = B * sx + E * sy + H;
  const wPrime = C * sx + F * sy + I;
  if (Math.abs(wPrime) < 1e-12) return null;

  return { u: uPrime / wPrime, v: vPrime / wPrime };
}

function parsePxPair(value: string): [number, number, number] {
  const parts = value.trim().split(/\s+/).map((p) => parseFloat(p));
  return [
    Number.isFinite(parts[0]) ? parts[0] : 0,
    Number.isFinite(parts[1]) ? parts[1] : 0,
    Number.isFinite(parts[2]) ? parts[2] : 0,
  ];
}

/**
 * Walks the live DOM from `el` up to the viewport, accumulating every layout offset, transform, transform-origin,
 * perspective and perspective-origin (including `#canvas`'s world `translate3d(...) scale(z)`) into one Mat4.
 */
export function elementToViewportMatrix(el: HTMLElement): Mat4 {
  const steps: TransformStep[] = [];
  let cur: HTMLElement | null = el;
  while (cur) {
    const cs = getComputedStyle(cur);
    const [originX, originY, originZ] = parsePxPair(cs.transformOrigin);
    const persp = cs.perspective && cs.perspective !== "none" ? parseFloat(cs.perspective) : 0;
    const [pOriginX, pOriginY] = parsePxPair(cs.perspectiveOrigin);
    const parent: HTMLElement | null = cur.parentElement;
    const isFixed = cs.position === "fixed";

    let offsetX = 0;
    let offsetY = 0;
    if (isFixed) {
      offsetX = cur.offsetLeft;
      offsetY = cur.offsetTop;
    } else if (parent) {
      if (cur.offsetParent === parent) {
        offsetX = cur.offsetLeft + parent.clientLeft - parent.scrollLeft;
        offsetY = cur.offsetTop + parent.clientTop - parent.scrollTop;
      } else if (cur.offsetParent === parent.offsetParent) {
        offsetX = cur.offsetLeft - parent.offsetLeft - parent.scrollLeft;
        offsetY = cur.offsetTop - parent.offsetTop - parent.scrollTop;
      } else {
        offsetX = cur.offsetLeft - parent.scrollLeft;
        offsetY = cur.offsetTop - parent.scrollTop;
      }
    } else {
      offsetX = -window.scrollX;
      offsetY = -window.scrollY;
    }

    steps.push({
      offsetX,
      offsetY,
      originX,
      originY,
      originZ,
      transform: parseCssTransform(cs.transform),
      perspective: Number.isFinite(persp) && persp > 0 ? persp : 0,
      perspectiveOriginX: pOriginX,
      perspectiveOriginY: pOriginY,
    });

    if (isFixed) break;
    cur = parent;
  }
  return composeChain(steps);
}

/** Projects a viewport pointer (clientX, clientY) directly onto `el`'s local plane (u, v) in local px. */
export function projectClientToElement(el: HTMLElement, clientX: number, clientY: number): { u: number; v: number } | null {
  return unprojectToPlane(elementToViewportMatrix(el), clientX, clientY);
}

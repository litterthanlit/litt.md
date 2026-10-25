/**
 * Avatar: a round mark for a person, a client or a company, and AvatarGroup, a stack of them.
 *
 * - Shape (components.md, Avatar): a circle at rounded-pill, one of the three things the pill is for.
 *   Three sizes: sm 24 (beside a tag, dense rows), md 32 (list rows, the default) and lg 44
 *   (a profile header). Initials are the sans at the text weight (400) at every size: caption at sm,
 *   small at md, body at lg, trimmed to the cap height so they sit in the middle of the circle.
 * - Content: a photo (`src`, object-cover) with an inset line hairline over it, so a white photo
 *   keeps its edge. With no photo, or when it fails to load, the initials of `name`: the first
 *   letter of the first two words, or one letter for one word. Leading characters that are not
 *   letters are skipped, so "@stripe.com" gives S.
 * - Art (`look`): instead of initials, a soft field drawn from the name under static grain, like a
 *   small photograph. `fluid` is warped noise from ink through the hue to cream; `film` is diagonal
 *   bands, pale, ink and the hue, with a streak of light on the hue's edge; `thermal` is a heat map
 *   smeared top to bottom, the hue's partner (warm against cool) for the cool parts and the hue for
 *   the hot ones. A seeded hash of the name places everything, so the same name draws the same mark
 *   every time and needs no state. The colors are litt's tokens, read from the light theme in both
 *   themes, so the picture is the same on a light and a dark page, as a photo is. It is drawn once per
 *   device pixel into a canvas (the grain is one screen pixel) and never moves (P5). Until it draws,
 *   the hue's tint shows. The initials stay in the box, invisible and hidden from assistive tech, so
 *   the avatar keeps the same text baseline either way.
 * - Color (P11, identity is data): the hue's tint as the fill, the initials in the hue's text
 *   tone, and an inset hairline of the hue at 24% under the top highlight. That is Tag's hue look
 *   exactly. `hue` sets it. Without one, a stable hash of the name picks one of the five in
 *   order, so the same name gets the same hue everywhere, with no state to keep. The hue is a
 *   nudge to the eye and not a key: two names can share one, so the name is always the identifier.
 *   `neutral` is a surface-2 fill, fg-muted initials and a line hairline.
 * - Semantics: initials are a `role="img"` named by the name. A photo is an <img> with the name as
 *   its alt. When the name is written beside the avatar, `decorative` hides it from assistive
 *   tech, so the name is not read twice.
 * - AvatarGroup: a labelled group that shows the first `max` and then a "+N" pill. The avatars
 *   overlap by a quarter of their size, the first on top, each with a 2px ring in the surface the
 *   group sits on, drawn as a zero-offset spread shadow (never a border, which would move the box).
 *   The next avatar and its ring cover the left of each one after the first, so their initials are
 *   centered in the part that shows (a --cover padding), and a letter is never cut.
 * - Static: no hover, no focus stop, no motion. Wrapping an avatar in a link or a button is the
 *   caller's job.
 */
import { Children, createContext, isValidElement, useContext, useLayoutEffect, useRef, useState, type HTMLAttributes, type ReactNode } from "react";

/** The five data hues in their fixed order (P11), and neutral for a mark with no identity color. */
export type AvatarHue = "blue" | "amber" | "teal" | "violet" | "rose" | "neutral";

/** What shows with no photo: the initials, or a picture drawn from the name. */
export type AvatarLook = "initials" | "fluid" | "film" | "thermal";

type Size = "sm" | "md" | "lg";
type Ring = "canvas" | "surface-1" | "surface-2";

/* Hue classes are literal strings, because Tailwind only generates what it can read. */
const FILL: Record<AvatarHue, string> = {
  blue: "bg-data-blue-tint text-data-blue-text",
  amber: "bg-data-amber-tint text-data-amber-text",
  teal: "bg-data-teal-tint text-data-teal-text",
  violet: "bg-data-violet-tint text-data-violet-text",
  rose: "bg-data-rose-tint text-data-rose-text",
  neutral: "bg-surface-2 text-fg-muted",
};

/* The edge sits on its own layer above the fill and any photo, so the ring a group draws on the
   root never competes with it for the one box-shadow. */
const EDGE: Record<AvatarHue, string> = {
  blue: "shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--data-blue)_24%,transparent),var(--highlight)]",
  amber: "shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--data-amber)_24%,transparent),var(--highlight)]",
  teal: "shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--data-teal)_24%,transparent),var(--highlight)]",
  violet: "shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--data-violet)_24%,transparent),var(--highlight)]",
  rose: "shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--data-rose)_24%,transparent),var(--highlight)]",
  neutral: "shadow-[inset_0_0_0_1px_var(--line)]",
};
const PHOTO_EDGE = "shadow-[inset_0_0_0_1px_var(--line)]";

const ORDER: AvatarHue[] = ["blue", "amber", "teal", "violet", "rose"];

const BOX: Record<Size, string> = { sm: "size-6", md: "size-8", lg: "size-11" };
const BOX_MIN: Record<Size, string> = { sm: "h-6 min-w-6", md: "h-8 min-w-8", lg: "h-11 min-w-11" };
const TEXT: Record<Size, string> = { sm: "text-caption", md: "text-small", lg: "text-body" };
/* A quarter of the size: 6, 8 and 11px. The next avatar and its 2px ring cover that much of the left of this
   one, so --cover says how much (8, 10 and 13px) and the initials are centered in what is left. */
const LAP: Record<Size, string> = {
  sm: "-ml-1.5 [--cover:8px]",
  md: "-ml-2 [--cover:10px]",
  lg: "-ml-[11px] [--cover:13px]",
};
const UNCOVER = "pl-[var(--cover,0px)]";

const RING: Record<Ring, string> = {
  canvas: "shadow-[0_0_0_2px_var(--canvas)]",
  "surface-1": "shadow-[0_0_0_2px_var(--surface-1)]",
  "surface-2": "shadow-[0_0_0_2px_var(--surface-2)]",
};

/** A 32-bit hash of a name: FNV-1a with a final mix. Case and outer spaces do not matter. */
function hashOf(name: string): number {
  let h = 2166136261;
  for (const ch of name.trim().toLowerCase()) {
    h ^= ch.codePointAt(0) ?? 0;
    h = Math.imul(h, 16777619);
  }
  h ^= h >>> 15;
  h = Math.imul(h, 2246822507);
  h ^= h >>> 13;
  return h >>> 0;
}

/** A stable hue for a name, so the five hues come out about evenly. */
function hueOf(name: string): AvatarHue {
  return ORDER[hashOf(name) % ORDER.length];
}

/* ------------------------------------------------------------------ the art */

type Lab = [number, number, number];
type Palette = { ink: Lab; cream: Lab; hue: Record<AvatarHue, Lab> };
type Stop = [number, Lab];

/* A contrasting partner for each hue, warm against cool, for thermal's cool parts. */
const PARTNER: Record<AvatarHue, AvatarHue> = { blue: "amber", amber: "violet", teal: "rose", violet: "teal", rose: "blue", neutral: "neutral" };

/** mulberry32: a small seeded generator, so a name always places its art the same way. */
function seeded(seed: number): () => number {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hash2(i: number, j: number, s: number): number {
  let h = (Math.imul(i, 374761393) + Math.imul(j, 668265263) + Math.imul(s, 362437)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}
/** Value noise, smoothly interpolated. */
function noise(x: number, y: number, s: number): number {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  const a = hash2(xi, yi, s);
  const b = hash2(xi + 1, yi, s);
  const c = hash2(xi, yi + 1, s);
  const d = hash2(xi + 1, yi + 1, s);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
/** Four octaves of noise, 0 to 1. */
function fbm(x: number, y: number, s: number): number {
  let t = 0;
  let amp = 0.5;
  let f = 1;
  for (let o = 0; o < 4; o++) {
    t += amp * noise(x * f, y * f, s + o * 101);
    f *= 2;
    amp *= 0.5;
  }
  return t / 0.9375;
}
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const smooth = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

/* sRGB and OKLab, so a blend between two colors stays clean instead of going grey in the middle. */
const toLin = (c: number) => ((c /= 255) <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const toSrgb = (c: number) => 255 * (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);
function labOf([r, g, b]: number[]): Lab {
  r = toLin(r);
  g = toLin(g);
  b = toLin(b);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}
function rgbOfLab([L, A, B]: Lab): Lab {
  const l = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3;
  const m = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3;
  const s = (L - 0.0894841775 * A - 1.291485548 * B) ** 3;
  return [
    toSrgb(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    toSrgb(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    toSrgb(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
  ];
}
const mixLab = (a: Lab, b: Lab, t: number): Lab => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
/** A gradient map: the color at t along the stops. */
function ramp(stops: Stop[], t: number): Lab {
  if (t <= stops[0][0]) return stops[0][1];
  for (let k = 1; k < stops.length; k++) {
    if (t <= stops[k][0]) return mixLab(stops[k - 1][1], stops[k][1], (t - stops[k - 1][0]) / (stops[k][0] - stops[k - 1][0]));
  }
  return stops[stops.length - 1][1];
}

/* The tokens the art is made of. Read once, from the light theme, so the picture is the same in both themes. */
let palette: Palette | null = null;
function paletteOf(): Palette {
  if (palette) return palette;
  const probe = document.createElement("span");
  probe.setAttribute("data-theme", "light");
  probe.style.cssText = "position:absolute;width:0;height:0;overflow:hidden";
  document.body.appendChild(probe);
  /* Any CSS color the token holds (hex, rgb, oklch) comes out as sRGB through a one-pixel canvas. */
  const pixel = document.createElement("canvas").getContext("2d", { willReadFrequently: true });
  const read = (token: string): Lab => {
    probe.style.color = `var(${token})`;
    if (!pixel) return labOf([0, 0, 0]);
    pixel.clearRect(0, 0, 1, 1);
    pixel.fillStyle = getComputedStyle(probe).color;
    pixel.fillRect(0, 0, 1, 1);
    const [r, g, b] = pixel.getImageData(0, 0, 1, 1).data;
    return labOf([r, g, b]);
  };
  const amber = read("--data-amber");
  const hue: Record<AvatarHue, Lab> = {
    blue: read("--data-blue"),
    amber,
    teal: read("--data-teal"),
    violet: read("--data-violet"),
    rose: read("--data-rose"),
    neutral: read("--line-control"),
  };
  palette = { ink: read("--fg"), cream: mixLab(read("--canvas"), amber, 0.18), hue };
  probe.remove();
  return palette;
}

type Art = {
  /** How strong the grain is, in OKLab lightness. */
  grain: number;
  /** The look for one name: its numbers, placed by the name's generator. */
  setup: (hue: AvatarHue, P: Palette, rand: () => number) => (u: number, v: number) => Lab;
};

/**
 * A field mapped through a gradient, balanced per name: the field is sampled inside the circle first, and its own 8th,
 * 50th and 92nd percentiles are moved to `anchors` on the gradient. So no seed comes out all ink or all cream: every
 * mark spans the gradient, with its middle where the anchors put it.
 */
function balanced(field: (u: number, v: number) => number, stops: Stop[], anchors: [number, number, number]): (u: number, v: number) => Lab {
  const n = 24;
  const values: number[] = [];
  for (let j = 0; j < n; j++) {
    for (let i = 0; i < n; i++) {
      const x = (i + 0.5) / n;
      const y = (j + 0.5) / n;
      if ((x - 0.5) ** 2 + (y - 0.5) ** 2 <= 0.25) values.push(field(x, y));
    }
  }
  values.sort((a, b) => a - b);
  const at = (q: number) => values[Math.min(values.length - 1, Math.floor(q * values.length))];
  const lo = at(0.08);
  const mid = at(0.5);
  const hi = at(0.92);
  const [a, b, c] = anchors;
  const place = (t: number) => (t < mid ? a + ((b - a) * (t - lo)) / Math.max(1e-6, mid - lo) : b + ((c - b) * (t - mid)) / Math.max(1e-6, hi - mid));
  return (u, v) => ramp(stops, clamp01(place(field(u, v))));
}

const ART: Record<Exclude<AvatarLook, "initials">, Art> = {
  /* Warped noise from ink through the hue to cream. One hue and the neutrals; the hue holds the middle. */
  fluid: {
    grain: 0.09,
    setup: (h, P, r) => {
      const ox = r() * 50;
      const oy = r() * 50;
      const s = Math.floor(r() * 1e6);
      const stops: Stop[] = [[0, P.ink], [0.3, mixLab(P.hue[h], P.ink, 0.6)], [0.52, P.hue[h]], [0.75, mixLab(P.hue[h], P.cream, 0.6)], [1, P.cream]];
      return balanced(
        (u, v) => {
          const x = u * 1.7 + ox;
          const y = v * 1.7 + oy;
          const wx = fbm(x, y, s);
          const wy = fbm(x + 5.2, y + 1.3, s + 7);
          return fbm(x + 2.2 * wx, y + 2.2 * wy, s + 13);
        },
        stops,
        [0.08, 0.52, 0.92],
      );
    },
  },
  /* Diagonal bands: a pale corner at the top, where the light is, then ink, then the hue with a streak of light along
     its edge, under a soft vignette. The name sets the angle, which side the pale corner is on and where the bands fall. */
  film: {
    grain: 0.07,
    setup: (h, P, r) => {
      const a = ((-0.75 + r() * 0.5) * Math.PI) / 2;
      const cos = Math.cos(a);
      const sin = Math.sin(a);
      const edge = -0.08 + r() * 0.24;
      const paleAt = edge - 0.22 - r() * 0.12;
      const s = Math.floor(r() * 1e6);
      const flip = r() < 0.5;
      const pale = mixLab(P.hue[h], P.cream, 0.6);
      return (u0, v) => {
        const u = flip ? 1 - u0 : u0;
        const d = (u - 0.5) * sin + (v - 0.5) * cos + 0.05 * (fbm(u * 3, v * 3, s) - 0.5);
        const hue = mixLab(P.hue[h], P.ink, 0.15 * smooth(0, 0.5, d - edge));
        let c = mixLab(pale, P.ink, smooth(paleAt - 0.1, paleAt + 0.1, d));
        c = mixLab(c, hue, smooth(edge - 0.08, edge + 0.08, d));
        const glint = Math.exp(-(((d - edge - 0.06) / 0.025) ** 2)) * (0.4 + 0.6 * fbm(u * 6, v * 6, s + 9));
        c = mixLab(c, P.cream, 0.75 * glint);
        const vignette = 1 - 0.25 * ((u - 0.5) ** 2 + (v - 0.5) ** 2);
        return [c[0] * vignette, c[1], c[2]];
      };
    },
  },
  /* A heat map smeared top to bottom: cream at the cold edges, the partner hue for the cool parts, the hue for the hot
     ones. Balanced, so both hues show in every mark. */
  thermal: {
    grain: 0.04,
    setup: (h, P, r) => {
      const ox = r() * 50;
      const oy = r() * 50;
      const s = Math.floor(r() * 1e6);
      const cool = P.hue[PARTNER[h]];
      const hot = P.hue[h];
      const stops: Stop[] = [
        [0, P.cream],
        [0.2, mixLab(cool, P.cream, 0.4)],
        [0.38, cool],
        [0.5, mixLab(cool, P.ink, 0.35)],
        [0.6, hot],
        [0.86, mixLab(hot, P.cream, 0.2)],
        [1, mixLab(hot, P.cream, 0.45)],
      ];
      return balanced(
        (u, v) => {
          const x = u * 2.6 + ox;
          const y = v * 0.55 + oy;
          const warp = fbm(x * 0.5, y * 2, s + 3);
          return fbm(x + 1.4 * warp, y, s);
        },
        stops,
        [0.14, 0.5, 0.9],
      );
    },
  },
};

/* Drawn pictures, by look, hue, name and pixel size, so a list that shows a name twice draws it once. */
const drawn = new Map<string, ImageData>();

/** The picture for a name, `w` device pixels across. */
function pictureOf(look: Exclude<AvatarLook, "initials">, hue: AvatarHue, name: string, w: number, ctx: CanvasRenderingContext2D): ImageData {
  const key = `${look}|${hue}|${w}|${name.trim().toLowerCase()}`;
  const hit = drawn.get(key);
  if (hit) return hit;
  const art = ART[look];
  const shade = art.setup(hue, paletteOf(), seeded(hashOf(name) ^ 0x51ed270b));
  const img = ctx.createImageData(w, w);
  const grainSeed = hashOf(name) & 0xffff;
  for (let j = 0; j < w; j++) {
    for (let i = 0; i < w; i++) {
      const lab = shade((i + 0.5) / w, (j + 0.5) / w);
      /* Grain: one screen pixel, static, the same for a name every time. */
      const g = (hash2(i, j, grainSeed) - 0.5) * 2 * art.grain;
      const [r, gg, b] = rgbOfLab([lab[0] + g, lab[1], lab[2]]);
      const o = (j * w + i) * 4;
      img.data[o] = r;
      img.data[o + 1] = gg;
      img.data[o + 2] = b;
      img.data[o + 3] = 255;
    }
  }
  if (drawn.size > 256) drawn.clear();
  drawn.set(key, img);
  return img;
}

/* The box in CSS pixels, for the canvas. */
const PX: Record<Size, number> = { sm: 24, md: 32, lg: 44 };

/** Paints the art into its canvas, once per name, look, hue and size. */
function AvatarArt({ name, look, hue, size }: { name: string; look: Exclude<AvatarLook, "initials">; hue: AvatarHue; size: Size }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const w = PX[size] * Math.max(1, Math.round(window.devicePixelRatio || 1));
    canvas.width = w;
    canvas.height = w;
    ctx.putImageData(pictureOf(look, hue, name, w, ctx), 0, 0);
  }, [name, look, hue, size]);
  return <canvas ref={ref} aria-hidden="true" className="absolute inset-0 size-full" />;
}

/** The first letter of the first two words that have one. "@stripe.com" is S and "Ines Duarte" is ID. */
function initialsOf(name: string): string {
  const out: string[] = [];
  for (const word of name.split(/\s+/)) {
    const letter = /\p{L}/u.exec(word)?.[0];
    if (letter) out.push(letter.toLocaleUpperCase());
    if (out.length === 2) break;
  }
  return out.join("");
}

/* A group sets the size of every avatar in it, so a child cannot disagree. */
const GroupContext = createContext<{ size: Size } | null>(null);

export type AvatarProps = Omit<HTMLAttributes<HTMLSpanElement>, "children"> & {
  /** Who or what it is, such as "Ines Duarte" or "Stripe". It makes the initials and the hue, and it names the avatar for a screen reader. */
  name: string;
  /** A photo or a logo. If it is missing or fails to load, the initials show instead. */
  src?: string;
  /** Sm is 24, md is 32 and lg is 44. Inside an AvatarGroup the group's size wins. */
  size?: Size;
  /** One of the five data hues, or neutral. Leave it out and the name picks one, the same one every time. */
  hue?: AvatarHue;
  /** What shows with no photo: the initials, or a picture drawn from the name in its hue, the same one every time. Fluid and film use the hue alone; thermal adds its partner. */
  look?: AvatarLook;
  /** Set it when the name is written beside the avatar: the avatar is hidden from screen readers so the name is not read twice. */
  decorative?: boolean;
  /** Extra classes for the avatar. */
  className?: string;
};

/** A round mark for a person, a client or a company: a photo, or initials (or a picture) in a data hue picked from the name. */
export function Avatar({ name, src, size = "md", hue, look = "initials", decorative = false, className = "", ...rest }: AvatarProps) {
  const group = useContext(GroupContext);
  const s = group?.size ?? size;
  const tone = hue ?? hueOf(name);
  /* A photo that failed stays failed until the address changes. */
  const [failed, setFailed] = useState<string | undefined>(undefined);
  const photo = src !== undefined && src !== "" && failed !== src;
  const named = !photo && !decorative;
  return (
    <span
      role={named ? "img" : undefined}
      aria-label={named ? name : undefined}
      aria-hidden={decorative || undefined}
      className={`relative inline-grid shrink-0 select-none place-items-center overflow-hidden rounded-pill ${BOX[s]} ${FILL[tone]} ${className}`}
      {...rest}
    >
      {photo ? (
        <img
          src={src}
          alt={decorative ? "" : name}
          draggable={false}
          className="absolute inset-0 size-full object-cover"
          onError={() => setFailed(src)}
        />
      ) : look !== "initials" ? (
        <AvatarArt name={name} look={look} hue={tone} size={s} />
      ) : null}
      {/* The initials. Under a picture they are invisible but still set the avatar's text baseline, so a row that aligns
          by baseline lines up exactly as it does with initials showing. */}
      {!photo && (
        <span
          aria-hidden={look !== "initials" || undefined}
          className={`litt-trim font-normal ${look !== "initials" ? "invisible" : ""} ${UNCOVER} ${TEXT[s]}`}
        >
          {initialsOf(name)}
        </span>
      )}
      <span aria-hidden="true" className={`pointer-events-none absolute inset-0 rounded-pill ${photo ? PHOTO_EDGE : EDGE[tone]}`} />
    </span>
  );
}

export type AvatarGroupProps = {
  /** What the group is, which a screen reader reads first: "Project team, 26 people". */
  label: string;
  /** The Avatars, first in front. Pass only the first few and set `total` when there are more. */
  children: ReactNode;
  /** Sm is 24, md is 32 and lg is 44. Every avatar in the group takes it. */
  size?: Size;
  /** How many avatars show before the "+N" pill. */
  max?: number;
  /** How many people there are in all, for when you pass only the first few. Leave it out to count the children. */
  total?: number;
  /** The surface the group sits on, so the 2px ring that separates the avatars matches it. */
  ring?: Ring;
  /** Extra classes for the group. */
  className?: string;
};

/** A row of overlapping Avatars, the first on top, that ends in a "+N" pill when there are more than `max`. */
export function AvatarGroup({ label, children, size = "md", max = 4, total, ring = "canvas", className = "" }: AvatarGroupProps) {
  const all = Children.toArray(children).filter(isValidElement);
  const shown = all.slice(0, Math.max(0, max));
  const more = Math.max(total ?? 0, all.length) - shown.length;
  const wrap = `relative inline-flex shrink-0 rounded-pill ${RING[ring]}`;
  return (
    <GroupContext.Provider value={{ size }}>
      {/* isolate keeps the stack's z-index inside the group, so it never rises above a sticky header. */}
      <span role="group" aria-label={label} className={`isolate inline-flex items-center ${className}`}>
        {shown.map((child, i) => (
          <span key={child.key ?? i} style={{ zIndex: shown.length - i }} className={`${wrap} ${i > 0 ? LAP[size] : ""}`}>
            {child}
          </span>
        ))}
        {more > 0 && (
          <span className={`${wrap} ${shown.length > 0 ? LAP[size] : ""}`}>
            <span
              role="img"
              aria-label={`${more} more`}
              className={`inline-grid select-none place-items-center rounded-pill bg-surface-2 px-1 text-caption tabular-nums font-normal text-fg-muted shadow-[inset_0_0_0_1px_var(--line)] ${BOX_MIN[size]}`}
            >
              <span className={`litt-trim ${UNCOVER}`}>+{more}</span>
            </span>
          </span>
        )}
      </span>
    </GroupContext.Provider>
  );
}

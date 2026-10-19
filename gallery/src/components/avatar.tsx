/**
 * Avatar: a round mark for a person, a client or a company, and AvatarGroup, a stack of them.
 *
 * - Shape (components.md, Avatar): a circle at rounded-pill, one of the three things the pill is for.
 *   Three sizes: sm 24 (beside a tag, dense rows), md 32 (list rows, the default) and lg 44
 *   (a profile header). Initials are the sans at the interface weight (550): caption at sm, small at md, body at
 *   lg, trimmed to the cap height so they sit in the middle of the circle.
 * - Content: a photo (`src`, object-cover) with an inset line hairline over it, so a white photo
 *   keeps its edge. With no photo, or when it fails to load, the initials of `name`: the first
 *   letter of the first two words, or one letter for one word. Leading characters that are not
 *   letters are skipped, so "@stripe.com" gives S.
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
import { Children, createContext, isValidElement, useContext, useState, type HTMLAttributes, type ReactNode } from "react";

/** The five data hues in their fixed order (P11), and neutral for a mark with no identity color. */
export type AvatarHue = "blue" | "amber" | "teal" | "violet" | "rose" | "neutral";

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
const TEXT: Record<Size, string> = {
  sm: "text-caption [font-weight:var(--weight)]",
  md: "text-small [font-weight:var(--weight)]",
  lg: "text-body [font-weight:var(--weight)]",
};
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

/** A stable hue for a name: FNV-1a with a final mix, so the five hues come out about evenly. Case and outer spaces do not matter. */
function hueOf(name: string): AvatarHue {
  let h = 2166136261;
  for (const ch of name.trim().toLowerCase()) {
    h ^= ch.codePointAt(0) ?? 0;
    h = Math.imul(h, 16777619);
  }
  h ^= h >>> 15;
  h = Math.imul(h, 2246822507);
  h ^= h >>> 13;
  return ORDER[(h >>> 0) % ORDER.length];
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
  /** Set it when the name is written beside the avatar: the avatar is hidden from screen readers so the name is not read twice. */
  decorative?: boolean;
  /** Extra classes for the avatar. */
  className?: string;
};

/** A round mark for a person, a client or a company: a photo, or initials on the tint of a data hue picked from the name. */
export function Avatar({ name, src, size = "md", hue, decorative = false, className = "", ...rest }: AvatarProps) {
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
      ) : (
        <span className={`litt-trim ${UNCOVER} ${TEXT[s]}`}>{initialsOf(name)}</span>
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
              className={`inline-grid select-none place-items-center rounded-pill bg-surface-2 px-1 font-mono text-caption [font-weight:var(--weight)] text-fg-muted shadow-[inset_0_0_0_1px_var(--line)] ${BOX_MIN[size]}`}
            >
              <span className={`litt-trim ${UNCOVER}`}>+{more}</span>
            </span>
          </span>
        )}
      </span>
    </GroupContext.Provider>
  );
}

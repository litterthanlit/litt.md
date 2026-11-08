/**
 * Code input, the Device body (proposals/worlds.md, Bodies; material.md, 8): a row of seven-segment glass.
 *
 * - One pane of LCD glass per character (--field, --field-shade, the --field-line edge) at the control radius. An empty
 *   pane shows the ghost of an eight: all seven segments dim, as an unlit display does. A typed digit lights its own
 *   segments in the glass's ink (--field-ink) and the rest stay dim. A letter of an alphanumeric code has no
 *   seven-segment shape, so it is set in the mono on the glass instead.
 * - The figure is the Seven-segment part's (components/seven-segment.tsx): the same polygons, 43 by 66 units, slanted
 *   0.09, an unlit segment the ink at 10%. It is drawn here and not imported, because that part is a whole readout
 *   (its own glass, a phosphor loop per instance) and a cell is already the glass.
 * - Only a typed character lights (R4). A change switches in place in three steps on the instant tier, as the Switch's
 *   detent does, and nothing glides. Reduced motion zeroes the tier, so it switches at once. The caret of the next cell
 *   is a still 1px line at the glass's left, which never blinks.
 * - Focus: the next cell takes the --focus line and ring. An error puts the --danger line on every pane. Disabled
 *   lies flat: --surface-2, the --line hairline, the segments in --fg-disabled.
 * - Forced colors drops shadows, so each pane gets a real border, the current one an outline, and the segments follow
 *   the system text color with their dim ones still at 10%.
 */
import type { CSSProperties } from "react";
import type { CodeInputBodyProps } from "../code-input";

/* The figure's numbers, in its own units (the same as the Seven-segment part's). */
const T = 6.6;
const GAP = 1;
const SLANT = 0.09;
const COL = [5.5, 31] as const;
const ROW = [5, 33, 61] as const;
const H = T / 2;
const GP = GAP / Math.SQRT2;
const XL = COL[0] + H;
const XR = COL[1] + H;

const pts = (list: [number, number][]) => list.map(([x, y]) => `${(x + (ROW[1] - y) * SLANT).toFixed(2)},${y.toFixed(2)}`).join(" ");
const across = (y: number): [number, number][] => [[XL + GP, y], [XL + GP + H, y - H], [XR - GP - H, y - H], [XR - GP, y], [XR - GP - H, y + H], [XL + GP + H, y + H]];
const down = (x: number, y1: number, y2: number): [number, number][] => [[x, y1 + GP], [x + H, y1 + GP + H], [x + H, y2 - GP - H], [x, y2 - GP], [x - H, y2 - GP - H], [x - H, y1 + GP + H]];

/** a b c d e f g, in that order. */
const SEGMENTS = [
  pts(across(ROW[0])),
  pts(down(XR, ROW[0], ROW[1])),
  pts(down(XR, ROW[1], ROW[2])),
  pts(across(ROW[2])),
  pts(down(XL, ROW[1], ROW[2])),
  pts(down(XL, ROW[0], ROW[1])),
  pts(across(ROW[1])),
];
const LIT: Record<string, string> = { "0": "abcdef", "1": "bc", "2": "abdeg", "3": "abcdg", "4": "bcfg", "5": "acdfg", "6": "acdefg", "7": "abc", "8": "abcdefg", "9": "abcdfg" };

/* The change in three even steps on the instant tier, never a glide. */
const STEPS = "steps(3, end)";
const switching: CSSProperties = {
  transitionProperty: "opacity",
  transitionDuration: "var(--dur-instant)",
  transitionTimingFunction: `${STEPS}`,
};

function Figure({ char }: { char: string }) {
  const on = LIT[char] ?? "";
  return (
    <svg viewBox="0 0 43 66" aria-hidden="true" className="h-6 w-auto shrink-0 fill-current">
      {SEGMENTS.map((points, i) => (
        <polygon key={i} points={points} style={{ ...switching, opacity: on.includes("abcdefg"[i]!) ? 1 : 0.1 }} />
      ))}
    </svg>
  );
}

const pane =
  "relative grid min-w-8 flex-1 basis-0 place-items-center rounded-control " +
  "transition-[box-shadow] duration-(--dur-instant) ease-litt forced-colors:border";

/** Device, the segments: a pane of LCD glass per character, an unlit eight until its character is typed. */
export function CodeInputDeviceBody({ length, cellHeight, code, at, focused, disabled, error }: CodeInputBodyProps) {
  return (
    <div aria-hidden="true" data-body="device" className="flex w-full gap-2">
      {Array.from({ length }, (_, i) => {
        const char = code[i] ?? "";
        const current = focused && !disabled && i === at;
        const figure = char === "" || char in LIT;
        return (
          <span
            key={i}
            className={
              pane +
              " " +
              cellHeight +
              /* six cells read as two halves of three */
              (length === 6 && i === 3 ? " ml-2" : "") +
              (current ? " forced-colors:outline-2 forced-colors:outline-offset-2 forced-colors:outline-[Highlight]" : "") +
              (disabled
                ? " bg-surface-2 text-fg-disabled shadow-[inset_0_0_0_1px_var(--line)]"
                : " bg-field text-field-ink " +
                  (current
                    ? error
                      ? "shadow-[inset_0_0_0_1px_var(--danger),var(--field-shade),var(--focus-ring)]"
                      : "shadow-[inset_0_0_0_1px_var(--focus),var(--field-shade),var(--focus-ring)]"
                    : error
                      ? "shadow-[inset_0_0_0_1px_var(--danger),var(--field-shade)]"
                      : "shadow-[inset_0_0_0_1px_var(--field-line),var(--field-shade)]"))
            }
          >
            {figure ? <Figure char={char} /> : <span className="font-field text-body font-title">{char}</span>}
            {char === "" && current && (
              <span className="absolute inset-y-2.5 left-2 w-px bg-field-ink forced-colors:bg-[CanvasText] forced-colors:[forced-color-adjust:none]" />
            )}
          </span>
        );
      })}
    </div>
  );
}

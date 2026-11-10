/**
 * Stat, the Device body (proposals/worlds.md, Bodies): the figure in seven segments on an LCD window, the label
 * engraved above it.
 *
 * - The tile is a plate fixed to the body (--block, --plate-lift). The label is engraved capitals (litt-legend) at the
 *   caption size. The figure is a seven-segment readout behind glass (the Seven-segment part), at the h1 size, which
 *   says its value in words to a screen reader; the unit is engraved beside the glass.
 * - Segments show the digits, a minus, a dot and a space. Any other value (a word, an element) sits on the same glass
 *   in the mono, so the tile never shows a wrong number.
 * - A changed figure lights its new segments at once and the old ones fade like phosphor (Seven-segment's own motion);
 *   nothing moves on its own (R4).
 */
import { SevenSegment } from "@/components/seven-segment";
import type { StatBodyProps } from "../stat";

/** What seven segments can show. */
const SEGMENTS = /^[0-9. -]+$/;

/** Device: an LCD window on a plate. */
export function StatDeviceBody({ label, value, figure, unit, delta, toneClass, toneWord, trend, className }: StatBodyProps) {
  const text = typeof value === "number" ? String(value) : typeof value === "string" ? value : null;
  return (
    <div data-body="device" className={"flex h-full min-w-0 flex-col gap-2 rounded-surface bg-block p-4 shadow-(--plate-lift) forced-colors:border @min-[48rem]:p-6 " + className}>
      <dt className="litt-legend text-caption text-fg-subtle">{label}</dt>
      <dd className="m-0 flex flex-1 flex-col gap-2">
        <span className="flex items-end gap-2">
          {text !== null && SEGMENTS.test(text) ? (
            <SevenSegment value={text} className="[font-size:var(--type-h1-size)]" />
          ) : (
            <span className="rounded-control bg-field px-3 py-2 font-mono text-h3 text-field-ink shadow-[inset_0_0_0_1px_var(--field-line),var(--field-shade)]">{figure}</span>
          )}
          {unit && <span className="litt-legend text-caption text-fg-subtle">{unit}</span>}
        </span>
        {delta && (
          <span className={"text-caption " + toneClass}>
            {delta}
            <span className="sr-only">{toneWord}</span>
          </span>
        )}
        {trend ? <div className="mt-auto pt-3">{trend}</div> : null}
      </dd>
    </div>
  );
}

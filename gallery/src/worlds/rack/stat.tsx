/**
 * Stat, the Rack body (proposals/rack.md): a value box on a panel, as a rack reads out a level.
 *
 * - The tile is a panel (--surface-1) inside a 1px edge of --line-strong, at the surface radius, with the label small and
 *   grey along its top. Nothing casts and nothing is raised.
 * - The figure sits in a value box: a light cut (--field) in the control line (--field-line), at the control radius, in the
 *   h3 step with tabular numbers, its unit after it in the subtle field ink. Rank comes from weight and ink (R8).
 * - The delta is a small clip: a flat key (--block in the 1px outline of --block-lift) at the caption size, its words in the
 *   judgement's colour (success, danger or the subtle ink). The hidden words still say good or bad news, so colour is never
 *   the only signal. No arrow and no dot.
 * - The trend slot is the caller's, at the foot of the tile under the delta. A Sparkline there is already Rack's clip.
 * - Nothing counts up or grows in (Rack's motion: things are there on the frame, R4), so there is no fun path. Forced
 *   colors keeps the borders.
 */
import type { StatBodyProps } from "@/components/stat";

/** Rack: a value box on a panel, the delta a small clip. */
export function StatRackBody({ label, figure, unit, delta, toneClass, toneWord, trend, className }: StatBodyProps) {
  return (
    <div data-body="rack" className={"flex h-full min-w-0 flex-col gap-2 rounded-surface border border-line-strong bg-surface-1 p-3 @min-[48rem]:p-4 " + className}>
      <dt className="text-small text-fg-subtle">{label}</dt>
      <dd className="m-0 flex flex-1 flex-col gap-2">
        <span className="w-fit rounded-control border border-field-line bg-field px-2 py-1 text-h3 tabular-nums text-field-ink">
          {figure}
          {unit && <span className="text-field-ink-subtle">{unit}</span>}
        </span>
        {delta && (
          <span className={"w-fit rounded-control bg-block px-1.5 py-0.5 text-caption shadow-(--block-lift) forced-colors:border " + toneClass}>
            {delta}
            <span className="sr-only">{toneWord}</span>
          </span>
        )}
        {trend ? <div className="mt-auto pt-3">{trend}</div> : null}
      </dd>
    </div>
  );
}

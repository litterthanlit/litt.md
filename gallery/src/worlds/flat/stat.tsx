/**
 * Stat, the Flat body (proposals/worlds.md, Bodies): the figure in ink on the page, no box.
 *
 * - Nothing is framed: no fill, no hairline, no padding to the left, so the label and the figure
 *   start where the page's text starts and space parts the tiles.
 * - The label is small and grey. The figure is the page's ink and stands up: Flat's one figure per object
 *   (--type-figure-size, 40px, R8's exception, v1.17), at the title weight with tabular numbers, its unit after it in
 *   grey. Fun at rest is that size, not decoration.
 * - The delta and the trend are as in every body: a word and the number at the caption size, the trend at the foot.
 */
import type { StatBodyProps } from "@/components/stat";

/** Flat: ink type on the page. */
export function StatFlatBody({ label, figure, unit, delta, toneClass, toneWord, trend, className }: StatBodyProps) {
  return (
    <div data-body="flat" className={"flex h-full min-w-0 flex-col gap-1 py-2 pr-4 " + className}>
      <dt className="text-small text-fg-subtle">{label}</dt>
      <dd className="m-0 flex flex-1 flex-col gap-1">
        <span data-figure="" className="text-figure tabular-nums text-fg">
          {figure}
          {unit && <span className="text-fg-subtle">{unit}</span>}
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

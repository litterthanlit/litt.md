/**
 * Stat, Heat's body (proposals/heat.md; taste/litt-principles.md, Heat): a night-menu telemetry tile.
 *
 * - A flat square black slab (`bg-canvas border border-line`) with four 8px ink corner marks, topped by a diagonal
 *   hazard-stripe header band (`bg-surface-1`) carrying the label.
 * - The figure sits in a crisp dark cell (`bg-block border border-line`) in tabular Saira (`text-h3 font-title text-fg`),
 *   with its unit beside it and the delta below.
 * - Zero shadows, zero rounded corners, forced colors keeps all borders.
 */
import type { StatBodyProps } from "@/components/stat";

const stripes = "[background-image:repeating-linear-gradient(135deg,var(--surface-3)_0_6px,transparent_6px_12px)]";

const corners =
  "pointer-events-none absolute inset-0 bg-no-repeat text-fg " +
  "[background-image:linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor)] " +
  "[background-size:8px_2px,2px_8px,8px_2px,2px_8px,8px_2px,2px_8px,8px_2px,2px_8px] " +
  "[background-position:left_top,left_top,right_top,right_top,left_bottom,left_bottom,right_bottom,right_bottom]";

/** Heat: a telemetry slab with a hazard-striped label band, corner marks and a flat square figure cell. */
export function StatHeatBody({ label, figure, unit, delta, toneClass, toneWord, trend, className }: StatBodyProps) {
  return (
    <div data-body="heat" className={"relative flex h-full min-w-0 flex-col rounded-none border border-line bg-canvas forced-colors:border " + className}>
      <span aria-hidden="true" className={corners} />
      <dt className={"border-b border-line bg-surface-1 px-3 py-1.5 text-small font-title text-fg-muted " + stripes}>
        <span className="bg-canvas px-1.5 py-0.5">{label}</span>
      </dt>
      <dd className="m-0 flex flex-1 flex-col gap-2 p-3 @min-[48rem]:p-4">
        <span className="w-fit rounded-none border border-line bg-block px-3 py-1.5 text-h3 tabular-nums text-fg forced-colors:border">
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

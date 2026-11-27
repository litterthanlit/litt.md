/**
 * Stat, Plain's body (taste v1.23, proposals/plain-studies.md): a single figure bare on white paper under a 1px hairline.
 *
 * - No 4-sided card box, no sunken tray, no rounded corners: a 1px top hairline (`border-t border-line`) anchors the
 *   metric on the page, and space parts a row of Stats in a StatGroup.
 * - The label sits quiet in `text-small text-fg-subtle`; the figure stands in `text-figure` (18px, title weight,
 *   tabular figures) in `--fg`, with its unit beside it in regular `--fg-subtle`.
 * - The delta states direction and judgment in plain words (`toneClass`, plus hidden `toneWord` for screen readers).
 * - Forced colors preserves the top rule.
 */
import type { StatBodyProps } from "@/components/stat";

/** Plain: one tabular figure bare on white paper under a single 1px hairline. */
export function StatPlainBody({ label, figure, unit, delta, toneClass, toneWord, trend, className }: StatBodyProps) {
  return (
    <div
      data-body="plain"
      className={"flex h-full min-w-0 flex-col gap-1.5 rounded-none border-t border-line bg-transparent pt-3 forced-colors:border-t " + className}
    >
      <dt className="text-small text-fg-subtle">{label}</dt>
      <dd className="m-0 flex flex-1 flex-col gap-1">
        <span data-figure="" className="text-figure tabular-nums text-fg">
          {figure}
          {unit && <span className="font-normal text-fg-subtle">{unit}</span>}
        </span>
        {delta && (
          <span className={"text-caption font-normal " + toneClass}>
            {delta}
            <span className="sr-only">{toneWord}</span>
          </span>
        )}
        {trend ? <div className="mt-auto pt-3">{trend}</div> : null}
      </dd>
    </div>
  );
}

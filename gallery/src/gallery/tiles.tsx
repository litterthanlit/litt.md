/**
 * Tiles: the Customize panel's picker, the Segmented control grown tall enough to show what each choice looks like.
 * Gallery chrome, not a registry item.
 *
 * - The same parts as Segmented (components/segmented.tsx): native radios in a fieldset, so the role, the arrow keys
 *   and the focus come from the browser; a sunken tray; the selected tile is the raised block and glides to the pick
 *   (R3, selected is raised), on fun mode's glide spring when it is on.
 * - A tile is a picture of the choice over its name (R5): the picture is aria-hidden, the name is what a screen
 *   reader hears. Pictures draw in currentColor where they can, so the picked tile's picture steps up to --fg with
 *   its name.
 */
import { useId, type ReactNode } from "react";
import { LayoutGroup, motion } from "motion/react";
import { useFun, useTransition } from "@/motion";

export type Tile<T extends string> = {
  value: T;
  /** The choice in a word or two, under the picture. */
  label: string;
  /** What the choice looks like, drawn from the real tokens. Hidden from screen readers. */
  preview: ReactNode;
};

/** What a finger holding an unpicked tile shows, as Segmented's segments. */
const PRESS = "pointer-coarse:active:bg-[color-mix(in_oklab,var(--fg)_6%,transparent)] pointer-coarse:active:text-fg";

export function Tiles<T extends string>({
  legend,
  value,
  onValueChange,
  tiles,
}: {
  legend: string;
  value: T;
  onValueChange: (value: T) => void;
  tiles: Tile<T>[];
}) {
  const name = useId();
  const responsive = useTransition("responsive");
  const fun = useFun();
  return (
    <fieldset className="m-0 min-w-0 border-0 p-0">
      <legend className="mb-2 p-0 text-small font-title text-fg">{legend}</legend>
      <LayoutGroup id={name}>
        <div className="grid grid-flow-col auto-cols-fr rounded-control bg-tray p-0.5 shadow-(--tray-shade) forced-colors:border">
          {tiles.map((t) => {
            const selected = value === t.value;
            return (
              <label
                key={t.value}
                className={
                  "relative grid min-w-0 cursor-pointer select-none justify-items-center gap-2 rounded-[calc(var(--radius-control)-2px)] px-1 pt-3 pb-2.5 text-caption font-title " +
                  "transition-colors duration-(--dur-instant) ease-litt [-webkit-tap-highlight-color:transparent] " +
                  (selected ? "text-fg" : "text-fg-subtle hover:text-fg " + PRESS)
                }
              >
                <input type="radio" className="peer sr-only" name={name} value={t.value} checked={selected} onChange={() => onValueChange(t.value)} />
                {selected && (
                  <motion.span
                    layoutId="tile-surface"
                    transition={fun ? fun.glide : responsive}
                    aria-hidden="true"
                    className="absolute inset-0 rounded-[calc(var(--radius-control)-2px)] bg-block shadow-(--block-lift) forced-colors:border-2"
                  />
                )}
                <span aria-hidden="true" className="relative z-1 grid h-8 w-full place-items-center">
                  {t.preview}
                </span>
                <span className="litt-trim relative z-1 max-w-full">{t.label}</span>
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 z-1 rounded-[calc(var(--radius-control)-2px)] peer-focus-visible:outline-2 peer-focus-visible:-outline-offset-2 peer-focus-visible:outline-focus"
                />
              </label>
            );
          })}
        </div>
      </LayoutGroup>
    </fieldset>
  );
}

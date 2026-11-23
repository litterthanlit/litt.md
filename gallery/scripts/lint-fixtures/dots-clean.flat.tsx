/**
 * Lint fixture (not compiled, not shipped): a Flat part (<part>.flat.tsx) with round things that are not dots. `node
 * scripts/lint-litt.mjs --self-test` lints it in gallery mode and it must come back with no failures.
 */
export function NotDots({ horizontal, checked }: { horizontal: boolean; checked: boolean }) {
  return (
    <div className="grid gap-2">
      {/* A bar and a track have a long side. */}
      <span className="block h-2 w-full rounded-pill bg-fg" />
      <span className="h-1.5 overflow-hidden rounded-pill bg-slot" />
      {/* A pill, a circle button and a thumb are bigger than a dot. */}
      <span className="h-control-sm rounded-pill px-3 text-small">Draft</span>
      <button type="button" className="litt-target relative size-control-sm rounded-pill">+</button>
      <span className="size-4 rounded-pill bg-fg" />
      <span className="size-[16px] rounded-pill bg-fg" />
      {/* A small box with square corners is not round. */}
      <span className="size-2 rounded-control bg-fg" />
      {/* A checkbox's or a radio's checked mark sits inside its box. */}
      <span className="peer-checked:grid after:size-2 after:rounded-pill after:bg-fg" />
      <span className="data-[state=checked]:bg-fg size-2 rounded-pill" />
      {/* One way is 4px tall, the other 4px wide: a ternary, never both on one box. */}
      <span className={horizontal ? "after:h-8 after:w-1 after:rounded-pill" : "after:h-1 after:w-8 after:rounded-pill"} />
      {/* Its size and its roundness under different variants. */}
      <span className="sm:size-2 rounded-pill px-3" />
      {checked && <span className="text-small">Published</span>}
    </div>
  );
}

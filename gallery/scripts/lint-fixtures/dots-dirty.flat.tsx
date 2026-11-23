/**
 * Lint fixture (not compiled, not shipped): a Flat part (a body named <part>.flat.tsx, as in worlds/flat/) in the
 * gallery's names, with every kind of dot Flat forbids. `node scripts/lint-litt.mjs --self-test` lints it in gallery
 * mode: every line that ends in `// expect: other` must fail, and no other line may.
 */
const TONE = { up: "bg-success", down: "bg-danger" };
const MARK = "size-1.5 shrink-0 rounded-pill bg-fg"; // expect: other

export function Status({ tone, live }: { tone: "up" | "down"; live: boolean }) {
  return (
    <ul className="grid gap-2">
      <li className="flex items-center gap-2">
        <span aria-hidden="true" className={"size-2 shrink-0 rounded-pill " + TONE[tone]} /> {/* expect: other */}
        Published
      </li>
      <li className="flex items-center gap-2">
        <span aria-hidden="true" className="h-2 w-2 rounded-pill bg-fg-subtle" /> {/* expect: other */}
        Draft
      </li>
      <li className="before:size-1 before:rounded-pill before:bg-fg flex gap-2">A bullet</li> {/* expect: other */}
      <li className="flex gap-2">
        <span className="size-[6px] rounded-pill bg-fg" /> {/* expect: other */}
        A dot in pixels
      </li>
      <li className="flex gap-2">
        <span className={live ? "size-2.5 rounded-pill bg-fg" : "size-2.5 rounded-pill bg-line"} /> {/* expect: other */}
        Live
      </li>
      <li className="flex gap-2">
        <span
          className={
            "shrink-0 rounded-pill " +
            (live ? "size-3 bg-fg" : "size-3 bg-line") // expect: other
          }
        />
        On air
      </li>
      <li className={MARK}>Mark</li>
    </ul>
  );
}

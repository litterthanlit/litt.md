/**
 * Lint fixture (not compiled, not shipped): a Flat body as a host has it (components/litt/bodies/<part>.flat.tsx), in
 * the namespaced names. `node scripts/lint-litt.mjs --self-test` lints it in host mode: every line that ends in
 * `// expect: other` must fail, and no other line may.
 */
export function Status({ on }: { on: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span aria-hidden="true" className="size-2 shrink-0 rounded-litt-pill bg-litt-fg" /> {/* expect: other */}
      <span className="h-2 w-full rounded-litt-pill bg-litt-fg" />
      <span className="h-litt-control-sm rounded-litt-pill px-3 text-litt-small">{on ? "Live" : "Draft"}</span>
    </div>
  );
}

// @litt/flat-dots-stamped-dirty 2026.11.23. What changed: https://littmd.vercel.app/docs/changelog.md
/**
 * Lint fixture (not compiled, not shipped): a part the registry installed from r/flat/, stamped @litt/flat-<part>,
 * so the host lint judges it as Flat's. `node scripts/lint-litt.mjs --self-test` lints it in host mode: every line
 * that ends in `// expect: other` must fail, and no other line may. Without the stamp or a .flat.tsx name, a dot
 * fails only behind Flat's variant.
 */
export function Bullet() {
  return (
    <p className="flex items-center gap-2">
      <span className="before:size-1.5 before:rounded-litt-pill before:bg-litt-fg" /> {/* expect: other */}
      A line
    </p>
  );
}

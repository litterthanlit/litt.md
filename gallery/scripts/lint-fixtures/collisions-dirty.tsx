/**
 * Collisions fixture (not compiled, not shipped): class lists that can put two utilities on one element which set
 * the same properties under the same variant chain. `node scripts/collisions.mjs --self-test` lints it. Every line
 * that ends in `// expect: collision` must fail, and no other line may. The line is the one of the class meant to
 * win, the one joined on later.
 */
import { lift } from "./collisions-parts";

type Tone = "neutral" | "accent";
declare function cx(...parts: unknown[]): string;

/* The Flat switch's pill as it shipped: the ink's fills in the base string, the accent's joined on for tone="accent".
   Tailwind emits bg-accent before bg-fg, so the ink won and an accent switch never showed its accent. */
const pill =
  "relative inline-flex h-6.5 w-11 shrink-0 items-center overflow-hidden rounded-control p-[3px] " +
  "bg-transparent shadow-[inset_0_0_0_1.5px_var(--line-control)] group-data-[state=checked]/pill:bg-fg group-data-[state=checked]/pill:shadow-none " +
  "transition-[background-color] duration-(--dur-instant) ease-litt " +
  "group-enabled/pill:group-hover/switch:group-data-[state=checked]/pill:bg-[color-mix(in_oklab,var(--fg)_86%,var(--canvas))] " +
  "group-disabled/pill:bg-surface-2 group-disabled/pill:opacity-40 group-disabled/pill:shadow-[inset_0_0_0_1px_var(--line)] group-disabled/pill:group-data-[state=checked]/pill:bg-fg group-disabled/pill:group-data-[state=checked]/pill:shadow-none " +
  "forced-colors:border forced-colors:p-px";
const pillAccent = " group-data-[state=checked]/pill:bg-accent group-enabled/pill:group-hover/switch:group-data-[state=checked]/pill:bg-accent-hover"; // expect: collision

export function OldSwitch({ tone }: { tone: Tone }) {
  return <span className={pill + (tone === "accent" ? pillAccent : "")} />;
}

/* The Flat number field's pill as it shipped: shadow-none in the base, the danger ring joined on, and lost. */
const field = "relative flex w-full items-center rounded-pill bg-field p-1 shadow-none";
const fieldInvalid = " shadow-[0_0_0_2px_var(--canvas),0_0_0_4px_var(--danger)]"; // expect: collision

const sizes = { sm: "h-control-sm text-small", md: "h-control-md text-body" }; // expect: collision
const row = (active: boolean) => "flex items-center " + (active ? "text-fg" : "text-fg-muted");
const lamp = (lit: boolean) => (lit ? "bg-fg" : "bg-surface-3"); // expect: collision

export function Dirty({ invalid, last, size, hidden, mono, active }: { invalid: boolean; last: boolean; size: "sm" | "md"; hidden: boolean; mono: boolean; active: boolean }) {
  return (
    <div>
      <span className={field + (invalid ? fieldInvalid : "")} />
      <span
        className={"pb-6 text-small " + (last ? "pb-0" : "")} // expect: collision
      />
      <span
        className={["flex", hidden && "hidden"].filter(Boolean).join(" ")} // expect: collision
      />
      <span
        className={`font-field ${mono ? "font-mono" : ""}`} // expect: collision
      />
      <span className={"text-reading " + sizes[size]} />
      {/* text-caption sets a weight too, so Tailwind emits it before text-small: joined on last, it still loses its size. */}
      <span
        className={"text-small " + (last ? "text-caption" : "")} // expect: collision
      />
      <span
        className={row(active) + " text-fg-subtle"} // expect: collision
      />
      <span
        className={cx("hover:bg-surface-2", active && "hover:bg-surface-3")} // expect: collision
      />
      <span
        className={cx("rounded-control", { "rounded-surface": active })} // expect: collision
      />
      <span
        className="bg-fg bg-accent" // expect: collision
      />
      {/* Two calls of one function with different arguments: each can return either fill. */}
      <span className={lamp(active) + " " + lamp(hidden)} />
      {/* The same variants in another order are the same selector. */}
      <span
        className="data-[state=open]:hover:bg-surface-2 hover:data-[state=open]:bg-surface-3" // expect: collision
      />
      {/* A constant from another file. */}
      <span
        className={lift + " shadow-none"} // expect: collision
      />
    </div>
  );
}

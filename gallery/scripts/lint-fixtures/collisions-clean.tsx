/**
 * Collisions fixture (not compiled, not shipped): class lists that look like collisions and are not.
 * `node scripts/collisions.mjs --self-test` lints it, and it must come back clean.
 */
type Tone = "neutral" | "accent";
declare function cx(...parts: unknown[]): string;

/* The Flat switch's pill as it is now: the fills are one tone's or the other's. The disabled fill has a longer variant
   chain than the checked fill, so it wins by specificity, not by order. */
const pill =
  "relative inline-flex h-6.5 w-11 shrink-0 items-center overflow-hidden rounded-control p-[3px] " +
  "bg-transparent shadow-[inset_0_0_0_1.5px_var(--line-control)] group-data-[state=checked]/pill:shadow-none " +
  "group-disabled/pill:bg-surface-2 group-disabled/pill:group-data-[state=checked]/pill:bg-fg group-disabled/pill:group-data-[state=checked]/pill:shadow-none";
const pillOn: Record<Tone, string> = {
  neutral: "group-data-[state=checked]/pill:bg-fg group-enabled/pill:group-hover/switch:group-data-[state=checked]/pill:bg-[color-mix(in_oklab,var(--fg)_86%,var(--canvas))]",
  accent: "group-data-[state=checked]/pill:bg-accent group-enabled/pill:group-hover/switch:group-data-[state=checked]/pill:bg-accent-hover",
};

const sizes = { sm: "h-control-sm text-small", md: "h-control-md text-body" };
const row = (active: boolean) => "flex items-center " + (active ? "text-fg" : "text-fg-muted");
const lamp = (lit: boolean) => {
  if (lit) return "bg-fg";
  return "bg-surface-3";
};

export function Clean({ tone, on, off, picked, size, active, hidden, n, className }: { tone: Tone; on: boolean; off: boolean; picked: boolean; size: "sm" | "md"; active: boolean; hidden: boolean; n: number; className: string }) {
  return (
    <div>
      <span className={pill + " " + pillOn[tone]} />
      {/* Different properties: a size and a color, a size and its own leading, a box and one side of it. */}
      <span className="text-small text-fg leading-none" />
      {/* One sets part of what the other sets, and is joined on last: Tailwind emits the narrower one last on purpose. */}
      <span className="size-5 w-4" />
      <span className={"text-caption " + (active ? "text-small" : "")} />
      <span className="p-4 px-2 rounded-control rounded-t-none" />
      {/* The two arms of one ternary, whatever its condition. */}
      <span className={"size-1.5 rounded-pill " + (picked && !off ? "bg-fg shadow-[0_0_6px_var(--fg)]" : "shadow-[inset_0_0_0_1px_var(--fg-disabled)]")} />
      <span className={"w-px " + (on || picked ? "bg-fg" : "bg-line")} />
      <span className={off ? "text-fg-disabled" : on ? "text-fg" : "text-fg-subtle"} />
      {/* One condition and its opposite, and one name against two values. */}
      <span className={(on ? "bg-fg" : "") + (!on ? " bg-surface-2" : "")} />
      <span className={(tone === "accent" ? "bg-accent" : "") + (tone === "neutral" ? " bg-fg" : "")} />
      <span className={(tone !== "accent" ? "bg-fg" : "") + (tone === "accent" ? " bg-accent" : "")} />
      {/* One key of a Record, one return of a function. */}
      <span className={"flex " + sizes[size]} />
      <span className={row(active)} />
      <span className={lamp(on)} />
      {/* The same call read twice returns the same thing both times. */}
      <span className={lamp(on) + " " + lamp(on)} />
      {/* Another variant chain is another selector. */}
      <span className="bg-surface-1 hover:bg-surface-2 data-[state=open]:bg-surface-3 hover:data-[state=open]:bg-surface-2" />
      {/* !important on one side wins on its own. */}
      <span className="bg-fg bg-accent!" />
      {/* The same class twice, and a class glued to a value that is not known. */}
      <span className={cx("flex", active && "flex")} />
      <span className={`text-fg-subtle text-fg${n} ${className}`} />
      <span className={"flex " + (hidden ? "hidden" : "")} /* litt-allow: a fixture line, to show the exemption */ />
    </div>
  );
}

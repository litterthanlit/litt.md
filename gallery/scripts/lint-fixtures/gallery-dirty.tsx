/**
 * Lint fixture (not compiled, not shipped): a gallery component with the plain token names that
 * breaks the rules. `node scripts/lint-litt.mjs --self-test` lints it in gallery mode. Every line
 * that ends in `// expect: <rule>` must fail exactly that rule, and no other line may fail. A line
 * that ends in `// warn: <rule>` must warn exactly that rule, and no other line may warn.
 */
import { motion } from "motion/react";
import { Button } from "@/components/button";

/* Touch targets: a constant that holds its own positioning, and one joined from elsewhere, both pass. */
const TARGET_ROW = "litt-target relative flex h-control-sm";
const POSITION = "relative";

export function ProjectCard({ open }: { open: boolean }) {
  return (
    <div className="grid gap-4 rounded-surface bg-surface-1 p-4 shadow-float">
      <h3
        className="text-h4 font-bold text-fg" // expect: weight
      />
      <h3
        className="text-h4 text-fg"
        style={{ fontWeight: 700 }} // expect: weight
      />
      <h3
        className="text-body text-fg font-[500]" // expect: weight
      />
      <p
        className="text-caption text-fg-subtle"
        style={{ fontWeight: 300 }} // expect: weight
      />
      <h3 className="text-body text-fg font-title" style={{ fontWeight: 500 }} />
      <span className="text-caption text-fg-subtle font-label" style={{ fontWeight: 600 }} />
      <span className="font-mono text-caption font-normal text-fg-subtle" />
      <div
        className="rounded-md bg-surface-2" // expect: radius
      />
      <div
        className="rounded-full bg-surface-2" // expect: radius
      />
      <div
        className="rounded bg-surface-2" // expect: radius
      />
      <div
        style={{ borderRadius: 8 }} // expect: radius
      />
      <div className="rounded-[min(var(--radius-control),calc(var(--control-md)/2))] bg-surface-2" />
      <div className="rounded-[calc(var(--radius-surface)-4px)] bg-surface-2" />
      <div className="rounded-[calc(var(--radius-surface)-8px)] bg-surface-2" />
      <div
        className="rounded-[calc(var(--radius-surface)-3px)] bg-surface-2" // expect: radius
      />
      <div
        className="rounded-[calc(var(--radius-pill)-4px)] bg-surface-2" // expect: radius
      />
      {/* Device's em radii (R9's exception) are Device's alone: outside a Device body or its variant they fail. */}
      <div
        className="rounded-key bg-surface-2" // expect: radius
      />
      <div
        className="hover:rounded-plate bg-surface-2" // expect: radius
      />
      <div className="in-[[data-material=device]]:rounded-well bg-surface-2" />
      <div
        className="rounded-[min(var(--radius-control),12px)] bg-surface-2" // expect: radius
      />
      <div
        className="shadow-md" // expect: shadow
      />
      <div
        className="shadow-[0_4px_12px_var(--line)]" // expect: shadow
      />
      <div
        className="inset-shadow-[0_2px_4px_var(--line)]" // expect: shadow
      />
      <div
        className="transition-all duration-(--dur-instant) ease-litt" // expect: motion
      />
      <div
        className="transition-colors duration-300" // expect: motion
      />
      <div
        className="transition-colors duration-(--dur-instant) ease-responsive" // expect: motion
      />
      <div
        className="transition-transform duration-(--dur-responsive) ease-litt" // expect: motion
      />
      <div
        className="transition-colors duration-(--dur-instant) ease-in" // expect: motion
      />
      <div
        className="animate-pulse" // expect: motion
      />
      <div
        className="animate-spin" // expect: motion
      />
      <motion.div
        transition={{ type: "spring" }} // expect: motion
      />
      <motion.div
        animate={{ stiffness: 300 }} // expect: motion
      />
      <motion.div
        animate={{ width: open ? 200 : 0 }} // expect: motion
      />
      <div
        className="bg-[#fafbfc]" // expect: color
      />
      <a
        className="text-accent underline" // expect: color
      />
      <span
        className="text-data-amber" // expect: color
      />
      <div
        style={{ color: "#fff" }} // expect: color
      />
      <div
        style={{ background: "rgb(0, 0, 0)" }} // expect: color
      />
      <div
        style={{ background: "oklch(0.7 0.1 200)" }} // expect: color
      />
      <div className="rounded-surface rounded-t-surface rounded-none rounded-control rounded-pill shadow-float shadow-glow shadow-[0_0_0_1px_var(--line)]" />
      <div className="transition-[background-color] duration-(--dur-instant) ease-litt font-normal bg-surface-2 text-fg-muted" />
      <div className="transition-transform duration-(--dur-responsive) ease-responsive" />
      <div className="transition-transform duration-(--dur-exit-expressive) ease-litt" />
      <p
        className="uppercase text-caption" // warn: type
      />
      <p
        className="tracking-wide text-caption" // warn: type
      />
      <p
        className="text-[13px]" // warn: type
      />
      <div
        onMouseEnter={() => undefined} // warn: other
      />
      {/* Touch targets: a litt-target needs a positioning class in its own class list. */}
      <a href="#a" className="litt-target inline-flex h-control-sm" /> {/* expect: other */}
      <button
        type="button"
        className={
          "litt-target inline-flex h-control-sm " + // expect: other
          "text-small text-fg-muted"
        }
      />
      <a href="#b" className="litt-target relative inline-flex h-control-sm" />
      <button
        type="button"
        className={
          "litt-target inline-flex h-control-sm " +
          "text-small text-fg-muted absolute"
        }
      />
      <a href="#c" className={TARGET_ROW + " justify-between"} />
      <a href="#d" className={"litt-target " + POSITION} />
      <a href="#e" className="litt-target sm:relative" /> {/* expect: other */}
      {/* Flat has no dots: outside a Flat part only what sits behind Flat's variant is judged. */}
      <span className="size-2 rounded-pill bg-success" />
      <span className="before:size-2 before:rounded-pill in-[[data-material=device]]:size-1.5 in-[[data-material=device]]:rounded-pill" />
      <span className="in-[[data-material=flat]]:before:size-2 in-[[data-material=flat]]:before:rounded-pill" /> {/* expect: other */}
      <Button size="lg">Open</Button>
    </div>
  );
}

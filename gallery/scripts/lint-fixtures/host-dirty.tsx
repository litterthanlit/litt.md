/**
 * Lint fixture (not compiled, not shipped): what a careless agent writes in a host app that
 * installed litt from the registry. `node scripts/lint-litt.mjs --self-test` lints it in host
 * mode. Every line that ends in `// expect: <rule>` must fail exactly that rule, and no other
 * line may fail. A line that ends in `// warn: <rule>` must warn exactly that rule, and no other
 * line may warn. Rules: weight, radius, shadow, color, type, motion, other.
 */
import { useState } from "react";
import { motion } from "motion/react";
import { Button } from "@/components/litt/button";
import { cn } from "@/lib/utils";

const TIERS = [
  { name: "Sprint", price: "$4,800", duration: 2, unit: "weeks" },
  { name: "Studio", price: "$12,000", duration: 6, unit: "weeks" },
];

/* ---- radius ---- */
export function Radii() {
  return (
    <div className="grid gap-litt-gutter">
      <div
        className="rounded border border-litt-line" // expect: radius
      />
      <div
        className="rounded-md bg-litt-surface-1" // expect: radius
      />
      <div
        className="rounded-lg bg-litt-surface-1" // expect: radius
      />
      <div
        className="rounded-2xl bg-litt-surface-1" // expect: radius
      />
      <img
        alt="Studio portrait"
        className="size-litt-control-lg rounded-full" // expect: radius
      />
      <div
        className="rounded-t-xl bg-litt-surface-1" // expect: radius
      />
      <div
        className="rounded-[10px] bg-litt-surface-1" // expect: radius
      />
      <div
        className="md:rounded-sm bg-litt-surface-1" // expect: radius
      />
      <div
        className="rounded-control bg-litt-surface-1" // expect: radius
      />
      <div
        style={{
          borderRadius: 8, // expect: radius
        }}
      />
      <div className="rounded-litt-surface rounded-t-litt-surface rounded-none md:rounded-litt-pill" />
    </div>
  );
}

/* ---- shadow ---- */
export function Shadows() {
  return (
    <div className="grid gap-litt-gutter">
      <div
        className="shadow-sm bg-litt-surface-1" // expect: shadow
      />
      <div
        className="shadow-md bg-litt-surface-1" // expect: shadow
      />
      <div
        className="hover:shadow-lg bg-litt-surface-1" // expect: shadow
      />
      <div
        className="shadow-xl bg-litt-surface-1" // expect: shadow
      />
      <div
        className="shadow-2xl bg-litt-surface-1" // expect: shadow
      />
      <div
        className="shadow-[0_4px_12px_var(--litt-line)]" // expect: shadow
      />
      <div
        className="drop-shadow-lg" // expect: shadow
      />
      <div
        className="rounded-litt-surface bg-litt-surface-1 shadow" // expect: shadow
      />
      <div
        className="inset-shadow-sm" // expect: shadow
      />
      <div
        className="shadow-float" // expect: shadow
      />
      <div
        className="shadow-litt-lg" // expect: shadow
      />
      <div
        style={{
          boxShadow: "0 4px 12px var(--litt-line)", // expect: shadow
        }}
      />
      <div className="shadow-litt-float shadow-litt-modal shadow-none shadow-[0_0_0_1px_var(--litt-line)] inset-shadow-litt-highlight" />
    </div>
  );
}

/* ---- color ---- */
export function Colors() {
  return (
    <div className="grid gap-litt-gutter">
      <div
        className="bg-zinc-900 p-litt-gutter" // expect: color
      />
      <div
        className="text-gray-500" // expect: color
      />
      <a
        className="text-litt-accent underline" // expect: color
      />
      <span
        className="text-litt-data-teal-tint" // expect: color
      />
      <span
        className="bg-data-violet-tint text-data-violet-text" // expect: color
      />
      <div
        className="border border-slate-200" // expect: color
      />
      <div
        className="bg-gradient-to-r from-purple-500 to-litt-accent" // expect: color
      />
      <div
        className="bg-white" // expect: color
      />
      <div
        className="text-black" // expect: color
      />
      <div
        className="fixed inset-0 bg-black/50" // expect: color
      />
      <div
        className="dark:bg-neutral-950" // expect: color
      />
      <div
        className="bg-[#0f0f0f]" // expect: color
      />
      <div
        className="bg-[rgb(15,15,15)]" // expect: color
      />
      <div
        className="bg-[red]" // expect: color
      />
      <div
        className="bg-[color-mix(in_srgb,#ffffff_20%,transparent)]" // expect: color
      />
      <div
        className="text-[oklch(0.7_0.1_200)]" // expect: color
      />
      <div
        className="bg-background" // expect: color
      />
      <div
        className="text-foreground" // expect: color
      />
      <div
        className="bg-primary text-primary-foreground" // expect: color
      />
      <div
        className="bg-secondary" // expect: color
      />
      <div
        className="bg-muted" // expect: color
      />
      <div
        className="text-muted-foreground" // expect: color
      />
      <div
        className="hover:bg-accent/50" // expect: color
      />
      <div
        className="bg-card" // expect: color
      />
      <div
        className="bg-popover" // expect: color
      />
      <div
        className="border-border" // expect: color
      />
      <div
        className="border-input" // expect: color
      />
      <div
        className="focus-visible:ring-ring" // expect: color
      />
      <div
        className="bg-destructive" // expect: color
      />
      <div
        className="dark:bg-card/80" // expect: color
      />
      <div
        className="bg-surface-1 text-fg-muted" // expect: color
      />
      <div
        className="bg-[var(--primary)]" // expect: color
      />
      <svg>
        <path
          fill="white" // expect: color
        />
      </svg>
      <div
        style={{
          color: "#fff", // expect: color
          background: "linear-gradient(red, blue)", // expect: color
        }}
      />
      <div className="bg-litt-canvas text-litt-fg-muted border-litt-line-strong bg-transparent text-current from-litt-accent" />
    </div>
  );
}

/* ---- type ---- */
export function Type() {
  return (
    <div className="grid gap-litt-gutter">
      <p
        className="text-xs" // expect: type
      />
      <p
        className="text-sm text-litt-fg" // expect: type
      />
      <p
        className="text-base" // expect: type
      />
      <p
        className="md:text-lg" // expect: type
      />
      <p
        className="text-xl" // expect: type
      />
      <p
        className="text-2xl" // expect: type
      />
      <p
        className="text-9xl" // expect: type
      />
      <p
        className="text-sm/6" // expect: type
      />
      <p
        className="text-[14px]" // expect: type
      />
      <p
        className="text-[1.125rem]" // expect: type
      />
      <p
        className="text-body" // expect: type
      />
      <p
        style={{
          fontSize: 14, // expect: type
        }}
      />
      <p className="text-litt-display text-litt-h1 text-litt-reading text-litt-caption text-center text-balance" />
    </div>
  );
}

/* ---- weight ---- */
export function Weights() {
  return (
    <div className="grid gap-litt-gutter">
      <h2
        className="font-medium text-litt-h3" // expect: weight
      />
      <h2
        className="font-semibold text-litt-h3" // expect: weight
      />
      <h2
        className="font-bold" // expect: weight
      />
      <h2
        className="font-light" // expect: weight
      />
      <h2
        className="font-[600]" // expect: weight
      />
      <h2
        style={{
          fontWeight: 600, // expect: weight
        }}
      />
      <h2
        style={{
          fontWeight: "bold", // expect: weight
        }}
      />
      <h2 className="font-normal font-litt-sans font-litt-mono" style={{ fontWeight: 400 }} /> {/* expect: weight */}
      <div className="shadow-litt-glow rounded-litt-control" /> {/* expect: shadow */}
    </div>
  );
}

/* ---- motion ---- */
export function Motion({ open, index }: { open: boolean; index: number }) {
  return (
    <div className="grid gap-litt-gutter">
      <button
        className="transition-colors duration-300" // expect: motion
      />
      <button
        className="transition-colors delay-150" // expect: motion
      />
      <button
        className="transition-all duration-(--litt-dur-instant) ease-litt" // expect: motion
      />
      <button
        className="transition ease-litt" // expect: motion
      />
      <button
        className="transition-[width] duration-(--litt-dur-instant) ease-litt" // expect: motion
      />
      <button
        className="transition-colors ease-in-out" // expect: motion
      />
      <button
        className="transition-colors ease-out" // expect: motion
      />
      <button
        className="transition-colors ease-linear" // expect: motion
      />
      <button
        className="transition-colors ease-[cubic-bezier(0.4,0,0.2,1)]" // expect: motion
      />
      <button
        className="transition-colors duration-(--litt-dur-instant) ease-litt-responsive" // expect: motion
      />
      <button
        className="transition-transform duration-(--litt-dur-responsive) ease-litt" // expect: motion
      />
      <button
        className="transition-transform duration-(--litt-dur-expressive) ease-litt-responsive" // expect: motion
      />
      <button
        className="transition-opacity duration-(--litt-dur-exit-responsive) ease-litt-responsive" // expect: motion
      />
      <button
        className="transition-colors duration-(--litt-dur-responsive) ease-litt-responsive" // expect: motion
      />
      <button
        className="transition-transform duration-(--litt-dur-instant) ease-responsive" // expect: motion
      />
      <button
        className="transition-transform duration-(--litt-dur-slow) ease-litt" // expect: motion
      />
      <button
        className={cn(
          "transition-transform",
          "duration-(--litt-dur-responsive)", // expect: motion
        )}
      />
      <button
        className={[
          "transition-colors",
          "duration-(--litt-dur-instant)", // expect: motion
        ].join(" ")}
      />
      <button
        className="animate-pulse" // expect: motion
      />
      <button
        className="animate-bounce" // expect: motion
      />
      <div
        className="animate-in fade-in-0 zoom-in-95" // expect: motion
      />
      <motion.div
        animate={{
          height: open ? "auto" : 0, // expect: motion
        }}
      />
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        transition={{ duration: 0.3 }} // expect: motion
      />
      <motion.div
        animate={{
          opacity: 1,
          transition: { type: "spring", bounce: 0 }, // expect: motion
        }}
      />
      <motion.div
        exit={{
          opacity: 0,
          transition: {
            stiffness: 300, // expect: motion
          },
        }}
      />
      <motion.div
        animate={{
          opacity: 1,
          transition: {
            ease: "easeOut", // expect: motion
          },
        }}
      />
      <motion.div
        animate={{
          rotate: 360,
          transition: { repeat: Infinity }, // expect: motion
        }}
      />
      <div
        style={{
          transition: "opacity 0.3s ease", // expect: motion
        }}
      />
      <div
        style={{
          transitionDelay: `${index * 40}ms`, // expect: motion
        }}
      />
      <div
        style={{
          animationDuration: "2s", // expect: motion
        }}
      />
      <div className="transition-colors duration-(--litt-dur-instant) ease-litt animate-spin" />
    </div>
  );
}

/* ---- other: names that only exist in the gallery ---- */
export function PlainNames() {
  return (
    <div className="grid gap-litt-gutter">
      <div
        className="h-control-md px-control-pad-md" // expect: other
      />
      <section
        className="py-section" // expect: other
      />
      <main
        className="mx-auto max-w-content" // expect: other
      />
    </div>
  );
}

/* ---- warnings: they never fail a run ---- */
export function Warnings() {
  return (
    <div className="grid gap-litt-gutter">
      <p
        className="uppercase text-litt-caption" // warn: type
      />
      <p
        className="tracking-wide text-litt-caption" // warn: type
      />
      <button
        className="transition-colors" // expect: motion
      />
      <div
        className="backdrop-blur-md" // warn: other
      />
      <span
        className="bg-clip-text text-transparent" // warn: other
      />
      <div
        onMouseEnter={() => undefined} // warn: other
      />
      <strong>Studio</strong> {/* warn: weight */}
    </div>
  );
}

export default function Page() {
  const [open, setOpen] = useState(false);
  return (
    <main>
      <Button onClick={() => setOpen(!open)}>Toggle</Button>
      <Radii />
      <Shadows />
      <Colors />
      <Type />
      <Weights />
      <Motion open={open} index={0} />
      <PlainNames />
      <Warnings />
      {TIERS.map((t) => (
        <p key={t.name}>{t.name}</p>
      ))}
    </main>
  );
}

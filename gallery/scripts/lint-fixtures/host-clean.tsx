/**
 * Lint fixture (not compiled, not shipped): what a good agent writes in a host app that installed
 * litt from the registry. `node scripts/lint-litt.mjs --self-test` lints it in host mode and it
 * must come back with no failures and no warnings.
 *
 * It also holds the constructs that must NOT trip the lint: comments and JSX text that name the
 * things litt forbids (rounded-lg, text-sm, font-bold, shadow-md, ease-in-out, bg-zinc-900),
 * prose strings, duration and ease on different lines of one class list, variants, ternaries,
 * template literals, data objects with a `duration` key, and a litt-allow line.
 */
import { useState } from "react";
import { motion } from "motion/react";
import { Button } from "@/components/litt/button";
import { Dialog, DialogClose, DialogContent, DialogTrigger } from "@/components/litt/dialog";
import { Checkbox } from "@/components/litt/checkbox";
import { TextField } from "@/components/litt/input";
import { Tag } from "@/components/litt/tag";
import { useExit, useStagger, useTransition, useTravel } from "@/lib/litt/motion";
import { cn } from "@/lib/utils";

// No rounded-lg, no text-sm, no font-bold, no shadow-md and no bg-zinc-900 in here: ease-in-out is out too.
/* The old card used `transition-all duration-300` and `bg-primary`; the tiers replace both. */

type Tier = { name: string; price: string; duration: number; unit: string; includes: string[]; featured?: boolean };

const TIERS: Tier[] = [
  { name: "Sprint", price: "$4,800", duration: 2, unit: "weeks", includes: ["One focused design sprint, start to finish", "A Framer site that ships, not a mockup"] },
  { name: "Studio", price: "$12,000", duration: 6, unit: "weeks", includes: ["Brand, site and the system behind them", "Weekly review with Nick, plus a Friday note"], featured: true },
  { name: "Retainer", price: "$3,200 a month", duration: 4, unit: "weeks", includes: ["One build a month, any size", "Rounded corners, shadows and motion stay on the system"] },
];

/** A class list whose duration and ease sit on different lines of the same cn(...) call. */
const rowClass = cn(
  "flex min-h-litt-control-md items-center gap-litt-control rounded-litt-control px-litt-control-pad-md",
  "text-litt-body text-litt-fg-muted hover:bg-litt-surface-2 hover:text-litt-fg",
  "transition-[background-color,color]",
  "duration-(--litt-dur-instant)",
  "ease-litt",
);

/** Classes in an array, joined; and a shared base the ease comes from. */
const chipClass = [
  "inline-flex items-center rounded-litt-pill px-litt-control-pad-sm",
  "transition-colors",
  "duration-(--litt-dur-instant)",
  "ease-litt",
].join(" ");
const sharedRow = (extra: string) => cn(rowClass, extra, "hover:duration-(--litt-dur-instant)");

/** Enter and exit in one class list: each duration finds its own ease. */
const sheetClass = (open: boolean) =>
  cn(
    "fixed inset-x-0 bottom-0 rounded-t-litt-surface bg-litt-surface-1 shadow-litt-modal",
    open
      ? "translate-y-0 transition-transform duration-(--litt-dur-expressive) ease-litt-expressive"
      : "translate-y-full transition-transform duration-(--litt-dur-exit-expressive) ease-litt",
  );

/** Radix state variants: the closed state exits on the instant ease, the open state enters on the tier. */
const panelClass =
  "origin-top transition-[opacity,transform] " +
  "data-[state=open]:duration-(--litt-dur-responsive) data-[state=open]:ease-litt-responsive " +
  "data-[state=closed]:duration-(--litt-dur-exit-responsive) data-[state=closed]:ease-litt-out";

function Spinner() {
  return <span className="size-4 animate-spin rounded-litt-pill border border-litt-line-strong" aria-hidden />;
}

function Price({ tier }: { tier: Tier }) {
  const label = `${tier.name}, ${tier.duration} ${tier.unit}`;
  return (
    <div className="flex items-baseline gap-litt-control">
      <span className="text-litt-h2 text-litt-fg">{tier.price}</span>
      <span className="text-litt-small text-litt-fg-subtle">{label}</span>
      <a href="#plans" className="text-litt-small text-litt-accent-text underline underline-offset-4">Compare plans</a>
      <span className="rounded-litt-control bg-litt-data-amber-tint px-2 text-litt-caption text-litt-data-amber-text">Finance</span>
    </div>
  );
}

function PricingCard({ tier, index }: { tier: Tier; index: number }) {
  const enter = useTransition("expressive");
  const stagger = useStagger();
  const travel = useTravel();
  return (
    <motion.article
      initial={{ opacity: 0, y: travel / 2 }}
      animate={{ opacity: 1, y: 0, transition: { ...enter, delay: stagger * index } }}
      className={cn(
        "litt-raised flex flex-col gap-litt-gutter rounded-litt-surface border border-litt-line bg-litt-surface-1 p-litt-gutter",
        tier.featured && "border-litt-line-strong shadow-litt-float",
      )}
    >
      <header className="flex items-center justify-between">
        <h3 className="text-litt-h4 text-litt-fg">{tier.name}</h3>
        {tier.featured ? <Tag>Most picked</Tag> : null}
      </header>
      <Price tier={tier} />
      <ul className="flex flex-col gap-litt-control text-litt-body text-litt-fg-muted">
        {tier.includes.map((line) => (
          <li key={line} className={rowClass}>{line}</li>
        ))}
      </ul>
      <Button size="lg" variant={tier.featured ? "primary" : "secondary"} className="mt-auto w-full">
        Book {tier.name}
      </Button>
      {/* Nick's note: bold type, big shadows and bg-white cards are what this studio stays away from. */}
      <p className="text-litt-small text-litt-fg-subtle">Nick's studio sets titles at 500 and labels at 600, never bold. Shadows are glows, not drops.</p>
    </motion.article>
  );
}

export function SettingsDialog() {
  const [name, setName] = useState("Nick");
  const [email, setEmail] = useState("nick@studio.example");
  const [notify, setNotify] = useState(true);
  const exit = useExit("responsive");
  void exit;
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="secondary">Settings</Button>
      </DialogTrigger>
      <DialogContent className="flex w-full max-w-litt-reading flex-col gap-litt-gutter p-litt-gutter">
        <h2 className="text-litt-h3 text-litt-fg">Settings</h2>
        <p className="text-litt-body text-litt-fg-muted">How the studio reaches you. Changes save when you press Save.</p>
        <TextField label="Display name" value={name} onChange={(e) => setName(e.target.value)} />
        <TextField label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <label className="flex items-center gap-litt-control text-litt-body text-litt-fg">
          <Checkbox checked={notify} onCheckedChange={(v) => setNotify(v === true)} />
          Email me when a project moves
        </label>
        <div className="flex justify-end gap-litt-control">
          <DialogClose asChild>
            <Button size="lg" variant="secondary">Cancel</Button>
          </DialogClose>
          <Button size="lg">Save</Button>
        </div>
        <button
          type="button"
          className={cn(
            "inline-flex h-litt-control-sm items-center rounded-litt-control px-litt-control-pad-sm",
            "font-litt-mono font-normal text-litt-caption text-litt-fg-subtle shadow-[inset_0_0_0_1px_var(--litt-line)]",
            "transition-colors duration-(--litt-dur-instant) ease-litt hover:text-litt-fg",
          )}
        >
          <Spinner />
          <span className="pl-litt-control">Syncing</span>
        </button>
        <kbd
          className="rounded-litt-control bg-litt-surface-2 px-litt-control-pad-sm text-[0.6875rem] text-litt-fg-subtle" // litt-allow: the spec's 11px kbd has no type token
        >
          Esc
        </kbd>
      </DialogContent>
    </Dialog>
  );
}

export default function Home() {
  return (
    <main className="mx-auto flex max-w-litt-content flex-col gap-litt-section px-litt-gutter py-litt-section font-litt-sans font-normal">
      <section className="flex max-w-litt-reading flex-col gap-litt-gutter">
        <h1 className="text-litt-display text-litt-fg">Pricing that fits how we work</h1>
        <p className="text-litt-reading text-litt-fg-muted">
          Three ways to work with the studio. Pick the one that matches the size of the build.
        </p>
        <SettingsDialog />
      </section>
      <section className="grid gap-litt-gutter md:grid-cols-3">
        {TIERS.map((tier, index) => (
          <PricingCard key={tier.name} tier={tier} index={index} />
        ))}
      </section>
      <div
        className={sheetClass(false) + " " + panelClass}
        style={{ borderRadius: "var(--litt-radius-surface)", boxShadow: "var(--litt-shadow-float)", color: "var(--litt-fg)" }}
      />
      <span className={chipClass + " " + sharedRow("text-litt-small")}>Draft</span>
      <div className="rounded-none bg-[color-mix(in_oklab,var(--litt-fg)_6%,transparent)] inset-shadow-litt-highlight shadow-none md:rounded-litt-pill" />
    </main>
  );
}

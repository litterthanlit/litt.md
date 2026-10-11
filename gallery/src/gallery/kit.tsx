/**
 * Gallery kit: the building blocks every page uses. Pages are airy (Nick's
 * call): one idea per stage, generous stages, captions that say what moves.
 */
import { useState, type ReactNode } from "react";
import type { Tier } from "@/motion";
import { Button } from "@/components/button";

export type PageMeta = {
  /** URL hash and nav id: letters, digits and dashes only. */
  id: string;
  title: string;
  /** Sidebar order. 0 is the overview. */
  order: number;
  /** One sentence: what the component is and what its motion does. */
  summary: string;
  tiers: Tier[];
  /**
   * The page may override the locked tokens with the motion dial. Every page
   * leaves this off except the Playground; the dial's CSS variables exist only
   * while a page with `tune` is open.
   */
  tune?: boolean;
};

const TIER_LABEL: Record<Tier, string> = { instant: "Instant", responsive: "Responsive", expressive: "Expressive" };

export function TierChip({ tier }: { tier: Tier }) {
  return (
    <span className="inline-flex h-6 items-center gap-1.5 rounded-pill bg-surface-2 px-2 text-caption text-fg-subtle shadow-[inset_0_0_0_1px_var(--line)]">
      <span
        className={
          "size-1.5 rounded-pill " +
          (tier === "expressive" ? "bg-accent" : tier === "responsive" ? "bg-fg-muted" : "bg-fg-subtle")
        }
        aria-hidden="true"
      />
      {TIER_LABEL[tier]}
    </span>
  );
}

export function Page({ meta, children }: { meta: PageMeta; children: ReactNode }) {
  return (
    <article aria-labelledby={`page-${meta.id}`} className="grid gap-16 pb-24">
      <header className="grid gap-4">
        <h1 id={`page-${meta.id}`} className="text-h1 text-fg text-balance">
          {meta.title}
        </h1>
        <p className="max-w-[56ch] text-reading text-fg-muted">{meta.summary}</p>
        <div className="flex flex-wrap gap-2">
          {meta.tiers.map((t) => (
            <TierChip key={t} tier={t} />
          ))}
        </div>
      </header>
      {children}
    </article>
  );
}

/** Remount children to replay an entrance. */
export function useReplay(): [number, () => void] {
  const [key, setKey] = useState(0);
  return [key, () => setKey((k) => k + 1)];
}

type StageProps = {
  title: string;
  /** What moves, how, and why. Plain words. */
  caption: ReactNode;
  tier?: Tier;
  onReplay?: () => void;
  replayLabel?: string;
  /** Stage height. Airy by default. */
  size?: "md" | "lg";
  /** Where the demo sits inside the stage. */
  align?: "center" | "start" | "end";
  children: ReactNode;
};

export function Stage({ title, caption, tier, onReplay, replayLabel = "Replay", size = "md", align = "center", children }: StageProps) {
  const place = align === "center" ? "place-items-center" : align === "start" ? "place-items-start" : "place-items-end";
  return (
    <section className="grid gap-6" aria-label={title}>
      <div
        className={
          "litt-raised relative grid overflow-visible rounded-surface p-8 sm:p-12 " + place + " " + (size === "lg" ? "min-h-112" : "min-h-80")
        }
      >
        {children}
      </div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="grid max-w-[60ch] gap-1">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-body text-fg">{title}</h2>
            {tier && <TierChip tier={tier} />}
          </div>
          <p className="text-small text-fg-subtle">{caption}</p>
        </div>
        {onReplay && (
          <Button size="sm" variant="secondary" onClick={onReplay}>
            {replayLabel}
          </Button>
        )}
      </div>
    </section>
  );
}

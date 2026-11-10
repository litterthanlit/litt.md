/**
 * Candidate scales for Flat, compared on the canvas (proposals/world-scale.md). Every world has the same type sizes,
 * control heights and spacing unit today; these show what Flat looks like when one of them changes. They are
 * comparison data, not tokens: the one Nick picks moves into the Flat block of tokens.css, and this file goes with
 * the canvas. A frame sets its candidate as custom properties, so every litt part inside reads it; an overlay a part
 * opens (a menu, the lightbox) is drawn outside the frame and keeps today's scale.
 */
import type { CSSProperties, ReactNode } from "react";
import { MaterialProvider } from "@/motion";

export type Scale = { id: "today" | "space" | "type" | "open"; name: string; note: string; vars: CSSProperties };

/* Type stays; the spacing unit goes from 4px to 5px, and 14px text sits on a 24px line. */
const SPACE = {
  "--spacing": "0.3125rem", // litt-allow: candidate scale, a 5px unit
  "--type-body-leading": "1.5rem", // litt-allow: candidate scale
  "--type-reading-leading": "1.5rem", // litt-allow: candidate scale
  "--type-h2-leading": "1.5rem", // litt-allow: candidate scale
  "--type-h3-leading": "1.5rem", // litt-allow: candidate scale
  "--type-h4-leading": "1.5rem", // litt-allow: candidate scale
} as CSSProperties;

/* Space stays; text goes from 14 to 16 on a 24px line and small from 13 to 14. The 18px title is the ceiling, as today. */
const TYPE = {
  "--type-body-size": "1rem", // litt-allow: candidate scale
  "--type-body-leading": "1.5rem", // litt-allow: candidate scale
  "--type-reading-size": "1rem", // litt-allow: candidate scale
  "--type-reading-leading": "1.5rem", // litt-allow: candidate scale
  "--type-h2-size": "1rem", // litt-allow: candidate scale
  "--type-h2-leading": "1.5rem", // litt-allow: candidate scale
  "--type-h3-size": "1rem", // litt-allow: candidate scale
  "--type-h3-leading": "1.5rem", // litt-allow: candidate scale
  "--type-h4-size": "1rem", // litt-allow: candidate scale
  "--type-h4-leading": "1.5rem", // litt-allow: candidate scale
  "--type-small-size": "0.875rem", // litt-allow: candidate scale
  "--type-small-leading": "1.375rem", // litt-allow: candidate scale
  "--control-text-sm": "0.875rem", // litt-allow: candidate scale
  "--control-text-md": "1rem", // litt-allow: candidate scale
} as CSSProperties;

export const SCALES: Scale[] = [
  { id: "today", name: "Today", note: "What Flat ships: the same sizes as Press.", vars: {} },
  { id: "space", name: "Space", note: "Type as today. Every gap, padding and box a quarter larger (a 5px unit), text on a 24px line.", vars: SPACE },
  { id: "type", name: "Type", note: "Space as today. Text at 16 on a 24px line, small text at 14, the title still 18.", vars: TYPE },
  { id: "open", name: "Open", note: "Space and Type together, and md controls at 48.", vars: { ...SPACE, ...TYPE, "--control-md": "48px" } as CSSProperties }, // litt-allow: candidate scale
];

/**
 * One candidate around some litt parts. The name and note sit outside the candidate, in today's sizes, so the four
 * frames label themselves alike. The samples under them sit inside it: text at the body and small sizes, a bar as
 * tall as an md control and a square four units wide.
 */
export function ScaleFrame({ scale, children }: { scale: Scale; children: ReactNode }) {
  return (
    <div className="grid gap-6">
      <div className="grid gap-1">
        <span className="text-small font-title text-fg">{scale.name}</span>
        <span className="text-small text-fg-subtle">{scale.note}</span>
      </div>
      <MaterialProvider material="flat">
        <div data-material="flat" data-scale={scale.id} style={scale.vars} className="grid gap-8 text-fg-muted">
          <div aria-hidden="true" className="flex items-end gap-4">
            <span data-probe="body" className="text-body text-fg">Aa</span>
            <span data-probe="small" className="text-small text-fg">Aa</span>
            <span data-probe="control" className="h-control-md w-2 rounded-pill bg-fg" />
            <span data-probe="unit" className="size-4 bg-fg" />
          </div>
          {children}
        </div>
      </MaterialProvider>
    </div>
  );
}

import { useState } from "react";
import { Button } from "@/components/button";
import { ArchiveIcon, CopyIcon, SettingsIcon, ShareIcon, TrashIcon } from "@/components/icons";
import { Tooltip, TooltipProvider, type TooltipSide } from "@/components/tooltip";
import { Page, Stage, type PageMeta } from "../kit";

export const meta: PageMeta = {
  id: "tooltip",
  title: "Tooltip",
  order: 2,
  summary:
    "A small solid label for icons, shortcuts and status. It opens after 200ms of hover or at once on focus, then grows from its trigger and travels in from the side it renders on.",
  tiers: ["instant", "responsive"],
};

function Divider() {
  return <span aria-hidden="true" className="mx-1 h-5 w-px bg-line" />;
}

function Toolbar() {
  return (
    <div role="group" aria-label="Project actions" className="flex flex-wrap items-center justify-center gap-1">
      <Tooltip content="Copy link" shortcut="⇧⌘C">
        <Button iconOnly variant="ghost" aria-label="Copy link"><CopyIcon /></Button>
      </Tooltip>
      <Tooltip content="Share" shortcut="⇧⌘S">
        <Button iconOnly variant="ghost" aria-label="Share"><ShareIcon /></Button>
      </Tooltip>
      <Divider />
      <Tooltip content="Archive project" shortcut="E">
        <Button iconOnly variant="ghost" aria-label="Archive project"><ArchiveIcon /></Button>
      </Tooltip>
      <Tooltip content="Project settings" shortcut="⌘,">
        <Button iconOnly variant="ghost" aria-label="Project settings"><SettingsIcon /></Button>
      </Tooltip>
      <Divider />
      <Tooltip content="Delete project" shortcut="⌫">
        <Button iconOnly variant="ghost" aria-label="Delete project"><TrashIcon /></Button>
      </Tooltip>
    </div>
  );
}

const SIDES: { side: TooltipSide; label: string; content: string; cell: string }[] = [
  { side: "top", label: "Top", content: "Published 4 minutes ago", cell: "col-start-2 row-start-1" },
  { side: "left", label: "Left", content: "3 pages in draft", cell: "col-start-1 row-start-2" },
  { side: "right", label: "Right", content: "Review requested", cell: "col-start-3 row-start-2" },
  { side: "bottom", label: "Bottom", content: "Archived in March", cell: "col-start-2 row-start-3" },
];

function Sides({ pinned, onPinnedChange }: { pinned: boolean; onPinnedChange: (v: boolean) => void }) {
  return (
    <div className="grid grid-cols-[auto_auto_auto] justify-center gap-x-6 gap-y-6 sm:gap-x-12">
      {SIDES.map((s) => (
        <div key={s.side} className={s.cell + " grid place-items-center"}>
          <Tooltip
            side={s.side}
            content={s.content}
            open={pinned ? true : undefined}
            onOpenChange={(o) => !o && onPinnedChange(false)}
          >
            <Button>{s.label}</Button>
          </Tooltip>
        </div>
      ))}
    </div>
  );
}

function LongText() {
  return (
    <div className="grid max-w-[48ch] gap-8">
      <div className="flex items-center gap-2 text-body text-fg-muted">
        <Tooltip
          side="top"
          align="start"
          content="Build 5f2e9c1 is live on atelier-nord.com. Published 4 minutes ago from the main branch."
        >
          <button
            type="button"
            aria-label="Production status"
            className="grid size-6 shrink-0 cursor-help place-items-center rounded-pill"
          >
            <span className="size-2 rounded-pill bg-success" aria-hidden="true" />
          </button>
        </Tooltip>
        <span>Production is live</span>
      </div>
      <p className="text-body text-fg-muted">
        Pages are served from the{" "}
        <Tooltip
          side="bottom"
          content="The edge cache keeps a copy of each page close to the visitor. Publishing clears it, so the first visit after a publish can be a little slower."
        >
          <button
            type="button"
            className="inline cursor-help rounded-control text-fg underline decoration-fg-subtle decoration-dotted underline-offset-4"
          >
            edge cache
          </button>
        </Tooltip>
        , so a change can take up to a minute to show.
      </p>
    </div>
  );
}

export default function TooltipPage() {
  const [pinned, setPinned] = useState(false);
  return (
    <TooltipProvider>
      <Page meta={meta}>
        <Stage
          title="Toolbar"
          tier="responsive"
          caption="Rest on an icon and its tooltip opens after 200ms. Once one has shown, sweep across the bar: the next opens at once, for 300ms after the last one closes. Keyboard focus opens it instantly too. Each one fades and scales in from its trigger."
        >
          <Toolbar />
        </Stage>

        <Stage
          title="Four sides"
          tier="responsive"
          size="lg"
          replayLabel="Show all four"
          onReplay={() => setPinned(true)}
          caption="The tooltip starts a quarter of the travel distance nearer its trigger and moves out, so top rises and right slides right. It follows the side it really opens on: when there is no room it flips, and the movement flips with it. Narrow the window to see it."
        >
          <Sides pinned={pinned} onPinnedChange={setPinned} />
        </Stage>

        <Stage
          title="Longer text"
          tier="responsive"
          caption="Text wraps at 240px and keeps the same entrance. Use it on a status dot or a dotted term, never to hide something people need. On touch, a tap shows it until the next tap."
        >
          <LongText />
        </Stage>
      </Page>
    </TooltipProvider>
  );
}

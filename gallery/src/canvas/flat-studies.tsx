/**
 * Flat studies: the list (plans/027, phase 0's stop). The twenty studies proposed for Flat, for Nick to confirm or
 * strike: an intro and Flat's bar, then every part as Flat's wall tile ships it today, live, with a quiet line under it
 * saying what it still lacks (its marks, its hand, its colour or words), and the two calls that wait.
 *
 * Each tile is the gallery's own WallTile (wall-tile.tsx) under WorldContext "flat", as #flat/components draws it, with
 * no mosaic. The frame sets Flat's theme and accent (lookAttributes) and a MaterialProvider, whatever the gallery's look,
 * and is the OverlayRoot for what a part opens (a select's list, a toast). A tile's name links to its page in the
 * gallery; here the canvas keeps the click, so the workspace is never lost to it.
 */
import { useState, type MouseEvent, type ReactNode } from "react";
import { Toaster } from "@/components/toast";
import { MaterialProvider, OverlayRoot } from "@/motion";
import { lookAttributes } from "@/gallery/look";
import { WorldContext } from "@/gallery/kit";
import { pages } from "@/gallery/registry";
import { WallTile } from "@/gallery/wall-tile";

type Study = {
  id: string;
  /** Whether a part is marked with its kind. */
  marks: string;
  /** How the hand moves it today. */
  hand: string;
  /** Its colour or its words. */
  look: string;
  pilot?: boolean;
};

const SET: Study[] = [
  { id: "context-budget", marks: "Passes rules 3 and 4", hand: "Press to pick a window", look: "The reference: what Flat should look like" },
  { id: "hold-confirm", marks: "Passes rules 3 and 4", hand: "Hold the pill; an early release rewinds", look: "On the sunset ramp" },
  { id: "agent-run", marks: "Some parts unmarked", hand: "Open the steps, replay", look: "Colour and words fine" },
  { id: "toast-stack", marks: "Some parts unmarked", hand: "Hover, focus or tap fans it out", look: "Colour and words fine" },
  { id: "poll", marks: "Passes rules 3 and 4", hand: "Tap only, no drag; buttons, not a radio group", look: "Note says “click any pill”", pilot: true },
  { id: "streak", marks: "Passes rules 3 and 4", hand: "Tap and hover", look: "Instruction text inside the part" },
  { id: "kudos", marks: "A few words unmarked", hand: "Tap only", look: "Tap dip not picked yet" },
  { id: "reaction-bar", marks: "Passes rules 3 and 4", hand: "Tap only", look: "Words to check" },
  { id: "reading-progress", marks: "Passes rules 3 and 4", hand: "Click a chapter", look: "Solid fills off the ramp, not caught by the check" },
  { id: "goal-ring", marks: "A few parts unmarked", hand: "Two keys step it, no drag", look: "Gradient off the sunset ramp" },
  { id: "progress", marks: "No paper, no marks", hand: "A press runs a script", look: "On the sunset ramp" },
  { id: "toast", marks: "No paper, no marks", hand: "Press to raise, drag to dismiss", look: "Colour and words fine" },
];

const STAPLES: Study[] = [
  { id: "button", marks: "No marks", hand: "Press, nothing moves", look: "Words fine" },
  { id: "slider", marks: "No marks", hand: "Drags 1:1", look: "Colour and words fine", pilot: true },
  { id: "switch", marks: "No marks", hand: "Drags 1:1", look: "Colour and words fine" },
  { id: "segmented", marks: "No marks", hand: "Press and arrows", look: "No Flat stage" },
  { id: "checkbox", marks: "No marks", hand: "Press", look: "Colour and words fine" },
  { id: "tabs", marks: "No marks", hand: "Press and arrows", look: "Colour and words fine" },
  { id: "input", marks: "No marks", hand: "Type", look: "Colour and words fine" },
  { id: "select", marks: "No marks", hand: "Open and choose", look: "Colour and words fine" },
];

const BAR = [
  "One arrival when it comes into view, then still. Nothing under reduced motion.",
  "Fits its tile and the player's screen at 320px.",
  "Built ground, then paper, then part, and every part marked with its kind.",
  "One ink fill per view; Candy on data only; how much is the sunset ramp.",
  "The hand moves it directly: a drag follows 1:1, a press answers on the way down.",
  "One tab stop, arrows, Home and End.",
  "Changes are announced; no instructions written inside the part.",
  "Flat's words: site, post, issue, letter, reader.",
  "Its page can take it apart: Anatomy, States, Replay.",
  "Only Flat's body and its page change.",
];

/* A tile's name follows its page in the gallery; on the canvas the click stays here. */
const keepClick = (e: MouseEvent) => {
  if (e.target instanceof Element && e.target.closest("[data-tile-foot] a")) e.preventDefault();
};

function Tile({ study }: { study: Study }) {
  const page = pages.find((p) => p.id === study.id);
  return (
    <li className="grid min-w-0 grid-rows-[1fr_auto] gap-3">
      {page ? (
        <WallTile page={page} href={`#flat/${page.id}`} heading="h3" />
      ) : (
        <p className="text-small text-fg-muted">No page named {study.id}.</p>
      )}
      <div className="grid gap-1 px-2">
        {study.pilot && <p className="text-small font-label text-fg">Pilot</p>}
        <p className="text-small text-fg-muted">
          {study.marks} · {study.hand} · {study.look}
        </p>
      </div>
    </li>
  );
}

function Group({ title, studies }: { title: string; studies: Study[] }) {
  return (
    <section aria-label={title} className="grid gap-6">
      <h2 className="text-h3 font-title text-fg">{title}</h2>
      <ul className="grid grid-cols-3 gap-x-6 gap-y-10">
        {studies.map((s) => (
          <Tile key={s.id} study={s} />
        ))}
      </ul>
    </section>
  );
}

function Frame({ dark, children }: { dark: boolean; children: ReactNode }) {
  const [el, setEl] = useState<HTMLDivElement | null>(null);
  return (
    <WorldContext.Provider value="flat">
      <MaterialProvider material="flat">
        <div
          ref={setEl}
          {...lookAttributes({ accent: "world", material: "flat" }, dark)}
          onClickCapture={keepClick}
          className="relative grid content-start gap-16 rounded-surface bg-canvas p-10 text-fg contain-layout"
        >
          <OverlayRoot container={el}>
            <Toaster>{children}</Toaster>
          </OverlayRoot>
        </div>
      </MaterialProvider>
    </WorldContext.Provider>
  );
}

/** The list, in light or dark. */
export function FlatStudies({ dark }: { dark: boolean }) {
  return (
    <Frame dark={dark}>
      <header className="grid grid-cols-2 gap-12">
        <div className="grid content-start gap-4">
          <span className="text-small text-fg-subtle">{dark ? "Dark" : "Light"}</span>
          <h2 className="text-h2 font-title text-fg">Flat studies: the list</h2>
          <p className="max-w-[60ch] text-body text-fg">
            Flat goes to the bar one study at a time. These are the twenty proposed. Each tile is the part as it ships today,
            live: press it, drag it, read it. The line under it says what it still lacks: its marks, its hand, then its colour
            or words.
          </p>
        </div>
        <section aria-label="The bar" className="grid content-start gap-3">
          <h2 className="text-h4 font-title text-fg">The bar</h2>
          <ol className="grid list-decimal gap-1.5 pl-6 text-small text-fg marker:text-fg-subtle">
            {BAR.map((rule) => (
              <li key={rule}>{rule}</li>
            ))}
          </ol>
        </section>
      </header>
      <Group title="The set (twelve)" studies={SET} />
      <Group title="Staples (eight)" studies={STAPLES} />
      <section aria-label="For Nick" className="flat-sheet grid max-w-[60ch] gap-3 rounded-surface p-8">
        <h2 className="text-h4 font-title text-fg">For Nick</h2>
        <p className="text-small text-fg">Two calls wait.</p>
        <ul className="grid list-disc gap-1.5 pl-6 text-small text-fg marker:text-fg-subtle">
          <li>Reaction bar: a data hue fills a button. Keep it, or give it back to the ink?</li>
          <li>Kudos: the tap dip, not picked yet.</li>
        </ul>
        <p className="text-small font-label text-fg">Confirm the list and the bar, or strike a tile.</p>
      </section>
    </Frame>
  );
}

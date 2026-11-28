/**
 * The Flat studies as a wall (Nick, 2026-11-28): Flat's set, the 23 studies in the studies page's order
 * (`shelvesOf("flat")`'s "In the set", which is SET.flat), and no base kit. The grid is the studies page's: columns of
 * at least 340px that fill the row (three on a laptop), 24px apart across and 40px down, centred at up to 1240px.
 *
 * Each study is Flat's own tile (wall-tile.tsx under Flat's WorldContext): the object on the grey ground with its name
 * and line, running itself until a hand arrives (self-run.tsx), and opening large in Flat's viewer (flat-viewer.tsx),
 * which steps through the studies. A tile's name opens the study's page in Flat (#flat/<id>).
 *
 * The landing page (#systems) and Flat's home (#flat, where the player was; it is hidden for now) both draw it.
 */
import { Toaster } from "@/components/toast";
import { WorldContext } from "./kit";
import { ViewerHost, openViewer } from "./flat-viewer";
import { shelvesOf } from "./play-object/takes";
import { WallTile } from "./wall-tile";

const studies = () => shelvesOf("flat")[0]?.pages ?? [];
const hrefOf = (p: { id: string }) => `#flat/${p.id}`;

export function StudiesWall({ heading = "h2" }: { heading?: "h2" | "h3" }) {
  const all = studies();
  return (
    <WorldContext.Provider value="flat">
      <Toaster>
        <ul aria-label="Flat studies" className="mx-auto grid w-full max-w-310 min-w-0 grid-cols-[repeat(auto-fill,minmax(min(100%,340px),1fr))] gap-x-6 gap-y-10">
          {all.map((p, i) => (
            <li key={p.id} className="grid min-w-0">
              <WallTile
                page={p}
                href={hrefOf(p)}
                heading={heading}
                onOpen={(tile, button) => openViewer({ pages: all, at: i, hrefOf, tile, returnTo: button ?? tile })}
              />
            </li>
          ))}
        </ul>
        <ViewerHost />
      </Toaster>
    </WorldContext.Provider>
  );
}

/** Flat's home: the studies' title and line over the wall. */
export function FlatStudiesHome() {
  return (
    <article aria-labelledby="flat-studies-title" className="grid gap-10 pb-24">
      <header className="mx-auto grid w-full max-w-310 gap-2">
        <h1 id="flat-studies-title" tabIndex={-1} className="text-h1 text-fg outline-none">
          Flat studies
        </h1>
        <p className="max-w-[52ch] text-body text-fg-muted">Small studies in motion, feedback and touch. Each runs by itself until you touch it; open one to use it.</p>
      </header>
      <StudiesWall />
    </article>
  );
}

/**
 * Sources: where an answer came from (components.md, "Sources"; proposals/agents-2.md). Sources holds a turn's sources
 * and numbers them once, Citation is the numbered mark a markdown renderer puts in the running text, and SourceList is
 * the same sources as rows: under the answer, or inside the search call that found them. One Source feeds all three.
 *
 * - Anatomy, the mark: a 16px chip on the line, min 16 wide with 4px of side padding at the control radius, the
 *   number at the caption size (text weight, tabular) in fg-muted on fg 6%, 4px after the word. It never grows the line
 *   box. It is flat (R3): a reference you follow, not an object you move, so it never rises, takes no underline and no
 *   accent. It is a link to the source in a new tab (rel noreferrer), as citations are everywhere, and the HoverCard's
 *   trigger: after the pointer rests 500ms, or at once on keyboard focus, the card grows from it (the responsive tier)
 *   with the kind's icon and the site (small, fg-muted), the title (small, title weight, fg, two lines) as the link,
 *   the passage in quotes (small, fg-muted, four lines, no rail and no tint) and the read words (caption, fg-subtle).
 *   `quote` replaces the passage for one mark, because one page can back two claims.
 * - Anatomy, the list: an ol, bare in the turn. A heading holds the label (small, title weight) and the count (caption,
 *   tabular). Each row is one link to the source in a new tab, at least 44px, two lines: the title (small, fg, cut at the
 *   end; a file's title in the mono) over the site and the read words (caption, fg-subtle). A 16px lead column holds the
 *   number chip, the mark's look but not a control, where a Tool call row shows its mark; the row's fill hangs 8px into
 *   the gutter so its text keeps the turn's edge. With `sources` (what a search found) a row the turn cites wears its
 *   number and an uncited one shows its kind's icon in fg-subtle with hidden "Not cited".
 * - The moment: rest on a mark and its row lights (fg 6%), and so does every other mark of that source (fg on fg 12%).
 *   Rest on a row and its marks light. Color only, on the instant tier; nothing moves. The light is a small store in
 *   Sources with two fields, `hovered` (the pointer) and `focused` (the keyboard), merged where it is read
 *   (hovered ?? focused), so two hands never fight over one field, and marks and rows subscribe by id through
 *   useSyncExternalStore, so pointing re-renders only the marks and rows of the ids involved.
 * - Fun mode (motion/fun.tsx, a trial, off unless a <FunMode> is on): resting on a row pops its marks in reading order
 *   (scale 1.2 to 1 on the pop spring, a wave apart), and each transform is cleared when it lands, so the rest frame is
 *   Calm's exactly. Reduced motion turns it off.
 * - The boundary: parseSources is the one place a Source is checked. A later duplicate id is dropped, an href is kept
 *   only for http and https (a model's javascript: url shows as text), the site is read from the host when it is
 *   missing, and the number is the place in `sources`. `citationId` reads the `#cite-<id>` link a model writes and
 *   `unlinkCitations` strips those links for Copy, so the scheme lives in one file. A mark whose id the Sources does not
 *   hold, or a mark outside a Sources, renders nothing and warns once in development: a mark can stream in before its
 *   source does.
 * - Keys and assistive tech: marks and rows are links in the tab order. A mark is named "Source 2: <title>" and
 *   described by its site and "opens in a new tab"; focus opens the card at once and Esc closes it. The list is an ol
 *   named by the label (kept for assistive tech with `hideLabel`); a row reads its number, title, site, read words and
 *   "Opens in a new tab". The card is a preview only: everything in it is on the row or on the page the link opens.
 * - Motion: only the chip's and the row's colors fade, on the instant tier. The card is the HoverCard's (responsive
 *   tier, the exit token out).
 * - Touch: the card never opens (HoverCard's rule); the number pairs the mark with its row. A mark's hit area is 44px
 *   tall and 24px wide on a coarse pointer (an after: box), because two marks sit 4px apart in a line: the named
 *   exception to R9's 44 in width that prose links take. Rows are 44px, and a pressed row takes its hover fill.
 * - Disabled or read-only: nothing to disable. A source with no safe url is text: its mark is a plain chip and its row
 *   has no link.
 * - Forced colors: the chip keeps a 1px CanvasText border, and a lit chip or row takes Highlight and HighlightText.
 */
import { createContext, useContext, useEffect, useId, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { animate } from "motion/react";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/hover-card";
import { FileIcon, GlobeIcon } from "@/components/icons";
import { useFun } from "@/motion";

/* ----------------------------------------------------------------- data */

/** One page or file an agent found or read: the same shape for a citation's card, the list under an answer and a search call's results. */
export type Source = {
  /** A stable id the answer cites ("geist"). Unique inside one Sources; a later duplicate is dropped. */
  id: string;
  /** The page's title, as the agent read it. A file's title is its path. */
  title: string;
  /** Where it lives. Only http and https become links; any other url shows the title as text. */
  url: string;
  /** The site in words ("nextjs.org"). Without it, the url's host without "www.". */
  site?: string;
  /** The line the answer leans on, quoted in the card. A Citation's `quote` replaces it for that one mark. */
  passage?: string;
  /** When the agent read it, as words: "2 minutes ago", "27 Oct, 14:02". The card and the row say "Read 2 minutes ago". */
  readAt?: string;
  /** web shows the globe; file shows the file icon and sets the title in the mono. */
  kind?: "web" | "file";
};

/** A Source after the boundary: the link is safe or absent, the host is a word, and the number is its place. */
type ParsedSource = {
  id: string;
  /** 1-based place in `sources`: the number a mark shows and a row wears. */
  n: number;
  title: string;
  /** The url when it is http or https, else null: the title then shows as text. */
  href: string | null;
  site: string | null;
  passage: string | null;
  readAt: string | null;
  kind: "web" | "file";
};

/** The url when a browser would open it as a page. A model's `javascript:` or a bare path is not a link. */
function safeHref(url: string): string | null {
  try {
    const protocol = new URL(url).protocol;
    return protocol === "http:" || protocol === "https:" ? url : null;
  } catch {
    return null;
  }
}

/** "nextjs.org" from "https://www.nextjs.org/docs". */
const hostOf = (href: string | null) => (href ? new URL(href).hostname.replace(/^www\./, "") : null);

/** The one place a Source is checked: duplicates dropped, hrefs kept only for http and https, the site from the host, numbered by position. */
function parseSources(raw: readonly Source[]): ParsedSource[] {
  const seen = new Set<string>();
  const out: ParsedSource[] = [];
  for (const s of raw) {
    if (seen.has(s.id)) continue;
    seen.add(s.id);
    const href = safeHref(s.url);
    out.push({
      id: s.id,
      n: out.length + 1,
      title: s.title,
      href,
      site: s.site ?? hostOf(href),
      passage: s.passage ?? null,
      readAt: s.readAt ?? null,
      kind: s.kind ?? "web",
    });
  }
  return out;
}

/** The link a model writes to cite a source: `[2](#cite-geist)`. Read by citationId, removed by unlinkCitations. */
const CITE = "#cite-";

/**
 * The source id a markdown link names: "#cite-geist" gives "geist", and any other href gives null. Call it where your
 * markdown renderer meets a link, and render a Citation for the ids it returns.
 * @param href The link's href, as the renderer hands it to you.
 */
export function citationId(href: string | undefined): string | null {
  if (!href || !href.startsWith(CITE)) return null;
  const id = href.slice(CITE.length);
  return id ? id : null;
}

/**
 * Turns "[2](#cite-geist)" into "[2]" throughout a markdown string, for Copy and exports, so no fragment link leaves the
 * page. The number stays and the list under the answer explains it.
 * @param markdown The answer as the model wrote it.
 */
export function unlinkCitations(markdown: string): string {
  return markdown.replace(/\[([^\]]*)\]\(#cite-[^)\s]+\)/g, "[$1]");
}

/* ----------------------------------------------------------------- the light */

type Actor = "mark" | "row";
/** What one hand points at: the source, and from which side. */
type Light = { id: string; from: Actor } | null;
/** The pointer and the keyboard each own a field. They are merged only where the light is read. */
type Pointing = { hovered: Light; focused: Light };
type Hand = keyof Pointing;

type LightStore = {
  get: () => Pointing;
  subscribe: (listener: () => void) => () => void;
  /** A hand is now on a mark or a row of `id`. */
  point: (hand: Hand, id: string, from: Actor) => void;
  /** A hand left `id`. It clears the field only when that hand still holds this light, so a later pointing is never undone. */
  release: (hand: Hand, id: string, from: Actor) => void;
  /** A mark registers its element; the removal is returned. */
  register: (id: string, el: HTMLElement) => () => void;
  /** The marks of `id` in reading order, for fun mode's wave. */
  marksOf: (id: string) => HTMLElement[];
};

const litBy = (p: Pointing): Light => p.hovered ?? p.focused;

function createLightStore(): LightStore {
  let state: Pointing = { hovered: null, focused: null };
  const listeners = new Set<() => void>();
  const marks = new Map<string, Set<HTMLElement>>();
  const set = (hand: Hand, light: Light) => {
    state = { ...state, [hand]: light };
    listeners.forEach((l) => l());
  };
  const holds = (hand: Hand, id: string, from: Actor) => state[hand]?.id === id && state[hand]?.from === from;
  return {
    get: () => state,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    point: (hand, id, from) => {
      if (!holds(hand, id, from)) set(hand, { id, from });
    },
    release: (hand, id, from) => {
      if (holds(hand, id, from)) set(hand, null);
    },
    register: (id, el) => {
      const set = marks.get(id) ?? new Set();
      set.add(el);
      marks.set(id, set);
      return () => {
        set.delete(el);
      };
    },
    marksOf: (id) =>
      [...(marks.get(id) ?? [])].sort((a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1)),
  };
}

/** True while a hand points at `id`, from either side. It re-renders only when this id's answer flips. */
function useLit(store: LightStore, id: string): boolean {
  return useSyncExternalStore(
    store.subscribe,
    () => litBy(store.get())?.id === id,
    () => false,
  );
}

/* ----------------------------------------------------------------- the provider */

type SourcesContextValue = {
  list: readonly ParsedSource[];
  byId: ReadonlyMap<string, ParsedSource>;
  store: LightStore;
};

const SourcesContext = createContext<SourcesContextValue | null>(null);

export type SourcesProps = {
  /** The turn's sources, in the order they are numbered. Keep the order while the answer streams, so a number never changes under a reader. */
  sources: Source[];
  /** The parts of the turn that show sources: the search call with its results, the MessageText with its Citations, the SourceList. */
  children: ReactNode;
};

/**
 * Holds one turn's sources, their numbers and what the reader points at. It draws nothing: put it inside the Message,
 * around the turn's parts, so a search call's results, the marks in the text and the list under it share one numbering.
 */
export function Sources({ sources, children }: SourcesProps) {
  const [store] = useState(createLightStore);
  const value = useMemo<SourcesContextValue>(() => {
    const list = parseSources(sources);
    return { list, byId: new Map(list.map((s) => [s.id, s])), store };
  }, [sources, store]);
  return <SourcesContext value={value}>{children}</SourcesContext>;
}

/* ----------------------------------------------------------------- shared looks */

/** The flat 16px chip with the number, shared by the mark and the row's lead so they read as one thing. Rest or lit, never both. */
const CHIP =
  "inline-flex h-4 min-w-4 items-center justify-center rounded-control px-1 text-caption font-normal leading-none tabular-nums " +
  "transition-colors duration-(--dur-instant) ease-litt forced-colors:border forced-colors:border-[CanvasText]";
const CHIP_REST = "bg-[color-mix(in_oklab,var(--fg)_6%,transparent)] text-fg-muted";
const CHIP_LIT = "bg-[color-mix(in_oklab,var(--fg)_12%,transparent)] text-fg forced-colors:bg-[Highlight] forced-colors:text-[HighlightText]";
const chip = (lit: boolean) => CHIP + " " + (lit ? CHIP_LIT : CHIP_REST);
/* MessageText styles every `a` inside it at (0,1,1); the data-citation variant compiles to (0,2,0) and wins. */
const MARK_LINK = "data-citation:no-underline";
const markInk = (lit: boolean) => (lit ? "data-citation:text-fg" : "data-citation:text-fg-muted");
/* 44px tall and 24px wide on a finger: marks sit 4px apart in a line, so the box cannot be wider. */
const MARK_HIT = "relative pointer-coarse:after:absolute pointer-coarse:after:-inset-x-1 pointer-coarse:after:-inset-y-3.5";
const FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus";

/** How many waves apart the marks of one source pop in fun mode. One wave is tuned for neighbouring bars; marks sit a clause apart. */
const MARK_WAVES = 6;

function KindIcon({ kind, className = "" }: { kind: "web" | "file"; className?: string }) {
  return kind === "file" ? <FileIcon className={"shrink-0 " + className} /> : <GlobeIcon className={"shrink-0 " + className} />;
}

/** Whether this is a development build. The bundler replaces `process.env.NODE_ENV`; where it does not, stay quiet. */
declare const process: { env: { NODE_ENV?: string } };
const inDevelopment = () => {
  try {
    return process.env.NODE_ENV !== "production";
  } catch {
    return false;
  }
};

const warned = new Set<string>();
/** Once per id and reason, in development: a mark can stream in before its source, and a host should hear about it once. */
function warnOnce(key: string, message: string) {
  if (warned.has(key) || !inDevelopment()) return;
  warned.add(key);
  console.warn(message);
}

/* ----------------------------------------------------------------- Citation */

export type CitationProps = {
  /** The id of the source it cites, in the nearest Sources. An id the Sources does not hold draws nothing. */
  source: string;
  /** The passage this mark leans on, when it is not the source's own. The card quotes it in place of the passage. */
  quote?: string;
  /** Extra classes for the mark. */
  className?: string;
};

/**
 * The numbered mark in running text: put it where your markdown renderer meets a link whose href citationId reads. A
 * link to the source in a new tab, and a preview card after the pointer rests or at once on keyboard focus. Resting on it
 * lights its row and its sibling marks.
 */
export function Citation({ source, quote, className = "" }: CitationProps) {
  const ctx = useContext(SourcesContext);
  const parsed = ctx?.byId.get(source);
  if (!ctx) {
    warnOnce("outside:" + source, `litt: <Citation source="${source}"> sits outside a Sources and draws nothing.`);
    return null;
  }
  if (!parsed) {
    warnOnce("unknown:" + source, `litt: <Citation source="${source}"> names no source in its Sources and draws nothing.`);
    return null;
  }
  return <Mark source={parsed} quote={quote} store={ctx.store} className={className} />;
}

function Mark({ source, quote, store, className }: { source: ParsedSource; quote?: string; store: LightStore; className: string }) {
  const { id, n, title, href, site } = source;
  const lit = useLit(store, id);
  const fun = useFun();
  const el = useRef<HTMLElement | null>(null);
  /* One ref for the link and the plain chip. */
  const setEl = (node: HTMLElement | null) => {
    el.current = node;
  };
  const describedBy = useId();

  useEffect(() => {
    const node = el.current;
    if (!node) return;
    return store.register(id, node);
  }, [store, id]);

  /* Fun mode: lit from a row, the marks of that source pop in reading order. The transform is cleared on landing, and
     when the light goes before that, so the rest frame is always Calm's. */
  useEffect(() => {
    const node = el.current;
    if (!lit || !fun || !node || litBy(store.get())?.from !== "row") return;
    const k = Math.max(0, store.marksOf(id).indexOf(node));
    const run = animate(node, { scale: [1.2, 1] }, { ...fun.pop, delay: k * fun.wave * MARK_WAVES });
    const clear = () => {
      node.style.transform = "";
    };
    run.then(clear);
    return () => {
      run.stop();
      clear();
    };
  }, [lit, fun, store, id]);

  const look = chip(lit) + " " + className;
  const name = `Source ${n}: ${title}`;

  if (!href) {
    return (
      <span ref={setEl} data-citation="" data-lit={lit ? "" : undefined} className={"ms-1 align-baseline " + look}>
        <span aria-hidden="true">{n}</span>
        <span className="sr-only">{name}</span>
      </span>
    );
  }

  return (
    <HoverCard>
      <HoverCardTrigger>
        <a
          ref={setEl}
          href={href}
          target="_blank"
          rel="noreferrer"
          data-citation=""
          data-lit={lit ? "" : undefined}
          aria-label={name}
          aria-describedby={describedBy}
          onPointerEnter={() => store.point("hovered", id, "mark")}
          onPointerLeave={() => store.release("hovered", id, "mark")}
          onFocus={() => store.point("focused", id, "mark")}
          onBlur={() => store.release("focused", id, "mark")}
          className={"ms-1 align-baseline " + look + " " + MARK_LINK + " " + markInk(lit) + " " + MARK_HIT + " " + FOCUS}
        >
          {n}
          <span id={describedBy} className="sr-only">
            {site ? `${site}, opens in a new tab` : "Opens in a new tab"}
          </span>
        </a>
      </HoverCardTrigger>
      <HoverCardContent size="md">
        <SourcePreview source={source} quote={quote} />
      </HoverCardContent>
    </HoverCard>
  );
}

/** The card: the kind's icon and the site, the title as the link, the passage in quotes, when it was read. */
function SourcePreview({ source, quote }: { source: ParsedSource; quote?: string }) {
  const passage = quote ?? source.passage;
  const titleLook = "line-clamp-2 text-small text-fg " + (source.kind === "file" ? "font-mono font-normal " : "font-title ");
  return (
    <div className="grid gap-1">
      {source.site && (
        <p className="flex items-center gap-2 text-small text-fg-muted">
          <KindIcon kind={source.kind} className="text-fg-subtle" />
          <span className="min-w-0 truncate">{source.site}</span>
        </p>
      )}
      {source.href ? (
        <a href={source.href} target="_blank" rel="noreferrer" className={titleLook + "rounded-control hover:underline " + FOCUS}>
          {source.title}
        </a>
      ) : (
        <p className={titleLook}>{source.title}</p>
      )}
      {passage && <p className="line-clamp-4 text-small text-fg-muted">{`“${passage}”`}</p>}
      {source.readAt && <p className="mt-1 text-caption font-normal tabular-nums text-fg-subtle">Read {source.readAt}</p>}
    </div>
  );
}

/* ----------------------------------------------------------------- SourceList */

export type SourceListProps = {
  /** Sources to list in place of the turn's, such as one search's results. A result the turn cites wears its number; the others show their icon and say "Not cited". */
  sources?: Source[];
  /** The list's name: its heading, with the count, and its name for assistive tech. */
  label?: string;
  /** Keeps the label for assistive tech only, as inside a search call whose row already says what the list is. */
  hideLabel?: boolean;
  /** Extra classes for the list, such as a top margin. */
  className?: string;
};

/**
 * The sources as rows: the turn's under the answer, or one search's results inside its ToolCall's details. Each row is a
 * link that opens the source in a new tab, and resting on it lights the marks that cite it.
 */
export function SourceList({ sources, label = "Sources", hideLabel = false, className = "" }: SourceListProps) {
  const ctx = useContext(SourcesContext);
  const labelId = useId();
  const own = useMemo(() => (sources ? parseSources(sources) : null), [sources]);
  if (!ctx) {
    warnOnce("list-outside", "litt: <SourceList> sits outside a Sources and draws nothing.");
    return null;
  }
  const rows = own ?? ctx.list;
  if (!rows.length) return null;

  return (
    <div className={"grid min-w-0 font-sans whitespace-normal " + className}>
      <p id={labelId} className={hideLabel ? "sr-only" : "flex min-h-8 items-center gap-2"}>
        <span className="text-small font-title text-fg">{label}</span>
        <span className="text-caption font-normal tabular-nums text-fg-subtle">{rows.length}</span>
      </p>
      <ol role="list" aria-labelledby={labelId} className="m-0 grid list-none p-0">
        {rows.map((row) => (
          <SourceRow key={row.id} row={row} n={own ? (ctx.byId.get(row.id)?.n ?? null) : row.n} store={ctx.store} />
        ))}
      </ol>
    </div>
  );
}

/* The fill hangs 8px into the gutter on the start side (as MessageActions do), so the lead sits on the turn's edge where a
   Tool call row shows its mark, and the row never runs past its container's end. */
const ROW =
  "-ms-2 grid min-h-11 grid-cols-[1rem_minmax(0,1fr)] items-start gap-x-2 rounded-control px-2 py-1 text-start " +
  "transition-colors duration-(--dur-instant) ease-litt";
const ROW_LINK =
  "hover:bg-[color-mix(in_oklab,var(--fg)_6%,transparent)] pointer-coarse:active:bg-[color-mix(in_oklab,var(--fg)_6%,transparent)] " +
  "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus [-webkit-tap-highlight-color:transparent]";
const ROW_LIT = "bg-[color-mix(in_oklab,var(--fg)_6%,transparent)] forced-colors:bg-[Highlight] forced-colors:text-[HighlightText]";

/** One row: the lead (the number chip, or the kind's icon for an uncited result), the title over the site and the read words. */
function SourceRow({ row, n, store }: { row: ParsedSource; n: number | null; store: LightStore }) {
  const lit = useLit(store, row.id);
  const meta = [row.site, row.readAt ? `Read ${row.readAt}` : null].filter(Boolean).join(" · ");
  const body = (
    <>
      <span className="flex h-5 items-center" aria-hidden={n === null ? undefined : "true"}>
        {n === null ? (
          <>
            <KindIcon kind={row.kind} className="text-fg-subtle" />
            <span className="sr-only">Not cited.</span>
          </>
        ) : (
          <span className={chip(lit)}>{n}</span>
        )}
      </span>
      <span className="grid min-w-0">
        <span className={"truncate text-small text-fg " + (row.kind === "file" ? "font-mono" : "")}>
          {n !== null && <span className="sr-only">Source {n}: </span>}
          {row.title}
        </span>
        {meta && <span className="truncate text-caption font-normal tabular-nums text-fg-subtle">{meta}</span>}
      </span>
    </>
  );
  const look = ROW + (lit ? " " + ROW_LIT : "");
  return (
    <li className="min-w-0">
      {row.href ? (
        <a
          href={row.href}
          target="_blank"
          rel="noreferrer"
          data-lit={lit ? "" : undefined}
          onPointerEnter={() => store.point("hovered", row.id, "row")}
          onPointerLeave={() => store.release("hovered", row.id, "row")}
          onFocus={() => store.point("focused", row.id, "row")}
          onBlur={() => store.release("focused", row.id, "row")}
          className={look + " " + ROW_LINK}
        >
          {body}
          <span className="sr-only">Opens in a new tab.</span>
        </a>
      ) : (
        <div data-lit={lit ? "" : undefined} className={look}>
          {body}
        </div>
      )}
    </li>
  );
}

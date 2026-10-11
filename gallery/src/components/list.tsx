/**
 * List and cards: project rows, project cards, filter chips and the empty state.
 *
 * "Placed, not thrown": things arrive with intent and settle.
 *
 * - ProjectList is the page's ONE expressive moment. Rows fade in and rise from
 *   the dial's travel to rest, each waiting index x stagger. The cascade is
 *   capped at six, so row 7 onward arrive with row 6 and a long list never drags.
 * - ProjectGrid is responsive. Filtering re-flows the grid with Motion `layout`
 *   (position only, so text never stretches). Leaving cards fade and shrink to
 *   0.98 with no travel; added cards enter on the same tier.
 * - Hover is the instant tier and only changes fills and the hairline color.
 *   Rows and cards never move, and selection only turns the card's ring to the
 *   focus color.
 * - Corners: the list container and cards are rounded-surface; the rows inset 4px
 *   inside the container and the card cover inset 4px inside the card are
 *   rounded-control (concentric). Chips, tags and dots are pills.
 */
import type { ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useExit, useStagger, useTransition, useTravel } from "@/motion";
import { Button } from "@/components/button";
import { ProjectCover, type CoverName } from "./list-cover";

export type { CoverName } from "./list-cover";

export type ProjectStatus = "live" | "review" | "draft" | "idea";
export type ProjectFilter = "all" | "live" | "review" | "draft";

export type Project = {
  id: string;
  name: string;
  client: string;
  /** Last deploy, in words: "Deployed 2 days ago", "No deploy yet". */
  deploy: string;
  status: ProjectStatus;
  /** ISO date (YYYY-MM-DD) of the last edit. */
  updated: string;
  /** One line. */
  description: string;
  tags: string[];
  cover: CoverName;
  /** When set, the row is a link; otherwise it is a button. */
  href?: string;
};

/** The entrance cascade stops counting at this many rows. */
export const CASCADE_CAP = 6;

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
/** "2026-10-09" becomes "09 Oct": always six characters, so mono dates align. */
export function formatDate(iso: string) {
  const [, m, d] = iso.split("-");
  return `${d} ${MONTHS[Number(m) - 1]}`;
}

export function matchesFilter(p: Project, filter: ProjectFilter) {
  return filter === "all" || p.status === filter;
}

/* -------------------------------------------------------------------------- */
/* Tags                                                                       */
/* -------------------------------------------------------------------------- */

const STATUS: Record<ProjectStatus, { label: string; text: string; dot: string }> = {
  live: { label: "Live", text: "text-success", dot: "bg-success" },
  review: { label: "Review", text: "text-warning", dot: "bg-warning" },
  draft: { label: "Draft", text: "text-fg-subtle", dot: "bg-fg-subtle" },
  // Idea is neutral like Draft; the hollow dot tells them apart without color.
  idea: { label: "Idea", text: "text-fg-subtle", dot: "border border-fg-subtle" },
};

const tagBase =
  "inline-flex h-6 shrink-0 items-center whitespace-nowrap rounded-pill bg-surface-2 px-2 text-caption " +
  "shadow-[inset_0_0_0_1px_var(--line)]";

/** A status tag colors the text and a 6px dot, never the fill (components.md, Tag). */
export function StatusTag({ status, className = "" }: { status: ProjectStatus; className?: string }) {
  const s = STATUS[status];
  return (
    <span className={`${tagBase} gap-1.5 ${s.text} ${className}`}>
      <span className={`size-1.5 shrink-0 rounded-pill ${s.dot}`} aria-hidden="true" />
      {s.label}
    </span>
  );
}

export function ProjectTag({ children }: { children: ReactNode }) {
  return <span className={`${tagBase} text-fg-subtle`}>{children}</span>;
}

/* -------------------------------------------------------------------------- */
/* ProjectList: airy rows with the staggered entrance                         */
/* -------------------------------------------------------------------------- */

const rowClass =
  "flex size-full items-center gap-4 rounded-control px-4 text-left " +
  "cursor-pointer transition-[background-color] duration-(--dur-instant) ease-litt " +
  "hover:bg-[color-mix(in_oklab,var(--fg)_4%,transparent)] " +
  "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus";

function RowContent({ project }: { project: Project }) {
  return (
    <>
      <span className="grid min-w-0 flex-1 gap-1">
        <span className="truncate text-body text-fg">{project.name}</span>
        <span className="truncate text-caption text-fg-subtle">
          {project.client}
          <span className="hidden sm:inline"> · {project.deploy}</span>
        </span>
      </span>
      <span className="flex shrink-0 sm:w-24">
        <StatusTag status={project.status} />
      </span>
      <time
        dateTime={project.updated}
        className="hidden w-14 shrink-0 text-right font-mono text-caption tabular-nums text-fg-subtle sm:block"
      >
        {formatDate(project.updated)}
      </time>
    </>
  );
}

export type ProjectListProps = {
  projects: Project[];
  /** Called when a row without an href is pressed. */
  onOpen?: (project: Project) => void;
  /** Play the staggered entrance on mount. Remount (change `key`) to replay. */
  entrance?: boolean;
  label?: string;
  className?: string;
};

export function ProjectList({ projects, onOpen, entrance = true, label = "Projects", className = "" }: ProjectListProps) {
  const enter = useTransition("expressive");
  const travel = useTravel();
  const stagger = useStagger();
  return (
    <ul
      aria-label={label}
      className={"w-full rounded-surface p-1 shadow-[inset_0_0_0_1px_var(--line)] " + className}
    >
      {projects.map((p, i) => {
        // Rows after the sixth reuse the sixth's delay.
        const wait = Math.min(i, CASCADE_CAP - 1) * stagger;
        return (
          <motion.li
            key={p.id}
            className="h-16 border-b border-line last:border-b-0"
            initial={entrance ? { opacity: 0, y: travel } : false}
            animate={{ opacity: 1, y: 0, transition: { ...enter, delay: wait } }}
          >
            {p.href ? (
              <a href={p.href} className={rowClass}>
                <RowContent project={p} />
              </a>
            ) : (
              <button type="button" onClick={() => onOpen?.(p)} className={rowClass}>
                <RowContent project={p} />
              </button>
            )}
          </motion.li>
        );
      })}
    </ul>
  );
}

/* -------------------------------------------------------------------------- */
/* ProjectCard                                                                */
/* -------------------------------------------------------------------------- */

export type ProjectCardProps = {
  project: Project;
  selected?: boolean;
  onSelectedChange?: (selected: boolean) => void;
  onOpen?: (project: Project) => void;
  className?: string;
};

/**
 * A raised card: no shadow, nothing moves. Hover (instant tier) strengthens the
 * hairline (line to line-strong) and steps the cover fill (surface-2 to
 * surface-3). Selected turns the ring to 1px --focus and changes nothing else.
 * The whole card opens through one stretched button; the checkbox sits above it.
 */
export function ProjectCard({ project, selected = false, onSelectedChange, onOpen, className = "" }: ProjectCardProps) {
  return (
    <article
      data-selected={selected || undefined}
      className={"litt-raised group relative flex h-full flex-col rounded-surface p-1 " + className}
    >
      {/* The ring. It changes color only, on the instant tier. */}
      <span
        aria-hidden="true"
        className={
          "pointer-events-none absolute inset-0 rounded-surface border transition-[border-color] duration-(--dur-instant) ease-litt " +
          (selected ? "border-focus" : "border-line group-hover:border-line-strong")
        }
      />

      <div className="relative aspect-[8/5] shrink-0 overflow-hidden rounded-control bg-surface-2 transition-[background-color] duration-(--dur-instant) ease-litt group-hover:bg-surface-3">
        <ProjectCover name={project.cover} />
        <label className="absolute top-1 right-1 z-10 grid size-8 cursor-pointer place-items-center pointer-coarse:size-11">
          <input
            type="checkbox"
            checked={selected}
            onChange={(e) => onSelectedChange?.(e.target.checked)}
            aria-label={`Select ${project.name}`}
            className="size-4 cursor-pointer rounded-control accent-accent"
          />
        </label>
      </div>

      <div className="grid gap-1 px-3 pt-4">
        <h3 className="truncate text-body text-fg">{project.name}</h3>
        <p className="truncate text-small text-fg-subtle">{project.description}</p>
      </div>
      <div className="mt-auto flex flex-wrap gap-2 px-3 pt-4 pb-3">
        <StatusTag status={project.status} />
        {project.tags.map((t) => (
          <ProjectTag key={t}>{t}</ProjectTag>
        ))}
      </div>

      <button
        type="button"
        aria-label={`Open ${project.name}`}
        onClick={() => onOpen?.(project)}
        className="absolute inset-0 z-0 cursor-pointer rounded-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
      />
    </article>
  );
}

/* -------------------------------------------------------------------------- */
/* Filter chips                                                               */
/* -------------------------------------------------------------------------- */

const FILTERS: { id: ProjectFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "live", label: "Live" },
  { id: "review", label: "Review" },
  { id: "draft", label: "Draft" },
];

/** Pill chips. Selected is fg on surface-3; the rest are fg-subtle. Color and fill only. */
export function ProjectFilters({
  value,
  onChange,
  className = "",
}: {
  value: ProjectFilter;
  onChange: (filter: ProjectFilter) => void;
  className?: string;
}) {
  return (
    <div role="group" aria-label="Filter projects" className={"flex flex-wrap gap-2 " + className}>
      {FILTERS.map((f) => {
        const on = value === f.id;
        return (
          <button
            key={f.id}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(f.id)}
            className={
              "inline-flex h-control-sm cursor-pointer items-center rounded-pill px-control-pad-sm text-small " +
              "transition-[background-color,color] duration-(--dur-instant) ease-litt " +
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus " +
              (on
                ? "bg-surface-3 text-fg"
                : "text-fg-subtle hover:text-fg hover:bg-[color-mix(in_oklab,var(--fg)_6%,transparent)]")
            }
          >
            <span className="litt-trim">{f.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Empty state                                                                */
/* -------------------------------------------------------------------------- */

const EMPTY: Record<ProjectFilter, { line: string; hint: string }> = {
  all: { line: "No projects yet.", hint: "A new project starts as a draft and shows up here." },
  live: { line: "Nothing is live yet.", hint: "A project appears here once it is deployed." },
  review: { line: "Nothing is in review.", hint: "Send a draft for review and it lands here." },
  draft: { line: "No drafts right now.", hint: "New projects start as drafts." },
};

/** One line in fg-muted, a hint in fg-subtle, and the way out. Left-aligned, no illustration. */
export function ProjectsEmpty({ filter, onClearFilter }: { filter: ProjectFilter; onClearFilter?: () => void }) {
  const copy = EMPTY[filter];
  return (
    <div
      role="status"
      className="grid justify-items-start gap-6 rounded-surface bg-surface-2 p-8 shadow-[inset_0_0_0_1px_var(--line)]"
    >
      <div className="grid gap-1">
        <p className="text-body text-fg-muted">{copy.line}</p>
        <p className="text-small text-fg-subtle">{copy.hint}</p>
      </div>
      {filter !== "all" && onClearFilter && (
        // The ghost button's label is inset by its padding; pull it back so it lines up with the text above.
        <Button variant="ghost" size="sm" onClick={onClearFilter} className="-ml-control-pad-sm">
          Clear filter
        </Button>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* ProjectGrid: layout motion on the responsive tier                          */
/* -------------------------------------------------------------------------- */

export type ProjectGridProps = {
  /** Every project. The grid applies the filter itself, so it can animate the difference. */
  projects: Project[];
  filter: ProjectFilter;
  selectedIds?: string[];
  onSelectedChange?: (id: string, selected: boolean) => void;
  onClearFilter?: () => void;
  onOpen?: (project: Project) => void;
};

export function ProjectGrid({ projects, filter, selectedIds = [], onSelectedChange, onClearFilter, onOpen }: ProjectGridProps) {
  const enter = useTransition("responsive");
  const exit = useExit("responsive");
  const travel = useTravel();
  const visible = projects.filter((p) => matchesFilter(p, filter));
  const empty = visible.length === 0;
  // The empty state waits for the leaving cards to finish fading, so the two never overlap.
  const { duration: settle = 0 } = exit as { duration?: number };

  return (
    <div className="grid w-full">
      <div className="relative col-start-1 row-start-1 grid grid-cols-[repeat(auto-fill,minmax(15rem,1fr))] content-start gap-4">
        <AnimatePresence mode="popLayout" initial={false}>
          {visible.map((p) => (
            <motion.div
              key={p.id}
              layout="position"
              className="h-full"
              initial={{ opacity: 0, y: travel / 2, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98, transition: exit }}
              transition={enter}
            >
              <ProjectCard
                project={p}
                selected={selectedIds.includes(p.id)}
                onSelectedChange={(on) => onSelectedChange?.(p.id, on)}
                onOpen={onOpen}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <AnimatePresence initial={false}>
        {empty && (
          <motion.div
            key="empty"
            className="col-start-1 row-start-1"
            initial={{ opacity: 0, y: travel / 2 }}
            animate={{ opacity: 1, y: 0, transition: { ...enter, delay: settle } }}
            exit={{ opacity: 0, transition: exit }}
          >
            <ProjectsEmpty filter={filter} onClearFilter={onClearFilter} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

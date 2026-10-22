/**
 * Activity: what happened in the studio, newest first. A block: a whole screen built from the litt parts, to copy and
 * make your own. Swap the sample events at the top for your feed, and `earlier` for your next page; the layout and the
 * words stay.
 *
 * A title, a filter by kind, then the events grouped by day. Each event is one sentence: who, in the foreground, did
 * what, in the grey, to which thing, in the foreground again, with the time in the mono at the end. A deploy says how
 * it ended in a tag, in words. Show earlier adds the next day below without moving what you were reading, and a kind
 * with nothing in it says so. Nothing in the view is accent filled, and nothing moves on its own. Render it inside
 * your app's shell (the dashboard block's AppShell, for one).
 */
import { useId, useState } from "react";
import { Avatar } from "@/components/avatar";
import { Button } from "@/components/button";
import { Segmented } from "@/components/segmented";
import { Empty } from "@/components/states";
import { Tag, type TagStatus } from "@/components/tag";

/* ----------------------------------------------------------------- data */

type Kind = "deploy" | "comment" | "people";
type Event = {
  id: string;
  kind: Kind;
  who: string;
  /** What they did, in the grey: "deployed", "commented on". */
  did: string;
  /** What they did it to, in the foreground. */
  what: string;
  /** More about it, on a second line: a comment's words, a branch. */
  detail?: string;
  /** How a deploy ended, as a tag. */
  outcome?: { status: TagStatus; label: string };
  time: string;
};
type Day = { label: string; events: Event[] };

/** The feed, a day at a time. Load yours; the newest day comes first. */
const DAYS: Day[] = [
  {
    label: "Today",
    events: [
      { id: "1", kind: "deploy", who: "Ines Ortega", did: "deployed", what: "Halo site", detail: "main · 7be04d1", outcome: { status: "success", label: "Live" }, time: "14:02" },
      { id: "2", kind: "comment", who: "Tomás Vega", did: "commented on", what: "Northwind rebrand", detail: "The new wordmark reads well small. Can we try it on the invoice?", time: "11:47" },
      { id: "3", kind: "deploy", who: "Rui Santos", did: "deployed", what: "Lumen docs", detail: "fix/search · 2c91fd9", outcome: { status: "danger", label: "Failed" }, time: "10:15" },
    ],
  },
  {
    label: "Yesterday",
    events: [
      { id: "4", kind: "people", who: "Ines Ortega", did: "invited", what: "ada@marlowlabs.com", detail: "As an editor", time: "17:30" },
      { id: "5", kind: "deploy", who: "Maya Lind", did: "deployed a preview of", what: "Atlas portfolio", detail: "redesign/grid · 4f02a1c", outcome: { status: "neutral", label: "Preview" }, time: "15:08" },
      { id: "6", kind: "comment", who: "Maya Lind", did: "replied on", what: "Atlas portfolio", detail: "Moved the captions under the photos, as asked.", time: "09:22" },
    ],
  },
];

/** The next day back, for Show earlier. A real feed fetches it. */
const EARLIER: Day = {
  label: "19 Oct",
  events: [
    { id: "7", kind: "people", who: "Rui Santos", did: "changed the role of", what: "Tomás Vega", detail: "From editor to viewer", time: "16:40" },
    { id: "8", kind: "deploy", who: "Rui Santos", did: "deployed", what: "Northwind rebrand", detail: "main · e23f792", outcome: { status: "success", label: "Live" }, time: "12:05" },
  ],
};

const KINDS = [
  { value: "all", label: "All" },
  { value: "deploy", label: "Deploys" },
  { value: "comment", label: "Comments" },
  { value: "people", label: "People" },
];
const NONE: Record<string, string> = {
  deploy: "No deploys in these days.",
  comment: "No comments in these days.",
  people: "Nobody joined, left or changed role in these days.",
};

/* ----------------------------------------------------------------- the screen */

function EventRow({ event }: { event: Event }) {
  return (
    <li className="flex gap-3 border-t border-line py-4 first:border-t-0">
      <Avatar name={event.who} size="sm" decorative />
      <div className="grid min-w-0 flex-1 gap-1">
        <p className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <span className="text-body text-fg-muted">
            <span className="text-fg">{event.who}</span> {event.did} <span className="text-fg">{event.what}</span>
          </span>
          <span className="font-mono text-caption font-normal text-fg-subtle">{event.time}</span>
        </p>
        {(event.detail || event.outcome) && (
          <p className="flex flex-wrap items-center gap-3">
            {event.outcome && <Tag status={event.outcome.status}>{event.outcome.label}</Tag>}
            {/* A deploy's detail is a branch and a commit, so it is set in the mono. */}
            {event.detail && <span className={"min-w-0 text-fg-subtle " + (event.kind === "deploy" ? "font-mono text-caption font-normal" : "text-small")}>{event.detail}</span>}
          </p>
        )}
      </div>
    </li>
  );
}

function DayGroup({ day }: { day: Day }) {
  const id = useId();
  return (
    <section aria-labelledby={id} className="grid gap-2">
      <h2 id={id} className="text-caption text-fg-subtle">
        {day.label}
      </h2>
      <ul>
        {day.events.map((e) => (
          <EventRow key={e.id} event={e} />
        ))}
      </ul>
    </section>
  );
}

export function Activity() {
  const [kind, setKind] = useState("all");
  const [days, setDays] = useState(DAYS);
  const more = !days.includes(EARLIER);

  const shown = days.map((d) => ({ ...d, events: d.events.filter((e) => kind === "all" || e.kind === kind) })).filter((d) => d.events.length);

  return (
    <div className="@container grid w-full max-w-3xl grid-cols-1 gap-8">
      <header className="grid gap-1">
        <h1 className="text-h1 text-fg">Activity</h1>
        <p className="text-body text-fg-muted">Deploys, comments and people across the studio, newest first.</p>
      </header>

      <Segmented legend="Show" size="sm" value={kind} onValueChange={setKind} options={KINDS} />

      {shown.length ? (
        <div className="grid gap-8">
          {shown.map((d) => (
            <DayGroup key={d.label} day={d} />
          ))}
        </div>
      ) : (
        <Empty title={NONE[kind]} action={<Button size="sm" onClick={() => setKind("all")}>Show everything</Button>}>
          {more ? "Show earlier to look further back." : "That is everything in the feed."}
        </Empty>
      )}

      {more && (
        <Button variant="ghost" size="sm" className="justify-self-start" onClick={() => setDays([...days, EARLIER])}>
          Show earlier
        </Button>
      )}
    </div>
  );
}

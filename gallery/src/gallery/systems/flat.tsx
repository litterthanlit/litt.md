/**
 * Flat's scenes (scene.ts): a small site and its letter, and the people who read them (plans/024, call 9). Ink on paper,
 * the grey is the ground, nothing casts, and the pill is what a hand touches. Colour is the data and who a reader is,
 * in Candy: the week's reads on the sunset ramp, a kind of post in its own hue, a reader's avatar (R7, R10). Nothing
 * moves on its own; what moves answers a hand (a pill's bubble, a heatmap's lens).
 */
import { useState } from "react";
import { Avatar, AvatarGroup, type AvatarHue } from "@/components/avatar";
import { BarList, type BarListHue } from "@/components/bar-list";
import { Button } from "@/components/button";
import { Gauge } from "@/components/gauge";
import { Heatmap } from "@/components/heatmap";
import { Media } from "@/components/media";
import { Segmented } from "@/components/segmented";
import { Stat } from "@/components/stat";
import { Tag } from "@/components/tag";
import { TextField } from "@/components/input";
import { DUSK_TIDE } from "@/gallery/plates";
import type { Scene, SystemScenes } from "./scene";

/* ------------------------------------------------------------- this week */

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
/* Two hours a column, from midnight. */
const SLOTS = ["00:00", "02:00", "04:00", "06:00", "08:00", "10:00", "12:00", "14:00", "16:00", "18:00", "20:00", "22:00"];
const SLOT_TICKS = [
  { index: 0, label: "00:00" },
  { index: 3, label: "06:00" },
  { index: 6, label: "12:00" },
  { index: 9, label: "18:00" },
];
/* A reader's day: quiet at night, a morning coffee, a lunch dip, the evening read. */
const SHAPE = [1, 0, 0, 3, 9, 7, 6, 5, 6, 10, 12, 6];
/** Reads for a week: the day's shape, Friday's swell when the letter goes out, a little noise that never changes. */
function week(scale: number, friday: number): number[][] {
  return DAYS.map((_, d) =>
    SHAPE.map((v, h) => {
      const wobble = v > 2 ? ((d * 7 + h * 13) % 5) - 2 : 0;
      const swell = d === 4 && h >= 4 && h <= 6 ? friday : 0;
      return Math.max(0, Math.round((v * scale + wobble + swell) * 2));
    }),
  );
}
const WEEKS = {
  this: { label: "This week", reads: week(1.4, 14), readers: 1204, delta: "Up 86 on last week", tone: "good" as const },
  last: { label: "Last week", reads: week(1.1, 9), readers: 1118, delta: "Up 40 on the week before", tone: "good" as const },
};
type WeekId = keyof typeof WEEKS;

/* Readers who wrote back, each in their own hue (who they are, R7). */
const WROTE_BACK: { name: string; hue: AvatarHue }[] = [
  { name: "Maya Lindqvist", hue: "sky" },
  { name: "Theo Okafor", hue: "violet" },
  { name: "Ines Duarte", hue: "amber" },
  { name: "Ravi Menon", hue: "teal" },
  { name: "June Park", hue: "bubblegum" },
];

function ThisWeek() {
  const [id, setId] = useState<WeekId>("this");
  const w = WEEKS[id];
  return (
    <div className="grid gap-5">
      <Segmented
        legend="Week"
        value={id}
        onValueChange={setId}
        block
        options={(Object.keys(WEEKS) as WeekId[]).map((k) => ({ value: k, label: WEEKS[k].label }))}
      />
      <Stat label="Readers" value={w.readers.toLocaleString("en-US")} delta={w.delta} tone={w.tone} />
      <Heatmap
        label={`Reads by the hour, ${w.label.toLowerCase()}`}
        rows={DAYS.map((d, i) => ({ label: d, values: w.reads[i]! }))}
        columns={SLOTS}
        columnTicks={SLOT_TICKS}
        cell={16}
        steps={[4, 12, 20, 28]}
        unit={["read", "reads"]}
      />
      <div className="flex items-center gap-3">
        <AvatarGroup label="Readers who wrote back, 23 people" size="sm" max={5} total={23}>
          {WROTE_BACK.map((r) => (
            <Avatar key={r.name} name={r.name} hue={r.hue} look="fluid" size="sm" />
          ))}
        </AvatarGroup>
        <span className="text-small text-fg-muted">23 readers wrote back</span>
      </div>
      <div>
        <Button variant="secondary">Read their notes</Button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ a post */

function Post() {
  return (
    <div className="grid gap-4">
      <Media src={DUSK_TIDE.src} srcSet={DUSK_TIDE.srcSet} sizes="28rem" alt={DUSK_TIDE.alt} ratio={16 / 9} radius="surface" />
      <header className="grid gap-1">
        <p className="text-caption text-fg-muted">Spring series · picture 7 of 12 · 4 min read</p>
        <h3 className="text-h3 font-title text-fg text-balance">Dusk tide, the evening the water went pink</h3>
      </header>
      <ul className="flex flex-wrap gap-2" aria-label="Filed under">
        <li>
          <Tag hue="sky">Photos</Tag>
        </li>
        <li>
          <Tag hue="bubblegum">The coast</Tag>
        </li>
      </ul>
      <div>
        <Button variant="secondary">Read the post</Button>
      </div>
    </div>
  );
}

/* --------------------------------------------------------------- your posts */

type Kind = "Photos" | "Letters" | "Notes";
/* One hue per kind of post, the same wherever the kind shows (R7). */
const KIND_HUE: Record<Kind, BarListHue> = { Photos: "sky", Letters: "bubblegum", Notes: "sun" };
const POSTS: { title: string; kind: Kind; reads: number }[] = [
  { title: "Issue 13: the long way round", kind: "Letters", reads: 856 },
  { title: "Dusk tide", kind: "Photos", reads: 712 },
  { title: "Open water", kind: "Photos", reads: 640 },
  { title: "What I read in March", kind: "Notes", reads: 388 },
  { title: "Issue 12: a quiet month", kind: "Letters", reads: 352 },
  { title: "On keeping a small site", kind: "Notes", reads: 214 },
];

function YourPosts() {
  const [filter, setFilter] = useState<"All" | Kind>("All");
  const rows = POSTS.filter((p) => filter === "All" || p.kind === filter);
  return (
    <div className="grid gap-4">
      <Segmented
        legend="Kind"
        value={filter}
        onValueChange={setFilter}
        block
        options={(["All", "Photos", "Letters", "Notes"] as const).map((v) => ({ value: v, label: v }))}
      />
      <BarList label="Reads this month" unit={["read", "reads"]} items={rows.map((p) => ({ label: p.title, value: p.reads, hue: KIND_HUE[p.kind] }))} />
      <p className="text-caption text-fg-muted" aria-live="polite">
        {rows.length} of {POSTS.length} posts
      </p>
    </div>
  );
}

/* --------------------------------------------------------------- the letter */

function Letter() {
  const [sent, setSent] = useState(false);
  const [email, setEmail] = useState("");
  return (
    <form
      className="grid gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        setSent(true);
      }}
    >
      <div className="grid gap-1">
        <h3 className="text-h3 font-title text-fg">Issue 14 goes out Friday at 9:00</h3>
        <p className="text-small text-fg-muted">One letter a week: the pictures, what went wrong making them, and what I read.</p>
      </div>
      <div className="grid justify-items-center">
        <Gauge label="Issue 13 opened" value={71} valueText="71 percent, 856 of 1,204 readers" figure="71%" caption="856 of 1,204 readers" ramp size={240} />
      </div>
      <TextField
        label="Email"
        type="email"
        name="email"
        autoComplete="email"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          setSent(false);
        }}
        required
      />
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" variant="secondary">
          Subscribe
        </Button>
        <span className="text-caption text-fg-muted" role="status">
          {sent ? `You're reader 1,205. Check ${email || "your inbox"} to confirm.` : "Leave with one click at the foot of any letter."}
        </span>
      </div>
    </form>
  );
}

/* ------------------------------------------------------------------ reading */

/* The posts either side of this one, as words: a post reads on to the next one, it is not a page of rows. */
const AROUND = [
  { dir: "Previous", title: "Open water" },
  { dir: "Next", title: "Red sun" },
];

function Reading() {
  return (
    <div className="grid gap-4">
      <div className="flex items-center gap-3">
        <Avatar name="June Park" hue="bubblegum" size="md" decorative />
        <div className="grid min-w-0">
          <span className="text-small font-label text-fg">June Park</span>
          <span className="text-caption text-fg-muted">
            <time dateTime="2026-11-14">14 November 2026</time> · 4 min read
          </span>
        </div>
      </div>
      <h3 className="text-h3 font-title text-fg text-balance">Why I keep a small site</h3>
      <p className="text-body text-fg-muted">A place of my own, where a picture can sit for a week and nobody asks it to perform.</p>
      <p className="text-small text-fg">Every Friday a letter goes to the people who asked for it. Some write back. Those notes are the best part of the week.</p>
      <p className="text-small text-fg">The site is small on purpose: twelve pictures a season, a few words with each, and room around them.</p>
      <div className="mt-2 grid grid-cols-2 gap-4">
        {AROUND.map((a) => (
          <a
            key={a.dir}
            href="#flat"
            onClick={(e) => e.preventDefault()}
            className={
              "grid min-w-0 gap-1 rounded-control text-small " +
              (a.dir === "Next" ? "justify-items-end text-right " : "") +
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
            }
          >
            <span className="text-caption text-fg-muted">{a.dir} post</span>
            <span className="text-fg underline decoration-transparent underline-offset-4 transition-colors duration-(--dur-instant) ease-litt hover:decoration-line">{a.title}</span>
          </a>
        ))}
      </div>
    </div>
  );
}

const scenes: Scene[] = [
  { id: "this-week", title: "This week", line: "Your readers by the hour, on the sunset ramp that warms where they read; a pill switches the week, and the people who wrote back each wear their own colour.", Render: ThisWeek },
  { id: "a-post", title: "A post", line: "A post's top: a real picture on paper, the words in ink, and a tag for each thing it is filed under, in that thing's colour.", Render: Post },
  { id: "your-posts", title: "Your posts", line: "The posts read most this month, each bar in its kind's colour, and a pill that filters them; no rules and no frames.", Render: YourPosts },
  { id: "the-letter", title: "The letter", line: "Friday's letter: the last issue's opens walk the sunset round the arc, and one white field on the ground to join.", Render: Letter },
  { id: "reading", title: "Reading", line: "A post's top in ink, with who wrote it, a standfirst and a pager to step on.", Render: Reading },
];

export const flat: SystemScenes = { scenes, cover: "this-week" };

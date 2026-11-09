/**
 * Flat's scenes (scene.ts): the page. A studio's site: a case study, its selected work, a newsletter, a contact form and
 * an essay. Ink on paper, grey is the object, nothing casts, and the pill is what a hand touches.
 */
import { useState } from "react";
import { Avatar } from "@/components/avatar";
import { Button } from "@/components/button";
import { Checkbox } from "@/components/checkbox";
import { SelectField } from "@/components/select";
import { Media } from "@/components/media";
import { Segmented } from "@/components/segmented";
import { Tag } from "@/components/tag";
import { TextField, Textarea } from "@/components/input";
import type { Scene, SystemScenes } from "./scene";

/* ------------------------------------------------------------ a case study */

const FACTS = [
  ["Year", "2026"],
  ["Role", "Identity, web"],
  ["Scope", "14 weeks"],
];

function CaseStudy() {
  return (
    <div className="grid gap-5">
      <Media alt="" ratio={2.4} radius="surface">
        <div className="grid size-full place-items-center bg-surface-3 text-caption text-fg-muted">Hero, Bakehouse Nord</div>
      </Media>
      <header className="grid gap-1">
        <p className="text-caption text-fg-muted">Client: Bakehouse Nord, Copenhagen</p>
        <h3 className="text-h3 font-title text-fg text-balance">A bakery that sells bread by the hour</h3>
      </header>
      <dl className="grid grid-cols-3 gap-3">
        {FACTS.map(([k, v]) => (
          <div key={k} className="grid min-w-0 gap-0.5">
            <dt className="text-caption text-fg-muted">{k}</dt>
            <dd className="text-small font-label text-fg">{v}</dd>
          </div>
        ))}
      </dl>
      <ul className="flex flex-wrap gap-2" aria-label="Services">
        {["Identity", "Web design", "Packaging", "Signage"].map((s) => (
          <li key={s}>
            <Tag>{s}</Tag>
          </li>
        ))}
      </ul>
      <div>
        <Button variant="secondary">Read the full study</Button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------ selected work */

type Kind = "Brand" | "Web" | "Print";
const WORK: { name: string; year: number; kind: Kind }[] = [
  { name: "Bakehouse Nord", year: 2026, kind: "Brand" },
  { name: "Halden Quarterly", year: 2026, kind: "Print" },
  { name: "Mireille Atelier", year: 2025, kind: "Web" },
  { name: "Tidewater Records", year: 2025, kind: "Brand" },
  { name: "Okonkwo & Lind", year: 2024, kind: "Web" },
  { name: "The Long Table", year: 2024, kind: "Print" },
  { name: "Fieldnote", year: 2023, kind: "Web" },
];

function SelectedWork() {
  const [filter, setFilter] = useState<"All" | Kind>("All");
  const rows = WORK.filter((w) => filter === "All" || w.kind === filter);
  return (
    <div className="grid gap-4">
      <Segmented
        legend="Discipline"
        value={filter}
        onValueChange={setFilter}
        block
        options={(["All", "Brand", "Web", "Print"] as const).map((v) => ({ value: v, label: v }))}
      />
      <ul className="grid" aria-label="Selected work">
        {rows.map((w) => (
          <li key={w.name} className="flex items-baseline gap-3 py-3">
            <span className="min-w-0 flex-1 truncate text-small font-title text-fg">{w.name}</span>
            <span className="text-caption text-fg-muted">{w.kind}</span>
            <span className="w-10 text-right text-caption tabular-nums text-fg-muted">{w.year}</span>
          </li>
        ))}
      </ul>
      <p className="text-caption text-fg-muted" aria-live="polite">
        {rows.length} of {WORK.length} projects
      </p>
    </div>
  );
}

/* --------------------------------------------------------------- newsletter */

function Newsletter() {
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
        <h3 className="text-h3 font-title text-fg">Field notes, monthly</h3>
        <p className="text-small text-fg-muted">One letter on a project we are making, what went wrong, and what we read. No news, no sales.</p>
      </div>
      <TextField
        label="Email"
        type="email"
        name="email"
        autoComplete="email"
        placeholder="you@studio.com"
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
          {sent ? `Thanks. Check ${email || "your inbox"} to confirm.` : "First Thursday of the month."}
        </span>
      </div>
      <p className="text-caption text-fg-muted">Leave with one click at the foot of any letter.</p>
    </form>
  );
}

/* ------------------------------------------------------------------ contact */

const BUDGETS = [
  { value: "s", label: "Under 20k" },
  { value: "m", label: "20k to 60k" },
  { value: "l", label: "60k to 150k" },
  { value: "xl", label: "Over 150k" },
];

function Contact() {
  const [sent, setSent] = useState(false);
  return (
    <form
      className="grid gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        setSent(true);
      }}
    >
      <h3 className="text-h3 font-title text-fg">Start a project</h3>
      <TextField label="Name" name="name" autoComplete="name" placeholder="Ana Reyes" />
      <TextField label="Email" type="email" name="email" autoComplete="email" placeholder="ana@halden.com" />
      <SelectField label="Budget" name="budget" options={BUDGETS} placeholder="Choose a range" />
      <Textarea label="Message" name="message" rows={3} placeholder="What are you making, and by when?" />
      <Checkbox label="I agree to be contacted about this enquiry" description="We keep your note for 90 days, then delete it." />
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" variant="secondary">
          Send
        </Button>
        <span className="text-caption text-fg-muted" role="status">
          {sent ? "Sent. We reply within two working days." : "We reply within two working days."}
        </span>
      </div>
    </form>
  );
}

/* ------------------------------------------------------------------ reading */

/* The essays either side of this one, as words: an article reads on to the next one, it is not a page of rows. */
const AROUND = [
  { dir: "Previous", title: "The case for slow type" },
  { dir: "Next", title: "Margins are content" },
];

function Reading() {
  return (
    <div className="grid gap-4">
      <div className="flex items-center gap-3">
        <Avatar name="Ines Duarte" size="md" decorative />
        <div className="grid min-w-0">
          <span className="text-small font-label text-fg">Ines Duarte</span>
          <span className="text-caption text-fg-muted">
            <time dateTime="2026-10-14">14 October 2026</time> · 6 min read
          </span>
        </div>
      </div>
      <h3 className="text-h3 font-title text-fg text-balance">The grid is a promise to the reader</h3>
      <p className="text-body text-fg-muted">Every layout makes a quiet bargain about where the eye will land next. Most of our work is keeping it.</p>
      <p className="text-small text-fg">When a page repeats itself well, nobody notices. Margins hold, captions sit where captions sit, and the reader spends their attention on the words.</p>
      <p className="text-small text-fg">Break the pattern once, on purpose, and it speaks. Break it by accident and it only apologises.</p>
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
            <span className="text-caption text-fg-muted">{a.dir} essay</span>
            <span className="text-fg underline decoration-transparent underline-offset-4 transition-colors duration-(--dur-instant) ease-litt hover:decoration-line">{a.title}</span>
          </a>
        ))}
      </div>
    </div>
  );
}

const scenes: Scene[] = [
  { id: "case-study", title: "A case study", line: "A project told as a page top, with a grey plate for the image, ink for the words and a pill for each service.", Render: CaseStudy },
  { id: "selected-work", title: "Selected work", line: "A plain list of projects that a grey pill filters, with no rules and no frames.", Render: SelectedWork },
  { id: "newsletter", title: "Newsletter", line: "A short pitch and one field, with the secondary button as the only ask.", Render: Newsletter },
  { id: "contact", title: "Contact", line: "A whole form on paper: fields that are grey fills, never outlines.", Render: Contact },
  { id: "reading", title: "Reading", line: "An essay's top in ink, with the author, a standfirst and a pager to step on.", Render: Reading },
];

export const flat: SystemScenes = { scenes, cover: "case-study" };

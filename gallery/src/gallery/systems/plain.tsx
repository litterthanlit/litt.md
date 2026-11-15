/**
 * Plain's scenes (scene.ts): the page that just works. A help centre and the tools behind it: a form, a doc, a search,
 * a list of records and a few preferences. Lines on paper, words that are links look like links, and nothing moves.
 */
import { useState } from "react";
import { Button } from "@/components/button";
import { Checkbox } from "@/components/checkbox";
import { CodeBlock } from "@/components/code-block";
import { SelectField } from "@/components/select";
import { Switch } from "@/components/switch";
import { TextField, Textarea } from "@/components/input";
import type { Scene, SystemScenes } from "./scene";

/* A link that goes nowhere in the gallery: Plain underlines it (tokens.css), so it needs no class of its own. */
const Link = ({ children }: { children: string }) => (
  <a href="#plain" onClick={(e) => e.preventDefault()} className="text-accent-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus">
    {children}
  </a>
);

/* ------------------------------------------------------------------- a form */

const TOPICS = [
  { value: "billing", label: "Billing" },
  { value: "account", label: "My account" },
  { value: "bug", label: "Something is broken" },
  { value: "other", label: "Something else" },
];

export function Request() {
  const [sent, setSent] = useState(false);
  return (
    <form
      className="grid gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        setSent(true);
      }}
    >
      <h3 className="text-h3 font-title text-fg">Ask for help</h3>
      <TextField label="Email" type="email" name="email" autoComplete="email" placeholder="you@example.com" />
      <SelectField label="Topic" name="topic" options={TOPICS} placeholder="Choose one" />
      <Textarea label="What happened?" name="message" rows={3} placeholder="What you did, what you expected, what you saw." />
      <Checkbox label="Send me a copy" description="To the email above." />
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <Button type="submit" variant="primary">
          Send
        </Button>
        <span className="text-caption text-fg-muted" role="status">
          {sent ? "Sent. We answer within a day." : "We answer within a day."}
        </span>
      </div>
    </form>
  );
}

/* --------------------------------------------------------------------- docs */

function Doc() {
  return (
    <article className="grid gap-3">
      <p className="text-caption text-fg-muted">
        <Link>Help</Link> / <Link>API</Link> / Keys
      </p>
      <h3 className="text-h3 font-title text-fg">Create an API key</h3>
      <p className="text-small text-fg">
        A key lets a script act as you. Make one in <Link>Settings</Link>, copy it once, and keep it out of your code. Read <Link>how keys are scoped</Link> before you share one.
      </p>
      <ol className="grid list-decimal gap-1 ps-5 text-small text-fg">
        <li>Open Settings, then Keys.</li>
        <li>Choose New key and name it after where it runs.</li>
        <li>Copy it. It is shown once.</li>
      </ol>
      <CodeBlock lang="shell" label="Using a key" code={'curl https://api.example.com/v1/me \\\n  -H "Authorization: Bearer $KEY"'} />
      <p className="text-caption text-fg-muted">
        Last changed 12 November 2026. <Link>Edit this page</Link>
      </p>
    </article>
  );
}

/* ------------------------------------------------------------------- search */

const PAGES = [
  { title: "Create an API key", path: "/help/api/keys", line: "A key lets a script act as you. Make one in Settings and copy it once." },
  { title: "Rotate a key", path: "/help/api/rotate", line: "Make a new key, move your scripts to it, then delete the old one." },
  { title: "Billing and invoices", path: "/help/billing", line: "Every invoice as a PDF, and the card it was paid with." },
  { title: "Delete your account", path: "/help/account/delete", line: "What goes, what stays for 30 days, and how to take it back." },
  { title: "Keyboard shortcuts", path: "/help/keys", line: "Every shortcut, and how to turn them off." },
];

export function Search() {
  const [q, setQ] = useState("key");
  const hits = PAGES.filter((p) => (p.title + " " + p.line).toLowerCase().includes(q.trim().toLowerCase()));
  return (
    <div className="grid gap-4">
      <form role="search" onSubmit={(e) => e.preventDefault()} className="flex items-end gap-2">
        <TextField label="Search the help" type="search" name="q" value={q} onChange={(e) => setQ(e.target.value)} className="min-w-0 flex-1" />
        <Button type="submit" variant="secondary">
          Search
        </Button>
      </form>
      <p className="text-caption text-fg-muted" aria-live="polite">
        {hits.length === 1 ? "1 page" : `${hits.length} pages`}
      </p>
      <ul className="grid gap-4" aria-label="Results">
        {hits.map((p) => (
          <li key={p.path} className="grid gap-0.5">
            <span className="text-small">
              <Link>{p.title}</Link>
            </span>
            <span className="text-caption text-fg-muted">{p.path}</span>
            <span className="text-small text-fg">{p.line}</span>
          </li>
        ))}
        {!hits.length && <li className="text-small text-fg">Nothing matches. Try fewer words.</li>}
      </ul>
    </div>
  );
}

/* ------------------------------------------------------------------ records */

const INVOICES = [
  { id: "INV-2041", date: "1 Nov 2026", amount: "$48.00", status: "Paid" },
  { id: "INV-1987", date: "1 Oct 2026", amount: "$48.00", status: "Paid" },
  { id: "INV-1932", date: "1 Sep 2026", amount: "$36.00", status: "Paid" },
  { id: "INV-1874", date: "1 Aug 2026", amount: "$36.00", status: "Refunded" },
];

function Records() {
  return (
    <div className="grid gap-3">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-small">
          <caption className="pb-2 text-start text-caption text-fg-muted">Invoices, newest first</caption>
          <thead>
            <tr className="border-b border-line-control">
              {["Invoice", "Date", "Amount", "Status"].map((h, i) => (
                <th key={h} scope="col" className={"py-2 pe-3 text-caption text-fg " + (i === 2 ? "text-end" : "text-start")}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {INVOICES.map((r) => (
              <tr key={r.id} className="border-b border-line">
                <td className="py-2 pe-3">
                  <Link>{r.id}</Link>
                </td>
                <td className="py-2 pe-3 text-fg">{r.date}</td>
                <td className="py-2 pe-3 text-end tabular-nums text-fg">{r.amount}</td>
                <td className="py-2 text-fg-muted">{r.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-caption text-fg-muted">
        Showing 4 of 18. <Link>Older invoices</Link>
      </p>
    </div>
  );
}

/* -------------------------------------------------------------- preferences */

export function Preferences() {
  const [saved, setSaved] = useState(false);
  return (
    <form
      className="grid gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        setSaved(true);
      }}
      onChange={() => setSaved(false)}
    >
      <fieldset className="grid gap-3">
        <legend className="mb-2 text-h3 font-title text-fg">Email me when</legend>
        <Switch label="Someone replies to my request" defaultChecked onCheckedChange={() => setSaved(false)} />
        <Switch label="An invoice is ready" defaultChecked onCheckedChange={() => setSaved(false)} />
        <Switch label="There is news" description="About once a month." onCheckedChange={() => setSaved(false)} />
      </fieldset>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <Button type="submit" variant="primary">
          Save
        </Button>
        <span className="text-caption text-fg-muted" role="status">
          {saved ? "Saved." : ""}
        </span>
      </div>
    </form>
  );
}

const scenes: Scene[] = [
  { id: "request", title: "A request", line: "A whole form with no UI: a line under each field, Send held in four corner marks, the answer in words.", Render: Request },
  { id: "doc", title: "A help page", line: "A doc that reads like a page: a trail of underlined links, steps, the command, and who changed it last.", Render: Doc },
  { id: "search", title: "Search", line: "One field and a list of links, the result count in words, and nothing between you and the answer.", Render: Search },
  { id: "records", title: "Records", line: "A table with a caption and two weights of line: the head's and the rows'.", Render: Records },
  { id: "preferences", title: "Preferences", line: "Switches as words, the one in effect held in brackets, that change the moment you press them.", Render: Preferences },
];

export const plain: SystemScenes = { scenes, cover: "request" };

/**
 * No UI (proposals/plain.md, No UI): Plain taken to its end, beside Plain as it ships. The same three screens, a
 * request, a search and preferences, in a light frame over a dark one. In No UI nothing is drawn but type and the
 * browser's own controls: an action is an underlined word, a field is one line under what you type, a choice is words
 * with the current one in the ink, and the checkbox and the select are the browser's. One rule keeps it usable: what
 * a hand can use is underlined or in link blue, and nothing else is (WCAG 1.4.11).
 *
 * These are experiments in plain elements and tokens, not litt parts: nothing in src/components changes for them.
 */
import { useId, useState, type ReactNode } from "react";
import { MaterialProvider } from "@/motion";
import { lookAttributes } from "@/gallery/look";
import { Preferences, Request, Search } from "@/gallery/systems/plain";

export type NoUiScreen = "request" | "search" | "preferences";
export type NoUiColumn = "plain" | "none";

/* ------------------------------------------------------------------ the parts, as type */

const focus = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus";

/** An action: an underlined word in link blue. The main one carries an arrow. */
function Act({ children, main = false, type = "button", onClick }: { children: ReactNode; main?: boolean; type?: "button" | "submit"; onClick?: () => void }) {
  return (
    <button type={type} onClick={onClick} className={"cursor-pointer text-small text-accent-text underline underline-offset-[0.15em] " + (main ? "font-title " : "") + focus}>
      {children}
      {main ? " →" : ""}
    </button>
  );
}

/** A field: its label, then one line under what you type. */
function Line({ label, multiline = false, ...rest }: { label: string; multiline?: boolean; type?: string; placeholder?: string; value?: string; onChange?: (v: string) => void }) {
  const id = useId();
  const cls = "w-full min-w-0 border-0 border-b border-line-control bg-transparent px-0 py-1 text-small text-fg placeholder:text-fg-subtle focus:border-fg focus:outline-none " + focus;
  const { onChange, ...attrs } = rest;
  return (
    <div className="grid gap-1">
      <label htmlFor={id} className="text-small text-fg">
        {label}
      </label>
      {multiline ? (
        <textarea id={id} rows={2} className={cls + " resize-none"} placeholder={attrs.placeholder} />
      ) : (
        <input id={id} {...attrs} onChange={onChange ? (e) => onChange(e.target.value) : undefined} className={cls} />
      )}
    </div>
  );
}

/** A choice of words: the current one in the ink, every other an underlined word to pick. Radios under the words. */
function Words<T extends string>({ legend, options, value, onChange }: { legend: string; options: readonly T[]; value: T; onChange: (v: T) => void }) {
  const name = useId();
  return (
    <fieldset className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
      <legend className="float-left me-3 text-small text-fg">{legend}</legend>
      {options.map((o) => (
        <label key={o} className="cursor-pointer text-small has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-focus">
          <input type="radio" name={name} value={o} checked={o === value} onChange={() => onChange(o)} className="sr-only" />
          <span className={o === value ? "font-title text-fg" : "text-accent-text underline underline-offset-[0.15em]"}>{o}</span>
        </label>
      ))}
    </fieldset>
  );
}

/* ------------------------------------------------------------------ the screens */

function RequestNone() {
  const [sent, setSent] = useState(false);
  const id = useId();
  return (
    <form
      className="grid gap-5"
      onSubmit={(e) => {
        e.preventDefault();
        setSent(true);
      }}
    >
      <h3 className="text-h3 font-title text-fg">Ask for help</h3>
      <Line label="Email" type="email" placeholder="you@example.com" />
      <div className="grid gap-1">
        <label htmlFor={id} className="text-small text-fg">
          Topic
        </label>
        <select id={id} defaultValue="" className={"w-full border-0 border-b border-line-control bg-transparent py-1 text-small text-fg " + focus}>
          <option value="" disabled>
            Choose one
          </option>
          <option>Billing</option>
          <option>My account</option>
          <option>Something is broken</option>
          <option>Something else</option>
        </select>
      </div>
      <Line label="What happened?" multiline placeholder="What you did, what you expected, what you saw." />
      <label className="flex items-baseline gap-2 text-small text-fg">
        <input type="checkbox" className={"accent-(--fg) " + focus} />
        Send me a copy
      </label>
      <p className="flex flex-wrap items-baseline gap-3">
        <Act type="submit" main>
          Send
        </Act>
        <span className="text-small text-fg-muted" role="status">
          {sent ? "Sent. We answer within a day." : "We answer within a day."}
        </span>
      </p>
    </form>
  );
}

const PAGES = [
  { title: "Create an API key", path: "/help/api/keys" },
  { title: "Rotate a key", path: "/help/api/rotate" },
  { title: "Keyboard shortcuts", path: "/help/keys" },
];

function SearchNone() {
  const [q, setQ] = useState("key");
  const hits = PAGES.filter((p) => p.title.toLowerCase().includes(q.trim().toLowerCase()));
  return (
    <div className="grid gap-4">
      <form role="search" onSubmit={(e) => e.preventDefault()} className="grid gap-2">
        <Line label="Search the help" type="search" value={q} onChange={setQ} />
      </form>
      <p className="text-small text-fg-muted" aria-live="polite">
        {hits.length === 1 ? "1 page" : `${hits.length} pages`}
      </p>
      <ul className="grid gap-3" aria-label="Results">
        {hits.map((p) => (
          <li key={p.path} className="grid">
            <a href="#canvas" onClick={(e) => e.preventDefault()} className={"text-small text-accent-text " + focus}>
              {p.title}
            </a>
            <span className="text-small text-fg-muted">{p.path}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function PreferencesNone() {
  const [a, setA] = useState<"On" | "Off">("On");
  const [b, setB] = useState<"On" | "Off">("On");
  const [c, setC] = useState<"On" | "Off">("Off");
  const [saved, setSaved] = useState(false);
  const set = (f: (v: "On" | "Off") => void) => (v: "On" | "Off") => {
    f(v);
    setSaved(false);
  };
  return (
    <div className="grid gap-4">
      <h3 className="text-h3 font-title text-fg">Email me when</h3>
      <Words legend="Someone replies to my request" options={["On", "Off"] as const} value={a} onChange={set(setA)} />
      <Words legend="An invoice is ready" options={["On", "Off"] as const} value={b} onChange={set(setB)} />
      <Words legend="There is news" options={["On", "Off"] as const} value={c} onChange={set(setC)} />
      <p className="flex flex-wrap items-baseline gap-3">
        <Act main onClick={() => setSaved(true)}>
          Save
        </Act>
        <span className="text-small text-fg-muted" role="status">
          {saved ? "Saved." : ""}
        </span>
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ the frames */

const SCREENS: Record<NoUiScreen, Record<NoUiColumn, () => ReactNode>> = {
  request: { plain: () => <Request />, none: () => <RequestNone /> },
  search: { plain: () => <Search />, none: () => <SearchNone /> },
  preferences: { plain: () => <Preferences />, none: () => <PreferencesNone /> },
};

const COLUMNS: Record<NoUiColumn, { title: string; note: string }> = {
  plain: { title: "Plain", note: "As it ships: one 1px line around each control, no fills." },
  none: { title: "No UI", note: "Type and the browser's own controls. What you can use is underlined or blue." },
};

function Frame({ screen, column, dark }: { screen: NoUiScreen; column: NoUiColumn; dark: boolean }) {
  return (
    <MaterialProvider material="plain">
      <div {...lookAttributes({ accent: "world", material: "plain" }, dark)} className="grid gap-6 bg-canvas p-6 text-fg">
        <span className="text-small text-fg-subtle">{dark ? "Dark" : "Light"}</span>
        {SCREENS[screen][column]()}
      </div>
    </MaterialProvider>
  );
}

export function NoUiPreview({ screen, column }: { screen: NoUiScreen; column: NoUiColumn }) {
  const { title, note } = COLUMNS[column];
  return (
    <div data-no-ui={`${screen}-${column}`} className="grid gap-6">
      <div className="grid gap-1">
        <span className="text-small font-title text-fg">{title}</span>
        <span className="text-small text-fg-subtle">{note}</span>
      </div>
      <Frame screen={screen} column={column} dark={false} />
      <Frame screen={screen} column={column} dark />
    </div>
  );
}

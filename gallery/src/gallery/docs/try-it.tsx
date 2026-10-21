/**
 * Try it: a component on a stage beside controls for its props, and the JSX for what you set.
 *
 * - The controls are not written by hand. Each prop's type comes from src/generated/docs.json (gen-docs.mjs reads it
 *   from the component's own source), so a new variant shows up here the day it ships:
 *   - a boolean is a Switch;
 *   - a union of string literals is a Segmented control when its labels fit the panel, else a Select. An optional prop
 *     with no default gets a "None" choice first, because leaving it out is a real choice;
 *   - a string, or a ReactNode the page starts with text, is an Input;
 *   - a number is an Input of type number, kept to min and max when the page gives them.
 *   Functions, objects and ReactNodes with no text are left out: they are wired by the page in `props`.
 * - The page names the export (`of`), passes the component itself (`component`), the props it always needs (`props`,
 *   such as the children or a label) and, optionally, which props to offer and in what order (`controls`). A DOM
 *   attribute that docs.json does not list, such as a Button's disabled, is offered with its own type.
 * - The code under the stage is what you would write: the props that differ from their defaults, then the children.
 *   It copies with the CodeBlock's button.
 * - Reset puts every control back to where the page started it.
 * - No motion of its own. The component moves as it would anywhere else.
 */
import { useMemo, useState, type ComponentType } from "react";
import { Button } from "@/components/button";
import { Input } from "@/components/input";
import { Segmented } from "@/components/segmented";
import { Select } from "@/components/select";
import { Switch } from "@/components/switch";
import { allExports, type PropDoc } from "../docs-data";
import { CodeBlock } from "./code-block";
import { DocsBoundary } from "./page-docs";

/** A control the page asks for by hand: a DOM attribute docs.json does not list, or a number's range. */
export type ControlSpec =
  | string
  | { name: string; type: "boolean" | "text" | "number"; min?: number; max?: number; step?: number }
  | { name: string; options: string[] };

export type TryItProps = {
  /** The export to show, as docs.json names it: "Button". */
  of: string;
  /** The component itself. */
  component: ComponentType<any>;
  /** Props it always gets, such as children or a label. A string here makes a ReactNode prop editable as text. */
  props?: Record<string, unknown>;
  /** Props worked out from the others, such as a Gauge's valueText from its value, so the words never drift from the picture. */
  derive?: (values: Record<string, unknown>) => Record<string, unknown>;
  /** Which props to offer, in order. Default: every boolean and string-literal prop, and every prop in `props` with a text or number value. */
  controls?: ControlSpec[];
};

type Control =
  | { kind: "boolean"; name: string }
  | { kind: "choice"; name: string; options: string[]; optional: boolean }
  | { kind: "text"; name: string }
  | { kind: "number"; name: string; min?: number; max?: number; step?: number };

/** Props a reader never sets by trying them out. */
const SKIP = new Set(["className", "id", "name", "ref", "style", "value", "defaultValue", "checked", "defaultChecked"]);
const NONE = "__none__";
const EMPTY: Record<string, unknown> = {};

const bare = (type: string) =>
  type
    .split("|")
    .map((t) => t.trim())
    .filter((t) => t && t !== "undefined" && t !== "null");

const literals = (parts: string[]) => (parts.length > 1 && parts.every((t) => /^"[^"]*"$/.test(t)) ? parts.map((t) => t.slice(1, -1)) : null);

/** The control a prop's printed type allows, or null when it takes something a control cannot make. */
function inferControl(p: PropDoc, start: unknown): Control | null {
  const parts = bare(p.type);
  if (parts.length === 1 && parts[0] === "boolean") return { kind: "boolean", name: p.name };
  const options = literals(parts);
  if (options) return { kind: "choice", name: p.name, options, optional: !p.required && p.default === undefined };
  if (parts.length === 1 && parts[0] === "number") return { kind: "number", name: p.name };
  if (parts.length === 1 && parts[0] === "string") return { kind: "text", name: p.name };
  if (parts.length === 1 && parts[0] === "ReactNode" && typeof start === "string") return { kind: "text", name: p.name };
  return null;
}

/** A default as gen-docs printed it (`"secondary"`, `false`, `16`), as a value. */
function parseDefault(text: string | undefined): unknown {
  if (text === undefined) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

function buildControls(props: PropDoc[], start: Record<string, unknown>, asked?: ControlSpec[]): Control[] {
  const byName = new Map(props.map((p) => [p.name, p]));
  if (asked) {
    return asked.flatMap((spec): Control[] => {
      if (typeof spec !== "string") {
        if ("options" in spec) return [{ kind: "choice", name: spec.name, options: spec.options, optional: false }];
        if (spec.type === "number") return [{ kind: "number", name: spec.name, min: spec.min, max: spec.max, step: spec.step }];
        return [{ kind: spec.type, name: spec.name }];
      }
      const p = byName.get(spec);
      const c = p && inferControl(p, start[spec]);
      if (!c) throw new Error(`TryIt: "${spec}" has no control. Give it a type: { name: "${spec}", type: "boolean" }.`);
      return [c];
    });
  }
  return props.flatMap((p) => {
    if (SKIP.has(p.name) || p.name.startsWith("on") || p.name.startsWith("aria-")) return [];
    const c = inferControl(p, start[p.name]);
    if (!c) return [];
    /* Free text and numbers only when the page starts them, so a stray string prop does not crowd the panel. */
    if ((c.kind === "text" || c.kind === "number") && !(p.name in start)) return [];
    return [c];
  });
}

/* ----------------------------------------------------------------- the code */

const attr = (name: string, v: unknown) => {
  if (v === true) return name;
  if (typeof v === "string") return `${name}=${JSON.stringify(v)}`;
  return `${name}={${JSON.stringify(v)}}`;
};

function toJsx(of: string, values: Record<string, unknown>, defaults: Record<string, unknown>) {
  const { children, ...rest } = values;
  const attrs = Object.entries(rest)
    .filter(([k, v]) => v !== undefined && v !== "" && v !== defaults[k] && typeof v !== "function")
    .map(([k, v]) => attr(k, v));
  const open = attrs.length && `<${of} ${attrs.join(" ")}`.length > 72 ? `<${of}\n  ${attrs.join("\n  ")}\n` : `<${of}${attrs.length ? " " + attrs.join(" ") : ""}`;
  if (typeof children === "string" && children) return `${open}>${children}</${of}>`;
  return `${open}${open.endsWith("\n") ? "" : " "}/>`;
}

/* ----------------------------------------------------------------- one row */

const rowLabel = "font-mono text-small text-fg-muted";

function Row({ control, value, onChange }: { control: Control; value: unknown; onChange: (v: unknown) => void }) {
  const { name } = control;
  switch (control.kind) {
    case "boolean":
      return (
        <Switch
          align="end"
          className="w-full"
          label={<span className={rowLabel + " font-normal"}>{name}</span>}
          checked={value === true}
          onCheckedChange={onChange}
        />
      );
    case "choice": {
      const options = [...(control.optional ? [NONE] : []), ...control.options];
      const current = value === undefined ? NONE : String(value);
      const set = (v: string) => onChange(v === NONE ? undefined : v);
      const label = (v: string) => (v === NONE ? "None" : v);
      return (
        <div className="grid gap-2">
          <span aria-hidden="true" className={rowLabel}>
            {name}
          </span>
          {/* A segmented track fits the 18rem panel up to about 22 characters of labels; past that a Select reads better. */}
          {options.length <= 5 && options.reduce((n, v) => n + label(v).length, 0) <= 22 ? (
            <Segmented legend={name} size="sm" block value={current} onValueChange={set} options={options.map((v) => ({ value: v, label: label(v) }))} />
          ) : (
            <Select aria-label={name} size="sm" value={current} onValueChange={set} options={options.map((v) => ({ value: v, label: label(v) }))} />
          )}
        </div>
      );
    }
    case "text":
      return (
        <label className="grid gap-2">
          <span className={rowLabel}>{name}</span>
          <Input size="sm" value={typeof value === "string" ? value : ""} onChange={(e) => onChange(e.target.value)} />
        </label>
      );
    case "number":
      return (
        <label className="grid gap-2">
          <span className={rowLabel}>{name}</span>
          <Input
            size="sm"
            mono
            type="number"
            min={control.min}
            max={control.max}
            step={control.step}
            value={typeof value === "number" ? value : ""}
            onChange={(e) => {
              const n = e.target.valueAsNumber;
              if (Number.isNaN(n)) return onChange(undefined);
              onChange(Math.min(control.max ?? Infinity, Math.max(control.min ?? -Infinity, n)));
            }}
          />
        </label>
      );
  }
}

/* ----------------------------------------------------------------- TryIt */

function Panel({ of, component: Component, props: start = EMPTY, controls: asked, derive }: TryItProps) {
  const doc = useMemo(() => {
    const found = allExports().find((e) => e.name === of);
    if (!found) throw new Error(`TryIt: no export named "${of}" in src/generated/docs.json.`);
    return found;
  }, [of]);
  const defaults = useMemo(() => Object.fromEntries(doc.props.map((p) => [p.name, parseDefault(p.default)])), [doc]);
  const controls = useMemo(() => buildControls(doc.props, start, asked), [doc, start, asked]);

  /* Every control starts at the page's value, else the prop's default. */
  const initial = useMemo(() => {
    const v: Record<string, unknown> = { ...start };
    for (const c of controls) if (!(c.name in v)) v[c.name] = defaults[c.name];
    return v;
  }, [controls, defaults, start]);
  const [values, setValues] = useState(initial);
  const changed = controls.some((c) => values[c.name] !== initial[c.name]);
  const shown = derive ? { ...values, ...derive(values) } : values;
  const code = toJsx(of, shown, defaults);

  return (
    <section aria-labelledby="try-it" className="grid gap-6">
      <div className="litt-raised grid overflow-hidden rounded-surface md:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="grid min-h-80 min-w-0 place-items-center p-8 sm:p-12">
          <Component {...shown} />
        </div>
        <div className="grid content-start gap-4 border-t border-line p-6 md:border-t-0 md:border-l" role="group" aria-label={`${of} props`}>
          {controls.map((c) => (
            <Row key={c.name} control={c} value={values[c.name]} onChange={(v) => setValues((old) => ({ ...old, [c.name]: v }))} />
          ))}
        </div>
      </div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="grid max-w-[60ch] gap-1">
          <h2 id="try-it" className="text-body font-title text-fg">
            Try it
          </h2>
          <p className="text-small text-fg-subtle">Change a prop and {of} changes with it. The code is what you would write.</p>
        </div>
        <Button size="sm" variant="secondary" disabled={!changed} onClick={() => setValues(initial)}>
          Reset
        </Button>
      </div>
      <CodeBlock code={code} label={`${of} code`} />
    </section>
  );
}

/** The panel, or what went wrong with it, on the page: a wrong prop name should not blank the gallery. */
export function TryIt(props: TryItProps) {
  return (
    <DocsBoundary>
      <Panel {...props} />
    </DocsBoundary>
  );
}

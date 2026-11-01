/**
 * Tune: one call that tunes a component live, checked against litt's rules. useTune(name, (t) => ({ … })) returns typed
 * values and builds an Inspector for them under the nearest TuneRoot.
 *
 * - The builder is the rule. t.radius is a corner (0, the control radius, the surface radius or the pill), t.space a
 *   step of the spacing scale and t.spring a spring on its tier; each adds a Fits or Change row to the Rules group.
 *   t.easing, t.toggle, t.choice and t.number carry no rule.
 * - Values come back ready to use. A corner or a space is a CSS length: the litt token's var() while it sits on one,
 *   so the shipped component follows the theme, and a px length off them. A spring is a Motion transition that holds
 *   still under reduced motion, and an easing is [x1, y1, x2, y2] for Motion's ease.
 * - One panel per name. Every component that calls useTune with the same name reads the same values, and the first
 *   one mounted decides the fields. A control keeps only what differs from the code, so an edit to a default shows at
 *   once in every field you have not touched. Values last while the root is mounted; Save keeps a version across
 *   visits, under the name and the fields.
 * - Copy tokens writes custom properties named after the component and the key, holding litt's own tokens wherever a
 *   value sits on one. Toggles, choices and plain numbers go in a Props comment, since they belong in the call.
 * - TuneRoot draws the panels: floating top right (on a phone across the bottom, folded), or in place after its
 *   children with inline. The floating column is drawn after hydration, above the page at z-50 and under litt's
 *   toasts. It shows them in a development build only, unless enabled says otherwise. Hidden, it draws nothing and
 *   every useTune returns its defaults, but the code still ships wherever tune is imported: tune is scaffolding, and
 *   the copied tokens replace it.
 * - No accent fill (R6): actions are secondary buttons and toggles neutral switches.
 */
import { createContext, Fragment, useCallback, useContext, useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { createPortal } from "react-dom";
import type { Transition } from "motion/react";
import { surfaceRadius, useDevice, useMotionDial, useTransition } from "@/motion";
import { cornerRule, RADIUS_PILL, SPACE_SCALE, spaceRule, springRules, type RuleRow, type SpringTier } from "@/motion/rules";
import { toCss, type Spring } from "@/motion/spring";
import type { Locked } from "@/motion/tokens";
import { Button } from "@/components/button";
import { CurveEditor, toCubicBezier, type CubicBezier } from "@/components/curve-editor";
import { Inspector, InspectorGroup } from "@/components/inspector";
import { Segmented } from "@/components/segmented";
import { SelectField } from "@/components/select";
import { Slider } from "@/components/slider";
import { SpringEditor } from "@/components/spring-editor";
import { Switch } from "@/components/switch";

/* ---------- the schema ---------- */

declare const OUT: unique symbol;

/** One tuned value, made by a builder of t: its control, the rule that checks it and how Copy tokens writes it. */
export type TuneField<Out> = { readonly [OUT]?: Out; readonly spec: Spec };

/** A button in the panel. A press runs it once in every mounted component that declares it. It holds no value. */
export type TuneAction = { readonly action: { readonly label: string; readonly run: () => void } };

/** What the schema function returns: a field or an action per key. */
export type TuneSchema = { readonly [key: string]: TuneField<unknown> | TuneAction };

/** What useTune returns: each field's value, typed by its builder. Actions are left out. */
export type TuneValues<S extends TuneSchema> = {
  readonly [K in keyof S as S[K] extends TuneAction ? never : K]: S[K] extends TuneField<infer Out> ? Out : never;
};

type Named = {
  /** The control's label, which also starts its rule rows. Default: the key in words, so enterSpring is "Enter spring". */
  label?: string;
};

/** The builders useTune hands the schema function as t. Each is a control and the litt rule that checks it. */
export type TuneKinds = {
  /** A corner, checked against litt's corners. Start on one by name, or at px. You get a CSS length. */
  radius(initial?: "square" | "control" | "surface" | "pill" | number, options?: Named): TuneField<string>;
  /** A space in px, such as padding or a gap, checked against the spacing scale (0 to max, 64 by default). You get a CSS length. */
  space(initial: number, options?: Named & { max?: number }): TuneField<string>;
  /** A spring, starting on litt's spring for the tier and checked against its rules. You get a Motion transition. */
  spring(tier: SpringTier, options?: Named): TuneField<Transition>;
  /** A spring of your own, checked against the tier you name. You get a Motion transition. */
  spring(initial: Spring, options: Named & { tier: SpringTier }): TuneField<Transition>;
  /** An easing, starting at litt's ease-out unless you give a curve. You get [x1, y1, x2, y2] for Motion's ease. */
  easing(initial?: "out" | CubicBezier, options?: Named): TuneField<CubicBezier>;
  /** On or off, as a Switch. */
  toggle(initial?: boolean, options?: Named & { description?: string }): TuneField<boolean>;
  /** One of a few words: a Segmented control up to three, a Select past that. You get one of the options, typed. */
  choice<const O extends readonly [string, ...string[]]>(options: O, initial?: O[number], more?: Named): TuneField<O[number]>;
  /** A plain number on a Slider (0 to 100 unless you say), with no rule. With a unit, Copy tokens writes it as CSS. */
  number(initial: number, options?: Named & { min?: number; max?: number; step?: number; unit?: string }): TuneField<number>;
  /** A button in the panel. A press runs run in every mounted component that declares it. */
  action(label: string, run: () => void): TuneAction;
};

/* ---------- one field ---------- */

/** What the panel keeps for a field: plain JSON, so versions compare and copy it. */
type Json = number | boolean | string | Spring | CubicBezier;
/** Every field's kept value, in schema order (versions compare JSON, so the order is part of it). */
type TuneRaw = { readonly [key: string]: Json };
type Still = { readonly reduced: boolean; readonly still: Transition };
/** Custom property lines, or a few words for the Props comment when CSS cannot hold the value. */
type Copied = { readonly css: readonly string[] } | { readonly prop: string };

/** One field holding one fitted value. Each kind's code works on its own type inside, with nothing cast. */
type Bound = {
  readonly raw: Json;
  read(motion: Still): unknown;
  rules(label: string): RuleRow[];
  copy(at: { readonly key: string; readonly token: string }): Copied;
  summary?(): string;
  control(label: string, onChange: (next: Json) => void): ReactNode;
};

type Spec = {
  readonly kind: "radius" | "space" | "spring" | "easing" | "toggle" | "choice" | "number";
  readonly label?: string;
  /** Tall editors get a fold of their own, open or closed; the rest stack at the top of the panel. */
  readonly fold?: "open" | "closed";
  /** The kind, its options and its default, so a code edit tells a field apart. */
  readonly sig: string;
  /** The one way in for a value from outside the code (a control, a saved version, another component's fields): fits it, else the default. */
  bind(raw: unknown): Bound;
};

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
const finite = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);
const isRecord = (v: unknown): v is { readonly [key: string]: unknown } => typeof v === "object" && v !== null;
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
const num = (n: number) => String(+n.toFixed(2));
const ms = (seconds: number) => `${Math.round(seconds * 1000)}ms`;
const px = (n: number) => `${n}px`;

/* Whole token names, so the registry renames them for a host. */
const CORNER_VARS = { control: "var(--radius-control)", surface: "var(--radius-surface)", pill: "var(--radius-pill)" } as const;
const TIER_VARS = {
  responsive: { duration: "var(--dur-responsive)", easing: "var(--ease-responsive)" },
  expressive: { duration: "var(--dur-expressive)", easing: "var(--ease-expressive)" },
} as const;
const EASE_OUT_VAR = "var(--ease-out)";

const RADIUS_MAX = 24;
/** The radius slider's last stop, one step past its max: the pill. */
const PILL_STOP = RADIUS_MAX + 2;
const SPRING_TIME: [number, number] = [0.05, 0.8];
const SPRING_BOUNCE: [number, number] = [0, 0.5];

const spec = (kind: Spec["kind"], named: Named | undefined, sig: unknown, bind: Spec["bind"], fold?: Spec["fold"]): Spec => ({
  kind,
  label: named?.label,
  fold,
  sig: JSON.stringify([kind, named?.label, sig]),
  bind,
});
const field = <Out,>(s: Spec): TuneField<Out> => ({ spec: s });

function makeKinds(locked: Locked): TuneKinds {
  const control = locked.radius;
  const surface = surfaceRadius(locked.radius);
  return {
    radius(initial = "surface", named) {
      const corners = { square: 0, control, surface, pill: RADIUS_PILL };
      const fit = (v: unknown) => (!finite(v) ? undefined : v === RADIUS_PILL ? v : clamp(Math.round(v), 0, RADIUS_MAX));
      const start = fit(typeof initial === "number" ? initial : corners[initial]) ?? surface;
      const css = (r: number) =>
        r === surface ? CORNER_VARS.surface : r === control ? CORNER_VARS.control : r === RADIUS_PILL ? CORNER_VARS.pill : r === 0 ? "0" : px(r);
      const stop = (r: number) => (r === RADIUS_PILL ? PILL_STOP : r);
      return field<string>(
        spec("radius", named, start, (raw) => {
          const r = fit(raw) ?? start;
          return {
            raw: r,
            read: () => css(r),
            rules: (label) => [cornerRule(r, label)],
            copy: ({ token }) => ({ css: [`${token}: ${css(r)};${cornerRule(r, "").ok ? "" : " /* off litt's corners */"}`] }),
            control: (label, onChange) => (
              <Slider
                label={label}
                value={stop(r)}
                onValueChange={(v) => onChange(v === PILL_STOP ? RADIUS_PILL : v)}
                min={0}
                max={PILL_STOP}
                step={2}
                marks={[0, control, surface, PILL_STOP]}
                home={stop(start)}
                formatValue={(v) => (v === PILL_STOP ? "Pill" : px(v))}
              />
            ),
          };
        }),
      );
    },

    space(initial, named) {
      const max = Math.max(named?.max ?? 64, initial);
      const fit = (v: unknown) => (finite(v) ? clamp(Math.round(v), 0, max) : undefined);
      const start = fit(initial) ?? 0;
      const css = (s: number) => {
        const step = SPACE_SCALE.find(([v]) => v === s);
        return step ? `var(${step[1]})` : s === 0 ? "0" : px(s);
      };
      return field<string>(
        spec("space", named, [start, max], (raw) => {
          const s = fit(raw) ?? start;
          return {
            raw: s,
            read: () => css(s),
            rules: (label) => [spaceRule(s, label)],
            copy: ({ token }) => ({ css: [`${token}: ${css(s)};${spaceRule(s, "").ok ? "" : " /* off the spacing scale */"}`] }),
            control: (label, onChange) => (
              <Slider
                label={label}
                value={s}
                onValueChange={onChange}
                min={0}
                max={max}
                step={4}
                marks={[0, ...SPACE_SCALE.map(([v]) => v).filter((v) => v <= max)]}
                home={start}
                formatValue={px}
              />
            ),
          };
        }),
      );
    },

    spring(initial: SpringTier | Spring, named?: Named & { tier?: SpringTier }) {
      const tier = typeof initial === "string" ? initial : (named?.tier ?? "expressive");
      const litt = locked.dial[tier];
      const fit = (v: unknown): Spring | undefined =>
        isRecord(v) && finite(v.time) && finite(v.bounce)
          ? { time: +clamp(v.time, ...SPRING_TIME).toFixed(2), bounce: +clamp(v.bounce, ...SPRING_BOUNCE).toFixed(2) }
          : undefined;
      const start = fit(typeof initial === "string" ? litt : initial) ?? litt;
      return field<Transition>(
        spec(
          "spring",
          named,
          [tier, start],
          (raw) => {
            const s = fit(raw) ?? start;
            const onTier = same(s, litt);
            return {
              raw: s,
              read: ({ reduced, still }) => (reduced ? still : { type: "spring", visualDuration: s.time, bounce: s.bounce }), // litt-allow: the spring being tuned is the caller's value
              rules: (label) => springRules(s, tier).map((r) => ({ ok: r.ok, text: `${label} ${r.text.charAt(0).toLowerCase()}${r.text.slice(1)}` })),
              copy: ({ token }) => {
                if (onTier) return { css: [`${token}-duration: ${TIER_VARS[tier].duration};`, `${token}-ease: ${TIER_VARS[tier].easing};`] };
                const out = toCss(s);
                return { css: [`${token}: ${ms(s.time)} ${num(s.bounce)}; /* time and bounce, off litt's ${tier} spring */`, `${token}-duration: ${out.duration}ms;`, `${token}-ease: ${out.easing};`] };
              },
              summary: () => `${ms(s.time)}, ${num(s.bounce)}`,
              /* The fold's row says the field's label, so the editor inside is just the Spring. */
              control: (_, onChange) => (
                <SpringEditor label="Spring" value={s} onValueChange={onChange} tier={tier} checks={false} defaultMark={litt} maxTime={SPRING_TIME[1]} maxBounce={SPRING_BOUNCE[1]} height={128} preview={false} />
              ),
            };
          },
          "open",
        ),
      );
    },

    easing(initial = "out", named) {
      const out = locked.easeOut;
      const fit = (v: unknown): CubicBezier | undefined => {
        if (!Array.isArray(v) || v.length !== 4 || !v.every(finite)) return undefined;
        const [x1, y1, x2, y2] = v.filter(finite);
        return [clamp(x1, 0, 1), clamp(y1, -0.25, 1.25), clamp(x2, 0, 1), clamp(y2, -0.25, 1.25)];
      };
      const start = fit(initial === "out" ? out : initial) ?? out;
      return field<CubicBezier>(
        spec(
          "easing",
          named,
          start,
          (raw) => {
            const curve = fit(raw) ?? start;
            const isOut = same(curve, out);
            return {
              raw: curve,
              read: () => curve,
              rules: () => [],
              copy: ({ token }) => ({ css: [`${token}: ${isOut ? EASE_OUT_VAR : toCubicBezier(curve)};`] }),
              summary: () => (isOut ? "Ease out" : "Your own"),
              control: (_, onChange) => <CurveEditor label="Easing" value={curve} onValueChange={onChange} defaultMark={out} height={160} preview={false} />,
            };
          },
          "closed",
        ),
      );
    },

    toggle(initial = false, named) {
      return field<boolean>(
        spec("toggle", named, [initial, named?.description], (raw) => {
          const on = typeof raw === "boolean" ? raw : initial;
          return {
            raw: on,
            read: () => on,
            rules: () => [],
            copy: ({ key }) => ({ prop: `${key} ${on}` }),
            control: (label, onChange) => <Switch label={label} description={named?.description} align="end" checked={on} onCheckedChange={onChange} />,
          };
        }),
      );
    },

    choice(options, initial, named) {
      const start = options.find((o) => o === initial) ?? options[0];
      return field(
        spec("choice", named, [options, start], (raw) => {
          const picked = options.find((o) => o === raw) ?? start;
          const items = options.map((o) => ({ value: o, label: o }));
          return {
            raw: picked,
            read: () => picked,
            rules: () => [],
            copy: ({ key }) => ({ prop: `${key} ${JSON.stringify(picked)}` }),
            control: (label, onChange) =>
              options.length <= 3 ? (
                <Segmented legend={label} showLegend block size="sm" options={items} value={picked} onValueChange={onChange} />
              ) : (
                <SelectField label={label} size="sm" options={items} value={picked} onValueChange={onChange} />
              ),
          };
        }),
      );
    },

    number(initial, named) {
      const min = Math.min(named?.min ?? 0, initial);
      const max = Math.max(named?.max ?? 100, initial);
      const step = named?.step ?? 1;
      const unit = named?.unit ?? "";
      const fit = (v: unknown) => (finite(v) ? clamp(v, min, max) : undefined);
      const start = fit(initial) ?? min;
      return field<number>(
        spec("number", named, [start, min, max, step, unit], (raw) => {
          const n = fit(raw) ?? start;
          return {
            raw: n,
            read: () => n,
            rules: () => [],
            copy: ({ key, token }) => (unit ? { css: [`${token}: ${num(n)}${unit};`] } : { prop: `${key} ${num(n)}` }),
            control: (label, onChange) => (
              <Slider label={label} value={n} onValueChange={onChange} min={min} max={max} step={step} home={start} formatValue={(v) => `${num(v)}${unit}`} />
            ),
          };
        }),
      );
    },

    action(label, run) {
      return { action: { label, run } };
    },
  };
}

/* ---------- one schema ---------- */

type Field = { readonly key: string; readonly label: string; readonly spec: Spec };
type Compiled = {
  readonly fields: readonly Field[];
  readonly actions: readonly { readonly key: string; readonly label: string }[];
  readonly defaults: TuneRaw;
  /** The keys and their kinds: a saved version only goes back to the fields it was saved from. */
  readonly shape: string;
  readonly sig: string;
};
type Handlers = { readonly [key: string]: () => void };

const isAction = (x: TuneField<unknown> | TuneAction): x is TuneAction => "action" in x;
const kebab = (s: string) =>
  s
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
const words = (key: string) => {
  const w = key.replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/[-_]+/g, " ").toLowerCase();
  return w.charAt(0).toUpperCase() + w.slice(1);
};
/** A short, stable name for a shape, for the versions' storage key. */
const hash = (s: string) => {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = (h * 33) ^ s.charCodeAt(i);
  return (h >>> 0).toString(36);
};

function compile(schema: TuneSchema): Compiled {
  const fields: Field[] = [];
  const actions: { key: string; label: string }[] = [];
  for (const [key, x] of Object.entries(schema)) {
    if (isAction(x)) actions.push({ key, label: x.action.label });
    else fields.push({ key, label: x.spec.label ?? words(key), spec: x.spec });
  }
  const shape = fields.map((f) => `${f.key}:${f.spec.kind}`).join(",");
  return {
    fields,
    actions,
    defaults: Object.fromEntries(fields.map((f) => [f.key, f.spec.bind(undefined).raw])),
    shape,
    sig: JSON.stringify([shape, fields.map((f) => [f.label, f.spec.sig]), actions]),
  };
}

const handlersOf = (schema: TuneSchema): Handlers => Object.fromEntries(Object.entries(schema).flatMap(([key, x]) => (isAction(x) ? [[key, x.action.run]] : [])));

/** The caller's values, each field read from what the panel keeps, or its default. */
function readAll<S extends TuneSchema>(c: Compiled, value: TuneRaw | undefined, motion: Still): TuneValues<S> {
  const out: { [key: string]: unknown } = {};
  for (const f of c.fields) out[f.key] = f.spec.bind(value?.[f.key]).read(motion);
  return out as TuneValues<S>; // the one cast: an object built key by key meets the mapped type
}

function tokensOf(name: string, c: Compiled, value: TuneRaw): string {
  const prefix = `--${kebab(name)}`;
  const css: string[] = [];
  const props: string[] = [];
  for (const f of c.fields) {
    const out = f.spec.bind(value[f.key]).copy({ key: f.key, token: `${prefix}-${kebab(f.key)}` });
    if ("css" in out) css.push(...out.css.map((line) => `  ${line}`));
    else props.push(out.prop);
  }
  return [
    `/* ${name}, from litt tune. Paste into your CSS. */`,
    ...(css.length ? [":root {", ...css, "}"] : []),
    ...(props.length ? [`/* Props: ${props.join(", ")}. */`] : []),
  ].join("\n");
}

/* ---------- one root's values ---------- */

type Owner = { readonly compiled: Compiled; readonly handlers: { readonly current: Handlers } };
type Snapshot = { readonly compiled: Compiled; readonly value: TuneRaw };
type Entry = {
  /** The mounted components that tune this name, in the order they arrived. The first one's fields drive the panel. */
  readonly owners: Map<symbol, Owner>;
  /** Only what differs from the code's defaults, so a default edited in the code shows through every untouched field. */
  readonly overrides: Map<string, Json>;
  snapshot: Snapshot | undefined;
  readonly listeners: Set<() => void>;
};

type TuneStore = ReturnType<typeof createTuneStore>;

/** One TuneRoot's values by name. Components only register their fields; only the panel writes values. */
function createTuneStore() {
  const entries = new Map<string, Entry>();
  const listListeners = new Set<() => void>();
  let names: readonly string[] = [];

  const entryOf = (name: string) => {
    let e = entries.get(name);
    if (!e) entries.set(name, (e = { owners: new Map(), overrides: new Map(), snapshot: undefined, listeners: new Set() }));
    return e;
  };
  /** Rebuilds what everyone reads from the first owner's fields: its defaults, then each override that still fits them. */
  const settle = (e: Entry) => {
    const driver = e.owners.values().next().value;
    if (!driver) return;
    const c = driver.compiled;
    for (const [key, v] of e.overrides) {
      const f = c.fields.find((x) => x.key === key);
      const fitted = f?.spec.bind(v).raw;
      if (fitted === undefined || same(fitted, c.defaults[key])) e.overrides.delete(key);
      else e.overrides.set(key, fitted);
    }
    const value = Object.fromEntries(c.fields.map((f) => [f.key, e.overrides.get(f.key) ?? c.defaults[f.key]]));
    e.snapshot = { compiled: c, value };
    for (const l of e.listeners) l();
  };
  const relist = () => {
    const next = [...entries].filter(([, e]) => e.owners.size > 0).map(([name]) => name);
    if (same(next, names)) return;
    names = next;
    for (const l of listListeners) l();
  };

  return {
    subscribe(name: string, onChange: () => void) {
      const e = entryOf(name);
      e.listeners.add(onChange);
      return () => void e.listeners.delete(onChange);
    },
    snapshot: (name: string) => entries.get(name)?.snapshot,
    subscribeList(onChange: () => void) {
      listListeners.add(onChange);
      return () => void listListeners.delete(onChange);
    },
    list: () => names,
    /** Safe to call again for the same id, as StrictMode and Fast Refresh do. Returns the way out. */
    register(name: string, id: symbol, owner: Owner) {
      const e = entryOf(name);
      e.owners.set(id, owner);
      if (e.snapshot?.compiled !== e.owners.values().next().value?.compiled) settle(e);
      relist();
      if (mode() === "development") {
        /* After the whole commit, so a Fast Refresh that updates every copy at once does not warn. */
        queueMicrotask(() => {
          if (new Set([...e.owners.values()].map((o) => o.compiled.shape)).size > 1)
            warnOnce(`fields:${name}`, `Two components tune "${name}" with different fields. The panel shows the first one's; give each its own name.`);
        });
      }
      return () => {
        if (e.owners.get(id) !== owner) return;
        e.owners.delete(id);
        if (e.owners.size > 0 && e.snapshot?.compiled !== e.owners.values().next().value?.compiled) settle(e);
        relist();
      };
    },
    /** A control's write: one field, fitted. Back at its default, it keeps nothing. */
    set(name: string, key: string, raw: unknown) {
      const e = entries.get(name);
      const c = e?.snapshot?.compiled;
      const f = c?.fields.find((x) => x.key === key);
      if (!e || !c || !f) return;
      e.overrides.set(key, f.spec.bind(raw).raw);
      settle(e);
    },
    /** A whole value from the Inspector (a version or Reset), fitted field by field, since a saved version can be stale. */
    replace(name: string, whole: unknown) {
      const e = entries.get(name);
      const c = e?.snapshot?.compiled;
      if (!e || !c) return;
      e.overrides.clear();
      for (const f of c.fields) e.overrides.set(f.key, f.spec.bind(isRecord(whole) ? whole[f.key] : undefined).raw);
      settle(e);
    },
    /** A press: every mounted component that declares the action runs it once. */
    run(name: string, key: string) {
      for (const o of entries.get(name)?.owners.values() ?? []) o.handlers.current[key]?.();
    },
  };
}

/* ---------- the gate ---------- */

/** The bundler replaces process.env.NODE_ENV in Vite and Next.js; where nothing does, the build can't be told. */
declare const process: { env: { NODE_ENV?: string } };
function mode(): "development" | "production" | "unknown" {
  try {
    const env = process.env.NODE_ENV;
    return env === "development" ? "development" : env ? "production" : "unknown";
  } catch {
    return "unknown";
  }
}

const warned = new Set<string>();
function warnOnce(key: string, message: string) {
  if (warned.has(key)) return;
  warned.add(key);
  console.warn(message);
}

/** No root above, a root that hides its panels, or a root that shows them. */
type Root = { readonly state: "none" } | { readonly state: "off" } | { readonly state: "on"; readonly store: TuneStore };
const TuneContext = createContext<Root>({ state: "none" });

/* Never changes, so a snapshot that differs between server and client reads as "after hydration". */
const subscribeNever = () => () => {};
const NO_NAMES: readonly string[] = [];

/* ---------- the hook ---------- */

/**
 * Live, typed values for one component, and a panel to tune them in under the nearest TuneRoot. Without a root that
 * shows its panels (in a production build, by default), it returns the defaults.
 * @param name The panel's title, and how Copy tokens names the custom properties ("Plan card" starts them with plan-card). Components that share a name share one panel and its values.
 * @param schema Gets the builders as t and returns a field per value: t.radius, t.space, t.spring, t.easing, t.toggle, t.choice, t.number, and t.action for a button.
 */
export function useTune<S extends TuneSchema>(name: string, schema: (t: TuneKinds) => S): TuneValues<S> {
  const root = useContext(TuneContext);
  const store = root.state === "on" ? root.store : null;
  const { locked, reduced } = useMotionDial();
  const still = useTransition("instant");
  const t = useMemo(() => makeKinds(locked), [locked]);
  const fresh = schema(t);
  const next = compile(fresh);
  /* The same fields keep the same object, so the effects below run only when the schema really changes. */
  const compiled = useMemo(() => next, [next.sig]);

  const handlers = useRef<Handlers>({});
  useEffect(() => {
    handlers.current = handlersOf(fresh);
  });
  const [id] = useState(() => Symbol(name));
  useEffect(() => store?.register(name, id, { compiled, handlers }), [store, name, id, compiled]);
  useEffect(() => {
    if (root.state === "none" && mode() === "development") warnOnce(`root:${name}`, `useTune("${name}") has no <TuneRoot> above it, so it returns its defaults.`);
  }, [root.state, name]);

  const subscribe = useCallback((onChange: () => void) => (store ? store.subscribe(name, onChange) : subscribeNever()), [store, name]);
  const value = useSyncExternalStore(
    subscribe,
    () => store?.snapshot(name)?.value,
    () => undefined,
  );
  /* still matters only while reduced, which is a dependency. */
  return useMemo(() => readAll<S>(compiled, value, { reduced, still }), [compiled, value, reduced]);
}

/* ---------- the panels ---------- */

/** One name's Inspector: short controls stacked at the top, a fold per tall editor, then the actions. */
function Panel({ store, name, startFolded, className }: { store: TuneStore; name: string; startFolded: boolean; className: string }) {
  const subscribe = useCallback((onChange: () => void) => store.subscribe(name, onChange), [store, name]);
  const snapshot = useSyncExternalStore(
    subscribe,
    () => store.snapshot(name),
    () => undefined,
  );
  if (!snapshot) return null;
  const { compiled: c, value } = snapshot;
  const bound = (f: Field) => f.spec.bind(value[f.key]);
  const write = (f: Field) => (next: Json) => store.set(name, f.key, next);
  const stacked = c.fields.filter((f) => !f.spec.fold);
  const folded = c.fields.filter((f) => f.spec.fold);
  return (
    <Inspector
      title={name}
      value={value}
      onValueChange={(v) => store.replace(name, v)}
      defaultValue={c.defaults}
      storageKey={`litt-tune:${name}:${hash(c.shape)}`}
      checks={(v) => c.fields.flatMap((f) => f.spec.bind(v[f.key]).rules(f.label))}
      tokens={(v) => tokensOf(name, c, v)}
      defaultOpen={!startFolded}
      className={className}
    >
      {stacked.length > 0 && (
        <div className="grid gap-5 border-t border-line px-3 pt-3 pb-4">
          {stacked.map((f) => (
            <Fragment key={f.key}>{bound(f).control(f.label, write(f))}</Fragment>
          ))}
        </div>
      )}
      {folded.map((f) => (
        <InspectorGroup key={f.key} title={f.label} summary={bound(f).summary?.()} defaultOpen={f.spec.fold === "open"}>
          {bound(f).control(f.label, write(f))}
        </InspectorGroup>
      ))}
      {c.actions.length > 0 && (
        <div className="flex flex-wrap gap-2 border-t border-line p-3">
          {c.actions.map((a) => (
            <Button key={a.key} size="sm" onClick={() => store.run(name, a.key)}>
              {a.label}
            </Button>
          ))}
        </div>
      )}
    </Inspector>
  );
}

/* Above the page and its sticky headers, under litt's toasts (z-60); a Select opened inside comes later in the body, so it paints above. */
const FLOATING = "fixed top-4 right-4 z-50 w-80 max-h-[calc(100dvh-2rem)] overflow-y-auto overscroll-contain";
/* On a phone the column spans the gutters at the bottom, as toasts do, and every panel starts folded, so the component stays in view. */
const FLOATING_COMPACT =
  "fixed inset-x-gutter bottom-[calc(var(--space-4)+env(safe-area-inset-bottom,0px))] z-50 mx-auto max-w-[40rem] max-h-[50dvh] overflow-y-auto overscroll-contain";

/** Every panel of one root, in the order their components arrived: in place, or floating over the page. */
function Dock({ store, floating, className }: { store: TuneStore; floating: boolean; className: string }) {
  const names = useSyncExternalStore(store.subscribeList, store.list, () => NO_NAMES);
  const { compact } = useDevice();
  if (names.length === 0) return null;
  const place = !floating ? "w-full max-w-80" : compact ? FLOATING_COMPACT : FLOATING;
  return (
    <div className={`grid content-start gap-3 ${place} ${className}`}>
      {names.map((name) => (
        <Panel key={name} store={store} name={name} startFolded={floating && compact} className={floating && compact ? "max-w-none" : ""} />
      ))}
    </div>
  );
}

export type TuneRootProps = {
  /** The part of the app whose useTune calls this root shows. It renders as it is. */
  children: ReactNode;
  /** Shows the panels. By default only in a development build; true shows them in production too, false hides them anywhere. */
  enabled?: boolean;
  /** Draws the panels in place, after the children, instead of floating top right. */
  inline?: boolean;
  /** Extra classes for the panels' column, such as where it sits in a grid when inline. */
  className?: string;
};

/** Holds the tuned values of the components inside it and draws a panel per name. Mount it once, around the app. */
export function TuneRoot({ children, enabled, inline = false, className = "" }: TuneRootProps) {
  const [store] = useState(createTuneStore);
  const on = enabled ?? mode() === "development";
  const root = useMemo<Root>(() => (on ? { state: "on", store } : { state: "off" }), [on, store]);
  const hydrated = useSyncExternalStore(subscribeNever, () => true, () => false);
  useEffect(() => {
    if (enabled === undefined && mode() === "unknown") warnOnce("mode", "TuneRoot can't tell a development build from production here, so it hides its panels. Pass enabled to show them.");
  }, [enabled]);
  return (
    <TuneContext value={root}>
      {children}
      {on && inline && <Dock store={store} floating={false} className={className} />}
      {on && !inline && hydrated && createPortal(<Dock store={store} floating className={className} />, document.body)}
    </TuneContext>
  );
}

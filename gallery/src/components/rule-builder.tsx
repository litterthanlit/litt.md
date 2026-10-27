/**
 * Rule builder: when this, and that, or any of these, built from rows (components.md, "Rule builder"; the moodboard's
 * #34). A row is a field, an operator and a value that read as a sentence ("Seniority is Manager"); a group joins its
 * rows with one And or Or; a group can hold a group; rows are added, removed and moved by a handle. Think an expense
 * policy: when expense status is Submitted, and seniority is Manager, and any of three things about the expense.
 *
 * - Anatomy: the lead ("When") at the small size and the title weight in --fg, in sentence case like every word in litt
 *   (R5, R8). Each group opens with its join, a Segmented control (sm, "And" and "Or", hidden legend "Join conditions
 *   with"), at the head of its rail: a 1px --line-strong line that drops from under the join and turns into
 *   each row at its middle. The rail is chrome, so it takes no hue (R7). A condition row is flat (R3): a hairline and the
 *   top highlight at the control radius, holding the handle (a ghost icon-only button with the grip), the field and the
 *   operator (Selects, sm: raised, since you press them) and the value the field asks for: an Input for words and a
 *   Number field for a number (cuts, since you type into them), a Select for one choice, and a Combobox with picks as
 *   raised tags for an operator that takes several ("is any of": "Food & drink ×"). Remove is a ghost icon-only x. Below
 *   a 480px row (a container query) the value wraps under the field and the operator, and below 352px the operator and
 *   the value each take a line of their own, so a phone never scrolls sideways. A locked row (the rule's trigger)
 *   shows a lock where the handle is and its field and operator as words in --fg-muted; only its value is a control,
 *   and it stays first. A nested group is a flat panel (--surface-2, a hairline, the surface radius) with its handle,
 *   "Group · 3 conditions" and remove, then its own join, rail and rows. Under every group: Add condition and, while
 *   maxDepth allows, Add group, secondary sm buttons. Never the accent (R6): the caller's Save is the view's one.
 * - Hand (R4, motion/hand.ts): take a handle and the row takes the raised block's material at once (--block,
 *   --block-lift, the shadow swapped, never faded, R2) and follows the pointer 1:1 along its group, held where it was
 *   taken and never past the first free place or the last. The rows it passes move out of its way by transform, each
 *   on its own settle. Let go and it settles into its place, every row lands, and only then is the new order committed:
 *   one onValueChange per move, and a layout effect puts every row's offset back to 0 before the new order paints, so
 *   the data and the picture change in one frame. Escape puts it back. Rows move only within their own group.
 * - Fun mode (motion/fun.tsx, a trial): nothing here reads it. useSettle does: the rows trade places and the dropped
 *   row lands on fun mode's throw spring, a release carries its speed and may coast a place further, and a pull past
 *   the first or last place gives like a rubber band. It rests on exactly the frame Calm does.
 * - Keys and assistive tech: the builder is a group named by `label`. Space or Enter on a handle picks the row up
 *   (aria-pressed, the raised look), ↑ and ↓ move it a place with the same settle, Space or Enter drops it (the one
 *   commit), Escape puts it back, and leaving the handle drops it. A polite status says each step ("Picked up Seniority
 *   is Manager, position 2 of 3", "Position 3 of 3", "Moved … to position 3 of 3") and what was added or removed. Every
 *   control is named by its row ("Field, condition 2"); a nested group is a group named "Group, 3 conditions". A new
 *   row focuses its field; a removed row hands focus to the next handle, else the previous, else Add condition.
 * - Motion: rows move by transform only (each row's y, the hand's settle). A new row fades in at 0.98 on the
 *   responsive tier, a removed one fades out on the exit token, and the rows around them snap, as heights do. No
 *   Motion `layout` on a row: it would replay the swap a second time. Under reduced motion every settle lands at once.
 * - Touch: a handle owns every direction (touch-action none, data-no-drag), so a drag anywhere else scrolls the page;
 *   handles and removes are 44px targets on a finger, and the sm controls grow to 44px.
 * - Disabled: every control lies flat and leaves the tab order; the handles keep their grip in --fg-disabled and do
 *   nothing, remove is gone, and the Add buttons lie flat. The layout does not move.
 * - Errors (R1, R5): `errors` by condition id draws the row's edge in --danger and says why under its controls, linked
 *   to the row with aria-describedby.
 * - Forced colors: rows, panels and the held row keep a real border; the rail is a border, so it stays.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type MutableRefObject,
  type PointerEvent,
  type ReactNode,
} from "react";
import { AnimatePresence, motion, useMotionValue, type MotionValue } from "motion/react";
import { Button } from "@/components/button";
import { Combobox } from "@/components/combobox";
import { GripIcon, LockIcon, PlusIcon, XIcon } from "@/components/icons";
import { Input } from "@/components/input";
import { NumberField } from "@/components/number-field";
import { Segmented } from "@/components/segmented";
import { Select, type SelectOption } from "@/components/select";
import { useExit, useTransition } from "@/motion";
import { useHand, useSettle, type Settle } from "@/motion/hand";

/** How a group combines its children: and needs every one, or needs any one. */
export type RuleBuilderJoin = "and" | "or";

/** One choice of a choice field. */
export type RuleBuilderOption = {
  /** What a condition stores and a form sends. Unique within its field. */
  value: string;
  /** What people read in the value control: "Food & drink". */
  label: string;
};

/** The words between a field and its value. */
export type RuleBuilderOperator = {
  /** What a condition stores: "is", "any-of". Unique within its field. */
  id: string;
  /** The words, lower case, so a row reads as a sentence: "is", "is not", "is any of". */
  label: string;
  /** Takes several values, as "is any of" does. Only a choice field's operator can. */
  many?: boolean;
};

/** Something a condition can test. A choice field must say its options, so a value list is never empty. */
export type RuleBuilderField = {
  /** What a condition stores as its field. */
  id: string;
  /** What people read in the field control: "Seniority". */
  label: string;
  /**
   * The operators it offers, in order; a new row takes the first. Without them, its type's: words take is, is not and
   * contains; a number is, is more than and is less than; a choice is, is not, is any of and is none of.
   */
  operators?: RuleBuilderOperator[];
} & (
  | {
      /** What its value is: words (an Input) or a number (a Number field). */
      type: "text" | "number";
    }
  | {
      /** One of its options (a Select), or several for an operator with many (a Combobox). */
      type: "choice";
      /** The choices, in order. */
      options: RuleBuilderOption[];
    }
);

/** What a condition compares with: words, a number, an option's value, several values for an operator with many, or null while empty. */
export type RuleBuilderValue = string | number | string[] | null;

/** One row: a field, an operator and a value. */
export type RuleBuilderCondition = {
  /** Says this node is a condition. */
  kind: "condition";
  /** Unique in the rule: the row's key, so it keeps its place and its motion when the rule changes. Rows the builder adds get one. */
  id: string;
  /** A field's id. */
  field: string;
  /** One of that field's operator ids. */
  operator: string;
  /** What it compares with, in the shape its operator takes. */
  value: RuleBuilderValue;
  /** The rule's trigger: it stays first, shows its field and operator as words, and is never moved or removed. */
  locked?: boolean;
};

/** Conditions and groups joined by and or or. The rule itself is a group. */
export type RuleBuilderGroup = {
  /** Says this node is a group. */
  kind: "group";
  /** Unique in the rule. */
  id: string;
  /** How its children combine. */
  join: RuleBuilderJoin;
  /** Its conditions and groups, in order. */
  children: RuleBuilderNode[];
};

export type RuleBuilderNode = RuleBuilderCondition | RuleBuilderGroup;

export type RuleBuilderProps = {
  /** What the rule decides, in a few words: "Expense approval". It names the builder for assistive tech. */
  label: string;
  /** The word above the rows, in sentence case. */
  lead?: string;
  /** What a condition can test, in the order the field control lists them. Add condition starts a row on the first. */
  fields: RuleBuilderField[];
  /** The rule, when you control it: the root group. Pair it with onValueChange. */
  value?: RuleBuilderGroup;
  /** The rule it starts with when you do not control it. Without one, an empty rule joined by and. */
  defaultValue?: RuleBuilderGroup;
  /** Called with the whole new rule after each change: a pick, a typed value, a join, an add, a remove, and a move once it has settled. */
  onValueChange?: (value: RuleBuilderGroup) => void;
  /** How many levels of groups may nest inside the rule. 0 is a flat list with no Add group. */
  maxDepth?: number;
  /** Problems to show, by condition id: "Pick at least one type". The row draws its edge in the danger color and says it under its controls. */
  errors?: Record<string, string>;
  /** Makes the builder read-only: every control flat and skipped by Tab, the handles still and remove gone. */
  disabled?: boolean;
  /** The field name a form sends the rule under, as one JSON string. */
  name?: string;
  /** Extra classes for the builder, such as a width. It fills its container. */
  className?: string;
};

/* ---------------------------------------------------------------- the rule as data */

const OPERATORS: Record<RuleBuilderField["type"], RuleBuilderOperator[]> = {
  text: [
    { id: "is", label: "is" },
    { id: "is-not", label: "is not" },
    { id: "contains", label: "contains" },
  ],
  number: [
    { id: "is", label: "is" },
    { id: "more-than", label: "is more than" },
    { id: "less-than", label: "is less than" },
  ],
  choice: [
    { id: "is", label: "is" },
    { id: "is-not", label: "is not" },
    { id: "any-of", label: "is any of", many: true },
    { id: "none-of", label: "is none of", many: true },
  ],
};

const JOINS: { value: RuleBuilderJoin; label: string }[] = [
  { value: "and", label: "And" },
  { value: "or", label: "Or" },
];

const operatorsOf = (field: RuleBuilderField) => field.operators ?? OPERATORS[field.type];
const fieldOf = (fields: readonly RuleBuilderField[], id: string) => fields.find((f) => f.id === id);
/** Whether an operator takes several values: only a choice field's can. */
const takesMany = (field: RuleBuilderField | undefined, operator: string) =>
  field?.type === "choice" && !!operatorsOf(field).find((o) => o.id === operator)?.many;

let minted = 0;
/** An id for a node made by a hand, never during a render, so a server render and the client agree. */
function mint(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  minted += 1;
  return `rule-${Date.now().toString(36)}-${minted}`;
}

/** Narrows a node: a group has children, a condition a field. */
export function isGroup(node: RuleBuilderNode): node is RuleBuilderGroup {
  return node.kind === "group";
}

/**
 * A new condition on `field`, with its first operator and an empty value.
 *
 * @param field The field it tests.
 * @param id Its id. Made up for you when left out; pass your own for a rule written at the top of a module, so a server render and the client agree.
 */
export function newCondition(field: RuleBuilderField, id: string = mint()): RuleBuilderCondition {
  const operator = operatorsOf(field)[0]?.id ?? "";
  return { kind: "condition", id, field: field.id, operator, value: takesMany(field, operator) ? [] : null };
}

/**
 * A new group.
 *
 * @param join How its children combine.
 * @param children What it starts with.
 * @param id Its id. Made up for you when left out.
 */
export function newGroup(join: RuleBuilderJoin = "and", children: RuleBuilderNode[] = [], id: string = mint()): RuleBuilderGroup {
  return { kind: "group", id, join, children };
}

/**
 * A condition made whole after a change: a new field resets the operator to the field's first and empties the value;
 * a new operator moves the value between one and several ("is Travel" becomes "is any of Travel"). So a row never
 * holds a value its controls cannot show.
 */
function cohere(before: RuleBuilderCondition, change: Partial<Pick<RuleBuilderCondition, "field" | "operator" | "value">>, fields: readonly RuleBuilderField[]): RuleBuilderCondition {
  const next = { ...before, ...change };
  const field = fieldOf(fields, next.field);
  if (next.field !== before.field) {
    const operator = field ? (operatorsOf(field)[0]?.id ?? "") : "";
    return { ...next, operator, value: takesMany(field, operator) ? [] : null };
  }
  const many = takesMany(field, next.operator);
  const v = next.value;
  if (many && !Array.isArray(v)) return { ...next, value: v === null || v === "" ? [] : [String(v)] };
  if (!many && Array.isArray(v)) return { ...next, value: v[0] ?? null };
  return next;
}

/** How many conditions a group holds, its groups' included. */
function conditionsIn(group: RuleBuilderGroup): number {
  return group.children.reduce((n, c) => n + (isGroup(c) ? conditionsIn(c) : 1), 0);
}

const conditionWords = (n: number) => (n === 0 ? "no conditions" : n === 1 ? "1 condition" : `${n} conditions`);

/** A node as words, for its handle's name and the status: "Seniority is Manager", "group of 3 conditions". */
function describe(node: RuleBuilderNode, fields: readonly RuleBuilderField[]): string {
  if (isGroup(node)) return `group of ${conditionWords(conditionsIn(node))}`;
  const field = fieldOf(fields, node.field);
  const operator = field ? operatorsOf(field).find((o) => o.id === node.operator) : undefined;
  const head = `${field?.label ?? node.field} ${operator?.label ?? node.operator}`;
  const label = (v: string) => (field?.type === "choice" ? (field.options.find((o) => o.value === v)?.label ?? v) : v);
  const v = node.value;
  if (v === null || v === "" || (Array.isArray(v) && v.length === 0)) return `${head}, no value yet`;
  return `${head} ${Array.isArray(v) ? v.map(label).join(", ") : typeof v === "number" ? String(v) : label(v)}`;
}

/* The tree changes only through these: pure, by id, and the same tree back when nothing changed. */

function editNode(node: RuleBuilderNode, id: string, fn: (node: RuleBuilderNode) => RuleBuilderNode | null): RuleBuilderNode | null {
  if (node.id === id) return fn(node);
  if (!isGroup(node)) return node;
  let changed = false;
  const children: RuleBuilderNode[] = [];
  for (const child of node.children) {
    const next = editNode(child, id, fn);
    if (next !== child) changed = true;
    if (next) children.push(next);
  }
  return changed ? { ...node, children } : node;
}

/** The rule with the node `id` replaced by what `fn` returns; null removes it. The root is never removed. */
function edit(rule: RuleBuilderGroup, id: string, fn: (node: RuleBuilderNode) => RuleBuilderNode | null): RuleBuilderGroup {
  const next = editNode(rule, id, fn);
  return next && isGroup(next) ? next : rule;
}

const appendTo = (rule: RuleBuilderGroup, group: string, node: RuleBuilderNode) =>
  edit(rule, group, (g) => (isGroup(g) ? { ...g, children: [...g.children, node] } : g));

/** The rule without the node `id`, a group with all it holds. A locked condition stays. */
const removeNode = (rule: RuleBuilderGroup, id: string) => edit(rule, id, (n) => (!isGroup(n) && n.locked ? n : null));

const moveWithin = (rule: RuleBuilderGroup, group: string, from: number, to: number) =>
  edit(rule, group, (g) => {
    if (!isGroup(g) || from === to) return g;
    const children = [...g.children];
    children.splice(to, 0, ...children.splice(from, 1));
    return { ...g, children };
  });

/** How many locked conditions lead a group: no row may be moved above them. */
const lockedLead = (group: RuleBuilderGroup) => {
  const i = group.children.findIndex((c) => isGroup(c) || !c.locked);
  return i < 0 ? group.children.length : i;
};

/* ---------------------------------------------------------------- reordering one group's rows */

type Rect = { top: number; height: number };

/**
 * Where every row would sit if the row at `from` moved to `to`, as an offset from where it is now. The rows are laid
 * out again in the new order from the first one's top, with the gaps measured between places, so a nested group (a
 * tall row) and the list's gap need no constant. Pure.
 */
function offsetsFor(rects: readonly Rect[], from: number, to: number): number[] {
  const order = rects.map((_, i) => i);
  order.splice(to, 0, ...order.splice(from, 1));
  const offsets = rects.map(() => 0);
  let top = rects[0]?.top ?? 0;
  order.forEach((i, at) => {
    offsets[i] = top - rects[i].top;
    const gap = at + 1 < rects.length ? rects[at + 1].top - (rects[at].top + rects[at].height) : 0;
    top += rects[i].height + gap;
  });
  return offsets;
}

/**
 * Where the row at `from`, dragged `dy` px, belongs: going down it has passed a row once its bottom edge is past that
 * row's middle, going up once its top edge is, in the layout measured at the press. `travel` is how far it may go,
 * from the first free place (`first`, below any locked rows) to the last. Pure.
 */
function reorderPlan(rects: readonly Rect[], from: number, dy: number, first: number): { to: number; offsets: number[]; travel: [lo: number, hi: number] } {
  const last = rects.length - 1;
  const me = rects[from];
  const lo = rects[first].top - me.top;
  const hi = rects[last].top + rects[last].height - (me.top + me.height);
  const top = me.top + Math.min(hi, Math.max(lo, dy));
  const middle = (i: number) => rects[i].top + rects[i].height / 2;
  let to = from;
  for (let i = from + 1; i <= last; i++) if (top + me.height > middle(i)) to = i;
  for (let i = from - 1; i >= first; i--) if (top < middle(i)) to = i;
  return { to, offsets: offsetsFor(rects, from, to), travel: [lo, hi] };
}

/** One row's part in a reorder: its place, its offset and its settle, and where that settle is headed. */
type Slot = {
  /** The row's place in the list, measured at a press. */
  place: HTMLElement | null;
  /** What moves: the row itself, inside its place. */
  body: HTMLElement | null;
  y: MotionValue<number>;
  settle: Settle;
  /** The offset its settle is headed for; NaN while a hand holds it. */
  aim: number;
  /** True once it has arrived at `aim`. */
  landed: boolean;
  /** Run once it arrives. */
  waiting: (() => void)[];
};

/** A row picked up, by the pointer or the keys. */
type Lift = { id: string; from: number; to: number; rects: Rect[]; ids: string[]; via: "pointer" | "keys"; name: string };

type Reorder = {
  /** The row in a hand, or picked up by the keys: it draws as the raised block. */
  held: string | null;
  /** A row joins the reorder for as long as it is mounted. */
  register: (id: string, slot: Slot) => () => void;
  /** What a row's handle listens to. */
  handle: (id: string) => {
    onPointerDown: (e: PointerEvent<HTMLElement>) => void;
    onKeyDown: (e: KeyboardEvent<HTMLElement>) => void;
    onBlur: () => void;
  };
};

/* What every lift ends with: the row back at rest in its place, its offset 0, nothing pending. */
function rest(s: Slot) {
  s.settle.hold();
  s.y.jump(0);
  /* Motion writes the style on its next frame; the new order is in the DOM now, so the old offset must not paint on it. */
  if (s.body) s.body.style.transform = "none";
  s.aim = 0;
  s.landed = true;
  s.waiting = [];
}

/**
 * One group's reordering. A press on a handle measures the places, the hand moves the held row 1:1 (useHand), and every
 * row it passes settles to its new offset on its own useSettle. Let go, and the held row settles into its place; once
 * every row has landed the move is committed (one onValueChange), and the layout effect below puts every offset back
 * to 0 in the same frame as the new order. The keys take the same path with no pointer.
 */
function useReorder(group: RuleBuilderGroup): Reorder {
  const builder = useBuilder();
  const hand = useHand();
  const slots = useRef(new Map<string, Slot>());
  const lift = useRef<Lift | null>(null);
  const landing = useRef(false);
  const pending = useRef<{ id: string; focus: boolean } | null>(null);
  const [held, setHeld] = useState<string | null>(null);
  const ids = group.children.map((c) => c.id);
  const now = useRef({ group, ids, first: lockedLead(group), builder });
  now.current = { group, ids, first: lockedLead(group), builder };

  const order = ids.join("\n");
  useLayoutEffect(() => {
    const p = pending.current;
    pending.current = null;
    if (!p && !lift.current) return;
    if (!p) hand.cancel(); // the rule changed under a lift: drop it where the new order puts it
    lift.current = null;
    landing.current = false;
    slots.current.forEach(rest);
    if (!p) setHeld(null);
    const handle = p?.focus ? document.getElementById(now.current.builder.idFor("handle", p.id)) : null;
    if (handle && document.activeElement !== handle) handle.focus({ preventScroll: true });
  }, [order, hand]);

  const register = useCallback((id: string, slot: Slot) => {
    slots.current.set(id, slot);
    return () => {
      if (slots.current.get(id) === slot) slots.current.delete(id);
    };
  }, []);

  const measure = (list: string[]): Rect[] =>
    list.map((id) => {
      const el = slots.current.get(id)?.place;
      return { top: el?.offsetTop ?? 0, height: el?.offsetHeight ?? 0 };
    });
  const slotsOf = (list: string[]) => list.flatMap((id) => slots.current.get(id) ?? []);

  const arrive = (s: Slot) => () => {
    s.landed = true;
    s.waiting.splice(0).forEach((then) => then());
  };
  /* A row headed somewhere already keeps going; a new place starts a new settle. */
  const send = (s: Slot, target: number) => {
    if (s.aim === target) return;
    s.aim = target;
    s.landed = false;
    s.settle.to([target], { commit: arrive(s) });
  };
  const sendAll = (l: Lift, offsets: number[], except?: string) =>
    l.ids.forEach((id, i) => {
      const s = slots.current.get(id);
      if (s && id !== except) send(s, offsets[i]);
    });
  const whenAll = (list: Slot[], done: () => void) => {
    let left = list.length;
    const one = () => {
      left -= 1;
      if (left === 0) done();
    };
    if (left === 0) return done();
    list.forEach((s) => (s.landed ? one() : s.waiting.push(one)));
  };

  const putBack = (l: Lift) => {
    landing.current = true;
    sendAll(l, l.ids.map(() => 0));
    whenAll(slotsOf(l.ids), () => {
      lift.current = null;
      landing.current = false;
      setHeld(null);
      now.current.builder.say(`${capital(l.name)}, back at position ${l.from + 1} of ${l.ids.length}.`);
    });
  };

  /* Every row has landed: commit the move, or end the lift where it began. */
  const finish = (l: Lift) => {
    const { builder: b, group: g } = now.current;
    const n = l.ids.length;
    if (l.to === l.from) {
      lift.current = null;
      landing.current = false;
      setHeld(null);
      b.say(`${capital(l.name)}, still at position ${l.from + 1} of ${n}.`);
      return;
    }
    const mine = slots.current.get(l.id);
    const p = { id: l.id, focus: !!mine?.place?.contains(document.activeElement) };
    pending.current = p;
    setHeld(null);
    b.apply((rule) => moveWithin(rule, g.id, l.from, l.to));
    b.say(`Moved ${l.name} to position ${l.to + 1} of ${n}.`);
    /* A controlled caller may keep the old order. Then nothing re-renders, and the rows settle back. */
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        if (pending.current !== p) return;
        pending.current = null;
        putBack(l);
      }),
    );
  };

  const drop = (l: Lift) => {
    landing.current = true;
    sendAll(l, offsetsFor(l.rects, l.from, l.to));
    whenAll(slotsOf(l.ids), () => finish(l));
  };

  const pick = (id: string, via: Lift["via"]): Lift | null => {
    const { ids: list, first, group: g, builder: b } = now.current;
    const from = list.indexOf(id);
    if (b.disabled || lift.current || landing.current || from < first) return null;
    return { id, from, to: from, rects: measure(list), ids: list, via, name: describe(g.children[from], b.fields) };
  };

  const handle = (id: string) => ({
    onPointerDown: (e: PointerEvent<HTMLElement>) => {
      const l = pick(id, "pointer");
      const mine = slots.current.get(id);
      if (!l || !mine) return;
      const { first } = now.current;
      hand.begin(e, {
        axis: "y",
        onClaim: () => {
          lift.current = l;
          mine.aim = Number.NaN;
          mine.landed = false;
          setHeld(id);
          now.current.builder.say(`Picked up ${l.name}.`);
        },
        onMove: ({ along }) => {
          const plan = reorderPlan(l.rects, l.from, along, first);
          mine.y.set(mine.settle.limit(along, plan.travel[0], plan.travel[1]).shown);
          if (plan.to === l.to) return;
          l.to = plan.to;
          sendAll(l, plan.offsets, id);
        },
        onRelease: (r) => {
          if (!r.claimed) return;
          if (r.cancelled) return putBack(l);
          landing.current = true;
          mine.settle.release({
            at: [mine.y.get()],
            speeds: [r.speed],
            land: ({ points }) => {
              const plan = reorderPlan(l.rects, l.from, points[0], first);
              l.to = plan.to;
              return [plan.offsets[l.from]];
            },
            commit: arrive(mine),
          });
          mine.aim = offsetsFor(l.rects, l.from, l.to)[l.from];
          sendAll(l, offsetsFor(l.rects, l.from, l.to), id);
          whenAll(slotsOf(l.ids), () => finish(l));
        },
      });
    },
    onKeyDown: (e: KeyboardEvent<HTMLElement>) => {
      const l = lift.current;
      const ours = ["ArrowUp", "ArrowDown", " ", "Enter", "Escape"].includes(e.key);
      if (landing.current) {
        if (ours && l?.id === id) e.preventDefault();
        return;
      }
      if (l) {
        if (l.via !== "keys" || l.id !== id) return;
        if (e.key === "ArrowUp" || e.key === "ArrowDown") {
          e.preventDefault();
          const to = Math.min(l.ids.length - 1, Math.max(now.current.first, l.to + (e.key === "ArrowUp" ? -1 : 1)));
          /* At either end the row stays, and the status still says where it is, so the key is never met with silence. */
          if (to !== l.to) {
            l.to = to;
            sendAll(l, offsetsFor(l.rects, l.from, to));
          }
          now.current.builder.say(`Position ${to + 1} of ${l.ids.length}.`);
        } else if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          drop(l);
        } else if (e.key === "Escape") {
          e.preventDefault();
          e.stopPropagation();
          putBack(l);
        }
        return;
      }
      if (e.key !== " " && e.key !== "Enter") return;
      e.preventDefault();
      const next = pick(id, "keys");
      if (!next) return;
      lift.current = next;
      setHeld(id);
      now.current.builder.say(
        `Picked up ${next.name}, position ${next.from + 1} of ${next.ids.length}. The arrow keys move it, Space drops it, Escape puts it back.`,
      );
    },
    onBlur: () => {
      const l = lift.current;
      if (l && l.via === "keys" && l.id === id && !landing.current) drop(l);
    },
  });

  return { held, register, handle };
}

const capital = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/* ---------------------------------------------------------------- the builder's shared state */

type BuilderContext = {
  fields: readonly RuleBuilderField[];
  fieldOptions: SelectOption[];
  maxDepth: number;
  disabled: boolean;
  errors: Record<string, string>;
  /** Every edit funnels through here: a pure tree function in, onValueChange out. */
  apply: (fn: (rule: RuleBuilderGroup) => RuleBuilderGroup) => void;
  /** What the polite status says next. */
  say: (words: string) => void;
  /** Focus the element with this id once the next render is on screen. */
  focusLater: (id: string) => void;
  /** A DOM id for a part of a node: its handle, its field control, its group's Add condition. */
  idFor: (part: "handle" | "field" | "add" | "error", node: string) => string;
  hintId: string;
  /** True once the builder has rendered once: rows that come after fade in, rows that were there do not. */
  mounted: MutableRefObject<boolean>;
};

const Builder = createContext<BuilderContext | null>(null);

function useBuilder(): BuilderContext {
  const ctx = useContext(Builder);
  if (!ctx) throw new Error("A rule builder part must sit inside RuleBuilder.");
  return ctx;
}

/* ---------------------------------------------------------------- the parts */

/* A row at rest is flat; a held one is the raised block, at once (R2: a shadow never fades). */
const FLAT_ROW = "shadow-[inset_0_0_0_1px_var(--line),var(--highlight)]";
const ERROR_ROW = "shadow-[inset_0_0_0_1px_var(--danger),var(--highlight)]";
const HELD = "bg-block shadow-(--block-lift)";

/* The rail: each place draws its piece, a line from the place above (or the join) turning into it at its middle, and
   the line runs on past every place but the last. It is drawn on the place, which never moves, so it stays still while
   the rows trade places. */
const RAIL =
  "before:pointer-events-none before:absolute before:-top-2 before:-left-3 before:h-[calc(50%+0.5rem)] before:w-3 " +
  "before:rounded-bl-control before:border-b before:border-l before:border-line-strong";
const RAIL_ON = "after:pointer-events-none after:absolute after:top-[calc(50%-var(--radius-control))] after:bottom-0 after:-left-3 after:border-l after:border-line-strong";

/* The handle's cell, so a lock and a still grip take the handle's room. */
const CELL = "grid h-control-sm w-control-sm shrink-0 place-items-center pointer-coarse:h-control-md pointer-coarse:w-control-md";

/* One line from 480px. Under it the value wraps under the field and the operator; under 352px (a phone, or a group
   on one) the field keeps the first line and the operator and the value each take a line of their own. */
const ROW =
  "grid min-h-control-md grid-cols-[auto_minmax(0,9rem)_minmax(0,8rem)_minmax(8rem,1fr)_auto] items-center gap-2 p-1 " +
  "@max-[30rem]:grid-cols-[auto_minmax(0,1fr)_minmax(0,1fr)_auto] @max-[22rem]:grid-cols-[auto_minmax(0,1fr)_auto]";
/* Under 352px the operator, the value and an error each span the row and take the next free line, so a locked row
   (no operator) closes up. */
const FIELD_CELL = "min-w-0 col-start-2 row-start-1";
const OPERATOR_CELL = "min-w-0 col-start-3 row-start-1 @max-[22rem]:col-span-full @max-[22rem]:row-start-auto";
const WORDS_CELL = "min-w-0 col-span-2 col-start-2 row-start-1 @max-[22rem]:col-span-1 @max-[22rem]:col-start-2";
const VALUE_CELL =
  "min-w-0 col-start-4 row-start-1 @max-[30rem]:col-span-2 @max-[30rem]:col-start-2 @max-[30rem]:row-start-2 " +
  "@max-[22rem]:col-span-full @max-[22rem]:row-start-auto";
const END_CELL = "col-start-5 row-start-1 @max-[30rem]:col-start-4 @max-[22rem]:col-start-3";
const ERROR_CELL =
  "col-span-3 col-start-2 row-start-2 pb-1 text-small text-danger @max-[30rem]:col-span-2 @max-[30rem]:row-start-3 " +
  "@max-[22rem]:col-span-full @max-[22rem]:row-start-auto @max-[22rem]:px-1";

function ValueControl({ condition, label, invalid, describedBy }: { condition: RuleBuilderCondition; label: string; invalid: boolean; describedBy?: string }) {
  const { fields, disabled, apply } = useBuilder();
  const field = fieldOf(fields, condition.field);
  const set = (value: RuleBuilderValue) =>
    apply((rule) => edit(rule, condition.id, (n) => (isGroup(n) ? n : cohere(n, { value }, fields))));
  const v = condition.value;
  if (field?.type === "choice") {
    const options = field.options.map((o) => ({ value: o.value, label: o.label }));
    if (takesMany(field, condition.operator)) {
      return (
        <Combobox
          multiple
          size="sm"
          hideLabel
          label={label}
          placeholder="Values"
          options={options}
          value={Array.isArray(v) ? v : []}
          onValueChange={set}
          disabled={disabled}
        />
      );
    }
    return (
      <Select
        size="sm"
        aria-label={label}
        aria-describedby={describedBy}
        placeholder="Value"
        options={options}
        value={typeof v === "string" ? v : ""}
        onValueChange={set}
        invalid={invalid}
        disabled={disabled}
      />
    );
  }
  if (field?.type === "number") {
    return <NumberField size="sm" hideLabel label={label} value={typeof v === "number" ? v : null} onValueChange={set} disabled={disabled} />;
  }
  return (
    <Input
      size="sm"
      aria-label={label}
      aria-describedby={describedBy}
      placeholder="Value"
      value={typeof v === "string" ? v : ""}
      onChange={(e) => set(e.target.value === "" ? null : e.target.value)}
      invalid={invalid}
      disabled={disabled}
    />
  );
}

/** One condition: the handle (or a lock), the field, the operator, the value and remove. */
function ConditionRow({ condition, index, count, held, handle, remove }: { condition: RuleBuilderCondition; index: number; count: number; held: boolean; handle: ReactNode; remove: ReactNode }) {
  const { fields, fieldOptions, disabled, errors, apply, idFor } = useBuilder();
  const field = fieldOf(fields, condition.field);
  const operators = field ? operatorsOf(field) : [];
  const error = errors[condition.id];
  const errorId = idFor("error", condition.id);
  const which = `condition ${index + 1}`;
  const set = (change: Partial<Pick<RuleBuilderCondition, "field" | "operator">>) =>
    apply((rule) => edit(rule, condition.id, (n) => (isGroup(n) ? n : cohere(n, change, fields))));
  return (
    <div
      role="group"
      aria-label={`Condition ${index + 1} of ${count}`}
      aria-describedby={error ? errorId : undefined}
      className={"@container rounded-control forced-colors:border " + (held ? HELD : error ? ERROR_ROW : FLAT_ROW)}
    >
      <div className={ROW}>
        {condition.locked ? (
          <span className={CELL + " text-fg-subtle"}>
            <LockIcon />
          </span>
        ) : (
          handle
        )}
        {condition.locked ? (
          <p className={WORDS_CELL + " truncate px-control-pad-sm text-small text-fg-muted"}>
            {field?.label ?? condition.field} {operators.find((o) => o.id === condition.operator)?.label ?? condition.operator}
          </p>
        ) : (
          <>
            <div className={FIELD_CELL}>
              <Select
                size="sm"
                id={idFor("field", condition.id)}
                aria-label={`Field, ${which}`}
                options={fieldOptions}
                value={condition.field}
                onValueChange={(f) => set({ field: f })}
                disabled={disabled}
              />
            </div>
            <div className={OPERATOR_CELL}>
              <Select
                size="sm"
                aria-label={`Operator, ${which}`}
                options={operators.map((o) => ({ value: o.id, label: o.label }))}
                value={condition.operator}
                onValueChange={(o) => set({ operator: o })}
                disabled={disabled}
              />
            </div>
          </>
        )}
        <div className={VALUE_CELL}>
          <ValueControl condition={condition} label={`Value, ${which}`} invalid={!!error} describedBy={error ? errorId : undefined} />
        </div>
        <div className={END_CELL}>{remove ?? <span aria-hidden="true" className={CELL} />}</div>
        {error && (
          <p id={errorId} className={ERROR_CELL}>
            {error}
          </p>
        )}
      </div>
    </div>
  );
}

/** A nested group: its handle, "Group · 3 conditions" and remove, then its own join, rows and Add condition. */
function GroupPanel({ group, depth, held, handle, remove }: { group: RuleBuilderGroup; depth: number; held: boolean; handle: ReactNode; remove: ReactNode }) {
  const words = conditionWords(conditionsIn(group));
  return (
    <div
      role="group"
      aria-label={`Group, ${words}`}
      className={"@container/panel grid gap-2 rounded-surface p-1 pb-3 forced-colors:border " + (held ? HELD : "bg-surface-2 " + FLAT_ROW)}
    >
      <div className="flex min-w-0 items-center gap-2">
        {handle}
        <p className="min-w-0 flex-1 truncate text-small">
          <span className="font-title text-fg">Group</span>
          <span className="text-fg-subtle"> · {capital(words)}</span>
        </p>
        {remove}
      </div>
      <div className="px-3 @max-[30rem]/panel:px-1">
        <GroupBody group={group} depth={depth} />
      </div>
    </div>
  );
}

/** One child of a group: its place on the rail, the row or panel that moves inside it, its handle and its remove. */
function Item({ node, group, index, depth, reorder }: { node: RuleBuilderNode; group: RuleBuilderGroup; index: number; depth: number; reorder: Reorder }) {
  const b = useBuilder();
  const y = useMotionValue(0);
  const settle = useSettle([y]);
  const slot = useRef<Slot | null>(null);
  if (!slot.current) slot.current = { place: null, body: null, y, settle, aim: 0, landed: true, waiting: [] };
  const { register } = reorder;
  useLayoutEffect(() => register(node.id, slot.current!), [register, node.id]);
  const enter = useTransition("responsive");
  const exit = useExit("responsive");
  const held = reorder.held === node.id;
  const count = group.children.length;
  const locked = !isGroup(node) && !!node.locked;
  const what = describe(node, b.fields);

  const handle = b.disabled ? (
    <span aria-hidden="true" className={CELL + " text-fg-disabled"}>
      <GripIcon />
    </span>
  ) : (
    <Button
      variant="ghost"
      size="sm"
      iconOnly
      id={b.idFor("handle", node.id)}
      aria-label={`Move ${what}`}
      aria-pressed={held}
      aria-describedby={b.hintId}
      data-no-drag=""
      {...reorder.handle(node.id)}
      className="cursor-grab touch-none active:cursor-grabbing pointer-coarse:h-control-md pointer-coarse:w-control-md"
    >
      <GripIcon />
    </Button>
  );

  const onRemove = () => {
    const at = (k: number) => {
      const s = group.children[k];
      return s && !(!isGroup(s) && s.locked) ? b.idFor("handle", s.id) : null;
    };
    b.focusLater(at(index + 1) ?? at(index - 1) ?? b.idFor("add", group.id));
    b.apply((rule) => removeNode(rule, node.id));
    b.say(`Removed ${what}.`);
  };
  const remove =
    b.disabled || locked ? null : (
      <Button
        variant="ghost"
        size="sm"
        iconOnly
        aria-label={`Remove ${what}`}
        onClick={onRemove}
        className="pointer-coarse:h-control-md pointer-coarse:w-control-md"
      >
        <XIcon />
      </Button>
    );

  return (
    <motion.li
      ref={(el: HTMLLIElement | null) => {
        slot.current!.place = el;
      }}
      initial={b.mounted.current ? { opacity: 0, scale: 0.98 } : false}
      animate={{ opacity: 1, scale: 1, transition: enter }}
      exit={{ opacity: 0, transition: exit }}
      className={"relative " + RAIL + (index < count - 1 ? " " + RAIL_ON : "")}
    >
      <motion.div
        ref={(el: HTMLDivElement | null) => {
          slot.current!.body = el;
        }}
        style={{ y }}
        className={"relative " + (held ? "z-10" : "")}
      >
        {isGroup(node) ? (
          <GroupPanel group={node} depth={depth + 1} held={held} handle={handle} remove={remove} />
        ) : (
          <ConditionRow condition={node} index={index} count={count} held={held} handle={handle} remove={remove} />
        )}
      </motion.div>
    </motion.li>
  );
}

/** A group's join, its rows on the rail, and its Add buttons. */
function GroupBody({ group, depth }: { group: RuleBuilderGroup; depth: number }) {
  const b = useBuilder();
  const reorder = useReorder(group);
  const n = group.children.length;
  const add = (node: RuleBuilderNode, focus: string, words: string) => {
    b.focusLater(focus);
    b.apply((rule) => appendTo(rule, group.id, node));
    b.say(words);
  };
  const addCondition = () => {
    const c = newCondition(b.fields[0]);
    add(c, b.idFor("field", c.id), "Added a condition.");
  };
  const addGroup = () => {
    const c = newCondition(b.fields[0]);
    add(newGroup(group.join === "and" ? "or" : "and", [c]), b.idFor("field", c.id), "Added a group with one condition.");
  };
  return (
    <div className="grid min-w-0 gap-2">
      {n > 0 ? (
        <>
          <Segmented
            size="sm"
            legend="Join conditions with"
            options={JOINS}
            value={group.join}
            onValueChange={(join) => b.apply((rule) => edit(rule, group.id, (g) => (isGroup(g) ? { ...g, join } : g)))}
            disabled={b.disabled}
          />
          <ul role="list" className="relative grid min-w-0 gap-2 pl-6">
            <AnimatePresence>
              {group.children.map((child, i) => (
                <Item key={child.id} node={child} group={group} index={i} depth={depth} reorder={reorder} />
              ))}
            </AnimatePresence>
          </ul>
        </>
      ) : (
        <p className="text-small text-fg-subtle">No conditions yet.</p>
      )}
      <div className={"flex flex-wrap gap-2 " + (n > 0 ? "pl-6" : "")}>
        <Button size="sm" icon={<PlusIcon />} id={b.idFor("add", group.id)} onClick={addCondition} disabled={b.disabled || !b.fields.length}>
          Add condition
        </Button>
        {depth < b.maxDepth && (
          <Button size="sm" icon={<PlusIcon />} onClick={addGroup} disabled={b.disabled || !b.fields.length}>
            Add group
          </Button>
        )}
      </div>
    </div>
  );
}

const EMPTY: RuleBuilderGroup = { kind: "group", id: "rule", join: "and", children: [] };

/** When this, and that, or any of these: a rule as rows of field, operator and value, joined by And or Or, grouped, and reordered by their handle. */
export function RuleBuilder({
  label,
  lead = "When",
  fields,
  value: valueProp,
  defaultValue,
  onValueChange,
  maxDepth = 1,
  errors = {},
  disabled = false,
  name,
  className = "",
}: RuleBuilderProps) {
  const uid = useId();
  const [inner, setInner] = useState<RuleBuilderGroup>(defaultValue ?? EMPTY);
  const rule = valueProp ?? inner;

  /* The latest rule and callback, so an edit made while a row settles builds on what is on screen now. */
  const latest = useRef({ rule, controlled: valueProp !== undefined, onValueChange });
  latest.current = { rule, controlled: valueProp !== undefined, onValueChange };
  const apply = useCallback((fn: (rule: RuleBuilderGroup) => RuleBuilderGroup) => {
    const { rule: before, controlled, onValueChange: report } = latest.current;
    const next = fn(before);
    if (next === before) return;
    if (!controlled) {
      latest.current.rule = next;
      setInner(next);
    }
    report?.(next);
  }, []);

  const [said, setSaid] = useState("");
  const say = useCallback((words: string) => setSaid((s) => (s === words ? words + " " : words)), []);

  const focusNext = useRef<string | null>(null);
  useEffect(() => {
    const id = focusNext.current;
    if (!id) return;
    focusNext.current = null;
    document.getElementById(id)?.focus();
  });

  const mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;
  }, []);

  const hintId = `${uid}-hint`;
  const fieldOptions = useMemo(() => fields.map((f) => ({ value: f.id, label: f.label })), [fields]);
  const ctx: BuilderContext = {
    fields,
    fieldOptions,
    maxDepth,
    disabled,
    errors,
    apply,
    say,
    focusLater: (id) => {
      focusNext.current = id;
    },
    idFor: (part, node) => `${uid}-${node}-${part}`,
    hintId,
    mounted,
  };

  return (
    <Builder.Provider value={ctx}>
      <div role="group" aria-label={label} className={"grid min-w-0 gap-3 " + className}>
        <p className="text-small font-title text-fg">{lead}</p>
        <GroupBody group={rule} depth={0} />
        <span id={hintId} hidden>
          Space picks it up, the arrow keys move it, Space drops it, Escape puts it back.
        </span>
        <div role="status" aria-live="polite" className="sr-only">
          {said}
        </div>
        {name && <input type="hidden" name={name} value={JSON.stringify(rule)} disabled={disabled} />}
      </div>
    </Builder.Provider>
  );
}

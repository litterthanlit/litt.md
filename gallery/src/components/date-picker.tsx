/**
 * Date picker: a day, or a range of days, from a month calendar (components.md, "Date picker"). Calendar is the
 * grid on its own; DatePicker is a field that opens it in a Popover.
 *
 * - Values are YYYY-MM-DD strings, never Date objects. The date math here runs on whole days counted from
 *   1970-01-01 in UTC, and Intl formats with timeZone "UTC", so no time zone can move a day. Today is the
 *   viewer's own date. It is read after hydration (null on the server), so Next.js never renders a stale
 *   ring. The locale defaults to en-GB and the week to Monday, both props.
 * - Calendar: a header with the month and year at the body size in --fg and previous and next as icon-only
 *   ghost sm Buttons (44px on a coarse pointer). Weekday names in caption --fg-subtle, from Intl. Always six
 *   weeks, so the height never changes. Days are 40px cells (44 on a coarse pointer) at the control radius,
 *   numbers at the small size with tabular figures. Days of the last and next month are
 *   --fg-disabled and inert: they carry no state and take no pointer, and the keys page to them. Disabled
 *   days (min, max, isDisabled) are --fg-disabled too, take no hover and stay reachable by the keys, as
 *   aria-disabled buttons.
 * - Day states: hover fills with fg 6% on the instant tier (a finger's press too). Today has an inset 1px
 *   --line-strong ring. A picked day is an --fg fill with --canvas text, never the accent (R6). In a range the
 *   two ends are filled and the days between sit on an fg 8% band that runs square across each row; the band
 *   covers the end cells too, rounded on their outer side, so it only shows its round end under a preview.
 *   While the second end is chosen, the pointer (or the focused day) previews the band. Picking the second
 *   end before the first swaps them.
 * - Keyboard: the date grid pattern. One day is the tab stop (the picked day, else today, kept inside min and
 *   max). Arrows move a day or a week, Home and End go to the week's ends, PageUp and PageDown a month (the
 *   same day, or the month's last), with Shift a year. Enter or Space picks (the day is a real button). Focus
 *   is an inset 2px --focus ring. Paging past min or max stops at them, and the previous and next buttons
 *   disable there and hand focus to each other.
 * - Motion: a new month slides half of the travel token in from the side it comes from and cross-fades, on
 *   the responsive tier, as Tabs panels do: the old month leaves a quarter of it the other way on the exit
 *   token, taken out of the flow (popLayout) so the grid never jumps. The month name cross-fades with it.
 *   Nothing else moves. The hooks return 0 under reduced motion.
 * - Accessibility: the grid is labelled by the month, a polite live region that also announces paging.
 *   Each day's button reads in full ("Saturday 17 October 2026, today, selected", the date as Intl writes it for
 *   the locale), and its gridcell carries aria-selected. Another month's day is an aria-disabled gridcell with a
 *   hidden number. A leaving month is inert.
 *
 * DatePicker:
 * - Field: the Select trigger's look and sizes (copied: select.tsx does not export them), showing the date in
 *   words from Intl ("17 Oct 2026"; a range is "3 Oct to 17 Oct 2026") or a placeholder in --fg-subtle, with
 *   a 16px calendar icon at the end. It is a button with aria-haspopup="dialog", named by its label and its
 *   value. Label above, hint or error below, as SelectField's.
 * - It opens the Calendar in a PopoverContent, which is a bottom sheet on compact screens. Focus lands on the
 *   tab-stop day. Picking a day closes it and focus returns to the field at once; in a range it closes after
 *   the second day. Presets sit in a column of 36px rows beside the calendar, and above it as a row of sm
 *   secondary Buttons on compact screens. A preset is a pick, so it closes the popover too.
 * - PopoverContent's widths (256, 320, 384) cannot hold a 280px calendar and a presets column, so on the
 *   desktop the panel makes the popover surface hug it (one inline width, set before Radix measures it).
 * - A form gets the value through a hidden field named `name`, or `name-start` and `name-end` for a range.
 */
import {
  createContext,
  useContext,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type KeyboardEvent,
  type ReactNode,
  type Ref,
} from "react";
import { AnimatePresence, motion, useIsPresent, type Variants } from "motion/react";
import { useDevice, useExit, useTransition, useTravel } from "@/motion";
import { Button } from "@/components/button";
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from "@/components/icons";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/popover";

/* ------------------------------------------------------------- date math */

/** "single" picks one day, "range" a start and an end. */
export type CalendarMode = "single" | "range";
/** Two days as YYYY-MM-DD, start on or before end. */
export type DateRange = { start: string; end: string };
/** What a calendar holds: a YYYY-MM-DD string in single mode, a DateRange in range mode. */
export type CalendarValue<M extends CalendarMode = CalendarMode> = M extends "range" ? DateRange : string;
/** A day of the week, as Date.getDay counts it: 0 is Sunday, 1 is Monday. */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

const DAY_MS = 86_400_000;
const ISO = /^(\d{4})-(\d{2})-(\d{2})$/;
const pad = (n: number, w = 2) => String(n).padStart(w, "0");

/** A UTC Date for a year, a month (0 to 11, may overflow) and a day. setUTCFullYear keeps years under 100 as written. */
function utcDate(y: number, m: number, d: number): Date {
  const t = new Date(0);
  t.setUTCFullYear(y, m, d);
  return t;
}

/** Whole days since 1970-01-01 for a YYYY-MM-DD string, or NaN when it is not a real day ("2026-02-30"). */
function toDays(date: string): number {
  const m = ISO.exec(date);
  if (!m) return NaN;
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const d = Number(m[3]);
  const t = utcDate(y, mo, d);
  if (t.getUTCFullYear() !== y || t.getUTCMonth() !== mo || t.getUTCDate() !== d) return NaN;
  return Math.round(t.getTime() / DAY_MS);
}

const fromDate = (t: Date) => `${pad(t.getUTCFullYear(), 4)}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`;
const fromDays = (n: number) => fromDate(new Date(n * DAY_MS));
const isDate = (v: unknown): v is string => typeof v === "string" && !Number.isNaN(toDays(v));
/** The day as a Date at midnight UTC, for Intl with timeZone "UTC". */
const asUtc = (date: string) => new Date(toDays(date) * DAY_MS);

/** The viewer's own date today, as YYYY-MM-DD (their time zone, not UTC). */
export function getToday(): string {
  const now = new Date();
  return `${pad(now.getFullYear(), 4)}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/** A YYYY-MM-DD date moved by whole days; negative goes back. No time zone or daylight saving can shift it. */
export function addDays(date: string, days: number): string {
  return fromDays(toDays(date) + days);
}

/** The same day a number of months away, or that month's last day when it is shorter (31 Jan plus one is 28 or 29 Feb). */
function addMonths(date: string, months: number): string {
  const [y, m, d] = date.split("-").map(Number) as [number, number, number];
  const first = utcDate(y, m - 1 + months, 1);
  const last = utcDate(first.getUTCFullYear(), first.getUTCMonth() + 1, 0).getUTCDate();
  return fromDate(utcDate(first.getUTCFullYear(), first.getUTCMonth(), Math.min(d, last)));
}

/** The day of the week of a YYYY-MM-DD date, as Date.getDay counts it: 0 is Sunday, 6 is Saturday. */
export function getWeekday(date: string): Weekday {
  /* 1970-01-01 was a Thursday. */
  return ((((toDays(date) + 4) % 7) + 7) % 7) as Weekday;
}

const clampDay = (date: string, min?: string, max?: string) =>
  min && date < min ? min : max && date > max ? max : date;

/** The month a date sits in, as YYYY-MM. YYYY-MM-DD strings sort by time, so months compare as strings too. */
const monthOf = (date: string) => date.slice(0, 7);

/** Six weeks of days for a month, starting on the week's first day. */
function sixWeeks(month: string, weekStartsOn: Weekday): string[][] {
  const first = `${month}-01`;
  const start = toDays(first) - ((getWeekday(first) - weekStartsOn + 7) % 7);
  return Array.from({ length: 6 }, (_, w) => Array.from({ length: 7 }, (_, i) => fromDays(start + w * 7 + i)));
}

/** A value read as a start and an end, both valid days or both null. Single mode is a range of one day. */
function readValue(value: unknown): { start: string | null; end: string | null } {
  if (isDate(value)) return { start: value, end: value };
  if (value && typeof value === "object") {
    const { start, end } = value as Partial<DateRange>;
    if (isDate(start) && isDate(end)) return start <= end ? { start, end } : { start: end, end: start };
  }
  return { start: null, end: null };
}

/* ------------------------------------------------------------------ today */

const noSubscribe = () => () => {};
const serverToday = () => null;
/** Today, read on every render. Null on the server and while hydrating, so the two renders always agree. */
function useToday(): string | null {
  return useSyncExternalStore(noSubscribe, getToday, serverToday);
}

/* ------------------------------------------------------------- formatting */

function useFormats(locale: string) {
  return useMemo(() => {
    const make = (o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat(locale, { timeZone: "UTC", ...o });
    return {
      month: make({ month: "long", year: "numeric" }),
      weekday: make({ weekday: "short" }),
      weekdayLong: make({ weekday: "long" }),
      full: make({ weekday: "long", day: "numeric", month: "long", year: "numeric" }),
      day: make({ day: "numeric" }),
      field: make({ day: "numeric", month: "short", year: "numeric" }),
      fieldNoYear: make({ day: "numeric", month: "short" }),
    };
  }, [locale]);
}

/** The field's words: "17 Oct 2026", or "3 Oct to 17 Oct 2026" for a range. Null when nothing is picked. */
function fieldText(value: unknown, fmt: ReturnType<typeof useFormats>): string | null {
  const { start, end } = readValue(value);
  if (!start || !end) return null;
  if (start === end) return fmt.field.format(asUtc(start));
  const from = start.slice(0, 4) === end.slice(0, 4) ? fmt.fieldNoYear : fmt.field;
  return `${from.format(asUtc(start))} to ${fmt.field.format(asUtc(end))}`;
}

/* ------------------------------------------------------------------ props */

/* DatePicker's props come first, so its docs table starts with the label, the hint and the error. */
export type DatePickerSize = "sm" | "md" | "lg";

/** A one-click choice beside the calendar, such as "Last 7 days". */
export type DatePreset<M extends CalendarMode = "single"> = {
  /** What the row or button says. */
  label: string;
  /** What it picks: a YYYY-MM-DD string, or { start, end } in range mode. */
  value: CalendarValue<M>;
};

export type DatePickerProps<M extends CalendarMode = "single"> = Omit<CalendarProps<M>, "label" | "className"> & {
  /** The label above the field. It also names the popover, and is the sheet's heading on a phone. Required, because a placeholder is not a label. */
  label: string;
  /** A hint under the field. An error replaces it. */
  hint?: ReactNode;
  /** Shown in danger color under the field and linked with aria-describedby. Also draws the danger edge. Say how to fix it. */
  error?: ReactNode;
  /** Shown while nothing is picked, in the subtle color. Defaults to "Choose a date", or "Choose dates" for a range. */
  placeholder?: string;
  /** Height on the shared control scale: sm is 32, md is 44, lg is 56. Use lg next to an lg button. */
  size?: DatePickerSize;
  /** The field name a form sends the value under, as YYYY-MM-DD. A range sends two: name-start and name-end. */
  name?: string;
  /** One-click choices, such as "Last 7 days". A column of rows beside the calendar, and a row of buttons above it on a phone. */
  presets?: DatePreset<M>[];
  /** Dims the field and keeps the calendar closed. */
  disabled?: boolean;
  /** The id of the field's button. One is made for you. */
  id?: string;
  /** Extra classes for the field's wrapper, such as a width. */
  className?: string;
};

/* --------------------------------------------------------------- calendar */

export type CalendarProps<M extends CalendarMode = "single"> = {
  /** "single" (the default) picks one day. "range" picks a start and then an end, and previews the band while the end is chosen. */
  mode?: M;
  /** The picked day as YYYY-MM-DD, or { start, end } in range mode. Pair it with onValueChange. Leave it out and the calendar keeps its own. */
  value?: CalendarValue<M> | null;
  /** The value to start with when you do not control it. */
  defaultValue?: CalendarValue<M> | null;
  /** Called with the picked day, or in range mode with { start, end } once the second end is picked. */
  onValueChange?: (value: CalendarValue<M>) => void;
  /** The earliest day that can be picked, as YYYY-MM-DD. Earlier days are dimmed, and the calendar does not page before its month. */
  min?: string;
  /** The latest day that can be picked, as YYYY-MM-DD. Later days are dimmed, and the calendar does not page past its month. */
  max?: string;
  /** Rules out more days, such as weekends: return true for a day that cannot be picked. It gets the day as YYYY-MM-DD. */
  isDisabled?: (date: string) => boolean;
  /** The locale for the month, the weekday names and each day's spoken name, as a BCP 47 tag. */
  locale?: string;
  /** The first column of each week: 0 is Sunday, 1 is Monday. */
  weekStartsOn?: Weekday;
  /** Names the calendar as a group for assistive tech, such as "Studio schedule". The grid itself is named by the month. */
  label?: string;
  /** Extra classes for the root, such as a margin. The calendar is as wide as its seven columns. */
  className?: string;
};

/** Set by DatePicker: the tab-stop day is where focus lands when the popover opens. */
const InPicker = createContext(false);

/** The fg 6% fill a day or a preset row takes under the pointer, and under a finger while it is pressed. */
const HOVER =
  "hover:bg-[color-mix(in_oklab,var(--fg)_6%,transparent)] pointer-coarse:active:bg-[color-mix(in_oklab,var(--fg)_6%,transparent)]";
/** Day cells: 40px, 44px on a finger. In a container narrower than seven of them the columns share what there is. */
const CELL = "h-10 w-10 max-w-full pointer-coarse:h-11 pointer-coarse:w-11";
const ROW = "grid grid-cols-7";

const dayBase =
  "relative grid size-full place-items-center rounded-control text-small tabular-nums select-none " +
  "[-webkit-tap-highlight-color:transparent] transition-[background-color,color] duration-(--dur-instant) ease-litt " +
  "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus";

/** One day as it is drawn and read. */
type Day = {
  date: string;
  /** Inside the month on show. Other days carry no state and take no pointer. */
  inMonth: boolean;
  disabled: boolean;
  today: boolean;
  /** Filled with --fg: the picked day, a range's ends, or the first end while the second is chosen. */
  filled: boolean;
  /** Where the fg 8% band sits in this cell. */
  band: "none" | "mid" | "start" | "end";
  selected: boolean;
  name: string;
};

/**
 * A month grid: the month and year, previous and next, the weekday names and six weeks of days. Pick one day, or a
 * range with mode="range". Values are YYYY-MM-DD strings. Use it on its own beside a schedule or a list; use
 * DatePicker for a form field.
 */
export function Calendar<M extends CalendarMode = "single">({
  mode,
  value: valueProp,
  defaultValue = null,
  onValueChange,
  min,
  max,
  isDisabled,
  locale = "en-GB",
  weekStartsOn = 1,
  label,
  className = "",
}: CalendarProps<M>) {
  const range = mode === "range";
  const inPicker = useContext(InPicker);
  const fmt = useFormats(locale);
  const today = useToday();
  const enter = useTransition("responsive");
  const exit = useExit("responsive");
  const travel = useTravel();
  const titleId = useId();

  const [inner, setInner] = useState<CalendarValue<M> | null>(defaultValue);
  const value = valueProp === undefined ? inner : valueProp;
  const picked = readValue(value);

  /* The first end of a range while the second is being chosen. Nothing is reported until both are picked. */
  const [pending, setPending] = useState<string | null>(null);
  const [hover, setHover] = useState<string | null>(null);

  /* The tab stop. It follows the value when the value changes from outside (a preset, a parent), and stays where it
     is when the change came from a pick here, so a range picked across two months keeps showing the second. */
  const [chosen, setChosen] = useState<string | null>(null);
  const key = `${picked.start}/${picked.end}`;
  const [seen, setSeen] = useState(key);
  const [own, setOwn] = useState<string | null>(null);
  if (seen !== key) {
    setSeen(key);
    if (key !== own) {
      setChosen(picked.start);
      setPending(null);
    }
  }
  const focus = clampDay(chosen ?? picked.start ?? today ?? new Date().toISOString().slice(0, 10), min, max);
  const month = monthOf(focus);

  /* Which way time moved, derived while rendering so the new month gets it in the same pass. */
  const [shown, setShown] = useState(month);
  const [dir, setDir] = useState<1 | -1>(1);
  if (shown !== month) {
    setShown(month);
    setDir(month > shown ? 1 : -1);
  }

  const canPrev = !min || monthOf(min) < month;
  const canNext = !max || monthOf(max) > month;
  const blocked = (date: string) => (min != null && date < min) || (max != null && date > max) || !!isDisabled?.(date);

  const root = useRef<HTMLDivElement | null>(null);
  const prevButton = useRef<HTMLButtonElement | null>(null);
  const nextButton = useRef<HTMLButtonElement | null>(null);
  /* A key moved the tab stop, so focus follows it into the (possibly new) month once it has rendered. */
  const follow = useRef(false);
  useLayoutEffect(() => {
    if (!follow.current) return;
    follow.current = false;
    root.current?.querySelector<HTMLElement>(`[data-month="${month}"] [data-day="${focus}"]`)?.focus({ preventScroll: true });
  }, [focus, month]);

  const commit = (next: CalendarValue<M>) => {
    const r = readValue(next);
    setOwn(`${r.start}/${r.end}`);
    setInner(next);
    onValueChange?.(next);
  };

  const pick = (date: string) => {
    setChosen(date);
    if (blocked(date)) return;
    if (!range) return commit(date as CalendarValue<M>);
    if (!pending) return setPending(date);
    setPending(null);
    setHover(null);
    commit((pending <= date ? { start: pending, end: date } : { start: date, end: pending }) as CalendarValue<M>);
  };

  /* Previous and next keep the tab stop on the same day of the month. A button that is about to be disabled hands
     its focus to the other one, so focus never drops to the page. */
  const page = (step: -1 | 1) => {
    const next = clampDay(addMonths(focus, step), min, max);
    setChosen(next);
    const end = step < 0 ? !min || monthOf(min) < monthOf(next) : !max || monthOf(max) > monthOf(next);
    if (!end) requestAnimationFrame(() => (step < 0 ? nextButton : prevButton).current?.focus());
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!(e.target as HTMLElement).dataset.day) return;
    const col = (getWeekday(focus) - weekStartsOn + 7) % 7;
    const moves: Record<string, () => string> = {
      ArrowLeft: () => addDays(focus, -1),
      ArrowRight: () => addDays(focus, 1),
      ArrowUp: () => addDays(focus, -7),
      ArrowDown: () => addDays(focus, 7),
      Home: () => addDays(focus, -col),
      End: () => addDays(focus, 6 - col),
      PageUp: () => addMonths(focus, e.shiftKey ? -12 : -1),
      PageDown: () => addMonths(focus, e.shiftKey ? 12 : 1),
    };
    const move = moves[e.key];
    if (!move || e.altKey || e.ctrlKey || e.metaKey) return;
    e.preventDefault();
    follow.current = true;
    setChosen(clampDay(move(), min, max));
  };

  /* The band: a committed range, or the first end and the day under the pointer (or the focused day) while the second
     end is chosen. */
  const lead = pending ? (hover ?? focus) : null;
  const [lo, hi] = pending
    ? pending <= lead! ? [pending, lead!] : [lead!, pending]
    : [range ? picked.start : null, range ? picked.end : null];

  const weekdays = Array.from({ length: 7 }, (_, i) => {
    /* 1970-01-04 was a Sunday. */
    const sample = fromDays(3 + ((weekStartsOn + i) % 7));
    return { short: fmt.weekday.format(asUtc(sample)), long: fmt.weekdayLong.format(asUtc(sample)) };
  });

  const describe = (date: string): Day => {
    const inMonth = monthOf(date) === month;
    const isToday = date === today;
    let filled = false;
    let band: Day["band"] = "none";
    let selected = false;
    let state: string | null = null;
    if (inMonth) {
      if (pending) {
        filled = date === pending;
        if (filled) state = "selected";
      } else if (!range) {
        filled = selected = date === picked.start;
        if (filled) state = "selected";
      } else if (picked.start && picked.end) {
        filled = date === picked.start || date === picked.end;
        selected = date >= picked.start && date <= picked.end;
        if (picked.start === picked.end) state = filled ? "selected" : null;
        else state = date === picked.start ? "start of range" : date === picked.end ? "end of range" : selected ? "in range" : null;
      }
      if (lo && hi && lo !== hi && date >= lo && date <= hi) band = date === lo ? "start" : date === hi ? "end" : "mid";
    }
    const name = [fmt.full.format(asUtc(date)), isToday ? "today" : null, state].filter(Boolean).join(", ");
    return { date, inMonth, disabled: blocked(date), today: isToday, filled, band, selected, name };
  };

  const weeks = sixWeeks(month, weekStartsOn).map((week) => week.map(describe));
  const title = fmt.month.format(asUtc(`${month}-01`));

  const variants: Variants = {
    in: (d: 1 | -1) => ({ opacity: 0, x: d * (travel / 2) }),
    show: { opacity: 1, x: 0, transition: enter },
    out: (d: 1 | -1) => ({ opacity: 0, x: -d * (travel / 4), transition: exit }),
  };

  const nav = "pointer-coarse:h-control-md pointer-coarse:w-control-md";

  return (
    <div
      ref={root}
      role={label ? "group" : undefined}
      aria-label={label}
      className={"grid w-max max-w-full content-start gap-3 " + className}
    >
      <div className="flex items-center justify-between gap-2">
        {/* The grid's name, and a polite live region, so paging is announced. The animated title is only seen. */}
        <span id={titleId} aria-live="polite" aria-atomic="true" className="sr-only">
          {title}
        </span>
        <div aria-hidden="true" className="relative min-w-0 flex-1">
          <AnimatePresence initial={false} mode="popLayout">
            <motion.span
              key={month}
              className="block truncate text-body font-title text-fg"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: enter }}
              exit={{ opacity: 0, transition: exit }}
            >
              {title}
            </motion.span>
          </AnimatePresence>
        </div>
        <div className="flex items-center gap-1">
          <Button
            ref={prevButton}
            iconOnly
            size="sm"
            variant="ghost"
            aria-label="Previous month"
            disabled={!canPrev}
            onClick={() => page(-1)}
            className={nav}
          >
            <ChevronLeftIcon />
          </Button>
          <Button
            ref={nextButton}
            iconOnly
            size="sm"
            variant="ghost"
            aria-label="Next month"
            disabled={!canNext}
            onClick={() => page(1)}
            className={nav}
          >
            <ChevronRightIcon />
          </Button>
        </div>
      </div>

      <div role="grid" aria-labelledby={titleId} onKeyDown={onKeyDown} onPointerLeave={() => setHover(null)} className="grid gap-1">
        <div role="row" className={ROW}>
          {weekdays.map((w) => (
            <div
              key={w.long}
              role="columnheader"
              aria-label={w.long}
              className="grid h-6 w-10 max-w-full place-items-center text-caption text-fg-subtle pointer-coarse:w-11"
            >
              {w.short}
            </div>
          ))}
        </div>
        <div className="relative">
          <AnimatePresence initial={false} mode="popLayout" custom={dir}>
            <MonthRows
              key={month}
              month={month}
              weeks={weeks}
              focus={focus}
              dir={dir}
              variants={variants}
              autoFocus={inPicker}
              format={fmt.day}
              onPick={pick}
              onHover={pending ? setHover : undefined}
            />
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

type MonthRowsProps = {
  ref?: Ref<HTMLDivElement>;
  month: string;
  weeks: Day[][];
  focus: string;
  dir: 1 | -1;
  variants: Variants;
  autoFocus: boolean;
  format: Intl.DateTimeFormat;
  onPick: (date: string) => void;
  onHover?: (date: string) => void;
};

/** One month's six weeks. It forwards its ref, because AnimatePresence's popLayout measures the leaving month. */
function MonthRows({ ref, month, weeks, focus, dir, variants, autoFocus, format, onPick, onHover }: MonthRowsProps) {
  const present = useIsPresent();
  return (
    <motion.div
      ref={ref}
      role="rowgroup"
      data-month={month}
      custom={dir}
      variants={variants}
      initial="in"
      animate="show"
      exit="out"
      inert={!present}
      className="grid gap-1"
    >
      {weeks.map((week) => (
        <div key={week[0]!.date} role="row" className={ROW}>
          {week.map((d) => (
            <DayCell key={d.date} day={d} tabStop={d.date === focus} autoFocus={autoFocus} format={format} onPick={onPick} onHover={onHover} />
          ))}
        </div>
      ))}
    </motion.div>
  );
}

const BAND: Record<Day["band"], string> = {
  none: "",
  mid: "",
  start: "rounded-l-control",
  end: "rounded-r-control",
};

function DayCell({
  day,
  tabStop,
  autoFocus,
  format,
  onPick,
  onHover,
}: {
  day: Day;
  tabStop: boolean;
  autoFocus: boolean;
  format: Intl.DateTimeFormat;
  onPick: (date: string) => void;
  onHover?: (date: string) => void;
}) {
  const number = format.format(asUtc(day.date));
  if (!day.inMonth) {
    /* Another month's day: inactive here (aria-disabled), so its dimmed number is exempt from contrast, as a disabled control's is. */
    return (
      <div role="gridcell" aria-disabled="true" className={"grid place-items-center text-small tabular-nums text-fg-disabled select-none " + CELL}>
        <span aria-hidden="true">{number}</span>
      </div>
    );
  }
  const look = day.filled
    ? "bg-fg text-canvas"
    : day.disabled
      ? "text-fg-disabled"
      : "text-fg " + HOVER;
  return (
    <div role="gridcell" aria-selected={day.selected} className={"relative " + CELL}>
      {day.band !== "none" && (
        <span aria-hidden="true" className={"absolute inset-0 bg-[color-mix(in_oklab,var(--fg)_8%,transparent)] " + BAND[day.band]} />
      )}
      <button
        type="button"
        data-day={day.date}
        data-autofocus={autoFocus && tabStop ? "" : undefined}
        tabIndex={tabStop ? 0 : -1}
        aria-label={day.name}
        aria-disabled={day.disabled || undefined}
        onClick={() => onPick(day.date)}
        onPointerEnter={onHover && !day.disabled ? () => onHover(day.date) : undefined}
        className={[
          dayBase,
          look,
          day.disabled ? "cursor-not-allowed" : "cursor-pointer",
          day.today && !day.filled ? "shadow-[inset_0_0_0_1px_var(--line-strong)]" : "",
        ].join(" ")}
      >
        {number}
      </button>
    </div>
  );
}

/* ------------------------------------------------------------ date picker */

/* The Select trigger's look and sizes (select.tsx), which do not ship as exports. */
const field =
  "group/trigger flex w-full min-w-0 cursor-pointer items-center gap-control rounded-control bg-surface-1 text-left font-normal text-fg " +
  "data-placeholder:text-fg-subtle " +
  "pointer-coarse:text-(length:--control-text-lg) " +
  "[-webkit-tap-highlight-color:transparent] " +
  "shadow-[inset_0_0_0_1px_var(--line-control)] " +
  "transition-[box-shadow] duration-(--dur-instant) ease-litt " +
  "focus-visible:outline-none focus-visible:shadow-[inset_0_0_0_1px_var(--focus),var(--focus-ring)] " +
  "aria-invalid:shadow-[inset_0_0_0_1px_var(--danger)] " +
  "aria-invalid:focus-visible:shadow-[inset_0_0_0_1px_var(--danger),var(--focus-ring)] " +
  "disabled:cursor-not-allowed disabled:bg-surface-2 disabled:text-fg-disabled disabled:data-placeholder:text-fg-disabled " +
  "disabled:shadow-[inset_0_0_0_1px_var(--line)] " +
  "forced-colors:border forced-colors:focus-visible:outline-2 forced-colors:focus-visible:outline-solid forced-colors:focus-visible:outline-offset-2";

const sizes: Record<DatePickerSize, string> = {
  sm: "h-control-sm px-control-pad-sm text-small pointer-coarse:h-control-md",
  md: "h-control-md px-control-pad-md text-body",
  lg: "h-control-lg px-control-pad-lg text-(length:--control-text-lg)",
};

const presetRow =
  "flex h-9 w-full cursor-pointer items-center whitespace-nowrap rounded-control px-3 text-left text-small " +
  "[-webkit-tap-highlight-color:transparent] transition-colors duration-(--dur-instant) ease-litt " +
  "hover:text-fg pointer-coarse:active:text-fg " +
  HOVER +
  " " +
  "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus";

const sameValue = (a: unknown, b: unknown) => {
  const x = readValue(a);
  const y = readValue(b);
  return x.start !== null && x.start === y.start && x.end === y.end;
};

/**
 * A form field that opens a Calendar: the Select trigger's look, the date in words, and the calendar in a popover (a
 * bottom sheet on a phone). Picking closes it, after the second day in a range. Pass name and a form gets the value.
 */
export function DatePicker<M extends CalendarMode = "single">({
  label,
  hint,
  error,
  placeholder,
  size = "md",
  name,
  presets,
  disabled = false,
  id: idProp,
  className = "",
  mode,
  value: valueProp,
  defaultValue = null,
  onValueChange,
  min,
  max,
  isDisabled,
  locale = "en-GB",
  weekStartsOn = 1,
}: DatePickerProps<M>) {
  const range = mode === "range";
  const { compact } = useDevice();
  const fmt = useFormats(locale);
  const [inner, setInner] = useState<CalendarValue<M> | null>(defaultValue);
  const value = valueProp === undefined ? inner : valueProp;
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement | null>(null);

  const auto = useId();
  const id = idProp ?? auto;
  const labelId = `${id}-label`;
  const valueId = `${id}-value`;
  const noteId = `${id}-note`;
  const note = error ?? hint;
  const text = fieldText(value, fmt);
  const picked = readValue(value);

  /* A pick closes the popover and puts focus back on the field at once, not when the exit has played. */
  const pick = (next: CalendarValue<M>) => {
    setInner(next);
    onValueChange?.(next);
    setOpen(false);
    trigger.current?.focus({ preventScroll: true });
  };

  const calendar = (
    <InPicker value>
      <Calendar<M>
        mode={mode}
        value={value}
        onValueChange={pick}
        min={min}
        max={max}
        isDisabled={isDisabled}
        locale={locale}
        weekStartsOn={weekStartsOn}
      />
    </InPicker>
  );

  return (
    <div className={"grid gap-2 " + className}>
      {/* The label points at the field, but a click only moves focus: a label click would otherwise open the calendar. */}
      <label
        id={labelId}
        htmlFor={id}
        onClick={(e) => {
          e.preventDefault();
          trigger.current?.focus();
        }}
        className={"text-small font-title " + (disabled ? "text-fg-disabled" : "text-fg")}
      >
        {label}
      </label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            ref={trigger}
            id={id}
            type="button"
            disabled={disabled}
            aria-labelledby={`${labelId} ${valueId}`}
            aria-describedby={note ? noteId : undefined}
            aria-invalid={error ? true : undefined}
            data-placeholder={text ? undefined : ""}
            className={field + " " + sizes[size]}
          >
            <span id={valueId} className="min-w-0 flex-1 truncate">
              {text ?? placeholder ?? (range ? "Choose dates" : "Choose a date")}
            </span>
            <CalendarIcon className="shrink-0 text-fg-subtle group-disabled/trigger:text-fg-disabled" />
          </button>
        </PopoverTrigger>
        <PopoverContent label={label} padded={compact}>
          {compact ? (
            <div className="grid gap-4">
              {presets && presets.length > 0 && (
                <div className="flex flex-wrap gap-3">
                  {presets.map((p) => (
                    <Button key={p.label} size="sm" className="pointer-coarse:h-control-md" onClick={() => pick(p.value)}>
                      {p.label}
                    </Button>
                  ))}
                </div>
              )}
              {calendar}
            </div>
          ) : (
            <Hug>
              {presets && presets.length > 0 && (
                <div className="grid min-w-32 content-start border-r border-line pt-3 pr-1">
                  {presets.map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => pick(p.value)}
                      className={presetRow + " " + (sameValue(p.value, value) ? "text-fg" : "text-fg-muted")}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              )}
              <div className="p-3">{calendar}</div>
            </Hug>
          )}
        </PopoverContent>
      </Popover>
      {name && !range && <input type="hidden" name={name} value={picked.start ?? ""} />}
      {name && range && (
        <>
          <input type="hidden" name={`${name}-start`} value={picked.start ?? ""} />
          <input type="hidden" name={`${name}-end`} value={picked.end ?? ""} />
        </>
      )}
      {note && (
        <p id={noteId} className={"text-small " + (error ? "text-danger" : "text-fg-subtle")}>
          {note}
        </p>
      )}
    </div>
  );
}

/**
 * The desktop panel. PopoverContent's widths are 256, 320 and 384, and a calendar with a presets column needs more,
 * so the surface hugs this panel instead. It is set in a layout effect, before Radix measures and places the surface.
 */
function Hug({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement | null>(null);
  useLayoutEffect(() => {
    const surface = ref.current?.closest<HTMLElement>("[data-popover-surface]");
    if (surface) surface.style.width = "auto";
  }, []);
  return (
    <div ref={ref} className="flex">
      {children}
    </div>
  );
}

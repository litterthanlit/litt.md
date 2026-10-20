import { useState, type FormEvent } from "react";
import { Button } from "@/components/button";
import {
  addDays,
  Calendar,
  DatePicker,
  getToday,
  getWeekday,
  type DatePreset,
  type DateRange,
} from "@/components/date-picker";
import { Page, Stage, type PageDocs, type PageMeta } from "../kit";

export const meta: PageMeta = {
  id: "date-picker",
  title: "Date picker",
  lede: "A day or a range, picked from a month.",
  order: 2.7,
  group: "Controls",
  summary:
    "A day, or a range of days, from a month calendar, kept as YYYY-MM-DD strings. The field opens the calendar in a popover, a bottom sheet on a phone. A new month slides in from the side it comes from, and nothing else moves.",
  tiers: ["instant", "responsive"],
};

export const docs: PageDocs = {
  components: ["date-picker"],
  exports: ["DatePicker", "Calendar", "getToday", "addDays", "getWeekday"],
  usage: `import { DatePicker, Calendar, getToday, addDays, getWeekday } from "@/components/date-picker";

// One day. Values are YYYY-MM-DD strings, never Date objects.
const [launch, setLaunch] = useState<string | null>(null);
<DatePicker label="Launch date" name="launch" min={getToday()} value={launch} onValueChange={setLaunch} />

// A range, with presets. A form gets period-start and period-end.
const today = getToday();
<DatePicker
  mode="range"
  label="Report period"
  name="period"
  max={today}
  defaultValue={{ start: addDays(today, -6), end: today }}
  presets={[
    { label: "Last 7 days", value: { start: addDays(today, -6), end: today } },
    { label: "Last 30 days", value: { start: addDays(today, -29), end: today } },
  ]}
/>

// The calendar on its own, with weekends ruled out.
<Calendar label="Handover call" value={day} onValueChange={setDay} isDisabled={(d) => [0, 6].includes(getWeekday(d))} />`,
  use: [
    "A day for something that happens once: a launch, a deadline, a handover call. Use DatePicker in a form, with min or max where the past or the future makes no sense.",
    "A report's period. Use mode=\"range\" and give it presets such as Last 7 days, because most people want one of a few periods.",
    "A calendar that stays on the page beside what it filters, such as a schedule. Use Calendar on its own.",
    "Days that cannot be picked: before min, after max, or any day isDisabled rules out, such as weekends.",
    "Dates that must not drift. The values are plain YYYY-MM-DD strings, so no time zone can move a day on its way to the server.",
  ],
  skip: [
    "A time as well as a day. This picks whole days; pair it with a Select of times.",
    "A birth date or another day years away. Paging there month by month is slow, so use an Input with the format in its hint.",
    "Several separate days. A range is one start and one end.",
    "A relative period with no calendar, such as Last 7 days or Last 30 days alone. Use Segmented or Select.",
    "Typing a date. The field is a button that opens the calendar; a typed date needs locale-aware parsing, which this does not do.",
  ],
  keyboard: [
    [["Enter", "Space"], "On the field: opens the calendar with focus on the picked day, else today."],
    [["ArrowLeft", "ArrowRight"], "Moves a day. Past the first or last day of the month the next month slides in."],
    [["ArrowUp", "ArrowDown"], "Moves a week."],
    [["Home", "End"], "Moves to the first or last day of the week."],
    [["PageUp", "PageDown"], "Moves a month, to the same day or the month's last."],
    [["Shift+PageUp", "Shift+PageDown"], "Moves a year."],
    [["Enter", "Space"], "Picks the focused day. In a range the first pick is the start and the second the end. In the field it closes the calendar and focus returns to the field."],
    [["Tab"], "Moves between the presets, previous and next, and the grid, which is one tab stop."],
    [["Esc"], "Closes the calendar, keeps the value and returns focus to the field."],
  ],
  a11y: [
    "The grid is a role=\"grid\" named by the month, which is also a polite live region, so a screen reader hears the new month after paging. Weekday headers carry their full names.",
    "Each day is a button whose name reads in full, such as \"Saturday 17 October 2026, today, selected\", with start of range, end of range or in range in a range. Its gridcell carries aria-selected.",
    "Disabled days stay in the grid and in the arrow keys' path as aria-disabled buttons, so a person can hear why a day cannot be picked. Days of the last and next month are dimmed and take no pointer; the keys page to them.",
    "The field is a button with aria-haspopup=\"dialog\", named by its label and the date it shows. A hint or an error is linked with aria-describedby, and an error sets aria-invalid. Clicking the label focuses the field without opening it.",
    "The popover is a dialog named by the label. Focus lands on the picked day, or today, and goes back to the field when a pick closes it. On a phone it is a bottom sheet with the label as its heading, a Close button and Esc.",
    "Focus is an inset 2px ring in the focus color. The picked day is a foreground fill with canvas text, never the accent, and today is a hairline ring, so neither depends on color alone: the names say both.",
    "Days are 40px, and 44px on a coarse pointer, as are previous and next. Under reduced motion the month changes at once, with no slide.",
    "A form gets YYYY-MM-DD through a hidden field named name, or name-start and name-end for a range. Validate on submit yourself and pass the message to error.",
  ],
};

/** A quiet status line beside a field, so each stage shows what it did. */
function Status({ children }: { children: string }) {
  return (
    <p role="status" className="min-h-5 font-mono text-caption font-normal text-fg-subtle">
      {children}
    </p>
  );
}

/** "Monday 19 October", for the demos' own words. The date is read at midnight UTC, so no time zone moves it. */
function spoken(date: string) {
  return new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }).format(
    new Date(`${date}T00:00:00Z`),
  );
}

/* ---------------------------------------------------------- a launch date */

function LaunchDateDemo() {
  const today = getToday();
  const [launch, setLaunch] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState("");
  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!launch) {
      setError("Choose the day the site goes live.");
      setSent("");
      e.currentTarget.querySelector<HTMLElement>("[aria-haspopup=dialog]")?.focus();
      return;
    }
    setSent(`Sent launch=${new FormData(e.currentTarget).get("launch")}`);
  };
  return (
    <form onSubmit={submit} noValidate className="grid w-full max-w-sm gap-6">
      <DatePicker
        label="Launch date"
        name="launch"
        min={today}
        value={launch}
        onValueChange={(day) => {
          setLaunch(day);
          setError(null);
        }}
        hint="The Marlow Labs site goes live at 09:00 on this day."
        error={error}
      />
      <div className="grid gap-3">
        <Button variant="primary" type="submit">
          Schedule launch
        </Button>
        <Status>{sent}</Status>
      </div>
    </form>
  );
}

/* ---------------------------------------------------------- a report period */

/** How many days a range covers, ends included. */
function length(r: DateRange) {
  let n = 1;
  for (let d = r.start; d < r.end; d = addDays(d, 1)) n++;
  return n;
}

function ReportPeriodDemo() {
  const today = getToday();
  const presets: DatePreset<"range">[] = [
    { label: "Last 7 days", value: { start: addDays(today, -6), end: today } },
    { label: "Last 30 days", value: { start: addDays(today, -29), end: today } },
    { label: "This month", value: { start: `${today.slice(0, 7)}-01`, end: today } },
  ];
  const [period, setPeriod] = useState<DateRange>(presets[0]!.value);
  const days = length(period);
  return (
    <div className="grid w-full max-w-sm gap-3">
      <DatePicker
        mode="range"
        label="Report period"
        name="period"
        max={today}
        presets={presets}
        value={period}
        onValueChange={setPeriod}
        hint="Deploys and build minutes for Grotta Type."
      />
      <Status>{`${days} ${days === 1 ? "day" : "days"} of deploys`}</Status>
    </div>
  );
}

/* ---------------------------------------------------------- beside a schedule */

type Booking = { time: string; title: string };

/** The studio's week, from today, so the demo always has something near. */
function bookings(today: string): Map<string, Booking[]> {
  return new Map([
    [today, [{ time: "10:00", title: "Marlow Labs, review of the pricing page" }, { time: "14:30", title: "Deploy the Grotta Type specimen" }]],
    [addDays(today, 1), [{ time: "09:30", title: "Sidebar Weekly, interview about studio tools" }]],
    [addDays(today, 3), [{ time: "11:00", title: "Grotta Type, handover of the Framer site" }, { time: "16:00", title: "Studio review" }]],
    [addDays(today, 7), [{ time: "09:00", title: "Marlow Labs launch" }]],
  ]);
}

function ScheduleDemo() {
  const today = getToday();
  const [day, setDay] = useState(today);
  const list = bookings(today).get(day) ?? [];
  return (
    <div className="flex w-full max-w-2xl flex-wrap items-start gap-x-12 gap-y-8">
      <Calendar label="Studio schedule" value={day} onValueChange={setDay} />
      <div className="grid min-w-56 flex-1 content-start gap-4">
        <h3 className="text-body text-fg">{spoken(day)}</h3>
        {list.length ? (
          <ul className="grid gap-3">
            {list.map((b) => (
              <li key={b.time} className="grid grid-cols-[3.5rem_1fr] gap-3 text-small">
                <span className="font-mono tabular-nums text-fg-subtle">{b.time}</span>
                <span className="text-fg-muted">{b.title}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-small text-fg-subtle">Nothing booked. A day for deep work.</p>
        )}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------- weekdays only */

const weekend = (date: string) => getWeekday(date) === 0 || getWeekday(date) === 6;

function WeekdaysDemo() {
  const today = getToday();
  const [day, setDay] = useState<string | null>(null);
  return (
    <div className="grid gap-4">
      <Calendar label="Handover call" min={today} isDisabled={weekend} value={day} onValueChange={setDay} />
      <Status>{day ? `Handover call with Grotta Type on ${spoken(day)}.` : "Pick a weekday for the handover call."}</Status>
    </div>
  );
}

export default function DatePickerPage() {
  return (
    <Page meta={meta} docs={docs}>
      <Stage
        title="A launch date for a Framer site"
        tier="responsive"
        size="lg"
        align="start"
        code="LaunchDateDemo"
        caption="The field is the Select trigger with the date in words. Click it and the calendar grows out of it in a popover, on the responsive tier, with focus on today. Days before today are dimmed, because a launch cannot be in the past. A pick closes it and focus returns to the field. Submit with no date and the error says what to do."
      >
        <LaunchDateDemo />
      </Stage>

      <Stage
        title="A report period"
        tier="responsive"
        size="lg"
        align="start"
        code="ReportPeriodDemo"
        caption="A range takes two picks. The first fills a day, and the band follows the pointer until the second, then the popover closes. The presets sit in a column beside the calendar and pick in one click; on a phone they sit above it as buttons, in a bottom sheet. Days after today are dimmed."
      >
        <ReportPeriodDemo />
      </Stage>

      <Stage
        title="Beside a schedule"
        tier="responsive"
        align="start"
        code="ScheduleDemo"
        caption="The calendar on its own. Page with the arrows or PageUp and PageDown, and the new month slides half of the travel token in from the side it comes from as the old one fades, on the responsive tier. Always six weeks, so the list beside it never moves. Today has a hairline ring; the picked day is filled with the foreground, never the accent."
      >
        <ScheduleDemo />
      </Stage>

      <Stage
        title="Weekdays only"
        tier="instant"
        code="WeekdaysDemo"
        caption="isDisabled rules out weekends and min rules out the past. Those days are dimmed and take no hover, and the arrow keys still reach them, so a screen reader can say why. A day under the pointer fills on the instant tier."
      >
        <WeekdaysDemo />
      </Stage>
    </Page>
  );
}

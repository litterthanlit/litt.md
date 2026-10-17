import { Heatmap, type HeatmapRow } from "@/components/heatmap";
import { Page, Stage, type PageDocs, type PageMeta } from "../kit";

export const meta: PageMeta = {
  id: "heatmap",
  title: "Heatmap",
  order: 17.7,
  group: "Data",
  summary:
    "A dot matrix whose depth says how much: usage per day, deploys per week, mail per hour. One data hue in four steps over an empty dot, mono labels, a tooltip on hover, touch and focus, and a legend from less to more.",
  tiers: ["instant", "responsive"],
};

export const docs: PageDocs = {
  components: ["heatmap"],
  exports: ["Heatmap"],
  usage: `import { Heatmap } from "@/components/heatmap";

// Rows of dots. A value is a count, zero is an empty dot, and null draws nothing (a day still to come).
// "columns" names each column for the tooltip and for screen readers.
<Heatmap
  label="Page views per day"
  hue="teal"
  cell={12}
  columns={Array.from({ length: 31 }, (_, i) => \`day \${i + 1}\`)}
  unit={["view", "views"]}
  rows={[
    { label: "August", values: [812, 640, 1204 /* … */], total: "25,998" },
    { label: "September", values: [903, 771, 698 /* … */], total: "24,310" },
  ]}
/>

// A year of weeks: seven rows, 53 columns, month names over the columns it starts in.
<Heatmap
  label="Deploys per day, last 53 weeks"
  rows={weekdays}
  columns={weeks}
  columnTicks={[{ index: 0, label: "Oct" }, { index: 3, label: "Nov" } /* … */]}
  unit={["deploy", "deploys"]}
/>`,
  use: [
    "A person needs to see where the weight sits in a long run of values: usage per day across a few months, deploys across a year, mail by hour of the week. The eye reads pattern before it reads numbers.",
    "Each cell is one count, and the counts share a scale. The four steps are the quartiles of the non-zero values by default, so the dots stay evenly spread. Pass `steps` when the levels should mean something fixed, such as an SLA.",
    "The grid is wider than its box, such as a year on a phone. The dots keep their size and scroll sideways inside the box, starting at the latest column.",
    "Pick the hue for what the grid is about, and keep it the same wherever that same thing is drawn in a view. Blue is the first hue, then amber, teal, violet and rose.",
  ],
  skip: [
    "The exact numbers are the point. Use a Table.",
    "You compare a handful of amounts. Use a Bar chart, which puts the values on a scale the eye can measure.",
    "You need to show how a value moves in time, with a trend. Use a Line chart.",
    "The values go below zero, or two things share one grid. A heatmap has one hue and one direction: more or less.",
    "The grid has more than a few hundred columns. Aggregate first, because a dot per hour for a year is not a reading.",
  ],
  keyboard: [
    [["Tab"], "Moves into the grid as one stop, on the last dot of the first row, which is the one in view. Tab again leaves it."],
    [["ArrowRight", "ArrowLeft"], "Moves one dot along the row and shows its tooltip. It stops at the ends."],
    [["ArrowDown", "ArrowUp"], "Moves to the same column in the next or the previous row."],
    [["Home", "End"], "Goes to the first or the last dot of the row."],
    [["Ctrl+Home", "Ctrl+End"], "Goes to the first dot of the first row, or the last dot of the last row."],
    [["Esc"], "Hides the tooltip without moving focus. It returns when you move to another dot."],
  ],
  a11y: [
    "The grid is role=\"grid\" with rows and gridcells, named by `label` and described by a summary such as \"Deploys per day, 214 in all, most on Wed, week of 12 Oct with 31\". Pass `summary` to say something better.",
    "Each dot is named by its row, its column and its value (\"Wed, week of 12 Oct, 31 deploys\", or \"no data\"), so color is never the only signal. The tooltip repeats that name, so it is hidden from screen readers.",
    "The visible row labels and totals sit in their own columns and are hidden from screen readers. The same words are in each row as a hidden row header and a hidden cell, so the grid still reads row by row.",
    "One tab stop (a roving tabindex), arrow keys in two dimensions, and a 2px focus ring two pixels from the dot, drawn only for the keyboard. The ring uses the focus color, so it passes 3:1 in both themes.",
    "A 12px dot is far smaller than a finger, so one layer takes the pointer. When the grid fits, a finger scrubs across it and the dot under it shows its tooltip, which stays until the next touch elsewhere. When the grid scrolls, a drag scrolls it and a tap picks a dot. The lightest step is under 3:1 against a card, which is why the names and the tooltip carry every number.",
    "The caller must give the grid a `label` that says what the dots count, and `columns` that say what each column is. Without columns, dots are named by number.",
    "Under reduced motion the tooltip appears at once. Hover adds a ring and nothing moves.",
  ],
};

/* ----------------------------------------------------------------- data

   Deterministic: a seeded generator and fixed dates, so the same picture renders on the server, the client and
   in a screenshot. Dates are built in UTC and named by hand, never by the locale. */

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTH_NAMES = ["August", "September", "October"];
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DAY = 86_400_000;
/** The studio's "today": Saturday 17 October 2026. Anything after it has no data yet. */
const TODAY = Date.UTC(2026, 9, 17);

/** A small seeded random generator (mulberry32): the same numbers every time. */
function seeded(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Page views per day on litt.design: weekdays about twice the weekend, now and then a post that travels. */
function usageRow(label: string, month: number, days: number, seed: number): HeatmapRow {
  const next = seeded(seed);
  const values = Array.from({ length: 31 }, (_, i) => {
    const at = Date.UTC(2026, month, i + 1);
    const weekend = [0, 6].includes(new Date(at).getUTCDay());
    const base = weekend ? 430 : 960;
    const spike = next() < 0.07 ? 1.9 : 1;
    const v = Math.round(base * (0.62 + next() * 0.76) * spike);
    return i + 1 > days || at > TODAY ? null : v;
  });
  const total = values.reduce<number>((sum, v) => sum + (v ?? 0), 0);
  return { label, values, total: total.toLocaleString("en-GB") };
}

const USAGE_ROWS = [usageRow(MONTH_NAMES[0]!, 7, 31, 11), usageRow(MONTH_NAMES[1]!, 8, 30, 23), usageRow(MONTH_NAMES[2]!, 9, 31, 37)];
const USAGE_DAYS = Array.from({ length: 31 }, (_, i) => `day ${i + 1}`);

/** The Monday of each of the last 53 weeks, oldest first, in UTC. */
const WEEK_STARTS = Array.from({ length: 53 }, (_, c) => {
  const monday = TODAY - ((new Date(TODAY).getUTCDay() + 6) % 7) * DAY;
  return monday - (52 - c) * 7 * DAY;
});
const WEEK_NAMES = WEEK_STARTS.map((t) => `week of ${new Date(t).getUTCDate()} ${MONTHS[new Date(t).getUTCMonth()]}`);
/** A month name over the first week that starts in that month. */
const MONTH_TICKS = WEEK_STARTS.flatMap((t, c) => {
  const month = new Date(t).getUTCMonth();
  const before = c > 0 ? new Date(WEEK_STARTS[c - 1]!).getUTCMonth() : -1;
  return month === before ? [] : [{ index: c, label: MONTHS[month]! }];
});

/** Deploys across a year of a small studio: busy weekdays, quiet weekends, a slow late December and a slow August. */
const DEPLOY_ROWS: HeatmapRow[] = (() => {
  const next = seeded(2026);
  const rows: (number | null)[][] = WEEKDAYS.map(() => []);
  WEEK_STARTS.forEach((monday, c) => {
    const month = new Date(monday).getUTCMonth();
    const date = new Date(monday).getUTCDate();
    const quiet = (month === 11 && date > 20) || (month === 0 && date < 4) ? 0.15 : month === 7 ? 0.55 : 1;
    const launch = 1 + 0.9 * Math.max(0, Math.sin(c / 4.1)) ** 2;
    WEEKDAYS.forEach((_, r) => {
      const at = monday + r * DAY;
      const weekend = r >= 5;
      const draw = next();
      const base = weekend ? 1.1 : 6.2;
      const v = draw < (weekend ? 0.7 : 0.1) ? 0 : Math.round(base * quiet * launch * (0.3 + next() * 1.4));
      rows[r]!.push(at > TODAY ? null : v);
    });
  });
  return WEEKDAYS.map((label, r) => ({ label, values: rows[r]! }));
})();

/** Mail received by hour of the week: a working-day shape on weekdays, a fraction of it on the weekend. */
const MAIL_ROWS: HeatmapRow[] = (() => {
  const next = seeded(7);
  const shape = [1, 0, 0, 0, 0, 1, 3, 8, 18, 34, 41, 38, 26, 31, 40, 37, 29, 22, 12, 8, 6, 4, 3, 2];
  return WEEKDAYS.map((label, r) => ({
    label,
    values: shape.map((v) => Math.round(v * (r >= 5 ? 0.24 : 1) * (0.7 + next() * 0.6))),
  }));
})();
const HOURS = Array.from({ length: 24 }, (_, h) => `${String(h).padStart(2, "0")}:00`);
const HOUR_TICKS = [0, 6, 12, 18].map((h) => ({ index: h, label: HOURS[h]! }));

/* ----------------------------------------------------------------- demos */

function UsageDemo() {
  return (
    <Heatmap
      label="Page views per day, August to October"
      rows={USAGE_ROWS}
      columns={USAGE_DAYS}
      hue="teal"
      cell={12}
      unit={["view", "views"]}
    />
  );
}

function DeploysDemo() {
  return (
    <Heatmap
      label="Deploys per day, last 53 weeks"
      rows={DEPLOY_ROWS}
      columns={WEEK_NAMES}
      columnTicks={MONTH_TICKS}
      hue="blue"
      unit={["deploy", "deploys"]}
    />
  );
}

function MailDemo() {
  return (
    <Heatmap
      label="Mail received by hour of the week"
      rows={MAIL_ROWS}
      columns={HOURS}
      columnTicks={HOUR_TICKS}
      hue="violet"
      unit={["email", "emails"]}
    />
  );
}

export default function HeatmapPage() {
  return (
    <Page meta={meta} docs={docs}>
      <Stage
        title="Usage by month"
        tier="responsive"
        code="UsageDemo"
        caption="One row of dots per month, with the month's total at the end in mono. The dots are teal in four steps over an empty dot, and the days still to come draw nothing. Hover a dot, or arrow to it, and a ring and a tooltip name the day and the count. The tooltip is the Chart's, and it fades in on the responsive tier."
      >
        <UsageDemo />
      </Stage>

      <Stage
        title="A year of deploys"
        tier="instant"
        code="DeploysDemo"
        caption="Seven weekday rows by fifty-three weeks, with the month names over the columns they start in. The dots keep their size, so on a narrow screen the grid scrolls sideways inside its own box and starts at the latest week, while the weekday labels stay put. Only every second weekday is written when rows are this close, and a screen reader hears all seven. Arrow keys move in two dimensions, and Ctrl with Home or End jumps to the corners."
      >
        <DeploysDemo />
      </Stage>

      <Stage
        title="Hours of the week"
        tier="instant"
        code="MailDemo"
        caption="Mail received by hour, in violet. The scale is the quartiles of the non-zero hours, so the busiest quarter of the week is full color wherever it falls. On a touch screen the dot under your finger shows its tooltip, which stays until you touch elsewhere. When the grid fits, a finger scrubs across it. When it scrolls, as it does on a phone, a drag scrolls it and a tap picks a dot."
      >
        <MailDemo />
      </Stage>
    </Page>
  );
}

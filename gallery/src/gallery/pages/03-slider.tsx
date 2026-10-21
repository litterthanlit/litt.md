import { useState } from "react";
import { Button } from "@/components/button";
import { Dialog, DialogClose, DialogContent, DialogTrigger } from "@/components/dialog";
import { SettingsIcon } from "@/components/icons";
import { RangeSlider, Slider } from "@/components/slider";
import { Table, TableBody, TableCell, TableEmpty, TableHead, TableHeader, TableRow } from "@/components/table";
import { DeviceProvider } from "@/motion";
import { Page, Stage, TryIt, type PageDocs, type PageMeta } from "../kit";

export const meta: PageMeta = {
  id: "slider",
  title: "Slider",
  lede: "One value, or a span, on a range.",
  order: 3.6,
  group: "Controls",
  verbs: ["drag"],
  summary:
    "One value on a range, such as the default animation speed, or a span with two thumbs, such as the builds that took between 20s and 80s. A thin rail, a range filled with the foreground color (never the accent) and round thumbs. The thumbs and the range follow the pointer and the keys at once, with no easing. Only colors fade, on the instant tier.",
  tiers: ["instant"],
};

export const docs: PageDocs = {
  components: ["slider"],
  exports: ["Slider", "RangeSlider"],
  usage: `import { Slider, RangeSlider } from "@/components/slider";

<Slider
  label="Animation speed"
  help="How fast page transitions run on litt.design."
  min={0.5}
  max={2}
  step={0.1}
  defaultValue={1}
  minLabel="Slower"
  maxLabel="Faster"
  showValue
  formatValue={(v) => \`\${v.toFixed(1)}x\`}
  onValueCommit={(v) => saveSpeed(v)}
/>

// In a form, pass a name. The number is sent as text, like a native field.
<Slider name="quality" label="Image quality" min={60} max={100} step={5} defaultValue={85} showValue formatValue={(v) => \`\${v}%\`} />

// Two thumbs for a span. The value is [from, to], and the thumbs never cross.
// Filter on every move in onValueChange. Announce and save in onValueCommit.
<RangeSlider
  label="Build time"
  min={0}
  max={120}
  defaultValue={[20, 80]}
  minLabel="Faster"
  maxLabel="Slower"
  showValue
  formatValue={(v) => \`\${v}s\`}
  onValueChange={([from, to]) => setWindow({ from, to })}
  onValueCommit={([from, to]) => announce(countBuilds(from, to))}
/>

// In a form, both values are sent under the one name: formData.getAll("price") is ["40", "160"].
<RangeSlider name="price" label="Price" min={0} max={300} step={10} defaultValue={[40, 160]} showValue formatValue={(v) => \`€\${v}\`} />`,
  use: [
    "A value on a range, where the position matters more than the exact number: animation speed, image quality, a volume. A span with two ends, such as the builds that took between 20s and 80s or a price window, is a RangeSlider.",
    "Say which way is which. Pass minLabel and maxLabel (\"Slower\", \"Faster\") so nobody has to guess.",
    "Show the value with showValue when people want to compare settings, and give it units with formatValue. A range reads \"20s to 80s\".",
    "A setting that saves when the thumb is let go. Save in onValueCommit, not in onValueChange, which fires on every move. A table filter can follow every move, and say how many rows match on commit.",
    "A form field. Pass name and the value is sent with the form, and a range sends both values under the one name. A disabled slider sends nothing.",
  ],
  skip: [
    "The exact number matters, such as a width of 1280. Use Input.",
    "A few named steps, such as Small, Medium and Large. Use Segmented.",
    "A yes or no. Use Checkbox.",
    "A span with two ends, such as a price or a build time filter. Slider has one thumb. Use RangeSlider.",
    "The two ends are exact numbers people know and type, such as an invoice from 1,200 to 1,800 euros. Use two Inputs.",
    "The value is a date, a color or a position on a canvas. Build the control for that thing.",
  ],
  keyboard: [
    [["Tab"], "Moves focus to the thumb. A range has two, the from thumb first and then the to thumb. A disabled slider is skipped."],
    [["←", "↓"], "Moves the thumb back one step. On a range it moves the focused thumb only, and the to thumb stops one gap away from the from thumb."],
    [["→", "↑"], "Moves the thumb forward one step. On a range the from thumb stops one gap away from the to thumb."],
    [["Page Down", "Page Up"], "Moves the thumb about a tenth of the range, in whole steps and at least one."],
    [["Home", "End"], "Moves the thumb to the start or the end of the rail. On a range the focused thumb goes as far as it can, and the other thumb stops it."],
  ],
  a11y: [
    "Radix Slider puts role=\"slider\" on the thumb, with aria-valuemin, aria-valuemax and aria-valuenow. The label names the thumb with aria-labelledby, and the help text is linked with aria-describedby. The label is required.",
    "formatValue feeds aria-valuetext, so a screen reader says \"1.4x\" and not \"1.4\". Without it, the number is read as it is.",
    "The shown value is hidden from screen readers, because the thumb already says it. The words under the ends are plain text and are not part of the name, so give the label enough context on its own.",
    "The thumb is 20px, but the hit area is 44px tall on touch screens. Tapping the rail anywhere moves the thumb there. The visible rail stays 4px.",
    "The position of the thumb shows the value, not color. The focus ring is a 2px outline at a 2px offset, drawn on the thumb for keyboard focus only. A click or a tap does not show it.",
    "A drag on a slider never moves a sheet: the slider is marked data-no-drag. A vertical swipe that starts on it still scrolls the page or the sheet's body. If it starts on the rail and not on the thumb, the thumb first jumps to the finger, as a tap there would.",
    "Under forced colors the rail and the thumb get real borders, and the range takes the system highlight color.",
    "A disabled slider is muted, skipped by Tab, marked aria-disabled and left out of a form. Say why it is locked in the help text.",
    "RangeSlider puts role=\"slider\" on both thumbs, inside a group named by the label. Each thumb is named by the label and its end (\"Build time, from\" and \"Build time, to\") through a hidden name, and gets its own aria-valuetext from formatValue (\"20s\", then \"80s\"). Both are described by the help text. Pass thumbLabels to change the two end words.",
    "The shown span (\"20s to 80s\") is hidden from screen readers like the Slider's value, because each thumb already says its own. If the range filters something, say what it did in a polite live region and update it in onValueCommit, not on every move, so a screen reader hears one answer per key press or per released drag.",
    "The keys act on the focused thumb. The thumbs never cross and stay minStepsBetweenThumbs steps apart (one by default), so one can never sit on the other. A key that cannot move a thumb does nothing and saves nothing. Both thumbs report the whole rail as aria-valuemin and aria-valuemax.",
  ],
};

const formatSpeed = (v: number) => `${v.toFixed(1)}x`;
const formatQuality = (v: number) => `${v}%`;
const formatSeconds = (v: number) => `${v}s`;
const formatPrice = (v: number) => `€${v}`;

function SpeedDemo() {
  const [speed, setSpeed] = useState(1);
  const [saved, setSaved] = useState<string | null>(null);
  return (
    <div className="grid w-full max-w-sm gap-4">
      <Slider
        label="Animation speed"
        help="How fast page transitions and hover effects run on litt.design."
        min={0.5}
        max={2}
        step={0.1}
        value={speed}
        onValueChange={setSpeed}
        onValueCommit={(v) => setSaved(`Saved ${formatSpeed(v)} for litt.design.`)}
        minLabel="Slower"
        maxLabel="Faster"
        showValue
        formatValue={formatSpeed}
      />
      <div className="flex flex-wrap items-center gap-4">
        <Button
          size="sm"
          disabled={speed === 1}
          onClick={() => {
            setSpeed(1);
            setSaved(`Saved ${formatSpeed(1)} for litt.design.`);
          }}
        >
          Reset to 1.0x
        </Button>
        <p role="status" className="min-h-5 text-small text-fg-subtle">
          {saved}
        </p>
      </div>
    </div>
  );
}

function QualityDemo() {
  const [status, setStatus] = useState<string | null>(null);
  return (
    <form
      className="grid w-full max-w-sm gap-6"
      onSubmit={(e) => {
        e.preventDefault();
        const quality = new FormData(e.currentTarget).get("quality");
        setStatus(`Exporting 24 images from atelier-nord.com. The form sent quality=${quality}.`);
      }}
    >
      <Slider
        name="quality"
        label="Image quality"
        help="Lower quality makes the exported site load faster."
        min={60}
        max={100}
        step={5}
        defaultValue={85}
        minLabel="Smaller files"
        maxLabel="Sharper images"
        showValue
        formatValue={formatQuality}
      />
      <div className="grid gap-3">
        <Button type="submit" className="justify-self-start">
          Export 24 images
        </Button>
        <p role="status" className="min-h-10 text-small text-fg-subtle">
          {status}
        </p>
      </div>
    </form>
  );
}

type Build = { id: string; site: string; at: string; seconds: number };

/** The studio's recent Framer builds, newest first. With a span of 20s to 80s, 14 of the 24 match. */
const BUILDS: Build[] = [
  { id: "b24", site: "Halo", at: "2026-10-16", seconds: 79 },
  { id: "b23", site: "Northwind", at: "2026-10-16", seconds: 34 },
  { id: "b22", site: "Atlas portfolio", at: "2026-10-15", seconds: 112 },
  { id: "b21", site: "Marlow Labs", at: "2026-10-15", seconds: 66 },
  { id: "b20", site: "Halden Gallery", at: "2026-10-14", seconds: 15 },
  { id: "b19", site: "Kassa", at: "2026-10-14", seconds: 44 },
  { id: "b18", site: "Halo", at: "2026-10-13", seconds: 88 },
  { id: "b17", site: "Grotta Type", at: "2026-10-13", seconds: 31 },
  { id: "b16", site: "Northwind", at: "2026-10-10", seconds: 19 },
  { id: "b15", site: "Atlas portfolio", at: "2026-10-10", seconds: 105 },
  { id: "b14", site: "Marlow Labs", at: "2026-10-09", seconds: 58 },
  { id: "b13", site: "Halden Gallery", at: "2026-10-09", seconds: 22 },
  { id: "b12", site: "Kassa", at: "2026-10-08", seconds: 84 },
  { id: "b11", site: "Halo", at: "2026-10-07", seconds: 46 },
  { id: "b10", site: "Grotta Type", at: "2026-10-07", seconds: 9 },
  { id: "b9", site: "Northwind", at: "2026-10-06", seconds: 38 },
  { id: "b8", site: "Marlow Labs", at: "2026-10-06", seconds: 71 },
  { id: "b7", site: "Atlas portfolio", at: "2026-10-03", seconds: 27 },
  { id: "b6", site: "Halden Gallery", at: "2026-10-03", seconds: 96 },
  { id: "b5", site: "Kassa", at: "2026-10-02", seconds: 63 },
  { id: "b4", site: "Halo", at: "2026-10-02", seconds: 12 },
  { id: "b3", site: "Grotta Type", at: "2026-10-01", seconds: 52 },
  { id: "b2", site: "Marlow Labs", at: "2026-10-01", seconds: 41 },
  { id: "b1", site: "Northwind", at: "2026-09-30", seconds: 18 },
];

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
/** "2026-10-16" becomes "16 Oct": always six characters, so mono dates align. */
function shortDate(iso: string) {
  const [, month, day] = iso.split("-");
  return `${day} ${MONTHS[Number(month) - 1]}`;
}

/** The table lists this many of the matches, so it keeps its height while the span moves. */
const LISTED = 6;

function matchText(count: number) {
  if (count === 0) return "No builds match";
  return count === 1 ? "1 build matches" : `${count} builds match`;
}

function BuildsDemo() {
  const [span, setSpan] = useState<[number, number]>([20, 80]);
  /* A polite note for screen readers. It changes when a key moves a thumb or a drag ends, never on every pixel of a drag. */
  const [said, setSaid] = useState("");
  const [from, to] = span;
  const matches = BUILDS.filter((b) => b.seconds >= from && b.seconds <= to);

  return (
    <div className="grid w-full min-w-0 max-w-xl grid-cols-1 gap-8">
      <RangeSlider
        label="Build time"
        min={0}
        max={120}
        value={span}
        onValueChange={setSpan}
        onValueCommit={([a, b]) => setSaid(matchText(BUILDS.filter((x) => x.seconds >= a && x.seconds <= b).length))}
        minLabel="Faster"
        maxLabel="Slower"
        showValue
        formatValue={formatSeconds}
      />
      <div className="grid min-w-0 grid-cols-1 content-start gap-4">
        <p aria-hidden="true" className="flex flex-wrap items-baseline justify-between gap-x-4 text-small">
          <span className="tabular-nums text-fg">{matchText(matches.length)}</span>
          {matches.length > LISTED && <span className="text-caption font-normal text-fg-subtle">The {LISTED} newest are listed</span>}
        </p>
        <p role="status" className="sr-only">
          {said}
        </p>
        <div className="min-h-80 min-w-0">
          <Table label="Builds in the span">
            <TableHeader>
              <TableRow>
                <TableHead>Site</TableHead>
                <TableHead numeric>Deployed</TableHead>
                <TableHead numeric>Build time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {matches.slice(0, LISTED).map((b) => (
                <TableRow key={b.id}>
                  <TableCell primary>{b.site}</TableCell>
                  <TableCell numeric>
                    <time dateTime={b.at}>{shortDate(b.at)}</time>
                  </TableCell>
                  <TableCell numeric>{formatSeconds(b.seconds)}</TableCell>
                </TableRow>
              ))}
              {matches.length === 0 && (
                <TableEmpty columns={3}>
                  No builds between {formatSeconds(from)} and {formatSeconds(to)}.
                </TableEmpty>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

function PriceDemo() {
  const [status, setStatus] = useState<string | null>(null);
  return (
    <form
      className="grid w-full max-w-sm gap-6"
      onSubmit={(e) => {
        e.preventDefault();
        const [from, to] = new FormData(e.currentTarget).getAll("price");
        setStatus(`Showing Framer templates from ${formatPrice(Number(from))} to ${formatPrice(Number(to))}. The form sent price=${from} and price=${to}.`);
      }}
    >
      <RangeSlider
        name="price"
        label="Price"
        help="The two ends stay at least €20 apart."
        min={0}
        max={300}
        step={10}
        minStepsBetweenThumbs={2}
        defaultValue={[40, 160]}
        minLabel="Cheaper"
        maxLabel="Pricier"
        showValue
        formatValue={formatPrice}
      />
      <div className="grid gap-3">
        <Button type="submit" className="justify-self-start">
          Show templates
        </Button>
        <p role="status" className="min-h-15 text-small text-fg-subtle">
          {status}
        </p>
      </div>
    </form>
  );
}

function DisabledDemo() {
  return (
    <div className="grid w-full max-w-xl gap-x-12 gap-y-8 sm:grid-cols-2">
      <Slider label="Image quality" min={60} max={100} step={5} defaultValue={70} showValue formatValue={formatQuality} help="Applies to the next export." />
      <Slider
        label="Image quality"
        min={60}
        max={100}
        step={5}
        defaultValue={80}
        showValue
        formatValue={formatQuality}
        disabled
        help="Locked while the export runs."
      />
      <RangeSlider label="Build time" min={0} max={120} defaultValue={[20, 80]} showValue formatValue={formatSeconds} help="Filters the build list." />
      <RangeSlider
        label="Build time"
        min={0}
        max={120}
        defaultValue={[20, 80]}
        showValue
        formatValue={formatSeconds}
        disabled
        help="Locked while the list loads."
      />
    </div>
  );
}

function MotionSheetDemo() {
  const [open, setOpen] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [quality, setQuality] = useState(85);
  const [status, setStatus] = useState<string | null>(null);

  return (
    <div className="grid justify-items-center gap-4">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button icon={<SettingsIcon />}>Motion settings</Button>
        </DialogTrigger>
        <DialogContent
          title="Motion settings"
          description="Applies to every page in Halden Studio."
          footer={
            <>
              <DialogClose asChild>
                <Button>Cancel</Button>
              </DialogClose>
              <Button
                variant="primary"
                onClick={() => {
                  setOpen(false);
                  setStatus(`Saved ${formatSpeed(speed)} and ${formatQuality(quality)} for Halden Studio.`);
                }}
              >
                Save changes
              </Button>
            </>
          }
        >
          <div className="grid gap-6">
            <Slider
              label="Animation speed"
              min={0.5}
              max={2}
              step={0.1}
              value={speed}
              onValueChange={setSpeed}
              minLabel="Slower"
              maxLabel="Faster"
              showValue
              formatValue={formatSpeed}
            />
            <Slider
              label="Image quality"
              min={60}
              max={100}
              step={5}
              value={quality}
              onValueChange={setQuality}
              minLabel="Smaller files"
              maxLabel="Sharper images"
              showValue
              formatValue={formatQuality}
            />
          </div>
        </DialogContent>
      </Dialog>
      <p role="status" className="min-h-5 text-small text-fg-subtle">
        {status}
      </p>
    </div>
  );
}

/** The same sheet, forced to the phone path so a desktop can preview it. A real phone needs no wrapper. */
function PhoneDemo() {
  return (
    <DeviceProvider mode="phone">
      <MotionSheetDemo />
    </DeviceProvider>
  );
}

export default function SliderPage() {
  return (
    <Page meta={meta} docs={docs}>
      <Stage
        title="Animation speed"
        tier="instant"
        code="SpeedDemo"
        caption="Drag the thumb, click the rail, or use the arrow keys. The thumb and the range follow at once, with no easing, because an eased jump would lag the key. The value reads 1.0x, and a screen reader says the same. The save note appears on release, from onValueCommit. Only colors fade, on the instant tier."
      >
        <SpeedDemo />
      </Stage>

      <Stage
        title="In a form"
        tier="instant"
        code="QualityDemo"
        caption="The slider steps in fives, snaps as you drag, and sends its name and value with the form, like a native field. Press Export to see what was sent."
      >
        <QualityDemo />
      </Stage>

      <Stage
        title="Builds by time"
        tier="instant"
        size="lg"
        code="BuildsDemo"
        caption="Two thumbs on one rail, and the span between them is the foreground color. Drag either thumb, or focus one and use the arrow keys. The count and the table follow at once, with no easing. The thumbs never cross and stay one step apart. The value reads 20s to 80s, in words, and each thumb tells a screen reader its own value. A screen reader hears how many builds match once per key press or released drag, not on every move."
      >
        <BuildsDemo />
      </Stage>

      <Stage
        title="A price in a form"
        tier="instant"
        code="PriceDemo"
        caption="In a form, both thumbs send their value under one name, so the form holds price twice, from first. This one stays two steps apart, and the help text says so. Press Show templates to see what was sent."
      >
        <PriceDemo />
      </Stage>

      <Stage
        title="Disabled"
        tier="instant"
        code="DisabledDemo"
        caption="The disabled slider is muted all the way through: a fainter rail, a muted range and a flat thumb. A range does the same with both thumbs. Tab skips it, and the help text says why it is locked."
      >
        <DisabledDemo />
      </Stage>

      <Stage
        title="In a phone sheet"
        tier="instant"
        code="PhoneDemo"
        size="lg"
        caption="Open the sheet and drag a thumb sideways: only the thumb moves. A drag that starts on a slider never moves the sheet, and a vertical swipe on it still scrolls the sheet's body. On a phone the hit area is 44px tall, while the rail stays thin."
      >
        <PhoneDemo />
      </Stage>

      <TryIt of="Slider" component={Slider} props={{ label: "Animation speed", defaultValue: 40, minLabel: "Slower", maxLabel: "Faster" }} />
    </Page>
  );
}

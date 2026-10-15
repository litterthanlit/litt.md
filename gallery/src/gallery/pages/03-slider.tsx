import { useState } from "react";
import { Button } from "@/components/button";
import { Dialog, DialogClose, DialogContent, DialogTrigger } from "@/components/dialog";
import { SettingsIcon } from "@/components/icons";
import { Slider } from "@/components/slider";
import { DeviceProvider } from "@/motion";
import { Page, Stage, type PageDocs, type PageMeta } from "../kit";

export const meta: PageMeta = {
  id: "slider",
  title: "Slider",
  order: 3.6,
  group: "Controls",
  summary:
    "One value on a range, such as the default animation speed. A thin rail, a range filled with the foreground color (never the accent) and a round thumb. The thumb and the range follow the pointer and the keys at once, with no easing. Only colors fade, on the instant tier.",
  tiers: ["instant"],
};

export const docs: PageDocs = {
  components: ["slider"],
  exports: ["Slider"],
  usage: `import { Slider } from "@/components/slider";

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
<Slider name="quality" label="Image quality" min={60} max={100} step={5} defaultValue={85} showValue formatValue={(v) => \`\${v}%\`} />`,
  use: [
    "A value on a range, where the position matters more than the exact number: animation speed, image quality, a volume.",
    "Say which way is which. Pass minLabel and maxLabel (\"Slower\", \"Faster\") so nobody has to guess.",
    "Show the value with showValue when people want to compare settings, and give it units with formatValue.",
    "A setting that saves when the thumb is let go. Save in onValueCommit, not in onValueChange, which fires on every move.",
    "A form field. Pass name and the value is sent with the form. A disabled slider sends nothing.",
  ],
  skip: [
    "The exact number matters, such as a width of 1280. Use Input.",
    "A few named steps, such as Small, Medium and Large. Use Segmented.",
    "A yes or no. Use Checkbox.",
    "A range with two ends, such as a price filter. Slider has one thumb.",
    "The value is a date, a color or a position on a canvas. Build the control for that thing.",
  ],
  keyboard: [
    [["Tab"], "Moves focus to the thumb. A disabled slider is skipped."],
    [["←", "↓"], "Moves the thumb back one step."],
    [["→", "↑"], "Moves the thumb forward one step."],
    [["Page Down", "Page Up"], "Moves the thumb about a tenth of the range, in whole steps and at least one."],
    [["Home", "End"], "Moves the thumb to the start or the end of the rail."],
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
  ],
};

const formatSpeed = (v: number) => `${v.toFixed(1)}x`;
const formatQuality = (v: number) => `${v}%`;

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
        title="Disabled"
        tier="instant"
        code="DisabledDemo"
        caption="The disabled slider is muted all the way through: a fainter rail, a muted range and a flat thumb. Tab skips it, and the help text says why it is locked."
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
    </Page>
  );
}

/**
 * Flat's candidate looks on the canvas (proposals/flat-colour.md): six frames that show the same three things, so they
 * compare like for like. Controls; data (a StatGroup over a LineChart and a short Table, as the Dashboard block arranges
 * them); and a picture and words (the top of the Case study block, with a long exposure in place of the grey hero
 * plate). Each frame's root is a data-material="flat" element that sets its look as custom properties
 * (flat-look-data.ts), so every litt part inside reads it. An overlay a part opens (the select's list) is drawn
 * outside the frame and keeps the page's look.
 *
 * Three things here are not tokens a part reads, and the proposal names each: the chosen segment's tint and the
 * tinted status pill are scoped custom properties on a wrapper around the one part, and the sheets are the canvas's
 * own boxes reading --paper-lift. Flat's control bodies draw no token-driven shadow at rest, so paper controls stand on
 * their fill alone.
 */
import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { Breadcrumb } from "@/components/breadcrumb";
import { Button } from "@/components/button";
import { LineChart } from "@/components/chart";
import { Checkbox, CheckboxGroup } from "@/components/checkbox";
import { TextField } from "@/components/input";
import { Segmented } from "@/components/segmented";
import { SelectField } from "@/components/select";
import { Slider } from "@/components/slider";
import { Sparkline } from "@/components/sparkline";
import { Stat, StatGroup } from "@/components/stat";
import { Switch } from "@/components/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/table";
import { Tag, type TagStatus } from "@/components/tag";
import { MaterialProvider } from "@/motion";
import { HUE_NAMES, HUES, LENT, lookProps, type AccentSet, type HueId, type Look } from "./flat-look-data";
import { StreakField } from "./streaks";
import { paletteById } from "./streaks-palettes";

/** Whether the page is dark now: the gallery's choice on <html>, or the system's when it is left to the system. */
export function useDark() {
  const read = () => {
    const t = document.documentElement.getAttribute("data-theme");
    return t ? t === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
  };
  const [dark, setDark] = useState(read);
  useEffect(() => {
    const update = () => setDark(read());
    const watch = new MutationObserver(update);
    watch.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    const media = matchMedia("(prefers-color-scheme: dark)");
    media.addEventListener("change", update);
    return () => {
      watch.disconnect();
      media.removeEventListener("change", update);
    };
  }, []);
  return dark;
}

/* ---------------------------------------------------------------- the pieces inside a frame */

/** A sheet: a working surface. Today a white surface and a hairline; on paper, white a hair off the ground. */
function Sheet({ label, ground = false, children }: { label: string; ground?: boolean; children: ReactNode }) {
  /* On paper the controls stand on the ground themselves, as white paper: in a white sheet they would vanish. */
  return (
    <section
      aria-label={label}
      data-sheet={ground ? "ground" : "paper"}
      className={"grid content-start gap-6 rounded-surface p-6 " + (ground ? "" : "bg-surface-1")}
      style={ground ? undefined : { boxShadow: "var(--paper-lift)" }}
    >
      {children}
    </section>
  );
}

/* A status pill tinted with its own status colour, mixed into paper as the data tints are (R7's tint, a status here). */
const tinted = (status: TagStatus): CSSProperties =>
  status === "neutral" ? {} : ({ "--surface-3": `color-mix(in oklab, var(--${status}) var(--tint-strength), var(--surface-1))` } as CSSProperties);

function Status({ status, colour, children }: { status: TagStatus; colour: boolean; children: ReactNode }) {
  return (
    <span data-status={status} className="contents" style={colour ? tinted(status) : undefined}>
      <Tag status={status}>{children}</Tag>
    </span>
  );
}

/* The chosen segment as a pale tint of the accent with its word in the accent's text tone. */
const CHOSEN = { "--block": "var(--accent-tint)", "--fg": "var(--accent-text)" } as CSSProperties;

const REGIONS = [
  { value: "fra", label: "Frankfurt" },
  { value: "iad", label: "Washington" },
  { value: "sin", label: "Singapore" },
];

function Controls({ look }: { look: Look }) {
  const [view, setView] = useState<"list" | "board" | "calendar">("board");
  const accent = look.accent !== "ink";
  return (
    <Sheet label="Controls" ground={look.paper}>
      <div className="grid grid-cols-2 items-start gap-8">
        <div className="grid content-start justify-items-start gap-6">
          <div data-part="segmented" style={accent ? CHOSEN : undefined}>
            <Segmented legend="View" value={view} onValueChange={setView} options={[{ value: "list", label: "List" }, { value: "board", label: "Board" }, { value: "calendar", label: "Calendar" }]} />
          </div>
          <div data-part="switch" className="w-full">
            <Switch align="end" label="Publish on every push" defaultChecked tone={accent ? "accent" : undefined} />
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="primary" data-part="primary">
              Publish
            </Button>
            <Button>Preview</Button>
          </div>
          <p className="text-small text-fg-muted">
            Read the{" "}
            <a data-part="link" href="#canvas" className="text-accent-text underline underline-offset-2">
              release notes
            </a>{" "}
            before you publish.
          </p>
          <div className="flex flex-wrap gap-2">
            <Status status="success" colour={look.dataColour}>
              Done
            </Status>
            <Status status="danger" colour={look.dataColour}>
              Failed
            </Status>
            <Status status="warning" colour={look.dataColour}>
              Waiting
            </Status>
          </div>
        </div>
        <div className="grid content-start gap-6">
          <div data-part="field">
            <TextField label="Project name" defaultValue="Atelier Nord" />
          </div>
          <SelectField label="Region" options={REGIONS} defaultValue="fra" />
          <CheckboxGroup legend="Include in the export">
            <Checkbox label="Source files" defaultChecked />
            <Checkbox label="Fonts" />
            <Checkbox label="Analytics history" />
          </CheckboxGroup>
          <Slider label="Rollout" min={0} max={100} step={5} defaultValue={40} formatValue={(v) => `${v}%`} minLabel="None" maxLabel="Everyone" />
        </div>
      </div>
    </Sheet>
  );
}

const DAYS = ["3 Oct", "4 Oct", "5 Oct", "6 Oct", "7 Oct", "8 Oct", "9 Oct", "10 Oct", "11 Oct", "12 Oct", "13 Oct", "14 Oct", "15 Oct", "16 Oct"];
const BUILD = [47, 46, 48, 45, 46, 44, 45, 43, 44, 42, 43, 40, 42, 41];
const DEPLOYS = [
  { project: "Halo site", branch: "main", status: "success" as const, word: "Ready", time: "2 min ago" },
  { project: "Northwind rebrand", branch: "redesign/nav", status: "warning" as const, word: "Building", time: "9 min ago" },
  { project: "Lumen docs", branch: "fix/search", status: "danger" as const, word: "Failed", time: "3 hours ago" },
];

function Data({ look }: { look: Look }) {
  const hue = look.dataColour ? ("blue" as const) : undefined;
  return (
    <Sheet label="Data">
      <StatGroup>
        <Stat label="Active projects" value={12} delta="Up 2 on last month" tone="good" />
        <Stat label="Deploys this week" value={38} delta="Up 12% on last week" tone="good" />
        <Stat label="Median build" value={41} unit="s" delta="Down 6 s on last week" tone="good" trend={<Sparkline label="Median build time, last 14 days" values={BUILD} hue={hue} formatValue={(v) => `${v} s`} />} />
        <Stat label="Uptime" value="99.98" unit="%" delta="Same as last month" />
      </StatGroup>
      <LineChart label="Median build time, last 14 days" labels={DAYS} series={[{ name: "Build time", values: BUILD, hue }]} formatValue={(v) => `${v} s`} height={180} entrance={false} />
      <Table label={`Recent deploys, ${look.name}`}>
        <TableHeader>
          <TableRow>
            <TableHead>Project</TableHead>
            <TableHead>Branch</TableHead>
            <TableHead>Status</TableHead>
            <TableHead numeric>Time</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {DEPLOYS.map((d) => (
            <TableRow key={d.project}>
              <TableCell primary>{d.project}</TableCell>
              <TableCell>{d.branch}</TableCell>
              <TableCell>
                <Status status={d.status} colour={look.dataColour}>
                  {d.word}
                </Status>
              </TableCell>
              <TableCell numeric>{d.time}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Sheet>
  );
}

const FACTS = [
  { label: "Client", value: "Ines Ortega" },
  { label: "Year", value: "2025" },
  { label: "Role", value: "Design and build" },
];

function Picture({ look, paletteId }: { look: Look; paletteId: string }) {
  const exposure = paletteById(paletteId);
  return (
    <Sheet label="A picture and words">
      <header className="grid gap-4">
        <Breadcrumb label={`Where this page is, ${look.name}`} items={[{ label: "Work", href: "#canvas" }, { label: "Atlas portfolio", href: "#canvas" }]} />
        <div className="flex flex-wrap items-baseline gap-x-2 text-h1 text-balance">
          <h3 className="text-fg">Atlas portfolio</h3>
          <p className="font-normal text-fg-muted">A photographer's work, on a grid that stays out of the way.</p>
        </div>
      </header>
      <div role="img" aria-label={`A long exposure in ${exposure.name}`} className="relative isolate w-full overflow-hidden rounded-surface" style={{ aspectRatio: "2.4" }}>
        <StreakField id={`flat-look-${look.id}`} palette={exposure.palette} paletteId={exposure.id} seed={exposure.seed} strength={1} />
      </div>
      <dl className="grid grid-cols-3 gap-x-8 gap-y-4">
        {FACTS.map((f) => (
          <div key={f.label} className="grid content-start gap-1">
            <dt className="text-caption text-fg-subtle">{f.label}</dt>
            <dd className="text-small text-fg">{f.value}</dd>
          </div>
        ))}
      </dl>
    </Sheet>
  );
}

/* ---------------------------------------------------------------- a frame */

function Choice<T extends string>({ label, picker, options, value, onChange }: { label: string; picker: string; options: { id: T; name: string }[]; value: T; onChange: (id: T) => void }) {
  return (
    <div role="group" aria-label={`${label}, ${picker === "accent" ? "an accent of its own" : "the picture lends its colour"}`} data-flat-look-picker={picker} className="flex flex-wrap items-center gap-2">
      <span className="text-caption text-fg-subtle">{label}</span>
      {options.map((o) => (
        <Button key={o.id} size="sm" variant={o.id === value ? "secondary" : "ghost"} aria-pressed={o.id === value} data-pick={o.id} onClick={() => onChange(o.id)}>
          {o.name}
        </Button>
      ))}
    </div>
  );
}

const PICTURE_PALETTES = LENT.map((l) => ({ id: l.id, name: paletteById(l.id).name }));
/** The hero's palette in every frame but the picture's, which picks its own: Yūyake, the one Flat's hero opens on. */
const HERO = "yuyake";

/**
 * One candidate look around the three samples. The name, the note and the pickers sit outside the candidate, in
 * today's look, so the six frames label themselves alike.
 */
export function FlatLookFrame({ look }: { look: Look }) {
  const dark = useDark();
  const [hue, setHue] = useState<HueId>("azure");
  const [palette, setPalette] = useState(LENT[0]!.id);
  const lent = LENT.find((l) => l.id === palette)!;
  const accent: AccentSet | null = look.accent === "hue" ? HUES[hue] : look.accent === "azure" ? HUES.azure : look.accent === "picture" ? lent.set : null;
  return (
    <div className="grid gap-4">
      <div className="grid gap-1">
        <span className="text-small font-title text-fg">{look.name}</span>
        <span className="max-w-(--measure) text-small text-fg-subtle">{look.note}</span>
      </div>
      {look.accent === "hue" && <Choice label="Hue" picker="accent" options={HUE_NAMES} value={hue} onChange={setHue} />}
      {look.accent === "picture" && (
        <div className="grid gap-1">
          <Choice label="Palette" picker="picture" options={PICTURE_PALETTES} value={palette} onChange={setPalette} />
          <span className="text-caption text-fg-subtle" data-fallback={lent.fallback ? "yes" : "no"}>
            {lent.fallback ?? "The accent is the picture's middle stop, as it is."}
          </span>
        </div>
      )}
      <MaterialProvider material="flat">
        <div
          data-material="flat"
          data-flat-look={look.id}
          data-hue={look.accent === "hue" ? hue : undefined}
          data-palette={look.accent === "picture" ? palette : undefined}
          style={lookProps(look, dark, accent)}
          className="grid gap-6 rounded-surface bg-canvas p-6 text-fg-muted"
        >
          <Controls look={look} />
          <Data look={look} />
          <Picture look={look} paletteId={look.accent === "picture" ? palette : HERO} />
        </div>
      </MaterialProvider>
    </div>
  );
}

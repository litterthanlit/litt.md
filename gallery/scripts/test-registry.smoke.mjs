/**
 * Helper for test-registry.mjs: the smoke page that is written into a host app, and the
 * Chromium checks that run against its production build.
 *
 * Nothing here knows how a registry lays out files. The page imports each litt component
 * from wherever the install put it, found by export name in the files `shadcn add` wrote.
 */
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { parseCss } from "./test-registry.css.mjs";

/* ------------------------------------------------------------------ host probes */

/** The same markup goes into the baseline page and the page after litt is installed. */
const HOST_PROBE = `
      <section data-testid="host-probe" className="grid gap-3">
        <h1>Host heading one</h1>
        <h2>Host heading two</h2>
        <p data-probe="paragraph">Host paragraph</p>
        <div className="flex flex-wrap items-center gap-3">
          <HostButton data-probe="host-button">Host button</HostButton>
          <HostButton variant="outline" data-probe="host-button-outline">Outline</HostButton>
          <HostButton variant="secondary" data-probe="host-button-secondary">Secondary</HostButton>
          <button type="button" data-probe="native-button">Native button</button>
          <a href="#probe" data-probe="link">Link</a>
          <input data-probe="input" defaultValue="Input" />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div data-probe="u-sm" className="rounded-md bg-accent p-2 text-sm font-medium text-foreground shadow-sm">sm</div>
          <div data-probe="u-base" className="rounded-lg border bg-card p-2 text-base text-card-foreground">base</div>
          <div data-probe="u-lg" className="rounded-xl bg-primary p-2 text-lg font-semibold text-primary-foreground shadow-md">lg</div>
          <div data-probe="u-full" className="rounded-full bg-muted p-2 text-xs font-bold text-muted-foreground">full</div>
          <div data-probe="u-sans" className="font-sans">sans</div>
          <div data-probe="u-mono" className="font-mono">mono</div>
        </div>
      </section>`;

/** A page with only the host's own components: measured once per template as the baseline. */
export function buildHostOnlyPage({ app }) {
  return `${app === "next" ? '"use client";\n' : ""}import { Button as HostButton } from "@/components/ui/button";

export default function Smoke() {
  return (
    <main className="grid gap-8 p-6" data-testid="smoke">${HOST_PROBE}
    </main>
  );
}
`;
}

/* ------------------------------------------------------------------ recipes */

/**
 * One recipe per component item, keyed by the item name (the gallery's file stem).
 *   needs   exports the install must provide; a missing one is a failure, not a skip
 *   types   type-only exports to import
 *   wrap    a provider component that must wrap the page
 *   state   lines for the top of the component
 *   top     module-level lines
 *   jsx     what to render. `@Btn` is litt's Button when the install wrote one, else a plain <button>,
 *           so a component's recipe never depends on the button item being installed
 * Props come from the gallery's pages and docs.json; the components are the same files.
 */
const RECIPES = {
  button: {
    needs: ["Button"],
    jsx: `<div className="flex flex-wrap items-center gap-3" data-testid="litt-buttons">
          <Button variant="primary" data-testid="litt-primary">Primary</Button>
          <Button data-testid="litt-secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
        </div>`,
  },
  kbd: { needs: ["Kbd"], jsx: `<Kbd>⌘K</Kbd>` },
  tag: { needs: ["Tag"], jsx: `<div className="flex flex-wrap items-center gap-2" data-testid="litt-tags"><Tag>Framer</Tag><Tag status="success">Live</Tag><Tag status="warning">In review</Tag><Tag status="danger">Failed</Tag><Tag status="neutral">Idea</Tag></div>` },
  states: { needs: ["Empty", "Skeleton", "Loading", "ErrorState"], jsx: `<div className="grid w-full max-w-md gap-4" data-testid="litt-states"><Empty title="No projects yet." action={<@Btn type="button">New project</@Btn>}>A new project starts as a draft and shows up here.</Empty><Loading label="Loading projects" className="grid gap-2"><Skeleton text="body" className="w-40" /><Skeleton className="h-10 w-full" /><Skeleton className="h-6 w-16" /></Loading><ErrorState title="The deploy to atelier-nord.com failed." action={<@Btn type="button">Retry deploy</@Btn>}>The build ran out of memory. Make the images smaller, then retry.</ErrorState></div>` },
  header: {
    needs: ["Header"],
    jsx: `<Header className="w-full" wordmark={<a href="#home" data-testid="header-wordmark">Litt Studio</a>} navLabel="Smoke site" navFrom="sm" links={[{ label: "Work", href: "#work", current: true }, { label: "Journal", href: "#journal" }]} actions={<@Btn type="button" data-testid="header-action">Start a project</@Btn>} />`,
  },
  card: {
    needs: ["Card", "CardCover", "CardBody", "CardTitle", "CardDescription", "CardLink"],
    jsx: `<div className="w-64" data-testid="litt-card-wrap">
          <Card cover="inset" data-testid="litt-card">
            <CardCover />
            <CardBody>
              <CardTitle><CardLink href="#litt-card">Halden Gallery</CardLink></CardTitle>
              <CardDescription>A linked card from the registry.</CardDescription>
            </CardBody>
          </Card>
        </div>`,
  },
  table: {
    needs: ["Table", "TableHeader", "TableBody", "TableRow", "TableHead", "TableCell"],
    jsx: `<div className="w-full max-w-md" data-testid="litt-table-wrap">
          <Table label="Deploy history" entrance>
            <TableHeader><TableRow><TableHead>Site</TableHead><TableHead numeric>Build time</TableHead></TableRow></TableHeader>
            <TableBody>
              <TableRow key="a"><TableCell primary>litt.design v3</TableCell><TableCell numeric>38 s</TableCell></TableRow>
              <TableRow key="b"><TableCell primary>Founder landing</TableCell><TableCell numeric>52 s</TableCell></TableRow>
            </TableBody>
          </Table>
        </div>`,
  },
  icons: { needs: ["SearchIcon", "SettingsIcon"], jsx: `<div className="flex gap-3"><SearchIcon /><SettingsIcon /></div>` },
  tooltip: {
    needs: ["Tooltip", "TooltipProvider"],
    wrap: "TooltipProvider",
    jsx: `<Tooltip content="Litt tooltip"><@Btn type="button" data-testid="tooltip-trigger">Hover me</@Btn></Tooltip>`,
  },
  tabs: {
    needs: ["Tabs", "TabsList", "TabsTrigger", "TabsPanels", "TabsPanel"],
    jsx: `<Tabs defaultValue="one" className="w-full max-w-md">
          <TabsList>
            <TabsTrigger value="one">One</TabsTrigger>
            <TabsTrigger value="two">Two</TabsTrigger>
          </TabsList>
          <TabsPanels>
            <TabsPanel value="one">Panel one</TabsPanel>
            <TabsPanel value="two">Panel two</TabsPanel>
          </TabsPanels>
        </Tabs>`,
  },
  menu: {
    needs: ["Menu", "MenuItem", "MenuSeparator"],
    jsx: `<Menu trigger={<@Btn type="button" data-testid="menu-trigger">Actions</@Btn>} label="Project actions">
          <MenuItem>Duplicate</MenuItem>
          <MenuItem>Rename</MenuItem>
          <MenuSeparator />
          <MenuItem destructive>Delete</MenuItem>
        </Menu>`,
  },
  "command-menu": {
    needs: ["CommandMenu"],
    state: [`const [cmdOpen, setCmdOpen] = useState(false);`],
    top: [
      `const cmdGroups = [{ id: "pages", heading: "Pages", items: [{ id: "home", label: "Home page" }, { id: "settings", label: "Settings page" }] }];`,
    ],
    jsx: `<>
          <@Btn type="button" data-testid="cmd-trigger" onClick={() => setCmdOpen(true)}>Search</@Btn>
          <CommandMenu open={cmdOpen} onOpenChange={setCmdOpen} groups={cmdGroups} onSelect={() => setCmdOpen(false)} />
        </>`,
  },
  dialog: {
    needs: ["Dialog", "DialogTrigger", "DialogContent"],
    jsx: `<Dialog>
          <DialogTrigger asChild><@Btn type="button" data-testid="dialog-trigger">Open dialog</@Btn></DialogTrigger>
          <DialogContent title="Litt dialog" description="Dialog description">
            <p>Dialog body</p>
          </DialogContent>
        </Dialog>`,
  },
  input: {
    needs: ["TextField", "Input", "Textarea"],
    jsx: `<div className="grid w-full max-w-sm gap-4" data-testid="litt-inputs">
          <TextField label="Project name" defaultValue="litt.design" help="Shown in the dashboard." data-testid="litt-textfield" />
          <TextField label="Work email" type="email" defaultValue="nina@" error="Enter a full address, like nina@halo.studio." />
          <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
            <Input size="lg" aria-label="Email" placeholder="you@studio.com" data-testid="litt-input-lg" />
            <@Btn type="submit">Send</@Btn>
          </div>
          <Textarea label="Project brief" rows={3} help="What you are building." />
        </div>`,
  },
  checkbox: {
    needs: ["Checkbox", "CheckboxGroup", "Radio", "RadioGroup"],
    state: [`const [target, setTarget] = useState("a");`],
    jsx: `<div className="grid w-full max-w-sm gap-4" data-testid="litt-choices">
          <CheckboxGroup legend="Deliverables" help="Pick what the client gets.">
            <Checkbox label="Source files" defaultChecked data-testid="litt-checkbox" />
            <Checkbox label="All pages" indeterminate />
            <Checkbox label="Native box" appearance="native" />
          </CheckboxGroup>
          <RadioGroup legend="Deploy to" value={target} onValueChange={setTarget}>
            <Radio value="a" label="Production" description="litt.design" />
            <Radio value="b" label="Preview" />
          </RadioGroup>
        </div>`,
  },
  segmented: {
    needs: ["Segmented"],
    state: [`const [seg, setSeg] = useState("a");`],
    jsx: `<Segmented legend="Visibility" showLegend value={seg} onValueChange={setSeg} options={[{ value: "a", label: "Public" }, { value: "b", label: "Private" }]} />`,
  },
  popover: {
    needs: ["Popover", "PopoverTrigger", "PopoverContent", "PopoverClose"],
    jsx: `<Popover>
          <PopoverTrigger asChild><@Btn type="button" data-testid="popover-trigger">Open popover</@Btn></PopoverTrigger>
          <PopoverContent label="Litt popover">
            <p>Popover body</p>
            <PopoverClose asChild><@Btn type="button" data-testid="popover-close">Close popover</@Btn></PopoverClose>
          </PopoverContent>
        </Popover>`,
  },
  toast: {
    needs: ["Toaster", "toast"],
    wrap: "Toaster",
    jsx: `<@Btn type="button" data-testid="toast-trigger" onClick={() => toast({ title: "Litt toast", description: "Saved from the smoke page" })}>Show toast</@Btn>`,
  },
  select: {
    needs: ["Select", "SelectField"],
    top: [`const ROLES = [{ value: "designer", label: "Designer" }, { value: "developer", label: "Developer" }, { value: "producer", label: "Producer" }];`],
    jsx: `<form className="grid w-full max-w-sm gap-4" data-testid="litt-select" aria-label="Select smoke">
          <SelectField label="Role" name="role" defaultValue="designer" options={ROLES} help="Sets what you see in the studio." />
          <Select size="sm" aria-label="Sort by" defaultValue="producer" options={ROLES} />
        </form>`,
  },
  form: {
    needs: ["FormSection", "Fieldset", "ErrorSummary", "FormActions"],
    jsx: `<form noValidate className="w-full max-w-xl" aria-label="Form smoke">
          <ErrorSummary errors={[{ id: "smoke-email", message: "Enter an email." }]} focusKey={1} />
          <FormSection title="Profile" description="Shown to clients.">
            <input id="smoke-email" aria-label="Email" />
            <Fieldset legend="Invoice address" description="On every invoice."><input aria-label="Street" /></Fieldset>
          </FormSection>
          <FormActions className="mt-12"><@Btn type="submit">Save</@Btn><@Btn type="button">Cancel</@Btn></FormActions>
        </form>`,
  },
  switch: {
    needs: ["Switch"],
    state: [`const [on, setOn] = useState(true);`],
    jsx: `<div className="grid w-full max-w-sm gap-2" data-testid="litt-switches">
          <Switch label="Email me when a build finishes" checked={on} onCheckedChange={setOn} />
          <Switch align="end" label="Weekly digest" description="A Monday email." name="digest" />
          <Switch disabled label="Password protection" />
        </div>`,
  },
  slider: {
    needs: ["Slider"],
    jsx: `<div className="w-full max-w-sm" data-testid="litt-slider"><Slider name="speed" label="Animation speed" min={0.5} max={2} step={0.1} defaultValue={1} minLabel="Slower" maxLabel="Faster" showValue formatValue={(v) => \`\${v.toFixed(1)}x\`} /></div>`,
  },
  stat: {
    needs: ["Stat", "StatGroup"],
    jsx: `<div className="w-full max-w-xl" data-testid="litt-stats"><StatGroup><Stat label="Active projects" value={12} /><Stat label="Median build" value={41} unit="s" delta="Down 6 s on last week" tone="good" trend={<span data-testid="stat-trend">Last 14 days</span>} /></StatGroup></div>`,
  },
  chart: {
    needs: ["BarChart", "LineChart", "Meter"],
    jsx: `<div className="grid w-full max-w-xl gap-6" data-testid="litt-charts">
          <BarChart label="Deploys per day" labels={["1 Oct", "2 Oct", "3 Oct", "4 Oct"]} series={[{ name: "Deploys", values: [5, 7, 4, 9] }]} height={160} />
          <LineChart label="Build time" labels={["1 Oct", "2 Oct", "3 Oct", "4 Oct"]} series={[{ name: "Build time", values: [44, 41, 46, 39] }]} formatValue={(v) => \`\${v} s\`} height={160} />
          <Meter label="Storage" value={42} valueText="42 of 100 GB" />
          <Meter label="Video" value={58} valueText="58 GB" hue="violet" />
        </div>`,
  },
  "app-shell": {
    needs: ["AppShell", "SidebarNav", "SidebarLink"],
    jsx: `<div className="w-full" data-testid="litt-shell">
          <AppShell viewportHeight="24rem" wordmark={<a href="#home">Shell smoke</a>} nav={<SidebarNav label="Smoke"><SidebarLink href="#a" current>Overview</SidebarLink><SidebarLink href="#b">Projects</SidebarLink></SidebarNav>}>
            <p>Shell page</p>
          </AppShell>
        </div>`,
  },
  pagination: {
    needs: ["Pagination"],
    state: [`const [pg, setPg] = useState(2);`],
    jsx: `<div className="w-full max-w-xl" data-testid="litt-pagination"><Pagination label="Smoke pages" page={pg} pageSize={20} total={143} onPageChange={setPg} /></div>`,
  },
  pad: {
    needs: ["Pad"],
    state: [`const [voice, setVoice] = useState({ x: 30, y: 40 });`],
    jsx: `<div className="w-full max-w-sm" data-testid="litt-pad"><Pad label="Your voice" help="How replies sound." x={{ label: "Length", min: 0, max: 100, step: 5, minLabel: "Brief", maxLabel: "Detailed" }} y={{ label: "Tone", min: 0, max: 100, step: 5, minLabel: "Formal", maxLabel: "Casual" }} value={voice} onValueChange={setVoice} defaultMark={{ x: 30, y: 40 }} formatValue={(v) => \`Tone \${v.y}, length \${v.x}\`} /></div>`,
  },
  gauge: {
    needs: ["Gauge"],
    jsx: `<div className="grid w-full max-w-xs gap-6" data-testid="litt-gauges">
          <Gauge label="Credits left" value={20830} max={30000} valueText="20,830 credits" figure="20,830" caption="2k a day on average" hue="teal" />
          <div className="w-40" data-testid="litt-gauge-small"><Gauge label="Storage" value={42} valueText="42 of 100 GB" size={320} /></div>
        </div>`,
  },
  "bar-list": {
    needs: ["BarList"],
    state: [`const [picked, setPicked] = useState("nothing");`],
    jsx: `<div className="w-full max-w-xl" data-testid="litt-bar-list">
          <BarList
            label="Smoke shortcuts"
            unit={["time", "times"]}
            hue="blue"
            onSelect={(item) => setPicked(item.label)}
            items={[
              { label: "Archive", value: 412, lead: <span>E</span>, delta: "Up 15%", tone: "good" },
              { label: "Reply", value: 164, delta: "Down 27%", tone: "bad" },
              { label: "Snooze", value: 31 },
            ]}
          />
          <p data-testid="bar-list-picked">{picked}</p>
        </div>`,
  },
  timeline: {
    needs: ["Timeline", "TimelinePhase", "TimelineStep", "TimelineResult", "TimelineBar"],
    types: ["TimelineBarPhase"],
    top: [
      `const RUN: TimelineBarPhase[] = [`,
      `  { label: "Build", hue: "blue", steps: [{ label: "Clone repository", seconds: 2, status: "done" }, { label: "Restore build cache", seconds: 0, status: "skipped" }, { label: "Run build commands", seconds: 19, status: "done" }] },`,
      `  { label: "Deploy", hue: "teal", steps: [{ label: "Upload build output", seconds: 12, status: "done" }, { label: "Assign smoke.studio", seconds: 0, status: "running" }] },`,
      `];`,
    ],
    jsx: `<div className="grid w-full max-w-xl gap-8" data-testid="litt-timeline">
          <TimelineBar label="Smoke run" phases={RUN} />
          <Timeline label="Smoke run steps" proportional>
            <TimelinePhase label="Build" duration={21} hue="blue">
              <TimelineStep at="00:00" label="Clone repository" status="done" seconds={2} />
              <TimelineStep at="00:02" label="Restore build cache" status="skipped" />
              <TimelineStep at="00:02" label="Run build commands" status="done" seconds={19} previousSeconds={31} />
            </TimelinePhase>
            <TimelinePhase label="Deploy" duration={12} hue="teal">
              <TimelineStep at="00:21" label="Upload build output" status="done" seconds={12} />
              <TimelineStep at="00:33" label="Assign smoke.studio" status="running" />
            </TimelinePhase>
            <TimelineResult tone="success" label="Live on smoke.studio" total={33} />
          </Timeline>
        </div>`,
  },
  "token-input": {
    needs: ["TokenInput"],
    state: [`const [senders, setSenders] = useState<string[]>(["@stripe.com", "ramp.com", "brex.com"]);`],
    jsx: `<form className="grid w-full max-w-md gap-4" data-testid="litt-token-input" aria-label="Token input smoke" onSubmit={(e) => e.preventDefault()}>
          <TokenInput label="Mail from" name="from" collapseAfter={1} placeholder="Add a sender" hint="Press Enter or a comma to add one." value={senders} onValueChange={setSenders} validate={(v) => /^[a-z0-9.@-]+$/.test(v) || \`\${v} has characters a domain cannot.\`} />
        </form>`,
  },
  heatmap: {
    needs: ["Heatmap"],
    jsx: `<div className="w-full max-w-xl" data-testid="litt-heatmap">
          <Heatmap label="Deploys per day" hue="teal" unit={["deploy", "deploys"]} columns={["1 Oct", "2 Oct", "3 Oct", "4 Oct", "5 Oct"]} rows={[{ label: "Week 1", values: [0, 2, 5, 9, null], total: "16" }, { label: "Week 2", values: [4, 1, 7, 3, 6], total: "21" }]} />
        </div>`,
  },
  "dot-plot": {
    needs: ["DotPlot"],
    top: [`const DOT_VALUES = Array.from({ length: 60 }, (_, i) => 10 + ((i * 37) % 60)); // 10 to 69 s, once each`],
    jsx: `<div className="w-full max-w-xl" data-testid="litt-dotplot"><DotPlot label="Build times" values={DOT_VALUES} domain={[0, 80]} formatValue={(v) => Math.round(v) + " s"} unit={["build", "builds"]} goal={50} goalLabel="50 s goal" height={160} /></div>`,
  },
  avatar: {
    needs: ["Avatar", "AvatarGroup"],
    jsx: `<div className="flex flex-wrap items-center gap-3" data-testid="litt-avatars">
          <Avatar name="Stripe" data-testid="avatar-stripe" />
          <Avatar name="Stripe" size="sm" data-testid="avatar-stripe-2" />
          <Avatar name="@stripe.com" hue="rose" size="lg" data-testid="avatar-rose" />
          <Avatar name="Ramp" decorative data-testid="avatar-decorative" />
          <span>Ramp</span>
          <AvatarGroup label="Smoke team, 6 people" total={6} max={3}>
            <Avatar name="Ines Duarte" />
            <Avatar name="Marlow Labs" />
            <Avatar name="Sidebar Weekly" />
            <Avatar name="Grotta Type" />
          </AvatarGroup>
        </div>`,
  },
  callout: {
    needs: ["Callout"],
    state: [`const [noteOpen, setNoteOpen] = useState(true);`],
    jsx: `<div className="grid w-80 gap-4" data-testid="litt-callout">
          {noteOpen && <Callout tone="warning" title="Plan renews in 3 days" description="Change it before 4 November." action={<@Btn type="button" data-testid="callout-action">Manage plan</@Btn>} onDismiss={() => setNoteOpen(false)} />}
        </div>`,
  },
  sparkline: {
    needs: ["Sparkline"],
    jsx: `<div className="grid w-64 gap-4" data-testid="litt-sparklines">
          <div data-testid="spark-quiet"><Sparkline label="Median build time" values={[44, 46, 41, 37, 45, 43, 41]} formatValue={(v) => v + " s"} baseline={45} /></div>
          <div data-testid="spark-blue"><Sparkline label="Deploys per day" values={[5, 7, 4, 9]} hue="blue" height={48} /></div>
          <div data-testid="spark-empty"><Sparkline label="Visits per day" values={[]} /></div>
        </div>`,
  },
  spread: {
    needs: ["Spread"],
    jsx: `<div className="w-full max-w-xl" data-testid="litt-spread">
          <Spread
            label="Smoke build times"
            hue="blue"
            goal={50}
            goalLabel="50 s goal"
            formatValue={(v) => Math.round(v) + " s"}
            items={[
              { label: "Halo site", values: [71, 22, 41, 48, 32] },
              { label: "Northwind", min: 15, p25: 24, median: 29, p75: 38, max: 56 },
              { label: "Atlas portfolio", values: [40, 55, 62, 70, 90] },
            ]}
          />
        </div>`,
  },
  breakdown: {
    needs: ["Breakdown"],
    jsx: `<div className="grid w-full max-w-md gap-8" data-testid="litt-breakdown">
          <Breakdown label="Smoke storage" total={100} totalText="85 of 100 GB" formatValue={(v) => v + " GB"} items={[{ label: "Video", value: 58 }, { label: "Images", value: 24, hue: "teal" }, { label: "Fonts", value: 3 }]} />
          <Breakdown label="Smoke credits" unit={["credit", "credits"]} items={[{ label: "Builds", value: 40 }, { label: "Previews", value: 30 }, { label: "Resizing", value: 20 }, { label: "Analytics", value: 10 }, { label: "Forms", value: 8 }, { label: "Webhooks", value: 6 }, { label: "Redirects", value: 4 }]} />
          <div className="w-48"><Breakdown layout="legend" label="Smoke tile" formatValue={(v) => v + " GB"} items={[{ label: "Video", value: 58 }, { label: "Images", value: 24 }]} /></div>
        </div>`,
  },
  "list-cover": { needs: ["ProjectCover"], jsx: `<div className="relative h-28 w-48 overflow-hidden"><ProjectCover name={"@cover0"} /></div>` },
  list: {
    needs: ["ProjectList"],
    types: ["Project"],
    top: [
      `const projects: Project[] = [`,
      `  { id: "p1", name: "Northwind site", client: "Northwind", deploy: "Deployed 2 days ago", status: "live", updated: "2026-10-10", description: "The studio site.", tags: ["Site"], cover: "@cover0" },`,
      `  { id: "p2", name: "Atlas portfolio", client: "Atlas", deploy: "No deploy yet", status: "review", updated: "2026-10-09", description: "Wordmark and grid.", tags: ["Identity"], cover: "@cover1" },`,
      `  { id: "p3", name: "Archive", client: "Litt Studio", status: "draft", updated: "2024" }, // only the required fields`,
      `];`,
    ],
    jsx: `<div className="w-full max-w-xl"><ProjectList projects={projects} /></div>`,
  },
};

/** Recipes for shadcn's own registry, used by `--registry shadcn` to prove the harness itself. */
const SHADCN_RECIPES = {
  badge: { needs: ["Badge"], jsx: `<Badge data-testid="shadcn-badge">Badge</Badge>` },
  input: { needs: ["Input"], jsx: `<Input data-testid="shadcn-input" placeholder="Input" />` },
  card: {
    needs: ["Card", "CardHeader", "CardTitle"],
    jsx: `<div className="w-64"><Card data-testid="shadcn-card"><CardHeader><CardTitle>Card</CardTitle></CardHeader></Card></div>`,
  },
};

export const knownRecipeNames = () => Object.keys(RECIPES);
/** Export names an item's recipe renders: the modules a user would import from a Server Component. */
export const recipeNeedsFor = (item, shadcnRegistry) => (shadcnRegistry ? SHADCN_RECIPES : RECIPES)[item]?.needs ?? [];

/**
 * Index the exports of the files an install wrote.
 * files: [{rel, content}] -> Map<exportName, rel>
 */
export function indexExports(files) {
  const index = new Map();
  const add = (name, rel) => {
    if (!index.has(name)) index.set(name, rel);
  };
  for (const { rel, content } of files) {
    if (!/\.(tsx?|mts)$/.test(rel)) continue;
    for (const m of content.matchAll(/export\s+(?:async\s+)?(?:function\*?|const|let|class|type|interface|enum)\s+([A-Za-z_$][\w$]*)/g))
      add(m[1], rel);
    for (const m of content.matchAll(/export\s+(?:type\s+)?\{([^}]*)\}(?!\s*from)/g)) {
      for (const part of m[1].split(",")) {
        const name = part
          .trim()
          .split(/\s+as\s+/)
          .pop()
          .trim();
        if (/^[A-Za-z_$][\w$]*$/.test(name)) add(name, rel);
      }
    }
  }
  return index;
}

const posix = (p) => p.split(path.sep).join("/");
function importPath(fromRel, toRel) {
  let r = posix(path.relative(path.dirname(fromRel), toRel)).replace(/\.(tsx?|mts)$/, "");
  if (!r.startsWith(".")) r = "./" + r;
  return r;
}

/**
 * The smoke page: the host probes, then every installed litt component.
 * items: item names installed this scenario. files: the files the install wrote.
 * Returns {source, rendered: item names drawn, missing: [{item, name}]}.
 */
export function buildSmokePage({ app, pageRel, items, files, shadcnRegistry = false }) {
  const index = indexExports(files);
  const recipes = shadcnRegistry ? SHADCN_RECIPES : RECIPES;
  const rendered = [];
  const missing = [];
  const imports = new Map(); // rel -> {values:Set, types:Set}
  const need = (rel, name, kind) => {
    if (!imports.has(rel)) imports.set(rel, { values: new Set(), types: new Set() });
    imports.get(rel)[kind].add(name);
  };

  // Cover names are read from the installed list-cover file, so the page follows the component.
  const coverFile = files.find((f) => /export\s+type\s+CoverName\s*=/.test(f.content));
  const covers = coverFile
    ? [...(/export\s+type\s+CoverName\s*=([^;]+);/.exec(coverFile.content)?.[1] ?? "").matchAll(/"([^"]+)"/g)].map((m) => m[1])
    : [];
  const cover = (n) => covers[n] ?? covers[0] ?? "system";

  const btn = index.has("Button") && !shadcnRegistry ? "Button" : "button";
  const sections = [];
  const top = [];
  const state = [];
  const wraps = [];
  for (const item of items) {
    const r = recipes[item];
    if (!r) continue;
    const absent = r.needs.filter((n) => !index.has(n));
    if (absent.length) {
      for (const name of absent) missing.push({ item, name });
      continue;
    }
    for (const n of r.needs) need(index.get(n), n, "values");
    for (const t of r.types ?? []) {
      if (index.has(t)) need(index.get(t), t, "types");
      else missing.push({ item, name: t });
    }
    if (r.wrap) wraps.push(r.wrap);
    for (const l of r.state ?? []) state.push(l);
    for (const l of r.top ?? []) top.push(l.replaceAll("@cover0", cover(0)).replaceAll("@cover1", cover(1)));
    sections.push({ item, jsx: r.jsx.replaceAll("@cover0", cover(0)).replaceAll("@cover1", cover(1)) });
    rendered.push(item);
  }

  if (btn === "Button" && sections.some((x) => x.jsx.includes("@Btn"))) need(index.get("Button"), "Button", "values");
  for (const x of sections) x.jsx = x.jsx.replaceAll("@Btn", btn);
  const lines = [];
  if (app === "next") lines.push('"use client";');
  if (state.length) lines.push('import { useState } from "react";');
  lines.push('import { Button as HostButton } from "@/components/ui/button";');
  for (const [rel, { values, types }] of imports) {
    if (values.size) lines.push(`import { ${[...values].join(", ")} } from "${importPath(pageRel, rel)}";`);
    if (types.size) lines.push(`import type { ${[...types].join(", ")} } from "${importPath(pageRel, rel)}";`);
  }
  lines.push("");
  lines.push(...top, top.length ? "" : null);
  lines.push("export default function Smoke() {");
  for (const s of state) lines.push("  " + s);
  const body = [
    `<main className="grid gap-8 p-6" data-testid="smoke">${HOST_PROBE}`,
    `      <section data-testid="litt-section" className="grid gap-6">`,
    ...sections.map((s) => `        <div data-item="${s.item}" className="flex flex-wrap items-center gap-3">\n        ${s.jsx}\n        </div>`),
    `      </section>`,
    `    </main>`,
  ].join("\n");
  const wrapped = [...new Set(wraps)].reduceRight((inner, w) => `<${w}>\n${inner}\n    </${w}>`, body);
  lines.push("  return (", "    " + wrapped, "  );", "}", "");
  return { source: lines.filter((l) => l !== null).join("\n"), rendered, missing };
}

/** A Server Component page that imports every installed module, so a missing "use client" fails the build. */
export function buildRscPage({ pageRel, moduleRels }) {
  const names = moduleRels.map((_, i) => `m${i}`);
  return `// Server Component: no "use client". Importing a hook-using module here fails the build unless it is a client module.
${moduleRels.map((rel, i) => `import * as ${names[i]} from "${importPath(pageRel, rel)}";`).join("\n")}

const modules: Record<string, unknown>[] = [${names.join(", ")}];

export default function Page() {
  return <pre>{modules.map((m) => Object.keys(m).length).join(",")}</pre>;
}
`;
}

/* ------------------------------------------------------------------ expected colors */

const hexToRgb = (hex) => {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? [...h].map((c) => c + c).join("") : h;
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16));
};

/** litt's accent in light and dark, read from the `--accent` declarations in tokens.css. Returns {light:[r,g,b], dark:[r,g,b]}. */
export function readExpectedAccent(tokensCssPath) {
  const nodes = parseCss(fs.readFileSync(tokensCssPath, "utf8"));
  const pick = (test) => {
    const block = nodes.find((n) => n.kind === "block" && test(n.prelude) && n.children.some((c) => c.kind === "decl" && c.prop === "--accent"));
    const hex = block?.children.find((c) => c.kind === "decl" && c.prop === "--accent")?.value;
    if (!hex || !/^#[0-9a-f]{3,6}\b/i.test(hex)) throw new Error(`${tokensCssPath}: cannot read --accent for ${test}`);
    return hexToRgb(hex.match(/^#[0-9a-f]{3,6}/i)[0]);
  };
  return {
    light: pick((p) => p.includes(":root") && p.includes('[data-theme="light"]')),
    dark: pick((p) => p === '[data-theme="dark"]'),
  };
}

/* ------------------------------------------------------------------ browser */

let playwrightCache;
export function loadPlaywright() {
  if (playwrightCache) return playwrightCache;
  const require = createRequire(import.meta.url);
  const tries = [process.env.PLAYWRIGHT_MODULE, "playwright", "/opt/node22/lib/node_modules/playwright"].filter(Boolean);
  for (const t of tries) {
    try {
      playwrightCache = require(t);
      return playwrightCache;
    } catch {
      /* try the next */
    }
  }
  throw new Error(`playwright not found (tried ${tries.join(", ")}); set PLAYWRIGHT_MODULE to its path`);
}

export async function launchChromium() {
  const { chromium } = loadPlaywright();
  try {
    return await chromium.launch();
  } catch (e) {
    const base = process.env.PLAYWRIGHT_BROWSERS_PATH || "/opt/pw-browsers";
    const dirs = fs.existsSync(base)
      ? fs
          .readdirSync(base)
          .filter((d) => /^chromium-\d+$/.test(d))
          .sort()
          .reverse()
      : [];
    for (const d of dirs) {
      const exe = path.join(base, d, "chrome-linux", "chrome");
      if (fs.existsSync(exe)) return chromium.launch({ executablePath: exe });
    }
    throw e;
  }
}

const MEASURED = [
  "color",
  "background-color",
  "border-top-left-radius",
  "border-top-right-radius",
  "font-family",
  "font-size",
  "font-weight",
  "line-height",
  "letter-spacing",
  "box-shadow",
  "border-top-color",
  "border-top-width",
  "border-top-style",
  "padding-top",
  "padding-left",
  "height",
  "outline-style",
  "outline-width",
  "outline-color",
  "text-decoration-line",
];

/** Runs in the page: computed styles of every [data-probe], body, html, and every custom property the stylesheets declare. */
function measureInPage(props) {
  const pick = (el, list = props) => {
    const cs = getComputedStyle(el);
    return Object.fromEntries(list.map((p) => [p, cs.getPropertyValue(p)]));
  };
  const noHeight = props.filter((p) => p !== "height"); // the page grows when litt components are added
  const out = {};
  for (const el of document.querySelectorAll("[data-probe]")) out[el.getAttribute("data-probe")] = pick(el);
  out["h1"] = pick(document.querySelector("[data-testid=host-probe] h1"));
  out["h2"] = pick(document.querySelector("[data-testid=host-probe] h2"));
  out["body"] = pick(document.body, noHeight);
  out["html"] = pick(document.documentElement, noHeight);
  const names = new Set();
  const walk = (rules) => {
    for (const r of rules) {
      if (r.style) for (const p of r.style) if (p.startsWith("--")) names.add(p);
      if (r.cssRules) walk(r.cssRules);
    }
  };
  for (const sheet of document.styleSheets) {
    try {
      walk(sheet.cssRules);
    } catch {
      /* cross-origin sheet */
    }
  }
  const root = getComputedStyle(document.documentElement);
  out["vars"] = Object.fromEntries(
    [...names]
      .filter((n) => !n.startsWith("--tw-"))
      .sort()
      .map((n) => [n, root.getPropertyValue(n).trim()]),
  );
  return out;
}

async function measureTheme(page, theme) {
  await page.evaluate((t) => document.documentElement.classList.toggle("dark", t === "dark"), theme);
  // Hosts transition colors (shadcn's Button does), so wait until nothing is mid-flight.
  await page.evaluate(() => Promise.all(document.getAnimations().map((a) => a.finished.catch(() => {}))));
  await page.waitForTimeout(250);
  const plain = await page.evaluate(measureInPage, MEASURED);
  // Keyboard modality first, so the programmatic focus shows :focus-visible like a Tab would.
  await page.keyboard.press("Tab");
  await page.focus("[data-probe=native-button]");
  const focus = await page.evaluate(
    (props) => {
      const cs = getComputedStyle(document.querySelector("[data-probe=native-button]"));
      return Object.fromEntries(props.map((p) => [p, cs.getPropertyValue(p)]));
    },
    ["outline-style", "outline-width", "outline-color", "outline-offset", "border-top-left-radius"],
  );
  await page.evaluate(() => document.activeElement?.blur());
  return { ...plain, "native-button:focus": focus };
}

const COLOR_TO_RGB = `(value) => {
  const c = document.createElement("canvas").getContext("2d", { willReadFrequently: true });
  c.clearRect(0, 0, 1, 1); c.fillStyle = "black"; c.fillStyle = value; c.fillRect(0, 0, 1, 1);
  return Array.from(c.getImageData(0, 0, 1, 1).data);
}`;

const near = (a, b, tol = 1) => a.length >= 3 && b.length >= 3 && [0, 1, 2].every((i) => Math.abs(a[i] - b[i]) <= tol);

/** Open the page, wait for it to settle, and record console errors for the whole visit. */
async function openPage(browser, url, theme, device = {}) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 1100 }, colorScheme: "light", deviceScaleFactor: 1, ...device });
  const page = await context.newPage();
  page.setDefaultTimeout(12000);
  const errors = [];
  page.on("pageerror", (e) => errors.push(`pageerror: ${String(e.message || e).split("\n")[0]}`));
  page.on("console", (m) => {
    if (m.type() !== "error") return;
    if (/favicon/.test(m.location()?.url ?? "") || /favicon/.test(m.text())) return;
    errors.push(`console.error: ${m.text().split("\n")[0]}${m.location()?.url ? ` (${m.location().url})` : ""}`);
  });
  page.on("requestfailed", (r) => {
    if (!/favicon/.test(r.url())) errors.push(`requestfailed: ${r.url()} ${r.failure()?.errorText ?? ""}`);
  });
  await page.goto(url, { waitUntil: "load", timeout: 30000 });
  await page.waitForSelector("[data-testid=smoke]", { timeout: 15000 });
  await page.evaluate(() => document.fonts.ready);
  if (theme === "dark") await page.evaluate(() => document.documentElement.classList.add("dark"));
  await page.waitForTimeout(400);
  return { context, page, errors };
}

/** Measure the host probes only, in light and dark. Used for the baseline. */
export async function measureHost(browser, url) {
  const { context, page, errors } = await openPage(browser, url, "light");
  try {
    const light = await measureTheme(page, "light");
    const dark = await measureTheme(page, "dark");
    return { light, dark, errors };
  } finally {
    await context.close();
  }
}

/** Differences between a baseline measurement and a later one, for one theme. Variables absent from the baseline are new and allowed. */
export function compareTheme(baselineTheme, nowTheme) {
  const diffs = [];
  for (const [key, props] of Object.entries(baselineTheme)) {
    const cur = nowTheme[key];
    if (!cur) {
      diffs.push(`${key}: missing after install`);
      continue;
    }
    for (const [prop, value] of Object.entries(props))
      if (cur[prop] !== value) diffs.push(`${key} ${prop}: ${JSON.stringify(value)} -> ${JSON.stringify(cur[prop])}`);
  }
  return diffs;
}

/** Group compareTheme lines by probe: "host-button: border-top-left-radius 10px -> 0px (+2) | vars: --accent oklch(...) -> red". */
export function summarizeDiffs(diffs, max = 8) {
  const groups = new Map();
  for (const d of diffs) {
    const m = /^(\S+) (\S+): "?(.*?)"? -> "?(.*?)"?$/.exec(d);
    const [key, text] = m ? [m[1], `${m[2]} ${m[3]} -> ${m[4]}`] : ["other", d];
    groups.set(key, [...(groups.get(key) ?? []), text]);
  }
  // Custom properties first: a leaked variable is the cause, the restyled elements are the effect.
  const ordered = [...groups].sort(([a], [b]) => (a === "vars" ? -1 : b === "vars" ? 1 : 0));
  return ordered
    .slice(0, max)
    .map(([key, list]) => `${key}: ${list.slice(0, 3).join(", ")}${list.length > 3 ? ` (+${list.length - 3} more)` : ""}`)
    .join(" | ");
}

/**
 * What `base-styles` (the opt-in item) changes in the host: the diff of the host probes against the
 * baseline. Returns {diffs, errors}. Used to show the opt-in does what it says while `litt` alone does not.
 */
export async function measureBaseStyles(browser, url, baseline) {
  const now = await measureHost(browser, url);
  const tag = (theme) => compareTheme(baseline[theme], now[theme]).map((d) => `${theme} ${d}`);
  return { diffs: [...tag("light"), ...tag("dark")], errors: now.errors };
}

/**
 * The full smoke run against a served production build.
 * opts: {browser, url, shotsDir, tag, rendered (item names), litt (bool), accent ({light,dark}), baseline}
 * Returns {checks: [{name, ok, detail}], errors: string[]}.
 */
export async function runSmoke({ browser, url, shotsDir, tag, rendered, litt, accent, baseline }) {
  fs.mkdirSync(shotsDir, { recursive: true });
  const checks = [];
  const record = (name, ok, detail = "") => checks.push({ name, ok, detail });
  const has = (item) => rendered.includes(item);
  const allErrors = [];

  for (const theme of ["light", "dark"]) {
    const { context, page, errors } = await openPage(browser, url, theme);
    const t = (name) => `${theme}: ${name}`;
    const attempt = async (name, fn) => {
      try {
        // A failed step may have left a menu or dialog open; start each one from a clean page.
        if (await page.evaluate(() => document.querySelectorAll("[role=menu],[role=dialog]").length)) {
          await page.keyboard.press("Escape");
          await page.waitForTimeout(500);
        }
        const detail = await fn();
        record(t(name), true, detail ?? "");
      } catch (e) {
        // Playwright puts the useful part (what intercepts the click) after the first line.
        const text = String(e.message || e).replace(/\x1b\[[0-9;]*m/g, "");
        const lines = text
          .split("\n")
          .map((l) => l.trim())
          .filter(Boolean);
        const why = lines.find((l) => /intercepts pointer events|not visible|not enabled|detached/.test(l));
        record(t(name), false, [lines[0], why].filter(Boolean).join(" / "));
      }
    };
    try {
      await page.screenshot({ path: path.join(shotsDir, `${tag}-${theme}-page.png`), fullPage: true });

      // The host first: nothing litt installed may change it.
      await attempt("host unchanged", async () => {
        const now = await measureTheme(page, theme);
        const diffs = compareTheme(baseline[theme], now);
        if (diffs.length) throw new Error(`${diffs.length} host style(s) changed. ${summarizeDiffs(diffs)}`);
        return `${Object.keys(baseline[theme]).length} probes, ${Object.keys(baseline[theme].vars).length} root variables`;
      });
      if (theme === "dark") await page.evaluate(() => document.documentElement.classList.add("dark"));

      if (litt) {
        await attempt("litt tokens defined", async () => {
          const v = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--litt-accent").trim());
          if (!v) throw new Error("--litt-accent is empty on <html>");
          return `--litt-accent = ${v}`;
        });
      }

      if (litt && has("button")) {
        await attempt("primary button = litt accent", async () => {
          const got = await page.evaluate(
            `(${COLOR_TO_RGB})(getComputedStyle(document.querySelector("[data-testid=litt-primary]")).backgroundColor)`,
          );
          const want = accent[theme];
          if (!near(got, want)) throw new Error(`background is rgb(${got.slice(0, 3)}), litt accent is rgb(${want})`);
          return `rgb(${want})`;
        });
      }

      if (has("tooltip")) {
        await attempt("tooltip opens", async () => {
          await page.hover("[data-testid=tooltip-trigger]");
          await page.getByText("Litt tooltip").last().waitFor({ state: "visible", timeout: 5000 });
          await page.mouse.move(5, 5);
        });
      }
      if (has("tabs")) {
        await attempt("tabs switch", async () => {
          await page.getByRole("tab", { name: "Two" }).click();
          await page.getByText("Panel two").waitFor({ state: "visible", timeout: 4000 });
        });
      }
      if (has("list")) {
        await attempt("project list rows", async () => {
          await page.getByText("Northwind site").first().waitFor({ state: "visible", timeout: 4000 });
          const n = await page.locator("ul[aria-label=Projects] li").count();
          if (n < 3) throw new Error(`expected 3 rows, found ${n}`);
          // The third project has only the required fields, and a year where a date would be.
          await page.getByText("Archive").first().waitFor({ state: "visible", timeout: 4000 });
          return `${n} rows`;
        });
      }
      if (has("menu")) {
        await attempt("menu opens with glass panel", async () => {
          await page.click("[data-testid=menu-trigger]");
          const menu = page.getByRole("menu");
          await menu.waitFor({ state: "visible", timeout: 5000 });
          await page.waitForTimeout(700);
          const info = await menu.evaluate((el) => {
            const host = el.closest(".litt-glass") ?? el.querySelector(".litt-glass");
            const before = host ? getComputedStyle(host, "::before") : null;
            return {
              glass: !!host,
              blur: before ? before.backdropFilter || before.webkitBackdropFilter || "" : "",
              content: before ? before.content : "",
            };
          });
          await page.screenshot({ path: path.join(shotsDir, `${tag}-${theme}-menu.png`) });
          await page.keyboard.press("Escape");
          await menu.waitFor({ state: "hidden", timeout: 4000 }).catch(() => {});
          if (!info.glass) throw new Error('the menu panel has no ".litt-glass" class');
          if (!info.blur || info.blur === "none")
            throw new Error(`.litt-glass has no backdrop-filter (the material CSS is missing): ${JSON.stringify(info)}`);
          return `backdrop-filter: ${info.blur}`;
        });
      }
      if (has("select")) {
        await attempt("select opens as glass and picks with the keyboard", async () => {
          const trigger = page.getByRole("combobox", { name: "Role" });
          await trigger.click();
          const list = page.getByRole("listbox");
          await list.waitFor({ state: "visible", timeout: 5000 });
          await page.waitForTimeout(600);
          const info = await list.evaluate((el) => {
            const host = el.closest(".litt-glass") ?? el.querySelector(".litt-glass") ?? (el.classList.contains("litt-glass") ? el : null);
            const before = host ? getComputedStyle(host, "::before") : null;
            return { glass: !!host, blur: before ? before.backdropFilter || before.webkitBackdropFilter || "" : "", rows: [...el.querySelectorAll("[role=option]")].map((o) => Math.round(o.getBoundingClientRect().height)) };
          });
          await page.screenshot({ path: path.join(shotsDir, `${tag}-${theme}-select.png`) });
          if (!info.glass) throw new Error('the select list has no ".litt-glass" class');
          if (!info.blur || info.blur === "none") throw new Error(`.litt-glass has no backdrop-filter: ${JSON.stringify(info)}`);
          if (info.rows.some((h) => h < 44)) throw new Error(`rows under 44px: ${info.rows}`);
          await page.keyboard.press("ArrowDown");
          // Radix Select moves focus on an arrow key in a setTimeout, so an Enter sent in the same instant lands on the old row.
          await page.waitForFunction(() => document.activeElement?.textContent?.trim() === "Developer", null, { timeout: 3000 });
          await page.keyboard.press("Enter");
          await list.waitFor({ state: "hidden", timeout: 4000 });
          const text = (await trigger.textContent())?.trim();
          if (text !== "Developer") throw new Error(`the trigger reads "${text}" after picking Developer`);
          const sent = await page.evaluate(() => new FormData(document.querySelector("[data-testid=litt-select]")).get("role"));
          if (sent !== "developer") throw new Error(`the form sends role=${sent}`);
          return `rows ${info.rows.join("/")}, picked ${text}`;
        });
      }
      if (has("form")) {
        await attempt("error summary takes focus and names its fields", async () => {
          // The summary takes focus once, when it mounts, and earlier steps have moved focus since: start from a fresh page.
          await page.reload({ waitUntil: "networkidle" });
          await page.waitForTimeout(600);
          const summary = page.getByRole("region", { name: "Fix 1 field to save" });
          await summary.waitFor({ state: "visible", timeout: 5000 });
          const focused = await summary.evaluate((el) => el === document.activeElement);
          if (!focused) throw new Error("the error summary did not take focus");
          const hash = await page.evaluate(() => location.hash);
          await page.getByRole("link", { name: "Enter an email." }).click();
          const onField = await page.evaluate(() => document.activeElement?.id);
          if (onField !== "smoke-email") throw new Error(`the summary link focused ${onField}, not the field`);
          if ((await page.evaluate(() => location.hash)) !== hash) throw new Error("the summary link changed the URL hash");
          return "focus on the summary, then on the field";
        });
      }
      if (has("switch")) {
        await attempt("switch toggles and fills with the foreground color", async () => {
          const sw = page.getByRole("switch", { name: "Email me when a build finishes" });
          if ((await sw.getAttribute("aria-checked")) !== "true") throw new Error("the switch did not start on");
          const fill = () => sw.evaluate((el) => getComputedStyle(el).backgroundColor);
          const fg = await page.evaluate(() => {
            const probe = document.createElement("span");
            probe.style.color = "var(--litt-fg)";
            document.body.append(probe);
            const c = getComputedStyle(probe).color;
            probe.remove();
            return c;
          });
          const on = await fill();
          if (on !== fg) throw new Error(`an on switch is ${on}, not --litt-fg (${fg})`);
          await sw.click();
          await page.waitForTimeout(300);
          if ((await sw.getAttribute("aria-checked")) !== "false") throw new Error("a click did not turn it off");
          await sw.focus();
          await page.keyboard.press("Space");
          await page.waitForTimeout(300);
          if ((await sw.getAttribute("aria-checked")) !== "true") throw new Error("Space did not turn it back on");
          return `on is ${on}`;
        });
      }
      if (has("slider")) {
        await attempt("slider steps with the arrow keys", async () => {
          const thumb = page.getByRole("slider", { name: "Animation speed" });
          const before = await thumb.getAttribute("aria-valuetext");
          await thumb.focus();
          await page.keyboard.press("ArrowRight");
          await page.waitForTimeout(100);
          const after = await thumb.getAttribute("aria-valuetext");
          if (before !== "1.0x" || after !== "1.1x") throw new Error(`aria-valuetext went from ${before} to ${after}, expected 1.0x to 1.1x`);
          return `${before} to ${after}`;
        });
      }
      if (has("stat")) {
        await attempt("stat reads label, figure and a delta in the good color", async () => {
          const terms = await page.locator("[data-testid=litt-stats] dt").allTextContents();
          if (terms.join("|") !== "Active projects|Median build") throw new Error(`the labels read ${terms.join("|")}`);
          const dd = page.locator("[data-testid=litt-stats] dd").nth(1);
          const text = (await dd.innerText()).replace(/\s+/g, " ").trim();
          if (!text.startsWith("41s") || !text.includes("Down 6 s on last week")) throw new Error(`the tile reads "${text}"`);
          const delta = await dd.locator(":scope > span").nth(1).evaluate((el) => getComputedStyle(el).color);
          const success = await page.evaluate(() => {
            const probe = document.createElement("span");
            probe.style.color = "var(--litt-success)";
            document.body.append(probe);
            const c = getComputedStyle(probe).color;
            probe.remove();
            return c;
          });
          if (delta !== success) throw new Error(`a good delta is ${delta}, not --litt-success (${success})`);
          return `delta is ${delta}`;
        });
      }
      if (has("chart")) {
        await attempt("charts draw in the foreground, never the accent, and the keys move the tooltip", async () => {
          const box = page.locator("[data-testid=litt-charts]");
          const svg = box.locator("svg[role=img]").first();
          await svg.waitFor({ state: "visible", timeout: 8000 });
          await page.waitForTimeout(600);
          const label = await svg.getAttribute("aria-label");
          if (label !== "Deploys per day: from 5 to 9, peak 9") throw new Error(`the summary reads "${label}"`);
          const colors = await box.evaluate((root) => {
            const out = new Set();
            for (const el of root.querySelectorAll("svg[role=img] rect, svg[role=img] path, svg[role=img] circle")) {
              const cs = getComputedStyle(el);
              out.add(cs.fill);
              out.add(cs.stroke);
            }
            return [...out];
          });
          for (const c of colors) {
            const rgb = await page.evaluate(`(${COLOR_TO_RGB})(${JSON.stringify(c)})`);
            if (near(rgb, accent[theme])) throw new Error(`a mark is the accent (${c})`);
          }
          const rows = await box.locator(".sr-only table").first().locator("tbody tr").count();
          if (rows !== 4) throw new Error(`the hidden table has ${rows} rows, not 4`);
          const stops = await box.locator("[role=group] button[tabindex='0']").count();
          if (stops < 2) throw new Error(`each chart should have one tab stop, found ${stops} in two charts`);
          await box.locator("[role=group] button").first().focus();
          await page.keyboard.press("ArrowRight");
          const name = await page.evaluate(() => document.activeElement?.getAttribute("aria-label"));
          if (name !== "2 Oct: 7") throw new Error(`ArrowRight landed on "${name}", not "2 Oct: 7"`);
          await box.locator("div[aria-hidden=true]").filter({ hasText: "2 Oct" }).first().waitFor({ state: "visible", timeout: 3000 });
          await page.keyboard.press("Escape");
          await page.waitForTimeout(400);
          const left = await box.locator("div[aria-hidden=true]").filter({ hasText: "2 Oct" }).count();
          if (left) throw new Error("Esc did not hide the tooltip");
          await page.evaluate(() => document.activeElement?.blur());
          const meter = box.getByRole("meter", { name: "Storage" });
          const now = await meter.getAttribute("aria-valuenow");
          const share = await meter.evaluate((el) => el.firstElementChild.getBoundingClientRect().width / el.getBoundingClientRect().width);
          if (now !== "42" || Math.abs(share - 0.42) > 0.01) throw new Error(`the meter reads ${now} and fills ${share.toFixed(2)}`);
          const hued = await box.getByRole("meter", { name: "Video" }).evaluate((el) => getComputedStyle(el.firstElementChild).backgroundColor);
          const violet = await page.evaluate(() => {
            const probe = document.createElement("span");
            probe.style.color = "var(--litt-data-violet)";
            document.body.append(probe);
            const c = getComputedStyle(probe).color;
            probe.remove();
            return c;
          });
          if (hued !== violet) throw new Error(`a violet meter fills with ${hued}, not --litt-data-violet (${violet})`);
          return `${colors.length} mark colors, none the accent; a hued meter is --litt-data-violet`;
        });
      }
      if (has("sparkline")) {
        await attempt("sparkline reads its summary, draws a 2px line and a dot in the data hue, a dashed baseline, and a Stat's trend slot", async () => {
          const box = page.locator("[data-testid=litt-sparklines]");
          const quiet = box.locator("[data-testid=spark-quiet] svg[role=img]");
          await quiet.waitFor({ state: "visible", timeout: 8000 });
          const want = "Median build time: from 44 s to 41 s, low 37 s, high 46 s, baseline 45 s";
          const said = await quiet.getAttribute("aria-label");
          if (said !== want) throw new Error(`the summary reads "${said}", not "${want}"`);
          const stops = await box.locator("button, a, input, [tabindex]").count();
          if (stops) throw new Error(`a sparkline is not interactive, yet ${stops} focusable element(s) are inside`);
          const colorOf = (v) =>
            page.evaluate((value) => {
              const probe = document.createElement("span");
              probe.style.color = value;
              document.body.append(probe);
              const c = getComputedStyle(probe).color;
              probe.remove();
              return c;
            }, v);
          const [blue, blueText, accent, lineStrong, fg55] = [
            await colorOf("var(--litt-data-blue)"),
            await colorOf("var(--litt-data-blue-text)"),
            await colorOf("var(--litt-accent)"),
            await colorOf("var(--litt-line-strong)"),
            await colorOf("color-mix(in oklab, var(--litt-fg) 55%, transparent)"),
          ];
          const hued = box.locator("[data-testid=spark-blue] svg[role=img]");
          if ((await hued.getAttribute("aria-label")) !== "Deploys per day: from 5 to 9, low 4, high 9") throw new Error(`the hued summary reads "${await hued.getAttribute("aria-label")}"`);
          const marks = (loc) =>
            loc.evaluate((svg) => {
              const path = svg.querySelector("path");
              const circles = [...svg.querySelectorAll("circle")];
              const s = path && getComputedStyle(path);
              return {
                line: s?.stroke,
                width: s?.strokeWidth,
                cap: s?.strokeLinecap,
                join: s?.strokeLinejoin,
                fill: s?.fill,
                radii: circles.map((c) => c.getAttribute("r")),
                dot: circles.length ? getComputedStyle(circles[circles.length - 1]).fill : null,
                svg: svg.getBoundingClientRect().width,
                box: svg.parentElement.getBoundingClientRect().width,
              };
            });
          const h = await marks(hued);
          if (h.line !== blue || h.dot !== blueText) throw new Error(`the hued line is ${h.line} and its dot ${h.dot}, not --litt-data-blue (${blue}) and --litt-data-blue-text (${blueText})`);
          if ([h.line, h.dot].includes(accent)) throw new Error("a mark is the accent");
          if (h.width !== "2px" || h.cap !== "round" || h.join !== "round" || h.fill !== "none") throw new Error(`the line is ${h.width} with ${h.cap} caps and ${h.join} joins, fill ${h.fill}`);
          if (h.radii.join() !== "6,4") throw new Error(`the ring and the dot have radii ${h.radii.join()}, not 6,4`);
          if (Math.abs(h.svg - h.box) > 1) throw new Error(`the drawing is ${h.svg}px wide in a ${h.box}px box`);
          const q = await marks(quiet);
          if (q.line !== fg55) throw new Error(`the quiet line is ${q.line}, not the foreground at 55% (${fg55})`);
          const baseline = await quiet.evaluate((svg) => {
            const line = svg.querySelector("line");
            const s = line && getComputedStyle(line);
            return line && { stroke: s.stroke, width: s.strokeWidth, dash: s.strokeDasharray, span: Number(line.getAttribute("x2")) - Number(line.getAttribute("x1")), drawn: svg.getBoundingClientRect().width };
          });
          if (!baseline || baseline.stroke !== lineStrong || baseline.width !== "1px" || baseline.dash === "none") throw new Error(`the baseline is ${JSON.stringify(baseline)}, not a dashed 1px --litt-line-strong line`);
          if (Math.abs(baseline.span - baseline.drawn) > 1) throw new Error(`the baseline spans ${baseline.span}px of ${baseline.drawn}px`);
          const empty = box.locator("[data-testid=spark-empty] svg[role=img]");
          const emptyShape = await empty.evaluate((svg) => ({ label: svg.getAttribute("aria-label"), marks: svg.querySelectorAll("path, circle, line").length }));
          if (emptyShape.label !== "Visits per day: no data" || emptyShape.marks) throw new Error(`an empty sparkline reads ${JSON.stringify(emptyShape)}`);
          let detail = `line ${h.line}, dot ${h.dot}`;
          if (has("stat")) {
            const dd = page.locator("[data-testid=litt-stats] dd").nth(1);
            const term = await page.locator("[data-testid=litt-stats] dt").nth(1).innerText();
            const text = (await dd.innerText()).replace(/\s+/g, " ").trim();
            if (term !== "Median build" || !text.startsWith("41s") || !text.includes("Down 6 s on last week") || !text.endsWith("Last 14 days")) throw new Error(`a Stat with a trend reads "${term}: ${text}"`);
            const place = await dd.evaluate((el) => {
              const tile = el.parentElement;
              const trend = el.querySelector("[data-testid=stat-trend]").parentElement.getBoundingClientRect();
              const delta = el.querySelectorAll(":scope > span")[1].getBoundingClientRect();
              const inner = tile.getBoundingClientRect().bottom - parseFloat(getComputedStyle(tile).paddingBottom);
              return { gapBelow: inner - trend.bottom, after: trend.top - delta.bottom };
            });
            if (Math.abs(place.gapBelow) > 1.5 || place.after < 0) throw new Error(`the trend is ${place.gapBelow.toFixed(1)}px from the foot of the tile and ${place.after.toFixed(1)}px under the delta`);
            detail += "; a Stat's trend sits at the foot";
          }
          return detail;
        });
      }
      if (has("spread")) {
        await attempt("spread reads each row in words, lines the rails up on one scale, draws the middle half in the data hue and runs the goal through every rail", async () => {
          const box = page.locator("[data-testid=litt-spread]");
          const list = box.getByRole("list", { name: "Smoke build times" });
          await list.waitFor({ state: "visible", timeout: 8000 });
          const rows = list.getByRole("listitem");
          if ((await rows.count()) !== 3) throw new Error(`the list has ${await rows.count()} rows, not 3`);
          const spoken = await rows.evaluateAll((els) =>
            els.map((e) => {
              const copy = e.cloneNode(true);
              copy.querySelectorAll("[aria-hidden=true]").forEach((n) => n.remove());
              return copy.textContent.replace(/\s+/g, " ").trim();
            }),
          );
          const want = [
            "Halo site: median 41 s, middle half 32 s to 48 s, range 22 s to 71 s",
            "Northwind: median 29 s, middle half 24 s to 38 s, range 15 s to 56 s",
            "Atlas portfolio: median 62 s, middle half 55 s to 70 s, range 40 s to 90 s, past the 50 s goal",
          ];
          if (spoken.join("|") !== want.join("|")) throw new Error(`the rows read ${JSON.stringify(spoken)}`);
          const colorOf = (v) =>
            page.evaluate((name) => {
              const probe = document.createElement("span");
              probe.style.color = `var(${name})`;
              document.body.append(probe);
              const c = getComputedStyle(probe).color;
              probe.remove();
              return c;
            }, v);
          const [blue, blueText, strong, accentColor] = [await colorOf("--litt-data-blue"), await colorOf("--litt-data-blue-text"), await colorOf("--litt-line-strong"), await colorOf("--litt-accent")];
          const geo = await list.evaluate((ul) => {
            const foot = ul.parentElement.querySelector(":scope > div[aria-hidden=true] > div").getBoundingClientRect();
            return {
              foot: { x: foot.left, w: foot.width },
              rows: [...ul.querySelectorAll("li")].map((li) => {
                const rail = li.querySelector("[aria-hidden=true]");
                const r = rail.getBoundingClientRect();
                const parts = [...rail.querySelectorAll(":scope > span")];
                const track = parts[0];
                const mid = parts[2];
                const tick = parts[parts.length - 1];
                const t = tick.getBoundingClientRect();
                const line = rail.querySelector("line");
                return {
                  x: r.left,
                  w: r.width,
                  trackH: track.getBoundingClientRect().height,
                  midH: mid.getBoundingClientRect().height,
                  mid: getComputedStyle(mid).backgroundColor,
                  tick: getComputedStyle(tick).backgroundColor,
                  tickW: t.width,
                  tickH: t.height,
                  tickX: t.left + t.width / 2 - r.left,
                  dash: line?.getAttribute("stroke-dasharray") ?? null,
                  stroke: line ? getComputedStyle(line).stroke : null,
                  lineX: line ? line.getBoundingClientRect().left - r.left : null,
                  medRight: li.querySelector(".font-mono").getBoundingClientRect().right,
                };
              }),
            };
          });
          const g = geo.rows;
          if (g.some((r) => Math.abs(r.x - g[0].x) > 0.5 || Math.abs(r.w - g[0].w) > 0.5 || Math.abs(r.medRight - g[0].medRight) > 0.5)) throw new Error(`the rails or the medians do not line up: ${JSON.stringify(g.map((r) => [r.x, r.w, r.medRight]))}`);
          if (Math.abs(geo.foot.x - g[0].x) > 0.5 || Math.abs(geo.foot.w - g[0].w) > 0.5) throw new Error("the scale under the rows is not the rails' width");
          if (g.some((r) => r.trackH !== 4 || r.midH !== 4 || r.tickW !== 2 || r.tickH !== 12)) throw new Error(`the rail is not 4px with a 2 by 12 tick: ${JSON.stringify(g[0])}`);
          if (g.some((r) => r.mid !== blue || r.mid === accentColor)) throw new Error(`the middle half is ${g[0].mid}, not --litt-data-blue (${blue})`);
          if (g.some((r) => r.tick !== blueText)) throw new Error(`the median tick is ${g[0].tick}, not --litt-data-blue-text (${blueText})`);
          /* The domain is 0 to 100 (15 to 90 and a goal at 50, rounded out), so a value sits at its own percent of the rail. */
          if (Math.abs(g[0].tickX - 0.41 * g[0].w) > 1.5 || Math.abs(g[1].tickX - 0.29 * g[1].w) > 1.5) throw new Error(`the medians are at ${g[0].tickX} and ${g[1].tickX} of ${g[0].w}, not 41% and 29%`);
          if (g.some((r) => r.dash !== "4 4" || r.stroke !== strong || Math.abs(r.lineX - 0.5 * r.w) > 1.5)) throw new Error(`the goal line is not a dashed --litt-line-strong at 50%: ${JSON.stringify(g.map((r) => [r.dash, r.stroke, r.lineX]))}`);
          await box.getByText("50 s goal", { exact: true }).waitFor({ state: "visible", timeout: 3000 });
          await box.getByText("100 s", { exact: true }).waitFor({ state: "visible", timeout: 3000 });
          const legend = (await box.locator("p").last().innerText()).replace(/\s+/g, " ");
          if (legend !== "Faint: the full range. Blue: the middle half. Tick: the median.") throw new Error(`the legend reads "${legend}"`);
          const stops = await box.locator("a, button, [tabindex]").count();
          if (stops) throw new Error(`a static spread has ${stops} focus stops`);
          return `3 rows read in words, rails at x ${g[0].x.toFixed(0)} wide ${g[0].w.toFixed(0)}, middle half is --litt-data-blue`;
        });
      }
      if (has("breakdown")) {
        await attempt("breakdown: the split rail reads its parts, segments take the hues in order, rows meter their share, a sixth part folds into Other", async () => {
          const box = page.locator("[data-testid=litt-breakdown]");
          const rail = box.getByRole("img", { name: /^Smoke storage/ });
          await rail.waitFor({ state: "visible", timeout: 8000 });
          const said = await rail.getAttribute("aria-label");
          if (said !== "Smoke storage, 85 of 100 GB: Video 58 GB, Images 24 GB, Fonts 3 GB, 15 GB free") throw new Error(`the split rail reads "${said}"`);
          const colorOf = (v) =>
            page.evaluate((value) => {
              const probe = document.createElement("span");
              probe.style.color = value;
              document.body.append(probe);
              const c = getComputedStyle(probe).color;
              probe.remove();
              return c;
            }, v);
          const [blue, teal, amber, accent, free, other] = [
            await colorOf("var(--litt-data-blue)"),
            await colorOf("var(--litt-data-teal)"),
            await colorOf("var(--litt-data-amber)"),
            await colorOf("var(--litt-accent)"),
            await colorOf("color-mix(in oklab, var(--litt-fg) 12%, transparent)"),
            await colorOf("color-mix(in oklab, var(--litt-fg) 55%, transparent)"),
          ];
          const segs = await rail.evaluate((el) => {
            const r = el.getBoundingClientRect();
            return { width: r.width, kids: [...el.children].map((c) => ({ bg: getComputedStyle(c).backgroundColor, w: c.getBoundingClientRect().width, h: c.getBoundingClientRect().height, end: c.getBoundingClientRect().right - r.left })) };
          });
          /* Video takes blue (teal is Images' own pin), Images teal, Fonts the next free hue (amber), then the free space. */
          const want = [blue, teal, amber, free];
          if (segs.kids.length !== 4 || segs.kids.some((k, i) => k.bg !== want[i] || k.h !== 4)) throw new Error(`the segments are ${segs.kids.map((k) => k.bg).join(" | ")}, not blue, teal, amber, free`);
          if (segs.kids.some((k) => k.bg === accent)) throw new Error("a segment is the accent");
          const air = (segs.width - 6) / 100;
          if (Math.abs(segs.kids[0].w - 58 * air) > 1 || Math.abs(segs.kids[1].w - 24 * air) > 1 || Math.abs(segs.kids[2].w - 3 * air) > 1 || Math.abs(segs.kids[3].end - segs.width) > 1) throw new Error(`the segments are ${segs.kids.map((k) => k.w.toFixed(1)).join("/")}px in a ${segs.width}px rail, not 58/24/3/15 of it`);
          const images = box.getByRole("meter", { name: "Images" });
          const got = await images.evaluate((el) => ({ min: el.getAttribute("aria-valuemin"), max: el.getAttribute("aria-valuemax"), now: el.getAttribute("aria-valuenow"), text: el.getAttribute("aria-valuetext"), share: el.firstElementChild.getBoundingClientRect().width / el.getBoundingClientRect().width, fill: getComputedStyle(el.firstElementChild).backgroundColor, h: el.getBoundingClientRect().height }));
          if (got.min !== "0" || got.max !== "100" || got.now !== "24" || got.text !== "24 GB, 24%") throw new Error(`the Images meter reads ${JSON.stringify(got)}`);
          if (Math.abs(got.share - 0.24) > 0.01 || got.fill !== teal || got.h !== 4) throw new Error(`the Images meter fills ${got.share.toFixed(2)} in ${got.fill} on a ${got.h}px rail, not 0.24 in teal on 4px`);
          const rows = box.getByRole("list", { name: "Smoke storage" }).getByRole("listitem");
          if ((await rows.count()) !== 3) throw new Error(`the storage list has ${await rows.count()} rows, not 3`);
          /* Seven parts: the first five keep a hue, the sixth and seventh fold into one Other in the foreground at 55%. */
          const credits = box.getByRole("list", { name: "Smoke credits" });
          if ((await credits.getByRole("meter").count()) !== 6) throw new Error(`seven parts should draw five rows and Other, found ${await credits.getByRole("meter").count()}`);
          const tail = await box.getByRole("meter", { name: "Other" }).evaluate((el) => ({ now: el.getAttribute("aria-valuenow"), text: el.getAttribute("aria-valuetext"), fill: getComputedStyle(el.firstElementChild).backgroundColor }));
          if (tail.now !== "10" || tail.text !== "10 credits, 8%" || tail.fill !== other) throw new Error(`Other reads ${JSON.stringify(tail)}, not 10 (Webhooks and Redirects) in the foreground at 55%`);
          const folds = await box.getByRole("img", { name: /^Smoke credits/ }).getAttribute("aria-label");
          if (!folds.endsWith("Forms 8 credits, Other 10 credits")) throw new Error(`the credits summary reads "${folds}"`);
          const legend = box.getByRole("list", { name: "Smoke tile" });
          const entries = await legend.getByRole("listitem").evaluateAll((els) =>
            els.map((e) => {
              const swatch = e.querySelector("[aria-hidden=true]").getBoundingClientRect();
              return { text: e.textContent.replace(/\s+/g, " ").trim(), swatch: `${swatch.width}x${swatch.height}` };
            }),
          );
          if (entries.map((e) => e.text).join("|") !== "Video, 58 GB|Images, 24 GB" || entries.some((e) => e.swatch !== "12x4")) throw new Error(`the legend reads ${JSON.stringify(entries)}`);
          return `4 segments in blue, teal, amber and free; Other is ${tail.text}`;
        });
      }
      if (has("pad")) {
        await attempt("pad: two sliders, one tab stop, the keys and a press move the thumb, the tooltip follows", async () => {
          const group = page.getByRole("group", { name: "Your voice" });
          await group.waitFor({ state: "visible", timeout: 8000 });
          const lengthIn = group.getByRole("slider", { name: "Length", exact: true });
          const toneIn = group.getByRole("slider", { name: "Tone", exact: true });
          const start = await lengthIn.getAttribute("aria-valuetext");
          if (start !== "Tone 40, length 30" || (await toneIn.getAttribute("aria-valuetext")) !== start) throw new Error(`the inputs read "${start}", not "Tone 40, length 30"`);
          if ((await lengthIn.getAttribute("tabindex")) !== null || (await toneIn.getAttribute("tabindex")) !== "-1") throw new Error("the x input should be the one tab stop and the y input tabindex -1");
          await lengthIn.focus();
          await page.keyboard.press("ArrowRight");
          await page.keyboard.press("ArrowUp");
          await page.keyboard.press("Shift+ArrowUp");
          await page.waitForTimeout(100);
          const keyed = await lengthIn.getAttribute("aria-valuetext");
          /* From tone 40: ArrowUp is one step of 5, and Shift+ArrowUp ten more, so 95. */
          if (keyed !== "Tone 95, length 35") throw new Error(`ArrowRight, ArrowUp and Shift+ArrowUp gave "${keyed}", not "Tone 95, length 35"`);
          await page.keyboard.press("Home");
          if ((await lengthIn.getAttribute("aria-valuetext")) !== "Tone 95, length 0") throw new Error("Home did not take x to 0");
          const box = group.locator("div[data-no-drag]");
          const b = await box.boundingBox();
          await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
          await page.mouse.down();
          await page.waitForTimeout(150);
          const tip = await box.locator("div[aria-hidden=true]").filter({ hasText: "Tone 50, length 50" }).count();
          await page.mouse.up();
          const pressed = await toneIn.getAttribute("aria-valuetext");
          if (pressed !== "Tone 50, length 50") throw new Error(`a press in the middle gave "${pressed}", not "Tone 50, length 50"`);
          if (!tip) throw new Error("the tooltip did not show the value while dragging");
          const thumb = box.locator("span[aria-hidden=true][style*=left][style*=top]").last();
          const t = await thumb.boundingBox();
          if (Math.abs(t.x + t.width / 2 - (b.x + b.width / 2)) > 1.5 || Math.abs(t.y + t.height / 2 - (b.y + b.height / 2)) > 1.5) throw new Error("the thumb is not under the pointer");
          if (Math.round(t.width) !== 20) throw new Error(`the thumb is ${t.width}px wide, not 20`);
          const fill = await thumb.evaluate((el) => getComputedStyle(el).backgroundColor);
          const accentFill = await page.evaluate(() => {
            const probe = document.createElement("span");
            probe.style.color = "var(--litt-accent)";
            document.body.append(probe);
            const c = getComputedStyle(probe).color;
            probe.remove();
            return c;
          });
          if (fill === accentFill) throw new Error("the thumb is filled with the accent");
          await page.evaluate(() => document.activeElement?.blur());
          return `pressed in the middle gives "${pressed}"`;
        });
      }
      if (has("gauge")) {
        await attempt("gauge is a meter, draws teal ticks with a longer marker in the text tone, and fits a small box", async () => {
          const box = page.locator("[data-testid=litt-gauges]");
          const meter = box.getByRole("meter", { name: "Credits left" });
          await meter.waitFor({ state: "visible", timeout: 8000 });
          const got = await meter.evaluate((el) => ({
            min: el.getAttribute("aria-valuemin"),
            max: el.getAttribute("aria-valuemax"),
            now: el.getAttribute("aria-valuenow"),
            text: el.getAttribute("aria-valuetext"),
            desc: document.getElementById(el.getAttribute("aria-describedby") || "")?.textContent,
            hidden: el.querySelector("svg")?.getAttribute("aria-hidden"),
            shown: el.innerText.replace(/\s+/g, " ").trim(),
          }));
          if (got.min !== "0" || got.max !== "30000" || got.now !== "20830" || got.text !== "20,830 credits") throw new Error(`the meter reads ${JSON.stringify(got)}`);
          if (got.desc !== "2k a day on average" || got.hidden !== "true") throw new Error(`the caption or the hidden ticks are wrong: ${JSON.stringify(got)}`);
          if (got.shown !== "Credits left 20,830 2k a day on average") throw new Error(`the opening reads "${got.shown}"`);
          const colorOf = (v) =>
            page.evaluate((name) => {
              const probe = document.createElement("span");
              probe.style.color = `var(${name})`;
              document.body.append(probe);
              const c = getComputedStyle(probe).color;
              probe.remove();
              return c;
            }, v);
          const [teal, tealText, accent] = [await colorOf("--litt-data-teal"), await colorOf("--litt-data-teal-text"), await colorOf("--litt-accent")];
          const paths = await meter.evaluate((el) =>
            [...el.querySelectorAll("svg path")].map((p) => {
              const d = p.getAttribute("d") || "";
              const first = d.match(/M([-\d.]+) ([-\d.]+)L([-\d.]+) ([-\d.]+)/).slice(1).map(Number);
              return { stroke: getComputedStyle(p).stroke, ticks: (d.match(/M/g) || []).length, length: Math.hypot(first[2] - first[0], first[3] - first[1]), width: getComputedStyle(p).strokeWidth };
            }),
          );
          const [rest, body, marker] = paths;
          if (paths.length !== 3 || rest.ticks !== 15 || body.ticks !== 32 || marker.ticks !== 1) throw new Error(`the ticks split ${paths.map((p) => p.ticks).join("/")}, not 15/32/1`);
          if (body.stroke !== teal || marker.stroke !== tealText) throw new Error(`the ticks are ${body.stroke} and ${marker.stroke}, not the teal mark (${teal}) and text (${tealText}) tones`);
          if ([body.stroke, marker.stroke].includes(accent)) throw new Error("a tick is the accent");
          if (Math.abs(marker.length - body.length - 4) > 0.2 || paths.some((p) => p.width !== "2px")) throw new Error(`the marker is ${(marker.length - body.length).toFixed(2)}px longer and the ticks ${body.width} wide`);
          const small = box.locator("[data-testid=litt-gauge-small]");
          const fit = await small.evaluate((el) => ({ box: el.getBoundingClientRect().width, svg: el.querySelector("svg").getBoundingClientRect().width }));
          if (fit.svg > fit.box + 0.5 || fit.box > 161) throw new Error(`a 320 gauge in a ${fit.box}px box draws ${fit.svg}px wide`);
          return `${rest.ticks}/${body.ticks}/${marker.ticks} ticks, a ${fit.svg.toFixed(0)}px drawing in a ${fit.box.toFixed(0)}px box`;
        });
      }
      if (has("bar-list")) {
        await attempt("bar list reads each row, lines the bars up, fills in the data hue, and its rows press", async () => {
          const box = page.locator("[data-testid=litt-bar-list]");
          const list = box.getByRole("list", { name: "Smoke shortcuts" });
          await list.waitFor({ state: "visible", timeout: 8000 });
          const rows = list.getByRole("listitem");
          if ((await rows.count()) !== 3) throw new Error(`the list has ${await rows.count()} rows, not 3`);
          const spoken = await rows.evaluateAll((els) =>
            els.map((e) => {
              const copy = e.cloneNode(true);
              copy.querySelectorAll("[aria-hidden=true]").forEach((n) => n.remove());
              return copy.textContent.replace(/\s+/g, " ").trim();
            }),
          );
          const want = ["Archive, 412 times, Up 15%, good news", "Reply, 164 times, Down 27%, bad news", "Snooze, 31 times"];
          if (spoken.join("|") !== want.join("|")) throw new Error(`the rows read ${JSON.stringify(spoken)}`);
          const colorOf = (v) =>
            page.evaluate((name) => {
              const probe = document.createElement("span");
              probe.style.color = `var(${name})`;
              document.body.append(probe);
              const c = getComputedStyle(probe).color;
              probe.remove();
              return c;
            }, v);
          const [blue, accent, success, danger] = [await colorOf("--litt-data-blue"), await colorOf("--litt-accent"), await colorOf("--litt-success"), await colorOf("--litt-danger")];
          const geo = await list.evaluate((ol) =>
            [...ol.querySelectorAll("li")].map((li) => {
              const fill = li.querySelector("[style*='width']");
              const rail = fill.parentElement;
              const r = rail.getBoundingClientRect();
              const f = fill.getBoundingClientRect();
              return { x: r.left, w: r.width, h: r.height, share: f.width / r.width, fill: getComputedStyle(fill).backgroundColor, radius: getComputedStyle(rail).borderRadius, value: li.querySelector(".font-mono").getBoundingClientRect().right };
            }),
          );
          const shares = [1, 164 / 412, 31 / 412];
          if (geo.some((g, i) => Math.abs(g.x - geo[0].x) > 0.5 || Math.abs(g.w - geo[0].w) > 0.5 || Math.abs(g.value - geo[0].value) > 0.5 || g.h !== 4 || Math.abs(g.share - shares[i]) > 0.01)) throw new Error(`the bars do not line up or fill to value / max: ${JSON.stringify(geo)}`);
          if (geo.some((g) => g.fill !== blue || g.fill === accent)) throw new Error(`a bar is ${geo[0].fill}, not the blue mark tone (${blue})`);
          const good = await rows.nth(0).getByText("Up 15%").evaluate((el) => getComputedStyle(el).color);
          const bad = await rows.nth(1).getByText("Down 27%").evaluate((el) => getComputedStyle(el).color);
          if (good !== success || bad !== danger) throw new Error(`the deltas are ${good} and ${bad}, not success (${success}) and danger (${danger})`);
          const buttons = list.getByRole("button");
          if ((await buttons.count()) !== 3) throw new Error(`onSelect should make 3 button rows, found ${await buttons.count()}`);
          await buttons.nth(1).hover();
          await page.waitForTimeout(250);
          const hover = await buttons.nth(1).evaluate((el) => getComputedStyle(el).backgroundColor);
          if (hover === "rgba(0, 0, 0, 0)") throw new Error("a pressable row has no hover fill");
          await buttons.nth(0).focus();
          await page.keyboard.press("Enter");
          const first = await box.locator("[data-testid=bar-list-picked]").innerText();
          await page.keyboard.press("Tab");
          await page.keyboard.press("Space");
          const second = await box.locator("[data-testid=bar-list-picked]").innerText();
          if (first !== "Archive" || second !== "Reply") throw new Error(`Enter picked "${first}" and Space "${second}", not Archive and Reply`);
          await page.evaluate(() => document.activeElement?.blur());
          return `${geo.length} aligned rows, bars ${geo[0].fill}`;
        });
      }
      if (has("timeline")) {
        await attempt("timeline reads in order, draws long steps as bars in the phase hue, and its strip shows a tooltip", async () => {
          const box = page.locator("[data-testid=litt-timeline]");
          const list = box.getByRole("list", { name: "Smoke run steps" });
          await list.waitFor({ state: "visible", timeout: 8000 });
          await page.waitForTimeout(600);
          /* What a screen reader reads: the text that is not aria-hidden, one cell after another. */
          const reads = (li) => {
            const parts = [];
            const walk = (n) => {
              if (n.nodeType === 3) return void parts.push(n.textContent);
              if (n.nodeType !== 1 || n.getAttribute("aria-hidden") === "true") return;
              for (const c of n.childNodes) walk(c);
              if (getComputedStyle(n).display !== "inline") parts.push(" ");
            };
            walk(li);
            return parts.join("").replace(/\s+/g, " ").replace(/ ,/g, ",").trim();
          };
          const steps = list.locator("li[data-step]");
          const n = await steps.count();
          if (n !== 5) throw new Error(`expected 5 steps, found ${n}`);
          const want = [
            [2, "00:02, Run build commands, done, 19 seconds, was 31 seconds last run"],
            [1, "00:02, Restore build cache, skipped"],
            [4, "00:33, Assign smoke.studio, running"],
          ];
          for (const [i, text] of want) {
            const got = await steps.nth(i).evaluate(reads);
            if (got !== text) throw new Error(`step ${i} reads "${got}", not "${text}"`);
          }
          const result = await list.locator(":scope > li").last().evaluate(reads);
          if (result !== "Live on smoke.studio, success, 33 seconds") throw new Error(`the result reads "${result}"`);
          const phases = await list.locator("ol[aria-labelledby]").count();
          if (phases !== 2) throw new Error(`expected 2 labelled phase lists, found ${phases}`);

          /* A 19 second step is a 76px bar in the phase's mark tone, with the last run's 124px ghost beside it. */
          const paint = (name) =>
            page.evaluate((hue) => {
              const probe = document.createElement("span");
              probe.style.backgroundColor = `var(--litt-data-${hue})`;
              document.body.append(probe);
              const c = getComputedStyle(probe).backgroundColor;
              probe.remove();
              return c;
            }, name);
          const bar = list.locator("[style*='height: 76px']");
          const ghost = list.locator("[style*='height: 124px']");
          if ((await bar.count()) !== 1 || (await ghost.count()) !== 1) throw new Error("the 19s bar or the 31s ghost is missing");
          const tall = await bar.evaluate((el) => Math.round(el.getBoundingClientRect().height));
          const row = await steps.nth(2).evaluate((li) => Math.round(li.getBoundingClientRect().height));
          if (tall !== 76 || row < 124) throw new Error(`the bar is ${tall}px and its row ${row}px`);
          const barColor = await bar.evaluate((el) => getComputedStyle(el).backgroundColor);
          if (barColor !== (await paint("blue"))) throw new Error(`the bar is ${barColor}, not the blue mark tone`);
          await list.getByText("was 31s").waitFor({ state: "visible", timeout: 3000 });
          const stroke = await steps.nth(0).locator("svg").evaluate((el) => getComputedStyle(el).strokeWidth);
          if (stroke !== "1.5px") throw new Error(`status icons are ${stroke} strokes, not 1.5px`);
          const moving = await list.evaluate((el) => document.getAnimations().filter((a) => el.contains(a.effect?.target)).length);
          if (moving) throw new Error(`${moving} animation(s) run in the timeline, and nothing should move`);

          /* The strip: a summary, segments sized by seconds in the phase hues, a tooltip on hover. */
          const strip = box.getByRole("img", { name: "Smoke run: Build 21 seconds, Deploy 12 seconds, 33 seconds in all" });
          await strip.waitFor({ state: "visible", timeout: 3000 });
          const segs = strip.locator("div.overflow-hidden > span");
          if ((await segs.count()) !== 3) throw new Error(`expected 3 segments, found ${await segs.count()}`);
          const colors = await segs.evaluateAll((els) => els.map((el) => getComputedStyle(el).backgroundColor));
          const [blue, teal] = [await paint("blue"), await paint("teal")];
          if (colors[0] !== blue || colors[1] !== blue || colors[2] !== teal) throw new Error(`segments are ${colors.join(" / ")}`);
          const at = await strip.boundingBox();
          await page.mouse.move(at.x + at.width * 0.3, at.y + 44);
          const tip = strip.locator("div[aria-hidden=true]").filter({ hasText: "Run build commands" });
          await tip.waitFor({ state: "visible", timeout: 3000 });
          const said = (await tip.innerText()).replace(/\s+/g, " ").trim();
          if (!said.includes("19s")) throw new Error(`the tooltip says "${said}"`);
          await page.keyboard.press("Escape");
          await page.waitForTimeout(400);
          if (await tip.count()) throw new Error("Esc did not hide the tooltip");
          await page.mouse.move(5, 5);
          return `5 steps read in order, ${tall}px bar in ${blue}, 3 segments`;
        });
      }
      if (has("token-input")) {
        await attempt("token input folds to +2, validates, adds on a comma, removes by key and posts its values", async () => {
          const form = page.locator("[data-testid=litt-token-input]");
          const input = form.getByRole("textbox", { name: "Mail from" });
          await input.waitFor({ state: "visible", timeout: 5000 });
          const field = input.locator("xpath=ancestor::div[contains(@class,'cursor-text')][1]");
          const color = (name) =>
            page.evaluate((n) => {
              const probe = document.createElement("span");
              probe.style.color = `var(${n})`;
              document.body.append(probe);
              const c = getComputedStyle(probe).color;
              probe.remove();
              return c;
            }, name);
          const posted = () => page.evaluate(() => new FormData(document.querySelector("[data-testid=litt-token-input]")).getAll("from").join("|"));
          const note = () => input.evaluate((el) => document.getElementById(el.getAttribute("aria-describedby") ?? "")?.textContent ?? "");
          await page.waitForTimeout(500);
          const more = field.locator("li[aria-label='2 more']");
          if ((await field.locator("li").count()) !== 2 || (await more.textContent()) !== "+2") throw new Error("an unfocused field with three values and collapseAfter 1 should show one token and +2");
          const box = await field.boundingBox();
          const tokenH = await field.locator("li").first().evaluate((el) => Math.round(el.getBoundingClientRect().height));
          const x = await form.getByRole("button", { name: "Remove @stripe.com" }).boundingBox();
          if (Math.round(box.height) !== 44 || tokenH !== 24 || Math.round(x.width) !== 24) throw new Error(`field ${box.height}px, token ${tokenH}px, remove button ${x.width}px: expected 44, 24 and 24`);
          const edge = await field.evaluate((el) => getComputedStyle(el).boxShadow);
          const line = await color("--litt-line-control");
          if (!edge.includes(line)) throw new Error(`the field edge is "${edge}", not --litt-line-control (${line})`);
          await field.click({ position: { x: box.width - 20, y: box.height / 2 } });
          await page.waitForTimeout(500);
          if ((await field.locator("li").count()) !== 3) throw new Error("focusing the field should open it to all three tokens");
          const ring = await field.evaluate((el) => getComputedStyle(el).boxShadow);
          const focus = await color("--litt-focus");
          if (!ring.includes(focus)) throw new Error(`the focused field has no --litt-focus ring: "${ring}"`);
          await page.keyboard.type("invoice.com,");
          await page.waitForTimeout(400);
          if ((await posted()) !== "@stripe.com|ramp.com|brex.com|invoice.com") throw new Error(`a comma should add invoice.com; the form posts "${await posted()}"`);
          const said = await form.locator("[role=status]").textContent();
          if (said !== "Added invoice.com") throw new Error(`the live region says "${said}"`);
          await page.keyboard.type("bad value");
          await page.keyboard.press("Enter");
          if ((await input.inputValue()) !== "bad value" || (await input.getAttribute("aria-invalid")) !== "true") throw new Error("a rejected value should stay in the input and mark it invalid");
          if (!(await note()).includes("has characters a domain cannot")) throw new Error(`the message under the field reads "${await note()}"`);
          await input.fill("");
          if ((await input.getAttribute("aria-invalid")) !== null) throw new Error("changing the text should clear the rejection");
          await page.keyboard.press("Backspace");
          await page.waitForTimeout(300);
          if ((await posted()) !== "@stripe.com|ramp.com|brex.com") throw new Error(`Backspace in an empty input should remove the last token; the form posts "${await posted()}"`);
          await page.keyboard.press("ArrowLeft");
          const onButton = await page.evaluate(() => document.activeElement?.getAttribute("aria-label"));
          if (onButton !== "Remove brex.com") throw new Error(`ArrowLeft focused "${onButton}", not "Remove brex.com"`);
          await page.keyboard.press("ArrowRight");
          if (!(await input.evaluate((el) => el === document.activeElement))) throw new Error("ArrowRight past the last remove button should return to the input");
          await form.getByRole("button", { name: "Remove @stripe.com" }).click();
          await page.waitForTimeout(300);
          if ((await posted()) !== "ramp.com|brex.com") throw new Error(`the x should remove @stripe.com; the form posts "${await posted()}"`);
          await page.screenshot({ path: path.join(shotsDir, `${tag}-${theme}-token-input.png`) });
          await page.evaluate(() => document.activeElement?.blur());
          return "+2, 44/24/24px, comma, validate, keys, posted values";
        });
      }
      if (has("heatmap")) {
        await attempt("heatmap: a labelled grid of named dots in one hue, one tab stop, arrows and Esc", async () => {
          const box = page.locator("[data-testid=litt-heatmap]");
          const grid = box.getByRole("grid", { name: "Deploys per day" });
          await grid.waitFor({ state: "visible", timeout: 8000 });
          const rows = await grid.getByRole("row").count();
          if (rows !== 2) throw new Error(`the grid has ${rows} rows, not 2`);
          const dots = await grid.locator("[data-r]").count();
          if (dots !== 10) throw new Error(`the grid has ${dots} dots, not 10`);
          const described = await grid.getAttribute("aria-describedby");
          const summary = await page.evaluate((id) => document.getElementById(id)?.textContent, described);
          if (summary !== "Deploys per day, 37 in all, most on Week 1, 4 Oct with 9") throw new Error(`the summary reads "${summary}"`);
          const stops = await grid.locator("[data-r][tabindex='0']").count();
          if (stops !== 1) throw new Error(`expected one tab stop, found ${stops}`);
          const nullName = await grid.locator("[data-r='0'][data-c='4']").getAttribute("aria-label");
          if (nullName !== "Week 1, 5 Oct, no data") throw new Error(`the empty dot is named "${nullName}"`);
          const probe = (value) =>
            page.evaluate((v) => {
              const el = document.createElement("span");
              el.style.color = v;
              document.body.append(el);
              const c = getComputedStyle(el).color;
              el.remove();
              return c;
            }, value);
          const teal = await probe("var(--litt-data-teal)");
          const accentColor = await probe("var(--litt-accent)");
          const top = await grid.locator("[data-r='0'][data-c='3']").evaluate((el) => getComputedStyle(el).backgroundColor);
          if (top !== teal) throw new Error(`the fullest dot is ${top}, not --litt-data-teal (${teal})`);
          if (top === accentColor) throw new Error("a dot is the accent");
          const empty = await grid.locator("[data-r='0'][data-c='0']").evaluate((el) => getComputedStyle(el).backgroundColor);
          if (!/\/ 0\.08\)$/.test(empty)) throw new Error(`a zero dot is ${empty}, not the foreground at 8%`);
          const size = await grid.locator("[data-r='0'][data-c='3']").evaluate((el) => [el.getBoundingClientRect().width, getComputedStyle(el).borderTopLeftRadius]);
          if (size[0] !== 8 || parseFloat(size[1]) < 4) throw new Error(`a dot is ${size[0]}px with radius ${size[1]}, not an 8px circle`);
          const legend = await box.locator("[aria-hidden=true]").filter({ hasText: "Less" }).filter({ hasText: "More" }).count();
          if (!legend) throw new Error("no legend from Less to More");
          const total = await box.getByRole("gridcell", { name: "Total 21" }).count();
          if (!total) throw new Error("the row total is not a cell");
          await grid.locator("[data-r][tabindex='0']").focus();
          const first = await page.evaluate(() => document.activeElement?.getAttribute("aria-label"));
          if (first !== "Week 1, 4 Oct, 9 deploys") throw new Error(`the tab stop is "${first}", not "Week 1, 4 Oct, 9 deploys"`);
          await box.locator("div[aria-hidden=true]").filter({ hasText: "4 Oct" }).filter({ hasText: "9 deploys" }).first().waitFor({ state: "visible", timeout: 3000 });
          const read = async () => page.evaluate(() => document.activeElement?.getAttribute("aria-label"));
          await page.keyboard.press("ArrowDown");
          const down = await read();
          if (down !== "Week 2, 4 Oct, 3 deploys") throw new Error(`ArrowDown landed on "${down}"`);
          await page.keyboard.press("ArrowLeft");
          const left = await read();
          if (left !== "Week 2, 3 Oct, 7 deploys") throw new Error(`ArrowLeft landed on "${left}"`);
          await page.keyboard.press("Home");
          const home = await read();
          if (home !== "Week 2, 1 Oct, 4 deploys") throw new Error(`Home landed on "${home}"`);
          await page.keyboard.press("Control+End");
          const end = await read();
          if (end !== "Week 2, 5 Oct, 6 deploys") throw new Error(`Ctrl+End landed on "${end}"`);
          await page.keyboard.press("Escape");
          await page.waitForTimeout(400);
          const stillTip = await box.locator("div[aria-hidden=true]").filter({ hasText: "5 Oct" }).filter({ hasText: "6 deploys" }).count();
          if (stillTip) throw new Error("Esc did not hide the tooltip");
          if ((await read()) !== "Week 2, 5 Oct, 6 deploys") throw new Error("Esc moved focus");
          await page.evaluate(() => document.activeElement?.blur());
          const dotBox = await grid.locator("[data-r='1'][data-c='2']").boundingBox();
          await page.mouse.move(dotBox.x + 4, dotBox.y + 4);
          await box.locator("div[aria-hidden=true]").filter({ hasText: "3 Oct" }).filter({ hasText: "7 deploys" }).first().waitFor({ state: "visible", timeout: 3000 });
          const ring = await grid.locator("[data-r='1'][data-c='2']").evaluate((el) => getComputedStyle(el).outlineWidth);
          if (ring !== "1px") throw new Error(`a hovered dot has a ${ring} ring, not 1px`);
          await page.mouse.move(5, 5);
          return `fullest dot ${top}, summary read, ${dots} dots`;
        });
      }
      if (has("dot-plot")) {
        await attempt("dot plot splits the dots at the goal, reads right and moves with the keys", async () => {
          const box = page.locator("[data-testid=litt-dotplot]");
          const svg = box.locator("svg[role=img]").first();
          await svg.waitFor({ state: "visible", timeout: 8000 });
          await page.waitForTimeout(700);
          const label = await svg.getAttribute("aria-label");
          if (label !== "Build times, 60 builds: median 40 s, 68% within the 50 s goal") throw new Error(`the summary reads "${label}"`);
          const legend = (await box.locator("ul").first().innerText()).replace(/\s+/g, " ");
          if (!/Within goal 68%/.test(legend) || !/Over 32%/.test(legend)) throw new Error(`the legend reads "${legend}"`);
          const rows = await box.locator("table.sr-only tbody tr").count();
          if (rows < 20) throw new Error(`the hidden table has ${rows} rows`);
          const edges = await box.evaluate((root) => {
            const dots = [...root.querySelectorAll("svg[role=img] circle")].filter((c) => c.getAttribute("r") === "3");
            const xs = dots.map((c) => c.getBoundingClientRect().x);
            const first = dots[xs.indexOf(Math.min(...xs))];
            const last = dots[xs.indexOf(Math.max(...xs))];
            const line = root.querySelector("svg[role=img] line[stroke-dasharray]");
            return {
              count: dots.length,
              first: getComputedStyle(first).fill,
              last: getComputedStyle(last).fill,
              dashed: !!line,
              root: ["--litt-data-blue", "--litt-fg-subtle"].map((v) => {
                const probe = document.createElement("i");
                probe.style.color = `var(${v})`;
                document.body.append(probe);
                const c = getComputedStyle(probe).color;
                probe.remove();
                return c;
              }),
            };
          });
          if (edges.count < 30) throw new Error(`only ${edges.count} dots drew`);
          if (!edges.dashed) throw new Error("the goal line is missing");
          const rgb = (c) => page.evaluate(`(${COLOR_TO_RGB})(${JSON.stringify(c)})`);
          const [first, last, blue, subtle] = [await rgb(edges.first), await rgb(edges.last), await rgb(edges.root[0]), await rgb(edges.root[1])];
          if (!near(first, blue, 2)) throw new Error(`a dot inside the goal is rgb(${first.slice(0, 3)}), the data blue is rgb(${blue.slice(0, 3)})`);
          if (!near(last, subtle, 2)) throw new Error(`a dot past the goal is rgb(${last.slice(0, 3)}), the subtle foreground is rgb(${subtle.slice(0, 3)})`);
          if (near(first, accent[theme]) || near(last, accent[theme])) throw new Error("a dot is the accent");
          const stops = await box.locator("[role=group] button[tabindex='0']").count();
          if (stops !== 1) throw new Error(`the plot should have one tab stop, found ${stops}`);
          await box.locator("[role=group] button").first().focus();
          const start = await page.evaluate(() => document.activeElement?.getAttribute("aria-label"));
          await page.keyboard.press("ArrowRight");
          const name = await page.evaluate(() => document.activeElement?.getAttribute("aria-label"));
          if (!/: \d+ builds?$/.test(name ?? "") || name === start) throw new Error(`ArrowRight landed on "${name}" from "${start}"`);
          const count = name.split(": ")[1];
          await box.locator("div[aria-hidden=true]").filter({ hasText: count }).first().waitFor({ state: "visible", timeout: 3000 });
          await page.keyboard.press("Escape");
          await page.waitForTimeout(400);
          if (await box.locator("div[aria-hidden=true]").filter({ hasText: count }).count()) throw new Error("Esc did not hide the tooltip");
          await page.evaluate(() => document.activeElement?.blur());
          return `${edges.count} dots, hue inside the goal and gray past it`;
        });
      }
      if (has("avatar")) {
        await attempt("avatars: initials named for a screen reader, a hue from the name, a group that overlaps and counts", async () => {
          const box = page.locator("[data-testid=litt-avatars]");
          const one = box.getByTestId("avatar-stripe");
          await one.waitFor({ state: "visible", timeout: 5000 });
          if ((await one.getAttribute("role")) !== "img" || (await one.getAttribute("aria-label")) !== "Stripe") throw new Error("initials are not a role=img named Stripe");
          if ((await one.innerText()).trim() !== "S") throw new Error(`Stripe shows "${(await one.innerText()).trim()}", not S`);
          const dims = await one.evaluate((el) => {
            const r = el.getBoundingClientRect();
            return { w: Math.round(r.width), h: Math.round(r.height), radius: parseFloat(getComputedStyle(el).borderTopLeftRadius) };
          });
          if (dims.w !== 32 || dims.h !== 32 || dims.radius < 16) throw new Error(`the default avatar is ${dims.w} by ${dims.h} with a ${dims.radius}px radius`);
          const colors = (id) => box.getByTestId(id).evaluate((el) => ({ color: getComputedStyle(el).color, fill: getComputedStyle(el).backgroundColor }));
          const [first, again, rose] = [await colors("avatar-stripe"), await colors("avatar-stripe-2"), await colors("avatar-rose")];
          if (first.color !== again.color || first.fill !== again.fill) throw new Error("the same name got two different hues");
          const want = await page.evaluate(() => {
            const probe = document.createElement("span");
            document.body.append(probe);
            probe.style.color = "var(--litt-data-rose-text)";
            probe.style.backgroundColor = "var(--litt-data-rose-tint)";
            const out = { color: getComputedStyle(probe).color, fill: getComputedStyle(probe).backgroundColor };
            probe.remove();
            return out;
          });
          if (rose.color !== want.color || rose.fill !== want.fill) throw new Error(`hue="rose" is ${rose.color} on ${rose.fill}, not the rose text tone on its tint`);
          if ((await box.getByTestId("avatar-rose").innerText()).trim() !== "S") throw new Error("@stripe.com did not skip the @ for its initial");
          const quiet = box.getByTestId("avatar-decorative");
          if ((await quiet.getAttribute("aria-hidden")) !== "true" || (await quiet.getAttribute("aria-label"))) throw new Error("a decorative avatar is still labelled or not hidden");
          if (await box.getByRole("img", { name: "Ramp" }).count()) throw new Error("a decorative avatar is still in the accessibility tree");
          const group = box.getByRole("group", { name: "Smoke team, 6 people" });
          const faces = group.getByRole("img");
          const names = await faces.evaluateAll((els) => els.map((e) => e.getAttribute("aria-label")));
          if (names.join("|") !== "Ines Duarte|Marlow Labs|Sidebar Weekly|3 more") throw new Error(`the group reads ${names.join("|")}`);
          if ((await group.innerText()).replace(/\s+/g, " ").trim() !== "ID ML SW +3") throw new Error(`the group shows "${(await group.innerText()).replace(/\s+/g, " ").trim()}"`);
          const [a, b] = [await faces.nth(0).boundingBox(), await faces.nth(1).boundingBox()];
          const lap = Math.round(a.x + a.width - b.x);
          if (Math.abs(lap - 8) > 1) throw new Error(`avatars overlap by ${lap}px, not a quarter of 32`);
          const wrap = (n) => faces.nth(n).evaluate((el) => ({ z: getComputedStyle(el.parentElement).zIndex, ring: getComputedStyle(el.parentElement).boxShadow }));
          const [w0, w1] = [await wrap(0), await wrap(1)];
          if (!(Number(w0.z) > Number(w1.z))) throw new Error(`the first avatar is not on top (z ${w0.z} against ${w1.z})`);
          if (!/\b2px\b/.test(w0.ring)) throw new Error(`the ring is "${w0.ring}"`);
          return `32px, ${lap}px overlap, ${names.length} marks`;
        });
      }
      if (has("callout")) {
        await attempt("callout: a note with its tone in the icon only, the action below the text when narrow, and a close that unmounts", async () => {
          const box = page.locator("[data-testid=litt-callout]");
          const note = box.getByRole("note");
          await note.waitFor({ state: "visible", timeout: 5000 });
          const said = ((await note.textContent()) ?? "").replace(/\s+/g, " ").trim();
          if (!said.startsWith("Warning: Plan renews in 3 days")) throw new Error(`the note reads "${said}"`);
          const hidden = await note.locator("p > span").first().boundingBox();
          if (!hidden || hidden.width > 1.5) throw new Error("the Warning: prefix is visible");
          const probe = await page.evaluate(() => {
            const el = document.createElement("span");
            document.body.append(el);
            el.style.color = "var(--litt-warning)";
            el.style.backgroundColor = "var(--litt-surface-1)";
            const out = { warning: getComputedStyle(el).color, surface: getComputedStyle(el).backgroundColor };
            el.remove();
            return out;
          });
          const icon = await note.locator("svg").first().evaluate((el) => getComputedStyle(el).color);
          if (icon !== probe.warning) throw new Error(`the icon is ${icon}, not --litt-warning (${probe.warning})`);
          const title = await note.locator("p").first().evaluate((el) => getComputedStyle(el).color);
          if (title === probe.warning) throw new Error("the title took the status color");
          const surface = await note.locator("xpath=./*").first().evaluate((el) => {
            const cs = getComputedStyle(el);
            return { fill: cs.backgroundColor, left: cs.borderLeftWidth, shadow: cs.boxShadow };
          });
          if (surface.fill !== probe.surface) throw new Error(`the callout fill is ${surface.fill}, not --litt-surface-1`);
          if (surface.left !== "0px") throw new Error(`the callout has a ${surface.left} left border`);
          const [text, action, close] = [await note.locator("p").nth(1).boundingBox(), await box.getByTestId("callout-action").boundingBox(), await note.getByRole("button", { name: "Dismiss" }).boundingBox()];
          if (action.y < text.y + text.height - 1) throw new Error("at 20rem wide the action did not drop below the text");
          if (close.y > text.y) throw new Error("the close button is not at the top end");
          await note.getByRole("button", { name: "Dismiss" }).click();
          await note.waitFor({ state: "detached", timeout: 3000 });
          return "warning icon, hairline surface, action below, close unmounts";
        });
      }
      if (has("app-shell")) {
        await attempt("app shell: a 240px sidebar as tall as the page, 36px rows, the current page marked", async () => {
          const shell = page.locator("[data-testid=litt-shell]");
          const nav = shell.getByRole("navigation", { name: "Smoke" });
          await nav.waitFor({ state: "visible", timeout: 5000 });
          const current = await nav.getByRole("link", { name: "Overview" }).getAttribute("aria-current");
          if (current !== "page") throw new Error(`aria-current is ${current}`);
          const heights = await nav.locator("a").evaluateAll((as) => as.map((a) => Math.round(a.getBoundingClientRect().height)));
          if (heights.some((h) => h !== 36)) throw new Error(`rows are ${heights.join("/")}px, not 36`);
          const column = await nav.evaluate((n) => {
            let el = n;
            while (el && getComputedStyle(el).position !== "sticky") el = el.parentElement;
            const col = el.parentElement.getBoundingClientRect();
            return { width: Math.round(col.width), height: col.height, edge: getComputedStyle(el.parentElement).borderRightWidth };
          });
          const main = await shell.locator("main").boundingBox();
          if (column.width !== 240) throw new Error(`the sidebar column is ${column.width}px wide, not 240`);
          if (column.height < main.height - 1) throw new Error(`the sidebar column is ${column.height}px tall and the page ${main.height}px`);
          if (column.edge !== "1px") throw new Error(`the sidebar edge is ${column.edge}, not a hairline`);
          return `${column.width}px wide, rows ${heights.join("/")}px`;
        });
      }
      if (has("pagination")) {
        await attempt("pagination reports the range and disables its ends", async () => {
          const nav = page.getByRole("navigation", { name: "Smoke pages" });
          const range = async () => (await nav.locator("p").innerText()).trim();
          if ((await range()) !== "21 to 40 of 143") throw new Error(`the range reads "${await range()}"`);
          await nav.getByRole("button", { name: "Next" }).click();
          if ((await range()) !== "41 to 60 of 143") throw new Error(`after Next the range reads "${await range()}"`);
          await nav.getByRole("button", { name: "Previous" }).click();
          await nav.getByRole("button", { name: "Previous" }).click();
          if ((await range()) !== "1 to 20 of 143") throw new Error(`on the first page the range reads "${await range()}"`);
          if (!(await nav.getByRole("button", { name: "Previous" }).isDisabled())) throw new Error("Previous is not disabled on the first page");
          return "21 to 40, 41 to 60, 1 to 20";
        });
      }
      if (has("popover")) {
        await attempt("popover opens, is glass, and closes", async () => {
          await page.click("[data-testid=popover-trigger]");
          const pop = page.getByRole("dialog", { name: "Litt popover" });
          await pop.waitFor({ state: "visible", timeout: 5000 });
          await page.getByText("Popover body").waitFor({ state: "visible", timeout: 3000 });
          await page.waitForTimeout(700);
          const info = await pop.evaluate((el) => {
            const before = getComputedStyle(el, "::before");
            return { glass: el.classList.contains("litt-glass"), blur: before.backdropFilter || before.webkitBackdropFilter || "", opacity: getComputedStyle(el).opacity, focusInside: el.contains(document.activeElement) };
          });
          await page.screenshot({ path: path.join(shotsDir, `${tag}-${theme}-popover.png`) });
          if (!info.glass) throw new Error('the popover panel has no ".litt-glass" class');
          if (!info.blur || info.blur === "none") throw new Error(`.litt-glass has no backdrop-filter: ${JSON.stringify(info)}`);
          if (info.opacity !== "1") throw new Error(`the popover did not finish its entrance: ${JSON.stringify(info)}`);
          if (!info.focusInside) throw new Error("focus did not move into the popover");
          await page.keyboard.press("Escape");
          await pop.waitFor({ state: "hidden", timeout: 4000 });
          const back = await page.evaluate(() => document.activeElement?.getAttribute("data-testid"));
          if (back !== "popover-trigger") throw new Error(`focus did not return to the trigger (it is on ${back})`);
        });
      }

      if (has("dialog")) {
        await attempt("dialog opens", async () => {
          await page.click("[data-testid=dialog-trigger]");
          const dlg = page.getByRole("dialog");
          await dlg.waitFor({ state: "visible", timeout: 5000 });
          await page.getByText("Dialog body").waitFor({ state: "visible", timeout: 3000 });
          await page.waitForTimeout(600);
          await page.screenshot({ path: path.join(shotsDir, `${tag}-${theme}-dialog.png`) });
          await page.keyboard.press("Escape");
          await dlg.waitFor({ state: "hidden", timeout: 4000 }).catch(() => {});
        });
      }
      if (has("command-menu")) {
        await attempt("command menu opens", async () => {
          await page.click("[data-testid=cmd-trigger]");
          await page.getByRole("dialog").waitFor({ state: "visible", timeout: 5000 });
          await page.getByText("Settings page").first().waitFor({ state: "visible", timeout: 3000 });
          await page.waitForTimeout(500);
          await page.screenshot({ path: path.join(shotsDir, `${tag}-${theme}-command.png`) });
          await page.keyboard.press("Escape");
          await page
            .getByRole("dialog")
            .waitFor({ state: "hidden", timeout: 4000 })
            .catch(() => {});
        });
      }
      if (has("toast")) {
        await attempt("toast shows", async () => {
          await page.click("[data-testid=toast-trigger]");
          await page.getByText("Saved from the smoke page").waitFor({ state: "visible", timeout: 5000 });
          await page.waitForTimeout(500);
          await page.screenshot({ path: path.join(shotsDir, `${tag}-${theme}-toast.png`) });
        });
      }

      await page.waitForTimeout(300);
      record(t("no console errors"), errors.length === 0, errors.slice(0, 5).join(" | "));
      allErrors.push(...errors.map((e) => `${theme}: ${e}`));
    } finally {
      await context.close();
    }
  }

  if (litt && has("button")) await darkModeContract(browser, url, accent, record);
  if (has("app-shell")) await shellOnAPhone(browser, url, record);
  return { checks, errors: allErrors };
}

/**
 * litt's dark mode model in a host: [data-theme] and the shadcn/next-themes classes (.dark, .light) beat the
 * system setting, and with none of them set the system setting decides. Read from the primary Button's fill.
 */
async function darkModeContract(browser, url, accent, record) {
  const { context, page } = await openPage(browser, url, "light");
  try {
    const fill = () => page.evaluate(`(${COLOR_TO_RGB})(getComputedStyle(document.querySelector("[data-testid=litt-primary]")).backgroundColor)`);
    const cases = [
      { name: "nothing set, system light", scheme: "light", want: "light" },
      { name: "nothing set, system dark", scheme: "dark", want: "dark" },
      { name: ".dark beats system light", scheme: "light", cls: "dark", want: "dark" },
      { name: ".light beats system dark", scheme: "dark", cls: "light", want: "light" },
      { name: '[data-theme="dark"] beats system light', scheme: "light", attr: "dark", want: "dark" },
      { name: '[data-theme="light"] beats system dark', scheme: "dark", attr: "light", want: "light" },
    ];
    for (const c of cases) {
      try {
        await page.emulateMedia({ colorScheme: c.scheme });
        await page.evaluate(
          ({ cls, attr }) => {
            const el = document.documentElement;
            el.classList.remove("dark", "light");
            el.removeAttribute("data-theme");
            if (cls) el.classList.add(cls);
            if (attr) el.setAttribute("data-theme", attr);
          },
          { cls: c.cls ?? null, attr: c.attr ?? null },
        );
        await page.evaluate(() => Promise.all(document.getAnimations().map((a) => a.finished.catch(() => {}))));
        await page.waitForTimeout(250);
        const got = await fill();
        const want = accent[c.want];
        record(
          `dark mode: ${c.name}`,
          near(got, want),
          near(got, want) ? `rgb(${want})` : `primary Button is rgb(${got.slice(0, 3)}), expected the ${c.want} accent rgb(${want})`,
        );
      } catch (e) {
        record(`dark mode: ${c.name}`, false, String(e.message || e).split("\n")[0]);
      }
    }
  } finally {
    await context.close();
  }
}

/**
 * The app shell on a 390px touch screen: no sidebar, a 44px menu button, and the nav in the bottom sheet that
 * closes when a link is picked.
 */
async function shellOnAPhone(browser, url, record) {
  const { context, page } = await openPage(browser, url, "light", { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const name = "app shell on a phone: no sidebar, a menu button, a sheet that closes on a link";
  try {
    const shell = page.locator("[data-testid=litt-shell]");
    await shell.scrollIntoViewIfNeeded();
    if (await shell.getByRole("navigation", { name: "Smoke" }).count()) throw new Error("the sidebar is still on the page");
    // Radix hides the page from the accessibility tree while the sheet is open, so find the button by its label.
    const button = shell.locator("button[aria-label='Open navigation']");
    const box = await button.boundingBox();
    if (!box || box.height < 44) throw new Error(`the menu button is ${box?.height}px tall`);
    if ((await button.getAttribute("aria-expanded")) !== "false") throw new Error("aria-expanded is not false while closed");
    await button.tap();
    const dialog = page.getByRole("dialog", { name: "Navigation" });
    await dialog.waitFor({ state: "visible", timeout: 5000 });
    await page.waitForTimeout(700);
    if ((await button.getAttribute("aria-expanded")) !== "true") throw new Error("aria-expanded is not true while open");
    const rows = await dialog.locator("nav a").evaluateAll((as) => as.map((a) => Math.round(a.getBoundingClientRect().height)));
    if (!rows.length || rows.some((h) => h < 44)) throw new Error(`the sheet's rows are ${rows.join("/")}px`);
    await dialog.getByRole("link", { name: "Projects" }).tap();
    await dialog.waitFor({ state: "hidden", timeout: 4000 });
    record(name, true, `button ${box.height}px, rows ${rows.join("/")}px`);
  } catch (e) {
    record(name, false, String(e.message || e).split("\n")[0]);
  } finally {
    await context.close();
  }
}

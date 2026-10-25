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
    needs: ["Table", "TableHeader", "TableBody", "TableRow", "TableHead", "TableCell", "TableVirtualBody", "TableSelectHead", "TableSelectCell", "useRowSelection"],
    top: [`const SMOKE_ROWS = Array.from({ length: 2000 }, (_, i) => ({ id: "r" + i, name: "Deploy " + (i + 1), seconds: 20 + (i % 60) }));`],
    state: [`const [tableIds] = useState(() => SMOKE_ROWS.map((r) => r.id));`, `const tableSel = useRowSelection(tableIds);`],
    jsx: `<div className="grid w-full max-w-md gap-4" data-testid="litt-table-wrap">
          <Table label="Many deploys" className="max-h-64" stickyColumns={2}>
            <TableHeader><TableRow><TableSelectHead state={tableSel.head} onToggle={tableSel.toggleAll} /><TableHead resizable>Deploy</TableHead><TableHead numeric>Build time</TableHead></TableRow></TableHeader>
            <TableVirtualBody count={SMOKE_ROWS.length} columns={3}>
              {(i) => <TableRow key={SMOKE_ROWS[i].id} selected={tableSel.isSelected(SMOKE_ROWS[i].id)}><TableSelectCell label={"Select " + SMOKE_ROWS[i].name} checked={tableSel.isSelected(SMOKE_ROWS[i].id)} onToggle={(range) => tableSel.toggle(SMOKE_ROWS[i].id, range)} /><TableCell primary>{SMOKE_ROWS[i].name}</TableCell><TableCell numeric>{SMOKE_ROWS[i].seconds} s</TableCell></TableRow>}
            </TableVirtualBody>
          </Table>
          <Table label="Paged deploys" className="max-h-40">
            <TableHeader><TableRow><TableHead>Deploy</TableHead><TableHead numeric>Build time</TableHead></TableRow></TableHeader>
            <TableVirtualBody count={0} columns={2} hasMore loading onLoadMore={() => {}} skeleton={["primary", "number"]}>{() => null}</TableVirtualBody>
          </Table>
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
  breadcrumb: {
    needs: ["Breadcrumb"],
    jsx: `<div className="w-full max-w-xl" data-testid="litt-breadcrumb"><Breadcrumb label="Smoke docs" items={[{ label: "Docs", href: "#docs" }, { label: "Guides", href: "#guides" }, { label: "Publishing", href: "#publishing" }, { label: "Domains", href: "#domains" }, { label: "Custom domains", href: "#custom" }, { label: "DNS records", href: "#dns" }, { label: "Verify ownership", href: "#verify" }]} /></div>`,
  },
  "context-menu": {
    needs: ["ContextMenu", "MenuItem", "MenuSub", "MenuCheckboxItem", "MenuSeparator"],
    state: [`const [ctxHidden, setCtxHidden] = useState(false);`, `const [ctxOpened, setCtxOpened] = useState(0);`],
    jsx: `<ContextMenu label="Founder landing actions" trigger={<div data-testid="ctx-target" data-opened={ctxOpened} className="grid h-24 w-72 place-items-center"><button type="button" data-testid="ctx-focus" onClick={() => setCtxOpened((n) => n + 1)}>Founder landing</button></div>}>
          <MenuItem>Open</MenuItem>
          <MenuItem>Rename</MenuItem>
          <MenuSub label="Move to"><MenuItem>Templates</MenuItem><MenuItem>Archive 2025</MenuItem></MenuSub>
          <MenuCheckboxItem checked={ctxHidden} onCheckedChange={setCtxHidden}>Show hidden files</MenuCheckboxItem>
          <MenuSeparator />
          <MenuItem destructive>Delete</MenuItem>
        </ContextMenu>`,
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
  combobox: {
    needs: ["Combobox"],
    top: [
      `const CB_CLIENTS = [{ value: "marlow-labs", label: "Marlow Labs", group: "Retainers" }, { value: "grotta-type", label: "Grotta Type", group: "Retainers" }, { value: "sidebar-weekly", label: "Sidebar Weekly", group: "Projects" }, { value: "zurich-opera", label: "Zürich Opera House", group: "Past clients" }, { value: "oddway-press", label: "Oddway Press", group: "Past clients", disabled: true }];`,
      `const CB_STACK = [{ label: "Frameworks", options: [{ value: "nextjs", label: "Next.js" }, { value: "astro", label: "Astro" }] }, { label: "Content", options: [{ value: "sanity", label: "Sanity" }] }];`,
    ],
    state: [`const [cbStack, setCbStack] = useState<string[]>(["astro"]);`],
    jsx: `<form className="grid w-full max-w-sm gap-4" data-testid="litt-combobox" aria-label="Combobox smoke" onSubmit={(e) => e.preventDefault()}>
          <Combobox label="Client" name="client" options={CB_CLIENTS} placeholder="Search clients" hint="Type to search." />
          <Combobox multiple label="Stack" name="stack" options={CB_STACK} value={cbStack} onValueChange={setCbStack} />
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
  accordion: {
    needs: ["Accordion", "AccordionItem", "AccordionTrigger", "AccordionContent"],
    state: [`const [accOpen, setAccOpen] = useState<string[]>(["domain"]);`],
    jsx: `<div className="grid w-full max-w-xl gap-8" data-testid="litt-accordion">
          <Accordion defaultValue="start">
            <AccordionItem value="start"><AccordionTrigger>How does a project start?</AccordionTrigger><AccordionContent>With a call about what the site has to do, then a one-page brief.</AccordionContent></AccordionItem>
            <AccordionItem value="timing"><AccordionTrigger>How long does a site take?</AccordionTrigger><AccordionContent>Most sites launch four to six weeks after the brief.</AccordionContent></AccordionItem>
            <AccordionItem value="copy"><AccordionTrigger>Do you write the copy?</AccordionTrigger><AccordionContent>You bring the words and I shape them to the layout.</AccordionContent></AccordionItem>
          </Accordion>
          <Accordion type="multiple" value={accOpen} onValueChange={setAccOpen} headingLevel={4}>
            <AccordionItem value="domain"><AccordionTrigger>Domain</AccordionTrigger><AccordionContent>smoke.studio points at the host.</AccordionContent></AccordionItem>
            <AccordionItem value="analytics"><AccordionTrigger>Analytics</AccordionTrigger><AccordionContent>Visits are counted without cookies.</AccordionContent></AccordionItem>
          </Accordion>
          <p data-testid="accordion-open">{accOpen.join(",") || "none"}</p>
        </div>`,
  },
  "scroll-area": {
    needs: ["ScrollArea"],
    top: [`const SA_LINES = Array.from({ length: 40 }, (_, i) => "Smoke build step " + (i + 1));`],
    jsx: `<div className="grid w-full max-w-md gap-6" data-testid="litt-scroll-area">
          <ScrollArea label="Smoke log" className="h-48">
            <ol className="grid gap-1 pr-3">{SA_LINES.map((line) => <li key={line}>{line}</li>)}</ol>
          </ScrollArea>
          <ScrollArea label="Smoke strip" orientation="horizontal">
            <ul className="flex gap-4 pb-4">{SA_LINES.slice(0, 12).map((line) => <li key={line} className="w-40 shrink-0">{line}</li>)}</ul>
          </ScrollArea>
          <ScrollArea label="Short list" className="h-48"><p>Fits without scrolling.</p></ScrollArea>
        </div>`,
  },
  slider: {
    needs: ["Slider", "RangeSlider"],
    jsx: `<div className="grid w-full max-w-sm gap-8" data-testid="litt-slider">
          <Slider name="speed" label="Animation speed" min={0.5} max={2} step={0.1} defaultValue={1} minLabel="Slower" maxLabel="Faster" showValue formatValue={(v) => \`\${v.toFixed(1)}x\`} />
          <form data-testid="litt-range" onSubmit={(e) => e.preventDefault()}><RangeSlider name="window" label="Smoke window" min={0} max={100} defaultValue={[20, 80]} minLabel="Faster" maxLabel="Slower" showValue formatValue={(v) => \`\${v}s\`} /></form>
        </div>`,
  },
  "date-picker": {
    needs: ["DatePicker", "Calendar"],
    jsx: `<form className="grid w-full max-w-sm gap-6" data-testid="litt-date-picker" aria-label="Date picker smoke">
          <DatePicker label="Launch date" name="launch" defaultValue="2026-10-17" hint="The site goes live at 09:00." />
          <DatePicker mode="range" label="Report period" name="period" defaultValue={{ start: "2026-10-03", end: "2026-10-17" }} presets={[{ label: "First week", value: { start: "2026-10-01", end: "2026-10-07" } }]} />
          <Calendar label="Studio schedule" defaultValue="2026-10-17" isDisabled={(d) => d === "2026-10-20"} />
        </form>`,
  },
  "color-picker": {
    needs: ["ColorPicker", "ColorPanel"],
    jsx: `<form className="grid w-full max-w-sm gap-6" data-testid="litt-color-picker" aria-label="Color picker smoke">
          <ColorPicker label="Brand color" name="brand" defaultValue="#2f5bd3" swatches={[{ label: "Nord teal", value: "#1d5c5a" }, { label: "Clay", value: "#c2643f" }]} />
          <ColorPanel label="Cover color" defaultValue="#1d5c5a" />
        </form>`,
  },
  "time-scrubber": {
    needs: ["TimeScrubber"],
    jsx: `<div className="w-full max-w-xl" data-testid="litt-time-scrubber"><TimeScrubber label="Replay" max={48} defaultValue={31} marks={[{ at: 12.1, label: "Image is 2.4 MB", tone: "warning" }, { at: 31, label: "Module not found", tone: "danger" }]} /></div>`,
  },
  "slide-confirm": {
    needs: ["SlideConfirm"],
    jsx: `<div className="w-full max-w-sm" data-testid="litt-slide-confirm"><SlideConfirm label="Slide to delete Atelier Nord" confirmedLabel="Deleting Atelier Nord" /></div>`,
  },
  "rolling-number": {
    needs: ["RollingNumber"],
    jsx: `<p className="text-xl" data-testid="litt-rolling-number"><RollingNumber value={12480} /> <RollingNumber value={0.64} format={{ style: "percent" }} /></p>`,
  },
  stat: {
    needs: ["Stat", "StatGroup"],
    jsx: `<div className="w-full max-w-xl" data-testid="litt-stats"><StatGroup><Stat label="Active projects" value={12} /><Stat label="Median build" value={41} unit="s" delta="Down 6 s on last week" tone="good" trend={<span data-testid="stat-trend">Last 14 days</span>} /></StatGroup></div>`,
  },
  chart: {
    needs: ["BarChart", "LineChart", "Meter", "StackedBarChart"],
    jsx: `<div className="grid w-full max-w-xl gap-6" data-testid="litt-charts">
          <BarChart label="Deploys per day" labels={["1 Oct", "2 Oct", "3 Oct", "4 Oct"]} series={[{ name: "Deploys", values: [5, 7, 4, 9] }]} height={160} />
          <LineChart label="Build time" labels={["1 Oct", "2 Oct", "3 Oct", "4 Oct"]} series={[{ name: "Build time", values: [44, 41, 46, 39] }]} formatValue={(v) => \`\${v} s\`} height={160} />
          <Meter label="Storage" value={42} valueText="42 of 100 GB" />
          <Meter label="Video" value={58} valueText="58 GB" hue="violet" />
          <StackedBarChart label="Storage added" labels={["1 Oct", "2 Oct", "3 Oct"]} series={[{ name: "Video", values: [4, 3, 6] }, { name: "Images", values: [2, 1, 2] }]} formatValue={(v) => \`\${v} GB\`} height={160} />
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
    needs: ["Gauge", "FunMode"],
    jsx: `<div className="grid w-full max-w-xs gap-6" data-testid="litt-gauges">
          <Gauge label="Credits left" value={20830} max={30000} valueText="20,830 credits" figure="20,830" caption="2k a day on average" hue="teal" />
          <div className="w-40" data-testid="litt-gauge-small"><Gauge label="Storage" value={42} valueText="42 of 100 GB" size={320} /></div>
          <div data-testid="litt-gauge-fun"><FunMode><Gauge label="Credits in fun mode" value={20830} max={30000} valueText="20,830 credits" figure="20,830" hue="teal" /></FunMode></div>
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
          <Avatar name="Halo Studio" look="fluid" size="lg" data-testid="avatar-fluid" />
          <Avatar name="Halo Studio" look="fluid" size="lg" data-testid="avatar-fluid-2" />
          <Avatar name="Halo Studio" look="film" size="lg" data-testid="avatar-film" />
          <Avatar name="Halo Studio" look="thermal" size="lg" data-testid="avatar-thermal" />
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
  funnel: {
    needs: ["Funnel"],
    jsx: `<div className="grid w-full max-w-md gap-8" data-testid="litt-funnel">
          <Funnel label="Smoke funnel" hue="teal" unit={["person", "people"]} steps={[{ label: "Visited", value: 18240 }, { label: "Signed up", value: 6930 }, { label: "Activated", value: 2840 }, { label: "Paid", value: 748 }]} />
          <div className="w-64"><Funnel label="Smoke odd" steps={[{ label: "Visited", value: 1200 }, { label: "Opened pricing", value: 1450 }, { label: "Paid", value: 40 }]} /></div>
        </div>`,
  },
  "cohort-grid": {
    needs: ["CohortGrid"],
    jsx: `<div className="grid w-full max-w-xl gap-8" data-testid="litt-cohort-grid">
          <CohortGrid label="Smoke retention" average steps={[1, 30, 45, 90]} cohorts={[{ label: "24 Aug", size: 100, values: [100, 50, 20] }, { label: "31 Aug", size: 300, values: [100, 40, null] }, { label: "7 Sep", size: 100, values: [100] }]} />
          <div className="w-48"><CohortGrid label="Smoke narrow" hue="violet" valueType="count" cohorts={[{ label: "24 Aug", size: 1240, values: [1240, 610, 402, 380, 344] }]} /></div>
        </div>`,
  },
  legend: {
    needs: ["Legend"],
    jsx: `<div className="grid gap-6" data-testid="litt-legend">
          <Legend label="Smoke series" items={[{ name: "Builds", value: "1,240" }, { name: "Previews", hue: "teal" }, { name: "Deploys" }]} />
          <Legend label="Smoke last" defaultHidden={["Halcyon"]} items={[{ name: "Arcadia" }, { name: "Halcyon" }]} />
        </div>`,
  },
  plan: {
    needs: ["Plan"],
    types: ["PlanStep"],
    top: [
      `const PLAN_LABELS = ["Read the layout", "Map the sections", "Run the build", "Publish a preview", "Send the link"];`,
      `// The steps before "at" are done, step "at" runs and the rest wait.`,
      `const planSteps = (at: number): PlanStep[] => PLAN_LABELS.map((label, i): PlanStep => ({ id: "s" + i, label, status: i < at ? "done" : i === at ? "running" : "pending" }));`,
      `const FAILED_STEPS: PlanStep[] = [`,
      `  { id: "read", label: "Read the layout", status: "done" },`,
      `  { id: "build", label: "Run the build", status: "failed", detail: "Build failed: font file missing" },`,
      `  { id: "video", label: "Compress the videos", status: "skipped" },`,
      `  { id: "preview", label: "Publish a preview", status: "pending" },`,
      `];`,
    ],
    state: [`const [planAt, setPlanAt] = useState(2);`],
    jsx: `<div className="grid w-full max-w-md gap-8" data-testid="litt-plan">
          <div className="grid gap-4" data-testid="plan-running">
            <Plan label="Smoke plan" steps={planSteps(planAt)} />
            <div><@Btn type="button" data-testid="plan-next" onClick={() => setPlanAt((n) => n + 1)}>Next step</@Btn></div>
          </div>
          <div data-testid="plan-failed"><Plan label="Smoke failed plan" steps={FAILED_STEPS} /></div>
        </div>`,
  },
  "tool-call": {
    needs: ["ToolCall", "ToolCallGroup", "ToolApproval"],
    state: [`const [toolDecision, setToolDecision] = useState<"pending" | "allowed" | "denied">("pending");`, `const [toolAllowed, setToolAllowed] = useState(0);`],
    jsx: `<div className="grid w-full max-w-md gap-4" data-testid="litt-tool-call">
          <ToolCall status="failed" action="Ran" target="npm run build" duration={14} output={"Build failed: no such file"} />
          <ToolCall status="done" action="Read" target="src/app.tsx" duration={0.2} />
          <ToolCallGroup summary="Read 2 files and ran the tests">
            <ToolCall status="done" action="Read" target="a.ts" />
            <ToolCall status="done" action="Ran" target="npm test" />
          </ToolCallGroup>
          <ToolApproval command="npm run deploy" description="Publishes the smoke site." alwaysAllowLabel="Always allow npm run deploy" decision={toolDecision} onAllow={() => { setToolAllowed((n) => n + 1); setToolDecision("allowed"); }} onDeny={() => setToolDecision("denied")} />
          <p data-testid="tool-call-allowed">{toolAllowed}</p>
        </div>`,
  },
  composer: {
    needs: ["Composer"],
    state: [
      `const [composerSent, setComposerSent] = useState("");`,
      `const [composerStreaming, setComposerStreaming] = useState(false);`,
      `const [composerFiles, setComposerFiles] = useState<{ id: string; name: string; size?: number; progress?: number }[]>([{ id: "brief", name: "brief.pdf", size: 2516582 }, { id: "moodboard", name: "moodboard.png", progress: 64 }]);`,
    ],
    jsx: `<div className="grid w-full max-w-lg gap-3" data-testid="litt-composer">
          <p data-testid="composer-sent" className="whitespace-pre-wrap">{composerSent}</p>
          <Composer placeholder="Message Litt" hint="Litt can be wrong. Check what matters." streaming={composerStreaming} onSend={(text) => { setComposerSent(text); setComposerStreaming(true); }} onStop={() => setComposerStreaming(false)} files={composerFiles} onRemoveFile={(file) => setComposerFiles((all) => all.filter((f) => f.id !== file.id))} />
        </div>`,
  },
  "code-block": {
    needs: ["CodeBlock"],
    top: [
      `const SMOKE_TS = ["// halo", "const label = 'live';", "export default label;", "// a long comment that runs past the edge of a block twenty rem wide"].join("\\n");`,
      `const SMOKE_DIFF = ["@@ -1,3 +1,3 @@", " import a from 'a';", "-import b from 'b';", "+import c from 'c';"].join("\\n");`,
    ],
    jsx: `<div className="grid w-80 gap-4" data-testid="litt-code-block">
          <CodeBlock lang="ts" filename="badge.ts" label="Smoke badge" code={SMOKE_TS} />
          <CodeBlock lang="diff" label="Smoke diff" code={SMOKE_DIFF} />
        </div>`,
  },
  message: {
    needs: ["Conversation", "Message", "MessageText", "MessageActions"],
    jsx: `<div className="h-72 w-full max-w-xl" data-testid="litt-message">
          <Conversation label="Smoke conversation" className="h-full">
            <Message from="user">Why did the Halo build fail?</Message>
            <Message actions={<MessageActions copyText="The Halo build ran out of memory." onRetry={() => {}} />}>
              <MessageText><p data-testid="message-answer">The build ran out of memory. Run <code data-testid="message-code">npm run build</code> again.</p></MessageText>
            </Message>
          </Conversation>
        </div>`,
  },
  thinking: {
    needs: ["Thinking"],
    jsx: `<div className="grid w-full max-w-md gap-6" data-testid="litt-thinking">
          <Thinking duration={12}><p>Smoke reasoning one.</p><p>Smoke reasoning two.</p></Thinking>
          <Thinking active><p>Smoke live reasoning.</p></Thinking>
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
  progress: {
    needs: ["Progress"],
    jsx: `<div className="grid w-full max-w-sm gap-4" data-testid="litt-progress"><Progress label="Uploading brief.pdf" value={3.2} max={8} valueText="3.2 of 8 MB" /><Progress label="Importing pages" status="failed" value={412} max={1204} message="The export file ends early." /></div>`,
  },
  "code-input": {
    needs: ["CodeInput"],
    jsx: `<div data-testid="litt-code-input"><CodeInput label="Sign-in code" defaultValue="246" help="We sent six digits to ines@halo.studio." /></div>`,
  },
  "file-drop": {
    needs: ["FileDrop", "FileList", "FileRow"],
    jsx: `<div className="grid w-full max-w-lg gap-4" data-testid="litt-file-drop"><FileDrop label="Project files" accept={[".pdf", "image/*"]} hint="PDF or images, up to 10 MB" onFiles={() => {}} /><FileList label="Project files"><FileRow name="halo-brief.pdf" size={2516582} /><FileRow name="brand-fonts.zip" size={6291456} progress={64} error="The connection dropped." onRetry={() => {}} onRemove={() => {}} /></FileList></div>`,
  },
  steps: {
    needs: ["Steps"],
    jsx: `<div className="w-full max-w-2xl" data-testid="litt-steps"><Steps label="Set up your studio" current={1} steps={[{ id: "a", label: "Details" }, { id: "b", label: "Team" }, { id: "c", label: "Billing" }]} /></div>`,
  },
  media: {
    needs: ["Media"],
    top: [`const SMOKE_MEDIA_SRC = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='10'%3E%3Crect width='16' height='10' fill='gray'/%3E%3C/svg%3E";`],
    jsx: `<div className="grid w-full max-w-md gap-4" data-testid="litt-media"><Media src={SMOKE_MEDIA_SRC} alt="A grey rectangle" ratio="16/9" caption="Smoke image" /><Media src="data:image/png;base64,AAAA" alt="A broken image" ratio="4/3" /></div>`,
  },
  carousel: {
    needs: ["Carousel", "CarouselContent", "CarouselItem", "CarouselControls"],
    jsx: `<div className="w-full max-w-xl" data-testid="litt-carousel"><Carousel label="Smoke slides" perView="two"><CarouselContent><CarouselItem><div className="h-32">Slide one</div></CarouselItem><CarouselItem><div className="h-32">Slide two</div></CarouselItem><CarouselItem><div className="h-32">Slide three</div></CarouselItem><CarouselItem><div className="h-32">Slide four</div></CarouselItem></CarouselContent><CarouselControls /></Carousel></div>`,
  },
  lightbox: {
    needs: ["Lightbox"],
    top: [`const SMOKE_LIGHTBOX_SRC = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='10'%3E%3Crect width='16' height='10' fill='gray'/%3E%3C/svg%3E";`],
    state: [`const [lbOpen, setLbOpen] = useState<number | null>(null);`],
    jsx: `<div data-testid="litt-lightbox"><@Btn type="button" onClick={() => setLbOpen(0)}>Open lightbox</@Btn><Lightbox label="Smoke set" items={[{ src: SMOKE_LIGHTBOX_SRC, alt: "A grey rectangle", caption: "Smoke image", width: 16, height: 10 }]} index={lbOpen} onIndexChange={setLbOpen} /></div>`,
  },
  "number-field": {
    needs: ["NumberField"],
    jsx: `<div className="w-full max-w-xs" data-testid="litt-number-field"><NumberField label="Seats" unit="seats" min={1} max={50} defaultValue={8} help="€12 a seat a month." /></div>`,
  },
  "hover-card": {
    needs: ["HoverCard", "HoverCardTrigger", "HoverCardContent"],
    jsx: `<p data-testid="litt-hover-card">Deployed by <HoverCard><HoverCardTrigger><a href="#people">Ines Duarte</a></HoverCardTrigger><HoverCardContent><p>Design lead, Halo Studio</p></HoverCardContent></HoverCard>.</p>`,
  },
  "action-bar": {
    needs: ["ActionBar"],
    state: [`const [abCount, setAbCount] = useState(3);`],
    jsx: `<div className="w-full" data-testid="litt-action-bar"><ActionBar count={abCount} noun="projects" onClear={() => setAbCount(0)}><@Btn type="button">Archive</@Btn></ActionBar></div>`,
  },
  tree: {
    needs: ["Tree"],
    jsx: `<div className="w-full max-w-xs" data-testid="litt-tree"><Tree label="Files" defaultExpanded={["src"]} defaultSelected="src/app.tsx" items={[{ id: "src", label: "src", children: [{ id: "src/app.tsx", label: "app.tsx", detail: "M" }] }, { id: "package.json", label: "package.json" }]} /></div>`,
  },
  resizable: {
    needs: ["ResizablePanelGroup", "ResizablePanel", "ResizableHandle"],
    jsx: `<div className="h-40 w-full max-w-xl" data-testid="litt-resizable"><ResizablePanelGroup direction="horizontal" className="h-full"><ResizablePanel defaultSize={30} minSize={20}><p>Files</p></ResizablePanel><ResizableHandle label="Resize the files" /><ResizablePanel><p>Log</p></ResizablePanel></ResizablePanelGroup></div>`,
  },
  "log-view": {
    needs: ["LogView"],
    jsx: `<div className="w-full max-w-xl" data-testid="litt-log-view"><LogView label="Build log" height="10rem" lines={[{ time: "+0.0s", text: "Running npm run build" }, { time: "+12.1s", level: "warn", text: "Image is 2.4 MB." }, { time: "+29.0s", level: "success", text: "Build completed." }]} /></div>`,
  },
  details: {
    needs: ["Details", "DetailsItem", "DetailsLink"],
    jsx: `<div className="w-full max-w-lg" data-testid="litt-details"><Details title="Deployment"><DetailsItem label="Domain" copy="halo.studio"><DetailsLink href="https://halo.studio">halo.studio</DetailsLink></DetailsItem><DetailsItem label="Commit" mono>4c6d204</DetailsItem><DetailsItem label="PO number" /></Details></div>`,
  },
  "table-filter": {
    needs: ["TableFilter", "useUrlFilter", "useUrlParam"],
    state: [`const [tfOn, setTfOn] = useUrlFilter("smoke-status", { values: ["ready", "failed"] });`, `const [tfQuery] = useUrlParam("smoke-q");`],
    jsx: `<div className="flex items-center gap-3" data-testid="litt-table-filter"><span>Status{tfQuery}</span><TableFilter column="Status" value={tfOn} onValueChange={setTfOn} options={[{ value: "ready", label: "Ready", count: 9214 }, { value: "failed", label: "Failed", count: 786 }]} /></div>`,
  },
  /* Blocks: whole screens, rendered as they ship, sample data and all. The agent chat is the finished one, so no script runs. */
  dashboard: { needs: ["Dashboard"], jsx: `<div className="w-full" data-testid="litt-block-dashboard"><Dashboard label="Smoke dashboard" viewportHeight="32rem" /></div>` },
  usage: { needs: ["Usage"], jsx: `<div className="w-full" data-testid="litt-block-usage"><Usage /></div>` },
  growth: { needs: ["Growth"], jsx: `<div className="w-full" data-testid="litt-block-growth"><Growth /></div>` },
  insights: { needs: ["Insights"], jsx: `<div className="w-full" data-testid="litt-block-insights"><Insights /></div>` },
  agent: { needs: ["AgentChat"], jsx: `<div className="h-[36rem] w-full max-w-3xl" data-testid="litt-block-agent"><AgentChat finished label="Smoke agent chat" /></div>` },
  projects: { needs: ["Projects"], jsx: `<div className="w-full" data-testid="litt-block-projects"><Projects /></div>` },
  settings: { needs: ["Settings"], jsx: `<div className="w-full" data-testid="litt-block-settings"><Settings /></div>` },
  team: { needs: ["Team"], jsx: `<div className="w-full" data-testid="litt-block-team"><Team /></div>` },
  activity: { needs: ["Activity"], jsx: `<div className="w-full" data-testid="litt-block-activity"><Activity /></div>` },
  "sign-in": { needs: ["SignIn"], jsx: `<div className="h-[40rem] w-full" data-testid="litt-block-sign-in"><SignIn /></div>` },
  deployment: { needs: ["Deployment"], jsx: `<div className="w-full" data-testid="litt-block-deployment"><Deployment /></div>` },
  "case-study": { needs: ["CaseStudy"], jsx: `<div className="w-full" data-testid="litt-block-case-study"><CaseStudy /></div>` },
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
  /* Only when a state line calls it: a recipe can hold its state in a component's own hook. */
  if (state.some((line) => line.includes("useState"))) lines.push('import { useState } from "react";');
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

/**
 * Where an item's recipe renders: its own `data-item` wrapper on the smoke page. A check starts here, never from the
 * whole page, because the `all` page draws every item at once and the blocks reuse the components' labels (the
 * settings block has its own "Role" select, build-email switch and "Animation speed" slider). What a component
 * portals out of it (a menu, a listbox, a dialog, a toast) is still looked up on the page.
 */
const itemOn = (page, name) => page.locator(`[data-item="${name}"]`);

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
    const item = (name) => itemOn(page, name);
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
            `(${COLOR_TO_RGB})(getComputedStyle(document.querySelector("[data-item=button] [data-testid=litt-primary]")).backgroundColor)`,
          );
          const want = accent[theme];
          if (!near(got, want)) throw new Error(`background is rgb(${got.slice(0, 3)}), litt accent is rgb(${want})`);
          return `rgb(${want})`;
        });
      }

      if (has("tooltip")) {
        await attempt("tooltip opens", async () => {
          await item("tooltip").locator("[data-testid=tooltip-trigger]").hover();
          await page.getByText("Litt tooltip").last().waitFor({ state: "visible", timeout: 5000 });
          await page.mouse.move(5, 5);
        });
      }
      if (has("tabs")) {
        await attempt("tabs switch", async () => {
          await item("tabs").getByRole("tab", { name: "Two" }).click();
          await item("tabs").getByText("Panel two").waitFor({ state: "visible", timeout: 4000 });
        });
      }
      if (has("list")) {
        await attempt("project list rows", async () => {
          await item("list").getByText("Northwind site").first().waitFor({ state: "visible", timeout: 4000 });
          const n = await item("list").locator("ul[aria-label=Projects] li").count();
          if (n < 3) throw new Error(`expected 3 rows, found ${n}`);
          // The third project has only the required fields, and a year where a date would be.
          await item("list").getByText("Archive").first().waitFor({ state: "visible", timeout: 4000 });
          return `${n} rows`;
        });
      }
      if (has("menu")) {
        await attempt("menu opens with glass panel", async () => {
          await item("menu").locator("[data-testid=menu-trigger]").click();
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
      if (has("breadcrumb")) {
        await attempt("breadcrumb marks the current page and folds its middle into a menu of links", async () => {
          const nav = item("breadcrumb").getByRole("navigation", { name: "Smoke docs" });
          await nav.waitFor({ state: "visible", timeout: 5000 });
          // A level's words, without the aria-hidden slash before it.
          const read = (el) => ({
            levels: [...el.querySelectorAll("ol > li")].map((li) =>
              [...li.childNodes]
                .filter((n) => !(n.nodeType === 1 && n.getAttribute("aria-hidden") === "true"))
                .map((n) => n.textContent)
                .join("")
                .trim(),
            ),
            slashes: [...el.querySelectorAll("ol > li > [aria-hidden=true]")].map((s) => s.textContent.trim()),
            links: [...el.querySelectorAll("a")].map((a) => Math.round(a.getBoundingClientRect().height)),
            current: [...el.querySelectorAll("[aria-current=page]")].map((c) => `${c.tagName}:${c.textContent}`),
          });
          const got = await nav.evaluate(read);
          const want = "Docs||Custom domains|DNS records|Verify ownership";
          if (got.levels.join("|") !== want) throw new Error(`the levels read ${got.levels.join("|")}, not ${want}`);
          if (got.slashes.join("") !== "////") throw new Error(`the separators are ${JSON.stringify(got.slashes)}, not four aria-hidden slashes`);
          if (got.current.join() !== "SPAN:Verify ownership") throw new Error(`aria-current="page" is on ${got.current.join() || "nothing"}, not the last level as text`);
          if (got.links.some((h) => h !== 32)) throw new Error(`the links are ${got.links.join("/")}px tall, not 32`);
          const more = nav.getByRole("button", { name: "Show 3 more levels" });
          await more.click();
          const menu = page.getByRole("menu");
          await menu.waitFor({ state: "visible", timeout: 5000 });
          const rows = await menu.evaluate((el) => [...el.querySelectorAll("[role=menuitem]")].map((r) => `${r.tagName}:${r.textContent.trim()}:${r.getAttribute("href")}`));
          await page.keyboard.press("Escape");
          await menu.waitFor({ state: "hidden", timeout: 4000 });
          const folded = "A:Guides:#guides|A:Publishing:#publishing|A:Domains:#domains";
          if (rows.join("|") !== folded) throw new Error(`the folded menu holds ${rows.join("|")}, not ${folded}`);
          const back = await page.evaluate(() => document.activeElement?.getAttribute("aria-label"));
          if (back !== "Show 3 more levels") throw new Error(`Esc left focus on ${back}, not the "…" button`);
          let phoneDetail = "";
          if (theme === "light") {
            // A phone shows the last two levels, and a finger gets a 44px hit area without the text moving.
            const phone = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1 });
            try {
              const p2 = await phone.newPage();
              await p2.goto(url, { waitUntil: "load", timeout: 30000 });
              const n2 = p2.locator("[data-item=breadcrumb]").getByRole("navigation", { name: "Smoke docs" });
              await n2.waitFor({ state: "visible", timeout: 10000 });
              await p2.waitForTimeout(400);
              const small = await n2.evaluate((el) => ({
                levels: [...el.querySelectorAll("ol > li")].length,
                text: el.innerText.replace(/\s+/g, " ").trim(),
                link: (() => {
                  const a = el.querySelector("a");
                  return a ? { box: Math.round(a.getBoundingClientRect().height), hit: getComputedStyle(a, "::before").height } : null;
                })(),
                overflow: el.scrollWidth - el.clientWidth,
              }));
              if (small.levels !== 3 || !small.text.endsWith("DNS records / Verify ownership")) throw new Error(`a phone shows ${small.levels} items, "${small.text}"`);
              if (!(await n2.getByRole("button", { name: "Show 5 more levels" }).count())) throw new Error('a phone has no "Show 5 more levels" button');
              if (!small.link || small.link.box !== 32 || small.link.hit !== "44px") throw new Error(`a link on a phone is ${JSON.stringify(small.link)}, not 32px with a 44px hit area`);
              if (small.overflow > 0) throw new Error(`the trail overflows its nav by ${small.overflow}px on a phone`);
              phoneDetail = `; phone: ${small.text}`;
            } finally {
              await phone.close();
            }
          }
          return `${got.levels.length} items, folded ${rows.length}${phoneDetail}`;
        });
      }
      if (has("context-menu")) {
        await attempt("context menu opens at the pointer, from Shift+F10 and on a 500ms hold, with the Menu's glass and rows", async () => {
          const target = item("context-menu").locator("[data-testid=ctx-target]");
          await target.scrollIntoViewIfNeeded();
          const box = await target.boundingBox();
          const at = { x: Math.round(box.x + 24), y: Math.round(box.y + 12) };
          await page.mouse.click(at.x, at.y, { button: "right" });
          const menu = page.getByRole("menu", { name: "Founder landing actions" });
          await menu.waitFor({ state: "visible", timeout: 5000 });
          await page.waitForTimeout(700);
          // The panel sits at the pointer and grows from the pointer's corner (Radix's transform origin).
          const panel = () =>
            menu.evaluate((el) => {
              const host = el.closest(".litt-glass") ?? el.querySelector(".litt-glass");
              const before = host ? getComputedStyle(host, "::before") : null;
              const r = el.getBoundingClientRect();
              const [ox, oy] = getComputedStyle(el).transformOrigin.split(" ").map(parseFloat);
              return {
                glass: !!host,
                blur: before ? before.backdropFilter || before.webkitBackdropFilter || "" : "",
                left: r.left,
                top: r.top,
                right: r.right,
                bottom: r.bottom,
                origin: { x: r.left + ox, y: r.top + oy },
                rows: [...el.querySelectorAll("[role=menuitem],[role=menuitemcheckbox]")].map((row) => Math.round(row.getBoundingClientRect().height)),
                focused: document.activeElement?.getAttribute("role") === "menuitem" ? document.activeElement.textContent.trim() : null,
              };
            });
          const p = await panel();
          await page.screenshot({ path: path.join(shotsDir, `${tag}-${theme}-context-menu.png`) });
          await page.keyboard.press("Escape");
          await menu.waitFor({ state: "hidden", timeout: 4000 });
          if (!p.glass || !p.blur || p.blur === "none") throw new Error(`the panel is not litt glass: ${JSON.stringify({ glass: p.glass, blur: p.blur })}`);
          if (p.rows.length !== 5 || p.rows.some((h) => h < 44)) throw new Error(`rows are ${p.rows.join("/")}px`);
          const near4 = (a, b) => Math.abs(a - b) <= 4;
          if (!(near4(p.origin.x, at.x) && near4(p.origin.y, at.y)))
            throw new Error(`it grows from (${Math.round(p.origin.x)}, ${Math.round(p.origin.y)}), not the pointer at (${at.x}, ${at.y})`);
          if (!(near4(p.left, at.x + 2) || near4(p.right, at.x - 2)) || !(near4(p.top, at.y) || near4(p.bottom, at.y)))
            throw new Error(`the panel's corners are (${Math.round(p.left)}, ${Math.round(p.top)}) and (${Math.round(p.right)}, ${Math.round(p.bottom)}), not at the pointer (${at.x}, ${at.y})`);
          if (p.focused) throw new Error(`a right-click lit ${p.focused}; a pointer open lights nothing`);

          // Shift+F10 on something focused inside the target: at its bottom-left corner, first row focused, focus back on Esc.
          const focusable = item("context-menu").locator("[data-testid=ctx-focus]");
          await focusable.focus();
          const fb = await focusable.boundingBox();
          await page.keyboard.press("Shift+F10");
          await menu.waitFor({ state: "visible", timeout: 5000 });
          await page.waitForTimeout(700);
          const k = await panel();
          await page.keyboard.press("Escape");
          await menu.waitFor({ state: "hidden", timeout: 4000 });
          if (k.focused !== "Open") throw new Error(`Shift+F10 focused ${k.focused}, not the first row`);
          if (!(near4(k.origin.x, fb.x) && near4(k.origin.y, fb.y + fb.height)))
            throw new Error(`Shift+F10 grew it from (${Math.round(k.origin.x)}, ${Math.round(k.origin.y)}), not the focused element's bottom-left (${Math.round(fb.x)}, ${Math.round(fb.y + fb.height)})`);
          const back = await page.evaluate(() => document.activeElement?.getAttribute("data-testid"));
          if (back !== "ctx-focus") throw new Error(`Esc left focus on ${back}, not the focused element`);

          // A checkbox row toggles and the menu stays open.
          await page.mouse.click(at.x, at.y, { button: "right" });
          await menu.waitFor({ state: "visible", timeout: 5000 });
          await page.waitForTimeout(500);
          const check = page.getByRole("menuitemcheckbox", { name: "Show hidden files" });
          await check.click();
          await page.waitForTimeout(300);
          const stayed = await menu.isVisible();
          const checked = await check.getAttribute("aria-checked");
          await page.keyboard.press("Escape");
          await menu.waitFor({ state: "hidden", timeout: 4000 });
          if (!stayed || checked !== "true") throw new Error(`after a checkbox row: open ${stayed}, aria-checked ${checked}`);

          let held = "";
          if (theme === "light") {
            // On touch: a press and hold opens it within the 500ms hold (Radix's own is 700ms), and the hold does not
            // also run the target's action. A tap only runs the action.
            const phone = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1 });
            try {
              const p2 = await phone.newPage();
              await p2.goto(url, { waitUntil: "load", timeout: 30000 });
              const button = p2.locator("[data-item=context-menu] [data-testid=ctx-focus]");
              await button.waitFor({ state: "visible", timeout: 10000 });
              await button.scrollIntoViewIfNeeded();
              await p2.waitForTimeout(400);
              await button.tap();
              await p2.waitForTimeout(800);
              if (await p2.getByRole("menu").count()) throw new Error("a tap opened the menu");
              if ((await p2.locator("[data-item=context-menu] [data-testid=ctx-target]").getAttribute("data-opened")) !== "1") throw new Error("a tap did not run the target's own action");
              const b2 = await button.boundingBox();
              /* Two times from the touch: `open`, when the hold asks for the menu (the contextmenu event it sends at the
                 target, or the browser's own long press), and `menu`, when Radix has drawn it. The bound is on `open`,
                 the hold's own 500ms. Drawing comes after it and grows with the page: on the `all` page, with every item
                 mounted, Radix's popper reads computed styles and its focus scope focuses the first row, which forces a
                 style and layout pass over thousands of elements (about 200ms in Chromium), so `menu` is reported, and
                 only has to come before the finger lifts. */
              await p2.evaluate(() => {
                window.__ctxAt = { touch: 0, open: 0, menu: 0 };
                document.addEventListener("pointerdown", () => (window.__ctxAt.touch = performance.now()), { capture: true, once: true });
                document
                  .querySelector("[data-item=context-menu] [data-testid=ctx-target]")
                  .addEventListener("contextmenu", () => (window.__ctxAt.open ||= performance.now()), { capture: true });
                new MutationObserver((_, obs) => {
                  if (!document.querySelector("[role=menu]")) return;
                  window.__ctxAt.menu = performance.now();
                  obs.disconnect();
                }).observe(document.body, { childList: true, subtree: true });
              });
              const cdp = await phone.newCDPSession(p2);
              const point = { x: Math.round(b2.x + b2.width / 2), y: Math.round(b2.y + b2.height / 2) };
              await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [point] });
              await p2.waitForTimeout(900);
              await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
              await p2.waitForTimeout(500);
              const t = await p2.evaluate(() => window.__ctxAt);
              if (!t.open) throw new Error("a press and hold did not ask for the menu");
              const after = Math.round(t.open - t.touch);
              if (after > 650) throw new Error(`the hold asked for the menu ${after}ms into the hold, not at 500ms`);
              if (!t.menu || t.menu > t.touch + 900) throw new Error(`a press and hold did not draw the menu before the finger lifted at 900ms${t.menu ? ` (drawn at ${Math.round(t.menu - t.touch)}ms)` : ""}`);
              if ((await p2.locator("[data-item=context-menu] [data-testid=ctx-target]").getAttribute("data-opened")) !== "1") throw new Error("the hold also ran the target's own action");
              const still = await p2.getByRole("menu", { name: "Founder landing actions" }).isVisible();
              if (!still) throw new Error("the menu closed when the finger lifted");
              held = `; a hold opened it after ${after}ms, drawn after ${Math.round(t.menu - t.touch)}ms`;
            } finally {
              await phone.close();
            }
          }
          return `grows from the pointer, rows ${p.rows.join("/")}px${held}`;
        });
      }
      if (has("select")) {
        await attempt("select opens as glass and picks with the keyboard", async () => {
          const trigger = item("select").getByRole("combobox", { name: "Role" });
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
          const sent = await page.evaluate(() => new FormData(document.querySelector("[data-item=select] [data-testid=litt-select]")).get("role"));
          if (sent !== "developer") throw new Error(`the form sends role=${sent}`);
          return `rows ${info.rows.join("/")}, picked ${text}`;
        });
      }
      if (has("combobox")) {
        await attempt("combobox filters past accents, wraps past a disabled option, picks by key and keeps tokens with multiple", async () => {
          const form = item("combobox").locator("[data-testid=litt-combobox]");
          const input = form.getByRole("combobox", { name: "Client" });
          await input.waitFor({ state: "visible", timeout: 5000 });
          const field = input.locator("xpath=ancestor::div[contains(@class,'cursor-text')][1]");
          const lit = (el) => el.evaluate((n) => document.getElementById(n.getAttribute("aria-activedescendant") ?? "")?.textContent?.trim() ?? null);
          const posted = (key) => page.evaluate((k) => new FormData(document.querySelector("[data-item=combobox] [data-testid=litt-combobox]")).getAll(k).join("|"), key);
          // Mid-screen, so the list has room to open under the field.
          await input.evaluate((el) => el.scrollIntoView({ block: "center" }));
          const before = await field.boundingBox();
          if (Math.round(before.height) !== 44) throw new Error(`the field is ${before.height}px tall, not 44`);
          await input.click();
          await page.keyboard.type("zur");
          const listId = await input.getAttribute("aria-controls");
          if (!listId || (await input.getAttribute("aria-expanded")) !== "true") throw new Error("typing did not open the list");
          const list = page.locator(`[id="${listId}"]`);
          await list.waitFor({ state: "visible", timeout: 5000 });
          await page.waitForTimeout(600);
          const info = await list.evaluate((el) => {
            const panel = el.closest(".litt-glass");
            const glow = panel ? getComputedStyle(panel, "::before") : null;
            const options = [...el.querySelectorAll("[role=option]")];
            return {
              glass: !!panel,
              blur: glow ? glow.backdropFilter || glow.webkitBackdropFilter || "" : "",
              options: options.map((o) => o.textContent.trim()),
              rows: options.map((o) => Math.round(o.getBoundingClientRect().height)),
              box: (panel ?? el).getBoundingClientRect().toJSON(),
            };
          });
          await page.screenshot({ path: path.join(shotsDir, `${tag}-${theme}-combobox.png`) });
          if (!info.glass) throw new Error('the combobox list has no ".litt-glass" class');
          if (!info.blur || info.blur === "none") throw new Error(`.litt-glass has no backdrop-filter: ${JSON.stringify(info)}`);
          if (info.options.join("|") !== "Zürich Opera House") throw new Error(`"zur" should find only Zürich Opera House, ignoring the accent; the list shows ${JSON.stringify(info.options)}`);
          if (info.rows.some((h) => h !== 44)) throw new Error(`rows are ${info.rows}px, not 44`);
          if ((await lit(input)) !== "Zürich Opera House") throw new Error(`the first match is not lit: ${await lit(input)}`);
          if (info.box.top < before.y + before.height || Math.abs(info.box.width - before.width) > 1) throw new Error(`the list should sit under the field at its width: list ${JSON.stringify(info.box)}, field ${JSON.stringify(before)}`);
          await page.keyboard.press("Escape");
          await list.waitFor({ state: "hidden", timeout: 4000 });
          if ((await input.inputValue()) !== "zur") throw new Error(`the first Esc should close the list and keep the text; the field reads "${await input.inputValue()}"`);
          await page.keyboard.press("Escape");
          if ((await input.inputValue()) !== "") throw new Error(`the second Esc should put the (empty) pick back; the field reads "${await input.inputValue()}"`);
          await page.keyboard.press("ArrowDown");
          await page.locator(`[id="${listId}"]`).waitFor({ state: "visible", timeout: 4000 });
          if ((await lit(input)) !== "Marlow Labs") throw new Error(`ArrowDown should open the list on the first option; lit: ${await lit(input)}`);
          await page.keyboard.press("ArrowUp");
          if ((await lit(input)) !== "Zürich Opera House") throw new Error(`ArrowUp from the first option should wrap past the disabled one to Zürich Opera House; lit: ${await lit(input)}`);
          await page.keyboard.press("ArrowDown");
          await page.keyboard.press("Enter");
          await page.locator(`[id="${listId}"]`).waitFor({ state: "hidden", timeout: 4000 });
          if ((await input.inputValue()) !== "Marlow Labs" || (await posted("client")) !== "marlow-labs") throw new Error(`Enter should pick Marlow Labs; the field reads "${await input.inputValue()}" and the form posts "${await posted("client")}"`);
          const after = await field.boundingBox();
          if (["x", "y", "width", "height"].some((k) => Math.abs(after[k] - before[k]) > 0.5)) throw new Error(`the field moved: ${JSON.stringify(before)} -> ${JSON.stringify(after)}`);

          const stack = form.getByRole("combobox", { name: "Stack" });
          await stack.click();
          await page.keyboard.type("nex");
          await page.waitForTimeout(300);
          await page.keyboard.press("Enter");
          await page.waitForTimeout(400);
          if ((await posted("stack")) !== "astro|nextjs") throw new Error(`picking Next.js should add it; the form posts "${await posted("stack")}"`);
          if ((await stack.getAttribute("aria-expanded")) !== "true" || (await stack.inputValue()) !== "") throw new Error("with multiple a pick should clear the text and keep the list open");
          if (!(await form.getByRole("button", { name: "Remove Next.js" }).count())) throw new Error('no "Remove Next.js" button on the new token');
          await page.keyboard.press("Escape");
          await page.waitForTimeout(400);
          await page.keyboard.press("Backspace");
          await page.waitForTimeout(400);
          if ((await posted("stack")) !== "astro") throw new Error(`Backspace in an empty field should remove the last token; the form posts "${await posted("stack")}"`);
          const said = await form.locator("[role=status]").nth(1).textContent();
          if (said !== "Removed Next.js") throw new Error(`the live region says "${said}"`);
          await page.evaluate(() => document.activeElement?.blur());
          return `glass list, rows ${info.rows.join("/")}, accents, wrap, Enter, tokens`;
        });
      }
      if (has("form")) {
        await attempt("error summary takes focus and names its fields", async () => {
          // The summary takes focus once, when it mounts, and earlier steps have moved focus since: start from a fresh page.
          await page.reload({ waitUntil: "networkidle" });
          await page.waitForTimeout(600);
          const summary = item("form").getByRole("region", { name: "Fix 1 field to save" });
          await summary.waitFor({ state: "visible", timeout: 5000 });
          const focused = await summary.evaluate((el) => el === document.activeElement);
          if (!focused) throw new Error("the error summary did not take focus");
          const hash = await page.evaluate(() => location.hash);
          await item("form").getByRole("link", { name: "Enter an email." }).click();
          const onField = await page.evaluate(() => document.activeElement?.id);
          if (onField !== "smoke-email") throw new Error(`the summary link focused ${onField}, not the field`);
          if ((await page.evaluate(() => location.hash)) !== hash) throw new Error("the summary link changed the URL hash");
          return "focus on the summary, then on the field";
        });
      }
      if (has("switch")) {
        await attempt("switch toggles: its block crosses the tray and says On or Off", async () => {
          const sw = item("switch").getByRole("switch", { name: "Email me when a build finishes" });
          if ((await sw.getAttribute("aria-checked")) !== "true") throw new Error("the switch did not start on");
          const look = () =>
            sw.evaluate((el) => {
              const block = el.firstElementChild;
              return { word: (block?.textContent ?? "").trim(), x: Math.round((block?.getBoundingClientRect().left ?? 0) - el.getBoundingClientRect().left), tray: getComputedStyle(el).backgroundColor };
            });
          const tray = await page.evaluate(() => {
            const probe = document.createElement("span");
            probe.style.backgroundColor = "var(--litt-tray)";
            document.body.append(probe);
            const c = getComputedStyle(probe).backgroundColor;
            probe.remove();
            return c;
          });
          const on = await look();
          if (on.word !== "On") throw new Error(`an on switch's block says "${on.word}", not On`);
          if (on.tray !== tray) throw new Error(`the tray is ${on.tray}, not --litt-tray (${tray})`);
          await sw.click();
          await page.waitForTimeout(600);
          if ((await sw.getAttribute("aria-checked")) !== "false") throw new Error("a click did not turn it off");
          const off = await look();
          if (off.word !== "Off" || off.x >= on.x) throw new Error(`off, the block says "${off.word}" at ${off.x}px; on it was at ${on.x}px`);
          await sw.focus();
          await page.keyboard.press("Space");
          await page.waitForTimeout(600);
          if ((await sw.getAttribute("aria-checked")) !== "true") throw new Error("Space did not turn it back on");
          return `On at ${on.x}px, Off at ${off.x}px, on --litt-tray`;
        });
      }
      if (has("accordion")) {
        await attempt("accordion: triggers in headings, one section open at a time, the keys move between them, and rows move by transform while heights snap", async () => {
          const box = item("accordion").locator("[data-testid=litt-accordion]");
          const first = box.getByRole("button", { name: "How does a project start?" });
          const second = box.getByRole("button", { name: "How long does a site take?" });
          const third = box.getByRole("button", { name: "Do you write the copy?" });
          await first.waitFor({ state: "visible", timeout: 8000 });
          await first.scrollIntoViewIfNeeded();
          if ((await first.getAttribute("aria-expanded")) !== "true") throw new Error("the default section did not start open");
          const heading = await first.evaluate((el) => el.parentElement?.tagName);
          if (heading !== "H3") throw new Error(`a trigger sits in ${heading}, not an h3`);
          const tall = await first.evaluate((el) => el.getBoundingClientRect().height);
          if (tall < 56) throw new Error(`a trigger is ${tall}px tall, under 56`);
          const region = box.getByRole("region", { name: "How does a project start?" });
          await region.waitFor({ state: "visible", timeout: 3000 });
          if ((await first.getAttribute("aria-controls")) !== (await region.getAttribute("id"))) throw new Error("aria-controls does not name the open region");

          /* Hairlines: one above the first row and one under every row, 1px in --litt-line. */
          const line = await page.evaluate(() => {
            const probe = document.createElement("span");
            probe.style.color = "var(--litt-line)";
            document.body.append(probe);
            const c = getComputedStyle(probe).color;
            probe.remove();
            return c;
          });
          const edges = await first.evaluate((el) => {
            const item = el.closest("h3").parentElement;
            const root = item.parentElement;
            return [getComputedStyle(root).borderTopWidth, getComputedStyle(root).borderTopColor, getComputedStyle(item).borderBottomWidth, getComputedStyle(item).borderBottomColor];
          });
          if (edges.join("|") !== `1px|${line}|1px|${line}`) throw new Error(`the hairlines are ${edges.join(" / ")}, not 1px of --litt-line (${line})`);

          /* Open the second: the first closes, the second row rises by a translate (never a scale), and the new
             content has its full height from the first frame, because heights snap. */
          const frames = await second.evaluate(async (btn) => {
            const item = btn.closest("h3").parentElement;
            const out = [];
            btn.click();
            for (let i = 0; i < 8; i++) {
              await new Promise((r) => requestAnimationFrame(() => setTimeout(r, 0)));
              const m = new DOMMatrixReadOnly(getComputedStyle(item).transform);
              const content = item.querySelector("[role=region]");
              out.push({ y: m.m42, sx: m.a, sy: m.d, h: content ? Math.round(content.getBoundingClientRect().height) : 0 });
            }
            return out;
          });
          if (!frames.some((f) => Math.abs(f.y) > 1)) throw new Error(`the second row did not move by transform: ${JSON.stringify(frames)}`);
          if (frames.some((f) => Math.abs(f.sx - 1) > 0.001 || Math.abs(f.sy - 1) > 0.001)) throw new Error("a row scaled, so its text would stretch");
          if (!frames[0].h || new Set(frames.map((f) => f.h)).size !== 1) throw new Error(`the content's height changed while it opened: ${frames.map((f) => f.h).join(",")}`);
          await page.waitForTimeout(900);
          if ((await first.getAttribute("aria-expanded")) !== "false" || (await second.getAttribute("aria-expanded")) !== "true") throw new Error("opening the second did not close the first");
          if (await box.getByRole("region", { name: "How does a project start?" }).count()) throw new Error("the closed section's content is still in the page");
          const settled = await second.evaluate((el) => {
            const item = el.closest("h3").parentElement;
            return { tf: getComputedStyle(item).transform, minH: item.parentElement.style.minHeight };
          });
          if ((settled.tf !== "none" && !/^matrix\(1, 0, 0, 1, 0, 0\)$/.test(settled.tf)) || settled.minH) throw new Error(`after the motion the row is ${settled.tf} and the root holds ${settled.minH || "no"} min-height`);

          /* Keys: arrows move between triggers, Home and End go to the ends, Space toggles. */
          await page.keyboard.press("Shift");
          await first.focus();
          const focused = () => page.evaluate(() => document.activeElement?.textContent?.trim());
          await page.keyboard.press("ArrowDown");
          if ((await focused()) !== "How long does a site take?") throw new Error(`ArrowDown landed on "${await focused()}"`);
          await page.keyboard.press("End");
          if ((await focused()) !== "Do you write the copy?") throw new Error(`End landed on "${await focused()}"`);
          await page.keyboard.press("Home");
          if ((await focused()) !== "How does a project start?") throw new Error(`Home landed on "${await focused()}"`);
          await page.keyboard.press("Space");
          await page.waitForTimeout(600);
          if ((await first.getAttribute("aria-expanded")) !== "true") throw new Error("Space did not open the focused section");
          const ring = await first.evaluate((el) => getComputedStyle(el).outlineWidth);
          if (ring !== "2px") throw new Error(`keyboard focus draws a ${ring} ring, not 2px`);
          if ((await third.getAttribute("aria-expanded")) !== "false") throw new Error("the third section opened on its own");

          /* Several open, controlled, under h4 headings. */
          const analytics = box.getByRole("button", { name: "Analytics" });
          if ((await analytics.evaluate((el) => el.parentElement?.tagName)) !== "H4") throw new Error("headingLevel={4} did not put the trigger in an h4");
          await analytics.click();
          await page.waitForTimeout(500);
          const open = (await box.locator("[data-testid=accordion-open]").textContent())?.trim();
          if (open !== "domain,analytics") throw new Error(`with type multiple the value reads "${open}", not "domain,analytics"`);
          await page.evaluate(() => document.activeElement?.blur());
          return `rose by ${Math.round(Math.max(...frames.map((f) => Math.abs(f.y))))}px, content ${frames[0].h}px from the first frame`;
        });
      }
      if (has("scroll-area")) {
        await attempt("scroll area: a labelled Tab stop that scrolls natively, a hairline on each edge with more beyond it, and a thumb only once it scrolls", async () => {
          const box = item("scroll-area").locator("[data-testid=litt-scroll-area]");
          const log = box.getByRole("region", { name: "Smoke log" });
          await page.mouse.move(1, 1); // a mouse over the area would show the thumb before any scroll
          await log.waitFor({ state: "visible", timeout: 8000 });
          await log.scrollIntoViewIfNeeded();
          await page.waitForTimeout(300);
          if ((await log.getAttribute("tabindex")) !== "0") throw new Error("the scrolling region is not a Tab stop");
          if ((await log.evaluate((el) => getComputedStyle(el).overflowY)) !== "scroll") throw new Error("the region does not scroll natively");
          const short = box.locator("[data-radix-scroll-area-viewport]").nth(2);
          if ((await short.getAttribute("tabindex")) !== null || (await short.getAttribute("role")) !== null) throw new Error("a box that does not scroll is a Tab stop or a landmark");

          const paint = (value) =>
            page.evaluate((v) => {
              const probe = document.createElement("span");
              probe.style.backgroundColor = v;
              document.body.append(probe);
              const c = getComputedStyle(probe).backgroundColor;
              probe.remove();
              return c;
            }, value);
          const line = await paint("var(--litt-line)");
          const none = "rgba(0, 0, 0, 0)";
          const hairlines = (region) => region.evaluate((el) => [...el.parentElement.querySelectorAll(":scope > span[aria-hidden=true]")].map((s) => getComputedStyle(s).backgroundColor));
          const thumbBar = (region, axis) => region.locator(`xpath=../div[@data-orientation="${axis}"]`);
          const bar = thumbBar(log, "vertical");
          const opacity = () => bar.evaluate((el) => getComputedStyle(el).opacity);

          let [top, bottom] = await hairlines(log);
          if (top !== none || bottom !== line) throw new Error(`at the top the hairlines are ${top} / ${bottom}, not none / --litt-line`);
          if ((await opacity()) !== "0") throw new Error("the thumb shows before anyone scrolled");

          /* The keyboard scrolls it, with an inset 2px ring. */
          await page.keyboard.press("Shift");
          await log.focus();
          const ring = await log.evaluate((el) => [getComputedStyle(el).outlineWidth, getComputedStyle(el).outlineOffset]);
          if (ring.join(" ") !== "2px -2px") throw new Error(`keyboard focus draws ${ring.join(" at ")}, not an inset 2px ring`);
          await page.keyboard.press("End");
          await page.waitForTimeout(250);
          if ((await opacity()) !== "1") throw new Error("the thumb did not show while the area scrolled");
          const thumb = await bar.evaluate((el) => {
            const t = el.firstElementChild;
            return t ? [Math.round(t.getBoundingClientRect().width), getComputedStyle(t).backgroundColor] : null;
          });
          const fg24 = await paint("color-mix(in oklab, var(--litt-fg) 24%, transparent)");
          if (!thumb || thumb[0] !== 6 || thumb[1] !== fg24) throw new Error(`the thumb is ${JSON.stringify(thumb)}, not 6px of fg 24% (${fg24})`);
          await page.waitForFunction((el) => Math.abs(el.scrollTop + el.clientHeight - el.scrollHeight) <= 1, await log.elementHandle(), { timeout: 3000 });
          await page.waitForTimeout(150);
          [top, bottom] = await hairlines(log);
          if (top !== line || bottom !== none) throw new Error(`at the end the hairlines are ${top} / ${bottom}, not --litt-line / none`);
          await page.waitForTimeout(1200);
          if ((await opacity()) !== "0") throw new Error("the thumb did not fade after the scrolling stopped");
          await page.evaluate(() => document.activeElement?.blur());

          /* Sideways: the right edge has more, the left does not. */
          const strip = box.getByRole("region", { name: "Smoke strip" });
          const [left, right] = await hairlines(strip);
          if (left !== none || right !== line) throw new Error(`the strip's edges are ${left} / ${right}, not none / --litt-line`);
          if ((await thumbBar(strip, "horizontal").count()) !== 1) throw new Error("the strip has no horizontal scrollbar");
          return `thumb ${thumb[0]}px in ${thumb[1]}, hairlines follow the scroll`;
        });
      }
      if (has("slider")) {
        await attempt("slider steps with the arrow keys", async () => {
          const thumb = item("slider").getByRole("slider", { name: "Animation speed" });
          const before = await thumb.getAttribute("aria-valuetext");
          await thumb.focus();
          await page.keyboard.press("ArrowRight");
          await page.waitForTimeout(100);
          const after = await thumb.getAttribute("aria-valuetext");
          if (before !== "1.0x" || after !== "1.1x") throw new Error(`aria-valuetext went from ${before} to ${after}, expected 1.0x to 1.1x`);
          return `${before} to ${after}`;
        });
        await attempt("range slider: two named thumbs, the keys act on the focused one, the thumbs never cross, a form sends both values under one name", async () => {
          const from = item("slider").getByRole("slider", { name: "Smoke window, from" });
          const to = item("slider").getByRole("slider", { name: "Smoke window, to" });
          const read = async () => `${await from.getAttribute("aria-valuetext")}|${await to.getAttribute("aria-valuetext")}`;
          const start = await read();
          if (start !== "20s|80s") throw new Error(`the thumbs read ${start}, expected 20s|80s`);
          await from.focus();
          await page.keyboard.press("ArrowRight");
          await page.waitForTimeout(100);
          const stepped = await read();
          if (stepped !== "21s|80s") throw new Error(`ArrowRight on the from thumb gave ${stepped}, expected 21s|80s`);
          await page.keyboard.press("End");
          await page.waitForTimeout(100);
          const held = await read();
          if (held !== "79s|80s") throw new Error(`End on the from thumb gave ${held}, expected 79s|80s: it stops one step short of the to thumb`);
          await to.focus();
          await page.keyboard.press("ArrowLeft");
          await page.keyboard.press("Home");
          await page.waitForTimeout(100);
          const blocked = await read();
          if (blocked !== "79s|80s") throw new Error(`ArrowLeft and Home on the to thumb gave ${blocked}, expected 79s|80s: it cannot pass the from thumb`);
          await page.keyboard.press("End");
          await page.waitForTimeout(100);
          const apart = await read();
          if (apart !== "79s|100s") throw new Error(`End on the to thumb gave ${apart}, expected 79s|100s`);
          const shown = (await item("slider").locator("[data-testid=litt-range]").innerText()).replace(/\s+/g, " ");
          if (!shown.includes("79s to 100s")) throw new Error(`the shown value is not "79s to 100s": "${shown}"`);
          const root = item("slider").locator("[data-testid=litt-range] span[data-no-drag]");
          await root.scrollIntoViewIfNeeded();
          const rail = await root.boundingBox();
          const grip = await from.boundingBox();
          await page.mouse.move(grip.x + grip.width / 2, grip.y + grip.height / 2);
          await page.mouse.down();
          await page.mouse.move(rail.x + rail.width + 40, grip.y + grip.height / 2, { steps: 6 });
          await page.mouse.up();
          await page.waitForTimeout(100);
          const dragged = await read();
          if (dragged !== "99s|100s") throw new Error(`dragging the from thumb past the end gave ${dragged}, expected 99s|100s: it never crosses`);
          const sent = await item("slider").locator("[data-testid=litt-range]").evaluate((form) => new FormData(form).getAll("window"));
          if (sent.join("|") !== "99|100") throw new Error(`the form sent window=${sent.join(",")}, expected 99 and 100 under one name`);
          return `${dragged}, sent ${sent.join(" and ")}`;
        });
      }
      if (has("color-picker")) {
        await attempt("color picker opens on the area, the keys and the hex change it, the form sends the hex", async () => {
          const field = item("color-picker").getByRole("button", { name: /^Brand color/ });
          const before = (await field.textContent())?.trim() ?? "";
          if (!before.startsWith("#2f5bd3")) throw new Error(`the field reads "${before}"`);
          await field.click();
          const dialog = page.getByRole("dialog", { name: "Brand color" });
          await dialog.waitFor({ state: "visible", timeout: 5000 });
          await page.waitForTimeout(500);
          await page.screenshot({ path: path.join(shotsDir, `${tag}-${theme}-color-picker.png`) });
          const first = await page.evaluate(() => document.activeElement?.getAttribute("aria-label"));
          if (first !== "Saturation") throw new Error(`focus opened on "${first}", not the area`);
          await page.keyboard.press("Home");
          const grey = await page.evaluate(() => new FormData(document.querySelector("[data-item=color-picker] [data-testid=litt-color-picker]")).get("brand"));
          if (grey !== "#d3d3d3") throw new Error(`Home on the area made ${grey}, not #d3d3d3`);
          const hex = dialog.getByRole("textbox", { name: "Hex" });
          await hex.fill("c2643f");
          await hex.press("Enter");
          await page.keyboard.press("Escape");
          await dialog.waitFor({ state: "hidden", timeout: 4000 });
          const sent = await page.evaluate(() => new FormData(document.querySelector("[data-item=color-picker] [data-testid=litt-color-picker]")).get("brand"));
          if (sent !== "#c2643f") throw new Error(`the form sends brand=${sent}`);
          return `${before.slice(0, 7)} to ${sent}`;
        });
      }
      if (has("date-picker")) {
        const active = () => page.evaluate(() => document.activeElement?.getAttribute("aria-label") ?? "");
        await attempt("date picker opens on the picked day, the keys move, Enter picks and returns focus", async () => {
          const field = item("date-picker").getByRole("button", { name: /^Launch date/ });
          const before = (await field.textContent())?.trim();
          if (before !== "17 Oct 2026") throw new Error(`the field reads "${before}", not "17 Oct 2026"`);
          if ((await field.getAttribute("aria-haspopup")) !== "dialog") throw new Error("the field has no aria-haspopup=dialog");
          await field.click();
          const dialog = page.getByRole("dialog", { name: "Launch date" });
          await dialog.waitFor({ state: "visible", timeout: 5000 });
          await page.waitForTimeout(500);
          await page.screenshot({ path: path.join(shotsDir, `${tag}-${theme}-date-picker.png`) });
          const first = await active();
          if (!/^Saturday,? 17 October 2026.*selected$/.test(first)) throw new Error(`focus opened on "${first}", not the picked day`);
          await page.keyboard.press("ArrowRight");
          const moved = await active();
          if (!/^Sunday,? 18 October 2026/.test(moved)) throw new Error(`ArrowRight moved focus to "${moved}"`);
          await page.keyboard.press("Enter");
          await dialog.waitFor({ state: "hidden", timeout: 4000 });
          const after = (await field.textContent())?.trim();
          if (after !== "18 Oct 2026") throw new Error(`the field reads "${after}" after picking 18 October`);
          if (!(await field.evaluate((el) => el === document.activeElement))) throw new Error("focus did not return to the field");
          const sent = await page.evaluate(() => new FormData(document.querySelector("[data-item=date-picker] [data-testid=litt-date-picker]")).get("launch"));
          if (sent !== "2026-10-18") throw new Error(`the form sends launch=${sent}`);
          return `${before} to ${after}, sends ${sent}`;
        });
        await attempt("date range: a preset picks and closes, two days pick a range, the form sends start and end", async () => {
          const field = item("date-picker").getByRole("button", { name: /^Report period/ });
          const before = (await field.textContent())?.trim();
          if (before !== "3 Oct to 17 Oct 2026") throw new Error(`the field reads "${before}"`);
          const dialog = page.getByRole("dialog", { name: "Report period" });
          await field.click();
          await dialog.waitFor({ state: "visible", timeout: 5000 });
          await page.waitForTimeout(400);
          await dialog.getByRole("button", { name: "First week" }).click();
          await dialog.waitFor({ state: "hidden", timeout: 4000 });
          const preset = (await field.textContent())?.trim();
          if (preset !== "1 Oct to 7 Oct 2026") throw new Error(`the preset left the field at "${preset}"`);
          await page.waitForTimeout(300);
          await field.click();
          await dialog.waitFor({ state: "visible", timeout: 5000 });
          await page.waitForTimeout(400);
          await dialog.getByRole("button", { name: /^Monday,? 12 October 2026/ }).click();
          await page.waitForTimeout(200);
          if (!(await dialog.isVisible())) throw new Error("the popover closed after the first end of a range");
          await dialog.getByRole("button", { name: /^Wednesday,? 14 October 2026/ }).click();
          await dialog.waitFor({ state: "hidden", timeout: 4000 });
          const picked = (await field.textContent())?.trim();
          if (picked !== "12 Oct to 14 Oct 2026") throw new Error(`two picks left the field at "${picked}"`);
          const sent = await page.evaluate(() => {
            const data = new FormData(document.querySelector("[data-item=date-picker] [data-testid=litt-date-picker]"));
            return `${data.get("period-start")} ${data.get("period-end")}`;
          });
          if (sent !== "2026-10-12 2026-10-14") throw new Error(`the form sends ${sent}`);
          return `${preset}, then ${picked}`;
        });
        await attempt("calendar: six weeks always, the picked day is the foreground, PageDown slides a month, disabled days stay reachable", async () => {
          const cal = item("date-picker").getByRole("group", { name: "Studio schedule" });
          const grid = cal.getByRole("grid", { name: "October 2026" });
          await grid.waitFor({ state: "visible", timeout: 4000 });
          const measure = () =>
            cal.evaluate((el) => ({
              rows: el.querySelectorAll("[role=rowgroup] [role=row]").length,
              cells: el.querySelectorAll("[role=rowgroup] [role=gridcell]").length,
              height: Math.round(el.querySelector("[role=grid]").getBoundingClientRect().height),
              day: Math.round(el.querySelector("[role=rowgroup] button").getBoundingClientRect().height),
            }));
          const oct = await measure();
          if (oct.rows !== 6 || oct.cells !== 42) throw new Error(`October shows ${oct.rows} weeks and ${oct.cells} days, not 6 and 42`);
          if (oct.day < 40) throw new Error(`a day is ${oct.day}px tall, under 40`);
          const picked = cal.getByRole("button", { name: /^Saturday,? 17 October 2026.*selected$/ });
          const fill = await picked.evaluate((el) => getComputedStyle(el).backgroundColor);
          const fg = await page.evaluate(() => {
            const probe = document.createElement("span");
            probe.style.color = "var(--litt-fg)";
            document.body.append(probe);
            const c = getComputedStyle(probe).color;
            probe.remove();
            return c;
          });
          if (fill !== fg) throw new Error(`the picked day is ${fill}, not --litt-fg (${fg})`);
          const stops = await cal.locator("[role=rowgroup] button[tabindex='0']").count();
          if (stops !== 1) throw new Error(`the grid has ${stops} tab stops, not 1`);
          await picked.focus();
          await page.keyboard.press("PageDown");
          await cal.getByRole("grid", { name: "November 2026" }).waitFor({ timeout: 3000 });
          const nov = await active();
          if (!/^Tuesday,? 17 November 2026/.test(nov)) throw new Error(`PageDown moved focus to "${nov}"`);
          await page.waitForTimeout(700);
          const after = await measure();
          if (after.rows !== 6 || after.height !== oct.height) throw new Error(`November is ${after.rows} weeks and ${after.height}px tall; October was 6 and ${oct.height}px`);
          await page.keyboard.press("PageUp");
          for (const _ of [1, 2, 3]) await page.keyboard.press("ArrowRight");
          const off = await active();
          if (!/^Tuesday,? 20 October 2026/.test(off)) throw new Error(`three ArrowRights from 17 October reached "${off}"`);
          const disabled = await page.evaluate(() => document.activeElement?.getAttribute("aria-disabled"));
          if (disabled !== "true") throw new Error("the ruled-out day is not aria-disabled");
          await page.keyboard.press("Enter");
          await page.waitForTimeout(200);
          const still = await cal.getByRole("button", { name: /^Saturday,? 17 October 2026.*selected$/ }).count();
          if (still !== 1) throw new Error("Enter on a disabled day changed the pick");
          return `6 weeks, ${oct.height}px both months, day ${oct.day}px, fill ${fill}`;
        });
      }
      if (has("stat")) {
        await attempt("stat reads label, figure and a delta in the good color", async () => {
          const terms = await item("stat").locator("[data-testid=litt-stats] dt").allTextContents();
          if (terms.join("|") !== "Active projects|Median build") throw new Error(`the labels read ${terms.join("|")}`);
          const dd = item("stat").locator("[data-testid=litt-stats] dd").nth(1);
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
          const box = item("chart").locator("[data-testid=litt-charts]");
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
          const box = item("sparkline").locator("[data-testid=litt-sparklines]");
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
            const dd = item("stat").locator("[data-testid=litt-stats] dd").nth(1);
            const term = await item("stat").locator("[data-testid=litt-stats] dt").nth(1).innerText();
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
          const box = item("spread").locator("[data-testid=litt-spread]");
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
                  /* The median is the span in the row's median column. */
                  medRight: [...li.querySelectorAll("span")].find((el) => el.className.includes("col-start-[median]")).getBoundingClientRect().right,
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
          const box = item("breakdown").locator("[data-testid=litt-breakdown]");
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
      if (has("funnel")) {
        await attempt("funnel: one list of meters against the first step in one hue, the step lines in words, a step that went up held at 100%", async () => {
          const box = item("funnel").locator("[data-testid=litt-funnel]");
          const list = box.getByRole("list", { name: "Smoke funnel" });
          await list.waitFor({ state: "visible", timeout: 8000 });
          const colorOf = (v) => page.evaluate((value) => { const p = document.createElement("span"); p.style.color = value; document.body.append(p); const c = getComputedStyle(p).color; p.remove(); return c; }, v);
          const [teal, accent] = [await colorOf("var(--litt-data-teal)"), await colorOf("var(--litt-accent)")];
          const meters = await list.getByRole("meter").evaluateAll((els) => els.map((el) => ({ max: el.getAttribute("aria-valuemax"), now: el.getAttribute("aria-valuenow"), text: el.getAttribute("aria-valuetext"), share: el.firstElementChild.getBoundingClientRect().width / el.getBoundingClientRect().width, fill: getComputedStyle(el.firstElementChild).backgroundColor, h: el.getBoundingClientRect().height })));
          if (meters.length !== 4) throw new Error(`the funnel has ${meters.length} meters, not 4`);
          if (meters.some((m) => m.fill !== teal || m.fill === accent || m.h !== 4 || m.max !== "18240")) throw new Error(`the meters are ${JSON.stringify(meters)}, not teal 4px rails against 18,240`);
          if (meters[1].text !== "6,930 people, 38% of 18,240" || Math.abs(meters[1].share - 0.38) > 0.01) throw new Error(`Signed up reads ${JSON.stringify(meters[1])}`);
          const said = await box.locator("p.sr-only").first().textContent();
          if (said !== "Smoke funnel, 4.1% overall: 748 of 18,240 people") throw new Error(`the overall reads "${said}"`);
          const lines = await list.locator("li > p").allTextContents();
          if (lines.join("|") !== "38% continued|41% continued|26% continued") throw new Error(`the step lines read ${JSON.stringify(lines)}`);
          const odd = await box.getByRole("meter", { name: "Opened pricing" }).evaluate((el) => ({ now: el.getAttribute("aria-valuenow"), text: el.getAttribute("aria-valuetext"), share: el.firstElementChild.getBoundingClientRect().width / el.getBoundingClientRect().width }));
          if (odd.now !== "1200" || odd.text !== "1,450, 121% of 1,200" || Math.abs(odd.share - 1) > 0.01) throw new Error(`the step that went up reads ${JSON.stringify(odd)}`);
          if (!(await box.getByText("121% of the step before").isVisible())) throw new Error("the step that went up does not say it is more than the step before");
          return `4 teal meters; ${meters[1].text}`;
        });
      }
      if (has("cohort-grid")) {
        await attempt("cohort-grid: a native table with caption and headers, a number in every reached cell, dots in the hue's steps, an All cohorts row weighted by size, a narrow box that scrolls as one tab stop", async () => {
          const box = item("cohort-grid").locator("[data-testid=litt-cohort-grid]");
          const table = box.getByRole("table", { name: "Smoke retention" });
          await table.waitFor({ state: "visible", timeout: 8000 });
          const heads = (await table.getByRole("columnheader").allTextContents()).map((t) => t.trim());
          if (heads.join("|") !== "Cohort|Users|Week 0|Week 1|Week 2") throw new Error(`the headers read ${heads.join("|")}`);
          const rowOf = (name) => table.getByRole("row").filter({ has: page.getByRole("rowheader", { name, exact: true }) });
          const cells = async (name) => (await rowOf(name).getByRole("cell").allTextContents()).map((t) => t.trim()).join("|");
          if ((await cells("31 Aug")) !== "300|100%|40%|no data") throw new Error(`31 Aug reads ${await cells("31 Aug")}`);
          /* Week 1: (50 x 100 + 40 x 300) / 400 = 42.5, so 43%. Week 2: only 24 Aug has reached it. */
          if ((await cells("All cohorts")) !== "500|100%|43%|20%") throw new Error(`All cohorts reads ${await cells("All cohorts")}`);
          const colorOf = (v) =>
            page.evaluate((value) => {
              const probe = document.createElement("span");
              probe.style.color = value;
              document.body.append(probe);
              const c = getComputedStyle(probe).color;
              probe.remove();
              return c;
            }, v);
          const [teal, teal80, teal30, accent] = [
            await colorOf("var(--litt-data-teal)"),
            await colorOf("color-mix(in oklab, var(--litt-data-teal) 80%, transparent)"),
            await colorOf("color-mix(in oklab, var(--litt-data-teal) 30%, transparent)"),
            await colorOf("var(--litt-accent)"),
          ];
          const dots = await rowOf("24 Aug").getByRole("cell").evaluateAll((tds) =>
            tds.slice(1).map((td) => {
              const d = td.querySelector("[aria-hidden=true]");
              return d ? { bg: getComputedStyle(d).backgroundColor, size: `${d.getBoundingClientRect().width}x${d.getBoundingClientRect().height}` } : null;
            }),
          );
          /* Steps 1, 30, 45, 90: 100 is level 4, 50 level 3, 20 level 1. */
          const want = [teal, teal80, teal30];
          if (dots.length !== 3 || dots.some((d, i) => !d || d.bg !== want[i] || d.size !== "8x8")) throw new Error(`the 24 Aug dots are ${JSON.stringify(dots)}`);
          if (dots.some((d) => d.bg === accent)) throw new Error("a dot is the accent");
          const empty = await rowOf("31 Aug").getByRole("cell").nth(3).evaluate((td) => td.querySelector("[aria-hidden=true]") === null);
          if (!empty) throw new Error("a cell with no data draws a dot");
          const narrow = box.getByRole("group", { name: "Smoke narrow" });
          await narrow.waitFor({ state: "attached", timeout: 4000 });
          const scroll = await narrow.evaluate((el) => ({ tab: el.getAttribute("tabindex"), wider: el.scrollWidth > el.clientWidth }));
          if (scroll.tab !== "0" || !scroll.wider) throw new Error(`the narrow box is ${JSON.stringify(scroll)}, not a scrolling tab stop`);
          return "headers, cells, All cohorts 43%, dots in teal's steps, the narrow box scrolls as one stop";
        });
      }
      if (has("legend")) {
        await attempt("legend: a press flips aria-pressed, the last shown item stays and says why", async () => {
          const box = item("legend").locator("[data-testid=litt-legend]");
          const builds = box.getByRole("group", { name: "Smoke series" }).getByRole("button", { name: /^Builds/ });
          await builds.waitFor({ state: "visible", timeout: 8000 });
          if ((await builds.getAttribute("aria-pressed")) !== "true") throw new Error("Builds does not start pressed");
          await builds.click();
          if ((await builds.getAttribute("aria-pressed")) !== "false") throw new Error("a press did not hide Builds");
          await builds.click();
          if ((await builds.getAttribute("aria-pressed")) !== "true") throw new Error("a second press did not show Builds");
          const last = box.getByRole("group", { name: "Smoke last" }).getByRole("button", { name: /^Arcadia/ });
          if ((await last.getAttribute("aria-disabled")) !== "true") throw new Error("the last shown item is not aria-disabled");
          if ((await last.getAttribute("disabled")) !== null) throw new Error("the last item is natively disabled");
          /* Playwright treats aria-disabled as not enabled, so force the click. */
          await last.click({ force: true });
          if ((await last.getAttribute("aria-pressed")) !== "true") throw new Error("the last shown item was hidden");
          const note = await last.evaluate((b) => document.getElementById(b.getAttribute("aria-describedby") || "")?.textContent);
          if (note !== "At least one series stays shown.") throw new Error(`the last item's note reads "${note}"`);
          return "toggles, and the last one stays";
        });
      }
      if (has("pad")) {
        await attempt("pad: two sliders, one tab stop, the keys and a press move the thumb, the tooltip follows", async () => {
          const group = item("pad").getByRole("group", { name: "Your voice" });
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
          const box = item("gauge").locator("[data-testid=litt-gauges]");
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
        await attempt("gauge in fun mode comes to rest on the calm gauge's ticks and figure", async () => {
          const meter = item("gauge").locator("[data-testid=litt-gauge-fun]").getByRole("meter", { name: "Credits in fun mode" });
          await meter.waitFor({ state: "visible", timeout: 8000 });
          /* By now the arrival has played; what fun mode promises is that it rests on the calm gauge's frame. */
          await page.waitForTimeout(2500);
          const got = await meter.evaluate((el) => ({ figure: el.querySelector(":scope > div[aria-hidden] > span:nth-child(2)")?.textContent, ticks: [...el.querySelectorAll("svg path")].map((p) => ((p.getAttribute("d") || "").match(/M/g) || []).length), now: el.getAttribute("aria-valuenow") }));
          if (got.figure !== "20,830" || got.ticks.join("/") !== "15/32/1" || got.now !== "20830") throw new Error(`fun mode rests on ${JSON.stringify(got)}, not 20,830 on 15/32/1 ticks`);
          return "rests on 20,830 over 15/32/1 ticks, as the calm gauge does";
        });
      }
      if (has("bar-list")) {
        await attempt("bar list reads each row, lines the bars up, fills in the data hue, and its rows press", async () => {
          const box = item("bar-list").locator("[data-testid=litt-bar-list]");
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
              return { x: r.left, w: r.width, h: r.height, share: f.width / r.width, fill: getComputedStyle(fill).backgroundColor, radius: getComputedStyle(rail).borderRadius, value: li.querySelector("[class*='col-start-[value]']").getBoundingClientRect().right };
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
          const box = item("timeline").locator("[data-testid=litt-timeline]");
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
          /* Next.js serves inline styles without the space ("height:76px") and React keeps that until it re-renders the node. */
          const bar = list.locator("[style*='height: 76px'], [style*='height:76px']");
          const ghost = list.locator("[style*='height: 124px'], [style*='height:124px']");
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
          /* The smoke page is tall: bring the strip into the window, or the mouse lands outside it. */
          await strip.scrollIntoViewIfNeeded();
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
          const form = item("token-input").locator("[data-testid=litt-token-input]");
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
          const posted = () => page.evaluate(() => new FormData(document.querySelector("[data-item=token-input] [data-testid=litt-token-input]")).getAll("from").join("|"));
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
          const box = item("heatmap").locator("[data-testid=litt-heatmap]");
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
          const box = item("dot-plot").locator("[data-testid=litt-dotplot]");
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
          const box = item("avatar").locator("[data-testid=litt-avatars]");
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
          /* Pictures: each look paints its canvas from the renamed tokens, a name draws the same pixels twice, and the
             looks differ. All black would mean the tokens did not resolve. */
          const art = (id) =>
            box.getByTestId(id).evaluate((el) => {
              const c = el.querySelector("canvas");
              if (!c || !c.width) return null;
              const d = c.getContext("2d").getImageData(0, 0, c.width, c.height).data;
              let sum = 0;
              let hash = 0;
              for (let i = 0; i < d.length; i += 4) {
                sum += d[i] + d[i + 1] + d[i + 2];
                hash = (Math.imul(hash, 31) + d[i] * 7 + d[i + 1] * 3 + d[i + 2]) | 0;
              }
              return { mean: sum / (d.length / 4) / 3, hash, label: el.getAttribute("aria-label"), initials: el.innerText.trim(), opaque: d[3 + 4 * Math.floor(d.length / 8)] };
            });
          const [fluid, again2, film, thermal] = [await art("avatar-fluid"), await art("avatar-fluid-2"), await art("avatar-film"), await art("avatar-thermal")];
          for (const [look, a] of [["fluid", fluid], ["film", film], ["thermal", thermal]]) {
            if (!a) throw new Error(`look="${look}" drew no canvas`);
            if (a.opaque !== 255) throw new Error(`look="${look}" left its canvas transparent`);
            if (a.mean < 30) throw new Error(`look="${look}" is nearly black (mean ${a.mean.toFixed(0)}): the tokens did not resolve`);
            if (a.label !== "Halo Studio") throw new Error(`look="${look}" is named "${a.label}"`);
          }
          if (fluid.hash !== again2.hash) throw new Error("the same name drew two different fluid marks");
          if (fluid.hash === film.hash || film.hash === thermal.hash) throw new Error("two looks drew the same picture");
          return `32px, ${lap}px overlap, ${names.length} marks, three looks painted`;
        });
      }
      if (has("callout")) {
        await attempt("callout: a note with its tone in the icon only, the action below the text when narrow, and a close that unmounts", async () => {
          const box = item("callout").locator("[data-testid=litt-callout]");
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
      if (has("plan")) {
        await attempt("plan: an ordered list named by its label, the count over the rail, the running step current, failed and skipped said in words, done labels not struck through, a live region that follows the run", async () => {
          const box = item("plan").locator("[data-testid=litt-plan]");
          const running = box.locator("[data-testid=plan-running]");
          const list = running.getByRole("list", { name: "Smoke plan" });
          await list.waitFor({ state: "visible", timeout: 5000 });
          if ((await list.evaluate((el) => el.tagName)) !== "OL") throw new Error("the steps are not an ol");
          const items = list.getByRole("listitem");
          if ((await items.count()) !== 5) throw new Error(`${await items.count()} steps, not 5`);
          const tone = (value) =>
            page.evaluate((v) => {
              const el = document.createElement("span");
              document.body.append(el);
              el.style.color = v;
              const out = getComputedStyle(el).color;
              el.remove();
              return out;
            }, value);
          const [fg, muted, subtle, danger] = [await tone("var(--litt-fg)"), await tone("var(--litt-fg-muted)"), await tone("var(--litt-fg-subtle)"), await tone("var(--litt-danger)")];
          const readStep = (scope, n) =>
            scope.getByRole("listitem").nth(n).evaluate((li) => {
              const label = li.querySelector("p");
              return { text: li.textContent.replace(/\s+/g, " ").trim(), icon: getComputedStyle(li.querySelector("svg")).color, label: getComputedStyle(label).color, deco: getComputedStyle(label).textDecorationLine, current: li.getAttribute("aria-current"), height: li.getBoundingClientRect().height };
            });
          const [done, current, pending] = [await readStep(list, 0), await readStep(list, 2), await readStep(list, 3)];
          if (current.current !== "step" || (await list.locator("[aria-current=step]").count()) !== 1) throw new Error("the running step is not the one aria-current=step");
          if (!current.text.startsWith("Run the build, running")) throw new Error(`the running step reads "${current.text}"`);
          if (done.current) throw new Error("a done step is aria-current");
          if (!done.text.startsWith("Read the layout, done")) throw new Error(`a done step reads "${done.text}"`);
          if (done.icon !== muted || done.label !== muted) throw new Error(`a done step is ${done.label} / ${done.icon}, not --litt-fg-muted (${muted})`);
          if (done.deco !== "none") throw new Error(`a done label has text-decoration ${done.deco}`);
          if (current.icon !== fg || current.label !== fg) throw new Error(`the running step is ${current.label} / ${current.icon}, not --litt-fg (${fg})`);
          if (pending.icon !== subtle || pending.label !== subtle) throw new Error(`a pending step is ${pending.label}, not --litt-fg-subtle (${subtle})`);
          if (done.height < 32) throw new Error(`a row is ${done.height}px tall`);
          const shown = async () => ((await running.textContent()) ?? "").replace(/\s+/g, " ");
          if (!/Smoke plan ?2 of 5 steps done/.test(await shown())) throw new Error(`the header reads "${await shown()}"`);
          const fill = running.locator("div[aria-hidden=true] > div").first();
          const rail = await fill.evaluate((el) => ({ width: el.style.width, bg: getComputedStyle(el).backgroundColor, track: getComputedStyle(el.parentElement).height, motion: getComputedStyle(el).transitionDuration }));
          if (rail.width !== "40%") throw new Error(`the rail fill is ${rail.width}, not 40%`);
          if (rail.bg !== fg) throw new Error(`the rail fill is ${rail.bg}, not --litt-fg (${fg})`);
          if (rail.track !== "4px") throw new Error(`the rail is ${rail.track} tall`);
          if (rail.motion !== "0s") throw new Error(`the rail fill transitions over ${rail.motion}`);
          if ((await running.getByRole("status").textContent())?.trim()) throw new Error("the live region spoke on the first render");
          const said = async (text) => {
            const deadline = Date.now() + 3000;
            while (Date.now() < deadline) {
              if ((await running.getByRole("status").textContent())?.trim() === text) return;
              await page.waitForTimeout(100);
            }
            throw new Error(`the live region says "${(await running.getByRole("status").textContent())?.trim()}", not "${text}"`);
          };
          await box.getByTestId("plan-next").click();
          await said("Step 4 of 5: Publish a preview");
          if (!/3 of 5 steps done/.test(await shown())) throw new Error(`the header reads "${await shown()}" after one step`);
          await box.getByTestId("plan-next").click();
          await box.getByTestId("plan-next").click();
          await said("Plan done");
          if (!/5 of 5 steps done/.test(await shown())) throw new Error(`the header reads "${await shown()}" at the end`);
          if (await list.locator("[aria-current=step]").count()) throw new Error("a step is still current when the plan is done");
          const failed = box.locator("[data-testid=plan-failed]");
          const [bad, skip] = [await readStep(failed, 1), await readStep(failed, 2)];
          if (bad.text !== "Run the build, failedFailedBuild failed: font file missing") throw new Error(`the failed step reads "${bad.text}"`);
          if (bad.icon !== danger) throw new Error(`the failed icon is ${bad.icon}, not --litt-danger (${danger})`);
          if (bad.label !== fg) throw new Error(`the failed label is ${bad.label}, not --litt-fg (${fg})`);
          if (skip.text !== "Compress the videos, skippedSkipped" || skip.icon !== subtle) throw new Error(`the skipped step reads "${skip.text}" in ${skip.icon}`);
          if (!/1 of 4 steps done/.test(((await failed.textContent()) ?? "").replace(/\s+/g, " "))) throw new Error("a failed and a skipped step counted as done");
          return "ol, aria-current, fg tones, danger x, 40% rail, Step 4 of 5 then Plan done";
        });
      }
      if (has("tool-call")) {
        await attempt("tool call: a failed row says Failed and opens its output, a group folds its calls, Allow is the accent, calls back and becomes a row", async () => {
          const box = item("tool-call").locator("[data-testid=litt-tool-call]");
          const colorOf = (v) =>
            page.evaluate((value) => {
              const probe = document.createElement("span");
              probe.style.color = value;
              document.body.append(probe);
              const c = getComputedStyle(probe).color;
              probe.remove();
              return c;
            }, v);
          const [danger, accent] = [await colorOf("var(--litt-danger)"), await colorOf("var(--litt-accent)")];
          const row = box.getByRole("button", { name: "Ran npm run build Failed 14 seconds" });
          await row.waitFor({ state: "visible", timeout: 8000 });
          if ((await row.getAttribute("aria-expanded")) !== "false") throw new Error("the failed row starts open");
          await box.getByText("Failed", { exact: true }).waitFor({ state: "visible", timeout: 3000 });
          const mark = await row.locator("svg").first().evaluate((el) => getComputedStyle(el).color);
          if (mark !== danger) throw new Error(`the failed mark is ${mark}, not --litt-danger (${danger})`);
          if ((await box.getByRole("region").count()) !== 0) throw new Error("an output shows before the row is opened");
          await row.click();
          if ((await row.getAttribute("aria-expanded")) !== "true") throw new Error("a click did not set aria-expanded to true");
          const output = box.getByRole("region", { name: "Output of npm run build" });
          await output.waitFor({ state: "visible", timeout: 3000 });
          if ((await output.getAttribute("tabindex")) !== "0") throw new Error("the output is not focusable");
          if ((await output.innerText()).trim() !== "Build failed: no such file") throw new Error(`the output reads "${await output.innerText()}"`);
          const group = box.getByRole("button", { name: "Read 2 files and ran the tests" });
          if ((await group.getAttribute("aria-expanded")) !== "false") throw new Error("a group that is not running starts open");
          await group.click();
          const calls = box.getByRole("list", { name: "Read 2 files and ran the tests" }).getByRole("listitem");
          await calls.first().waitFor({ state: "visible", timeout: 3000 });
          if ((await calls.count()) !== 2) throw new Error(`the group holds ${await calls.count()} calls, not 2`);
          const panel = box.getByRole("group", { name: "Run a command?" });
          await panel.waitFor({ state: "visible", timeout: 3000 });
          const said = box.getByRole("status");
          await page.waitForFunction(() => document.querySelector("[data-item=tool-call] [data-testid=litt-tool-call] [role=status]")?.textContent?.trim() === "Waiting for your approval: npm run deploy", null, { timeout: 3000 });
          if ((await said.count()) !== 1) throw new Error("the approval has no live region");
          if (await panel.evaluate((el) => el.parentElement.contains(document.activeElement))) throw new Error("the approval took focus");
          const allow = box.getByRole("button", { name: "Allow", exact: true });
          const fill = await allow.evaluate((el) => getComputedStyle(el).backgroundColor);
          if (fill !== accent) throw new Error(`Allow is ${fill}, not --litt-accent (${accent})`);
          const glass = await panel.evaluate((el) => getComputedStyle(el).backdropFilter);
          if (glass && glass !== "none") throw new Error(`the approval panel has a backdrop filter: ${glass}`);
          await box.getByRole("checkbox", { name: "Always allow npm run deploy" }).waitFor({ state: "visible", timeout: 3000 });
          await allow.click();
          await panel.waitFor({ state: "detached", timeout: 3000 });
          if ((await box.getByTestId("tool-call-allowed").innerText()).trim() !== "1") throw new Error("Allow did not call onAllow once");
          await box.getByText("Allowed", { exact: true }).waitFor({ state: "visible", timeout: 3000 });
          return "Failed in words and --litt-danger, output opens, group folds two calls, Allow is --litt-accent and becomes an Allowed row";
        });
      }
      if (has("composer")) {
        await attempt("composer: Send is off when empty and the accent when not, Enter sends, Shift+Enter adds a line, Stop and Esc, chips remove", async () => {
          const box = item("composer").locator("[data-testid=litt-composer]");
          const field = box.getByRole("textbox", { name: "Message" });
          await field.waitFor({ state: "visible", timeout: 5000 });
          const probe = (prop, name) =>
            page.evaluate(
              ([p, n]) => {
                const el = document.createElement("span");
                document.body.append(el);
                el.style[p] = `var(${n})`;
                const out = getComputedStyle(el)[p];
                el.remove();
                return out;
              },
              [prop, name],
            );
          const frame = field.locator("xpath=ancestor::div[contains(@class,'group/box')][1]");
          const fill = (b) => b.evaluate((el) => getComputedStyle(el).backgroundColor);
          const send = box.getByRole("button", { name: "Send" });
          if (!(await send.isDisabled())) throw new Error("Send should be disabled while the field is empty");
          if ((await fill(send)) === (await probe("backgroundColor", "--litt-accent"))) throw new Error("a disabled Send must not be an accent fill");
          const rest = await frame.evaluate((el) => getComputedStyle(el).boxShadow);
          const line = await probe("color", "--litt-line-control");
          if (!rest.includes(line)) throw new Error(`the resting edge is "${rest}", not --litt-line-control (${line})`);
          await field.click();
          await page.waitForTimeout(400); // the edge fades on the instant tier
          const ring = await frame.evaluate((el) => getComputedStyle(el).boxShadow);
          const focus = await probe("color", "--litt-focus");
          if (!ring.includes(focus)) throw new Error(`the focused edge has no --litt-focus: "${ring}"`);
          await page.keyboard.type("Why did the Halo build fail?");
          if (await send.isDisabled()) throw new Error("typing should enable Send");
          await page.waitForTimeout(400); // the fill fades on the instant tier
          const accent = await probe("backgroundColor", "--litt-accent");
          if ((await fill(send)) !== accent) throw new Error(`Send fill is ${await fill(send)}, not --litt-accent (${accent})`);
          const one = (await field.boundingBox()).height;
          await page.keyboard.press("Shift+Enter");
          await page.keyboard.type("Second line");
          if ((await field.inputValue()) !== "Why did the Halo build fail?\nSecond line") throw new Error(`Shift+Enter gave ${JSON.stringify(await field.inputValue())}`);
          if (((await box.getByTestId("composer-sent").textContent()) ?? "") !== "") throw new Error("Shift+Enter sent the message");
          const two = (await field.boundingBox()).height;
          if (!(two > one + 10)) throw new Error(`the field did not grow a line: ${one}px to ${two}px`);
          await page.keyboard.press("Enter");
          await page.waitForTimeout(200);
          if ((await box.getByTestId("composer-sent").textContent()) !== "Why did the Halo build fail?\nSecond line") throw new Error("Enter should call onSend with the text");
          if ((await field.inputValue()) !== "") throw new Error("the field should clear after a send");
          const stop = box.getByRole("button", { name: "Stop" });
          await stop.waitFor({ state: "visible", timeout: 3000 });
          await page.waitForTimeout(400);
          if ((await fill(stop)) === accent) throw new Error("Stop must not be an accent fill");
          await field.click();
          await page.keyboard.press("Escape");
          await box.getByRole("button", { name: "Send" }).waitFor({ state: "visible", timeout: 3000 });
          const chips = box.getByRole("list", { name: "Attached files" }).getByRole("listitem");
          if ((await chips.count()) !== 2) throw new Error(`${await chips.count()} chips, expected 2`);
          const text = ((await chips.allTextContents()).join(" | ")).replace(/\s+/g, " ");
          if (!/brief\.pdf.*2\.4 MB/.test(text) || !/moodboard\.png.*64%/.test(text)) throw new Error(`the chips read "${text}"`);
          const tall = await chips.first().evaluate((el) => Math.round(el.getBoundingClientRect().height));
          if (tall !== 32) throw new Error(`a chip is ${tall}px tall, expected 32`);
          await box.getByRole("button", { name: "Remove brief.pdf" }).click();
          await page.waitForTimeout(500);
          if ((await chips.count()) !== 1) throw new Error("the x should remove the chip");
          await page.screenshot({ path: path.join(shotsDir, `${tag}-${theme}-composer.png`) });
          return `edge, accent Send, Shift+Enter ${one}px to ${two}px, Stop, chips`;
        });
      }
      if (has("code-block")) {
        await attempt("code block: a focusable labelled scroller, keywords in fg and comments the one grey, a diff's + is success on a band, Copy says Copied", async () => {
          const box = item("code-block").locator("[data-testid=litt-code-block]");
          const ts = box.getByRole("group", { name: "Smoke badge", exact: true });
          await ts.waitFor({ state: "visible", timeout: 8000 });
          if ((await ts.getAttribute("tabindex")) !== "0") throw new Error("the scroller is not focusable");
          await box.getByText("badge.ts", { exact: true }).waitFor({ state: "visible", timeout: 3000 });
          const colorOf = (v) =>
            page.evaluate((value) => {
              const probe = document.createElement("span");
              probe.style.color = value;
              document.body.append(probe);
              const c = getComputedStyle(probe).color;
              probe.remove();
              return c;
            }, v);
          const [fg, muted, subtle, success, danger, string] = [
            await colorOf("var(--litt-fg)"),
            await colorOf("var(--litt-fg-muted)"),
            await colorOf("var(--litt-fg-subtle)"),
            await colorOf("var(--litt-success)"),
            await colorOf("var(--litt-danger)"),
            await colorOf("color-mix(in oklab, var(--litt-accent-text) 90%, var(--litt-fg))"),
          ];
          const tones = await ts.evaluate((pre) => {
            const of = (cls, text) => {
              const el = [...pre.querySelectorAll(cls)].find((e) => e.textContent === text);
              return el ? getComputedStyle(el).color : null;
            };
            return { keyword: of(".sh__token--keyword", "const"), identifier: of(".sh__token--identifier", "label"), comment: of(".sh__token--comment", "// halo"), string: of(".sh__token--string", "live") };
          });
          if (tones.keyword === null || tones.identifier === null || tones.comment === null || tones.string === null) throw new Error(`a token is missing: ${JSON.stringify(tones)}`);
          /* v0.12: keywords take --fg, so comments stay the one grey in code now that body text and metadata share an ink. */
          if (tones.keyword !== fg) throw new Error(`the keyword is ${tones.keyword}, not --litt-fg (${fg})`);
          if (tones.comment === tones.keyword) throw new Error("a comment has the keyword's color; comments should be the one grey");
          if (tones.identifier !== fg) throw new Error(`the identifier is ${tones.identifier}, not --litt-fg (${fg})`);
          if (tones.comment !== subtle) throw new Error(`the comment is ${tones.comment}, not --litt-fg-subtle (${subtle})`);
          if (tones.string !== string) throw new Error(`the string is ${tones.string}, not accent text mixed 90% into fg (${string})`);
          const scroll = await ts.evaluate((pre) => ({ sw: pre.scrollWidth, cw: pre.clientWidth, row: pre.querySelector("code > span").getBoundingClientRect().width }));
          if (!(scroll.sw > scroll.cw + 40)) throw new Error(`the long line did not make the block scroll (${scroll.sw} against ${scroll.cw})`);
          if (Math.abs(scroll.row - scroll.sw) > 1) throw new Error(`a row is ${scroll.row}px wide, not the scroll width ${scroll.sw}px`);

          const diff = box.getByRole("group", { name: "Smoke diff", exact: true });
          const rows = await diff.evaluate((pre) =>
            [...pre.querySelectorAll("code > span")].map((r) => ({ text: r.children[1].textContent, bg: getComputedStyle(r).backgroundColor, sign: r.children[0].textContent, signColor: getComputedStyle(r.children[0]).color, color: getComputedStyle(r).color })),
          );
          const added = rows.find((r) => r.text.startsWith("Added: "));
          const removed = rows.find((r) => r.text.startsWith("Removed: "));
          if (!added || !removed) throw new Error(`the diff rows read ${JSON.stringify(rows.map((r) => r.text))}`);
          if (added.sign !== "+" || added.signColor !== success) throw new Error(`the + sign is "${added.sign}" in ${added.signColor}, not --litt-success (${success})`);
          if (removed.sign !== "-" || removed.signColor !== danger) throw new Error(`the - sign is "${removed.sign}" in ${removed.signColor}, not --litt-danger (${danger})`);
          if (removed.color !== subtle) throw new Error(`the removed line is ${removed.color}, not --litt-fg-subtle`);
          if (added.bg === "rgba(0, 0, 0, 0)" || added.bg !== removed.bg) throw new Error(`the bands are ${added.bg} and ${removed.bg}`);
          if (rows[1].bg !== "rgba(0, 0, 0, 0)") throw new Error("a context line has a band");

          await page.context().grantPermissions(["clipboard-read", "clipboard-write"], { origin: new URL(page.url()).origin });
          const block = ts.locator("xpath=..");
          await block.getByRole("button", { name: "Copy code" }).click();
          await block.getByRole("status").getByText("Copied").waitFor({ state: "attached", timeout: 3000 });
          const clip = await page.evaluate(() => navigator.clipboard.readText());
          const want = ["// halo", "const label = 'live';", "export default label;", "// a long comment that runs past the edge of a block twenty rem wide"].join("\n");
          if (clip !== want) throw new Error(`the clipboard holds ${JSON.stringify(clip)}`);
          return "tones from tokens, + in success, bands, scrolls inside the block, Copy copied the text as given";
        });
      }
      if (has("message")) {
        await attempt("message: two articles named by hidden headings, the person's bubble on the right, the agent's words bare, Copy says Copied politely", async () => {
          const box = item("message").locator("[data-testid=litt-message]");
          const region = box.getByRole("region", { name: "Smoke conversation" });
          await region.waitFor({ state: "visible", timeout: 5000 });
          if ((await region.getAttribute("tabindex")) !== "0") throw new Error("the scrolling region is not focusable");
          const articles = box.getByRole("article");
          if ((await articles.count()) !== 2) throw new Error(`${await articles.count()} articles, not 2`);
          for (const name of ["You", "Litt"]) {
            const heading = box.getByRole("heading", { name, exact: true });
            if ((await heading.count()) !== 1) throw new Error(`no heading named "${name}"`);
            const hidden = await heading.boundingBox();
            if (!hidden || hidden.width > 1.5 || hidden.height > 1.5) throw new Error(`the "${name}" heading is visible`);
          }
          const probe = (css, prop) =>
            page.evaluate(
              ([value, p]) => {
                const el = document.createElement("span");
                el.style[p] = value;
                document.body.append(el);
                const c = getComputedStyle(el)[p];
                el.remove();
                return c;
              },
              [css, prop],
            );
          const [surface, fg, muted, code6] = [
            await probe("var(--litt-surface-1)", "backgroundColor"),
            await probe("var(--litt-fg)", "color"),
            await probe("var(--litt-fg-muted)", "color"),
            await probe("color-mix(in oklab, var(--litt-fg) 6%, transparent)", "backgroundColor"),
          ];
          const geo = await box.evaluate((root) => {
            const [user, agent] = [...root.querySelectorAll("article")];
            const col = user.getBoundingClientRect();
            const bubble = user.firstElementChild.lastElementChild;
            const b = bubble.getBoundingClientRect();
            const turn = agent.firstElementChild;
            const cs = (el) => getComputedStyle(el);
            const code = root.querySelector("[data-testid=message-code]");
            return {
              right: col.right - b.right,
              left: b.left - col.left,
              width: col.width,
              bubbleBg: cs(bubble).backgroundColor,
              bubbleColor: cs(bubble).color,
              bubbleRadius: cs(bubble).borderTopLeftRadius,
              turnBg: cs(turn).backgroundColor,
              turnShadow: cs(turn).boxShadow,
              answer: cs(root.querySelector("[data-testid=message-answer]")).color,
              codeBg: cs(code).backgroundColor,
              codeRadius: cs(code).borderTopLeftRadius,
              codeWeight: cs(code).fontWeight,
            };
          });
          if (Math.abs(geo.right) > 1 || geo.left < geo.width * 0.3) throw new Error(`the bubble sits ${geo.left.toFixed(0)}px from the left and ${geo.right.toFixed(0)}px from the right of a ${geo.width.toFixed(0)}px turn, not at the right`);
          if (geo.bubbleBg !== surface) throw new Error(`the bubble fill is ${geo.bubbleBg}, not --litt-surface-1 (${surface})`);
          if (geo.bubbleColor !== fg) throw new Error(`the bubble text is ${geo.bubbleColor}, not --litt-fg (${fg})`);
          if (geo.bubbleRadius !== "8px") throw new Error(`the bubble radius is ${geo.bubbleRadius}, not the 8px surface radius`);
          if (geo.turnBg !== "rgba(0, 0, 0, 0)" || geo.turnShadow !== "none") throw new Error(`the agent's turn has a fill (${geo.turnBg}) or a shadow (${geo.turnShadow})`);
          if (geo.answer !== muted) throw new Error(`the agent's words are ${geo.answer}, not --litt-fg-muted (${muted})`);
          if (geo.codeBg !== code6 || geo.codeRadius !== "4px" || geo.codeWeight !== "400") throw new Error(`inline code is ${geo.codeBg} at ${geo.codeRadius}, weight ${geo.codeWeight}, not fg 6% at 4px, 400`);
          const latest = await box.getByRole("group", { name: "Message actions" }).evaluate((g) => getComputedStyle(g.parentElement).opacity);
          if (latest !== "1") throw new Error(`the latest turn's actions have opacity ${latest}, not 1`);
          if ((await box.getByRole("button", { name: "Retry", exact: true }).count()) !== 1) throw new Error("no Retry button in the actions");
          await box.getByRole("button", { name: "Copy", exact: true }).click();
          const said = box.getByRole("status").filter({ hasText: "Copied" });
          await said.waitFor({ state: "attached", timeout: 3000 });
          if ((await said.getAttribute("aria-live")) !== "polite") throw new Error(`the Copied status is aria-live ${await said.getAttribute("aria-live")}, not polite`);
          return "2 articles, bubble at the right on --litt-surface-1, a bare agent turn in --litt-fg-muted, Copied is polite";
        });
      }
      if (has("thinking")) {
        await attempt("thinking: a finished thought reads Thought for 12s, is closed and opens on click with its body; a live one counts seconds and never loops", async () => {
          const box = item("thinking").locator("[data-testid=litt-thinking]");
          const done = box.getByRole("button", { name: "Thought for 12 seconds" });
          await done.waitFor({ state: "visible", timeout: 5000 });
          if ((await done.getAttribute("aria-expanded")) !== "false") throw new Error("a finished thought starts open");
          const words = (btn) =>
            btn.evaluate((b) => [...b.querySelectorAll("span")].filter((s) => s.children.length === 0 && !s.classList.contains("sr-only")).map((s) => s.textContent).join(" "));
          const shown = await words(done);
          if (shown !== "Thought for 12s") throw new Error(`the row reads "${shown}"`);
          if (await box.getByText("Smoke reasoning one.").count()) throw new Error("the reasoning is in the page while closed");
          const rowBox = await done.boundingBox();
          if (Math.round(rowBox.height) !== 32) throw new Error(`the row is ${rowBox.height}px tall, not 32`);
          const probe = await page.evaluate(() => {
            const read = (v) => {
              const el = document.createElement("span");
              document.body.append(el);
              el.style.color = `var(${v})`;
              const c = getComputedStyle(el).color;
              el.remove();
              return c;
            };
            return { muted: read("--litt-fg-muted"), subtle: read("--litt-fg-subtle") };
          });
          await done.click();
          const body = box.getByText("Smoke reasoning one.");
          await body.waitFor({ state: "visible", timeout: 3000 });
          if ((await done.getAttribute("aria-expanded")) !== "true") throw new Error("aria-expanded is not true after a click");
          const controls = await done.getAttribute("aria-controls");
          if (!(await page.evaluate((id) => !!document.getElementById(id)?.textContent?.includes("Smoke reasoning two."), controls))) throw new Error(`aria-controls="${controls}" does not hold the reasoning`);
          const color = await body.evaluate((el) => getComputedStyle(el).color);
          if (color !== probe.subtle) throw new Error(`the reasoning is ${color}, not --litt-fg-subtle (${probe.subtle})`);
          await page.mouse.move(0, 0); // hover brightens the label to --litt-fg, so read it with the pointer away
          await page.waitForTimeout(400);
          const label = await done.evaluate((b) => getComputedStyle([...b.querySelectorAll("span")].find((s) => s.textContent === "Thought for")).color);
          if (label !== probe.muted) throw new Error(`the label is ${label}, not --litt-fg-muted (${probe.muted})`);
          const labelBox = await done.evaluate((b) => [...b.querySelectorAll("span")].find((s) => s.textContent === "Thought for").getBoundingClientRect().x);
          const bodyBox = await body.boundingBox();
          if (Math.abs(bodyBox.x - labelBox) > 1.5) throw new Error(`the reasoning starts at x=${bodyBox.x}, the label at x=${labelBox}`);
          await done.click();
          if ((await done.getAttribute("aria-expanded")) !== "false") throw new Error("a second click did not close it");
          await body.waitFor({ state: "detached", timeout: 3000 }); // the fade ends, then the height snaps

          const live = box.getByRole("button", { name: "Thinking", exact: true });
          await live.waitFor({ state: "visible", timeout: 3000 });
          if ((await live.getAttribute("aria-expanded")) !== "true") throw new Error("a live thought is not open");
          const clock = () => live.locator("span[aria-hidden=true]").first().textContent();
          const first = await clock();
          if (!/^\d+s$/.test(first ?? "")) throw new Error(`the live clock reads "${first}"`);
          const before = await live.boundingBox();
          await page.waitForTimeout(2300);
          const later = await clock();
          if (Number.parseInt(later) < Number.parseInt(first) + 2) throw new Error(`the clock went from ${first} to ${later} in 2.3 seconds`);
          const after = await live.boundingBox();
          if (before.x !== after.x || before.y !== after.y || before.height !== after.height) throw new Error("the row moved while the clock counted");
          const loops = await page.evaluate(() => document.getAnimations().filter((a) => a.effect?.getComputedTiming().iterations === Infinity).length);
          if (loops) throw new Error(`${loops} animation(s) loop while the agent thinks`);
          return `Thought for 12s, 32px, opens on click; live clock ${first} to ${later}`;
        });
      }
      if (has("app-shell")) {
        await attempt("app shell: a 240px sidebar as tall as the page, 36px rows, the current page marked", async () => {
          const shell = item("app-shell").locator("[data-testid=litt-shell]");
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
          const nav = item("pagination").getByRole("navigation", { name: "Smoke pages" });
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
          await item("popover").locator("[data-testid=popover-trigger]").click();
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
          await item("dialog").locator("[data-testid=dialog-trigger]").click();
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
          await item("command-menu").locator("[data-testid=cmd-trigger]").click();
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
          await item("toast").locator("[data-testid=toast-trigger]").click();
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
    const fill = () => page.evaluate(`(${COLOR_TO_RGB})(getComputedStyle(document.querySelector("[data-item=button] [data-testid=litt-primary]")).backgroundColor)`);
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
    const shell = itemOn(page, "app-shell").locator("[data-testid=litt-shell]");
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

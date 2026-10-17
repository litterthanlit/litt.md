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
    jsx: `<div className="w-full max-w-xl" data-testid="litt-stats"><StatGroup><Stat label="Active projects" value={12} /><Stat label="Median build" value={41} unit="s" delta="Down 6 s on last week" tone="good" /></StatGroup></div>`,
  },
  chart: {
    needs: ["BarChart", "LineChart", "Meter"],
    jsx: `<div className="grid w-full max-w-xl gap-6" data-testid="litt-charts">
          <BarChart label="Deploys per day" labels={["1 Oct", "2 Oct", "3 Oct", "4 Oct"]} series={[{ name: "Deploys", values: [5, 7, 4, 9] }]} height={160} />
          <LineChart label="Build time" labels={["1 Oct", "2 Oct", "3 Oct", "4 Oct"]} series={[{ name: "Build time", values: [44, 41, 46, 39] }]} formatValue={(v) => \`\${v} s\`} height={160} />
          <Meter label="Storage" value={42} valueText="42 of 100 GB" />
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
          const rows = await box.locator("table.sr-only").first().locator("tbody tr").count();
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
          return `${colors.length} mark colors, none the accent`;
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

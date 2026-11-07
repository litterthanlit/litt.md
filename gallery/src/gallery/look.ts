/**
 * A look: the accent, the material and motion's feel, the three Customize choices that can leave this browser. A link
 * carries one (?look=pink-flat-fun), and Copy setup turns one into the edits a project makes after it installs litt. Type
 * and shape stay out: litt's rules mark them Change (motion/rules.ts).
 *
 * Every word a look produces lives here. The file imports nothing, so scripts/test-look.mjs and scripts/gen-llms.mjs
 * run it alone under Node. index.html keeps a hand copy of the link's grammar for the first paint, and test-look runs
 * that copy against this one.
 */
export type Accent = "mono" | "blue4" | "pink";
/** The depth ladder said in press (raised blocks in sunken trays, lit from the top), flat (fill alone, on greys) or device
    (keys, wells and LCD glass on an aluminium body, proposals/device.md). */
export type Material = "press" | "flat" | "device";
export type Look = { readonly accent: Accent; readonly material: Material; readonly fun: boolean };
/** A look as a link names it: the accent, then -flat or -device, then -fun. One spelling per look, and no character URLSearchParams encodes. */
export type LookSlug = `${Accent}${"" | "-flat" | "-device"}${"" | "-fun"}`;
export type AccentInfo = {
  id: Accent;
  name: string;
  short?: string;
  note: string;
  /** The data-accent value tokens.css answers; null for Blue 4, which is tokens.css with no attribute. */
  attribute: "mono" | "pink" | null;
};

/** The accents in the order every picker shows them, each said in words (R5). */
export const ACCENTS: readonly AccentInfo[] = [
  { id: "mono", name: "Monochrome", short: "Mono", note: "The primary action in the ink", attribute: "mono" },
  { id: "blue4", name: "Blue 4", note: "Litt's cobalt, as the registry ships it", attribute: null },
  { id: "pink", name: "Pink", note: "A hot raspberry at Blue 4's weight", attribute: "pink" },
];
export const accentOf = (id: Accent) => ACCENTS.find((a) => a.id === id)!;

/**
 * What a world says about itself on its page (proposals/worlds.md): each is one short line, said in words (R5).
 * The gallery renders them as the Foundations cards; llms.txt ships them to agents.
 */
export type WorldFoundations = {
  color: string;
  type: string;
  light: string;
  shape: string;
  motion: string;
};
export type MaterialInfo = {
  id: Material;
  name: string;
  note: string;
  /** The data-material value tokens.css answers; null for Press, which is tokens.css with no attribute. */
  attribute: "flat" | "device" | null;
  /** The world's one line, under its name on its page and on the home's hero. */
  tagline: string;
  /** Who the world is for, as the lede under the tagline. */
  audience: string;
  /** The block page (src/gallery/pages/30-*.tsx, meta.block) the world opens on, live at real size. */
  hero: string;
  /** Its motion language in one line (foundations.md, Motion languages). */
  foundations: WorldFoundations;
};
/**
 * The materials in the order every picker shows them. A material is a world (proposals/worlds.md, decision 3): a page
 * you arrive on, named after it, with the one component tree under it. The world page's id is the material's id, and
 * the current world is look.material, so nothing here is state.
 */
export const MATERIALS: readonly MaterialInfo[] = [
  {
    id: "press",
    name: "Press",
    note: "Raised blocks in sunken trays, lit from the top",
    attribute: null,
    tagline: "Lit from above. Objects you can hold.",
    audience: "Product UI, settings and dashboards. What the registry installs.",
    hero: "dashboard",
    foundations: {
      color: "Warm stone neutrals at one hue, Blue 4 as the one accent, or monochrome or pink.",
      type: "Geist in three weights by role: text 400, titles 500, 12px labels 600. Nothing above 18px.",
      light: "One light from the top. Blocks rise from sunken trays, caps ride in slots, glass floats over the page.",
      shape: "Controls 4px, surfaces 8px, pills only for avatars and icon-only buttons, every corner concentric.",
      motion: "Things have weight. A set settles into place from above on the expressive spring; an overlay rises and settles. Nothing flies.",
    },
  },
  {
    id: "flat",
    name: "Flat",
    note: "Grey fills and hairlines, nothing casts",
    attribute: "flat",
    tagline: "Grey is the object. Nothing casts.",
    audience: "Sites, portfolios and reading. What the gallery opens in.",
    hero: "case-study",
    foundations: {
      color: "The same neutrals at chroma 0: neutral grey, nothing warm. The accent and the data hues are unchanged.",
      type: "Geist in three weights by role, as Press.",
      light: "None. The depth ladder is said by fill alone: grey is the object, a hairline is the place.",
      shape: "As Press: 4px, 8px and the pill, concentric.",
      motion: "Things come from where you touched them. A set deals out of what opened it and gathers back; an overlay grows from its opener.",
    },
  },
  {
    id: "device",
    name: "Device",
    note: "Keys and dark LCD screens on an aluminium body, full mono, an orange accent",
    attribute: "device",
    tagline: "Hardware. Keys, wells and LCD glass, every word in the mono.",
    audience: "Agents, terminals and tools.",
    hero: "agent",
    foundations: {
      color: "A cool aluminium body, dark LCD screens for panels and overlays, an orange accent, the hues retuned to the body.",
      type: "Geist Mono for every word, in the three role weights. 12px labels are engraved capitals.",
      light: "Hardware. Plates on the body, wells cut into it, keys on a 2px skirt that sink the whole 2px, fields behind glass.",
      shape: "As Press: 4px, 8px and the pill, concentric.",
      motion: "Things are mechanisms. A set switches on in place in steps, as a display's segments light; an overlay switches on where it stands. Nothing fades or travels.",
    },
  },
];
export const materialOf = (id: Material) => MATERIALS.find((m) => m.id === id)!;
/** An accent's name in a material: Device answers the no-attribute accent with its own orange, so Blue 4 reads "Orange" there. */
export const accentName = (accent: Accent, material: Material, short = false) =>
  accent === "blue4" && material === "device" ? "Orange" : short ? (accentOf(accent).short ?? accentOf(accent).name) : accentOf(accent).name;

/** What the gallery opens in, and what Reset goes back to: a visitor meets the material before the color. */
export const GALLERY_LOOK: Look = { accent: "mono", material: "flat", fun: false };
/** What the registry installs: tokens.css with no attribute, and no <FunMode>. */
export const REGISTRY_LOOK: Look = { accent: "blue4", material: "press", fun: false };
/** Every look, in picker order: accent, then material, then motion. */
export const LOOKS: readonly Look[] = ACCENTS.flatMap((a) =>
  MATERIALS.flatMap((m) => [
    { accent: a.id, material: m.id, fun: false },
    { accent: a.id, material: m.id, fun: true },
  ]),
);
/** The link's query parameter. Never one of the Table page's (status, q, sort, site, time). */
export const LOOK_PARAM = "look";

export const sameLook = (a: Look, b: Look) => a.accent === b.accent && a.material === b.material && a.fun === b.fun;
export const encodeLook = (look: Look): LookSlug =>
  `${look.accent}${look.material === "press" ? "" : `-${look.material}`}${look.fun ? "-fun" : ""}` as LookSlug;
/** Strict, because it reads the address: anything but a LookSlug is null, and the caller ignores it. */
export const decodeLook = (raw: string | null | undefined): Look | null => LOOKS.find((l) => encodeLook(l) === raw) ?? null;
export const lookFromSearch = (search: string) => decodeLook(new URLSearchParams(search).get(LOOK_PARAM));

/** The query a new page entry keeps (route.ts): the look, and nothing else. */
export function lookSearch(search: string): "" | `?look=${LookSlug}` {
  const look = lookFromSearch(search);
  return look ? (`?${LOOK_PARAM}=${encodeLook(look)}` as const) : "";
}

/** An absolute href with the look set, or removed for null. Every other parameter and the hash stay. */
export function withLook(href: string, look: Look | null): string {
  const url = new URL(href);
  if (look) url.searchParams.set(LOOK_PARAM, encodeLook(look));
  else if (url.searchParams.has(LOOK_PARAM)) url.searchParams.delete(LOOK_PARAM);
  else return href;
  return url.href;
}

/**
 * The attributes that draw a part of the page in one look, whatever <html> and <body> run: the theme the part is in (a
 * [data-theme] root declares Blue 4 and the press material again), its accent and its material. A preview, a chip and
 * anything else that sets its own theme spreads these.
 */
export function lookAttributes(look: Pick<Look, "accent" | "material">, dark: boolean) {
  const out: { "data-theme": "light" | "dark"; "data-accent"?: "mono" | "pink"; "data-material"?: "flat" | "device" } = { "data-theme": dark ? "dark" : "light" };
  const accent = accentOf(look.accent).attribute, material = materialOf(look.material).attribute;
  if (accent) out["data-accent"] = accent;
  if (material) out["data-material"] = material;
  return out;
}

const motionWords = (fun: boolean) => (fun ? "fun motion" : "calm motion");
const materialWords = (material: Material) => `${material} material`;
/** In words (R5): "Pink, flat material, fun motion", "Monochrome, press material, calm motion". */
export const lookWords = (look: Look) => `${accentName(look.accent, look.material)}, ${materialWords(look.material)}, ${motionWords(look.fun)}`;

const REGISTRY_WORDS = `${accentOf(REGISTRY_LOOK.accent).name}, ${materialWords(REGISTRY_LOOK.material)} and ${motionWords(REGISTRY_LOOK.fun)}`;
const COUNT = ["no things", "one thing", "two things", "three things"];

/** The edits a look asks for, one per choice that differs from the registry's, as numbered setup steps. */
function edits(look: Look): string[] {
  const out: string[] = [];
  const attribute = accentOf(look.accent).attribute;
  if (attribute) {
    const attr = `data-accent="${attribute}"`;
    out.push(
      [
        `The accent: ${attr} on <html>.`,
        `   Next.js, app/layout.tsx: <html lang="en" ${attr}>    Vite, index.html: <html lang="en" ${attr}>`,
        `   On <html> it reaches every portal and paints before any script, in light, dark and the system setting. Never set it from an effect, and never restate --litt-accent in CSS.`,
        `   An element that sets its own theme (class="dark", class="light" or data-theme) needs ${attr} too.`,
      ].join("\n"),
    );
  }
  const material = materialOf(look.material).attribute;
  if (material) {
    const attr = `data-material="${material}"`;
    out.push(
      [
        `The material: ${attr} on <html>.`,
        `   Next.js, app/layout.tsx: <html lang="en" ${attr}>    Vite, index.html: <html lang="en" ${attr}>`,
        material === "flat"
          ? `   Flat says the depth ladder by fill alone, on neutral greys: nothing casts and nothing catches the light. Never set it from an effect.`
          : `   Device says the depth ladder in hardware: an aluminium body, keys that sink 2px, dark LCD screens for panels and overlays, an orange accent, and every word in Geist Mono (load it at 400, 500 and 600). Never set it from an effect.`,
        `   An element that sets its own theme (class="dark", class="light" or data-theme) needs ${attr} too.`,
      ].join("\n"),
    );
  }
  if (look.fun) {
    out.push(
      [
        `The motion: fun mode, a trial. import { FunMode } from "@/lib/litt/motion"`,
        `   Next.js, app/layout.tsx: <body><FunMode>{children}</FunMode></body>    Vite, src/main.tsx: <FunMode><App /></FunMode>`,
        `   It changes how litt's parts move, never how they look at rest, and reduced motion turns it off. If the trial ends, the changelog says so, and removing the wrapper is the whole change.`,
      ].join("\n"),
    );
  }
  return out;
}

const seeIt = (look: Look, site: string) => `See it: ${site}/?${LOOK_PARAM}=${encodeLook(look)}`;
const installLine = (items: string[], site: string) => `npx shadcn@latest add ${items.map((i) => `${site}/r/${i}.json`).join(" ")}`;

/** The Customize panel's one line: what a project changes for this look. */
export function lookInApp(look: Look): string {
  const attributes = [accentOf(look.accent).attribute, materialOf(look.material).attribute]
    .map((value, i) => value && `data-${i ? "material" : "accent"}="${value}"`)
    .filter(Boolean);
  const changes = [attributes.length && `${attributes.join(" and ")} on <html>`, look.fun && "<FunMode> around the app"].filter(Boolean);
  return changes.length ? `In your app: ${changes.join(", and ")}.` : "This is what the registry installs. Nothing to change.";
}

/** The Install section's line, or null for the look the registry installs: "This page shows Monochrome, calm motion. The registry installs Blue 4." */
export function lookNote(look: Look): string | null {
  if (sameLook(look, REGISTRY_LOOK)) return null;
  const instead = [
    look.accent !== REGISTRY_LOOK.accent && accentOf(REGISTRY_LOOK.accent).name,
    look.material !== REGISTRY_LOOK.material && materialWords(REGISTRY_LOOK.material),
    look.fun !== REGISTRY_LOOK.fun && motionWords(REGISTRY_LOOK.fun),
  ].filter(Boolean);
  return `This page shows ${lookWords(look)}. The registry installs ${instead.join(" and ")}.`;
}

/** Copy setup: what a person pastes into their coding agent, or follows by hand. `site` is where the gallery is served. */
export function lookSetup(look: Look, site: string): string {
  const steps = edits(look);
  const head = `Set up the litt.md look "${lookWords(look)}" in this project.`;
  return [
    steps.length
      ? `${head} The registry installs ${REGISTRY_WORDS}; this changes ${COUNT[steps.length]} and nothing else.`
      : `${head} It is what the registry installs.`,
    `1. ${installLine(look.fun ? ["litt", "motion"] : ["litt"], site)}   (skip what is installed)`,
    ...steps.map((s, i) => `${i + 2}. ${s}`),
    ...(steps.length ? [] : ["That is the whole look."]),
    seeIt(look, site),
  ].join("\n");
}

/** The Copy prompt's "Match the look" step, after the install; null for the look the registry installs. */
export function lookStep(look: Look, site: string): string | null {
  if (sameLook(look, REGISTRY_LOOK)) return null;
  return [
    `The page showed ${lookWords(look)}. The registry installs ${REGISTRY_WORDS}, so make these edits too.`,
    ...(look.fun ? [`Fun mode needs litt's motion engine: ${installLine(["motion"], site)}   (skip it if it is installed)`] : []),
    ...edits(look).map((s) => `- ${s}`),
    seeIt(look, site),
  ].join("\n");
}

/** llms.txt's "## Looks" section, for an agent handed a gallery link. */
export function looksDoc(site: string): string {
  return [
    `A look is the gallery's material (its world, chosen in the nav or on the deck), accent and motion feel (the Customize panel), and a link carries all three: ${site}/?${LOOK_PARAM}=${encodeLook({ accent: "pink", material: "flat", fun: true })}#button. ` +
      `Read the look from the link's text and make its edits. The gallery is a single-page app, so fetching the link returns no look. ` +
      `The registry installs \`${encodeLook(REGISTRY_LOOK)}\`, ${materialWords(REGISTRY_LOOK.material)}, ${motionWords(REGISTRY_LOOK.fun)}. The gallery opens in \`${encodeLook(GALLERY_LOOK)}\`.`,
    [
      `- The link: \`${LOOK_PARAM}=<accent>\`, then \`-flat\` or \`-device\` for the material, then \`-fun\` for fun mode, in that order (\`pink-flat-fun\`, \`mono-device\`). Anything else is not a look, and a look without a material is press.`,
      ...ACCENTS.map(
        (a) =>
          `- \`${a.id}\`, ${a.name} (${a.note[0]!.toLowerCase() + a.note.slice(1)}): ` +
          (a.attribute ? `\`data-accent="${a.attribute}"\` on \`<html>\`.` : "no attribute. It is what tokens.css ships."),
      ),
      ...MATERIALS.map(
        (m) =>
          `- ${m.attribute ? `\`-${m.attribute}\`` : "No material"}, ${m.name} (${m.note[0]!.toLowerCase() + m.note.slice(1)}): ` +
          (m.attribute ? `\`data-material="${m.attribute}"\` on \`<html>\`.` : "no attribute. It is what tokens.css ships."),
      ),
      `- \`-fun\`: wrap the app in \`<FunMode>\` from \`@/lib/litt/motion\` (the motion item). Fun mode is a trial: it changes how litt's parts move, never how they look at rest, and reduced motion turns it off.`,
      `- Put each attribute on \`<html>\` (Next.js app/layout.tsx, Vite index.html), never on a wrapper and never from an effect: there it reaches every portal and paints before any script, in light, dark and the system setting. An element that sets its own theme (\`class="dark"\`, \`class="light"\` or \`data-theme\`) needs them too. Never restate \`--litt-accent\` or the neutrals in CSS.`,
    ].join("\n"),
    `The ${LOOKS.length} looks: ${LOOKS.map((l) => `\`${encodeLook(l)}\` (${lookWords(l)})`).join(", ")}.`,
  ].join("\n\n");
}

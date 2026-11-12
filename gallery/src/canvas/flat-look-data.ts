/**
 * Candidate looks for Flat (proposals/flat-colour.md), after the two references Nick posted on 2026-11-12: "get some
 * color in flat and just lightness, ease of use. also motion should be snappy maybe?". Comparison data, not tokens:
 * the look Nick picks moves into the Flat block of tokens.css, and this file goes with the canvas. Every value is a
 * custom property a frame sets on its own data-material="flat" element, so every litt part inside reads it.
 *
 * Each accent is a set, as tokens.css's data-accent blocks are: the fill, its hover, the words on it, the accent as
 * text, its tint and the focus colour, for light and dark. They were derived from one fill in OKLCH and stepped until
 * every pair passed (words on the fill and the accent as text 4.5:1 on every ground and on the tint; the fill and the
 * focus 3:1 on every ground); the measured ratios are in the proposal.
 */
import type { CSSProperties } from "react";
import { SCALES } from "./scale";

export type AccentTones = { accent: string; hover: string; fg: string; text: string; tint: string; focus: string };
export type AccentSet = { light: AccentTones; dark: AccentTones };

/* Three hues for "An accent of its own": an azure (lighter and greener than Press's Blue 4, as bright as white words
   allow), a violet, and one warm hue, vermilion (Shu's middle stop). */
export const HUES = {
  azure: {
    light: { accent: "#0a6fdc", hover: "#0561c3", fg: "#ffffff", text: "#0769d2", tint: "#e8f1fd", focus: "#0a6fdc" }, // litt-allow: candidate accent (proposals/flat-colour.md)
    dark: { accent: "#0a6fdc", hover: "#1474e1", fg: "#ffffff", text: "#338cfb", tint: "#162437", focus: "#227dec" }, // litt-allow: candidate accent (proposals/flat-colour.md)
  },
  violet: {
    light: { accent: "#7b2ff7", hover: "#6e10e5", fg: "#ffffff", text: "#7b2ff7", tint: "#f0edff", focus: "#7b2ff7" }, // litt-allow: candidate accent (proposals/flat-colour.md)
    dark: { accent: "#7b2ff7", hover: "#8449fc", fg: "#ffffff", text: "#9570fc", tint: "#231c3c", focus: "#8956fc" }, // litt-allow: candidate accent (proposals/flat-colour.md)
  },
  vermilion: {
    light: { accent: "#d23a1c", hover: "#bf2906", fg: "#ffffff", text: "#cb3213", tint: "#feede9", focus: "#d23a1c" }, // litt-allow: candidate accent (proposals/flat-colour.md)
    dark: { accent: "#d23a1c", hover: "#d73f22", fg: "#ffffff", text: "#f1583b", tint: "#361c17", focus: "#db4326" }, // litt-allow: candidate accent (proposals/flat-colour.md)
  },
} satisfies Record<string, AccentSet>;

export type HueId = keyof typeof HUES;
export const HUE_NAMES: { id: HueId; name: string }[] = [
  { id: "azure", name: "Azure" },
  { id: "violet", name: "Violet" },
  { id: "vermilion", name: "Vermilion" },
];

/**
 * "The picture lends its colour": an accent from the middle stop of six bold long-exposure palettes
 * (streaks-palettes.ts). Where the middle stop cannot carry white words at 4.5:1 the fill falls back to a darker step
 * of the same hue (Yamabuki and Moegi), and where it cannot stand 3:1 off the dark grounds it is lifted a step in dark
 * (Murasaki). `fallback` says which, for the frame's note.
 */
export const LENT: { id: string; fallback?: string; set: AccentSet }[] = [
  {
    id: "beni",
    set: {
      light: { accent: "#c23a5b", hover: "#b1284d", fg: "#ffffff", text: "#c0385a", tint: "#fceced", focus: "#c23a5b" }, // litt-allow: candidate accent (proposals/flat-colour.md)
      dark: { accent: "#c23a5b", hover: "#cd4463", fg: "#ffffff", text: "#e55b77", tint: "#331b1f", focus: "#d14967" }, // litt-allow: candidate accent (proposals/flat-colour.md)
    },
  },
  {
    id: "yamabuki",
    fallback: "The gold of the picture carries white words at 2.65:1, and as a fill it stands only 2.4:1 off the page, so the accent is a darker step of the same gold.",
    set: {
      light: { accent: "#9c6a0b", hover: "#8a5d07", fg: "#ffffff", text: "#916208", tint: "#f5f0e8", focus: "#9c6a0c" }, // litt-allow: candidate accent (proposals/flat-colour.md)
      dark: { accent: "#9c6a0b", hover: "#8d5f08", fg: "#ffffff", text: "#b68230", tint: "#2b2216", focus: "#a8751f" }, // litt-allow: candidate accent (proposals/flat-colour.md)
    },
  },
  {
    id: "ruri",
    set: {
      light: { accent: "#3d68c6", hover: "#2f59b5", fg: "#ffffff", text: "#3c66c4", tint: "#eaf0fa", focus: "#3d68c6" }, // litt-allow: candidate accent (proposals/flat-colour.md)
      dark: { accent: "#3d68c6", hover: "#4773d2", fg: "#ffffff", text: "#5a88e9", tint: "#1a2233", focus: "#4f7bdb" }, // litt-allow: candidate accent (proposals/flat-colour.md)
    },
  },
  {
    id: "moegi",
    fallback: "The spring green of the picture carries white words at 2.9:1, so the accent is a darker step of the same green.",
    set: {
      light: { accent: "#558108", hover: "#4a7106", fg: "#ffffff", text: "#4e7705", tint: "#edf2e8", focus: "#558108" }, // litt-allow: candidate accent (proposals/flat-colour.md)
      dark: { accent: "#558108", hover: "#4c7408", fg: "#ffffff", text: "#6c9a2e", tint: "#1e2616", focus: "#639023" }, // litt-allow: candidate accent (proposals/flat-colour.md)
    },
  },
  {
    id: "murasaki",
    fallback: "In dark the purple stands 2.9:1 off the paper, so the fill is lifted a step there.",
    set: {
      light: { accent: "#8a3cb8", hover: "#7b2ba8", fg: "#ffffff", text: "#8a3cb8", tint: "#f3ecf9", focus: "#8a3cb8" }, // litt-allow: candidate accent (proposals/flat-colour.md)
      dark: { accent: "#8f41bd", hover: "#9b4ecb", fg: "#ffffff", text: "#b568e6", tint: "#291c31", focus: "#a356d3" }, // litt-allow: candidate accent (proposals/flat-colour.md)
    },
  },
  {
    id: "hanabi",
    set: {
      light: { accent: "#c32e78", hover: "#b1186a", fg: "#ffffff", text: "#c12c77", tint: "#fcebf1", focus: "#c32e78" }, // litt-allow: candidate accent (proposals/flat-colour.md)
      dark: { accent: "#c32e78", hover: "#cf3b82", fg: "#ffffff", text: "#e85397", tint: "#341a24", focus: "#d33e85" }, // litt-allow: candidate accent (proposals/flat-colour.md)
    },
  },
];

/** The accent set as the custom properties a part reads. --focus-ring, declared on the same Flat element, follows --focus. */
export function accentProps(t: AccentTones): CSSProperties {
  return {
    "--accent": t.accent,
    "--accent-hover": t.hover,
    "--accent-fg": t.fg,
    "--accent-text": t.text,
    "--accent-tint": t.tint,
    "--focus": t.focus,
  } as CSSProperties;
}

/**
 * Paper: a very light grey ground, and white paper on it. Neutral greys (chroma 0), as Flat's are. Fields and blocks
 * that sit on the ground become paper; the grey bubble stays for what is chosen inside paper (a table row under the
 * pointer, the slider's slot). In dark the ground is the darkest step and paper a lighter grey.
 */
const PAPER_LIGHT = {
  "--canvas": "#f2f2f2", // litt-allow: candidate paper ground
  "--well": "#f7f7f7", // litt-allow: candidate paper ground
  "--surface-1": "#ffffff", // litt-allow: candidate paper
  "--surface-2": "#ebebeb", // litt-allow: candidate paper
  "--surface-3": "#e4e4e4", // litt-allow: candidate paper
  "--block": "#ffffff", // litt-allow: candidate paper
  "--cut": "#ffffff", // litt-allow: candidate paper
  /* One soft layer, the same on every paper thing (R3 forbids an offset shadow; the rule question is in the proposal). */
  "--paper-lift": "0 4px 20px color-mix(in oklab, black 7%, transparent)", // litt-allow: candidate shadow, an offset layer R3 forbids today
} as CSSProperties;

const PAPER_DARK = {
  "--canvas": "#0b0b0b", // litt-allow: candidate paper ground
  "--well": "#121212", // litt-allow: candidate paper ground
  "--surface-1": "#171717", // litt-allow: candidate paper
  "--surface-2": "#141414", // litt-allow: candidate paper
  "--surface-3": "#242424", // litt-allow: candidate paper
  "--block": "#1f1f1f", // litt-allow: candidate paper
  "--cut": "#1f1f1f", // litt-allow: candidate paper
  "--paper-lift": "0 4px 20px color-mix(in oklab, black 60%, transparent)", // litt-allow: candidate shadow, an offset layer R3 forbids today
} as CSSProperties;

/* What every frame's sheets read: today a white surface with a hairline, as .litt-raised draws it. */
const SHEET_TODAY = { "--paper-lift": "inset 0 0 0 1px var(--line)" } as CSSProperties;

/* --field resolves on <html> from --cut there, so a frame that changes --cut restates it. */
const FIELD = { "--field": "var(--cut)" } as CSSProperties;

export const SPACE: CSSProperties = SCALES.find((s) => s.id === "space")!.vars;

export type LookId = "today" | "data" | "accent" | "paper" | "paper-accent" | "picture";

export type Look = {
  id: LookId;
  name: string;
  note: string;
  /** Chart and sparkline in a data hue, status as a tinted pill. */
  dataColour: boolean;
  /** Which accent: none (the ink), a picked hue, the azure, or the picture's. */
  accent: "ink" | "hue" | "azure" | "picture";
  paper: boolean;
  space: boolean;
};

export const LOOKS: Look[] = [
  { id: "today", name: "Today", note: "What Flat ships: the ink as the accent, grey pills on a white page, today's scale.", dataColour: false, accent: "ink", paper: false, space: false },
  {
    id: "data",
    name: "Colour in the data",
    note: "Controls stay ink. The chart and the sparkline draw in the first data hue, status is a tinted pill with its word, and the picture carries the rest. With Space.",
    dataColour: true,
    accent: "ink",
    paper: false,
    space: true,
  },
  {
    id: "accent",
    name: "An accent of its own",
    note: "One vivid hue for the primary button, the focus ring, links and the chosen segment (a pale tint, the word in the hue). Ticks and the slider stay ink. The switch asks for the accent, but Flat's switch body draws it in ink: a part fix, not a token. With Space.",
    dataColour: false,
    accent: "hue",
    paper: false,
    space: true,
  },
  {
    id: "paper",
    name: "Paper",
    note: "No hue. A very light grey ground; fields, blocks and sheets are white paper, the sheets a hair off the ground on one soft shadow. No borders. With Space.",
    dataColour: false,
    accent: "ink",
    paper: true,
    space: true,
  },
  {
    id: "paper-accent",
    name: "Paper with an accent",
    note: "Paper and the azure together: the nearest to the references, here to show the whole direction. With Space.",
    dataColour: false,
    accent: "azure",
    paper: true,
    space: true,
  },
  {
    id: "picture",
    name: "The picture lends its colour",
    note: "Paper, with the accent taken from the long exposure in the hero. Pick a palette: the picture and the accent change together. With Space.",
    dataColour: false,
    accent: "picture",
    paper: true,
    space: true,
  },
];

/** Every custom property a look sets on its frame, for one theme. */
export function lookProps(look: Look, dark: boolean, accent: AccentSet | null): CSSProperties {
  const tones = accent ? (dark ? accent.dark : accent.light) : null;
  return {
    ...(look.space ? SPACE : {}),
    ...(look.paper ? { ...(dark ? PAPER_DARK : PAPER_LIGHT), ...FIELD } : SHEET_TODAY),
    ...(tones ? accentProps(tones) : {}),
  } as CSSProperties;
}

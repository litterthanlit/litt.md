/**
 * Candidate colours for Flat's data (flat-data.tsx; Nick, 2026-11-18: "I meant the data visualization and just overall,
 * guages, heatmap, etc, should be colorful"). Comparison data, not tokens: the palette Nick picks goes through
 * evolve.md into Flat's block of tokens.css (the --flat-data-* values), and this file stays with the canvas. Every
 * value carries litt-allow, since every one is a candidate.
 *
 * Each palette has eight categorical hues in their fixed order (a mark step and a text step, light and dark), a
 * four-step sequential ramp (light to dark in light, dim to bright in dark), and a diverging pair whose midpoint is
 * Flat's own neutral. The values were picked with the dataviz skill's method and checked with its validator: in both
 * themes every mark stands 3:1 off the grey ground and the paper (light #ededed and #ffffff, dark #171717 and #090909),
 * every text step 4.5:1, each order passes the lightness band, the chroma floor, adjacent CVD separation (protan and
 * deutan) and the normal-vision floor, and its first three slots pass all pairs. The measured numbers are in the plan.
 */

export type Pair = { light: string; dark: string };
export type DataHue = { name: string; mark: Pair; text: Pair };
export type DataPalette = { name: string; line: string; hues: DataHue[]; seq: Pair[]; down: Pair; up: Pair };

const hue = (name: string, markLight: string, markDark: string, textLight: string, textDark: string): DataHue => ({
  name,
  mark: { light: markLight, dark: markDark },
  text: { light: textLight, dark: textDark },
});

export const DATA_PALETTES = {
  candy: {
    name: "Candy",
    line: "Bright and sweet: every hue at the most chroma the screen holds, a bubblegum ramp.",
    hues: [
      hue("blue", "#2983fe", "#4792fe", "#0065da", "#74acfe"), // litt-allow: candidate data hue
      hue("tangerine", "#da6203", "#e86904", "#af4d01", "#fe843d"), // litt-allow: candidate data hue
      hue("mint", "#019964", "#03af73", "#007a4f", "#0bca86"), // litt-allow: candidate data hue
      hue("grape", "#b15afe", "#b564ff", "#9730e4", "#c48cff"), // litt-allow: candidate data hue
      hue("cherry", "#ff3148", "#ff4451", "#d50230", "#ff7e7d"), // litt-allow: candidate data hue
      hue("sky", "#0090bf", "#03a1d5", "#047297", "#0cbaf4"), // litt-allow: candidate data hue
      hue("bubblegum", "#f92797", "#fd2d9b", "#cd057a", "#ff74b0"), // litt-allow: candidate data hue
      hue("sun", "#a68105", "#b68e0a", "#846604", "#d2a408"), // litt-allow: candidate data hue
    ],
    seq: [
      { light: "#ec7db5", dark: "#982b5a" }, // litt-allow: candidate sequential step
      { light: "#e44499", dark: "#d43b86" }, // litt-allow: candidate sequential step
      { light: "#c90f78", dark: "#f971b3" }, // litt-allow: candidate sequential step
      { light: "#a00358", dark: "#febad9" }, // litt-allow: candidate sequential step
    ],
    down: { light: "#da6203", dark: "#dd6301" }, // litt-allow: candidate diverging pole
    up: { light: "#0090bf", dark: "#0999c9" }, // litt-allow: candidate diverging pole
  },
  spectrum: {
    name: "Spectrum",
    line: "Warm to cool: hues spaced round the wheel, a sunset ramp from gold through coral to plum.",
    hues: [
      hue("indigo", "#587efa", "#5b81fe", "#3f60d9", "#87a7fe"), // litt-allow: candidate data hue
      hue("orange", "#cf6b02", "#d36d02", "#a55401", "#ff8506"), // litt-allow: candidate data hue
      hue("teal", "#0b9595", "#09a0a0", "#077676", "#03c3c3"), // litt-allow: candidate data hue
      hue("gold", "#a98007", "#b08505", "#876500", "#d6a20a"), // litt-allow: candidate data hue
      hue("magenta", "#d555b1", "#d354b0", "#b43694", "#f674d0"), // litt-allow: candidate data hue
      hue("green", "#029b29", "#1fa836", "#047b20", "#4bc957"), // litt-allow: candidate data hue
      hue("purple", "#b762da", "#b661da", "#9943bb", "#d780fc"), // litt-allow: candidate data hue
      hue("coral", "#e94e67", "#e84d66", "#c72c4c", "#ff7c8a"), // litt-allow: candidate data hue
    ],
    seq: [
      { light: "#de9814", dark: "#5c46a7" }, // litt-allow: candidate sequential step
      { light: "#e15f0a", dark: "#c547a3" }, // litt-allow: candidate sequential step
      { light: "#ca2356", dark: "#fa8054" }, // litt-allow: candidate sequential step
      { light: "#892784", dark: "#f7cc4b" }, // litt-allow: candidate sequential step
    ],
    down: { light: "#e94e67", dark: "#e84d66" }, // litt-allow: candidate diverging pole
    up: { light: "#0b9595", dark: "#09a0a0" }, // litt-allow: candidate diverging pole
  },
  studio: {
    name: "Studio",
    line: "Vivid but grown up, as Stripe or Linear charts: a little less chroma, an iris ramp.",
    hues: [
      hue("iris", "#6f7ee2", "#7988ed", "#5561c2", "#93a3ff"), // litt-allow: candidate data hue
      hue("amber", "#bc7700", "#c88004", "#955e02", "#e69825"), // litt-allow: candidate data hue
      hue("emerald", "#04986e", "#05ac7d", "#077957", "#1fc893"), // litt-allow: candidate data hue
      hue("violet", "#9972d7", "#a17adf", "#7d56b8", "#ba93fb"), // litt-allow: candidate data hue
      hue("tomato", "#d66448", "#de6b4f", "#b5462b", "#fa8467"), // litt-allow: candidate data hue
      hue("cyan", "#0b93ab", "#04a3be", "#047488", "#07bfde"), // litt-allow: candidate data hue
      hue("lime", "#6e9109", "#7da127", "#577304", "#95bb46"), // litt-allow: candidate data hue
      hue("pink", "#d26088", "#d9668e", "#b1426c", "#f57fa7"), // litt-allow: candidate data hue
    ],
    seq: [
      { light: "#97a3e1", dark: "#454ead" }, // litt-allow: candidate sequential step
      { light: "#7785d5", dark: "#6977d3" }, // litt-allow: candidate sequential step
      { light: "#5a66c7", dark: "#95a3e7" }, // litt-allow: candidate sequential step
      { light: "#4147b4", dark: "#c5cff9" }, // litt-allow: candidate sequential step
    ],
    down: { light: "#d26832", dark: "#d46a34" }, // litt-allow: candidate diverging pole
    up: { light: "#4087de", dark: "#468de5" }, // litt-allow: candidate diverging pole
  },
} satisfies Record<string, DataPalette>;

export type DataPaletteId = keyof typeof DATA_PALETTES;

/** The five hue names the parts take today, in their fixed order: a palette's first five slots fill them. */
export const SLOTS = ["blue", "amber", "teal", "violet", "rose"] as const;

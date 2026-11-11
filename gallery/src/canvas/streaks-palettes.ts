/**
 * The long exposures' palettes: five sRGB stops each, dark to light in luminance, so the ramp never bands or inverts.
 * Artwork, not tokens: the same in both themes. They are hex because a shader takes numbers; they are candidates
 * under comparison (proposals/bokashi.md), so each line carries litt-allow, and the picked ones move into tokens.css.
 *
 * Three groups:
 * - soft: the five from plan 007. Wakatake, Ai and Sakura are Gradient Keys' own, with its seeds; Sumi and Fuji
 *   were added in the same soft steps.
 * - pigment: one traditional colour at full strength, deeper and more saturated than the soft five.
 * - journey: a passage through more than one hue, still dark to light.
 * Warm palettes (Beni, Yamabuki, Yūyake, Momiji) are for Flat only: Flat's accent is the ink, while Device's is
 * orange and Press's is blue, and a warm picture there would read as a signal.
 */

/** Five sRGB hex stops, dark to light. */
export type Stops = readonly [string, string, string, string, string];

export type PaletteGroup = "soft" | "pigment" | "journey";

export type Exposure = {
  id: string;
  name: string;
  /** The Japanese name, as written. */
  kanji: string;
  note: string;
  group: PaletteGroup;
  palette: Stops;
  /** Picks the exposure: the same seed always opens on the same frame. */
  seed: number;
};

/** The five from plan 007, unchanged: the baseline row draws these. */
export const EXPOSURES: Exposure[] = [
  { id: "wakatake", name: "Wakatake", kanji: "若竹", note: "Young bamboo", group: "soft", seed: 3, palette: ["#264d35", "#3b6e4e", "#6da47a", "#a9cba3", "#e1ecdc"] }, // litt-allow: artwork, a candidate palette (proposals/bokashi.md)
  { id: "ai", name: "Ai", kanji: "藍", note: "Indigo, fading to asagi", group: "soft", seed: 1, palette: ["#16213d", "#1f2f54", "#3f5f8f", "#7fa6c2", "#c9dde6"] }, // litt-allow: artwork, a candidate palette (proposals/bokashi.md)
  { id: "sakura", name: "Sakura", kanji: "桜", note: "Cherry, fading to shell white", group: "soft", seed: 5, palette: ["#b06e7c", "#d796a6", "#e9b5c1", "#f5d8de", "#fbf2ee"] }, // litt-allow: artwork, a candidate palette (proposals/bokashi.md)
  { id: "sumi", name: "Sumi", kanji: "墨", note: "Ink, from full to paper. New here", group: "soft", seed: 7, palette: ["#2b2c30", "#55575d", "#8f9197", "#c8cacd", "#f0f0ee"] }, // litt-allow: artwork, a candidate palette (proposals/bokashi.md)
  { id: "fuji", name: "Fuji", kanji: "藤", note: "Wisteria. New here", group: "soft", seed: 9, palette: ["#463c69", "#6a5d94", "#9b8fc0", "#cbc3e0", "#f0ecf6"] }, // litt-allow: artwork, a candidate palette (proposals/bokashi.md)
];

/** The new ones: three pigments at full strength, four journeys. */
const MORE: Exposure[] = [
  { id: "ruri", name: "Ruri", kanji: "瑠璃", note: "Lapis lazuli", group: "pigment", seed: 2, palette: ["#0c1a4d", "#1b3a8f", "#3d68c6", "#8eaee6", "#dfe8f8"] }, // litt-allow: artwork, a candidate palette (proposals/bokashi.md)
  { id: "beni", name: "Beni", kanji: "紅", note: "Safflower crimson", group: "pigment", seed: 4, palette: ["#3b0a19", "#7c1631", "#c23a5b", "#ea95a8", "#fae3e8"] }, // litt-allow: artwork, a candidate palette (proposals/bokashi.md)
  { id: "yamabuki", name: "Yamabuki", kanji: "山吹", note: "Kerria gold", group: "pigment", seed: 6, palette: ["#4a2b06", "#8a5a0d", "#d4921b", "#f1c85d", "#fbf0cf"] }, // litt-allow: artwork, a candidate palette (proposals/bokashi.md)
  { id: "yuyake", name: "Yūyake", kanji: "夕焼け", note: "Sunset: indigo, violet, coral, gold", group: "journey", seed: 8, palette: ["#1b1840", "#4a2a6b", "#b4506a", "#f09a5e", "#fbe0a8"] }, // litt-allow: artwork, a candidate palette (proposals/bokashi.md)
  { id: "ajisai", name: "Ajisai", kanji: "紫陽花", note: "Hydrangea: blue, violet, pink", group: "journey", seed: 10, palette: ["#182a5a", "#2f5aa6", "#8a7cc8", "#e0a3c8", "#f8e6ee"] }, // litt-allow: artwork, a candidate palette (proposals/bokashi.md)
  { id: "momiji", name: "Momiji", kanji: "紅葉", note: "Autumn maples: deep green, rust, gold", group: "journey", seed: 11, palette: ["#1d3324", "#6b3a1e", "#b8532a", "#e6a43c", "#f7e6bd"] }, // litt-allow: artwork, a candidate palette (proposals/bokashi.md)
  { id: "hotaru", name: "Hotaru", kanji: "蛍", note: "Fireflies: night blue to a yellow-green glow", group: "journey", seed: 12, palette: ["#0c1622", "#16323a", "#2f5e4a", "#7fa64a", "#dfe9a8"] }, // litt-allow: artwork, a candidate palette (proposals/bokashi.md)
];

export const PALETTES: Exposure[] = [...EXPOSURES, ...MORE];

export const paletteById = (id: string) => PALETTES.find((p) => p.id === id) ?? PALETTES[0]!;

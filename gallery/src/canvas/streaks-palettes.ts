/**
 * The long exposures' palettes: five sRGB stops each, dark to light in luminance, so the ramp never bands or inverts.
 * Artwork, not tokens: the same in both themes. They are hex because a shader takes numbers; they are candidates
 * under comparison (proposals/long-exposures.md), so each line carries litt-allow, and the picked ones move into
 * tokens.css.
 *
 * Three groups:
 * - pigment: one traditional colour at full strength.
 * - journey: a passage through more than one hue, still dark to light, the second hue arriving suddenly.
 * - soft: the five from plan 007. Wakatake, Ai and Sakura are Gradient Keys' own, with its seeds; Sumi and Fuji
 *   were added in the same soft steps. The baseline row draws these.
 * Nick liked the bold ones best (Beni, Yamabuki, Yūyake, Ajisai, Momiji, Hotaru), so every new one is drawn to them: a
 * dark that is nearly black, a middle at full chroma, a light that is tinted, never white.
 * Warm palettes (Beni, Shu, Kaki, Yamabuki, Yūyake, Momiji, Kingyo) are for Flat only: Flat's accent is the ink, while
 * Device's is orange and Press's is blue, and a warm picture there would read as a signal.
 */

/** Five sRGB hex stops, dark to light. */
export type Stops = readonly [string, string, string, string, string];

export type PaletteGroup = "pigment" | "journey" | "soft";

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
  { id: "wakatake", name: "Wakatake", kanji: "若竹", note: "Young bamboo", group: "soft", seed: 3, palette: ["#264d35", "#3b6e4e", "#6da47a", "#a9cba3", "#e1ecdc"] }, // litt-allow: artwork, a candidate palette (proposals/long-exposures.md)
  { id: "ai", name: "Ai", kanji: "藍", note: "Indigo, fading to asagi", group: "soft", seed: 1, palette: ["#16213d", "#1f2f54", "#3f5f8f", "#7fa6c2", "#c9dde6"] }, // litt-allow: artwork, a candidate palette (proposals/long-exposures.md)
  { id: "sakura", name: "Sakura", kanji: "桜", note: "Cherry, fading to shell white", group: "soft", seed: 5, palette: ["#b06e7c", "#d796a6", "#e9b5c1", "#f5d8de", "#fbf2ee"] }, // litt-allow: artwork, a candidate palette (proposals/long-exposures.md)
  { id: "sumi", name: "Sumi", kanji: "墨", note: "Ink, from full to paper. New here", group: "soft", seed: 7, palette: ["#2b2c30", "#55575d", "#8f9197", "#c8cacd", "#f0f0ee"] }, // litt-allow: artwork, a candidate palette (proposals/long-exposures.md)
  { id: "fuji", name: "Fuji", kanji: "藤", note: "Wisteria. New here", group: "soft", seed: 9, palette: ["#463c69", "#6a5d94", "#9b8fc0", "#cbc3e0", "#f0ecf6"] }, // litt-allow: artwork, a candidate palette (proposals/long-exposures.md)
];

/** The bold ones: pigments at full strength, then journeys. */
const BOLD: Exposure[] = [
  { id: "beni", name: "Beni", kanji: "紅", note: "Safflower crimson", group: "pigment", seed: 4, palette: ["#3b0a19", "#7c1631", "#c23a5b", "#ea95a8", "#fae3e8"] }, // litt-allow: artwork, a candidate palette (proposals/long-exposures.md)
  { id: "shu", name: "Shu", kanji: "朱", note: "Vermilion, the red of a shrine gate", group: "pigment", seed: 14, palette: ["#2e0806", "#7d160c", "#d23a1c", "#ef7f5c", "#fbd3c2"] }, // litt-allow: artwork, a candidate palette (proposals/long-exposures.md)
  { id: "kaki", name: "Kaki", kanji: "柿", note: "Persimmon: a ripe orange", group: "pigment", seed: 13, palette: ["#2a0e04", "#7a2e0a", "#d9601a", "#f5a868", "#fde6cf"] }, // litt-allow: artwork, a candidate palette (proposals/long-exposures.md)
  { id: "yamabuki", name: "Yamabuki", kanji: "山吹", note: "Kerria gold", group: "pigment", seed: 6, palette: ["#4a2b06", "#8a5a0d", "#d4921b", "#f1c85d", "#fbf0cf"] }, // litt-allow: artwork, a candidate palette (proposals/long-exposures.md)
  { id: "moegi", name: "Moegi", kanji: "萌黄", note: "Spring green, the first leaves", group: "pigment", seed: 15, palette: ["#102208", "#2c5410", "#6ea21e", "#bddf6a", "#f1f8d4"] }, // litt-allow: artwork, a candidate palette (proposals/long-exposures.md)
  { id: "hisui", name: "Hisui", kanji: "翡翠", note: "Jade", group: "pigment", seed: 44, palette: ["#04201c", "#0b5244", "#148f72", "#5cc29e", "#c8ecdb"] }, // litt-allow: artwork, a candidate palette (proposals/long-exposures.md)
  { id: "ruri", name: "Ruri", kanji: "瑠璃", note: "Lapis lazuli", group: "pigment", seed: 2, palette: ["#0c1a4d", "#1b3a8f", "#3d68c6", "#8eaee6", "#dfe8f8"] }, // litt-allow: artwork, a candidate palette (proposals/long-exposures.md)
  { id: "gunjo", name: "Gunjō", kanji: "群青", note: "Ultramarine, ground from azurite", group: "pigment", seed: 51, palette: ["#0a0a38", "#1e1f86", "#3f4bd2", "#9aa2f2", "#cdd2fa"] }, // litt-allow: artwork, a candidate palette (proposals/long-exposures.md)
  { id: "murasaki", name: "Murasaki", kanji: "紫", note: "Purple, dyed from gromwell root", group: "pigment", seed: 40, palette: ["#1c0830", "#4a1a72", "#8a3cb8", "#cf98e6", "#f4e4fb"] }, // litt-allow: artwork, a candidate palette (proposals/long-exposures.md)
  { id: "botan", name: "Botan", kanji: "牡丹", note: "Peony: a deep magenta", group: "pigment", seed: 18, palette: ["#2a0520", "#701055", "#c62a8e", "#ee92c6", "#fce2f0"] }, // litt-allow: artwork, a candidate palette (proposals/long-exposures.md)

  // Yūyake and Ajisai retuned from plan 008: they went mostly pale on the fan. Their seeds opened on frames that are
  // nearly all light (Ajisai's on one with no dark at all), so they open on balanced ones now, and their two light
  // stops are a step deeper.
  { id: "yuyake", name: "Yūyake", kanji: "夕焼け", note: "Sunset: indigo, violet, coral, gold", group: "journey", seed: 48, palette: ["#191540", "#47276c", "#b0456a", "#ec8550", "#f8c98a"] }, // litt-allow: artwork, a candidate palette (proposals/long-exposures.md)
  { id: "ajisai", name: "Ajisai", kanji: "紫陽花", note: "Hydrangea: blue, violet, pink", group: "journey", seed: 30, palette: ["#141f4e", "#2a4fa0", "#7a6cc4", "#d48ac0", "#f3d2e6"] }, // litt-allow: artwork, a candidate palette (proposals/long-exposures.md)
  { id: "momiji", name: "Momiji", kanji: "紅葉", note: "Autumn maples: deep green, rust, gold", group: "journey", seed: 11, palette: ["#1d3324", "#6b3a1e", "#b8532a", "#e6a43c", "#f7e6bd"] }, // litt-allow: artwork, a candidate palette (proposals/long-exposures.md)
  { id: "hotaru", name: "Hotaru", kanji: "蛍", note: "Fireflies: night blue to a yellow-green glow", group: "journey", seed: 12, palette: ["#0c1622", "#16323a", "#2f5e4a", "#7fa64a", "#dfe9a8"] }, // litt-allow: artwork, a candidate palette (proposals/long-exposures.md)
  { id: "yozakura", name: "Yozakura", kanji: "夜桜", note: "Cherry blossom at night: plum dark, then pink", group: "journey", seed: 21, palette: ["#0b0b20", "#26193f", "#8a3a72", "#ea94b8", "#fde4ee"] }, // litt-allow: artwork, a candidate palette (proposals/long-exposures.md)
  { id: "kingyo", name: "Kingyo", kanji: "金魚", note: "Goldfish: dark green water, then red and orange", group: "journey", seed: 24, palette: ["#061a24", "#0f4250", "#d03a26", "#f49452", "#fde5c6"] }, // litt-allow: artwork, a candidate palette (proposals/long-exposures.md)
  { id: "kujaku", name: "Kujaku", kanji: "孔雀", note: "Peacock: deep blue, teal, green, then gold", group: "journey", seed: 23, palette: ["#04122a", "#0b4f62", "#10a07a", "#e2c444", "#f8f0c0"] }, // litt-allow: artwork, a candidate palette (proposals/long-exposures.md)
  { id: "shinkai", name: "Shinkai", kanji: "深海", note: "The deep sea: black, blue, a cyan glow", group: "journey", seed: 22, palette: ["#020a18", "#06264a", "#0b6684", "#3cbcbc", "#c6f2e6"] }, // litt-allow: artwork, a candidate palette (proposals/long-exposures.md)
  { id: "hanabi", name: "Hanabi", kanji: "花火", note: "Fireworks: night blue, magenta, then gold", group: "journey", seed: 39, palette: ["#06071a", "#1b1d58", "#c32e78", "#f5b23a", "#fff3cc"] }, // litt-allow: artwork, a candidate palette (proposals/long-exposures.md)
];

/** Every palette: the bold ones first, then the soft five. */
export const PALETTES: Exposure[] = [...BOLD, ...EXPOSURES];

export const paletteById = (id: string) => PALETTES.find((p) => p.id === id) ?? PALETTES[0]!;

/**
 * A pair: one palette at the fan's root, another at its tips, held there along the streaks. Neighbours that melt into
 * each other, and opposites that clash well.
 */
export type Pair = {
  id: string;
  /** At the fan's root. */
  root: string;
  /** At the fan's tips. */
  tips: string;
  kind: "melt" | "clash";
  /** The frame to open on, when the root palette's own seed sits mostly in one half. */
  seed?: number;
};

export const PAIRS: Pair[] = [
  { id: "beni-yamabuki", root: "beni", tips: "yamabuki", kind: "melt" },
  { id: "momiji-beni", root: "momiji", tips: "beni", kind: "melt" },
  { id: "moegi-yamabuki", root: "moegi", tips: "yamabuki", kind: "melt" },
  { id: "ajisai-yozakura", root: "ajisai", tips: "yozakura", kind: "melt" },
  { id: "ruri-beni", root: "ruri", tips: "beni", kind: "clash", seed: 3 },
  { id: "gunjo-yamabuki", root: "gunjo", tips: "yamabuki", kind: "clash" },
  { id: "murasaki-kaki", root: "murasaki", tips: "kaki", kind: "clash" },
  { id: "hisui-botan", root: "hisui", tips: "botan", kind: "clash" },
];

/** A pair is named by its two palettes. */
export const pairName = (pair: Pair) => `${paletteById(pair.root).name} into ${paletteById(pair.tips).name}`;

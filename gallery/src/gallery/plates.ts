/* Thermal, film and fluid: the pictures on the gallery's image pages (Media, Carousel, Lightbox). Real images, so
   those pages load them as a site would: lazily, at the size the frame needs, fading in when they arrive.

   Each one is a render from Nick's Brand Playground (github.com/litterthanlit/brand), made with its own engine at the
   tool's preset, with the type layer off and the palette swapped for litt's tokens, so the pictures share the
   interface's light: warm stone neutrals, with cobalt as the light in them, never a fill. `made` names the tool, the
   preset it starts from, the tokens in palette order ("dark" for the dark theme's value) and the seed. The files are
   in gallery/public/plates, a full size and a half size of each, as WebP.

   - Thermal is Thermal Foil and film is Slipstream, from the brand repo's branches claude/upbeat-newton-46ejd2 and
     claude/pensive-wright-vxtijh. Fluid is Long Exposure, on its main. */

export type Plate = {
  id: string;
  /** What the series calls it, for a caption or a slide's name. */
  name: string;
  /** What it shows, in a sentence. */
  alt: string;
  /** The full size. */
  src: string;
  /** The full and the half size, for the browser to pick from. */
  srcSet: string;
  width: number;
  height: number;
  /** The Brand Playground tool, preset, palette and seed it came from. */
  made: string;
};

const BASE = `${import.meta.env.BASE_URL}plates/`;

function plate(id: string, name: string, alt: string, width: number, height: number, made: string): Plate {
  const half = Math.round(width / 2);
  return {
    id,
    name,
    alt,
    src: `${BASE}${id}-${width}.webp`,
    srcSet: `${BASE}${id}-${half}.webp ${half}w, ${BASE}${id}-${width}.webp ${width}w`,
    width,
    height,
    made,
  };
}

const THERMAL_NIGHT_INKS = "dark canvas, dark surface-3, dark line-strong, dark fg-muted, dark fg, dark accent-text, dark accent-tint; glint dark fg, rim dark canvas";
const THERMAL_STONE_INKS = "fg, fg-muted, line-control, line-strong, canvas, accent-tint, accent; glint surface-1, rim fg";
const FILM_DAY_INKS = "canvas, fg, accent-hover, accent, surface-1, accent-tint; paper surface-2";
const FILM_NIGHT_INKS = "dark canvas, dark surface-2, dark accent-tint, dark accent-text, dark fg, accent-tint";
const FLUID_COBALT_INKS = "dark canvas, dark accent-tint, accent, dark accent-text, canvas";
const FLUID_STONE_INKS = "dark surface-2, dark line-strong, line-control, line-strong, canvas";

/* 16:9, the series. */
export const FLUID_COBALT = plate("fluid-cobalt", "Fluid, cobalt", "Deep blue water in long ripples, near black at the edges, pale light on the crests", 1920, 1080, `Long Exposure from Open water: ${FLUID_COBALT_INKS}; seed 12`);
export const FILM_DAY = plate("film-day", "Film, day", "Streaks of cobalt light and shadow converging on a point, on a pale paper mat", 1920, 1080, `Slipstream from Litt, light: ${FILM_DAY_INKS}; seed 21`);
export const THERMAL_NIGHT = plate("thermal-night", "Thermal, night", "Crumpled foil read as a heat map: black and grey folds with bands of cobalt and white", 1920, 1080, `Thermal Foil from Solar: ${THERMAL_NIGHT_INKS}; band grain 0.3, scratches 0.25; seed 12`);
export const FLUID_STONE = plate("fluid-stone", "Fluid, stone", "Warm grey water in slow folds, soft light running across them", 1920, 1080, `Long Exposure from Silk: ${FLUID_STONE_INKS}; seed 7`);
export const FILM_NIGHT = plate("film-night", "Film, night", "Streaks of white and cobalt light crossing a dark ground, flaring at a bright point", 1920, 1080, `Slipstream from Litt, dark: ${FILM_NIGHT_INKS}; seed 3`);
export const THERMAL_STONE = plate("thermal-stone", "Thermal, stone", "Crumpled foil read as a heat map in pale stone and black, with cobalt in the creases", 1920, 1080, `Thermal Foil from Chrome: ${THERMAL_STONE_INKS}; band grain 0.3, scratches 0.25; seed 21`);

/* Other shapes. */
export const FILM_UPRIGHT = plate("film-day-upright", "Film, upright", "Cobalt streaks fanning up from a point, on a pale paper mat", 1080, 1350, `Slipstream from Litt, light: ${FILM_DAY_INKS}; seed 12`);
export const FLUID_WIDE = plate("fluid-cobalt-wide", "Fluid, wide", "Deep blue water in long ripples, as a panorama", 1500, 500, `Long Exposure from Open water: ${FLUID_COBALT_INKS}; seed 21`);
export const THERMAL_SQUARE = plate("thermal-night-square", "Thermal, square", "Crumpled foil in black, grey and cobalt bands, square", 1080, 1080, `Thermal Foil from Solar: ${THERMAL_NIGHT_INKS}; band grain 0.3, scratches 0.25; seed 3`);

/** The six 16:9 studies, in the order the series runs: each tool once light-led and once dark-led. */
export const SERIES: Plate[] = [FLUID_COBALT, FILM_DAY, THERMAL_NIGHT, FLUID_STONE, FILM_NIGHT, THERMAL_STONE];

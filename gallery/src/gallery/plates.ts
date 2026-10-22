/* Field studies: the pictures on the gallery's image pages (Media, Carousel, Lightbox). Real images, so those pages
   load them as a site would: lazily, at the size the frame needs, fading in when they arrive.

   Each one is a render from Nick's Brand Playground (github.com/litterthanlit/brand), made with its own engine at the
   tool's preset, the seed and the format given, with the type layer off. The files are in gallery/public/plates, a
   full size and a half size of each, as WebP. To redo one, open the tool at that preset, seed and format and export. */

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
  /** The Brand Playground tool, preset and seed it came from. */
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

/* 16:9, the series. */
export const OPEN_WATER = plate("open-water", "Open water", "Deep blue water in long ripples, light catching their crests", 1920, 1080, "Long Exposure, Open water, seed 7");
export const DUSK_TIDE = plate("dusk-tide", "Dusk tide", "Violet water in long ripples, pink light on their crests", 1920, 1080, "Long Exposure, Dusk tide, seed 12");
export const SILK = plate("silk", "Silk", "Grey folds like slow water, soft light running across them", 1920, 1080, "Long Exposure, Silk, seed 12");
export const RED_SUN = plate("red-sun", "Red sun", "A red sun fading to pale pink, low over a white ground under a brown sky", 1920, 1080, "Screen Orb, Dusk, seed 7");
export const SPRIG = plate("stem", "Sprig", "A sprig of pale buds on a rust stem, on a dark brown ground", 1920, 1080, "Photogram, Rust, seed 6");
export const GRAPHITE = plate("graphite", "Graphite", "Fine graphite lines curling across off-white paper", 1920, 1080, "Flow Field, Graphite, seed 7");

/* Other shapes. */
export const BUDS = plate("branch", "Two buds", "A dark stem forking into two buds, on pale paper", 1080, 1350, "Photogram, Negative, seed 4");
export const TIDE_WIDE = plate("tide-wide", "Open water, wide", "Deep blue water in long ripples, as a panorama", 1500, 500, "Long Exposure, Open water, seed 7");
export const BLUE_HOUR = plate("blue-hour", "Blue hour", "A sphere going from orange to blue, against a navy sky over a pale ground", 1080, 1080, "Screen Orb, Blue hour, seed 7");

/** The six 16:9 studies, in the order the series runs. */
export const SERIES: Plate[] = [OPEN_WATER, DUSK_TIDE, SILK, RED_SUN, SPRIG, GRAPHITE];

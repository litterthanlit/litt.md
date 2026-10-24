/* The gallery's sample store: the studio's print shop, selling the Field studies (plates.ts) as framed prints. Shared
   by the commerce pages (Price, Option picker, Product card, Cart, Shopify), so they all sell the same things. The
   blocks carry their own data, because a block ships on its own. */
import type { CartItem } from "@/components/cart";
import type { ProductOption } from "@/components/option-picker";
import type { Money } from "@/components/price";
import type { Product, ProductVariant } from "@/components/product-card";
import { BLUE_HOUR, BUDS, DUSK_TIDE, GRAPHITE, OPEN_WATER, RED_SUN, SILK, SPRIG, type Plate } from "./plates";

export const eur = (amount: number): Money => ({ amount, currencyCode: "EUR" });

/** The frames, with their wood's color: the product's own colors, so they are data, not litt's. */
export const FRAMES = [
  { value: "Black", color: "#1f1d1b" }, // litt-allow: user data, a frame's color
  { value: "Natural oak", color: "#c9a57d" }, // litt-allow: user data
  { value: "Walnut", color: "#5e3d2b" }, // litt-allow: user data
  { value: "White", color: "#f1eee8" }, // litt-allow: user data
];
export const frameColor = (name: string) => FRAMES.find((f) => f.value === name)?.color;

const SIZES = [
  { value: "A3", price: 60, framed: 40 },
  { value: "A2", price: 90, framed: 55 },
  { value: "A1", price: 140, framed: 75 },
];

export const PRINT_OPTIONS: ProductOption[] = [
  { name: "Size", values: SIZES.map((s) => ({ value: s.value })) },
  { name: "Frame", values: FRAMES.map((f) => ({ value: f.value, swatch: { color: f.color } })) },
];

/** A print in every size and frame. `out` lists the picks that are sold out ("A1 / Walnut"), `sale` takes a share off. */
function print(plate: Plate, about: string, { out = [] as string[], sale = 0, allOut = false } = {}): Product {
  const variants: ProductVariant[] = SIZES.flatMap((s) =>
    FRAMES.map((f) => {
      const title = `${s.value} / ${f.value}`;
      const full = s.price + s.framed;
      return {
        id: `${plate.id}-${s.value}-${f.value}`.toLowerCase().replace(/\s+/g, "-"),
        title,
        available: !allOut && !out.includes(title),
        price: eur(sale ? Math.round(full * (1 - sale)) : full),
        compareAt: sale ? eur(full) : null,
        options: { Size: s.value, Frame: f.value },
      };
    }),
  );
  return {
    id: plate.id,
    handle: plate.id,
    title: plate.name,
    description: about,
    images: [{ src: plate.src, srcSet: plate.srcSet, alt: plate.alt, width: plate.width, height: plate.height }],
    options: PRINT_OPTIONS,
    variants,
  };
}

export const PRODUCTS: Product[] = [
  print(OPEN_WATER, "Deep blue water in long ripples, the first plate of the series. Printed on 310 gsm cotton rag."),
  print(DUSK_TIDE, "The same water at dusk, violet with pink light on the crests.", { sale: 0.25 }),
  print(SILK, "Grey folds like slow water, soft light running across them.", { out: ["A1 / Walnut", "A1 / White"] }),
  print(RED_SUN, "A red sun fading to pale pink, low over a white ground.", { out: ["A3 / Black"] }),
  print(SPRIG, "A sprig of pale buds on a rust stem. A photogram, printed at the size it was made."),
  print(GRAPHITE, "Fine graphite lines curling across off-white paper."),
  print(BUDS, "A dark stem forking into two buds, on pale paper. The one upright plate."),
  print(BLUE_HOUR, "A sphere going from orange to blue against a navy sky. Back in the spring.", { allOut: true }),
];

export const PLATES: Record<string, Plate> = Object.fromEntries(
  [OPEN_WATER, DUSK_TIDE, SILK, RED_SUN, SPRIG, GRAPHITE, BUDS, BLUE_HOUR].map((p) => [p.id, p]),
);

export const OPEN_WATER_PRINT = PRODUCTS[0]!;

/** A cart line for a print in a size and frame. */
export function lineFor(product: Product, picks: Record<string, string>, quantity = 1): Omit<CartItem, "id"> {
  const v = product.variants.find((x) => x.options.Size === picks.Size && x.options.Frame === picks.Frame) ?? product.variants[0]!;
  const plate = PLATES[product.id];
  return {
    variantId: v.id,
    title: product.title,
    variantTitle: `${v.options.Size} · ${v.options.Frame}`,
    quantity,
    price: v.price,
    compareAt: v.compareAt,
    image: plate ? { src: plate.src, srcSet: plate.srcSet, alt: "" } : undefined,
  };
}

/** A cart with two prints in it, for the cart's pages. */
export const CART_SEED: CartItem[] = [
  { id: "line-open-water", ...lineFor(PRODUCTS[0]!, { Size: "A2", Frame: "Natural oak" }) },
  { id: "line-dusk-tide", ...lineFor(PRODUCTS[1]!, { Size: "A3", Frame: "Black" }, 2) },
];

/**
 * A print as it would be photographed for a store: the plate at its own shape, on a mat in a frame, on the cover's
 * ground. Drawn, not cropped, because a print is sold whole. `frame` is the frame's name; without one the print is
 * shown unframed on its mat.
 */
export function PrintCover({ plate, frame, alt = "" }: { plate: Plate; frame?: string; alt?: string }) {
  const wood = frame ? frameColor(frame) : undefined;
  return (
    <div className="grid size-full place-items-center bg-surface-2" style={{ padding: "13% 11%" }} role={alt ? "img" : undefined} aria-label={alt || undefined}>
      <div
        className="w-full shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--fg)_12%,transparent)]"
        style={{ backgroundColor: wood, padding: wood ? "4%" : 0 }}
      >
        <div className="shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--fg)_8%,transparent)]" style={{ backgroundColor: "whitesmoke", padding: "7%" }}>
          <img src={plate.src} srcSet={plate.srcSet} sizes="(min-width: 64rem) 25vw, 50vw" width={plate.width} height={plate.height} alt="" loading="lazy" decoding="async" draggable={false} className="block h-auto w-full" />
        </div>
      </div>
    </div>
  );
}

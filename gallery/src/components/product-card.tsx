/**
 * Product card: one product in a grid, which opens its page (components.md, "Product card"). Also the home of the
 * product's shape (Product, ProductVariant, ProductImage) and the small functions a product page needs: the price
 * range, the variant for a set of picks, and which values are in stock among the other picks.
 *
 * - A product is plain data, so a Shopify store, a Stripe store and a file of products use the same card. The
 *   `shopify` item maps the Storefront API into it.
 * - Anatomy: a Card with an inset cover. The cover is a Media at 4/5 by default and the control radius, the product's
 *   first image, or drawn art passed as `cover`. Under it, an optional vendor at the caption size in --fg-subtle,
 *   4px above the title at the body size and the title weight in --fg, and the Price under it (From when the
 *   variants differ in price, the compare-at price struck through when the lowest is on sale).
 * - One link: the title is the card's CardLink, stretched over the card, so the card is one tab stop named by the
 *   product. No buy button and no accent: a grid of cards would be a dozen accent fills (P1), and the card's job is to
 *   open the product. Hover is the Card's: the fill steps once, nothing lifts.
 * - Sold out: a product with nothing in stock keeps its card and adds a neutral "Sold out" Tag after the price.
 * - ProductGrid: a ul that measures itself, two across on a phone, then as many 14rem columns as fit, 16px apart.
 *   Every cover shares one shape, so the rows stay even.
 * - Never a second picture on hover, a badge over the picture, or a picture that zooms.
 * - Motion: none of its own. The Card's fill fades on the instant tier.
 */
import type { ReactNode } from "react";
import { Card, CardBody, CardCover, CardLink, CardTitle } from "@/components/card";
import { Media, type MediaRatio } from "@/components/media";
import type { OptionValue, ProductOption } from "@/components/option-picker";
import { Price, type Money } from "@/components/price";
import { Tag } from "@/components/tag";

/** A picture of a product. */
export type ProductImage = {
  src: string;
  /** What the picture shows, in a sentence. */
  alt: string;
  srcSet?: string;
  /** Its own size in pixels, so its frame keeps its shape before it loads. */
  width?: number;
  height?: number;
};

/** One buyable version of a product: a size in a frame. */
export type ProductVariant = {
  /** The store's id for it, which a cart adds. */
  id: string;
  /** Its picks in words: "A2 / Natural oak". */
  title: string;
  /** False when it is out of stock. */
  available: boolean;
  price: Money;
  /** What it cost before a sale. */
  compareAt?: Money | null;
  /** Its value for each option, by the option's name: { Size: "A2", Frame: "Natural oak" }. */
  options: Record<string, string>;
  /** Its own picture, shown when it is picked. */
  image?: ProductImage;
};

/** A product, as a store lists it. */
export type Product = {
  id: string;
  /** Its address in the store: /products/open-water. */
  handle: string;
  title: string;
  /** Who makes it, for a store that sells more than one maker's work. */
  vendor?: string;
  /** A paragraph or two about it, as plain text. */
  description?: string;
  images: ProductImage[];
  /** Its options and their values, in order. A product with one variant has none. */
  options: ProductOption[];
  variants: ProductVariant[];
};

/* ----------------------------------------------------------------- what a product page needs */

const n = (m: Money) => (typeof m.amount === "number" ? m.amount : Number.parseFloat(m.amount));

/** The lowest and highest price of a product's variants, and the lowest one's compare-at price. */
export function priceRange(product: Product): { min: Money; max: Money; compareAt?: Money | null; varies: boolean } {
  const sorted = [...product.variants].sort((a, b) => n(a.price) - n(b.price));
  const low = sorted[0];
  const high = sorted[sorted.length - 1];
  if (!low || !high) return { min: { amount: 0, currencyCode: "EUR" }, max: { amount: 0, currencyCode: "EUR" }, varies: false };
  return { min: low.price, max: high.price, compareAt: low.compareAt, varies: n(low.price) !== n(high.price) };
}

/** True when no variant of the product is in stock. */
export const isSoldOut = (product: Product) => product.variants.every((v) => !v.available);

/** The variant whose options match every pick, or undefined. */
export const findVariant = (product: Product, picks: Record<string, string>) =>
  product.variants.find((v) => product.options.every((o) => v.options[o.name] === picks[o.name]));

/** The picks a product page opens on: the first variant in stock, else the first one. */
export function defaultPicks(product: Product): Record<string, string> {
  const v = product.variants.find((x) => x.available) ?? product.variants[0];
  return v ? { ...v.options } : {};
}

/**
 * The product's options with `available` set on each value for the picks so far: a value is in stock when a variant
 * with it and the other picks is. Pass the result to OptionPicker.
 */
export function optionsFor(product: Product, picks: Record<string, string>): ProductOption[] {
  return product.options.map((o) => ({
    name: o.name,
    values: o.values.map(
      (v): OptionValue => ({
        ...v,
        available: product.variants.some(
          (x) => x.available && x.options[o.name] === v.value && product.options.every((p) => p.name === o.name || x.options[p.name] === picks[p.name]),
        ),
      }),
    ),
  }));
}

/* ----------------------------------------------------------------- the card */

export type ProductCardProps = {
  product: Product;
  /** Where the card goes: the product's page. Leave it out and the card is a button; use onOpen. */
  href?: string;
  /** Called when the card is pressed, when it has no href. */
  onOpen?: () => void;
  /** Drawn art for the cover, in place of the first image. It fills the frame. */
  cover?: ReactNode;
  /** The cover's shape: 4/5 (the default, for prints and things you hold), 1/1, 4/3, or a number. One shape for a whole grid. */
  ratio?: MediaRatio | number;
  /** How wide the cover is drawn, for the image's srcSet. */
  sizes?: string;
  /** The title's heading level, to fit the page's outline. The size never changes. */
  headingLevel?: "h2" | "h3" | "h4";
  /** The element: li in a ProductGrid (the default), article on its own. */
  as?: "li" | "article" | "div";
  /** The locale for the price. Leave it out for the page's. */
  locale?: string;
  className?: string;
};

/** One product in a grid: its picture, its name and its price, as one link to its page. No buy button. */
export function ProductCard({
  product,
  href,
  onOpen,
  cover,
  ratio = "4/5",
  sizes = "(min-width: 64rem) 25vw, 50vw",
  headingLevel = "h3",
  as = "li",
  locale,
  className = "",
}: ProductCardProps) {
  const image = product.images[0];
  const range = priceRange(product);
  const soldOut = isSoldOut(product);
  return (
    <Card as={as} cover="inset" className={className}>
      <CardCover ratio="auto">
        <Media ratio={ratio} radius="control" src={cover ? undefined : image?.src} srcSet={image?.srcSet} sizes={sizes} alt={image?.alt ?? ""} width={image?.width} height={image?.height}>
          {cover}
        </Media>
      </CardCover>
      <CardBody>
        {product.vendor && <p className="text-caption font-normal text-fg-subtle">{product.vendor}</p>}
        <CardTitle as={headingLevel}>
          <CardLink href={href} onClick={href === undefined ? onOpen : undefined}>
            {product.title}
          </CardLink>
        </CardTitle>
        <div className="flex flex-wrap items-center gap-2 text-body">
          <Price price={range.min} compareAt={range.compareAt} from={range.varies} locale={locale} />
          {soldOut && <Tag>Sold out</Tag>}
        </div>
      </CardBody>
    </Card>
  );
}

export type ProductGridProps = {
  /** The ProductCards. */
  children: ReactNode;
  /** Names the list for screen readers, such as "Prints". */
  label?: string;
  className?: string;
};

/** A grid of ProductCards that measures itself: two across on a phone, then as many 14rem columns as fit. */
export function ProductGrid({ children, label, className = "" }: ProductGridProps) {
  return (
    <div className={"@container " + className}>
      <ul aria-label={label} className="grid grid-cols-2 gap-4 @min-[40rem]:grid-cols-[repeat(auto-fill,minmax(14rem,1fr))]">
        {children}
      </ul>
    </div>
  );
}

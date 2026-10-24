/**
 * Product: one product's page, for a store. A block: a whole page built from the litt parts, to copy and make your
 * own. Swap the product at the top for yours (or for one the shopify item's toProduct maps from your store); the
 * layout stays.
 *
 * Where the page sits and the cart, then the pictures and the details side by side when the page is wide (P7,
 * asymmetric: the pictures take the wider column and scroll, the details stay beside them), one above the other on a
 * phone, where the pictures are a carousel of one and a peek. The details: the title, the page's one 18px line, the
 * price under it at the body size (a sale is the old price struck through and a neutral tag, never red), the options,
 * the quantity and Add to cart, the page's one accent fill. The rest folds into an accordion.
 *
 * Picking a frame shows that frame's picture. A pick that is sold out says so in the legend, and Add to cart becomes
 * a disabled Sold out. Add to cart says Added for two seconds, the cart's count rolls and a toast says what was added
 * with View cart; the cart does not open by itself. Every picture opens the lightbox; opening it, or the cart, is the
 * page's one expressive moment. Mount the Toaster once near your root.
 */
import { useState } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/accordion";
import { Breadcrumb } from "@/components/breadcrumb";
import { AddToCart, Cart, CartButton, useCartState } from "@/components/cart";
import { Carousel, CarouselContent, CarouselControls, CarouselItem } from "@/components/carousel";
import { Lightbox } from "@/components/lightbox";
import { Media } from "@/components/media";
import { NumberField } from "@/components/number-field";
import { OptionPicker } from "@/components/option-picker";
import { Price, type Money } from "@/components/price";
import { defaultPicks, findVariant, optionsFor, type Product, type ProductImage } from "@/components/product-card";
import { toast } from "@/components/toast";

/* ----------------------------------------------------------------- data */

/* Drawn stand-ins for a store's photographs of a print: a sun low over the ground, on a mat, in a frame. SVGs, so the
   page fetches nothing; named colors for the art, because it is a picture, not the interface. Replace every picture
   below with your product's. */
type Scene = { sky: string; glow: string; ground: string; core: string; rim: string };
/** The frame's edge in the drawing, so a white frame keeps its shape on a pale ground. */
const EDGE = "black";

function scene(s: Scene) {
  return (
    `<defs><linearGradient id='s' x2='0' y2='1'><stop offset='0' stop-color='${s.sky}'/><stop offset='.68' stop-color='${s.glow}'/></linearGradient>` +
    `<radialGradient id='o' cx='.42' cy='.38' r='.7'><stop offset='0' stop-color='${s.core}'/><stop offset='1' stop-color='${s.rim}'/></radialGradient>` +
    `<filter id='g' x='0' y='0' width='1' height='1'><feTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 .14 0'/></filter></defs>` +
    `<rect width='400' height='500' fill='url(#s)'/><rect y='340' width='400' height='160' fill='${s.ground}'/>` +
    `<circle cx='200' cy='300' r='92' fill='url(#o)'/><rect width='400' height='500' filter='url(#g)'/>`
  );
}
const svg = (body: string, w: number, h: number, box: string) =>
  `data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}' viewBox='${box}'>${body}</svg>`)}`;

/** The print in a frame on a mat, centred on a clear ground, so the picture's own frame shows through. */
const framed = (s: Scene, wood: string) =>
  svg(
    `<rect x='130' y='130' width='540' height='675' fill='${wood}' stroke='${EDGE}' stroke-opacity='.12'/>` +
      `<rect x='154' y='154' width='492' height='627' fill='whitesmoke'/>` +
      `<g transform='translate(194 194) scale(1.03)'>${scene(s)}</g>`,
    1200, 1500, "0 0 800 1000",
  );
/** The print alone, edge to edge. */
const bare = (s: Scene) => svg(scene(s), 1200, 1500, "0 0 400 500");
/** A close look at the sun and its grain. */
const detail = (s: Scene) => svg(scene(s), 1200, 1500, "110 190 180 225");

const RED_SUN: Scene = { sky: "sienna", glow: "mistyrose", ground: "linen", core: "pink", rim: "orangered" };

/** The frames: the product's own colors, from your store (Shopify gives a swatch's color as hex). */
const FRAMES = [
  { value: "Black", color: "#1f1d1b" }, // litt-allow: user data, a frame's color
  { value: "Natural oak", color: "#c9a57d" }, // litt-allow: user data
  { value: "Walnut", color: "#5e3d2b" }, // litt-allow: user data
  { value: "White", color: "#f1eee8" }, // litt-allow: user data
];
const SIZES = [
  { value: "A3", price: 100 },
  { value: "A2", price: 145 },
  { value: "A1", price: 215 },
];
const SOLD_OUT = ["A1 / Walnut", "A3 / White"];
const eur = (amount: number): Money => ({ amount, currencyCode: "EUR" });

const picture = (frame: (typeof FRAMES)[number]): ProductImage => ({
  src: framed(RED_SUN, frame.color),
  alt: `Red sun, framed in ${frame.value.toLowerCase()}, on a white mat`,
  width: 1200,
  height: 1500,
});

/** The product, as the shopify item's toProduct gives it. Load yours. */
const PRODUCT: Product = {
  id: "red-sun",
  handle: "red-sun",
  title: "Red sun",
  vendor: "Field studies",
  description:
    "A red sun fading to pale pink, low over a white ground under a brown sky. Made in the studio's Brand Playground, then printed on 310 gsm cotton rag with archival pigment inks.",
  images: [
    picture(FRAMES[1]!),
    { src: bare(RED_SUN), alt: "Red sun, the print alone: a red sun fading to pink over a pale ground", width: 1200, height: 1500 },
    { src: detail(RED_SUN), alt: "A close look at the sun's edge and the grain of the print", width: 1200, height: 1500 },
  ],
  options: [
    { name: "Size", values: SIZES.map((s) => ({ value: s.value })) },
    { name: "Frame", values: FRAMES.map((f) => ({ value: f.value, swatch: { color: f.color } })) },
  ],
  variants: SIZES.flatMap((s) =>
    FRAMES.map((f) => ({
      id: `red-sun-${s.value}-${f.value}`.toLowerCase().replace(/\s+/g, "-"),
      title: `${s.value} / ${f.value}`,
      available: !SOLD_OUT.includes(`${s.value} / ${f.value}`),
      price: eur(s.price),
      options: { Size: s.value, Frame: f.value },
      image: picture(f),
    })),
  ),
};

/** Where the page sits. Point the links at your routes. */
const TRAIL = [
  { label: "Prints", href: "/prints" },
  { label: "Red sun", href: "/products/red-sun" },
];

/** What folds under Add to cart. */
const MORE = [
  { title: "About this print", body: PRODUCT.description },
  { title: "Paper and printing", body: "310 gsm cotton rag, matte, with archival pigment inks. Each print is made to order and signed on the back." },
  { title: "Shipping and returns", body: "Ships in three to five working days, flat in a rigid box. Free over €250 in the EU. Returns within 30 days, unframed or framed." },
];

/* ----------------------------------------------------------------- the page */

export function ProductPage() {
  const product = PRODUCT;
  const cart = useCartState();
  const [cartOpen, setCartOpen] = useState(false);
  const [picks, setPicks] = useState(() => defaultPicks(product));
  const [quantity, setQuantity] = useState<number | null>(1);
  const [open, setOpen] = useState<number | null>(null);
  const variant = findVariant(product, picks);
  /* The picked frame's picture leads; the others follow. */
  const images = [variant?.image ?? product.images[0]!, ...product.images.slice(1)];

  const add = async () => {
    if (!variant) return;
    await cart.add({
      variantId: variant.id,
      title: product.title,
      variantTitle: `${picks.Size} · ${picks.Frame}`,
      quantity: quantity ?? 1,
      price: variant.price,
      compareAt: variant.compareAt,
      image: variant.image,
    });
    toast({ title: `Added ${product.title}`, description: `${picks.Size} · ${picks.Frame}`, action: { label: "View cart", onClick: () => setCartOpen(true) } });
  };

  return (
    <article className="@container mx-auto grid w-full max-w-6xl gap-8">
      <div className="flex items-center justify-between gap-4">
        <Breadcrumb label="Where this page is" items={TRAIL} />
        <CartButton count={cart.count} onClick={() => setCartOpen(true)} />
      </div>

      <div className="grid gap-8 @min-[40rem]:grid-cols-2 @min-[56rem]:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] @min-[56rem]:gap-12">
        {/* Wide: the pictures stacked in the wider column. Narrow: a carousel of one and a peek. */}
        <div className="hidden gap-4 @min-[40rem]:grid">
          {images.map((image, i) => (
            <Media key={i} src={image.src} alt={image.alt} width={image.width} height={image.height} ratio="4/5" priority={i === 0} onOpen={() => setOpen(i)} />
          ))}
        </div>
        <Carousel label={`Pictures of ${product.title}`} perView="one" className="@min-[40rem]:hidden">
          <CarouselContent>
            {images.map((image, i) => (
              <CarouselItem key={i}>
                <Media src={image.src} alt={image.alt} width={image.width} height={image.height} ratio="4/5" priority={i === 0} onOpen={() => setOpen(i)} />
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselControls />
        </Carousel>

        <div className="grid content-start gap-8 @min-[40rem]:sticky @min-[40rem]:top-8 @min-[40rem]:self-start">
          <header className="grid gap-1">
            {product.vendor && <p className="text-caption font-normal text-fg-subtle">{product.vendor}</p>}
            <h1 className="text-h1 text-fg">{product.title}</h1>
            {variant && <Price price={variant.price} compareAt={variant.compareAt} saving className="text-body" />}
          </header>

          <div className="grid gap-6">
            {optionsFor(product, picks).map((option) => (
              <OptionPicker
                key={option.name}
                name={option.name}
                values={option.values}
                value={picks[option.name]}
                onValueChange={(value) => setPicks({ ...picks, [option.name]: value })}
              />
            ))}
            <NumberField label="Quantity" min={1} max={10} required value={quantity} onValueChange={setQuantity} className="w-40" />
          </div>

          <div className="grid gap-3">
            <AddToCart onAdd={add} soldOut={variant ? !variant.available : false} disabled={!variant} />
            <p className="text-small text-fg-subtle">Made to order, ships in three to five days. Free shipping over €250.</p>
          </div>

          <Accordion type="multiple" headingLevel={2}>
            {MORE.map((m) => (
              <AccordionItem key={m.title} value={m.title}>
                <AccordionTrigger>{m.title}</AccordionTrigger>
                <AccordionContent>
                  <p className="max-w-[65ch] text-body text-fg-muted">{m.body}</p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>

      <Lightbox label={product.title} items={images} index={open} onIndexChange={setOpen} />
      <Cart open={cartOpen} onOpenChange={setCartOpen} cart={cart} freeShippingAt={eur(250)} />
    </article>
  );
}

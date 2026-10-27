/**
 * Collection: a store's products as a grid, for a shop's front page or a category. A block: a whole page built from
 * the litt parts, to copy and make your own. Swap the products at the top for yours (or for the ones the shopify
 * item's toProduct maps from a collection); the layout stays.
 *
 * The title and the count as one line in two inks, the cart at the end. A filter row: what to show as a Segmented
 * control and the order as a Select, left-aligned (R9). Then the grid: two across on a phone, then as many 14rem
 * columns as fit, every cover one shape. Each card is one link to its product, with no buy button, so the page has no
 * accent fill until the cart is open (R6). A sale strikes the old price through; a print with nothing in stock keeps
 * its card and says Sold out. A filter with nothing in it says so and offers the way back. Nothing moves until
 * someone moves it; opening the cart is the page's one expressive moment.
 */
import { useId, useState } from "react";
import { Button } from "@/components/button";
import { Cart, CartButton, useCartState } from "@/components/cart";
import { type Money } from "@/components/price";
import { ProductCard, ProductGrid, isSoldOut, priceRange, type Product } from "@/components/product-card";
import { Segmented } from "@/components/segmented";
import { Select } from "@/components/select";
import { Empty } from "@/components/states";

/* ----------------------------------------------------------------- data */

/* Drawn stand-ins for a store's photographs of its prints: a sun low over the ground, on a mat, in a frame. SVGs, so
   the page fetches nothing; named colors for the art, because it is a picture, not the interface. Replace each
   product's images with yours. */
type Scene = { sky: string; glow: string; ground: string; core: string; rim: string };
/** The frame's edge in the drawing, so a white frame keeps its shape on a pale ground. */
const EDGE = "black";

function framed(s: Scene, wood: string) {
  const body =
    `<defs><linearGradient id='s' x2='0' y2='1'><stop offset='0' stop-color='${s.sky}'/><stop offset='.68' stop-color='${s.glow}'/></linearGradient>` +
    `<radialGradient id='o' cx='.42' cy='.38' r='.7'><stop offset='0' stop-color='${s.core}'/><stop offset='1' stop-color='${s.rim}'/></radialGradient>` +
    `<filter id='g' x='0' y='0' width='1' height='1'><feTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 .14 0'/></filter></defs>` +
    `<rect x='130' y='130' width='540' height='675' fill='${wood}' stroke='${EDGE}' stroke-opacity='.12'/>` +
    `<rect x='154' y='154' width='492' height='627' fill='whitesmoke'/>` +
    `<g transform='translate(194 194) scale(1.03)'><rect width='400' height='500' fill='url(#s)'/><rect y='340' width='400' height='160' fill='${s.ground}'/>` +
    `<circle cx='200' cy='300' r='92' fill='url(#o)'/><rect width='400' height='500' filter='url(#g)'/></g>`;
  return `data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='800' height='1000' viewBox='0 0 800 1000'>${body}</svg>`)}`;
}

const OAK = "#c9a57d"; // litt-allow: user data, a frame's color
const eur = (amount: number): Money => ({ amount, currencyCode: "EUR" });

type Mood = "warm" | "cool";

/** One print in three sizes. `from` is the A3's price; `sale` takes a share off; `out` sells every size out. */
function print(id: string, title: string, mood: Mood, scene: Scene, from: number, { sale = 0, out = false } = {}): Product & { mood: Mood } {
  const sizes = [
    { value: "A3", price: from },
    { value: "A2", price: from + 45 },
    { value: "A1", price: from + 115 },
  ];
  return {
    id,
    handle: id,
    title,
    mood,
    images: [{ src: framed(scene, OAK), alt: `${title}, framed in oak on a white mat`, width: 800, height: 1000 }],
    options: [{ name: "Size", values: sizes.map((s) => ({ value: s.value })) }],
    variants: sizes.map((s) => ({
      id: `${id}-${s.value}`.toLowerCase(),
      title: s.value,
      available: !out,
      price: eur(sale ? Math.round(s.price * (1 - sale)) : s.price),
      compareAt: sale ? eur(s.price) : null,
      options: { Size: s.value },
    })),
  };
}

/** The collection, in the store's own order. Load yours. */
const PRODUCTS = [
  print("red-sun", "Red sun", "warm", { sky: "sienna", glow: "mistyrose", ground: "linen", core: "pink", rim: "orangered" }, 100),
  print("blue-hour", "Blue hour", "cool", { sky: "midnightblue", glow: "steelblue", ground: "lightsteelblue", core: "darkorange", rim: "cornflowerblue" }, 100),
  print("pale-moon", "Pale moon", "cool", { sky: "slategray", glow: "lavender", ground: "gainsboro", core: "white", rim: "lightgray" }, 120),
  print("dusk", "Dusk", "warm", { sky: "darkslateblue", glow: "lightsalmon", ground: "dimgray", core: "gold", rim: "coral" }, 100, { sale: 0.2 }),
  print("noon", "Noon", "warm", { sky: "skyblue", glow: "aliceblue", ground: "tan", core: "lightyellow", rim: "khaki" }, 140),
  print("eclipse", "Eclipse", "cool", { sky: "black", glow: "darkslategray", ground: "dimgray", core: "black", rim: "goldenrod" }, 180, { out: true }),
  print("tide-moon", "Tide moon", "cool", { sky: "teal", glow: "paleturquoise", ground: "cadetblue", core: "white", rim: "aquamarine" }, 120),
  print("ember", "Ember", "warm", { sky: "maroon", glow: "indianred", ground: "rosybrown", core: "yellow", rim: "red" }, 100),
];

const SHOW = [
  { value: "all", label: "All" },
  { value: "warm", label: "Warm" },
  { value: "cool", label: "Cool" },
  { value: "stock", label: "In stock" },
];
const ORDER = [
  { value: "featured", label: "Featured" },
  { value: "low", label: "Price, low to high" },
  { value: "high", label: "Price, high to low" },
];

const lowest = (p: Product) => Number(priceRange(p).min.amount);

/* ----------------------------------------------------------------- the page */

export function Collection() {
  const titleId = useId();
  const cart = useCartState();
  const [cartOpen, setCartOpen] = useState(false);
  const [show, setShow] = useState("all");
  const [order, setOrder] = useState("featured");

  const shown = PRODUCTS.filter((p) => (show === "all" ? true : show === "stock" ? !isSoldOut(p) : p.mood === show));
  if (order !== "featured") shown.sort((a, b) => (order === "low" ? lowest(a) - lowest(b) : lowest(b) - lowest(a)));

  return (
    <section aria-labelledby={titleId} className="@container mx-auto grid w-full max-w-6xl gap-8">
      <header className="flex items-start justify-between gap-4">
        {/* The title and its count as one line in two inks; the h1 stays the name alone. */}
        <div className="flex flex-wrap items-baseline gap-x-2 text-h1">
          <h1 id={titleId} className="text-fg">
            Prints
          </h1>
          <p className="font-normal text-fg-muted">
            {shown.length} {shown.length === 1 ? "print" : "prints"}, made to order.
          </p>
        </div>
        <CartButton count={cart.count} onClick={() => setCartOpen(true)} />
      </header>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Segmented legend="Show" options={SHOW} value={show} onValueChange={setShow} size="sm" />
        <div className="w-48">
          <Select aria-label="Order" options={ORDER} value={order} onValueChange={setOrder} size="sm" />
        </div>
      </div>

      {shown.length ? (
        <ProductGrid label="Prints">
          {shown.map((p) => (
            <ProductCard key={p.id} product={p} href={`/products/${p.handle}`} />
          ))}
        </ProductGrid>
      ) : (
        <Empty title="Nothing here yet" action={<Button onClick={() => setShow("all")}>Show all prints</Button>}>
          No prints match that filter.
        </Empty>
      )}

      <Cart open={cartOpen} onOpenChange={setCartOpen} cart={cart} freeShippingAt={eur(250)} />
    </section>
  );
}

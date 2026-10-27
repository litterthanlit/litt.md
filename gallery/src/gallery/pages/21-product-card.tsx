import { ProductCard, ProductGrid } from "@/components/product-card";
import { Page, Stage, type PageDocs, type PageMeta } from "../kit";
import { PLATES, PRODUCTS, PrintCover } from "../shop";

export const meta: PageMeta = {
  id: "product-card",
  title: "Product card",
  lede: "One product in a grid, which opens its page.",
  order: 21.3,
  group: "Commerce",
  verbs: ["press"],
  summary:
    "A Card with an inset 4/5 cover, the product's name and its price, as one link to its page. No buy button and no accent, so a grid of them keeps the page's one accent fill free. Hover steps the fill once on the instant tier; nothing lifts, zooms or swaps.",
  tiers: ["instant"],
};

export const docs: PageDocs = {
  components: ["product-card"],
  exports: ["ProductCard", "ProductGrid", "priceRange", "isSoldOut"],
  usage: `import { ProductCard, ProductGrid, type Product } from "@/components/product-card";

// A product is plain data: the shopify item's toProduct() makes one from the Storefront API.
<ProductGrid label="Prints">
  {products.map((product) => (
    <ProductCard key={product.id} product={product} href={\`/products/\${product.handle}\`} />
  ))}
</ProductGrid>

// Drawn art in place of the first image, and another shape for the whole grid.
<ProductCard product={product} href="/products/silk" cover={<YourArt />} ratio="1/1" />`,
  use: [
    "A grid of products people scan and open: a collection, search results, \"You may also like\".",
    "Each product has a picture, a name and a price. The card shows From when its variants differ in price.",
    "Give every card in a grid one ratio, so the rows stay even.",
  ],
  skip: [
    "Buying from the grid. A card has no Add to cart: twelve of them would be twelve accent fills, and a product with options needs its page.",
    "A product in a cart. Use CartLine, which has the quantity and Remove.",
    "A list people compare by its fields, such as stock by size. Use Table.",
  ],
  keyboard: [
    [["Tab"], "Moves to the next card. A card is one tab stop, named by the product."],
    [["Enter"], "Opens the product."],
  ],
  a11y: [
    "The title is a heading holding one real link, stretched over the card, so a screen reader can list the products by heading and the card is one tab stop.",
    "A sale reads \"Sale price … Regular price …\", and a product with nothing in stock says \"Sold out\" in a tag, in words.",
    "Pass alt text on each image that says what it shows. Drawn art passed as cover should name itself (role=\"img\" and a label) or be decorative.",
    "Hover only steps the fill, so touch loses nothing. Focus is the 2px ring around the whole card.",
  ],
};

function PrintGridDemo() {
  return (
    <ProductGrid label="Prints" className="w-full">
      {PRODUCTS.slice(0, 6).map((product) => (
        <ProductCard key={product.id} product={product} href="#product-card" cover={<PrintCover plate={PLATES[product.id]!} frame="Natural oak" />} />
      ))}
    </ProductGrid>
  );
}

function PhotoCardsDemo() {
  return (
    <ProductGrid label="Details" className="w-full max-w-2xl">
      {PRODUCTS.slice(5, 8).map((product) => (
        <ProductCard key={product.id} product={product} href="#product-card" ratio="1/1" />
      ))}
    </ProductGrid>
  );
}

export default function ProductCardPage() {
  return (
    <Page meta={meta} docs={docs}>
      <Stage
        title="A grid of prints"
        tier="instant"
        size="lg"
        align="start"
        code="PrintGridDemo"
        caption="Two across in a narrow box, then as many 14rem columns as fit. Hover a card and its fill steps once, on the instant tier; nothing lifts or zooms, and no second picture slides in. Dusk tide is on sale, so its old price is struck through beside the new one. From says the lowest of its sizes."
      >
        <PrintGridDemo />
      </Stage>

      <Stage
        title="Photographs, and sold out"
        tier="instant"
        size="lg"
        align="start"
        code="PhotoCardsDemo"
        caption="The product's first image, cropped square for this grid: one shape for every card. Blue hour has nothing in stock, so it keeps its card and says Sold out in a tag after its price."
      >
        <PhotoCardsDemo />
      </Stage>
    </Page>
  );
}

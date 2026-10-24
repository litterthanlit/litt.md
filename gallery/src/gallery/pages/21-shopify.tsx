import { useMemo, useState } from "react";
import { Button } from "@/components/button";
import { AddToCart, Cart, CartButton } from "@/components/cart";
import { OptionPicker } from "@/components/option-picker";
import { Price } from "@/components/price";
import { defaultPicks, findVariant, optionsFor, ProductCard, ProductGrid, type Product } from "@/components/product-card";
import { createStorefront, getProducts, toProduct, type StorefrontProduct } from "@/components/shopify";
import { ShopifyCart, useShopifyCart } from "@/components/shopify-cart";
import { ErrorState } from "@/components/states";
import { toast, Toaster } from "@/components/toast";
import { Page, Stage, type PageDocs, type PageMeta } from "../kit";
import { PLATES } from "../shop";

export const meta: PageMeta = {
  id: "shopify",
  title: "Shopify",
  lede: "The store parts on a Shopify store.",
  order: 21.5,
  group: "Commerce",
  verbs: ["press", "select", "open"],
  summary:
    "A small Storefront API client pinned to one version, functions that fetch products and collections as litt's Product, and a cart kept in Shopify with the same shape as the cart in memory. It draws nothing: the parts it feeds keep their own looks and motion.",
  tiers: ["instant", "responsive", "expressive"],
};

export const docs: PageDocs = {
  components: ["shopify", "shopify-cart"],
  exports: ["createStorefront", "getProduct", "getProducts", "getCollection", "toProduct", "ShopifyCart", "useShopifyCart"],
  usage: `import { createStorefront, getProduct } from "@/components/shopify";
import { ShopifyCart, useShopifyCart } from "@/components/shopify-cart";

// One client per store, with its public Storefront token (made for the browser; never the Admin API).
export const storefront = createStorefront({ domain: "your-store.myshopify.com", token: "public-storefront-token" });

// Anywhere, a Next.js server component included: litt's Product, ready for ProductCard and OptionPicker.
const product = await getProduct(storefront, "red-sun");

// The cart lives in Shopify. Wrap the app once…
<ShopifyCart storefront={storefront}>
  <App />
</ShopifyCart>

// …and use it where you used useCartState. Check out goes to Shopify's hosted checkout.
const cart = useShopifyCart();
<Cart open={open} onOpenChange={setOpen} cart={cart} />
<AddToCart onAdd={() => cart.add({ variantId: variant.id, title: product.title, price: variant.price })} />`,
  use: [
    "A store on Shopify, built with your own React (Vite, Next.js or anything else) and litt's parts, without Hydrogen.",
    "Products and collections into ProductCard, OptionPicker and the product and collection blocks: what getProduct returns goes straight in.",
    "A cart that survives a reload and checks out on Shopify: wrap the app in ShopifyCart and pass useShopifyCart() to the cart parts.",
  ],
  skip: [
    "A store already on Hydrogen. Keep Hydrogen's cart and map its products with toProduct, which reads the same fields.",
    "Anything the Admin API does: stock, orders, prices. That needs a secret token and a server, never the browser.",
    "A store that is not on Shopify. The parts take plain data: build a Product and keep the cart in useCartState or your own CartState.",
  ],
  a11y: [
    "It draws nothing. The parts it feeds keep their names, keyboard and focus.",
    "An image's alt text is Shopify's alt text, or the product's title when the store left it empty. Write real alt text in Shopify's admin.",
    "A failed call throws a ShopifyError with Shopify's words; say it in your UI, as the live demo here does with an error state and Try again.",
    "A change to the cart shows at once and settles when Shopify answers, so a stepper never waits on the network; Check out is disabled while a change is on its way.",
  ],
};

/* ----------------------------------------------------------------- a Storefront answer, as Shopify sends it */

/** What the Storefront API sends for one print (PRODUCT_FIELDS), with the gallery's own picture in it. */
const silk = PLATES.silk!;
const SILK_FROM_SHOPIFY: StorefrontProduct = {
  id: "gid://shopify/Product/8080",
  handle: "silk",
  title: "Silk",
  vendor: "Field studies",
  description: "Grey folds like slow water.",
  options: [
    { name: "Size", optionValues: [{ name: "A3", swatch: null }, { name: "A2", swatch: null }] },
    {
      name: "Frame",
      optionValues: [
        { name: "Black", swatch: { color: "#1f1d1b", image: null } }, // litt-allow: user data, Shopify's swatch color
        { name: "Natural oak", swatch: { color: "#c9a57d", image: null } }, // litt-allow: user data
      ],
    },
  ],
  images: { nodes: [{ url: silk.src, altText: silk.alt, width: silk.width, height: silk.height }] },
  variants: {
    nodes: [
      { id: "gid://shopify/ProductVariant/1", title: "A3 / Black", availableForSale: true, price: { amount: "100.0", currencyCode: "EUR" }, compareAtPrice: null, selectedOptions: [{ name: "Size", value: "A3" }, { name: "Frame", value: "Black" }], image: null },
      { id: "gid://shopify/ProductVariant/2", title: "A3 / Natural oak", availableForSale: true, price: { amount: "100.0", currencyCode: "EUR" }, compareAtPrice: null, selectedOptions: [{ name: "Size", value: "A3" }, { name: "Frame", value: "Natural oak" }], image: null },
      { id: "gid://shopify/ProductVariant/3", title: "A2 / Black", availableForSale: true, price: { amount: "145.0", currencyCode: "EUR" }, compareAtPrice: null, selectedOptions: [{ name: "Size", value: "A2" }, { name: "Frame", value: "Black" }], image: null },
      { id: "gid://shopify/ProductVariant/4", title: "A2 / Natural oak", availableForSale: false, price: { amount: "145.0", currencyCode: "EUR" }, compareAtPrice: null, selectedOptions: [{ name: "Size", value: "A2" }, { name: "Frame", value: "Natural oak" }], image: null },
    ],
  },
};

function MappingDemo() {
  const product = toProduct(SILK_FROM_SHOPIFY);
  const [picks, setPicks] = useState(() => defaultPicks(product));
  const variant = findVariant(product, picks);
  return (
    <div className="grid w-full max-w-2xl gap-8 sm:grid-cols-2">
      <ul className="contents">
        <ProductCard product={product} href="#shopify" ratio="4/3" />
      </ul>
      <div className="grid content-start gap-6">
        {variant && <Price price={variant.price} className="text-body" />}
        {optionsFor(product, picks).map((option) => (
          <OptionPicker key={option.name} name={option.name} values={option.values} value={picks[option.name]} onValueChange={(v) => setPicks({ ...picks, [option.name]: v })} />
        ))}
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------- a live store */

/** mock.shop: Shopify's public mock store. It needs no token; a real store needs its domain and public token. */
const MOCK_SHOP = { endpoint: "https://mock.shop/api" };

function LiveProduct({ product }: { product: Product }) {
  const cart = useShopifyCart();
  const [open, setOpen] = useState(false);
  const [picks, setPicks] = useState(() => defaultPicks(product));
  const variant = findVariant(product, picks);
  return (
    <div className="grid gap-6 border-t border-line pt-6">
      <div className="flex items-start justify-between gap-4">
        <div className="grid gap-1">
          <h3 className="text-body font-title text-fg">{product.title}</h3>
          {variant && <Price price={variant.price} compareAt={variant.compareAt} className="text-body" />}
        </div>
        <CartButton count={cart.count} onClick={() => setOpen(true)} />
      </div>
      {optionsFor(product, picks).map((option) => (
        <OptionPicker key={option.name} name={option.name} values={option.values} value={picks[option.name]} onValueChange={(v) => setPicks({ ...picks, [option.name]: v })} />
      ))}
      <AddToCart
        soldOut={variant ? !variant.available : false}
        disabled={!variant}
        onAdd={async () => {
          if (!variant) return;
          try {
            await cart.add({ variantId: variant.id, title: product.title, price: variant.price });
            toast({ title: `Added ${product.title}`, action: { label: "View cart", onClick: () => setOpen(true) } });
          } catch (e) {
            toast({ title: "Shopify said no", description: e instanceof Error ? e.message : undefined, tone: "error" });
          }
        }}
      />
      <Cart open={open} onOpenChange={setOpen} cart={cart} onCheckout={() => cart.checkoutUrl && window.open(cart.checkoutUrl, "_blank", "noopener")} />
    </div>
  );
}

function LiveStoreDemo() {
  const storefront = useMemo(() => createStorefront(MOCK_SHOP), []);
  const [state, setState] = useState<"idle" | "loading" | "failed" | "ready">("idle");
  const [products, setProducts] = useState<Product[]>([]);
  const [picked, setPicked] = useState<Product | null>(null);
  const load = async () => {
    setState("loading");
    try {
      const list = await getProducts(storefront, 4);
      setProducts(list);
      setPicked(list[0] ?? null);
      setState("ready");
    } catch {
      setState("failed");
    }
  };
  return (
    <ShopifyCart storefront={storefront} storageKey="litt-gallery-mock-shop">
      <section aria-label="mock.shop" aria-busy={state === "loading"} className="grid w-full gap-6">
        {state === "failed" ? (
          <ErrorState title="mock.shop didn't answer" action={<Button onClick={load}>Try again</Button>}>
            The store could not be reached. Check the connection and try again.
          </ErrorState>
        ) : state !== "ready" ? (
          <div className="grid justify-items-start gap-3">
            <p className="max-w-[65ch] text-body text-fg-muted">Four products from mock.shop, Shopify's public mock store, fetched only when you ask.</p>
            <Button loading={state === "loading"} onClick={load}>
              Load mock.shop
            </Button>
          </div>
        ) : (
          <>
            <ProductGrid label="mock.shop products">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} ratio="1/1" onOpen={() => setPicked(p)} />
              ))}
            </ProductGrid>
            {picked && <LiveProduct key={picked.id} product={picked} />}
          </>
        )}
      </section>
    </ShopifyCart>
  );
}

export default function ShopifyPage() {
  return (
    <Page meta={meta} docs={docs}>
      <Toaster>
        <Stage
          title="From the Storefront API"
          tier="responsive"
          align="start"
          code="MappingDemo"
          caption="One product as Shopify sends it, through toProduct, into a Product card and two option pickers. The frame's swatches are Shopify's own colors; A2 in Natural oak is out of stock, so it fades when A2 is picked. No network here: the answer is written into the page."
        >
          <MappingDemo />
        </Stage>

        <Stage
          title="A live store"
          tier="expressive"
          align="start"
          code="LiveStoreDemo"
          caption="Press Load mock.shop: four real products come back from the Storefront API and map into cards. Pick one, choose its options and add it: the cart lives in Shopify, the count rolls, and the cart sheet shows Shopify's subtotal. Check out opens Shopify's hosted checkout in a new tab."
        >
          <LiveStoreDemo />
        </Stage>
      </Toaster>
    </Page>
  );
}

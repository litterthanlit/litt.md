/**
 * Shopify: litt's commerce parts on a Shopify store, through the Storefront API (proposals/commerce.md, "The Shopify
 * layer"). A library, not a component: it fetches and maps, and draws nothing. Installed in lib/litt/shopify.ts.
 *
 * - createStorefront({ domain, token }) is a small fetch client for one store's Storefront GraphQL API, pinned to one
 *   API version (STOREFRONT_API_VERSION). The token is the store's public Storefront token, made for the browser: it
 *   reaches only what a shopper can see. The Admin API never appears. No package, no provider model: it runs in a
 *   Vite app, in a Next.js server component and in a route handler alike.
 * - getProduct, getCollection and getProducts fetch and map in one step: what they return is litt's Product, so it
 *   goes straight to ProductCard, OptionPicker and the product and collection blocks. getCart, createCart,
 *   addCartLines, updateCartLines and removeCartLines are the cart's calls; toCartItems maps a cart's lines. toProduct does the mapping on
 *   its own, for a query of yours that uses PRODUCT_FIELDS.
 * - The mapping: images become ProductImages with a srcSet from Shopify's image CDN; option values keep their swatch
 *   (Shopify's hex color, or its image), which OptionPicker draws as chips; a product with no options (Shopify's one
 *   "Title" option with "Default Title") has none; variants keep their price, compare-at price and stock.
 * - No React in this file, so it ships as lib/litt/shopify.ts without "use client" and runs anywhere: in the browser,
 *   in a Next.js server component, in a route handler. The cart, which needs React, is shopify-cart.tsx.
 * - When Shopify ships a new API version, STOREFRONT_API_VERSION and the fields change here; nothing visual moves.
 */
import type { CartItem } from "@/components/cart";
import type { OptionValue } from "@/components/option-picker";
import type { Money } from "@/components/price";
import type { Product, ProductImage, ProductVariant } from "@/components/product-card";

/** The Storefront API version every query is written for. */
export const STOREFRONT_API_VERSION = "2026-04";

/* ----------------------------------------------------------------- the client */

export type StorefrontConfig = {
  /** The store's domain: "your-store.myshopify.com" or its own domain. */
  domain?: string;
  /** The store's public Storefront API access token. Leave it out for a store that needs none, such as mock.shop. */
  token?: string;
  /** The API version. Leave it out for STOREFRONT_API_VERSION, which the fields here are written for. */
  version?: string;
  /** The whole GraphQL address, in place of the one made from the domain: "https://mock.shop/api". */
  endpoint?: string;
  /** Prices and stock for this country, as an ISO code: "IE", "US". */
  country?: string;
  /** Text in this language, as an ISO code: "EN", "DE". */
  language?: string;
};

export type Storefront = {
  /** Runs a query or a mutation and gives back its data. Throws a ShopifyError when Shopify answers with errors. */
  query: <T>(query: string, variables?: Record<string, unknown>) => Promise<T>;
};

/** What Shopify said went wrong: its messages, joined. */
export class ShopifyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ShopifyError";
  }
}

/** A client for one store's Storefront API: a fetch, the token and the pinned version, nothing more. */
export function createStorefront({ domain, token, version = STOREFRONT_API_VERSION, endpoint, country, language }: StorefrontConfig): Storefront {
  const url = endpoint ?? `https://${domain}/api/${version}/graphql.json`;
  if (!endpoint && !domain) throw new ShopifyError("createStorefront needs a domain or an endpoint.");
  /* @inContext sets the country and the language for prices and text, when they are given. */
  const context = country || language ? `@inContext(${[country && `country: ${country}`, language && `language: ${language}`].filter(Boolean).join(", ")})` : "";
  return {
    async query<T>(query: string, variables: Record<string, unknown> = {}) {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { "X-Shopify-Storefront-Access-Token": token } : {}) },
        body: JSON.stringify({ query: context ? query.replace(/^(\s*(?:query|mutation)\s*\w*\s*(?:\([^)]*\))?)/, `$1 ${context}`) : query, variables }),
      });
      if (!res.ok) throw new ShopifyError(`Shopify answered ${res.status} ${res.statusText}.`);
      const body = (await res.json()) as { data?: T; errors?: { message: string }[] };
      if (body.errors?.length) throw new ShopifyError(body.errors.map((e) => e.message).join(" "));
      if (!body.data) throw new ShopifyError("Shopify answered with no data.");
      return body.data;
    },
  };
}

/* ----------------------------------------------------------------- the fields */

const IMAGE = "url altText width height";
const MONEY = "amount currencyCode";

/** The product fields toProduct reads. Put them in a query of your own: `product(handle: $handle) { ${PRODUCT_FIELDS} }`. */
export const PRODUCT_FIELDS = `id handle title vendor description
  options { name optionValues { name swatch { color image { previewImage { url } } } } }
  images(first: 10) { nodes { ${IMAGE} } }
  variants(first: 100) { nodes { id title availableForSale price { ${MONEY} } compareAtPrice { ${MONEY} } selectedOptions { name value } image { ${IMAGE} } } }`;

/** The cart fields toCartItems reads, for shopify-cart. */
export const CART_FIELDS = `id checkoutUrl totalQuantity cost { subtotalAmount { ${MONEY} } }
  lines(first: 100) { nodes { id quantity
    cost { amountPerQuantity { ${MONEY} } compareAtAmountPerQuantity { ${MONEY} } }
    merchandise { ... on ProductVariant { id title image { ${IMAGE} } selectedOptions { name value } product { title handle featuredImage { ${IMAGE} } } } } } }`;

/* ----------------------------------------------------------------- the Storefront API's shapes, as far as litt reads them */

type SImage = { url: string; altText: string | null; width: number | null; height: number | null };
type SMoney = { amount: string; currencyCode: string };
type SVariant = {
  id: string;
  title: string;
  availableForSale: boolean;
  price: SMoney;
  compareAtPrice: SMoney | null;
  selectedOptions: { name: string; value: string }[];
  image: SImage | null;
};
/** A product as the Storefront API returns PRODUCT_FIELDS. */
export type StorefrontProduct = {
  id: string;
  handle: string;
  title: string;
  vendor: string;
  description: string;
  options: { name: string; optionValues: { name: string; swatch: { color: string | null; image: { previewImage: { url: string } | null } | null } | null }[] }[];
  images: { nodes: SImage[] };
  variants: { nodes: SVariant[] };
};
/** A cart as the Storefront API returns CART_FIELDS. */
export type StorefrontCart = {
  id: string;
  checkoutUrl: string;
  totalQuantity: number;
  cost: { subtotalAmount: SMoney };
  lines: {
    nodes: {
      id: string;
      quantity: number;
      cost: { amountPerQuantity: SMoney; compareAtAmountPerQuantity: SMoney | null };
      merchandise: { id: string; title: string; image: SImage | null; selectedOptions: { name: string; value: string }[]; product: { title: string; handle: string; featuredImage: SImage | null } };
    }[];
  };
};

/* ----------------------------------------------------------------- the mapping */

/** Several widths of a Shopify CDN image, for the browser to pick from. */
export function shopifySrcSet(url: string, widths: number[] = [400, 800, 1200, 1600]): string {
  return widths
    .map((w) => {
      try {
        const u = new URL(url);
        u.searchParams.set("width", String(w));
        return `${u.toString()} ${w}w`;
      } catch {
        return "";
      }
    })
    .filter(Boolean)
    .join(", ");
}

const toImage = (image: SImage, fallbackAlt: string): ProductImage => ({
  src: image.url,
  srcSet: shopifySrcSet(image.url),
  alt: image.altText ?? fallbackAlt,
  width: image.width ?? undefined,
  height: image.height ?? undefined,
});
/** Maps a Storefront API MoneyV2 to litt's Money. They are the same shape; this drops anything else Shopify sends. */
export const toMoney = (m: SMoney): Money => ({ amount: m.amount, currencyCode: m.currencyCode });
/** Shopify gives a product with no options one option, "Title", with one value, "Default Title". litt shows none. */
const isDefault = (options: { name: string }[], values: string[]) => options.length === 1 && values.length === 1 && values[0] === "Default Title";

/** Maps a Storefront API product (PRODUCT_FIELDS) to litt's Product, for ProductCard, OptionPicker and the blocks. */
export function toProduct(p: StorefrontProduct): Product {
  const noOptions = isDefault(p.options, p.options[0]?.optionValues.map((v) => v.name) ?? []);
  const variants: ProductVariant[] = p.variants.nodes.map((v) => ({
    id: v.id,
    title: v.title,
    available: v.availableForSale,
    price: toMoney(v.price),
    compareAt: v.compareAtPrice ? toMoney(v.compareAtPrice) : null,
    options: noOptions ? {} : Object.fromEntries(v.selectedOptions.map((o) => [o.name, o.value])),
    image: v.image ? toImage(v.image, p.title) : undefined,
  }));
  return {
    id: p.id,
    handle: p.handle,
    title: p.title,
    vendor: p.vendor || undefined,
    description: p.description || undefined,
    images: p.images.nodes.map((i) => toImage(i, p.title)),
    options: noOptions
      ? []
      : p.options.map((o) => ({
          name: o.name,
          values: o.optionValues.map(
            (v): OptionValue => ({
              value: v.name,
              swatch: v.swatch && (v.swatch.color || v.swatch.image?.previewImage) ? { color: v.swatch.color ?? undefined, image: v.swatch.image?.previewImage?.url } : undefined,
            }),
          ),
        })),
    variants,
  };
}

/** Maps a Storefront API cart's lines to litt's CartItems. */
export function toCartItems(cart: StorefrontCart): CartItem[] {
  return cart.lines.nodes.map((line) => {
    const m = line.merchandise;
    const picks = m.selectedOptions.filter((o) => o.value !== "Default Title").map((o) => o.value);
    const image = m.image ?? m.product.featuredImage;
    return {
      id: line.id,
      variantId: m.id,
      title: m.product.title,
      variantTitle: picks.length ? picks.join(" · ") : undefined,
      quantity: line.quantity,
      price: toMoney(line.cost.amountPerQuantity),
      compareAt: line.cost.compareAtAmountPerQuantity ? toMoney(line.cost.compareAtAmountPerQuantity) : null,
      image: image ? toImage(image, "") : undefined,
    };
  });
}

/* ----------------------------------------------------------------- fetching */

/** One product by its handle, as litt's Product, or null when the store has none by that handle. */
export async function getProduct(storefront: Storefront, handle: string): Promise<Product | null> {
  const data = await storefront.query<{ product: StorefrontProduct | null }>(
    `query Product($handle: String!) { product(handle: $handle) { ${PRODUCT_FIELDS} } }`,
    { handle },
  );
  return data.product ? toProduct(data.product) : null;
}

/** The store's products, newest first, as litt's Products. */
export async function getProducts(storefront: Storefront, first = 24): Promise<Product[]> {
  const data = await storefront.query<{ products: { nodes: StorefrontProduct[] } }>(
    `query Products($first: Int!) { products(first: $first, sortKey: CREATED_AT, reverse: true) { nodes { ${PRODUCT_FIELDS} } } }`,
    { first },
  );
  return data.products.nodes.map(toProduct);
}

/** One collection by its handle: its title and its products, as litt's Products, or null. */
export async function getCollection(storefront: Storefront, handle: string, first = 24): Promise<{ title: string; products: Product[] } | null> {
  const data = await storefront.query<{ collection: { title: string; products: { nodes: StorefrontProduct[] } } | null }>(
    `query Collection($handle: String!, $first: Int!) { collection(handle: $handle) { title products(first: $first) { nodes { ${PRODUCT_FIELDS} } } } }`,
    { handle, first },
  );
  return data.collection ? { title: data.collection.title, products: data.collection.products.nodes.map(toProduct) } : null;
}

/* ----------------------------------------------------------------- the cart's calls */

type CartResult = { cart: StorefrontCart | null; userErrors: { message: string }[] };
const cartCall = async (storefront: Storefront, name: string, mutation: string, variables: Record<string, unknown>) => {
  const data = await storefront.query<Record<string, CartResult>>(mutation, variables);
  const result = data[name]!;
  if (result.userErrors.length) throw new ShopifyError(result.userErrors.map((e) => e.message).join(" "));
  return result.cart;
};

/** A line to add: the variant's id and how many. */
export type CartLineInput = { merchandiseId: string; quantity: number };

/** A cart by its id, or null when Shopify no longer has it. */
export async function getCart(storefront: Storefront, id: string): Promise<StorefrontCart | null> {
  return (await storefront.query<{ cart: StorefrontCart | null }>(`query Cart($id: ID!) { cart(id: $id) { ${CART_FIELDS} } }`, { id })).cart;
}

/** Makes a cart with these lines. */
export const createCart = (storefront: Storefront, lines: CartLineInput[]) =>
  cartCall(storefront, "cartCreate", `mutation Create($lines: [CartLineInput!]) { cartCreate(input: { lines: $lines }) { cart { ${CART_FIELDS} } userErrors { message } } }`, { lines });

/** Adds lines to a cart; a variant already in it gets more. */
export const addCartLines = (storefront: Storefront, cartId: string, lines: CartLineInput[]) =>
  cartCall(storefront, "cartLinesAdd", `mutation Add($id: ID!, $lines: [CartLineInput!]!) { cartLinesAdd(cartId: $id, lines: $lines) { cart { ${CART_FIELDS} } userErrors { message } } }`, { id: cartId, lines });

/** Sets lines' quantities, by the lines' ids. */
export const updateCartLines = (storefront: Storefront, cartId: string, lines: { id: string; quantity: number }[]) =>
  cartCall(storefront, "cartLinesUpdate", `mutation Update($id: ID!, $lines: [CartLineUpdateInput!]!) { cartLinesUpdate(cartId: $id, lines: $lines) { cart { ${CART_FIELDS} } userErrors { message } } }`, { id: cartId, lines });

/** Takes lines out of a cart, by the lines' ids. */
export const removeCartLines = (storefront: Storefront, cartId: string, lineIds: string[]) =>
  cartCall(storefront, "cartLinesRemove", `mutation Remove($id: ID!, $lineIds: [ID!]!) { cartLinesRemove(cartId: $id, lineIds: $lineIds) { cart { ${CART_FIELDS} } userErrors { message } } }`, { id: cartId, lineIds });

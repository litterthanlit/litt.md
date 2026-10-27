#!/usr/bin/env node
/**
 * Test the shopify item against a real Storefront API: mock.shop, Shopify's public mock store, which needs no token.
 *
 *   npm run test:shopify --prefix gallery
 *   node scripts/test-shopify.mjs --endpoint https://your-store.myshopify.com/api/2026-04/graphql.json --token …
 *
 * It transpiles src/components/shopify.tsx as it ships (no React in it, types erased), then:
 *   1. getProducts maps real products into litt's Product: ids, handles, titles, images with a CDN srcSet, options
 *      with their values, variants whose options name only real options, prices as { amount, currencyCode }, and a
 *      product with no options mapped to none (Shopify's "Default Title").
 *   2. getProduct finds one of them by handle, and a handle that does not exist gives null.
 *   3. getCollection returns a collection's title and products.
 *   4. The cart's calls: createCart, addCartLines (twice for one variant, which adds to its line), updateCartLines,
 *      removeCartLines and getCart, read through toCartItems, with the subtotal and the checkoutUrl.
 *   5. A query Shopify refuses throws a ShopifyError with Shopify's message.
 *
 * It needs the network, so it is not part of verify (the Vercel build and the pixel tests never touch it). Exits 1 on
 * the first broken claim.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const arg = (k) => { const i = args.indexOf(`--${k}`); return i >= 0 ? args[i + 1] : undefined; };
const endpoint = arg("endpoint") ?? "https://mock.shop/api";
const token = arg("token");

/* The item as it ships: one file, transpiled to plain JavaScript in a folder of its own. */
const source = fs.readFileSync(path.join(root, "src", "components", "shopify.tsx"), "utf8");
const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, verbatimModuleSyntax: false } }).outputText;
if (/from\s+["'](?!\.)/.test(js) || /\bimport\s*\(/.test(js)) throw new Error("shopify.tsx imports something at run time; it must import types only, so it runs anywhere.");
const dir = fs.mkdtempSync(path.join(os.tmpdir(), "litt-shopify-"));
fs.writeFileSync(path.join(dir, "shopify.mjs"), js);
const shop = await import(pathToFileURL(path.join(dir, "shopify.mjs")).href);

let passed = 0;
const ok = (cond, claim) => {
  if (!cond) {
    console.error(`  ✗ ${claim}`);
    process.exit(1);
  }
  passed++;
  console.log(`  ✓ ${claim}`);
};
const isMoney = (m) => m && typeof m.currencyCode === "string" && !Number.isNaN(Number.parseFloat(m.amount));

const sf = shop.createStorefront({ endpoint, token });
console.log(`Shopify item against ${endpoint} (API ${shop.STOREFRONT_API_VERSION})`);

/* 1. Products */
const products = await shop.getProducts(sf, 12);
ok(products.length > 0, `getProducts returns products (${products.length})`);
for (const p of products) {
  ok(p.id && p.handle && p.title, `${p.handle}: id, handle and title`);
  ok(p.images.every((i) => i.src && typeof i.alt === "string" && (!i.srcSet || /\b400w\b/.test(i.srcSet))), `${p.handle}: images with alt text and a CDN srcSet`);
  ok(p.variants.length > 0 && p.variants.every((v) => v.id && isMoney(v.price) && typeof v.available === "boolean"), `${p.handle}: variants with a price and stock`);
  const names = p.options.map((o) => o.name);
  ok(p.variants.every((v) => Object.keys(v.options).every((k) => names.includes(k))), `${p.handle}: variants name only the product's options`);
  ok(!p.options.some((o) => o.values.some((v) => v.value === "Default Title")), `${p.handle}: no Default Title option`);
}
const withSwatch = products.flatMap((p) => p.options.flatMap((o) => o.values)).filter((v) => v.swatch);
console.log(`  · ${withSwatch.length} option values carry a swatch`);

/* 2. One product */
const first = products[0];
const one = await shop.getProduct(sf, first.handle);
ok(one && one.id === first.id, `getProduct finds ${first.handle}`);
ok((await shop.getProduct(sf, "no-such-product-litt")) === null, "getProduct gives null for a handle the store does not have");

/* 3. A collection */
const handles = await sf.query("{ collections(first: 1) { nodes { handle } } }");
const handle = handles.collections.nodes[0]?.handle;
if (handle) {
  const c = await shop.getCollection(sf, handle, 6);
  ok(c && c.title && c.products.length > 0, `getCollection reads "${c?.title}" with ${c?.products.length} products`);
} else console.log("  · the store has no collection to read");

/* 4. The cart */
const variant = products.flatMap((p) => p.variants).find((v) => v.available);
ok(variant, "a variant in stock to add");
let cart = await shop.createCart(sf, [{ merchandiseId: variant.id, quantity: 1 }]);
ok(cart?.id && cart.checkoutUrl, "createCart makes a cart with a checkoutUrl");
cart = await shop.addCartLines(sf, cart.id, [{ merchandiseId: variant.id, quantity: 2 }]);
let items = shop.toCartItems(cart);
ok(items.length === 1 && items[0].quantity === 3, "addCartLines adds to the variant's line (1 + 2 = 3)");
ok(items[0].variantId === variant.id && isMoney(items[0].price) && items[0].title, "toCartItems maps the line: variant, price and title");
ok(isMoney(cart.cost.subtotalAmount) && Math.abs(Number(cart.cost.subtotalAmount.amount) - Number(items[0].price.amount) * 3) < 0.01, "the subtotal is three of the price");
cart = await shop.updateCartLines(sf, cart.id, [{ id: items[0].id, quantity: 1 }]);
ok(shop.toCartItems(cart)[0].quantity === 1, "updateCartLines sets the quantity");
cart = await shop.removeCartLines(sf, cart.id, [items[0].id]);
ok(shop.toCartItems(cart).length === 0, "removeCartLines empties it");
const again = await shop.getCart(sf, cart.id);
ok(again && again.id === cart.id && again.totalQuantity === 0, "getCart reads it back");

/* 5. A refusal */
let refused = null;
try {
  await sf.query("{ product(handle: 1, nope: 2) { id } }");
} catch (e) {
  refused = e;
}
ok(refused && refused.name === "ShopifyError" && refused.message.length > 0, "a refused query throws a ShopifyError with Shopify's words");

fs.rmSync(dir, { recursive: true, force: true });
console.log(`\n${passed} claims hold.`);

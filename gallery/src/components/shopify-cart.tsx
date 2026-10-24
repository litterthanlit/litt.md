/**
 * Shopify cart: a cart kept in Shopify, for litt's Cart, CartButton and AddToCart (proposals/commerce.md, "The Shopify
 * layer"). Installed in lib/litt/shopify-cart.tsx, beside lib/litt/shopify.ts.
 *
 * - ShopifyCart keeps one cart for everything inside it; useShopifyCart() reads it. It is the same CartState as
 *   useCartState, so the cart parts do not change when the cart moves to Shopify.
 * - The cart's id is kept in the browser (localStorage), so it survives a reload; a cart Shopify no longer has is
 *   forgotten. The first add creates the cart.
 * - A quantity or a removal shows at once and settles when Shopify answers. If Shopify refuses, the cart goes back to
 *   what Shopify has and the promise rejects, so the caller can say so.
 * - Check out goes to the cart's checkoutUrl: Shopify's own hosted checkout.
 * - Undo puts a removed line back at the end, because Shopify keeps its own order.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { CartItem, CartState } from "@/components/cart";
import { addCartLines, createCart, getCart, removeCartLines, toCartItems, toMoney, updateCartLines, type CartLineInput, type Storefront, type StorefrontCart } from "@/components/shopify";

const CartContext = createContext<CartState | null>(null);

export type ShopifyCartProps = {
  /** The store, from createStorefront. Make it once, outside the render, or memoise it. */
  storefront: Storefront;
  /** Where the browser keeps the cart's id between visits. Change it for a second store on one domain. */
  storageKey?: string;
  children: ReactNode;
};

const read = (key: string) => {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
};
const write = (key: string, value: string | null) => {
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
  } catch {
    /* Private mode or blocked storage: the cart lasts until the page reloads. */
  }
};

/** Keeps one Shopify cart for everything inside it. Put it near the root; read it with useShopifyCart(). */
export function ShopifyCart({ storefront, storageKey = "litt-shopify-cart", children }: ShopifyCartProps) {
  const [cart, setCart] = useState<StorefrontCart | null>(null);
  const [items, setItems] = useState<CartItem[]>([]);
  const [pending, setPending] = useState(0);
  const idRef = useRef<string | null>(null);

  const settle = useCallback(
    (next: StorefrontCart | null) => {
      setCart(next);
      setItems(next ? toCartItems(next) : []);
      idRef.current = next?.id ?? null;
      write(storageKey, next?.id ?? null);
    },
    [storageKey],
  );

  /* Runs a change. On a refusal, the cart goes back to what Shopify has. */
  const run = useCallback(
    async (change: () => Promise<StorefrontCart | null>) => {
      setPending((n) => n + 1);
      try {
        settle(await change());
      } catch (error) {
        if (idRef.current) {
          const now = await getCart(storefront, idRef.current).then((c) => ({ c }), () => null);
          if (now) settle(now.c);
        }
        throw error;
      } finally {
        setPending((n) => n - 1);
      }
    },
    [settle, storefront],
  );

  /* The cart from an earlier visit, if Shopify still has it. */
  useEffect(() => {
    const id = read(storageKey);
    if (!id) return;
    idRef.current = id;
    getCart(storefront, id).then(settle, () => settle(null));
  }, [storefront, storageKey, settle]);

  const state = useMemo<CartState>(() => {
    const addLines = (lines: CartLineInput[]) => (idRef.current ? addCartLines(storefront, idRef.current, lines) : createCart(storefront, lines));
    return {
      items,
      count: items.reduce((sum, i) => sum + i.quantity, 0),
      subtotal: cart ? toMoney(cart.cost.subtotalAmount) : { amount: 0, currencyCode: items[0]?.price.currencyCode ?? "USD" },
      checkoutUrl: cart?.checkoutUrl,
      pending: pending > 0,
      add: ({ variantId, quantity = 1 }) => run(() => addLines([{ merchandiseId: variantId, quantity }])),
      update: (id, quantity) => {
        setItems((list) => list.map((i) => (i.id === id ? { ...i, quantity } : i)));
        return run(() => updateCartLines(storefront, idRef.current!, [{ id, quantity }]));
      },
      remove: (id) => {
        setItems((list) => list.filter((i) => i.id !== id));
        return run(() => removeCartLines(storefront, idRef.current!, [id]));
      },
      /* Shopify keeps its own order, so a restored line comes back at the end. */
      restore: (item) => run(() => addLines([{ merchandiseId: item.variantId, quantity: item.quantity }])),
    };
  }, [items, cart, pending, run, storefront]);

  return <CartContext.Provider value={state}>{children}</CartContext.Provider>;
}

/** The Shopify cart from the nearest ShopifyCart: the same CartState as useCartState, for Cart, CartButton and AddToCart. */
export function useShopifyCart(): CartState {
  const state = useContext(CartContext);
  if (!state) throw new Error("useShopifyCart must be used inside <ShopifyCart>");
  return state;
}

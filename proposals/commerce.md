# Commerce: a store on litt, Shopify first

Written 2026-10-23 for Nick. Nick asked: "what if we could integrate with shopify, I dont think bencho has ecom components no?", then "yes please" to a proposal before any build.

Status: **decided on 2026-10-24.** Nick: "all as recommended", for all 13 decisions below. The forms, dashboards and agents steps were built first and tested after; this one asked first, because four of its decisions lean on taste rules (P1, P7, P11 and the 18px ceiling) and one adds the registry's first outside service. No taste rule changed.

## Why litt, not why bencho

bencho.dev has no store parts (its closest are a Pay button, a Billing card and a Price flow), but that is not the reason. The journal's rule from 2026-10-22: "litt takes qualities from a reference, never its catalogue: a new part answers a need in litt's own world." The need is real. The studio sells builds (the `pricing-section` agent task is litt.design's own pricing), a store is the most common client site that is not a dashboard, and an agent asked to "build a product page" with the registry today hand-builds the card, the price and the cart, which is where the accent fills multiply and the prices turn bold and red.

## What litt already has

About half of a store is parts litt already ships, composed.

| A store needs | litt has |
|---|---|
| The product's pictures | `media` (fixed shape, no layout jump), `carousel` (phones), `lightbox` (zoom) |
| Quantity | `number-field` (its spec already names "a price"; tabular figures, steppers that never open the keyboard) |
| Text options (size, fit) | the Segmented control's look: one raised segment means "this one" (P12) |
| The cart | `dialog` with `side="right"`, which is already a bottom sheet on phones that sits above the keyboard |
| A total that changes while you watch | `rolling-number` |
| "Added to cart", "Removed, Undo" | `toast` |
| The buy action | `button` at md, the one accent fill (P1) |
| How far to free shipping | the Meter in `chart` (a quantity against a limit that stands still; Progress is for work happening now) |
| A grid of products | `card` with a cover, and `pagination` |

## The new parts

| Item | What it is |
|---|---|
| Price | One amount, formatted by `Intl.NumberFormat` from an amount and a currency code (Shopify's `MoneyV2` shape, so no mapping). Optional compare-at price after it, struck through in `--fg-subtle` with hidden "Regular price" and "Sale price" words. Optional unit price ("€4.20 / 100 ml") at the caption size. Tabular figures in the sans, as the Stat's value. |
| Option picker | One product option as a fieldset of native radios with a visible legend that names the pick ("Color · Sand"). Text values take the Segmented look; color values take swatch chips (decision 2). A value with no variant in stock stays pickable and says so (decision 4). |
| Product card | A Card with a padded cover (Media, `--radius-control`), the title at the body size and `--weight-title`, the price under it, an optional vendor in `--fg-subtle`. It links to the product; hover is the Card's one surface step. |
| Cart line | A 64px square Media thumbnail, the title, the picked options in `--fg-subtle`, a Number field at sm, Remove as a ghost sm button, and the line's price aligned to the end. |
| Cart summary | The subtotal as a `bare` Details row with a Rolling number, an optional free-shipping Meter with its words ("€12 to free shipping"), the "Taxes and shipping at checkout" note, and Check out. |
| Cart | The sheet that holds them: the Dialog at `side="right"`, a list of Cart lines, the summary pinned at the foot, and an empty state that says the cart is empty and offers to keep browsing. |

Two blocks compose them, named after the Store page that shows them: `product` (pictures, title, price, options, quantity, Add to cart, details in an Accordion) and `collection` (a filter row, a grid of Product cards, Pagination). Both open the same Cart.

**Not built: checkout.** Shopify's checkout is hosted (the cart's `checkoutUrl`) and is styled in Shopify's own checkout editor, not in the storefront. A litt checkout page could never run on a Shopify store, so litt's part ends at the Check out button. If a non-Shopify store needs a checkout later, it is a Forms pattern, not a commerce part.

## The Shopify layer

Three layers, each changeable on its own:

1. **Components** know nothing about Shopify. They take plain props: `Money` (`{ amount, currencyCode }`), a `Product` (title, handle, images, options, variants, price range) and a `CartLine`. A store on Stripe, Medusa or a JSON file uses the same parts.
2. **The `shopify` registry item** is a library, not a component: `lib/shopify/client.ts` (a small `fetch` to the Storefront GraphQL API with one pinned version, `2026-04`, the store domain and the public token from the app's env), `queries.ts` (the product, collection and cart fragments), `map.ts` (Storefront shapes to litt props: images to Media, option values with their `swatch` to the Option picker, `firstSelectableVariant` for the default pick), and `use-cart.ts` (the cart: create, add, update, remove; its id kept in the browser; quantities change at once and settle when Shopify answers).
3. **Blocks** wire the two: `product` and `collection` take a `Product` or a list, and the Shopify item's own docs page shows the five lines that feed them from a live store.

The public Storefront token is made for the browser and reaches only what a shopper can see. The Admin API never appears.

When Shopify ships a new quarterly API version, one constant and the fragments change. Nothing visual moves.

## Decisions (Nick: "all as recommended")

| # | Question | Recommendation | Why |
|---|---|---|---|
| 1 | Scope | Product, collection and cart. No checkout, no account pages, no search page in this step. | Those three are what every store builds first, and checkout belongs to Shopify. Search can come later from the Command menu and Combobox. |
| 2 | Swatch colors and P11 | **The product's color is content, not a hue.** Swatches follow the Color picker's rule: "the color is data", it fills only the chip, and a mark on it is black or white by `getContrastInk`. A swatch with an image shows the image. Gallery fixtures carry `// litt-allow: user data`, as the Color picker page does. 24px chips (32 on coarse pointers) at `--radius-control` with an fg-12% hairline, the picked one carrying a 16px check. | The Color picker already settled this: a color that belongs to the person's content is not one of the five data hues and is not chrome. No rule changes and the lint needs no new exception. |
| 3 | The picked text option | The Segmented control's raised segment (P12). | One look for "this one", everywhere. |
| 4 | An option with nothing in stock | It stays pickable, its label steps to `--fg-disabled` with a hidden "sold out", and Add to cart becomes a disabled "Sold out" button. No slash across a swatch. | Picking it tells the person why they cannot buy it, in words on the button. A slash is a mark carrying meaning alone, and a disabled radio hides the reason. |
| 5 | How big is a price? | The 18px ceiling holds. The product page's title is its one 18px line; the price sits under it at 14 and `--weight-title` in `--fg`. A sale is the compare-at price struck through beside it and a neutral "Save 20%" Tag, never red, never the accent. | Stores shout prices; litt ranks by weight, ink and space. The large thing on a product page is the picture, which is where your preference for big imagery lands. Worth a hard look in the tests. |
| 6 | One accent fill (P1) | Add to cart on the product page; Check out in the open cart (the page behind is under the scrim). A Product card has no buy button and no accent. | A grid of twelve "Add to cart" buttons is twelve accent fills. The card's job is to open the product. |
| 7 | After Add to cart | The button shows "Added" with a check for 2s (instant tier), the header's cart count rolls, and a toast says "Added Linen shirt" with a View cart action. The cart does not open by itself. | Opening a sheet on every add interrupts browsing and spends the view's expressive moment. The toast is that moment instead. The alternative, opening the cart (Shopify's Dawn theme), is one prop: `onAdd="open"`. |
| 8 | Removing a line | It goes at once, with Undo in a toast. No confirm. | The Slide to confirm spec: "Anything that can be undone just happens, with Undo in a toast." |
| 9 | Product pictures | Media at 4/5 by default (a prop), the card's cover the same shape as the page's. Phones: a Carousel of one slide and a peek. Wide screens: the pictures stacked in the wider column, the details sticky beside them; a picture opens the Lightbox. | Apparel and objects read best tall, and one shape across the grid keeps the rows even. Stacked pictures on desktop let the page scroll the way a person already does, and keep the asymmetric layout (P7). |
| 10 | A second picture on card hover | No. | It is motion that performs, and it hides the picture the person chose to look at. Worth a test if stores ask for it. |
| 11 | Motion | Nothing new. Picking an option is instant, totals roll, the toast and the sheet keep their own motion. No picture that flies into the cart. | Motion confirms, never performs. A flying thumbnail is the classic performance. Fun mode adds nothing a store needs. |
| 12 | The Shopify client | litt's own small `fetch` client, no dependency on `@shopify/hydrogen-react`. | The registry installs into plain Vite and Next.js apps and asks nothing of them. Hydrogen React is good but brings a provider model and its own versioning into every app that only wanted a card. Someone already on Hydrogen keeps its cart and maps it with `map.ts`. |
| 13 | Data in the gallery | Fixtures on every page. A separate `test:shopify` script runs the `shopify` item against mock.shop, Shopify's public mock Storefront API, which needs no token. It is not part of `verify`. | The Vercel build, the reduced-motion test and fun mode's pixel test need the same data every time and no network. mock.shop proves the adapter against the real API shape for free. |

## The agent's pass mark

A `product-page` task in `evals/agents/`: "Build the product page and cart for a store that sells a linen shirt in three colors and four sizes", expecting `price`, `option-picker`, `product-card` and `cart`. The look claims: exactly one accent fill per view, no bold or red prices, swatches that are the shirt's colors and not data hues, a sold-out size said in words, the cart a sheet on a phone, and no layout jump when the pictures load.

## Build order

1. Contract: the spec's new Commerce part in `components.md` (after Agents), the Commerce group in the sidebar, fixtures, `Money` and `Product` types.
2. Price, Option picker, Product card, each with a page.
3. Cart line, Cart summary, Cart.
4. The Store page and the `product` and `collection` blocks.
5. The `shopify` item, its docs page and `test:shopify`.
6. The `product-page` agent task.

Each step adds its changelog lines, runs `verify` and `test:registry`, and commits the lock with the change.

## Questions for Nick's tests

The decisions are made; these are the places where the build should be looked at hard.

1. **Decision 5:** does a 14px price under the 18px title hold its own next to a large picture?
2. **Decision 7:** does the toast after Add to cart feel like enough, or should the cart open?
3. **Decision 4:** does a sold-out value in the disabled ink read as sold out before it is picked?

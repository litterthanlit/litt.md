/**
 * The overview: a hero, an airy Cosmos-style masonry showcase of the best live components from all six galleries
 * floating directly on the open canvas, and the steps to build with them.
 *
 * Each gallery (Press, Flat, Device, Plain, Rack, Heat) keeps its full component wall at #<world>/components, while
 * the home page stays quiet and spacious so the components themselves speak first.
 */
import { Toaster } from "@/components/toast";
import { Button } from "@/components/button";
import { inWorld, pages, type PageEntry } from "../registry";
import { Start, toStart } from "../steps";
import { CosmosGrid } from "../cosmos-grid";
import { useCustomize } from "../customize-state";
import { SearchButton } from "../search";
import type { PageMeta } from "../kit";

export const meta: PageMeta = {
  id: "overview",
  title: "Overview",
  lede: "The real components on locked tokens, at their real size. Try any of them.",
  order: 0,
  summary: "Live components from every litt.md gallery on locked tokens, ready to try and install.",
  tiers: ["instant", "responsive", "expressive"],
  wall: true,
};

const WORDS = ["No", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen", "Twenty",
  ...["One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"].map((n) => `Twenty-${n.toLowerCase()}`), "Thirty",
  ...["One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"].map((n) => `Thirty-${n.toLowerCase()}`), "Forty",
  ...["One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"].map((n) => `Forty-${n.toLowerCase()}`), "Fifty",
  ...["One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"].map((n) => `Fifty-${n.toLowerCase()}`), "Sixty",
  ...["One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"].map((n) => `Sixty-${n.toLowerCase()}`), "Seventy",
  ...["One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"].map((n) => `Seventy-${n.toLowerCase()}`), "Eighty",
  ...["One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"].map((n) => `Eighty-${n.toLowerCase()}`), "Ninety"];

/**
 * What litt is, then Get started, search and the site's own pages. The statement
 * is the gallery's one line above 18px, as its mobile menu's 28px links are: built as an exception for the gallery's
 * hero and asked of Nick (proposals/gallery-wow.md, 2), not a change to R8. Everything under it keeps the scale.
 */
function Hero({ count, site }: { count: string; site: PageEntry[] }) {
  return (
    <header data-arrive="head" className="grid items-center gap-y-12">
      <div className="grid content-center gap-8">
        <div className="grid gap-4">
          <h1
            id="page-overview"
            tabIndex={-1}
            className="max-w-[16ch] outline-none text-[36px] leading-[40px] tracking-[-0.02em] text-balance text-fg sm:text-[56px] sm:leading-[60px]" // litt-allow: the gallery's hero, an exception to the 18px cap asked of Nick (proposals/gallery-wow.md, 2)
          >
            A design language you can hold.
          </h1>
          <p className="max-w-[44ch] text-h1 font-normal text-balance text-fg-subtle">
            {count} components on warm stone, lit from above. Free to install, and written down so your agent builds the same way.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="primary" size="lg" onClick={toStart}>
            Get started
          </Button>
          <SearchButton place="hero" />
        </div>
        <nav aria-label="Pages" className="-mx-3 -mt-4 flex flex-wrap gap-1">
          {site.map((p) => (
            <a
              key={p.id}
              href={`#${p.id}`}
              className={
                "flex h-control-sm items-center rounded-control px-3 text-small text-fg-muted select-none [-webkit-tap-highlight-color:transparent] " +
                "transition-colors duration-(--dur-instant) ease-litt hover:bg-[color-mix(in_oklab,var(--fg)_6%,transparent)] hover:text-fg pointer-coarse:h-control-md " +
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
              }
            >
              {p.title}
            </a>
          ))}
        </nav>
      </div>
    </header>
  );
}

export default function Overview() {
  const { look } = useCustomize();
  const list = pages.filter((p) => p.group && p.group !== "Blocks" && p.group !== "Worlds" && !p.world && inWorld(p, look.material));
  const site = pages.filter((p) => !p.group && p.id !== meta.id && !p.world);
  const count = WORDS[list.length] ?? String(list.length);
  return (
    <article aria-labelledby="page-overview" className="grid gap-20 pb-28 sm:gap-24 lg:gap-28">
      <Hero count={count} site={site} />
      <Toaster>
        <CosmosGrid />
      </Toaster>
      <div className="mt-8">
        <Start />
      </div>
    </article>
  );
}

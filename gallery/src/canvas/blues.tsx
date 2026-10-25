/**
 * The six candidate blues beside today's cobalt, each in the parts the accent touches: its fill, the one primary
 * button (with its glow), link text and an accent switch. Everything else on the canvas keeps the current tokens.
 */
import { useEffect, useState } from "react";
import { Button } from "@/components/button";
import { Switch } from "@/components/switch";
import { ACCENTS, accentVars } from "./accents";

function Ratio({ label, value }: { label: string; value: number }) {
  const pass = value >= 4.5;
  return (
    <>
      <dt className="text-fg-subtle">{label}</dt>
      <dd className={"tabular-nums " + (pass ? "text-fg" : "text-danger")}>
        {value.toFixed(2)}:1 {pass ? "" : "fails"}
      </dd>
    </>
  );
}

/** Whether the page is dark now: the gallery's choice on <html>, or the system's when it is left to the system. */
function useDark() {
  const read = () => {
    const t = document.documentElement.getAttribute("data-theme");
    return t ? t === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
  };
  const [dark, setDark] = useState(read);
  useEffect(() => {
    const update = () => setDark(read());
    const watch = new MutationObserver(update);
    watch.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    const media = matchMedia("(prefers-color-scheme: dark)");
    media.addEventListener("change", update);
    return () => {
      watch.disconnect();
      media.removeEventListener("change", update);
    };
  }, []);
  return dark;
}

export function AccentBlues() {
  const dark = useDark();
  return (
    <div className="grid grid-cols-7 gap-5">
      {ACCENTS.map((a) => (
        <section key={a.n} aria-label={a.n === "Today" ? "Today's cobalt" : a.name} style={accentVars(a.hex, dark)} className="grid content-start gap-4">
          <div aria-hidden="true" className="h-14 rounded-control bg-accent" />
          <div className="grid gap-0.5">
            <span className="text-small font-title text-fg">{a.n === "Today" ? "Today" : a.name}</span>
            <span className="text-caption font-normal text-fg-subtle">{a.hex}</span>
            <span className="tabular-nums text-caption font-normal text-fg-subtle">{a.oklch}</span>
          </div>
          <div>
            <Button variant="primary" size="sm">
              Publish
            </Button>
          </div>
          <a href="#canvas" onClick={(e) => e.preventDefault()} className="w-fit text-small text-accent-text underline underline-offset-4">
            View changes
          </a>
          <Switch tone="accent" defaultChecked label="Live" />
          <dl className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-1 text-caption">
            <Ratio label="White on it" value={a.white} />
            <Ratio label="As text" value={a.asText} />
          </dl>
        </section>
      ))}
    </div>
  );
}

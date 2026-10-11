import { useEffect, useState } from "react";
import { Button } from "@/components/button";
import { ArrowUpRightIcon, CopyIcon, MoreIcon, PlusIcon, SettingsIcon, TrashIcon } from "@/components/icons";
import { Page, Stage, type PageMeta } from "../kit";

export const meta: PageMeta = {
  id: "button",
  title: "Button",
  order: 1,
  summary: "Roomy, slightly rounded and weight 400. Hover changes the fill and press scales to 0.98, both on the instant tier, so the button answers without ever moving its box.",
  tiers: ["instant"],
};

function LoadingDemo() {
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (!loading) return;
    const t = setTimeout(() => setLoading(false), 1600);
    return () => clearTimeout(t);
  }, [loading]);
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button variant="primary" loading={loading} onClick={() => setLoading(true)}>Save changes</Button>
      <Button loading={loading} onClick={() => setLoading(true)}>Export</Button>
    </div>
  );
}

export default function ButtonPage() {
  return (
    <Page meta={meta}>
      <Stage
        title="Variants"
        tier="instant"
        caption="Primary is the one accent fill in a view and carries the glow. Hover swaps the fill over the instant duration; press scales to 0.98. Drag the instant slider and try again."
      >
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="primary">Start a project</Button>
          <Button variant="secondary">View work</Button>
          <Button variant="ghost">Cancel</Button>
          <Button disabled>Disabled</Button>
        </div>
      </Stage>

      <Stage title="Sizes" tier="instant" caption="32, 44 and 56 tall, shared with inputs. Labels are trimmed to the cap height, so the side padding equals the air around the label.">
        <div className="flex flex-wrap items-end gap-6">
          <Button size="sm">Small</Button>
          <Button size="md">Medium</Button>
          <Button size="lg" variant="primary">Large</Button>
        </div>
      </Stage>

      <Stage title="Loading" tier="instant" caption="The label stays mounted at opacity 0 while the spinner shows, so the button keeps its exact width. Press either button.">
        <LoadingDemo />
      </Stage>

      <Stage title="Icons" tier="instant" caption="16px icons at 1.5px stroke, 8px from the label. Icon-only buttons are round and labelled for screen readers. An arrow appears only when a button leaves the site.">
        <div className="flex flex-wrap items-center gap-3">
          <Button icon={<PlusIcon />}>New project</Button>
          <Button variant="ghost" iconRight={<ArrowUpRightIcon />}>Open in Framer</Button>
          <Button iconOnly aria-label="Copy link"><CopyIcon /></Button>
          <Button iconOnly variant="ghost" aria-label="Settings"><SettingsIcon /></Button>
          <Button iconOnly variant="ghost" aria-label="More actions"><MoreIcon /></Button>
          <Button iconOnly variant="ghost" size="sm" aria-label="Delete"><TrashIcon /></Button>
        </div>
      </Stage>
    </Page>
  );
}

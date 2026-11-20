import { DeployStatus } from "@/components/deploy-status";
import { Page, Stage, TryIt, type PageDocs, type PageMeta, type PageStudy } from "../kit";

export const meta: PageMeta = {
  id: "deploy-status",
  title: "Deploy status",
  lede: "A tactile deployment pipeline where reached stages rise out of a recessed stone tray.",
  order: 1.07,
  group: "Feedback",
  verbs: ["select", "press"],
  worlds: ["press"],
  summary:
    "Press's signature deployment pipeline sitting directly on warm stone: one recessed tray holds the ordered stages (Build, Checks, Edge, Live). Reached stages stand up as tactile raised blocks lit along their top edge with zero outlines; pending stages stay recessed in the tray. State is said once in plain words. It belongs to Press.",
  tiers: ["instant"],
  mechanism:
    "Stages sit inside a recessed tray (--tray, --tray-shade). Each stage up to the active index renders as a raised stone block (--block, --highlight, --block-lift) that sinks --press-depth on press; remaining stages stay recessed. Clicking any stage or using Rebuild and Next stage updates the active state and announces once in a polite live region.",
};

export const docs: PageDocs = {
  components: ["deploy-status"],
  exports: ["DeployStatus"],
  usage: `import { DeployStatus } from "@/components/deploy-status";

<DeployStatus
  project="harbor-web"
  refLabel="main · 4f9c2e1"
  region="fra1"
  defaultStageIndex={3}
/>`,
  use: [
    "Deploy headers, release dashboards and CI status bars under Press.",
    "Communicating ordered deployment stages through physical depth (raised vs recessed) rather than colored status pills.",
  ],
  skip: [
    "Another world's page. DeployStatus relies on Press's warm stone tray, raised block shadow and top highlight; it needs data-material=\"press\" on <html>.",
    "An indeterminate background upload bar. Use Progress.",
    "A multi-page wizard form. Use Tabs or Breadcrumb.",
  ],
  keyboard: [
    [["Tab"], "Moves focus across pipeline stages, Rebuild and Next stage keys."],
    [["Enter", "Space"], "Jumps to the focused stage or steps the pipeline forward."],
  ],
  a11y: [
    "Stages sit inside role=\"group\" labelled by the project heading; the current stage carries aria-current=\"step\".",
    "Each stage button names the stage, duration and whether it is completed, current or pending.",
    "Every stage transition announces once in a polite status region.",
  ],
};

function ProductionDeployDemo() {
  return <DeployStatus project="harbor-web" refLabel="main · 4f9c2e1" region="fra1" defaultStageIndex={2} />;
}

function LiveDeployDemo() {
  return <DeployStatus project="harbor-api" refLabel="main · 9a2b810" region="iad1" defaultStageIndex={3} />;
}

export const study: PageStudy = {
  object: <DeployStatus project="harbor-web" refLabel="main · 4f9c2e1" region="fra1" defaultStageIndex={2} />,
  parts: [
    { name: "The recessed tray", selector: "[data-part=tray]" },
    { name: "The raised stage block", selector: "[data-part=block]" },
    { name: "The status readout", selector: "[data-part=lettering]" },
  ],
  states: {
    empty: <DeployStatus project="harbor-web" refLabel="main · 4f9c2e1" region="fra1" defaultStageIndex={0} />,
    default: <DeployStatus project="harbor-web" refLabel="main · 4f9c2e1" region="fra1" defaultStageIndex={2} />,
    pressed: <DeployStatus project="harbor-web" refLabel="main · 4f9c2e1" region="fra1" defaultStageIndex={3} />,
  },
};

export default function DeployStatusPage() {
  return (
    <Page
      meta={meta}
      docs={docs}
      study={study}
      tile={<DeployStatus project="harbor-web" refLabel="main · 4f9c2e1" region="fra1" defaultStageIndex={2} />}
    >
      <Stage
        title="Active rollout"
        tier="instant"
        code="ProductionDeployDemo"
        caption="Reached stages rise as tactile stone blocks inside the recessed tray; pending stages stay flush. Click any stage or press Promote."
      >
        <ProductionDeployDemo />
      </Stage>
      <Stage
        title="Live in production"
        tier="instant"
        code="LiveDeployDemo"
        caption="When all four stages stand raised, Promote disables cleanly and Rebuild lets you step back to Build."
      >
        <LiveDeployDemo />
      </Stage>
      <TryIt
        of="DeployStatus"
        component={DeployStatus}
        props={{ project: "harbor-web", refLabel: "main · 4f9c2e1", region: "fra1", defaultStageIndex: 2 }}
        controls={[{ name: "defaultStageIndex", type: "number", min: 0, max: 3, step: 1 }]}
      />
    </Page>
  );
}

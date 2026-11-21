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
    [["Tab"], "Moves focus to Rebuild, then to Next stage. The stages are a readout, not tab stops."],
    [["Enter", "Space"], "Presses the focused key: Rebuild starts the deploy again from Build, and Next stage moves it on. Before the last stage Next stage reads Promote."],
  ],
  a11y: [
    "The stages are a read-only list (role=\"list\") labelled by the project name; the current stage carries aria-current=\"step\". No stage is a button or a tab stop.",
    "Each stage says its duration and whether it is done, running or pending, and the header says the state in words (\"Edge, running\", or \"Live\").",
    "Rebuild and Next stage are the only keys. Each step announces the state once in a polite status region.",
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
  /* Callouts alternate left and right and meet a part at its outer edge, so each is picked to be reached without
     crossing a word: the first stage and the project from the left, the state word and the tray's end from the right. */
  parts: [
    { name: "The raised stage block", selector: "[data-part=block]" },
    { name: "The state, in words", selector: "[data-slot=state]" },
    { name: "The project", selector: "[data-slot=project]" },
    { name: "The recessed tray", selector: "[role=list][data-part=tray]" },
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
        caption="harbor-web is on its way to the edge. Rebuild starts the deploy again from Build; Next stage moves it on, and reads Promote before Live."
      >
        <ProductionDeployDemo />
      </Stage>
      <Stage
        title="Live in production"
        tier="instant"
        code="LiveDeployDemo"
        caption="harbor-api is live in iad1. Only Rebuild is left to press: it starts the deploy again from Build."
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

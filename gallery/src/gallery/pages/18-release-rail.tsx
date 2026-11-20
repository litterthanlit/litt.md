import { ReleaseRail } from "@/components/release-rail";
import { Page, Stage, TryIt, type PageDocs, type PageMeta, type PageStudy } from "../kit";

export const meta: PageMeta = {
  id: "release-rail",
  title: "Release rail",
  lede: "Recent deploys resting in one stone tray — only the selected release lifts up.",
  order: 1.09,
  group: "Data",
  verbs: ["select", "press"],
  worlds: ["press"],
  summary:
    "Press's release history selector built on round-2 Press discipline: instead of raising every row as its own slat, all releases sit quietly inside one recessed stone tray and only the selected release rises up as a single tactile block. Viewing an older release offers a raised Promote to live key. It belongs to Press.",
  tiers: ["instant"],
  mechanism:
    "A radiogroup inside a single recessed stone tray (--tray, --tray-shade) renders unselected releases flush and lifts the selected release into a raised block (--block, --highlight, --block-lift). Promoting an older commit updates the live SHA and announces once in a polite status region.",
};

export const docs: PageDocs = {
  components: ["release-rail"],
  exports: ["ReleaseRail"],
  usage: `import { ReleaseRail } from "@/components/release-rail";

<ReleaseRail project="harbor-web" />`,
  use: [
    "Inspecting recent deploys and promoting or rolling back a release in product dashboards under Press.",
    "Compact selectable lists where raising every row would create visual noise.",
  ],
  skip: [
    "Another world's page. ReleaseRail relies on Press's recessed stone tray and lifted selection block; it needs data-material=\"press\" on <html>.",
    "A sortable multi-column dataset with pagination. Use Table.",
    "A chronological event feed without selection. Use Timeline.",
  ],
  keyboard: [
    [["Tab"], "Moves focus across release rows and the Promote to live key."],
    [["Enter", "Space"], "Selects the focused release or promotes it to production."],
  ],
  a11y: [
    "Exposes role=\"radiogroup\" labelled by the project header, with role=\"radio\" and aria-checked on each release.",
    "Selecting or promoting a release announces the commit SHA and summary once in a polite status region.",
  ],
};

function HarborReleasesDemo() {
  return <ReleaseRail project="harbor-web" />;
}

function RollbackInspectDemo() {
  return <ReleaseRail project="harbor-api" defaultLiveSha="9a2b810" />;
}

export const study: PageStudy = {
  object: <ReleaseRail project="harbor-web" />,
  parts: [
    { name: "The recessed tray", selector: "[data-part=tray]" },
    { name: "The lifted release", selector: "[data-part=block]" },
    { name: "The release header", selector: "[data-part=lettering]" },
  ],
  states: {
    default: <ReleaseRail project="harbor-web" />,
    pressed: <ReleaseRail project="harbor-web" defaultLiveSha="9a2b810" />,
  },
};

export default function ReleaseRailPage() {
  return (
    <Page
      meta={meta}
      docs={docs}
      study={study}
      tile={<ReleaseRail project="harbor-web" />}
    >
      <Stage
        title="Release selector"
        tier="instant"
        code="HarborReleasesDemo"
        caption="All releases rest quietly inside one recessed tray; click any older commit to lift it up and reveal Promote to live."
      >
        <HarborReleasesDemo />
      </Stage>
      <Stage
        title="Pinned previous release"
        tier="instant"
        code="RollbackInspectDemo"
        caption="Live is stated in plain words on the right — no green status chips."
      >
        <RollbackInspectDemo />
      </Stage>
      <TryIt
        of="ReleaseRail"
        component={ReleaseRail}
        props={{ project: "harbor-web" }}
        controls={[]}
      />
    </Page>
  );
}

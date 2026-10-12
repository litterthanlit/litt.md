import { useEffect, useState } from "react";
import { Button, Spinner } from "@/components/button";
import { ArrowUpRightIcon, PlusIcon } from "@/components/icons";
import { ProjectGrid, ProjectList, type Project } from "@/components/list";
import { Empty, ErrorState, Loading, Skeleton } from "@/components/states";
import { Tag } from "@/components/tag";
import { PROJECTS } from "../fixtures";
import { Page, Stage, useReplay, type PageDocs, type PageMeta } from "../kit";

export const meta: PageMeta = {
  id: "states",
  title: "Empty and loading states",
  order: 18, group: "Layout and data",
  summary:
    "What a view says when it has nothing yet, is waiting or has failed. Empty offers one action, a skeleton keeps the content's exact size, and an error says how to retry. The states are static, so only the list's own entrance and the retry button move.",
  tiers: ["instant", "expressive"],
};

export const docs: PageDocs = {
  components: ["states"],
  exports: ["Empty", "Skeleton", "Loading", "ErrorState"],
  usage: `import { Button, Spinner } from "@/components/button";
import { Empty, ErrorState, Loading, Skeleton } from "@/components/states";

// Empty: what will appear here, and the one action that makes it appear.
<Empty title="No projects yet." action={<Button variant="primary">New project</Button>}>
  A new project starts as a draft and shows up here.
</Empty>

// Loading: blocks at the real content's size, grouped and named for screen readers.
<Loading label="Loading projects" className="grid gap-2">
  <Skeleton text="body" className="w-48" />
  <Skeleton text="small" className="w-32" />
  <Skeleton className="aspect-[8/5]" />
  <Skeleton radius="pill" className="h-6 w-16" />
</Loading>

// Error: what went wrong, how to fix it, and the retry.
<ErrorState title="The deploy to atelier-nord.com failed." action={<Button onClick={retry}>Retry deploy</Button>}>
  The build ran out of memory. Make the images smaller, then retry.
</ErrorState>`,
  use: [
    "A list, a table or a panel has nothing in it yet. Use Empty, and give the one action that fills it.",
    "Content takes a moment to arrive and you know its shape. Draw Skeleton blocks at the real sizes, so nothing jumps when it lands.",
    "Something failed and the person can do something about it. Use ErrorState with the fix or the retry.",
    "An empty or error state appears in answer to something, such as a filter or a retry. Pass role=\"status\" to Empty so it is announced.",
  ],
  skip: [
    "One button is waiting on its own action. Use the loading prop on Button, which keeps its width.",
    "You are telling someone what just happened and moving on. Use Toast.",
    "One field is wrong. Put the error under the field, as TextField does.",
    "You do not know the content's shape. A skeleton that guesses is wrong, so show a Spinner and a line of text instead.",
    "The wait is too short to notice. Show nothing, because a skeleton that flashes is worse than a blank moment.",
  ],
  keyboard: [[["Tab"], "Moves to the action, as it does for any button. The text, the icon and the skeleton blocks take no focus."]],
  a11y: [
    "Loading is a role=\"status\" whose only text is its label, so a screen reader says \"Loading projects\" once and not a row of empty boxes. Skeleton blocks are hidden from screen readers.",
    "Remove the Loading group when the content arrives. Focus is not moved, so keep it where it was.",
    "ErrorState is a role=\"alert\", so it is announced as soon as it appears. Pass role=\"status\" when the news is not urgent. The icon is hidden from screen readers, and the words say it failed, so color is never the message.",
    "Empty is not announced by itself. When it appears in answer to a filter or a search, pass role=\"status\", as ProjectsEmpty does.",
    "The text reaches 4.5:1 on the surface-2 panel in light and dark. The skeleton blocks carry no information, so their faint fill needs no contrast.",
    "Write the action's label as what it does: \"Retry deploy\", not \"Retry\" or \"OK\". It is a Button, so it is 44px tall by default.",
    "Nothing in these components moves, so there is nothing to reduce under reduced motion.",
  ],
};

/* ---------------------------------------------------------------- empty */

/** What "New project" makes when the list is empty. */
const FIRST: Project = {
  id: "portfolio-rebuild",
  name: "Portfolio rebuild",
  client: "Ines Ortega",
  deploy: "No deploy yet",
  status: "draft",
  updated: "2026-10-11",
  description: "A quieter case-study layout.",
  tags: ["Framer", "Site"],
  cover: "blank",
};

function FirstProject() {
  const [started, setStarted] = useState(false);
  return (
    <section aria-label="Projects" className="grid content-start">
      {started ? (
        <ProjectList projects={[FIRST]} entrance={false} />
      ) : (
        <Empty
          title="No projects yet."
          action={
            <Button variant="primary" icon={<PlusIcon />} onClick={() => setStarted(true)}>
              New project
            </Button>
          }
        >
          A new project starts as a draft and shows up here.
        </Empty>
      )}
    </section>
  );
}

function DeploysCard() {
  return (
    <section aria-label="Deploys" className="litt-raised grid content-start self-start rounded-surface">
      <h3 className="border-b border-line px-6 py-4 text-small text-fg">Deploys</h3>
      <div className="p-6">
        <Empty bare title="No deploys yet." action={<Button iconRight={<ArrowUpRightIcon />}>Open in Framer</Button>}>
          Publish from Framer and each deploy is listed here.
        </Empty>
      </div>
    </section>
  );
}

function EmptyDemo() {
  return (
    <div className="grid w-full min-w-0 max-w-4xl gap-8 md:grid-cols-2">
      <FirstProject />
      <DeploysCard />
    </div>
  );
}

/* -------------------------------------------------------------- loading */

const LIST_BOX = "w-full max-w-3xl rounded-surface p-1 shadow-[inset_0_0_0_1px_var(--line)]";
const SAMPLE = PROJECTS.slice(0, 5);

/** One row at ProjectList's size: 64px tall, 16px sides, the name and client, a status tag and a date. */
function RowSkeleton() {
  return (
    <div className="h-16 border-b border-line last:border-b-0">
      <div className="flex size-full items-center gap-4 px-4">
        <div className="grid min-w-0 flex-1 gap-1">
          <Skeleton text="body" className="w-3/5 max-w-60" />
          <Skeleton text="caption" className="w-2/5 max-w-40" />
        </div>
        <div className="flex shrink-0 sm:w-24">
          <Skeleton radius="pill" className="h-6 w-16" />
        </div>
        <div className="hidden w-14 shrink-0 sm:block">
          <Skeleton text="caption" />
        </div>
      </div>
    </div>
  );
}

function LoadingListDemo() {
  const [loaded, setLoaded] = useState(false);
  return (
    <div className="grid w-full min-w-0 max-w-3xl gap-6">
      <div>
        <Button size="sm" disabled={loaded} onClick={() => setLoaded(true)}>
          Load projects
        </Button>
      </div>
      {loaded ? (
        <ProjectList projects={SAMPLE} />
      ) : (
        <Loading label="Loading projects" className={LIST_BOX}>
          {SAMPLE.map((p) => (
            <RowSkeleton key={p.id} />
          ))}
        </Loading>
      )}
    </div>
  );
}

/** One card at ProjectCard's size: a cover at 8 to 5, a name and a line of text, and two tags. */
function CardSkeleton() {
  return (
    <div className="litt-raised flex h-full flex-col rounded-surface p-1">
      <Skeleton className="aspect-[8/5] shrink-0" />
      <div className="grid gap-1 px-3 pt-4">
        <Skeleton text="body" className="w-3/5" />
        <Skeleton text="small" className="w-4/5" />
      </div>
      <div className="mt-auto flex flex-wrap gap-2 px-3 pt-4 pb-3">
        <Skeleton radius="pill" className="h-6 w-16" />
        <Skeleton radius="pill" className="h-6 w-14" />
      </div>
    </div>
  );
}

const GRID_SAMPLE = PROJECTS.slice(0, 6);

function LoadingCardsDemo() {
  const [loaded, setLoaded] = useState(false);
  return (
    <div className="grid w-full min-w-0 gap-6">
      <div>
        <Button size="sm" disabled={loaded} onClick={() => setLoaded(true)}>
          Load projects
        </Button>
      </div>
      {loaded ? (
        <ProjectGrid projects={GRID_SAMPLE} filter="all" />
      ) : (
        <Loading label="Loading projects" className="grid grid-cols-[repeat(auto-fill,minmax(15rem,1fr))] gap-4">
          {GRID_SAMPLE.map((p) => (
            <CardSkeleton key={p.id} />
          ))}
        </Loading>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------- error */

function DeployFailed() {
  const [phase, setPhase] = useState<"failed" | "retrying" | "live">("failed");
  useEffect(() => {
    if (phase !== "retrying") return;
    const t = setTimeout(() => setPhase("live"), 1600);
    return () => clearTimeout(t);
  }, [phase]);

  if (phase === "failed") {
    return (
      <ErrorState
        title="The deploy to atelier-nord.com failed."
        action={<Button onClick={() => setPhase("retrying")}>Retry deploy</Button>}
      >
        The build ran out of memory while it optimized images. Make the images in /assets smaller, then retry.
      </ErrorState>
    );
  }
  // The retry hands over to a status line in the same panel. A Button's loading look would vanish on this surface-2 fill.
  return (
    <div
      role="status"
      className="flex flex-wrap items-center gap-3 rounded-surface bg-surface-2 p-8 shadow-[inset_0_0_0_1px_var(--line)]"
    >
      {phase === "retrying" ? (
        <>
          <span className="text-fg-subtle">
            <Spinner />
          </span>
          <p className="text-body text-fg-muted">Retrying the deploy to atelier-nord.com</p>
        </>
      ) : (
        <>
          <Tag status="success">Live</Tag>
          <p className="text-body text-fg-muted">atelier-nord.com deployed just now.</p>
        </>
      )}
    </div>
  );
}

function SyncFailed() {
  const [trying, setTrying] = useState(false);
  const [tries, setTries] = useState(0);
  useEffect(() => {
    if (!trying) return;
    const t = setTimeout(() => {
      setTrying(false);
      setTries((n) => n + 1);
    }, 1200);
    return () => clearTimeout(t);
  }, [trying]);

  return (
    <section aria-label="Framer sync" className="litt-raised grid rounded-surface">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 border-b border-line px-6 py-4">
        <h3 className="text-small text-fg">Framer sync</h3>
        <p className="text-caption text-fg-subtle">Last synced 12 min ago</p>
      </div>
      <div className="p-6">
        <ErrorState
          bare
          title={tries ? "Framer still did not answer." : "Framer did not answer."}
          action={
            <Button size="sm" loading={trying} onClick={() => setTrying(true)}>
              Try again
            </Button>
          }
        >
          Your changes are saved here, and they sync once Framer is back. You can keep working, or try again now.
        </ErrorState>
      </div>
    </section>
  );
}

function ErrorDemo() {
  return (
    <div className="grid w-full min-w-0 max-w-2xl gap-8">
      <DeployFailed />
      <SyncFailed />
    </div>
  );
}

export default function StatesPage() {
  const [emptyKey, resetEmpty] = useReplay();
  const [listKey, resetList] = useReplay();
  const [cardsKey, resetCards] = useReplay();
  const [errorKey, resetError] = useReplay();
  return (
    <Page meta={meta} docs={docs}>
      <Stage
        title="Empty"
        size="lg"
        align="start"
        code="EmptyDemo"
        onReplay={resetEmpty}
        replayLabel="Reset"
        caption="Empty says what will appear in one sentence and gives one action to make it appear. It is left-aligned, with no illustration. The first panel is boxed; the second sits bare in a card that already has its box. New project fills the list, and the row appears at once, because this state does not move."
      >
        <EmptyDemo key={emptyKey} />
      </Stage>

      <Stage
        title="Loading a list"
        tier="expressive"
        size="lg"
        align="start"
        code="LoadingListDemo"
        onReplay={resetList}
        replayLabel="Reset"
        caption="The skeleton rows have the real rows' height, padding and columns, so the list lands without anything moving. The blocks are a static surface-2. The spec allows one short opacity pulse, but no tier token gives a pulse its duration, so they stay still and never shimmer. Press Load projects and the rows arrive in the page's one expressive cascade."
      >
        <LoadingListDemo key={listKey} />
      </Stage>

      <Stage
        title="Loading cards"
        size="lg"
        align="start"
        code="LoadingCardsDemo"
        onReplay={resetCards}
        replayLabel="Reset"
        caption="Cards load the same way: a cover block at the real 8 to 5 ratio, two lines of text and two tag pills, in the same grid. The grid has no entrance of its own, so the cards appear in place. Load them and watch the height: it stays the same."
      >
        <LoadingCardsDemo key={cardsKey} />
      </Stage>

      <Stage
        title="Errors"
        tier="instant"
        size="lg"
        align="start"
        code="ErrorDemo"
        onReplay={resetError}
        replayLabel="Reset"
        caption="An error says what went wrong in plain words, then how to fix it, and its action is the retry. The danger color is on the icon only, and the words carry the meaning. Retry deploy hands over to a status line with a spinner, then the second try goes through. The sync error sits bare in a card, and its retry shows the button's own spinner, then fails again, so it says so."
      >
        <ErrorDemo key={errorKey} />
      </Stage>
    </Page>
  );
}

# Agents, round two: sources, file changes, runs

Nick asked for "tool calls and more agentic stuff". The first agents step shipped the parts of one turn (Message, Composer, Thinking, Plan, Tool call, Code block), and the hands round added the Run card. This round adds what `gallery/HANDOFF.md` lists as missing: where an answer came from, what an agent changed in a codebase and whether you keep it, and the agent's other runs. A tool call can now show each of them as what it found.

This file is the contract the builders work to. It was synthesized from three candidate designs (an arena of three models, judged blind), and it overrides the base sketch wherever the two differ.

## Problem

Each new part has to be a litt object (R1), say its state in words (R5), keep the view's one accent fill (R6), and move only in answer to a hand (R4). The constraints that shaped it:

- A Tool call's `output` is a mono well (`tool-call.tsx`, `Block`). A LogView, a CodeBlock or a list put there was a well inside a well, with two scrollers.
- Send is the view's one accent fill. An approval borrows it only because Send is off while the agent waits. A review of file changes does not stop the agent, and the person may reply while reviewing ("keep it, but make the heading 18px").
- `MessageText` styles every `a` inside it (`[&_a]:` utilities, specificity 0,1,1). A citation can still be a link: a `data-citation` variant compiles to 0,2,0 and wins.
- The gallery routes on the URL hash (`gallery/src/gallery/route.ts`), and so do some hosts. A fragment link such as `#source-3` would change the page.
- A HoverCard only previews. A touch screen never opens it, so nothing may live only in the card.
- One `.tsx` per registry item, and one object props type per component.

## Usage

### Tool call (shipped, two additive props)

```tsx
<ToolCall action="Searched" target='"geist fontsource"' result="4 sources" duration={1.2}
  details={<SourceList sources={found} hideLabel />} />
<ToolCall status="failed" action="Ran" target="npm run build" result="Exit 1"
  details={<LogView label="npm run build" lines={lines} height="12rem" />} />
<ToolCall action="Edited" target="src/app/layout.tsx" result="+2 −2"
  details={<FileChanges changes={[layout]} onDecide={decide} summary={false} defaultOpen />} />
```

`details` is drawn as given when the row opens, after the Input and Output wells. `result` is a few words after the target that stay when the target is cut. Both are built and on the Tool call page.

### Sources (`sources`: `Sources`, `Citation`, `SourceList`, `citationId`, `unlinkCitations`)

```tsx
const cite = {
  a: ({ href, children, ...rest }: ComponentProps<"a">) => {
    const id = citationId(href); // "#cite-geist" gives "geist"; any other link gives null
    return id ? <Citation source={id} /> : <a href={href} {...rest}>{children}</a>;
  },
};

<Message actions={<MessageActions copyText={unlinkCitations(turn.answer)} />}>
  <Sources sources={turn.sources}>
    <ToolCall action="Searched" target={turn.query} result={`${found.length} sources`} details={<SourceList sources={found} hideLabel />} />
    <MessageText>
      <Markdown components={cite}>{turn.answer}</Markdown>
    </MessageText>
    <SourceList />
  </Sources>
</Message>
```

The model writes `claim.[2](#cite-geist)`. A fragment href survives every markdown sanitizer, and `citationId` is the one place the `#cite-` scheme is read.

### File changes (`file-changes`: `FileChanges`)

```tsx
const [changes, setChanges] = useState(turn.changes); // FileChange[], state "pending" at first
const decide = (ids: string[], decision: FileDecision) => {
  setChanges((all) => all.map((c) => (ids.includes(c.id) ? { ...c, state: decision } : c)));
  decision === "kept" ? repo.keep(ids) : repo.revert(ids);
};

<FileChanges changes={changes} onDecide={decide} />
```

### Runs (`run-list`: `RunList`)

```tsx
<RunList runs={runs} selectedId={runId} onSelect={(run) => navigate(run.href)} onStop={stop} onArchive={archive} />
// runs: [{ id: "halo", title: "Fix the Halo build", status: "needs-you", detail: "Approve npm run deploy", updated: "1m ago", href: "/runs/halo" }]
```

## Shape

The base is candidate A (`arena2/sonnet/sketch.tsx` and `design.md` in the session's scratchpad). Its invariants live in the types, it has one idempotent write path per item, and it is the only candidate that checks a model's urls at a boundary. Everything below overrides it where they differ.

### Data

| Shape | Feeds | Derived, never stored |
|---|---|---|
| `Source { id, title, url, site?, passage?, readAt?, kind? }` | the citation's number and card, the list row, a search call's row | the number (its place in `sources`), the host, the safe href, which sources are lit |
| `FileChange { id, path, kind, diff?, added?, removed?, state? }` | the row, the diff, the header, the live region | line counts (from `diff` when not given), "2 left to review", the verbs that apply |
| `AgentRun { id, title, status, detail?, progress?, updated, href? }` | the row, the group, the filter's counts, the live region | the group, the status word and mark, the counts |

- `Source.kind` is `"web" | "file"`: it picks the icon (`GlobeIcon` or `FileIcon`) and sets a file's title in the mono. `readAt` and `updated` are words the caller gives ("2 minutes ago"), as `LogLine.time` is, so no component reads a clock.
- `FileChange` is a union on `kind`: only `"renamed"` carries `from`. `FileChangeState` is `"pending" | "kept" | "undone"`, and `FileDecision = Exclude<FileChangeState, "pending">`, so nobody can decide "pending".
- `RunStatus` is `"running" | "needs-you" | "done" | "failed" | "stopped"`, and `RunFilter = "all" | RunStatus`. A status is one row in one table (word, mark, tone, group), never a branch.
- `parseSources` in `sources` is the one place a Source is checked. It drops a later duplicate id, keeps an href only for `http:` and `https:` (a model's `javascript:` url shows as text), reads the host into `site` when it is missing, and numbers by position.

### `sources`

- **Sources** draws nothing. It holds the parsed sources and a small light store: two fields, `hovered` (the pointer) and `focused` (the keyboard), written by two actors and merged at the read (`lit = hovered ?? focused`). Marks and rows subscribe by id through `useSyncExternalStore`, so pointing re-renders only the marks and rows of the ids involved.
- **Citation** (`{ source, quote?, className? }`) is a link to the source's url that opens a new tab (`target="_blank"`, `rel="noreferrer"`), wrapped in a `HoverCard`. Pressing it opens the source, as citations do everywhere. It is not a jump to the row. The chip is 16px tall and inline, `min-w-4` with 4px of side padding, at the control radius. It carries the number at the caption size, `font-normal`, tabular, in `--fg-muted` on fg 6%. It sits 4px after the word, never grows the line box, and has no underline (`data-citation` variant) and no accent. When its source is lit it takes `--fg` on fg 12% on the instant tier, color only. It is flat: it is a reference, not an object you move. Its accessible name is "Source 2: <title>". An unknown id, or a mark outside a `Sources`, renders nothing and warns once in development (a mark can stream in before its source). An unsafe url makes the chip a span with no href.
- **The card** is `HoverCardContent size="md"`, floating glass. It holds the kind's icon and the site (small, `--fg-muted`), the title (small, title weight, `--fg`, two lines) as the link to the url, the passage in quotes (small, `--fg-muted`, four lines, no rail, no tint), and the read words (caption, `--fg-subtle`). `quote` replaces the passage for that one mark, because one page can back two claims.
- **SourceList** (`{ sources?, label = "Sources", hideLabel?, className? }`) is an `ol`, bare in the turn. A heading shows the label (small, title weight) and the count (caption, tabular). Each row is one link to the url in a new tab, at least 44px tall, two lines: the title (small, `--fg`, cut at the end) over the site and the read words (caption, `--fg-subtle`). A 16px lead column holds the number chip, the mark's look but not a button, in the column where a Tool call row shows its mark. With no `sources` it lists the provider's. With `sources` (a search's results) a row the provider knows wears its number, and an uncited one shows its kind's icon in `--fg-subtle` with hidden "Not cited". A lit row takes fg 6%. Hovering or focusing a row lights its source.
- **The moment.** Calm: rest on a mark and its row lights, and so does every other mark citing that source. Run the pointer down the list and the marks in the text light in turn. After 500ms the card grows from the mark (HoverCard's responsive tier). Nothing moves; only fills change. Fun: resting on a row pops its marks in reading order (scale 1.2 to 1 on `fun.pop`, `fun.wave` apart), and the transform is cleared when it lands, so the rest frame is Calm's.
- **Touch.** The card never opens. The number pairs the mark with its row. A mark's hit area is 44px tall and 24px wide on a coarse pointer (an `after:` box), because two marks sit 4px apart in a line. This is a named exception to R9's 44 in width, the same exception prose links take. Rows are 44px.
- **Forced colors.** The chip keeps a 1px CanvasText border, and a lit chip or row takes Highlight.

### `file-changes`

- **FileChanges** (`{ changes, onDecide?, label = "Files changed", summary = true, defaultOpen?, accent?, onOpenChange?, className? }`) is bare in the turn, as a Plan is. The Agents rules allow a box only for the person's bubble, an approval and a code block, and a review is not an approval.
- **Header** (when `summary`), 32px (44 coarse). It reads "3 files changed" (small, title weight, `--fg`), with a caption in `--fg-subtle` under it: "42 lines added, 8 removed · 2 left to review", the count a RollingNumber. When every file is decided it becomes a receipt: "All reviewed: 2 kept, 1 undone". At its end are Keep all (secondary sm, the raised block) and Undo all (ghost sm). Once any file is decided they read "Keep the rest" and "Undo the rest", and both act on pending files only, so a press never re-decides a file the person chose. When none are pending the buttons go and the header keeps its height.
- **The accent.** Send keeps it. `accent` makes Keep all primary on a screen with no Composer. It defaults to false, and the caller owns the one-fill rule, as with ToolApproval.
- **Row.** 32px (44 coarse) at the control radius, hover fg 6%. A disclosure button holds the chevron, a 16px `FileIcon` in `--fg-subtle`, and the path in mono at the small size (the directory in `--fg-subtle` and cut first, the file name in `--fg`, never cut). After it come the kind in words for added, deleted and renamed (caption, `--fg-muted`; renamed adds "from <old path>"; modified has only a hidden word), then the counts "+24 −6" (caption, tabular, the sign in `--success` or `--danger`, the figures in `--fg-muted`, the minus U+2212, hidden words "24 lines added, 6 removed"). Beside the button, outside it, are the verbs, ghost sm icon-only, 44px coarse, each in a Tooltip and named with the file ("Keep src/app/layout.tsx"). Pending shows Keep and Undo, kept shows Undo, undone shows Keep. A decided row shows its word ("Kept" with the check in `--fg-muted`, "Undone" with the undo mark in `--fg-subtle`), and its path steps back to `--fg-muted` or `--fg-subtle`. No strikethrough and no tinted rows. Below 28rem (a container query) the counts and the words drop to a second line. With no `onDecide` the list is read-only and shows state words only.
- **Diff.** A `CodeBlock lang="diff" maxHeight="20rem"`, with no filename because the row says it, indented 24px, in a copy of Tool call's Reveal (opacity and a quarter of the travel on the responsive tier, exit token out, the height snaps). One change starts open, many start closed, and `defaultOpen` overrides. A change with no `diff` has no chevron, unless `onOpenChange` is given: then opening it says "Loading the diff" until the caller passes one.
- **Counts** are `added` and `removed` when given, else counted from the diff's hunks (`+` and `-` lines, never `+++` or `---`).
- **Decisions.** `onDecide(ids, decision)` is the only write path, and the component holds no decision of its own. Called twice, it converges.
- **Assistive tech.** The list is a `ul` named by `label`. A polite status says the decisions made with the list's own buttons once the caller has set them ("Kept src/app/layout.tsx", "Undid 3 files", "All reviewed"), never on the first render. A second copy of the same changes, such as an edit call's beside the review, shows a decision made in the other without saying it again (changed in review: the Agent block showed the same file in both and every decision was said twice). When a pressed verb had focus and is replaced, focus moves to the verb that replaces it (ToolApproval's `hadFocus`).
- **The moment.** Calm: a decision settles the row. The verbs give way to the word at once, the path steps back, and the header's count rolls down on the responsive tier. Fun: the check of each row Keep all decides pops in a wave (`k * fun.wave`, scale 0.6 to 1 on `fun.pop`), and a single Keep pops its own. At rest the rows are Calm's.

### `run-list`

- **RunList** (`{ runs, label = "Runs", selectedId?, onSelect?, onStop?, onArchive?, filter?, defaultFilter = "all", onFilterChange?, empty?, className? }`).
- **Header**, 32px. The label (small, title weight) and the count (caption, tabular), then a `Select` (sm, md coarse) named "Filter runs by status". Its options carry counts ("Needs you 2"), and a status with no runs is disabled. A Segmented control cannot hold six options with counts in a 288px sidebar.
- **Groups.** When both exist they get headings, "Needs you" and "Runs" (caption, label weight, `--fg-subtle`). One group gets no heading. `lift` is the one place the rule lives: runs that need you first, then the rest, each in the caller's order. Nothing is sorted by time.
- **Row**, a uniform 56px, at the control radius, padded 8px by 12px. It holds the 16px mark, the title (small, title weight, `--fg`; a done run `--fg-muted`; cut at the end), and the status line (caption, `--fg-subtle`: "Running · Step 2 of 5 · 40%", cut at the end) with the `updated` words at its end (tabular). From one table: running is the half-filled ring in `--fg`; needs you is the empty ring in `--fg`, with "Needs you" in `--fg` at the title weight; done is the check in `--fg-muted`; failed is the x in `--danger` with "Failed"; stopped is the dashed ring in `--fg-subtle`. Color sits on the mark only. A row is a link (`href`) or a button.
- **Verbs.** Stop (`StopIcon`) on a running row and Archive (`ArchiveIcon`) on a finished one, ghost sm icon-only in a Tooltip, named with the run. They show on hover and focus-within, and always on a coarse pointer at 44px. A row that needs you has none: you answer it in the run.
- **Selected** is the raised block (`--block`, `--block-lift`) as a text-free backplate with a `layoutId`, gliding from row to row on the responsive tier, with `aria-current`. Hover is `useGlide`'s one highlight moving row to row, under the block.
- **Order and motion.** A run the agent changes moves to its new place at once, with no motion, because no hand asked. Rows glide (`layout="position"`) only in the render a filter press caused: a `byHand` ref is set by the press and cleared in a layout effect after the commit. This encodes R4 in structure. Fun: the selected block glides on `fun.glide`, and a run that becomes done, failed or needs-you pops its mark once (`fun.pop`).
- **Keys.** The rows take one Tab stop with a roving focus (the selected run, else the first). ↑ and ↓ move between runs, Home and End go to the ends, → moves to the row's verb and ← comes back, and Enter or Space opens the run. The Select keeps its own keys. A polite status says "Fix the Halo build needs you", "… failed" or "… is done" when a run changes into one of those, never on the first render and never for a run that only appears.
- **Empty.** "No runs yet." With a filter: "No runs need you." and a ghost "Show all runs".
- **No hand engine this round.** A swipe on a finished row to archive it, through `useHand` and `useSettle` with a tray behind the row, is the designed follow-up (candidate B's sketch). It is left out to keep three new items polished and because it needs a real-phone pass.

### The Agent block, grown

It keeps the script model: views folded from beats, nothing random, the person decides at the approval. The turn is wrapped in `Sources`. The search call lists what it found in `details` and says "4 sources". The build call streams its LogView in `details`. The edit call opens to its one file as a FileChanges. The answer carries Citations, and the turn ends with a SourceList and the FileChanges review, which replaces the answer's lone diff CodeBlock. On wide screens a RunList sits beside the chat, and its Halo row is read from the same view, so it says "Needs you" while the approval waits. The view keeps one accent fill: Send, or Allow while the approval waits.

## Synthesis decision

The judge (blind) scored A 26, B 27 and C 19, and recommended A as the base. A's invariants live in the types, it has one idempotent write path, and only A checks a model's url at a boundary. B won its points on its moments and its access model, and those are grafted.

- **From B (Opus):** `details` on Tool call in place of A's `bare` flag (nothing to forget, and `output` keeps its meaning for text). The two-way light through a subscription store with two fields. `quote` per mark and `kind` on Source. A citation that is a link to the source, not a jump to the row: the lead overrode both A (a button that points at the row) and the judge here, because it is what a reader expects from a citation, it needs no registry, no back link and no scroll logic, and the light shows the pairing without a press.
- **From A (Sonnet):** the base. `result` on Tool call, `parseSources`, `citationId` and `unlinkCitations`, the bare review with a receipt, verbs on the row, `onDecide(ids, decision)`, `accent` as an opt-in, and the RunList's groups, Select filter and words.
- **From C (Fable):** the `byHand` gate on layout motion, lazy diffs through `onOpenChange`, `useGlide` for the RunList's hover, and roving focus on the rows.
- **Rejected:**
  - C's change to Tool call by `typeof output`, which silently drops a host's well on reinstall.
  - C's `cite:` scheme, which react-markdown's default url transform empties.
  - C's fragment back link, which the hash router follows.
  - C's 44px-wide inline hit boxes, which overlap the next mark.
  - C's `icon: ReactNode` in a data shape.
  - A's claim that a citation must not be an `a`.
  - A's fun-mode row swap on a status change, motion no hand asked for.
  - B's review panel, since a review is not an approval and the turn allows no other box.
  - B's per-file verbs only in the diff's header, and with them the `code-block` change.
  - B's clock and sorting in the RunList.
  - B's throwing `useSources`.
  - The K and U keys, since every verb is a Tab stop.

## Tradeoffs accepted

- We accept two additive props on Tool call, in exchange for a log, a diff or a list that keeps its own surface, and a folded run that still reads what each call found.
- We accept that a citation leaves the page, in exchange for the convention readers know. The card previews it with a mouse or the keyboard, and the number pairs it with its row on touch.
- We accept a 24px-wide touch target on an inline mark, in exchange for marks that sit in a line of prose.
- We accept that Keep all is not the accent in a chat, in exchange for R6 holding while the person can still reply.
- We accept a copy of Tool call's Reveal in `file-changes`, in exchange for an item that installs without `tool-call`.
- We accept that no component reads a clock, so `readAt` and `updated` are the caller's words.
- We accept that a run the agent moves jumps rather than glides, in exchange for R4 holding in a list that mostly changes by itself.

## Questions for Nick

1. A citation is a quiet chip in the ink, not accent text with an underline. Is that the mark you want?
2. Is the 24px-wide touch target of an inline citation acceptable as R9's named exception, as prose links are?
3. Should a review that is the last thing in a turn take the accent and turn Send off, as an approval does? (Built: Keep all is a raised block, and Send keeps the accent.)
4. Should the list under an answer show only the cited sources (built), or everything the search found, with the uncited ones stepped back?
5. "Keep" and "Undo", or "Accept" and "Reject"?
6. Swipe to archive a finished run, on the hand engine, next round?
7. Open question 2 of the first agents step (sign-only diffs or tinted rows) now decides how every changed file reads. This keeps sign-only. Final?

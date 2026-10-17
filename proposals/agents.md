# Agents: chat, thinking and tool calls

Written 2026-10-17 for Nick. Nick asked: "we need a slider, chat interface, thinking (agents modules) what else are we missing? use sonnet builders".

The Slider already existed with one thumb. Its missing half was the range (two thumbs), which the dashboards step left out for table filters, so this round adds it. The rest is new: a chat (the conversation, the messages and the composer) and the modules an agent shows while it works (its thinking, its plan, its tool calls, an approval, and the code it writes). Like the forms and dashboards steps, this was built first and waits on Nick's tests. Every decision below is built as recommended, and each one is a single place to change. No taste rule changed. The spec is in `skills/litt-md/system/components.md`, under "Agents".

## Decisions (built as recommended, Nick reviews after the tests)

| # | Question | Recommendation | Why |
|---|---|---|---|
| 1 | Does the agent's answer sit in a bubble? | No. The agent's words sit on the page in `--fg-muted` at the body size. Only the person's turn is a bubble (`.litt-raised`, on the right). | The answer is the content. A box around long prose cramps it, and two kinds of bubble make a chat look like a messaging app. The side and the box tell the turns apart without color. |
| 2 | Body size or reading size for answers? | Body (15). | A chat is app UI and often sits in a narrow column. The reading size (17) is for articles. Worth a look in the tests. |
| 3 | Avatars and names? | No by default: the side says who is speaking. An optional name (and an sm Avatar) for threads with more than one agent or person. | Every turn carrying a face and a name is noise in a one-to-one chat. Each turn still has a hidden heading for screen readers. |
| 4 | How does "the agent is working" show? | A clock that counts seconds ("Thinking 4s"), the composer's Stop, and the running step's half-filled circle. Never a shimmer, a pulse or a spinner. | Litt bans loops that are not a response to the person, and a sweeping gradient animates material (P5). A clock says more than a shimmer: it says how long. The Timeline already draws a running step as a still half circle. |
| 5 | A caret while text streams? | No. Text appears as it arrives, with no fade per word and no caret. | A blinking caret is a loop. A fade per word animates hundreds of nodes and adds nothing the arriving text does not already say. |
| 6 | Does Thinking stay open? | It is open while the agent thinks and closes itself when the answer starts, unless the reader toggled it. | You can watch it work, and the answer is not pushed down by reasoning you have read. A reader's own choice always wins. |
| 7 | Which control holds the accent? | Send. It is disabled while the field is empty, Stop is secondary, and an approval's Allow takes the accent while Send is disabled. | P1: one accent fill per view. Disabling Send while the agent waits on an approval makes the rule hold by construction, and it is honest: the agent cannot take a new message until you answer. |
| 8 | Does a suggestion send at once? | No. It fills the field and focuses it. | The person can edit it first, and Send stays the one action. |
| 9 | Does an approval take focus? | No. A polite live region announces it, and it is the next thing in the tab order. | The person may be reading the answer above it. Stealing focus mid-sentence is worse than one Tab. |
| 10 | Is the plan's progress a hue? | No. The rail is `--fg`. | Progress is one quantity, not a category (P11). |
| 11 | Is a done step struck through? | No. Its color steps back to `--fg-muted`. | Strikethrough is the generic to-do look, and it makes a step harder to read. Litt steps text color for state. |
| 12 | Syntax colors? | The foreground's tones and the accent text for strings, as the gallery's own code blocks. No data hues. | Code is not data (P11). A rainbow theme would be the loudest thing in a calm view. |
| 13 | How does a diff show? | The sign carries the color (`+` in success, `-` in danger), removed lines step back to `--fg-subtle`, and changed lines band with fg 4%. No tinted rows. | Status color stays on text and icons, as in the error state. The alternative, green and red row fills, is the standard look and scans faster. Worth a look in the tests. |
| 14 | Center the chat column? | Yes, up to 48rem, inside the conversation's own region. | P7 keeps marketing sections left-aligned. A chat column is app UI, and centering it keeps the composer and the turns on one axis when a window is wide. |
| 15 | The range slider's value? | "20s to 80s", in words. The thumbs never cross and stay one step apart. | Pagination already says "21 to 40". A dash reads as minus next to numbers. |

## What was built

Seven Sonnet agents built the items in parallel, each in its own worktree, from a contract the lead wrote first: the spec, the shared icons (`ArrowUpIcon`, `ArrowDownIcon`, `StopIcon`, `PaperclipIcon`, `RetryIcon`, and `StatusIcon` with the Timeline's five marks), the Agents group in the sidebar and the registry stubs. The lead reviewed every diff, merged it, and ran verify, the build, screenshots in both themes at 1440 and 390, and axe on every page.

| Item | What it is |
|---|---|
| Range slider | `RangeSlider` in `slider.tsx`: two thumbs on the Slider's rail, the span in `--fg`. |
| Message | `Conversation`, `Message`, `MessageText` and `MessageActions`: the scroller that keeps the latest line in view, the two kinds of turn, prose styles for markdown, and Copy and Retry. |
| Composer | `Composer` and its suggestions and file chips: a growing field, a toolbar, Send and Stop. |
| Thinking | `Thinking`: the disclosure with the clock. |
| Tool call | `ToolCall`, `ToolCallGroup` and `ToolApproval`. |
| Plan | `Plan`: the steps, the count and the rail. |
| Code block | `CodeBlock`: highlighted code, a header with Copy, diffs and line numbers. |

The Agent page composes them into one chat, in a desktop frame and a phone frame.

## Questions for Nick's tests

1. **Decision 2:** body or reading size for answers?
2. **Decision 13:** sign-only diffs, or tinted rows?
3. **Thinking's clock:** does "Thinking 4s" read as alive enough without any motion?
4. **The person's bubble** is `.litt-raised` (surface-1, the hairline, the top highlight). Too much like a card?
5. **Approval:** Allow and Deny only, or also "Always allow" as a checkbox (built, optional)?
6. **Enter on a phone:** with a mouse, Enter sends; on touch, Return adds a line and Send sends (the lead's call, since a soft keyboard has no Shift). Right?
7. **A message with only files** cannot be sent, because Send needs text. Should files alone enable it?
8. **Thinking with no known time** reads plain "Thought". Fine?
9. **Thinking's chevron** sits first, in the column where a tool call shows its status mark, so the labels of a turn's parts line up. The spec first had it last. Keep it first?
10. **Older answers** keep the height of their hidden actions row, so nothing shifts on hover. That leaves about 90px between an older answer and the next question. Too much?
11. **Emphasis** (`em`) is `--fg` and upright, because the page loads no italic. Load the italic instead?
12. **The range's thumbs:** when they meet, the "to" thumb is always on top. Should the one moved last sit on top?
13. **A tool row on a narrow phone:** "Waiting for approval" leaves about 90px for the command at 294px. Wrap the word to a second line instead?

# Open decisions after the agent tests and the phone build

Status: decided on 15 October 2026. Nick accepted every recommendation (taste profile v0.7). The questions came from `gallery/HANDOFF.md`: what #9 (agent tests) and #11 (responsive motion) left open, and what was still open from steps 2 to 4. Each was answered from the profile, the spec and the code as built. This file keeps the reasoning.

Where a call turned on a number, the number was measured: OKLCH lightness from `tokens.css`, the code as built, and the agent rubrics.

## Decided

### Before forms (they shape the next components)

| # | Question | Decision | Why |
|---|---|---|---|
| 1 | Form inputs in a dialog: `md` or `lg`? | **md**, and a dialog's actions are md too. A field is lg only when it shares a row with an lg button (the inline form). P10's lg is for hero CTAs and a page form's submit. | The Input spec's "lg next to an lg button" meant the inline form. Two 56px buttons crowd a 480px panel, and the agent rubric already expected 44px fields. |
| 2 | Checked checkbox fill | **`--fg`, with a `--canvas` mark.** Radios and the future switch follow. | A settings form with five checked boxes had six accent fills, and P1 allows one. Monochrome is the Vercel lineage and reads in both themes. The focus ring stays accent. |
| 3 | Pressed fill: should pressed always equal hover? | **A pressed row fills at its own hover fill, never below fg 6%.** | This is what was built: menu 7, tabs and chips 6, list and table 6 against a 4% hover. On touch, hover and press never meet. The floor is there because a finger covers the row and 4% disappears under it. |
| 4 | Keyboard over a sheet | **Build it now.** The sheet's bottom follows the visual viewport, with the hook the command menu already used. | iOS Safari and Android Chrome shrink only the visual viewport when the keyboard opens, so a `fixed inset-0` sheet's footer goes under it. A popover became a sheet to give its fields a place above the keyboard; without this, that decision is not delivered. |

### Phones (from #11)

| # | Question | Decision | Why |
|---|---|---|---|
| 5 | Sheet tier | **A phone sheet always rises on the expressive spring and does not use up the view's moment.** The desktop Dialog gets a `tier` prop, which the spec already asked for. | At a 450px sheet the bounce is about half a pixel, so it reads as placement. A responsive sheet covers 450px in 200ms, which the motion proposal rejected as abrupt, and a sheet that rose at two speeds depending on the rest of the page would look broken. |
| 6 | Small gaps | **Fix all four.** Small underline tabs grow to 44px on touch. ProjectCard fills when pressed. A pressed button takes its hover fill on touch, so the press shows under reduced motion. The Toast caption says "Hover or tap the stack". | Each one breaks a rule that already exists: the 44px floor, "pressed fills like hover", and touch parity. |
| 7 | A toast while a sheet is open | **On a compact screen it docks at the top edge, where the command menu sits, and moves upward.** | Holding toasts until the sheet closes would hide the feedback for actions inside the sheet ("Link copied"). |
| 8 | Landscape phones | **Wait for a real-phone check.** The likely answer is that a screen under 480 tall counts as compact, with the sheet capped at 640 wide. | A landscape phone shows about 340px of page and the settings dialog is 408px tall, but this is the one call worth seeing on a device first. |
| 9 | iPad portrait | **Keep it as built**: coarse and not compact, so a centered dialog, anchored popovers, 44px targets and tooltips on a hold. | A 480px dialog fits on 768px and up, and iPadOS uses centered form sheets there too. |

### From #9 (agent tests)

| # | Question | Decision | Why |
|---|---|---|---|
| 10 | Should Button accept an icon child? | **Yes.** One child is the trimmed label; with several, each text run is a trimmed label and each element sits in the row. A child SVG is 16px, like every button icon. `icon` stays the documented prop. | `<Button><Icon /> Save</Button>` is shadcn's convention, and litt ships as a shadcn registry. Fixing the component removes the failure; steering in the skill only made it rarer. |
| 11 | Dark surfaces: step `surface-1` up? | **No, keep them.** | Dark `surface-1` already sits 0.033 OKLCH lightness above `canvas`, nearly three times the light theme's step (0.012), and the hairline's contrast is the same in both (1.24 against 1.26). If a real screen still reads "black boxes", use the card's top light or a stronger dark `--line`, not a brighter fill. |
| 12 | `list`'s `Project` shape | **Make it generic now**: `deploy`, `cover`, `description` and `tags` are optional, and the date takes any short label ("2024"). The "rename fields in `list.tsx`" advice goes. | It contradicted the skill's "never edit installed files", and it is cheapest to change before the registry is listed. |
| 13 | Self-critique screenshots in the agent test | **Allow them.** | The build workflow tells agents to screenshot their work, so a test that forbids it measures a workflow nobody runs. |
| 14 | Bare `transition-colors` in the host lint | **Fail, not warn.** | In a host it runs on Tailwind's 150ms default, because the registry does not ship `--default-transition-*`. Every other off-tier timing already fails. |

### Still open from steps 2 to 4

| # | Question | Decision | Why |
|---|---|---|---|
| 15 | Toast duration: 5s (spec) or 4s (code)? | **5s.** | The spec is the source. It leaves time for slower readers and for an undo. |
| 16 | Kbd at 11px, which the type scale lacks | **12px, the caption step.** | One component does not justify a type step, and it removes a lint exception. |
| 17 | Dark tooltip outline | **`--line-strong`.** | The dark ring was black at 50%, which vanishes on a near-black page. A light ring is what P8 means by designed, not inverted. |
| 18 | Disabled secondary Button on surface-2 | **Keep a `--line` hairline.** | Without it, a disabled button on a surface-2 area is grey text floating. |
| 19 | Static skeletons or a pulse | **Static, and the pulse allowance is gone.** | A pulse is a loop, and the Don't list already bans looping motion that is not a response to the user. |
| 20 | Header current page: dot or underline? | **Keep the accent dot.** | It uses the accent as a signal, like litt.design's dots, not as a fill. An underline would fight the header's bottom hairline. |
| 21 | Segmented md text size and equal widths | **Keep 13px and equal widths.** | Equal widths let the selection slide by translate without changing shape. P10 says labels stay small so the box carries the presence. |
| 22 | Keep the Textarea extension? | **Keep it, and spec it under Input.** | The contact form in the forms step needs it. |
| 23 | "Keep one status tag" | **Keep, and move it into the Tag spec.** | Two status colors on one card compete. |
| 24 | The Input focus edge fades `box-shadow` | **Keep the fade, fix CONTRIBUTING.** | Foundations already lets the focus ring fade at instant. CONTRIBUTING's blanket ban on animating box-shadow was the outlier. The glow ban stays. |

### Housekeeping

| # | Question | Decision |
|---|---|---|
| 25 | Duplicate Vercel projects `litt-md` and `litt-md-93z4` | Both still existed and built on every push. Nick deleted them on 15 October 2026. |
| 26 | List the registry in shadcn's directory? | **Not yet.** After forms ship, the `Project` shape is generic, and the PR check exists. A listing brings real installs, and breaking changes hurt more after that. **Revisited 2026-10-19: yes** (`proposals/staples.md`, decision 1), now that forms have shipped and every item carries a version and a changelog. |

## Not decided here

The forms step answers Switch, Select and Slider, and the dashboards step answers charts. Landscape phones (8) wait for a real-phone pass.

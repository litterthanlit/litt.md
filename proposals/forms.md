# Forms: a draft for Nick to decide

Status: draft, 15 October 2026. Nothing here is built. Each row in section 3 is yours to decide; the recommendation is a starting point, not a decision. Once you have decided, the chosen text goes into `system/components.md` and `foundations.md` through `workflows/evolve.md`. Then the build happens in the same loop as motion: agents build it, and the `settings-form` agent task is the pass mark.

How this was put together: two research agents. One audited what litt specifies and ships today, with file and line references. The other read how Vercel Geist, Radix, shadcn, Material 3, Apple's HIG, the WAI-ARIA Authoring Practices, GOV.UK, Primer, Pajamas and Stripe handle switches, selects, sliders and validation. The `settings-form` baseline in `proposals/responsive-motion.md` is the "before" picture of what an agent builds by hand. Numbers a source did not publish are marked unverified.

## 1. Why

Forms are where agents still build their own controls. In the `settings-form` baseline:
- Sonnet hand-built a switch, and its color fade ran on the wrong tier, so the host lint failed it.
- It used a native `<select>`, with rows 28 to 30px tall at 390 and an unstyled list on desktop.
- It hand-built a slider with no litt spec behind it.

litt specifies text fields, checkboxes, radios and the segmented control well. It has nothing for a switch, a select or a slider, and nothing for how a whole form behaves: optional fields, when to validate, an error summary, groups, and layouts.

## 2. Today

| Area | What exists | What is missing |
|---|---|---|
| Text fields | `TextField`, `Input` and `Textarea` (label above, help, error with `aria-invalid` and `aria-describedby`, sizes sm/md/lg, 16px text on touch, forced-colors edges) | Optional marking; a fieldset for groups of text fields |
| Choices | `Checkbox` and `Radio`, drawn or native; `CheckboxGroup` and `RadioGroup` as a fieldset with a legend, help and error; `Segmented` | Help and error on `Segmented`. Two segmented looks disagree: `Segmented` has an 8px track with a 4px inset, while the segmented `Tabs` (the Preview/Code toggle) has a 4px track with a 2px inset. |
| Switch | P1, foundations and components already say a switch fills with `--fg`, never the accent | The component and its spec |
| Select | `--line-control` and `--radius-control` already name selects. Motion decision 8 said "native on touch, a litt listbox on desktop, revisit after the baseline". | The component, its list, and its phone behavior |
| Slider | One line: a drag never starts in a slider | Everything |
| Whole forms | Field gap only in the specimen (`--space-6`); a page form's submit is lg; a dialog's actions and fields are md | Validation timing, an error summary, groups, settings and contact layouts, save models |
| Dependencies | Radix Dialog, Dropdown Menu, Popover, Tabs and Tooltip | `@radix-ui/react-select`, `react-switch` and `react-slider` are not installed, and CONTRIBUTING says agents never add packages |

## 3. Decisions for Nick

| # | Decision | Options | Recommendation | Why, and what it costs | Accessibility |
|---|---|---|---|---|---|
| 1 | When a switch, when a checkbox | A: interchangeable (the APG view). B: a switch takes effect at once; a checkbox is sent with the form. | **B.** | Nielsen Norman Group, Geist, Primer and Stripe all draw this line, and Primer adds "never mix the two save models in one form". So a settings page is either a list of switches that save themselves, or a form of fields and checkboxes with one Save. Cost: an agent asked for "switches" beside a Save button has to pick one model, and the skill must say so. | A switch's label never changes with its state (APG). |
| 2 | The switch's shape | A: a pill track and a round thumb, the classic switch. B: a 4px track and a 2px thumb, concentric, like the segmented control. | **B.** 32 by 20 track, 16px thumb, 2px inset, 12px of travel. | You chose the segment look over pills for tags (v0.8). A squared switch belongs with the segmented control, the tags and the checkbox chip, and it reads as precise rather than as iOS. A keeps one more pill exception. Cost: few systems do B, so it looks unfamiliar for a moment, but the thumb's position still says on or off. | Off and on differ by the thumb's position, not color alone. The off track's edge is `--line-control`, at least 3:1 (WCAG 1.4.11). |
| 3 | Switch colors | A: on track `--fg` and thumb `--canvas`, like the checked checkbox. B: the accent on. | **A.** P1 already says so. | Material 3 and iOS color the track. shadcn's switch uses the foreground color, which fits litt. Off: an fg 5% track with the `--line-control` edge and a `--surface-1` thumb with `--highlight`. | `--fg` against `--canvas` is far above 3:1 in both themes. |
| 4 | Switch motion | A: everything on the instant tier (a 100ms tween), as foundations lists "toggles". B: the thumb slides on the responsive spring and the track's color fades at instant, like the segmented selection gliding. | **B.** | Anything that slides between two places in litt (the tab indicator, the segmented fill, the menu glide) is on the responsive tier, and a color change is instant. That split also matches the host lint, which only lets color fade at instant. Material's overshoot is out (no bounce on the responsive tier). Cost: two transitions on one control. | Under reduced motion the thumb jumps. |
| 5 | Switch build and placement | A: a native `<input type="checkbox" role="switch">` styled like the drawn checkbox. B: Radix Switch, a new dependency. | **A**, with the label on the left and the switch at the row's end, in 36px rows (44 on touch) like checkbox rows. | It is a real input, like `Checkbox`, so form values, Space and screen readers work with no new package. Safari's native `switch` attribute is Safari only, so leave it out. | APG: `role="switch"`, Space toggles, `aria-checked` comes from the input. |
| 6 | Select | A: a native `<select>` everywhere, styled as a litt field (the open list is the OS's). B: a litt list on fine pointers (Radix Select, popper-positioned under the field), and the native select on touch. C: a litt list everywhere, becoming a sheet on phones. D: a native select with `appearance: base-select`, which lets CSS style the open list (Chrome and Edge 135+, Safari 27+; Firefox falls back to the classic select). | **B now, and watch D.** | B keeps what you accepted in motion decision 8. A mouse gets litt's list (glass, 44px rows, a check in a 16px cell, the gliding highlight, typeahead), and a finger gets the OS picker, which is the best phone picker and needs no sheet. Radix Select also renders a hidden native select, so forms and autofill keep working. D is the long-term answer (one element, no JS, styled list), but it cannot run the gliding highlight or litt's springs, and Firefox still shows the plain list. C rebuilds the iOS picker. Cost of B: one new dependency, `@radix-ui/react-select`, which you add, because agents may not. | The APG select-only combobox pattern comes with Radix. On touch the closed field is 44px tall, which fixes the baseline's 28 to 30px rows. |
| 7 | Slider build and look | Build: A: a native `<input type="range">` with a litt overlay for the fill. B: Radix Slider, a new dependency. Look: a 4px track in `--line-strong`, the filled part in `--fg`, and a thumb that is either (i) a 16px round dot or (ii) a 16px square at the control radius. | **A, with (ii).** The fill is a separate element scaled with `transform: scaleX()`, so only transform moves. The value is shown beside the track in mono tabular numerals, and the two ends are labelled in the caption size and `--fg-subtle` (Slower, Faster). | Native range gives the keyboard (arrows, Page Up and Down, Home, End), the form value and `aria-valuetext` with no package. The square thumb matches the switch and the tags. The `--fg` fill keeps P1: Material and Apple tint the fill, but shadcn uses the foreground. Cost: browser-specific CSS for the thumb (`::-webkit-slider-thumb`, `::-moz-range-thumb`). | The hit area is 32px tall (44 on touch), not the 16px thumb. Set `aria-valuetext` when the number alone means nothing ("Faster"). APG warns that touch screen readers may not drag sliders, so the value is never the only way to set something important. |
| 8 | Slider motion | A: the thumb follows the finger one to one, and a keyboard step snaps. B: a keyboard step slides on the responsive tier. | **A.** | Direct manipulation never eases (foundations section 6), and a 100ms snap for one step is already instant. Cost: none. | Under reduced motion nothing changes, because nothing animates. |
| 9 | Optional or required | A: mark optional fields "(optional)" after the label, never an asterisk. B: mark required fields with an asterisk. | **A.** | GOV.UK never uses asterisks, and in litt most fields are required, so marking the few optional ones is quieter. Cost: one word in `--fg-subtle`. | Required fields also set `required` (or `aria-required`), so screen readers hear it. |
| 10 | When to validate | A: on submit, then each errored field re-checks as you type until it is valid ("reward early, punish late"). B: on blur. C: on submit only. | **A.** | GOV.UK validates on submit and never on blur. Smashing's research supports re-checking a field you are fixing as soon as it is right. Never show "required" for a field the person has not reached. Cost: a little state per field. | Submit is never disabled before submission (Vercel's guidelines); a disabled button doesn't say why. |
| 11 | The error summary | A: on a failed submit, a summary at the top of the form takes focus: "There is a problem", then one link per error, in the same words as the field. B: inline errors only, with focus on the first errored field. | **A for forms with three or more fields, B for shorter ones.** | GOV.UK's summary is the most tested pattern, and it also meets WCAG 4.1.3 by moving focus. A short form doesn't need it. Look: a `.litt-raised` panel (a surface, so `--radius-surface`) with a `--danger` hairline. The title is in `--danger` and the links are in `--fg`, underlined. No accent rail (a banned generic-AI tell) and no icon. | Focus moves to the summary on submit, and each link focuses its field (WCAG 3.3.1 and 3.3.3). |
| 12 | Groups | A: related fields sit in a `<fieldset>` with a `<legend>` in the label style. B: a section heading (`--type-h4`) with no fieldset. | **A inside a form, B between sections.** | Radio, checkbox and segmented groups are already fieldsets. Text fields that belong together (an address, a name) should be too. | WCAG 1.3.1. |
| 13 | Settings page layout | A: each section has its title and one-line description in columns 1 to 3 and the fields in columns 4 to 12, which is litt's asymmetric split. B: everything stacked in one 640 column. | **A from 1024 wide, B below**, with fields `--space-6` apart and sections a hairline and `--space-16` apart. | The 3/9 split is already litt's default section layout. Vercel's and Linear's settings look like this, but neither publishes it (unverified). One Save (lg) ends each form. A list of switches has no Save, and each change confirms with a toast. | Each section is a landmark-free `section` with an `h2` or `h3`, so the outline holds. |
| 14 | Contact and sign-up | One column in `--container-reading` (640), with the fewest fields possible, `autocomplete` on every personal field, and an lg submit that goes full width below 640. | **As written.** | GOV.UK and NN/g both say to ask only what is needed. | WCAG 1.3.5 needs `autocomplete`. WCAG 3.3.7: never ask for the same thing twice. |
| 15 | Segmented in forms | A: give `Segmented` help and error, like `RadioGroup`, and use the segmented `Tabs` look (a 4px track with a 2px inset) for both. B: keep the two looks. | **A.** | You picked the Preview/Code look for the tags, and it is the segmented `Tabs` track. One segmented look across litt is simpler, and a theme choice in a form needs an error state like any group. Cost: `Segmented` changes its track; its sm and md sizes stay. | Its fieldset and legend stay. |
| 16 | Shape rule wording | Pills are only for avatars and icon-only buttons (v0.8), but a radio is a circle. | **Say "avatars, icon-only buttons and the radio".** | A radio is round everywhere, and a squared radio reads as a checkbox. The switch and the slider thumb are squared under decisions 2 and 7, so nothing else needs the exception. | A radio stays a radio. |

Not decided here: a number stepper, a date picker, a combobox with free text, file upload, and search fields. Each is its own step after this one.

## 4. Proposed spec text

Written for the recommended options. It goes into the spec once you decide.

### components.md

```markdown
## Switch
A control that takes effect at once. In a form that waits for Save, use a checkbox. A real `<input type="checkbox" role="switch">`.
- **Look:** a 32 by 20 track at `--radius-control`, and a 16px thumb 2px inside it at the concentric radius. Off: the track is fg 5% with a `--line-control` edge, and the thumb is `--surface-1` with `--highlight`. On: the track is `--fg`, and the thumb is `--canvas` (P1: never the accent). Disabled: `--surface-2` with a `--line` edge, and the thumb is `--fg-disabled`.
- **Placement:** the label sits on the left, at the small size in `--fg`, with an optional description under it in `--fg-subtle`. The switch sits at the row's end. Rows are 36px tall, 44 on coarse pointers, and the whole row toggles.
- **Motion:** the thumb slides 12px on the responsive tier, by transform. The track's color fades on the instant tier. A press fills the row on coarse screens, as rows do. Under reduced motion the thumb jumps.

## Select
A closed field like Input, at `--control-md` by default, with the current value and a 16px chevron at the end.
- **On fine pointers** it opens a list under the field: glass with `--shadow-float`, at `--radius-surface`, at least as wide as the field, with 44px rows at `--radius-control`, a check in a fixed 16px cell on the current row, one gliding highlight, and typeahead. It enters on the responsive tier like a menu and flips up near the bottom edge.
- **On coarse pointers** it is a native `<select>` styled as the same field, so the OS picker opens.
- The value is sent with the form either way.

## Slider
A native `<input type="range">`.
- **Look:** a 4px track in `--line-strong`, the filled part in `--fg` (a separate element scaled with transform), and a 16px thumb at `--radius-control` in `--fg` with a `--canvas` hairline.
- **Labels:** the value sits beside it in `--font-mono` with tabular numerals, and the ends are labelled at the caption size in `--fg-subtle`.
- **Interaction:** the hit area is 32px tall, 44 on coarse pointers. The thumb follows the pointer one to one, and keyboard steps snap. Set `aria-valuetext` when the number alone means nothing.

## Forms
- **Optional fields:** "(optional)" after the label, in `--fg-subtle`. Never an asterisk.
- **Validation:** check on submit. After that, each errored field re-checks as you type until it is valid. Submit is never disabled before submission.
- **Error summary:** with three or more fields, a failed submit puts a summary at the top of the form and focuses it. It is a raised panel at `--radius-surface` with a `--danger` hairline, "There is a problem" in `--danger`, and one link per error, in the error's own words, that focuses its field. Shorter forms focus the first errored field.
- **Groups:** related fields sit in a `fieldset` with a `legend` in the label style.
- **Settings:** from 1024 wide, each section has its title and description in columns 1 to 3 and the fields in columns 4 to 12. Below that it is one column. Fields sit `--space-6` apart, and sections a hairline and `--space-16` apart. One Save (lg) ends each form. A list of switches has no Save.
- **Contact and sign-up:** one column in `--container-reading`, `autocomplete` on every personal field, and the submit lg and full width below 640.
```

### foundations.md and profile.md

- Section 4, Shape: `--radius-pill` is used by avatars, icon-only buttons and radios.
- Section 5, Motion: in the instant tier's row, "toggles" means the color. A thumb that slides between two places is on the responsive tier, like the segmented control.
- P1 already covers switches. Add sliders: the filled part of a slider is `--fg`.

## 5. Build plan

| Part | What | Size |
|---|---|---|
| Spec | Section 4's text through `evolve.md`, profile v0.9 | S |
| Switch | `switch.tsx` on a native checkbox, a page with docs, a registry `COPY` entry, a smoke recipe | M |
| Select | `@radix-ui/react-select` (you add it), `select.tsx` with the fine and coarse paths, the gliding highlight from `glide.tsx`, docs, registry, smoke. The registry item depends on `glide` and the motion engine. | L |
| Slider | `slider.tsx` on a native range with the scaled fill, docs, registry, smoke | M |
| Segmented | the Tabs look, plus `help` and `error` | S |
| Fields | `optional` on `TextField` and the groups; a `Fieldset`; an `ErrorSummary` with its focus behavior; a `useFormErrors` helper or a documented pattern | M |
| Layouts | a Forms page in the gallery with the settings layout and a contact form, built only from the parts above | M |
| Skill | the registry table in `build.md`, the switch-or-checkbox rule, and the settings-form rubric (claims 3, 4, 6 and 7 rewritten for the new controls) | S |

Order: spec, then Switch, Slider and Segmented in parallel (no new package), then Select once you have added the package, then fields and layouts, then the agent test.

## 6. Test plan

- `npm run verify`, `npm run build`, `npm run test:a11y` (the overlay scan opens the select's list), and `npm run test:registry` for every new item.
- Playwright on each control: keyboard (Space on the switch; arrows, Home and End on the slider; typeahead and Esc on the select), touch at 390 (the native select on coarse; the slider's 44px hit area), forced colors, and reduced motion.
- The agent test: `settings-form` before (the baseline) and after, with `--judge`. The pass mark is composing litt's Select, Switch, Slider and Segmented with no hand-built control, and the host lint is clean.

## Sources

- WAI-ARIA Authoring Practices: switch, select-only combobox and slider patterns. w3.org/WAI/ARIA/apg/patterns/
- Radix Select and Slider docs. radix-ui.com/primitives/docs/components/select, /slider
- shadcn NativeSelect and Select. ui.shadcn.com/docs/components/radix/native-select
- Vercel Geist Toggle, Slider and the design guidelines. vercel.com/geist/toggle, /geist/slider, vercel.com/design/guidelines
- Nielsen Norman Group, toggle switch guidelines. nngroup.com/articles/toggle-switch-guidelines/
- Material 3 switch source (for contrast, not to copy). github.com/material-components/material-web
- Apple HIG, sliders. developer.apple.com/design/human-interface-guidelines/sliders
- GOV.UK error summary and validation. design-system.service.gov.uk/components/error-summary/, /patterns/validation/
- Smashing Magazine on inline validation (2022). smashingmagazine.com/2022/09/inline-validation-web-forms-ux/
- Primer saving patterns; GitLab Pajamas saving and feedback; Stripe Apps SettingsView.
- caniuse: `appearance: base-select`.
- Numbers no source published (Linear's and Vercel's settings layouts, Apple's switch spring) are marked unverified above.

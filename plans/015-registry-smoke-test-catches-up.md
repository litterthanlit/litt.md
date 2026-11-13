# Plan 015: The registry's install test passes again: the sparkline check knows Press's body, and the phone app-shell step is diagnosed

> **Executor instructions**: Read this plan fully. Change only
> `gallery/scripts/test-registry.smoke.mjs` (and other files under
> `gallery/scripts/` if the diagnosis needs it). Do not change a component to
> make a test pass without reporting first. Do not edit `plans/`.
>
> **Drift check (run first)**:
> `git diff --stat 5ee07a2..HEAD -- gallery/scripts/test-registry.smoke.mjs gallery/src/components/sparkline.tsx`
> Expect no output. Otherwise STOP.

## Status

- **Priority**: P1 (a check on `main` is red and nothing runs it in CI)
- **Effort**: S to M
- **Risk**: LOW (a test script)
- **Depends on**: none
- **Category**: tests
- **Planned at**: commit `5ee07a2`, 2026-11-13

## Why this matters

`npm run test:registry --prefix gallery -- --app vite` exits 1 on `main`.
Every per-item scenario passes; the `vite / all / smoke` step fails with:

1. the sparkline's dot is `null`, not `--litt-data-blue-text`, in light;
2. the same in dark;
3. "app shell on a phone: no sidebar, a menu button, a sheet that closes on a
   link": `locator.tap: Timeout 12000ms exceeded`.

Plans 010 and 011 were reviewed with this test reported as passing "for Vite
only". That was true of the item scenarios and missed the `all` step.

## Current state

- `gallery/scripts/test-registry.smoke.mjs:2291` to about `2360`: the
  sparkline check. Its name says what it expects: "draws a 2px line and a dot
  in the data hue, a dashed baseline". That was the one Sparkline before plan
  010 and is Flat's body now.
- The registry ships Press, so an installed app with no `data-material`
  draws Press's sparkline: a sunken groove with the line along its floor and
  the latest value a raised bead (`gallery/src/components/sparkline.tsx`,
  `PressBody`). There is no dot element in that body, so the check reads
  `null`.
- The app-shell step is at `test-registry.smoke.mjs:4268`. Its cause is not
  known. It fails at commit `1b3393c` (the same tree as `main` at `5ee07a2`).
  It is not known whether it passed before plans 010 and 011.

## Steps

1. Reproduce: build, run `npm run test:registry --prefix gallery -- --app vite`,
   keep the log. Confirm the three messages and no others.
2. **Sparkline.** Read the three bodies. Make the check assert what each
   world's body draws, in the installed app: Press with no attribute (the
   line in the data hue, the bead in the hue the body gives it, the groove),
   and Flat under `data-material="flat"` (today's assertions: the 2px line,
   the dot in `--litt-data-blue-text`, the dashed baseline). Add Device if the
   smoke app can set it as cheaply. Keep the assertions that do not depend on
   the body (the summary text, no focus stops, the empty state).
3. **App shell on a phone.** Find the cause before changing anything:
   - Run the step alone if the script allows; take a screenshot at the
     moment of the timeout; say which locator did not become tappable and
     what was on top of it.
   - Find the first bad commit: check the step at `ad7921a` (main before
     #102 to #105) and, if it passes there, bisect between.
   - If the cause is in the test (a selector, a timing assumption), fix the
     test. If the cause is in a component or the generator, STOP and report
     the commit, the file and what the user of an installed app would see.
4. Run the full `-- --app vite` test. It exits 0.
5. Commit: `gallery: the registry's install test knows the sparkline's bodies`
   (and a second commit for the app-shell step if it is a test fix).

## Done when

- [ ] `npm run test:registry --prefix gallery -- --app vite` exits 0, with the
      tail of its output in the report.
- [ ] `npm run verify --prefix gallery` passes.
- [ ] The report says what caused the app-shell timeout and at which commit
      it began.

## STOP conditions

- The app-shell failure is a real regression in a shipped part: STOP, as
  step 3 says.
- The sparkline check cannot be written for Press without a new attribute
  or test id on the part: STOP and say what is missing.

## Maintenance notes

- CI does not run `test:registry` (it needs to install two host apps and
  takes minutes). That is why this stayed red. A follow-up worth planning: run
  the `--app vite` half in CI on changes under `gallery/src/components`,
  `gallery/src/motion`, the tokens or the generator.
- Next.js's half still cannot be installed in the review environment, so it
  stays unverified here.

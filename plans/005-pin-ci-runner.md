# Plan 005: CI runs on Ubuntu 24.04 again, so the pinned Playwright can install its browser

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat e0dedfb..HEAD -- .github/workflows/gallery.yml`
> If the file changed since this plan was written, compare the "Current
> state" excerpts against the live file before proceeding; on a mismatch,
> treat it as a STOP condition.

## Status

- **Priority**: P1 (every pull request and `main` fail CI until this lands)
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: dx
- **Planned at**: commit `e0dedfb`, 2026-11-11

## Why this matters

On 2026-11-11 both jobs of the Gallery workflow began failing at the step that
installs the browser, on a pull request whose earlier steps (the skill checks,
`verify`, the build) all passed:

```
BEWARE: your OS is not officially supported by Playwright; installing dependencies for ubuntu26.04-x64 as a fallback.
Cannot install dependencies for ubuntu26.04-x64 with Playwright 1.56.1!
Error: ERROR: Playwright does not support chromium on ubuntu26.04-x64
```

The workflow asks for `ubuntu-latest`, which GitHub moved to Ubuntu 26.04. The
workflow pins Playwright 1.56.1, which cannot install Chromium's system
packages there. The last run on `main`, the evening before, passed on the
previous image. Nothing in the repository changed; the runner did.

Pinning both jobs to `ubuntu-24.04` restores the environment that passed. It
is the smallest change. Moving to a newer Playwright is a separate decision,
because a new browser version can change what the page checks see.

## Current state

`.github/workflows/gallery.yml` has two jobs, `check` and `wcag`. Each starts:

```yaml
  check:
    runs-on: ubuntu-latest
    # axe over every page, light and dark, desktop and phone, takes about half an hour on GitHub's runner.
    timeout-minutes: 50
```

```yaml
  wcag:
    runs-on: ubuntu-latest
    timeout-minutes: 35
```

and each installs the browser with:

```yaml
          npm install --prefix "$RUNNER_TEMP/a11y" --no-save --no-package-lock playwright@1.56.1 axe-core@4.10.3
          "$RUNNER_TEMP/a11y/node_modules/.bin/playwright" install --with-deps chromium
```

`ubuntu-latest` appears exactly twice in the file, on those two `runs-on` lines.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Count the old label | `grep -c 'ubuntu-latest' .github/workflows/gallery.yml` | `0` after the change |
| Count the new label | `grep -c 'runs-on: ubuntu-24.04' .github/workflows/gallery.yml` | `2` after the change |
| The file still parses | `python3 -c "import yaml,sys; d=yaml.safe_load(open('.github/workflows/gallery.yml')); print(sorted(d['jobs']), [d['jobs'][j]['runs-on'] for j in sorted(d['jobs'])])"` | `['check', 'wcag'] ['ubuntu-24.04', 'ubuntu-24.04']` |

If `python3` has no `yaml` module, skip the third command and say so in your report; the two greps are enough.

## Scope

**In scope** (the only files you should modify):
- `.github/workflows/gallery.yml`
- `plans/README.md` (your status row)

**Out of scope** (do NOT touch):
- The Playwright and axe-core versions (`playwright@1.56.1`, `axe-core@4.10.3`). Changing the browser is a separate decision.
- Every other line of the workflow: the steps, the timeouts, the Node version, the triggers.
- Everything outside `.github/workflows/gallery.yml`.

## Git workflow

- Branch: the one the operator gave you; otherwise `claude/pin-ci-runner`.
- One commit: `ci: run on Ubuntu 24.04, where the pinned Playwright can install its browser`.
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Pin the runner in both jobs

In `.github/workflows/gallery.yml`:

1. In the `check` job, replace the line `    runs-on: ubuntu-latest` with these three lines (same indentation, four spaces):

```yaml
    # Pinned: ubuntu-latest moved to 26.04 on 2026-11-11, where Playwright 1.56.1 (below) cannot install Chromium.
    # Move this and the Playwright version together, and re-run every page check when you do.
    runs-on: ubuntu-24.04
```

2. In the `wcag` job, replace the line `    runs-on: ubuntu-latest` with:

```yaml
    runs-on: ubuntu-24.04 # pinned with the Playwright version; see the check job
```

**Verify**: `grep -c 'ubuntu-latest' .github/workflows/gallery.yml` → `0`; `grep -c 'runs-on: ubuntu-24.04' .github/workflows/gallery.yml` → `2`; the parse command prints `['check', 'wcag'] ['ubuntu-24.04', 'ubuntu-24.04']`.

### Step 2: Commit

`git add .github/workflows/gallery.yml`, then commit with the message `ci: run on Ubuntu 24.04, where the pinned Playwright can install its browser`.

**Verify**: `git status --short` prints nothing except, at most, `plans/README.md`; `git diff --stat HEAD~1 HEAD` lists only `.github/workflows/gallery.yml` with 4 insertions and 2 deletions.

## Test plan

- A workflow cannot be run locally. The local proof is the two greps and the parse.
- The real proof is the next Gallery run on GitHub after this is pushed: the step "Install Playwright and axe-core" in `check` and "Install Playwright" in `wcag` must succeed, and the jobs must go on to the page checks. The reviewer watches that run.

## Done criteria

- [ ] `grep -c 'ubuntu-latest' .github/workflows/gallery.yml` prints 0
- [ ] `grep -c 'runs-on: ubuntu-24.04' .github/workflows/gallery.yml` prints 2
- [ ] `grep -c 'playwright@1.56.1' .github/workflows/gallery.yml` prints 2 (unchanged)
- [ ] `git diff --stat <starting commit> HEAD` lists only `.github/workflows/gallery.yml`
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- `ubuntu-latest` does not appear exactly twice in the file, or not on `runs-on` lines.
- The parse command fails after your edit.
- The fix seems to need any other change to the workflow.

## Maintenance notes

- **This is a pin, not an upgrade.** GitHub will retire the 24.04 image one day. Before then, move to a Playwright version that supports the current `ubuntu-latest`, change the pin and the two `playwright@` lines together, and re-run every page check: a newer Chromium can change what `test:corners`, `test:forced-colors` and the screenshot-based checks see.
- The repo's scripts also carry a fallback path for a Playwright installed globally in one cloud environment (`/opt/node22/lib`); that is unrelated to CI.
- If the Gallery run still fails at the install step after this lands, the 24.04 image is gone or changed: check the run's log for the image version before touching Playwright.

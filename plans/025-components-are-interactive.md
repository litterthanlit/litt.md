# 025. Components are interactive

Status: TODO, and not to start before plan 024's design work is finished in every world.

## Nick's words

2026-11-18: "add to the plans, we need to make components interactive (when we finish designing)".

## Why it waits

Plan 024 is still settling what each world's parts look like and how they are built. Adding behaviour to a part while its
body is being redrawn means doing the work twice. So this plan starts once every world in 024 has passed its phase 5,
the measure, and Nick has seen the last sheet.

## What it is about

Each part in every world should do what it shows, in the gallery and in a host app after install, not only look right.
"Interactive" is Nick's word and its scope is not fixed yet. Phase 0 settles it with Nick before anything is built.

## Phase 0. Agree what "interactive" means (read-only, then STOP for Nick)

- [ ] Audit every component in every world's gallery view (`#<world>/components`), each world's player and each
      component's page. For each part, record:
      - what a hand can do to it today: press, type, drag, open, select, hover, keyboard;
      - what it only draws: a static picture of a state, a demo that doesn't respond, a value that never changes;
      - what its tile does on the wall compared with its stage on the page.
- [ ] Compare against the components repo (`/home/user/litterthanlit/components`): which of its parts respond where
      ours only draw, and how they behave at rest, under a hand, and on the keyboard.
- [ ] Sort what's missing into candidate scopes. Show each as a card on `#canvas`, today beside the interactive
      version, live, after the create-canvas skill. The scopes:
      - **Every part answers a hand.** Nothing on a tile or stage is a picture of a state. A chart shows its values
        under a pointer, a list's rows select, a progress bar can be scrubbed where that makes sense.
      - **Tiles are live everywhere.** The wall and each world's gallery view can be used without opening a page.
      - **Scenarios run end to end.** A demo moves through its states (empty, loading, done, error) from the hand,
        not from a timer.
      - **Keyboard and touch parity.** Everything a pointer can do, the keyboard and touch can do too.
      - **Sound and motion** (Device's voice, plan 021; each world's motion language) follow the hand everywhere.

**STOP**: Nick picks the scope. Each later phase is written only after that pick.

## Constraints that already hold

- Nothing plays or moves on load. A part responds to a hand. Plan 018, Decisions 1 and 2; Nick confirmed "6 no" for
  Device on 2026-11-17.
- Reduced motion, forced colours, 320px reflow, 200% text, focus and the other page checks keep holding.
- Every interaction must work after install from the registry, in fresh Vite and Next.js apps (`test:registry`), not
  only in the gallery.

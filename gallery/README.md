# litt-ui

The components gallery for [litt.md](https://github.com/litterthanlit/litt.md). For now it is a tuning instrument: litt.md is trying motion-led, and the motion dial here is where the sweet spot gets found and locked into litt.md's tokens.

- **Stack:** React 19, Tailwind v4 (strict, tokens from litt.md), Motion 12, Radix primitives.
- **Tokens:** `npm run sync:tokens` copies litt.md's `tokens.css` and `tailwind.css`. Never edit them here.
- **Motion:** three tiers (instant, responsive, expressive). Springs are time + bounce, so the same numbers work in Motion, Framer and CSS `linear()`.
- **Checks:** `npm run verify` (typecheck + litt rule lint).

See CONTRIBUTING.md for how components are built.

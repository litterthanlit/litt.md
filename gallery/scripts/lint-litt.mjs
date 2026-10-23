#!/usr/bin/env node
/**
 * The litt rule lint lives in the skill, so it travels with it and can lint any app:
 * skills/litt-md/scripts/lint-litt.mjs. This file runs it from the gallery, with the same arguments, so
 * `npm run lint:litt`, `npm run test:lint` and the agent test's grader keep their paths.
 */
import "../../skills/litt-md/scripts/lint-litt.mjs";

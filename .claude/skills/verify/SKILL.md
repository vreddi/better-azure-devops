---
name: verify
description: Verify a change to the Better Azure DevOps extension end-to-end — typecheck, unit tests, production build, and a real-browser smoke test of the built extension.
---

# Verify a change

Run these from the repo root, in order; all must pass:

1. `pnpm compile` — strict typecheck. If it fails with a missing
   `.wxt/tsconfig.json`, run `pnpm wxt prepare` first.
2. `pnpm test` — unit tests for the parsing/theme logic in `utils/`.
3. `pnpm build` — production build; WXT/manifest problems only surface here.
4. `pnpm e2e` — loads `.output/chrome-mv3` into headless Chromium, serves a
   mock Azure DevOps PR list at `https://dev.azure.com/**` via route
   interception, and asserts:
   - pills render with the right labels/colors (default theme),
   - scopes are preserved (`docs(scope): x` → `[Docs] scope: x`),
   - non-conventional titles and non-PR links are untouched,
   - late-inserted rows get decorated (MutationObserver),
   - the options page shows 8 theme cards with the default one active,
   - clicking a theme card live-recolors the PR page via `storage.sync`.

   Requires a local Chrome; set `CHROME_PATH` if discovery fails. Screenshots
   are written to `.output/e2e/` — **look at them** when the change is visual.

For content-script changes, also confirm reversibility: the e2e's assertions
cover decoration, but if you changed `revertAll`/invalidation logic, add a
check or test for it rather than assuming.

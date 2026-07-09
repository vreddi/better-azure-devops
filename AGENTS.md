# Better Azure DevOps — Agent Guide

Chrome extension (Manifest V3, built with [WXT](https://wxt.dev)) that renders
conventional commit labels on Azure DevOps pull requests. v0.1 decorates PR
titles with colored label pills for commit types (feat, fix, chore, docs, etc.),
fully configurable from a settings page with themes and custom types.

## Commands

Use **pnpm** (never npm/yarn — the lockfile is `pnpm-lock.yaml`).

| Command | What it does |
| --- | --- |
| `pnpm install` | Install deps; postinstall runs `wxt prepare` (generates `.wxt/tsconfig.json` — required before typechecking) |
| `pnpm compile` | Typecheck (`tsc --noEmit`) |
| `pnpm test` | Vitest unit tests (pure logic in `utils/`) |
| `pnpm build` | Production build → `.output/chrome-mv3` |
| `pnpm e2e` | Real-browser smoke test of the **built** extension (run `pnpm build` first) |
| `pnpm dev` | Chrome with the extension + HMR (interactive; don't use in CI/agents) |
| `pnpm zip` | Store-ready zip |
| `pnpm icons` | Regenerate `public/icon/*.png` from `scripts/generate-icons.mjs` |

## Verification policy

Before declaring any change done:

1. `pnpm compile && pnpm test` — always.
2. `pnpm build` — always (WXT/manifest errors only surface at build).
3. `pnpm e2e` — whenever you touch `entrypoints/`, `utils/`, or styling. It
   loads `.output/chrome-mv3` into headless Chromium, serves a mock PR list at
   `https://dev.azure.com/**` via route interception, and asserts pill
   rendering, options page, and a live theme switch. Screenshots land in
   `.output/e2e/`. Needs a local Chrome (`CHROME_PATH` env overrides
   discovery); `HEADFUL=1` to watch.

## Architecture

```
entrypoints/            # WXT file-based entrypoints (browser-facing code)
  content.ts            # decorates PR title links with label pills
  background.ts         # toolbar icon click → opens options page
  options/              # React 19 settings page
    App.tsx             # state + persistence (debounced save to storage.sync)
    components/         # Pill, ThemeCard, TagRow
utils/                  # pure, unit-tested logic — NO browser APIs except storage.ts
  conventional-commits.ts  # title prefix parser
  themes.ts             # theme catalog, defaults, normalizeSettings validation
  storage.ts            # chrome.storage.sync load/save/watch (the only browser-API util)
  types.ts              # Settings/TagConfig/Theme interfaces
scripts/                # node scripts (icons, e2e) — dependency-light by design
```

Data flow: options page writes `Settings` to `chrome.storage.sync` (key
`settings`) → content script's `watchSettings` listener fires → it reverts all
pills and re-decorates. Every read from storage goes through
`normalizeSettings()`; never trust raw storage data.

## Invariants — do not break

- **Scope discipline**: the content script touches PR title links
  (`a[href*="/pullrequest/"]`) and nothing else. No editable fields, no other
  page furniture. New UX features must be equally surgical.
- **Idempotent + reversible DOM edits**: decorated anchors are marked with
  `data-bad-cc`; the original text is kept on the wrapper
  (`data-bad-cc-original`); `revertAll()` must always restore the pristine
  page, and `ctx.onInvalidated` must leave the page untouched after an
  extension reload/uninstall.
- **Pure logic lives in `utils/`** with unit tests; DOM/browser code lives in
  `entrypoints/`. If you add parsing/color/theme logic, it goes in `utils/`
  with tests.
- **Settings schema is versioned** (`Settings.version`). Any schema change
  needs a migration path in `normalizeSettings` and updated tests.
- **Colors are single hex values** rendered readable on both light and dark
  Azure DevOps themes via `color-mix(... transparent)` — don't hardcode
  background-specific colors in the content script.
- **Manifest permissions stay minimal**: `storage` plus the two host matches.
  Adding a permission is a product decision, not a refactor detail.
- Keep `chrome.storage.sync` payloads small (8 KB/item quota) — settings only,
  never caches.

## Conventions & gotchas

- TypeScript strict; explicit imports (from `#imports` for WXT APIs) rather
  than WXT's auto-import globals — keeps Vitest and editors happy.
- `.wxt/` and `.output/` are generated — never edit or commit them. If
  typechecking fails with missing `.wxt/tsconfig.json`, run `pnpm wxt prepare`.
- pnpm 10 blocks dependency postinstall scripts; approved ones live in
  `package.json` → `pnpm.onlyBuiltDependencies`.
- CSS class prefix for injected DOM is `bad-cc-` (Better Azure DevOps —
  conventional commits). Keep injected classes/attrs under this namespace.
- The options page and the content script intentionally share the pill look;
  if you change the pill CSS in `entrypoints/content.ts`, mirror it in
  `entrypoints/options/style.css` (`.pill`).
- Commit messages follow conventional commits (`feat:`, `fix:`, `docs:`, …) —
  this repo's own feature is built around them.

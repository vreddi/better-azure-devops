# Better Azure DevOps

A Chrome extension that renders conventional commit labels on pull requests.

**v0.1 — Conventional commit labels for pull requests.** PR titles like
`feat(metrics): track numerical metrics` render as a colored label pill
(`Feature`) followed by `metrics: track numerical metrics`. Nothing else on the
page is touched.

## Features

- **Colored label pills** — the conventional commit prefix (`feat:`, `fix:`,
  `chore(scope):`, `refactor!:`, …) on every pull request link is replaced with a
  rounded, color-coded label pill. Scopes stay readable (`feat(auth): …` →
  `[Feature] auth: …`) and breaking changes keep their `!` (`Feature!`).
- **Settings page** — edit which conventional commit types you use, the label
  text for each, and its color. Add custom types (e.g. `improvement`) or remove
  ones you don't use. Changes sync via your Chrome profile and apply to open
  Azure DevOps tabs instantly.
- **Themes** — instead of hand-picking colors, choose a palette: GitHub, GitHub
  Light, Monochrome, One Dark, Tokyo Night, Dracula, Nord, or Solarized
  (customizable anytime).

Works on `dev.azure.com` and `*.visualstudio.com`.

## Tech stack

- [WXT](https://wxt.dev) — Manifest V3 extension framework (Vite-based, HMR, cross-browser)
- TypeScript (strict), React 19 for the settings page, vanilla TS content script
- `chrome.storage.sync` for settings, `MutationObserver` for Azure DevOps' SPA rendering
- Vitest for unit tests

## Development

```bash
pnpm install
pnpm dev             # launches Chrome with the extension + HMR
```

Other scripts:

```bash
pnpm build           # production build → .output/chrome-mv3
pnpm zip             # store-ready zip
pnpm compile         # typecheck
pnpm test            # unit tests
pnpm e2e             # real-browser smoke test of the built extension
pnpm icons           # regenerate public/icon/*.png
```

## Load the extension manually

1. `pnpm install && pnpm build`
2. Open `chrome://extensions`, enable **Developer mode**
3. **Load unpacked** → select `.output/chrome-mv3`
4. Open any Azure DevOps pull request list 🎉

Click the toolbar icon (or right-click → Options) to open the settings page.

## Project layout

```
entrypoints/
  content.ts          # decorates PR title links with label pills
  background.ts       # toolbar icon → opens settings
  options/            # React settings page (tags editor + theme picker)
utils/
  conventional-commits.ts  # title prefix parser (pure, unit-tested)
  themes.ts                # theme catalog, defaults, settings validation
  storage.ts               # chrome.storage.sync helpers
scripts/
  generate-icons.mjs  # dependency-free PNG icon generator
  e2e.mjs             # real-browser smoke test (pnpm e2e)
```

## Contributing / AI agents

Project conventions, architecture notes, and the verification policy live in
[AGENTS.md](AGENTS.md) (imported by [CLAUDE.md](CLAUDE.md) for Claude Code).
Run `pnpm compile && pnpm test && pnpm build && pnpm e2e` before submitting
changes.

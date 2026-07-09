#!/usr/bin/env node
/**
 * Prepare extension for GitHub Release.
 *
 * Creates a .zip for sideloading + generates release notes.
 * Usage:
 *   VERSION=0.2.0 pnpm release
 *
 * Then manually:
 *   1. Commit version bump (if any)
 *   2. git tag v0.2.0
 *   3. gh release create v0.2.0 --draft .output/release/*
 */
import { readFileSync, writeFileSync, mkdirSync, cpSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const BUILD_DIR = join(ROOT, '.output', 'chrome-mv3');
const RELEASE_DIR = join(ROOT, '.output', 'release');
const PKG = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));

const VERSION = process.env.VERSION || PKG.version;
const NAME = PKG.name;

console.log(`📦 Preparing release for v${VERSION}...\n`);

// Create a temp directory for zipping
const tempDir = join(RELEASE_DIR, `${NAME}-${VERSION}`);
mkdirSync(RELEASE_DIR, { recursive: true });
mkdirSync(tempDir, { recursive: true });

try {
  // Copy build to temp dir
  cpSync(BUILD_DIR, tempDir, { recursive: true });

  // Generate release notes
  const releaseNotes = `## Better Azure DevOps v${VERSION}

Conventional commit labels for Azure DevOps pull requests. This release includes all features needed to install and use the extension via sideloading.

### 🎯 Quick Start: Sideload into Chrome

1. **Download** \`better-azure-devops-${VERSION}-sideload.zip\` below
2. **Unzip** the folder anywhere (e.g., Downloads)
3. Open Chrome and navigate to \`chrome://extensions\`
4. Toggle **Developer mode** (top-right corner)
5. Click **Load unpacked** → select the unzipped folder
6. ✅ The extension is now active!

### 📝 Usage

- Open any Azure DevOps PR list
- PR titles with conventional commit prefixes (feat:, fix:, chore:, etc.) will render as colored label pills
- Click the extension icon → **Settings** to customize tags, colors, or switch themes
- Changes sync immediately across all open Azure DevOps tabs

### 🎨 Features

- 8 built-in themes (GitHub, One Dark, Dracula, Nord, Tokyo Night, Solarized, etc.)
- Editable conventional commit tags with custom types
- Real-time theme switching and color customization
- Fully reversible — uninstall and the page returns to normal

### 📖 For Developers

- Built with [WXT](https://wxt.dev) (Manifest V3, Vite, TypeScript, React 19)
- 22 unit tests + real-browser e2e smoke test
- Run locally: \`pnpm install && pnpm dev\`
- Architecture: [AGENTS.md](https://github.com/vreddi/better-azure-devops/blob/main/AGENTS.md)

### 🐛 Issues?

If something doesn't work:
1. Make sure Developer mode is on in \`chrome://extensions\`
2. Try reloading the extension (refresh icon next to it)
3. Check the extension's error log (click "Errors" if any appear)
4. [Open an issue on GitHub](https://github.com/vreddi/better-azure-devops/issues)

### 📦 Chrome Web Store

A Chrome Web Store listing is in progress. Follow the repo for updates!

---

**Released:** ${new Date().toISOString().split('T')[0]}
**Repository:** https://github.com/vreddi/better-azure-devops
`;

  writeFileSync(join(RELEASE_DIR, 'RELEASE_NOTES.md'), releaseNotes);
  console.log('✓ Created RELEASE_NOTES.md');

  console.log(`\n✅ Release prepared in ${RELEASE_DIR}/`);
  console.log(`\n📋 Next steps:`);
  console.log(`\n   1. Create a zip file:`);
  console.log(`      cd .output/release && zip -r better-azure-devops-${VERSION}-sideload.zip ${NAME}-${VERSION}/`);
  console.log(`\n   2. Create a git tag and GitHub release:`);
  console.log(`      git tag v${VERSION}`);
  console.log(`      git push origin v${VERSION}`);
  console.log(`      gh release create v${VERSION} \\`);
  console.log(`        --title "v${VERSION}" \\`);
  console.log(`        --notes-file .output/release/RELEASE_NOTES.md \\`);
  console.log(`        .output/release/better-azure-devops-${VERSION}-sideload.zip`);
  console.log(`\n   3. Share the release URL with coworkers!`);
} catch (err) {
  console.error('❌ Release failed:', err.message);
  process.exit(1);
}

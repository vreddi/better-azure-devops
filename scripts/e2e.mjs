/**
 * End-to-end smoke test for the built extension.
 *
 * Loads .output/chrome-mv3 into a real Chromium, serves a mock Azure DevOps
 * PR list at the real dev.azure.com URL via route interception (so the
 * content script's `matches` applies without hitting the network), then
 * verifies pill rendering, the options page, and a live theme switch.
 *
 * Usage:
 *   pnpm build && pnpm e2e          # headless
 *   HEADFUL=1 pnpm e2e              # watch it run
 *   CHROME_PATH=/path/to/chrome pnpm e2e
 *
 * Chrome resolution order: $CHROME_PATH, Playwright's browser cache, then a
 * system Chrome install. Screenshots land in .output/e2e/.
 */
import { chromium } from 'playwright-core';
import { homedir, tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { existsSync, mkdtempSync, mkdirSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const EXT_PATH = join(ROOT, '.output', 'chrome-mv3');
const SHOTS = join(ROOT, '.output', 'e2e');

function resolveChrome() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;

  // Playwright browser caches (newest first).
  const caches = [
    join(homedir(), 'Library/Caches/ms-playwright'),
    join(homedir(), '.cache/ms-playwright'),
  ];
  for (const cache of caches) {
    if (!existsSync(cache)) continue;
    const dirs = readdirSync(cache)
      .filter((d) => /^chromium-\d+$/.test(d))
      .sort()
      .reverse();
    for (const dir of dirs) {
      for (const candidate of [
        'chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing',
        'chrome-mac/Chromium.app/Contents/MacOS/Chromium',
        'chrome-linux/chrome',
      ]) {
        const path = join(cache, dir, candidate);
        if (existsSync(path)) return path;
      }
    }
  }

  for (const path of [
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
  ]) {
    if (existsSync(path)) return path;
  }
  throw new Error('No Chrome found. Set CHROME_PATH.');
}

const MOCK_HTML = `<!doctype html>
<html><head><title>Pull requests - Mock ADO</title>
<style>
  body { background:#1b1b1f; color:#ddd; font-family:sans-serif; padding:32px; }
  .row { padding: 12px 16px; border-bottom: 1px solid #333; }
  a { color: #d6d6dd; text-decoration: none; font-size: 14px; }
</style></head>
<body>
  <h2>Pull requests</h2>
  <div id="list">
    <div class="row"><a href="/msazure/One/_git/Intune-UX-React/pullrequest/16375365"><span>feat: manual-backlog sort compliance (React)</span></a></div>
    <div class="row"><a href="/msazure/One/_git/Intune-UX-React/pullrequest/16343289"><span>chore: onescc micro-frontend (securityforai hello-world)</span></a></div>
    <div class="row"><a href="/msazure/One/_git/Intune-UX-React/pullrequest/16326461"><span>docs(move-to-onerepo): conversion workflow steps 1-2</span></a></div>
    <div class="row"><a href="/msazure/One/_git/Intune-UX-React/pullrequest/16288362"><span>refactor!: replace core-utils date formatting</span></a></div>
    <div class="row"><a href="/msazure/One/_git/Intune-UX-React/pullrequest/16151330"><span>WIP: should not be labeled</span></a></div>
    <div class="row"><a href="/msazure/One/_git/Intune-UX-React/pullrequests?state=active"><span>fix: link to list page, should not be labeled</span></a></div>
  </div>
  <script>
    // Simulate SPA streaming: a row arrives late.
    setTimeout(() => {
      const div = document.createElement('div');
      div.className = 'row';
      const a = document.createElement('a');
      a.href = '/msazure/One/_git/Intune-UX-React/pullrequest/99999';
      const span = document.createElement('span');
      span.textContent = 'fix(auth): late-rendered row via MutationObserver';
      a.appendChild(span);
      div.appendChild(a);
      document.getElementById('list').appendChild(div);
    }, 600);
  </script>
</body></html>`;

if (!existsSync(EXT_PATH)) {
  console.error('No build found — run `pnpm build` first.');
  process.exit(1);
}
mkdirSync(SHOTS, { recursive: true });

const userDataDir = mkdtempSync(join(tmpdir(), 'bad-e2e-'));
const context = await chromium.launchPersistentContext(userDataDir, {
  executablePath: resolveChrome(),
  headless: !process.env.HEADFUL,
  args: [
    `--disable-extensions-except=${EXT_PATH}`,
    `--load-extension=${EXT_PATH}`,
    '--no-first-run',
  ],
});

const fail = (msg) => {
  console.error(`FAIL: ${msg}`);
  process.exitCode = 1;
};

try {
  await context.route('**://dev.azure.com/**', (route) =>
    route.fulfill({ contentType: 'text/html', body: MOCK_HTML }),
  );

  const page = await context.newPage();
  await page.goto('https://dev.azure.com/msazure/One/_git/Intune-UX-React/pullrequests');
  await page.waitForSelector('.bad-cc-pill', { timeout: 5000 });
  await page.waitForTimeout(1200); // let the late row render + observer fire

  const pills = await page.evaluate(() =>
    [...document.querySelectorAll('.bad-cc-pill')].map((el) => ({
      text: el.textContent,
      color: getComputedStyle(el).color,
      title: el.parentElement.textContent,
    })),
  );
  console.log('pills:', JSON.stringify(pills, null, 2));

  if (pills.length !== 5) fail(`expected 5 pills, got ${pills.length}`);
  const texts = pills.map((p) => p.text);
  for (const expected of ['Feature', 'Chore', 'Docs', 'Refactor!', 'Fix']) {
    if (!texts.includes(expected)) fail(`missing pill ${expected}`);
  }
  const docsPill = pills.find((p) => p.text === 'Docs');
  if (docsPill && !docsPill.title.includes('move-to-onerepo: conversion'))
    fail(`scope not preserved: ${docsPill?.title}`);
  const body = await page.textContent('body');
  if (!body.includes('WIP: should not be labeled')) fail('WIP title was modified');
  if (!body.includes('fix: link to list page, should not be labeled'))
    fail('non-PR link was modified');
  const featColor = pills.find((p) => p.text === 'Feature')?.color;
  if (featColor !== 'rgb(63, 185, 80)') fail(`feat color wrong: ${featColor}`);

  await page.screenshot({ path: join(SHOTS, 'pr-list-github-theme.png') });

  // ---- Options page ----
  let [worker] = context.serviceWorkers();
  if (!worker) worker = await context.waitForEvent('serviceworker');
  const extId = new URL(worker.url()).host;
  const options = await context.newPage();
  await options.goto(`chrome-extension://${extId}/options.html`);
  await options.waitForSelector('.theme-card');
  const cardCount = await options.locator('.theme-card').count();
  if (cardCount !== 8) fail(`expected 8 theme cards, got ${cardCount}`);
  const activeName = await options.textContent('.theme-card-active .theme-card-name');
  if (activeName !== 'GitHub') fail(`default active theme: ${activeName}`);
  await options.screenshot({ path: join(SHOTS, 'options-default.png'), fullPage: true });

  // Switch to One Dark and verify the PR page recolors live via storage.sync.
  await options.click('.theme-card:has-text("One Dark")');
  await options.waitForTimeout(800); // debounce save + storage listener
  const newFeatColor = await page.evaluate(() => {
    const pill = [...document.querySelectorAll('.bad-cc-pill')].find(
      (el) => el.textContent === 'Feature',
    );
    return pill ? getComputedStyle(pill).color : 'missing';
  });
  if (newFeatColor !== 'rgb(152, 195, 121)') fail(`One Dark color wrong: ${newFeatColor}`);
  await page.screenshot({ path: join(SHOTS, 'pr-list-one-dark.png') });

  console.log(
    process.exitCode
      ? 'E2E: FAILURES ABOVE'
      : `E2E: ALL CHECKS PASSED (screenshots in ${SHOTS})`,
  );
} finally {
  await context.close();
}

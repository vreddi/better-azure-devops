import { defineContentScript } from '#imports';
import type { ContentScriptContext } from '#imports';
import {
  parseConventionalTitle,
  pillText,
  remainingTitle,
} from '@/utils/conventional-commits';
import { loadSettings, watchSettings } from '@/utils/storage';
import type { Settings, TagConfig } from '@/utils/types';

const PILL_CLASS = 'bad-cc-pill';
const WRAP_CLASS = 'bad-cc-wrap';
const PROCESSED_ATTR = 'data-bad-cc';
const STYLE_ID = 'bad-cc-styles';

/**
 * Label pill: colored text on a translucent tint of the same color,
 * fully-rounded corners. `color-mix` keeps it readable on both light and
 * dark Azure DevOps themes from a single hex color.
 */
const PILL_CSS = `
.${PILL_CLASS} {
  display: inline-block;
  padding: 0 8px;
  margin-right: 6px;
  font-size: 12px;
  font-weight: 500;
  line-height: 18px;
  white-space: nowrap;
  vertical-align: text-bottom;
  border-radius: 2em;
  color: var(--bad-cc-color) !important;
  background: color-mix(in srgb, var(--bad-cc-color) 13%, transparent) !important;
  border: 1px solid color-mix(in srgb, var(--bad-cc-color) 45%, transparent) !important;
}
`;

export default defineContentScript({
  matches: ['*://dev.azure.com/*', '*://*.visualstudio.com/*'],
  main(ctx: ContentScriptContext) {
    void new PullRequestLabeler(ctx).start();
  },
});

class PullRequestLabeler {
  private tagsByType = new Map<string, TagConfig>();
  private scheduled = false;

  constructor(private ctx: ContentScriptContext) {}

  async start(): Promise<void> {
    this.applySettings(await loadSettings());
    this.injectStyles();
    this.refresh();

    // Azure DevOps is a SPA: PR rows stream in and re-render constantly.
    const observer = new MutationObserver(() => this.scheduleRefresh());
    observer.observe(document.body, { childList: true, subtree: true });

    const unwatch = watchSettings((settings) => {
      this.applySettings(settings);
      this.revertAll();
      this.refresh();
    });

    // Restore the page untouched if the extension is uninstalled/updated.
    this.ctx.onInvalidated(() => {
      observer.disconnect();
      unwatch();
      this.revertAll();
      document.getElementById(STYLE_ID)?.remove();
    });
  }

  private applySettings(settings: Settings): void {
    this.tagsByType = new Map(settings.tags.map((tag) => [tag.type, tag]));
  }

  private injectStyles(): void {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = PILL_CSS;
    document.head.appendChild(style);
  }

  /** Coalesce mutation bursts into one scan per frame-ish interval. */
  private scheduleRefresh(): void {
    if (this.scheduled || this.ctx.isInvalid) return;
    this.scheduled = true;
    setTimeout(() => {
      this.scheduled = false;
      if (!this.ctx.isInvalid) this.refresh();
    }, 100);
  }

  private refresh(): void {
    // If Azure DevOps re-rendered an anchor's children, our pill is gone but
    // the marker attribute survived — clear it so the anchor is reprocessed.
    for (const anchor of document.querySelectorAll(`a[${PROCESSED_ATTR}]`)) {
      if (!anchor.querySelector(`.${WRAP_CLASS}`)) {
        anchor.removeAttribute(PROCESSED_ATTR);
      }
    }

    // Links to a PR (`…/pullrequest/<id>`) cover the PR list, dashboards and
    // anywhere else titles show up, without touching editable title fields.
    const anchors = document.querySelectorAll<HTMLAnchorElement>(
      `a[href*="/pullrequest/"]:not([${PROCESSED_ATTR}])`,
    );
    for (const anchor of anchors) {
      this.decorateAnchor(anchor);
    }
  }

  private decorateAnchor(anchor: HTMLAnchorElement): void {
    const knownTypes = new Set(this.tagsByType.keys());
    const walker = document.createTreeWalker(anchor, NodeFilter.SHOW_TEXT);

    for (
      let node = walker.nextNode() as Text | null;
      node;
      node = walker.nextNode() as Text | null
    ) {
      const text = node.nodeValue ?? '';
      if (text.trim() === '') continue;

      // Only the first meaningful text node can hold the title prefix.
      const parsed = parseConventionalTitle(text, knownTypes);
      if (!parsed) return;

      const tag = this.tagsByType.get(parsed.type);
      if (!tag) return;

      const pill = document.createElement('span');
      pill.className = PILL_CLASS;
      pill.style.setProperty('--bad-cc-color', tag.color);
      pill.textContent = pillText(tag.label, parsed);

      const wrap = document.createElement('span');
      wrap.className = WRAP_CLASS;
      wrap.dataset.badCcOriginal = text;
      wrap.append(pill, document.createTextNode(remainingTitle(parsed)));

      node.replaceWith(wrap);
      anchor.setAttribute(PROCESSED_ATTR, '1');
      return;
    }
  }

  /** Put every decorated title back to its original text. */
  private revertAll(): void {
    for (const wrap of document.querySelectorAll<HTMLElement>(`.${WRAP_CLASS}`)) {
      wrap.replaceWith(document.createTextNode(wrap.dataset.badCcOriginal ?? ''));
    }
    for (const anchor of document.querySelectorAll(`a[${PROCESSED_ATTR}]`)) {
      anchor.removeAttribute(PROCESSED_ATTR);
    }
  }
}

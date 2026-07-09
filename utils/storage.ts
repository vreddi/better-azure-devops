import { browser } from 'wxt/browser';
import type { Settings } from './types';
import { normalizeSettings } from './themes';

const STORAGE_KEY = 'settings';

export async function loadSettings(): Promise<Settings> {
  const result = await browser.storage.sync.get(STORAGE_KEY);
  return normalizeSettings(result[STORAGE_KEY]);
}

export async function saveSettings(settings: Settings): Promise<void> {
  await browser.storage.sync.set({ [STORAGE_KEY]: settings });
}

/**
 * Subscribe to settings changes from any context (options page, other tabs).
 * Returns an unsubscribe function.
 */
export function watchSettings(callback: (settings: Settings) => void): () => void {
  const listener = (
    changes: Record<string, { newValue?: unknown }>,
    area: string,
  ) => {
    if (area === 'sync' && changes[STORAGE_KEY]) {
      callback(normalizeSettings(changes[STORAGE_KEY].newValue));
    }
  };
  browser.storage.onChanged.addListener(listener);
  return () => browser.storage.onChanged.removeListener(listener);
}

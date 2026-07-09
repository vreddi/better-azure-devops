import { defineBackground } from '#imports';
import { browser } from 'wxt/browser';

export default defineBackground(() => {
  // The extension has no popup — clicking the toolbar icon opens settings.
  browser.action.onClicked.addListener(() => {
    void browser.runtime.openOptionsPage();
  });
});

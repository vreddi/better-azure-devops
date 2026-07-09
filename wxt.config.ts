import { defineConfig } from 'wxt';

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'Better Azure DevOps',
    description:
      'Renders conventional commit prefixes on pull requests as colored label pills. Fully configurable with themes and custom commit types.',
    permissions: ['storage'],
    action: {
      default_title: 'Better Azure DevOps — open settings',
    },
    icons: {
      16: '/icon/16.png',
      32: '/icon/32.png',
      48: '/icon/48.png',
      96: '/icon/96.png',
      128: '/icon/128.png',
    },
  },
});

import type { Settings, TagConfig, Theme } from './types';

/**
 * The canonical conventional commit types and the label text shown for each.
 * Order here is the display order on the settings page.
 */
export const DEFAULT_TAG_LABELS: ReadonlyArray<readonly [type: string, label: string]> = [
  ['feat', 'Feature'],
  ['fix', 'Fix'],
  ['chore', 'Chore'],
  ['docs', 'Docs'],
  ['refactor', 'Refactor'],
  ['perf', 'Performance'],
  ['test', 'Test'],
  ['build', 'Build'],
  ['ci', 'CI'],
  ['style', 'Style'],
  ['revert', 'Revert'],
];

/**
 * Built-in themes. The default theme includes a comprehensive color palette
 * for the canonical commit types. Every theme maps the canonical types above;
 * unknown/custom types get the theme's `fallback` color.
 */
export const THEMES: readonly Theme[] = [
  {
    id: 'github',
    name: 'GitHub',
    previewBackground: '#0d1117',
    fallback: '#8b949e',
    colors: {
      feat: '#3fb950',
      fix: '#f85149',
      chore: '#8b949e',
      docs: '#58a6ff',
      refactor: '#39c5cf',
      perf: '#d29922',
      test: '#a371f7',
      build: '#ffa657',
      ci: '#f778ba',
      style: '#bc8cff',
      revert: '#6e7681',
    },
  },
  {
    id: 'github-light',
    name: 'GitHub Light',
    previewBackground: '#ffffff',
    fallback: '#57606a',
    colors: {
      feat: '#1a7f37',
      fix: '#cf222e',
      chore: '#57606a',
      docs: '#0969da',
      refactor: '#1b7c83',
      perf: '#9a6700',
      test: '#8250df',
      build: '#bc4c00',
      ci: '#bf3989',
      style: '#6639ba',
      revert: '#6e7781',
    },
  },
  {
    id: 'monochrome',
    name: 'Monochrome',
    previewBackground: '#101216',
    fallback: '#8b949e',
    colors: {
      feat: '#f0f6fc',
      fix: '#e6edf3',
      chore: '#848d97',
      docs: '#c9d1d9',
      refactor: '#b1bac4',
      perf: '#9ea7b3',
      test: '#c9d1d9',
      build: '#8b949e',
      ci: '#768390',
      style: '#b1bac4',
      revert: '#6e7681',
    },
  },
  {
    id: 'one-dark',
    name: 'One Dark',
    previewBackground: '#282c34',
    fallback: '#abb2bf',
    colors: {
      feat: '#98c379',
      fix: '#e06c75',
      chore: '#abb2bf',
      docs: '#61afef',
      refactor: '#56b6c2',
      perf: '#e5c07b',
      test: '#c678dd',
      build: '#d19a66',
      ci: '#be5046',
      style: '#c678dd',
      revert: '#5c6370',
    },
  },
  {
    id: 'tokyo-night',
    name: 'Tokyo Night',
    previewBackground: '#1a1b26',
    fallback: '#787c99',
    colors: {
      feat: '#9ece6a',
      fix: '#f7768e',
      chore: '#787c99',
      docs: '#7aa2f7',
      refactor: '#7dcfff',
      perf: '#e0af68',
      test: '#bb9af7',
      build: '#ff9e64',
      ci: '#2ac3de',
      style: '#c0caf5',
      revert: '#565f89',
    },
  },
  {
    id: 'dracula',
    name: 'Dracula',
    previewBackground: '#282a36',
    fallback: '#6272a4',
    colors: {
      feat: '#50fa7b',
      fix: '#ff5555',
      chore: '#6272a4',
      docs: '#8be9fd',
      refactor: '#ff79c6',
      perf: '#f1fa8c',
      test: '#bd93f9',
      build: '#ffb86c',
      ci: '#8be9fd',
      style: '#bd93f9',
      revert: '#6272a4',
    },
  },
  {
    id: 'nord',
    name: 'Nord',
    previewBackground: '#2e3440',
    fallback: '#81a1c1',
    colors: {
      feat: '#a3be8c',
      fix: '#bf616a',
      chore: '#616e88',
      docs: '#81a1c1',
      refactor: '#88c0d0',
      perf: '#ebcb8b',
      test: '#b48ead',
      build: '#d08770',
      ci: '#5e81ac',
      style: '#8fbcbb',
      revert: '#4c566a',
    },
  },
  {
    id: 'solarized',
    name: 'Solarized',
    previewBackground: '#002b36',
    fallback: '#839496',
    colors: {
      feat: '#859900',
      fix: '#dc322f',
      chore: '#586e75',
      docs: '#268bd2',
      refactor: '#2aa198',
      perf: '#b58900',
      test: '#6c71c4',
      build: '#cb4b16',
      ci: '#d33682',
      style: '#6c71c4',
      revert: '#657b83',
    },
  },
];

export const DEFAULT_THEME_ID = 'github';

export function getTheme(id: string): Theme | undefined {
  return THEMES.find((t) => t.id === id);
}

/** Color a theme assigns to a tag type (fallback for custom types). */
export function themeColorFor(theme: Theme, type: string): string {
  return theme.colors[type] ?? theme.fallback;
}

/** Recolor every tag from the given theme, keeping types and labels intact. */
export function applyTheme(tags: TagConfig[], theme: Theme): TagConfig[] {
  return tags.map((tag) => ({ ...tag, color: themeColorFor(theme, tag.type) }));
}

/** Fresh default settings: canonical tags colored with the default theme. */
export function defaultSettings(): Settings {
  const theme = getTheme(DEFAULT_THEME_ID)!;
  return {
    version: 1,
    themeId: theme.id,
    tags: DEFAULT_TAG_LABELS.map(([type, label]) => ({
      type,
      label,
      color: themeColorFor(theme, type),
    })),
  };
}

const HEX_COLOR_RE = /^#[0-9a-f]{6}$/i;
const TYPE_RE = /^[a-z][a-z0-9-]*$/;

/**
 * Validate and coerce whatever came out of storage into a usable Settings
 * object. Malformed or missing data falls back to defaults so a bad sync
 * payload can never break the extension.
 */
export function normalizeSettings(raw: unknown): Settings {
  const defaults = defaultSettings();
  if (typeof raw !== 'object' || raw === null) return defaults;

  const candidate = raw as Partial<Settings>;
  if (!Array.isArray(candidate.tags)) return defaults;

  const seen = new Set<string>();
  const tags: TagConfig[] = [];
  for (const entry of candidate.tags) {
    if (typeof entry !== 'object' || entry === null) continue;
    const { type, label, color } = entry as Partial<TagConfig>;
    if (typeof type !== 'string' || !TYPE_RE.test(type)) continue;
    if (seen.has(type)) continue;
    seen.add(type);
    tags.push({
      type,
      label: typeof label === 'string' && label.trim() !== '' ? label : type,
      color: typeof color === 'string' && HEX_COLOR_RE.test(color) ? color.toLowerCase() : defaults.tags[0]!.color,
    });
  }
  if (tags.length === 0) return defaults;

  return {
    version: 1,
    themeId: typeof candidate.themeId === 'string' ? candidate.themeId : 'custom',
    tags,
  };
}

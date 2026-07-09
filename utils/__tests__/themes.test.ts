import { describe, expect, it } from 'vitest';
import {
  DEFAULT_TAG_LABELS,
  THEMES,
  applyTheme,
  defaultSettings,
  getTheme,
  normalizeSettings,
  themeColorFor,
} from '../themes';

describe('themes catalog', () => {
  it('includes a default theme', () => {
    expect(getTheme('github')).toBeDefined();
  });

  it('gives every theme a color for every canonical type', () => {
    for (const theme of THEMES) {
      for (const [type] of DEFAULT_TAG_LABELS) {
        expect(themeColorFor(theme, type)).toMatch(/^#[0-9a-f]{6}$/i);
      }
    }
  });
});

describe('applyTheme', () => {
  it('recolors tags but keeps types and labels', () => {
    const settings = defaultSettings();
    const oneDark = getTheme('one-dark')!;
    const recolored = applyTheme(settings.tags, oneDark);
    expect(recolored.map((t) => t.type)).toEqual(settings.tags.map((t) => t.type));
    expect(recolored.find((t) => t.type === 'feat')?.color).toBe('#98c379');
  });

  it('uses the fallback color for custom types', () => {
    const oneDark = getTheme('one-dark')!;
    const [tag] = applyTheme([{ type: 'improvement', label: 'Improvement', color: '#000000' }], oneDark);
    expect(tag!.color).toBe(oneDark.fallback);
  });
});

describe('defaultSettings', () => {
  it('colors tags with the default palette', () => {
    const settings = defaultSettings();
    expect(settings.themeId).toBe('github');
    expect(settings.tags.find((t) => t.type === 'feat')).toMatchObject({
      label: 'Feature',
      color: '#3fb950',
    });
  });
});

describe('normalizeSettings', () => {
  it('returns defaults for garbage input', () => {
    expect(normalizeSettings(undefined)).toEqual(defaultSettings());
    expect(normalizeSettings(null)).toEqual(defaultSettings());
    expect(normalizeSettings('nope')).toEqual(defaultSettings());
    expect(normalizeSettings({ tags: 'nope' })).toEqual(defaultSettings());
    expect(normalizeSettings({ tags: [] })).toEqual(defaultSettings());
  });

  it('drops malformed tags and duplicates', () => {
    const result = normalizeSettings({
      themeId: 'custom',
      tags: [
        { type: 'feat', label: 'Feature', color: '#3FB950' },
        { type: 'feat', label: 'Dup', color: '#000000' },
        { type: 'Not Valid', label: 'x', color: '#000000' },
        { type: 'fix', label: '', color: 'red' },
        42,
      ],
    });
    expect(result.tags).toHaveLength(2);
    expect(result.tags[0]).toMatchObject({ type: 'feat', color: '#3fb950' });
    // Empty label falls back to the type; invalid color falls back to a default.
    expect(result.tags[1]!.label).toBe('fix');
    expect(result.tags[1]!.color).toMatch(/^#[0-9a-f]{6}$/);
  });

  it('preserves valid custom settings', () => {
    const custom = {
      version: 1,
      themeId: 'dracula',
      tags: [{ type: 'improvement', label: 'Improvement', color: '#50fa7b' }],
    };
    expect(normalizeSettings(custom)).toEqual(custom);
  });
});

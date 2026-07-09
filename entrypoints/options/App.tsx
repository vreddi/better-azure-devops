import { useEffect, useMemo, useRef, useState } from 'react';
import { parseConventionalTitle, pillText, remainingTitle } from '@/utils/conventional-commits';
import { loadSettings, saveSettings } from '@/utils/storage';
import { THEMES, applyTheme, defaultSettings } from '@/utils/themes';
import type { Settings, TagConfig } from '@/utils/types';
import { Pill } from './components/Pill';
import { TagRow } from './components/TagRow';
import { ThemeCard } from './components/ThemeCard';

const SAMPLE_TITLES = [
  'feat: track numerical metrics per goal with trend charts',
  'fix(auth): refresh access token before it expires',
  'docs(move-to-onerepo): conversion workflow steps 1-2',
  'refactor!: replace core-utils date formatting',
  'chore: bump dependencies to latest minors',
];

const TYPE_RE = /^[a-z][a-z0-9-]*$/;
const HEX_COLOR_RE = /^#[0-9a-f]{6}$/i;

export default function App() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [saved, setSaved] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    void loadSettings().then(setSettings);
    return () => clearTimeout(saveTimer.current);
  }, []);

  /** Update state immediately, persist to chrome.storage.sync debounced. */
  function persist(next: Settings) {
    setSettings(next);
    setSaved(false);
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      void saveSettings(next).then(() => setSaved(true));
    }, 400);
  }

  const errors = useMemo(() => {
    if (!settings) return [];
    const counts = new Map<string, number>();
    for (const tag of settings.tags) {
      counts.set(tag.type, (counts.get(tag.type) ?? 0) + 1);
    }
    return settings.tags.map((tag) => {
      if (!TYPE_RE.test(tag.type)) return 'Type must be lowercase letters/digits/dashes';
      if ((counts.get(tag.type) ?? 0) > 1) return 'Duplicate type';
      if (!HEX_COLOR_RE.test(tag.color)) return 'Color must be a #rrggbb hex value';
      return undefined;
    });
  }, [settings]);

  if (!settings) return null;

  const tagsByType = new Map(settings.tags.map((tag) => [tag.type, tag]));
  const knownTypes = new Set(tagsByType.keys());

  return (
    <div className="page">
      <header className="page-header">
        <img src="/icon/48.png" alt="" width={40} height={40} />
        <div>
          <h1>Better Azure DevOps</h1>
          <p>Conventional commit labels for pull requests.</p>
        </div>
        <span className={`save-indicator${saved ? ' save-indicator-visible' : ''}`}>
          ✓ Saved
        </span>
      </header>

      <section>
        <h2>Preview</h2>
        <p className="section-hint">How pull request titles will render on Azure DevOps.</p>
        <div className="preview-list">
          {SAMPLE_TITLES.map((title) => {
            const parsed = parseConventionalTitle(title, knownTypes);
            const tag = parsed ? tagsByType.get(parsed.type) : undefined;
            return (
              <div className="preview-row" key={title}>
                {parsed && tag ? (
                  <>
                    <Pill label={pillText(tag.label, parsed)} color={tag.color} />
                    <span className="preview-title">{remainingTitle(parsed)}</span>
                  </>
                ) : (
                  <span className="preview-title">{title}</span>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <h2>Themes</h2>
        <p className="section-hint">
          Pick a color palette for your labels. Editing any color below switches you to a
          custom palette.
        </p>
        <div className="theme-grid">
          {THEMES.map((theme) => (
            <ThemeCard
              key={theme.id}
              theme={theme}
              active={settings.themeId === theme.id}
              onSelect={() =>
                persist({
                  ...settings,
                  themeId: theme.id,
                  tags: applyTheme(settings.tags, theme),
                })
              }
            />
          ))}
        </div>
      </section>

      <section>
        <h2>Conventional commit tags</h2>
        <p className="section-hint">
          The commit types recognized in PR titles, the label text shown for each, and its
          color. Add your own types (e.g. <code>improvement</code>) or remove ones you
          don&apos;t use.
        </p>
        <div className="tag-list">
          <div className="tag-list-header">
            <span>Preview</span>
            <span>Type</span>
            <span>Label</span>
            <span>Color</span>
            <span />
          </div>
          {settings.tags.map((tag, index) => (
            <TagRow
              key={index}
              tag={tag}
              error={errors[index]}
              onChange={(next: TagConfig, colorEdited: boolean) =>
                persist({
                  ...settings,
                  themeId: colorEdited ? 'custom' : settings.themeId,
                  tags: settings.tags.map((t, i) => (i === index ? next : t)),
                })
              }
              onRemove={() =>
                persist({
                  ...settings,
                  tags: settings.tags.filter((_, i) => i !== index),
                })
              }
            />
          ))}
        </div>
        <div className="tag-actions">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() =>
              persist({
                ...settings,
                tags: [...settings.tags, { type: '', label: '', color: '#8b949e' }],
              })
            }
          >
            + Add tag
          </button>
          <button
            type="button"
            className="btn"
            onClick={() => {
              if (window.confirm('Reset all tags and colors to the GitHub defaults?')) {
                persist(defaultSettings());
              }
            }}
          >
            Reset to defaults
          </button>
        </div>
      </section>

      <footer className="page-footer">
        Changes apply to open Azure DevOps tabs automatically.
      </footer>
    </div>
  );
}

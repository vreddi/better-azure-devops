import { DEFAULT_TAG_LABELS, themeColorFor } from '@/utils/themes';
import type { Theme } from '@/utils/types';

interface ThemeCardProps {
  theme: Theme;
  active: boolean;
  onSelect: () => void;
}

const PREVIEW_ROWS: ReadonlyArray<{ type: string; barWidths: [number, number] }> = [
  { type: 'feat', barWidths: [46, 22] },
  { type: 'fix', barWidths: [30, 38] },
  { type: 'docs', barWidths: [52, 16] },
  { type: 'refactor', barWidths: [36, 28] },
];

function isLightColor(hex: string): boolean {
  const value = hex.replace('#', '');
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return 0.299 * r + 0.587 * g + 0.114 * b > 150;
}

/** Mini mockup of a PR list rendered with the theme's colors, like an editor theme picker. */
export function ThemeCard({ theme, active, onSelect }: ThemeCardProps) {
  const barColor = isLightColor(theme.previewBackground)
    ? 'rgba(0, 0, 0, 0.12)'
    : 'rgba(255, 255, 255, 0.14)';

  return (
    <button
      type="button"
      className={`theme-card${active ? ' theme-card-active' : ''}`}
      onClick={onSelect}
      aria-pressed={active}
    >
      <div className="theme-preview" style={{ background: theme.previewBackground }}>
        <div className="theme-preview-dots">
          <i style={{ background: barColor }} />
          <i style={{ background: barColor }} />
          <i style={{ background: barColor }} />
        </div>
        {PREVIEW_ROWS.map(({ type, barWidths }) => (
          <div className="theme-preview-row" key={type}>
            <span
              className="theme-preview-chip"
              style={{ background: themeColorFor(theme, type) }}
            />
            <span
              className="theme-preview-bar"
              style={{ width: `${barWidths[0]}%`, background: barColor }}
            />
            <span
              className="theme-preview-bar"
              style={{ width: `${barWidths[1]}%`, background: barColor }}
            />
          </div>
        ))}
        <div className="theme-preview-strip">
          {DEFAULT_TAG_LABELS.map(([type]) => (
            <i key={type} style={{ background: themeColorFor(theme, type) }} />
          ))}
        </div>
      </div>
      <div className="theme-card-footer">
        <span className="theme-card-name">{theme.name}</span>
        {active && <span className="theme-card-badge">Active</span>}
      </div>
    </button>
  );
}

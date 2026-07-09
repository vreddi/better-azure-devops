import type { TagConfig } from '@/utils/types';
import { Pill } from './Pill';

interface TagRowProps {
  tag: TagConfig;
  error?: string;
  onChange: (next: TagConfig, colorEdited: boolean) => void;
  onRemove: () => void;
}

const HEX_COLOR_RE = /^#[0-9a-f]{6}$/i;

export function TagRow({ tag, error, onChange, onRemove }: TagRowProps) {
  return (
    <div className={`tag-row${error ? ' tag-row-invalid' : ''}`}>
      <div className="tag-row-preview">
        <Pill label={tag.label || tag.type || '…'} color={tag.color} />
      </div>
      <input
        className="tag-input tag-input-type"
        value={tag.type}
        spellCheck={false}
        placeholder="feat"
        aria-label="Commit type"
        title={error}
        onChange={(e) =>
          onChange({ ...tag, type: e.target.value.toLowerCase().trim() }, false)
        }
      />
      <input
        className="tag-input tag-input-label"
        value={tag.label}
        placeholder="Feature"
        aria-label="Label text"
        onChange={(e) => onChange({ ...tag, label: e.target.value }, false)}
      />
      <div className="tag-color">
        <input
          type="color"
          value={HEX_COLOR_RE.test(tag.color) ? tag.color : '#8b949e'}
          aria-label="Label color"
          onChange={(e) => onChange({ ...tag, color: e.target.value }, true)}
        />
        <input
          className="tag-input tag-input-hex"
          value={tag.color}
          spellCheck={false}
          aria-label="Label color hex"
          onChange={(e) => onChange({ ...tag, color: e.target.value.toLowerCase() }, true)}
        />
      </div>
      <button
        type="button"
        className="tag-remove"
        onClick={onRemove}
        aria-label={`Remove ${tag.type || 'tag'}`}
        title="Remove tag"
      >
        ×
      </button>
      {error && <span className="tag-row-error">{error}</span>}
    </div>
  );
}

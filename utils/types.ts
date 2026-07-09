/** A single conventional commit tag the user wants rendered as a label. */
export interface TagConfig {
  /** The conventional commit type as it appears in titles, e.g. `feat`. Lowercase. */
  type: string;
  /** The text rendered inside the label pill, e.g. `Feature`. */
  label: string;
  /** Hex color (`#rrggbb`) used for the pill text/border/background tint. */
  color: string;
}

/** Everything the extension persists in `chrome.storage.sync`. */
export interface Settings {
  /** Schema version, for future migrations. */
  version: 1;
  /** The id of the theme the colors were taken from, or `custom` after manual edits. */
  themeId: string;
  tags: TagConfig[];
}

/** A named color palette that can be applied to all tags at once. */
export interface Theme {
  id: string;
  name: string;
  /** Color per conventional commit type. Types not listed fall back to `fallback`. */
  colors: Record<string, string>;
  /** Color for tag types the theme doesn't know about. */
  fallback: string;
  /** Representative background used in the theme preview card. */
  previewBackground: string;
}

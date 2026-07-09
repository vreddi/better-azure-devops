/** Result of matching a conventional commit prefix at the start of a title. */
export interface ParsedTitle {
  /** Normalized (lowercase) commit type, e.g. `feat`. */
  type: string;
  /** Scope without parentheses, e.g. `auth` from `feat(auth): …`, if present. */
  scope?: string;
  /** Whether the `!` breaking-change marker was present. */
  breaking: boolean;
  /** The title with the conventional commit prefix stripped. */
  rest: string;
  /** Number of characters of the original string consumed by the prefix. */
  prefixLength: number;
}

/**
 * `type(scope)!: rest` at the start of a string. Deliberately forgiving about
 * whitespace (PR titles are hand-typed) but strict about shape, so ordinary
 * sentences containing a colon don't match: the type must be a single
 * lowercase-ish word.
 */
const PREFIX_RE = /^(\s*)([A-Za-z][A-Za-z0-9-]*)(?:\(([^)]{1,80})\))?(!)?:\s+/;

/**
 * Parse a conventional commit prefix from a PR/commit title.
 *
 * Only types present in `knownTypes` match — everything else (e.g.
 * `WIP: stuff`, `Update: readme`) is left untouched so we never mangle titles
 * that merely look colon-separated.
 */
export function parseConventionalTitle(
  title: string,
  knownTypes: ReadonlySet<string>,
): ParsedTitle | null {
  const match = title.match(PREFIX_RE);
  if (!match) return null;

  const type = match[2]!.toLowerCase();
  if (!knownTypes.has(type)) return null;

  return {
    type,
    scope: match[3],
    breaking: match[4] === '!',
    rest: title.slice(match[0].length),
    prefixLength: match[0].length,
  };
}

/**
 * The text that should remain after the pill. The scope is kept readable as a
 * `scope:` lead-in, e.g. `feat(metrics): track goals` becomes `[Feature]
 * metrics: track goals`.
 */
export function remainingTitle(parsed: ParsedTitle): string {
  return parsed.scope ? `${parsed.scope}: ${parsed.rest}` : parsed.rest;
}

/** Pill text: the configured label, with `!` kept for breaking changes. */
export function pillText(label: string, parsed: ParsedTitle): string {
  return parsed.breaking ? `${label}!` : label;
}

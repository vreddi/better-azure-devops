import { describe, expect, it } from 'vitest';
import {
  parseConventionalTitle,
  pillText,
  remainingTitle,
} from '../conventional-commits';

const TYPES = new Set(['feat', 'fix', 'chore', 'docs', 'refactor', 'improvement']);

describe('parseConventionalTitle', () => {
  it('parses a plain type prefix', () => {
    const parsed = parseConventionalTitle('feat: manual-backlog sort compliance', TYPES);
    expect(parsed).toMatchObject({
      type: 'feat',
      scope: undefined,
      breaking: false,
      rest: 'manual-backlog sort compliance',
    });
  });

  it('parses a scoped prefix', () => {
    const parsed = parseConventionalTitle('feat(plugin-graph): add Nx plugin', TYPES);
    expect(parsed).toMatchObject({ type: 'feat', scope: 'plugin-graph', rest: 'add Nx plugin' });
  });

  it('parses the breaking-change marker', () => {
    const parsed = parseConventionalTitle('refactor!: drop legacy date utils', TYPES);
    expect(parsed).toMatchObject({ type: 'refactor', breaking: true });
  });

  it('normalizes uppercase types', () => {
    const parsed = parseConventionalTitle('Fix: broken thing', TYPES);
    expect(parsed?.type).toBe('fix');
  });

  it('matches custom user-defined types', () => {
    const parsed = parseConventionalTitle('improvement: add worktree include file', TYPES);
    expect(parsed?.type).toBe('improvement');
  });

  it('tolerates leading whitespace', () => {
    const parsed = parseConventionalTitle('  chore: bump deps', TYPES);
    expect(parsed).toMatchObject({ type: 'chore', rest: 'bump deps' });
  });

  it('ignores unknown types', () => {
    expect(parseConventionalTitle('WIP: do not merge', TYPES)).toBeNull();
    expect(parseConventionalTitle('imrpovement: typo type', TYPES)).toBeNull();
  });

  it('ignores titles without a prefix', () => {
    expect(parseConventionalTitle('Update the readme', TYPES)).toBeNull();
    expect(parseConventionalTitle('', TYPES)).toBeNull();
  });

  it('requires whitespace after the colon', () => {
    expect(parseConventionalTitle('feat:no-space', TYPES)).toBeNull();
  });

  it('reports the exact prefix length', () => {
    const title = 'docs(readme): update badges';
    const parsed = parseConventionalTitle(title, TYPES)!;
    expect(title.slice(parsed.prefixLength)).toBe('update badges');
  });
});

describe('remainingTitle', () => {
  it('keeps the scope readable as a prefix', () => {
    const parsed = parseConventionalTitle('feat(metrics): track goals', TYPES)!;
    expect(remainingTitle(parsed)).toBe('metrics: track goals');
  });

  it('returns just the rest when there is no scope', () => {
    const parsed = parseConventionalTitle('fix: a bug', TYPES)!;
    expect(remainingTitle(parsed)).toBe('a bug');
  });
});

describe('pillText', () => {
  it('appends ! for breaking changes', () => {
    const parsed = parseConventionalTitle('feat!: new api', TYPES)!;
    expect(pillText('Feature', parsed)).toBe('Feature!');
  });

  it('uses the label as-is otherwise', () => {
    const parsed = parseConventionalTitle('feat: new api', TYPES)!;
    expect(pillText('Feature', parsed)).toBe('Feature');
  });
});

import type { CSSProperties } from 'react';

interface PillProps {
  label: string;
  color: string;
}

/** The label pill rendered on PR titles in the content script. */
export function Pill({ label, color }: PillProps) {
  return (
    <span className="pill" style={{ '--pill-color': color } as CSSProperties}>
      {label}
    </span>
  );
}

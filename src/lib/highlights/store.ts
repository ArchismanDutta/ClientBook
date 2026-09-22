import type { Highlight } from './types';

const STORAGE_KEY = 'preneur-gate:highlights:v1';

export function loadHighlights(): Highlight[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveHighlights(highlights: Highlight[]): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(highlights));
  } catch {
    /* quota exceeded / disabled — silently drop */
  }
}

// djb2-style hash → short base36. Stable across runs.
export function hashText(input: string): string {
  let h = 5381;
  for (let i = 0; i < input.length; i++) {
    h = ((h << 5) + h) ^ input.charCodeAt(i);
  }
  return (h >>> 0).toString(36);
}

export function makeHlKey(sectionId: string, plainText: string): string {
  return `${sectionId}::${hashText(plainText)}`;
}

export function newHighlightId(): string {
  return `hl-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

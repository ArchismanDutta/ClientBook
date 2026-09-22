// Hand-drawn accents used across the questionnaire pages. Decorative only.

type Props = { className?: string };

export function BrushUnderline({ className }: Props) {
  return (
    <svg className={className} viewBox="0 0 320 26" preserveAspectRatio="none" aria-hidden="true">
      <path d="M8 17 C 70 9, 170 6, 312 11" fill="none" stroke="var(--pink)" strokeWidth="8" strokeLinecap="round" />
      <path d="M26 20 C 110 13, 200 12, 296 14" fill="none" stroke="var(--pink)" strokeWidth="2.5" strokeLinecap="round" opacity=".55" />
    </svg>
  );
}

export function LightbulbDoodle({ className }: Props) {
  return (
    <svg className={className} viewBox="0 0 150 128" fill="none" aria-hidden="true">
      {/* painted glow */}
      <path d="M44 38 C 46 18, 74 10, 90 22 C 104 32, 102 52, 92 64 C 86 72, 84 76, 82 84 L 58 84 C 56 74, 48 68, 44 58 C 41 51, 43 44, 44 38 Z" fill="var(--yellow)" opacity=".92" />
      {/* bulb */}
      <path d="M70 20 C 50 20, 38 34, 39 50 C 40 62, 49 68, 54 78 L 55 88 L 83 88 L 84 78 C 90 68, 99 62, 100 50 C 101 34, 90 20, 70 20 Z" stroke="var(--ink)" strokeWidth="3.2" strokeLinejoin="round" />
      {/* filament */}
      <path d="M62 88 L 62 68 C 62 61, 69 61, 69 67 C 69 61, 76 61, 76 68 L 76 88" stroke="var(--ink)" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      {/* base */}
      <path d="M56 94 H 82 M58 100 H 80 M62 106 H 76" stroke="var(--ink)" strokeWidth="3" strokeLinecap="round" />
      {/* rays */}
      <path d="M70 4 V 12 M40 10 L 46 17 M100 10 L 94 17 M22 36 L 30 39 M118 36 L 110 39" stroke="var(--ink)" strokeWidth="3" strokeLinecap="round" />
      {/* spark */}
      <path d="M122 16 L 128 8 M126 26 L 136 22" stroke="var(--pink)" strokeWidth="3" strokeLinecap="round" />
      {/* cord */}
      <path d="M78 106 C 88 116, 106 118, 112 108 C 118 98, 104 92, 102 102 C 100 114, 120 124, 146 110" stroke="var(--ink)" strokeWidth="2.6" strokeLinecap="round" />
    </svg>
  );
}

export function BrushSquiggle({ className }: Props) {
  return (
    <svg className={className} viewBox="0 0 120 70" fill="none" aria-hidden="true">
      <path d="M8 26 C 30 10, 62 8, 74 18 C 56 30, 32 44, 18 58 C 46 50, 82 46, 112 44" stroke="var(--pink)" strokeWidth="11" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M92 40 L 116 38" stroke="var(--pink)" strokeWidth="3" strokeLinecap="round" opacity=".6" />
    </svg>
  );
}

export function TickBurst({ className }: Props) {
  return (
    <svg className={className} viewBox="0 0 28 48" fill="none" aria-hidden="true">
      <path d="M4 6 L 18 14 M2 24 H 20 M4 42 L 18 34" stroke="var(--ink)" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function PaperPlane({ className }: Props) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M21 3 L 3 10.5 L 10 13.5 L 13.5 21 Z M10 13.5 L 21 3" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

export function ClipboardIcon({ className }: Props) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="5" y="4.5" width="14" height="16.5" rx="2" />
      <path d="M9 4.5V3h6v1.5" />
      <path d="M9 12.5l2 2 4-4.5" />
    </svg>
  );
}

export function BackIcon({ className }: Props) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M10 6l-6 6 6 6" />
      <path d="M4 12h16" />
    </svg>
  );
}

export function DownloadIcon({ className }: Props) {
  return (
    <svg className={className} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 4v11" />
      <path d="M7 10.5l5 5 5-5" />
      <path d="M5 20h14" />
    </svg>
  );
}

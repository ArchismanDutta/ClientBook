export function Controls({ label, onPrev, onNext, onToc, tocLabel = 'Contents', tocAriaLabel = 'Table of contents', onFullscreen, canPrev, canNext, fullscreen, fullscreenSupported, children }: {
  label: string;
  onPrev: () => void;
  onNext: () => void;
  onToc: () => void;
  tocLabel?: string;
  tocAriaLabel?: string;
  onFullscreen: () => void;
  canPrev: boolean;
  canNext: boolean;
  fullscreen: boolean;
  fullscreenSupported: boolean;
  children?: React.ReactNode; // extra tools shown after the contents button
}) {
  return (
    <nav className="reader-navigation" aria-label="Book navigation">
      <div className="controls">
        <button className="controls-arrow" aria-label="Previous page" onClick={onPrev} disabled={!canPrev}>←</button>
        <span className="controls-page" role="status" aria-live="polite">{label}</span>
        <button className="controls-arrow" aria-label="Next page" onClick={onNext} disabled={!canNext}>→</button>
        <span className="controls-sep" aria-hidden />
        <button aria-label={tocAriaLabel} onClick={onToc}>{tocLabel}</button>
        {children}
        {fullscreenSupported && <button aria-label={fullscreen ? 'Exit fullscreen' : 'Fullscreen'} aria-pressed={fullscreen} onClick={onFullscreen}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <path d={fullscreen ? 'M4 9h5V4m6 0v5h5M4 15h5v5m6 0v-5h5' : 'M9 4H4v5m11-5h5v5M4 15v5h5m6 0h5v-5'} />
          </svg>
        </button>}
      </div>
    </nav>
  );
}

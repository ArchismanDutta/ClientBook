import { useHighlights } from './HighlightsProvider';
import type { HighlightColor } from '../lib/highlights/types';

const COLORS: HighlightColor[] = ['yellow', 'pink', 'blue', 'mint'];

// The highlighter switch in the bottom reading bar. While it is on, the colour
// choices and the highlight count float just above the bar.
export function HighlighterToolbar() {
  const { mode, setMode, color, setColor, highlights } = useHighlights();
  // A selection spanning several blocks is stored in pieces; count it once.
  const selections = highlights.filter(h => !h.groupId || highlights.find(o => o.groupId === h.groupId) === h);
  const highlightCount = selections.length;
  const commentCount = selections.filter(h => h.comment).length;

  return (
    <div className={`hl-toolbar ${mode ? 'is-active' : ''}`}>
      <button
        className="hl-toolbar-toggle"
        aria-pressed={mode}
        aria-label={mode ? 'Turn highlighter off' : 'Turn highlighter on'}
        onClick={() => setMode(!mode)}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M14 3l7 7-9 9-4 1 1-4 5-6z" />
          <path d="M11 6l7 7" />
        </svg>
        <span className="hl-toolbar-label">{mode ? 'Highlighting' : 'Highlighter'}</span>
        {highlightCount > 0 && <span className="hl-toolbar-count" aria-hidden="true">{highlightCount}</span>}
      </button>

      {mode && (
        <div className="hl-toolbar-tray" role="group" aria-label="Highlighter">
          <div className="hl-toolbar-colors" role="radiogroup" aria-label="Highlight color">
            {COLORS.map(c => (
              <button
                key={c}
                role="radio"
                aria-checked={color === c}
                aria-label={c}
                className={`hl-swatch hl-swatch-${c} ${color === c ? 'is-selected' : ''}`}
                onClick={() => setColor(c)}
              />
            ))}
          </div>
          {highlightCount > 0 && (
            <div className="hl-toolbar-meta">
              <span>{highlightCount} highlight{highlightCount === 1 ? '' : 's'}</span>
              {commentCount > 0 && <span> · {commentCount} note{commentCount === 1 ? '' : 's'}</span>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

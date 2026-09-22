import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useHighlights } from './HighlightsProvider';
import { relativeTime } from '../lib/relativeTime';

export function CommentPopupHost() {
  const { popup, closePopup, getById, updateComment, removeComment, removeHighlight } = useHighlights();
  const [draft, setDraft] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  const highlight = popup ? getById(popup.highlightId) : undefined;

  useEffect(() => {
    if (highlight) setDraft(highlight.comment?.text ?? '');
  }, [popup?.highlightId, highlight]);

  // Position the popup below the anchor rect, clamped to viewport.
  useLayoutEffect(() => {
    if (!popup || !ref.current) { setPos(null); return; }
    const el = ref.current;
    const rect = el.getBoundingClientRect();
    const gap = 10;
    let top = popup.anchor.bottom + gap;
    let left = popup.anchor.left;
    if (top + rect.height > window.innerHeight - 12) {
      top = Math.max(12, popup.anchor.top - rect.height - gap);
    }
    if (left + rect.width > window.innerWidth - 12) {
      left = Math.max(12, window.innerWidth - rect.width - 12);
    }
    if (left < 12) left = 12;
    setPos({ top, left });
  }, [popup]);

  useEffect(() => {
    if (!popup) return;
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) closePopup();
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') closePopup();
    }
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [popup, closePopup]);

  if (!popup || !highlight) return null;

  const save = () => {
    const text = draft.trim();
    if (text) updateComment(highlight.id, text);
    else if (highlight.comment) removeComment(highlight.id);
    closePopup();
  };

  const lastEdited = highlight.comment ? relativeTime(highlight.comment.lastEditedAt) : null;

  return (
    <div
      ref={ref}
      className="comment-popup"
      role="dialog"
      aria-label="Highlight note"
      style={{
        position: 'fixed',
        top: (pos?.top ?? popup.anchor.bottom + 10) + 'px',
        left: (pos?.left ?? popup.anchor.left) + 'px',
        visibility: pos ? 'visible' : 'hidden',
      }}
    >
      <div className="comment-popup-quote">
        <span className={`hl-swatch hl-swatch-${highlight.color}`} aria-hidden />
        <span>“{highlight.text.length > 90 ? highlight.text.slice(0, 90) + '…' : highlight.text}”</span>
      </div>
      <textarea
        className="comment-popup-input"
        placeholder="Add a note about this highlight…"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        rows={4}
        autoFocus
      />
      <div className="comment-popup-actions">
        <span className="comment-popup-time">{lastEdited ? `Last edited ${lastEdited}` : 'New note'}</span>
        <button
          className="comment-popup-btn danger"
          onClick={() => { removeHighlight(highlight.id); closePopup(); }}
        >
          Delete
        </button>
        <button className="comment-popup-btn primary" onClick={save}>Save</button>
      </div>
    </div>
  );
}

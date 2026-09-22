import { describe, expect, it, beforeEach, vi, type Mock } from 'vitest';
import { attachSwipe } from './BookShell';

// jsdom has no TouchEvent constructor; these carry only what attachSwipe reads.
function touchEvent(type: string, points: { x: number; y: number }[]): Event {
  const event = new Event(type, { bubbles: true });
  const list = points.map(p => ({ clientX: p.x, clientY: p.y }));
  Object.defineProperty(event, 'touches', { value: type === 'touchend' ? [] : list });
  Object.defineProperty(event, 'changedTouches', { value: list });
  return event;
}

function swipe(el: HTMLElement, from: { x: number; y: number }, to: { x: number; y: number }) {
  el.dispatchEvent(touchEvent('touchstart', [from]));
  el.dispatchEvent(touchEvent('touchend', [to]));
}

describe('swiping a page on a phone', () => {
  let container: HTMLElement;
  let turn: { back: Mock<() => void>; forward: Mock<() => void> };
  let detach: () => void;

  beforeEach(() => {
    document.body.innerHTML = '<div id="book"><p class="para" data-hl-key="k">Some text</p></div>';
    delete document.body.dataset.highlightMode;
    container = document.getElementById('book')!;
    turn = { back: vi.fn<() => void>(), forward: vi.fn<() => void>() };
    detach = attachSwipe(container, turn);
  });

  it('turns back on a swipe to the right and forward on a swipe to the left', () => {
    swipe(container, { x: 100, y: 400 }, { x: 260, y: 410 });
    expect(turn.back).toHaveBeenCalledTimes(1);

    swipe(container, { x: 260, y: 400 }, { x: 100, y: 390 });
    expect(turn.forward).toHaveBeenCalledTimes(1);
  });

  it('turns back however slow the swipe is', () => {
    vi.useFakeTimers();
    try {
      container.dispatchEvent(touchEvent('touchstart', [{ x: 100, y: 400 }]));
      vi.advanceTimersByTime(900); // page-flip's own swipe window is 250ms
      container.dispatchEvent(touchEvent('touchend', [{ x: 280, y: 400 }]));
      expect(turn.back).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it('ignores short drags, vertical drags and long presses', () => {
    swipe(container, { x: 100, y: 400 }, { x: 130, y: 400 });      // too short
    swipe(container, { x: 100, y: 200 }, { x: 140, y: 420 });      // mostly vertical
    container.dispatchEvent(touchEvent('touchstart', [{ x: 100, y: 400 }]));
    container.dispatchEvent(touchEvent('touchcancel', [{ x: 100, y: 400 }]));
    container.dispatchEvent(touchEvent('touchend', [{ x: 300, y: 400 }]));
    expect(turn.back).not.toHaveBeenCalled();
    expect(turn.forward).not.toHaveBeenCalled();
  });

  it('leaves the gesture alone while text is being highlighted', () => {
    document.body.dataset.highlightMode = 'on';
    const para = container.querySelector('.para')!;
    para.dispatchEvent(touchEvent('touchstart', [{ x: 100, y: 400 }]));
    para.dispatchEvent(touchEvent('touchend', [{ x: 280, y: 400 }]));
    expect(turn.back).not.toHaveBeenCalled();
  });

  it('stops listening once detached', () => {
    detach();
    swipe(container, { x: 100, y: 400 }, { x: 280, y: 400 });
    expect(turn.back).not.toHaveBeenCalled();
  });
});

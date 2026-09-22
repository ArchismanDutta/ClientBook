import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useKeyboardNav } from './useKeyboardNav';

describe('useKeyboardNav', () => {
  it('calls next on ArrowRight', () => {
    const next = vi.fn(); const prev = vi.fn();
    renderHook(() => useKeyboardNav({ next, prev }));
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    expect(next).toHaveBeenCalledTimes(1);
  });
  it('calls prev on ArrowLeft', () => {
    const next = vi.fn(); const prev = vi.fn();
    renderHook(() => useKeyboardNav({ next, prev }));
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
    expect(prev).toHaveBeenCalledTimes(1);
  });
});

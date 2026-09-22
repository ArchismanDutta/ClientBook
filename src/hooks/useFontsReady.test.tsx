import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useFontsReady } from './useFontsReady';

describe('useFontsReady', () => {
  it('resolves to true when document.fonts.ready resolves', async () => {
    const { result } = renderHook(() => useFontsReady());
    await waitFor(() => expect(result.current).toBe(true));
  });
});

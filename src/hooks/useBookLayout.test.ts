import { describe, expect, it } from 'vitest';
import { getBookLayout } from './useBookLayout';

describe('book layout', () => {
  it.each([[320, 568], [390, 844], [768, 1024], [844, 390], [1024, 768], [1440, 900], [1920, 1080]])(
    'fits horizontally at %i × %i without shrinking the text', (width, height) => {
      const layout = getBookLayout(width, height);
      expect(layout.pageW * (layout.singlePage ? 1 : 2)).toBeLessThan(width);
      expect(layout.pageH).toBeGreaterThanOrEqual(540);
      expect(layout.pageW).toBeGreaterThanOrEqual(296);
      expect(layout.singlePage).toBe(width < 960);
    },
  );
});

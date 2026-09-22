import { useEffect, useState } from 'react';

export function useFontsReady(): boolean {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const fontSet = document.fonts;
    // Preloads fetch files but do not activate font faces. Load every face used
    // in page measurement before computing line wraps and page breaks.
    const p = fontSet?.load ? Promise.all([
      fontSet.load('400 14px Inter'),
      fontSet.load('600 10px "Space Grotesk"'),
      fontSet.load('500 36px Fraunces'),
      fontSet.load('italic 400 15px Fraunces'),
    ]).catch(() => undefined).then(() => fontSet.ready) : Promise.resolve();
    p.then(() => { if (!cancelled) setReady(true); });
    return () => { cancelled = true; };
  }, []);

  return ready;
}

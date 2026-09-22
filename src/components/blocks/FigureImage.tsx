import type { ImageBlock } from '../../types/book';
import { Highlightable, textRuns } from '../Highlightable';

export function FigureImage({ block }: { block: ImageBlock }) {
  return (
    <figure className="figure">
      <img src={block.src} alt={block.alt} width={block.w} height={block.h} loading="lazy" />
      {block.alt && <Highlightable as="figcaption" scope="caption" runs={textRuns(block.alt)} />}
    </figure>
  );
}

import type { ImageBlock } from '../../types/book';

export function FigureImage({ block }: { block: ImageBlock }) {
  return (
    <figure className="figure">
      <img src={block.src} alt={block.alt} width={block.w} height={block.h} loading="lazy" />
      {block.alt && <figcaption>{block.alt}</figcaption>}
    </figure>
  );
}

import type { Block } from '../../types/book';
import { BlockRenderer } from '../../components/BlockRenderer.stub';

export function RenderedBlock({ block }: { block: Block }) {
  return <BlockRenderer block={block} />;
}

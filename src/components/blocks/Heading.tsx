import type { HeadingBlock } from '../../types/book';

export function Heading({ block }: { block: HeadingBlock }) {
  if (block.level === 1) return <h1 className="h1">{block.text}</h1>;
  return <h2 className="h2">{block.text}</h2>;
}

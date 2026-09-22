import type { Block } from '../../types/book';
import { Paragraph } from './Paragraph';
import { List } from './List';
import { Table } from './Table';
import { Callout } from './Callout';
import { FigureImage } from './FigureImage';
import { Heading } from './Heading';

export function BlockRenderer({ block }: { block: Block }) {
  switch (block.type) {
    case 'para': return <Paragraph block={block} />;
    case 'list': return <List block={block} />;
    case 'table': return <Table block={block} />;
    case 'callout': return <Callout block={block} />;
    case 'image': return <FigureImage block={block} />;
    case 'heading': return <Heading block={block} />;
  }
}

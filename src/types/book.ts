export type InlineRun = {
  text: string;
  bold?: boolean;
  italic?: boolean;
  href?: string;
};

export type ParaBlock = { type: 'para'; runs: InlineRun[] };
export type ListBlock = {
  type: 'list'; style: 'bullet' | 'number'; items: InlineRun[][]; start?: number;
  continued?: boolean; // the first item carries on from the previous page, so it shows no marker
};
export type TableBlock = { type: 'table'; header?: string[]; rows: string[][] };
export type ImageBlock = { type: 'image'; src: string; alt: string; w: number; h: number };
export type CalloutBlock = { type: 'callout'; label: string; body: InlineRun[] };
export type HeadingBlock = { type: 'heading'; level: 1 | 2; text: string; id: string };

export type Block =
  | ParaBlock
  | ListBlock
  | TableBlock
  | ImageBlock
  | CalloutBlock
  | HeadingBlock;

export type Section = {
  id: string;
  level: 1 | 2;
  title: string;
  blocks: Block[];
};

export type BookMeta = {
  version: string;
  date: string;
  imprint: string;
  generatedAt: string;
};

export type Book = {
  title: string;
  subtitle: string;
  meta: BookMeta;
  sections: Section[];
};

// Page-level types used by the paginator (not emitted by build script)
export type Page = {
  blocks: Block[];
  sectionId: string;
  sectionTitle: string;
  pageNumber: number;
  opener?: boolean; // this page starts a Heading 1
  overflow?: boolean; // An indivisible block can scroll instead of losing content.
  kind: 'cover' | 'toc' | 'opener' | 'body' | 'image' | 'back' | 'blank';
};

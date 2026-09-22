export type HighlightColor = 'yellow' | 'pink' | 'blue' | 'mint';

export type HighlightComment = {
  text: string;
  lastEditedAt: number;
};

export type Highlight = {
  id: string;
  hlKey: string;           // stable per paragraph: `${sectionId}::${hash(plainText)}`
  startOffset: number;     // char offset within paragraph plain text
  endOffset: number;
  text: string;            // captured selection snippet
  color: HighlightColor;
  createdAt: number;
  comment?: HighlightComment;
};

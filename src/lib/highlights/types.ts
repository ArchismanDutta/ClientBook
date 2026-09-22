export type HighlightColor = 'yellow' | 'pink' | 'blue' | 'mint';

export type HighlightComment = {
  text: string;
  lastEditedAt: number;
};

export type Highlight = {
  id: string;
  hlKey: string;           // stable per text unit: `${sectionId}::${hash(plainText)}`
  groupId?: string;        // shared by the pieces of one selection spanning several text units
  startOffset: number;     // char offset within the unit's plain text
  endOffset: number;
  text: string;            // captured selection snippet
  color: HighlightColor;
  createdAt: number;
  comment?: HighlightComment;
};

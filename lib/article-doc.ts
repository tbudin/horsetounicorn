/**
 * Article document schema — a TipTap-compatible JSON tree.
 *
 * The full content of an article is stored as ONE document. Block-level
 * items are nodes in the document's top-level content array; rich text
 * formatting (bold, italic, links) is expressed as marks on text nodes
 * just as TipTap stores it.
 *
 * Custom block-level nodes carry attrs payloads for charts, callouts,
 * images, and videos so the renderer can swap in React components.
 */

export type Mark =
  | { type: 'bold' }
  | { type: 'italic' }
  | { type: 'strike' }
  | { type: 'code' }
  | { type: 'link'; attrs: { href: string; target?: string | null } };

export interface TextNode {
  type: 'text';
  text: string;
  marks?: Mark[];
}

export interface HardBreakNode {
  type: 'hardBreak';
}

export type InlineNode = TextNode | HardBreakNode;

export interface ParagraphNode {
  type: 'paragraph';
  content?: InlineNode[];
}

export interface HeadingNode {
  type: 'heading';
  attrs: { level: 2 | 3 };
  content?: InlineNode[];
}

export interface BulletListNode {
  type: 'bulletList';
  content: ListItemNode[];
}

export interface OrderedListNode {
  type: 'orderedList';
  content: ListItemNode[];
}

export interface ListItemNode {
  type: 'listItem';
  content: BlockNode[];
}

export interface HorizontalRuleNode {
  type: 'horizontalRule';
}

export interface BlockquoteNode {
  type: 'blockquote';
  content: BlockNode[];
}

// -- Custom block nodes ------------------------------------------------

export interface ChartNode {
  type: 'chart';
  attrs: { chartName: string; caption?: string | null };
}

export interface CalloutNode {
  type: 'callout';
  attrs: { headline?: string | null };
  content: BlockNode[];
}

export interface ImageNode {
  type: 'image';
  attrs: { src: string; alt?: string | null; caption?: string | null };
}

export type VideoProvider = 'youtube' | 'vimeo' | 'file';

export interface VideoNode {
  type: 'video';
  attrs: {
    src: string;
    provider: VideoProvider;
    caption?: string | null;
  };
}

export type BlockNode =
  | ParagraphNode
  | HeadingNode
  | BulletListNode
  | OrderedListNode
  | ListItemNode
  | HorizontalRuleNode
  | BlockquoteNode
  | ChartNode
  | CalloutNode
  | ImageNode
  | VideoNode;

export interface ArticleDocument {
  type: 'doc';
  content: BlockNode[];
}

/** Empty article document with a single empty paragraph. */
export function emptyDocument(): ArticleDocument {
  return { type: 'doc', content: [{ type: 'paragraph' }] };
}

import type { ReactNode, ComponentType } from 'react';
import type {
  ArticleDocument,
  BlockNode,
  InlineNode,
  Mark,
} from '@/lib/article-doc';
import { Callout } from './callout';

export interface ChartRegistry {
  [name: string]: ComponentType;
}

export interface RenderDocumentProps {
  document: ArticleDocument;
  charts: ChartRegistry;
}

/**
 * Render an ArticleDocument (TipTap JSON tree) as JSX. Inline marks become
 * <strong>/<em>/<a> wrappers. Block nodes map to semantic tags; custom
 * nodes (chart, callout, image, video) map to React components.
 */
export function RenderDocument({ document, charts }: RenderDocumentProps): ReactNode {
  return (
    <>
      {document.content.map((node, i) => (
        <RenderBlock key={i} node={node} charts={charts} />
      ))}
    </>
  );
}

function RenderBlock({
  node,
  charts,
}: {
  node: BlockNode;
  charts: ChartRegistry;
}): ReactNode {
  switch (node.type) {
    case 'paragraph':
      return <p>{renderInline(node.content)}</p>;

    case 'heading':
      if (node.attrs.level === 3) return <h3>{renderInline(node.content)}</h3>;
      return <h2>{renderInline(node.content)}</h2>;

    case 'bulletList':
      return (
        <ul>
          {node.content.map((li, i) => (
            <li key={i}>
              {li.content.map((child, j) => (
                <RenderBlock key={j} node={child} charts={charts} />
              ))}
            </li>
          ))}
        </ul>
      );

    case 'orderedList':
      return (
        <ol>
          {node.content.map((li, i) => (
            <li key={i}>
              {li.content.map((child, j) => (
                <RenderBlock key={j} node={child} charts={charts} />
              ))}
            </li>
          ))}
        </ol>
      );

    case 'listItem':
      // Standalone listItem — shouldn't normally happen but render gracefully.
      return (
        <li>
          {node.content.map((child, j) => (
            <RenderBlock key={j} node={child} charts={charts} />
          ))}
        </li>
      );

    case 'blockquote':
      return (
        <blockquote>
          {node.content.map((child, i) => (
            <RenderBlock key={i} node={child} charts={charts} />
          ))}
        </blockquote>
      );

    case 'horizontalRule':
      return <hr className="not-prose my-8 border-t border-[#EEE6EC]" />;

    case 'chart': {
      const Chart = charts[node.attrs.chartName];
      if (!Chart) return <MissingChart name={node.attrs.chartName} />;
      if (node.attrs.caption) {
        return (
          <figure className="not-prose my-8">
            <Chart />
            <figcaption className="mt-3 text-center text-xs text-ink-subtle">
              {node.attrs.caption}
            </figcaption>
          </figure>
        );
      }
      return <Chart />;
    }

    case 'callout':
      return (
        <Callout headline={node.attrs.headline ?? undefined}>
          {node.content.map((child, i) => (
            <RenderBlock key={i} node={child} charts={charts} />
          ))}
        </Callout>
      );

    case 'image':
      return (
        <figure className="not-prose my-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={node.attrs.src}
            alt={node.attrs.alt ?? ''}
            className="w-full rounded-md"
          />
          {node.attrs.caption ? (
            <figcaption className="mt-3 text-center text-xs text-ink-subtle">
              {node.attrs.caption}
            </figcaption>
          ) : null}
        </figure>
      );

    case 'video':
      return <VideoEmbed node={node} />;
  }
}

function VideoEmbed({
  node,
}: {
  node: Extract<BlockNode, { type: 'video' }>;
}): ReactNode {
  const { provider, src, caption } = node.attrs;
  let iframe: ReactNode = null;
  if (provider === 'youtube') {
    const id = extractYouTubeId(src);
    if (id) {
      iframe = (
        <iframe
          src={`https://www.youtube.com/embed/${id}`}
          title="YouTube video"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 h-full w-full"
        />
      );
    }
  } else if (provider === 'vimeo') {
    const id = extractVimeoId(src);
    if (id) {
      iframe = (
        <iframe
          src={`https://player.vimeo.com/video/${id}`}
          title="Vimeo video"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 h-full w-full"
        />
      );
    }
  } else {
    iframe = (
      <video
        src={src}
        controls
        className="absolute inset-0 h-full w-full bg-black"
      />
    );
  }
  return (
    <figure className="not-prose my-8">
      <div className="relative aspect-video w-full bg-[#FAF7F9]">{iframe}</div>
      {caption ? (
        <figcaption className="mt-3 text-center text-xs text-ink-subtle">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}

function extractYouTubeId(src: string): string | null {
  const m = src.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/)([\w-]{11})/,
  );
  return m ? m[1] : null;
}
function extractVimeoId(src: string): string | null {
  const m = src.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  return m ? m[1] : null;
}

function renderInline(content: InlineNode[] | undefined): ReactNode {
  if (!content || content.length === 0) return null;
  return content.map((node, i) => {
    if (node.type === 'hardBreak') return <br key={i} />;
    const marks = node.marks ?? [];
    return wrapWithMarks(node.text, marks, i);
  });
}

function wrapWithMarks(text: string, marks: Mark[], key: number): ReactNode {
  let element: ReactNode = text;
  for (const mark of marks) {
    if (mark.type === 'bold') element = <strong>{element}</strong>;
    else if (mark.type === 'italic') element = <em>{element}</em>;
    else if (mark.type === 'strike') element = <s>{element}</s>;
    else if (mark.type === 'code') element = <code>{element}</code>;
    else if (mark.type === 'link')
      element = (
        <a
          href={mark.attrs.href}
          target={mark.attrs.target ?? '_blank'}
          rel="noopener noreferrer"
          className="text-burgundy underline underline-offset-2"
        >
          {element}
        </a>
      );
  }
  return <span key={key}>{element}</span>;
}

function MissingChart({ name }: { name: string }) {
  return (
    <div className="not-prose my-8 rounded-md border-2 border-dashed border-burgundy bg-burgundy-lighter/20 p-6 text-center text-sm text-burgundy">
      Missing chart: <code className="font-mono">{name}</code>
    </div>
  );
}

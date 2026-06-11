import type { ComponentType, ReactNode } from 'react';
import type { Block } from '@/lib/articles';
import { Callout } from './callout';

export interface ChartRegistry {
  [name: string]: ComponentType;
}

export interface RenderBlocksProps {
  blocks: Block[];
  /**
   * Map of chartName → React component. Populated by the article's page.tsx.
   * Blocks of type 'chart' reference names in this map.
   */
  charts: ChartRegistry;
}

/**
 * Walk an article's block list and render each as the right element.
 *
 * Wrap in <ArticleLayout> for the prose column + page chrome:
 *
 *   <ArticleLayout title={...}>
 *     <RenderBlocks blocks={blocks} charts={CHARTS} />
 *   </ArticleLayout>
 */
export function RenderBlocks({ blocks, charts }: RenderBlocksProps): ReactNode {
  return (
    <>
      {blocks.map((block) => {
        switch (block.type) {
          case 'paragraph':
            return (
              <p
                key={block.id}
                dangerouslySetInnerHTML={{ __html: block.html }}
              />
            );

          case 'heading': {
            if (block.level === 3) {
              return <h3 key={block.id}>{block.text}</h3>;
            }
            return <h2 key={block.id}>{block.text}</h2>;
          }

          case 'chart': {
            const Chart = charts[block.chartName];
            if (!Chart) return <MissingChart key={block.id} name={block.chartName} />;
            if (block.caption) {
              return (
                <figure key={block.id} className="not-prose my-8">
                  <Chart />
                  <figcaption className="mt-3 text-center text-xs text-ink-subtle">
                    {block.caption}
                  </figcaption>
                </figure>
              );
            }
            return <Chart key={block.id} />;
          }

          case 'callout':
            return (
              <Callout key={block.id} headline={block.headline}>
                <div dangerouslySetInnerHTML={{ __html: block.html }} />
              </Callout>
            );

          case 'image':
            return (
              <figure key={block.id} className="not-prose my-8">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={block.src}
                  alt={block.alt}
                  className="w-full rounded-md"
                />
                {block.caption ? (
                  <figcaption className="mt-3 text-center text-xs text-ink-subtle">
                    {block.caption}
                  </figcaption>
                ) : null}
              </figure>
            );
        }
      })}
    </>
  );
}

function MissingChart({ name }: { name: string }) {
  return (
    <div className="not-prose my-8 rounded-md border-2 border-dashed border-burgundy bg-burgundy-lighter/20 p-6 text-center text-sm text-burgundy">
      Missing chart: <code className="font-mono">{name}</code>
    </div>
  );
}

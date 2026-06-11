'use client';

import { Node, mergeAttributes } from '@tiptap/core';

/**
 * Custom TipTap nodes for the article editor:
 *   chart   — leaf node, attrs: { chartName, caption }
 *   image   — leaf node, attrs: { src, alt, caption }
 *   video   — leaf node, attrs: { src, provider, caption }
 *   callout — container, attrs: { headline }, holds nested blocks
 *
 * Each renders a simple HTML wrapper in the editor for editing convenience.
 * The PUBLIC view does not use these renderers — it uses the React
 * components in components/article/render-document.tsx.
 */

export const ChartNode = Node.create({
  name: 'chart',
  group: 'block',
  atom: true,
  selectable: true,
  draggable: true,
  addAttributes() {
    return {
      chartName: { default: '' },
      caption: { default: null },
    };
  },
  parseHTML() {
    return [{ tag: 'div[data-chart]' }];
  },
  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-chart': HTMLAttributes.chartName,
        class:
          'border border-dashed border-burgundy bg-burgundy-lighter/20 p-4 my-4 font-mono text-sm text-burgundy',
      }),
      `📊 ${HTMLAttributes.chartName || '(no chart selected)'}${HTMLAttributes.caption ? ' — ' + HTMLAttributes.caption : ''}`,
    ];
  },
});

export const ImageNode = Node.create({
  name: 'image',
  group: 'block',
  atom: true,
  selectable: true,
  draggable: true,
  addAttributes() {
    return {
      src: { default: '' },
      alt: { default: null },
      caption: { default: null },
    };
  },
  parseHTML() {
    return [{ tag: 'figure[data-image]' }];
  },
  renderHTML({ HTMLAttributes }) {
    return [
      'figure',
      mergeAttributes(HTMLAttributes, {
        'data-image': '',
        class: 'my-4',
      }),
      [
        'img',
        {
          src: HTMLAttributes.src,
          alt: HTMLAttributes.alt ?? '',
          class: 'w-full',
        },
      ],
      ...(HTMLAttributes.caption
        ? [['figcaption', { class: 'text-xs text-ink-subtle text-center mt-1' }, HTMLAttributes.caption]]
        : []),
    ];
  },
});

export const VideoNode = Node.create({
  name: 'video',
  group: 'block',
  atom: true,
  selectable: true,
  draggable: true,
  addAttributes() {
    return {
      src: { default: '' },
      provider: { default: 'youtube' },
      caption: { default: null },
    };
  },
  parseHTML() {
    return [{ tag: 'div[data-video]' }];
  },
  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-video': HTMLAttributes.provider,
        class:
          'border border-dashed border-ink-subtle bg-[#FAF7F9] p-4 my-4 font-mono text-xs text-ink-muted',
      }),
      `🎬 ${HTMLAttributes.provider}: ${HTMLAttributes.src || '(no URL)'}`,
    ];
  },
});

export const CalloutNode = Node.create({
  name: 'callout',
  group: 'block',
  content: 'block+',
  defining: true,
  draggable: true,
  addAttributes() {
    return {
      headline: { default: null },
    };
  },
  parseHTML() {
    return [{ tag: 'aside[data-callout]' }];
  },
  renderHTML({ HTMLAttributes }) {
    return [
      'aside',
      mergeAttributes(HTMLAttributes, {
        'data-callout': '',
        class:
          'border-l-4 border-burgundy bg-burgundy-lighter/30 px-4 py-3 my-4',
      }),
      ...(HTMLAttributes.headline
        ? [
            [
              'div',
              {
                class:
                  'font-serif text-ink-heading font-medium mb-1 not-prose',
              },
              HTMLAttributes.headline,
            ],
          ]
        : []),
      ['div', { class: 'callout-body' }, 0],
    ];
  },
});

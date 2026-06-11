'use client';

import * as React from 'react';
import { Extension } from '@tiptap/core';
import Suggestion, { type SuggestionOptions } from '@tiptap/suggestion';
import { ReactRenderer } from '@tiptap/react';
import type { Editor, Range } from '@tiptap/core';
import {
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Minus,
  Type,
  BarChart3,
  MessageSquareQuote,
  Image as ImageIcon,
  Video as VideoIcon,
} from 'lucide-react';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';

// -- Command catalog -----------------------------------------------------

export interface SlashContext {
  /** Article slug — needed by image upload and chart picker. */
  slug: string;
  /** Chart names available to the current article. */
  availableCharts: string[];
}

interface SlashCommand {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  group: 'Text' | 'Lists' | 'Blocks' | 'Embed';
  keywords?: string[];
  run: (editor: Editor, range: Range, ctx: SlashContext) => void | Promise<void>;
}

const COMMANDS: SlashCommand[] = [
  {
    id: 'paragraph',
    title: 'Paragraph',
    description: 'Plain prose.',
    icon: Type,
    group: 'Text',
    keywords: ['text', 'p'],
    run: (editor, range) => {
      editor.chain().focus().deleteRange(range).setNode('paragraph').run();
    },
  },
  {
    id: 'h2',
    title: 'Heading 2',
    description: 'Section heading.',
    icon: Heading2,
    group: 'Text',
    keywords: ['h2', 'title'],
    run: (editor, range) => {
      editor.chain().focus().deleteRange(range).setNode('heading', { level: 2 }).run();
    },
  },
  {
    id: 'h3',
    title: 'Heading 3',
    description: 'Sub-section heading.',
    icon: Heading3,
    group: 'Text',
    keywords: ['h3', 'subhead'],
    run: (editor, range) => {
      editor.chain().focus().deleteRange(range).setNode('heading', { level: 3 }).run();
    },
  },
  {
    id: 'bullet',
    title: 'Bullet list',
    description: 'Unordered list.',
    icon: List,
    group: 'Lists',
    keywords: ['ul', 'unordered'],
    run: (editor, range) => {
      editor.chain().focus().deleteRange(range).toggleBulletList().run();
    },
  },
  {
    id: 'ordered',
    title: 'Numbered list',
    description: 'Ordered list.',
    icon: ListOrdered,
    group: 'Lists',
    keywords: ['ol', 'numbered'],
    run: (editor, range) => {
      editor.chain().focus().deleteRange(range).toggleOrderedList().run();
    },
  },
  {
    id: 'quote',
    title: 'Blockquote',
    description: 'Quoted passage.',
    icon: Quote,
    group: 'Blocks',
    keywords: ['quote'],
    run: (editor, range) => {
      editor.chain().focus().deleteRange(range).toggleBlockquote().run();
    },
  },
  {
    id: 'separator',
    title: 'Separator',
    description: 'Horizontal rule.',
    icon: Minus,
    group: 'Blocks',
    keywords: ['hr', 'divider', 'rule'],
    run: (editor, range) => {
      editor.chain().focus().deleteRange(range).setHorizontalRule().run();
    },
  },
  {
    id: 'chart',
    title: 'Chart',
    description: 'Embed a registered chart.',
    icon: BarChart3,
    group: 'Embed',
    keywords: ['chart', 'graph', 'figure'],
    run: (editor, range, ctx) => {
      if (ctx.availableCharts.length === 0) {
        window.alert(
          `No charts registered for "${ctx.slug}". Add a chart component to app/articles/_charts/${ctx.slug}/ first.`,
        );
        return;
      }
      const choice = window.prompt(
        `Pick a chart:\n${ctx.availableCharts.join('\n')}`,
        ctx.availableCharts[0],
      );
      if (!choice) return;
      const caption = window.prompt('Caption (optional)') ?? null;
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .insertContent({
          type: 'chart',
          attrs: { chartName: choice, caption: caption || null },
        })
        .run();
    },
  },
  {
    id: 'callout',
    title: 'Callout',
    description: 'Highlighted note with optional headline.',
    icon: MessageSquareQuote,
    group: 'Embed',
    keywords: ['note', 'aside'],
    run: (editor, range) => {
      const headline = window.prompt('Headline (optional)') ?? '';
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .insertContent({
          type: 'callout',
          attrs: { headline: headline || null },
          content: [{ type: 'paragraph' }],
        })
        .run();
    },
  },
  {
    id: 'image',
    title: 'Image',
    description: 'Upload a file or paste a URL.',
    icon: ImageIcon,
    group: 'Embed',
    keywords: ['picture', 'photo', 'img'],
    run: async (editor, range, ctx) => {
      const url = window.prompt('Image URL (or blank to upload)');
      const insert = (src: string, alt: string, caption: string | null) =>
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .insertContent({
            type: 'image',
            attrs: { src, alt: alt || null, caption: caption || null },
          })
          .run();

      if (url) {
        const alt = window.prompt('Alt text') ?? '';
        const caption = window.prompt('Caption (optional)') ?? null;
        insert(url, alt, caption);
        return;
      }
      const input = window.document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = async () => {
        const file = input.files?.[0];
        if (!file) return;
        const form = new FormData();
        form.append('slug', ctx.slug);
        form.append('file', file);
        const res = await fetch('/api/admin/upload', { method: 'POST', body: form });
        const data = (await res.json()) as { ok: boolean; url?: string; error?: string };
        if (!data.ok || !data.url) {
          window.alert(data.error ?? 'Upload failed');
          return;
        }
        const alt = window.prompt('Alt text') ?? '';
        const caption = window.prompt('Caption (optional)') ?? null;
        insert(data.url, alt, caption);
      };
      input.click();
    },
  },
  {
    id: 'video',
    title: 'Video',
    description: 'YouTube, Vimeo, or direct MP4.',
    icon: VideoIcon,
    group: 'Embed',
    keywords: ['youtube', 'vimeo'],
    run: (editor, range) => {
      const url = window.prompt('Video URL');
      if (!url) return;
      const provider: 'youtube' | 'vimeo' | 'file' = /youtube\.com|youtu\.be/.test(url)
        ? 'youtube'
        : /vimeo\.com/.test(url)
          ? 'vimeo'
          : 'file';
      const caption = window.prompt('Caption (optional)') ?? null;
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .insertContent({
          type: 'video',
          attrs: { src: url, provider, caption: caption || null },
        })
        .run();
    },
  },
];

// -- Popover renderer ----------------------------------------------------

interface MenuProps {
  query: string;
  editor: Editor;
  range: Range;
  ctx: SlashContext;
  onClose: () => void;
}

const SlashMenu = React.forwardRef<{ onKeyDown: (e: KeyboardEvent) => boolean }, MenuProps>(
  function SlashMenu({ query, editor, range, ctx, onClose }, ref) {
    const groups = React.useMemo(() => {
      const groupMap = new Map<string, SlashCommand[]>();
      for (const c of COMMANDS) {
        const arr = groupMap.get(c.group) ?? [];
        arr.push(c);
        groupMap.set(c.group, arr);
      }
      return [...groupMap.entries()];
    }, []);

    React.useImperativeHandle(ref, () => ({
      onKeyDown(e: KeyboardEvent) {
        if (e.key === 'Escape') {
          onClose();
          return true;
        }
        return false;
      },
    }));

    return (
      <div className="z-50 w-64 border border-[#EEE6EC] bg-white shadow-lg">
        <Command shouldFilter loop>
          <CommandInput placeholder="Search blocks…" defaultValue={query} autoFocus />
          <CommandList>
            <CommandEmpty>No matching block.</CommandEmpty>
            {groups.map(([group, items]) => (
              <CommandGroup key={group} heading={group}>
                {items.map((cmd) => {
                  const Icon = cmd.icon;
                  return (
                    <CommandItem
                      key={cmd.id}
                      value={`${cmd.title} ${cmd.keywords?.join(' ') ?? ''}`}
                      onSelect={() => {
                        void cmd.run(editor, range, ctx);
                        onClose();
                      }}
                    >
                      <Icon className="h-4 w-4 text-ink-subtle" />
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-ink-heading">
                          {cmd.title}
                        </div>
                        <div className="text-[11px] text-ink-subtle truncate">
                          {cmd.description}
                        </div>
                      </div>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </div>
    );
  },
);

// -- TipTap extension factory --------------------------------------------

interface SuggestionPluginProps {
  query: string;
  editor: Editor;
  range: Range;
  clientRect?: (() => DOMRect | null) | null;
}

export function createSlashCommands(ctx: SlashContext) {
  return Extension.create({
    name: 'slashCommands',
    addOptions() {
      return {
        suggestion: {
          char: '/',
          startOfLine: false,
          command: ({ editor, range }: { editor: Editor; range: Range }) => {
            // The Suggestion plugin invokes this when an item is selected;
            // we handle selection inside the React popover instead.
            void editor;
            void range;
          },
        } as Partial<SuggestionOptions>,
      };
    },
    addProseMirrorPlugins() {
      return [
        Suggestion({
          editor: this.editor,
          char: '/',
          startOfLine: false,
          allowSpaces: false,
          command: ({ editor, range }) => {
            void editor;
            void range;
          },
          items: ({ query }) => {
            const q = query.toLowerCase();
            return COMMANDS.filter((c) =>
              [c.title, c.description, ...(c.keywords ?? [])]
                .join(' ')
                .toLowerCase()
                .includes(q),
            );
          },
          render: () => {
            let renderer: ReactRenderer<{
              onKeyDown: (e: KeyboardEvent) => boolean;
            }> | null = null;
            let popper: HTMLElement | null = null;

            const place = (rect: DOMRect | null | undefined) => {
              if (!popper || !rect) return;
              const ph = popper.offsetHeight;
              const pw = popper.offsetWidth;
              let top = rect.bottom + 6 + window.scrollY;
              let left = rect.left + window.scrollX;
              const winW = window.innerWidth;
              const winH = window.innerHeight;
              if (left + pw > winW - 8) left = winW - pw - 8;
              if (top + ph > winH + window.scrollY) {
                top = rect.top - ph - 6 + window.scrollY;
              }
              popper.style.top = `${top}px`;
              popper.style.left = `${left}px`;
            };

            return {
              onStart(props: SuggestionPluginProps) {
                renderer = new ReactRenderer(SlashMenu, {
                  props: {
                    query: props.query,
                    editor: props.editor,
                    range: { from: 0, to: 0 },
                    ctx,
                    onClose: () => {
                      props.editor.commands.focus();
                      // The plugin will close itself on next exit; nothing else here.
                    },
                  },
                  editor: props.editor,
                });
                popper = window.document.createElement('div');
                popper.style.position = 'absolute';
                popper.style.zIndex = '100';
                popper.appendChild(renderer.element);
                window.document.body.appendChild(popper);
                place(props.clientRect?.());
              },
              onUpdate(props: SuggestionPluginProps & { range: Range }) {
                renderer?.updateProps({
                  query: props.query,
                  editor: props.editor,
                  range: props.range,
                  ctx,
                  onClose: () => {},
                });
                place(props.clientRect?.());
              },
              onKeyDown(props: { event: KeyboardEvent }) {
                return renderer?.ref?.onKeyDown(props.event) ?? false;
              },
              onExit() {
                renderer?.destroy();
                if (popper && popper.parentNode) {
                  popper.parentNode.removeChild(popper);
                }
                popper = null;
                renderer = null;
              },
            };
          },
        }),
      ];
    },
  });
}

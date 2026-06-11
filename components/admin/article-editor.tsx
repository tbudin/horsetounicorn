'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { restrictToParentElement, restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import type { Block, ArticleMetadata, ArticleStatus } from '@/lib/articles';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';

// -- Top-level editor ----------------------------------------------------

export interface ArticleEditorProps {
  slug: string;
  initialMetadata: ArticleMetadata;
  initialBlocks: Block[];
  availableCharts: string[];
}

export function ArticleEditor({
  slug,
  initialMetadata,
  initialBlocks,
  availableCharts,
}: ArticleEditorProps) {
  const router = useRouter();
  const [metadata, setMetadata] = useState<ArticleMetadata>(initialMetadata);
  const [blocks, setBlocks] = useState<Block[]>(initialBlocks);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

  // Mark dirty whenever data changes
  useEffect(() => {
    const sameMeta = JSON.stringify(metadata) === JSON.stringify(initialMetadata);
    const sameBlocks = JSON.stringify(blocks) === JSON.stringify(initialBlocks);
    setDirty(!(sameMeta && sameBlocks));
  }, [metadata, blocks, initialMetadata, initialBlocks]);

  // Warn on navigation when dirty
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);

  async function save() {
    if (saving) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/articles/${slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ metadata, blocks }),
      });
      const data = (await res.json()) as {
        ok: boolean;
        error?: string;
        slug?: string;
        renamed?: boolean;
      };
      if (!res.ok || !data.ok) {
        setError(data.error ?? 'Save failed');
        return;
      }
      setLastSavedAt(new Date());
      setDirty(false);
      if (data.renamed && data.slug && data.slug !== slug) {
        router.replace(`/admin/articles/${data.slug}/edit`);
      } else {
        router.refresh();
      }
    } catch {
      setError('Network error');
    } finally {
      setSaving(false);
    }
  }

  const updateBlock = useCallback((id: string, patch: Partial<Block>) => {
    setBlocks((prev) =>
      prev.map((b) => (b.id === id ? ({ ...b, ...patch } as Block) : b)),
    );
  }, []);

  const removeBlock = useCallback((id: string) => {
    setBlocks((prev) => prev.filter((b) => b.id !== id));
  }, []);

  const insertBlock = useCallback((afterIndex: number, block: Block) => {
    setBlocks((prev) => {
      const next = [...prev];
      next.splice(afterIndex + 1, 0, block);
      return next;
    });
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    setBlocks((prev) => {
      const oldIndex = prev.findIndex((b) => b.id === active.id);
      const newIndex = prev.findIndex((b) => b.id === over.id);
      if (oldIndex < 0 || newIndex < 0) return prev;
      return arrayMove(prev, oldIndex, newIndex);
    });
  }

  return (
    <div className="space-y-6">
      {/* Sticky save bar */}
      <div className="sticky top-0 z-20 -mx-2 px-2 py-3 bg-[#FAF7F9] border-b border-[#EEE6EC] flex items-center justify-between gap-3">
        <div className="text-xs text-ink-subtle data-num">
          {dirty
            ? 'Unsaved changes'
            : lastSavedAt
              ? `Saved ${lastSavedAt.toLocaleTimeString()}`
              : 'No changes'}
        </div>
        <div className="flex items-center gap-3">
          {error ? <span className="text-xs text-burgundy">{error}</span> : null}
          <button
            type="button"
            onClick={save}
            disabled={!dirty || saving}
            className="bg-burgundy text-white px-4 py-2 text-xs font-medium hover:bg-burgundy/90 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>

      <MetadataForm metadata={metadata} onChange={setMetadata} />

      <section>
        <h2 className="text-xs uppercase tracking-wider text-ink-subtle mb-3 data-num">
          Blocks
        </h2>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          modifiers={[restrictToVerticalAxis, restrictToParentElement]}
          onDragEnd={onDragEnd}
        >
          <SortableContext
            items={blocks.map((b) => b.id)}
            strategy={verticalListSortingStrategy}
          >
            <ol className="space-y-2">
              {blocks.map((block, i) => (
                <SortableBlockRow
                  key={block.id}
                  block={block}
                  slug={slug}
                  availableCharts={availableCharts}
                  onUpdate={(patch) => updateBlock(block.id, patch)}
                  onRemove={() => removeBlock(block.id)}
                  onInsertAfter={(b) => insertBlock(i, b)}
                />
              ))}
            </ol>
          </SortableContext>
        </DndContext>

        {blocks.length === 0 ? (
          <div className="border border-dashed border-[#EEE6EC] p-8 text-center">
            <AddBlockMenu
              onAdd={(b) => insertBlock(-1, b)}
              availableCharts={availableCharts}
            />
          </div>
        ) : (
          <div className="mt-3 flex justify-center">
            <AddBlockMenu
              onAdd={(b) => insertBlock(blocks.length - 1, b)}
              availableCharts={availableCharts}
            />
          </div>
        )}
      </section>
    </div>
  );
}

// -- Sortable block row --------------------------------------------------

function SortableBlockRow({
  block,
  slug,
  availableCharts,
  onUpdate,
  onRemove,
  onInsertAfter,
}: {
  block: Block;
  slug: string;
  availableCharts: string[];
  onUpdate: (patch: Partial<Block>) => void;
  onRemove: () => void;
  onInsertAfter: (b: Block) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: block.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={cn(
        'border border-[#EEE6EC] bg-white',
        isDragging && 'opacity-60 shadow-lg',
      )}
    >
      <div className="flex items-stretch">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="px-3 py-2 cursor-grab active:cursor-grabbing text-ink-subtle hover:text-ink-heading border-r border-[#EEE6EC]"
          aria-label="Drag to reorder"
        >
          ⋮⋮
        </button>
        <div className="flex-1 min-w-0">
          <BlockEditor
            block={block}
            slug={slug}
            availableCharts={availableCharts}
            onUpdate={onUpdate}
          />
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="px-3 py-2 text-ink-subtle hover:text-burgundy border-l border-[#EEE6EC]"
          aria-label="Delete block"
          title="Delete block"
        >
          ✕
        </button>
      </div>
      <div className="border-t border-[#EEE6EC] bg-[#FAF7F9] py-1 flex justify-center">
        <AddBlockMenu onAdd={onInsertAfter} availableCharts={availableCharts} compact />
      </div>
    </li>
  );
}

// -- Block-type editors --------------------------------------------------

function BlockEditor({
  block,
  slug,
  availableCharts,
  onUpdate,
}: {
  block: Block;
  slug: string;
  availableCharts: string[];
  onUpdate: (patch: Partial<Block>) => void;
}) {
  switch (block.type) {
    case 'paragraph':
      return <ParagraphEditor block={block} onUpdate={onUpdate} />;
    case 'heading':
      return <HeadingEditor block={block} onUpdate={onUpdate} />;
    case 'chart':
      return (
        <ChartEditor
          block={block}
          availableCharts={availableCharts}
          onUpdate={onUpdate}
        />
      );
    case 'callout':
      return <CalloutEditor block={block} onUpdate={onUpdate} />;
    case 'image':
      return <ImageEditor block={block} slug={slug} onUpdate={onUpdate} />;
  }
}

function ParagraphEditor({
  block,
  onUpdate,
}: {
  block: Extract<Block, { type: 'paragraph' }>;
  onUpdate: (patch: Partial<Block>) => void;
}) {
  return (
    <div className="p-3">
      <BlockLabel text="Paragraph" />
      <RichTextEditor
        html={block.html}
        onChange={(html) => onUpdate({ html })}
      />
    </div>
  );
}

function HeadingEditor({
  block,
  onUpdate,
}: {
  block: Extract<Block, { type: 'heading' }>;
  onUpdate: (patch: Partial<Block>) => void;
}) {
  return (
    <div className="p-3 space-y-2">
      <div className="flex items-center justify-between">
        <BlockLabel text={`Heading h${block.level}`} />
        <Select
          value={String(block.level)}
          onValueChange={(v) => onUpdate({ level: Number(v) as 2 | 3 })}
        >
          <SelectTrigger className="h-7 w-20 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="2">h2</SelectItem>
            <SelectItem value="3">h3</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Input
        type="text"
        value={block.text}
        onChange={(e) => onUpdate({ text: e.target.value })}
        placeholder="Heading text"
        className={cn(
          'font-serif text-ink-heading h-auto',
          block.level === 2 ? 'text-2xl' : 'text-xl',
        )}
      />
    </div>
  );
}

function ChartEditor({
  block,
  availableCharts,
  onUpdate,
}: {
  block: Extract<Block, { type: 'chart' }>;
  availableCharts: string[];
  onUpdate: (patch: Partial<Block>) => void;
}) {
  const isKnown = availableCharts.includes(block.chartName);
  return (
    <div className="p-3 space-y-2">
      <BlockLabel text="Chart" />
      <Select
        value={block.chartName}
        onValueChange={(v) => onUpdate({ chartName: v })}
      >
        <SelectTrigger
          className={cn(
            'font-mono',
            !isKnown && 'border-burgundy text-burgundy',
          )}
        >
          <SelectValue placeholder="Pick a chart" />
        </SelectTrigger>
        <SelectContent>
          {!isKnown && block.chartName ? (
            <SelectItem value={block.chartName} className="text-burgundy">
              {block.chartName} (missing)
            </SelectItem>
          ) : null}
          {availableCharts.map((name) => (
            <SelectItem key={name} value={name} className="font-mono">
              {name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        type="text"
        value={block.caption ?? ''}
        onChange={(e) => onUpdate({ caption: e.target.value || undefined })}
        placeholder="Optional caption"
      />
    </div>
  );
}

function CalloutEditor({
  block,
  onUpdate,
}: {
  block: Extract<Block, { type: 'callout' }>;
  onUpdate: (patch: Partial<Block>) => void;
}) {
  return (
    <div className="p-3 space-y-2">
      <BlockLabel text="Callout" />
      <Input
        type="text"
        value={block.headline ?? ''}
        onChange={(e) => onUpdate({ headline: e.target.value || undefined })}
        placeholder="Headline (optional)"
        className="font-serif text-ink-heading"
      />
      <RichTextEditor
        html={block.html}
        onChange={(html) => onUpdate({ html })}
      />
    </div>
  );
}

function ImageEditor({
  block,
  slug,
  onUpdate,
}: {
  block: Extract<Block, { type: 'image' }>;
  slug: string;
  onUpdate: (patch: Partial<Block>) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    try {
      const form = new FormData();
      form.append('slug', slug);
      form.append('file', file);
      const res = await fetch('/api/admin/upload', { method: 'POST', body: form });
      const data = (await res.json()) as { ok: boolean; url?: string; error?: string };
      if (!res.ok || !data.ok || !data.url) {
        setUploadError(data.error ?? 'Upload failed');
        return;
      }
      onUpdate({ src: data.url });
    } catch {
      setUploadError('Network error');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  return (
    <div className="p-3 space-y-2">
      <BlockLabel text="Image" />
      {block.src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={block.src}
          alt={block.alt}
          className="max-h-48 w-auto border border-[#EEE6EC]"
        />
      ) : null}
      <div className="flex gap-2 items-center">
        <Input
          type="text"
          value={block.src}
          onChange={(e) => onUpdate({ src: e.target.value })}
          placeholder="Image URL or upload"
          className="font-mono"
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="shrink-0 border border-[#EEE6EC] bg-[#FAF7F9] px-3 h-9 text-xs hover:bg-white disabled:opacity-50"
        >
          {uploading ? 'Uploading…' : 'Upload'}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={onPickFile}
          className="hidden"
        />
      </div>
      {uploadError ? (
        <p className="text-xs text-burgundy">{uploadError}</p>
      ) : null}
      <Input
        type="text"
        value={block.alt}
        onChange={(e) => onUpdate({ alt: e.target.value })}
        placeholder="Alt text (for accessibility)"
      />
      <Input
        type="text"
        value={block.caption ?? ''}
        onChange={(e) => onUpdate({ caption: e.target.value || undefined })}
        placeholder="Caption (optional)"
      />
    </div>
  );
}

// -- Rich text (TipTap) --------------------------------------------------

function RichTextEditor({
  html,
  onChange,
}: {
  html: string;
  onChange: (html: string) => void;
}) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        codeBlock: false,
        blockquote: false,
        bulletList: false,
        orderedList: false,
        horizontalRule: false,
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' },
      }),
    ],
    content: html,
    editorProps: {
      attributes: {
        class:
          'prose prose-sm max-w-none focus:outline-none min-h-[60px] p-3 bg-[#FAF7F9] border border-[#EEE6EC]',
      },
    },
    onUpdate({ editor }) {
      onChange(editor.getHTML());
    },
    immediatelyRender: false,
  });

  if (!editor) return null;

  return (
    <div>
      <div className="flex gap-1 mb-1 text-xs">
        <TbButton
          active={editor.isActive('bold')}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <b>B</b>
        </TbButton>
        <TbButton
          active={editor.isActive('italic')}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <i>I</i>
        </TbButton>
        <TbButton
          active={editor.isActive('strike')}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        >
          <s>S</s>
        </TbButton>
        <TbButton
          active={editor.isActive('link')}
          onClick={() => {
            const prev = editor.getAttributes('link').href ?? '';
            const url = window.prompt('Link URL', prev);
            if (url === null) return;
            if (url === '') {
              editor.chain().focus().unsetLink().run();
            } else {
              editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
            }
          }}
        >
          🔗
        </TbButton>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}

function TbButton({
  active,
  onClick,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'px-2 py-1 border border-[#EEE6EC] bg-white text-ink-muted hover:text-ink-heading',
        active && 'bg-burgundy text-white border-burgundy hover:text-white',
      )}
    >
      {children}
    </button>
  );
}

// -- Block label ---------------------------------------------------------

function BlockLabel({ text }: { text: string }) {
  return (
    <div className="text-[10px] uppercase tracking-wider text-ink-subtle mb-1 data-num">
      {text}
    </div>
  );
}

// -- Add-block menu ------------------------------------------------------

function generateId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 6)}`;
}

function AddBlockMenu({
  onAdd,
  availableCharts,
  compact,
}: {
  onAdd: (block: Block) => void;
  availableCharts: string[];
  compact?: boolean;
}) {
  function add(type: Block['type']) {
    switch (type) {
      case 'paragraph':
        return onAdd({ id: generateId('p'), type: 'paragraph', html: '' });
      case 'heading':
        return onAdd({
          id: generateId('h'),
          type: 'heading',
          level: 2,
          text: '',
        });
      case 'chart':
        return onAdd({
          id: generateId('c'),
          type: 'chart',
          chartName: availableCharts[0] ?? '',
        });
      case 'callout':
        return onAdd({ id: generateId('co'), type: 'callout', html: '' });
      case 'image':
        return onAdd({
          id: generateId('img'),
          type: 'image',
          src: '',
          alt: '',
        });
    }
  }

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 text-xs',
        compact ? 'opacity-50 hover:opacity-100 transition-opacity' : '',
      )}
    >
      <span className="text-ink-subtle data-num">+</span>
      <AddButton onClick={() => add('paragraph')}>Paragraph</AddButton>
      <AddButton onClick={() => add('heading')}>Heading</AddButton>
      <AddButton onClick={() => add('chart')} disabled={availableCharts.length === 0}>
        Chart
      </AddButton>
      <AddButton onClick={() => add('callout')}>Callout</AddButton>
      <AddButton onClick={() => add('image')}>Image</AddButton>
    </div>
  );
}

function AddButton({
  onClick,
  disabled,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="px-2 py-1 border border-[#EEE6EC] bg-white text-ink-muted hover:text-ink-heading hover:border-burgundy disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
    >
      {children}
    </button>
  );
}

// -- Metadata form -------------------------------------------------------

const STATUS_OPTIONS: ArticleStatus[] = ['draft', 'inner_circle_sent', 'published'];

function MetadataForm({
  metadata,
  onChange,
}: {
  metadata: ArticleMetadata;
  onChange: (m: ArticleMetadata) => void;
}) {
  const set = <K extends keyof ArticleMetadata>(key: K, value: ArticleMetadata[K]) =>
    onChange({ ...metadata, [key]: value });

  return (
    <section className="bg-white border border-[#EEE6EC] p-4 space-y-3">
      <h2 className="text-xs uppercase tracking-wider text-ink-subtle data-num mb-1">
        Metadata
      </h2>
      <Field label="Slug (URL path)" id="md-slug">
        <Input
          id="md-slug"
          type="text"
          value={metadata.slug}
          onChange={(e) =>
            set(
              'slug',
              e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
            )
          }
          className="font-mono"
          pattern="[a-z0-9-]+"
        />
        <p className="mt-1 text-[10px] text-ink-subtle">
          Lowercase letters, digits, and hyphens. Will rename the article folder
          on save. The public URL becomes <code className="font-mono">/articles/{metadata.slug}</code>.
        </p>
      </Field>
      <Field label="Title" id="md-title">
        <Input
          id="md-title"
          type="text"
          value={metadata.title}
          onChange={(e) => set('title', e.target.value)}
        />
      </Field>
      <Field label="Subtitle" id="md-subtitle">
        <Input
          id="md-subtitle"
          type="text"
          value={metadata.subtitle ?? ''}
          onChange={(e) => set('subtitle', e.target.value || undefined)}
        />
      </Field>
      <Field label="Description" id="md-description">
        <Textarea
          id="md-description"
          value={metadata.description ?? ''}
          onChange={(e) => set('description', e.target.value || undefined)}
          rows={2}
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Date">
          <DatePicker
            value={metadata.date}
            onChange={(v) => set('date', v)}
          />
        </Field>
        <Field label="Reading time" id="md-reading">
          <Input
            id="md-reading"
            type="text"
            value={metadata.readingTime ?? ''}
            onChange={(e) => set('readingTime', e.target.value || undefined)}
            placeholder="e.g. 12 min read"
          />
        </Field>
      </div>
      <Field label="Cover image URL" id="md-cover">
        <Input
          id="md-cover"
          type="text"
          value={metadata.cover ?? ''}
          onChange={(e) => set('cover', e.target.value || undefined)}
          className="font-mono"
        />
      </Field>
      <Field label="Tags (comma-separated)" id="md-tags">
        <Input
          id="md-tags"
          type="text"
          value={(metadata.tags ?? []).join(', ')}
          onChange={(e) =>
            set(
              'tags',
              e.target.value
                .split(',')
                .map((t) => t.trim())
                .filter(Boolean),
            )
          }
        />
      </Field>
      <Field label="Status">
        <Select
          value={metadata.status}
          onValueChange={(v) => set('status', v as ArticleStatus)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
    </section>
  );
}

function Field({
  label,
  children,
  id,
}: {
  label: string;
  children: React.ReactNode;
  id?: string;
}) {
  return (
    <div className="space-y-1.5">
      {id ? <Label htmlFor={id}>{label}</Label> : <Label>{label}</Label>}
      {children}
    </div>
  );
}

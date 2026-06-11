'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useEditor, EditorContent, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import {
  Bold,
  Italic,
  Strikethrough,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Link2,
  Minus,
  Quote,
  Image as ImageIcon,
  BarChart3,
  MessageSquareQuote,
  Video as VideoIcon,
} from 'lucide-react';
import type { ArticleMetadata, ArticleStatus } from '@/lib/articles';
import type { ArticleDocument } from '@/lib/article-doc';
import { DEFAULT_AUTHOR, listAuthors } from '@/lib/authors';
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
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/components/ui/tabs';
import {
  ChartNode,
  ImageNode,
  VideoNode,
  CalloutNode,
} from './tiptap-nodes';
import { createSlashCommands } from './slash-menu';

// -- Top-level editor ----------------------------------------------------

export interface RichArticleEditorProps {
  articleId: string;
  initialMetadata: ArticleMetadata;
  initialDocument: ArticleDocument;
  availableCharts: string[];
}

export function RichArticleEditor({
  articleId,
  initialMetadata,
  initialDocument,
  availableCharts,
}: RichArticleEditorProps) {
  const router = useRouter();
  const [metadata, setMetadata] = useState<ArticleMetadata>(initialMetadata);
  const [document, setDocument] = useState<ArticleDocument>(initialDocument);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

  // Track dirty
  useEffect(() => {
    const sameMeta = JSON.stringify(metadata) === JSON.stringify(initialMetadata);
    const sameDoc = JSON.stringify(document) === JSON.stringify(initialDocument);
    setDirty(!(sameMeta && sameDoc));
  }, [metadata, document, initialMetadata, initialDocument]);

  // Warn on nav when dirty
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);

  const extensions = useMemo(
    () => [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        codeBlock: false,
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' },
      }),
      ChartNode,
      ImageNode,
      VideoNode,
      CalloutNode,
      createSlashCommands({ articleId, availableCharts }),
    ],
    [articleId, availableCharts],
  );

  const editor = useEditor({
    extensions,
    content: initialDocument,
    editorProps: {
      attributes: {
        class:
          'prose prose-lg max-w-none focus:outline-none px-6 py-6 min-h-[60vh] bg-white border border-[#EEE6EC]',
      },
    },
    onUpdate({ editor }) {
      setDocument(editor.getJSON() as ArticleDocument);
    },
    immediatelyRender: false,
  });

  async function save() {
    if (saving) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/articles/${articleId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ metadata, document }),
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
      // Slug renames now reuse the same URL (admin paths are keyed by id),
      // so a router.refresh is enough — no replace.
      router.refresh();
    } catch {
      setError('Network error');
    } finally {
      setSaving(false);
    }
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

      {/* Post-save deploy notice. Saves commit to GitHub instantly, but the
          public /articles/[slug] page is served from the deployed bundle,
          so it doesn't reflect the new content until Vercel finishes the
          next build (~1-2 min). The admin already reads from GitHub so
          it's immediately fresh. */}
      {lastSavedAt && !dirty ? (
        <div className="border-l-2 border-burgundy bg-burgundy-lighter/30 px-3 py-2 text-xs text-ink">
          Saved to GitHub. The public page will reflect this once Vercel
          finishes redeploying (~1–2 min). This admin view is already up to
          date.
        </div>
      ) : null}

      <Tabs defaultValue="content">
        <TabsList>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="metadata">Metadata</TabsTrigger>
        </TabsList>
        <TabsContent value="content">
          <section className="space-y-2">
            {editor ? (
              <>
                <Toolbar
                  editor={editor}
                  availableCharts={availableCharts}
                  articleId={articleId}
                />
                <EditorContent editor={editor} />
              </>
            ) : null}
          </section>
        </TabsContent>
        <TabsContent value="metadata">
          <MetadataForm
            metadata={metadata}
            onChange={setMetadata}
            articleId={articleId}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// -- Toolbar -------------------------------------------------------------

function Toolbar({
  editor,
  availableCharts,
  articleId,
}: {
  editor: Editor;
  availableCharts: string[];
  articleId: string;
}) {
  const onLink = useCallback(() => {
    const prev = editor.getAttributes('link').href ?? '';
    const url = window.prompt('Link URL', prev);
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().unsetLink().run();
    } else {
      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    }
  }, [editor]);

  const onInsertChart = useCallback(() => {
    if (availableCharts.length === 0) {
      window.alert(
        `No charts registered for this article. Add a chart component to app/articles/_charts/${articleId}/ first.`,
      );
      return;
    }
    const choice = window.prompt(
      `Insert chart. Available:\n${availableCharts.join('\n')}\n\nType the name:`,
      availableCharts[0],
    );
    if (!choice) return;
    const caption = window.prompt('Caption (optional)') ?? null;
    editor
      .chain()
      .focus()
      .insertContent({
        type: 'chart',
        attrs: { chartName: choice, caption: caption || null },
      })
      .run();
  }, [editor, availableCharts, articleId]);

  const onInsertCallout = useCallback(() => {
    const headline = window.prompt('Headline (optional)') ?? '';
    editor
      .chain()
      .focus()
      .insertContent({
        type: 'callout',
        attrs: { headline: headline || null },
        content: [{ type: 'paragraph' }],
      })
      .run();
  }, [editor]);

  const onInsertImage = useCallback(async () => {
    const url = window.prompt('Image URL (or leave blank to upload below)');
    if (url) {
      const alt = window.prompt('Alt text') ?? '';
      const caption = window.prompt('Caption (optional)') ?? null;
      editor
        .chain()
        .focus()
        .insertContent({
          type: 'image',
          attrs: { src: url, alt: alt || null, caption: caption || null },
        })
        .run();
      return;
    }
    // Upload flow
    const input = window.document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      const form = new FormData();
      form.append('articleId', articleId);
      form.append('file', file);
      const res = await fetch('/api/admin/upload', { method: 'POST', body: form });
      const data = (await res.json()) as { ok: boolean; url?: string; error?: string };
      if (!data.ok || !data.url) {
        window.alert(data.error ?? 'Upload failed');
        return;
      }
      const alt = window.prompt('Alt text') ?? '';
      const caption = window.prompt('Caption (optional)') ?? null;
      editor
        .chain()
        .focus()
        .insertContent({
          type: 'image',
          attrs: { src: data.url, alt: alt || null, caption: caption || null },
        })
        .run();
    };
    input.click();
  }, [editor, articleId]);

  const onInsertVideo = useCallback(() => {
    const url = window.prompt('Video URL (YouTube, Vimeo, or direct MP4)');
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
      .insertContent({
        type: 'video',
        attrs: { src: url, provider, caption: caption || null },
      })
      .run();
  }, [editor]);

  return (
    <div className="sticky top-[60px] z-10 flex flex-wrap gap-1 border border-[#EEE6EC] bg-white p-1.5">
      <TbButton
        active={editor.isActive('bold')}
        onClick={() => editor.chain().focus().toggleBold().run()}
        title="Bold (⌘B)"
      >
        <Bold className="h-3.5 w-3.5" />
      </TbButton>
      <TbButton
        active={editor.isActive('italic')}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        title="Italic (⌘I)"
      >
        <Italic className="h-3.5 w-3.5" />
      </TbButton>
      <TbButton
        active={editor.isActive('strike')}
        onClick={() => editor.chain().focus().toggleStrike().run()}
        title="Strike"
      >
        <Strikethrough className="h-3.5 w-3.5" />
      </TbButton>
      <TbButton
        active={editor.isActive('link')}
        onClick={onLink}
        title="Link"
      >
        <Link2 className="h-3.5 w-3.5" />
      </TbButton>
      <TbDivider />
      <TbButton
        active={editor.isActive('heading', { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        title="Heading 2"
      >
        <Heading2 className="h-3.5 w-3.5" />
      </TbButton>
      <TbButton
        active={editor.isActive('heading', { level: 3 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        title="Heading 3"
      >
        <Heading3 className="h-3.5 w-3.5" />
      </TbButton>
      <TbButton
        active={editor.isActive('bulletList')}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        title="Bullet list"
      >
        <List className="h-3.5 w-3.5" />
      </TbButton>
      <TbButton
        active={editor.isActive('orderedList')}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        title="Numbered list"
      >
        <ListOrdered className="h-3.5 w-3.5" />
      </TbButton>
      <TbButton
        active={editor.isActive('blockquote')}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        title="Blockquote"
      >
        <Quote className="h-3.5 w-3.5" />
      </TbButton>
      <TbButton
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        title="Separator"
      >
        <Minus className="h-3.5 w-3.5" />
      </TbButton>
      <TbDivider />
      <TbButton onClick={onInsertChart} title="Insert chart">
        <BarChart3 className="h-3.5 w-3.5" />
      </TbButton>
      <TbButton onClick={onInsertCallout} title="Insert callout">
        <MessageSquareQuote className="h-3.5 w-3.5" />
      </TbButton>
      <TbButton onClick={onInsertImage} title="Insert image">
        <ImageIcon className="h-3.5 w-3.5" />
      </TbButton>
      <TbButton onClick={onInsertVideo} title="Insert video">
        <VideoIcon className="h-3.5 w-3.5" />
      </TbButton>
    </div>
  );
}

function TbButton({
  active,
  onClick,
  title,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(
        'inline-flex h-7 w-7 items-center justify-center border border-transparent text-ink-muted hover:text-ink-heading hover:bg-[#FAF7F9]',
        active && 'bg-burgundy text-white border-burgundy hover:bg-burgundy hover:text-white',
      )}
    >
      {children}
    </button>
  );
}

function TbDivider() {
  return <div className="mx-1 w-px self-stretch bg-[#EEE6EC]" />;
}

// -- Metadata form (unchanged from the block editor) ---------------------

const STATUS_OPTIONS: ArticleStatus[] = ['draft', 'inner_circle_sent', 'published'];
const AUTHOR_OPTIONS: string[] = listAuthors().map((a) => a.name);

function MetadataForm({
  metadata,
  onChange,
  articleId,
}: {
  metadata: ArticleMetadata;
  onChange: (m: ArticleMetadata) => void;
  articleId: string;
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
          Public URL becomes{' '}
          <code className="font-mono">/articles/{metadata.slug}</code>. The old
          slug keeps 308-redirecting to this one.
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
          <DatePicker value={metadata.date} onChange={(v) => set('date', v)} />
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
      <Field label="Cover image">
        <CoverField
          articleId={articleId}
          value={metadata.cover}
          onChange={(v) => set('cover', v)}
        />
      </Field>
      <Field label="Author" id="md-author">
        <Select
          value={metadata.author ?? DEFAULT_AUTHOR}
          onValueChange={(v) =>
            set('author', v === DEFAULT_AUTHOR ? undefined : v)
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {AUTHOR_OPTIONS.map((a) => (
              <SelectItem key={a} value={a}>
                {a}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="mt-1 text-[10px] text-ink-subtle">
          Author profile + signature rendered at the end of the article.
          Add new authors in <code className="font-mono">lib/authors.ts</code>.
        </p>
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

function CoverField({
  articleId,
  value,
  onChange,
}: {
  articleId: string;
  value?: string;
  onChange: (v: string | undefined) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append('articleId', articleId);
      form.append('kind', 'cover');
      form.append('file', file);
      const res = await fetch('/api/admin/upload', { method: 'POST', body: form });
      const data = (await res.json()) as { ok: boolean; url?: string; error?: string };
      if (!res.ok || !data.ok || !data.url) {
        setError(data.error ?? 'Upload failed');
        return;
      }
      // Cache-bust so the new image shows immediately after overwrite
      onChange(`${data.url}?v=${Date.now()}`);
    } catch {
      setError('Network error');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  return (
    <div className="space-y-2">
      {value ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={value}
          alt="Cover preview"
          className="max-h-40 w-auto border border-[#EEE6EC] bg-[#FAF7F9]"
        />
      ) : null}
      <div className="flex gap-2 items-center">
        <Input
          type="text"
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value || undefined)}
          placeholder="Image URL or upload below"
          className="font-mono text-xs"
        />
        <label
          className={cn(
            'shrink-0 border border-[#EEE6EC] bg-[#FAF7F9] px-3 h-9 text-xs hover:bg-white inline-flex items-center cursor-pointer',
            uploading && 'opacity-50 cursor-not-allowed',
          )}
        >
          {uploading ? 'Uploading…' : 'Upload'}
          <input
            type="file"
            accept="image/*"
            onChange={onPickFile}
            className="hidden"
            disabled={uploading}
          />
        </label>
        {value ? (
          <button
            type="button"
            onClick={() => onChange(undefined)}
            className="shrink-0 border border-[#EEE6EC] bg-white px-3 h-9 text-xs text-ink-muted hover:text-burgundy"
          >
            Clear
          </button>
        ) : null}
      </div>
      {error ? <p className="text-xs text-burgundy">{error}</p> : null}
      <p className="text-[10px] text-ink-subtle">
        Saved under{' '}
        <code className="font-mono">/articles/{articleId}/cover.&lt;ext&gt;</code>{' '}
        — overwrites any previous cover.
      </p>
    </div>
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

'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Search, X } from 'lucide-react';
import type { ArticleMetadata } from '@/lib/articles';
import { formatDate } from '@/lib/format';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

const ALL_YEARS = 'all';

export interface ArticlesSearchProps {
  articles: ArticleMetadata[];
}

export function ArticlesSearch({ articles }: ArticlesSearchProps) {
  const [query, setQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [selectedYear, setSelectedYear] = useState<string>(ALL_YEARS);

  // Derive tag list + year list once from the articles set.
  const { allTags, allYears } = useMemo(() => {
    const tagCount = new Map<string, number>();
    const yearSet = new Set<string>();
    for (const a of articles) {
      for (const t of a.tags ?? []) {
        tagCount.set(t, (tagCount.get(t) ?? 0) + 1);
      }
      yearSet.add(new Date(a.date).getFullYear().toString());
    }
    return {
      allTags: Array.from(tagCount.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([t]) => t),
      allYears: Array.from(yearSet).sort((a, b) => b.localeCompare(a)),
    };
  }, [articles]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return articles.filter((a) => {
      if (selectedYear !== ALL_YEARS) {
        const yr = new Date(a.date).getFullYear().toString();
        if (yr !== selectedYear) return false;
      }
      if (selectedTags.size > 0) {
        const articleTags = new Set(a.tags ?? []);
        for (const t of selectedTags) {
          if (!articleTags.has(t)) return false;
        }
      }
      if (q) {
        const haystack = [
          a.title,
          a.subtitle ?? '',
          a.description ?? '',
          (a.tags ?? []).join(' '),
        ]
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [articles, query, selectedTags, selectedYear]);

  function toggleTag(tag: string) {
    setSelectedTags((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
  }

  const isFiltered =
    query.length > 0 || selectedTags.size > 0 || selectedYear !== ALL_YEARS;

  function reset() {
    setQuery('');
    setSelectedTags(new Set());
    setSelectedYear(ALL_YEARS);
  }

  return (
    <div className="space-y-8">
      {/* Search + year */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-subtle"
            strokeWidth={1.75}
          />
          <Input
            type="search"
            placeholder="Search title, description, or tag…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9 h-10 bg-white"
            aria-label="Search articles"
          />
        </div>
        {allYears.length > 1 ? (
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-full sm:w-40 bg-white">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_YEARS}>All years</SelectItem>
              {allYears.map((y) => (
                <SelectItem key={y} value={y}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : null}
      </div>

      {/* Tag chips */}
      {allTags.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {allTags.map((t) => {
            const active = selectedTags.has(t);
            return (
              <button
                key={t}
                type="button"
                onClick={() => toggleTag(t)}
                aria-pressed={active}
                className={cn(
                  'inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs transition-colors',
                  active
                    ? 'bg-burgundy text-white border-burgundy'
                    : 'bg-white text-ink-muted border-[#EEE6EC] hover:border-burgundy hover:text-burgundy',
                )}
              >
                {t}
                {active ? <X className="h-3 w-3" /> : null}
              </button>
            );
          })}
          {isFiltered ? (
            <button
              type="button"
              onClick={reset}
              className="text-xs text-ink-subtle underline ml-2 self-center hover:text-burgundy transition-colors"
            >
              Reset
            </button>
          ) : null}
        </div>
      ) : null}

      {/* Count */}
      <p className="text-xs text-ink-subtle data-num">
        {filtered.length} of {articles.length} article
        {articles.length === 1 ? '' : 's'}
      </p>

      {/* Result list */}
      {filtered.length === 0 ? (
        <p className="text-ink-muted py-12 text-center">
          No articles match your filters.
        </p>
      ) : (
        <ul>
          {filtered.map((article) => (
            <li
              key={article.slug}
              className="group border-b border-[#EEE6EC] py-5 first:pt-0 last:border-b-0"
            >
              <Link
                href={`/articles/${article.slug}`}
                className="grid grid-cols-[1fr_120px] sm:grid-cols-[1fr_180px] gap-4 sm:gap-6 items-start"
              >
                <div className="min-w-0">
                  <div className="flex items-baseline gap-2 text-[11px] uppercase tracking-wider text-ink-subtle mb-1.5 data-num">
                    <time dateTime={article.date}>{formatDate(article.date)}</time>
                    {article.readingTime ? (
                      <>
                        <span>·</span>
                        <span>{article.readingTime}</span>
                      </>
                    ) : null}
                  </div>
                  <h3 className="font-serif text-lg sm:text-xl tracking-heading leading-snug mb-1.5 text-ink-heading group-hover:text-burgundy transition-colors">
                    {article.title}
                  </h3>
                  <p className="text-xs sm:text-[13px] text-ink-muted leading-relaxed line-clamp-2">
                    {article.description ?? article.subtitle}
                  </p>
                  {article.tags && article.tags.length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {article.tags.map((t) => (
                        <span
                          key={t}
                          className="text-[10px] uppercase tracking-wider text-ink-subtle data-num"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>

                {article.cover ? (
                  <div className="relative aspect-[3/2] overflow-hidden rounded-md bg-burgundy-lighter/40">
                    <Image
                      src={article.cover}
                      alt={article.title}
                      fill
                      sizes="(min-width: 640px) 180px, 120px"
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                  </div>
                ) : (
                  <div className="aspect-[3/2] rounded-md bg-burgundy-lighter/40" />
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

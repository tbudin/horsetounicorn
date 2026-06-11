import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface DataTableColumn<R> {
  /** Header text. */
  header: string;
  /** Cell renderer. Receives the row and rowIndex. */
  render: (row: R, rowIndex: number) => ReactNode;
  /** Cell alignment. Defaults to 'right' (data column). */
  align?: 'left' | 'right' | 'center';
  /** Optional header colour override. */
  headerColor?: string;
}

export interface DataTableProps<R> {
  columns: DataTableColumn<R>[];
  rows: R[];
  /** Optional row highlighter (e.g. to mark a baseline row). */
  highlightRow?: (row: R) => boolean;
}

/**
 * Lightweight data table with consistent typography. Pairs naturally with
 * a ChartCard to show the underlying numbers below a chart.
 */
export function DataTable<R>({ columns, rows, highlightRow }: DataTableProps<R>) {
  return (
    <table className="not-prose my-4 w-full border-collapse text-xs">
      <thead>
        <tr className="border-b border-[#EEE6EC]">
          {columns.map((col, i) => (
            <th
              key={i}
              className="px-1 py-2 text-[10.5px] font-medium uppercase tracking-wider text-ink-subtle"
              style={{
                textAlign: col.align ?? 'right',
                color: col.headerColor,
              }}
            >
              {col.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, rowIdx) => {
          const isHighlighted = highlightRow?.(row) ?? false;
          return (
            <tr
              key={rowIdx}
              className={cn(
                rowIdx !== rows.length - 1 && 'border-b border-[#EEE6EC]',
                isHighlighted && 'bg-[#FAF7F9]',
              )}
            >
              {columns.map((col, colIdx) => (
                <td
                  key={colIdx}
                  className="px-1 py-2.5 text-ink"
                  style={{ textAlign: col.align ?? 'right' }}
                >
                  {col.render(row, rowIdx)}
                </td>
              ))}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

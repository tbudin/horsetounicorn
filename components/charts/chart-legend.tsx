import { cn } from '@/lib/utils';

export interface LegendItem {
  label: string;
  color: string;
  /** Marker shape: 'square' for areas/bars, 'line' for line series. */
  shape?: 'square' | 'line';
}

export interface ChartLegendProps {
  items: LegendItem[];
  /** Where to place the legend relative to the chart. */
  position?: 'top' | 'bottom';
}

/**
 * Horizontal legend for chart series. Place above or below the chart.
 *
 *   <ChartLegend
 *     items={[
 *       { label: 'Pure monthly', color: BURGUNDY, shape: 'line' },
 *       { label: 'Hybrid 3%', color: BLUE, shape: 'line' },
 *     ]}
 *   />
 */
export function ChartLegend({ items, position = 'bottom' }: ChartLegendProps) {
  return (
    <div
      className={cn(
        'flex flex-wrap gap-x-5 gap-y-2 text-xs',
        position === 'bottom' && 'mt-4 border-t border-[#EEE6EC] pt-3.5',
        position === 'top' && 'mb-2',
      )}
    >
      {items.map((item, i) => (
        <div key={i} className="inline-flex items-center gap-1.5">
          <span
            className="inline-block"
            style={{
              width: item.shape === 'line' ? 16 : 12,
              height: item.shape === 'line' ? 3 : 12,
              backgroundColor: item.color,
            }}
          />
          <span className="text-ink">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

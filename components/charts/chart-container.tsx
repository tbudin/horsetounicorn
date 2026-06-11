import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface ChartContainerProps {
  children: ReactNode;
  /** CSS aspect-ratio value. Defaults to '3 / 2' to match the brand. */
  aspect?: string;
  className?: string;
}

/**
 * Aspect-ratio wrapper for a Recharts ResponsiveContainer.
 *
 *   <ChartContainer>
 *     <ResponsiveContainer width="100%" height="100%">
 *       <LineChart data={data}>...</LineChart>
 *     </ResponsiveContainer>
 *   </ChartContainer>
 */
export function ChartContainer({
  children,
  aspect = '3 / 2',
  className,
}: ChartContainerProps) {
  return (
    <div
      className={cn('relative w-full', className)}
      style={{ aspectRatio: aspect }}
    >
      {children}
    </div>
  );
}

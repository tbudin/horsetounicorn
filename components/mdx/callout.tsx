import { Info, Lightbulb, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

const variantStyles = {
  info: 'border-blue bg-blue-lighter/40 text-ink',
  tip: 'border-orange bg-orange-lighter/40 text-ink',
  warning: 'border-burgundy bg-burgundy-lighter/40 text-ink',
};

const icons = {
  info: Info,
  tip: Lightbulb,
  warning: AlertTriangle,
};

export interface CalloutProps {
  variant?: keyof typeof variantStyles;
  title?: string;
  children: React.ReactNode;
}

export function Callout({ variant = 'info', title, children }: CalloutProps) {
  const Icon = icons[variant];
  return (
    <div className={cn('my-6 rounded-md border-l-4 p-4', variantStyles[variant])}>
      <div className="flex items-start gap-3">
        <Icon className="h-5 w-5 mt-0.5 shrink-0" aria-hidden />
        <div className="flex-1">
          {title ? <p className="font-serif text-lg mb-1">{title}</p> : null}
          <div className="text-sm leading-relaxed">{children}</div>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSubscribed } from './subscriber-state';
import { SubscribeDialog } from './subscribe-dialog';

/**
 * Header CTA. For a known subscriber it shows a quiet "Subscribed" badge; for
 * everyone else it's a button that opens the subscribe modal (instead of
 * navigating to the on-page section).
 */
export function SubscribeButton({ className }: { className?: string }) {
  const subscribed = useSubscribed();
  const [open, setOpen] = useState(false);

  if (subscribed) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-ink-subtle data-num">
        <Check className="h-3.5 w-3.5 text-green" strokeWidth={2.25} />
        Subscribed
      </span>
    );
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={cn(className)}>
        Subscribe
      </button>
      <SubscribeDialog open={open} onOpenChange={setOpen} />
    </>
  );
}

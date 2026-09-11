'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { SubscribeForm } from './subscribe-form';

export function SubscribeDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Subscribe to Horse to Unicorn</DialogTitle>
          <DialogDescription>
            One email a week: marketing and systems thinking for technical
            founders and operators. No fluff, unsubscribe in one click.
          </DialogDescription>
        </DialogHeader>
        <SubscribeForm />
      </DialogContent>
    </Dialog>
  );
}

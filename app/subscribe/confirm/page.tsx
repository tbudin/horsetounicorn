import type { Metadata } from 'next';
import { ConfirmForm } from './confirm-form';

export const metadata: Metadata = {
  title: 'Confirm your subscription',
  robots: { index: false, follow: false },
};

export default async function ConfirmPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  return (
    <div className="container max-w-xl py-16 md:py-24">
      <h1 className="font-serif text-3xl md:text-4xl tracking-heading leading-tight mb-3">
        Confirm your subscription
      </h1>
      <p className="text-ink-muted mb-8 leading-relaxed">
        One more click and you're in. We just need to make sure this email is
        really yours.
      </p>
      <ConfirmForm token={token ?? ''} />
    </div>
  );
}

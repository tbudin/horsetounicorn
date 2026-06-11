import type { Metadata } from 'next';
import { UnsubscribeForm } from './unsubscribe-form';

export const metadata: Metadata = {
  title: 'Unsubscribe',
  robots: { index: false, follow: false },
};

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  return (
    <div className="container max-w-xl py-16 md:py-24">
      <h1 className="font-serif text-3xl md:text-4xl tracking-heading leading-tight mb-3">
        Unsubscribe
      </h1>
      <UnsubscribeForm token={token ?? ''} />
    </div>
  );
}

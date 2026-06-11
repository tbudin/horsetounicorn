import type { Metadata } from 'next';
import { LoginForm } from '@/components/admin/login-form';

export const metadata: Metadata = {
  title: 'Admin login',
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  return (
    <div className="min-h-screen flex justify-center px-4 pt-16 md:pt-24">
      <div className="w-full max-w-sm h-fit border border-[#F0E8EE] p-8">
        <h1 className="font-serif text-2xl font-medium text-ink-heading mb-1">
          Sign in to admin
        </h1>
        <p className="text-sm text-ink-muted mb-6">
          Only the password set in <code className="font-mono">ADMIN_PASSWORD</code> works.
        </p>
        <LoginForm next={next} />
      </div>
    </div>
  );
}

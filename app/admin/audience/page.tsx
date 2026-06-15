import { AudienceManager } from '@/components/admin/audience-manager';

export default function AudiencePage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-serif text-3xl font-medium text-ink-heading">Audience</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Manage the subscribers in your Resend audiences.
        </p>
      </header>

      <AudienceManager
        hasMain={Boolean(process.env.RESEND_AUDIENCE_ID)}
        hasInner={Boolean(process.env.RESEND_INNER_CIRCLE_AUDIENCE_ID)}
      />
    </div>
  );
}

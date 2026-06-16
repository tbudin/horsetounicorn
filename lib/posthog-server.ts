/**
 * Minimal server-side PostHog capture (no SDK needed). Uses the public project
 * key — the same ingestion key the browser uses — so no personal API key is
 * required here. Inert until NEXT_PUBLIC_POSTHOG_KEY is set.
 */
export async function capturePostHog(args: {
  event: string;
  distinctId: string;
  properties?: Record<string, unknown>;
  /** ISO timestamp of the event (e.g. the open time). */
  timestamp?: string;
}): Promise<void> {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com';
  try {
    await fetch(`${host.replace(/\/$/, '')}/capture/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: key,
        event: args.event,
        distinct_id: args.distinctId,
        properties: args.properties ?? {},
        ...(args.timestamp ? { timestamp: args.timestamp } : {}),
      }),
    });
  } catch {
    // Best-effort — never let analytics break the caller.
  }
}

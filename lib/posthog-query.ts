/**
 * Read-side PostHog access for the in-admin analytics. Runs HogQL via the
 * Query API using the server-only Personal API key. Returns null when not
 * configured so callers degrade gracefully.
 */
export function posthogQueryConfigured(): boolean {
  return Boolean(process.env.POSTHOG_PERSONAL_API_KEY && process.env.POSTHOG_PROJECT_ID);
}

export async function hogql<T = Record<string, unknown>>(
  query: string,
): Promise<T[] | null> {
  const key = process.env.POSTHOG_PERSONAL_API_KEY;
  const project = process.env.POSTHOG_PROJECT_ID;
  if (!key || !project) return null;
  const host = (process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com').replace(
    /\/$/,
    '',
  );

  const res = await fetch(`${host}/api/projects/${project}/query/`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: { kind: 'HogQLQuery', query } }),
  });
  if (!res.ok) {
    throw new Error(`PostHog query failed (${res.status})`);
  }
  const data = (await res.json()) as { columns?: string[]; results?: unknown[][] };
  const cols = data.columns ?? [];
  return (data.results ?? []).map(
    (row) => Object.fromEntries(cols.map((c, i) => [c, row[i]])) as T,
  );
}

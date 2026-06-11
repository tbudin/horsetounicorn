/**
 * Pull every contact from the configured Resend audience and dump them to
 * a timestamped JSON file under ./backups/. Keeps a belt-and-braces local
 * copy in case the Resend account is ever locked or the data needs to
 * migrate.
 *
 * Usage:
 *   pnpm backup:subscribers              # writes ./backups/subscribers-YYYY-MM-DD.json
 *   pnpm backup:subscribers --print      # also prints to stdout
 *   pnpm backup:subscribers --inner      # backs up RESEND_INNER_CIRCLE_AUDIENCE_ID instead
 */
import fs from 'node:fs';
import path from 'node:path';
import { Resend } from 'resend';

const PRINT = process.argv.includes('--print');
const INNER = process.argv.includes('--inner');

const apiKey = process.env.RESEND_API_KEY;
if (!apiKey) {
  console.error('RESEND_API_KEY is not set. Backup aborted.');
  process.exit(1);
}
const audienceId = INNER
  ? process.env.RESEND_INNER_CIRCLE_AUDIENCE_ID
  : process.env.RESEND_AUDIENCE_ID;
if (!audienceId) {
  console.error(
    `${INNER ? 'RESEND_INNER_CIRCLE_AUDIENCE_ID' : 'RESEND_AUDIENCE_ID'} is not set. Backup aborted.`,
  );
  process.exit(1);
}

const resend = new Resend(apiKey);

interface Contact {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  created_at: string;
  unsubscribed: boolean;
}

async function main() {
  const { data, error } = await resend.contacts.list({ audienceId: audienceId as string });
  if (error) {
    console.error('Resend error:', error.message);
    process.exit(1);
  }

  // Resend's typings for contacts.list aren't great — be defensive about the shape.
  const list = (data?.data ?? []) as Contact[];

  const today = new Date().toISOString().slice(0, 10);
  const label = INNER ? 'inner-circle' : 'subscribers';
  const backupsDir = path.join(process.cwd(), 'backups');
  fs.mkdirSync(backupsDir, { recursive: true });
  const file = path.join(backupsDir, `${label}-${today}.json`);

  const payload = {
    exportedAt: new Date().toISOString(),
    audienceId,
    total: list.length,
    subscribed: list.filter((c) => !c.unsubscribed).length,
    unsubscribed: list.filter((c) => c.unsubscribed).length,
    contacts: list.map((c) => ({
      id: c.id,
      email: c.email,
      firstName: c.first_name ?? undefined,
      lastName: c.last_name ?? undefined,
      createdAt: c.created_at,
      unsubscribed: c.unsubscribed,
    })),
  };

  fs.writeFileSync(file, JSON.stringify(payload, null, 2) + '\n', 'utf8');
  if (PRINT) {
    console.log(JSON.stringify(payload, null, 2));
  }
  console.log(`Wrote ${payload.subscribed} active + ${payload.unsubscribed} unsubscribed → ${file}`);
}

main().catch((err) => {
  console.error('backup-subscribers failed:', err);
  process.exit(1);
});

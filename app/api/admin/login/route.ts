import { NextResponse } from 'next/server';
import { z } from 'zod';
import { ADMIN_COOKIE, SESSION_TTL, signSession, verifyPassword } from '@/lib/admin-auth';

const Body = z.object({
  password: z.string().min(1),
  next: z.string().optional(),
});

export async function POST(req: Request) {
  let body: z.infer<typeof Body>;
  try {
    body = Body.parse(await req.json());
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid body' }, { status: 400 });
  }

  if (!verifyPassword(body.password)) {
    // Tiny delay to slow down brute-force attempts a bit.
    await new Promise((r) => setTimeout(r, 250));
    return NextResponse.json(
      { ok: false, error: 'Wrong password' },
      { status: 401 },
    );
  }

  const token = await signSession();
  const res = NextResponse.json({ ok: true, next: body.next ?? '/admin' });
  res.cookies.set({
    name: ADMIN_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_TTL,
  });
  return res;
}

import { cookies } from 'next/headers';
import { Octokit } from '@octokit/rest';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const { token } = await req.json();
  if (!token || typeof token !== 'string') {
    return NextResponse.json({ error: 'Missing token' }, { status: 400 });
  }

  // Validate by calling /user
  const octokit = new Octokit({ auth: token });
  try {
    const { data: user } = await octokit.users.getAuthenticated();
    // Also check what scopes the token has
    const { headers } = await octokit.users.getAuthenticated();
    const scopes = (headers['x-oauth-scopes'] as string) || '';

    const res = NextResponse.json({
      login: user.login,
      name: user.name,
      avatar_url: user.avatar_url,
      scopes: scopes.split(',').map((s) => s.trim()).filter(Boolean),
    });
    res.cookies.set('gpush_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365, // 1 year — PATs are long-lived
    });
    return res;
  } catch (e: any) {
    return NextResponse.json(
      { error: 'Invalid token. Make sure it has `repo` scope.' },
      { status: 401 }
    );
  }
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete('gpush_token');
  return res;
}
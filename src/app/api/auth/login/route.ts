import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  const clientId = process.env.GITHUB_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json(
      { error: 'GITHUB_CLIENT_ID not configured. See .env.example.' },
      { status: 500 }
    );
  }

  // Build redirect_uri from the actual request — works on any deployment (Vercel, localhost, preview)
  const origin = new URL(req.url).origin;
  const redirectUri = `${origin}/api/auth/callback`;

  // Log to help debug GitHub OAuth callback URL mismatches
  console.log('[oauth] redirect_uri being sent:', redirectUri);
  console.log('[oauth] expected callback URL in GitHub app settings:', redirectUri);

  const state = crypto.randomUUID();
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: 'repo read:user workflow',
    state,
    allow_signup: 'true',
  });

  const res = NextResponse.redirect(
    `https://github.com/login/oauth/authorize?${params.toString()}`
  );
  res.cookies.set('gpush_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600,
  });

  return res;
}
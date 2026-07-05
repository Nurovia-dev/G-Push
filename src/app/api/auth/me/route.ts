import { cookies } from 'next/headers';
import { Octokit } from '@octokit/rest';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET() {
  const token = cookies().get('gpush_token')?.value;
  if (!token) {
    return NextResponse.json({ authed: false });
  }
  // Try to fetch user info to confirm token works.
  try {
    const octokit = new Octokit({ auth: token });
    const { data: user } = await octokit.users.getAuthenticated();
    return NextResponse.json({
      authed: true,
      user: {
        login: user.login,
        name: user.name,
        avatar_url: user.avatar_url,
      },
    });
  } catch {
    // Token stored but invalid. Clear it.
    const res = NextResponse.json({ authed: false });
    res.cookies.delete('gpush_token');
    return res;
  }
}
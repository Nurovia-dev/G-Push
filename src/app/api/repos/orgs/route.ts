/**
 * List GitHub orgs the authenticated user can push to.
 *
 * Returns orgs where the user has at least `member` role.
 * The user's personal account is NOT included — the wizard adds it as a
 * "Personal" option separately.
 *
 * Used by the wizard's owner picker to let users choose between their
 * personal repos and one of their orgs.
 */

import { cookies } from 'next/headers';
import { Octokit } from '@octokit/rest';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function GET() {
  const token = cookies().get('gpush_token')?.value;
  if (!token) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const octokit = new Octokit({ auth: token });

  try {
    const { data: orgs } = await octokit.orgs.listForAuthenticatedUser({
      per_page: 100,
    });

    return NextResponse.json({
      orgs: orgs.map((o) => ({
        login: o.login,
        id: o.id,
        avatar_url: o.avatar_url,
        description: o.description,
      })),
      total: orgs.length,
    });
  } catch (e: any) {
    if (e?.status === 403) {
      // PAT doesn't have `read:org` scope — fall back to empty list
      return NextResponse.json({
        orgs: [],
        total: 0,
        hint: 'Your token lacks `read:org` scope. Personal repos still work.',
      });
    }
    return NextResponse.json(
      { error: e?.message ?? 'unknown' },
      { status: e?.status ?? 500 }
    );
  }
}
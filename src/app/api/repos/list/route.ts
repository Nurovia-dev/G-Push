import { cookies } from 'next/headers';
import { Octokit } from '@octokit/rest';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 60;

const TIMEOUT_MS = 30000; // 30s — long enough for slow networks, short enough to fail fast

async function fetchWithTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: NodeJS.Timeout | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () => reject(new Error(`${label} timed out after ${ms / 1000}s — can't reach api.github.com`)),
      ms
    );
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export async function GET(req: Request) {
  const token = cookies().get('gpush_token')?.value;
  if (!token) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const url = new URL(req.url);
  const search = url.searchParams.get('q') || '';
  const sort = (url.searchParams.get('sort') as 'updated' | 'created' | 'pushed') || 'updated';
  /**
   * Optional owner filter:
   *   - 'me'          → only repos owned by the authenticated user
   *   - 'org:<login>' → only repos in that org
   *   - omitted       → all repos (personal + orgs)
   */
  const owner = url.searchParams.get('owner') || '';

  // Respect HTTPS_PROXY / HTTP_PROXY / NO_PROXY env vars (set by user or system)
  const proxyUrl =
    process.env.HTTPS_PROXY ||
    process.env.https_proxy ||
    process.env.HTTP_PROXY ||
    process.env.http_proxy;

  const octokit = new Octokit({
    auth: token,
    request: {
      fetch: (url: string | URL | Request, opts: RequestInit = {}) => {
        // Node 18+ global fetch will pick up HTTPS_PROXY automatically.
        // We just add an explicit timeout via AbortController.
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
        return fetch(url as RequestInfo, { ...opts, signal: controller.signal }).finally(() =>
          clearTimeout(timer)
        );
      },
    },
  });

  try {
    // Branch by filter mode. `listForAuthenticatedUser` returns a mix of
    // personal + org repos (when affiliation includes organization_member),
    // so the `me` filter is local. `org:<login>` requires a separate call.
    let rawRepos: any[] = [];
    if (owner.startsWith('org:')) {
      const orgLogin = owner.slice(4);
      const { data: orgRepos } = await fetchWithTimeout(
        octokit.repos.listForOrg({
          org: orgLogin,
          sort,
          per_page: 100,
        }),
        TIMEOUT_MS,
        `List repos for org ${orgLogin}`
      );
      rawRepos = orgRepos as any[];
    } else {
      const { data: repos } = await fetchWithTimeout(
        octokit.repos.listForAuthenticatedUser({
          sort,
          per_page: 100,
          affiliation: 'owner,collaborator,organization_member',
        }),
        TIMEOUT_MS,
        'List repos'
      );
      rawRepos = (repos as any[]).filter((r) => {
        if (owner === 'me') {
          // Only personal repos (not org repos)
          return !r.owner || r.owner.type === 'User';
        }
        return true; // no filter — return everything
      });
    }

    const filtered = search
      ? rawRepos.filter(
          (r) =>
            r.full_name.toLowerCase().includes(search.toLowerCase()) ||
            (r.description || '').toLowerCase().includes(search.toLowerCase())
        )
      : rawRepos;

    return NextResponse.json({
      repos: filtered.map((r) => ({
        id: r.id,
        name: r.name,
        full_name: r.full_name,
        description: r.description,
        private: r.private,
        html_url: r.html_url,
        language: r.language,
        stargazers_count: r.stargazers_count,
        updated_at: r.updated_at,
        default_branch: r.default_branch,
        owner_type: r.owner?.type ?? 'User',
        owner_login: r.owner?.login ?? '',
        owner_avatar: r.owner?.avatar_url ?? '',
      })),
      total: filtered.length,
      proxy_used: !!proxyUrl,
    });
  } catch (e: any) {
    const msg = e?.message || 'Unknown error';
    const status = e?.status;

    // Helpful error messages
    if (
      msg.includes('ETIMEDOUT') ||
      msg.includes('ECONNREFUSED') ||
      msg.includes('ENOTFOUND') ||
      msg.includes('aborted') ||
      msg.includes('timed out')
    ) {
      return NextResponse.json(
        {
          error: 'cant_reach_github',
          message: `Can't reach api.github.com from this server.`,
          cause: msg,
          hints: [
            proxyUrl
              ? `Proxy is set to ${proxyUrl} — verify it allows api.github.com`
              : 'If you are behind a firewall or VPN, set HTTPS_PROXY=http://proxy:port and restart the server',
            'Test connectivity: curl -v https://api.github.com/zen',
            'Some regions block GitHub — check your ISP or use a VPN',
          ],
        },
        { status: 503 }
      );
    }

    if (status === 401) {
      return NextResponse.json(
        {
          error: 'invalid_token',
          message: 'GitHub rejected the token. It may have been revoked. Reconnect in /settings.',
        },
        { status: 401 }
      );
    }

    return NextResponse.json({ error: 'github_error', message: msg }, { status: 500 });
  }
}
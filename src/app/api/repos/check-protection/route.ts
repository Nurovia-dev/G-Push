/**
 * Check repo metadata: default branch, branch protection status, push strategy options.
 *
 * Used by the wizard to:
 *   - Show "branch is protected — consider PR mode" warning
 *   - Detect existing repos that need wipe vs force
 *   - Show repo stats (last commit, size)
 */

import { cookies } from 'next/headers';
import { Octokit } from '@octokit/rest';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

interface RepoCheckResponse {
  ok: boolean;
  exists: boolean;
  isPrivate: boolean;
  defaultBranch: string;
  isProtected: boolean;
  /** Protection rule summary (if any) */
  protection?: {
    requiresReview: boolean;
    requiresStatusChecks: boolean;
    restrictsPushes: boolean;
    allowsForcePushes: boolean;
  };
  /** Last commit info */
  lastCommit?: {
    sha: string;
    message: string;
    author: string;
    date: string;
  };
  /** File count (approximate, from default branch tree) */
  fileCount?: number;
  /** Recommendation based on checks */
  recommendation?: {
    strategy: 'normal' | 'force' | 'wipe' | 'pr';
    reason: string;
  };
}

export async function GET(req: Request) {
  const token = cookies().get('gpush_token')?.value;
  if (!token) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const url = new URL(req.url);
  const owner = url.searchParams.get('owner');
  const repo = url.searchParams.get('repo');

  if (!owner || !repo) {
    return NextResponse.json({ error: 'owner and repo required' }, { status: 400 });
  }

  const octokit = new Octokit({ auth: token });

  try {
    // 1. Get repo info
    const { data: repoInfo } = await octokit.repos.get({ owner, repo });
    const defaultBranch = repoInfo.default_branch;

    // 2. Check branch protection
    let isProtected = false;
    let protection: RepoCheckResponse['protection'] | undefined;
    try {
      const { data: prot } = await octokit.repos.getBranchProtection({
        owner,
        repo,
        branch: defaultBranch,
      });
      isProtected = !!(prot.required_pull_request_reviews || prot.required_status_checks || prot.restrictions);
      protection = {
        requiresReview: !!prot.required_pull_request_reviews,
        requiresStatusChecks: !!prot.required_status_checks,
        restrictsPushes: !!prot.restrictions,
        allowsForcePushes: !!prot.allow_force_pushes?.enabled,
      };
    } catch (e: any) {
      // 404 means no protection — fine
      if (e?.status !== 404) {
        console.warn('[gpush] protection check failed:', e?.status);
      }
    }

    // 3. Get last commit (for display)
    let lastCommit: RepoCheckResponse['lastCommit'];
    try {
      const { data: commit } = await octokit.repos.getCommit({
        owner,
        repo,
        ref: defaultBranch,
      });
      lastCommit = {
        sha: commit.sha,
        message: commit.commit.message.split('\n')[0],
        author: commit.commit.author?.name ?? 'unknown',
        date: commit.commit.author?.date ?? '',
      };
    } catch {
      // empty repo — no commits
    }

    // 4. Count files in default branch
    let fileCount: number | undefined;
    try {
      const { data: tree } = await octokit.git.getTree({
        owner,
        repo,
        tree_sha: defaultBranch,
        recursive: 'false',
      });
      fileCount = tree.truncated ? undefined : tree.tree.length;
    } catch {
      // ok
    }

    // 5. Recommend a push strategy
    let recommendation: RepoCheckResponse['recommendation'];
    if (isProtected) {
      recommendation = {
        strategy: 'pr',
        reason: `Branch '${defaultBranch}' is protected. PR mode will push to a new branch and open a pull request.`,
      };
    } else if (protection?.allowsForcePushes) {
      recommendation = {
        strategy: 'force',
        reason: 'Branch allows force-push. You can safely use Force strategy to overwrite history.',
      };
    } else if ((fileCount ?? 0) > 1000) {
      recommendation = {
        strategy: 'normal',
        reason: `Repo has ${fileCount}+ files. Normal strategy will fail (not a fast-forward). Consider Wipe.`,
      };
    } else {
      recommendation = {
        strategy: 'normal',
        reason: 'No protection. Normal strategy should work if your commit is a fast-forward.',
      };
    }

    const body: RepoCheckResponse = {
      ok: true,
      exists: true,
      isPrivate: repoInfo.private,
      defaultBranch,
      isProtected,
      protection,
      lastCommit,
      fileCount,
      recommendation,
    };

    return NextResponse.json(body);
  } catch (e: any) {
    if (e?.status === 404) {
      return NextResponse.json({
        ok: true,
        exists: false,
        isPrivate: false,
        defaultBranch: 'main',
        isProtected: false,
      } as RepoCheckResponse);
    }
    return NextResponse.json(
      { ok: false, error: e?.message ?? 'unknown' },
      { status: e?.status ?? 500 }
    );
  }
}
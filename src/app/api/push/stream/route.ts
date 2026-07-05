import { cookies } from 'next/headers';
import { Octokit } from '@octokit/rest';
import { NextResponse } from 'next/server';
import { classifyFile } from '@/lib/file-filter';
import { translateError } from '@/lib/github-errors';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
// Allow up to 5 minutes on Vercel Pro. On Hobby this caps at 60s.
// Default is 10s — too short for a 67-file push (blob uploads + tree + commit + ref).
export const maxDuration = 300;

type PushRequest = {
  owner: string;
  repo: string;
  ownerType?: 'User' | 'Organization';
  description?: string;
  visibility: 'public' | 'private';
  license: string;
  isNewRepo?: boolean;
  files: { path: string; content: string }[];
  commitMessage: string;
  pushStrategy: 'normal' | 'force' | 'wipe' | 'pr';
  /** Resume support: blob SHAs already uploaded in a previous attempt */
  existingBlobs?: Record<string, string>;
  /** Auto-generated file flags — included in PR body */
  generateReadme?: boolean;
  generateLicense?: boolean;
  generateGitignore?: boolean;
};

const PER_REQUEST_TIMEOUT_MS = 60_000;      // 1 min per blob/tree/commit call
const RETRY_MAX = 3;                        // retry connection errors
const RETRY_BACKOFF_MS = 1500;              // exponential: 1.5s, 3s, 4.5s

// Custom fetch wrapper: explicit timeout + retry on transient connection errors
async function fetchWithRetry(
  url: string,
  init: RequestInit = {},
  label: string
): Promise<Response> {
  let lastErr: any;
  for (let attempt = 1; attempt <= RETRY_MAX; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), PER_REQUEST_TIMEOUT_MS);

    try {
      const res = await fetch(url, { ...init, signal: controller.signal });
      clearTimeout(timer);
      // GitHub returns 5xx on transient errors — retry those too
      if (res.status >= 500 && res.status < 600 && attempt < RETRY_MAX) {
        await sleep(RETRY_BACKOFF_MS * attempt);
        continue;
      }
      return res;
    } catch (e: any) {
      clearTimeout(timer);
      lastErr = e;

      const msg = String(e?.message || e);
      const isTimeout = msg.includes('aborted') || msg.includes('timed out') || e?.name === 'AbortError';
      const isConnError =
        msg.includes('ETIMEDOUT') ||
        msg.includes('ECONNRESET') ||
        msg.includes('ECONNREFUSED') ||
        msg.includes('ENOTFOUND') ||
        msg.includes('fetch failed');

      if ((isTimeout || isConnError) && attempt < RETRY_MAX) {
        await sleep(RETRY_BACKOFF_MS * attempt);
        continue;
      }
      throw e;
    }
  }
  throw lastErr;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// SHA-256 hash for content dedup
async function sha256(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function POST(req: Request) {
  const token = cookies().get('gpush_token')?.value;
  if (!token) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const body: PushRequest = await req.json();

  const octokit = new Octokit({
    auth: token,
    request: {
      fetch: (url: any, opts: any = {}) =>
        fetchWithRetry(String(url), opts, String(url)),
    },
    throttle: {
      onRateLimit: (retryAfter: number, options: any, octokit: Octokit, retryCount: number) => {
        // Honor GitHub's Retry-After header automatically
        octokit.log.warn(`Rate limit hit, retrying after ${retryAfter}s`);
        return retryCount < 3;
      },
      onSecondaryRateLimit: (retryAfter: number, options: any, octokit: Octokit, retryCount: number) => {
        octokit.log.warn(`Secondary rate limit, retrying after ${retryAfter}s`);
        return retryCount < 3;
      },
    },
  });

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: object) => {
        try {
          controller.enqueue(
            encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
          );
        } catch {
          // Client disconnected; abort silently
        }
      };

      // Translate Octokit HTTP errors into user-friendly messages
      const handleOctokitError = (e: any): never => {
        const status: number = e?.status ?? 0;
        const rawBody: string =
          typeof e?.response?.data === 'string'
            ? e.response.data
            : JSON.stringify(e?.response?.data ?? {});
        const translated = translateError(status, rawBody || e?.message || '');
        send('error', {
          message: translated.friendly,
          code: translated.kind,
          kind: translated.kind,
          suggestion: translated.suggestion,
          retryable: translated.retryable,
          status: translated.status,
          hints:
            translated.kind === 'permission'
              ? [
                  'Go to https://github.com/settings/tokens',
                  'Edit your token (or generate new)',
                  'Enable the `repo` scope (and `delete_repo` for Wipe strategy)',
                  'Paste new token at /settings in G-Push',
                ]
              : translated.kind === 'branch-protection'
              ? [
                  'The main branch is protected',
                  'Switch to PR mode in the wizard',
                  'G-Push will push to a branch and open a pull request',
                ]
              : translated.kind === 'exists'
              ? [
                  'A repo with this name already exists',
                  'Pick a different name, or switch to the Wipe strategy',
                ]
              : translated.kind === 'auth'
              ? ['Your token expired or was revoked', 'Sign in again at /settings']
              : translated.kind === 'rate-limit'
              ? ['Wait 5-10 minutes and try again', 'Authenticate for higher limits']
              : undefined,
        });
        throw e;
      };

      try {
        // Step 1: ensure repo exists
        send('progress', { message: `Checking ${body.owner}/${body.repo}…` });
        let exists = false;
        let baseBranch = 'main';
        try {
          const { data: repoInfo } = await octokit.repos.get({
            owner: body.owner,
            repo: body.repo,
          });
          exists = true;
          baseBranch = repoInfo.default_branch ?? 'main';
        } catch (e: any) {
          if (e.status !== 404) throw e;
        }

        if (!exists) {
          send('progress', { message: `Creating repo ${body.repo}…` });
          // Use createInOrg for orgs, createForAuthenticatedUser for personal accounts
          if (body.ownerType === 'Organization') {
            await octokit.repos.createInOrg({
              org: body.owner,
              name: body.repo,
              description: body.description || undefined,
              private: body.visibility === 'private',
              auto_init: true,
            });
          } else {
            await octokit.repos.createForAuthenticatedUser({
              name: body.repo,
              description: body.description || undefined,
              private: body.visibility === 'private',
              auto_init: true,
            });
          }
          send('progress', { message: `✓ Repo created under ${body.ownerType === 'Organization' ? 'org' : 'personal'} account` });
        } else if (body.isNewRepo) {
          throw new Error(
            `Repo ${body.owner}/${body.repo} already exists. Pick a different name or use --wipe.`
          );
        } else {
          send('progress', { message: `✓ Repo already exists` });
        }

        // Step 2: handle wipe strategy.
        // We do a "nuclear" wipe: delete the entire repo and recreate it.
        // This guarantees all branches, tags, releases, settings, and
        // underlying git objects are gone. The only things preserved are
        // issues, PRs, and discussions (they're tied to repo name, not ID).
        if (body.pushStrategy === 'wipe') {
          send('progress', { message: 'Wiping repo (delete + recreate)…' });

          let deleted = false;
          try {
            await octokit.repos.delete({
              owner: body.owner,
              repo: body.repo,
            });
            deleted = true;
            send('progress', { message: '✓ Repo deleted' });
            // Give GitHub a moment to process the delete (background async op)
            await new Promise((r) => setTimeout(r, 2500));
          } catch (e: any) {
            send('progress', { message: `⚠ Could not delete repo: ${e.message}. Falling back to branch-by-branch wipe.` });

            // Fallback: delete all branches + tags manually
            try {
              const { data: branches } = await octokit.repos.listBranches({
                owner: body.owner,
                repo: body.repo,
                per_page: 100,
              });
              for (const branch of branches) {
                try {
                  await octokit.git.deleteRef({
                    owner: body.owner,
                    repo: body.repo,
                    ref: `heads/${branch.name}`,
                  });
                } catch {}
              }
              send('progress', { message: `✓ Deleted ${branches.length} branch${branches.length !== 1 ? 'es' : ''}` });
            } catch {}

            try {
              const { data: tags } = await octokit.repos.listTags({
                owner: body.owner,
                repo: body.repo,
                per_page: 100,
              });
              for (const tag of tags) {
                try {
                  await octokit.git.deleteRef({
                    owner: body.owner,
                    repo: body.repo,
                    ref: `tags/${tag.name}`,
                  });
                } catch {}
              }
              if (tags.length > 0) {
                send('progress', { message: `✓ Deleted ${tags.length} tag${tags.length !== 1 ? 's' : ''}` });
              }
            } catch {}
          }

          // Recreate the repo if we deleted it
          if (deleted) {
            try {
              if (body.ownerType === 'Organization') {
                await octokit.repos.createInOrg({
                  org: body.owner,
                  name: body.repo,
                  description: body.description || undefined,
                  private: body.visibility === 'private',
                  auto_init: true,
                });
              } else {
                await octokit.repos.createForAuthenticatedUser({
                  name: body.repo,
                  description: body.description || undefined,
                  private: body.visibility === 'private',
                  auto_init: true,
                });
              }
              send('progress', { message: '✓ Repo recreated (fresh)' });
              // Wait for auto_init to complete
              await new Promise((r) => setTimeout(r, 1500));
            } catch (e: any) {
              throw new Error(`Could not recreate repo after wipe: ${e.message}`);
            }
          }
        }

        // Step 3: get base SHA — only if NOT wiping.
        // After a nuclear wipe, we always start from a clean tree, never
        // inheriting auto_init's README/LICENSE.
        let baseSha: string | undefined;
        if (body.pushStrategy !== 'wipe') {
          send('progress', { message: 'Resolving base commit…' });
          for (const branch of ['main', 'master']) {
            try {
              const { data: ref } = await octokit.git.getRef({
                owner: body.owner,
                repo: body.repo,
                ref: `heads/${branch}`,
              });
              baseSha = ref.object.sha;
              break;
            } catch {}
          }
        } else {
          // For wipe, delete any auto_init branch so createRef succeeds cleanly
          for (const branch of ['main', 'master']) {
            try {
              await octokit.git.deleteRef({
                owner: body.owner,
                repo: body.repo,
                ref: `heads/${branch}`,
              });
            } catch {}
          }
        }

        // Step 4: upload blobs (batched, with concurrency + dedup)
        const total = body.files.length;

        // Deduplicate: hash identical content, only upload once
        const startTs = Date.now();
        const contentHashes = new Map<string, string>(); // sha256 -> blob SHA from GitHub
        const blobs: { path: string; sha: string }[] = [];
        const CONCURRENCY = 6;
        let uploaded = 0;
        let skipped = 0;
        let failed = 0;

        // First pass: server-side defense-in-depth filter — drop dangerous files that
        // slipped past the client pre-flight (in case of tampering, bugs, or
        // custom clients).
        const safeFiles = body.files.filter((f) => {
          const verdict = classifyFile(f.path);
          if (verdict.category === 'dangerous') {
            console.warn(`[gpush] Blocked dangerous file from push: ${f.path} (${verdict.matchedRule})`);
            return false;
          }
          return true;
        });
        const blockedDangerous = body.files.length - safeFiles.length;
        if (blockedDangerous > 0) {
          send('progress', {
            message: `🚫 Server blocked ${blockedDangerous} dangerous file${blockedDangerous === 1 ? '' : 's'} (server-side filter)`,
          });
        }

        // Then: skip empty files (they'd produce empty blobs that GitHub rejects)
        const nonEmptyFiles = safeFiles.filter((f) => f.content.length > 0);
        skipped = safeFiles.length - nonEmptyFiles.length;
        if (skipped > 0) {
          send('progress', { message: `Skipping ${skipped} empty file${skipped !== 1 ? 's' : ''}` });
        }

        send('progress', {
          message: `Uploading ${nonEmptyFiles.length} file${nonEmptyFiles.length !== 1 ? 's' : ''}…`,
        });

        // Pre-compute hashes in parallel (CPU-bound, fast)
        const filesWithHash = await Promise.all(
          nonEmptyFiles.map(async (f) => {
            const hash = await sha256(f.content);
            return { ...f, hash };
          })
        );

        // Process files in batches of CONCURRENCY
        // Resume support: if path is in body.existingBlobs, reuse the SHA
        const existingBlobs: Record<string, string> = body.existingBlobs ?? {};
        let skippedExisting = 0;

        for (let i = 0; i < filesWithHash.length; i += CONCURRENCY) {
          const batch = filesWithHash.slice(i, i + CONCURRENCY);
          const results = await Promise.allSettled(
            batch.map(async (f) => {
              // 1. If a previous push already uploaded this path, reuse the SHA
              if (existingBlobs[f.path]) {
                skippedExisting++;
                return { path: f.path, sha: existingBlobs[f.path] };
              }
              // 2. If we've already uploaded this exact content in this session, reuse the SHA
              let sha = contentHashes.get(f.hash);
              if (!sha) {
                const { data } = await octokit.git.createBlob({
                  owner: body.owner,
                  repo: body.repo,
                  content: f.content,
                  encoding: 'utf-8',
                });
                sha = data.sha;
                contentHashes.set(f.hash, sha);
              }
              return { path: f.path, sha };
            })
          );

          for (const r of results) {
            if (r.status === 'fulfilled') {
              blobs.push(r.value);
            } else {
              failed++;
            }
          }

          uploaded += batch.length;
          const elapsed = (Date.now() - startTs) / 1000;
          const rate = uploaded / elapsed;
          const remaining = (filesWithHash.length - uploaded) / rate;
          send('progress', {
            message: `Uploading ${uploaded}/${filesWithHash.length} file${filesWithHash.length !== 1 ? 's' : ''}… (${rate.toFixed(1)}/s, ~${Math.ceil(remaining)}s left)`,
          });
        }

        if (blobs.length === 0) {
          throw new Error('All blob uploads failed — connection issue?');
        }
        const deduped = nonEmptyFiles.length - contentHashes.size;
        if (failed > 0) {
          send('progress', {
            message: `⚠ ${failed}/${total} files failed to upload (continuing with ${blobs.length})`,
          });
        } else if (deduped > 0) {
          send('progress', {
            message: `✓ ${contentHashes.size} unique blobs (${deduped} deduped), ${blobs.length} total`,
          });
        } else {
          send('progress', { message: `✓ ${blobs.length} blobs uploaded` });
        }

        // Step 5: create tree
        send('progress', { message: 'Building tree…' });
        // For wipe mode, build a fresh tree with NO base (no auto_init README/LICENSE inheritance)
        // For other modes, build on top of the existing tree
        const treeParams: any = {
          owner: body.owner,
          repo: body.repo,
          tree: blobs.map((b) => ({
            path: b.path,
            mode: '100644',
            type: 'blob',
            sha: b.sha,
          })),
        };
        if (baseSha) {
          treeParams.base_tree = baseSha;
        }
        const { data: tree } = await octokit.git.createTree(treeParams);
        send('progress', { message: `✓ Tree ${tree.sha.slice(0, 7)}` });

        if (skippedExisting > 0) {
          send('progress', {
            message: `♻ Resumed: reused ${skippedExisting} previously-uploaded file${skippedExisting === 1 ? '' : 's'}`,
          });
        }

        // Step 6: create commit
        send('progress', { message: 'Creating commit…' });
        const { data: commit } = await octokit.git.createCommit({
          owner: body.owner,
          repo: body.repo,
          message: body.commitMessage,
          tree: tree.sha,
          parents: baseSha ? [baseSha] : [],
        });
        send('progress', { message: `✓ Commit ${commit.sha.slice(0, 7)}` });

        // Step 7: create or update ref
        send('progress', { message: `Pushing to ${body.pushStrategy === 'pr' ? 'feature branch' : 'main'}…` });

        // PR mode: push to a new branch off main, then open a PR
        if (body.pushStrategy === 'pr') {
          const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
          const ts = Date.now().toString(36);
          const newBranch = `gpush/initial-${date}-${ts}`;
          try {
            await octokit.git.createRef({
              owner: body.owner,
              repo: body.repo,
              ref: `refs/heads/${newBranch}`,
              sha: commit.sha,
            });
            send('progress', { message: `✓ Created branch ${newBranch}` });

            // Open PR
            const prBody =
              `## What's in this PR?\n\n` +
              `- Initial commit pushed by [G-Push](https://github.com/Nurovia-dev/G-Push)\n` +
              `- ${body.files.length} file${body.files.length === 1 ? '' : 's'} included\n` +
              `- Commit: \`${commit.sha.slice(0, 7)}\` — ${body.commitMessage}\n\n` +
              `### Files\n\n` +
              `Auto-generated starter files included:\n` +
              (body.generateReadme ? '- `README.md`\n' : '') +
              (body.generateLicense ? '- `LICENSE`\n' : '') +
              (body.generateGitignore ? '- `.gitignore`\n' : '') +
              `\n---\n` +
              `🤖 _Generated by [G-Push](https://github.com/Nurovia-dev/G-Push) — ship code to GitHub in one shot._\n`;

            try {
              const { data: pr } = await octokit.pulls.create({
                owner: body.owner,
                repo: body.repo,
                title: body.commitMessage || 'Initial commit',
                head: newBranch,
                base: baseBranch,
                body: prBody,
              });
              send('progress', { message: `✓ Opened PR #${pr.number}` });
              send('done', {
                url: pr.html_url,
                prUrl: pr.html_url,
                branch: newBranch,
                prNumber: pr.number,
              });
            } catch (prErr: any) {
              // PR failed but branch was created — still useful
              send('progress', {
                message: `⚠ Could not open PR (${prErr?.status}). Branch ${newBranch} is ready.`,
              });
              send('done', {
                url: `https://github.com/${body.owner}/${body.repo}/tree/${newBranch}`,
                branch: newBranch,
              });
            }
          } catch (e: any) {
            handleOctokitError(e);
          }
        } else {
          // Normal / Force / Wipe: push directly to main
          const branch = 'main';
          try {
            await octokit.git.createRef({
              owner: body.owner,
              repo: body.repo,
              ref: `refs/heads/${branch}`,
              sha: commit.sha,
            });
          } catch (e: any) {
            if (e.status === 422) {
              await octokit.git.updateRef({
                owner: body.owner,
                repo: body.repo,
                ref: `heads/${branch}`,
                sha: commit.sha,
                force: body.pushStrategy !== 'normal',
              });
            } else {
              throw e;
            }
          }
          send('progress', { message: `✓ Pushed to ${branch}` });
          send('done', { url: `https://github.com/${body.owner}/${body.repo}` });
        }
      } catch (e: any) {
        const msg = e?.message || 'Unknown error';
        const isTimeout =
          msg.includes('aborted') ||
          msg.includes('timed out') ||
          msg.includes('Timeout') ||
          e?.code === 'ETIMEDOUT' ||
          e?.name === 'AbortError';
        const isConn =
          msg.includes('ECONNREFUSED') ||
          msg.includes('ENOTFOUND') ||
          msg.includes('fetch failed') ||
          msg.includes('ETIMEDOUT');

        // Use translator to give actionable error
        const status = e?.status ?? 0;
        const rawMsg = msg;
        const translated = translateError(status, rawMsg);

        send('error', {
          message: translated.friendly,
          code: translated.kind,
          suggestion: translated.suggestion,
          retryable: translated.retryable,
          kind: translated.kind,
          status: translated.status,
          raw: translated.raw,
          hints: isTimeout || isConn
            ? [
                'Test from this server: curl -v https://api.github.com/zen',
                'If behind a proxy: HTTPS_PROXY=http://proxy:8080 npm run dev',
                'If on a corporate VPN: contact IT about api.github.com',
                'The push resumes automatically — just click "Push to GitHub" again',
              ]
            : translated.kind === 'permission'
            ? [
                'Go to https://github.com/settings/tokens',
                'Edit your token (or generate new)',
                'Enable the `repo` scope (and `delete_repo` for Wipe strategy)',
                'Paste new token at /settings in G-Push',
              ]
            : translated.kind === 'auth'
            ? [
                'Your token expired or was revoked',
                'Go to /settings in G-Push to sign in again',
              ]
            : translated.kind === 'branch-protection'
            ? [
                'The main branch is protected',
                'Go back to the wizard and switch to PR mode',
                'G-Push will push to a new branch and open a pull request for you',
              ]
            : translated.kind === 'exists'
            ? [
                'A repo with this name already exists',
                'Either pick a different name, or switch to the Wipe strategy',
              ]
            : translated.kind === 'rate-limit'
            ? [
                'GitHub temporarily blocked requests from your IP',
                'Wait 5-10 minutes and try again',
                'Authenticate (PAT or OAuth) to get higher limits',
              ]
            : undefined,
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
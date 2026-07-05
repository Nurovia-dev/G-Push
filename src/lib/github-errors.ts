/**
 * Translate GitHub API errors into actionable messages for the user.
 *
 * GitHub's raw error responses look like:
 *   {
 *     "message": "Validation Failed",
 *     "errors": [{ "resource": "Repository", "field": "name", "code": "missing_field" }],
 *     "documentation_url": "https://docs.github.com/..."
 *   }
 *
 * We map them to things humans understand:
 *   - "Repo already exists. Try the Wipe strategy."
 *   - "Your token doesn't have permission to delete repos. Re-create it with `delete_repo` scope."
 *   - "Network timeout. Check your connection and try again."
 */

export interface GithubError {
  status: number;
  raw: string;
  /** Best-guess user-facing message */
  friendly: string;
  /** Suggested action (button label) — if any */
  suggestion?: string;
  /** Whether the user can retry without changing anything */
  retryable: boolean;
  /** Categorization for icons/colors */
  kind: 'auth' | 'permission' | 'exists' | 'validation' | 'rate-limit' | 'network' | 'branch-protection' | 'server' | 'unknown';
}

const NETWORK_ERROR_PATTERNS = [
  'ECONNRESET',
  'ETIMEDOUT',
  'ECONNREFUSED',
  'ENOTFOUND',
  'fetch failed',
  'network error',
  'aborted',
  'socket hang up',
];

interface RawGithubError {
  status: number;
  message: string;
  errors?: Array<{ resource?: string; field?: string; code?: string; message?: string }>;
  documentation_url?: string;
}

function parseRaw(status: number, raw: string): RawGithubError | null {
  try {
    const j = JSON.parse(raw);
    return {
      status,
      message: j.message ?? '',
      errors: j.errors ?? [],
      documentation_url: j.documentation_url,
    };
  } catch {
    return null;
  }
}

/** Detect network-level errors (no HTTP response). */
function isNetworkError(raw: string): boolean {
  return NETWORK_ERROR_PATTERNS.some((p) => raw.toLowerCase().includes(p.toLowerCase()));
}

export function translateError(status: number, raw: string): GithubError {
  // Network errors (no HTTP response at all)
  if (isNetworkError(raw)) {
    return {
      status,
      raw,
      friendly: 'Network error — could not reach GitHub. Check your connection and try again.',
      suggestion: 'Retry',
      retryable: true,
      kind: 'network',
    };
  }

  const parsed = parseRaw(status, raw);
  if (!parsed) {
    // Status 0 with no network markers usually means the server function
    // was killed mid-response (Vercel timeout, cold-start disconnect, etc.)
    if (status === 0) {
      return {
        status,
        raw: raw.slice(0, 200),
        friendly:
          'Connection dropped before the server responded. The push may have completed — check your GitHub repo. If not, retry: the resume feature will pick up where it left off.',
        suggestion: 'Check GitHub, then retry',
        retryable: true,
        kind: 'network',
      };
    }
    return {
      status,
      raw: raw.slice(0, 200),
      friendly: `Unexpected error (HTTP ${status}). Try again, or check the browser console.`,
      suggestion: 'Retry',
      retryable: status >= 500,
      kind: status >= 500 ? 'server' : 'unknown',
    };
  }

  const msg = parsed.message.toLowerCase();
  const codes = (parsed.errors ?? []).map((e) => (e.code ?? '').toLowerCase()).join(' ');
  const fields = (parsed.errors ?? []).map((e) => (e.field ?? '').toLowerCase()).join(' ');

  // ── AUTH ──
  if (status === 401 || msg.includes('bad credentials') || msg.includes('requires authentication')) {
    return {
      status,
      raw,
      friendly: 'Your GitHub token is invalid or expired. Sign in again to continue.',
      suggestion: 'Sign in again',
      retryable: false,
      kind: 'auth',
    };
  }

  // ── RATE LIMIT ──
  if (status === 403 && (msg.includes('rate limit') || msg.includes('abuse detection'))) {
    return {
      status,
      raw,
      friendly: 'GitHub rate limit reached. Wait a few minutes and try again.',
      suggestion: 'Wait & retry',
      retryable: true,
      kind: 'rate-limit',
    };
  }

  // ── PERMISSIONS ──
  if (status === 403 && (msg.includes('resource not accessible') || codes.includes('missing'))) {
    if (msg.includes('delete')) {
      return {
        status,
        raw,
        friendly: 'Your token cannot delete repos. To use the Wipe strategy, regenerate your PAT with the `delete_repo` scope enabled.',
        suggestion: 'Update PAT scopes',
        retryable: false,
        kind: 'permission',
      };
    }
    return {
      status,
      raw,
      friendly: 'Your token does not have permission for this operation. Check that it has the `repo` scope.',
      suggestion: 'Update PAT scopes',
      retryable: false,
      kind: 'permission',
    };
  }

  // ── BRANCH PROTECTION ──
  if (
    status === 403 &&
    (msg.includes('protected branch') ||
      msg.includes('not allowed to push') ||
      msg.includes('branch is protected'))
  ) {
    return {
      status,
      raw,
      friendly: 'The branch is protected — direct push is blocked. Use the PR strategy (push to a branch + open a pull request) instead.',
      suggestion: 'Switch to PR mode',
      retryable: false,
      kind: 'branch-protection',
    };
  }

  // ── 422 VALIDATION — name conflicts / invalid input ──
  if (status === 422 || status === 400) {
    // Repo already exists
    if (
      msg.includes('name already exists') ||
      codes.includes('already_exists') ||
      fields.includes('name')
    ) {
      return {
        status,
        raw,
        friendly: 'A repo with this name already exists. Pick a different name, or switch to the Wipe strategy to overwrite it.',
        suggestion: 'Use Wipe strategy',
        retryable: false,
        kind: 'exists',
      };
    }
    // Repo name invalid
    if (codes.includes('invalid') || msg.includes('invalid')) {
      return {
        status,
        raw,
        friendly: `Invalid input: ${parsed.errors?.[0]?.message ?? parsed.message}`,
        retryable: false,
        kind: 'validation',
      };
    }
    return {
      status,
      raw,
      friendly: parsed.message || 'Validation failed',
      retryable: false,
      kind: 'validation',
    };
  }

  // ── 404 NOT FOUND ──
  if (status === 404) {
    if (msg.includes('not found')) {
      return {
        status,
        raw,
        friendly: 'Repo not found. Check the name and your permissions.',
        retryable: false,
        kind: 'unknown',
      };
    }
  }

  // ── 409 CONFLICT (file exists, branch exists) ──
  if (status === 409) {
    if (msg.includes('branch already exists') || msg.includes('reference already exists')) {
      return {
        status,
        raw,
        friendly: 'Branch already exists. Use a different branch name or the Force strategy.',
        suggestion: 'Use Force strategy',
        retryable: false,
        kind: 'validation',
      };
    }
  }

  // ── 5xx SERVER ERRORS ──
  if (status >= 500) {
    return {
      status,
      raw,
      friendly: 'GitHub is having issues. Try again in a moment.',
      suggestion: 'Retry',
      retryable: true,
      kind: 'server',
    };
  }

  // Fallback
  return {
    status,
    raw: raw.slice(0, 200),
    friendly: parsed.message || `Error ${status}`,
    retryable: status >= 500,
    kind: 'unknown',
  };
}
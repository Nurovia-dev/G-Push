'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Github, Loader2, Check, AlertTriangle, ExternalLink, LogOut, KeyRound } from 'lucide-react';
import { toast } from 'sonner';
import { PoweredByNurovia } from '@/components/brand';
import { Logo } from '@/components/logo';

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ login: string; name: string; avatar_url: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [pat, setPat] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [oauthAvailable, setOauthAvailable] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => {
        setUser(data.user || null);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    // Check if OAuth is configured on the server
    fetch('/api/auth/oauth-available')
      .then((r) => r.json())
      .then((data) => setOauthAvailable(data.available))
      .catch(() => {});
  }, []);

  async function connectPAT(e: React.FormEvent) {
    e.preventDefault();
    if (!pat.trim()) return;
    setConnecting(true);
    try {
      const res = await fetch('/api/auth/pat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ token: pat.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setUser({ login: data.login, name: data.name, avatar_url: data.avatar_url });
      setPat('');
      toast.success(`Connected as ${data.login}`);
      // Show scopes warning if missing repo
      if (data.scopes && !data.scopes.includes('repo')) {
        toast.warning('Token does not have `repo` scope — push may fail', { duration: 6000 });
      }
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setConnecting(false);
    }
  }

  async function signOut() {
    await fetch('/api/auth/pat', { method: 'DELETE', credentials: 'include' });
    try {
      localStorage.removeItem('G-Push_user');
    } catch {}
    setUser(null);
    toast.success('Signed out');
  }

  if (loading) {
    return (
      <CenteredShell>
        <Loader2 className="w-6 h-6 animate-spin text-gh-muted" />
      </CenteredShell>
    );
  }

  return (
    <main className="min-h-screen flex flex-col">
      <header className="border-b border-gh-border">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <Logo size={32} href="/" />
          <Link href="/new" className="btn-ghost text-sm">
            ← Back to wizard
          </Link>
        </div>
      </header>

      <div className="flex-1 max-w-2xl mx-auto px-6 py-10 w-full">
        <h1 className="text-3xl font-bold tracking-tight mb-2">GitHub connection</h1>
        <p className="text-gh-muted mb-8">
          Connect G-Push to your GitHub account so it can push to your repos.
        </p>

        {/* Current status */}
        {user ? (
          <div className="card p-6 mb-8">
            <div className="flex items-center gap-4">
              <img
                src={user.avatar_url}
                alt={user.login}
                className="w-12 h-12 rounded-full"
              />
              <div className="flex-1">
                <div className="font-medium">{user.name || user.login}</div>
                <div className="text-sm text-gh-muted">@{user.login}</div>
              </div>
              <div className="flex items-center gap-2 text-gh-success text-sm">
                <Check className="w-4 h-4" />
                Connected
              </div>
              <button onClick={signOut} className="btn-ghost text-xs">
                <LogOut className="w-3.5 h-3.5" />
                Sign out
              </button>
            </div>
          </div>
        ) : (
          <div className="card border-gh-warning/30 p-4 mb-8 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-gh-warning shrink-0 mt-0.5" />
            <div className="text-sm">
              <div className="font-medium mb-1">Not connected</div>
              <div className="text-gh-muted">
                Choose one of the options below to connect your GitHub account.
              </div>
            </div>
          </div>
        )}

        {/* Option 1: OAuth (hosted mode) */}
        {oauthAvailable && (
          <div className="card p-6 mb-4">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-md bg-brand-500/10 text-brand-400 flex items-center justify-center shrink-0">
                <Github className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="font-medium mb-1">Sign in with GitHub OAuth</div>
                <div className="text-sm text-gh-muted mb-3">
                  Recommended. One click, no copy-paste. This G-Push instance has its own
                  OAuth app configured.
                </div>
                <a href="/api/auth/login" className="btn-primary">
                  <Github className="w-4 h-4" />
                  Sign in with GitHub
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Option 2: Personal Access Token */}
        <div className="card p-6 mb-8">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-10 h-10 rounded-md bg-brand-500/10 text-brand-400 flex items-center justify-center shrink-0">
              <KeyRound className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="font-medium mb-1">
                Use a Personal Access Token
              </div>
              <div className="text-sm text-gh-muted">
                For self-hosted setups, or if you don't want to use OAuth. Tokens are stored
                in an httpOnly cookie on your browser.
              </div>
            </div>
          </div>

          <form onSubmit={connectPAT} className="space-y-3">
            <div>
              <label className="block text-xs uppercase tracking-wider text-gh-muted mb-1.5 font-medium">
                Personal Access Token (classic or fine-grained)
              </label>
              <input
                type="password"
                className="input font-mono"
                placeholder="ghp_… or github_pat_…"
                value={pat}
                onChange={(e) => setPat(e.target.value)}
                autoComplete="off"
                spellCheck={false}
              />
              <div className="text-xs text-gh-muted mt-1.5">
                Required scope: <code className="bg-gh-bg px-1 rounded">repo</code>{' '}
                (for push) and <code className="bg-gh-bg px-1 rounded">workflow</code>{' '}
                (for GitHub Actions, optional).{' '}
                <a
                  href="https://github.com/settings/tokens/new?scopes=repo,workflow&description=gpush"
                  target="_blank"
                  rel="noreferrer"
                  className="text-gh-accent hover:underline inline-flex items-center gap-0.5"
                >
                  Generate one <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
            <button
              type="submit"
              disabled={connecting || !pat.trim()}
              className="btn-primary w-full justify-center"
            >
              {connecting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Github className="w-4 h-4" />
              )}
              Connect to GitHub
            </button>
          </form>
        </div>

        <div className="text-xs text-gh-muted space-y-2">
          <p>
            <strong>Privacy:</strong> Your token is sent to G-Push, stored as an
            httpOnly cookie (inaccessible to JavaScript), and used only to call the
            GitHub API on your behalf. We don't log it or share it.
          </p>
          <p>
            <strong>Self-hosted?</strong> If you don't want to use a token at all, an
            admin can configure <code>GITHUB_CLIENT_ID</code> +{' '}
            <code>GITHUB_CLIENT_SECRET</code> in <code>.env.local</code> and restart the
            server — then OAuth will appear above.
          </p>
        </div>
      </div>

      <PoweredByNurovia />
    </main>
  );
}

function CenteredShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gh-bg">{children}</div>
  );
}
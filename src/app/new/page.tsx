'use client';

import { useState, useEffect, useRef, DragEvent, ChangeEvent } from 'react';
import { toast } from 'sonner';
import Link from 'next/link';
import { PoweredByNurovia } from '@/components/brand';
import { ConfettiBurst } from '@/components/confetti';
import { ThemeToggle } from '@/components/theme-toggle';
import { detectProjectType, suggestDescription, type ProjectType } from '@/lib/project';
import { computePathMap, detectStrippedPrefix } from '@/lib/paths';
import { filterFiles, classifyFile } from '@/lib/file-filter';
import {
  generateStarterFiles,
  generateReadme,
  generateLicense,
  generateGitignore,
  detectStacks,
  type LicenseId,
  type ProjectStack,
} from '@/lib/generators';
import {
  saveCheckpoint,
  loadCheckpoint,
  clearCheckpoint,
  createCheckpoint,
  checkpointAge,
  checkpointProgress,
  type PushCheckpoint,
} from '@/lib/checkpoint';
import {
  Github,
  Check,
  AlertTriangle,
  Loader2,
  Upload,
  FileCode,
  Lock,
  Globe,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  X,
  Search,
  Star,
  GitBranch,
  Settings as SettingsIcon,
  Plus,
  Wifi,
  ExternalLink,
} from 'lucide-react';

type WizardState = {
  step: number;
  // Repo selection
  owner: string;
  ownerType: 'User' | 'Organization';
  repo: string;
  description: string;
  visibility: 'public' | 'private';
  license: string;
  isNewRepo: boolean;
  // Branch protection detection result (existing repos only)
  repoCheck: {
    exists: boolean;
    isProtected: boolean;
    defaultBranch: string;
    fileCount?: number;
    recommendation?: { strategy: string; reason: string };
  } | null;
  repoCheckLoading: boolean;
  // Files
  files: File[];
  scanFindings: ScanFinding[];
  projectType: ProjectType | null;
  // Pre-flight filter results (computed on drop)
  dangerousFiles: { path: string; reason: string; rule: string }[];
  unnecessaryFiles: { path: string; reason: string; rule: string }[];
  unnecessaryIncluded: Set<string>; // paths the user wants to force-include
  // Auto-generated starter files
  generatedReadme: boolean;
  generatedLicense: boolean;
  generatedGitignore: boolean;
  detectedStacks: ProjectStack[];
  // Commit
  commitMessage: string;
  pushStrategy: 'normal' | 'force' | 'wipe' | 'pr';
  // Push
  isPushing: boolean;
  pushProgress: string[];
  pushResult: null | { kind: 'success'; url: string; prUrl?: string; branch?: string } | { kind: 'error'; message: string; suggestion?: string };
  // Auth
  user: { login: string; name: string; avatar_url: string } | null;
  isAuthChecking: boolean;
};

type ScanFinding = {
  file: string;
  pattern: string;
  preview: string;
};

type Repo = {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  private: boolean;
  html_url: string;
  language: string | null;
  stargazers_count: number;
  updated_at: string;
  default_branch: string;
  owner_type?: 'User' | 'Organization';
  owner_login?: string;
  owner_avatar?: string;
};

const STEPS = [
  { id: 'auth', title: 'Connect' },
  { id: 'repo', title: 'Pick repo' },
  { id: 'meta', title: 'Details' },
  { id: 'files', title: 'Add files' },
  { id: 'scan', title: 'Scan' },
  { id: 'commit', title: 'Commit' },
  { id: 'push', title: 'Push' },
];

const LICENSES = [
  { id: 'mit', label: 'MIT', desc: 'Permissive, do anything' },
  { id: 'apache-2.0', label: 'Apache-2.0', desc: 'Permissive + patent grant' },
  { id: 'bsd-3-clause', label: 'BSD-3-Clause', desc: 'Like MIT, no endorsement' },
  { id: 'gpl-3.0', label: 'GPL-3.0', desc: 'Copyleft, derivatives stay open' },
  { id: 'mpl-2.0', label: 'MPL-2.0', desc: 'File-level copyleft' },
  { id: 'unlicense', label: 'Unlicense', desc: 'Public domain dedication' },
];

const SECRET_PATTERNS = [
  { id: 'aws-key', name: 'AWS Access Key', regex: /AKIA[0-9A-Z]{16}/g },
  { id: 'github-pat', name: 'GitHub PAT', regex: /ghp_[A-Za-z0-9]{36}/g },
  { id: 'openai', name: 'OpenAI API Key', regex: /sk-[A-Za-z0-9]{48}/g },
  { id: 'anthropic', name: 'Anthropic API Key', regex: /sk-ant-[A-Za-z0-9_-]{40,}/g },
  { id: 'stripe-live', name: 'Stripe Live Key', regex: /sk_live_[A-Za-z0-9]{24,}/g },
  { id: 'stripe-test', name: 'Stripe Test Key', regex: /sk_test_[A-Za-z0-9]{24,}/g },
  { id: 'google-api', name: 'Google API Key', regex: /AIza[0-9A-Za-z_-]{35}/g },
  { id: 'slack-token', name: 'Slack Token', regex: /xox[baprs]-[0-9a-zA-Z-]{10,}/g },
  { id: 'private-key', name: 'Private Key Block', regex: /-----BEGIN (RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----/g },
  { id: 'jwt', name: 'JWT Token', regex: /eyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g },
  { id: 'sendgrid', name: 'SendGrid API Key', regex: /SG\.[A-Za-z0-9_-]{22}\.[A-Za-z0-9_-]{43}/g },
  { id: 'npm', name: 'npm Token', regex: /npm_[A-Za-z0-9]{36}/g },
  { id: 'discord-webhook', name: 'Discord Webhook', regex: /https:\/\/discord(?:app)?\.com\/api\/webhooks\/[0-9]+\/[A-Za-z0-9_-]+/g },
  { id: 'postgres', name: 'Postgres URL with Password', regex: /postgres(?:ql)?:\/\/[^:]+:[^@]+@/g },
  { id: 'mongo', name: 'MongoDB URL with Password', regex: /mongodb(?:\+srv)?:\/\/[^:]+:[^@]+@/g },
];

const SENSITIVE_FILES = new Set([
  '.env',
  '.env.local',
  '.env.production',
  '.env.development',
  'id_rsa',
  'id_dsa',
  'id_ecdsa',
  'id_ed25519',
  '.npmrc',
  '.pypirc',
  'credentials.json',
  'service-account.json',
  'secrets.json',
  'secrets.yaml',
  'secrets.yml',
]);

export default function NewRepoPage() {
  const [state, setState] = useState<WizardState>({
    step: 0,
    owner: '',
    ownerType: 'User',
    repo: '',
    description: '',
    visibility: 'public',
    license: 'mit',
    isNewRepo: false,
    repoCheck: null,
    repoCheckLoading: false,
    files: [],
    scanFindings: [],
    projectType: null,
    dangerousFiles: [],
    unnecessaryFiles: [],
    unnecessaryIncluded: new Set<string>(),
    generatedReadme: true,
    generatedLicense: true,
    generatedGitignore: true,
    detectedStacks: [],
    commitMessage: 'Initial commit',
    pushStrategy: 'normal',
    isPushing: false,
    pushProgress: [],
    pushResult: null,
    user: null,
    isAuthChecking: true,
  });

  useEffect(() => {
    // Show cached user immediately (no flash of empty avatar)
    try {
      const cached = localStorage.getItem('gpush_user');
      if (cached) {
        setState((s) => ({ ...s, user: JSON.parse(cached) }));
      }
    } catch {}

    // Then verify with server
    fetch('/api/auth/me', { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => {
        if (data.user) {
          try {
            localStorage.setItem('gpush_user', JSON.stringify(data.user));
          } catch {}
          setState((s) => ({ ...s, user: data.user, isAuthChecking: false }));
        } else {
          try {
            localStorage.removeItem('gpush_user');
          } catch {}
          setState((s) => ({ ...s, user: null, isAuthChecking: false }));
        }
      })
      .catch(() => setState((s) => ({ ...s, isAuthChecking: false })));
  }, []);

  useEffect(() => {
    if (state.files.length === 0) {
      setState((s) =>
        s.scanFindings.length === 0 && s.projectType === null
          ? s
          : { ...s, scanFindings: [], projectType: null }
      );
      return;
    }
    const projectType = detectProjectType(state.files);
    let cancelled = false;
    scanFiles(state.files).then((findings) => {
      if (!cancelled) {
        setState((s) => ({
          ...s,
          scanFindings: findings,
          projectType,
          // Auto-suggest description if user hasn't typed one and this is a new repo
          description:
            s.isNewRepo && !s.description && projectType
              ? suggestDescription(projectType, s.repo)
              : s.description,
        }));
      }
    });
    return () => {
      cancelled = true;
    };
  }, [state.files, state.isNewRepo, state.repo]);

  // ── Detect branch protection when user picks an existing repo ──
  useEffect(() => {
    if (state.isNewRepo || !state.owner || !state.repo || state.repoCheck) {
      return;
    }
    let cancelled = false;
    setState((s) => ({ ...s, repoCheckLoading: true }));

    fetch(
      `/api/repos/check-protection?owner=${encodeURIComponent(state.owner)}&repo=${encodeURIComponent(state.repo)}`,
      { credentials: 'include' }
    )
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (data.ok) {
          setState((s) => ({
            ...s,
            repoCheck: {
              exists: data.exists,
              isProtected: data.isProtected ?? false,
              defaultBranch: data.defaultBranch ?? 'main',
              fileCount: data.fileCount,
              recommendation: data.recommendation,
            },
            // Auto-switch to PR if branch is protected
            pushStrategy: data.isProtected ? 'pr' : 'normal',
            repoCheckLoading: false,
          }));
          if (data.isProtected) {
            toast.info('Branch is protected — switched to PR mode automatically', {
              description: data.recommendation?.reason,
              duration: 6000,
            });
          }
        } else {
          setState((s) => ({ ...s, repoCheckLoading: false }));
        }
      })
      .catch(() => {
        if (!cancelled) setState((s) => ({ ...s, repoCheckLoading: false }));
      });

    return () => {
      cancelled = true;
    };
  }, [state.isNewRepo, state.owner, state.repo]);

  const next = () => setState((s) => ({ ...s, step: Math.min(s.step + 1, STEPS.length - 1) }));
  const back = () => setState((s) => ({ ...s, step: Math.max(s.step - 1, 0) }));
  const reset = () =>
    setState((s) => ({
      ...s,
      step: 0,
      owner: '',
      ownerType: 'User',
      repo: '',
      description: '',
      files: [],
      scanFindings: [],
      dangerousFiles: [],
      unnecessaryFiles: [],
      unnecessaryIncluded: new Set<string>(),
      generatedReadme: true,
      generatedLicense: true,
      generatedGitignore: true,
      detectedStacks: [],
      commitMessage: 'Initial commit',
      pushStrategy: 'normal',
      pushProgress: [],
      pushResult: null,
    }));

  if (state.isAuthChecking) {
    return (
      <CenteredShell>
        <Loader2 className="w-8 h-8 animate-spin text-gh-muted" />
      </CenteredShell>
    );
  }

  return (
    <main className="min-h-screen flex flex-col">
      <header className="border-b border-gh-border sticky top-0 bg-gh-bg/80 backdrop-blur-md z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-gradient-to-br from-brand-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm">
              G
            </div>
            <span className="font-semibold">G-Push</span>
          </Link>
          <div className="flex items-center gap-3">
            <UserChip user={state.user} />
            <ThemeToggle />
            <Link href="/settings" className="btn-ghost text-xs">
              <SettingsIcon className="w-3.5 h-3.5" />
            </Link>
            <button onClick={reset} className="btn-ghost text-xs">
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>
          </div>
        </div>
      </header>

      <div className="border-b border-gh-border bg-gh-surface/30">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center gap-2 overflow-x-auto">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center gap-2 shrink-0">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
                  i < state.step
                    ? 'bg-gh-success text-white'
                    : i === state.step
                    ? 'bg-brand-500 text-white'
                    : 'bg-gh-border text-gh-muted'
                }`}
              >
                {i < state.step ? <Check className="w-3.5 h-3.5" /> : i + 1}
              </div>
              <span className={`text-sm ${i === state.step ? 'text-gh-fg font-medium' : 'text-gh-muted'}`}>
                {s.title}
              </span>
              {i < STEPS.length - 1 && <div className="w-8 h-px bg-gh-border mx-1" />}
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 max-w-6xl mx-auto px-6 py-10 w-full">
          <div key={state.step} className="animate-slide-up">
            {state.step === 0 && <AuthStep state={state} setState={setState} onNext={next} />}
            {state.step === 1 && <RepoStep state={state} setState={setState} onNext={next} onBack={back} />}
            {state.step === 2 && <MetaStep state={state} setState={setState} onNext={next} onBack={back} />}
            {state.step === 3 && <FilesStep state={state} setState={setState} onNext={next} onBack={back} />}
            {state.step === 4 && <ScanStep state={state} setState={setState} onNext={next} onBack={back} />}
            {state.step === 5 && <CommitStep state={state} setState={setState} onNext={next} onBack={back} />}
            {state.step === 6 && <PushStep state={state} setState={setState} onBack={back} onReset={reset} />}
          </div>
      </div>

      <PoweredByNurovia />
    </main>
  );
}

function AuthStep({ state, onNext }: any) {
  // Check for a resumable push from a previous session
  const [checkpoint, setCheckpoint] = useState<typeof import('@/lib/checkpoint').loadCheckpoint extends () => infer R ? R : never>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && state.user) {
      const cp = loadCheckpoint();
      if (cp && cp.stage !== 'done' && cp.owner === state.user.login) {
        setCheckpoint(cp);
      }
    }
  }, [state.user]);

  const dismissCheckpoint = () => {
    clearCheckpoint();
    setCheckpoint(null);
  };

  if (state.user) {
    return (
      <>
        {checkpoint && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 card border-brand-500/40 p-4 max-w-md w-full mx-4 shadow-2xl animate-slide-up">
            <div className="flex items-start gap-3">
              <RotateCcw className="w-5 h-5 text-brand-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="font-medium">Resume previous push?</div>
                <div className="text-sm text-gh-muted mt-1">
                  {checkpoint.uploadedCount} of {checkpoint.totalCount} files already uploaded
                  to <code className="text-xs">{checkpoint.owner}/{checkpoint.repo}</code>
                  {' '}({checkpointAge(checkpoint)})
                </div>
                <div className="mt-2 w-full bg-gh-border rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-brand-500 h-full transition-all"
                    style={{ width: `${checkpointProgress(checkpoint)}%` }}
                  />
                </div>
              </div>
              <button onClick={dismissCheckpoint} className="text-gh-muted hover:text-gh-fg">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex gap-2 mt-3">
              <button
                onClick={dismissCheckpoint}
                className="btn-secondary text-sm flex-1"
              >
                Discard
              </button>
              <a
                href="/new"
                onClick={(e) => {
                  e.preventDefault();
                  toast.info('Resume mode — set up repo and re-add the same files. Existing blob uploads will be reused.');
                  dismissCheckpoint();
                }}
                className="btn-primary text-sm flex-1"
              >
                Resume
              </a>
            </div>
          </div>
        )}
        <StepShell title="Connected" subtitle={`Signed in as @${state.user.login}`}>
          <div className="card p-6 flex items-center gap-4">
            <img src={state.user.avatar_url} alt="" className="w-12 h-12 rounded-full" />
            <div className="flex-1">
              <div className="font-medium">{state.user.name || state.user.login}</div>
              <div className="text-sm text-gh-muted">@{state.user.login}</div>
            </div>
            <Check className="w-5 h-5 text-gh-success" />
            <button onClick={onNext} className="btn-primary">
              Continue <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </StepShell>
      </>
    );
  }
  return (
    <StepShell title="Connect to GitHub" subtitle="Pick how G-Push gets permission to push on your behalf.">
      <div className="space-y-3">
        <a href="/api/auth/login" className="card-hover p-5 flex items-center gap-4 group">
          <div className="w-10 h-10 rounded-md bg-brand-500/10 text-brand-400 flex items-center justify-center shrink-0">
            <Github className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="font-medium">Sign in with GitHub OAuth</div>
            <div className="text-sm text-gh-muted">One click if G-Push has OAuth configured.</div>
          </div>
          <ArrowRight className="w-4 h-4 text-gh-muted group-hover:text-gh-fg transition-colors" />
        </a>

        <Link href="/settings" className="card-hover p-5 flex items-center gap-4 group">
          <div className="w-10 h-10 rounded-md bg-brand-500/10 text-brand-400 flex items-center justify-center shrink-0">
            <SettingsIcon className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="font-medium">Use a Personal Access Token</div>
            <div className="text-sm text-gh-muted">Paste a token from GitHub. Works for self-hosted.</div>
          </div>
          <ArrowRight className="w-4 h-4 text-gh-muted group-hover:text-gh-fg transition-colors" />
        </Link>
      </div>
    </StepShell>
  );
}

function RepoStep({ state, setState, onNext, onBack }: any) {
  const [repos, setRepos] = useState<Repo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{
    code: string;
    message: string;
    hints?: string[];
  } | null>(null);
  const [search, setSearch] = useState('');
  const [showNewRepo, setShowNewRepo] = useState(false);
  const [newRepoName, setNewRepoName] = useState('');
  // Org picker — defaults to user's personal account
  const [orgs, setOrgs] = useState<Array<{ login: string; avatar_url: string; description: string | null }>>([]);
  const [selectedOwner, setSelectedOwner] = useState<string>(''); // '' = personal

  async function loadOrgs() {
    try {
      const res = await fetch('/api/repos/orgs', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setOrgs(data.orgs || []);
      }
    } catch {}
  }

  async function loadRepos() {
    setLoading(true);
    setError(null);
    try {
      const ownerParam = selectedOwner === ''
        ? 'me'
        : `org:${selectedOwner}`;
      const res = await fetch(
        `/api/repos/list?owner=${encodeURIComponent(ownerParam)}`,
        { credentials: 'include' }
      );
      const data = await res.json();
      if (!res.ok) {
        setError({
          code: data.error || 'unknown',
          message: data.message || 'Failed to load repos',
          hints: data.hints,
        });
        setRepos([]);
      } else {
        setRepos(data.repos || []);
      }
    } catch (e: any) {
      setError({
        code: 'network',
        message: e?.message || 'Network error',
        hints: ['Check your internet connection', 'Try again'],
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrgs();
  }, []);

  useEffect(() => {
    if (state.user) {
      loadRepos();
    }
  }, [selectedOwner, state.user]);

  const filtered = search
    ? repos.filter(
        (r) =>
          r.full_name.toLowerCase().includes(search.toLowerCase()) ||
          (r.description || '').toLowerCase().includes(search.toLowerCase())
      )
    : repos;

  function selectRepo(r: Repo) {
    const [owner, repo] = r.full_name.split('/');
    // Determine owner type from repo data — the API returns owner.type on each repo
    const ownerType: 'User' | 'Organization' =
      ((r as any).owner_type ?? 'User') === 'Organization' ? 'Organization' : 'User';
    setState({
      ...state,
      owner,
      ownerType,
      repo,
      description: r.description || '',
      visibility: r.private ? 'private' : 'public',
      isNewRepo: false,
    });
    onNext();
  }

  function createNewRepo() {
    if (!newRepoName.trim() || !state.user) return;
    const owner = selectedOwner === '' ? state.user.login : selectedOwner;
    const ownerType: 'User' | 'Organization' = selectedOwner === '' ? 'User' : 'Organization';
    setState({
      ...state,
      owner,
      ownerType,
      repo: newRepoName.trim(),
      isNewRepo: true,
      visibility: 'public',
      description: '',
    });
    onNext();
  }

  return (
    <StepShell title="Pick a repo" subtitle="Choose an existing repo or create a new one.">
      {!showNewRepo ? (
        <>
          {/* Owner picker — Personal + each org */}
          {state.user && (orgs.length > 0 || true) && (
            <div className="mb-4 flex items-center gap-2 flex-wrap">
              <span className="text-xs uppercase tracking-wider text-gh-muted font-medium">
                Owner:
              </span>
              <button
                onClick={() => setSelectedOwner('')}
                className={`px-2.5 py-1 rounded-md text-xs flex items-center gap-1.5 transition-colors ${
                  selectedOwner === ''
                    ? 'bg-brand-500/15 text-brand-500 border border-brand-500/30'
                    : 'bg-gh-bg border border-gh-border hover:border-gh-accent/40'
                }`}
              >
                <img
                  src={state.user.avatar_url}
                  alt=""
                  className="w-4 h-4 rounded-full"
                />
                <span className="font-medium">{state.user.login}</span>
                <span className="text-gh-muted">Personal</span>
              </button>
              {orgs.map((o) => (
                <button
                  key={o.login}
                  onClick={() => setSelectedOwner(o.login)}
                  className={`px-2.5 py-1 rounded-md text-xs flex items-center gap-1.5 transition-colors ${
                    selectedOwner === o.login
                      ? 'bg-brand-500/15 text-brand-500 border border-brand-500/30'
                      : 'bg-gh-bg border border-gh-border hover:border-gh-accent/40'
                  }`}
                >
                  <img src={o.avatar_url} alt="" className="w-4 h-4 rounded-full" />
                  <span className="font-medium">{o.login}</span>
                  <span className="text-gh-muted">Org</span>
                </button>
              ))}
            </div>
          )}

          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gh-muted" />
            <input
              className="input pl-9"
              placeholder={`Search ${repos.length} ${selectedOwner === '' ? '' : selectedOwner + '/'}repos…`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
          </div>

          <button
            onClick={() => setShowNewRepo(true)}
            className="card-hover p-3 w-full flex items-center gap-3 mb-4 text-left"
          >
            <div className="w-8 h-8 rounded-md bg-gh-success/10 text-gh-success flex items-center justify-center">
              <Plus className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <div className="font-medium text-sm">Create a new repo</div>
              <div className="text-xs text-gh-muted">Name it and we'll create it on GitHub during push</div>
            </div>
            <ArrowRight className="w-4 h-4 text-gh-muted" />
          </button>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-gh-muted" />
            </div>
          ) : error ? (
            <div className="card border-gh-warning/40 p-5 space-y-3">
              <div className="flex items-start gap-3">
                <Wifi className="w-5 h-5 text-gh-warning shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="font-medium mb-1">{error.message}</div>
                  <div className="text-xs text-gh-muted mb-3">
                    Error code: <code>{error.code}</code>
                  </div>
                  {error.hints && error.hints.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="text-xs uppercase tracking-wider text-gh-muted font-medium">
                        Try this
                      </div>
                      <ul className="space-y-1">
                        {error.hints.map((h, i) => (
                          <li key={i} className="text-sm text-gh-fg flex items-start gap-2">
                            <span className="text-gh-muted">•</span>
                            <span>{h}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div className="flex gap-2 mt-4">
                    <button onClick={loadRepos} className="btn-secondary text-sm">
                      <RotateCcw className="w-3.5 h-3.5" />
                      Retry
                    </button>
                    <Link href="/settings" className="btn-ghost text-sm">
                      Reconnect GitHub
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="card p-6 text-center text-gh-muted">
              {search ? `No repos match "${search}"` : 'No repos found'}
            </div>
          ) : (
            <div className="space-y-2 max-h-[28rem] overflow-y-auto">
              {filtered.map((r) => (
                <button
                  key={r.id}
                  onClick={() => selectRepo(r)}
                  className="card-hover p-3 w-full text-left flex items-start gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-medium font-mono text-sm truncate">
                        {r.full_name}
                      </span>
                      {r.private && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-gh-warning/10 text-gh-warning">
                          Private
                        </span>
                      )}
                    </div>
                    {r.description && (
                      <div className="text-xs text-gh-muted line-clamp-1">{r.description}</div>
                    )}
                    <div className="flex items-center gap-3 text-xs text-gh-muted mt-1">
                      {r.language && <span>{r.language}</span>}
                      {r.stargazers_count > 0 && (
                        <span className="flex items-center gap-0.5">
                          <Star className="w-3 h-3" /> {r.stargazers_count}
                        </span>
                      )}
                      <span>updated {timeAgo(r.updated_at)}</span>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gh-muted shrink-0 mt-1" />
                </button>
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          <Field label="Owner">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedOwner('')}
              className={`px-2.5 py-1 rounded-md text-xs flex items-center gap-1.5 transition-colors ${
                selectedOwner === ''
                  ? 'bg-brand-500/15 text-brand-500 border border-brand-500/30'
                  : 'bg-gh-bg border border-gh-border hover:border-gh-accent/40'
              }`}
            >
              {state.user && (
                <img src={state.user.avatar_url} alt="" className="w-4 h-4 rounded-full" />
              )}
              <span className="font-medium">{state.user?.login}</span>
              <span className="text-gh-muted">Personal</span>
            </button>
            {orgs.map((o) => (
              <button
                key={o.login}
                onClick={() => setSelectedOwner(o.login)}
                className={`px-2.5 py-1 rounded-md text-xs flex items-center gap-1.5 transition-colors ${
                  selectedOwner === o.login
                    ? 'bg-brand-500/15 text-brand-500 border border-brand-500/30'
                    : 'bg-gh-bg border border-gh-border hover:border-gh-accent/40'
                }`}
              >
                <img src={o.avatar_url} alt="" className="w-4 h-4 rounded-full" />
                <span className="font-medium">{o.login}</span>
                <span className="text-gh-muted">Org</span>
              </button>
            ))}
          </div>
        </Field>

        <Field label="New repo name">
            <input
              className="input font-mono"
              placeholder="my-awesome-project"
              value={newRepoName}
              onChange={(e) => setNewRepoName(e.target.value)}
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && createNewRepo()}
            />
            {newRepoName && state.user && (
              <div className="text-xs text-gh-muted mt-1.5">
                Will create:{' '}
                <span className="text-gh-fg font-mono">
                  github.com/{selectedOwner === '' ? state.user.login : selectedOwner}/{newRepoName}
                </span>
              </div>
            )}
          </Field>

          <div className="mt-6 flex items-center gap-3">
            <button onClick={() => setShowNewRepo(false)} className="btn-secondary">
              <ArrowLeft className="w-4 h-4" />
              Back to list
            </button>
            <button
              onClick={createNewRepo}
              disabled={!newRepoName.trim()}
              className="btn-primary flex-1"
            >
              Continue with new repo
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </>
      )}

      {!showNewRepo && <NavButtons onBack={onBack} hideNext />}
    </StepShell>
  );
}

function MetaStep({ state, setState, onNext, onBack }: any) {
  return (
    <StepShell
      title={state.isNewRepo ? 'New repo details' : 'Repo details'}
      subtitle={state.isNewRepo ? 'Description, visibility, and license for the new repo.' : 'License to apply.'}
    >
      <div className="space-y-4">
        <div className="card p-3 flex items-center gap-3 text-sm">
          <Github className="w-4 h-4 text-gh-muted" />
          <span className="font-mono">
            {state.owner}/{state.repo}
          </span>
          {state.isNewRepo && (
            <span className="text-xs px-1.5 py-0.5 rounded bg-gh-success/10 text-gh-success ml-auto">
              New
            </span>
          )}
          {!state.isNewRepo && state.repoCheck?.isProtected && (
            <span className="text-xs px-1.5 py-0.5 rounded bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 ml-auto">
              🛡 Protected
            </span>
          )}
          {!state.isNewRepo && state.repoCheck?.fileCount !== undefined && (
            <span className="text-xs text-gh-muted">
              {state.repoCheck.fileCount} file{state.repoCheck.fileCount === 1 ? '' : 's'}
            </span>
          )}
        </div>

        {/* Branch protection warning */}
        {!state.isNewRepo && state.repoCheck?.isProtected && (
          <div className="card border-yellow-500/40 p-4">
            <div className="flex items-start gap-3">
              <span className="text-xl">🛡</span>
              <div className="flex-1">
                <div className="font-medium text-yellow-600 dark:text-yellow-400">
                  Branch is protected
                </div>
                <div className="text-sm text-gh-muted mt-1">
                  Direct push to <code className="bg-gh-bg px-1 rounded">{state.repoCheck.defaultBranch}</code> is blocked by GitHub. We auto-switched to <strong>PR mode</strong> below.
                </div>
                {state.repoCheck.protection?.requiresReview && (
                  <div className="text-xs text-gh-muted mt-2">
                    ⓘ This repo requires pull-request reviews. Your PR will need approval before merge.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {state.isNewRepo && (
          <>
            <Field label="Description (optional)">
              <input
                className="input"
                placeholder="A short tagline that shows on the GitHub repo page"
                value={state.description}
                onChange={(e) => setState({ ...state, description: e.target.value })}
              />
            </Field>

            <Field label="Visibility">
              <div className="grid grid-cols-2 gap-3">
                <ChoiceCard
                  active={state.visibility === 'public'}
                  onClick={() => setState({ ...state, visibility: 'public' })}
                  icon={<Globe className="w-4 h-4" />}
                  title="Public"
                  desc="Anyone can see this repo"
                />
                <ChoiceCard
                  active={state.visibility === 'private'}
                  onClick={() => setState({ ...state, visibility: 'private' })}
                  icon={<Lock className="w-4 h-4" />}
                  title="Private"
                  desc="Only you (and collaborators) can see"
                />
              </div>
            </Field>
          </>
        )}

        <Field label="License">
          <div className="grid grid-cols-2 gap-2">
            {LICENSES.map((l) => (
              <button
                key={l.id}
                onClick={() => setState({ ...state, license: l.id })}
                className={`text-left p-3 rounded-md border transition-all ${
                  state.license === l.id
                    ? 'border-brand-500 bg-brand-500/10'
                    : 'border-gh-border hover:border-gh-accent/40'
                }`}
              >
                <div className="font-medium text-sm">{l.label}</div>
                <div className="text-xs text-gh-muted">{l.desc}</div>
              </button>
            ))}
          </div>
        </Field>
      </div>

      <NavButtons onBack={onBack} onNext={onNext} />
    </StepShell>
  );
}

function FilesStep({ state, setState, onNext, onBack }: any) {
  const [isDragActive, setIsDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const projectType = state.projectType;

  // Strip the folder prefix when user dropped a directory (e.g. "my-app/").
  const pathMap = computePathMap(state.files);
  const strippedPrefix = detectStrippedPrefix(state.files);

  /**
   * Run pre-flight filter on the dropped files and store results.
   * Dangerous files stay in `files` so user can see them — but they're flagged red.
   * Unnecessary files are also kept but flagged yellow with "Include" toggle.
   */
  const runFilter = (files: File[]) => {
    const items = files.map((f) => ({
      path: (f as any).webkitRelativePath || f.name,
      file: f,
    }));
    const result = filterFiles(items);
    const stacks = detectStacks(items.map(({ path }) => ({ path })));

    setState((s: WizardState) => ({
      ...s,
      dangerousFiles: result.dangerous.map(({ path, reason, rule }) => ({
        path,
        reason,
        rule,
      })),
      unnecessaryFiles: result.unnecessary.map(({ path, reason, rule }) => ({
        path,
        reason,
        rule,
      })),
      detectedStacks: stacks,
    }));

    // Toast summary so user knows what was caught
    const parts: string[] = [];
    if (result.dangerous.length > 0) {
      parts.push(`🚫 ${result.dangerous.length} dangerous file${result.dangerous.length === 1 ? '' : 's'} blocked`);
    }
    if (result.unnecessary.length > 0) {
      parts.push(`⏭ ${result.unnecessary.length} unnecessary file${result.unnecessary.length === 1 ? '' : 's'} will be skipped`);
    }
    if (parts.length > 0) {
      toast.warning(parts.join('  ·  '), { duration: 6000 });
    } else if (result.allowed.length > 0) {
      toast.success(`✓ ${result.allowed.length} file${result.allowed.length === 1 ? '' : 's'} ready to push`);
    }

    return result;
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragActive(false);
    const dropped = Array.from(e.dataTransfer.files);
    if (dropped.length) {
      const newFiles = [...state.files, ...dropped];
      setState((s: WizardState) => ({ ...s, files: newFiles }));
      runFilter(newFiles);
    }
  };

  const onDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragActive(true);
  };

  const onDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragActive(false);
  };

  const onPick = (e: ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files ? Array.from(e.target.files) : [];
    if (picked.length) {
      const newFiles = [...state.files, ...picked];
      setState((s: WizardState) => ({ ...s, files: newFiles }));
      runFilter(newFiles);
    }
    e.target.value = '';
  };

  const totalSize = state.files.reduce((s: number, f: File) => s + f.size, 0);

  return (
    <StepShell
      title="Add files"
      subtitle="Drop a folder or pick files. G-Push reads them in the browser — nothing is uploaded yet."
    >
      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onClick={() => inputRef.current?.click()}
        className={`card border-2 border-dashed p-10 text-center cursor-pointer transition-all ${
          isDragActive
            ? 'border-brand-500 bg-brand-500/5'
            : 'border-gh-border hover:border-gh-accent/40'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          // @ts-expect-error non-standard but widely supported
          webkitdirectory=""
          directory=""
          style={{ display: 'none' }}
          onChange={onPick}
        />
        <Upload className="w-8 h-8 mx-auto mb-3 text-gh-muted" />
        <div className="font-medium mb-1">
          {isDragActive ? 'Drop the files here' : 'Drop files or click to browse'}
        </div>
        <div className="text-sm text-gh-muted">
          Any file type. We scan for secrets locally before upload.
        </div>
      </div>

      {/* ─── Auto-generate starter files ─── */}
      <div className="mt-6 card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-brand-500" />
          <span className="font-medium text-sm">Auto-generate starter files</span>
          <span className="text-xs text-gh-muted ml-auto">
            Powered by your project type
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <GeneratedToggle
            label="README.md"
            desc={state.generatedReadme ? generateReadme({ projectName: state.repo, description: state.description, author: state.user?.login, license: state.license, isNewProject: true }).split('\n').slice(0, 2).join(' ').slice(0, 80) + '…' : 'A short, modern README based on detected stack'}
            active={state.generatedReadme}
            onChange={(v) => setState((s: WizardState) => ({ ...s, generatedReadme: v }))}
            emoji="📝"
          />
          <GeneratedToggle
            label="LICENSE"
            desc={state.generatedLicense ? `MIT License · Copyright © ${new Date().getFullYear()} ${state.user?.login || 'you'}` : 'Pick from MIT, Apache, BSD, GPL, MPL, Unlicense'}
            active={state.generatedLicense}
            onChange={(v) => setState((s: WizardState) => ({ ...s, generatedLicense: v }))}
            emoji="⚖️"
          />
          <GeneratedToggle
            label=".gitignore"
            desc={state.generatedGitignore
              ? 'Covers ' + (state.detectedStacks.length > 0 ? state.detectedStacks.join(', ') : 'Node, Python, Go, Rust, …')
              : 'Auto-detect from your files (package.json, requirements.txt, go.mod, etc.)'}
            active={state.generatedGitignore}
            onChange={(v) => setState((s: WizardState) => ({ ...s, generatedGitignore: v }))}
            emoji="🙈"
          />
        </div>
        {state.generatedGitignore && state.detectedStacks.length > 0 && (
          <div className="mt-2 text-xs text-gh-muted">
            <span className="font-mono">.gitignore</span> will cover:{' '}
            {state.detectedStacks.map((s: ProjectStack, i: number) => (
              <span key={s}>
                <span className="text-gh-fg">{s}</span>
                {i < state.detectedStacks.length - 1 ? ', ' : ''}
              </span>
            ))}
          </div>
        )}
      </div>

      {state.files.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="text-sm text-gh-muted">
                {state.files.length} file{state.files.length !== 1 ? 's' : ''} ·{' '}
                {formatBytes(totalSize)}
              </div>
              {projectType && (
                <div
                  className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md
                              bg-gh-surface border border-gh-border text-xs"
                  title={`Detected ${projectType.label} project`}
                >
                  <span style={{ color: projectType.color }}>{projectType.emoji}</span>
                  <span>Detected: {projectType.label}</span>
                </div>
              )}
              {strippedPrefix && (
                <div
                  className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md
                              bg-gh-accent/10 text-gh-accent text-xs"
                  title="Browser includes the folder name in file paths. We strip it so the repo contains the project files at the root, not inside a subfolder."
                >
                  ✓ Stripped folder prefix <code className="font-mono">{strippedPrefix}</code>
                </div>
              )}
              {state.dangerousFiles.length > 0 && (
                <div
                  className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md
                              bg-gh-danger/15 text-gh-danger text-xs"
                  title="These files are blocked from upload because they almost always contain secrets."
                >
                  🚫 {state.dangerousFiles.length} blocked
                </div>
              )}
              {state.unnecessaryFiles.length > 0 && (
                <div
                  className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md
                              bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 text-xs"
                  title="These files will be skipped by default (build output, dependencies, OS junk)."
                >
                  ⏭ {state.unnecessaryFiles.length} will skip
                </div>
              )}
            </div>
            <button
              onClick={() => setState({ ...state, files: [] })}
              className="text-xs text-gh-muted hover:text-gh-danger"
            >
              Clear all
            </button>
          </div>
          <div className="card max-h-64 overflow-y-auto divide-y divide-gh-border">
            {state.files.slice(0, 200).map((f: File, i: number) => {
              const displayPath = pathMap.get(f) ?? f.name;
              return (
                <div key={i} className="px-3 py-1.5 flex items-center gap-2 text-sm">
                  <FileCode className="w-3.5 h-3.5 text-gh-muted shrink-0" />
                  <span className="font-mono text-xs truncate flex-1">{displayPath}</span>
                  <span className="text-xs text-gh-muted shrink-0">{formatBytes(f.size)}</span>
                </div>
              );
            })}
            {state.files.length > 200 && (
              <div className="px-3 py-2 text-xs text-gh-muted text-center">
                …and {state.files.length - 200} more
              </div>
            )}
          </div>
        </div>
      )}

      {(state.dangerousFiles.length > 0 || state.unnecessaryFiles.length > 0) && (
        <div className="mt-6 space-y-3">
          {state.dangerousFiles.length > 0 && (
            <div className="card border-gh-danger/40 p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-base">🚫</span>
                <div className="flex-1">
                  <div className="font-medium text-gh-danger">
                    Blocked — {state.dangerousFiles.length} file
                    {state.dangerousFiles.length === 1 ? '' : 's'}
                  </div>
                  <div className="text-xs text-gh-muted">
                    These will <strong>not</strong> be uploaded. They almost always contain
                    credentials. Rename to <code className="bg-gh-bg px-1 rounded">.env.example</code> etc.
                  </div>
                </div>
              </div>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {state.dangerousFiles.slice(0, 50).map((f: any, i: number) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 text-sm py-1.5 px-2 rounded
                                bg-gh-danger/5 border border-gh-danger/20"
                  >
                    <span className="font-mono text-xs flex-1 truncate text-gh-fg">
                      {f.path}
                    </span>
                    <span className="text-xs text-gh-muted shrink-0">{f.reason}</span>
                    <button
                      onClick={() => {
                        // Remove from dangerous list (delete the file from state)
                        setState((s: WizardState) => ({
                          ...s,
                          dangerousFiles: s.dangerousFiles.filter((x: any) => x.path !== f.path),
                          files: s.files.filter(
                            (file: File) =>
                              ((file as any).webkitRelativePath || file.name) !== f.path
                          ),
                        }));
                        toast.success('Removed');
                      }}
                      className="text-xs text-gh-muted hover:text-gh-danger shrink-0"
                      title="Remove from the list"
                    >
                      remove
                    </button>
                  </div>
                ))}
                {state.dangerousFiles.length > 50 && (
                  <div className="text-xs text-gh-muted text-center py-1">
                    …and {state.dangerousFiles.length - 50} more blocked files
                  </div>
                )}
              </div>
            </div>
          )}

          {state.unnecessaryFiles.length > 0 && (
            <div className="card border-yellow-500/30 p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-base">⏭</span>
                <div className="flex-1">
                  <div className="font-medium text-yellow-600 dark:text-yellow-400">
                    Will skip — {state.unnecessaryFiles.length} file
                    {state.unnecessaryFiles.length === 1 ? '' : 's'}
                  </div>
                  <div className="text-xs text-gh-muted">
                    Build output, dependencies, OS junk. Not included unless you toggle "Include".
                  </div>
                </div>
              </div>
              <div className="space-y-1.5 max-h-64 overflow-y-auto">
                {state.unnecessaryFiles.slice(0, 50).map((f: any, i: number) => {
                  const included = state.unnecessaryIncluded.has(f.path);
                  return (
                    <div
                      key={i}
                      className={`flex items-start gap-2 text-sm py-1.5 px-2 rounded border transition-colors ${
                        included
                          ? 'bg-yellow-500/10 border-yellow-500/40'
                          : 'bg-gh-bg border-gh-border'
                      }`}
                    >
                      <span className="font-mono text-xs flex-1 truncate text-gh-fg">
                        {f.path}
                      </span>
                      <span className="text-xs text-gh-muted shrink-0 hidden sm:inline">
                        {f.reason}
                      </span>
                      <button
                        onClick={() => {
                          setState((s: WizardState) => {
                            const next = new Set(s.unnecessaryIncluded);
                            if (included) next.delete(f.path);
                            else next.add(f.path);
                            return { ...s, unnecessaryIncluded: next };
                          });
                        }}
                        className={`text-xs px-2 py-0.5 rounded shrink-0 transition-colors ${
                          included
                            ? 'bg-yellow-500/30 text-yellow-700 dark:text-yellow-200'
                            : 'bg-gh-surface text-gh-muted hover:bg-gh-border'
                        }`}
                      >
                        {included ? '✓ Include' : 'Include'}
                      </button>
                    </div>
                  );
                })}
                {state.unnecessaryFiles.length > 50 && (
                  <div className="text-xs text-gh-muted text-center py-1">
                    …and {state.unnecessaryFiles.length - 50} more (won&apos;t be uploaded)
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      <NavButtons
        onBack={onBack}
        onNext={onNext}
        disableNext={state.files.length === 0 || state.dangerousFiles.length > 0}
        nextLabel={
          state.dangerousFiles.length > 0
            ? `Remove ${state.dangerousFiles.length} blocked file${
                state.dangerousFiles.length === 1 ? '' : 's'
              } to continue`
            : undefined
        }
      />
    </StepShell>
  );
}

function GeneratedToggle({
  label, desc, active, onChange, emoji,
}: { label: string; desc: string; active: boolean; onChange: (v: boolean) => void; emoji: string }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!active)}
      className={`text-left p-3 rounded-md border transition-all ${
        active
          ? 'border-brand-500 bg-brand-500/10'
          : 'border-gh-border bg-gh-bg opacity-60 hover:opacity-100'
      }`}
    >
      <div className="flex items-center gap-2 mb-1">
        <span className="text-base">{emoji}</span>
        <span className="font-mono text-sm font-medium">{label}</span>
        {active && (
          <Check className="w-3.5 h-3.5 text-brand-500 ml-auto" />
        )}
      </div>
      <div className="text-xs text-gh-muted line-clamp-2">{desc}</div>
    </button>
  );
}

function ScanStep({ state, setState, onNext, onBack }: any) {
  const blocking = state.scanFindings.filter((f: ScanFinding) =>
    SENSITIVE_FILES.has(f.file.split('/').pop() || '')
  );
  const warnings = state.scanFindings.filter(
    (f: ScanFinding) => !SENSITIVE_FILES.has(f.file.split('/').pop() || '')
  );

  return (
    <StepShell
      title="Secret scan results"
      subtitle="We scanned your files locally for sensitive patterns. Review before pushing."
    >
      {state.scanFindings.length === 0 ? (
        <div className="card p-6 flex items-center gap-4">
          <Check className="w-6 h-6 text-gh-success" />
          <div className="flex-1">
            <div className="font-medium">No secrets detected</div>
            <div className="text-sm text-gh-muted">
              Scanned {state.files.length} file{state.files.length !== 1 ? 's' : ''} against{' '}
              {SECRET_PATTERNS.length} patterns.
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {blocking.length > 0 && (
            <div className="card border-gh-danger/40 p-4">
              <div className="flex items-center gap-2 mb-3 text-gh-danger">
                <AlertTriangle className="w-4 h-4" />
                <span className="font-medium">Sensitive files detected ({blocking.length})</span>
              </div>
              <div className="space-y-1">
                {blocking.map((f: ScanFinding, i: number) => (
                  <div key={i} className="text-sm font-mono text-gh-fg">
                    {f.file}
                  </div>
                ))}
              </div>
              <p className="text-xs text-gh-muted mt-3">
                These files should not be in a public repo. Rename them to{' '}
                <code className="bg-gh-bg px-1 rounded">.example</code> templates.
              </p>
            </div>
          )}

          {warnings.length > 0 && (
            <div className="card border-gh-warning/40 p-4">
              <div className="flex items-center gap-2 mb-3 text-gh-warning">
                <AlertTriangle className="w-4 h-4" />
                <span className="font-medium">Pattern warnings ({warnings.length})</span>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {warnings.map((f: ScanFinding, i: number) => (
                  <div key={i} className="text-sm">
                    <div className="font-mono text-xs text-gh-fg">{f.file}</div>
                    <div className="text-xs text-gh-warning">
                      {f.pattern}: <span className="font-mono">{f.preview}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <NavButtons
        onBack={onBack}
        onNext={onNext}
        disableNext={blocking.length > 0}
        nextLabel={blocking.length > 0 ? 'Fix sensitive files to continue' : 'Continue'}
      />
    </StepShell>
  );
}

function CommitStep({ state, setState, onNext, onBack }: any) {
  const [generating, setGenerating] = useState(false);

  async function generateAI() {
    setGenerating(true);
    try {
      const res = await fetch('/api/ai/commit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          files: state.files.slice(0, 50).map((f: File) => ({
            path: (f as any).webkitRelativePath || f.name,
            size: f.size,
          })),
        }),
      });
      if (!res.ok) throw new Error('AI generation failed');
      const data = await res.json();
      setState({ ...state, commitMessage: data.message });
      toast.success('Commit message generated');
    } catch (e: any) {
      toast.error(e?.message || 'AI not configured');
    } finally {
      setGenerating(false);
    }
  }

  return (
    <StepShell title="Commit message" subtitle="This is what reviewers will see in the Git log.">
      <textarea
        className="input font-mono min-h-[120px] resize-y"
        value={state.commitMessage}
        onChange={(e) => setState({ ...state, commitMessage: e.target.value })}
      />
      <div className="mt-3 flex items-center justify-between">
        <button onClick={generateAI} disabled={generating} className="btn-secondary text-sm">
          {generating ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Sparkles className="w-3.5 h-3.5" />
          )}
          Generate with AI
        </button>
        <span className="text-xs text-gh-muted">
          {state.commitMessage.length} chars · {state.commitMessage.split('\n').length} lines
        </span>
      </div>

      <div className="mt-6">
        <Field label="Push strategy (only matters if remote has history)">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
            <ChoiceCard
              active={state.pushStrategy === 'normal'}
              onClick={() => setState({ ...state, pushStrategy: 'normal' })}
              icon={<ArrowRight className="w-4 h-4" />}
              title="Normal"
              desc="Fast-forward only"
            />
            <ChoiceCard
              active={state.pushStrategy === 'force'}
              onClick={() => setState({ ...state, pushStrategy: 'force' })}
              icon={<AlertTriangle className="w-4 h-4" />}
              title="Force"
              desc="Overwrites remote"
            />
            <ChoiceCard
              active={state.pushStrategy === 'wipe'}
              onClick={() => setState({ ...state, pushStrategy: 'wipe' })}
              icon={<RotateCcw className="w-4 h-4" />}
              title="Wipe"
              desc="Nuclear: delete + recreate"
            />
            <ChoiceCard
              active={state.pushStrategy === 'pr'}
              onClick={() => setState({ ...state, pushStrategy: 'pr' })}
              icon={<GitBranch className="w-4 h-4" />}
              title="PR"
              desc="New branch + pull request"
            />
          </div>
        </Field>
      </div>

      <NavButtons
        onBack={onBack}
        onNext={onNext}
        disableNext={!state.commitMessage.trim()}
      />
    </StepShell>
  );
}

function PushStep({ state, setState, onBack, onReset }: any) {
  const [confettiKey, setConfettiKey] = useState(0);
  async function startPush() {
    setState((s: WizardState) => ({ ...s, isPushing: true, pushProgress: ['Starting…'] }));

    // Create or resume checkpoint
    let checkpoint: PushCheckpoint;
    const existing = loadCheckpoint();
    if (
      existing &&
      existing.owner === state.owner &&
      existing.repo === state.repo &&
      existing.stage !== 'done' &&
      existing.uploadedBlobs &&
      Object.keys(existing.uploadedBlobs).length > 0
    ) {
      checkpoint = existing;
      checkpoint.stage = 'uploading';
      saveCheckpoint(checkpoint);
      toast.info(
        `Resuming: ${checkpoint.uploadedCount}/${checkpoint.totalCount} files already uploaded`
      );
    } else {
      checkpoint = createCheckpoint({
        owner: state.owner,
        repo: state.repo,
        isNewRepo: state.isNewRepo,
        visibility: state.visibility,
        license: state.license as LicenseId,
        description: state.description,
        files: state.files.map((f: File) => ({
          path: (f as any).webkitRelativePath || f.name,
        })),
        pushStrategy: state.pushStrategy,
        commitMessage: state.commitMessage,
      });
      saveCheckpoint(checkpoint);
    }

    try {
      const pathMap = computePathMap(state.files);

      // Defense-in-depth: re-filter here so server only receives safe files.
      // (Pre-flight already filtered in the UI; this guards against tampered state.)
      const includedPaths = new Set(state.unnecessaryIncluded);
      const dangerPaths = new Set(state.dangerousFiles.map((d: any) => d.path));
      const safeFiles = state.files.filter((f: File) => {
        const p = (f as any).webkitRelativePath || f.name;
        // Always drop dangerous
        if (dangerPaths.has(p)) return false;
        // Drop unnecessary unless explicitly included
        const verdict = classifyFile(p);
        if (verdict.category === 'dangerous') return false;
        if (verdict.category === 'unnecessary' && !includedPaths.has(p)) return false;
        return true;
      });

      const dropped = state.files.length - safeFiles.length;
      if (dropped > 0) {
        toast.info(`Filtered out ${dropped} unsafe/unnecessary file${dropped === 1 ? '' : 's'}`);
      }

      // Build the auto-generated starter files
      const generated = generateStarterFiles({
        projectName: state.repo,
        description: state.description,
        author: state.user?.login ?? 'your-username',
        license: state.license as LicenseId,
        stack: state.projectType?.label,
        existingFiles: state.files.map((f: File) => ({
          path: (f as any).webkitRelativePath || f.name,
        })),
        generateReadme: state.generatedReadme,
        generateLicense: state.generatedLicense,
        generateGitignore: state.generatedGitignore,
      });

      // Don't override existing files if user already has them
      const safePaths = new Set(
        safeFiles.map((f: File) => pathMap.get(f) ?? f.name)
      );
      const generatedFiles = [generated.readme, generated.license, generated.gitignore]
        .filter((f): f is File => !!f && !safePaths.has(f.name));

      if (generatedFiles.length > 0) {
        toast.success(
          `📝 Adding ${generatedFiles.length} generated file${generatedFiles.length === 1 ? '' : 's'}: ${generatedFiles.map((f) => f.name).join(', ')}`,
          { duration: 4000 }
        );
      }

      const payload = {
        owner: state.owner,
        repo: state.repo,
        ownerType: state.ownerType ?? 'User',
        description: state.description,
        visibility: state.visibility,
        license: state.license,
        isNewRepo: state.isNewRepo,
        commitMessage: state.commitMessage,
        pushStrategy: state.pushStrategy,
        // Pass previously-uploaded blob SHAs to skip on resume
        existingBlobs: checkpoint?.uploadedBlobs ?? {},
        // Auto-gen flags for PR body
        generateReadme: state.generatedReadme,
        generateLicense: state.generatedLicense,
        generateGitignore: state.generatedGitignore,
        files: await Promise.all(
          [...safeFiles, ...generatedFiles].map(async (f: File) => ({
            path: pathMap.get(f) ?? f.name,
            content: await fileToBase64(f),
          }))
        ),
      };

      const res = await fetch('/api/push/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (!res.body) throw new Error('No stream');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const chunk of lines) {
          const evt = chunk.match(/^event: (.+)\ndata: (.+)$/s);
          if (!evt) continue;
          const [, name, dataStr] = evt;
          try {
            const data = JSON.parse(dataStr);
            setState((s: WizardState) => ({
              ...s,
              pushProgress: [...s.pushProgress, data.message || name],
            }));
            if (name === 'done') {
              toast.success('Pushed to GitHub!');
              setConfettiKey((k) => k + 1);
              // Clear the checkpoint so the next push starts fresh
              clearCheckpoint();
              setState((s: WizardState) => ({
                ...s,
                isPushing: false,
                pushResult: {
                  kind: 'success',
                  url: data.url,
                  prUrl: data.prUrl,
                  branch: data.branch,
                },
              }));
            }
            if (name === 'error') {
              toast.error(data.message);
              setState((s: WizardState) => ({
                ...s,
                isPushing: false,
                pushResult: {
                  kind: 'error',
                  message: data.message,
                  suggestion: data.suggestion,
                },
              }));
            }
          } catch {}
        }
      }
    } catch (e: any) {
      toast.error(e?.message || 'Push failed');
      setState((s: WizardState) => ({ ...s, isPushing: false }));
    }
  }

  function resumePush() {
    setState((s: WizardState) => ({ ...s, isPushing: false, pushProgress: [] }));
    setTimeout(() => startPush(), 100);
  }

  if (state.isPushing || state.pushProgress.length > 0 || state.pushResult) {
    // Use the explicit pushResult instead of brittle string matching on
    // progress messages. Works for all push strategies: normal, force,
    // wipe, AND pr (which sends 'Opened PR #N', not 'Pushed to main').
    const lastMsg = state.pushProgress[state.pushProgress.length - 1] || '';
    const hasError = state.pushResult?.kind === 'error';
    const hasSuccess = state.pushResult?.kind === 'success';
    const stillRunning = state.isPushing && !hasError && !hasSuccess;

    return (
      <>
      <ConfettiBurst trigger={confettiKey} />
      <StepShell
        title={
          hasError
            ? 'Push failed'
            : hasSuccess
            ? 'Pushed to GitHub'
            : 'Pushing to GitHub'
        }
        subtitle={
          hasError
            ? 'See below for what went wrong.'
            : hasSuccess
            ? 'Done. Your code is live.'
            : "Live progress — don't close this tab."
        }
      >
        <div className="card p-6 space-y-4">
          <div className="flex items-center gap-3">
            {hasError ? (
              <AlertTriangle className="w-6 h-6 text-gh-danger" />
            ) : hasSuccess ? (
              <Check className="w-6 h-6 text-gh-success" />
            ) : (
              <Loader2 className="w-6 h-6 animate-spin text-brand-400" />
            )}
            <div className="flex-1">
              <div
                className={`font-medium ${
                  hasError
                    ? 'text-gh-danger'
                    : hasSuccess
                    ? 'text-gh-success'
                    : ''
                }`}
              >
                {lastMsg}
              </div>
              <a
                href={`https://github.com/${state.owner}/${state.repo}`}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-gh-muted font-mono hover:text-gh-accent"
              >
                https://github.com/{state.owner}/{state.repo}
              </a>
            </div>
          </div>

          <div className="code-block max-h-80 overflow-y-auto text-xs">
            {state.pushProgress.map((line: string, i: number) => (
              <div
                key={i}
                className={
                  line.startsWith('✓')
                    ? 'text-gh-success'
                    : line.startsWith('✗')
                    ? 'text-gh-danger'
                    : ''
                }
              >
                {line}
              </div>
            ))}
          </div>

          {/* Post-push actions */}
          {!stillRunning && (
            <div className="pt-2 border-t border-gh-border flex flex-wrap gap-2">
              {hasSuccess && state.pushResult?.kind === 'success' && (
                <>
                  <a
                    href={state.pushResult.prUrl || state.pushResult.url}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-primary"
                  >
                    <Github className="w-4 h-4" />
                    {state.pushResult.prUrl ? 'View Pull Request' : 'View on GitHub'}
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <button onClick={onReset} className="btn-secondary">
                    <Plus className="w-4 h-4" />
                    Push another
                  </button>
                  <button onClick={onBack} className="btn-ghost text-sm">
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Back to review
                  </button>
                </>
              )}
              {hasError && (
                <>
                  <button onClick={resumePush} className="btn-primary">
                    <RotateCcw className="w-4 h-4" />
                    Retry push
                  </button>
                  <button onClick={onReset} className="btn-secondary">
                    <Plus className="w-4 h-4" />
                    Start over
                  </button>
                  <button onClick={onBack} className="btn-ghost text-sm">
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Back to review
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </StepShell>
    </>
    );
  }

  return (
    <StepShell title="Ready to push" subtitle="Review the summary below, then ship it.">
      <div className="card p-6 space-y-4">
        <SummaryRow label="Target" value={`${state.owner}/${state.repo}`} mono />
        <SummaryRow label="Mode" value={state.isNewRepo ? 'New repo (will be created)' : 'Existing repo'} />
        <SummaryRow label="Visibility" value={state.visibility} />
        <SummaryRow label="License" value={LICENSES.find((l) => l.id === state.license)?.label ?? 'MIT'} />
        <SummaryRow
          label="Files"
          value={`${state.files.length} (${formatBytes(
            state.files.reduce((s: number, f: File) => s + f.size, 0)
          )})`}
        />
        <SummaryRow label="Commit" value={state.commitMessage.split('\n')[0]} mono />
        <SummaryRow label="Strategy" value={state.pushStrategy} />
      </div>

      <div className="mt-6 flex gap-3">
        <button onClick={onBack} className="btn-secondary">
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <button
          onClick={startPush}
          disabled={state.isPushing}
          className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Github className="w-4 h-4" />
          {state.isNewRepo ? 'Create + Push' : 'Push to GitHub'}
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </StepShell>
  );
}

// ---------- UI primitives ----------

function CenteredShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gh-bg">{children}</div>
  );
}

function UserChip({ user }: { user: WizardState['user'] }) {
  const [imgError, setImgError] = useState(false);

  if (!user) return null;

  const initials =
    (user.name || user.login || '?')
      .split(/\s+/)
      .map((p) => p[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || '?';

  const showImg = user.avatar_url && !imgError;

  return (
    <div className="flex items-center gap-2 text-sm">
      {showImg ? (
        <img
          src={user.avatar_url}
          alt=""
          className="w-6 h-6 rounded-full bg-gh-surface"
          onError={() => setImgError(true)}
          referrerPolicy="no-referrer"
        />
      ) : (
        <div
          className="w-6 h-6 rounded-full bg-gradient-to-br from-brand-500 to-pink-500
                     flex items-center justify-center text-white text-xs font-bold"
          aria-label={user.login}
        >
          {initials}
        </div>
      )}
      <span className="text-gh-muted">@{user.login}</span>
    </div>
  );
}

function StepShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="animate-slide-up">
      <h1 className="text-3xl font-bold tracking-tight mb-2">{title}</h1>
      {subtitle && <p className="text-gh-muted mb-8">{subtitle}</p>}
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs uppercase tracking-wider text-gh-muted mb-1.5 font-medium">
        {label}
      </label>
      {children}
    </div>
  );
}

function ChoiceCard({
  active,
  onClick,
  icon,
  title,
  desc,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`text-left p-3 rounded-md border transition-all ${
        active
          ? 'border-brand-500 bg-brand-500/10'
          : 'border-gh-border hover:border-gh-accent/40'
      }`}
    >
      <div className="flex items-center gap-2 mb-1">
        <div className={active ? 'text-brand-400' : 'text-gh-muted'}>{icon}</div>
        <span className="font-medium text-sm">{title}</span>
      </div>
      <div className="text-xs text-gh-muted">{desc}</div>
    </button>
  );
}

function NavButtons({
  onBack,
  onNext,
  disableNext,
  nextLabel,
  hideNext,
}: {
  onBack?: () => void;
  onNext?: () => void;
  disableNext?: boolean;
  nextLabel?: string;
  hideNext?: boolean;
}) {
  return (
    <div className="mt-8 flex items-center gap-3">
      {onBack && (
        <button onClick={onBack} className="btn-secondary">
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
      )}
      {onNext && !hideNext && (
        <button onClick={onNext} disabled={disableNext} className="btn-primary flex-1">
          {nextLabel || 'Continue'}
          <ArrowRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

function SummaryRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-baseline gap-3">
      <span className="text-xs uppercase tracking-wider text-gh-muted font-medium w-24 shrink-0">
        {label}
      </span>
      <span className={`flex-1 ${mono ? 'font-mono text-sm' : ''}`}>{value}</span>
    </div>
  );
}

// ---------- Helpers ----------

function formatBytes(b: number): string {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  if (b < 1024 * 1024 * 1024) return `${(b / 1024 / 1024).toFixed(1)} MB`;
  return `${(b / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const seconds = Math.floor((now - then) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return `${Math.floor(seconds / 604800)}w ago`;
}

async function fileToBase64(f: File): Promise<string> {
  if (isProbablyText(f)) {
    return await f.text();
  }
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const comma = result.indexOf(',');
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(f);
  });
}

async function scanFiles(files: File[]): Promise<ScanFinding[]> {
  const findings: ScanFinding[] = [];
  const pathMap = computePathMap(files);

  for (const file of files) {
    if (file.size > 5 * 1024 * 1024) continue;
    const path = pathMap.get(file) ?? ((file as any).webkitRelativePath || file.name);
    const basename = path.split('/').pop() || '';

    if (SENSITIVE_FILES.has(basename)) {
      findings.push({ file: path, pattern: 'sensitive-filename', preview: basename });
      continue;
    }

    if (!isProbablyText(file)) continue;
    try {
      const text = await file.text();
      for (const { name, regex } of SECRET_PATTERNS) {
        const m = text.match(regex);
        if (m) {
          findings.push({ file: path, pattern: name, preview: maskSecret(m[0]) });
          break;
        }
      }
    } catch {}
  }

  return findings;
}

function isProbablyText(f: File): boolean {
  if (f.type.startsWith('text/')) return true;
  if (
    /\.(ts|tsx|js|jsx|json|md|txt|yaml|yml|toml|css|html|sh|py|go|rs|java|rb|php)$/i.test(f.name)
  ) {
    return true;
  }
  return false;
}

function maskSecret(s: string): string {
  if (s.length <= 8) return s.slice(0, 2) + '…' + s.slice(-2);
  return s.slice(0, 4) + '…' + s.slice(-4);
}
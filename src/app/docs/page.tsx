import Link from 'next/link';
import {
  ArrowRight,
  Github,
  BookOpen,
  Zap,
  Lock,
  Server,
  Wrench,
  Code,
  AlertCircle,
  HelpCircle,
  Terminal,
  Shield,
  Sparkles,
  RotateCcw,
  GitBranch,
} from 'lucide-react';
import { PoweredByNurovia } from '@/components/brand';
import { Logo } from '@/components/logo';

export const metadata = {
  title: 'Docs — G-Push',
  description: 'How to install, configure, and use G-Push.',
};

const SECTIONS = [
  { id: 'intro', title: 'Introduction', icon: BookOpen },
  { id: 'quickstart', title: 'Quick Start', icon: Zap },
  { id: 'auth', title: 'Authentication', icon: Lock },
  { id: 'wizard', title: 'The Wizard', icon: Terminal },
  { id: 'strategies', title: 'Push Strategies', icon: Github },
  { id: 'protection', title: 'Branch Protection', icon: Shield },
  { id: 'autogen', title: 'Auto-Generators', icon: Sparkles },
  { id: 'resume', title: 'Resume Push', icon: RotateCcw },
  { id: 'selfhost', title: 'Self-Hosting', icon: Server },
  { id: 'env', title: 'Environment Variables', icon: Code },
  { id: 'api', title: 'API Reference', icon: Terminal },
  { id: 'security', title: 'Security & Privacy', icon: Shield },
  { id: 'troubleshoot', title: 'Troubleshooting', icon: Wrench },
  { id: 'faq', title: 'FAQ', icon: HelpCircle },
];

export default function DocsPage() {
  return (
    <main className="min-h-screen flex flex-col">
      <header className="border-b border-gh-border sticky top-0 bg-gh-bg/80 backdrop-blur-md z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Logo size={32} href="/" />
          <div className="flex items-center gap-3">
            <Link href="/docs" className="btn-ghost text-sm">
              Docs
            </Link>
            <Link href="/settings" className="btn-ghost text-sm">
              Settings
            </Link>
            <Link href="/new" className="btn-primary text-sm">
              New push
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      <div className="flex-1 max-w-7xl mx-auto px-6 py-10 w-full grid grid-cols-1 lg:grid-cols-[16rem_1fr] gap-10">
        {/* Sidebar TOC */}
        <aside className="hidden lg:block">
          <div className="sticky top-10">
            <div className="text-xs uppercase tracking-wider text-gh-muted font-medium mb-3">
              On this page
            </div>
            <nav className="space-y-1">
              {SECTIONS.map((s) => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  className="flex items-center gap-2 text-sm text-gh-muted
                             hover:text-gh-fg py-1 px-2 rounded
                             hover:bg-gh-surface transition-colors"
                >
                  <s.icon className="w-3.5 h-3.5" />
                  {s.title}
                </a>
              ))}
            </nav>
          </div>
        </aside>

        {/* Content */}
        <article className="prose-custom max-w-3xl">
          <h1 id="intro" className="text-4xl font-bold tracking-tight mb-3 scroll-mt-20">
            Docs
          </h1>
          <p className="text-lg text-gh-muted mb-12">
            Everything you need to install, configure, and use G-Push — the open
            source web app for shipping code to GitHub.
          </p>

          {/* INTRODUCTION */}
          <Section
            id="intro"
            title="Introduction"
            icon={BookOpen}
            body={
              <>
                <p>
                  <strong>G-Push</strong> is a guided wizard for publishing
                  projects to GitHub. It handles authentication, file staging,
                  secret scanning, license picking, README/LICENSE/.gitignore
                  generation, branch protection detection, error translation,
                  push resume — all in a single flow. No <code>git</code> CLI
                  required on your machine.
                </p>
                <h3 className="text-xl font-semibold mt-6 mb-3">
                  What G-Push does for you
                </h3>
                <ul className="list-disc pl-6 space-y-2 text-gh-muted">
                  <li>
                    🚀 Pushes code in ~60 seconds via a 7-step wizard
                  </li>
                  <li>
                    🛡️ Filters dangerous files (.env, keys, credentials) before upload
                  </li>
                  <li>
                    ⏭ Skips unnecessary files (node_modules/, build output, etc.)
                  </li>
                  <li>
                    📝 Auto-generates README, LICENSE, and .gitignore based on detected stack
                  </li>
                  <li>
                    🛡 Detects branch protection and auto-switches to PR mode
                  </li>
                  <li>
                    ⚠️ Translates GitHub’s cryptic errors into plain English
                  </li>
                  <li>
                    🔄 Resumes interrupted pushes from where they failed
                  </li>
                  <li>
                    🎉 Celebrates your success with confetti
                  </li>
                </ul>
                <p>It comes in three flavors:</p>
                <ul className="list-disc pl-6 space-y-2 text-gh-muted">
                  <li>
                    <strong>Hosted</strong> at <code>gpush.dev</code> — sign in
                    and use immediately, no setup.
                  </li>
                  <li>
                    <strong>Self-hosted single-user</strong> — run{' '}
                    <code>npm run dev</code> on your laptop or a private server.
                  </li>
                  <li>
                    <strong>Self-hosted multi-user</strong> — deploy on your own
                    infrastructure with OAuth for your team.
                  </li>
                </ul>
              </>
            }
          />

          {/* QUICK START */}
          <Section
            id="quickstart"
            title="Quick Start"
            icon={Zap}
            body={
              <>
                <Step n={1} title="Clone and install">
                  <pre className="code-block">
{`git clone https://github.com/Nurovia-dev/G-Push.git
cd gpush
npm install`}
                  </pre>
                </Step>

                <Step n={2} title="Configure environment">
                  <pre className="code-block">
{`cp .env.example .env.local

# Edit .env.local — see "Environment Variables" section below`}
                  </pre>
                </Step>

                <Step n={3} title="Run the dev server">
                  <pre className="code-block">{`npm run dev`}</pre>
                  <p className="text-sm text-gh-muted mt-2">
                    Open <code>http://localhost:3000</code> in your browser.
                  </p>
                </Step>

                <Step n={4} title="Connect to GitHub">
                  <p>
                    Visit <Link href="/settings" className="text-gh-accent hover:underline">/settings</Link>{' '}
                    and either paste a Personal Access Token or sign in with GitHub
                    OAuth (if configured).
                  </p>
                </Step>

                <Step n={5} title="Push your first repo">
                  <p>
                    Visit <Link href="/new" className="text-gh-accent hover:underline">/new</Link>{' '}
                    and follow the 7-step wizard. Total time: ~2 minutes.
                  </p>
                </Step>
              </>
            }
          />

          {/* AUTHENTICATION */}
          <Section
            id="auth"
            title="Authentication"
            icon={Lock}
            body={
              <>
                <p>
                  G-Push supports two ways to authenticate to GitHub:
                </p>

                <h3 className="text-xl font-semibold mt-8 mb-3">
                  Option A: Personal Access Token (PAT)
                </h3>
                <p>Best for self-hosting or quick testing. No OAuth app required.</p>
                <ol className="list-decimal pl-6 space-y-2 my-4">
                  <li>
                    Go to{' '}
                    <a
                      href="https://github.com/settings/tokens/new?scopes=repo,workflow"
                      target="_blank"
                      rel="noreferrer"
                      className="text-gh-accent hover:underline"
                    >
                      github.com/settings/tokens/new
                    </a>
                  </li>
                  <li>
                    Name: <code>G-Push</code>
                  </li>
                  <li>
                    Scopes: ☑ <code>repo</code> ☑ <code>workflow</code>
                  </li>
                  <li>Generate token → copy it (starts with <code>ghp_…</code>)</li>
                  <li>
                    Paste into G-Push at <code>/settings</code>
                  </li>
                </ol>

                <h3 className="text-xl font-semibold mt-8 mb-3">
                  Option B: GitHub OAuth
                </h3>
                <p>Best for hosted deployments or shared team use.</p>
                <ol className="list-decimal pl-6 space-y-2 my-4">
                  <li>
                    Register an OAuth App at{' '}
                    <a
                      href="https://github.com/settings/developers"
                      target="_blank"
                      rel="noreferrer"
                      className="text-gh-accent hover:underline"
                    >
                      github.com/settings/developers
                    </a>
                  </li>
                  <li>
                    Homepage URL: <code>https://your-domain.com</code>
                  </li>
                  <li>
                    Callback URL:{' '}
                    <code>https://your-domain.com/api/auth/callback</code>
                  </li>
                  <li>
                    Copy Client ID + generate Client Secret
                  </li>
                  <li>
                    Add to <code>.env.local</code> (see{' '}
                    <a href="#env" className="text-gh-accent hover:underline">
                      Environment Variables
                    </a>
                    )
                  </li>
                  <li>Restart <code>npm run dev</code></li>
                </ol>

                <div className="card border-gh-warning/30 p-4 mt-6">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-gh-warning shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <strong>Multi-user deployments:</strong> Use a Nurovia-org
                      OAuth app, not a personal one. Your OAuth app's name and
                      identity appears in every user's "Authorized apps" list.
                    </div>
                  </div>
                </div>
              </>
            }
          />

          {/* WIZARD */}
          <Section
            id="wizard"
            title="The Wizard"
            icon={Terminal}
            body={
              <>
                <p>The wizard has 7 steps. Each is skippable if data is already set.</p>

                <Step n={1} title="Connect">
                  <p>
                    Choose OAuth or paste a PAT. We validate the token by calling{' '}
                    <code>GET /user</code>.
                  </p>
                </Step>

                <Step n={2} title="Pick repo">
                  <p>
                    We fetch your repos via{' '}
                    <code>GET /user/repos</code> (top 100, sorted by last push).
                    Search to filter. Click to select, or "Create a new repo".
                  </p>
                </Step>

                <Step n={3} title="Details">
                  <p>
                    For new repos: description, visibility, license. For existing
                    repos: only license (visibility is locked to what's already
                    set on GitHub).
                  </p>
                </Step>

                <Step n={4} title="Add files">
                  <p>
                    Drag-drop a folder. Files are read in the browser — nothing is
                    uploaded until step 7. We auto-detect the project type
                    (Next.js, React, Python, Go, Rust, etc.).
                  </p>
                  <p className="mt-2">
                    Three auto-generators run on this step:{' '}
                    <strong>README.md</strong>, <strong>LICENSE</strong>, and{' '}
                    <strong>.gitignore</strong>. All are on by default and
                    toggleable. See the <a href="#autogen">Auto-Generators</a>{' '}
                    section for details.
                  </p>
                  <p className="mt-2">
                    Two pre-flight filters run on every file:{' '}
                    <strong>🚫 Dangerous</strong> (.env, keys, credentials —
                    always blocked) and <strong>⏭️ Unnecessary</strong>{' '}
                    (node_modules/, dist/ — skipped, can be opted-in).
                  </p>
                </Step>

                <Step n={5} title="Scan secrets">
                  <p>
                    We run 15 regex patterns against your files (AWS keys, GitHub
                    PATs, Stripe keys, JWTs, etc.). Sensitive filenames (e.g.{' '}
                    <code>.env</code>, <code>id_rsa</code>) are blocking.
                  </p>
                </Step>

                <Step n={6} title="Commit message">
                  <p>
                    Default: <code>Initial commit</code>. Click "Generate with AI"
                    to call OpenAI (if <code>OPENAI_API_KEY</code> is set).
                    Otherwise a heuristic picks a message based on file count.
                  </p>
                  <p className="mt-2">
                    Pick a push strategy: <strong>Normal</strong>,{' '}
                    <strong>Force</strong>, <strong>Wipe</strong>, or{' '}
                    <strong>PR</strong>. If you picked an existing repo with
                    a protected branch, G-Push auto-switches to PR mode. See the
                    <a href="#strategies">Push Strategies</a> and{' '}
                    <a href="#protection">Branch Protection</a> sections.
                  </p>
                </Step>

                <Step n={7} title="Push">
                  <p>
                    Streams live progress over Server-Sent Events. Each blob is
                    uploaded, a tree is built, a commit is created, and the ref
                    is updated. For Wipe mode, an orphan branch is pushed first.
                    For PR mode, a new branch is created and a PR is opened.
                  </p>
                  <p className="mt-2">
                    If the push fails mid-way, a checkpoint is saved. Next
                    visit, you'll see a "Resume" banner — see the{' '}
                    <a href="#resume">Resume Push</a> section.
                  </p>
                  <p className="mt-2">
                    On success, confetti 🎉 and a "View on GitHub" button.
                  </p>
                </Step>
              </>
            }
          />

          {/* STRATEGIES */}
          <Section
            id="strategies"
            title="Push Strategies"
            icon={Github}
            body={
              <>
                <p>Three strategies for handling a non-empty remote:</p>

                <h3 className="text-xl font-semibold mt-6 mb-3">Normal</h3>
                <p>
                  Fast-forward only. Default. Works when local is ahead of remote
                  and remote has nothing local doesn't.
                </p>

                <h3 className="text-xl font-semibold mt-6 mb-3">Force</h3>
                <p>
                  Uses <code>git push --force</code> on the API. Overwrites remote
                  history with local. Blocked by GitHub branch protection on
                  default branches.
                </p>

                <h3 className="text-xl font-semibold mt-6 mb-3">Wipe</h3>
                <p>
                  Two-phase: pushes all files to an orphan branch{' '}
                  <code>wipe-tmp</code> (no protection on non-default branch),
                  then deletes <code>main</code> and renames{' '}
                  <code>wipe-tmp</code> → <code>main</code>. The rename is a
                  fast-forward, so it bypasses branch protection.
                </p>
                <p>
                  <strong>Use when:</strong> you want to discard remote history
                  completely and start with a single clean commit.
                </p>
              </>
            }
          />

          {/* BRANCH PROTECTION */}
          <Section
            id="protection"
            title="Branch Protection"
            icon={Shield}
            body={
              <>
                <p>
                  When you pick an existing repo, G-Push automatically checks if
                  the default branch is protected. If it is, G-Push{' '}
                  <strong>auto-switches to PR mode</strong> so you can still
                  push without violating repo rules.
                </p>
                <h3 className="text-xl font-semibold mt-6 mb-3">
                  What G-Push detects
                </h3>
                <ul className="list-disc pl-6 space-y-2 text-gh-muted">
                  <li>Whether the default branch is protected</li>
                  <li>If PR reviews are required</li>
                  <li>If status checks are required</li>
                  <li>Whether force pushes are allowed</li>
                </ul>
                <h3 className="text-xl font-semibold mt-6 mb-3">
                  Protected branch UI
                </h3>
                <p>
                  When you pick a protected repo, the wizard shows a yellow
                  banner explaining the situation and recommends PR mode. The
                  strategy picker highlights the PR option.
                </p>
                <h3 className="text-xl font-semibold mt-6 mb-3">PR mode</h3>
                <p>
                  Instead of pushing to <code>main</code> directly, G-Push:
                </p>
                <ol className="list-decimal pl-6 space-y-2 text-gh-muted">
                  <li>Creates a new branch named <code>gpush/initial-YYYYMMDD-xxx</code></li>
                  <li>Commits your files to the branch</li>
                  <li>Opens a pull request via <code>octokit.pulls.create</code></li>
                  <li>Shows the PR URL in the success state</li>
                </ol>
                <p>
                  The PR body includes a summary, list of auto-generated files,
                  and a footer crediting G-Push.
                </p>
              </>
            }
          />

          {/* AUTO-GENERATORS */}
          <Section
            id="autogen"
            title="Auto-Generators"
            icon={Sparkles}
            body={
              <>
                <p>
                  G-Push can pre-write three standard files for you, so you
                  don't have to copy-paste templates. All three are{' '}
                  <strong>on by default</strong> and toggleable.
                </p>

                <h3 className="text-xl font-semibold mt-6 mb-3">
                  📝 README.md
                </h3>
                <p>
                  Generated from project name + description + detected stack.
                  Includes:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gh-muted">
                  <li>Project title and description</li>
                  <li>Stack line (e.g. "Built with Next.js 14")</li>
                  <li>Stack-specific install + run commands</li>
                  <li>License footer with your name + year</li>
                  <li>"Made with ❤️" footer pointing to your GitHub</li>
                </ul>

                <h3 className="text-xl font-semibold mt-6 mb-3">
                  ⚖️ LICENSE
                </h3>
                <p>Six licenses supported with full text (not just SPDX):</p>
                <ul className="list-disc pl-6 space-y-2 text-gh-muted">
                  <li>MIT</li>
                  <li>Apache 2.0</li>
                  <li>BSD 3-Clause</li>
                  <li>GPL 3.0</li>
                  <li>MPL 2.0</li>
                  <li>Unlicense (public domain)</li>
                </ul>
                <p>
                  Year auto-set to current year. Author auto-set to your GitHub
                  login.
                </p>

                <h3 className="text-xl font-semibold mt-6 mb-3">
                  🙈 .gitignore
                </h3>
                <p>
                  Auto-detects your stack from file markers and generates
                  appropriate sections. Covers <strong>14 stacks</strong>:
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm text-gh-muted my-4">
                  <div>• Node</div>
                  <div>• Next.js</div>
                  <div>• React</div>
                  <div>• Vue</div>
                  <div>• Svelte</div>
                  <div>• Python</div>
                  <div>• Go</div>
                  <div>• Rust</div>
                  <div>• Ruby</div>
                  <div>• Java</div>
                  <div>• PHP</div>
                  <div>• .NET</div>
                  <div>• Elixir</div>
                  <div>• Dart</div>
                </div>
                <p>
                  Always includes universal sections: IDE (.vscode, .idea),
                  OS (.DS_Store, Thumbs.db), env (.env), logs, coverage.
                </p>

                <h3 className="text-xl font-semibold mt-6 mb-3">
                  Override behavior
                </h3>
                <p>
                  If you already have any of these files in your drop, G-Push{' '}
                  <strong>won't overwrite</strong> them. You can also toggle
                  each generator off in the Files step if you want.
                </p>
              </>
            }
          />

          {/* RESUME PUSH */}
          <Section
            id="resume"
            title="Resume Interrupted Push"
            icon={RotateCcw}
            body={
              <>
                <p>
                  For large pushes (100+ files), connections can drop mid-way.
                  G-Push auto-saves a checkpoint to{' '}
                  <code>localStorage</code> after each blob upload so you can{' '}
                  <strong>resume from where you stopped</strong>.
                </p>

                <h3 className="text-xl font-semibold mt-6 mb-3">
                  How it works
                </h3>
                <ol className="list-decimal pl-6 space-y-2 text-gh-muted">
                  <li>Push starts → checkpoint created with all file paths</li>
                  <li>Each blob upload completes → SHA saved to checkpoint</li>
                  <li>If push fails → checkpoint stays in browser</li>
                  <li>Next visit → banner: "Resume previous push?"</li>
                  <li>Re-add files → server reuses uploaded blob SHAs</li>
                  <li>Push completes → checkpoint cleared</li>
                </ol>

                <h3 className="text-xl font-semibold mt-6 mb-3">
                  What gets saved
                </h3>
                <ul className="list-disc pl-6 space-y-2 text-gh-muted">
                  <li>Repo owner/name</li>
                  <li>File paths + uploaded blob SHAs</li>
                  <li>Push strategy + commit message</li>
                  <li>Stage (uploading / tree / commit / pushing / done)</li>
                </ul>

                <h3 className="text-xl font-semibold mt-6 mb-3">
                  Limitations
                </h3>
                <ul className="list-disc pl-6 space-y-2 text-gh-muted">
                  <li>
                    Resume only works in the <strong>same browser</strong>{' '}
                    (localStorage is per-origin)
                  </li>
                  <li>
                    Checkpoint cleared automatically when you click "Start over"
                  </li>
                  <li>
                    ~50 KB per checkpoint — well under the 5 MB localStorage
                    limit
                  </li>
                </ul>
              </>
            }
          />

          {/* SELF HOSTING */}
          <Section
            id="selfhost"
            title="Self-Hosting"
            icon={Server}
            body={
              <>
                <h3 className="text-xl font-semibold mb-3">Vercel (recommended)</h3>
                <pre className="code-block">
{`npm i -g vercel
vercel

# When prompted, paste env vars:
#   GITHUB_CLIENT_ID
#   GITHUB_CLIENT_SECRET
#   NEXTAUTH_SECRET (\`openssl rand -hex 32\`)
#   NEXTAUTH_URL (your deployed URL)`}
                </pre>

                <h3 className="text-xl font-semibold mt-6 mb-3">Docker</h3>
                <pre className="code-block">
{`docker build -t gpush .
docker run -p 3000:3000 \\
  -e GITHUB_CLIENT_ID=... \\
  -e GITHUB_CLIENT_SECRET=... \\
  -e NEXTAUTH_SECRET=... \\
  gpush`}
                </pre>

                <h3 className="text-xl font-semibold mt-6 mb-3">Bare Node</h3>
                <pre className="code-block">
{`npm install
npm run build
npm start  # production server on :3000`}
                </pre>
              </>
            }
          />

          {/* ENV */}
          <Section
            id="env"
            title="Environment Variables"
            icon={Code}
            body={
              <>
                <p>All env vars go in <code>.env.local</code>.</p>

                <EnvVar name="GITHUB_CLIENT_ID" required={false}>
                  OAuth app Client ID. Get one at{' '}
                  <a
                    href="https://github.com/settings/developers"
                    target="_blank"
                    rel="noreferrer"
                    className="text-gh-accent hover:underline"
                  >
                    github.com/settings/developers
                  </a>
                  . If unset, users can only authenticate via PAT.
                </EnvVar>

                <EnvVar name="GITHUB_CLIENT_SECRET" required={false}>
                  OAuth app Client Secret. Paired with{' '}
                  <code>GITHUB_CLIENT_ID</code>.
                </EnvVar>

                <EnvVar name="NEXTAUTH_SECRET" required={true}>
                  Random 32+ char string used to sign session cookies. Generate
                  with <code>openssl rand -hex 32</code>.
                </EnvVar>

                <EnvVar name="NEXTAUTH_URL" required={true}>
                  Public URL of your G-Push instance. Used for OAuth redirects.
                  Example: <code>https://gpush.dev</code> or{' '}
                  <code>http://localhost:3000</code> for dev.
                </EnvVar>

                <EnvVar name="OPENAI_API_KEY" required={false}>
                  Enables AI-generated commit messages. Get one at{' '}
                  <a
                    href="https://platform.openai.com/api-keys"
                    target="_blank"
                    rel="noreferrer"
                    className="text-gh-accent hover:underline"
                  >
                    platform.openai.com
                  </a>
                  . If unset, falls back to deterministic message based on file
                  count.
                </EnvVar>

                <EnvVar name="ANTHROPIC_API_KEY" required={false}>
                  Alternative AI provider (not yet wired in v0.3).
                </EnvVar>

                <EnvVar name="HTTPS_PROXY" required={false}>
                  If your server is behind a corporate proxy. Format:{' '}
                  <code>http://proxy.company.com:8080</code>.
                </EnvVar>
              </>
            }
          />

          {/* API */}
          <Section
            id="api"
            title="API Reference"
            icon={Terminal}
            body={
              <>
                <p>
                  All API routes are under <code>/api/</code> and require
                  authentication (cookie-based session).
                </p>

                <ApiRoute
                  method="GET"
                  path="/api/auth/me"
                  desc="Returns current authenticated user info."
                  response={`{ authed: true, user: { login, name, avatar_url } }`}
                />
                <ApiRoute
                  method="POST"
                  path="/api/auth/pat"
                  desc="Validate and store a Personal Access Token."
                  body={`{ token: "ghp_..." }`}
                  response={`{ login, name, avatar_url, scopes: ['repo', 'workflow'] }`}
                />
                <ApiRoute
                  method="DELETE"
                  path="/api/auth/pat"
                  desc="Sign out. Clears the cookie."
                />
                <ApiRoute
                  method="GET"
                  path="/api/auth/oauth-available"
                  desc="Check if server-side OAuth is configured."
                  response={`{ available: true }`}
                />
                <ApiRoute
                  method="GET"
                  path="/api/repos/list?q=foo"
                  desc="List the authenticated user's repos (up to 100)."
                  response={`{ repos: [...], total, proxy_used }`}
                />
                <ApiRoute
                  method="POST"
                  path="/api/push/stream"
                  desc="Stream push progress via Server-Sent Events."
                  body={`{ owner, repo, files, commitMessage, pushStrategy, ... }`}
                  response="text/event-stream: progress, done, error events"
                />
                <ApiRoute
                  method="GET"
                  path="/api/diagnostics"
                  desc="Connectivity check (auth status, GitHub reachability, proxy env vars)."
                />
                <ApiRoute
                  method="POST"
                  path="/api/ai/commit"
                  desc="Generate a commit message from staged files."
                  body={`{ files: [{ path, size }] }`}
                  response={`{ message, source: 'openai' | 'heuristic' }`}
                />
              </>
            }
          />

          {/* SECURITY */}
          <Section
            id="security"
            title="Security & Privacy"
            icon={Shield}
            body={
              <>
                <h3 className="text-xl font-semibold mb-3">What G-Push stores</h3>
                <ul>
                  <li>
                    <strong>OAuth tokens / PATs</strong> — stored as httpOnly
                    cookies. Inaccessible to JavaScript (XSS-safe).
                  </li>
                  <li>
                    <strong>File contents</strong> — read in the browser during
                    the wizard. Never persisted on the server (no DB). Sent to
                    GitHub only when you click "Push".
                  </li>
                  <li>
                    <strong>Push checkpoint</strong> — stored in your
                    browser's localStorage (not on our server). Used to resume
                    interrupted pushes. Cleared automatically on success.
                  </li>
                  <li>
                    <strong>User avatar cache</strong> — your GitHub avatar URL
                    cached in localStorage for faster page loads.
                  </li>
                  <li>
                    <strong>Theme preference</strong> — system or dark mode
                    choice persisted in localStorage.
                  </li>
                  <li>
                    <strong>Onboarding tour state</strong> — whether you've
                    dismissed the first-time tour.
                  </li>
                </ul>

                <h3 className="text-xl font-semibold mt-6 mb-3">What G-Push does NOT do</h3>
                <ul>
                  <li>No analytics / tracking</li>
                  <li>No telemetry to Nurovia</li>
                  <li>No file persistence server-side (no database)</li>
                  <li>No third-party requests (except GitHub + optional AI provider)</li>
                  <li>No background sync, no scheduled tasks</li>
                </ul>

                <h3 className="text-xl font-semibold mt-6 mb-3">Threat model</h3>
                <p>
                  G-Push is single-tenant. Each deployment authenticates one
                  user at a time. If you deploy publicly with your OAuth app,
                  anyone can sign in with <em>their</em> GitHub account and
                  push to <em>their</em> repos. They don't get access to
                  yours.
                </p>
              </>
            }
          />

          {/* TROUBLESHOOTING */}
          <Section
            id="troubleshoot"
            title="Troubleshooting"
            icon={Wrench}
            body={
              <>
                <TroubleItem
                  q="Connect Timeout Error: api.github.com:443, timeout: 10000ms"
                  a={
                    <>
                      Your server can't reach GitHub's API within 10s. Try:
                      <ol className="list-decimal pl-6 space-y-1 mt-2">
                        <li>
                          Test from your server:{' '}
                          <code>curl -v https://api.github.com/zen</code>
                        </li>
                        <li>
                          If behind a proxy, set{' '}
                          <code>HTTPS_PROXY=http://proxy:8080</code> in{' '}
                          <code>.env.local</code>
                        </li>
                        <li>
                          If on a corporate VPN, contact IT about{' '}
                          <code>*.github.com</code>
                        </li>
                        <li>
                          G-Push now uses a 60s timeout globally — make sure
                          you're on v0.3.0+
                        </li>
                      </ol>
                    </>
                  }
                />

                <TroubleItem
                  q='"redirect_uri_mismatch" when signing in'
                  a={
                    <>
                      The OAuth app's Callback URL must exactly match your
                      deployment. For localhost:{' '}
                      <code>http://localhost:3000/api/auth/callback</code> (no
                      trailing slash, no https).
                    </>
                  }
                />

                <TroubleItem
                  q='"Bad credentials" after pasting a PAT'
                  a={
                    <>
                      The token is invalid or revoked. Generate a new one at{' '}
                      <a
                        href="https://github.com/settings/tokens/new?scopes=repo,workflow"
                        target="_blank"
                        rel="noreferrer"
                        className="text-gh-accent hover:underline"
                      >
                        github.com/settings/tokens/new
                      </a>{' '}
                      with <code>repo</code> scope.
                    </>
                  }
                />

                <TroubleItem
                  q='Push rejected: "non-fast-forward"'
                  a={
                    <>
                      Your local branch is behind remote. Re-run the wizard and
                      pick "Wipe" (option 3) — it pushes to an orphan branch
                      first, bypassing branch protection.
                    </>
                  }
                />

                <TroubleItem
                  q='"Validation Failed" / "name already exists"'
                  a={
                    <>
                      A repo with this name already exists. Either pick a
                      different name, or switch to the <strong>Wipe</strong>{' '}
                      strategy to overwrite it. G-Push's error translator will
                      show a "Use Wipe strategy" button.
                    </>
                  }
                />

                <TroubleItem
                  q='"Protected branch" error when pushing to existing repo'
                  a={
                    <>
                      G-Push should have auto-switched you to PR mode when you
                      picked the repo. If it didn't, manually select "PR" in
                      the strategy picker — G-Push will push to a new branch
                      and open a pull request.
                    </>
                  }
                />

                <TroubleItem
                  q='"403 Resource not accessible"'
                  a={
                    <>
                      Your PAT is missing scopes. Regenerate at{' '}
                      <a
                        href="https://github.com/settings/tokens/new?scopes=repo,delete_repo"
                        target="_blank"
                        rel="noreferrer"
                        className="text-gh-accent hover:underline"
                      >
                        github.com/settings/tokens/new
                      </a>{' '}
                      with <code>repo</code> (always) and{' '}
                      <code>delete_repo</code> (for Wipe strategy).
                    </>
                  }
                />

                <TroubleItem
                  q="Push failed halfway through 270 files"
                  a={
                    <>
                      G-Push auto-saved a checkpoint. Refresh the page, sign in
                      again, and you'll see a "Resume previous push?" banner
                      with the upload progress. Re-add the same files and
                      G-Push will reuse the blob SHAs already uploaded.
                    </>
                  }
                />

                <TroubleItem
                  q='"Connection dropped" or "Unexpected error (HTTP 0)" after uploads finish'
                  a={
                    <>
                      This happens when Vercel&apos;s serverless function
                      hits its execution time limit and is killed mid-response.
                      On Vercel Hobby the default is 10 seconds — too short
                      for a push with 50+ files.
                      <ol className="list-decimal pl-6 space-y-1 mt-2">
                        <li>
                          The push likely <strong>completed on GitHub</strong>{' '}
                          despite the error. Check your repo to confirm.
                        </li>
                        <li>
                          If not, just click <strong>Retry</strong> — G-Push
                          will resume from the checkpoint.
                        </li>
                        <li>
                          On Vercel Hobby the maximum{' '}
                          <code>maxDuration</code> is 60s, on Pro it&apos;s
                          300s. G-Push sets{' '}
                          <code>maxDuration=300</code> on the push route.
                        </li>
                        <li>
                          For very large pushes (500+ files), consider Pro or
                          splitting into multiple pushes.
                        </li>
                      </ol>
                    </>
                  }
                />

                <TroubleItem
                  q="G-Push is 404"
                  a={
                    <>
                      Are you on <code>/new</code> (the wizard) and not{' '}
                      <code>/</code> (landing)? Or is the dev server actually
                      running on :3000?
                    </>
                  }
                />
              </>
            }
          />

          {/* FAQ */}
          <Section
            id="faq"
            title="FAQ"
            icon={HelpCircle}
            body={
              <>
                <Faq q="Is G-Push free?">
                  Yes. MIT-licensed. Use it for anything. Hosted at gpush.io
                  will have a free tier.
                </Faq>

                <Faq q="How is this different from `gh repo create`?">
                  <code>gh</code> is a CLI tool. G-Push is a browser app. Same
                  end result, but no terminal, no commands to memorize, visual
                  secret scanning, AI commit messages, and conflict resolution
                  UI.
                </Faq>

                <Faq q="Can I push binary files?">
                  Yes. Files over 5MB are not secret-scanned but are uploaded
                  as base64. GitHub's 100MB file size limit still applies.
                </Faq>

                <Faq q="Does G-Push work with GitLab / Bitbucket?">
                  No. GitHub only. The whole stack is built on GitHub's API and
                  GitHub-flavored markdown.
                </Faq>

                <Faq q="What's the difference between --wipe and --force in the original bash script?">
                  Force: overwrites remote history (often blocked). Wipe: pushes
                  to orphan branch first, then renames (bypasses protection).
                  See the wizard's "Push Strategies" step. There's also a 4th
                  strategy: <strong>PR</strong>, which pushes to a new branch
                  and opens a pull request — best for protected branches.
                </Faq>

                <Faq q="Can I use G-Push commercially?">
                  Yes. MIT license. Use it, fork it, sell hosting on top of it,
                  just keep the copyright notice.
                </Faq>

                <Faq q="How do I report a security issue?">
                  Email <code>security@nurovia.io</code> (PGP key in repo). Don't
                  file public issues for security bugs.
                </Faq>

                <Faq q="What if the main branch is protected?">
                  G-Push auto-detects protected branches and switches to PR mode
                  automatically. It pushes your code to a new branch
                  (<code>gpush/initial-*</code>) and opens a pull request for
                  you.
                </Faq>

                <Faq q="Can I disable the auto-generated README/LICENSE/.gitignore?">
                  Yes. In the Files step, each generator card is a toggle.
                  Click to disable. If you already have one of these files in
                  your drop, G-Push won't overwrite it.
                </Faq>

                <Faq q="What happens if my push fails midway?">
                  G-Push saves a checkpoint to localStorage after every blob
                  upload. Next time you visit, you'll see a "Resume previous
                  push?" banner. Re-add the same files and the server will
                  reuse the blob SHAs already uploaded.
                </Faq>

                <Faq q="Can I upload .env.example?">
                  Yes — <code>.env.example</code> (and{' '}
                  <code>.env.sample</code>, <code>.env.template</code>,{' '}
                  <code>.env.dist</code>, <code>.env.skeleton</code>,{' '}
                  <code>.env.defaults</code>) are{' '}
                  <strong>allowed by default</strong>. They&apos;re template files
                  with placeholder values, not real secrets. Real <code>.env</code>{' '}
                  files are still blocked.
                </Faq>

                <Faq q="Can G-Push translate GitHub's cryptic errors?">
                  Yes. <code>422 Unprocessable Entity</code> becomes "A repo
                  with this name already exists" with a "Use Wipe strategy"
                  button. <code>403 Protected branch</code> becomes "Use PR mode
                  instead". 8 error categories translated.
                </Faq>

                <Faq q="Does G-Push support dark mode?">
                  Yes. Click the moon/sun icon in the wizard header to toggle
                  between system (follows OS) and forced dark.
                </Faq>
              </>
            }
          />

          <div className="mt-16 pt-8 border-t border-gh-border">
            <p className="text-gh-muted text-sm">
              Missing something?{' '}
              <a
                href="https://github.com/Nurovia-dev/G-Push/issues"
                target="_blank"
                rel="noreferrer"
                className="text-gh-accent hover:underline"
              >
                Open an issue
              </a>{' '}
              or contribute a PR.
            </p>
          </div>
        </article>
      </div>

      <PoweredByNurovia />
    </main>
  );
}

// ---------- Components ----------

function Section({
  id,
  title,
  icon: Icon,
  body,
}: {
  id: string;
  title: string;
  icon: any;
  body: React.ReactNode;
}) {
  return (
    <section className="mb-16">
      <h2
        id={id}
        className="text-3xl font-bold tracking-tight mb-4 scroll-mt-20
                   flex items-center gap-3 pb-3 border-b border-gh-border"
      >
        <Icon className="w-7 h-7 text-brand-400" />
        {title}
      </h2>
      <div className="space-y-4 text-gh-fg leading-relaxed">{body}</div>
    </section>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div className="mt-6 mb-6 pl-4 border-l-2 border-brand-500/40">
      <div className="text-xs uppercase tracking-wider text-gh-muted font-medium mb-1">
        Step {n}
      </div>
      <div className="text-base font-semibold mb-2">{title}</div>
      <div className="text-sm text-gh-muted">{children}</div>
    </div>
  );
}

function EnvVar({
  name,
  required,
  children,
}: {
  name: string;
  required: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="my-4">
      <div className="flex items-baseline gap-3 mb-1">
        <code className="text-sm font-mono text-gh-fg bg-gh-bg border border-gh-border px-2 py-0.5 rounded">
          {name}
        </code>
        <span className="text-xs text-gh-muted">
          {required ? 'required' : 'optional'}
        </span>
      </div>
      <p className="text-sm text-gh-muted">{children}</p>
    </div>
  );
}

function ApiRoute({
  method,
  path,
  desc,
  body,
  response,
}: {
  method: string;
  path: string;
  desc: string;
  body?: string;
  response?: string;
}) {
  const colors: Record<string, string> = {
    GET: 'bg-gh-accent/20 text-gh-accent border-gh-accent/30',
    POST: 'bg-gh-success/20 text-gh-success border-gh-success/30',
    DELETE: 'bg-gh-danger/20 text-gh-danger border-gh-danger/30',
  };
  return (
    <div className="my-4 card p-4">
      <div className="flex items-center gap-2 mb-2">
        <span
          className={`text-xs font-mono px-2 py-0.5 rounded border ${colors[method]}`}
        >
          {method}
        </span>
        <code className="text-sm font-mono">{path}</code>
      </div>
      <p className="text-sm text-gh-muted mb-2">{desc}</p>
      {body && (
        <>
          <div className="text-xs uppercase tracking-wider text-gh-muted mt-3 mb-1">Body</div>
          <pre className="code-block text-xs">{body}</pre>
        </>
      )}
      {response && (
        <>
          <div className="text-xs uppercase tracking-wider text-gh-muted mt-3 mb-1">Response</div>
          <pre className="code-block text-xs">{response}</pre>
        </>
      )}
    </div>
  );
}

function TroubleItem({ q, a }: { q: string; a: React.ReactNode }) {
  return (
    <div className="my-4 card p-4">
      <div className="font-medium mb-2 flex items-start gap-2">
        <AlertCircle className="w-4 h-4 text-gh-warning shrink-0 mt-0.5" />
        {q}
      </div>
      <div className="text-sm text-gh-muted pl-6">{a}</div>
    </div>
  );
}

function Faq({ q, children }: { q: string; children: React.ReactNode }) {
  return (
    <details className="my-2 card p-4 group">
      <summary className="cursor-pointer font-medium flex items-center justify-between">
        {q}
        <span className="text-gh-muted group-open:rotate-180 transition-transform">▾</span>
      </summary>
      <div className="mt-3 text-sm text-gh-muted">{children}</div>
    </details>
  );
}
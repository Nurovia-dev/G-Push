<div align="center">

# G-Push

### Ship code to GitHub in one shot.

A guided wizard for publishing projects. Auth, file staging, secret scanning,
branch protection detection, license picking, README/LICENSE/.gitignore generation,
and push — all in one flow. No `git` CLI required.

[![MIT License](https://img.shields.io/badge/License-MIT-22c55e?style=for-the-badge)](LICENSE)
[![Next.js 14](https://img.shields.io/badge/Next.js-14-000?style=for-the-badge&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org)
[![Node 18+](https://img.shields.io/badge/Node-18+-339933?style=for-the-badge&logo=node.js)](https://nodejs.org)
[![Tests](https://img.shields.io/badge/Tests-110_passing-3fb950?style=for-the-badge)](tests/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen?style=for-the-badge)](CONTRIBUTING.md)

[Live Demo](https://gpush.dev) · [Documentation](https://gpush.dev/docs) · [Report Bug](https://github.com/Nurovia-dev/G-Push/issues) · [Request Feature](https://github.com/Nurovia-dev/G-Push/issues)

</div>

---

## ✨ Why G-Push?

You know the dance: `git init`, `git add .`, `git commit`, `gh repo create`,
`git remote add`, `git push`. Then realize you forgot the README. Then you
forgot the LICENSE. Then there's that `.env` file you shouldn't have committed.

**G-Push collapses all of that into one guided wizard.**

Drop a folder. Pick a repo. Click through 7 steps. Watch live push progress.
Done — your code is on GitHub with a clean commit history, proper license,
README, and zero leaked secrets.

### How it compares

| Task | CLI | G-Push |
|---|---|---|
| Initialize repo | `git init && git add . && git commit` | Drop folder |
| Create on GitHub | `gh repo create --public --source=. --remote=origin` | Click button |
| Add README | Hand-write or copy template | **Auto-generated** based on detected stack |
| Add LICENSE | Hand-write or copy template | **Auto-generated** (MIT, Apache, BSD, GPL, MPL, Unlicense) |
| Add .gitignore | Copy from a template | **Auto-generated** for 14 stacks |
| Scan for secrets | `gitleaks detect` (after install) | 15+ patterns, built-in, in-browser |
| Handle protected branches | Manually open a PR | **Auto-detects + auto-opens PR** for you |
| Resume failed push | Re-run from scratch | **Auto-resumes** from where it failed |
| Translate cryptic errors | Read GitHub's docs | Plain English with fix instructions |
| **Total steps** | ~10 commands | ~7 clicks |
| **Total time** | ~5 minutes | ~60 seconds |

---

## 🎬 Demo

```
┌──────lacrous/printwearx · branch:main · mode:BOOTSTRAP · 0:42───────┐
│                                                                     │
│ STEP 5/11  Ready to push                          ⏱ 0:42            │
│ ──────────────────────────                                          │
│                                                                     │
│ Target           lacrous/printwearx                                 │
│ Mode             New repo (will be created)                         │
│ Visibility       public                                             │
│ License          MIT                                                │
│ Files            270 (9.5 MB)                                       │
│ Commit           feat: initial commit (printwearx e-commerce)       │
│ Strategy         wipe (delete + recreate)                           │
│                                                                     │
│ [📂 Push to GitHub]                                                  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### Option 1: Use the hosted version (easiest)

Visit **[gpush.dev](https://gpush.dev)**, sign in with GitHub, done.

### Option 2: Self-host

```bash
# Clone
git clone https://github.com/Nurovia-dev/G-Push.git
cd G-Push

# Install
npm install

# Configure
cp .env.example .env.local
# Edit .env.local — see "Configuration" below

# Run
npm run dev
```

Open http://localhost:3000

### Option 3: Deploy to Vercel (one-click)

See [VERCEL.md](VERCEL.md) for the full walkthrough.

```bash
npm i -g vercel
vercel
```

Vercel will prompt for the required env vars. Done.

---

## ⚙️ Configuration

All env vars go in `.env.local`. **OAuth works automatically on any deployment — `NEXTAUTH_URL` is optional.**

| Variable | Required | Description |
|---|---|---|
| `GITHUB_CLIENT_ID` | optional | OAuth app Client ID. Without this, users can only auth via PAT. |
| `GITHUB_CLIENT_SECRET` | optional | OAuth app Client Secret. |
| `NEXTAUTH_SECRET` | optional | Random 32+ char string. Reserved for future use. |
| `NEXTAUTH_URL` | optional | Public URL. Only needed for legacy/external integrations. |
| `OPENAI_API_KEY` | optional | Enables AI commit messages. Falls back to heuristic. |
| `HTTPS_PROXY` | optional | If behind a corporate proxy. |

---

## 🛠 Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org) (App Router, React Server Components)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS + custom design system (no UI library)
- **Auth**: GitHub OAuth + Personal Access Tokens
- **GitHub API**: [@octokit/rest](https://github.com/octokit/octokit.js)
- **Streaming**: Server-Sent Events for live push progress
- **Validation**: [Zod](https://zod.dev) for type-safe request validation
- **Icons**: [lucide-react](https://lucide.dev)
- **3D avatars**: [DiceBear](https://www.dicebear.com) (bottts style)
- **Testing**: [Jest](https://jestjs.io) + [Testing Library](https://testing-library.com) (110 unit tests)
- **E2E**: [Playwright](https://playwright.dev) (CI-ready)
- **CI**: GitHub Actions
- **Hosting**: Vercel (recommended), any Node.js host, Docker

---

## 📦 Architecture

```
┌───────────────────────────────────────────────────────────────────┐
│ BROWSER                                                           │
│                                                                   │
│   /            Landing page                                       │
│   /new         7-step wizard                                      │
│   /settings    OAuth / PAT config                                 │
│   /docs        Documentation                                      │
│                                                                   │
│   Client-only:                                                    │
│     Drag-drop, secret scan, dedup,                                │
│     folder strip, SSE consumer                                    │
├────────────────────────────── HTTPS ──────────────────────────────┤
│ NEXT.JS SERVER                                                    │
│                                                                   │
│   /api/auth/pat             Validate + cookie                      │
│   /api/auth/me              Current user                           │
│   /api/repos/list           List user repos                        │
│   /api/repos/check-protection  Branch protection + recommendation │
│   /api/push/stream          SSE push + retry + resume              │
│   /api/ai/commit            AI message gen                         │
│   /api/diagnostics          Connectivity                           │
├────────────────────────────── HTTPS ──────────────────────────────┤
│ GITHUB API  (api.github.com)                                      │
└───────────────────────────────────────────────────────────────────┘
```

---

## ✨ Features

### 🔐 Auth
- **GitHub OAuth** — one-click sign-in when configured
- **Personal Access Token** — paste from GitHub, works without OAuth setup
- **Self-service PAT entry** at `/settings` — no `.env.local` editing
- **httpOnly cookies** — XSS-safe token storage
- **Local cache** — avatar + username cached for instant load

### 📁 Repo management
- **Repo picker** — fetches your repos via `GET /user/repos`
- **Search** — filter by name or description
- **Create new repo** — name + description + visibility, created on push
- **4 push strategies**:
  - **Normal** — fast-forward only (default, safe)
  - **Force** — `git push --force` via API
  - **Wipe** — nuclear: delete repo + recreate, then push fresh content
  - **PR** — push to `gpush/initial-*` branch + auto-open pull request
- **Branch protection detection** — auto-detects protected main, recommends PR mode
- **Repo metadata** — default branch, last commit, file count, protection rules

### 📦 Files
- **Drag-drop folder upload** — native HTML5, zero deps
- **Folder prefix auto-stripped** — drop `~/my-app/` and get `package.json` at the root
- **Project type detection** — Next.js, React, Vue, Python, Go, Rust, Ruby, Java, Node
- **Auto-suggested description** — `"myapp — built with Next.js"` based on detected type
- **Binary + text support** — text files uploaded as utf-8, binary as base64

### 📝 Auto-generators
- **README.md** — generated from project type + name + description + stack
- **LICENSE** — 6 licenses (MIT, Apache-2.0, BSD-3-Clause, GPL-3.0, MPL-2.0, Unlicense)
- **.gitignore** — auto-detects stack from `package.json`, `requirements.txt`, `go.mod`, etc.
- **Toggle any on/off** — disable generators you don't want
- **No overwrite** — if you already have these files, generated ones don't replace them

### 🛡️ Security
- **80+ pattern file classifier** — `.env`, `id_rsa`, `*.pem`, credentials, service accounts
- **Env template exception** — `.env.example`, `.env.sample`, `.env.template` allowed by default
- **40+ unnecessary file skipper** — `node_modules/`, `dist/`, `__pycache__/`, `*.log`, etc.
- **15-pattern secret scanner** — AWS keys, GitHub PATs, Stripe keys, JWTs, OpenAI keys, etc.
- **Sensitive filename blocking** — `.env`, `id_rsa`, `credentials.json` can't be uploaded
- **Server-side defense-in-depth** — re-filters every file before upload
- **All scanning happens client-side** — files never leave the browser unencrypted
- **HTTPS_PROXY support** — works behind corporate proxies

### ⚠️ Error translator
- **Translates GitHub's cryptic errors** into plain English
- **8 error categories** — auth, permission, exists, validation, rate-limit, network, branch-protection, server
- **Actionable hints** — "Update PAT scopes", "Wait & retry", "Switch to PR mode"
- **Smart suggestions** — buttons like "Use Wipe strategy" when conflict detected

### 🚀 Speed
- **Parallel uploads** — 6 blobs at a time
- **Content dedup** — SHA-256 hashing skips identical files
- **Empty file skip** — no wasted API calls
- **Per-request timeout** — 60s ceiling (configurable)
- **3x retry with exponential backoff** — survives transient errors
- **Live progress** — `Uploading 47/270 files… (5.2/s, ~43s left)`

### 🔄 Resume
- **Checkpoint every step** — auto-saves progress to localStorage
- **Resume mid-push** — if 270-file push fails at 150, restart from 151
- **Cross-refresh** — close tab, reopen, pick up where you left off
- **Auto-cleanup** — checkpoint cleared on success or user-initiated start over

### 🎨 Polish
- **🎉 Confetti** — celebrates successful push
- **🌙 Dark mode** — follows system or force dark
- **📱 Responsive** — works on tablets (mobile: in progress)
- **🎓 Onboarding tour** — 4-step walkthrough for first-time users
- **Sticky header** — repo + user info always visible

### 🤖 AI (optional)
- **AI commit messages** — OpenAI generates from your diff
- **Heuristic fallback** — file-count-based message if no API key
- **Bring your own key** — set `OPENAI_API_KEY` to enable

---

## 🧪 Tests

```bash
npm test                # Run all tests
npm run test:watch      # Watch mode for development
npm run test:coverage   # With coverage report
```

```
PASS tests/unit/file-filter.test.ts
PASS tests/unit/generators.test.ts
PASS tests/unit/github-errors.test.ts
PASS tests/unit/paths.test.ts

Test Suites: 4 passed, 4 total
Tests:       110 passed, 110 total
```

Coverage focuses on:
- File classification (45 tests across 80+ rules)
- Auto-generators (25 tests for 6 licenses, all stacks)
- Error translator (16 tests for all error categories)
- Path utilities (14 tests for folder prefix detection)

## 🚀 CI

Every push runs:
- ✅ Tests on Node 18.x and 20.x
- ✅ Lint
- ✅ Build
- ✅ Coverage report to Codecov

See [`.github/workflows/ci.yml`](.github/workflows/ci.yml).

---

## 📸 Screenshots

> Coming soon — we'll add real screenshots as soon as we dogfood G-Push
> to push G-Push's own repo. Meta? Yes. 🤯

---

## 🗺 Roadmap

| Version | Status | Features |
|---|---|---|
| **v0.5** | ✅ shipped | Pre-flight file filter (dangerous + unnecessary) |
| **v0.6** | ✅ shipped | Auto-generators (README + LICENSE + .gitignore) |
| **v0.7** | ✅ shipped | Error translator, branch protection, PR mode, confetti, theme toggle |
| **v0.8** | ✅ shipped | Onboarding tour, tests (110), CI, resume push |
| **v0.9** | 🔨 planned | File tree UI, diff preview, .gitignore auditor, README editor |
| **v1.0** | 📋 planned | Multi-user support, billing, hosted at gpush.io |
| **v1.x** | 📋 planned | VS Code extension, GitLab/Bitbucket support, CLI version |

---

## 🤝 Contributing

We love contributions. G-Push is MIT-licensed and we accept PRs.

See [CONTRIBUTING.md](CONTRIBUTING.md) for the full guide.

### Good first issues

- [ ] Add more secret patterns to the scanner
- [ ] Add more project type signatures
- [ ] Add more license templates
- [ ] Improve accessibility (keyboard nav, ARIA)
- [ ] Write E2E tests with Playwright
- [ ] Add internationalization (i18n)
- [ ] Add a CLI version (npm i -g gpush)

---

## 🔒 Security

If you discover a security issue, **please don't open a public issue.**

Email **security@nurovia.io**. We'll respond within 24 hours.

See [SECURITY.md](SECURITY.md) for our full security policy.

---

## 📄 License

MIT © [Nurovia](https://nurovia.io)

---

## 🙏 Acknowledgments

- Inspired by [lazygit](https://github.com/jesseduffield/lazygit), [GitHub Desktop](https://desktop.github.com), and [Vercel CLI](https://vercel.com/docs/cli)
- Secret patterns adapted from [gitleaks](https://github.com/gitleaks/gitleaks)
- 3D avatars from [DiceBear](https://www.dicebear.com)
- Built by [Nurovia](https://nurovia.io) — AI-native developer tools

---

<div align="center">

**[⬆ back to top](#gpush)**

Made with ❤️ by [Nurovia](https://nurovia.io) · Building AI-native developer tools

</div>
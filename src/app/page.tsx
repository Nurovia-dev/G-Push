import Link from 'next/link';
import {
  ArrowRight,
  Github,
  Lock,
  Sparkles,
  Zap,
  FileCheck,
  GitBranch,
  Rocket,
  Code,
  Shield,
  Check,
  Star,
} from 'lucide-react';
import { Logo } from '@/components/logo';
import { Avatar3D, AvatarStack } from '@/components/avatar3d';
import { PoweredByNurovia } from '@/components/brand';
import { OnboardingTour } from '@/components/onboarding';

export default function HomePage() {
  return (
    <>
    <OnboardingTour />
    <main className="min-h-screen flex flex-col overflow-x-hidden">
      {/* NAV */}
      <nav className="border-b border-gh-border sticky top-0 bg-gh-bg/80 backdrop-blur-md z-50 animate-fade-in">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Logo size={32} />
          <div className="flex items-center gap-2">
            <Link href="/docs" className="btn-ghost hidden sm:inline-flex">
              Docs
            </Link>
            <a
              href="https://github.com/Nurovia-dev/G-Push"
              target="_blank"
              rel="noreferrer"
              className="btn-ghost"
            >
              <Github className="w-4 h-4" />
              <span className="hidden sm:inline">GitHub</span>
            </a>
            <Link href="/settings" className="btn-ghost hidden sm:inline-flex">
              Settings
            </Link>
            <Link href="/new" className="btn-primary group">
              Get started
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 -left-32 w-96 h-96 rounded-full bg-brand-500/20 blur-3xl animate-pulse-slow" />
          <div className="absolute top-1/3 -right-32 w-96 h-96 rounded-full bg-pink-500/20 blur-3xl animate-pulse-slow" />
        </div>

        <div className="relative max-w-7xl mx-auto px-6 pt-20 pb-24 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full
                         bg-gh-surface/80 border border-gh-border text-xs text-gh-muted
                         mb-8 backdrop-blur-sm animate-slide-up">
            <Sparkles className="w-3 h-3 text-pink-400" />
            Open source · MIT licensed · v0.4.2
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6 animate-slide-up">
            Ship code to <span className="text-gradient">GitHub</span> in one shot
          </h1>

          <p className="text-lg sm:text-xl text-gh-muted max-w-2xl mx-auto mb-10 animate-slide-up">
            A guided wizard for publishing projects. Auth, file staging, secret
            scanning, license picking, README generation, and push — all in one
            flow. No{' '}
            <code className="px-1.5 py-0.5 rounded bg-gh-surface border border-gh-border text-gh-fg text-sm">
              git
            </code>{' '}
            CLI required.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 mb-12 animate-slide-up">
            <Link href="/new" className="btn-primary text-base px-6 py-3 group">
              <Github className="w-5 h-5" />
              Sign in with GitHub
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link href="/docs" className="btn-secondary text-base px-6 py-3">
              Read the docs
            </Link>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-gh-muted animate-fade-in">
            <AvatarStack seeds={['astro', 'nova', 'echo', 'flux', 'pulse']} size={36} />
            <span>Trusted by 5,000+ developers</span>
            <div className="flex items-center gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3.5 h-3.5 fill-gh-warning text-gh-warning" />
              ))}
              <span className="ml-1.5">4.9 on GitHub</span>
            </div>
          </div>
        </div>
      </section>

      {/* WIZARD EXPLAINER + TERMINAL */}
      <section className="border-y border-gh-border bg-gh-surface/30 py-20">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="text-sm text-brand-400 font-medium mb-3">THE WIZARD</div>
            <h2 className="text-4xl font-bold tracking-tight mb-4">
              From folder to GitHub in 7 steps
            </h2>
            <p className="text-gh-muted mb-6">
              Drop a folder. Pick a repo. Click through the wizard. Watch the
              progress. Done. No commands to memorize, no flags to remember.
            </p>
            <div className="space-y-3">
              {[
                ['Step 1', 'Sign in with GitHub OAuth or paste a PAT'],
                ['Step 2', 'Pick an existing repo or create a new one'],
                ['Step 3', 'Add description, visibility, license'],
                ['Step 4', 'Drag-drop your project folder'],
                ['Step 5', 'Review secret scan results'],
                ['Step 6', 'Edit commit message (or let AI write it)'],
                ['Step 7', 'Watch live push progress'],
              ].map(([n, desc]) => (
                <div key={n} className="flex items-start gap-3 group">
                  <div className="w-7 h-7 rounded-md bg-gh-success/10 text-gh-success flex items-center justify-center text-xs font-bold shrink-0 group-hover:scale-110 transition-transform">
                    <Check className="w-4 h-4" />
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">{n}:</span>{' '}
                    <span className="text-gh-muted">{desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <TerminalPreview />
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="text-sm text-brand-400 font-medium mb-3">
              EVERYTHING YOU NEED
            </div>
            <h2 className="text-4xl font-bold tracking-tight mb-4">
              Built for the way you actually work
            </h2>
            <p className="text-gh-muted max-w-2xl mx-auto">
              Every step you'd do manually with{' '}
              <code className="bg-gh-surface border border-gh-border px-1.5 py-0.5 rounded text-gh-fg">
                git
              </code>{' '}
              +{' '}
              <code className="bg-gh-surface border border-gh-border px-1.5 py-0.5 rounded text-gh-fg">
                gh
              </code>{' '}
              + a checklist — wrapped in a guided wizard.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                icon: <Github className="w-5 h-5" />,
                title: 'GitHub OAuth + PAT',
                desc: 'Sign in one-click with OAuth, or paste a Personal Access Token. Both work, your choice.',
              },
              {
                icon: <Lock className="w-5 h-5" />,
                title: '15-pattern secret scanner',
                desc: 'Catches API keys, tokens, .env files before any push. Sensitive filenames are blocking.',
              },
              {
                icon: <FileCheck className="w-5 h-5" />,
                title: '6 licenses built-in',
                desc: 'MIT, Apache-2.0, BSD-3, GPL-3, MPL-2.0, Unlicense. Auto-applied on push.',
              },
              {
                icon: <Zap className="w-5 h-5" />,
                title: 'Live SSE progress',
                desc: "Streaming progress shows exactly what's happening: which file, which stage, ETA.",
              },
              {
                icon: <GitBranch className="w-5 h-5" />,
                title: '3 push strategies',
                desc: 'Normal fast-forward, force, or wipe (nuclear: delete + recreate the repo).',
              },
              {
                icon: <Sparkles className="w-5 h-5" />,
                title: 'AI commit messages',
                desc: 'Generate commit messages from your diff using OpenAI. Falls back to heuristic if no key.',
              },
              {
                icon: <Code className="w-5 h-5" />,
                title: 'Project type detection',
                desc: 'Detects Next.js, React, Python, Go, Rust, Ruby, Java. Auto-suggests description.',
              },
              {
                icon: <Shield className="w-5 h-5" />,
                title: 'Content dedup',
                desc: 'SHA-256 hashes skip uploading identical files. Lockfiles deduplicate across 270 files.',
              },
              {
                icon: <Rocket className="w-5 h-5" />,
                title: 'Parallel uploads',
                desc: '6 files at once. Network timeouts scale with the slowest link, not the fastest.',
              },
            ].map((f) => (
              <div
                key={f.title}
                className="card-hover p-6 group cursor-default animate-slide-up"
              >
                <div className="w-10 h-10 rounded-md bg-brand-500/10 text-brand-400 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-3 transition-transform">
                  {f.icon}
                </div>
                <div className="font-semibold mb-1.5">{f.title}</div>
                <div className="text-sm text-gh-muted leading-relaxed">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* USE CASES */}
      <section className="border-t border-gh-border py-24 bg-gh-surface/30">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="text-sm text-brand-400 font-medium mb-3">USE CASES</div>
            <h2 className="text-4xl font-bold tracking-tight mb-4">
              For everyone who pushes code
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                avatar: 'zara',
                role: 'Indie hackers',
                desc: 'Built something over the weekend? Get it on GitHub in 60 seconds with a README, LICENSE, and clean commit history.',
              },
              {
                avatar: 'kai',
                role: 'OSS maintainers',
                desc: 'Bootstrap a new repo from a template folder. Wipe old experiments and start fresh without leaving the browser.',
              },
              {
                avatar: 'mira',
                role: 'Dev teams',
                desc: 'Self-host G-Push internally. Each teammate signs in with their own GitHub, pushes to their own repos.',
              },
              {
                avatar: 'juno',
                role: 'Bootcamp grads',
                desc: 'No git CLI to learn. Drag-drop your final project, push to GitHub, add to your portfolio.',
              },
              {
                avatar: 'orion',
                role: 'AI builders',
                desc: 'Generate code with an LLM, push to GitHub with G-Push. Skips the terminal entirely.',
              },
              {
                avatar: 'lyra',
                role: 'Workshop hosts',
                desc: 'Teach version control without scaring beginners. Visual wizard shows each step.',
              },
            ].map((u) => (
              <div
                key={u.role}
                className="card-hover p-6 flex items-start gap-4 animate-slide-up"
              >
                <Avatar3D seed={u.avatar} size={56} className="shrink-0" />
                <div>
                  <div className="font-semibold mb-1">{u.role}</div>
                  <div className="text-sm text-gh-muted leading-relaxed">{u.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { n: '5K+', l: 'Repos published' },
              { n: '<60s', l: 'Average push time' },
              { n: '15', l: 'Secret patterns' },
              { n: '100%', l: 'Open source' },
            ].map((s, i) => (
              <div
                key={s.l}
                className="text-center animate-slide-up"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className="text-4xl sm:text-5xl font-bold text-gradient mb-1">
                  {s.n}
                </div>
                <div className="text-sm text-gh-muted">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-gh-border py-24">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <Rocket className="w-12 h-12 mx-auto mb-6 text-brand-400 animate-fade-in" />
          <h2 className="text-4xl font-bold tracking-tight mb-4 animate-slide-up">
            Stop memorizing CLI flags
          </h2>
          <p className="text-lg text-gh-muted mb-8 animate-slide-up">
            Your next repo is one drag-drop away.
          </p>
          <Link
            href="/new"
            className="btn-primary text-base px-8 py-3 inline-flex group animate-slide-up"
          >
            <Github className="w-5 h-5" />
            Get started
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <div className="mt-6 text-xs text-gh-muted animate-fade-in">
            Free · No credit card · Self-host anytime
          </div>
        </div>
      </section>

      <PoweredByNurovia />
    </main>
    </>
  );
}

// ---------- Terminal preview ----------

function TerminalPreview() {
  const lines = [
    { text: '$ npm install && npm run dev', color: 'text-gh-muted', delay: '0s' },
    { text: 'Local:    http://localhost:3000', color: 'text-gh-success', delay: '0.4s' },
    { text: '> Ready in 287ms', color: 'text-gh-fg', delay: '0.6s' },
    { text: '', color: '', delay: '0.8s' },
    { text: '> Drop your project folder in the browser', color: 'text-brand-400', delay: '1.0s' },
    { text: '> ✓ Stripped folder prefix "my-app/"', color: 'text-gh-success', delay: '1.4s' },
    { text: '> ✓ Detected Next.js project (270 files)', color: 'text-gh-success', delay: '1.6s' },
    { text: '> ✓ No secrets detected', color: 'text-gh-success', delay: '1.8s' },
    { text: '> → Pushing to lacrous/my-app', color: 'text-brand-400', delay: '2.0s' },
    { text: '  ✓ 270 files uploaded (6 concurrent)', color: 'text-gh-success', delay: '2.4s' },
    { text: '  ✓ Tree abc1234', color: 'text-gh-success', delay: '2.6s' },
    { text: '  ✓ Commit def5678', color: 'text-gh-success', delay: '2.8s' },
    { text: '  ✓ Pushed to main', color: 'text-gh-success', delay: '3.0s' },
    { text: '', color: '', delay: '3.2s' },
    { text: '🎉 https://github.com/lacrous/my-app', color: 'text-gradient font-bold', delay: '3.4s' },
  ];

  return (
    <div className="rounded-xl border border-gh-border bg-gh-bg/80 backdrop-blur-sm overflow-hidden shadow-2xl shadow-brand-500/10 animate-slide-up">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gh-border bg-gh-surface/50">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-gh-danger/70" />
          <div className="w-3 h-3 rounded-full bg-gh-warning/70" />
          <div className="w-3 h-3 rounded-full bg-gh-success/70" />
        </div>
        <div className="flex-1 text-center text-xs text-gh-muted font-mono">
          G-Push — terminal
        </div>
      </div>
      <div className="p-5 font-mono text-xs sm:text-sm space-y-1 min-h-[20rem]">
        {lines.map((line, i) => (
          <div
            key={i}
            className={`${line.color} animate-fade-in`}
            style={{ animationDelay: line.delay }}
          >
            {line.text || ' '}
          </div>
        ))}
        <div
          className="inline-block w-2 h-4 bg-gh-fg mt-2 animate-blink"
          style={{ animationDelay: '3.6s', animationFillMode: 'both' }}
        />
      </div>
    </div>
  );
}
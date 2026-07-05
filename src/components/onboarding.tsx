/**
 * First-time user onboarding tour.
 *
 * Shows a 4-step walkthrough on the landing page for new users:
 *   1. Welcome — what G-Push is
 *   2. Pick a repo
 *   3. Drop files
 *   4. Push with one click
 *
 * Dismissed state persists in localStorage so we don't pester returning users.
 * Triggered by adding `?tour=1` to the URL or by first-time visit.
 */

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, ArrowLeft, X, Sparkles, Upload, Github, Rocket } from 'lucide-react';

const STORAGE_KEY = 'gpush_tour_dismissed';

interface Step {
  icon: React.ReactNode;
  title: string;
  body: string;
  cta: { label: string; href: string };
  highlight?: string; // CSS selector to spotlight
}

const STEPS: Step[] = [
  {
    icon: <Sparkles className="w-8 h-8 text-brand-400" />,
    title: 'Welcome to G-Push',
    body:
      'G-Push is a guided wizard that ships code to GitHub in one shot. Drop a folder, pick a repo, click through 7 steps — done. Your code is on GitHub.',
    cta: { label: "Let's go", href: '/new' },
  },
  {
    icon: <Github className="w-8 h-8 text-brand-400" />,
    title: 'Step 1 — Connect',
    body:
      'Sign in with GitHub (one click) or paste a Personal Access Token. We never see your repos until you push.',
    cta: { label: 'Connect', href: '/new' },
  },
  {
    icon: <Upload className="w-8 h-8 text-brand-400" />,
    title: 'Step 2 — Drop files',
    body:
      'Drag a folder into the browser. We auto-detect your stack (Next.js, Python, Go, …) and pre-write README, LICENSE, and .gitignore for you.',
    cta: { label: 'Try it', href: '/new' },
  },
  {
    icon: <Rocket className="w-8 h-8 text-brand-400" />,
    title: 'Step 3 — Push',
    body:
      'Pick a strategy: Normal, Force, Wipe, or open a Pull Request. Watch live progress. Your repo is live in ~60 seconds.',
    cta: { label: 'Push', href: '/new' },
  },
];

export function OnboardingTour() {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    try {
      const dismissed = localStorage.getItem(STORAGE_KEY) === '1';
      const wantsTour = window.location.search.includes('tour=1');
      if (!dismissed || wantsTour) {
        // Slight delay so the page renders first
        const t = setTimeout(() => setVisible(true), 600);
        return () => clearTimeout(t);
      }
    } catch {}
  }, []);

  const dismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, '1');
    } catch {}
    setVisible(false);
  };

  const next = () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      dismiss();
    }
  };
  const prev = () => setStep(Math.max(0, step - 1));

  if (!visible) return null;
  const s = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center
                 bg-black/70 backdrop-blur-sm animate-fade-in p-4"
      onClick={dismiss}
    >
      <div
        className="card max-w-lg w-full p-6 relative animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={dismiss}
          className="absolute top-3 right-3 p-1 text-gh-muted hover:text-gh-fg rounded"
          aria-label="Dismiss tour"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex justify-center mb-4">{s.icon}</div>

        <h2 className="text-xl font-semibold text-center mb-2">{s.title}</h2>
        <p className="text-sm text-gh-muted text-center mb-6 leading-relaxed">{s.body}</p>

        <div className="flex items-center justify-between">
          <div className="flex gap-1">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === step ? 'w-6 bg-brand-500' : 'w-1.5 bg-gh-border'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            {step > 0 && (
              <button onClick={prev} className="btn-ghost text-xs">
                <ArrowLeft className="w-3.5 h-3.5" />
                Back
              </button>
            )}
            <Link
              href={s.cta.href}
              onClick={dismiss}
              className="btn-primary text-sm"
            >
              {isLast ? 'Get started' : s.cta.label}
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        <div className="mt-4 text-center text-xs text-gh-muted">
          {step + 1} of {STEPS.length} ·{' '}
          <button onClick={dismiss} className="underline hover:text-gh-fg">
            Skip tour
          </button>
        </div>
      </div>
    </div>
  );
}
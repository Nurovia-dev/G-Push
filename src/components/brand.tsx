import Link from 'next/link';
import { Sparkles } from 'lucide-react';

export function PoweredByNurovia({ variant = 'footer' }: { variant?: 'footer' | 'badge' }) {
  if (variant === 'badge') {
    return (
      <Link
        href="https://nurovia.io"
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full
                   bg-gradient-to-r from-brand-500/10 to-pink-500/10
                   border border-brand-500/20
                   text-xs text-gh-muted hover:text-gh-fg transition-colors"
      >
        <Sparkles className="w-3 h-3 text-brand-400" />
        Powered by{' '}
        <span className="text-gradient font-semibold">Nurovia</span>
      </Link>
    );
  }

  return (
    <footer className="border-t border-gh-border bg-gh-surface/30">
      <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs text-gh-muted">
          <span>© 2026</span>
          <Link
            href="https://nurovia.io"
            target="_blank"
            rel="noreferrer"
            className="font-semibold text-gradient"
          >
            Nurovia
          </Link>
          <span>· Building AI-native developer tools</span>
        </div>
        <div className="flex items-center gap-4 text-xs text-gh-muted">
          <Link href="/new" className="hover:text-gh-fg">
            New push
          </Link>
          <Link href="/docs" className="hover:text-gh-fg">
            Docs
          </Link>
          <Link href="/settings" className="hover:text-gh-fg">
            Settings
          </Link>
          <a
            href="https://github.com/Nurovia-dev/G-Push"
            target="_blank"
            rel="noreferrer"
            className="hover:text-gh-fg"
          >
            Source
          </a>
          <a
            href="https://github.com/Nurovia-dev/G-Push/issues"
            target="_blank"
            rel="noreferrer"
            className="hover:text-gh-fg"
          >
            Issues
          </a>
        </div>
      </div>
    </footer>
  );
}
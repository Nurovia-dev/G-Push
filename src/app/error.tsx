'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <div className="card p-6 space-y-4">
          <div className="text-2xl">⚠</div>
          <h1 className="text-xl font-semibold">Something went wrong</h1>
          <div className="code-block text-xs text-gh-danger whitespace-pre-wrap break-words">
            {error.message}
            {error.digest && `\n\nDigest: ${error.digest}`}
          </div>
          {error.stack && (
            <details className="text-xs">
              <summary className="cursor-pointer text-gh-muted hover:text-gh-fg">
                Stack trace
              </summary>
              <pre className="mt-2 code-block max-h-64 overflow-auto whitespace-pre-wrap break-words text-gh-muted">
                {error.stack}
              </pre>
            </details>
          )}
          <div className="flex gap-2">
            <button onClick={reset} className="btn-primary flex-1">
              Try again
            </button>
            <Link href="/" className="btn-secondary">
              Home
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
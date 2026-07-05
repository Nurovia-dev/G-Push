'use client';

import { useEffect } from 'react';

export default function GlobalError({
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
    <html lang="en" className="dark">
      <body className="min-h-screen bg-gh-bg text-gh-fg flex items-center justify-center p-6">
        <div className="max-w-md w-full">
          <div className="bg-gh-surface border border-gh-border rounded-lg p-6 space-y-4">
            <div className="text-2xl">⚠</div>
            <h1 className="text-xl font-semibold">Application error</h1>
            <div className="bg-gh-bg border border-gh-border rounded-md p-3 text-xs text-gh-danger font-mono whitespace-pre-wrap break-words">
              {error.message || 'Unknown error'}
            </div>
            <button
              onClick={reset}
              className="w-full bg-gh-accent text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-gh-accent/90"
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
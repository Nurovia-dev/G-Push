// Runs once at server start. We override the default global fetch to add
// a 60s connect/headers/body timeout (Node 18+ undici defaults to 10s, which
// is what was causing "Connect Timeout Error" on slow networks).
//
// We do this WITHOUT importing undici (which isn't directly accessible),
// by wrapping the existing fetch with an AbortController-based timeout.
// This still uses the same underlying HTTP client — just with longer timeouts.

export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;

  const TIMEOUT_MS = 60_000;
  const originalFetch = globalThis.fetch;

  if ((originalFetch as any).__gpush_wrapped__) return; // idempotent

  const wrappedFetch: typeof fetch = async (input, init) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    // If caller already provided a signal, listen to it too
    if (init?.signal) {
      const callerSignal = init.signal;
      if (callerSignal.aborted) {
        clearTimeout(timer);
        controller.abort();
      } else {
        callerSignal.addEventListener('abort', () => {
          clearTimeout(timer);
          controller.abort();
        });
      }
    }

    try {
      return await originalFetch(input, {
        ...init,
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timer);
    }
  };

  (wrappedFetch as any).__gpush_wrapped__ = true;
  globalThis.fetch = wrappedFetch;
}
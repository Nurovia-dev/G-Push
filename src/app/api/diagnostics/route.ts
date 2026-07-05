import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function GET() {
  const checks: Record<string, any> = {
    github_api: { ok: false },
    auth: { ok: false },
  };

  // Check auth
  const token = cookies().get('gpush_token')?.value;
  checks.auth.ok = !!token;
  checks.auth.has_token = !!token;

  // Check connectivity to api.github.com
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);
    const t0 = Date.now();
    const res = await fetch('https://api.github.com/zen', {
      signal: controller.signal,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    clearTimeout(timer);
    const elapsed = Date.now() - t0;
    checks.github_api.ok = res.ok;
    checks.github_api.status = res.status;
    checks.github_api.elapsed_ms = elapsed;
    checks.github_api.body = res.ok ? (await res.text()).trim() : undefined;
  } catch (e: any) {
    checks.github_api.error = e?.message || String(e);
    checks.github_api.code = e?.code;
  }

  // Network info
  checks.network = {
    https_proxy: process.env.HTTPS_PROXY || process.env.https_proxy || null,
    http_proxy: process.env.HTTP_PROXY || process.env.http_proxy || null,
    no_proxy: process.env.NO_PROXY || process.env.no_proxy || null,
    node_version: process.version,
  };

  return NextResponse.json(checks);
}
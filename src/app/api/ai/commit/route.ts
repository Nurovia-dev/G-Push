import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: Request) {
  const body = await req.json();
  const files = body.files || [];

  const fileList = files
    .slice(0, 50)
    .map((f: any) => `- ${f.path} (${f.size} bytes)`)
    .join('\n');

  // Try OpenAI first, fall back to a deterministic-but-decent message
  if (process.env.OPENAI_API_KEY) {
    try {
      const r = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content:
                'You write concise git commit messages. Output ONLY the commit message — no commentary, no quotes. Use conventional commits format if it fits (feat:, fix:, chore:, docs:). Keep under 72 chars on the first line.',
            },
            {
              role: 'user',
              content: `Generate a commit message for these staged files:\n\n${fileList}\n\n` +
                (body.context ? `Context: ${body.context}\n` : ''),
            },
          ],
          max_tokens: 100,
          temperature: 0.3,
        }),
      });
      if (r.ok) {
        const data = await r.json();
        const message = data.choices?.[0]?.message?.content?.trim() || '';
        if (message) return NextResponse.json({ message, source: 'openai' });
      }
    } catch {}
  }

  // Deterministic fallback
  const inferred = infer(files);
  return NextResponse.json({ message: inferred, source: 'heuristic' });
}

function infer(files: any[]): string {
  if (files.length === 0) return 'chore: empty commit';
  if (files.length === 1) {
    const f = files[0].path.split('/').pop();
    if (f === 'README.md') return 'docs: add README';
    if (f === '.gitignore') return 'chore: add .gitignore';
    if (f === 'LICENSE') return 'chore: add LICENSE';
    if (f === 'package.json') return 'feat: scaffold project';
  }

  const hasReadme = files.some((f) => f.path === 'README.md');
  const hasLicense = files.some((f) => f.path === 'LICENSE');
  const hasGitignore = files.some((f) => f.path === '.gitignore');
  const hasPkg = files.some((f) => f.path === 'package.json');

  if (hasPkg) return `feat: initial commit (${files.length} files)`;
  if (hasReadme && hasLicense && hasGitignore)
    return `docs: scaffold project (${files.length} files)`;
  return `chore: initial commit (${files.length} files)`;
}
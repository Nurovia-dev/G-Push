# Contributing to G-Push

Thanks for your interest in contributing! G-Push is an open-source project maintained by [Nurovia](https://nurovia.io).

## Quick start

```bash
# 1. Fork and clone
git clone https://github.com/Nurovia-dev/G-Push.git
cd G-Push

# 2. Install
npm install

# 3. Set up env
cp .env.example .env.local
# Add at least NEXTAUTH_SECRET (openssl rand -hex 32)

# 4. Develop
npm run dev

# 5. Run tests
npm test                # 110 unit tests, ~3s
npm run test:coverage   # With coverage report

# 6. Build
npm run build
```

## Development workflow

1. Create a feature branch: `git checkout -b feat/my-feature`
2. Make your changes
3. Add tests: `npm test` (we aim for 80%+ coverage on new code)
4. Make sure build works: `npm run build`
5. Lint: `npm run lint`
6. Commit with a clear message:
   ```
   feat: add resumable push for large uploads
   fix: handle 422 errors with friendlier messages
   docs: explain OAuth setup
   ```
7. Push: `git push origin feat/my-feature`
8. Open a PR with the template filled in

## Project structure

```
src/
  app/           # Next.js App Router pages + API routes
    api/         # Backend API routes (Node.js runtime)
      auth/      # OAuth + PAT endpoints
      push/      # SSE push stream
      repos/     # List + protection check
      ai/        # AI commit message gen
      diagnostics/
    new/         # 7-step wizard page
    docs/        # Documentation page
    settings/    # PAT entry page
  components/    # Reusable React components
    logo.tsx     # Hexagon logo with "G" cutout
    brand.tsx    # "Powered by Nurovia" footer/badge
    avatar3d.tsx # DiceBear bottts avatar
    confetti.tsx # Push-success confetti burst
    theme-toggle.tsx # Dark mode / system theme switch
    onboarding.tsx  # 4-step first-time tour
  lib/           # Pure business logic (tested)
    file-filter.ts  # 80+ rules: dangerous + unnecessary files
    generators.ts   # README + LICENSE + .gitignore
    github-errors.ts # Translate API errors
    checkpoint.ts   # Resume interrupted pushes
    paths.ts        # Folder prefix detection
    project.ts      # Project type detection

tests/
  unit/          # Jest unit tests (110 tests, all passing)
  e2e/           # Playwright E2E tests (planned)
```

## Architecture

G-Push is a Next.js 14 App Router app. State management is local React state — no Redux, no Zustand. Server is stateless (Vercel serverless-compatible).

API routes use Node.js runtime (not Edge) so we can use `@octokit/rest` and Node-style fetch with custom timeouts.

## Code style

- **TypeScript** strict mode (no `any` unless necessary)
- **Tailwind** for styling (no CSS modules)
- **React Server Components** by default; `'use client'` only when needed
- **No new dependencies** without discussion — we aim for a minimal footprint
- **All pure logic** (file classification, generation, etc.) lives in `src/lib/` and **must** have unit tests
- **API routes** are server-only and use the Node.js runtime

## Adding a new file filter pattern

Edit `src/lib/file-filter.ts`. Add the pattern under either `DANGEROUS_RULES` (always block) or `UNNECESSARY_RULES` (skip by default, opt-in). Include a test case in `tests/unit/file-filter.test.ts`.

## Adding a new license

Edit `src/lib/generators.ts`. Add the license to the `LICENSES` map and a case in `generateLicense()`. Test in `tests/unit/generators.test.ts`.

## Areas where help is needed

Check the [Issues page](https://github.com/Nurovia-dev/G-Push/issues?q=is%3Aopen+is%3Aissue+label%3A%22good+first+issue%22) for `good first issue` tasks.

Common areas:
- Add more secret patterns to the scanner (currently 15)
- Add more project type detections (currently 14 stacks)
- Add more license templates
- Improve accessibility (keyboard nav, ARIA)
- Write E2E tests with Playwright
- Add internationalization (i18n)
- Add a CLI version (npm i -g gpush)
- Build a VS Code extension
- Add GitLab/Bitbucket support
- Implement file diff preview before push

## Code review

PRs require:
- All tests passing (`npm test`)
- Build succeeds (`npm run build`)
- Linter clean (`npm run lint`)
- At least one maintainer approval

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
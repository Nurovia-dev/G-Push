# Security Policy

## Reporting a vulnerability

**Please don't open a public GitHub issue for security vulnerabilities.**

Email **security@nurovia.io** with:
- A clear description of the issue
- Steps to reproduce
- Potential impact

We'll respond within **24 hours**. After triage, we'll work with you on a fix and coordinate disclosure.

## Supported versions

| Version | Supported |
|---|---|
| Latest (`main` / `G-Push` branch) | ✅ |
| Older versions | ❌ |

We only provide security updates for the latest version. Please keep your deployment up to date.

## Security model

G-Push is a tool that pushes code to GitHub on behalf of authenticated users. Key security properties:

| Threat | Mitigation |
|---|---|
| Leaked GitHub PAT in browser | httpOnly cookies, never localStorage; tokens never logged |
| Leaked secrets in committed files | Pre-flight file filter blocks `.env`, keys, credentials; secret pattern scanner |
| Token theft via XSS | httpOnly cookies (immune to XSS); CSP via Next.js defaults |
| CSRF | SameSite cookies + OAuth state tokens |
| Man-in-the-middle on push | HTTPS only (Vercel enforces) |
| Malicious file content | File size limit (50MB), binary upload via base64 |
| Unauthorized push | OAuth/PAT must have `repo` scope |
| Server-side secret logging | Tokens filtered from logs; PR body content is server-controlled |
| Branch protection bypass | Server-side branch protection detection before push |
| Server-side file tampering | Re-runs client-side file filter on server (defense-in-depth) |
| Resume checkpoint exposure | localStorage only — never sent to server; cleared on success |

## Pre-flight filter

G-Push blocks these file categories by default:

- **Dangerous** (cannot be overridden, 30+ rules): `.env`, `.env.local`, `.env.production`, `id_rsa`, `*.pem`, `*.key`, `credentials.json`, `service-account*.json`, `wp-config.php`, `.npmrc`, `.pypirc`, `.netrc`, shell histories, swap files, etc.
- **Allowed exceptions** (env templates, no secrets by convention): `.env.example`, `.env.sample`, `.env.template`, `.env.dist`, `.env.skeleton`, `.env.defaults`
- **Unnecessary** (skipped by default, user can include, 40+ rules): `node_modules/`, `dist/`, `build/`, `.next/`, `.cache/`, `coverage/`, `__pycache__/`, `target/`, `*.log`, `.DS_Store`, `.vscode/`, etc.

The filter runs in three places:
1. **Client-side on drop** (UX feedback + visual badges)
2. **Client-side before push** (filter the API payload)
3. **Server-side as defense-in-depth** (rejects bypassed payloads)

This means even if a user tampers with their browser state to mark a `.env` as "allowed", the server will still reject it.

## Branch protection detection

When pushing to an existing repo, G-Push checks the branch protection rules. If the default branch is protected, G-Push auto-switches to **PR mode** (push to a new branch, open a pull request). This prevents users from accidentally violating their org's branch protection policies.

## Secret pattern scanner

G-Push also scans file contents for 15+ regex patterns of common secrets: AWS, GitHub PAT, OpenAI, Stripe, Google, JWT, Slack, etc.

Even if a user explicitly includes a file, patterns are flagged before push.

## Out of scope

G-Push does not provide:
- Encrypted storage of credentials (we don't store them at all)
- Two-factor auth for the G-Push web UI (use GitHub OAuth + GitHub 2FA)
- Audit logs of pushes (use GitHub's own audit log)
- Branch protection enforcement (this is GitHub's job)

## Acknowledgments

We use [gitleaks](https://github.com/gitleaks/gitleaks)' pattern library as inspiration. Thanks to the maintainers.
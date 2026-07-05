# Migration: gpublish → G-Push

We've renamed the project from **gpublish** to **G-Push** and moved the repo to `https://github.com/Nurovia-dev/G-Push`.

Current version: **v0.8.0** — full feature complete with 110 unit tests, CI, error translation, branch protection, PR mode, auto-generators, resume push, confetti, dark mode, and onboarding tour.

If you're upgrading from an old deployment, follow these steps.

---

## Step 1: Rename the GitHub repo (preserves history)

On GitHub:

1. Go to https://github.com/Nurovia-dev/gpublish → **Settings**
2. Scroll to **Danger Zone** → **Rename repository**
3. New name: `G-Push`
4. Click **I understand, rename repository**

GitHub redirects from old URL to new automatically. All stars, forks, issues, PRs, and commits are preserved.

## Step 2: Update your local clone

```bash
cd ~/work/gpublish
git remote set-url origin https://github.com/Nurovia-dev/G-Push.git
git pull
```

If you had uncommitted changes:
```bash
git stash
git pull
git stash pop
```

## Step 3: Update Vercel

1. Vercel → your project → **Settings** → **Git** → **Disconnect**, then reconnect to the new repo URL
2. **Settings** → **Environment Variables**:
   - Update `NEXTAUTH_URL` if it referenced the old URL
   - No other changes needed (env vars stay the same)
3. **Deployments** → ⋯ → **Redeploy**

## Step 4: Update GitHub OAuth app (if you set one up)

1. https://github.com/settings/developers → click your OAuth app
2. **Rename** to "G-Push" (or whatever)
3. Update **Homepage URL** and **Authorization callback URL** to your Vercel URL — no change needed unless the URL changed

## What changed in the code

| Category | Old | New |
|---|---|---|
| **npm package name** | `gpublish` | `gpush` |
| **Project display name** | gpublish | **G-Push** |
| **Repo URL** | `Nurovia-dev/gpublish` | `Nurovia-dev/G-Push` |
| **Cookie names** | `gpublish_token`, `gpublish_oauth_state` | `gpush_token`, `gpush_oauth_state` |
| **localStorage keys** | `gpublish_user` | `gpush_user` |
| **CLI command** (future) | `gpublish` | `gpush` |
| **Docker image** (future) | `gpublish` | `gpush` |
| **Domains** | `gpublish.dev`, `gpublish.io` | `gpush.dev`, `gpush.io` (planned) |

## What did NOT change

- **No data migration needed.** All your existing files, OAuth tokens, and sessions are preserved.
- **API endpoints unchanged.** All `/api/*` paths stay the same.
- **Cookie values are cleared on first deploy.** Users will need to re-authenticate. (This is intentional — old cookie format is incompatible.)

## Breaking changes

| Change | Impact | Action |
|---|---|---|
| Cookie names changed | Existing sessions invalidated | Users sign in again (one-time) |
| npm package renamed | If you `npm install` from the repo, name changes | No action — just affects `package.json` name |
| Repo URL changed | Old URL → 301 redirect | GitHub handles it |

## For users who bookmarked old URLs

Old URLs like `https://Nurovia-dev/gpublish` redirect to `https://Nurovia-dev/G-Push`. Update any docs / links as you see them.

---

Questions? https://github.com/Nurovia-dev/G-Push/issues
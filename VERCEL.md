# Deploying to Vercel

Three steps. ~5 minutes.

---

## Step 1: Set environment variables

In Vercel dashboard → your project → **Settings** → **Environment Variables**, add:

| Name | Required | Value |
|---|---|---|
| `NEXTAUTH_SECRET` | **YES** | Run in your terminal: `openssl rand -hex 32`, paste result |
| `NEXTAUTH_URL` | **YES** | Your Vercel URL (e.g. `https://gpush.vercel.app`) |
| `GITHUB_CLIENT_ID` | optional | From GitHub OAuth app (see Step 2) |
| `GITHUB_CLIENT_SECRET` | optional | Same as above |
| `OPENAI_API_KEY` | optional | From OpenAI dashboard |

**Important:** `NEXTAUTH_URL` must match your actual Vercel URL EXACTLY (no trailing slash, https not http).

**Important:** Apply these to **Production**, **Preview**, AND **Development** if you want them everywhere. Otherwise pick at least Production.

---

## Step 2 (optional but recommended): GitHub OAuth

Without this, users sign in by pasting a GitHub Personal Access Token (PAT) at `/settings`. With it, they click "Sign in with GitHub" — much nicer UX.

### Create the OAuth app

1. Go to https://github.com/settings/developers
2. **New OAuth App**
3. Fill in:
   - **Application name:** `G-Push` (or whatever)
   - **Homepage URL:** `https://gpush.vercel.app` (your Vercel URL)
   - **Authorization callback URL:** `https://gpush.vercel.app/api/auth/callback`
4. Click **Register application**
5. Copy **Client ID**
6. Click **Generate a new client secret**, copy it

### Add to Vercel

In Vercel env vars:
- `GITHUB_CLIENT_ID` = the Client ID
- `GITHUB_CLIENT_SECRET` = the Client Secret

### Update local OAuth callback URL too

If you develop locally and also on Vercel, you can either:
- Create **two** OAuth apps (one for dev, one for prod) — recommended
- OR set the OAuth app's callback URL to your **Vercel** URL and only test OAuth on prod

---

## Step 3: Verify the deployment

After Vercel finishes deploying (usually 1-2 min):

1. Open `https://your-app.vercel.app`
2. You should see the landing page
3. Click **New** → wizard starts
4. Either:
   - Click **Sign in with GitHub** (if Step 2 done)
   - OR go to `/settings` and paste a GitHub PAT (Settings → Developer settings → Personal access tokens → Tokens (classic) → Generate new token with `repo`, `delete_repo` scopes)

### Generate a test PAT

If you want to test without setting up OAuth:

1. https://github.com/settings/tokens → **Generate new token** → **Classic**
2. Note: `gpush test`
3. Expiration: 7 days
4. Scopes:
   - ✅ `repo` (full)
   - ✅ `delete_repo` (for wipe strategy)
5. Generate, copy, paste into `/settings`

---

## Common Vercel issues

### "Sign in with GitHub" redirects to localhost

Your `NEXTAUTH_URL` is wrong. It must match your Vercel URL exactly.

### OAuth error: redirect_uri_mismatch

Your GitHub OAuth app's callback URL doesn't match the deployment URL.

Fix: edit the OAuth app at https://github.com/settings/developers, update the callback URL.

### "fetch failed" errors when pushing

Vercel's outbound network is having issues. Check:
- Vercel status: https://vercel-status.com
- Try the operation again — usually transient

### Build failed: "Module not found"

Make sure all packages are in `package.json` `dependencies` (not just `devDependencies`). Vercel runs `npm install --production` for the runtime.

G-Push deps that MUST be in `dependencies`:
- `next`, `react`, `react-dom`
- `@octokit/rest`
- `lucide-react`, `sonner`

G-Push deps that go in `devDependencies`:
- `typescript`, `tailwindcss`, `autoprefixer`, `postcss`, `@types/*`

### App is slow / times out

Vercel's free tier has 10s execution limit on serverless functions by default. Our push route can run longer. To fix:

The push route sets `maxDuration = 300` which requests up to 5 minutes on Vercel Pro. On Vercel Hobby the maximum is 60 seconds.

If you're on Hobby and pushing 200+ files, the function may time out. Either:
- Split the push into smaller batches
- Upgrade to Vercel Pro for the longer timeout
- The error message will say "Connection dropped" — if your push actually completed, the repo is fine; if not, click Retry and the resume feature picks up where it left off.

---

## Custom domain

If you have your own domain (e.g. `gpush.dev`):

1. Vercel → Settings → Domains → add `gpush.dev`
2. Update DNS as Vercel instructs (usually a CNAME)
3. Update `NEXTAUTH_URL` in env vars to `https://gpush.dev`
4. Update GitHub OAuth app's Homepage URL + Callback URL to `https://gpush.dev`

---

## Production checklist

Before sharing with users, verify:

- [ ] `NEXTAUTH_SECRET` is set (NOT the placeholder)
- [ ] `NEXTAUTH_URL` matches your actual URL (no trailing slash)
- [ ] Landing page loads at `/`
- [ ] Click `/new` → wizard appears
- [ ] Sign in works (OAuth OR PAT)
- [ ] Pick an existing repo OR create new
- [ ] Drop a small folder (e.g. 5 files)
- [ ] See file filter catch any junk
- [ ] Push completes successfully
- [ ] View on GitHub link works
- [ ] Footer says "Powered by Nurovia"

---

That's it. Questions? Open an issue: https://github.com/Nurovia-dev/G-Push/issues
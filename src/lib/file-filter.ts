/**
 * Pre-flight file classification.
 *
 * Categorizes files BEFORE upload into three buckets:
 *   - dangerous  → blocked, cannot be overridden (secrets, credentials, private keys)
 *   - unnecessary → skipped by default, user can choose to include
 *   - allowed    → uploaded as-is
 *
 * Why pre-flight:
 *   - Catches obvious mistakes (committing .env, pushing node_modules)
 *   - Prevents leaks at the source instead of catching them in the secret scan
 *   - Saves bandwidth + time (270 files → 47 actual code files)
 *   - Gives the user a chance to override before anything leaves their machine
 */

export type FileClass = 'dangerous' | 'unnecessary' | 'allowed';

export interface FileVerdict {
  category: FileClass;
  reason?: string;
  matchedRule?: string;
}

// ─────────────────────────────────────────────────────────────────
// DANGEROUS — never upload, no override
// These are credentials that almost never belong in a public repo.
// ─────────────────────────────────────────────────────────────────

const DANGEROUS_RULES: Array<{ match: RegExp | string; rule: string; reason: string }> = [
  // ── Environment files (always contain secrets) ──
  { match: /(^|\/)\.env(\..+)?$/, rule: 'env-file', reason: 'Environment file — usually contains secrets' },
  { match: /(^|\/)env(\..+)?$/i, rule: 'env-file', reason: 'Environment file' },

  // ── Private keys & certs ──
  { match: /(^|\/)id_rsa(\.pub)?$/, rule: 'ssh-key', reason: 'SSH private key' },
  { match: /(^|\/)id_dsa(\.pub)?$/, rule: 'ssh-key', reason: 'SSH private key' },
  { match: /(^|\/)id_ecdsa(\.pub)?$/, rule: 'ssh-key', reason: 'SSH private key' },
  { match: /(^|\/)id_ed25519(\.pub)?$/, rule: 'ssh-key', reason: 'SSH private key' },
  { match: /(^|\/)\.ssh\//, rule: 'ssh-dir', reason: 'SSH directory' },
  { match: /\.(pem|key|p12|pfx|p8|jks|keystore)$/i, rule: 'crypto', reason: 'Cryptographic key or certificate' },
  { match: /\.(crt|cer|csr|p7b|p7c)$/i, rule: 'cert', reason: 'Certificate file' },

  // ── Cloud & service credentials ──
  { match: /(^|\/)credentials\.json$/, rule: 'gcp-creds', reason: 'Google Cloud credentials' },
  { match: /(^|\/)service[-_]account.*\.json$/i, rule: 'gcp-creds', reason: 'Service account JSON' },
  { match: /(^|\/)gcloud[-_]service[-_]account.*\.json$/i, rule: 'gcp-creds', reason: 'GCloud service account' },
  { match: /\.(aws\/credentials|aws\/config)$/i, rule: 'aws-creds', reason: 'AWS credentials' },
  { match: /\.kube\/config$/, rule: 'kubeconfig', reason: 'Kubernetes config (may contain tokens)' },
  { match: /(^|\/)azure[-_]credentials\.json$/i, rule: 'azure-creds', reason: 'Azure credentials' },

  // ── Database files ──
  { match: /(^|\/)database\.yml$/, rule: 'db-config', reason: 'Rails DB config (often has passwords)' },
  { match: /(^|\/)wp-config\.php$/, rule: 'wp-config', reason: 'WordPress config (DB credentials)' },
  { match: /(^|\/)config\.php$/, rule: 'php-config', reason: 'PHP config (may have credentials)' },
  { match: /(^|\/)\.htpasswd$/, rule: 'htpasswd', reason: 'Apache password file' },

  // ── Token / registry configs ──
  { match: /(^|\/)\.npmrc$/, rule: 'npmrc', reason: 'NPM config (may have tokens)' },
  { match: /(^|\/)\.pypirc$/, rule: 'pypirc', reason: 'PyPI config (may have passwords)' },
  { match: /(^|\/)\.netrc$/, rule: 'netrc', reason: 'Netrc (FTP/HTTP credentials)' },
  { match: /(^|\/)\.docker\/config\.json$/, rule: 'docker-config', reason: 'Docker registry auth' },

  // ── Shell / history with potential secrets ──
  { match: /(^|\/)\.bash_history$/, rule: 'history', reason: 'Shell history (may contain typed secrets)' },
  { match: /(^|\/)\.zsh_history$/, rule: 'history', reason: 'Shell history' },
  { match: /(^|\/)\.python_history$/, rule: 'history', reason: 'Python REPL history' },
  { match: /(^|\/)\.psql_history$/, rule: 'history', reason: 'psql history' },
  { match: /(^|\/)\.mysql_history$/, rule: 'history', reason: 'MySQL history' },

  // ── Mac / Windows metadata ──
  { match: /\.fseventd$/i, rule: 'macos-meta', reason: 'macOS file system metadata' },
  { match: /\.Spotlight-V100\//i, rule: 'macos-meta', reason: 'macOS Spotlight index' },
  { match: /\/Library\/Application Support\/Apple\/ParentalControls\//i, rule: 'macos-meta', reason: 'macOS metadata' },

  // ── Backup / swap files that often hold secrets ──
  { match: /\.(swp|swo|swn)$/i, rule: 'swap', reason: 'Vim swap file (may contain unsaved secrets)' },
  { match: /\~$/, rule: 'backup', reason: 'Editor backup file' },

  // ── Office docs that may have PII ──
  // (Not blocked by default but flagged — see WARN)
];

// ─────────────────────────────────────────────────────────────────
// UNNECESSARY — skipped by default, user can opt in
// These are files that don't belong in source control.
// ─────────────────────────────────────────────────────────────────

const UNNECESSARY_RULES: Array<{ match: RegExp | string; rule: string; reason: string }> = [
  // ── Build output ──
  { match: /(^|\/)node_modules\//, rule: 'node_modules', reason: 'Node.js dependencies (regenerated by npm install)' },
  { match: /(^|\/)bower_components\//, rule: 'bower', reason: 'Bower dependencies (deprecated)' },
  { match: /(^|\/)jspm_packages\//, rule: 'jspm', reason: 'JSPM packages' },
  { match: /(^|\/)vendor\//, rule: 'vendor', reason: 'PHP/Composer dependencies (often huge)' },
  { match: /(^|\/)Pods\//, rule: 'cocoapods', reason: 'CocoaPods dependencies (regenerated by pod install)' },
  { match: /(^|\/)Carthage\/Build\//, rule: 'carthage', reason: 'Carthage build output' },
  { match: /(^|\/)target\//, rule: 'rust-target', reason: 'Rust build output (regenerated by cargo build)' },
  { match: /(^|\/)\.cargo\//, rule: 'cargo-cache', reason: 'Cargo cache' },
  { match: /(^|\/)__pycache__\//, rule: 'pycache', reason: 'Python bytecode (regenerated)' },
  { match: /\.(pyc|pyo|pyd)$/i, rule: 'pyc', reason: 'Python bytecode' },
  { match: /\.pytest_cache\//, rule: 'pytest', reason: 'Pytest cache' },
  { match: /\.mypy_cache\//, rule: 'mypy', reason: 'Mypy cache' },
  { match: /\.ruff_cache\//, rule: 'ruff', reason: 'Ruff cache' },
  { match: /\.tox\//, rule: 'tox', reason: 'Tox cache' },

  // ── JS framework build output ──
  { match: /(^|\/)\.next\//, rule: 'next-build', reason: 'Next.js build output' },
  { match: /(^|\/)\.nuxt\//, rule: 'nuxt-build', reason: 'Nuxt build output' },
  { match: /(^|\/)\.svelte-kit\//, rule: 'svelte-kit', reason: 'SvelteKit build output' },
  { match: /(^|\/)\.astro\//, rule: 'astro', reason: 'Astro build output' },
  { match: /(^|\/)\.gatsby\//, rule: 'gatsby', reason: 'Gatsby cache' },
  { match: /(^|\/)dist\//, rule: 'dist', reason: 'Build output (regenerated)' },
  { match: /(^|\/)build\//, rule: 'build', reason: 'Build output' },
  { match: /(^|\/)out\//, rule: 'out', reason: 'Static export output' },

  // ── Bundler cache ──
  { match: /\.cache\//, rule: 'cache', reason: 'Build cache' },
  { match: /\.parcel-cache\//, rule: 'parcel', reason: 'Parcel cache' },
  { match: /\.webpack\//, rule: 'webpack', reason: 'Webpack cache' },
  { match: /\.turbo\//, rule: 'turbo', reason: 'Turborepo cache' },
  { match: /\.nx\/cache\//, rule: 'nx', reason: 'Nx cache' },

  // ── Coverage / test output ──
  { match: /(^|\/)coverage\//, rule: 'coverage', reason: 'Test coverage report' },
  { match: /\.nyc_output\//, rule: 'nyc', reason: 'NYC output' },
  { match: /\.jest-cache\//, rule: 'jest-cache', reason: 'Jest cache' },
  { match: /junit.*\.xml$/i, rule: 'test-report', reason: 'Test report XML' },

  // ── Logs ──
  { match: /(^|\/)logs?\//, rule: 'logs', reason: 'Log directory' },
  { match: /\.(log|log\.\d+)$/i, rule: 'log-file', reason: 'Log file' },
  { match: /npm-debug\.log.*$/i, rule: 'npm-log', reason: 'NPM debug log' },
  { match: /yarn-debug\.log.*$/i, rule: 'yarn-log', reason: 'Yarn debug log' },
  { match: /yarn-error\.log.*$/i, rule: 'yarn-log', reason: 'Yarn error log' },
  { match: /pnpm-debug\.log.*$/i, rule: 'pnpm-log', reason: 'pnpm debug log' },

  // ── OS metadata ──
  { match: /(^|\/)\.DS_Store$/, rule: 'macos-ds', reason: 'macOS desktop services' },
  { match: /(^|\/)Thumbs\.db$/, rule: 'windows-thumbs', reason: 'Windows thumbnails' },
  { match: /(^|\/)desktop\.ini$/, rule: 'windows-desktop', reason: 'Windows folder settings' },
  { match: /~\$.+/, rule: 'office-lock', reason: 'Office lock file' },

  // ── Editor / IDE ──
  { match: /(^|\/)\.vscode\//, rule: 'vscode', reason: 'VSCode settings (personal)' },
  { match: /(^|\/)\.idea\//, rule: 'idea', reason: 'JetBrains settings' },
  { match: /(^|\/)\.vs\//, rule: 'vs', reason: 'Visual Studio settings' },
  { match: /\.(iml|sln|suo)$/i, rule: 'ide-files', reason: 'IDE project files' },

  // ── Temp / scratch ──
  { match: /\.(tmp|temp|bak|orig|rej)$/i, rule: 'temp', reason: 'Temporary / backup file' },
  { match: /~$/, rule: 'backup', reason: 'Backup file' },

  // ── Lock files that are huge ──
  // (yarn.lock IS useful — don't block)
  // (package-lock.json IS useful — don't block)
  // But: cargo's .cargo-lock may exist — leave alone

  // ── Compiled / generated ──
  { match: /\.min\.(js|css|map)$/, rule: 'minified', reason: 'Minified bundle (regenerated)' },
  { match: /\.bundle\.js$/, rule: 'bundled', reason: 'Bundled file (regenerated)' },
  { match: /\.generated\./, rule: 'generated', reason: 'Auto-generated file' },

  // ── Git itself ──
  { match: /(^|\/)\.git\/HEAD$/, rule: 'git-internal', reason: 'Git internal file' },
];

// ─────────────────────────────────────────────────────────────────
// CLASSIFIER
// ─────────────────────────────────────────────────────────────────

/** Classify a single file path. */
export function classifyFile(path: string): FileVerdict {
  // Normalize: strip leading ./, collapse repeated slashes
  const normalized = path.replace(/\\/g, '/').replace(/^\.\//, '').replace(/\/+/g, '/');

  // Extract basename for whitelisting checks
  const basename = normalized.split('/').pop() ?? '';

  // ── Exception: known-safe env TEMPLATE files ──
  // These conventional names are almost always placeholders (not real secrets).
  // Allow them by default; users can still block if they want (they'd just keep them).
  // Matches: .env.example, .env.sample, .env.template, .env.dist, env.example, env.sample, etc.
  if (
    /^(?:\.env|env)\.(example|sample|template|dist|skeleton|defaults)$/i.test(basename)
  ) {
    return {
      category: 'allowed',
      reason: 'Environment template (placeholder values, not real secrets)',
    };
  }

  // Test dangerous rules first (they win)
  for (const rule of DANGEROUS_RULES) {
    if (typeof rule.match === 'string') {
      if (normalized.includes(rule.match)) {
        return { category: 'dangerous', reason: rule.reason, matchedRule: rule.rule };
      }
    } else {
      if (rule.match.test(normalized)) {
        return { category: 'dangerous', reason: rule.reason, matchedRule: rule.rule };
      }
    }
  }

  // Then unnecessary
  for (const rule of UNNECESSARY_RULES) {
    if (typeof rule.match === 'string') {
      if (normalized.includes(rule.match)) {
        return { category: 'unnecessary', reason: rule.reason, matchedRule: rule.rule };
      }
    } else {
      if (rule.match.test(normalized)) {
        return { category: 'unnecessary', reason: rule.reason, matchedRule: rule.rule };
      }
    }
  }

  return { category: 'allowed' };
}

/** Classify a batch and produce aggregate buckets. */
export interface FilterResult {
  allowed: { path: string; file: File }[];
  dangerous: { path: string; reason: string; rule: string; file: File }[];
  unnecessary: { path: string; reason: string; rule: string; file: File }[];
  totalSize: number;
}

export function filterFiles(
  files: Array<{ path: string; file: File }>
): FilterResult {
  const result: FilterResult = {
    allowed: [],
    dangerous: [],
    unnecessary: [],
    totalSize: 0,
  };

  for (const { path, file } of files) {
    const verdict = classifyFile(path);
    if (verdict.category === 'allowed') {
      result.allowed.push({ path, file });
      result.totalSize += file.size;
    } else if (verdict.category === 'dangerous') {
      result.dangerous.push({
        path,
        reason: verdict.reason ?? '',
        rule: verdict.matchedRule ?? '',
        file,
      });
    } else {
      result.unnecessary.push({
        path,
        reason: verdict.reason ?? '',
        rule: verdict.matchedRule ?? '',
        file,
      });
    }
  }

  return result;
}
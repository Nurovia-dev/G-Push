import { classifyFile, filterFiles } from '@/lib/file-filter';

describe('file-filter', () => {
  describe('classifyFile', () => {
    describe('env template exceptions (allowed by default)', () => {
      it.each([
        '.env.example',
        '.env.sample',
        '.env.template',
        '.env.dist',
        '.env.skeleton',
        '.env.defaults',
        'env.example',
        'ENV.SAMPLE',
        '.ENV.TEMPLATE',
        'project/.env.example',
        'configs/env.template',
        'backend/.env.sample',
      ])('classifies %s as allowed (template)', (path) => {
        const result = classifyFile(path);
        expect(result.category).toBe('allowed');
      });

      it('still blocks real .env files', () => {
        expect(classifyFile('.env').category).toBe('dangerous');
        expect(classifyFile('.env.local').category).toBe('dangerous');
        expect(classifyFile('.env.production').category).toBe('dangerous');
        // .env.examplee (typo) should NOT slip through
        expect(classifyFile('.env.examplee').category).toBe('dangerous');
        // .env.real-config (looks like template but isn't) is blocked
        expect(classifyFile('.env.real-config').category).toBe('dangerous');
      });
    });

    describe('dangerous files', () => {
      it.each([
        ['.env', 'Environment file'],
        ['.env.local', 'Environment file'],
        ['.env.production', 'Environment file'],
        ['.env.development.local', 'Environment file'],
        ['project/.env', 'Environment file'],
        ['id_rsa', 'SSH private key'],
        ['id_rsa.pub', 'SSH private key'],
        ['id_ed25519', 'SSH private key'],
        ['keys/server.pem', 'Cryptographic key'],
        ['certs/server.key', 'Cryptographic key'],
        ['ssl/keystore.jks', 'Cryptographic key'],
        ['cert/server.crt', 'Certificate file'],
        ['credentials.json', 'Google Cloud credentials'],
        ['service-account.json', 'Service account JSON'],
        ['service_account_prod.json', 'Service account JSON'],
        ['database.yml', 'Rails DB config'],
        ['wp-config.php', 'WordPress config'],
        ['.npmrc', 'NPM config'],
        ['.pypirc', 'PyPI config'],
        ['.netrc', 'Netrc'],
        ['.bash_history', 'Shell history'],
        ['.zsh_history', 'Shell history'],
        ['~/file.swp', 'Vim swap file'],
        ['file~', 'Editor backup file'],
      ])('classifies %s as dangerous (%s)', (path, expectedReason) => {
        const result = classifyFile(path);
        expect(result.category).toBe('dangerous');
        expect(result.reason).toContain(expectedReason);
      });
    });

    describe('unnecessary files', () => {
      it.each([
        ['node_modules/react/index.js', 'Node.js dependencies'],
        ['project/node_modules/lodash/index.js', 'Node.js dependencies'],
        ['.next/static/chunks/main.js', 'Next.js build output'],
        ['dist/bundle.js', 'Build output'],
        ['build/output.exe', 'Build output'],
        ['out/index.html', 'Static export output'],
        ['target/release/app', 'Rust build output'],
        ['__pycache__/module.pyc', 'Python bytecode'],
        ['module.pyc', 'Python bytecode'],
        ['.DS_Store', 'macOS desktop services'],
        ['Thumbs.db', 'Windows thumbnails'],
        ['.vscode/settings.json', 'VSCode settings'],
        ['.idea/workspace.xml', 'JetBrains settings'],
        ['debug.log', 'Log file'],
        ['logs/error.log', 'Log directory'],
        ['npm-debug.log.1234', 'Log file'],
        ['backup.bak', 'Temporary / backup file'],
      ])('classifies %s as unnecessary (%s)', (path, expectedReason) => {
        const result = classifyFile(path);
        expect(result.category).toBe('unnecessary');
        expect(result.reason).toContain(expectedReason);
      });
    });

    describe('allowed files', () => {
      it.each([
        ['package.json', 'project metadata'],
        ['README.md', 'docs'],
        ['src/index.ts', 'source code'],
        ['src/components/Button.tsx', 'source code'],
        ['app/page.tsx', 'source code'],
        ['public/favicon.ico', 'asset'],
        ['styles.css', 'styling'],
        ['Cargo.toml', 'project metadata'],
        ['requirements.txt', 'project metadata'],
        ['main.go', 'source code'],
      ])('classifies %s as allowed (%s)', (path) => {
        const result = classifyFile(path);
        expect(result.category).toBe('allowed');
        expect(result.reason).toBeUndefined();
      });
    });

    it('handles leading ./ and trailing slashes consistently', () => {
      expect(classifyFile('./node_modules/foo.js').category).toBe('unnecessary');
      expect(classifyFile('.//node_modules//foo.js').category).toBe('unnecessary');
      expect(classifyFile('node_modules/foo.js').category).toBe('unnecessary');
    });
  });

  describe('filterFiles', () => {
    it('separates files into allowed, dangerous, and unnecessary buckets', () => {
      const files = [
        { path: '.env', file: makeFile('.env', 'SECRET=abc') },
        { path: 'package.json', file: makeFile('package.json', '{}') },
        { path: 'node_modules/react/index.js', file: makeFile('node_modules/react/index.js', '') },
        { path: 'src/app.ts', file: makeFile('src/app.ts', '') },
        { path: '.DS_Store', file: makeFile('.DS_Store', '') },
      ];

      const result = filterFiles(files);
      expect(result.allowed.map((f) => f.path)).toEqual(['package.json', 'src/app.ts']);
      expect(result.dangerous.map((f) => f.path)).toEqual(['.env']);
      expect(result.unnecessary.map((f) => f.path)).toEqual([
        'node_modules/react/index.js',
        '.DS_Store',
      ]);
    });

    it('sums sizes only for allowed files', () => {
      const files = [
        { path: '.env', file: makeFile('.env', 'x'.repeat(1000)) },
        { path: 'package.json', file: makeFile('package.json', 'y'.repeat(500)) },
        { path: 'node_modules/react/index.js', file: makeFile('node_modules/react/index.js', 'z'.repeat(2000)) },
      ];
      const result = filterFiles(files);
      expect(result.totalSize).toBe(500);
    });
  });
});

function makeFile(name: string, content: string) {
  return new File([content], name, { type: 'text/plain' });
}
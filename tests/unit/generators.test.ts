import { generateLicense, generateReadme, generateGitignore, detectStacks } from '@/lib/generators';

describe('generators', () => {
  describe('generateLicense', () => {
    it('generates MIT with author and year', () => {
      const result = generateLicense('mit', 'John Doe', 2026);
      expect(result).toContain('MIT License');
      expect(result).toContain('Copyright (c) 2026 John Doe');
      expect(result).toContain('Permission is hereby granted');
    });

    it('generates Apache-2.0 with proper attribution', () => {
      const result = generateLicense('apache-2.0', 'Acme Corp', 2025);
      expect(result).toContain('Apache License');
      expect(result).toContain('Version 2.0');
      expect(result).toContain('Copyright 2025 Acme Corp');
    });

    it('generates BSD-3-Clause with the no-endorsement clause', () => {
      const result = generateLicense('bsd-3-clause', 'Jane', 2026);
      expect(result).toContain('BSD 3-Clause License');
      expect(result).toContain('Neither the name of the copyright holder');
    });

    it('generates GPL-3.0 pointing to the full text URL', () => {
      const result = generateLicense('gpl-3.0', 'Free Software', 2024);
      expect(result).toContain('GNU GENERAL PUBLIC LICENSE');
      expect(result).toContain('https://www.gnu.org/licenses/gpl-3.0.txt');
    });

    it('generates MPL-2.0', () => {
      const result = generateLicense('mpl-2.0', 'Mozilla', 2026);
      expect(result).toContain('Mozilla Public License');
      expect(result).toContain('https://mozilla.org/MPL/2.0/');
    });

    it('generates Unlicense as public domain dedication', () => {
      const result = generateLicense('unlicense', 'Hacker', 2026);
      expect(result).toContain('unencumbered software');
      expect(result).toContain('public domain');
      expect(result).toContain('https://unlicense.org');
    });

    it('uses current year by default', () => {
      const currentYear = new Date().getFullYear();
      const result = generateLicense('mit', 'Author');
      expect(result).toContain(`Copyright (c) ${currentYear} Author`);
    });

    it('throws on unknown license id', () => {
      // @ts-expect-error testing invalid input
      expect(() => generateLicense('unknown', 'X')).toThrow();
    });
  });

  describe('generateReadme', () => {
    it('includes project name, description, and stack', () => {
      const result = generateReadme({
        projectName: 'my-app',
        description: 'A cool project',
        stack: 'Next.js 14',
        author: 'alice',
        license: 'mit',
      });
      expect(result).toContain('# my-app');
      expect(result).toContain('A cool project');
      expect(result).toContain('Built with Next.js 14');
      expect(result).toContain('npm install');
      expect(result).toContain('npm run dev');
    });

    it('includes features section when features provided', () => {
      const result = generateReadme({
        projectName: 'foo',
        description: 'bar',
        features: ['Login', 'OAuth', 'Dark mode'],
      });
      expect(result).toContain('## ✨ Features');
      expect(result).toContain('- Login');
      expect(result).toContain('- OAuth');
      expect(result).toContain('- Dark mode');
    });

    it('uses correct install command for Python', () => {
      const result = generateReadme({
        projectName: 'py',
        description: '',
        stack: 'Python 3.11',
      });
      expect(result).toContain('pip install -r requirements.txt');
      expect(result).toContain('python main.py');
    });

    it('uses correct install command for Go', () => {
      const result = generateReadme({
        projectName: 'g',
        description: '',
        stack: 'Go 1.21',
      });
      expect(result).toContain('go mod download');
      expect(result).toContain('go run .');
    });

    it('uses correct install command for Rust', () => {
      const result = generateReadme({
        projectName: 'r',
        description: '',
        stack: 'Rust 1.75',
      });
      expect(result).toContain('cargo build');
      expect(result).toContain('cargo run');
    });

    it('omits features section if no features given', () => {
      const result = generateReadme({
        projectName: 'foo',
        description: 'bar',
      });
      expect(result).not.toContain('## ✨ Features');
    });

    it('includes license footer', () => {
      const result = generateReadme({
        projectName: 'x',
        description: 'y',
        license: 'apache-2.0',
      });
      expect(result).toContain('Apache License 2.0');
    });
  });

  describe('detectStacks', () => {
    it('detects Node.js from package.json', () => {
      const result = detectStacks([{ path: 'package.json' }, { path: 'src/index.js' }]);
      expect(result).toContain('node');
    });

    it('detects Next.js from next.config', () => {
      const result = detectStacks([
        { path: 'package.json' },
        { path: 'next.config.js' },
        { path: 'app/layout.tsx' },
      ]);
      expect(result).toContain('nextjs');
      expect(result).toContain('node');
    });

    it('detects Python from requirements.txt', () => {
      const result = detectStacks([
        { path: 'requirements.txt' },
        { path: 'main.py' },
      ]);
      expect(result).toContain('python');
    });

    it('detects Go from go.mod', () => {
      const result = detectStacks([{ path: 'go.mod' }, { path: 'main.go' }]);
      expect(result).toContain('go');
    });

    it('detects Rust from Cargo.toml', () => {
      const result = detectStacks([
        { path: 'Cargo.toml' },
        { path: 'src/main.rs' },
      ]);
      expect(result).toContain('rust');
    });

    it('detects multiple stacks in a monorepo', () => {
      const result = detectStacks([
        { path: 'frontend/package.json' },
        { path: 'frontend/src/App.tsx' },
        { path: 'backend/requirements.txt' },
        { path: 'backend/main.py' },
      ]);
      expect(result).toContain('python');
      expect(result).toContain('node');
    });

    it('returns empty array for unrecognized files', () => {
      const result = detectStacks([{ path: 'foo.txt' }]);
      expect(result).toEqual([]);
    });
  });

  describe('generateGitignore', () => {
    it('always includes universal sections', () => {
      const result = generateGitignore([]);
      expect(result).toContain('.DS_Store');
      expect(result).toContain('.env');
      expect(result).toContain('*.log');
      expect(result).toContain('.vscode');
      expect(result).toContain('coverage/');
    });

    it('includes Node sections for node stack', () => {
      const result = generateGitignore(['node']);
      expect(result).toContain('node_modules/');
      expect(result).toContain('npm-debug.log');
    });

    it('includes Next.js specific extras', () => {
      const result = generateGitignore(['nextjs', 'node']);
      expect(result).toContain('.next/');
    });

    it('includes Python sections for python stack', () => {
      const result = generateGitignore(['python']);
      expect(result).toContain('__pycache__');
      expect(result).toMatch(/\*\.py\[?cod?\]?/); // *.pyc or *.py[cod]
      expect(result).toContain('.venv');
    });

    it('includes Go sections', () => {
      const result = generateGitignore(['go']);
      expect(result).toContain('vendor/');
      expect(result).toContain('go.work');
    });

    it('includes Rust sections', () => {
      const result = generateGitignore(['rust']);
      expect(result).toContain('target/');
    });

    it('combines multiple stacks without duplicating universal sections', () => {
      const result = generateGitignore(['node', 'python', 'go', 'rust']);
      expect(result).toContain('node_modules/');
      expect(result).toContain('__pycache__');
      expect(result).toContain('vendor/');
      expect(result).toContain('target/');
    });

    it('starts with a G-Push-generated marker', () => {
      const result = generateGitignore(['node']);
      expect(result).toContain('# Generated by G-Push');
      expect(result).toContain('# Date:');
    });
  });
});
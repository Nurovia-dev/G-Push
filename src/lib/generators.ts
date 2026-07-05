/**
 * Auto-generate starter files for new repos.
 *
 * Three generators:
 *   - generateReadme()  — README.md from project type + name + description
 *   - generateLicense() — LICENSE file (full text) for the chosen license
 *   - generateGitignore() — .gitignore from detected project types
 *
 * These are written to the File[] array on the client (not directly to disk)
 * so they go through the same upload pipeline as user files.
 */

export type LicenseId = 'mit' | 'apache-2.0' | 'bsd-3-clause' | 'gpl-3.0' | 'mpl-2.0' | 'unlicense';

// ─────────────────────────────────────────────────────────────────
// LICENSE
// ─────────────────────────────────────────────────────────────────

export const LICENSES: Record<
  LicenseId,
  { name: string; spdx: string; year?: (year: number) => number; label: string; desc: string }
> = {
  mit: {
    name: 'MIT License',
    spdx: 'MIT',
    label: 'MIT',
    desc: 'Permissive, do anything',
  },
  'apache-2.0': {
    name: 'Apache License 2.0',
    spdx: 'Apache-2.0',
    label: 'Apache-2.0',
    desc: 'Permissive + patent grant',
  },
  'bsd-3-clause': {
    name: 'BSD 3-Clause License',
    spdx: 'BSD-3-Clause',
    label: 'BSD-3-Clause',
    desc: 'Like MIT, no endorsement',
  },
  'gpl-3.0': {
    name: 'GNU General Public License v3.0',
    spdx: 'GPL-3.0',
    label: 'GPL-3.0',
    desc: 'Copyleft, derivatives stay open',
  },
  'mpl-2.0': {
    name: 'Mozilla Public License 2.0',
    spdx: 'MPL-2.0',
    label: 'MPL-2.0',
    desc: 'File-level copyleft',
  },
  unlicense: {
    name: 'The Unlicense',
    spdx: 'Unlicense',
    label: 'Unlicense',
    desc: 'Public domain dedication',
  },
};

/** Generate LICENSE text. Returns the full file content. */
export function generateLicense(
  license: LicenseId,
  author: string,
  year: number = new Date().getFullYear()
): string {
  switch (license) {
    case 'mit':
      return `MIT License

Copyright (c) ${year} ${author}

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
`;

    case 'apache-2.0':
      return `                                 Apache License
                           Version 2.0, January 2004
                        http://www.apache.org/licenses/

   Copyright ${year} ${author}

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
`;

    case 'bsd-3-clause':
      return `BSD 3-Clause License

Copyright (c) ${year}, ${author}

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this
   list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice,
   this list of conditions and the following disclaimer in the documentation
   and/or other materials provided with the distribution.

3. Neither the name of the copyright holder nor the names of its
   contributors may be used to endorse or promote products derived from
   this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
`;

    case 'gpl-3.0':
      return `GNU GENERAL PUBLIC LICENSE
Version 3, 29 June 2007

Copyright (c) ${year} ${author}

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <https://www.gnu.org/licenses/>.

For the full license text see: https://www.gnu.org/licenses/gpl-3.0.txt
`;

    case 'mpl-2.0':
      return `Mozilla Public License Version 2.0
Copyright (c) ${year} ${author}

This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at https://mozilla.org/MPL/2.0/.

For the full license text see: https://www.mozilla.org/en-US/MPL/2.0/
`;

    case 'unlicense':
      return `This is free and unencumbered software released into the public domain.

Anyone is free to copy, modify, publish, use, compile, sell, or
distribute this software, either in source code form or as a compiled
binary, for any purpose, commercial or non-commercial, and by any
means.

In jurisdictions that recognize copyright laws, the author or authors
of this software dedicate any and all copyright interest in the
software to the public domain. We make this dedication for the benefit
of the public at large and to the detriment of our heirs and
successors. We intend this dedication to be an overt act of
relinquishment in perpetuity of all present and future rights to this
software under copyright law.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS BE LIABLE FOR ANY CLAIM, DAMAGES OR
OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.

For more information, please refer to <https://unlicense.org>
`;

    default:
      throw new Error(`Unknown license: ${license}`);
  }
}

// ─────────────────────────────────────────────────────────────────
// README
// ─────────────────────────────────────────────────────────────────

export interface ReadmeOptions {
  projectName: string;
  description: string;
  /** Optional detected stack hint (e.g., "Next.js 14", "Python 3.11", "Go 1.21") */
  stack?: string;
  /** Optional list of features to include */
  features?: string[];
  /** Author/owner name (e.g., GitHub login) */
  author?: string;
  /** License id for footer */
  license?: LicenseId;
  /** Whether this is a fresh new project (vs existing) */
  isNewProject?: boolean;
}

/** Generate a clean, modern README.md from project metadata. */
export function generateReadme(opts: ReadmeOptions): string {
  const {
    projectName,
    description,
    stack,
    features = [],
    author,
    license = 'mit',
    isNewProject = true,
  } = opts;

  const stackLine = stack ? `Built with ${stack}.` : '';
  const descriptionText = description || `A new project called \`${projectName}\`.`;
  const licenseLine = LICENSES[license]?.name ?? 'MIT License';

  // Build features section if any features provided
  const featuresSection =
    features.length > 0
      ? `\n## ✨ Features\n\n${features.map((f) => `- ${f}`).join('\n')}\n`
      : '';

  return `# ${projectName}

${descriptionText}

${stackLine}
${featuresSection}
## 🚀 Quick Start

\`\`\`bash
# Clone the repo
git clone https://github.com/${author ?? 'your-username'}/${projectName}.git
cd ${projectName}

# Install dependencies
# (Adjust based on your stack)
${stack?.toLowerCase().includes('next') || stack?.toLowerCase().includes('react') ? 'npm install' : ''}
${stack?.toLowerCase().includes('python') ? 'pip install -r requirements.txt' : ''}
${stack?.toLowerCase().includes('go') ? 'go mod download' : ''}
${stack?.toLowerCase().includes('rust') ? 'cargo build' : ''}

# Run
${stack?.toLowerCase().includes('next') ? 'npm run dev' : ''}
${stack?.toLowerCase().includes('react') ? 'npm start' : ''}
${stack?.toLowerCase().includes('python') ? 'python main.py' : ''}
${stack?.toLowerCase().includes('go') ? 'go run .' : ''}
${stack?.toLowerCase().includes('rust') ? 'cargo run' : ''}
\`\`\`

${isNewProject ? '' : '## 📦 Installation\n\nSee [Quick Start](#-quick-start) above.\n'}

## 🤝 Contributing

Contributions are welcome! Please open an issue first to discuss what you'd like to change.

## 📄 License

This project is licensed under the ${licenseLine}.
${
  author
    ? `\nCopyright © ${new Date().getFullYear()} ${author}\n`
    : ''
}

---

${
  author
    ? `Made with ❤️ by [@${author}](https://github.com/${author})\n`
    : `Made with [G-Push](https://github.com/Nurovia-dev/G-Push)\n`
}
`;
}

// ─────────────────────────────────────────────────────────────────
// .GITIGNORE
// ─────────────────────────────────────────────────────────────────

export type ProjectStack =
  | 'node'
  | 'nextjs'
  | 'react'
  | 'vue'
  | 'svelte'
  | 'python'
  | 'go'
  | 'rust'
  | 'ruby'
  | 'java'
  | 'php'
  | 'dotnet'
  | 'elixir'
  | 'dart';

const NODE_BASE = `# Dependencies
node_modules/
jspm_packages/

# Build output
dist/
build/
out/
*.tsbuildinfo

# Logs
logs/
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
lerna-debug.log*

# Cache
.cache/
.parcel-cache/
.eslintcache
.stylelintcache
.npm/
.yarn/

# Environment
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Editor
.vscode/*
!.vscode/settings.json
!.vscode/extensions.json
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db
desktop.ini

# Coverage
coverage/
*.lcov
.nyc_output/

# Misc
*.pid
*.seed
*.pid.lock
`;

const NEXTJS_EXTRA = `# Next.js
.next/
.turbo/
next-env.d.ts

# Vercel
.vercel
`;

const REACT_EXTRA = `
# React
build/
`;

const PYTHON_BASE = `# Byte-compiled / optimized / DLL files
__pycache__/
*.py[cod]
*$py.class

# C extensions
*.so

# Distribution / packaging
.Python
build/
develop-eggs/
dist/
downloads/
eggs/
.eggs/
lib/
lib64/
parts/
sdist/
var/
wheels/
share/python-wheels/
*.egg-info/
.installed.cfg
*.egg
MANIFEST

# PyInstaller
*.manifest
*.spec

# Installer logs
pip-log.txt
pip-delete-this-directory.txt

# Unit test / coverage reports
htmlcov/
.tox/
.nox/
.coverage
.coverage.*
.cache
nosetests.xml
coverage.xml
*.cover
*.py,cover
.hypothesis/
.pytest_cache/
cover/

# Translations
*.mo
*.pot

# Django stuff:
*.log
local_settings.py
db.sqlite3
db.sqlite3-journal

# Flask stuff:
instance/
.webassets-cache

# Scrapy stuff:
.scrapy

# Sphinx documentation
docs/_build/

# PyBuilder
.pybuilder/
target/

# Jupyter Notebook
.ipynb_checkpoints

# IPython
profile_default/
ipython_config.py

# pyenv
.python-version

# pipenv
Pipfile.lock

# poetry
poetry.lock

# pdm
.pdm.toml

# PEP 582
__pypackages__/

# Celery stuff
celerybeat-schedule
celerybeat.pid

# SageMath parsed files
*.sage.py

# Environments
.env
.venv
env/
venv/
ENV/
env.bak/
venv.bak/

# Spyder project settings
.spyderproject
.spyproject

# Rope project settings
.ropeproject

# mkdocs documentation
/site

# mypy
.mypy_cache/
.dmypy.json
dmypy.json

# Pyre type checker
.pyre/

# pytype static type analyzer
.pytype/

# Cython debug symbols
cython_debug/

# IDEs
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db
`;

const GO_BASE = `# Binaries
*.exe
*.exe~
*.dll
*.dll~
*.so
*.so.*
*.dylib
*.dylib.*
*.test
*.out
app/

# Go workspace
go.work
go.work.sum

# Dependency directories
vendor/

# Go test/cache
*.test
*.out
coverage.txt
coverage.html
.profile

# Environment
.env
.env.local

# IDE
.vscode/
.idea/
*.swp

# OS
.DS_Store
Thumbs.db
`;

const RUST_BASE = `# Build artifacts
target/
**/*.rs.bk

# Cargo
Cargo.lock.bak

# IDE
.vscode/
.idea/
*.swp

# OS
.DS_Store
Thumbs.db

# Misc
*.pdb
*.d
*.o
*.obj
`;

const RUBY_BASE = `# Bundler
.bundle/
vendor/bundle/

# Ruby
*.gem
*.rbc
/.config
/coverage/
/InstalledFiles
/pkg/
/spec/reports/
/spec/examples.txt
/test/tmp/
/test/version_tmp/
/tmp/

# Environment
.env

# Rails
log/*
tmp/*
tmp/pids/
tmp/cache/
storage/
public/assets/
.byebug_history

# IDE
.vscode/
.idea/

# OS
.DS_Store
Thumbs.db
`;

const JAVA_BASE = `# Compiled class file
*.class

# Build artifacts
target/
build/
out/
*.jar
*.war
*.ear

# IDE
.idea/
*.iml
*.iws
*.ipr
.project
.classpath
.settings/
.vscode/

# Logs
*.log

# Environment
.env

# OS
.DS_Store
Thumbs.db

# Maven
.mvn/
mvnw
mvnw.cmd

# Gradle
.gradle/
gradle/
gradlew
gradlew.bat
!gradle/wrapper/gradle-wrapper.jar
`;

const PHP_BASE = `# Vendor
/vendor/
/node_modules/

# Laravel
/storage/*.key
.env
.env.backup
.phpunit.result.cache
Homestead.json
Homestead.yaml
auth.json
npm-debug.log
yarn-error.log
/.idea
/.vscode

# WordPress
*.log
wp-config.php
!wp-config-sample.php

# OS
.DS_Store
Thumbs.db
`;

const DOTNET_BASE = `# Build results
[Bb]in/
[Oo]bj/
[Dd]ebug/
[Rr]elease/
x64/
x86/
[Aa][Rr][Mm]/
[Aa][Rr][Mm]64/
bld/
[Ll]og/
[Ll]ogs/
[Oo]ut/
*.user
*.suo
*.userprefs
*.sln.docstates

# Visual Studio
.vs/
.vscode/
.idea/

# NuGet
*.nupkg
*.snupkg
**/[Pp]ackages/*
!**/[Pp]ackages/build/
*.nuget.props
*.nuget.targets

# Test results
[Tt]est[Rr]esult*/
TestResult.xml
coverage*.json
coverage*.xml
coverage*.info

# OS
.DS_Store
Thumbs.db
`;

const ELIXIR_BASE = `# Compiled artifacts
/_build/
/cover/
/deps/
/doc/
/.fetch
erl_crash.dump
*.ez
*.beam
/config/*.secret.exs
.elixir_ls/

# Mix
mix.lock

# IDE
.vscode/
.idea/

# OS
.DS_Store
Thumbs.db
`;

const DART_BASE = `# Dart
.dart_tool/
.packages
.pub-cache/
.pub/
build/

# IDE
.idea/
.vscode/

# Coverage
coverage/

# OS
.DS_Store
Thumbs.db
`;

const VUE_BASE = `# Dependencies
node_modules/

# Build
dist/
.nuxt/
.cache/

# IDE
.vscode/
.idea/

# Logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Env
.env
.env.local
.env.*.local

# OS
.DS_Store
Thumbs.db
`;

const SVELTE_BASE = `# Build
.svelte-kit/
build/
dist/

# Dependencies
node_modules/

# Logs
*.log

# Env
.env
.env.local

# IDE
.vscode/
.idea/

# OS
.DS_Store
Thumbs.db
`;

/** Detect which stacks apply based on file paths in the project. */
export function detectStacks(files: Array<{ path: string }>): ProjectStack[] {
  const paths = files.map((f) => f.path.toLowerCase());
  const stacks = new Set<ProjectStack>();

  // Check for top-level markers
  for (const p of paths) {
    if (p.includes('package.json')) {
      // Could be Node, Next, React, Vue, Svelte
      if (paths.some((x) => x.includes('next.config') || x.includes('pages/_app') || x.includes('app/layout'))) {
        stacks.add('nextjs');
        stacks.add('node');
      } else if (paths.some((x) => x.includes('svelte.config'))) {
        stacks.add('svelte');
        stacks.add('node');
      } else if (paths.some((x) => x.includes('vite.config') || x.includes('public/index.html'))) {
        stacks.add('react');
        stacks.add('node');
      } else if (paths.some((x) => x.includes('vue.config') || x.includes('nuxt.config'))) {
        stacks.add('vue');
        stacks.add('node');
      } else {
        stacks.add('node');
      }
    }
    if (p.includes('requirements.txt') || p.includes('pyproject.toml') || p.includes('setup.py') || p.includes('manage.py')) {
      stacks.add('python');
    }
    if (p.includes('go.mod')) stacks.add('go');
    if (p.includes('cargo.toml')) stacks.add('rust');
    if (p.includes('gemfile')) stacks.add('ruby');
    if (p.endsWith('.java') || p.includes('pom.xml') || p.includes('build.gradle')) stacks.add('java');
    if (p.endsWith('.php') || p.includes('composer.json')) stacks.add('php');
    if (p.includes('.csproj') || p.includes('.sln')) stacks.add('dotnet');
    if (p.includes('mix.exs')) stacks.add('elixir');
    if (p.includes('pubspec.yaml')) stacks.add('dart');
  }

  return Array.from(stacks);
}

/** Generate .gitignore content based on detected stacks. */
export function generateGitignore(stacks: ProjectStack[]): string {
  const sections: string[] = ['# Generated by G-Push', `# Date: ${new Date().toISOString().split('T')[0]}`, ''];

  // Always include the universal sections
  const universal = `# ── IDE ──
.vscode/*
!.vscode/settings.json
!.vscode/extensions.json
.idea/
*.swp
*.swo
*~
*.bak

# ── OS ──
.DS_Store
Thumbs.db
desktop.ini
ehthumbs.db
$RECYCLE.BIN/

# ── Env (always) ──
.env
.env.local
.env.*.local

# ── Logs (always) ──
*.log
logs/

# ── Coverage (always) ──
coverage/
*.lcov
.nyc_output/
`;
  sections.push(universal);

  // Stack-specific sections
  const stackSections: Record<ProjectStack, string> = {
    node: NODE_BASE,
    nextjs: NEXTJS_EXTRA,
    react: REACT_EXTRA,
    vue: VUE_BASE,
    svelte: SVELTE_BASE,
    python: PYTHON_BASE,
    go: GO_BASE,
    rust: RUST_BASE,
    ruby: RUBY_BASE,
    java: JAVA_BASE,
    php: PHP_BASE,
    dotnet: DOTNET_BASE,
    elixir: ELIXIR_BASE,
    dart: DART_BASE,
  };

  // Order matters — pick the most specific first
  const order: ProjectStack[] = [
    'nextjs',
    'svelte',
    'vue',
    'react',
    'node',
    'python',
    'go',
    'rust',
    'ruby',
    'java',
    'php',
    'dotnet',
    'elixir',
    'dart',
  ];

  const added = new Set<ProjectStack>();
  for (const stack of order) {
    if (stacks.includes(stack) && !added.has(stack)) {
      sections.push(`# ── ${stack.toUpperCase()} ──`);
      sections.push(stackSections[stack]);
      added.add(stack);

      // Avoid duplicating Node section after React/Vue/Svelte
      if (['react', 'vue', 'svelte'].includes(stack) && stacks.includes('node')) {
        added.add('node');
      }
    }
  }

  return sections.join('\n');
}

/** Convert a string to a File object (browser-side). */
function stringToFile(content: string, path: string, type = 'text/plain'): File {
  return new File([content], path, { type });
}

// ─────────────────────────────────────────────────────────────────
// PUBLIC API — main entry point
// ─────────────────────────────────────────────────────────────────

export interface GeneratedFiles {
  readme: File | null;
  license: File | null;
  gitignore: File | null;
  /** Detected stacks used for gitignore */
  stacks: ProjectStack[];
}

/**
 * Generate all auto-files for a project based on detection.
 * Pass existingFiles to detect stacks; the wizard calls this when the user
 * reaches the "Files" step.
 */
export function generateStarterFiles(opts: {
  projectName: string;
  description: string;
  author: string;
  license: LicenseId;
  stack?: string;
  existingFiles: Array<{ path: string }>;
  /** Toggle each generator on/off */
  generateReadme: boolean;
  generateLicense: boolean;
  generateGitignore: boolean;
}): GeneratedFiles {
  const result: GeneratedFiles = {
    readme: null,
    license: null,
    gitignore: null,
    stacks: [],
  };

  if (opts.generateReadme) {
    result.readme = stringToFile(
      generateReadme({
        projectName: opts.projectName,
        description: opts.description,
        author: opts.author,
        license: opts.license,
        stack: opts.stack,
        isNewProject: true,
      }),
      'README.md',
      'text/markdown'
    );
  }

  if (opts.generateLicense) {
    result.license = stringToFile(generateLicense(opts.license, opts.author), 'LICENSE', 'text/plain');
  }

  if (opts.generateGitignore) {
    result.stacks = detectStacks(opts.existingFiles);
    result.gitignore = stringToFile(generateGitignore(result.stacks), '.gitignore', 'text/plain');
  }

  return result;
}
// Lightweight project-type detection from dropped files.
// Used to show a badge like "Detected: Next.js" in the wizard
// and to pick smart defaults (README template, CI file, etc.).

export type ProjectType = {
  id: string;
  label: string;
  emoji: string;
  color: string;
  build?: string;
  test?: string;
  start?: string;
};

const PROJECT_SIGNATURES: { type: ProjectType; files: string[] }[] = [
  {
    type: {
      id: 'nextjs',
      label: 'Next.js',
      emoji: '▲',
      color: '#000',
      build: 'next build',
      start: 'next start',
    },
    files: ['next.config.js', 'next.config.mjs', 'next.config.ts'],
  },
  {
    type: {
      id: 'react',
      label: 'React',
      emoji: '⚛',
      color: '#61dafb',
      build: 'npm run build',
      start: 'npm start',
    },
    files: [],
  },
  {
    type: {
      id: 'vue',
      label: 'Vue',
      emoji: '▲',
      color: '#42b883',
      build: 'npm run build',
    },
    files: ['vue.config.js', 'vite.config.ts'],
  },
  {
    type: {
      id: 'node',
      label: 'Node.js',
      emoji: '⬢',
      color: '#3c873a',
      build: 'npm run build',
      test: 'npm test',
    },
    files: ['package.json'],
  },
  {
    type: {
      id: 'python',
      label: 'Python',
      emoji: '🐍',
      color: '#3776ab',
      build: 'python -m build',
      test: 'pytest',
    },
    files: ['requirements.txt', 'pyproject.toml', 'setup.py', 'Pipfile'],
  },
  {
    type: {
      id: 'go',
      label: 'Go',
      emoji: '◎',
      color: '#00add8',
      build: 'go build ./...',
      test: 'go test ./...',
    },
    files: ['go.mod'],
  },
  {
    type: {
      id: 'rust',
      label: 'Rust',
      emoji: '🦀',
      color: '#dea584',
      build: 'cargo build --release',
      test: 'cargo test',
    },
    files: ['Cargo.toml'],
  },
  {
    type: {
      id: 'ruby',
      label: 'Ruby',
      emoji: '💎',
      color: '#cc342d',
      build: 'bundle install',
    },
    files: ['Gemfile'],
  },
  {
    type: {
      id: 'java',
      label: 'Java',
      emoji: '☕',
      color: '#ed8b00',
      build: 'mvn package',
    },
    files: ['pom.xml', 'build.gradle', 'build.gradle.kts'],
  },
];

export function detectProjectType(files: File[]): ProjectType | null {
  const paths = new Set(files.map((f) => (f as any).webkitRelativePath || f.name));

  // First pass: specific framework markers
  for (const sig of PROJECT_SIGNATURES) {
    if (sig.files.some((f) => paths.has(f))) {
      return sig.type;
    }
  }

  // Second pass: generic indicators
  if (paths.has('package.json')) {
    return PROJECT_SIGNATURES.find((s) => s.type.id === 'node')!.type;
  }
  if (
    paths.has('requirements.txt') ||
    paths.has('pyproject.toml') ||
    paths.has('setup.py')
  ) {
    return PROJECT_SIGNATURES.find((s) => s.type.id === 'python')!.type;
  }
  if (paths.has('go.mod')) {
    return PROJECT_SIGNATURES.find((s) => s.type.id === 'go')!.type;
  }
  if (paths.has('Cargo.toml')) {
    return PROJECT_SIGNATURES.find((s) => s.type.id === 'rust')!.type;
  }
  if (paths.has('Gemfile')) {
    return PROJECT_SIGNATURES.find((s) => s.type.id === 'ruby')!.type;
  }

  return null;
}

export function suggestDescription(
  projectType: ProjectType | null,
  repoName: string
): string {
  if (!projectType) return '';
  const map: Record<string, string> = {
    nextjs: `${repoName} — built with Next.js`,
    react: `${repoName} — React application`,
    vue: `${repoName} — Vue.js application`,
    node: `${repoName} — Node.js project`,
    python: `${repoName} — Python project`,
    go: `${repoName} — Go module`,
    rust: `${repoName} — Rust crate`,
    ruby: `${repoName} — Ruby project`,
    java: `${repoName} — Java project`,
  };
  return map[projectType.id] || '';
}
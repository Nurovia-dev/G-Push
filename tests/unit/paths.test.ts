import { computePathMap, detectStrippedPrefix } from '@/lib/paths';

describe('paths', () => {
  function makeFile(name: string, webkitRelativePath?: string): File {
    const f = new File([''], name);
    if (webkitRelativePath) (f as any).webkitRelativePath = webkitRelativePath;
    return f;
  }

  describe('computePathMap', () => {
    it('returns empty map for empty input', () => {
      const map = computePathMap([]);
      expect(map.size).toBe(0);
    });

    it('uses filename for single-file uploads', () => {
      const f = makeFile('hello.txt');
      const map = computePathMap([f]);
      expect(map.get(f)).toBe('hello.txt');
    });

    it('strips common folder prefix from multi-file uploads', () => {
      const a = makeFile('a', 'my-app/package.json');
      const b = makeFile('b', 'my-app/src/index.ts');
      const c = makeFile('c', 'my-app/README.md');
      const map = computePathMap([a, b, c]);
      expect(map.get(a)).toBe('package.json');
      expect(map.get(b)).toBe('src/index.ts');
      expect(map.get(c)).toBe('README.md');
    });

    it('preserves paths when files come from different folders', () => {
      const a = makeFile('a', 'foo/x.txt');
      const b = makeFile('b', 'bar/y.txt');
      const map = computePathMap([a, b]);
      expect(map.get(a)).toBe('foo/x.txt');
      expect(map.get(b)).toBe('bar/y.txt');
    });

    it('falls back to filename when no webkitRelativePath', () => {
      const f = makeFile('standalone.txt');
      const map = computePathMap([f]);
      expect(map.get(f)).toBe('standalone.txt');
    });

    it('preserves nested structure after prefix strip', () => {
      const f = makeFile('f', 'my-app/src/components/Button.tsx');
      const map = computePathMap([f]);
      expect(map.get(f)).toBe('src/components/Button.tsx');
    });

    it('strips only the top-level folder, not deeper prefixes', () => {
      const a = makeFile('a', 'a/b/c/file1.txt');
      const b = makeFile('b', 'a/b/c/d/file2.txt');
      const map = computePathMap([a, b]);
      // Only strips the top-level segment 'a/'
      expect(map.get(a)).toBe('b/c/file1.txt');
      expect(map.get(b)).toBe('b/c/d/file2.txt');
    });
  });

  describe('detectStrippedPrefix', () => {
    it('returns null for empty files', () => {
      expect(detectStrippedPrefix([])).toBeNull();
    });

    it('returns null for single-file uploads', () => {
      const f = makeFile('a', 'foo.txt');
      expect(detectStrippedPrefix([f])).toBeNull();
    });

    it('returns null for files without webkitRelativePath', () => {
      const a = makeFile('a');
      const b = makeFile('b');
      expect(detectStrippedPrefix([a, b])).toBeNull();
    });

    it('returns null when files come from different folders', () => {
      const a = makeFile('a', 'foo/x.txt');
      const b = makeFile('b', 'bar/y.txt');
      expect(detectStrippedPrefix([a, b])).toBeNull();
    });

    it('returns the common folder prefix when present', () => {
      const a = makeFile('a', 'my-app/x.txt');
      const b = makeFile('b', 'my-app/y.txt');
      expect(detectStrippedPrefix([a, b])).toBe('my-app/');
    });

    it('returns the prefix for single-file with relative path', () => {
      const f = makeFile('a', 'foo/bar.txt');
      expect(detectStrippedPrefix([f])).toBe('foo/');
    });
  });
});
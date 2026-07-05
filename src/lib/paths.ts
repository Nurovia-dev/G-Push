// Detect the common top-level folder (when user drops a directory) and strip it.
// Returns a Map<File, string> of cleaned paths. Used everywhere we display
// file paths or send them to the push endpoint.

export function computePathMap(files: File[]): Map<File, string> {
  const map = new Map<File, string>();
  if (files.length === 0) return map;

  // If no webkitRelativePath, fall back to filename (single-file upload).
  const paths = files.map((f: any) => f.webkitRelativePath || f.name);
  if (!paths[0].includes('/')) {
    for (const f of files) map.set(f, f.name);
    return map;
  }

  // Find common first segment (the folder the user selected).
  // Only strip if EVERY path shares the same first segment.
  const firstSegs = paths.map((p: string) => p.split('/')[0]);
  const allSame = firstSegs.every((s: string) => s === firstSegs[0]);
  if (!allSame) {
    // Files from multiple roots — don't strip anything.
    for (let i = 0; i < files.length; i++) map.set(files[i], paths[i]);
    return map;
  }

  const prefix = firstSegs[0] + '/';
  for (let i = 0; i < files.length; i++) {
    const p = paths[i].startsWith(prefix) ? paths[i].slice(prefix.length) : paths[i];
    map.set(files[i], p || files[i].name);
  }
  return map;
}

// Detect what (if any) prefix would be stripped. Used to show a UI badge.
export function detectStrippedPrefix(files: File[]): string | null {
  if (files.length === 0) return null;
  const paths = files.map((f: any) => f.webkitRelativePath || f.name);
  if (!paths[0].includes('/')) return null;

  const firstSegs = paths.map((p: string) => p.split('/')[0]);
  const allSame = firstSegs.every((s: string) => s === firstSegs[0]);
  if (!allSame) return null;

  return firstSegs[0] + '/';
}
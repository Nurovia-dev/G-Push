/**
 * Resume interrupted push — checkpoint-based upload tracking.
 *
 * Saves upload progress to localStorage so a 270-file push that fails at file 150
 * can resume from file 151 instead of restarting.
 *
 * What's stored per push:
 *   - repo owner/name
 *   - list of file paths (for verification)
 *   - list of already-uploaded blob SHAs
 *   - commit SHA (if commit was created)
 *   - branch + PR URL (if applicable)
 *
 * Why localStorage:
 *   - Server is stateless (Vercel serverless)
 *   - User keeps state across refreshes on the same browser
 *   - Cleared automatically on completion
 *
 * Limitations:
 *   - Only resumes in the same browser (no cross-device resume)
 *   - Cleared when user clicks "Start over"
 *   - 5 MB localStorage limit (one push's checkpoint is ~50 KB)
 */

import type { LicenseId } from '@/lib/generators';

export interface PushCheckpoint {
  /** Unique ID (timestamp-based) */
  id: string;
  /** When the push started (ISO date) */
  startedAt: string;
  /** Last updated (ISO date) */
  updatedAt: string;
  /** What stage the push is at */
  stage: 'uploading' | 'creating-tree' | 'creating-commit' | 'pushing' | 'opening-pr' | 'done' | 'failed';

  // Repo info
  owner: string;
  repo: string;
  isNewRepo: boolean;
  visibility: 'public' | 'private';
  license: LicenseId;
  description: string;

  // Files
  files: { path: string; sha: string }[];
  /** Map of file path → blob SHA (already uploaded to GitHub) */
  uploadedBlobs: Record<string, string>;
  /** Number of files uploaded so far */
  uploadedCount: number;
  /** Total files expected */
  totalCount: number;

  // Strategy
  pushStrategy: 'normal' | 'force' | 'wipe' | 'pr';
  commitMessage: string;

  // Outputs (if commit was created)
  commitSha?: string;
  baseBranch?: string;
  newBranch?: string;
  prUrl?: string;
  finalUrl?: string;

  // Error (if failed)
  error?: string;
}

const STORAGE_KEY = 'gpush_checkpoint';

/** Save a checkpoint to localStorage. */
export function saveCheckpoint(checkpoint: PushCheckpoint): void {
  try {
    const updated = { ...checkpoint, updatedAt: new Date().toISOString() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('[gpush] Could not save checkpoint:', e);
  }
}

/** Load checkpoint (if any). Returns null if no valid checkpoint. */
export function loadCheckpoint(): PushCheckpoint | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const cp = JSON.parse(raw) as PushCheckpoint;
    if (!cp.id || !cp.files || !cp.uploadedBlobs) return null;
    return cp;
  } catch {
    return null;
  }
}

/** Clear checkpoint (call after successful push or when user starts over). */
export function clearCheckpoint(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
}

/** Create a fresh checkpoint for a new push. */
export function createCheckpoint(params: {
  owner: string;
  repo: string;
  isNewRepo: boolean;
  visibility: 'public' | 'private';
  license: LicenseId;
  description: string;
  files: { path: string }[];
  pushStrategy: 'normal' | 'force' | 'wipe' | 'pr';
  commitMessage: string;
}): PushCheckpoint {
  const now = new Date().toISOString();
  return {
    id: `push-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    startedAt: now,
    updatedAt: now,
    stage: 'uploading',
    owner: params.owner,
    repo: params.repo,
    isNewRepo: params.isNewRepo,
    visibility: params.visibility,
    license: params.license,
    description: params.description,
    files: params.files.map((f) => ({ path: f.path, sha: '' })),
    uploadedBlobs: {},
    uploadedCount: 0,
    totalCount: params.files.length,
    pushStrategy: params.pushStrategy,
    commitMessage: params.commitMessage,
  };
}

/** Format a checkpoint's age for display. */
export function checkpointAge(cp: PushCheckpoint): string {
  const ms = Date.now() - new Date(cp.updatedAt).getTime();
  const sec = Math.floor(ms / 1000);
  if (sec < 60) return `${sec}s ago`;
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  return `${Math.floor(sec / 3600)}h ago`;
}

/** Progress percentage (0-100). */
export function checkpointProgress(cp: PushCheckpoint): number {
  if (cp.totalCount === 0) return 0;
  return Math.round((cp.uploadedCount / cp.totalCount) * 100);
}
import { translateError } from '@/lib/github-errors';

describe('github-errors', () => {
  describe('translateError', () => {
    it('translates network errors with retry suggestion', () => {
      const result = translateError(0, 'ECONNRESET — connection reset by peer');
      expect(result.kind).toBe('network');
      expect(result.retryable).toBe(true);
      expect(result.friendly).toMatch(/Network error/i);
    });

    it('translates 401 to auth error', () => {
      const result = translateError(401, JSON.stringify({ message: 'Bad credentials' }));
      expect(result.kind).toBe('auth');
      expect(result.retryable).toBe(false);
      expect(result.suggestion).toBe('Sign in again');
    });

    it('translates 422 with name conflict to exists error', () => {
      const result = translateError(422, JSON.stringify({
        message: 'Validation Failed',
        errors: [{ resource: 'Repository', field: 'name', code: 'already_exists' }],
      }));
      expect(result.kind).toBe('exists');
      expect(result.suggestion).toMatch(/Wipe/i);
    });

    it('translates 422 with invalid field to validation error', () => {
      const result = translateError(422, JSON.stringify({
        message: 'Validation Failed',
        errors: [{ resource: 'Repository', field: 'description', code: 'invalid', message: 'description is invalid' }],
      }));
      expect(result.kind).toBe('validation');
      expect(result.friendly).toContain('description is invalid');
    });

    it('translates 403 with protected branch', () => {
      const result = translateError(403, JSON.stringify({
        message: 'protected branch',
      }));
      expect(result.kind).toBe('branch-protection');
      expect(result.suggestion).toMatch(/PR/i);
    });

    it('translates 403 with delete_repo permission missing', () => {
      const result = translateError(403, JSON.stringify({
        message: 'Resource not accessible by integration — delete_repo scope required',
      }));
      expect(result.kind).toBe('permission');
      expect(result.friendly).toMatch(/delete repos/i);
    });

    it('translates 403 with rate limit', () => {
      const result = translateError(403, JSON.stringify({
        message: 'API rate limit exceeded for user ID 12345',
      }));
      expect(result.kind).toBe('rate-limit');
      expect(result.retryable).toBe(true);
    });

    it('translates 404 for missing repo', () => {
      const result = translateError(404, JSON.stringify({ message: 'Not Found' }));
      expect(result.kind).toBe('unknown');
      expect(result.friendly).toMatch(/Repo not found/i);
    });

    it('translates 5xx server errors as retryable', () => {
      const result = translateError(503, JSON.stringify({ message: 'Service Unavailable' }));
      expect(result.kind).toBe('server');
      expect(result.retryable).toBe(true);
    });

    it('handles non-JSON raw bodies gracefully', () => {
      const result = translateError(500, '<html>500 Internal Server Error</html>');
      expect(result.status).toBe(500);
      expect(result.friendly).toBeTruthy();
    });

    it('handles empty raw bodies gracefully', () => {
      const result = translateError(500, '');
      expect(result.status).toBe(500);
    });

    it('translates HTTP 0 with empty body as connection-dropped', () => {
      const result = translateError(0, '');
      expect(result.status).toBe(0);
      expect(result.kind).toBe('network');
      expect(result.retryable).toBe(true);
      expect(result.friendly).toMatch(/Connection dropped/i);
      expect(result.friendly).toMatch(/check your GitHub repo/i);
      expect(result.friendly).toMatch(/resume feature/i);
    });
  });
});
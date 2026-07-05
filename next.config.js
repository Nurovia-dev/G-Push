/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: { bodySizeLimit: '50mb' },
    instrumentationHook: true,
  },

  /**
   * Cache headers to prevent stale-bundle hydration errors.
   *
   * Without these, browsers aggressively cache HTML and JS chunks across
   * deployments, leading to "originalFactory is undefined" errors when
   * the cached JS references modules that no longer exist in the new build.
   *
   * The strategy:
   *   - HTML pages: never cache, always revalidate (ensures fresh HTML on every visit)
   *   - JS chunks with hashes: long cache is fine (filename changes on rebuild)
   *   - Static assets: long cache (immutable)
   */
  async headers() {
    return [
      {
        // All HTML pages — never cache, always revalidate from origin
        source: '/:path*\\.html',
        headers: [
          { key: 'Cache-Control', value: 'no-store, must-revalidate' },
        ],
      },
      {
        // RSC payload responses — never cache (always fresh)
        source: '/:path*.rsc',
        headers: [
          { key: 'Cache-Control', value: 'no-store, must-revalidate' },
        ],
      },
      {
        // Root path
        source: '/',
        headers: [
          { key: 'Cache-Control', value: 'no-store, must-revalidate' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
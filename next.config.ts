import type { NextConfig } from 'next';
import redirectMap from './data/redirects.json';

/**
 * FR5 — every seeded edit.site path answers a real 308 at the edge, before any
 * route matching happens. `permanent: true` is what makes it 308 rather than 307.
 */
const nextConfig: NextConfig = {
  // This project sits inside a workspace that has its own lockfile; pin the
  // root so the bundler does not infer the parent directory.
  turbopack: { root: import.meta.dirname },
  async redirects() {
    return Object.entries(redirectMap as Record<string, string>).map(
      ([legacyPath, newSlug]) => ({
        source: legacyPath,
        destination: `/site/${newSlug}`,
        permanent: true,
      }),
    );
  },
};

export default nextConfig;

import { notFound } from 'next/navigation';

/**
 * FR5 — every *seeded* legacy path is rewritten to a 308 in `next.config.ts`,
 * so those never reach this route. Anything that lands here was not in the
 * redirect map, and a migration that silently swallowed it would be worse than
 * a 404: this is the page that tells you the map is missing an entry.
 */
export default function UnmappedLegacyPath() {
  notFound();
}

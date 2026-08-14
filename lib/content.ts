import pagesJson from '@/data/pages.json';
import fallbackJson from '@/data/fallbackMeta.json';
import redirectsJson from '@/data/redirects.json';
import type { PageRecord, MigrationStatus } from './types';

/** Read-only seed data. ADR 0001 allows this in memory — nothing writes to it. */
export const pages = pagesJson as unknown as PageRecord[];

export const redirects = redirectsJson as Record<string, string>;

export const TOTAL_PAGES = pages.length;

export function getPage(slug: string): PageRecord | undefined {
  return pages.find((p) => p.newSlug === slug);
}

export function getPageById(id: string): PageRecord | undefined {
  return pages.find((p) => p.id === id);
}

export function isMigrated(page: PageRecord): boolean {
  return Array.isArray(page.sections) && page.sections.length > 0;
}

export const STATUS_LABELS: Record<MigrationStatus, string> = {
  todo: 'To do',
  'in-review': 'In review',
  done: 'Done',
};

interface FallbackMeta {
  byId: Record<string, string>;
  byTemplate: Record<string, string>;
  default: string;
}

const fallbackMeta = fallbackJson as FallbackMeta;

/**
 * The seeded sample used whenever the visitor has no key, or their provider
 * call fails. FR8: this path must always return usable copy.
 */
export function sampleMetaDescription(page: PageRecord): string {
  const specific = fallbackMeta.byId[page.id];
  if (specific) return specific;
  const template = fallbackMeta.byTemplate[page.template] ?? fallbackMeta.default;
  return template.replace('{title}', page.title);
}

export function siteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return 'http://localhost:3000';
}

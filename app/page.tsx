import type { Metadata } from 'next';
import { MigrationConsole, type ConsoleRow } from '@/components/console/MigrationConsole';
import { isMigrated, pages } from '@/lib/content';
import { readMigrationState, resolveRow } from '@/lib/migrationState';
import type { MigrationStatus } from '@/lib/types';

// ADR 0001 — this page reads the visitor's cookie, so it must never be
// prerendered at build time with the empty state baked in.
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Migration console — 44 pages from edit.site to Next.js | CrossBeamIP',
  description:
    'Track all 44 marketing pages through the edit.site to Next.js App Router migration: search, filter, status, priority and per-page SEO drafting.',
};

type StatusFilter = 'all' | MigrationStatus;

function parseStatus(value: string | undefined): StatusFilter {
  return value === 'todo' || value === 'in-review' || value === 'done' ? value : 'all';
}

export default async function ConsolePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const rawQuery = params.q;
  const rawStatus = params.status;

  const state = await readMigrationState();

  const rows: ConsoleRow[] = pages.map((page) => {
    const { status, priority } = resolveRow(page, state);
    return {
      id: page.id,
      legacyPath: page.legacyPath,
      newSlug: page.newSlug,
      title: page.title,
      template: page.template,
      wordCount: page.wordCount,
      seedDescription: page.seo.description,
      migrated: isMigrated(page),
      status,
      priority,
    };
  });

  return (
    <MigrationConsole
      rows={rows}
      initialQuery={typeof rawQuery === 'string' ? rawQuery : ''}
      initialStatus={parseStatus(typeof rawStatus === 'string' ? rawStatus : undefined)}
    />
  );
}

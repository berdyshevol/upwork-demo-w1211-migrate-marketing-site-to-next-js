'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { setRow } from '@/app/actions';
import { BYOK_HINT, readByok, type ByokConfig } from '@/lib/byok';
import type { MigrationStatus } from '@/lib/types';

export interface ConsoleRow {
  id: string;
  legacyPath: string;
  newSlug: string;
  title: string;
  template: string;
  wordCount: number;
  seedDescription: string;
  migrated: boolean;
  status: MigrationStatus;
  priority: boolean;
}

type StatusFilter = 'all' | MigrationStatus;

interface RowIntent {
  status: MigrationStatus;
  priority: boolean;
}

interface Draft {
  loading: boolean;
  text?: string;
  source?: 'ai' | 'sample';
  provider?: string;
  model?: string;
}

const STATUS_OPTIONS: { value: MigrationStatus; label: string }[] = [
  { value: 'todo', label: 'To do' },
  { value: 'in-review', label: 'In review' },
  { value: 'done', label: 'Done' },
];

const STATUS_STYLES: Record<MigrationStatus, string> = {
  todo: 'bg-slate-500/10 text-slate-300 ring-slate-400/30',
  'in-review': 'bg-amber-500/10 text-amber-300 ring-amber-400/30',
  done: 'bg-emerald-500/10 text-emerald-300 ring-emerald-400/30',
};

function matches(row: ConsoleRow, query: string): boolean {
  if (!query) return true;
  const q = query.toLowerCase();
  return (
    row.title.toLowerCase().includes(q) ||
    row.legacyPath.toLowerCase().includes(q) ||
    row.newSlug.toLowerCase().includes(q) ||
    row.template.toLowerCase().includes(q)
  );
}

export function MigrationConsole({
  rows,
  initialQuery,
  initialStatus,
}: {
  rows: ConsoleRow[];
  initialQuery: string;
  initialStatus: StatusFilter;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(initialStatus);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [byok, setByok] = useState<ByokConfig | null>(null);
  const [byokLoaded, setByokLoaded] = useState(false);
  const [isSaving, startTransition] = useTransition();

  // What the visitor has asked for, which is ahead of the server between a
  // click and its confirmation. Only used to build the next write's payload —
  // what is *displayed* is always what the cookie actually holds, so the
  // progress summary never claims a change that has not been persisted.
  const intents = useRef<Record<string, RowIntent>>({});

  // Cookie writes are read-modify-write, so they run one at a time.
  const queue = useRef<Promise<unknown>>(Promise.resolve());

  useEffect(() => {
    setByok(readByok());
    setByokLoaded(true);
  }, []);

  // FR7 — the active search term and status filter live in the URL so the
  // filtered view is shareable. replaceState keeps typing instant.
  const syncUrl = useCallback((nextQuery: string, nextStatus: StatusFilter) => {
    const params = new URLSearchParams();
    if (nextQuery) params.set('q', nextQuery);
    if (nextStatus !== 'all') params.set('status', nextStatus);
    const qs = params.toString();
    window.history.replaceState(null, '', qs ? `/?${qs}` : '/');
  }, []);

  const onQueryChange = (value: string) => {
    setQuery(value);
    syncUrl(value, statusFilter);
  };

  const onStatusFilterChange = (value: StatusFilter) => {
    setStatusFilter(value);
    syncUrl(query, value);
  };

  const persist = (row: ConsoleRow, change: Partial<RowIntent>) => {
    const current: RowIntent = intents.current[row.id] ?? {
      status: row.status,
      priority: row.priority,
    };
    const next: RowIntent = { ...current, ...change };
    intents.current[row.id] = next;
    startTransition(async () => {
      queue.current = queue.current
        .catch(() => undefined)
        .then(() => setRow(row.id, next.status, next.priority));
      await queue.current;
    });
  };

  const onRowStatus = (row: ConsoleRow, status: MigrationStatus) => persist(row, { status });

  const onRowPriority = (row: ConsoleRow, priority: boolean) => persist(row, { priority });

  /**
   * FR8 — always returns usable copy. Live path runs on the visitor's own key,
   * straight from their browser to their provider. Every other path lands on
   * the seeded sample, clearly labeled.
   */
  const onDraft = async (row: ConsoleRow) => {
    setDrafts((d) => ({ ...d, [row.id]: { loading: true } }));

    // Read the key at click time, not from render state: the visitor may have
    // saved one in another tab, and a click that lands before this component
    // has finished mounting must not silently take the no-key path.
    const config = readByok();
    if (config) {
      try {
        const { draftMetaDescription } = await import('@/lib/llm');
        const text = await draftMetaDescription(config, {
          title: row.title,
          template: row.template,
          legacyPath: row.legacyPath,
          seedDescription: row.seedDescription,
        });
        setDrafts((d) => ({
          ...d,
          [row.id]: {
            loading: false,
            text,
            source: 'ai',
            provider: config.provider,
            model: config.model,
          },
        }));
        return;
      } catch {
        // fall through to the seeded sample — never an error state
      }
    }

    try {
      const response = await fetch('/api/meta-draft', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id: row.id }),
      });
      const data = (await response.json()) as { description?: string };
      if (!data.description) throw new Error('no description');
      setDrafts((d) => ({
        ...d,
        [row.id]: { loading: false, text: data.description, source: 'sample' },
      }));
    } catch {
      // Last resort: the description already shipped with the row.
      setDrafts((d) => ({
        ...d,
        [row.id]: { loading: false, text: row.seedDescription, source: 'sample' },
      }));
    }
  };

  const doneCount = useMemo(() => rows.filter((r) => r.status === 'done').length, [rows]);
  const inReviewCount = useMemo(
    () => rows.filter((r) => r.status === 'in-review').length,
    [rows],
  );
  const priorityCount = useMemo(() => rows.filter((r) => r.priority).length, [rows]);
  const percent = Math.round((doneCount / rows.length) * 100);

  const visible = useMemo(
    () =>
      rows.filter(
        (row) =>
          matches(row, query) && (statusFilter === 'all' || row.status === statusFilter),
      ),
    [rows, query, statusFilter],
  );

  return (
    <div className="mx-auto max-w-6xl px-5 py-10">
      <header>
        <p className="text-xs font-semibold uppercase tracking-widest text-beam-400">
          edit.site → Next.js App Router
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
          CrossBeamIP migration console
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-relaxed text-slate-400">
          All 44 pages of the marketing site as one content model rather than 44 hand-copied
          layouts. Five are fully migrated and render from three shared section components; every
          legacy URL already answers a 308. Track the remaining 39 here.
        </p>
      </header>

      {/* FR9 — progress recalculates from the rows on screen, so it moves the
          moment a status changes rather than after a round trip. */}
      <section
        data-testid="progress-summary"
        className="card mt-8 flex flex-wrap items-center gap-x-10 gap-y-4 p-5"
      >
        <div>
          <p className="text-2xl font-semibold text-white">
            {doneCount} of {rows.length} done
          </p>
          <p className="mt-1 text-sm text-slate-400">{percent}% complete</p>
        </div>
        <div className="min-w-[14rem] flex-1">
          <div
            className="h-2 w-full overflow-hidden rounded-full bg-ink-700"
            role="progressbar"
            aria-valuenow={percent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Migration progress"
          >
            <div
              className="h-full rounded-full bg-emerald-400 transition-all"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
        <dl className="flex gap-8 text-sm">
          <div>
            <dt className="text-slate-500">In review</dt>
            <dd className="mt-0.5 font-semibold text-amber-300">{inReviewCount}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Priority</dt>
            <dd className="mt-0.5 font-semibold text-beam-400">{priorityCount}</dd>
          </div>
        </dl>
        <span aria-live="polite" className="text-xs text-slate-500">
          {isSaving ? 'Saving to your cookie…' : ''}
        </span>
      </section>

      <section className="mt-6 flex flex-wrap items-end gap-4">
        <label className="flex-1 basis-72">
          <span className="mb-1.5 block text-xs font-medium text-slate-400">
            Search path, title or template
          </span>
          <input
            data-testid="inventory-search"
            type="search"
            value={query}
            placeholder="e.g. solutions, /legacy/blog, pricing"
            onChange={(e) => onQueryChange(e.target.value)}
            className="field w-full"
          />
        </label>
        <label>
          <span className="mb-1.5 block text-xs font-medium text-slate-400">Status</span>
          <select
            data-testid="status-filter"
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value as StatusFilter)}
            className="field"
          >
            <option value="all">All statuses</option>
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <p className="pb-2 text-xs text-slate-500">
          Showing {visible.length} of {rows.length} pages
        </p>
      </section>

      {byokLoaded && !byok ? (
        <p
          data-testid="byok-hint"
          className="mt-5 rounded-lg border border-beam-500/40 bg-beam-500/5 px-4 py-3 text-sm text-slate-300"
        >
          {BYOK_HINT}{' '}
          <Link href="/settings" className="font-medium text-beam-400 underline">
            Open Settings
          </Link>
          . Everything else on this page works without one — “Draft meta description” returns
          seeded sample copy in the meantime.
        </p>
      ) : null}

      <div className="card mt-6 overflow-x-auto">
        <table className="w-full min-w-[62rem] border-collapse text-sm">
          <thead>
            <tr className="border-b border-ink-600 text-left text-xs uppercase tracking-wide text-slate-500">
              <th scope="col" className="px-4 py-3 font-medium">Legacy path</th>
              <th scope="col" className="px-4 py-3 font-medium">Title</th>
              <th scope="col" className="px-4 py-3 font-medium">Template</th>
              <th scope="col" className="px-4 py-3 font-medium">Words</th>
              <th scope="col" className="px-4 py-3 font-medium">Status</th>
              <th scope="col" className="px-4 py-3 font-medium">Priority</th>
              <th scope="col" className="px-4 py-3 font-medium">Meta description</th>
            </tr>
          </thead>

          {visible.map((row) => {
            const draft = drafts[row.id];
            return (
              <tbody key={row.id} data-testid={`inventory-row-${row.id}`}>
                <tr data-testid="inventory-row" className="border-b border-ink-700/60 align-middle">
                  <td className="px-4 py-3 font-mono text-xs text-slate-400">{row.legacyPath}</td>
                  <td className="px-4 py-3">
                    <Link
                      data-testid={`row-link-${row.id}`}
                      href={`/site/${row.newSlug}`}
                      className="font-medium text-slate-100 hover:text-beam-400 hover:underline"
                    >
                      {row.title}
                    </Link>
                    {row.migrated ? (
                      <span className="ml-2 text-[10px] uppercase tracking-wide text-emerald-400">
                        migrated
                      </span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-slate-400">{row.template}</td>
                  <td className="px-4 py-3 tabular-nums text-slate-400">{row.wordCount}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className={`badge ${STATUS_STYLES[row.status]}`}>
                        {STATUS_OPTIONS.find((o) => o.value === row.status)?.label}
                      </span>
                      {/* Uncontrolled, re-keyed on the committed status: the
                          visitor's choice stays put while the write is in
                          flight, and the confirmed value re-seeds it after. */}
                      <select
                        key={row.status}
                        data-testid={`row-status-${row.id}`}
                        aria-label={`Migration status for ${row.title}`}
                        defaultValue={row.status}
                        onChange={(e) => onRowStatus(row, e.target.value as MigrationStatus)}
                        className="field py-1 text-xs"
                      >
                        {STATUS_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      data-testid={`row-priority-${row.id}`}
                      aria-pressed={row.priority}
                      aria-label={`Priority flag for ${row.title}`}
                      onClick={() =>
                        onRowPriority(
                          row,
                          !(intents.current[row.id]?.priority ?? row.priority),
                        )
                      }
                      className={`rounded-md border px-2 py-1 text-xs font-medium transition ${
                        row.priority
                          ? 'border-beam-400 bg-beam-500/15 text-beam-400'
                          : 'border-ink-600 text-slate-400 hover:border-slate-500 hover:text-slate-200'
                      }`}
                    >
                      {row.priority ? '★ Priority' : '☆ Flag'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      data-testid={`meta-draft-${row.id}`}
                      onClick={() => onDraft(row)}
                      disabled={draft?.loading}
                      className="rounded-md border border-ink-600 px-2.5 py-1 text-xs font-medium
                        text-slate-300 transition hover:border-beam-400 hover:text-white
                        disabled:opacity-50"
                    >
                      {draft?.loading ? 'Drafting…' : 'Draft meta description'}
                    </button>
                  </td>
                </tr>

                {draft && !draft.loading && draft.text ? (
                  <tr className="border-b border-ink-700/60 bg-ink-950/60">
                    <td colSpan={7} className="px-4 pb-4 pt-1">
                      <p
                        data-testid={`meta-draft-output-${row.id}`}
                        className="max-w-4xl text-sm leading-relaxed text-slate-200"
                      >
                        {draft.text}
                      </p>
                      <p
                        data-testid={`meta-draft-source-${row.id}`}
                        className="mt-1.5 text-xs text-slate-500"
                      >
                        {draft.source === 'ai'
                          ? `Live AI draft · ${draft.provider} / ${draft.model} · ${draft.text.length} characters`
                          : `Sample copy — seeded fallback, not AI generated · ${draft.text.length} characters`}
                      </p>
                    </td>
                  </tr>
                ) : null}
              </tbody>
            );
          })}
        </table>

        {visible.length === 0 ? (
          <p data-testid="inventory-empty" className="px-4 py-10 text-center text-sm text-slate-400">
            No pages match “{query}”
            {statusFilter !== 'all' ? ` with status ${statusFilter}` : ''}.
          </p>
        ) : null}
      </div>

      <p className="mt-4 text-xs leading-relaxed text-slate-500">
        Statuses and priority flags are yours alone — they ride in a single{' '}
        <code className="text-slate-400">cbip-migration-state</code> cookie on your own browser, not
        on our server, so they survive a reload and reset when you clear the cookie.
      </p>
    </div>
  );
}

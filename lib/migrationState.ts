import { cookies } from 'next/headers';
import { pages } from './content';
import type { MigrationState, MigrationStatus, RowState } from './types';

/**
 * ADR 0001 — visitor-written state lives with the visitor.
 *
 * Statuses and priority flags are the only thing a visitor changes here, and
 * they ride in this cookie. Nothing is held in a module-level Map: two requests
 * to the deployed demo are two processes, and the second would not see the first
 * one's write. The 44 page records themselves are read-only seed data, so they
 * stay in code and only ids travel in the cookie.
 *
 * Wire format is deliberately compact — `id:status:priority` triples joined by
 * commas, only for rows that differ from their seeded default — so a fully
 * edited 44-row inventory still fits well inside the 4 KB per-cookie limit.
 */
const COOKIE = 'cbip-migration-state';
const MAX_AGE = 60 * 60 * 24 * 30;

const STATUS_CODES: Record<MigrationStatus, string> = {
  todo: 't',
  'in-review': 'r',
  done: 'd',
};

const CODE_TO_STATUS: Record<string, MigrationStatus> = {
  t: 'todo',
  r: 'in-review',
  d: 'done',
};

const KNOWN_IDS = new Set(pages.map((p) => p.id));

export function decodeState(raw: string | undefined): MigrationState {
  if (!raw) return {};
  const state: MigrationState = {};
  try {
    for (const entry of decodeURIComponent(raw).split(',')) {
      if (!entry) continue;
      const [id, code, priority] = entry.split(':');
      if (!KNOWN_IDS.has(id)) continue; // tampered or stale id — ignore it
      const row: Partial<RowState> = {};
      if (code && CODE_TO_STATUS[code]) row.status = CODE_TO_STATUS[code];
      if (priority === '1') row.priority = true;
      else if (priority === '0') row.priority = false;
      if (Object.keys(row).length > 0) state[id] = row;
    }
  } catch {
    return {}; // truncated or garbage cookie falls back to the seeded defaults
  }
  return state;
}

export function encodeState(state: MigrationState): string {
  const parts: string[] = [];
  for (const page of pages) {
    const row = state[page.id];
    if (!row) continue;
    const status = row.status ?? page.defaultStatus;
    const priority = row.priority ?? false;
    // Nothing to store for a row that matches its seeded default.
    if (status === page.defaultStatus && !priority) continue;
    parts.push(`${page.id}:${STATUS_CODES[status]}:${priority ? '1' : '0'}`);
  }
  return encodeURIComponent(parts.join(','));
}

/** Safe in any server component or server action. Never throws on a bad cookie. */
export async function readMigrationState(): Promise<MigrationState> {
  const store = await cookies();
  return decodeState(store.get(COOKIE)?.value);
}

/** ONLY callable from a server action or a route handler — cookies().set throws during render. */
export async function writeMigrationState(state: MigrationState): Promise<void> {
  const store = await cookies();
  store.set(COOKIE, encodeState(state), {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: MAX_AGE,
  });
}

/** Merge seeded defaults with whatever the visitor has changed. */
export function resolveRow(
  page: { id: string; defaultStatus: MigrationStatus },
  state: MigrationState,
): RowState {
  const row = state[page.id];
  return {
    status: row?.status ?? page.defaultStatus,
    priority: row?.priority ?? false,
  };
}

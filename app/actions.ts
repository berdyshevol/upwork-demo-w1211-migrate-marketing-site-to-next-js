'use server';

import { revalidatePath } from 'next/cache';
import { getPageById } from '@/lib/content';
import { readMigrationState, writeMigrationState } from '@/lib/migrationState';
import type { MigrationStatus } from '@/lib/types';

const VALID: MigrationStatus[] = ['todo', 'in-review', 'done'];

/**
 * FR6 — the visitor's status and priority edits. Every write goes through the
 * cookie (ADR 0001); there is no server-side store for these, so a second
 * serverless instance sees exactly what the first one wrote.
 *
 * The caller sends the row's *complete* intended state rather than a delta.
 * Writing the cookie is read-modify-write, and a delta applied on top of a
 * cookie that a still-in-flight write has not updated yet would silently drop
 * the earlier change — flag a row as priority right after changing its status
 * and the status would spring back.
 */
export async function setRow(
  id: string,
  status: MigrationStatus,
  priority: boolean,
): Promise<void> {
  if (!getPageById(id) || !VALID.includes(status)) return;
  const state = await readMigrationState();
  await writeMigrationState({ ...state, [id]: { status, priority } });
  revalidatePath('/');
}

export async function resetMigrationState(): Promise<void> {
  await writeMigrationState({});
  revalidatePath('/');
}

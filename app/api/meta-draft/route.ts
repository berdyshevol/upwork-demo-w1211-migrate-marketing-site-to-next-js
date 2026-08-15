import { NextResponse } from 'next/server';
import { getPageById, sampleMetaDescription } from '@/lib/content';
import { metaDraftPrompt } from '@/lib/llm';

/**
 * FR8 — the keyless half of the meta-description drafter.
 *
 * This route holds no credential. BYOK stays the fast path: with a key the call
 * runs browser -> provider and bills the visitor. Without one the button used to
 * return seeded sample copy, which reads as AI to nobody — so it now asks the
 * author's shared endpoint first, and keeps the sample only as the answer of
 * last resort.
 *
 * DEMO_LLM_URL is injected by the build pipeline and points at a gateway that
 * adds its own token and rate-limits the traffic. Unset — someone cloned this
 * repo and deployed it themselves — means the sample answers, exactly as
 * before, which is also how the tests run.
 */
const POLL_INTERVAL_MS = 2_000;
const GIVE_UP_AFTER_MS = 170_000;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function askSharedGateway(prompt: string): Promise<string | null> {
  const base = process.env.DEMO_LLM_URL;
  if (!base) return null;

  const created = await fetch(base, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ prompt, profile: 'simple' }),
  });
  // Rate-limited or refused: the caller still gets usable copy below.
  if (!created.ok) return null;

  const { id } = (await created.json()) as { id: number | string };
  const startedAt = Date.now();
  for (;;) {
    if (Date.now() - startedAt > GIVE_UP_AFTER_MS) return null;
    await sleep(POLL_INTERVAL_MS);
    const res = await fetch(`${base}/${id}`);
    if (!res.ok) return null;
    const job = (await res.json()) as { status: string; response?: string };
    if (job.status === 'running') continue;
    if (job.status === 'done' && job.response?.trim()) return job.response.trim();
    return null;
  }
}
export async function POST(request: Request) {
  let id = '';
  try {
    const body = (await request.json()) as { id?: unknown };
    if (typeof body.id === 'string') id = body.id;
  } catch {
    // fall through to the 400 below
  }

  const page = getPageById(id);
  if (!page) {
    return NextResponse.json({ error: 'Unknown page id' }, { status: 400 });
  }

  try {
    // Same prompt shape the BYOK path builds in the console: the two differ in
    // who pays and how long it takes, not in what is asked.
    const shared = await askSharedGateway(
      metaDraftPrompt({
        title: page.title,
        template: page.template,
        legacyPath: page.legacyPath,
        seedDescription: sampleMetaDescription(page),
      }),
    );
    if (shared) {
      return NextResponse.json({ id: page.id, source: 'shared', description: shared });
    }
  } catch {
    // Never an error state: fall through to the copy that always exists.
  }

  return NextResponse.json({
    id: page.id,
    source: 'sample',
    description: sampleMetaDescription(page),
  });
}

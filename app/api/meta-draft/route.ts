import { NextResponse } from 'next/server';
import { getPageById, sampleMetaDescription } from '@/lib/content';

/**
 * FR8 — the seeded fallback half of the meta-description drafter.
 *
 * This route holds no credentials and calls no provider: BYOK means the live
 * model call runs browser -> provider with the visitor's own key, so the demo
 * can never bill anyone but the person using it. What is left for the server is
 * the guarantee that the button always returns usable copy — when there is no
 * key, or the visitor's provider call failed.
 */
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

  return NextResponse.json({
    id: page.id,
    source: 'sample',
    description: sampleMetaDescription(page),
  });
}

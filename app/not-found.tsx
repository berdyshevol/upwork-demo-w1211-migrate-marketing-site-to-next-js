import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-24">
      <div data-testid="not-found" className="card p-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-beam-400">404</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-white">
          That page is not in the migration inventory
        </h1>
        <p className="mt-4 text-base leading-relaxed text-slate-400">
          The migration keeps a seeded redirect map of every legacy edit.site URL and a route for
          each of the 44 pages in the inventory. This address is in neither, so nothing 308s here
          and there is no page to render.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/"
            className="inline-flex items-center rounded-md bg-beam-500 px-4 py-2 text-sm font-semibold
              text-ink-950 transition hover:bg-beam-400"
          >
            Open the migration console
          </Link>
          <Link
            href="/site/home"
            className="inline-flex items-center rounded-md border border-ink-600 px-4 py-2 text-sm
              font-medium text-slate-200 transition hover:border-beam-400 hover:text-white"
          >
            Go to the migrated home page
          </Link>
        </div>
      </div>
    </div>
  );
}

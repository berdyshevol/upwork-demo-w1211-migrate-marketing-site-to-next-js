import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { SectionRenderer } from '@/components/sections';
import { SeoPreview } from '@/components/SeoPreview';
import { getPage, isMigrated, pages, siteUrl, STATUS_LABELS } from '@/lib/content';

interface Params {
  params: Promise<{ slug: string }>;
}

/** FR2 — all 44 routes are known at build time, so each one is statically rendered. */
export function generateStaticParams() {
  return pages.map((page) => ({ slug: page.newSlug }));
}

/**
 * FR4 — metadata comes off the page record, not out of a per-page template.
 * A page cannot ship carrying the previous page's title.
 */
export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const page = getPage(slug);
  if (!page) return { title: 'Page not found | CrossBeamIP' };

  const canonical = `/site/${page.newSlug}`;

  return {
    title: page.seo.title,
    description: page.seo.description,
    alternates: { canonical },
    openGraph: {
      type: 'website',
      siteName: 'CrossBeamIP',
      url: canonical,
      title: page.seo.title,
      description: page.seo.description,
      images: [{ url: page.seo.ogImage, width: 1200, height: 630, alt: page.title }],
    },
    twitter: {
      card: 'summary_large_image',
      title: page.seo.title,
      description: page.seo.description,
      images: [page.seo.ogImage],
    },
  };
}

function ReservedRoute({
  title,
  template,
  wordCount,
  status,
  legacyPath,
}: {
  title: string;
  template: string;
  wordCount: number;
  status: string;
  legacyPath: string;
}) {
  return (
    <section
      data-testid="reserved-route"
      className="border-b border-ink-700 bg-gradient-to-b from-ink-900 to-ink-950"
    >
      <div className="mx-auto max-w-6xl px-5 py-16">
        <p className="text-xs font-semibold uppercase tracking-widest text-amber-400">
          Body not migrated yet
        </p>
        <h1 className="mt-3 max-w-3xl text-4xl font-bold leading-tight tracking-tight text-white">
          {title}
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-slate-300">
          The route and its metadata exist so the legacy URL keeps resolving, but this page&apos;s
          section content has not been modelled yet. It is one of the 39 pages still queued in the
          migration console.
        </p>

        <dl className="mt-10 grid max-w-3xl grid-cols-2 gap-6 sm:grid-cols-4">
          <div className="border-l-2 border-amber-400/60 pl-4">
            <dt className="text-xs text-slate-500">Template</dt>
            <dd className="mt-1 text-sm font-medium text-slate-200">{template}</dd>
          </div>
          <div className="border-l-2 border-amber-400/60 pl-4">
            <dt className="text-xs text-slate-500">Status</dt>
            <dd className="mt-1 text-sm font-medium text-slate-200">{status}</dd>
          </div>
          <div className="border-l-2 border-amber-400/60 pl-4">
            <dt className="text-xs text-slate-500">Words to move</dt>
            <dd className="mt-1 text-sm font-medium text-slate-200">{wordCount}</dd>
          </div>
          <div className="border-l-2 border-amber-400/60 pl-4">
            <dt className="text-xs text-slate-500">Legacy URL</dt>
            <dd className="mt-1 break-all font-mono text-xs text-slate-300">{legacyPath}</dd>
          </div>
        </dl>

        <div className="mt-9">
          <Link
            href="/"
            className="inline-flex items-center rounded-md bg-beam-500 px-4 py-2 text-sm font-semibold
              text-ink-950 transition hover:bg-beam-400"
          >
            Back to the migration console
          </Link>
        </div>
      </div>
    </section>
  );
}

export default async function SitePage({ params }: Params) {
  const { slug } = await params;
  const page = getPage(slug);

  // FR10 — anything not in the inventory is a genuine 404, not an error page.
  if (!page) notFound();

  const canonical = `${siteUrl()}/site/${page.newSlug}`;

  return (
    <>
      {isMigrated(page) ? (
        page.sections!.map((section, i) => (
          <SectionRenderer key={`${section.type}-${i}`} section={section} />
        ))
      ) : (
        <ReservedRoute
          title={page.title}
          template={page.template}
          wordCount={page.wordCount}
          status={STATUS_LABELS[page.defaultStatus]}
          legacyPath={page.legacyPath}
        />
      )}

      <div className="pt-12">
        <SeoPreview
          title={page.seo.title}
          description={page.seo.description}
          canonical={canonical}
          ogImage={page.seo.ogImage}
          legacyPath={page.legacyPath}
          slug={page.newSlug}
        />
      </div>
    </>
  );
}

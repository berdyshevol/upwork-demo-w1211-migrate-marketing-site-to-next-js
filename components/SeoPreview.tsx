'use client';

import { useState } from 'react';

/**
 * FR4 — the same values `generateMetadata` emitted into <head>, rendered so a
 * reviewer can check them without opening view-source.
 */
export interface SeoPreviewProps {
  title: string;
  description: string;
  canonical: string;
  ogImage: string;
  legacyPath: string;
  slug: string;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-1 gap-1 border-t border-ink-700 py-2.5 sm:grid-cols-[9rem_1fr] sm:gap-3">
      <dt className="font-mono text-[11px] uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="break-words text-sm text-slate-200">{value}</dd>
    </div>
  );
}

export function SeoPreview(props: SeoPreviewProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mx-auto max-w-6xl px-5 pb-16">
      <div className="card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-100">SEO preview</h2>
            <p className="mt-1 text-xs text-slate-400">
              Generated per page by <code className="text-beam-400">generateMetadata</code> from
              the same content record that rendered the sections above.
            </p>
          </div>
          <button
            type="button"
            data-testid="seo-preview-toggle"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="rounded-md border border-ink-600 px-3 py-1.5 text-xs font-medium text-slate-200
              transition hover:border-beam-400 hover:text-white"
          >
            {open ? 'Hide metadata' : 'Show metadata'}
          </button>
        </div>

        {open ? (
          <div data-testid="seo-preview" className="mt-5">
            <div className="rounded-lg border border-ink-600 bg-ink-950/70 p-4">
              <p className="text-[11px] text-slate-500">{props.canonical}</p>
              <p className="mt-1 text-base font-medium text-beam-400">{props.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-slate-400">{props.description}</p>
            </div>

            <dl className="mt-4">
              <Row label="title" value={props.title} />
              <Row label="description" value={props.description} />
              <Row label="canonical" value={props.canonical} />
              <Row label="og:title" value={props.title} />
              <Row label="og:description" value={props.description} />
              <Row label="og:image" value={props.ogImage} />
              <Row label="308 from" value={props.legacyPath} />
            </dl>

            <p className="mt-3 text-xs text-slate-500">
              Description length: {props.description.length} characters.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

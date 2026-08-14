import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';
import { siteUrl } from '@/lib/content';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: 'CrossBeamIP migration console',
    template: '%s',
  },
  description:
    'A 44-page edit.site marketing site migrated to Next.js App Router as one content model, with a live migration console.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <div className="flex min-h-screen flex-col">
          <header
            data-testid="site-header"
            className="border-b border-ink-700 bg-ink-900/80 backdrop-blur"
          >
            <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3">
              <Link href="/" className="flex items-center gap-2.5">
                <span
                  aria-hidden
                  className="grid h-7 w-7 place-items-center rounded-md bg-beam-500 text-[13px] font-bold text-ink-950"
                >
                  X
                </span>
                <span className="text-sm font-semibold tracking-tight text-slate-100">
                  CrossBeamIP
                </span>
              </Link>
              <nav className="flex items-center gap-1 text-sm">
                <Link
                  href="/"
                  className="rounded-md px-2.5 py-1.5 text-slate-300 hover:bg-ink-700 hover:text-white"
                >
                  Migration console
                </Link>
                <Link
                  href="/site/product"
                  className="rounded-md px-2.5 py-1.5 text-slate-300 hover:bg-ink-700 hover:text-white"
                >
                  Product
                </Link>
                <Link
                  href="/site/pricing"
                  className="rounded-md px-2.5 py-1.5 text-slate-300 hover:bg-ink-700 hover:text-white"
                >
                  Pricing
                </Link>
                <Link
                  href="/settings"
                  className="rounded-md px-2.5 py-1.5 text-slate-300 hover:bg-ink-700 hover:text-white"
                >
                  Settings
                </Link>
              </nav>
            </div>
          </header>

          <main className="flex-1">{children}</main>

          <footer
            data-testid="site-footer"
            className="border-t border-ink-700 bg-ink-900/60"
          >
            <div className="mx-auto max-w-6xl px-5 py-6 text-xs leading-relaxed text-slate-400">
              <p className="font-medium text-slate-300">
                CrossBeamIP — IP portfolio operations
              </p>
              <p className="mt-1 max-w-3xl">
                Migration slice demo. All 44 pages come from one seeded content model; the five
                fully migrated pages are composed from three shared section components, and every
                legacy edit.site URL answers a 308 to its new route.
              </p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}

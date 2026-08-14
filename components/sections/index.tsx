import Link from 'next/link';
import type { CtaSection, FeaturesSection, HeroSection, Section } from '@/lib/types';

/**
 * FR3 — three reusable, data-driven section components. Nothing here knows
 * which page it is on; the page record picks the component by `type`. These
 * three cover all 44 pages in the inventory, which is the whole argument for
 * migrating to a content model rather than hand-copying 44 layouts.
 */

function PrimaryLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center rounded-md bg-beam-500 px-4 py-2 text-sm font-semibold
        text-ink-950 transition hover:bg-beam-400"
    >
      {label}
    </Link>
  );
}

function SecondaryLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center rounded-md border border-ink-600 px-4 py-2 text-sm
        font-medium text-slate-200 transition hover:border-beam-400 hover:text-white"
    >
      {label}
    </Link>
  );
}

export function Hero({ section }: { section: HeroSection }) {
  return (
    <section
      data-section="hero"
      className="border-b border-ink-700 bg-gradient-to-b from-ink-900 to-ink-950"
    >
      <div className="mx-auto max-w-6xl px-5 py-16">
        <p className="text-xs font-semibold uppercase tracking-widest text-beam-400">
          {section.eyebrow}
        </p>
        <h1 className="mt-3 max-w-3xl text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl">
          {section.heading}
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-slate-300">{section.body}</p>

        <div className="mt-8 flex flex-wrap gap-3">
          <PrimaryLink {...section.primaryCta} />
          {section.secondaryCta ? <SecondaryLink {...section.secondaryCta} /> : null}
        </div>

        {section.stats?.length ? (
          <dl className="mt-12 grid max-w-3xl grid-cols-1 gap-6 sm:grid-cols-3">
            {section.stats.map((stat) => (
              <div key={stat.label} className="border-l-2 border-beam-500/60 pl-4">
                <dt className="text-2xl font-semibold text-white">{stat.value}</dt>
                <dd className="mt-1 text-sm text-slate-400">{stat.label}</dd>
              </div>
            ))}
          </dl>
        ) : null}
      </div>
    </section>
  );
}

export function Features({ section }: { section: FeaturesSection }) {
  return (
    <section data-section="features" className="border-b border-ink-700">
      <div className="mx-auto max-w-6xl px-5 py-16">
        <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
          {section.heading}
        </h2>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-slate-400">{section.intro}</p>

        <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2">
          {section.items.map((item) => (
            <div key={item.title} className="card p-5">
              <h3 className="text-base font-semibold text-slate-100">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{item.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Cta({ section }: { section: CtaSection }) {
  return (
    <section data-section="cta">
      <div className="mx-auto max-w-6xl px-5 py-16">
        <div className="card bg-ink-800/70 p-8 sm:p-10">
          <h2 className="max-w-2xl text-2xl font-bold tracking-tight text-white sm:text-3xl">
            {section.heading}
          </h2>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-slate-300">{section.body}</p>
          <div className="mt-7">
            <PrimaryLink {...section.cta} />
          </div>
          {section.footnote ? (
            <p className="mt-4 text-xs text-slate-500">{section.footnote}</p>
          ) : null}
        </div>
      </div>
    </section>
  );
}

/** The data-driven switch: a page is a list of sections, nothing more. */
export function SectionRenderer({ section }: { section: Section }) {
  switch (section.type) {
    case 'hero':
      return <Hero section={section} />;
    case 'features':
      return <Features section={section} />;
    case 'cta':
      return <Cta section={section} />;
    default:
      return null;
  }
}

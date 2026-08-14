export type MigrationStatus = 'todo' | 'in-review' | 'done';

export type SectionType = 'hero' | 'features' | 'cta';

export interface CtaLink {
  label: string;
  href: string;
}

export interface HeroSection {
  type: 'hero';
  eyebrow: string;
  heading: string;
  body: string;
  primaryCta: CtaLink;
  secondaryCta?: CtaLink;
  stats?: { value: string; label: string }[];
}

export interface FeaturesSection {
  type: 'features';
  heading: string;
  intro: string;
  items: { title: string; body: string }[];
}

export interface CtaSection {
  type: 'cta';
  heading: string;
  body: string;
  cta: CtaLink;
  footnote?: string;
}

export type Section = HeroSection | FeaturesSection | CtaSection;

export interface PageSeo {
  title: string;
  description: string;
  ogImage: string;
}

export interface PageRecord {
  id: string;
  legacyPath: string;
  newSlug: string;
  title: string;
  template: string;
  wordCount: number;
  defaultStatus: MigrationStatus;
  seo: PageSeo;
  sections?: Section[];
}

/** What the visitor has changed, per page id. Lives in a cookie, never on the server. */
export interface RowState {
  status: MigrationStatus;
  priority: boolean;
}

export type MigrationState = Record<string, Partial<RowState>>;

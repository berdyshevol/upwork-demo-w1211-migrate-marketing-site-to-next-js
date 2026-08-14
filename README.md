# CrossBeamIP Migration Slice

A working slice of a 44-page edit.site marketing site migrated to Next.js App
Router — built as a **content-driven system**, not 44 hand-copied pages.

## What it demonstrates

The argument this demo makes is that the migration is a data-modelling job, and
that the same three components which render five pages today will render the
other thirty-nine.

| | |
|---|---|
| **One content model** | All 44 pages come from `data/pages.json`. There is no per-page layout code anywhere in the repo. |
| **Three section components** | `hero`, `features` and `cta` (`components/sections/index.tsx`). A page is a list of sections; the renderer switches on `type` and nothing else. |
| **5 pages fully migrated** | `/site/home`, `/site/product`, `/site/pricing`, `/site/solutions-portfolio-analytics`, `/site/blog-why-we-left-edit-site` — statically rendered via `generateStaticParams`. |
| **39 routes reserved** | The remaining slugs render an explicit "body not migrated yet" panel with their template, status and word count. Their legacy URLs keep resolving instead of dying during the migration. |
| **Per-page SEO** | `generateMetadata` emits title, description, canonical, Open Graph and Twitter tags off the page record. Each page carries an SEO preview card showing exactly what went into `<head>`. |
| **Real 308 redirects** | 48 seeded legacy paths (44 canonical plus 4 aliases) are 308'd at the edge from `next.config.ts`, before any route matching. An *unmapped* `/legacy/...` path 404s rather than silently swallowing a missing map entry. |
| **Migration console** | `/` — searchable, filterable inventory of all 44 pages with per-row status and priority editing, and a progress summary that recalculates as you go. |
| **AI meta-description drafting** | Bring-your-own-key. Falls back to clearly labelled seeded sample copy when there is no key or the provider call fails. |

## Routes

| Route | Purpose |
|---|---|
| `/` | Migration console: inventory, search, filters, status/priority editing, progress |
| `/site/[slug]` | Migrated marketing page + SEO preview card (44 slugs, 5 with full bodies) |
| `/legacy/*` | 308 to the mapped new route; 404 if the path is not in the redirect map |
| `/settings` | BYOK: provider, API key, model |
| `/api/meta-draft` | Seeded fallback meta descriptions (holds no credentials) |

## State: where things live, and why

- **Statuses and priority flags** live in one `cbip-migration-state` cookie on
  the visitor's own browser, written by a server action. Nothing the visitor
  changes is held in server memory: a deployed demo runs on several serverless
  instances that share none, so a module-level store would confirm a change and
  then lose it on the next request. Each visitor gets their own sandbox, and
  clearing the cookie resets to the seeded defaults.
- **Search term and status filter** live in the URL query string, so a filtered
  view is shareable — copy the URL into a new tab and you get the same table.
- **The 44 page records** are read-only seed data and stay in code.

## AI features — bring your own key

The only AI feature is the meta-description drafter in the console. It is
**off by default and the rest of the app works fully without it.**

- Open `/settings`, choose **Anthropic**, **OpenAI** or **Google**, paste your
  own key, pick a model, save.
- The key is stored as one JSON blob under `localStorage.byok` on your device.
  It is sent only to your chosen provider, **by your own browser**, through the
  Vercel AI SDK. This app's server never receives it, never logs it, and no
  key is bundled or read from the environment — the demo cannot bill anyone but
  the person using it.
- With no key, "Draft meta description" returns seeded sample copy labelled
  `Sample copy — seeded fallback, not AI generated`. The same happens if your
  provider call fails, so the button never shows an error or a blank panel.

## Run it locally

```bash
pnpm install
pnpm dev            # http://localhost:3000
```

Production build:

```bash
pnpm build
pnpm start
```

## Tests

21 Playwright acceptance tests, one per acceptance criterion plus edge cases
(unknown slug, unmapped legacy path, provider failure, BYOK gate). They drive
real UI and never need a provider key — the BYOK happy path is covered by a
`mock` provider that returns deterministic output offline.

```bash
pnpm exec playwright install chromium   # once
pnpm test
```

The dev server for tests defaults to port 3000; set `PORT` if something else
already holds it (`PORT=3101 pnpm test`).

## Out of scope

The remaining 39 page bodies, real CrossBeamIP copy and brand assets, CMS or
authoring UI, forms and analytics, auth, and any multi-user collaboration on
statuses — statuses are per-visitor by design, since there is no database here.

import { test, expect } from '@playwright/test';

/**
 * AC: "Visiting any of the 5 migrated slugs renders a complete marketing page
 * built from shared section components, and viewing source shows correct
 * <title>, description, canonical, and OG tags." (FR2, FR3, FR4)
 *
 * AC: "Hitting a seeded legacy path such as /legacy/pricing.html lands on the
 * new route via a 308 redirect." (FR5)
 */

const MIGRATED = [
  'home',
  'product',
  'pricing',
  'solutions-portfolio-analytics',
  'blog-why-we-left-edit-site',
];

test('AC2 — all 5 migrated slugs render from the 3 shared section components', async ({ page }) => {
  for (const slug of MIGRATED) {
    await page.goto(`/site/${slug}`);

    await expect(page.locator('[data-section="hero"]')).toBeVisible();
    await expect(page.locator('[data-section="features"]')).toBeVisible();
    await expect(page.locator('[data-section="cta"]')).toBeVisible();

    // The one page shell wraps every migrated page.
    await expect(page.getByTestId('site-header')).toBeVisible();
    await expect(page.getByTestId('site-footer')).toBeVisible();
  }
});

test('AC2 — the pricing page renders real section content, not a stub', async ({ page }) => {
  await page.goto('/site/pricing');

  await expect(
    page.getByRole('heading', { name: 'Priced per family, not per seat' }),
  ).toBeVisible();
  await expect(page.locator('[data-section="features"]')).toContainText(
    'Portfolio — $18 per family / year',
  );
  await expect(page.locator('[data-section="cta"]')).toContainText(
    'Work out your number in about a minute',
  );
});

test('AC2 — generateMetadata emits title, description, canonical and OG tags', async ({ page }) => {
  await page.goto('/site/pricing');

  await expect(page).toHaveTitle('Pricing — per family, per year, no seat tax | CrossBeamIP');

  const description = await page
    .locator('meta[name="description"]')
    .getAttribute('content');
  expect(description).toContain('priced per IP family under management');

  const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
  expect(canonical).toContain('/site/pricing');

  const ogTitle = await page
    .locator('meta[property="og:title"]')
    .getAttribute('content');
  expect(ogTitle).toContain('Pricing');

  const ogImage = await page
    .locator('meta[property="og:image"]')
    .getAttribute('content');
  expect(ogImage).toBeTruthy();
});

test('AC2 — the SEO preview card shows the same metadata the page emitted', async ({ page }) => {
  await page.goto('/site/pricing');

  await page.getByTestId('seo-preview-toggle').click();
  const card = page.getByTestId('seo-preview');

  await expect(card).toBeVisible();
  await expect(card).toContainText('Pricing — per family, per year, no seat tax | CrossBeamIP');
  await expect(card).toContainText('priced per IP family under management');
  await expect(card).toContainText('/site/pricing');
  await expect(card).toContainText('og:image');
});

test('AC3 — a seeded legacy path answers 308 and lands on the new route', async ({
  request,
  page,
}) => {
  const response = await request.get('/legacy/pricing.html', { maxRedirects: 0 });
  expect(response.status()).toBe(308);
  expect(response.headers()['location']).toContain('/site/pricing');

  await page.goto('/legacy/pricing.html');
  await expect(page).toHaveURL(/\/site\/pricing$/);
  await expect(page.getByRole('heading', { name: 'Priced per family, not per seat' })).toBeVisible();
});

test('AC3 — nested and aliased legacy paths redirect too', async ({ request }) => {
  const nested = await request.get('/legacy/solutions/portfolio-analytics.html', {
    maxRedirects: 0,
  });
  expect(nested.status()).toBe(308);
  expect(nested.headers()['location']).toContain('/site/solutions-portfolio-analytics');

  const alias = await request.get('/legacy/plans.html', { maxRedirects: 0 });
  expect(alias.status()).toBe(308);
  expect(alias.headers()['location']).toContain('/site/pricing');
});

test('FR10 — an unknown slug renders the 404 page instead of erroring', async ({
  page,
  request,
}) => {
  const response = await request.get('/site/no-such-page');
  expect(response.status()).toBe(404);

  await page.goto('/site/no-such-page');
  await expect(page.getByTestId('not-found')).toBeVisible();
  await expect(page.getByTestId('not-found')).toContainText('not in the migration inventory');
});

test('FR5 edge — an unmapped legacy path 404s rather than redirecting nowhere', async ({
  page,
}) => {
  await page.goto('/legacy/never-existed.html');
  await expect(page.getByTestId('not-found')).toBeVisible();
});

test('FR2 — a route reserved for an unmigrated page is honest about its state', async ({
  page,
}) => {
  await page.goto('/site/legal-privacy');

  await expect(page.getByTestId('reserved-route')).toBeVisible();
  await expect(page.getByTestId('reserved-route')).toContainText('Body not migrated yet');
  await expect(page.getByTestId('site-header')).toBeVisible();
});

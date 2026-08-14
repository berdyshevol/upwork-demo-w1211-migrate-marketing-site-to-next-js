import { test, expect } from '@playwright/test';

/**
 * AC: "Opening / lists all 44 pages and filtering/searching updates both the
 * table and the URL, which can be copied into a new tab and reproduces the
 * same view." (FR1, FR7)
 *
 * AC: "Changing row statuses updates the 'X of 44 done' summary immediately and
 * the changes survive a full page reload." (FR6, FR9)
 */

test('AC1 — the console lists all 44 inventory pages with a 5 of 44 done summary', async ({
  page,
}) => {
  await page.goto('/');

  await expect(page.getByTestId('inventory-row')).toHaveCount(44);
  await expect(page.getByTestId('progress-summary')).toContainText('5 of 44 done');

  // Every column the PRD names is present on a row.
  const pricingRow = page.getByTestId('inventory-row-pricing');
  await expect(pricingRow).toContainText('/legacy/pricing.html');
  await expect(pricingRow).toContainText('Pricing');
  await expect(pricingRow).toContainText('pricing');
  await expect(pricingRow).toContainText('534');
});

test('AC1 — searching narrows the table and writes the term into the URL', async ({ page }) => {
  await page.goto('/');

  await page.getByTestId('inventory-search').fill('solutions');

  await expect(page.getByTestId('inventory-row')).toHaveCount(6);
  await expect(page).toHaveURL(/[?&]q=solutions/);
  await expect(page.getByTestId('inventory-row-solutions-renewals-management')).toBeVisible();
  await expect(page.getByTestId('inventory-row-legal-privacy')).toHaveCount(0);
});

test('AC1 — a filtered URL copied into a new tab reproduces the same view', async ({
  page,
  context,
}) => {
  await page.goto('/');
  await page.getByTestId('inventory-search').fill('solutions');
  await page.getByTestId('status-filter').selectOption('done');

  await expect(page.getByTestId('inventory-row')).toHaveCount(1);
  await expect(page).toHaveURL(/status=done/);
  const shareable = page.url();

  const second = await context.newPage();
  await second.goto(shareable);

  await expect(second.getByTestId('inventory-search')).toHaveValue('solutions');
  await expect(second.getByTestId('status-filter')).toHaveValue('done');
  await expect(second.getByTestId('inventory-row')).toHaveCount(1);
  await expect(second.getByTestId('inventory-row-solutions-portfolio-analytics')).toBeVisible();
  await second.close();
});

test('AC4 — changing a row status updates the summary immediately and survives a reload', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.getByTestId('progress-summary')).toContainText('5 of 44 done');

  await page
    .getByTestId('row-status-solutions-licensing-workflow')
    .selectOption('done');

  await expect(page.getByTestId('progress-summary')).toContainText('6 of 44 done');

  await page.reload();

  await expect(page.getByTestId('row-status-solutions-licensing-workflow')).toHaveValue('done');
  await expect(page.getByTestId('progress-summary')).toContainText('6 of 44 done');
});

test('AC4 — an in-review status and a priority flag both survive a full reload', async ({
  page,
}) => {
  await page.goto('/');

  await page.getByTestId('row-status-blog-ip-data-hygiene').selectOption('in-review');
  await page.getByTestId('row-priority-blog-ip-data-hygiene').click();
  await expect(page.getByTestId('row-priority-blog-ip-data-hygiene')).toHaveAttribute(
    'aria-pressed',
    'true',
  );

  await page.reload();

  await expect(page.getByTestId('row-status-blog-ip-data-hygiene')).toHaveValue('in-review');
  await expect(page.getByTestId('row-priority-blog-ip-data-hygiene')).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  // Progress is unchanged — in-review is not done.
  await expect(page.getByTestId('progress-summary')).toContainText('5 of 44 done');
});

test('AC1 — a row links through to its migrated page', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('status-filter').selectOption('done');
  await expect(page.getByTestId('inventory-row')).toHaveCount(5);

  await page.getByTestId('row-link-pricing').click();

  await expect(page).toHaveURL(/\/site\/pricing$/);
  await expect(page.getByRole('heading', { name: 'Priced per family, not per seat' })).toBeVisible();
});

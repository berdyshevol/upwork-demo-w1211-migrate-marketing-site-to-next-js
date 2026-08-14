import { test, expect } from '@playwright/test';

/**
 * AC: "Clicking 'Draft meta description' always returns usable copy — a real AI
 * draft, or a clearly labeled sample — with no error state or blank panel." (FR8)
 *
 * Plus the BYOK gate: with no key the non-AI product works fully and the AI
 * feature explains itself; with a key the live path runs. Tests never need a
 * real provider key — they seed the `mock` provider.
 */

const MOCK_BYOK = JSON.stringify({ provider: 'mock', apiKey: 'test', model: 'mock' });

test('AC5 — with no key configured, Draft meta description returns labeled sample copy', async ({
  page,
}) => {
  await page.goto('/');

  await page.getByTestId('meta-draft-legal-privacy').click();

  const output = page.getByTestId('meta-draft-output-legal-privacy');
  await expect(output).toBeVisible();
  await expect(output).not.toBeEmpty();
  await expect(output).toContainText('CrossBeamIP');

  const source = page.getByTestId('meta-draft-source-legal-privacy');
  await expect(source).toContainText('sample', { ignoreCase: true });

  // No error state anywhere on the panel.
  await expect(page.getByTestId('meta-draft-error-legal-privacy')).toHaveCount(0);
});

test('BYOK gate — with no key the console shows the settings hint', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByTestId('byok-hint')).toBeVisible();
  await expect(page.getByTestId('byok-hint')).toContainText(
    'Choose a provider and paste your API key in Settings to enable live AI.',
  );

  // Everything non-AI still works with no key at all.
  await expect(page.getByTestId('inventory-row')).toHaveCount(44);
  await page.getByTestId('row-status-support-faq').selectOption('done');
  await expect(page.getByTestId('progress-summary')).toContainText('6 of 44 done');
});

test('BYOK happy path — with a key saved, the draft comes back as a live AI draft', async ({
  page,
}) => {
  await page.addInitScript((blob) => {
    window.localStorage.setItem('byok', blob as string);
  }, MOCK_BYOK);

  await page.goto('/');

  await expect(page.getByTestId('byok-hint')).toHaveCount(0);

  await page.getByTestId('meta-draft-resources-glossary').click();

  const output = page.getByTestId('meta-draft-output-resources-glossary');
  await expect(output).toBeVisible();
  await expect(output).toContainText('Resources — IP glossary');

  const source = page.getByTestId('meta-draft-source-resources-glossary');
  await expect(source).toContainText('AI draft', { ignoreCase: true });
  await expect(source).not.toContainText('sample', { ignoreCase: true });
});

test('Settings — saving a provider, key and model persists one JSON blob to localStorage', async ({
  page,
}) => {
  await page.goto('/settings');

  await page.getByTestId('byok-provider').selectOption('openai');
  await expect(page.getByTestId('byok-key')).toHaveAttribute('aria-label', 'OpenAI API key');
  await expect(page.getByTestId('byok-model')).toHaveValue('gpt-4o-mini');

  await page.getByTestId('byok-key').fill('sk-test-not-a-real-key');
  await page.getByTestId('byok-model').selectOption('gpt-4o');
  await page.getByTestId('byok-save').click();

  await expect(page.getByTestId('byok-saved')).toBeVisible();

  const stored = await page.evaluate(() => window.localStorage.getItem('byok'));
  expect(JSON.parse(stored as string)).toEqual({
    provider: 'openai',
    apiKey: 'sk-test-not-a-real-key',
    model: 'gpt-4o',
  });

  await page.getByTestId('byok-clear').click();
  await expect(page.getByTestId('byok-key')).toHaveValue('');
  const cleared = await page.evaluate(() => window.localStorage.getItem('byok'));
  expect(cleared).toBeNull();
});

test('Settings — the model list follows the selected provider', async ({ page }) => {
  await page.goto('/settings');

  await page.getByTestId('byok-provider').selectOption('anthropic');
  await expect(page.getByTestId('byok-model')).toHaveValue('claude-haiku-4-5');
  await expect(page.getByTestId('byok-model').locator('option')).toHaveCount(3);

  await page.getByTestId('byok-provider').selectOption('google');
  await expect(page.getByTestId('byok-model')).toHaveValue('gemini-2.0-flash');
  await expect(page.getByTestId('byok-model').locator('option')).toHaveCount(2);
  await expect(page.getByTestId('byok-key')).toHaveAttribute('aria-label', 'Google API key');
});

test('AC5 — a provider failure still returns usable labeled sample copy, never an error', async ({
  page,
}) => {
  await page.addInitScript(() => {
    window.localStorage.setItem(
      'byok',
      JSON.stringify({ provider: 'anthropic', apiKey: 'sk-ant-definitely-invalid', model: 'claude-haiku-4-5' }),
    );
  });

  // Force the upstream call to fail without touching a real provider.
  await page.route('**/api.anthropic.com/**', (route) => route.abort());

  await page.goto('/');
  await page.getByTestId('meta-draft-company-careers').click();

  const output = page.getByTestId('meta-draft-output-company-careers');
  await expect(output).toBeVisible();
  await expect(output).not.toBeEmpty();
  await expect(page.getByTestId('meta-draft-source-company-careers')).toContainText('sample', {
    ignoreCase: true,
  });
});

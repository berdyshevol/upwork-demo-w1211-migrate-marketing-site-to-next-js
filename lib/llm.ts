import { generateText } from 'ai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createOpenAI } from '@ai-sdk/openai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import type { ByokConfig } from './byok';

/**
 * Returns a model instance for the visitor's saved {provider, apiKey, model}.
 *
 * The call goes browser -> provider directly (`dangerouslyAllowBrowser`), so
 * this app's server never sees the key and never bills anyone but the visitor.
 * `mock` is the test provider: it never touches the network.
 */
/**
 * `dangerouslyAllowBrowser` is not in the provider settings types (the AI SDK
 * accepts it at runtime), so the shape is narrowed to what the factories declare.
 */
function browserSettings(apiKey: string, headers?: Record<string, string>) {
  return {
    apiKey,
    dangerouslyAllowBrowser: true,
    ...(headers ? { headers } : {}),
  } as unknown as { apiKey: string; headers?: Record<string, string> };
}

function modelFor(config: ByokConfig) {
  switch (config.provider) {
    case 'anthropic':
      // Anthropic requires this opt-in header for direct browser calls.
      return createAnthropic(
        browserSettings(config.apiKey, {
          'anthropic-dangerous-direct-browser-access': 'true',
        }),
      )(config.model);
    case 'openai':
      return createOpenAI(browserSettings(config.apiKey))(config.model);
    case 'google':
      return createGoogleGenerativeAI(browserSettings(config.apiKey))(config.model);
    default:
      throw new Error(`Unsupported provider: ${config.provider}`);
  }
}

function mockDraft(title: string): string {
  // Deterministic, offline, and obviously shaped like the real thing.
  return `${title} — what the page covers, who at an in-house IP team it is for, and the next step, in one line built for a search result.`;
}

export interface DraftPrompt {
  title: string;
  template: string;
  legacyPath: string;
  seedDescription: string;
}

export function metaDraftPrompt(page: DraftPrompt): string {
  return [
    'You are writing an SEO meta description for one page of the CrossBeamIP',
    'marketing site. CrossBeamIP is IP portfolio operations software for in-house',
    'intellectual property teams: docketing, annuity forecasting, prior-art notes',
    'and outside-counsel instructions on one family record.',
    '',
    `Page title: ${page.title}`,
    `Template type: ${page.template}`,
    `Legacy URL being migrated: ${page.legacyPath}`,
    `Existing description to improve on: ${page.seedDescription}`,
    '',
    'Write ONE meta description of 140-158 characters. Be concrete, no marketing',
    'filler, no quotation marks, no leading label. Return only the description.',
  ].join('\n');
}

/**
 * Runs the visitor's own model. Throws on any failure — the caller is
 * responsible for falling back to the seeded sample copy (FR8).
 */
export async function draftMetaDescription(
  config: ByokConfig,
  page: DraftPrompt,
): Promise<string> {
  if (config.provider === 'mock') return mockDraft(page.title);

  const { text } = await generateText({
    model: modelFor(config),
    prompt: metaDraftPrompt(page),
    maxRetries: 0,
  });

  const draft = text.trim();
  if (!draft) throw new Error('Provider returned an empty draft');
  return draft;
}

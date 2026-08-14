/**
 * BYOK — the visitor's own provider credentials, held only in their own
 * browser's localStorage under a single `byok` key. Nothing here is ever sent
 * to this app's server, logged, or persisted anywhere else.
 */
export type ProviderId = 'anthropic' | 'openai' | 'google' | 'mock';

export interface ByokConfig {
  provider: ProviderId;
  apiKey: string;
  model: string;
}

export const BYOK_STORAGE_KEY = 'byok';

export const BYOK_HINT =
  'Choose a provider and paste your API key in Settings to enable live AI.';

export const PROVIDERS: {
  id: Exclude<ProviderId, 'mock'>;
  label: string;
  keyLabel: string;
  models: string[];
}[] = [
  {
    id: 'anthropic',
    label: 'Anthropic',
    keyLabel: 'Anthropic API key',
    models: ['claude-haiku-4-5', 'claude-sonnet-4-6', 'claude-opus-4-7'],
  },
  {
    id: 'openai',
    label: 'OpenAI',
    keyLabel: 'OpenAI API key',
    models: ['gpt-4o-mini', 'gpt-4o', 'o1-mini'],
  },
  {
    id: 'google',
    label: 'Google',
    keyLabel: 'Google API key',
    models: ['gemini-2.0-flash', 'gemini-2.5-pro'],
  },
];

export function providerMeta(id: ProviderId) {
  return PROVIDERS.find((p) => p.id === id);
}

export function readByok(): ByokConfig | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(BYOK_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ByokConfig>;
    if (!parsed.provider || !parsed.apiKey || !parsed.model) return null;
    return parsed as ByokConfig;
  } catch {
    return null;
  }
}

export function saveByok(config: ByokConfig): void {
  window.localStorage.setItem(BYOK_STORAGE_KEY, JSON.stringify(config));
}

export function clearByok(): void {
  window.localStorage.removeItem(BYOK_STORAGE_KEY);
}

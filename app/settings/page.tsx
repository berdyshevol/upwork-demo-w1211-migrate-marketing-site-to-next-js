'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  PROVIDERS,
  clearByok,
  providerMeta,
  readByok,
  saveByok,
  type ProviderId,
} from '@/lib/byok';

type SelectableProvider = Exclude<ProviderId, 'mock'>;

const DEFAULT_PROVIDER: SelectableProvider = 'anthropic';

export default function SettingsPage() {
  const [provider, setProvider] = useState<SelectableProvider>(DEFAULT_PROVIDER);
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState(PROVIDERS[0].models[0]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const existing = readByok();
    if (!existing) return;
    const meta = providerMeta(existing.provider);
    if (!meta) return;
    setProvider(meta.id);
    setApiKey(existing.apiKey);
    setModel(meta.models.includes(existing.model) ? existing.model : meta.models[0]);
  }, []);

  const meta = providerMeta(provider)!;

  const onProviderChange = (next: SelectableProvider) => {
    setProvider(next);
    setModel(providerMeta(next)!.models[0]);
    setSaved(false);
  };

  const onSave = () => {
    saveByok({ provider, apiKey, model });
    setSaved(true);
  };

  const onClear = () => {
    clearByok();
    setProvider(DEFAULT_PROVIDER);
    setModel(providerMeta(DEFAULT_PROVIDER)!.models[0]);
    setApiKey('');
    setSaved(false);
  };

  return (
    <div className="mx-auto max-w-3xl px-5 py-12">
      <p className="text-xs font-semibold uppercase tracking-widest text-beam-400">Settings</p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight text-white">
        Bring your own AI key
      </h1>
      <p className="mt-4 text-base leading-relaxed text-slate-400">
        The only AI feature in this demo is the meta-description drafter in the migration console.
        It runs on your key, from your browser, straight to your provider — this app&apos;s server
        never receives it and nobody else&apos;s account is billed. Leave this blank and the drafter
        returns clearly labelled sample copy instead.
      </p>

      <div className="card mt-8 p-6">
        <div className="grid gap-5">
          <label>
            <span className="mb-1.5 block text-xs font-medium text-slate-400">Provider</span>
            <select
              data-testid="byok-provider"
              value={provider}
              onChange={(e) => onProviderChange(e.target.value as SelectableProvider)}
              className="field w-full"
            >
              {PROVIDERS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="mb-1.5 block text-xs font-medium text-slate-400">
              {meta.keyLabel}
            </span>
            <input
              data-testid="byok-key"
              type="password"
              aria-label={meta.keyLabel}
              value={apiKey}
              placeholder={`Paste your ${meta.label} key`}
              onChange={(e) => {
                setApiKey(e.target.value);
                setSaved(false);
              }}
              className="field w-full font-mono"
            />
          </label>

          <label>
            <span className="mb-1.5 block text-xs font-medium text-slate-400">Model</span>
            <select
              data-testid="byok-model"
              value={model}
              onChange={(e) => {
                setModel(e.target.value);
                setSaved(false);
              }}
              className="field w-full"
            >
              {meta.models.map((m, i) => (
                <option key={m} value={m}>
                  {m}
                  {i === 0 ? ' (default)' : ''}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            type="button"
            data-testid="byok-save"
            onClick={onSave}
            className="rounded-md bg-beam-500 px-4 py-2 text-sm font-semibold text-ink-950
              transition hover:bg-beam-400"
          >
            Save key
          </button>
          <button
            type="button"
            data-testid="byok-clear"
            onClick={onClear}
            className="rounded-md border border-ink-600 px-4 py-2 text-sm font-medium text-slate-200
              transition hover:border-slate-500 hover:text-white"
          >
            Clear
          </button>
          {saved ? (
            <span data-testid="byok-saved" className="text-sm text-emerald-400">
              Saved to this browser only.
            </span>
          ) : null}
        </div>
      </div>

      <div className="card mt-6 p-6 text-sm leading-relaxed text-slate-400">
        <h2 className="text-sm font-semibold text-slate-200">Where the key goes</h2>
        <ul className="mt-3 list-disc space-y-1.5 pl-5">
          <li>
            Stored as one JSON blob under <code className="text-slate-300">localStorage.byok</code>{' '}
            on this device. Clear wipes it.
          </li>
          <li>
            Sent only to your chosen provider&apos;s API, by your own browser, via the Vercel AI SDK.
          </li>
          <li>Never sent to this app&apos;s server, never logged, never stored anywhere else.</li>
        </ul>
        <p className="mt-4">
          <Link href="/" className="font-medium text-beam-400 underline">
            Back to the migration console
          </Link>
        </p>
      </div>
    </div>
  );
}

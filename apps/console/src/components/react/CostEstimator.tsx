/**
 * CostEstimator.tsx — Monthly cost estimator.
 * - Slider: estimated tokens/month (10K - 10M)
 * - Slider: input/output ratio (default 70/30)
 * - Breakdown: input cost, output cost, total
 * - Currency toggle: USD / VND (1 USD = 25,000 VND)
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { MODELS, PROVIDER_LABELS, getModelById } from '../../lib/models';
import { getItem, setItem } from '../../lib/storage';

const SELECTED_KEY = 'nguyenai:selected-model';
const USD_TO_VND = 25_000;

const TOKEN_MIN = 10_000;
const TOKEN_MAX = 10_000_000;

function formatNumber(n: number): string {
  return n.toLocaleString('en-US');
}

function formatCurrency(amount: number, currency: 'USD' | 'VND'): string {
  if (currency === 'USD') {
    return `$${amount.toFixed(2)}`;
  }
  return `${Math.round(amount * USD_TO_VND).toLocaleString('en-US')} ₫`;
}

function formatTokens(tokens: number): string {
  if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(1)}M`;
  if (tokens >= 1_000) return `${Math.round(tokens / 1_000)}K`;
  return String(tokens);
}

export default function CostEstimator() {
  const [modelId, setModelId] = useState<string>('auto-route');
  const [tokens, setTokens] = useState<number>(500_000);
  const [inputRatio, setInputRatio] = useState<number>(70); // percent
  const [currency, setCurrency] = useState<'USD' | 'VND'>('USD');

  useEffect(() => {
    setModelId(getItem<string>(SELECTED_KEY, 'auto-route'));
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ model: string }>).detail;
      if (detail?.model) setModelId(detail.model);
    };
    window.addEventListener('command:submit', handler);
    return () => window.removeEventListener('command:submit', handler);
  }, []);

  const model = getModelById(modelId);

  const breakdown = useMemo(() => {
    if (!model) return null;
    const inputTokens = (tokens * inputRatio) / 100;
    const outputTokens = (tokens * (100 - inputRatio)) / 100;
    const inputCost = (inputTokens / 1_000_000) * model.inputCostPer1M;
    const outputCost = (outputTokens / 1_000_000) * model.outputCostPer1M;
    return { inputCost, outputCost, total: inputCost + outputCost };
  }, [model, tokens, inputRatio]);

  const handleModelChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const id = e.target.value;
      setModelId(id);
      setItem(SELECTED_KEY, id);
    },
    [],
  );

  return (
    <div className="console-card">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="console-section-title">Cost Estimator</h2>
          <p className="console-section-subtitle">
           Ước tính chi phí hàng tháng · Estimate monthly cost
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1 rounded-lg border border-slate-800 bg-bg-card p-1">
            {(['USD', 'VND'] as const).map((c) => (
              <button
                key={c}
                type="button"
                className={`rounded px-3 py-1 text-xs transition-colors ${
                  currency === c
                    ? 'bg-accent text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                onClick={() => setCurrency(c)}
                aria-label={`Switch to ${c} currency · Chuyển sang ${c}`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Inputs */}
        <div className="space-y-5">
          <div>
            <label className="console-label" htmlFor="model-est">
              Model · Mô hình
            </label>
            <select
              id="model-est"
              className="console-input"
              value={modelId}
              onChange={handleModelChange}
            >
              {MODELS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({PROVIDER_LABELS[m.provider]})
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-sm font-medium text-slate-300" htmlFor="tokens">
                Tokens / month · Token / tháng
              </label>
              <span className="text-xs text-slate-400">
                {formatTokens(tokens)} ({formatNumber(tokens)})
              </span>
            </div>
            <input
              id="tokens"
              type="range"
              min={TOKEN_MIN}
              max={TOKEN_MAX}
              step={10_000}
              value={tokens}
              onChange={(e) => setTokens(Number(e.target.value))}
              className="w-full accent-accent"
            />
            <div className="mt-1 flex justify-between text-xs text-slate-500">
              <span>10K</span>
              <span>10M</span>
            </div>
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-sm font-medium text-slate-300" htmlFor="ratio">
                Input / Output ratio · Tỷ lệ vào/ra
              </label>
              <span className="text-xs text-slate-400">
                {inputRatio}% / {100 - inputRatio}%
              </span>
            </div>
            <input
              id="ratio"
              type="range"
              min={0}
              max={100}
              step={5}
              value={inputRatio}
              onChange={(e) => setInputRatio(Number(e.target.value))}
              className="w-full accent-accent"
            />
            <div className="mt-1 flex justify-between text-xs text-slate-500">
              <span>0% input</span>
              <span>100% input</span>
            </div>
          </div>
        </div>

        {/* Breakdown */}
        <div className="rounded-lg border border-slate-800 bg-bg-card/50 p-5">
          <p className="text-xs text-slate-400">
            Estimated monthly cost · Chi phí ước tính/tháng
          </p>
          {model && (
            <p className="mt-1 text-xs text-slate-500">
              {model.name} — In ${model.inputCostPer1M}/1M · Out $
              {model.outputCostPer1M}/1M
            </p>
          )}
          {breakdown ? (
            <>
              <p className="mt-4 text-3xl font-bold text-slate-100">
                {formatCurrency(breakdown.total, currency)}
              </p>
              <dl className="mt-4 space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <dt className="text-slate-400">
                    Input cost · Chi phí đầu vào ({inputRatio}%)
                  </dt>
                  <dd className="text-slate-200">
                    {formatCurrency(breakdown.inputCost, currency)}
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-slate-400">
                    Output cost · Chi phí đầu ra ({100 - inputRatio}%)
                  </dt>
                  <dd className="text-slate-200">
                    {formatCurrency(breakdown.outputCost, currency)}
                  </dd>
                </div>
                <div className="mt-2 flex items-center justify-between border-t border-slate-800 pt-3">
                  <dt className="font-medium text-slate-300">
                    Total · Tổng cộng
                  </dt>
                  <dd className="font-semibold text-accent-muted">
                    {formatCurrency(breakdown.total, currency)}
                  </dd>
                </div>
              </dl>
              {currency === 'VND' && (
                <p className="mt-3 text-xs text-slate-500">
                  Tỷ giá · Rate: 1 USD = {USD_TO_VND.toLocaleString('en-US')} ₫
                </p>
              )}
            </>
          ) : (
            <p className="mt-4 text-slate-500">Select a model</p>
          )}
        </div>
      </div>
    </div>
  );
}

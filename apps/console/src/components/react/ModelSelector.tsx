/**
 * ModelSelector.tsx — Grid of model cards with selection + set-as-default.
 * - Selected model persisted in localStorage `nguyenai:selected-model`
 * - "Set as default" button
 */
import { useCallback, useEffect, useState } from 'react';
import { MODELS, PROVIDER_LABELS, formatContextWindow } from '../../lib/models';
import { getItem, setItem } from '../../lib/storage';
import type { ModelOption } from '../../types/command';

const SELECTED_KEY = 'nguyenai:selected-model';
const DEFAULT_KEY = 'nguyenai:default-model';

const CAPABILITY_COLORS: Record<string, string> = {
  reasoning: 'bg-blue-500/20 text-blue-300',
  vision: 'bg-purple-500/20 text-purple-300',
  code: 'bg-emerald-500/15 text-emerald-300',
  fast: 'bg-amber-500/15 text-amber-300',
  'long-context': 'bg-cyan-500/15 text-cyan-300',
  retrieval: 'bg-pink-500/15 text-pink-300',
  auto: 'bg-slate-500/15 text-slate-300',
  'cost-optimized': 'bg-teal-500/15 text-teal-300',
};

export default function ModelSelector() {
  const [selectedId, setSelectedId] = useState<string>('auto-route');
  const [defaultId, setDefaultId] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSelectedId(getItem<string>(SELECTED_KEY, 'auto-route'));
    setDefaultId(getItem<string | null>(DEFAULT_KEY, null));
  }, []);

  const handleSelect = useCallback((id: string) => {
    setSelectedId(id);
    setItem(SELECTED_KEY, id);
    setSaved(false);
  }, []);

  const handleSetDefault = useCallback(() => {
    setItem(DEFAULT_KEY, selectedId);
    setDefaultId(selectedId);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2000);
  }, [selectedId]);

  const selected = MODELS.find((m) => m.id === selectedId);

  return (
    <div className="mb-6">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="console-section-title">Các mô hình khả dụng</h2>
          <p className="console-section-subtitle">
            Chọn mô hình để sử dụng
          </p>
        </div>
        <div className="flex items-center gap-2">
          {defaultId && (
            <span className="text-xs text-slate-400">
              Mặc định:{' '}
              <span className="text-slate-200">
                {MODELS.find((m) => m.id === defaultId)?.name ?? defaultId}
              </span>
            </span>
          )}
          <button
            type="button"
            className="console-btn console-btn-primary text-xs"
            onClick={handleSetDefault}
            aria-label={saved ? "Đã lưu" : "Đặt mặc định"}
          >
            {saved ? 'Đã lưu ✓' : 'Đặt mặc định'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {MODELS.map((model: ModelOption) => {
          const isSelected = model.id === selectedId;
          const isDefault = model.id === defaultId;
          return (
            <button
              key={model.id}
              type="button"
              className={`console-card text-left transition-all ${
                isSelected
                  ? 'border-accent ring-1 ring-accent'
                  : 'hover:border-slate-700'
              }`}
              onClick={() => handleSelect(model.id)}
              aria-pressed={isSelected}
              aria-label={`Chọn mô hình ${model.name}`}
            >
              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  <h3 className="truncate font-semibold text-slate-100">
                    {model.name}
                  </h3>
                  <span className="mt-1 inline-block rounded bg-bg-hover px-2 py-0.5 text-xs text-slate-300">
                    {PROVIDER_LABELS[model.provider]}
                  </span>
                </div>
                {isDefault && (
                  <span className="shrink-0 rounded-full bg-accent/20 px-2 py-0.5 text-xs text-accent-muted">
                    Mặc định
                  </span>
                )}
              </div>

              <dl className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-500">
                <div>
                  <dt className="text-slate-500">Ngữ cảnh</dt>
                  <dd className="text-slate-300">
                    {formatContextWindow(model.contextWindow)}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">Vào / 1M</dt>
                  <dd className="text-slate-300">${model.inputCostPer1M}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Ra / 1M</dt>
                  <dd className="text-slate-300">${model.outputCostPer1M}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Trạng thái</dt>
                  <dd className="text-status-active">Khả dụng</dd>
                </div>
              </dl>

              <div className="mt-3 flex flex-wrap gap-1.5 border-t border-slate-800 pt-3">
                {model.capabilities.map((cap) => (
                  <span
                    key={cap}
                    className={`rounded px-2 py-0.5 text-xs ${
                      CAPABILITY_COLORS[cap] ?? 'bg-slate-700/40 text-slate-300'
                    }`}
                  >
                    {cap}
                  </span>
                ))}
              </div>
            </button>
          );
        })}
      </div>

      {selected && (
        <p className="mt-3 text-xs text-slate-400">
          Đã chọn:{' '}
          <span className="text-slate-200">{selected.name}</span> — Vào $
          {selected.inputCostPer1M}/1M · Ra ${selected.outputCostPer1M}/1M ·
          Ngữ cảnh {formatContextWindow(selected.contextWindow)}
        </p>
      )}
    </div>
  );
}

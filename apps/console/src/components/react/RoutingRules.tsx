/**
 * RoutingRules.tsx — Table of routing rules (condition → preferred model).
 * - Rules stored in localStorage `nguyenai:routing-rules`
 * - Add rule inline form (condition input + model dropdown)
 * - Delete rule per row
 */
import { useCallback, useEffect, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { MODELS, PROVIDER_LABELS } from '../../lib/models';
import { getItem, setItem } from '../../lib/storage';
import type { RoutingRule } from '../../types/command';

const RULES_KEY = 'nguyenai:routing-rules';

const DEFAULT_RULES: RoutingRule[] = [
  { id: 'rule-1', condition: 'Code generation', modelId: 'claude-3-5-sonnet' },
  { id: 'rule-2', condition: 'Fast response', modelId: 'gpt-4o-mini' },
  { id: 'rule-3', condition: 'Long context', modelId: 'gemini-1-5-pro' },
  { id: 'rule-4', condition: 'Cost-optimized', modelId: 'llama-3-1-8b' },
];

export default function RoutingRules() {
  const [rules, setRules] = useState<RoutingRule[]>([]);
  const [adding, setAdding] = useState(false);
  const [condition, setCondition] = useState('');
  const [modelId, setModelId] = useState<string>('auto-route');

  useEffect(() => {
    const stored = getItem<RoutingRule[]>(RULES_KEY, []);
    if (stored.length === 0) {
      setItem(RULES_KEY, DEFAULT_RULES);
      setRules(DEFAULT_RULES);
    } else {
      setRules(stored);
    }
  }, []);

  const persist = useCallback((next: RoutingRule[]) => {
    setRules(next);
    setItem(RULES_KEY, next);
  }, []);

  const handleAdd = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      const trimmed = condition.trim();
      if (!trimmed) return;
      const rule: RoutingRule = {
        id: `rule-${Date.now()}`,
        condition: trimmed,
        modelId,
      };
      persist([...rules, rule]);
      setCondition('');
      setModelId('auto-route');
      setAdding(false);
    },
    [condition, modelId, rules, persist],
  );

  const handleDelete = useCallback(
    (id: string) => {
      persist(rules.filter((r) => r.id !== id));
    },
    [rules, persist],
  );

  const modelName = (id: string) =>
    MODELS.find((m) => m.id === id)?.name ?? id;

  return (
    <div className="console-card">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="console-section-title">Routing Rules</h2>
          <p className="console-section-subtitle">
            Quy tắc định tuyến · Define how commands are routed to models
          </p>
        </div>
        {!adding && (
          <button
            type="button"
            className="console-btn console-btn-primary text-xs"
            onClick={() => setAdding(true)}
          >
            Add Rule · Thêm quy tắc
          </button>
        )}
      </div>

      {adding && (
        <form
          onSubmit={handleAdd}
          className="mb-4 rounded-lg border border-slate-700 bg-bg-card/60 p-4"
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_auto]">
            <div>
              <label className="console-label" htmlFor="rule-condition">
                Condition · Điều kiện
              </label>
              <input
                id="rule-condition"
                className="console-input"
                placeholder="e.g. Code generation"
                value={condition}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setCondition(e.target.value)
                }
                autoFocus
              />
            </div>
            <div>
              <label className="console-label" htmlFor="rule-model">
                Model · Mô hình
              </label>
              <select
                id="rule-model"
                className="console-input"
                value={modelId}
                onChange={(e) => setModelId(e.target.value)}
              >
                {MODELS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({PROVIDER_LABELS[m.provider]})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end gap-2">
              <button type="submit" className="console-btn console-btn-primary">
                Save · Lưu
              </button>
              <button
                type="button"
                className="console-btn console-btn-secondary"
                onClick={() => {
                  setAdding(false);
                  setCondition('');
                }}
              >
                Cancel · Hủy
              </button>
            </div>
          </div>
        </form>
      )}

      {rules.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-700 p-8 text-center">
          <p className="text-sm text-slate-400">No routing rules configured</p>
          <p className="mt-1 text-xs text-slate-500">
            Chưa có quy tắc định tuyến nào
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-xs text-slate-500">
                <th className="py-2 pr-4 font-medium">Condition · Điều kiện</th>
                <th className="py-2 pr-4 font-medium">Preferred Model · Mô hình</th>
                <th className="py-2 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {rules.map((rule) => (
                <tr
                  key={rule.id}
                  className="border-b border-slate-800/60 last:border-0"
                >
                  <td className="py-3 pr-4 text-slate-200">{rule.condition}</td>
                  <td className="py-3 pr-4">
                    <span className="rounded bg-bg-hover px-2 py-0.5 text-xs text-slate-300">
                      {modelName(rule.modelId)}
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <button
                      type="button"
                      className="text-xs text-slate-500 hover:text-red-400"
                      onClick={() => handleDelete(rule.id)}
                    >
                      Delete · Xóa
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

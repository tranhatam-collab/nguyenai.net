/**
 * CommandHistory.tsx — List of past commands with filters and re-run.
 * - Data from server API (POST /v1/memory with type=command)
 * - Filter by status (all/completed/failed/running)
 * - Click to re-run (dispatches `command:submit`)
 *
 * NOTE: Previously used localStorage (FORBIDDEN per IDENTITY_AND_TENANCY_RFC §2.4).
 * Now uses server-side API via /v1/memory.
 */
import { useCallback, useEffect, useState } from 'react';
import { fetchCommandHistory, clearCommandHistory, type CommandRecord } from '../../lib/api';
import { getModelById, PROVIDER_LABELS } from '../../lib/models';

type StatusFilter = 'all' | 'completed' | 'failed' | 'running';

const STATUS_STYLES: Record<CommandRecord['status'], { dot: string; label: string }> = {
  running: { dot: 'bg-status-idle animate-pulse', label: 'Running · Đang chạy' },
  completed: { dot: 'bg-status-active', label: 'Completed · Hoàn thành' },
  failed: { dot: 'bg-status-offline', label: 'Failed · Lỗi' },
  pending: { dot: 'bg-slate-500', label: 'Pending · Chờ' },
};

const FILTERS: { id: StatusFilter; label: string }[] = [
  { id: 'all', label: 'All · Tất cả' },
  { id: 'completed', label: 'Completed · Hoàn thành' },
  { id: 'failed', label: 'Failed · Lỗi' },
  { id: 'running', label: 'Running · Đang chạy' },
];

export default function CommandHistory() {
  const [history, setHistory] = useState<CommandRecord[]>([]);
  const [filter, setFilter] = useState<StatusFilter>('all');

  // Load from server API (replaces localStorage)
  const loadHistory = useCallback(async () => {
    const records = await fetchCommandHistory(50);
    setHistory(records);
  }, []);

  useEffect(() => {
    loadHistory();
    const onChange = () => loadHistory();
    window.addEventListener('command:history:updated', onChange);
    return () => {
      window.removeEventListener('command:history:updated', onChange);
    };
  }, [loadHistory]);

  const handleClear = useCallback(async () => {
    await clearCommandHistory();
    setHistory([]);
  }, []);

  const handleReRun = useCallback((cmd: CommandRecord) => {
    window.dispatchEvent(
      new CustomEvent('command:submit', {
        detail: { command: cmd.text, model: cmd.model },
      }),
    );
  }, []);

  const filtered =
    filter === 'all' ? history : history.filter((c) => c.status === filter);

  return (
    <div className="console-card">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="console-section-title">Run History</h2>
          <p className="console-section-subtitle">Lịch sử chạy lệnh</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex flex-wrap gap-1 rounded-lg border border-slate-800 bg-bg-card p-1">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                aria-label={`Filter by ${f.label}`}
                className={`rounded px-2.5 py-1 text-xs transition-colors ${
                  filter === f.id
                    ? 'bg-accent text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                onClick={() => setFilter(f.id)}
              >
                {f.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="console-btn console-btn-secondary text-xs"
            onClick={handleClear}
            disabled={history.length === 0}
            aria-label="Clear command history · Xóa lịch sử lệnh"
          >
            Clear History
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-700 p-8 text-center">
          <p className="text-sm text-slate-400">Chưa có lệnh nào.</p>
          <p className="mt-1 text-xs text-slate-500">No commands yet.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {filtered.map((cmd) => {
            const model = getModelById(cmd.model);
            const status = STATUS_STYLES[cmd.status];
            return (
              <li
                key={cmd.id}
                className="flex items-center gap-4 rounded-lg border border-slate-800 bg-bg-card/50 p-4 transition-colors hover:border-slate-700"
              >
                <span
                  className={`h-2 w-2 shrink-0 rounded-full ${status.dot}`}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-mono text-sm text-slate-300">
                    {cmd.text}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {model ? model.name : cmd.model} ·{' '}
                    {PROVIDER_LABELS[model?.provider ?? 'auto']} ·{' '}
                    {new Date(cmd.timestamp).toLocaleString()}
                  </p>
                  {cmd.result && (
                    <p className="mt-1 truncate text-xs text-slate-500">
                      → {cmd.result}
                    </p>
                  )}
                </div>
                <span className="hidden shrink-0 text-xs text-slate-400 sm:inline">
                  {status.label}
                </span>
                <button
                  type="button"
                  className="console-btn console-btn-secondary shrink-0 text-xs"
                  onClick={() => handleReRun(cmd)}
                  aria-label="Re-run command · Chạy lại lệnh"
                >
                  Re-run · Chạy lại
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

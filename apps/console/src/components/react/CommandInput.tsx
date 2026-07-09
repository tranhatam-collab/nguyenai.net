/**
 * CommandInput.tsx — Natural language command input island.
 * - Large textarea + Run button with loading state
 * - Model selector dropdown with cost estimate
 * - Command history dropdown (last 10 from localStorage)
 * - Cmd/Ctrl+Enter to run
 * - Calls POST /v1/command (real API) and dispatches `command:submit` event
 * - Handles approval_required state (pauses, shows approval prompt)
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ChangeEvent, KeyboardEvent } from 'react';
import { MODELS, PROVIDER_LABELS, getModelById } from '../../lib/models';
import { getItem, setItem } from '../../lib/storage';
import { api, ApiError, type CommandResponse } from '../../lib/api';
import type { Command } from '../../types/command';

const HISTORY_KEY = 'nguyenai:command-history';
const MAX_HISTORY = 10;

interface SubmitDetail {
  response?: CommandResponse;
  error?: string;
}

interface SubmitEventPayload extends SubmitDetail {
  command: string;
  model: string;
}

export default function CommandInput() {
  const [text, setText] = useState('');
  const [modelId, setModelId] = useState<string>('auto-route');
  const [running, setRunning] = useState(false);
  const [history, setHistory] = useState<Command[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [lastResponse, setLastResponse] = useState<CommandResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load command history on mount
  useEffect(() => {
    const stored = getItem<Command[]>(HISTORY_KEY, []);
    setHistory(stored);
  }, []);

  const selectedModel = useMemo(() => getModelById(modelId), [modelId]);

  const costEstimate = useMemo(() => {
    if (!selectedModel) return null;
    // Rough estimate: ~1.5K input + ~500 output tokens per command
    const inputTokens = 1500;
    const outputTokens = 500;
    const inputCost = (inputTokens / 1_000_000) * selectedModel.inputCostPer1M;
    const outputCost = (outputTokens / 1_000_000) * selectedModel.outputCostPer1M;
    return {
      inputCost,
      outputCost,
      total: inputCost + outputCost,
    };
  }, [selectedModel]);

  const persistHistory = useCallback((next: Command[]) => {
    setHistory(next);
    setItem(HISTORY_KEY, next);
    window.dispatchEvent(new CustomEvent('command:history:updated'));
  }, []);

  const dispatchSubmit = useCallback((command: string, model: string, detail?: SubmitDetail) => {
    window.dispatchEvent(
      new CustomEvent<SubmitEventPayload>('command:submit', {
        detail: { command, model, ...detail },
      }),
    );
  }, []);

  const handleRun = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed || running) return;
    setRunning(true);
    setError(null);
    setLastResponse(null);

    // Optimistic UI: add a running entry to history
    const entryId = `cmd-${Date.now()}`;
    const entry: Command = {
      id: entryId,
      text: trimmed,
      model: modelId,
      timestamp: Date.now(),
      status: 'running',
    };
    const next = [entry, ...history].slice(0, MAX_HISTORY);
    persistHistory(next);

    try {
      const resp = await api.submitCommand(trimmed);
      setLastResponse(resp);

      // Update history entry with real result
      const updated: Command[] = getItem<Command[]>(HISTORY_KEY, []).map((c) =>
        c.id === entryId
          ? {
              ...c,
              status: resp.state === 'done' ? 'completed' : resp.state === 'failed' ? 'failed' : 'pending',
              result: resp.output ?? resp.error ?? resp.message ?? `State: ${resp.state}`,
              commandId: resp.command_id,
              agentId: resp.agent_id,
              evidenceLabels: resp.evidence_labels,
            }
          : c,
      );
      setItem(HISTORY_KEY, updated);
      setHistory(updated);
      window.dispatchEvent(new CustomEvent('command:history:updated'));

      dispatchSubmit(trimmed, modelId, { response: resp });
      setText('');
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Lệnh thất bại.';
      setError(msg);
      const updated: Command[] = getItem<Command[]>(HISTORY_KEY, []).map((c) =>
        c.id === entryId ? { ...c, status: 'failed' as const, result: msg } : c,
      );
      setItem(HISTORY_KEY, updated);
      setHistory(updated);
      window.dispatchEvent(new CustomEvent('command:history:updated'));
      dispatchSubmit(trimmed, modelId, { error: msg });
    } finally {
      setRunning(false);
    }
  }, [text, running, modelId, history, persistHistory, dispatchSubmit]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        handleRun();
      }
    },
    [handleRun],
  );

  const handleModelChange = useCallback((e: ChangeEvent<HTMLSelectElement>) => {
    setModelId(e.target.value);
  }, []);

  const handleHistoryPick = useCallback(
    (cmd: Command) => {
      setText(cmd.text);
      setModelId(cmd.model);
      setHistoryOpen(false);
    },
    [],
  );

  const recentHistory = history.slice(0, MAX_HISTORY);

  return (
    <div className="console-card mb-6">
      <div className="mb-1.5 flex items-center justify-between">
        <label className="console-label mb-0" htmlFor="command-text">
          Nhập lệnh
        </label>
        <div className="relative">
          <button
            type="button"
            className="console-btn console-btn-secondary text-xs"
            onClick={() => setHistoryOpen((v) => !v)}
            aria-expanded={historyOpen}
            aria-label="Mở lịch sử lệnh"
          >
            Lịch sử ({recentHistory.length})
          </button>
          {historyOpen && (
            <div className="absolute right-0 z-20 mt-2 max-h-72 w-96 overflow-y-auto rounded-lg border border-slate-700 bg-bg-card p-2 shadow-xl">
              {recentHistory.length === 0 ? (
                <p className="px-2 py-3 text-xs text-slate-500">
                  Chưa có lệnh nào.
                </p>
              ) : (
                <ul className="space-y-1">
                  {recentHistory.map((cmd) => (
                    <li key={cmd.id}>
                      <button
                        type="button"
                        className="w-full rounded px-2 py-2 text-left text-xs hover:bg-bg-hover"
                        onClick={() => handleHistoryPick(cmd)}
                        aria-label={`Chọn lệnh: ${cmd.text}`}
                      >
                        <p className="truncate font-mono text-slate-300">
                          {cmd.text}
                        </p>
                        <p className="mt-0.5 text-slate-500">
                          {cmd.model} · {new Date(cmd.timestamp).toLocaleString()}
                        </p>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>

      <textarea
        id="command-text"
        rows={6}
        className="console-input resize-none font-mono text-sm"
        placeholder="Nhập lệnh cho Máy Tính AI của bạn..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={running}
      />

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-xs text-slate-400" htmlFor="model-select">
            Mô hình:
          </label>
          <select
            id="model-select"
            className="rounded-lg border border-slate-700 bg-bg-card px-3 py-1.5 text-sm text-slate-200 focus:border-accent focus:outline-none"
            value={modelId}
            onChange={handleModelChange}
            disabled={running}
          >
            {MODELS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} ({PROVIDER_LABELS[m.provider]})
              </option>
            ))}
          </select>
          {costEstimate && (
            <span className="text-xs text-slate-400">
              Chi phí ước tính:{' '}
              <span className="text-slate-300">
                ${costEstimate.total.toFixed(4)}
              </span>
              <span className="text-slate-500">
                {' '}
                (vào ${costEstimate.inputCost.toFixed(4)} / ra $
                {costEstimate.outputCost.toFixed(4)})
              </span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden text-xs text-slate-500 sm:inline">
            ⌘/Ctrl + Enter
          </span>
          <button
            type="button"
            className="console-btn console-btn-primary disabled:cursor-not-allowed disabled:opacity-60"
            onClick={handleRun}
            disabled={running || !text.trim()}
            aria-label={running ? "Đang chạy lệnh" : "Chạy lệnh"}
          >
            {running ? (
              <>
                <svg
                  className="h-4 w-4 animate-spin"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 12a8 8 0 018-8"
                  />
                </svg>
                Đang chạy...
              </>
            ) : (
              <>
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M14.25 9.75v-4.5m0 4.5h4.5m-4.5 0L21 3M3 12l2.25 2.25m0 0L7.5 18m-2.25-5.25H3"
                  />
                </svg>
                Chạy lệnh
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="mt-4 rounded-lg border border-red-800 bg-red-950/40 p-3 text-sm text-red-300">
          <p className="font-medium">Lỗi:</p>
          <p className="mt-1 font-mono text-xs">{error}</p>
        </div>
      )}

      {/* Response display */}
      {lastResponse && (
        <div className="mt-4 rounded-lg border border-slate-700 bg-bg-card p-3 text-sm">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="rounded bg-slate-800 px-2 py-0.5 text-xs text-slate-300">
              Trạng thái: {lastResponse.state}
            </span>
            {lastResponse.agent_id && (
              <span className="rounded bg-accent/20 px-2 py-0.5 text-xs text-accent">
                Agent: {lastResponse.agent_id}
              </span>
            )}
            {lastResponse.evidence_labels?.map((label) => (
              <span key={label} className="rounded bg-blue-900/40 px-2 py-0.5 text-xs text-blue-300">
                {label}
              </span>
            ))}
          </div>
          {lastResponse.output && (
            <pre className="max-h-48 overflow-y-auto whitespace-pre-wrap font-mono text-xs text-slate-300">
              {lastResponse.output}
            </pre>
          )}
          {lastResponse.message && (
            <p className="text-xs text-amber-300">{lastResponse.message}</p>
          )}
          {lastResponse.error && (
            <p className="mt-1 text-xs text-red-300">{lastResponse.error}</p>
          )}
        </div>
      )}
    </div>
  );
}

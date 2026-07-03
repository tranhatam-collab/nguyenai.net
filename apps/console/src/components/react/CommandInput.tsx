/**
 * CommandInput.tsx — Natural language command input island.
 * - Large textarea + Run button with loading state
 * - Model selector dropdown with cost estimate
 * - Command history dropdown (last 10 from localStorage)
 * - Cmd/Ctrl+Enter to run
 * - Dispatches `command:submit` custom event with { command, model }
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ChangeEvent, KeyboardEvent } from 'react';
import { MODELS, PROVIDER_LABELS, getModelById } from '../../lib/models';
import { getItem, setItem } from '../../lib/storage';
import type { Command } from '../../types/command';

const HISTORY_KEY = 'nguyenai:command-history';
const MAX_HISTORY = 10;

interface SubmitDetail {
  command: string;
  model: string;
}

export default function CommandInput() {
  const [text, setText] = useState('');
  const [modelId, setModelId] = useState<string>('auto-route');
  const [running, setRunning] = useState(false);
  const [history, setHistory] = useState<Command[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);

  // Load command history on mount
  useEffect(() => {
    const stored = getItem<Command[]>(HISTORY_KEY, []);
    if (stored.length === 0) {
      // Seed sample placeholder entries on first load
      const now = Date.now();
      const samples: Command[] = [
        {
          id: 'sample-1',
          text: 'Tóm tắt báo cáo tài chính Q3 2024 / Summarize Q3 2024 financial report',
          model: 'claude-3-5-sonnet',
          timestamp: now - 1000 * 60 * 60 * 2,
          status: 'completed',
          result: 'Bản tóm tắt đã được tạo. / Summary generated.',
        },
        {
          id: 'sample-2',
          text: 'Generate Python script to clean CSV data',
          model: 'gpt-4o',
          timestamp: now - 1000 * 60 * 60 * 24,
          status: 'completed',
          result: 'Script generated.',
        },
        {
          id: 'sample-3',
          text: 'Translate product description to Vietnamese',
          model: 'auto-route',
          timestamp: now - 1000 * 60 * 60 * 48,
          status: 'failed',
          result: 'Translation service unavailable.',
        },
      ];
      setItem(HISTORY_KEY, samples);
      setHistory(samples);
    } else {
      setHistory(stored);
    }
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
    // Notify other islands in the same document (storage event only fires cross-tab)
    window.dispatchEvent(new CustomEvent('command:history:updated'));
  }, []);

  const dispatchSubmit = useCallback((command: string, model: string) => {
    window.dispatchEvent(
      new CustomEvent<SubmitDetail>('command:submit', {
        detail: { command, model },
      }),
    );
  }, []);

  const handleRun = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed || running) return;
    setRunning(true);
    dispatchSubmit(trimmed, modelId);

    // Optimistic UI: add a running entry to history
    const entry: Command = {
      id: `cmd-${Date.now()}`,
      text: trimmed,
      model: modelId,
      timestamp: Date.now(),
      status: 'running',
    };
    const next = [entry, ...history].slice(0, MAX_HISTORY);
    persistHistory(next);

    // Simulate completion after a short delay (UI only, no real API)
    window.setTimeout(() => {
      const updated: Command[] = getItem<Command[]>(HISTORY_KEY, []).map((c) =>
        c.id === entry.id
          ? { ...c, status: 'completed' as const, result: 'Command processed (demo).' }
          : c,
      );
      setItem(HISTORY_KEY, updated);
      setHistory(updated);
      window.dispatchEvent(new CustomEvent('command:history:updated'));
      setRunning(false);
      setText('');
    }, 1200);
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
          Command Input · Nhập lệnh
        </label>
        <div className="relative">
          <button
            type="button"
            className="console-btn console-btn-secondary text-xs"
            onClick={() => setHistoryOpen((v) => !v)}
            aria-expanded={historyOpen}
          >
            History · Lịch sử ({recentHistory.length})
          </button>
          {historyOpen && (
            <div className="absolute right-0 z-20 mt-2 max-h-72 w-96 overflow-y-auto rounded-lg border border-slate-700 bg-bg-card p-2 shadow-xl">
              {recentHistory.length === 0 ? (
                <p className="px-2 py-3 text-xs text-slate-500">
                  Chưa có lệnh nào. / No commands yet.
                </p>
              ) : (
                <ul className="space-y-1">
                  {recentHistory.map((cmd) => (
                    <li key={cmd.id}>
                      <button
                        type="button"
                        className="w-full rounded px-2 py-2 text-left text-xs hover:bg-bg-hover"
                        onClick={() => handleHistoryPick(cmd)}
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
        placeholder="Enter your command here... · Nhập lệnh cho AI Computer của bạn..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={running}
      />

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-xs text-slate-400" htmlFor="model-select">
            Model:
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
              Est. cost · Chi phí ước tính:{' '}
              <span className="text-slate-300">
                ${costEstimate.total.toFixed(4)}
              </span>
              <span className="text-slate-500">
                {' '}
                (in ${costEstimate.inputCost.toFixed(4)} / out $
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
                Running... · Đang chạy
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
                Run Command · Chạy lệnh
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

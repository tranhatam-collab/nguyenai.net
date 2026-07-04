/**
 * MemoryPanel.tsx — React island that loads memories from /v1/memory
 * and displays them as a timeline. Supports filtering by memory type.
 */
import { useCallback, useEffect, useState } from 'react';
import { api, ApiError, type MemoryEntry } from '../../lib/api';

const MEMORY_TYPES = ['session', 'preference', 'project', 'decision', 'family', 'founder'] as const;

export default function MemoryPanel() {
  const [memories, setMemories] = useState<MemoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('');
  const [showForm, setShowForm] = useState(false);
  const [newMemory, setNewMemory] = useState({
    memory_type: 'preference' as string,
    key: '',
    value: '',
  });

  const load = useCallback(async (type?: string) => {
    setLoading(true);
    try {
      const resp = await api.listMemory(type || undefined, 100);
      setMemories(resp.memories);
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load memories.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleFilter = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const v = e.target.value;
    setFilter(v);
    load(v || undefined);
  }, [load]);

  const handleWrite = useCallback(async () => {
    if (!newMemory.key || !newMemory.value) return;
    try {
      await api.writeMemory({
        memory_type: newMemory.memory_type,
        key: newMemory.key,
        value: newMemory.value,
      });
      setNewMemory({ memory_type: 'preference', key: '', value: '' });
      setShowForm(false);
      load(filter || undefined);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to write memory.');
    }
  }, [newMemory, filter, load]);

  const handleDelete = useCallback(async (key: string) => {
    try {
      await api.deleteMemory(key);
      load(filter || undefined);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to delete memory.');
    }
  }, [filter, load]);

  return (
    <div>
      {/* Filter + write button */}
      <div class="mb-4 flex flex-wrap items-center gap-3">
        <label class="text-xs text-slate-400" htmlFor="memory-filter">Filter:</label>
        <select
          id="memory-filter"
          class="rounded-lg border border-slate-700 bg-bg-card px-3 py-1.5 text-sm text-slate-200"
          value={filter}
          onChange={handleFilter}
        >
          <option value="">All types · Tất cả</option>
          {MEMORY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <button
          class="console-btn console-btn-primary text-xs"
          onClick={() => setShowForm((v) => !v)}
        >
          {showForm ? 'Cancel · Hủy' : '+ Write memory · Ghi bộ nhớ'}
        </button>
      </div>

      {/* Write form */}
      {showForm && (
        <div class="console-card mb-4">
          <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label class="console-label">Type</label>
              <select
                class="console-input"
                value={newMemory.memory_type}
                onChange={(e) => setNewMemory((m) => ({ ...m, memory_type: e.target.value }))}
              >
                {MEMORY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label class="console-label">Key</label>
              <input
                class="console-input"
                value={newMemory.key}
                onChange={(e) => setNewMemory((m) => ({ ...m, key: e.target.value }))}
                placeholder="e.g. preferred_language"
              />
            </div>
            <div>
              <label class="console-label">Value</label>
              <input
                class="console-input"
                value={newMemory.value}
                onChange={(e) => setNewMemory((m) => ({ ...m, value: e.target.value }))}
                placeholder="e.g. vi"
              />
            </div>
          </div>
          <button class="console-btn console-btn-primary mt-3 text-xs" onClick={handleWrite}>
            Save · Lưu
          </button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div class="mb-4 rounded-lg border border-red-800 bg-red-950/40 p-3 text-sm text-red-300">
          <p class="font-medium">Error · Lỗi:</p>
          <p class="mt-1 font-mono text-xs">{error}</p>
        </div>
      )}

      {/* Loading */}
      {loading && <p class="text-sm text-slate-400">Loading memories... · Đang tải...</p>}

      {/* Memory list */}
      {!loading && memories.length === 0 && (
        <div class="console-card">
          <p class="text-sm text-slate-400">No memories found. · Chưa có bộ nhớ nào.</p>
        </div>
      )}

      {!loading && memories.length > 0 && (
        <div class="space-y-3">
          {memories.map((m) => (
            <div key={m.memory_id} class="console-card">
              <div class="flex items-start justify-between">
                <div class="flex-1">
                  <div class="flex flex-wrap items-center gap-2">
                    <span class="rounded bg-accent/20 px-2 py-0.5 text-xs text-accent">{m.memory_type}</span>
                    <span class="rounded bg-slate-800 px-2 py-0.5 text-xs text-slate-400">{m.visibility}</span>
                    <span class="font-mono text-sm text-slate-200">{m.key}</span>
                  </div>
                  <p class="mt-2 text-sm text-slate-300">
                    {typeof m.value === 'string' ? m.value : JSON.stringify(m.value)}
                  </p>
                  <p class="mt-1 text-xs text-slate-500">
                    {new Date(m.updated_at).toLocaleString()} · {m.tags.join(', ') || 'no tags'}
                  </p>
                </div>
                <button
                  class="text-xs text-red-400 hover:text-red-300"
                  onClick={() => handleDelete(m.key)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

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
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <label className="text-xs text-slate-400" htmlFor="memory-filter">Filter:</label>
        <select
          id="memory-filter"
          className="rounded-lg border border-slate-700 bg-bg-card px-3 py-1.5 text-sm text-slate-200"
          value={filter}
          onChange={handleFilter}
        >
          <option value="">All types · Tất cả</option>
          {MEMORY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <button
          className="console-btn console-btn-primary text-xs"
          onClick={() => setShowForm((v) => !v)}
          aria-label={showForm ? "Cancel · Hủy" : "Add memory · Ghi bộ nhớ"}
        >
          {showForm ? 'Hủy' : '+ Ghi bộ nhớ'}
        </button>
      </div>

      {/* Write form */}
      {showForm && (
        <div className="console-card mb-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className="console-label">Type</label>
              <select
                className="console-input"
                value={newMemory.memory_type}
                onChange={(e) => setNewMemory((m) => ({ ...m, memory_type: e.target.value }))}
              >
                {MEMORY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="console-label" htmlFor="memory-key">Key</label>
              <input
                id="memory-key"
                className="console-input"
                value={newMemory.key}
                onChange={(e) => setNewMemory((m) => ({ ...m, key: e.target.value }))}
                placeholder="e.g. preferred_language"
              />
            </div>
            <div>
              <label className="console-label" htmlFor="memory-value">Value</label>
              <input
                id="memory-value"
                className="console-input"
                value={newMemory.value}
                onChange={(e) => setNewMemory((m) => ({ ...m, value: e.target.value }))}
                placeholder="e.g. vi"
              />
            </div>
          </div>
          <button className="console-btn console-btn-primary mt-3 text-xs" onClick={handleWrite} aria-label="Save memory · Lưu bộ nhớ">
            Save · Lưu
          </button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-4 rounded-lg border border-red-800 bg-red-950/40 p-3 text-sm text-red-300">
          <p className="font-medium">Error · Lỗi:</p>
          <p className="mt-1 font-mono text-xs">{error}</p>
        </div>
      )}

      {/* Loading */}
      {loading && <p className="text-sm text-slate-400">Loading memories... · Đang tải...</p>}

      {/* Memory list */}
      {!loading && memories.length === 0 && (
        <div className="console-card">
          <p className="text-sm text-slate-400">No memories found. · Chưa có bộ nhớ nào.</p>
        </div>
      )}

      {!loading && memories.length > 0 && (
        <div className="space-y-3">
          {memories.map((m) => (
            <div key={m.memory_id} className="console-card">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded bg-accent/20 px-2 py-0.5 text-xs text-accent">{m.memory_type}</span>
                    <span className="rounded bg-slate-800 px-2 py-0.5 text-xs text-slate-400">{m.visibility}</span>
                    <span className="font-mono text-sm text-slate-200">{m.key}</span>
                  </div>
                  <p className="mt-2 text-sm text-slate-300">
                    {typeof m.value === 'string' ? m.value : JSON.stringify(m.value)}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {new Date(m.updated_at).toLocaleString()} · {m.tags.join(', ') || 'no tags'}
                  </p>
                </div>
                <button
                  className="text-xs text-red-400 hover:text-red-300"
                  onClick={() => handleDelete(m.key)}
                  aria-label={`Delete memory ${m.key} · Xóa bộ nhớ ${m.key}`}
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

/**
 * AgentList.tsx — React island that loads the 9 NAI agents from /v1/agents
 * and renders them as cards with enabled/disabled status.
 */
import { useEffect, useState } from 'react';
import { api, ApiError, type AgentEntry } from '../../lib/api';

export default function AgentList() {
  const [agents, setAgents] = useState<AgentEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const resp = await api.listAgents();
        if (!cancelled) {
          setAgents(resp.agents);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : 'Tải danh sách Agent thất bại.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return <p className="text-sm text-slate-400">Đang tải...</p>;
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-800 bg-red-950/40 p-4 text-sm text-red-300">
        <p className="font-medium">Lỗi:</p>
        <p className="mt-1 font-mono text-xs">{error}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {agents.map((agent) => (
        <div
          key={agent.id}
          className={`console-card ${agent.enabled ? 'border-accent/40' : 'opacity-60'}`}
        >
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-base font-semibold text-slate-100">{agent.name}</h3>
            <span
              className={`rounded px-2 py-0.5 text-xs ${
                agent.enabled
                  ? 'bg-green-900/40 text-green-300'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {agent.enabled ? 'Bật' : 'Tắt'}
            </span>
          </div>
          <p className="text-xs text-slate-400">{agent.nameVi}</p>
          <p className="mt-2 text-sm text-slate-300">{agent.role}</p>
          <p className="mt-1 text-xs text-slate-500">{agent.description}</p>
          <div className="mt-3 flex flex-wrap gap-1">
            {agent.capabilities.map((cap) => (
              <span key={cap} className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-400">
                {cap}
              </span>
            ))}
          </div>
          <p className="mt-2 text-[10px] text-slate-500">Cấp mặc định: {agent.defaultTier}</p>
        </div>
      ))}
    </div>
  );
}

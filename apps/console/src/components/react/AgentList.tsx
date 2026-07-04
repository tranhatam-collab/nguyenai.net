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
          setError(err instanceof ApiError ? err.message : 'Failed to load agents.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return <p class="text-sm text-slate-400">Loading agents... · Đang tải...</p>;
  }

  if (error) {
    return (
      <div class="rounded-lg border border-red-800 bg-red-950/40 p-4 text-sm text-red-300">
        <p class="font-medium">Error · Lỗi:</p>
        <p class="mt-1 font-mono text-xs">{error}</p>
      </div>
    );
  }

  return (
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {agents.map((agent) => (
        <div
          key={agent.id}
          class={`console-card ${agent.enabled ? 'border-accent/40' : 'opacity-60'}`}
        >
          <div class="mb-2 flex items-center justify-between">
            <h3 class="text-base font-semibold text-slate-100">{agent.name}</h3>
            <span
              class={`rounded px-2 py-0.5 text-xs ${
                agent.enabled
                  ? 'bg-green-900/40 text-green-300'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {agent.enabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>
          <p class="text-xs text-slate-400">{agent.nameVi}</p>
          <p class="mt-2 text-sm text-slate-300">{agent.role}</p>
          <p class="mt-1 text-xs text-slate-500">{agent.description}</p>
          <div class="mt-3 flex flex-wrap gap-1">
            {agent.capabilities.map((cap) => (
              <span key={cap} class="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-400">
                {cap}
              </span>
            ))}
          </div>
          <p class="mt-2 text-[10px] text-slate-500">Default tier: {agent.defaultTier}</p>
        </div>
      ))}
    </div>
  );
}

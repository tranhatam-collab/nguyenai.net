/**
 * @nai/crew — Crew runtime for NAI.
 *
 * P1-C.4: Crew runtime — multi-agent collaboration.
 * Original source: https://github.com/joaomdmoura/crewAI
 * License: MIT
 */

export type AgentRole = 'founder' | 'business_operator' | 'researcher' | 'global_connector' | 'sales' | 'verifier' | 'guardian';

export interface Agent {
  id: string;
  name: string;
  role: AgentRole;
  description: string;
  capabilities: string[];
}

export interface Task {
  id: string;
  description: string;
  assignedTo?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  result?: unknown;
  dependencies?: string[];
  createdAt: string;
  completedAt?: string;
}

export interface Crew {
  id: string;
  name: string;
  description: string;
  agents: Agent[];
  tasks: Task[];
  sharedContext: Record<string, unknown>;
}

export interface CrewExecution {
  crewId: string;
  status: 'running' | 'completed' | 'failed';
  startedAt: string;
  completedAt?: string;
  results: Map<string, unknown>;
}

export class CrewRuntime {
  private crews = new Map<string, Crew>();
  private executions = new Map<string, CrewExecution>();

  registerCrew(crew: Crew): void {
    this.crews.set(crew.id, crew);
  }

  getCrew(id: string): Crew | undefined {
    return this.crews.get(id);
  }

  createCrew(name: string, description: string, agents: Agent[]): Crew {
    const crew: Crew = { id: crypto.randomUUID(), name, description, agents, tasks: [], sharedContext: {} };
    this.crews.set(crew.id, crew);
    return crew;
  }

  addTask(crewId: string, description: string, dependencies?: string[]): Task {
    const crew = this.crews.get(crewId);
    if (!crew) throw new Error('Crew not found');
    const task: Task = { id: crypto.randomUUID(), description, status: 'pending', dependencies, createdAt: new Date().toISOString() };
    crew.tasks.push(task);
    return task;
  }

  assignTask(crewId: string, taskId: string, agentId: string): void {
    const crew = this.crews.get(crewId);
    if (!crew) throw new Error('Crew not found');
    const task = crew.tasks.find((t) => t.id === taskId);
    if (!task) throw new Error('Task not found');
    const agent = crew.agents.find((a) => a.id === agentId);
    if (!agent) throw new Error('Agent not found');
    task.assignedTo = agentId;
  }

  async executeCrew(crewId: string): Promise<CrewExecution> {
    const crew = this.crews.get(crewId);
    if (!crew) throw new Error('Crew not found');
    const execution: CrewExecution = { crewId, status: 'running', startedAt: new Date().toISOString(), results: new Map() };
    this.executions.set(crewId, execution);
    try {
      const completed = new Set<string>();
      let attempts = 0;
      const maxAttempts = crew.tasks.length * 2;
      while (completed.size < crew.tasks.length && attempts < maxAttempts) {
        attempts++;
        for (const task of crew.tasks) {
          if (completed.has(task.id)) continue;
          const depsSatisfied = !task.dependencies || task.dependencies.every((depId) => completed.has(depId));
          if (!depsSatisfied) continue;
          task.status = 'in_progress';
          const result = await this.executeTask(crew, task);
          task.status = 'completed';
          task.result = result;
          task.completedAt = new Date().toISOString();
          execution.results.set(task.id, result);
          completed.add(task.id);
        }
      }
      execution.status = 'completed';
      execution.completedAt = new Date().toISOString();
    } catch (err) {
      execution.status = 'failed';
      execution.completedAt = new Date().toISOString();
    }
    return execution;
  }

  private async executeTask(crew: Crew, task: Task): Promise<unknown> {
    return { taskId: task.id, description: task.description, assignedTo: task.assignedTo, result: `Executed: ${task.description}`, timestamp: new Date().toISOString() };
  }

  getExecution(crewId: string): CrewExecution | undefined { return this.executions.get(crewId); }

  updateContext(crewId: string, key: string, value: unknown): void {
    const crew = this.crews.get(crewId);
    if (!crew) throw new Error('Crew not found');
    crew.sharedContext[key] = value;
  }

  getContext(crewId: string, key?: string): unknown {
    const crew = this.crews.get(crewId);
    if (!crew) throw new Error('Crew not found');
    return key ? crew.sharedContext[key] : crew.sharedContext;
  }

  deleteCrew(id: string): void { this.crews.delete(id); this.executions.delete(id); }

  listCrews(): Crew[] { return Array.from(this.crews.values()); }
}

export function createFounderSuiteCrew(runtime: CrewRuntime): Crew {
  const agents: Agent[] = [
    { id: 'agent-founder', name: 'Nguyen Founder', role: 'founder', description: 'Strategic decision-making.', capabilities: ['strategy', 'decision', 'planning'] },
    { id: 'agent-bo', name: 'Business Operator', role: 'business_operator', description: 'Operations and logistics.', capabilities: ['operations', 'logistics', 'management'] },
    { id: 'agent-researcher', name: 'Nguyen Researcher', role: 'researcher', description: 'Research and analysis.', capabilities: ['research', 'analysis', 'investigation'] },
  ];
  return runtime.createCrew('Founder Suite', 'Crew for founder-level decision making.', agents);
}

export function createBusinessPackCrew(runtime: CrewRuntime): Crew {
  const agents: Agent[] = [
    { id: 'agent-bo', name: 'Business Operator', role: 'business_operator', description: 'Operations and logistics.', capabilities: ['operations', 'logistics', 'management'] },
    { id: 'agent-connector', name: 'Global Connector', role: 'global_connector', description: 'Networking and partnerships.', capabilities: ['networking', 'partnerships', 'expansion'] },
    { id: 'agent-sales', name: 'Sales Agent', role: 'sales', description: 'Sales and revenue growth.', capabilities: ['sales', 'acquisition', 'revenue'] },
  ];
  return runtime.createCrew('Business Pack', 'Crew for business operations.', agents);
}

/**
 * Create a crew (standalone function, not using runtime).
 */
export function createCrew(config: { name: string; description: string }): Crew {
  return {
    id: `crew-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    name: config.name,
    description: config.description,
    agents: [],
    tasks: [],
    sharedContext: {},
  };
}

/**
 * Assign an agent to a crew.
 */
export function assignAgent(crew: Crew, agent: Omit<Agent, 'id'>): Crew {
  const newAgent: Agent = {
    ...agent,
    id: `agent-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
  };
  return {
    ...crew,
    agents: [...crew.agents, newAgent],
  };
}

/**
 * Execute a crew (standalone function, not using runtime).
 */
export async function executeCrew(crew: Crew, input: { task: string; context: Record<string, unknown> }): Promise<CrewExecution> {
  const execution: CrewExecution = {
    crewId: crew.id,
    status: 'running',
    startedAt: new Date().toISOString(),
    results: new Map(),
  };

  try {
    // Mock execution - in real system, this would orchestrate agents
    for (const agent of crew.agents) {
      execution.results.set(agent.id, {
        agentId: agent.id,
        agentName: agent.name,
        task: input.task,
        result: `Agent ${agent.name} completed task: ${input.task}`,
        timestamp: new Date().toISOString(),
      });
    }

    execution.status = 'completed';
    execution.completedAt = new Date().toISOString();
  } catch (err) {
    execution.status = 'failed';
    execution.completedAt = new Date().toISOString();
  }

  return execution;
}

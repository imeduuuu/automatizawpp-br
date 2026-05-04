import { AgentName, LeadView, NextBestAction } from '@/lib/types';

export interface AgentContext {
  workspaceId: string;
  lead: LeadView;
  objective: string;
  channel?: string;
  message?: string;
  memorySummary?: string;
  recentMessages?: string[];
  // Sprint 1.7 V.L.A.E.G. — BUG C: ID del AgentRun en curso (opcional).
  // Permite que los agentes hijos guarden trazabilidad cruzada en sus
  // payloads y que QA / persistencia outbound enlacen al run que originó
  // el draft. Se puebla en `events/inbound/route.ts` antes de invocar
  // a LeadResponseAgent.
  agentRunId?: string;
  complianceState?: {
    dailyTouches: number;
    maxTouchesPerDay: number;
    optedOut: boolean;
    quietHours: boolean;
  };
}

export interface AgentExecutionResult {
  agent: AgentName;
  summary: string;
  payload: Record<string, unknown>;
  nextAction?: NextBestAction;
}

export interface SalesAgent {
  name: AgentName;
  run(context: AgentContext): Promise<AgentExecutionResult>;
}

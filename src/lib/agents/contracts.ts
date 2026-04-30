import { AgentName, LeadView, NextBestAction } from '@/lib/types';

export interface AgentContext {
  workspaceId: string;
  lead: LeadView;
  objective: string;
  channel?: string;
  message?: string;
  memorySummary?: string;
  recentMessages?: string[];
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

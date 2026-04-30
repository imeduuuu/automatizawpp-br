export type LeadStatus =
  | 'NEW'
  | 'CALL_SCHEDULED'
  | 'CALL_ATTEMPTED'
  | 'QUALIFIED'
  | 'PROPOSAL_SENT'
  | 'FOLLOW_UP'
  | 'CLOSED_WON'
  | 'CLOSED_LOST'
  | 'COLD'
  | 'CONTACTED'
  | 'QUALIFYING'
  | 'NURTURING'
  | 'SALES_READY'
  | 'NEGOTIATION'
  | 'BOOKED'
  | 'WON'
  | 'LOST'
  | 'PAUSED';

export type IntentLevel = 'LOW' | 'MEDIUM' | 'HIGH';
export type UrgencyLevel = 'LOW' | 'MEDIUM' | 'HIGH';
export type BuyingStage = 'AWARENESS' | 'DISCOVERY' | 'CONSIDERATION' | 'EVALUATION' | 'DECISION' | 'COMMITMENT';

export type ChannelType =
  | 'WEB_CHAT'
  | 'EMAIL'
  | 'SMS'
  | 'WHATSAPP'
  | 'INSTAGRAM_DM'
  | 'FACEBOOK_MESSENGER'
  | 'VOICE'
  | 'INTERNAL';

export type AgentName =
  | 'ORCHESTRATOR'
  | 'LEAD_RESPONSE'
  | 'QUALIFICATION'
  | 'MEMORY'
  | 'OBJECTION_HANDLER'
  | 'FOLLOW_UP'
  | 'CALL_ASSIST'
  | 'CLOSER'
  | 'SALES_QA'
  | 'WRITER';

export interface LeadView {
  id: string;
  fullName: string;
  company?: string | null;
  email?: string | null;
  phone?: string | null;
  source?: string | null;
  productInterest?: string | null;
  status: LeadStatus;
  leadScoreValue: number;
  intentLevel: IntentLevel;
  urgencyLevel: UrgencyLevel;
  buyingStage: BuyingStage;
  closeProbability: number;
  assignedTo?: string | null;
  qualificationScore?: number | null;
  nextAction?: string | null;
  nextActionAt?: string | null;
  lastContactAt?: string | null;
  lastCallAt?: string | null;
  lastEmailAt?: string | null;
}

export interface NextBestAction {
  action: string;
  reason: string;
  urgency: 'LOW' | 'MEDIUM' | 'HIGH';
  channel?: ChannelType;
  shouldEscalate: boolean;
}

export interface AgentOutput {
  agent: AgentName;
  summary: string;
  payload: Record<string, unknown>;
}

import { SalesAgent } from '@/lib/agents/contracts';
import { LeadResponseAgent } from '@/lib/agents/lead-response-agent';
import { QualificationAgent } from '@/lib/agents/qualification-agent';
import { MemoryAgent } from '@/lib/agents/memory-agent';
import { ObjectionHandlingAgent } from '@/lib/agents/objection-agent';
import { FollowUpAgent } from '@/lib/agents/followup-agent';
import { CallAssistAgent } from '@/lib/agents/call-agent';
import { CloserAgent } from '@/lib/agents/closer-agent';
import { SalesQaAgent } from '@/lib/agents/qa-agent';
import { WriterAgent } from '@/lib/agents/writer-agent';

export const agentRegistry: Record<string, SalesAgent> = {
  LEAD_RESPONSE: new LeadResponseAgent(),
  QUALIFICATION: new QualificationAgent(),
  MEMORY: new MemoryAgent(),
  OBJECTION_HANDLER: new ObjectionHandlingAgent(),
  FOLLOW_UP: new FollowUpAgent(),
  CALL_ASSIST: new CallAssistAgent(),
  CLOSER: new CloserAgent(),
  SALES_QA: new SalesQaAgent(),
  WRITER: new WriterAgent()
};

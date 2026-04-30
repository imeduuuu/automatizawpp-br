import { LeadView } from '@/lib/types';

export const mockLeads: LeadView[] = [
  {
    id: 'lead_1',
    fullName: 'Marta Lopez',
    company: 'Clinica Dermaluz',
    source: 'Meta Ads',
    productInterest: 'AI WhatsApp Follow-Up',
    status: 'SALES_READY',
    leadScoreValue: 86,
    intentLevel: 'HIGH',
    urgencyLevel: 'HIGH',
    buyingStage: 'DECISION',
    closeProbability: 0.74,
    nextAction: 'Send social proof + booking link',
    lastContactAt: new Date(Date.now() - 1000 * 60 * 12).toISOString()
  },
  {
    id: 'lead_2',
    fullName: 'Jorge Almeida',
    company: 'Prime Homes Valencia',
    source: 'Website',
    productInterest: 'High-ticket nurture workflows',
    status: 'QUALIFYING',
    leadScoreValue: 58,
    intentLevel: 'MEDIUM',
    urgencyLevel: 'MEDIUM',
    buyingStage: 'DISCOVERY',
    closeProbability: 0.43,
    nextAction: 'Ask budget and authority question',
    lastContactAt: new Date(Date.now() - 1000 * 60 * 50).toISOString()
  },
  {
    id: 'lead_3',
    fullName: 'Paula Nunes',
    company: 'Studio Forma',
    source: 'Instagram DM',
    productInterest: 'Missed-call recovery automation',
    status: 'NURTURING',
    leadScoreValue: 41,
    intentLevel: 'LOW',
    urgencyLevel: 'LOW',
    buyingStage: 'CONSIDERATION',
    closeProbability: 0.24,
    nextAction: 'Follow up in 48h with case study',
    lastContactAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString()
  }
];

export const mockKpis = {
  leadsCaptured: 178,
  responsesUnder5m: 94,
  meetingsBooked: 39,
  closeRate: 0.22,
  hotLeads: 17,
  noShowRecoveryRate: 0.36
};

import { LeadView, NextBestAction } from '@/lib/types';

export function getNextBestAction(lead: LeadView): NextBestAction {
  if (lead.status === 'WON' || lead.status === 'LOST' || lead.status === 'PAUSED') {
    return {
      action: 'No immediate outreach',
      reason: `Lead is ${lead.status.toLowerCase()}.`,
      urgency: 'LOW',
      shouldEscalate: false
    };
  }

  if (lead.intentLevel === 'HIGH' && lead.urgencyLevel === 'HIGH') {
    return {
      action: 'Run closer sequence and push booking CTA',
      reason: 'High urgency + high intent indicate immediate conversion window.',
      urgency: 'HIGH',
      channel: 'WHATSAPP',
      shouldEscalate: true
    };
  }

  if (lead.status === 'QUALIFYING') {
    return {
      action: 'Ask one qualification question and update score',
      reason: 'Lead is still in discovery phase.',
      urgency: 'MEDIUM',
      channel: 'WEB_CHAT',
      shouldEscalate: false
    };
  }

  if (lead.status === 'NURTURING') {
    return {
      action: 'Send proof-based follow-up with new angle',
      reason: 'Nurture requires value progression to reactivate intent.',
      urgency: 'MEDIUM',
      channel: 'EMAIL',
      shouldEscalate: false
    };
  }

  return {
    action: lead.nextAction ?? 'Send immediate lead response',
    reason: 'Default fast-response policy for active opportunities.',
    urgency: lead.intentLevel === 'HIGH' ? 'HIGH' : 'MEDIUM',
    channel: 'WHATSAPP',
    shouldEscalate: false
  };
}

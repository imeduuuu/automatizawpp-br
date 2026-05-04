// Regras de alertas para Phase 5B

import { AlertRuleConfig, NotificationPriority, NotificationTemplateType } from './types';

export const ALERT_RULES: Record<string, AlertRuleConfig> = {
  'lead-created': {
    template: 'LEAD_CREATED',
    priority: 'MEDIUM',
    channels: ['IN_APP', 'EMAIL'],
    conditions: {}
  },

  'lead-qualified': {
    template: 'LEAD_QUALIFIED',
    priority: 'HIGH',
    channels: ['IN_APP', 'EMAIL', 'WHATSAPP'],
    conditions: {
      leadScore: 70
    }
  },

  'lead-high-intent': {
    template: 'LEAD_HIGH_INTENT',
    priority: 'URGENT',
    channels: ['IN_APP', 'EMAIL', 'WHATSAPP', 'SLACK'],
    conditions: {
      intentLevel: 'HIGH'
    }
  },

  'lead-vip': {
    template: 'LEAD_VIP',
    priority: 'URGENT',
    channels: ['IN_APP', 'EMAIL', 'WHATSAPP', 'SLACK'],
    conditions: {
      isVip: true
    }
  },

  // Sprint 2.4-A — fecha deuda #3: trigger dedicado de escalonamento humano
  'lead-escalated': {
    template: 'LEAD_ESCALATED',
    priority: 'URGENT',
    channels: ['IN_APP', 'EMAIL'],
    conditions: {}
  },

  'email-failed': {
    template: 'EMAIL_FAILED',
    priority: 'HIGH',
    channels: ['IN_APP', 'EMAIL', 'SLACK'],
    conditions: {}
  },

  'call-completed': {
    template: 'CALL_COMPLETED',
    priority: 'LOW',
    channels: ['IN_APP'],
    conditions: {}
  },

  'follow-up-sent': {
    template: 'FOLLOW_UP_SENT',
    priority: 'LOW',
    channels: ['IN_APP'],
    conditions: {}
  },

  'system-error': {
    template: 'SYSTEM_ERROR',
    priority: 'URGENT',
    channels: ['EMAIL', 'SLACK'],
    conditions: {}
  },

  'system-health': {
    template: 'SYSTEM_HEALTH',
    priority: 'LOW',
    channels: ['SLACK'],
    conditions: {}
  },

  'opportunity-high-value': {
    template: 'OPPORTUNITY_HIGH_VALUE',
    priority: 'URGENT',
    channels: ['IN_APP', 'EMAIL', 'WHATSAPP', 'SLACK'],
    conditions: {
      leadScore: 85
    }
  }
};

export function getAlertRule(ruleKey: string): AlertRuleConfig | null {
  return ALERT_RULES[ruleKey] || null;
}

export function getChannelsForRule(ruleKey: string): string[] {
  const rule = getAlertRule(ruleKey);
  return rule?.channels || ['IN_APP'];
}

export function getPriorityForRule(ruleKey: string): NotificationPriority {
  const rule = getAlertRule(ruleKey);
  return rule?.priority || 'MEDIUM';
}

export function getTemplateForRule(ruleKey: string): NotificationTemplateType {
  const rule = getAlertRule(ruleKey);
  return rule?.template || 'LEAD_CREATED';
}

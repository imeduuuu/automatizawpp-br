// Tipos para sistema de notificações Phase 5B

export type NotificationChannel = 'EMAIL' | 'WHATSAPP' | 'IN_APP' | 'SLACK';
export type NotificationPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type NotificationStatus = 'PENDING' | 'SENT' | 'FAILED' | 'READ' | 'ARCHIVED';
export type NotificationTemplateType =
  | 'LEAD_CREATED'
  | 'LEAD_QUALIFIED'
  | 'LEAD_HIGH_INTENT'
  | 'LEAD_VIP'
  | 'EMAIL_FAILED'
  | 'CALL_COMPLETED'
  | 'FOLLOW_UP_SENT'
  | 'SYSTEM_ERROR'
  | 'SYSTEM_HEALTH'
  | 'OPPORTUNITY_HIGH_VALUE';

export interface NotificationPayload {
  workspaceId: string;
  userId?: string;
  leadId?: string;
  title: string;
  message: string;
  channel: NotificationChannel;
  priority?: NotificationPriority;
  template: NotificationTemplateType;
  recipientEmail?: string;
  recipientPhone?: string;
  recipientSlackId?: string;
  metadata?: Record<string, unknown>;
}

export interface SendNotificationInput {
  payload: NotificationPayload;
  dryRun?: boolean;
}

export interface NotificationResult {
  success: boolean;
  notificationId?: string;
  channel: NotificationChannel;
  error?: string;
  retryable?: boolean;
}

export interface NotificationTemplateData {
  name: string;
  email?: string;
  company?: string;
  leadId?: string;
  leadName?: string;
  reason?: string;
  score?: number;
  channel?: string;
  timestamp?: string;
  error?: string;
  [key: string]: unknown;
}

export interface AlertRuleConfig {
  template: NotificationTemplateType;
  priority: NotificationPriority;
  channels: NotificationChannel[];
  conditions: {
    leadScore?: number;
    leadStatus?: string;
    isVip?: boolean;
    intentLevel?: string;
  };
}

// Exports centralizados para notificações Phase 5B

// Serviço principal
export {
  sendNotification,
  markAsRead,
  getUserNotifications,
  getUnreadCount,
  clearAllNotifications,
  retryFailedNotifications
} from './service';

// Tipos
export type {
  NotificationChannel,
  NotificationPriority,
  NotificationStatus,
  NotificationTemplateType,
  NotificationPayload,
  SendNotificationInput,
  NotificationResult,
  AlertRuleConfig
} from './types';

// Preferências
export {
  getUserPreferences,
  updateUserPreferences,
  isNotificationEnabled,
  saveNotificationTemplate,
  getNotificationTemplate
} from './preferences';

// Gatilhos
export {
  triggerLeadCreated,
  triggerLeadQualified,
  triggerHighIntentLead,
  triggerVipLead,
  triggerEscalation,
  triggerEmailFailed,
  triggerSystemError,
  triggerOpportunityHighValue
} from './triggers';

// Templates
export {
  renderTemplate,
  getTemplateVariables
} from './templates';

// Regras
export {
  ALERT_RULES,
  getAlertRule,
  getChannelsForRule,
  getPriorityForRule,
  getTemplateForRule
} from './alert-rules';

// Agendador
export {
  startNotificationScheduler,
  stopNotificationScheduler
} from './scheduler';

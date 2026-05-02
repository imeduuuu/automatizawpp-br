// Tipos de eventos para el sistema de gatillos (Webhooks & Event Triggers)

export enum EventType {
  LEAD_CREATED = 'lead:created',
  LEAD_UPDATED = 'lead:updated',
  EMAIL_SENT = 'email:sent',
  EMAIL_RECEIVED = 'email:received',
  CALL_LOGGED = 'call:logged',
  CALL_COMPLETED = 'call:completed',
  MESSAGE_SENT = 'message:sent',
  MESSAGE_RECEIVED = 'message:received',
  FOLLOW_UP_SCHEDULED = 'follow_up:scheduled',
  FOLLOW_UP_SENT = 'follow_up:sent',
  BOOKING_CREATED = 'booking:created',
  BOOKING_CONFIRMED = 'booking:confirmed',
}

export interface BaseEvent {
  id: string;
  type: EventType;
  workspaceId: string;
  leadId?: string;
  userId?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface LeadCreatedEvent extends BaseEvent {
  type: EventType.LEAD_CREATED;
  payload: {
    leadId: string;
    email?: string;
    phone?: string;
    name?: string;
    source?: string;
    campaign?: string;
  };
}

export interface EmailSentEvent extends BaseEvent {
  type: EventType.EMAIL_SENT;
  payload: {
    leadId: string;
    emailId: string;
    to: string;
    subject: string;
    templateId?: string;
  };
}

export interface EmailReceivedEvent extends BaseEvent {
  type: EventType.EMAIL_RECEIVED;
  payload: {
    leadId: string;
    messageId: string;
    from: string;
    subject: string;
    body: string;
  };
}

export interface CallLoggedEvent extends BaseEvent {
  type: EventType.CALL_LOGGED;
  payload: {
    leadId: string;
    callId: string;
    duration: number;
    status: string;
    transcriptUrl?: string;
  };
}

export interface MessageSentEvent extends BaseEvent {
  type: EventType.MESSAGE_SENT;
  payload: {
    leadId: string;
    messageId: string;
    channel: string;
    content: string;
  };
}

export interface MessageReceivedEvent extends BaseEvent {
  type: EventType.MESSAGE_RECEIVED;
  payload: {
    leadId: string;
    messageId: string;
    channel: string;
    content: string;
    senderPhone?: string;
  };
}

export interface FollowUpScheduledEvent extends BaseEvent {
  type: EventType.FOLLOW_UP_SCHEDULED;
  payload: {
    leadId: string;
    taskId: string;
    scheduledFor: Date;
    channel: string;
  };
}

export interface FollowUpSentEvent extends BaseEvent {
  type: EventType.FOLLOW_UP_SENT;
  payload: {
    leadId: string;
    taskId: string;
    channel: string;
    sentAt: Date;
  };
}

export interface BookingCreatedEvent extends BaseEvent {
  type: EventType.BOOKING_CREATED;
  payload: {
    leadId: string;
    bookingId: string;
    scheduledFor: Date;
    timezone: string;
  };
}

export interface BookingConfirmedEvent extends BaseEvent {
  type: EventType.BOOKING_CONFIRMED;
  payload: {
    leadId: string;
    bookingId: string;
    confirmedAt: Date;
  };
}

export type AnyEvent =
  | LeadCreatedEvent
  | EmailSentEvent
  | EmailReceivedEvent
  | CallLoggedEvent
  | MessageSentEvent
  | MessageReceivedEvent
  | FollowUpScheduledEvent
  | FollowUpSentEvent
  | BookingCreatedEvent
  | BookingConfirmedEvent;

// Tipo para manejadores de eventos
export type EventHandler<T extends AnyEvent = AnyEvent> = (event: T) => Promise<void>;

// Tipo para integración con n8n
export interface N8nWebhookPayload {
  eventType: string;
  eventId: string;
  timestamp: string;
  workspaceId: string;
  leadId?: string;
  data: Record<string, any>;
}

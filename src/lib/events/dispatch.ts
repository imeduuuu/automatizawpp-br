// Utilidades para disparar eventos desde el resto de la aplicación

import {
  eventEmitter,
  EventType,
  LeadCreatedEvent,
  EmailSentEvent,
  EmailReceivedEvent,
  CallLoggedEvent,
  MessageSentEvent,
  MessageReceivedEvent,
  FollowUpScheduledEvent,
  FollowUpSentEvent,
  BookingCreatedEvent,
  BookingConfirmedEvent,
} from './index';

/**
 * Disparar evento cuando se crea un lead
 */
export async function dispatchLeadCreated(
  workspaceId: string,
  leadId: string,
  data: {
    email?: string;
    phone?: string;
    name?: string;
    source?: string;
    campaign?: string;
  }
) {
  const event: LeadCreatedEvent = {
    id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: EventType.LEAD_CREATED,
    workspaceId,
    leadId,
    timestamp: new Date(),
    payload: {
      leadId,
      ...data,
    },
  };

  await eventEmitter.emit(event);
  return event.id;
}

/**
 * Disparar evento cuando se envía email
 */
export async function dispatchEmailSent(
  workspaceId: string,
  leadId: string,
  data: {
    emailId: string;
    to: string;
    subject: string;
    templateId?: string;
  }
) {
  const event: EmailSentEvent = {
    id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: EventType.EMAIL_SENT,
    workspaceId,
    leadId,
    timestamp: new Date(),
    payload: {
      leadId,
      ...data,
    },
  };

  await eventEmitter.emit(event);
  return event.id;
}

/**
 * Disparar evento cuando se recibe email
 */
export async function dispatchEmailReceived(
  workspaceId: string,
  leadId: string,
  data: {
    messageId: string;
    from: string;
    subject: string;
    body: string;
  }
) {
  const event: EmailReceivedEvent = {
    id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: EventType.EMAIL_RECEIVED,
    workspaceId,
    leadId,
    timestamp: new Date(),
    payload: {
      leadId,
      ...data,
    },
  };

  await eventEmitter.emit(event);
  return event.id;
}

/**
 * Disparar evento cuando se registra una llamada
 */
export async function dispatchCallLogged(
  workspaceId: string,
  leadId: string,
  data: {
    callId: string;
    duration: number;
    status: string;
    transcriptUrl?: string;
  }
) {
  const event: CallLoggedEvent = {
    id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: EventType.CALL_LOGGED,
    workspaceId,
    leadId,
    timestamp: new Date(),
    payload: {
      leadId,
      ...data,
    },
  };

  await eventEmitter.emit(event);
  return event.id;
}

/**
 * Disparar evento cuando se envía mensaje
 */
export async function dispatchMessageSent(
  workspaceId: string,
  leadId: string,
  data: {
    messageId: string;
    channel: string;
    content: string;
  }
) {
  const event: MessageSentEvent = {
    id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: EventType.MESSAGE_SENT,
    workspaceId,
    leadId,
    timestamp: new Date(),
    payload: {
      leadId,
      ...data,
    },
  };

  await eventEmitter.emit(event);
  return event.id;
}

/**
 * Disparar evento cuando se recibe mensaje
 */
export async function dispatchMessageReceived(
  workspaceId: string,
  leadId: string,
  data: {
    messageId: string;
    channel: string;
    content: string;
    senderPhone?: string;
  }
) {
  const event: MessageReceivedEvent = {
    id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: EventType.MESSAGE_RECEIVED,
    workspaceId,
    leadId,
    timestamp: new Date(),
    payload: {
      leadId,
      ...data,
    },
  };

  await eventEmitter.emit(event);
  return event.id;
}

/**
 * Disparar evento cuando se programa un follow-up
 */
export async function dispatchFollowUpScheduled(
  workspaceId: string,
  leadId: string,
  data: {
    taskId: string;
    scheduledFor: Date;
    channel: string;
  }
) {
  const event: FollowUpScheduledEvent = {
    id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: EventType.FOLLOW_UP_SCHEDULED,
    workspaceId,
    leadId,
    timestamp: new Date(),
    payload: {
      leadId,
      ...data,
    },
  };

  await eventEmitter.emit(event);
  return event.id;
}

/**
 * Disparar evento cuando se envía follow-up
 */
export async function dispatchFollowUpSent(
  workspaceId: string,
  leadId: string,
  data: {
    taskId: string;
    channel: string;
    sentAt: Date;
  }
) {
  const event: FollowUpSentEvent = {
    id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: EventType.FOLLOW_UP_SENT,
    workspaceId,
    leadId,
    timestamp: new Date(),
    payload: {
      leadId,
      ...data,
    },
  };

  await eventEmitter.emit(event);
  return event.id;
}

/**
 * Disparar evento cuando se crea un booking
 */
export async function dispatchBookingCreated(
  workspaceId: string,
  leadId: string,
  data: {
    bookingId: string;
    scheduledFor: Date;
    timezone: string;
  }
) {
  const event: BookingCreatedEvent = {
    id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: EventType.BOOKING_CREATED,
    workspaceId,
    leadId,
    timestamp: new Date(),
    payload: {
      leadId,
      ...data,
    },
  };

  await eventEmitter.emit(event);
  return event.id;
}

/**
 * Disparar evento cuando se confirma un booking
 */
export async function dispatchBookingConfirmed(
  workspaceId: string,
  leadId: string,
  data: {
    bookingId: string;
    confirmedAt: Date;
  }
) {
  const event: BookingConfirmedEvent = {
    id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: EventType.BOOKING_CONFIRMED,
    workspaceId,
    leadId,
    timestamp: new Date(),
    payload: {
      leadId,
      ...data,
    },
  };

  await eventEmitter.emit(event);
  return event.id;
}

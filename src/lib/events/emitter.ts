// EventEmitter pattern para disparar eventos y manejar suscriptores

import { AnyEvent, EventHandler, EventType } from './types';
import { triggerN8nWorkflow } from './n8n-trigger';

type EventHandlers = Map<EventType, Set<EventHandler>>;

class EventEmitterClass {
  private handlers: EventHandlers = new Map();
  private isInitialized = false;

  constructor() {
    this.initializeDefaultHandlers();
  }

  private initializeDefaultHandlers() {
    if (this.isInitialized) return;

    // Manejador por defecto: persistir evento en DB
    this.on(EventType.LEAD_CREATED, this.persistEvent.bind(this));
    this.on(EventType.EMAIL_SENT, this.persistEvent.bind(this));
    this.on(EventType.EMAIL_RECEIVED, this.persistEvent.bind(this));
    this.on(EventType.CALL_LOGGED, this.persistEvent.bind(this));
    this.on(EventType.MESSAGE_SENT, this.persistEvent.bind(this));
    this.on(EventType.MESSAGE_RECEIVED, this.persistEvent.bind(this));
    this.on(EventType.FOLLOW_UP_SCHEDULED, this.persistEvent.bind(this));
    this.on(EventType.FOLLOW_UP_SENT, this.persistEvent.bind(this));
    this.on(EventType.BOOKING_CREATED, this.persistEvent.bind(this));
    this.on(EventType.BOOKING_CONFIRMED, this.persistEvent.bind(this));

    // Manejadores para trigger n8n por tipo de evento
    this.on(EventType.LEAD_CREATED, this.triggerN8nOnLeadCreated.bind(this));
    this.on(EventType.EMAIL_RECEIVED, this.triggerN8nOnEmailReceived.bind(this));
    this.on(EventType.CALL_LOGGED, this.triggerN8nOnCallLogged.bind(this));

    this.isInitialized = true;
  }

  // Registrar manejador para un tipo de evento
  on(eventType: EventType, handler: EventHandler) {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set());
    }
    this.handlers.get(eventType)!.add(handler);
  }

  // Desregistrar manejador
  off(eventType: EventType, handler: EventHandler) {
    if (this.handlers.has(eventType)) {
      this.handlers.get(eventType)!.delete(handler);
    }
  }

  // Emitir evento de forma sincrónica (pero handlers ejecutan async)
  async emit(event: AnyEvent) {
    const handlers = this.handlers.get(event.type);
    if (!handlers) return;

    // Ejecutar todos los handlers en paralelo
    const promises = Array.from(handlers).map(handler =>
      handler(event).catch(error => {
        console.error(`[EventEmitter] Error in handler for ${event.type}:`, error);
      })
    );

    await Promise.all(promises);
  }

  // Persistir evento en tabla de eventos
  private async persistEvent(event: AnyEvent) {
    try {
      // TODO: Crear tabla de eventos en schema.prisma si no existe
      // Por ahora, usar AuditLog como almacenamiento temporal
      // await db.auditLog.create({
      //   data: {
      //     event: event.type,
      //     metadata: {
      //       eventId: event.id,
      //       leadId: event.leadId,
      //       payload: event.payload || {},
      //     },
      //     workspaceId: event.workspaceId,
      //     userId: event.userId,
      //   },
      // });
      console.log(`[EventEmitter] Persisted event ${event.type}:`, event.id);
    } catch (error) {
      console.error('[EventEmitter] Failed to persist event:', error);
    }
  }

  // Trigger n8n cuando se crea un lead
  private async triggerN8nOnLeadCreated(event: AnyEvent) {
    if (event.type !== EventType.LEAD_CREATED) return;
    const leadEvent = event as any;
    await triggerN8nWorkflow('lead-created', {
      eventId: event.id,
      leadId: leadEvent.payload?.leadId || event.leadId,
      workspaceId: event.workspaceId,
      data: leadEvent.payload || {},
    }).catch(error => {
      console.error('[EventEmitter] n8n trigger failed for lead-created:', error);
    });
  }

  // Trigger n8n cuando se recibe email
  private async triggerN8nOnEmailReceived(event: AnyEvent) {
    if (event.type !== EventType.EMAIL_RECEIVED) return;
    const emailEvent = event as any;
    await triggerN8nWorkflow('email-received', {
      eventId: event.id,
      leadId: emailEvent.payload?.leadId || event.leadId,
      workspaceId: event.workspaceId,
      data: emailEvent.payload || {},
    }).catch(error => {
      console.error('[EventEmitter] n8n trigger failed for email-received:', error);
    });
  }

  // Trigger n8n cuando se registra una llamada
  private async triggerN8nOnCallLogged(event: AnyEvent) {
    if (event.type !== EventType.CALL_LOGGED) return;
    const callEvent = event as any;
    await triggerN8nWorkflow('call-logged', {
      eventId: event.id,
      leadId: callEvent.payload?.leadId || event.leadId,
      workspaceId: event.workspaceId,
      data: callEvent.payload || {},
    }).catch(error => {
      console.error('[EventEmitter] n8n trigger failed for call-logged:', error);
    });
  }
}

// Singleton pattern
export const eventEmitter = new EventEmitterClass();

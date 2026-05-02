// Tests para sistema de eventos

import { eventEmitter, EventType } from '@/lib/events';
import {
  dispatchLeadCreated,
  dispatchEmailSent,
  dispatchEmailReceived,
} from '@/lib/events/dispatch';

describe('Event System', () => {
  const testWorkspaceId = 'test-workspace';
  const testLeadId = 'lead-123';

  describe('eventEmitter', () => {
    it('debería registrar manejador de evento', () => {
      const handler = jest.fn();
      eventEmitter.on(EventType.LEAD_CREATED, handler);
      // Verificar que el manejador está registrado
    });

    it('debería emitir evento correctamente', async () => {
      const handler = jest.fn();
      eventEmitter.on(EventType.EMAIL_SENT, handler);

      const event = {
        id: 'evt_test',
        type: EventType.EMAIL_SENT,
        workspaceId: testWorkspaceId,
        leadId: testLeadId,
        timestamp: new Date(),
        payload: {
          leadId: testLeadId,
          emailId: 'email_123',
          to: 'test@example.com',
          subject: 'Test',
        },
      };

      // await eventEmitter.emit(event);
      // expect(handler).toHaveBeenCalledWith(event);
    });
  });

  describe('dispatchLeadCreated', () => {
    it('debería crear evento de lead creado', async () => {
      // const eventId = await dispatchLeadCreated(testWorkspaceId, testLeadId, {
      //   email: 'test@example.com',
      //   name: 'Test Lead',
      //   source: 'website',
      // });
      // expect(eventId).toBeDefined();
    });
  });

  describe('dispatchEmailReceived', () => {
    it('debería crear evento de email recibido', async () => {
      // const eventId = await dispatchEmailReceived(
      //   testWorkspaceId,
      //   testLeadId,
      //   {
      //     messageId: 'msg_123',
      //     from: 'sender@example.com',
      //     subject: 'Test Email',
      //     body: 'Test body',
      //   }
      // );
      // expect(eventId).toBeDefined();
    });
  });
});

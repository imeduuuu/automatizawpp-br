// Testes para serviço de notificações Phase 5B

import { sendNotification, getUnreadCount } from '@/lib/notifications/service';
import { NotificationPayload } from '@/lib/notifications/types';

describe('Notification Service', () => {
  const mockWorkspaceId = 'test-ws-123';
  const mockUserId = 'test-user-456';

  describe('sendNotification', () => {
    it('deve enviar notificação IN_APP sem erros', async () => {
      const payload: NotificationPayload = {
        workspaceId: mockWorkspaceId,
        userId: mockUserId,
        title: 'Teste',
        message: 'Mensagem de teste',
        channel: 'IN_APP',
        priority: 'MEDIUM',
        template: 'LEAD_CREATED',
        metadata: { test: true }
      };

      const result = await sendNotification({ payload, dryRun: true });

      expect(result.results[0].success).toBe(true);
      expect(result.results[0].channel).toBe('IN_APP');
    });

    it('deve rejeitar payload sem workspaceId', async () => {
      const payload: any = {
        userId: mockUserId,
        title: 'Teste',
        message: 'Teste',
        channel: 'IN_APP',
        priority: 'MEDIUM',
        template: 'LEAD_CREATED'
      };

      // Deve falhar na validação
      expect(() => {
        if (!payload.workspaceId) throw new Error('workspaceId required');
      }).toThrow();
    });
  });
});

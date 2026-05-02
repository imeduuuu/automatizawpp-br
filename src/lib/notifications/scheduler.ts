// Agendador de tarefas para notificações

import { retryFailedNotifications } from './service';

// Executar retry de notificações falhadas a cada 5 minutos
const RETRY_INTERVAL = 5 * 60 * 1000; // 5 minutos

let retryScheduler: NodeJS.Timeout | null = null;

export function startNotificationScheduler() {
  if (retryScheduler) return; // Já está rodando

  console.log('[NOTIFICATION SCHEDULER] Iniciando agendador de notificações');

  retryScheduler = setInterval(async () => {
    try {
      const logs = await retryFailedNotifications(10);
      if (logs.sent.length > 0 || logs.failed.length > 0) {
        console.log('[NOTIFICATION RETRY]', {
          sent: logs.sent.length,
          failed: logs.failed.length
        });
      }
    } catch (error) {
      console.error('[NOTIFICATION SCHEDULER ERROR]', error);
    }
  }, RETRY_INTERVAL);

  // Executar uma primeira vez imediatamente
  retryFailedNotifications(5).catch(console.error);
}

export function stopNotificationScheduler() {
  if (retryScheduler) {
    clearInterval(retryScheduler);
    retryScheduler = null;
    console.log('[NOTIFICATION SCHEDULER] Agendador parado');
  }
}

// Executar na inicialização se em modo produção
if (typeof global !== 'undefined' && process.env.NODE_ENV === 'production') {
  if (typeof process !== 'undefined' && process.env.ENABLE_NOTIFICATION_SCHEDULER !== 'false') {
    // Agendar para começar após 10 segundos (dar tempo para inicialização)
    setTimeout(startNotificationScheduler, 10000);
  }
}

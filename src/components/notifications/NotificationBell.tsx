// Componente de sino de notificações para dashboard

'use client';

import { useEffect, useState } from 'react';
import { Bell, X, Check } from 'lucide-react';
import styles from './NotificationBell.module.css';

interface Notification {
  id: string;
  title: string;
  message: string;
  priority: string;
  status: string;
  readAt?: string;
  createdAt: string;
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    fetchNotifications();
    // Atualizar a cada 30 segundos
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  async function fetchNotifications() {
    try {
      const response = await fetch('/api/notifications?limit=10');
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  }

  async function markAsRead(notificationId: string) {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'PATCH'
      });
      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => n.id === notificationId ? { ...n, status: 'READ', readAt: new Date().toISOString() } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  }

  async function deleteNotification(notificationId: string) {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
      }
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  }

  async function clearAll() {
    try {
      const response = await fetch('/api/notifications/clear-all', {
        method: 'POST'
      });
      if (response.ok) {
        setNotifications([]);
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Failed to clear notifications:', error);
    }
  }

  const priorityColors = {
    'LOW': '#36a64f',
    'MEDIUM': '#ffa500',
    'HIGH': '#ff6b00',
    'URGENT': '#ff0000'
  };

  return (
    <div className={styles.container}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={styles.bellButton}
        title="Notificações"
      >
        <Bell size={24} />
        {unreadCount > 0 && (
          <span className={styles.badge}>{unreadCount > 9 ? '9+' : unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <div className={styles.dropdown}>
          <div className={styles.header}>
            <h3>Notificações</h3>
            {notifications.length > 0 && (
              <button onClick={clearAll} className={styles.clearBtn}>
                Limpar tudo
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className={styles.empty}>Nenhuma notificação</div>
          ) : (
            <ul className={styles.list}>
              {notifications.map(notif => (
                <li
                  key={notif.id}
                  className={`${styles.item} ${notif.status === 'READ' ? styles.read : ''}`}
                  style={{ borderLeftColor: priorityColors[notif.priority as keyof typeof priorityColors] || '#999' }}
                >
                  <div className={styles.content}>
                    <div className={styles.title}>{notif.title}</div>
                    <div className={styles.message}>{notif.message}</div>
                    <time className={styles.time}>
                      {new Date(notif.createdAt).toLocaleString('pt-BR')}
                    </time>
                  </div>
                  <div className={styles.actions}>
                    {notif.status !== 'READ' && (
                      <button
                        onClick={() => markAsRead(notif.id)}
                        className={styles.actionBtn}
                        title="Marcar como lida"
                      >
                        <Check size={16} />
                      </button>
                    )}
                    <button
                      onClick={() => deleteNotification(notif.id)}
                      className={styles.actionBtn}
                      title="Remover"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

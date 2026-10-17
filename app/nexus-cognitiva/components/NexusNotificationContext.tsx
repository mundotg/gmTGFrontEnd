"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { NexusNotification, createNotificationsWebSocket } from "../services/nexusApi";
import { getArticleUrl } from "../services/nexusUrl";

interface NexusNotificationContextType {
  notifications: NexusNotification[];
  unreadCount: number;
  activeToast: NexusNotification | null;
  isConnected: boolean;
  markAllAsRead: () => void;
  markAsRead: (id: string) => void;
  clearNotifications: () => void;
  clearAll: () => void;
  dismissToast: () => void;
}

const NexusNotificationContext = createContext<NexusNotificationContextType>({
  notifications: [],
  unreadCount: 0,
  activeToast: null,
  isConnected: false,
  markAllAsRead: () => {},
  markAsRead: () => {},
  clearNotifications: () => {},
  clearAll: () => {},
  dismissToast: () => {},
});

const STORAGE_KEY = "nexus_recent_notifications";

export const NexusNotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<NexusNotification[]>([]);
  const [activeToast, setActiveToast] = useState<NexusNotification | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Carregar histórico inicial do localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setNotifications(parsed);
        }
      }
    } catch {
      // Ignora falhas de parsing
    }
  }, []);

  // 2. Persistir no localStorage quando notifications mudar
  const persistNotifications = (items: NexusNotification[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, 30)));
    } catch {}
  };

  const dismissToast = useCallback(() => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
      toastTimerRef.current = null;
    }
    setActiveToast(null);
  }, []);

  const triggerToast = useCallback((notif: NexusNotification) => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    setActiveToast(notif);

    // Auto-dispensar após 9 segundos
    toastTimerRef.current = setTimeout(() => {
      setActiveToast(null);
      toastTimerRef.current = null;
    }, 9000);
  }, []);

  // 3. Conexão contínua com reconexão automática ao WebSocket de notificações
  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimer: NodeJS.Timeout | null = null;
    let isMounted = true;

    function connect() {
      if (!isMounted) return;

      ws = createNotificationsWebSocket({
        onOpen: () => {
          if (isMounted) setIsConnected(true);
        },
        onNotification: (notif) => {
          if (!isMounted) return;

          setNotifications((prev) => {
            // Evita duplicados
            if (prev.some((n) => n.id === notif.id)) return prev;
            const normalized = {
              ...notif,
              read: false,
              url: notif.action_url || notif.url || getArticleUrl(notif.post_id),
            };
            const updated = [normalized, ...prev].slice(0, 30);
            persistNotifications(updated);
            return updated;
          });

          // Dispara o Toast animado
          triggerToast(notif);
        },
        onClose: () => {
          if (isMounted) {
            setIsConnected(false);
            // Tenta reconectar após 4 segundos
            reconnectTimer = setTimeout(connect, 4000);
          }
        },
        onError: () => {
          if (isMounted) setIsConnected(false);
        },
      });
    }

    connect();

    return () => {
      isMounted = false;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (ws) {
        try {
          ws.close();
        } catch {}
      }
    };
  }, [triggerToast]);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => {
      const updated = prev.map((n) => ({ ...n, read: true }));
      persistNotifications(updated);
      return updated;
    });
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) => {
      const updated = prev.map((n) => (n.id === id ? { ...n, read: true } : n));
      persistNotifications(updated);
      return updated;
    });
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
    persistNotifications([]);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NexusNotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        activeToast,
        isConnected,
        markAllAsRead,
        markAsRead,
        clearNotifications,
        clearAll: clearNotifications,
        dismissToast,
      }}
    >
      {children}
    </NexusNotificationContext.Provider>
  );
};

export function useNexusNotifications() {
  return useContext(NexusNotificationContext);
}

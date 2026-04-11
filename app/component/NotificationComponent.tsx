"use client";
import { AlertCircle, CheckCircle, Info, X } from "lucide-react";
import React, { useCallback, useState, useRef, useEffect } from "react";
import { useI18n } from "@/context/I18nContext";

// ========================= TIPOS =========================
export type NotificationType = "error" | "warning" | "success" | "info";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: number;
  autoClose?: boolean;
}

// ========================= HOOKS =========================
export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const timeouts = useRef<Record<string, NodeJS.Timeout>>({});

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    if (timeouts.current[id]) {
      clearTimeout(timeouts.current[id]);
      delete timeouts.current[id];
    }
  }, []);

  const addNotification = useCallback(
    (
      type: NotificationType,
      title: string,
      message: string,
      autoClose: boolean = true,
      duration: number = 5000
    ) => {
      const id = `n-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const notification: Notification = {
        id,
        type,
        title,
        message,
        timestamp: Date.now(),
        autoClose,
      };

      setNotifications((prev) => [...prev, notification]);

      if (autoClose) {
        timeouts.current[id] = setTimeout(() => {
          removeNotification(id);
        }, duration);
      }

      return id;
    },
    [removeNotification]
  );

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
    Object.values(timeouts.current).forEach(clearTimeout);
    timeouts.current = {};
  }, []);

  // cleanup automático quando hook desmonta
  useEffect(() => {
    return () => {
      Object.values(timeouts.current).forEach(clearTimeout);
    };
  }, []);

  // Métodos de conveniência
  const notifyError = useCallback(
    (title: string, message: string, autoClose?: boolean) =>
      addNotification("error", title, message, autoClose),
    [addNotification]
  );

  const notifySuccess = useCallback(
    (title: string, message: string, autoClose?: boolean) =>
      addNotification("success", title, message, autoClose),
    [addNotification]
  );

  const notifyWarning = useCallback(
    (title: string, message: string, autoClose?: boolean) =>
      addNotification("warning", title, message, autoClose),
    [addNotification]
  );

  const notifyInfo = useCallback(
    (title: string, message: string, autoClose?: boolean) =>
      addNotification("info", title, message, autoClose),
    [addNotification]
  );

  return {
    notifications,
    addNotification,
    removeNotification,
    clearAllNotifications,
    notifyError,
    notifySuccess,
    notifyWarning,
    notifyInfo,
  };
}

// ========================= COMPONENTES =========================

interface NotificationItemProps {
  notification: Notification;
  onRemove: (id: string) => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({ notification, onRemove }) => {
  const { t } = useI18n();

  const getIcon = () => {
    switch (notification.type) {
      case "error":
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      case "success":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "warning":
        return <AlertCircle className="w-4 h-4 text-amber-600" />;
      case "info":
        return <Info className="w-4 h-4 text-blue-600" />;
    }
  };

  const getStyles = () => {
    switch (notification.type) {
      case "error":
        return "bg-red-50 border-red-200 text-red-800";
      case "success":
        return "bg-green-50 border-green-200 text-green-800";
      case "warning":
        return "bg-amber-50 border-amber-200 text-amber-800";
      case "info":
        return "bg-blue-50 border-blue-200 text-blue-800";
    }
  };

  return (
    <div
      className={`border rounded-lg p-3 shadow-sm ${getStyles()} transition-all duration-300 animate-in slide-in-from-right-5 fade-in zoom-in-95`}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5 bg-white p-1 rounded-full shadow-sm">
          {getIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-bold tracking-tight">{notification.title}</h4>
          <p className="text-xs mt-1 font-medium opacity-90 leading-relaxed">
            {notification.message}
          </p>
        </div>
        <button
          onClick={() => onRemove(notification.id)}
          className="flex-shrink-0 p-1.5 hover:bg-black/5 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-black/10"
          title={t("actions.close") || "Fechar"}
          aria-label={t("actions.close") || "Fechar"}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

interface NotificationContainerProps {
  notifications: Notification[];
  onRemove: (id: string) => void;
  onClearAll: () => void;
  className?: string;
  maxHeight?: string;
  showHeader?: boolean;
}

const NotificationContainer: React.FC<NotificationContainerProps> = ({
  notifications,
  onRemove,
  onClearAll,
  className = "",
  maxHeight = "max-h-48",
  showHeader = true,
}) => {
  const { t } = useI18n();
  
  if (notifications.length === 0) return null;

  return (
    <div className={`space-y-3 ${className}`}>
      {showHeader && (
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-gray-900">
            {t("notifications.title") || "Notificações"} ({notifications.length})
          </h4>
          {notifications.length > 1 && (
            <button
              onClick={onClearAll}
              className="text-xs font-semibold text-gray-500 hover:text-red-600 transition-colors"
            >
              {t("actions.clearAll") || "Limpar todas"}
            </button>
          )}
        </div>
      )}
      <div className={`space-y-2 ${maxHeight} overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-200`}>
        {notifications.map((notification) => (
          <NotificationItem key={notification.id} notification={notification} onRemove={onRemove} />
        ))}
      </div>
    </div>
  );
};

// ========================= COMPONENTE PRINCIPAL =========================
interface NotificationSystemProps {
  notifications: Notification[];
  onRemove: (id: string) => void;
  onClearAll: () => void;
  className?: string;
  maxHeight?: string;
  showHeader?: boolean;
  position?: "top" | "bottom" | "inline";
}

const NotificationSystem: React.FC<NotificationSystemProps> = ({
  notifications,
  onRemove,
  onClearAll,
  className = "",
  maxHeight = "max-h-48",
  showHeader = true,
  position = "inline",
}) => {
  if (notifications.length === 0) return null;

  const containerClasses = `
    ${position === "top" ? "fixed top-4 right-4 z-[9999] w-80 sm:w-96" : ""}
    ${position === "bottom" ? "fixed bottom-4 right-4 z-[9999] w-80 sm:w-96" : ""}
    ${position === "inline" ? "" : ""}
    ${className}
  `;

  return (
    <NotificationContainer
      notifications={notifications}
      onRemove={onRemove}
      onClearAll={onClearAll}
      className={containerClasses}
      maxHeight={maxHeight}
      showHeader={showHeader}
    />
  );
};

// ========================= EXPORTS =========================
export { NotificationItem, NotificationContainer, NotificationSystem };
export default NotificationSystem;
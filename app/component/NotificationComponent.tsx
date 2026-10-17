"use client";
import { AlertCircle, CheckCircle, Info, AlertTriangle, X } from "lucide-react";
import React, { useCallback, useState, useRef, useEffect, memo } from "react";
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
      duration: number = 4000
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

const NotificationItem: React.FC<NotificationItemProps> = memo(({ notification, onRemove }) => {
  const { t } = useI18n();

  const config = {
    error: {
      icon: <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />,
      style: "bg-red-50/95 border-red-200/90 text-red-900 shadow-xs",
    },
    success: {
      icon: <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />,
      style: "bg-emerald-50/95 border-emerald-200/90 text-emerald-900 shadow-xs",
    },
    warning: {
      icon: <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />,
      style: "bg-amber-50/95 border-amber-200/90 text-amber-900 shadow-xs",
    },
    info: {
      icon: <Info className="w-4 h-4 text-blue-600 flex-shrink-0" />,
      style: "bg-blue-50/95 border-blue-200/90 text-blue-900 shadow-xs",
    },
  }[notification.type] || {
    icon: <Info className="w-4 h-4 text-blue-600 flex-shrink-0" />,
    style: "bg-blue-50/95 border-blue-200/90 text-blue-900 shadow-xs",
  };

  return (
    <div
      className={`border rounded-xl p-2.5 sm:p-3 shadow-md backdrop-blur-xs ${config.style} transition-all duration-200 animate-in fade-in slide-in-from-bottom-2 sm:slide-in-from-right-3 pointer-events-auto`}
      role="alert"
      aria-label={"notificação-component: " + notification.title}
    >
      <div className="flex items-start gap-2.5">
        <div className="p-1 rounded-lg bg-white/90 shadow-2xs mt-0.5 flex-shrink-0">
          {config.icon}
        </div>
        <div className="flex-1 min-w-0 pr-1">
          <h4 className="text-xs sm:text-sm font-bold tracking-tight text-gray-900 truncate">
            {notification.title}
          </h4>
          {notification.message && (
            <p className="text-[11px] sm:text-xs mt-0.5 text-gray-700 font-medium leading-relaxed break-words line-clamp-3">
              {notification.message}
            </p>
          )}
        </div>
        <button
          onClick={() => onRemove(notification.id)}
          className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-700 hover:bg-black/5 rounded-md transition-colors"
          title={t("actions.close") || "Fechar"}
          aria-label={t("actions.close") || "Fechar"}
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
});

NotificationItem.displayName = "NotificationItem";

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
  maxHeight = "max-h-72",
  showHeader = false,
}) => {
  const { t } = useI18n();

  if (notifications.length === 0) return null;

  return (
    <div className={`flex flex-col gap-2 w-full ${className}`} arial-label={"Notificações"}>
      {showHeader && notifications.length > 1 && (
        <div className="flex items-center justify-between px-1 pointer-events-auto">
          <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
            {t("notifications.title") || "Notificações"} ({notifications.length})
          </span>
          <button
            onClick={onClearAll}
            className="text-[11px] font-semibold text-gray-500 hover:text-red-600 transition-colors bg-white/80 px-2 py-0.5 rounded-full border border-gray-200 shadow-2xs"
          >
            {t("actions.clearAll") || "Limpar todas"}
          </button>
        </div>
      )}
      <div className={`flex flex-col gap-2 ${maxHeight} overflow-y-auto pr-0.5 scrollbar-thin scrollbar-thumb-gray-200`}>
        {notifications.map((notification) => (
          <NotificationItem key={notification.id} notification={notification} onRemove={onRemove} />
        ))}
      </div>
      {!showHeader && notifications.length > 1 && (
        <div className="flex justify-end pointer-events-auto">
          <button
            onClick={onClearAll}
            className="text-[11px] font-semibold text-gray-600 hover:text-red-600 transition-colors bg-white/90 hover:bg-white px-2.5 py-1 rounded-full border border-gray-200/90 shadow-xs"
          >
            {t("actions.clearAll") || "Limpar todas"} ({notifications.length})
          </button>
        </div>
      )}
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
  position?: "top" | "bottom" | "top-right" | "bottom-right" | "inline";
}

const NotificationSystem: React.FC<NotificationSystemProps> = ({
  notifications,
  onRemove,
  onClearAll,
  className = "",
  maxHeight = "max-h-72",
  showHeader = false,
  position = "bottom-right",
}) => {
  if (notifications.length === 0) return null;

  const getPositionClasses = () => {
    switch (position) {
      case "bottom-right":
      case "bottom":
        return "fixed bottom-3 inset-x-3 sm:inset-x-auto sm:right-4 sm:bottom-4 sm:w-96 z-[9999] pointer-events-none";
      case "top-right":
      case "top":
        return "fixed top-3 inset-x-3 sm:inset-x-auto sm:right-4 sm:top-4 sm:w-96 z-[9999] pointer-events-none";
      case "inline":
      default:
        return "w-full";
    }
  };

  return (
    <div className={`${getPositionClasses()} ${className}`}>
      <NotificationContainer
        notifications={notifications}
        onRemove={onRemove}
        onClearAll={onClearAll}
        maxHeight={maxHeight}
        showHeader={showHeader}
      />
    </div>
  );
};

// ========================= EXPORTS =========================
export { NotificationItem, NotificationContainer, NotificationSystem };
export default NotificationSystem;
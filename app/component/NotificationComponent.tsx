import { AlertCircle, CheckCircle, Info, X } from "lucide-react";
import React, { useCallback, useState, useRef, useEffect } from "react";

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

interface NotificationItemProps {
  notification: Notification;
  onRemove: (id: string) => void;
}


// ========================= COMPONENTES =========================

interface NotificationItemProps {
    notification: Notification;
    onRemove: (id: string) => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({ notification, onRemove }) => {
    const getIcon = () => {
        switch (notification.type) {
            case 'error': return <AlertCircle className="w-4 h-4 text-red-600" />;
            case 'success': return <CheckCircle className="w-4 h-4 text-green-600" />;
            case 'warning': return <AlertCircle className="w-4 h-4 text-orange-600" />;
            case 'info': return <Info className="w-4 h-4 text-blue-600" />;
        }
    };

    const getStyles = () => {
        switch (notification.type) {
            case 'error': return 'bg-red-50 border-red-200 text-red-800';
            case 'success': return 'bg-green-50 border-green-200 text-green-800';
            case 'warning': return 'bg-orange-50 border-orange-200 text-orange-800';
            case 'info': return 'bg-blue-50 border-blue-200 text-blue-800';
        }
    };

    return (
        <div className={`border rounded-lg p-3 ${getStyles()} transition-all duration-300 animate-in slide-in-from-right-5`}>
            <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                    {getIcon()}
                </div>
                <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium">{notification.title}</h4>
                    <p className="text-sm mt-1 opacity-90">{notification.message}</p>
                </div>
                <button
                    onClick={() => onRemove(notification.id)}
                    className="flex-shrink-0 p-1 hover:bg-black/5 rounded transition-colors"
                    title="Fechar notificação"
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
    showHeader = true
}) => {
    if (notifications.length === 0) return null;

    return (
        <div className={`space-y-2 ${className}`}>
            {showHeader && (
                <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-gray-700">
                        Notificações ({notifications.length})
                    </h4>
                    {notifications.length > 1 && (
                        <button
                            onClick={onClearAll}
                            className="text-xs text-gray-500 hover:text-gray-700 underline transition-colors"
                        >
                            Limpar todas
                        </button>
                    )}
                </div>
            )}
            <div className={`space-y-2 ${maxHeight} overflow-y-auto`}>
                {notifications.map(notification => (
                    <NotificationItem
                        key={notification.id}
                        notification={notification}
                        onRemove={onRemove}
                    />
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
    position?: 'top' | 'bottom' | 'inline';
}

const NotificationSystem: React.FC<NotificationSystemProps> = ({
    notifications,
    onRemove,
    onClearAll,
    className = "",
    maxHeight = "max-h-48",
    showHeader = true,
    position = 'inline'
}) => {
    if (notifications.length === 0) return null;

    const containerClasses = `
    ${position === 'top' ? 'fixed top-4 right-4 z-50 w-80' : ''}
    ${position === 'bottom' ? 'fixed bottom-4 right-4 z-50 w-80' : ''}
    ${position === 'inline' ? '' : ''}
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
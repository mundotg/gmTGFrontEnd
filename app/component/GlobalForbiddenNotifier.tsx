"use client";

import React, { useEffect, useState, useCallback } from "react";
import { ShieldAlert, X } from "lucide-react";
import { ForbiddenEventPayload, onForbidden } from "@/context/forbiddenEvents";

interface ToastItem extends ForbiddenEventPayload {
  id: string;
}

export default function GlobalForbiddenNotifier() {
  const [alerts, setAlerts] = useState<ToastItem[]>([]);

  const removeAlert = useCallback((id: string) => {
    setAlerts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  useEffect(() => {
    const unsubscribe = onForbidden((payload) => {
      const id = payload.id || `forbidden-${Date.now()}`;
      const item: ToastItem = {
        ...payload,
        id,
      };

      setAlerts((prev) => {
        // Limita a no máximo 3 notificações visíveis
        const updated = [item, ...prev.filter((p) => p.message !== payload.message)];
        return updated.slice(0, 3);
      });

      // Fecha automaticamente após 7 segundos
      setTimeout(() => {
        removeAlert(id);
      }, 7000);
    });

    return unsubscribe;
  }, [removeAlert]);

  if (alerts.length === 0) return null;

  return (
    <div
      aria-live="assertive"
      className="fixed top-5 right-5 z-[999999] flex flex-col gap-2.5 max-w-md w-full pointer-events-none px-4 sm:px-0"
    >
      {alerts.map((alert) => (
        <div
          key={alert.id}
          className="pointer-events-auto bg-white/95 dark:bg-[#1C1C1E]/95 backdrop-blur-md border border-amber-300/80 dark:border-amber-700/80 border-l-4 border-l-amber-500 rounded-xl p-4 shadow-2xl flex items-start gap-3.5 transition-all duration-300 animate-in slide-in-from-right-4 fade-in"
          role="alert"
        >
          <div className="flex-shrink-0 p-2 bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 rounded-lg">
            <ShieldAlert className="w-5 h-5" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                Acesso Não Permitido
              </h4>
              <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 tracking-wide uppercase">
                403 Forbidden
              </span>
            </div>

            <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed font-medium">
              {alert.message}
            </p>

            {alert.url && (
              <div className="mt-2 text-[11px] text-gray-400 dark:text-gray-500 font-mono truncate">
                {alert.method ? `${alert.method} ` : ""}
                {alert.url}
              </div>
            )}
          </div>

          <button
            onClick={() => removeAlert(alert.id)}
            className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
            aria-label="Fechar notificação"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}

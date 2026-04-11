"use client";
import { SavedConnection } from "@/types";
import { Power, Plug } from "lucide-react";
import React from "react";
import { useI18n } from "@/context/I18nContext";

interface ConnectionToggleButtonProps {
  connection: SavedConnection;
  onConnect: (connection_id: string) => void;
  onDisconnect: (connection_id: string) => void;
  titleConnect?: string;
  titleDisconnect?: string;
  className?: string;
  iconConnect?: React.ReactNode;
  iconDisconnect?: React.ReactNode;
}

export const ConnectionToggleButton: React.FC<ConnectionToggleButtonProps> = ({
  connection,
  onConnect,
  onDisconnect,
  titleConnect,
  titleDisconnect,
  className,
  iconConnect = <Plug className="w-4 h-4" />,
  iconDisconnect = <Power className="w-4 h-4" />,
}) => {
  const { t } = useI18n();
  const isConnected = connection.status === "connected";
  
  const action = isConnected ? onDisconnect : onConnect;
  
  // Resolve os títulos com fallback seguro para i18n
  const resolvedTitleConnect = titleConnect || t("actions.connect") || "Conectar";
  const resolvedTitleDisconnect = titleDisconnect || t("actions.disconnect") || "Desconectar";
  const title = isConnected ? resolvedTitleDisconnect : resolvedTitleConnect;
  
  const icon = isConnected ? iconDisconnect : iconConnect;

  // Aplica o Padrão Oficial baseado no estado, caso nenhuma classe customizada seja forçada via props
  const defaultClassName = isConnected
    ? "p-1.5 text-amber-500 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500/50"
    : "p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/50";

  return (
    <button
      onClick={() => action(connection.id)}
      className={className || defaultClassName}
      title={title}
      aria-label={title}
    >
      {icon}
    </button>
  );
};
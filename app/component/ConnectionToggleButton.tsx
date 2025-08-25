import { SavedConnection } from "@/types";
import { Power, Plug } from "lucide-react";
import React from "react";

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
  titleConnect = "Conectar",
  titleDisconnect = "Desconectar",
  className = "p-1 text-blue-600 hover:bg-blue-50 rounded",
  iconConnect = <Plug className="w-4 h-4" />,
  iconDisconnect = <Power className="w-4 h-4" />,
}) => {
  const isConnected = connection.status === "connected";
  const action = isConnected ? onDisconnect : onConnect;
  const title = isConnected ? titleDisconnect : titleConnect;
  const icon = isConnected ? iconDisconnect : iconConnect;

  return (
    <button
      onClick={() => action(connection.id)}
      className={className}
      title={title}
    >
      {icon}
    </button>
  );
};

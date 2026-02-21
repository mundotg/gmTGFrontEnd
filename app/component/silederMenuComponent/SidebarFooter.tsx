"use client";
import { Usuario } from "@/context/SessionContext";
import { User, LogOut, Database, AlertCircle } from "lucide-react";
import { useState, useMemo, useCallback } from "react";

// Tipagem do SidebarFooter
interface SidebarFooterProps {
  collapsed: boolean;
  user: Usuario | null;
  onLogout: () => void;
}

// Hook para gerenciar tooltip
interface UseTooltipReturn {
  showTooltip: boolean;
  handleMouseEnter: () => void;
  handleMouseLeave: () => void;
}

const useTooltip = (delay: number = 500): UseTooltipReturn => {
  const [showTooltip, setShowTooltip] = useState<boolean>(false);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout>();

  const handleMouseEnter = useCallback(() => {
    const id = setTimeout(() => setShowTooltip(true), delay);
    setTimeoutId(id);
  }, [delay]);

  const handleMouseLeave = useCallback(() => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      setTimeoutId(undefined);
    }
    setShowTooltip(false);
  }, [timeoutId]);

  return { showTooltip, handleMouseEnter, handleMouseLeave };
};

// Tipagem do Tooltip
interface TooltipProps {
  children: React.ReactNode;
  content: string;
}

const Tooltip = ({ children, content }: TooltipProps) => {
  const { showTooltip, handleMouseEnter, handleMouseLeave } = useTooltip();

  return (
    <div
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg whitespace-nowrap z-50 shadow-lg pointer-events-none">
          {content}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
        </div>
      )}
    </div>
  );
};

// Tipagem do UserAvatar
interface UserAvatarProps {
  user: Usuario | null;
  size?: "small" | "large";
  showStatus?: boolean;
}

const UserAvatar = ({
  user,
  size = "large",
  showStatus = true
}: UserAvatarProps) => {
  const isConnected = Boolean(user?.info_extra?.name_db);
  const avatarSize = size === "large" ? "w-10 h-10" : "w-8 h-8";
  const iconSize = size === "large" ? "w-5 h-5" : "w-4 h-4";

  const avatarColor = useMemo<string>(() => {
    if (!user?.nome) return "from-gray-400 to-gray-500";

    const colors: string[] = [
      "from-blue-400 to-blue-500",
      "from-green-400 to-green-500",
      "from-purple-400 to-purple-500",
      "from-pink-400 to-pink-500",
      "from-yellow-400 to-yellow-500",
      "from-red-400 to-red-500",
      "from-indigo-400 to-indigo-500",
      "from-teal-400 to-teal-500"
    ];

    const hash = user.nome.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    return colors[hash % colors.length];
  }, [user?.nome]);

  return (
    <div className="relative">
      <div className={`${avatarSize} bg-gradient-to-br ${avatarColor} rounded-full flex items-center justify-center flex-shrink-0 shadow-md`}>
        <User className={`${iconSize} text-white`} />
      </div>
      {showStatus && (
        <div className={`absolute -bottom-0.5 -right-0.5 ${size === "large" ? "w-3 h-3" : "w-2.5 h-2.5"} rounded-full border-2 border-white shadow-sm ${isConnected ? "bg-green-500" : "bg-red-500"
          }`} />
      )}
    </div>
  );
};

// Tipagem do ConnectionStatus
interface ConnectionStatusProps {
  user: Usuario | null;
  collapsed?: boolean;
}

const ConnectionStatus = ({ user, collapsed = false }: ConnectionStatusProps) => {
  const isConnected = Boolean(user?.info_extra?.name_db);
  const dbName = user?.info_extra?.name_db;

  if (collapsed) {
    return (
      <Tooltip content={isConnected ? `Conectado: ${dbName}` : "Nenhuma conexão ativa"}>
        <div className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"} shadow-sm`} />
      </Tooltip>
    );
  }

  return (
    <div className="flex items-center space-x-2 min-w-0">
      {isConnected ? (
        <Database className="w-3 h-3 text-green-600 flex-shrink-0" />
      ) : (
        <AlertCircle className="w-3 h-3 text-red-500 flex-shrink-0" />
      )}
      <div className="min-w-0 flex-1">
        <p className={`text-xs truncate ${isConnected ? "text-green-600" : "text-red-500"}`}>
          {isConnected ? dbName : "Nenhuma conexão ativa"}
        </p>
      </div>
    </div>
  );
};

type LogoutEvent = React.MouseEvent<HTMLButtonElement> | React.KeyboardEvent<HTMLDivElement>;

export function SidebarFooter({ collapsed, user, onLogout }: SidebarFooterProps) {
  // Handlers memoizados
  const handleLogout = useCallback((e: LogoutEvent) => {
    e.preventDefault();
    e.preventDefault();
    if (window.confirm("Tem certeza que deseja sair?")) {
      onLogout();
    }
  }, [onLogout]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleLogout(e as unknown as LogoutEvent);
    }
  }, [handleLogout]);

  // Nome do usuário com fallback
  const displayName = useMemo(() => {
    if (!user?.nome) return "Usuário";

    // Se o nome for muito longo, mostrar apenas o primeiro nome
    const names = user.nome.trim().split(" ");
    return names.length > 1 && names[0].length > 12 ? names[0] : user.nome;
  }, [user?.nome]);

  // Informações da sessão
  const sessionInfo = useMemo(() => {
    if (!user) return null;

    return {
      tipoUsuario: user.cargo || "Usuário",
      tempoSessao: user.datatimeSession ? new Date(user.datatimeSession).toLocaleString('pt-BR') : null,
      dbInfo: user.info_extra ? {
        name: user.info_extra.name_db,
        type: user.info_extra.type,
        tabelas: user.info_extra.num_table,
        consultas: user.info_extra.num_consultas,
        registros: user.info_extra.registros_analizados
      } : null
    };
  }, [user]);

  if (!user) {
    return (
      <div className="absolute bottom-0 left-0 right-0 border-t bg-white p-4">
        <div className="flex items-center justify-center">
          <p className="text-sm text-gray-500">Carregando...</p>
        </div>
      </div>
    );
  }

  if (collapsed) {
    const tooltipContent = `${displayName} (${sessionInfo?.tipoUsuario})
${user.email}
${sessionInfo?.dbInfo ? `DB: ${sessionInfo.dbInfo.name} (${sessionInfo.dbInfo.type})` : 'Sem conexão ativa'}`;

    return (
      <div className="absolute bottom-0 left-0 right-0 border-t bg-white p-4">
        <div className="flex flex-col items-center space-y-3">
          <Tooltip content={tooltipContent}>
            <UserAvatar user={user} size="small" showStatus={false} />
          </Tooltip>

          <ConnectionStatus user={user} collapsed />

          <Tooltip content="Sair da aplicação">
            <button
              onClick={handleLogout}
              onKeyDown={handleKeyDown}
              className="p-1.5 rounded-lg hover:bg-red-50 hover:text-red-600 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              aria-label="Logout"
              tabIndex={0}
            >
              <LogOut className="w-3.5 h-3.5 text-gray-500 hover:text-red-600" />
            </button>
          </Tooltip>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute bottom-0 left-0 right-0 border-t bg-white p-4">
      <div className="flex items-center space-x-3">
        <UserAvatar user={user} size="large" />

        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <p className="text-sm font-medium truncate text-gray-900">
              {displayName}
            </p>
            <Tooltip content={`${user.email} • ${sessionInfo?.tipoUsuario} • Sessão: ${sessionInfo?.tempoSessao || 'N/A'}`}>
              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full flex-shrink-0" />
            </Tooltip>
          </div>

          <div className="mt-1">
            <ConnectionStatus user={user} />
          </div>

          {/* Informações adicionais da base de dados */}
          {sessionInfo?.dbInfo && (
            <div className="mt-1 text-xs text-gray-500">
              {sessionInfo.dbInfo.tabelas} tabelas • {sessionInfo.dbInfo.consultas} consultas
              {sessionInfo.dbInfo.registros && (
                <span> • {sessionInfo.dbInfo.registros} registros</span>
              )}
            </div>
          )}
        </div>

        <Tooltip content="Sair da aplicação">
          <button
            onClick={handleLogout}
            onKeyDown={handleKeyDown}
            className="p-2 rounded-lg hover:bg-red-50 hover:text-red-600 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 group"
            aria-label="Logout"
            tabIndex={0}
          >
            <LogOut className="w-4 h-4 text-gray-500 group-hover:text-red-600 transition-colors" />
          </button>
        </Tooltip>
      </div>
    </div>
  );
}
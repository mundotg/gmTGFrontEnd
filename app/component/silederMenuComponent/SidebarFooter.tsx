"use client";

// ─────────────────────────────────────────────────────────────
// Imports
// ─────────────────────────────────────────────────────────────
import {
  User,
  LogOut,
  Database,
  AlertCircle,
  Settings,
  Bell,
  HelpCircle,
  ChevronUp,
  LucideIcon,
} from "lucide-react";
import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import { Usuario } from "@/types";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export interface SidebarFooterProps {
  collapsed: boolean;
  user: Usuario | null;
  onLogout: () => void;
  /** Permissions the current user holds (e.g. ["user:manage", "admin"]) */
  userPermissions?: string[];
}

/** A single item in the footer action menu */
interface MenuOption {
  id: string;
  /** i18n key or plain label */
  label: string;
  icon: LucideIcon;
  href: string;
  /** If set, the item is only shown when the user has this permission */
  permission?: string;
  /** If true, item is only shown when a DB connection is active */
  requiresConnection: boolean;
}

interface UseTooltipReturn {
  showTooltip: boolean;
  handleMouseEnter: () => void;
  handleMouseLeave: () => void;
}

// ─────────────────────────────────────────────────────────────
// Menu Options Configuration
// ─────────────────────────────────────────────────────────────

/**
 * Add, remove, or reorder items here.
 * Each entry is rendered in the pop-up menu above the footer.
 */
const MENU_OPTIONS: MenuOption[] = [
  {
    id: "settings",
    label: "Configurações",
    icon: Settings,
    href: "/home/configuracao",
    permission: "user:manage",
    requiresConnection: false,
  },
  // {
  //   id: "notifications",
  //   label: "Notificações",
  //   icon: Bell,
  //   href: "/home/notificacoes",
  //   requiresConnection: false,
  // },
  // {
  //   id: "help",
  //   label: "Ajuda & Suporte",
  //   icon: HelpCircle,
  //   href: "/home/ajuda",
  //   requiresConnection: false,
  // },

];

// ─────────────────────────────────────────────────────────────
// Hooks
// ─────────────────────────────────────────────────────────────

const useTooltip = (delay = 500): UseTooltipReturn => {
  const [showTooltip, setShowTooltip] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseEnter = useCallback(() => {
    timeoutRef.current = setTimeout(() => setShowTooltip(true), delay);
  }, [delay]);

  const handleMouseLeave = useCallback(() => {
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
    }
    setShowTooltip(false);
  }, []);

  return { showTooltip, handleMouseEnter, handleMouseLeave };
};

// ─────────────────────────────────────────────────────────────
// Small reusable components
// ─────────────────────────────────────────────────────────────

const Tooltip = ({
  children,
  content,
}: {
  children: React.ReactNode;
  content: string;
}) => {
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

// ─────────────────────────────────────────────────────────────

const UserAvatar = ({
  user,
  size = "large",
  showStatus = true,
}: {
  user: Usuario | null;
  size?: "small" | "large";
  showStatus?: boolean;
}) => {
  const isConnected = Boolean(user?.info_extra?.name_db);

  const avatarSize = size === "large" ? "w-10 h-10" : "w-8 h-8";
  const iconSize = size === "large" ? "w-5 h-5" : "w-4 h-4";
  const dotSize = size === "large" ? "w-3 h-3" : "w-2.5 h-2.5";

  const avatarColor = useMemo(() => {
    if (!user?.nome) return "from-gray-400 to-gray-500";
    const palette = [
      "from-blue-400 to-blue-500",
      "from-green-400 to-green-500",
      "from-purple-400 to-purple-500",
      "from-pink-400 to-pink-500",
      "from-yellow-400 to-yellow-500",
      "from-red-400 to-red-500",
      "from-indigo-400 to-indigo-500",
      "from-teal-400 to-teal-500",
    ];
    const hash = user.nome.split("").reduce((a, b) => a + b.charCodeAt(0), 0);
    return palette[hash % palette.length];
  }, [user?.nome]);

  return (
    <div className="relative">
      <div
        className={`${avatarSize} bg-gradient-to-br ${avatarColor} rounded-full flex items-center justify-center flex-shrink-0 shadow-md`}
      >
        <User className={`${iconSize} text-white`} />
      </div>

      {showStatus && (
        <div
          className={`absolute -bottom-0.5 -right-0.5 ${dotSize} rounded-full border-2 border-white shadow-sm ${isConnected ? "bg-green-500" : "bg-red-500"
            }`}
        />
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────

const ConnectionStatus = ({
  user,
  collapsed = false,
}: {
  user: Usuario | null;
  collapsed?: boolean;
}) => {
  const isConnected = Boolean(user?.info_extra?.name_db);
  const dbName = user?.info_extra?.name_db;

  if (collapsed) {
    return (
      <Tooltip content={isConnected ? `Conectado: ${dbName}` : "Nenhuma conexão ativa"}>
        <div
          className={`w-2 h-2 rounded-full shadow-sm ${isConnected ? "bg-green-500" : "bg-red-500"
            }`}
        />
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
      <p
        className={`text-xs truncate ${isConnected ? "text-green-600" : "text-red-500"
          }`}
      >
        {isConnected ? dbName : "Nenhuma conexão ativa"}
      </p>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// Menu pop-up (appears above the footer when open)
// ─────────────────────────────────────────────────────────────

const FooterMenu = ({
  open,
  onClose,
  user,
  userPermissions = [],
  onLogout,
}: {
  open: boolean;
  onClose: () => void;
  user: Usuario | null;
  userPermissions?: string[];
  onLogout: () => void;
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const isConnected = Boolean(user?.info_extra?.name_db);

  // Close when clicking outside
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, onClose]);

  /** Filter options based on connection state and permissions */
  const visibleOptions = useMemo(
    () =>
      MENU_OPTIONS.filter((opt) => {
        if (opt.requiresConnection && !isConnected) return false;
        if (opt.permission && !userPermissions.includes(opt.permission))
          return false;
        return true;
      }),
    [isConnected, userPermissions]
  );

  if (!open) return null;

  return (
    <div
      ref={menuRef}
      className="absolute bottom-full left-0 right-0 mb-1 mx-2 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-bottom-2 duration-150"
    >
      {/* Options */}
      <nav className="py-1">
        {visibleOptions.map((opt) => {
          const Icon = opt.icon;
          return (
            <Link
              key={opt.id}
              href={opt.href}
              onClick={onClose}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
            >
              <Icon className="w-4 h-4 text-gray-500 flex-shrink-0" />
              {opt.label}
            </Link>
          );
        })}
      </nav>

      {/* Divider + Logout */}
      <div className="border-t border-gray-100">
        <button
          onClick={() => {
            onClose();
            if (window.confirm("Tem certeza que deseja sair?")) onLogout();
          }}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          Sair da aplicação
        </button>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────

export function SidebarFooter({
  collapsed,
  user,
  onLogout,
  userPermissions = [],
}: SidebarFooterProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  // ── Derived data ──────────────────────────────────────────

  const displayName = useMemo(() => {
    if (!user?.nome) return "Usuário";
    const parts = user.nome.trim().split(" ");
    return parts.length > 1 && parts[0].length > 12 ? parts[0] : user.nome;
  }, [user?.nome]);

  const sessionInfo = useMemo(() => {
    if (!user) return null;
    return {
      role: user.cargo?.descricao || "Usuário",
      sessionStart: user.datatimeSession
        ? new Date(user.datatimeSession).toLocaleString("pt-BR")
        : null,
      db: user.info_extra
        ? {
          name: user.info_extra.name_db,
          type: user.info_extra.type,
          tables: user.info_extra.num_table,
          queries: user.info_extra.num_consultas,
          records: user.info_extra.registros_analizados,
        }
        : null,
    };
  }, [user]);

  // ── Handlers ──────────────────────────────────────────────

  const toggleMenu = useCallback(() => setMenuOpen((v) => !v), []);
  const closeMenu = useCallback(() => setMenuOpen(false), []);

  const handleLogout = useCallback(() => {
    if (window.confirm("Tem certeza que deseja sair?")) onLogout();
  }, [onLogout]);

  // ── Loading state ─────────────────────────────────────────

  if (!user) {
    return (
      <div className="absolute bottom-0 left-0 right-0 border-t bg-white p-4">
        <div className="flex items-center justify-center">
          <p className="text-sm text-gray-500">Carregando...</p>
        </div>
      </div>
    );
  }

  // ── Collapsed view ────────────────────────────────────────

  if (collapsed) {
    const tooltipContent = [
      `${displayName} (${sessionInfo?.role})`,
      user.email,
      sessionInfo?.db
        ? `DB: ${sessionInfo.db.name} (${sessionInfo.db.type})`
        : "Sem conexão ativa",
    ].join("\n");

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
              className="p-1.5 rounded-lg hover:bg-red-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              aria-label="Logout"
            >
              <LogOut className="w-3.5 h-3.5 text-gray-500 hover:text-red-600" />
            </button>
          </Tooltip>
        </div>
      </div>
    );
  }

  // ── Expanded view ─────────────────────────────────────────

  return (
    <div className="absolute bottom-0 left-0 right-0 border-t bg-white">
      {/* Pop-up menu */}
      <FooterMenu
        open={menuOpen}
        onClose={closeMenu}
        user={user}
        userPermissions={userPermissions}
        onLogout={onLogout}
      />

      {/* Footer row — click to open/close menu */}
      <button
        onClick={toggleMenu}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-inset focus:ring-2 focus:ring-blue-500"
        aria-expanded={menuOpen}
        aria-haspopup="menu"
      >
        {/* Avatar */}
        <UserAvatar user={user} size="large" />

        {/* User info */}
        <div className="flex-1 min-w-0 text-left">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium truncate text-gray-900">
              {displayName}
            </p>
            {sessionInfo?.role && (
              <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded-full truncate max-w-[80px]">
                {sessionInfo.role}
              </span>
            )}
          </div>

          <ConnectionStatus user={user} />

          {sessionInfo?.db && (
            <p className="mt-0.5 text-xs text-gray-400">
              {sessionInfo.db.tables} tabelas · {sessionInfo.db.queries} consultas
              {sessionInfo.db.records && ` · ${sessionInfo.db.records} registros`}
            </p>
          )}
        </div>

        {/* Chevron indicator */}
        <ChevronUp
          className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-200 ${menuOpen ? "rotate-180" : ""
            }`}
        />
      </button>
    </div>
  );
}
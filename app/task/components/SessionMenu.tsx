import React, { useState, useRef, useEffect } from 'react';
import { LogOut, Settings, ChevronDown } from 'lucide-react';
import { Usuario } from '@/types';


interface SessionMenuProps {
  user: Usuario | null;
  onLogout: (redirect?: string | null) => void;
  onSettings?: () => void;
}

export const SessionMenu: React.FC<SessionMenuProps> = ({
  user,
  onLogout,
  onSettings
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // 1. Melhoria: Fecha o menu também ao apertar a tecla 'Escape' (Acessibilidade)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  // 2. Melhoria: Pega a 1ª letra do primeiro nome e a 1ª do último (Ex: "João Silva" -> "JS" em vez de "JO")
  const getInitials = (name?: string) => {
    if (!name) return 'US';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 0) return 'US';
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  // 3. Melhoria (Bug Fix): Extrai a Role de forma segura (lembra que atualizamos o backend para user.roles?)
  // Isso previne que o React quebre tentando renderizar um objeto.
  const primaryRole = user?.roles?.[0]?.name || user?.cargo?.position || 'Usuário';
  const roleName = typeof primaryRole === 'string' ? primaryRole : 'Usuário';

  const getRoleBadgeColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin':
      case 'administrador':
        return 'bg-purple-100 text-purple-800';
      case 'manager':
      case 'gerente':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        aria-label="Menu do usuário"
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold shadow-md"
            aria-hidden="true"
          >
            {getInitials(user?.nome)}
          </div>
          <div className="hidden sm:block text-left">
            {/* 4. Melhoria: truncate e max-w previnem que o layout quebre com nomes/emails gigantes */}
            <p className="text-sm font-medium text-gray-900 truncate max-w-[150px]">
              {user?.nome || 'Usuário'}
            </p>
            {user?.email && (
              <p className="text-xs text-gray-500 truncate max-w-[150px]" title={user.email}>
                {user.email}
              </p>
            )}
          </div>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isOpen ? 'transform rotate-180' : ''
            }`}
        />
      </button>

      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200"
          role="menu"
        >
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-medium text-gray-900 truncate" title={user?.nome || ''}>
              {user?.nome || 'Usuário'}
            </p>
            {user?.email && (
              <p className="text-xs text-gray-500 mt-1 truncate" title={user.email}>
                {user.email}
              </p>
            )}

            {/* Renderiza a Badge corretamente com o texto limpo */}
            <span className={`inline-block mt-2 px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(roleName)}`}>
              {roleName}
            </span>
          </div>

          <div className="py-1">
            {onSettings && (
              <button
                onClick={() => {
                  setIsOpen(false);
                  onSettings();
                }}
                // 5. Melhoria: Usando 'group' para o ícone mudar de cor junto com o texto no hover
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600 flex items-center gap-3 transition-colors duration-150 group"
                role="menuitem"
              >
                <Settings className="w-4 h-4 text-gray-500 group-hover:text-blue-600 transition-colors" />
                Configurações
              </button>
            )}

            <button
              onClick={() => {
                setIsOpen(false);
                onLogout();
              }}
              className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors duration-150 group"
              role="menuitem"
            >
              <LogOut className="w-4 h-4 text-red-500 group-hover:text-red-600 transition-colors" />
              Sair
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
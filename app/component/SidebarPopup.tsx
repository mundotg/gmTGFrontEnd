// components/SidebarPopup.tsx
"use client";
import { useI18n } from '@/context/I18nContext';
import {
  Database, TableProperties, Search, History,
  TrendingUp, ChevronLeft, ChevronRight, Settings, Bell, User, LogOut, HelpCircle,
  Sun, Moon, Maximize2, Minimize2
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect, useCallback, useMemo } from 'react';

// Tipos para melhor tipagem
interface SidebarItem {
  id: string;
  label: string;
  icon: React.ElementType;
  badge?: string;
  href: string;
  notifications?: number;
  disabled?: boolean;
}

interface BadgeData {
  num_table: number;
  num_consultas: number;
  registros_analizados: number;
}

const sidebarItems: SidebarItem[] = [
  { 
    id: 'tables', 
    label: 'sidebar.tables', 
    icon: TableProperties, 
    badge: 'num_table', 
    href: '/home/tabelas' 
  },
  { 
    id: 'query', 
    label: 'sidebar.query', 
    icon: Search, 
    badge: 'num_consultas', 
    href: '/home/consultas' 
  },
  { 
    id: 'history', 
    label: 'sidebar.history', 
    icon: History, 
    badge: 'registros_analizados', 
    href: '/home/historico' 
  },
  { 
    id: 'analysis', 
    label: 'sidebar.analysis', 
    icon: TrendingUp, 
    href: '/home/analizar' 
  },
];

const userMenuItems = [
  { id: 'profile', label: 'menu.profile', icon: User, href: '/profile' },
  { id: 'settings', label: 'menu.settings', icon: Settings, href: '/settings' },
  { id: 'help', label: 'menu.help', icon: HelpCircle, href: '/help' },
  { id: 'logout', label: 'menu.logout', icon: LogOut, href: '/logout' },
];

// Componente para Badge/Contador
const Badge = ({ count, collapsed }: { count: number; collapsed: boolean }) => {
  if (count === 0) return null;
  
  return (
    <span className={`
      bg-red-500 text-white text-xs rounded-full font-medium
      flex items-center justify-center min-w-[18px] h-[18px] px-1
      ${collapsed ? 'absolute -top-1 -right-1' : 'ml-auto'}
    `}>
      {count > 99 ? '99+' : count}
    </span>
  );
};

// Componente para Item da Sidebar
const SidebarMenuItem = ({ 
  item, 
  isActive, 
  collapsed, 
  badgeCount, 
  onClick 
}: {
  item: SidebarItem;
  isActive: boolean;
  collapsed: boolean;
  badgeCount: number;
  onClick: () => void;
}) => {
  const { t } = useI18n();
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={`
        relative flex items-center rounded-lg mx-2 mb-1 transition-all duration-200
        ${collapsed ? 'px-3 py-3 justify-center' : 'px-4 py-3'}
        ${isActive 
          ? 'bg-blue-600 text-white shadow-lg' 
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
        }
        ${item.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        group
      `}
      title={collapsed ? t(item.label) : undefined}
    >
      <div className="relative">
        <Icon className={`
          w-5 h-5 transition-transform duration-200
          ${isActive ? 'scale-110' : 'group-hover:scale-105'}
        `} />
        {collapsed && <Badge count={badgeCount} collapsed={collapsed} />}
      </div>
      
      {!collapsed && (
        <div className="flex items-center justify-between flex-1 ml-3">
          <span className="font-medium">{t(item.label)}</span>
          <Badge count={badgeCount} collapsed={collapsed} />
        </div>
      )}

      {/* Tooltip para modo collapsed */}
      {collapsed && (
        <div className="
          absolute left-full top-1/2 -translate-y-1/2 ml-2
          bg-gray-900 text-white text-sm rounded-lg px-3 py-2
          opacity-0 invisible group-hover:opacity-100 group-hover:visible
          transition-all duration-200 whitespace-nowrap z-50
          pointer-events-none
        ">
          {t(item.label)}
          <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 
                         border-4 border-transparent border-r-gray-900"></div>
        </div>
      )}
    </Link>
  );
};

// Hook customizado para gerenciar dados dos badges
const useBadgeData = () => {
  const [badgeData, setBadgeData] = useState<BadgeData>({
    num_table: 0,
    num_consultas: 0,
    registros_analizados: 0,
  });

  // Simulação de dados - substituir por chamada real da API
  useEffect(() => {
    // TODO: Implementar chamada real para API
    const mockData: BadgeData = {
      num_table: 15,
      num_consultas: 7,
      registros_analizados: 1234,
    };
    setBadgeData(mockData);
  }, []);

  return badgeData;
};

export default function SidebarPopup({ children }: { children: React.ReactNode }) {
  const { t } = useI18n();
  const pathname = usePathname();

  // Estados
  const [collapsed, setCollapsed] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [notifications, setNotifications] = useState(3);
  const [darkMode, setDarkMode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const badgeData = useBadgeData();

  // Tab ativo baseado na URL
  const activeTab = useMemo(() => {
    return sidebarItems.find(item => pathname?.includes(item.href))?.id || 'tables';
  }, [pathname]);

  // Handlers
  const toggleCollapse = useCallback(() => {
    setCollapsed(prev => !prev);
  }, []);

  const toggleUserMenu = useCallback(() => {
    setShowUserMenu(prev => !prev);
  }, []);

  const toggleDarkMode = useCallback(() => {
    setDarkMode(prev => !prev);
    // TODO: Implementar tema escuro
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
      setNotifications(5); // Simular novas notificações ao entrar em fullscreen
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
      setNotifications(0); // Limpar notificações ao sair do fullscreen
    }
  }, []);

  // Persistir estado collapsed no localStorage
  useEffect(() => {
    const savedCollapsed = localStorage.getItem('sidebar-collapsed');
    if (savedCollapsed !== null) {
      setCollapsed(JSON.parse(savedCollapsed));
      setNotifications(0); // Limpar notificações ao carregar o estado
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', JSON.stringify(collapsed));
  }, [collapsed]);

  // Fechar menu do usuário ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showUserMenu && !(event.target as Element)?.closest('.user-menu-container')) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showUserMenu]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key === 'b') {
        event.preventDefault();
        toggleCollapse();
      }
      if (event.key === 'F11') {
        event.preventDefault();
        toggleFullscreen();
        setNotifications(0); // Limpar notificações ao usar F11
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [toggleCollapse, toggleFullscreen]);

  return (
    <div className={`flex h-screen overflow-hidden ${darkMode ? 'dark' : ''}`}>
      {/* Sidebar */}
      <div className={`
        bg-white dark:bg-gray-900 shadow-lg border-r border-gray-200 dark:border-gray-700
        transition-all duration-300 ease-in-out flex flex-col h-full
        ${collapsed ? 'w-16' : 'w-64'}
      `}>
        {/* Header */}
        <div className={`
          p-4 border-b border-gray-200 dark:border-gray-700 flex items-center
          ${collapsed ? 'justify-center' : 'justify-between'}
        `}>
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
              <Database className="w-5 h-5 text-white" />
            </div>
            {!collapsed && (
              <div>
                <h1 className="text-lg font-bold text-gray-800 dark:text-white">Ref. Data</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">Database Manager</p>
              </div>
            )}
          </div>
          
          {!collapsed && (
            <div className="flex items-center gap-1">
              {/* Toggle Dark Mode */}
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                title={darkMode ? 'Modo Claro' : 'Modo Escuro'}
              >
                {darkMode ? (
                  <Sun className="w-4 h-4 text-yellow-500" />
                ) : (
                  <Moon className="w-4 h-4 text-gray-600" />
                )}
              </button>

              {/* Fullscreen Toggle */}
              <button
                onClick={toggleFullscreen}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                title={isFullscreen ? 'Sair Tela Cheia' : 'Tela Cheia'}
              >
                {isFullscreen ? (
                  <Minimize2 className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                ) : (
                  <Maximize2 className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                )}
              </button>

              {/* Collapse Button */}
              <button
                onClick={toggleCollapse}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                title="Recolher Sidebar (Ctrl+B)"
              >
                <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-300" />
              </button>
            </div>
          )}
        </div>

        {/* Expand Button (when collapsed) */}
        {collapsed && (
          <div className="flex justify-center pt-2 pb-4">
            <button
              onClick={toggleCollapse}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title="Expandir Sidebar (Ctrl+B)"
            >
              <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-300" />
            </button>
          </div>
        )}

        {/* Navigation Items */}
        <nav className="flex-1 py-4 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
          {sidebarItems.map((item) => (
            <SidebarMenuItem
              key={item.id}
              item={item}
              isActive={activeTab === item.id}
              collapsed={collapsed}
              badgeCount={item.badge ? badgeData[item.badge as keyof BadgeData] : 0}
              onClick={() => {}} // Link já gerencia navegação
            />
          ))}
        </nav>

        {/* User Section */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-4 flex-shrink-0">
          <div className="user-menu-container relative">
            {/* Notifications */}
            {!collapsed && notifications > 0 && (
              <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-500">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm text-blue-800 dark:text-blue-300 font-medium">
                    {notifications} nova{notifications !== 1 ? 's' : ''} notificação{notifications !== 1 ? 'ões' : ''}
                  </span>
                </div>
              </div>
            )}

            {/* User Button */}
            <button
              onClick={toggleUserMenu}
              className={`
                w-full flex items-center rounded-lg transition-all duration-200
                ${collapsed ? 'p-2 justify-center' : 'p-3'}
                hover:bg-gray-100 dark:hover:bg-gray-800 group
              `}
            >
              <div className="relative">
                <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-teal-600 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                {collapsed && notifications > 0 && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
                )}
              </div>
              
              {!collapsed && (
                <div className="ml-3 flex-1 text-left">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200">Usuário</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Admin</p>
                </div>
              )}
            </button>

            {/* User Menu Dropdown */}
            {showUserMenu && (
              <div className={`
                absolute bottom-full mb-2 bg-white dark:bg-gray-800 rounded-lg shadow-xl 
                border border-gray-200 dark:border-gray-700 py-2 z-50
                ${collapsed ? 'left-full ml-2 w-48' : 'left-0 right-0'}
              `}>
                {userMenuItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <Icon className="w-4 h-4 mr-3" />
                      {t(item.label)}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-gray-900">
          {children}
        </div>
      </main>
    </div>
  );
}
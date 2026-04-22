"use client";
import { useI18n } from '@/context/I18nContext';
import { useSession } from '@/context/SessionContext';
import {
  BarChart3, Database, TableProperties, Search, History,
  TrendingUp, Settings, Menu, X, ChevronLeft, ChevronRight,
  ScanLine, LucideProjector, Activity
} from 'lucide-react';
import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SidebarFooter } from './silederMenuComponent/SidebarFooter';
import { hasPermission } from '@/permissions_val';

const MIN_WIDTH = 200;
const MAX_WIDTH = 450;
const DEFAULT_WIDTH = 280;
const COLLAPSED_WIDTH = 80;

type SidebarItem = {
  id: string;
  label: string;
  icon: any;
  href: string;
  badge?: string;
  permission?: string | string[];
  requiresConnection?: boolean;
};

export const sidebarItems: SidebarItem[] = [
  { id: "overview", label: "sidebar.overview", icon: BarChart3, href: "/home" },
  { id: "connections", label: "sidebar.connections", icon: Database, badge: "active", href: "/home/conexao", permission: ["db_connection:read_own", "db_connection:read_company", "db_connection:read_all"] },
  { id: "tables", label: "sidebar.tables", icon: TableProperties, badge: "num_table", href: "/home/tabelas", permission: "query:execute", requiresConnection: true },
  { id: "query", label: "sidebar.query", icon: Search, badge: "num_consultas", href: "/home/consultas", permission: "query:execute", requiresConnection: true },
  { id: "analysis", label: "sidebar.analysis", icon: TrendingUp, href: "/home/analizar", permission: "project:view", requiresConnection: true },
  { id: "task", label: "sidebar.gestorProjetos", icon: LucideProjector, badge: "num_tasks", href: "/task", permission: "project:view" },
  { id: "ai", label: "sidebar.ai", icon: BarChart3, href: "/home/ai" },
  { id: "template", label: "sidebar.templates", icon: TableProperties, href: "/createtamplete", permission: "project:view" },
  { id: "test", label: "sidebar.test", icon: Activity, href: "/home/test" },
  { id: "tester", label: "sidebar.apiTester", icon: Activity, href: "/home/tester" },
  { id: "ocr", label: "scanner.texto", icon: ScanLine, badge: "registros_analizados", href: "/home/ocr" },
  { id: "history", label: "sidebar.history", icon: History, badge: "registros_analizados", href: "/home/historico", permission: "query:execute", requiresConnection: true },
  { id: "settings", label: "sidebar.settings", icon: Settings, href: "/home/configuracao", permission: "user:manage" },
];

export default function Sidebar({ children }: { children: React.ReactNode }) {
  const { t } = useI18n();
  const { logout, user } = useSession();
  const pathname = usePathname();

  const allowedSidebarItems = useMemo(() => {
    return sidebarItems.filter(item =>
      hasPermission(user?.permissions, item.permission)
    );
  }, [user?.permissions]);

  const [collapsed, setCollapsed] = useState(true);
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const sidebarRef = useRef<HTMLDivElement>(null);
  const isResizing = useRef(false);

  const hasActiveConnection = Boolean(user?.info_extra?.name_db);

  const activeTab = useMemo(() =>
    allowedSidebarItems.find(item => item.href === pathname)?.id || 'overview',
    [pathname, allowedSidebarItems]
  );

  const currentWidth = useMemo(() =>
    collapsed ? COLLAPSED_WIDTH : width,
    [collapsed, width]
  );

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedCollapsed = localStorage.getItem('sidebar-collapsed');
      const savedWidth = localStorage.getItem('sidebar-width');
      if (savedCollapsed) setCollapsed(JSON.parse(savedCollapsed));
      if (savedWidth) {
        const parsedWidth = parseInt(savedWidth, 10);
        if (parsedWidth >= MIN_WIDTH && parsedWidth <= MAX_WIDTH) setWidth(parsedWidth);
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('sidebar-collapsed', JSON.stringify(collapsed));
      localStorage.setItem('sidebar-width', width.toString());
    }
  }, [collapsed, width]);

  // ✅ Fechar sidebar no mobile ao mudar de rota
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const handleLogout = useCallback(async () => {
    try {
      await logout();
      window.location.href = '/auth/login';
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  }, [logout]);

  const toggleCollapse = useCallback(() => setCollapsed(prev => !prev), []);

  // ✅ Simplificado — o useEffect de pathname já cuida do mobile
  const handleItemClick = useCallback(() => { }, []);

  const toggleMobileMenu = useCallback(() => setMobileOpen(prev => !prev), []);

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isResizing.current = true;

    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing.current) return;
      setWidth(Math.min(Math.max(e.clientX, MIN_WIDTH), MAX_WIDTH));
    };

    const handleMouseUp = () => {
      isResizing.current = false;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        mobileOpen &&
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target as Node) &&
        window.innerWidth < 768
      ) {
        setMobileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [mobileOpen]);

  const renderTooltip = (item: SidebarItem) => (
    <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-gray-900 text-white px-3 py-2 rounded-lg text-sm whitespace-nowrap z-50 shadow-lg pointer-events-none">
      {t(item.label)}
      {item.badge && (
        <span className="ml-2 px-2 py-0.5 bg-white/20 rounded text-xs">
          {item.id !== "connections"
            ? user?.info_extra?.[item.badge as keyof typeof user.info_extra] || "0"
            : user?.info_extra?.name_db ? "ativo" : "inativo"}
        </span>
      )}
      <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900" />
    </div>
  );

  return (
    <div className="flex h-screen w-screen bg-gray-50 overflow-hidden">
      {/* Overlay mobile */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Botão menu mobile */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 bg-white shadow-lg p-3 rounded-lg border hover:bg-gray-50 transition-colors"
        onClick={toggleMobileMenu}
        aria-label={mobileOpen ? "Fechar menu" : "Abrir menu"}
      >
        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Sidebar */}
      <aside
        ref={sidebarRef}
        className={`
          bg-white shadow-xl border-r h-full z-40 flex flex-col
          fixed md:relative flex-shrink-0
          transition-transform duration-300 ease-in-out
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
        style={{ width: currentWidth }}
      >
        {/* Header */}
        <div className={`p-6 border-b flex items-center flex-shrink-0 ${collapsed ? 'justify-center' : 'justify-between'}`}>
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <Database className="w-6 h-6 text-white" />
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <h1 className="text-xl font-bold truncate">MustaInfo</h1>
                <p className="text-sm text-gray-500 truncate">{t('sidebar.subtitle')}</p>
              </div>
            )}
          </div>
          {!collapsed && (
            <button
              onClick={toggleCollapse}
              className="hidden md:flex p-2 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0"
              title={t('sidebar.collapse')}
            >
              <ChevronLeft className="w-4 h-4 text-gray-500" />
            </button>
          )}
        </div>

        {/* Botão expandir quando collapsed */}
        {collapsed && (
          <div className="hidden md:flex justify-center pt-4 flex-shrink-0">
            <button
              onClick={toggleCollapse}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              title={t('sidebar.expand')}
            >
              <ChevronRight className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        )}

        {/* ✅ Navegação — usando allowedSidebarItems */}
        <nav className="mt-6 px-3 flex-1 overflow-y-auto">
          {allowedSidebarItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const isHovered = hoveredItem === item.id;
            const disabled = item.requiresConnection && !hasActiveConnection;
            if (disabled) return null;

            return (
              <div key={item.id} className="relative">
                <Link
                  href={item.href}
                  onClick={handleItemClick}
                  onMouseEnter={() => setHoveredItem(item.id)}
                  onMouseLeave={() => setHoveredItem(null)}
                  className={`
                    w-full flex items-center px-4 py-3 mb-1 rounded-xl transition-all duration-200
                    ${collapsed ? 'justify-center' : 'justify-between'}
                    ${isActive
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg scale-105'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 hover:shadow-md'
                    }
                  `}
                >
                  <div className={`flex items-center ${collapsed ? '' : 'space-x-3'}`}>
                    <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-white' : ''}`} />
                    {!collapsed && (
                      <span className={`font-medium truncate ${isActive ? 'text-white' : ''}`}>
                        {t(item.label)}
                      </span>
                    )}
                  </div>

                  {item.badge && !collapsed && (
                    <span className={`
                      px-2 py-1 text-xs rounded-full font-medium flex-shrink-0
                      ${isActive
                        ? 'bg-white/20 text-white'
                        : item.badge === 'active'
                          ? 'bg-green-100 text-green-600'
                          : 'bg-gray-100 text-gray-600'
                      }
                    `}>
                      {item.id !== "connections"
                        ? user?.info_extra?.[item.badge as keyof typeof user.info_extra] || "0"
                        : user?.info_extra?.name_db ? "ativo" : "inativo"}
                    </span>
                  )}
                </Link>

                {collapsed && isHovered && renderTooltip(item)}
              </div>
            );
          })}
        </nav>

        <SidebarFooter user={user} collapsed={collapsed} onLogout={handleLogout} />

        {/* Handle de resize */}
        {!collapsed && (
          <div
            onMouseDown={handleResizeStart}
            className="hidden md:block absolute top-0 right-0 h-full w-1 cursor-col-resize hover:bg-blue-200 group transition-colors"
          >
            <div className="absolute top-1/2 right-0 -translate-y-1/2 w-3 h-8 bg-gray-300 rounded-l-md opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
              <div className="w-0.5 h-4 bg-gray-500 rounded" />
            </div>
          </div>
        )}
      </aside>

      {/* ✅ Main — sem marginLeft via JS, sem hydration mismatch */}
      <main className="flex-1 overflow-auto pt-16 md:pt-4 px-4 pb-4 min-w-0">
        {children}
      </main>
    </div>
  );
}
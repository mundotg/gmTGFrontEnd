// components/Sidebar.tsx
"use client";
import { useI18n } from '@/context/I18nContext';
import { useSession } from '@/context/SessionContext';
import {
  BarChart3, Database, TableProperties, Search, History,
  TrendingUp, Settings, Menu, X, ChevronLeft, ChevronRight,
  LogOut, User
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const sidebarItems = [
  { id: 'overview', label: 'sidebar.overview', icon: BarChart3, href: '/home' },
  { id: 'connections', label: 'sidebar.connections', icon: Database, badge: 'active' , href: '/home/conexao' },
  { id: 'tables', label: 'sidebar.tables', icon: TableProperties, badge: 'num_table', href: '/home/tabelas' },
  { id: 'query', label: 'sidebar.query', icon: Search, badge: 'num_consultas', href: '/home/consultas' },
  { id: 'history', label: 'sidebar.history', icon: History, badge: 'registros_analizados' , href: '/home/historico' },
  { id: 'analysis', label: 'sidebar.analysis', icon: TrendingUp , href: '/home/analizar' },
  { id: 'settings', label: 'sidebar.settings', icon: Settings, href: '/home/configuracao' },
];

export default function Sidebar({ children }: { children: React.ReactNode }) {
  const { t } = useI18n();
  const { logout,user } = useSession();
  const [widthCurrent, setWidthCorrent] = useState(280);
  const pathname = usePathname();

  const [activeTab, setActiveTab] = useState(sidebarItems.find(item => item.href === pathname)?.id || 'overview');
  const [collapsed, setCollapsed] = useState(true);
  const [width, setWidth] = useState(280);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const isResizing = useRef(false);

   

  useEffect(() => {
    const savedCollapsed = localStorage.getItem('sidebar-collapsed');
    if (savedCollapsed) setCollapsed(JSON.parse(savedCollapsed));
  }, []);

  useEffect(() => {
    const savedWidth = collapsed ? (window.innerWidth >= 768 ? 80 : width) : width  
    setWidthCorrent(savedWidth);
    }, [collapsed,width]);

  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', JSON.stringify(collapsed));
  }, [collapsed]);

  const handleLogout = async () => {
    await logout();
    window.location.href = '/auth/login';
  };

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    isResizing.current = true;
    document.addEventListener('mousemove', handleResizing);
    document.addEventListener('mouseup', stopResizing);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  const handleResizing = (e: MouseEvent) => {
    if (isResizing.current) {
      const newWidth = Math.min(Math.max(e.clientX, 200), 450);
      setWidth(newWidth);
    }
  };

  

  const stopResizing = () => {
    isResizing.current = false;
    document.removeEventListener('mousemove', handleResizing);
    document.removeEventListener('mouseup', stopResizing);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  };

  const handleItemClick = (id: string) => {
    setActiveTab(id);

    if (window.innerWidth < 768) setMobileOpen(false);
  };

  const toggleCollapse = () => {
    setCollapsed((prev) => !prev);
    if (collapsed) setWidth(280);
  };

  const renderTooltip = (item: typeof sidebarItems[0]) => (
    <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-gray-900 text-white px-3 py-2 rounded-lg text-sm whitespace-nowrap z-50 shadow-lg">
      {t(item.label)}
      {item.badge && <span className="ml-2 px-2 py-0.5 bg-white/20 rounded text-xs">{item.badge}</span>}
      <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900" />
    </div>
  );

  return (
    <>
      {mobileOpen && <div className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-30" onClick={() => setMobileOpen(false)} />}

      <button
        className="md:hidden fixed top-4 left-4 z-50 bg-white shadow-lg p-3 rounded-lg border hover:bg-gray-50"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      <div
        ref={sidebarRef}
        className={`bg-white shadow-xl border-r h-full z-40 transition-all duration-300 ease-in-out ${mobileOpen ? 'fixed translate-x-0' : 'fixed -translate-x-full md:translate-x-0 md:relative'} ${collapsed ? 'md:w-20' : ''}`}
        style={{ width: widthCurrent }}
      >
        <div className={`p-6 border-b flex items-center ${collapsed ? 'justify-center' : 'justify-between'}`}>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
              <Database className="w-6 h-6 text-white" />
            </div>
            {!collapsed && (
              <div>
                <h1 className="text-xl font-bold">DB Manager</h1>
                <p className="text-sm text-gray-500">{t('sidebar.subtitle')}</p>
              </div>
            )}
          </div>
          {!collapsed && (
            <button
              onClick={toggleCollapse}
              className="hidden md:flex p-2 rounded-lg hover:bg-gray-100"
              title={t('sidebar.collapse')}
            >
              <ChevronLeft className="w-4 h-4 text-gray-500" />
            </button>
          )}
        </div>

        {collapsed && (
          <div className="hidden md:flex justify-center pt-4">
            <button
              onClick={toggleCollapse}
              className="p-2 rounded-lg hover:bg-gray-100"
              title={t('sidebar.expand')}
            >
              <ChevronRight className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        )}

        <nav className="mt-6 px-3">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const isActive =  activeTab === item.id;
            const isHovered = hoveredItem === item.id;
            return (
              <div key={item.id} className="relative">
                <Link 
                    href={item.href}
                  onClick={() => handleItemClick(item.id)}
                  onMouseEnter={() => setHoveredItem(item.id)}
                  onMouseLeave={() => setHoveredItem(null)}
                  className={`w-full flex items-center ${collapsed ? 'justify-center' : 'justify-between'} px-4 py-3 mb-1 rounded-xl text-left transition-all duration-200 ${isActive ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg scale-105' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 hover:shadow-md'}`}
                >
                  <div className={`flex items-center ${collapsed ? '' : 'space-x-3'}`}>
                    <Icon className={`w-5 h-5 ${isActive ? 'text-white' : ''}`} />
                    {!collapsed && <span className={`font-medium ${isActive ? 'text-white' : ''}`}>{t(item.label)}</span>}
                  </div>
                  {item.badge && !collapsed && (
                    <span className={`px-2 py-1 text-xs rounded-full ${isActive ? 'bg-white/20 text-white' : item.badge === 'active' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'}`}>
                      {item.badge && (item.id !== "connections"
                        ? user?.InfPlus?.[item.badge as keyof typeof user.InfPlus]
                        : user?.InfPlus?.name_db ? "ative" : "off")}
                    </span>
                  )}
                </Link>
                {collapsed && isHovered && renderTooltip(item)}
              </div>
            );
          })}
        </nav>

        <div className="absolute bottom-0 w-full p-4 border-t bg-white">
          {!collapsed ? (
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{user?.nome}</p>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <p className="text-xs text-green-600">{user?.InfPlus?.name_db  || "nenhuma base de dados conectada"}</p>
                </div>
              </div>
              <button onClick={handleLogout} className="p-1.5 rounded-lg hover:bg-gray-100">
                <LogOut className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-2">
              <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <div className="w-2 h-2 bg-green-500 rounded-full" />
            </div>
          )}
        </div>

        {!collapsed && (
          <div
            onMouseDown={handleResizeStart}
            className="hidden md:block absolute top-0 right-0 h-full w-1 cursor-col-resize hover:bg-blue-200 group"
          >
            <div className="absolute top-1/2 right-0 -translate-y-1/2 w-3 h-8 bg-gray-300 rounded-l-md opacity-0 group-hover:opacity-100 flex items-center justify-center">
              <div className="w-0.5 h-4 bg-gray-500 rounded" />
            </div>
          </div>
        )}
      </div>
      <main className="flex-1 p-4 overflow-auto bg-gray-50">{children}</main>
    </>
  );
}

"use client";
import { useI18n } from "@/context/I18nContext";
import { useSession } from "@/context/SessionContext";
import {
  Database, Menu, X, ChevronLeft, ChevronRight,
} from "lucide-react";
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { usePathname } from "next/navigation";
import { SidebarFooter } from "./silederMenuComponent/SidebarFooter";
import { hasPermission } from "@/permissions_val";
import SidebarNav from "./silederMenuComponent/navSliderbar";
// 🔁 Reutiliza a MESMA lista de rotas do menu principal (fonte única de verdade).
// Antes existia aqui uma cópia desatualizada (ícones errados, permissões
// inválidas, sem submenu). Agora qualquer alteração ao menu reflete-se aqui.
import { sidebarItems } from "./Sidebar";

const MIN_WIDTH = 200;
const MAX_WIDTH = 450;
const DEFAULT_WIDTH = 280;
const COLLAPSED_WIDTH = 80;

/**
 * Barra lateral usada dentro dos popups (ex.: página `referencia`, aberta numa
 * janela própria). Partilha a navegação, as permissões e o rodapé com o menu
 * principal — apenas o "shell" (resize / recolher / mobile) vive aqui.
 */
export default function SidebarPopup({ children }: { children: React.ReactNode }) {
  const { t } = useI18n();
  const { logout, user } = useSession();
  const pathname = usePathname();

  const sidebarRef = useRef<HTMLDivElement>(null);
  const isResizing = useRef(false);

  const [collapsed, setCollapsed] = useState(true);
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const [mobileOpen, setMobileOpen] = useState(false);

  const hasActiveConnection = Boolean(user?.info_extra?.name_db);

  // Filtra por permissões (igual ao menu principal).
  const allowedSidebarItems = useMemo(
    () => sidebarItems.filter((item) => hasPermission(user?.permissions, item.permission)),
    [user?.permissions]
  );

  // Rota ativa: match exato e, em falha, o prefixo mais longo.
  const activeTab = useMemo(() => {
    const exact = allowedSidebarItems.find((item) => item.href === pathname);
    if (exact) return exact.id;

    const bestPrefix = [...allowedSidebarItems]
      .sort((a, b) => b.href.length - a.href.length)
      .find((item) => pathname.startsWith(item.href));

    return bestPrefix?.id || "overview";
  }, [pathname, allowedSidebarItems]);

  const currentWidth = collapsed ? COLLAPSED_WIDTH : width;

  // Carrega config guardada.
  useEffect(() => {
    try {
      const savedCollapsed = localStorage.getItem("sidebar-collapsed");
      const savedWidth = localStorage.getItem("sidebar-width");
      if (savedCollapsed) setCollapsed(JSON.parse(savedCollapsed));
      if (savedWidth) {
        const parsed = parseInt(savedWidth, 10);
        if (parsed >= MIN_WIDTH && parsed <= MAX_WIDTH) setWidth(parsed);
      }
    } catch {
      //
    }
  }, []);

  // Persiste config.
  useEffect(() => {
    localStorage.setItem("sidebar-collapsed", JSON.stringify(collapsed));
    localStorage.setItem("sidebar-width", width.toString());
  }, [collapsed, width]);

  // Fecha o menu mobile ao mudar de rota.
  useEffect(() => setMobileOpen(false), [pathname]);

  const handleLogout = useCallback(async () => {
    try {
      await logout();
      window.location.href = "/auth/login";
    } catch (err) {
      console.error("Erro ao fazer logout:", err);
    }
  }, [logout]);

  const toggleCollapse = useCallback(() => setCollapsed((prev) => !prev), []);
  const toggleMobileMenu = useCallback(() => setMobileOpen((prev) => !prev), []);

  // Resize por arrasto.
  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isResizing.current = true;

    const move = (ev: MouseEvent) => {
      if (!isResizing.current) return;
      setWidth(Math.min(Math.max(ev.clientX, MIN_WIDTH), MAX_WIDTH));
    };

    const stop = () => {
      isResizing.current = false;
      document.removeEventListener("mousemove", move);
      document.removeEventListener("mouseup", stop);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    document.addEventListener("mousemove", move);
    document.addEventListener("mouseup", stop);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, []);

  // Clicar fora fecha (mobile).
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
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [mobileOpen]);

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
        style={{ width: currentWidth }}
        className={`
          bg-white shadow-xl border-r h-full z-40 flex flex-col
          fixed md:relative flex-shrink-0
          transition-transform duration-300 ease-in-out
          ${mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        {/* Header */}
        <div className={`p-6 border-b flex items-center flex-shrink-0 ${collapsed ? "justify-center" : "justify-between"}`}>
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <Database className="w-6 h-6 text-white" />
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <h1 className="text-xl font-bold truncate">MustaInfo</h1>
                <p className="text-sm text-gray-500 truncate">{t("sidebar.subtitle")}</p>
              </div>
            )}
          </div>
          {!collapsed && (
            <button
              onClick={toggleCollapse}
              className="hidden md:flex p-2 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0"
              title={t("sidebar.collapse")}
            >
              <ChevronLeft className="w-4 h-4 text-gray-500" />
            </button>
          )}
        </div>

        {/* Botão expandir quando recolhido */}
        {collapsed && (
          <div className="hidden md:flex justify-center pt-4 flex-shrink-0">
            <button
              onClick={toggleCollapse}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              title={t("sidebar.expand")}
            >
              <ChevronRight className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        )}

        {/* Navegação partilhada (submenu + tooltips + badges) */}
        <SidebarNav
          items={allowedSidebarItems}
          activeTab={activeTab}
          collapsed={collapsed}
          hasActiveConnection={hasActiveConnection}
          t={t}
          user={user}
        />

        <SidebarFooter
          user={user}
          userPermissions={user?.permissions}
          collapsed={collapsed}
          onLogout={handleLogout}
        />

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

      {/* Conteúdo */}
      <main className="flex-1 overflow-auto pt-16 md:pt-4 px-4 pb-4 min-w-0">
        {children}
      </main>
    </div>
  );
}

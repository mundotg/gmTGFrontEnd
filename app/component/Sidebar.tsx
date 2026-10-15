"use client";

import { useI18n } from "@/context/I18nContext";
import { useSession } from "@/context/SessionContext";
import {
  Database, TableProperties, Search, History,
  TrendingUp, Menu, X, ChevronLeft, ChevronRight,
  ScanLine, LucideProjector,
  Terminal, Sparkles,
  LayoutDashboard, Bot,
} from "lucide-react";
import type { ElementType } from "react";
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { usePathname } from "next/navigation";
import { SidebarFooter } from "./silederMenuComponent/SidebarFooter";
import { hasPermission } from "@/permissions_val";
import Script from "next/script";
import SidebarNav from "./silederMenuComponent/navSliderbar";

const MIN_WIDTH = 200;
const MAX_WIDTH = 450;
const DEFAULT_WIDTH = 280;
const COLLAPSED_WIDTH = 80;

type SidebarItem = {
  id: string;
  label: string;
  /** Texto de reserva quando não há tradução para `label`. */
  title?: string;
  /** Grupo/submenu a que pertence. */
  group?: string;
  icon: ElementType;
  href: string;
  badge?: string;
  permission?: string | string[];
  requiresConnection?: boolean;
};

/**
 * Menu do app.
 *
 * As rotas de GESTÃO DE BASE DE DADOS ficam no topo (sem `group`), sempre
 * visíveis. As ferramentas adicionais ficam no submenu ("Mais").
 * Configurações, Armazenamento, API Tester e Testes (dev) residem agora
 * no submenu de informação do usuário (SidebarFooter).
 */
const GROUP_MORE = "sidebar.groupMore";

export const sidebarItems: SidebarItem[] = [
  // ─────────── Gestão de Base de Dados (topo, sempre visível) ───────────
  { id: "overview", label: "sidebar.overview", title: "Visão geral", icon: LayoutDashboard, href: "/home" },
  { id: "connections", label: "sidebar.connections", title: "Conexões", icon: Database, badge: "active", href: "/home/conexao", permission: ["db_connection:read_own", "db_connection:read_company", "db_connection:read_all"] },
  { id: "tables", label: "sidebar.tables", title: "Tabelas", icon: TableProperties, badge: "num_table", href: "/home/tabelas", permission: ["table:read", "table:stats", "table:*"], requiresConnection: true },
  { id: "query", label: "sidebar.query", title: "Consultas", icon: Search, badge: "num_consultas", href: "/home/consultas", permission: "query:execute", requiresConnection: true },
  { id: "editorsql", label: "sidebar.sqlEditor", title: "Editor SQL", icon: Terminal, href: "/home/editorsql", permission: "query:execute", requiresConnection: true },
  { id: "history", label: "sidebar.history", title: "Histórico", icon: History, badge: "registros_analizados", href: "/home/historico", permission: "query:execute", requiresConnection: true },
  { id: "analysis", label: "sidebar.analysis", title: "Análise de BD", icon: TrendingUp, href: "/home/analizar", permission: "project:view", requiresConnection: true },

  // ─────────── Submenu "Mais" (tudo o que não é gestão de BD) ───────────
  { id: "task", group: GROUP_MORE, label: "sidebar.gestorProjetos", title: "Gestor de Projetos", icon: LucideProjector, badge: "num_tasks", href: "/task", permission: "project:view" },
  { id: "template", group: GROUP_MORE, label: "sidebar.templates", title: "Templates", icon: TableProperties, href: "/createtamplete", permission: "project:view" },
  { id: "ai", group: GROUP_MORE, label: "sidebar.ai", title: "Assistente IA", icon: Bot, href: "/home/ai" },
  { id: "mll", group: GROUP_MORE, label: "sidebar.mll", title: "ML / Insights", icon: Sparkles, href: "/home/mll" },
  { id: "ocr", group: GROUP_MORE, label: "scanner.texto", title: "OCR / Scanner", icon: ScanLine, badge: "registros_analizados", href: "/home/ocr" },
];

export default function Sidebar({ children }: { children: React.ReactNode }) {
  const { t } = useI18n();
  const { logout, user } = useSession();
  const pathname = usePathname();

  const sidebarRef = useRef<HTMLDivElement>(null);
  const isResizing = useRef(false);

  const [collapsed, setCollapsed] = useState(true);
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const [mobileOpen, setMobileOpen] = useState(false);

  const hasActiveConnection = Boolean(user?.info_extra?.name_db);

  // 🔥 Filtrar permissões
  const allowedSidebarItems = useMemo(() => {
    return sidebarItems.filter((item) =>
      hasPermission(user?.permissions, item.permission)
    );
  }, [user?.permissions]);

  // 🔥 Active tab
  const activeTab = useMemo(() => {
    // 1. Try to find an exact match first
    const exactMatch = allowedSidebarItems.find((item) => item.href === pathname);

    if (exactMatch) {
      return exactMatch.id;
    }

    // 2. Fallback: Find the best "startsWith" match (ignoring /home root from matching other paths)
    const bestPrefixMatch = [...allowedSidebarItems]
      .filter((item) => item.href !== "/home")
      .sort((a, b) => b.href.length - a.href.length) // Longest href first
      .find((item) => pathname.startsWith(item.href));

    if (bestPrefixMatch) {
      return bestPrefixMatch.id;
    }

    return pathname === "/home" ? "overview" : "";
  }, [pathname, allowedSidebarItems]);

  const currentWidth = collapsed ? COLLAPSED_WIDTH : width;

  // 🔥 Load config
  useEffect(() => {
    try {
      const savedCollapsed = localStorage.getItem("sidebar-collapsed");
      const savedWidth = localStorage.getItem("sidebar-width");

      if (savedCollapsed) setCollapsed(JSON.parse(savedCollapsed));

      if (savedWidth) {
        const parsed = parseInt(savedWidth, 10);
        if (parsed >= MIN_WIDTH && parsed <= MAX_WIDTH) setWidth(parsed);
      }
    } catch { }
  }, []);

  // 🔥 Persist config
  useEffect(() => {
    localStorage.setItem("sidebar-collapsed", JSON.stringify(collapsed));
    localStorage.setItem("sidebar-width", width.toString());
  }, [collapsed, width]);

  // 🔥 Auto fechar mobile ao mudar rota
  useEffect(() => setMobileOpen(false), [pathname]);

  // 🔥 Logout
  const handleLogout = useCallback(async () => {
    try {
      await logout();
      window.location.href = "/auth/login";
    } catch (err) {
      console.error("Erro ao logout:", err);
    }
  }, [logout]);

  const toggleCollapse = useCallback(
    () => setCollapsed((prev) => !prev),
    []
  );

  const toggleMobileMenu = useCallback(
    () => setMobileOpen((prev) => !prev),
    []
  );

  // 🔥 Resize
  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isResizing.current = true;

    const move = (e: MouseEvent) => {
      if (!isResizing.current) return;
      setWidth(Math.min(Math.max(e.clientX, MIN_WIDTH), MAX_WIDTH));
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

  // 🔥 Click fora (mobile)
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
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, [mobileOpen]);

  return (
    <div className="flex h-screen w-screen bg-gray-50 overflow-hidden">
      {/* Overlay */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Botão mobile */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 bg-white shadow-lg p-3 rounded-lg border hover:bg-gray-50"
        onClick={toggleMobileMenu}
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar */}
      <aside
        ref={sidebarRef}
        style={{ width: currentWidth }}
        className={`
          bg-white shadow-xl border-r h-full z-40 flex flex-col
          fixed md:relative transition-transform duration-300
          ${mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        {/* Header */}
        <div className={`p-6 border-b flex ${collapsed ? "justify-center" : "justify-between"}`}>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
              <Database className="text-white" />
            </div>

            {!collapsed && (
              <div>
                <h1 className="font-bold">MustaInfo</h1>
                <p className="text-sm text-gray-500">{t("sidebar.subtitle")}</p>
              </div>
            )}
          </div>

          {!collapsed && (
            <button onClick={toggleCollapse}>
              <ChevronLeft />
            </button>
          )}
        </div>

        <Script
          id="adsense-script"
          strategy="lazyOnload"
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6543986660141855"
          crossOrigin="anonymous"
        />

        {collapsed && (
          <div className="flex justify-center pt-3">
            <button onClick={toggleCollapse}>
              <ChevronRight />
            </button>
          </div>
        )}

        {/* 🔥 NAV */}
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

        {/* Resize */}
        {!collapsed && (
          <div
            onMouseDown={handleResizeStart}
            className="hidden md:block absolute top-0 right-0 h-full w-1 cursor-col-resize"
          />
        )}
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto pt-16 md:pt-4 px-4 pb-4">
        {children}
      </main>
    </div>
  );
}
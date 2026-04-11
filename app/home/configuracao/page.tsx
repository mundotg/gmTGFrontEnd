"use client";

import React, { useState, Suspense, useMemo, useEffect } from "react";
import {
  User,
  Building,
  FolderKanban,
  Users,
  Plug,
  Settings,
  Search,
  Menu,
  X,
  ChevronDown,
  Bell,
  Moon,
  Sun,
  LogOut,
  HelpCircle
} from "lucide-react";

import { useSession } from "@/context/SessionContext";
import { useI18n } from "@/context/I18nContext";
import { matchesSearch, SettingsTab, Skeleton, TabConfig } from "./utils";
import { UsuarioTab } from "./configuracaoTab/UsuarioTab";
import { EmpresaTab } from "./configuracaoTab/EmpresaTab";
import { ProjetosTab } from "./configuracaoTab/ProjetosTab";
import { EquipeTab } from "./configuracaoTab/EquipeTab";
import { IntegracoesTab } from "./configuracaoTab/IntegracoesTab";
import { hasPermission } from "@/permissions_val";
import { SistemaTab } from "./configuracaoTab/SistemaTab";

/* =======================
   MAPA DE COMPONENTES
======================= */

const TAB_COMPONENTS: Record<SettingsTab, React.FC> = {
  usuario: UsuarioTab,
  empresa: EmpresaTab,
  projetos: ProjetosTab,
  equipe: EquipeTab,
  integracoes: IntegracoesTab,
  sistema: SistemaTab,
};

/* =======================
   PÁGINA PRINCIPAL
======================= */

export default function SettingsPage() {
  const { user, logout } = useSession();
  const { t } = useI18n();

  const [activeTab, setActiveTab] = useState<SettingsTab>("usuario");
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);

  /* ===== CONFIGURAÇÃO DAS ABAS (Movido para dentro para usar useI18n) ===== */
  const tabs: TabConfig[] = useMemo(() => [
    {
      id: "usuario",
      label: t("settings.tabUser") || "Usuário",
      icon: User,
      permission: "settings:user",
      description: t("settings.descUser") || "Perfil e preferências",
    },
    {
      id: "empresa",
      label: t("settings.tabCompany") || "Empresa",
      icon: Building,
      permission: "settings:company",
      description: t("settings.descCompany") || "Dados corporativos",
    },
    {
      id: "projetos",
      label: t("settings.tabProjects") || "Projetos",
      icon: FolderKanban,
      permission: "settings:projects",
      description: t("settings.descProjects") || "Gestão de projetos",
    },
    {
      id: "equipe",
      label: t("settings.tabTeam") || "Equipe",
      icon: Users,
      permission: "settings:team",
      description: t("settings.descTeam") || "Usuários e permissões",
    },
    {
      id: "integracoes",
      label: t("settings.tabIntegrations") || "Integrações",
      icon: Plug,
      permission: "settings:integrations",
      description: t("settings.descIntegrations") || "Conexões externas",
    },
    {
      id: "sistema",
      label: t("settings.tabSystem") || "Sistema",
      icon: Settings,
      permission: "settings:system",
      description: t("settings.descSystem") || "Logs e manutenção",
    },
  ], [t]);

  /* ===== Tabs permitidas (RBAC) ===== */
  const allowedTabs = useMemo(
    () =>
      tabs.filter(
        (tab) =>
          hasPermission(user?.permissions || [], tab.permission) &&
          matchesSearch(tab, searchQuery)
      ),
    [user?.permissions, searchQuery, tabs]
  );

  /* ===== Garantir tab válida ===== */
  useEffect(() => {
    if (!allowedTabs.find((t) => t.id === activeTab)) {
      setActiveTab(allowedTabs[0]?.id ?? "usuario");
    }
  }, [allowedTabs, activeTab]);

  /* ===== Fechar menus ao clicar fora ===== */
  useEffect(() => {
    const handleClickOutside = () => {
      setShowUserMenu(false);
    };
    if (showUserMenu) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [showUserMenu]);

  const ActiveComponent = TAB_COMPONENTS[activeTab];

  /* ===== Função de logout ===== */
  const handleLogout = async () => {
    if (logout) {
      await logout();
    }
  };

  return (
    <div className={`min-h-screen ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>
      {/* ================= HEADER ================= */}
      <header
        className={`sticky top-0 z-50 ${
          darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
        } border-b shadow-sm backdrop-blur-sm bg-opacity-95`}
      >
        <div className="px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-3 sm:gap-4">
            {/* Logo e Título */}
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                <Settings className="text-white" size={18} />
              </div>
              <div className="min-w-0">
                <h1
                  className={`font-bold text-lg sm:text-xl truncate ${
                    darkMode ? "text-white" : "text-gray-900"
                  }`}
                >
                  {t("settings.title") || "Configurações"}
                </h1>
                <p className="text-xs text-gray-500 hidden sm:block font-medium">
                  {t("settings.subtitle") || "Painel administrativo"}
                </p>
              </div>
            </div>

            {/* Search Desktop */}
            <div className="hidden lg:block flex-1 max-w-md">
              <div className="relative">
                <Search
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  placeholder={t("settings.searchPlaceholder") || "Buscar configurações..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
                    darkMode
                      ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                      : "bg-gray-50 border-gray-200"
                  } focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all`}
                />
              </div>
            </div>

            {/* Actions Desktop */}
            <div className="hidden md:flex items-center gap-2">
              {/* Notificações */}
              <button
                className={`p-2 rounded-lg ${
                  darkMode
                    ? "hover:bg-gray-700 text-gray-300"
                    : "hover:bg-gray-100 text-gray-700"
                } transition-colors relative border border-transparent`}
                title={t("actions.notifications") || "Notificações"}
              >
                <Bell size={20} />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white dark:border-gray-800"></span>
              </button>

              {/* Ajuda */}
              <button
                className={`p-2 rounded-lg ${
                  darkMode
                    ? "hover:bg-gray-700 text-gray-300"
                    : "hover:bg-gray-100 text-gray-700"
                } transition-colors`}
                title={t("actions.help") || "Ajuda"}
              >
                <HelpCircle size={20} />
              </button>

              {/* Dark Mode Toggle */}
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`p-2 rounded-lg ${
                  darkMode
                    ? "bg-gray-700 text-yellow-400 border border-gray-600"
                    : "bg-gray-100 text-gray-700 border border-gray-200"
                } hover:opacity-80 transition-all`}
                title={darkMode ? (t("actions.lightMode") || "Modo Claro") : (t("actions.darkMode") || "Modo Escuro")}
              >
                {darkMode ? <Sun size={18} /> : <Moon size={18} />}
              </button>

              {/* User Menu */}
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowUserMenu(!showUserMenu);
                  }}
                  className={`flex items-center gap-2 pl-2 pr-2 py-1.5 rounded-lg border ${
                    darkMode
                      ? "hover:bg-gray-700 border-gray-700 text-white"
                      : "hover:bg-gray-50 border-gray-200 text-gray-900"
                  } transition-colors`}
                >
                  <div className="w-8 h-8 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0">
                    {user?.nome?.slice(0, 2) || "U"}
                  </div>
                  <div className="text-left hidden xl:block">
                    <div className="text-sm font-bold truncate max-w-[120px]">
                      {user?.nome || "Usuário"}
                    </div>
                    <div className="text-xs text-gray-500 font-medium truncate max-w-[120px]">
                      {user?.email || "email@example.com"}
                    </div>
                  </div>
                  <ChevronDown size={16} className="text-gray-400" />
                </button>

                {/* Dropdown Menu */}
                {showUserMenu && (
                  <div
                    className={`absolute right-0 mt-2 w-56 rounded-xl shadow-lg ${
                      darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
                    } border py-2 z-50`}
                  >
                    <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                      <p className={`text-sm font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>
                        {user?.nome || "Usuário"}
                      </p>
                      <p className="text-xs text-gray-500 font-medium truncate">
                        {user?.email || "email@example.com"}
                      </p>
                    </div>
                    <div className="p-1">
                      <button
                        onClick={handleLogout}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium ${
                          darkMode
                            ? "hover:bg-gray-700 text-red-400"
                            : "hover:bg-red-50 text-red-600"
                        } transition-colors`}
                      >
                        <LogOut size={16} />
                        {t("actions.logout") || "Sair"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile Actions */}
            <div className="flex md:hidden items-center gap-2">
              <button
                onClick={() => setShowMobileSearch(!showMobileSearch)}
                className={`p-2 rounded-lg border ${
                  darkMode ? "hover:bg-gray-700 border-gray-700" : "hover:bg-gray-100 border-gray-200"
                }`}
              >
                <Search size={18} />
              </button>

              <button
                className={`p-2 rounded-lg border ${
                  darkMode
                    ? "hover:bg-gray-700 text-white border-gray-700"
                    : "hover:bg-gray-100 text-gray-900 border-gray-200"
                }`}
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
              </button>
            </div>
          </div>

          {/* Mobile Search */}
          {showMobileSearch && (
            <div className="mt-3 lg:hidden">
              <div className="relative">
                <Search
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  placeholder={t("settings.searchPlaceholder") || "Buscar configurações..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
                    darkMode
                      ? "bg-gray-700 border-gray-600 text-white"
                      : "bg-gray-50 border-gray-200"
                  } focus:ring-2 focus:ring-blue-500/50 outline-none`}
                  autoFocus
                />
              </div>
            </div>
          )}

          {/* Tabs Desktop */}
          <nav className="hidden md:flex gap-2 mt-4 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
            {allowedTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all whitespace-nowrap border ${
                    isActive
                      ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                      : darkMode
                      ? "text-gray-300 hover:bg-gray-700 border-transparent"
                      : "text-gray-600 hover:bg-gray-100 border-transparent"
                  }`}
                >
                  <Icon size={16} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Mobile Tabs Menu */}
        {mobileMenuOpen && (
          <div
            className={`md:hidden border-t shadow-inner ${
              darkMode ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-gray-50"
            } px-4 py-3 space-y-1.5 max-h-[70vh] overflow-y-auto`}
          >
            {allowedTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${
                    isActive
                      ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                      : darkMode
                      ? "text-gray-300 hover:bg-gray-700 border-transparent"
                      : "text-gray-700 bg-white border-gray-200 shadow-sm"
                  }`}
                >
                  <Icon size={18} />
                  <div className="text-left flex-1">
                    <div className="font-bold text-sm">{tab.label}</div>
                    <div
                      className={`text-xs font-medium mt-0.5 ${
                        isActive
                          ? "text-blue-100"
                          : darkMode
                          ? "text-gray-500"
                          : "text-gray-500"
                      }`}
                    >
                      {tab.description}
                    </div>
                  </div>
                </button>
              );
            })}

            <div className="pt-2 mt-2 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={handleLogout}
                className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-sm border ${
                  darkMode
                    ? "bg-red-900/20 text-red-400 border-red-900/50 hover:bg-red-900/40"
                    : "bg-white text-red-600 border-gray-200 hover:bg-red-50 shadow-sm"
                } transition-colors`}
              >
                <LogOut size={18} />
                {t("actions.logout") || "Sair da Conta"}
              </button>
            </div>
          </div>
        )}
      </header>

      {/* ================= CONTENT ================= */}
      <main className={`p-4 sm:p-6 md:p-8 ${darkMode ? "text-white" : ""}`}>
        <div className="max-w-7xl mx-auto">
          {allowedTabs.length === 0 ? (
            <div
              className={`text-center py-20 bg-white border rounded-xl shadow-sm ${
                darkMode ? "text-gray-400 border-gray-800 bg-[#1C1C1E]" : "text-gray-500 border-gray-200"
              }`}
            >
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Settings size={28} className="opacity-50" />
              </div>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {t("settings.emptyStateTitle") || "Nenhuma configuração disponível"}
              </p>
              <p className="text-sm mt-1 font-medium">
                {t("settings.emptyStateDesc") || "Você não tem permissões para acessar configurações no momento."}
              </p>
            </div>
          ) : (
            <Suspense fallback={<Skeleton />}>
              <ActiveComponent />
            </Suspense>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer
        className={`mt-auto py-6 px-4 text-center text-sm font-medium ${
          darkMode ? "text-gray-500 border-gray-800" : "text-gray-500 border-gray-200"
        } border-t`}
      >
        <p>© {new Date().getFullYear()} - {t("settings.footerText") || "Sistema de Gestão"}</p>
      </footer>
    </div>
  );
}
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
  HelpCircle,
  Filter,
} from "lucide-react";

import { useSession } from "@/context/SessionContext";
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
   CONFIGURAÇÃO DAS ABAS
======================= */

const tabs: TabConfig[] = [
  {
    id: "usuario",
    label: "Usuário",
    icon: User,
    permission: "settings:user",
    description: "Perfil e preferências",
  },
  {
    id: "empresa",
    label: "Empresa",
    icon: Building,
    permission: "settings:company",
    description: "Dados corporativos",
  },
  {
    id: "projetos",
    label: "Projetos",
    icon: FolderKanban,
    permission: "settings:projects",
    description: "Gestão de projetos",
  },
  {
    id: "equipe",
    label: "Equipe",
    icon: Users,
    permission: "settings:team",
    description: "Usuários e permissões",
  },
  {
    id: "integracoes",
    label: "Integrações",
    icon: Plug,
    permission: "settings:integrations",
    description: "Conexões externas",
  },
  {
    id: "sistema",
    label: "Sistema",
    icon: Settings,
    permission: "settings:system",
    description: "Logs e manutenção",
  },
];

/* =======================
   PÁGINA PRINCIPAL
======================= */

export default function SettingsPage() {
  const { user, logout } = useSession();

  const [activeTab, setActiveTab] = useState<SettingsTab>("usuario");
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);

  /* ===== Tabs permitidas (RBAC) ===== */
  const allowedTabs = useMemo(
    () =>
      tabs.filter(
        (tab) =>
          hasPermission(user?.permissions || [], tab.permission) &&
          matchesSearch(tab, searchQuery)
      ),
    [user?.permissions, searchQuery]
  );

  /* ===== Garantir tab válida ===== */
  useEffect(() => {
    console.log(user);
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
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center flex-shrink-0 shadow-md">
                <Settings className="text-white" size={18} />
              </div>
              <div className="min-w-0">
                <h1
                  className={`font-bold text-lg sm:text-xl truncate ${
                    darkMode ? "text-white" : "text-gray-900"
                  }`}
                >
                  Configurações
                </h1>
                <p className="text-xs text-gray-500 hidden sm:block">
                  Painel administrativo
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
                  placeholder="Buscar configurações..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
                    darkMode
                      ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                      : "bg-gray-50 border-gray-200"
                  } focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all`}
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
                } transition-colors relative`}
                title="Notificações"
              >
                <Bell size={20} />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>

              {/* Ajuda */}
              <button
                className={`p-2 rounded-lg ${
                  darkMode
                    ? "hover:bg-gray-700 text-gray-300"
                    : "hover:bg-gray-100 text-gray-700"
                } transition-colors`}
                title="Ajuda"
              >
                <HelpCircle size={20} />
              </button>

              {/* Dark Mode Toggle */}
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`p-2 rounded-lg ${
                  darkMode
                    ? "bg-gray-700 text-yellow-400"
                    : "bg-gray-100 text-gray-700"
                } hover:opacity-80 transition-all`}
                title={darkMode ? "Modo Claro" : "Modo Escuro"}
              >
                {darkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>

              {/* User Menu */}
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowUserMenu(!showUserMenu);
                  }}
                  className={`flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-lg ${
                    darkMode
                      ? "hover:bg-gray-700 text-white"
                      : "hover:bg-gray-100 text-gray-900"
                  } transition-colors`}
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {user?.nome?.slice(0, 2) || "U"}
                  </div>
                  <div className="text-left hidden xl:block">
                    <div className="text-sm font-medium truncate max-w-[120px]">
                      {user?.nome || "Usuário"}
                    </div>
                    <div className="text-xs text-gray-500 truncate max-w-[120px]">
                      {user?.email || "email@example.com"}
                    </div>
                  </div>
                  <ChevronDown size={16} className="text-gray-400" />
                </button>

                {/* Dropdown Menu */}
                {showUserMenu && (
                  <div
                    className={`absolute right-0 mt-2 w-56 rounded-lg shadow-lg ${
                      darkMode ? "bg-gray-800 border-gray-700" : "bg-white"
                    } border py-2 z-50`}
                  >
                    <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                      <p className={`text-sm font-medium ${darkMode ? "text-white" : "text-gray-900"}`}>
                        {user?.nome || "Usuário"}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {user?.email || "email@example.com"}
                      </p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm ${
                        darkMode
                          ? "hover:bg-gray-700 text-red-400"
                          : "hover:bg-gray-50 text-red-600"
                      } transition-colors`}
                    >
                      <LogOut size={16} />
                      Sair
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile Actions */}
            <div className="flex md:hidden items-center gap-2">
              {/* Search Toggle Mobile */}
              <button
                onClick={() => setShowMobileSearch(!showMobileSearch)}
                className={`p-2 rounded-lg ${
                  darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"
                }`}
              >
                <Search size={20} />
              </button>

              {/* Mobile Menu Toggle */}
              <button
                className={`p-2 rounded-lg ${
                  darkMode
                    ? "hover:bg-gray-700 text-white"
                    : "hover:bg-gray-100 text-gray-900"
                }`}
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
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
                  placeholder="Buscar configurações..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
                    darkMode
                      ? "bg-gray-700 border-gray-600 text-white"
                      : "bg-gray-50 border-gray-200"
                  } focus:ring-2 focus:ring-blue-500 outline-none`}
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
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all whitespace-nowrap ${
                    isActive
                      ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/30"
                      : darkMode
                      ? "text-gray-300 hover:bg-gray-700"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <Icon size={18} />
                  <span>{tab.label}</span>
                  {isActive && (
                    <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Mobile Tabs Menu */}
        {mobileMenuOpen && (
          <div
            className={`md:hidden border-t ${
              darkMode ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"
            } px-4 py-3 space-y-2 max-h-[70vh] overflow-y-auto`}
          >
        

            

            {/* Tabs */}
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
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    isActive
                      ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg"
                      : darkMode
                      ? "text-gray-300 hover:bg-gray-700"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <Icon size={20} />
                  <div className="text-left flex-1">
                    <div className="font-medium">{tab.label}</div>
                    <div
                      className={`text-xs ${
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
                  {isActive && (
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  )}
                </button>
              );
            })}

            {/* Logout Mobile */}
            <button
              onClick={handleLogout}
              className={`w-full flex items-center gap-3 px-4 py-3 mt-2 rounded-lg ${
                darkMode
                  ? "bg-red-900/30 text-red-400 hover:bg-red-900/50"
                  : "bg-red-50 text-red-600 hover:bg-red-100"
              } transition-colors`}
            >
              <LogOut size={20} />
              <span className="font-medium">Sair da Conta</span>
            </button>
          </div>
        )}
      </header>

      {/* ================= CONTENT ================= */}
      <main className={`p-4 sm:p-6 md:p-8 ${darkMode ? "text-white" : ""}`}>
        <div className="max-w-7xl mx-auto">
          {allowedTabs.length === 0 ? (
            <div
              className={`text-center py-20 ${
                darkMode ? "text-gray-400" : "text-gray-500"
              }`}
            >
              <Settings size={48} className="mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">
                Nenhuma configuração disponível
              </p>
              <p className="text-sm mt-2">
                Você não tem permissões para acessar configurações no momento.
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
        className={`mt-auto py-6 px-4 text-center text-sm ${
          darkMode ? "text-gray-500 border-gray-800" : "text-gray-500 border-gray-200"
        } border-t`}
      >
        <p>© {new Date().getFullYear()} - Sistema de Gestão</p>
      </footer>
    </div>
  );
}
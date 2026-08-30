"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  Bell,
  Lock,
  Palette,
  User,
  Globe,
  Clock,
  Download,
  Trash2,
  CheckCircle2,
  LogOut,
  ChevronRight,
  LucideIcon,
} from "lucide-react";
import { useSession } from "@/context/SessionContext";
import { useI18n } from "@/context/I18nContext";
import { EditModal } from "./ComponentUsuarioTab/EditModal";
import { hasPermission } from "@/permissions_val";
import {
  Sessao,
  deleteAccount,
  downloadUserData,
  listarSessoes,
  terminarSessao,
} from "@/app/services/settingsApi";

/* =======================
   INTERFACES
======================= */
interface UserSettingItem {
  id: string;
  icon: LucideIcon;
  title: string;
  description: string;
  permission?: string;
  badge?: string;
  color?: string;
}

interface StatCardProps {
  icon: LucideIcon;
  value: string;
  label: string;
  color: string;
}

/* =======================
   COMPONENTES AUXILIARES
======================= */

const StatCard: React.FC<StatCardProps> = ({ icon: Icon, value, label, color }) => {
  return (
    <div className={`rounded-xl p-3 sm:p-4 ${color}`}>
      <div className="flex items-center justify-between gap-2 sm:gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xl sm:text-2xl font-bold truncate">{value}</p>
          <p className="text-xs sm:text-xs font-medium opacity-90 mt-1 line-clamp-2">{label}</p>
        </div>
        <Icon size={18} className="opacity-80 flex-shrink-0 sm:w-5 sm:h-5" />
      </div>
    </div>
  );
};

const SettingItem = ({
  icon: Icon,
  title,
  description,
  badge,
  onClick,
  color = "text-blue-600 bg-blue-50",
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  badge?: string;
  onClick: () => void;
  color?: string;
}) => (
  <button
    onClick={onClick}
    className="group relative bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl sm:rounded-2xl p-4 sm:p-5 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md transition-all duration-300 text-left w-full overflow-hidden"
  >
    <div className="absolute top-0 right-0 p-3 sm:p-4 opacity-0 group-hover:opacity-100 transition-opacity text-gray-300 dark:text-gray-600">
      <ChevronRight size={18} className="sm:w-5 sm:h-5" />
    </div>

    <div className="flex items-start gap-3 sm:gap-4">
      <div className={`p-2.5 sm:p-3.5 rounded-lg sm:rounded-xl ${color} group-hover:scale-110 transition-transform duration-300 flex-shrink-0`}>
        <Icon size={20} className="sm:w-6 sm:h-6" />
      </div>
      <div className="flex-1 min-w-0 pr-6">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <h3 className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">
            {title}
          </h3>
          {badge && (
            <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 text-[9px] sm:text-[10px] uppercase tracking-wider rounded-full font-bold flex-shrink-0">
              {badge}
            </span>
          )}
        </div>
        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-2">
          {description}
        </p>
      </div>
    </div>
  </button>
);

/* =======================
   COMPONENTE PRINCIPAL
======================= */
export function UsuarioTab() {
  const [modalOpen, setModalOpen] = useState<string | null>(null);
  const { user, logout } = useSession();
  const { t } = useI18n();

  const settings: UserSettingItem[] = [
    {
      id: "profile",
      icon: User,
      title: t("profile.personal.title") || "Perfil Pessoal",
      description: t("profile.personal.description") || "Gerencie seus dados de identificação e contato.",
      permission: "settings:user",
      color: "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20",
    },
    {
      id: "security",
      icon: Lock,
      title: t("profile.security.title") || "Login e Segurança",
      description: t("profile.security.description") || "Proteja sua conta e verifique atividades suspeitas.",
      permission: "settings:user",
      badge: t("profile.critical") || "Crítico",
      color: "text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20",
    },
    {
      id: "notifications",
      icon: Bell,
      title: t("profile.notifications.title") || "Notificações",
      description: t("profile.notifications.description") || "Escolha como e quando você quer ser alertado.",
      permission: "settings:user",
      color: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20",
    },
    {
      id: "appearance",
      icon: Palette,
      title: t("profile.preferences.title") || "Preferências",
      description: t("profile.preferences.description") || "Ajuste o tema, idioma e visualização do sistema.",
      color: "text-pink-600 dark:text-pink-400 bg-pink-50 dark:bg-pink-900/20",
    },
  ];

  // Sessões reais, dos refresh tokens. A lista que aqui estava era fixa
  // ("Chrome/Windows", "Há 2 semanas") e não descrevia esta conta.
  const [sessoes, setSessoes] = useState<Sessao[]>([]);
  const [aCarregarSessoes, setACarregarSessoes] = useState(true);

  const carregarSessoes = useCallback(async () => {
    setACarregarSessoes(true);
    try {
      setSessoes(await listarSessoes());
    } catch {
      setSessoes([]);
    } finally {
      setACarregarSessoes(false);
    }
  }, []);

  useEffect(() => {
    carregarSessoes();
  }, [carregarSessoes]);

  // O último login é a sessão mais recente; `user.lastLogin` nunca existiu.
  const ultimoLogin = sessoes[0]?.criada_em ?? null;
  const sessoesAtivas = sessoes.filter((x) => x.ativa).length;

  const encerrar = async (id: number) => {
    try {
      await terminarSessao(id);
      setSessoes((anteriores) =>
        anteriores.map((x) => (x.id === id ? { ...x, ativa: false } : x))
      );
    } catch {
      setErro(t("profile.sessionError") || "Não foi possível terminar a sessão.");
    }
  };


  const [aExportar, setAExportar] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const handleExportData = async () => {
    setAExportar(true);
    setErro(null);
    try {
      await downloadUserData();
    } catch {
      setErro(t("profile.exportError") || "Não foi possível exportar os seus dados.");
    } finally {
      setAExportar(false);
    }
  };

  const handleDeleteAccount = async () => {
    // Desativa, não apaga: a conta tem projetos e conexões pendurados, e o
    // backend recusa-se a levá-los com ela.
    const aviso =
      t("profile.deactivateConfirmation") ||
      "Desativar a conta termina todas as sessões e retira-lhe o acesso. Só um administrador a pode reativar. Continuar?";
    if (!window.confirm(aviso)) return;

    try {
      await deleteAccount();
      await logout();
    } catch {
      setErro(t("profile.deleteError") || "Não foi possível desativar a conta.");
    }
  };

  const handleLogout = () => logout();

  return (
    <div className="w-full min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto pb-8 sm:pb-10 px-3 sm:px-4 lg:px-6 xl:px-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white tracking-tight">
            {t("profile.title") || "Minha Conta"}
          </h1>
          <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mt-1 sm:mt-2">
            {t("profile.subtitle") || "Gerencie suas informações pessoais, privacidade e segurança."}
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* Left Column - Settings Cards */}
          <div className="lg:col-span-8 space-y-6">
            {/* Settings Grid - Responsive 1->2 cols */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {settings
                .filter((item) => hasPermission(user?.permissions || [], item.permission))
                .map((item) => (
                  <SettingItem key={item.id} {...item} onClick={() => setModalOpen(item.id)} />
                ))}
            </div>

            {erro && (
              <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800/30 px-4 py-3 text-sm text-red-700 dark:text-red-300">
                <Trash2 size={16} className="mt-0.5 shrink-0" />
                <span>{erro}</span>
              </div>
            )}

            {/* Danger Zone */}
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/30 rounded-xl sm:rounded-2xl p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-6 sm:mt-8">
              <div className="flex gap-3 sm:gap-4 items-start sm:items-center flex-1 min-w-0">
                <div className="p-2.5 sm:p-3 bg-white dark:bg-red-900/40 rounded-full text-red-500 dark:text-red-400 shadow-sm flex-shrink-0">
                  <Trash2 size={18} className="sm:w-5 sm:h-5" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-bold text-sm sm:text-base text-red-900 dark:text-red-100">
                    {t("profile.dangerZone.title") || "Zona de Perigo"}
                  </h4>
                  <p className="text-xs sm:text-sm text-red-700 dark:text-red-300 line-clamp-2">
                    {t("profile.dangerZone.description") ||
                      "Desativar termina todas as sessões e retira-lhe o acesso. Só um administrador pode reativar."}
                  </p>
                </div>
              </div>
              <div className="flex gap-2 w-full sm:w-auto flex-shrink-0">
                <button
                  onClick={handleExportData}
                  disabled={aExportar}
                  className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 rounded-lg text-xs sm:text-sm font-medium shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 hover:scale-[1.02] disabled:opacity-50"
                >
                  <Download
                    size={14}
                    className={`sm:w-4 sm:h-4 ${aExportar ? "animate-pulse" : ""}`}
                  />
                  <span className="hidden xs:inline">{t("profile.export") || "Exportar"}</span>
                  <span className="inline xs:hidden">{t("profile.export") || "Exp."}</span>
                </button>
                <button
                  onClick={handleDeleteAccount}
                  className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 text-white rounded-lg text-xs sm:text-sm font-medium shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 hover:scale-[1.02]"
                >
                  <Trash2 size={14} className="sm:w-4 sm:h-4" />
                  <span className="hidden xs:inline">{t("profile.deactivateAccount") || "Desativar Conta"}</span>
                  <span className="inline xs:hidden">{t("profile.deactivateAccount") || "Desativar"}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar - Right Column */}
          <div className="lg:col-span-4 w-full space-y-4 sm:space-y-6 lg:sticky lg:top-4">
            {/* Profile Card */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm text-center relative overflow-hidden group hover:shadow-lg transition-shadow">
              <div className="absolute top-0 left-0 w-full h-16 sm:h-20 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-10 dark:opacity-20"></div>
              <div className="relative mt-2 sm:mt-4">
                <div className="w-16 sm:w-20 h-16 sm:h-20 mx-auto rounded-full bg-gradient-to-br from-gray-800 to-gray-900 dark:from-gray-700 dark:to-gray-800 text-white flex items-center justify-center text-xl sm:text-2xl font-bold border-4 border-white dark:border-gray-800 shadow-lg group-hover:scale-105 transition-transform flex-shrink-0 overflow-hidden">
                  {user?.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={user.avatar_url}
                      alt={user?.nome || ""}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    user?.nome?.charAt(0).toUpperCase() || "U"
                  )}
                </div>
                <h2 className="mt-2 sm:mt-3 text-base sm:text-lg font-bold text-gray-900 dark:text-white line-clamp-1">
                  {user?.nome || t("profile.defaultUsername") || "Usuário"}
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate px-2 sm:px-4 mt-1">
                  {user?.email}
                </p>
                <span className="inline-block mt-2 sm:mt-3 px-2 sm:px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-[10px] sm:text-xs font-semibold rounded-full border border-gray-200 dark:border-gray-600">
                  {user?.roles?.map?.((role) => (typeof role === "string" ? role : role.name)).join(", ") ||
                    t("profile.defaultRole") ||
                    "Membro"}
                </span>
              </div>

              {/* Profile Stats Grid */}
              <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-100 dark:border-gray-700 grid grid-cols-2 gap-3 sm:gap-4 text-center">
                <div className="min-w-0">
                  <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 truncate">
                    {t("profile.memberSince") || "Membro desde"}
                  </p>
                  <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white mt-1">
                    {user?.created_at
                      ? new Date(user.created_at).toLocaleDateString("pt-PT", {
                          year: "numeric",
                          month: "short",
                        })
                      : "—"}
                  </p>
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 truncate">
                    {t("profile.lastLogin") || "Último login"}
                  </p>
                  <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white mt-1">
                    {ultimoLogin
                      ? new Date(ultimoLogin).toLocaleDateString("pt-PT", {
                          day: "2-digit",
                          month: "2-digit",
                        })
                      : "—"}
                  </p>
                </div>
              </div>
            </div>

            {/* Stats Cards Grid */}
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <StatCard
                icon={Globe}
                value={sessoesAtivas.toString()}
                label={t("profile.stats.activeSessions") || "Sessões ativas"}
                color="bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border border-green-100 dark:border-green-800/30"
              />
              <StatCard
                icon={CheckCircle2}
                value={(user?.permissions?.length ?? 0).toString()}
                label={t("profile.stats.permissions") || "Permissões"}
                color="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800/30"
              />
            </div>

            {/* Sessões — dados reais dos refresh tokens */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl sm:rounded-2xl p-4 sm:p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4 gap-2">
                <h3 className="font-semibold text-xs sm:text-sm text-gray-900 dark:text-white flex items-center gap-2 uppercase tracking-wide">
                  <Clock size={14} className="sm:w-4 sm:h-4" />
                  {t("profile.sessions") || "Sessões"}
                </h3>
                <button
                  onClick={carregarSessoes}
                  disabled={aCarregarSessoes}
                  className="text-[10px] sm:text-xs text-blue-600 hover:text-blue-800 disabled:opacity-50"
                >
                  {t("common.refresh") || "Atualizar"}
                </button>
              </div>

              {aCarregarSessoes && sessoes.length === 0 ? (
                <p className="text-xs text-gray-400">{t("common.loading") || "A carregar…"}</p>
              ) : sessoes.length === 0 ? (
                <p className="text-xs text-gray-400">
                  {t("profile.noSessions") || "Sem sessões registadas."}
                </p>
              ) : (
                <div className="space-y-0 relative">
                  <div className="absolute left-3 sm:left-4 top-2 bottom-4 w-0.5 bg-gray-100 dark:bg-gray-700" />

                  {sessoes.slice(0, 6).map((sessao) => (
                    <div
                      key={sessao.id}
                      className="flex gap-3 sm:gap-4 relative py-2 sm:py-3 first:pt-0 last:pb-0 group"
                    >
                      <div
                        className={`relative z-10 w-7 sm:w-8 h-7 sm:h-8 rounded-full border flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform ${
                          sessao.ativa
                            ? "bg-green-50 border-green-200 text-green-600 dark:bg-green-900/30 dark:border-green-800"
                            : "bg-white border-gray-200 text-gray-400 dark:bg-gray-700 dark:border-gray-600"
                        }`}
                      >
                        <Globe size={12} className="sm:w-3.5 sm:h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                          {sessao.ip || t("profile.unknownOrigin") || "Origem desconhecida"}
                          {sessao.ativa && (
                            <span className="ml-2 text-[9px] uppercase font-bold text-green-600">
                              {t("profile.active") || "ativa"}
                            </span>
                          )}
                        </p>
                        {/* O sistema guarda um hash do user-agent, não o nome do
                            navegador: mostra-se como identificador, não como
                            "Chrome/Windows". */}
                        <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 truncate">
                          {t("profile.sessionId") || "id"} {sessao.dispositivo || "—"}
                        </p>
                        <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {sessao.criada_em
                            ? new Date(sessao.criada_em).toLocaleString("pt-PT")
                            : "—"}
                        </p>
                      </div>
                      {sessao.ativa && (
                        <button
                          onClick={() => encerrar(sessao.id)}
                          className="self-start text-[10px] sm:text-xs text-red-600 hover:text-red-800 shrink-0"
                        >
                          {t("profile.endSession") || "Terminar"}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 p-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg sm:rounded-xl transition-colors text-xs sm:text-sm font-medium border border-red-100 dark:border-red-800/30 hover:border-red-200 dark:hover:border-red-700"
            >
              <LogOut size={16} className="sm:w-5 sm:h-5" />
              {t("profile.logout") || "Sair da conta"}
            </button>
          </div>
        </div>
      </div>

      {modalOpen && (
        <EditModal
          user={user}
          isOpen={!!modalOpen}
          onClose={() => setModalOpen(null)}
          settingId={modalOpen}
          title={settings.find((s) => s.id === modalOpen)?.title || ""}
        />
      )}
    </div>
  );
}
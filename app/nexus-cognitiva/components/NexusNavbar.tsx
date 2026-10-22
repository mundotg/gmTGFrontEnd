"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Brain,
  Sparkles,
  ArrowLeft,
  PlusCircle,
  BookOpen,
  LayoutDashboard,
  LogOut,
  User,
  Shield,
  Layers,
  FileText,
  Bell,
  MessageSquare,
  CheckCheck,
  Trash2,
  ExternalLink,
} from "lucide-react";
import { useSession } from "@/context/SessionContext";
import { useI18n } from "@/context/I18nContext";
import { LanguageSelector } from "@/app/home/configuracao/configuracaoTab/ComponentUsuarioTab/LanguageSelector";
import { useNexusNotifications } from "./NexusNotificationContext";
import {
  getNexusFeedPath,
  getNexusPublishPath,
  getNexusPlanPath,
  getMainPlatformUrl,
  isStandaloneNexusDomain,
} from "../services/nexusUrl";

import { useState, useRef, useEffect } from "react";

interface NexusNavbarProps {
  onOpenLogin?: () => void;
}

function formatTimeAgo(isoString: string) {
  try {
    const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
    if (diff < 60) return "agora";
    if (diff < 3600) return `${Math.floor(diff / 60)} min atrás`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} h atrás`;
    return `${Math.floor(diff / 86400)} d atrás`;
  } catch {
    return "";
  }
}

export const NexusNavbar: React.FC<NexusNavbarProps> = ({ onOpenLogin }) => {
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useSession();
  const { t } = useI18n();
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearAll,
    isConnected,
  } = useNexusNotifications();

  const isStandalone = isStandaloneNexusDomain();
  const feedPath = getNexusFeedPath();
  const publishPath = getNexusPublishPath();
  const planPath = getNexusPlanPath();
  const mainPlatformUrl = getMainPlatformUrl();

  const [isOpenNotifications, setIsOpenNotifications] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(e.target as Node)
      ) {
        setIsOpenNotifications(false);
      }
    }
    if (isOpenNotifications) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpenNotifications]);

  const navLinks = [
    {
      href: feedPath,
      label: t("nexus.navFeed") || "Feed de Publicações",
      icon: BookOpen,
      exact: true,
    },
    {
      href: publishPath,
      label: t("nexus.navPublish") || "Publicar Artigo",
      icon: PlusCircle,
      exact: false,
    },
    {
      href: planPath,
      label: t("nexus.navPlan") || "Plano do Produto",
      icon: FileText,
      exact: false,
    },
  ];

  return (
    <header className="sticky top-0 z-40 backdrop-blur-md bg-white/95 dark:bg-[#111D3D]/95 border-b border-[#DCE3EA] dark:border-[#1E2D5A] px-4 sm:px-8 py-3 transition-colors font-interface">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* LOGO & SUBSITE BRANDING */}
        <div className="flex items-center gap-3.5">
          {/* <Link
            href={isStandalone ? mainPlatformUrl : "/"}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-[#475569] dark:text-slate-300 hover:text-[#14283F] dark:hover:text-white bg-[#F4F7FA] dark:bg-[#0B132B] hover:bg-[#E8EEF4] dark:hover:bg-slate-800/80 transition-all border border-[#DCE3EA] dark:border-[#1E2D5A] shrink-0"
            title={t("nexus.parentPlatform") || "MustInfo"}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden md:inline">MustInfo</span>
          </Link> */}

          <Link href={feedPath} className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-[#14283F] dark:bg-[#087E8B] flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
              <Brain className="w-5 h-5 text-teal-300 dark:text-white" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-sm tracking-tight text-[#14283F] dark:text-white group-hover:text-[#087E8B] dark:group-hover:text-teal-300 transition-colors">
                  NEXUS COGNITIVA
                </span>
                <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-[#087E8B]/10 text-[#087E8B] dark:bg-teal-500/20 dark:text-teal-300 border border-[#087E8B]/20 dark:border-teal-500/30">
                  {t("nexus.subsite") || "Subsite"}
                </span>
              </div>
              <span className="text-[10px] text-[#475569] dark:text-slate-400 font-medium">
                {t("nexus.parentPlatform") || "Uma plataforma MustInfo"}
              </span>
            </div>
          </Link>
        </div>

        {/* NAVEGAÇÃO CENTRAL */}
        <nav className="hidden lg:flex items-center gap-1 bg-[#F4F7FA] dark:bg-[#0B132B]/80 p-1 rounded-xl border border-[#DCE3EA] dark:border-[#1E2D5A]">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = link.exact
              ? pathname === link.href
              : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={(e) => {
                  if (link.href === publishPath && !isAuthenticated) {
                    e.preventDefault();
                    onOpenLogin?.();
                  }
                }}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-[#087E8B] text-white shadow-sm"
                    : "text-[#475569] dark:text-slate-300 hover:text-[#14283F] dark:hover:text-white hover:bg-white dark:hover:bg-slate-800"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* AÇÕES E PERFIL */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="hidden sm:block">
            <LanguageSelector />
          </div>

          {/* SINO DE NOTIFICAÇÕES (WEBSOCKET AO VIVO) */}
          <div className="relative" ref={notificationRef}>
            <button
              onClick={() => setIsOpenNotifications((prev) => !prev)}
              className={`relative p-2 rounded-xl border transition-all ${
                isOpenNotifications
                  ? "bg-[#087E8B]/10 border-[#087E8B] text-[#087E8B] dark:text-teal-400"
                  : "bg-white dark:bg-[#0B132B] border-[#DCE3EA] dark:border-[#1E2D5A] hover:border-[#087E8B] text-[#14283F] dark:text-slate-300"
              }`}
              title="Notificações em tempo real"
              aria-label="Notificações"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-[#087E8B] text-[10px] font-bold text-white shadow-sm ring-2 ring-white dark:ring-[#111D3D] animate-pulse">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {/* DROPDOWN DE NOTIFICAÇÕES */}
            {isOpenNotifications && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white dark:bg-[#111D3D] border border-[#DCE3EA] dark:border-[#1E2D5A] shadow-2xl z-50 overflow-hidden font-interface animate-in fade-in slide-in-from-top-2 duration-150">
                {/* CABEÇALHO DO DROPDOWN */}
                <div className="px-4 py-3 bg-[#F4F7FA] dark:bg-[#0B132B] border-b border-[#DCE3EA] dark:border-[#1E2D5A] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#14283F] dark:text-white">
                      Notificações
                    </span>
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isConnected ? "bg-emerald-500" : "bg-amber-500"
                      }`}
                      title={isConnected ? "WebSocket conectado (Ao vivo)" : "Reconectando..."}
                    />
                    {unreadCount > 0 && (
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-[#087E8B]/10 text-[#087E8B] dark:bg-teal-500/20 dark:text-teal-300">
                        {unreadCount} novas
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="text-[11px] font-medium text-[#087E8B] dark:text-teal-400 hover:underline flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-white dark:hover:bg-slate-800 transition-colors"
                        title="Marcar todas como lidas"
                      >
                        <CheckCheck className="w-3.5 h-3.5" />
                        <span>Lidas</span>
                      </button>
                    )}
                    {notifications.length > 0 && (
                      <button
                        onClick={clearAll}
                        className="p-1 text-[#475569] dark:text-slate-400 hover:text-red-500 rounded hover:bg-white dark:hover:bg-slate-800 transition-colors"
                        title="Limpar notificações"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* LISTA DE NOTIFICAÇÕES */}
                <div className="max-h-[360px] overflow-y-auto divide-y divide-[#DCE3EA]/60 dark:divide-[#1E2D5A]/60">
                  {notifications.length === 0 ? (
                    <div className="px-6 py-8 text-center text-[#475569] dark:text-slate-400 space-y-2">
                      <div className="w-10 h-10 rounded-full bg-[#F4F7FA] dark:bg-[#0B132B] mx-auto flex items-center justify-center text-[#475569]/60">
                        <Bell className="w-5 h-5" />
                      </div>
                      <p className="text-xs font-semibold text-[#14283F] dark:text-slate-200">
                        Nenhuma notificação por agora
                      </p>
                      <p className="text-[11px] text-[#475569] dark:text-slate-400 leading-relaxed">
                        Quando novos artigos ou comentários forem publicados, você receberá um convite em tempo real!
                      </p>
                    </div>
                  ) : (
                    notifications.map((item) => {
                      const isPost = item.type === "new_post";
                      return (
                        <Link
                          key={item.id}
                          href={item.url || item.action_url || `/nexus-cognitiva/artigo/${item.post_id}`}
                          onClick={() => {
                            markAsRead(item.id);
                            setIsOpenNotifications(false);
                          }}
                          className={`flex items-start gap-3 p-3.5 transition-colors hover:bg-[#F4F7FA] dark:hover:bg-[#0B132B]/80 text-left ${
                            !item.read
                              ? "bg-[#087E8B]/5 dark:bg-[#087E8B]/10"
                              : ""
                          }`}
                        >
                          {/* ÍCONE / AVATAR */}
                          <div className="shrink-0 mt-0.5">
                            {item.author_avatar ? (
                              <img
                                src={item.author_avatar}
                                alt={item.author_name || "Autor"}
                                className="w-8 h-8 rounded-full object-cover border border-[#DCE3EA] dark:border-[#1E2D5A]"
                              />
                            ) : (
                              <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-white shadow-sm ${
                                  isPost
                                    ? "bg-gradient-to-tr from-[#087E8B] to-teal-400"
                                    : "bg-gradient-to-tr from-blue-600 to-indigo-500"
                                }`}
                              >
                                {isPost ? (
                                  <Sparkles className="w-4 h-4" />
                                ) : (
                                  <MessageSquare className="w-4 h-4" />
                                )}
                              </div>
                            )}
                          </div>

                          {/* CONTEÚDO */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1 mb-1">
                              <span className="text-[11px] font-bold text-[#14283F] dark:text-white truncate">
                                {item.title}
                              </span>
                              <span className="text-[10px] text-[#475569] dark:text-slate-400 shrink-0">
                                {formatTimeAgo(item.created_at)}
                              </span>
                            </div>

                            <p className="text-xs text-[#475569] dark:text-slate-300 line-clamp-2 leading-relaxed mb-2">
                              {item.message}
                            </p>

                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#087E8B] dark:text-teal-400 bg-[#087E8B]/10 dark:bg-teal-500/10 px-2 py-0.5 rounded-md hover:bg-[#087E8B]/20 transition-colors">
                                Dar uma olhada
                                <ExternalLink className="w-2.5 h-2.5" />
                              </span>
                              <span className="inline-flex items-center text-[10px] font-medium text-[#475569] dark:text-slate-400">
                                • Comentar ou partilhar
                              </span>
                            </div>
                          </div>

                          {/* PONTO NÃO LIDO */}
                          {!item.read && (
                            <span className="w-2 h-2 rounded-full bg-[#087E8B] dark:bg-teal-400 shrink-0 mt-1.5" />
                          )}
                        </Link>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          <Link
            href={isStandalone ? `${mainPlatformUrl}/home` : "/home"}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-[#0B132B] border border-[#DCE3EA] dark:border-[#1E2D5A] hover:border-[#087E8B] text-[#14283F] dark:text-slate-200 transition-all shadow-sm"
            title={t("nexus.navDashboard") || "Painel"}
          >
            <LayoutDashboard className="w-3.5 h-3.5 text-[#087E8B] dark:text-teal-400" />
            <span>{t("nexus.navDashboard") || "Painel"}</span>
          </Link>

          {isAuthenticated && user ? (
            <div className="flex items-center gap-3 pl-2 border-l border-[#DCE3EA] dark:border-[#1E2D5A]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#14283F] dark:bg-[#087E8B] flex items-center justify-center text-white font-bold text-xs shadow-sm overflow-hidden border border-[#DCE3EA] dark:border-[#1E2D5A]">
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt={user.nome || "Avatar"} className="w-full h-full object-cover" />
                  ) : (
                    user.nome?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || "U"
                  )}
                </div>
                <div className="hidden xl:flex flex-col text-left">
                  <span className="text-xs font-bold text-[#14283F] dark:text-white truncate max-w-[120px]">
                    {user.nome || user.email?.split("@")[0]}
                  </span>
                  <span className="text-[10px] text-[#087E8B] dark:text-teal-400 font-medium truncate max-w-[120px]">
                    {user.cargo?.position || user.roles?.[0]?.name || t("nexus.member") || "Membro"}
                  </span>
                </div>
              </div>

              <button
                onClick={() => logout()}
                className="p-2 rounded-lg text-[#475569] dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 border border-transparent transition-all"
                title={t("nexus.logout") || "Sair"}
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenLogin}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-[#087E8B] hover:bg-[#066570] text-white shadow-sm transition-all active:scale-[0.98]"
            >
              <User className="w-3.5 h-3.5" />
              <span>{t("nexus.login") || "Iniciar Sessão"}</span>
            </button>
          )}
        </div>
      </div>

      {/* SUB-BARRA MOBILE */}
      <div className="lg:hidden flex items-center justify-around gap-2 pt-2.5 mt-2.5 border-t border-[#DCE3EA] dark:border-[#1E2D5A]">
        {navLinks.map((link) => {
          const Icon = link.icon;
          const isActive = link.exact
            ? pathname === link.href
            : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                isActive
                  ? "bg-[#087E8B]/10 text-[#087E8B] dark:bg-teal-500/20 dark:text-teal-300 border border-[#087E8B]/30"
                  : "text-[#475569] dark:text-slate-400 hover:text-[#14283F] dark:hover:text-white"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{link.label.split(" ")[0]}</span>
            </Link>
          );
        })}
      </div>
    </header>
  );
};

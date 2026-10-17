"use client";

import React from "react";
import { useSession } from "@/context/SessionContext";
import { NexusNavbar } from "./NexusNavbar";
import { NexusAuthProvider, useNexusAuth } from "./NexusAuthContext";
import { Brain, Lock } from "lucide-react";
import Link from "next/link";
import { useI18n } from "@/context/I18nContext";

interface NexusLayoutClientProps {
  children: React.ReactNode;
}

const NexusLayoutClientInner: React.FC<NexusLayoutClientProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useSession();
  const { t } = useI18n();
  const { openLoginModal } = useNexusAuth();

  return (
    <div className="relative min-h-screen flex flex-col bg-[#F4F7FA] dark:bg-[#0B132B] text-[#14283F] dark:text-[#F8FAFC] font-interface overflow-x-hidden transition-colors">
      {/* MENU DE BARRA EM CIMA */}
      <NexusNavbar onOpenLogin={() => openLoginModal()} />

      {/* AVISO SE NÃO ESTIVER AUTENTICADO (SEM BLOQUEAR A NAVEGAÇÃO) */}
      {!isLoading && !isAuthenticated && (
        <div className="bg-[#14283F]/5 dark:bg-[#14283F]/40 border-b border-[#DCE3EA] dark:border-[#1E2D5A] px-4 py-2.5 text-center text-xs text-[#14283F] dark:text-slate-300 flex items-center justify-center gap-2 relative z-30">
          <Lock className="w-3.5 h-3.5 text-[#087E8B] dark:text-teal-400" />
          <span>
            {t("nexus.loginNotice") || "A leitura e pesquisa no Nexus Cognitiva são livres."}{" "}
            <button
              onClick={() => openLoginModal()}
              className="font-semibold underline text-[#087E8B] dark:text-teal-400 hover:text-[#066570] ml-1 cursor-pointer"
            >
              {t("nexus.loginNoticeLink") || "Inicie sessão na sua conta"}
            </button>{" "}
            {t("nexus.loginNoticeAction") || "para reagir, comentar, guardar e partilhar publicações."}
          </span>
        </div>
      )}

      {/* CORPO DA PÁGINA (LEITURA E FEED 100% ACESSÍVEIS SEM LOGIN) */}
      <main className="relative z-10 flex-1">{children}</main>

      {/* FOOTER DO SUBSITE */}
      <footer className="relative z-10 mt-20 border-t border-[#DCE3EA] dark:border-[#1E2D5A] bg-white dark:bg-[#111D3D] py-10 px-6 text-center text-xs text-[#475569] dark:text-slate-400 space-y-3 font-interface">
        <div className="flex items-center justify-center gap-2 text-[#14283F] dark:text-white font-semibold">
          <Brain className="w-4 h-4 text-[#087E8B] dark:text-teal-400" />
          <span>Nexus Cognitiva — {t("nexus.subsite") || "Subsite"} MustInfo</span>
        </div>
        <p className="max-w-xl mx-auto text-[#475569] dark:text-slate-300 leading-relaxed">
          {t("nexus.subtitle") || "Plataforma de conhecimento colaborativo."}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-[#087E8B] dark:text-teal-400 font-medium pt-1">
          <Link href="/nexus-cognitiva" className="hover:underline">{t("nexus.navFeed") || "Feed"}</Link>
          <span>•</span>
          <Link href="/nexus-cognitiva/publicar" className="hover:underline">{t("nexus.navPublish") || "Publicar"}</Link>
          <span>•</span>
          <Link href="/nexus-cognitiva/plano" className="hover:underline">{t("nexus.navPlan") || "Plano"}</Link>
          <span>•</span>
          <Link href="/home" className="hover:underline">{t("nexus.navDashboard") || "Painel"}</Link>
        </div>
        <div className="pt-2 text-[11px] text-[#475569]/70 dark:text-slate-500">
          MustInfo © 2026. Todos os direitos reservados.
        </div>
      </footer>
    </div>
  );
};

import { NexusNotificationProvider } from "./NexusNotificationContext";
import { NexusNotificationToast } from "./NexusNotificationToast";

export const NexusLayoutClient: React.FC<NexusLayoutClientProps> = ({ children }) => {
  return (
    <NexusAuthProvider>
      <NexusNotificationProvider>
        <NexusLayoutClientInner>{children}</NexusLayoutClientInner>
        <NexusNotificationToast />
      </NexusNotificationProvider>
    </NexusAuthProvider>
  );
};
export default NexusLayoutClient;

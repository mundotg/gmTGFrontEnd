"use client";

import React from "react";
import Link from "next/link";
import { Sparkles, MessageSquare, X, ArrowRight, Share2, Eye } from "lucide-react";
import { useNexusNotifications } from "./NexusNotificationContext";

export const NexusNotificationToast: React.FC = () => {
  const { activeToast, dismissToast, markAsRead } = useNexusNotifications();

  if (!activeToast) return null;

  const isPost = activeToast.type === "new_post";

  const handleActionClick = () => {
    markAsRead(activeToast.id);
    dismissToast();
  };

  return (
    <div className="fixed bottom-5 right-4 sm:right-6 z-50 max-w-sm sm:max-w-md w-full animate-in fade-in slide-in-from-bottom-5 duration-300 pointer-events-auto font-interface">
      <div className="relative overflow-hidden rounded-2xl bg-white/95 dark:bg-[#111D3D]/95 backdrop-blur-xl border border-[#087E8B]/30 dark:border-teal-500/30 p-4 sm:p-5 shadow-2xl space-y-3.5 ring-1 ring-black/5">
        {/* BARRA SUPERIOR DECORATIVA */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#087E8B] via-teal-400 to-[#14283F]" />

        {/* CABEÇALHO DA NOTIFICAÇÃO */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
                isPost
                  ? "bg-gradient-to-br from-[#087E8B] to-teal-600 text-white"
                  : "bg-gradient-to-br from-indigo-500 to-blue-600 text-white"
              }`}
            >
              {isPost ? <Sparkles className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
            </div>

            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#087E8B]/10 text-[#087E8B] dark:bg-teal-500/20 dark:text-teal-300">
                  {isPost ? "Novo Artigo" : "Nova Discussão"}
                </span>
                <span className="text-[10px] text-[#475569] dark:text-slate-400">Agora mesmo</span>
              </div>
              <h4 className="font-semibold text-sm text-[#14283F] dark:text-white pt-0.5 line-clamp-1">
                {activeToast.title}
              </h4>
            </div>
          </div>

          <button
            onClick={dismissToast}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Fechar notificação"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* CORPO DA MENSAGEM */}
        <p className="text-xs text-[#475569] dark:text-slate-300 leading-relaxed line-clamp-2">
          {activeToast.message}
        </p>

        {/* BOTÕES DE AÇÃO CONVIDATIVOS (LER, COMENTAR, PARTILHAR) */}
        <div className="flex items-center gap-2 pt-1 flex-wrap">
          <Link
            href={activeToast.action_url}
            onClick={handleActionClick}
            className="flex-1 min-w-[120px] inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-[#087E8B] hover:bg-[#066570] text-white shadow-xs transition-all cursor-pointer active:scale-95"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{activeToast.call_to_action || "Dar uma olhada"}</span>
            <ArrowRight className="w-3 h-3 ml-0.5" />
          </Link>

          <Link
            href={`${activeToast.action_url}#comments`}
            onClick={handleActionClick}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-[#F4F7FA] dark:bg-[#0B132B] hover:bg-[#E8EEF4] dark:hover:bg-slate-800 text-[#14283F] dark:text-slate-200 border border-[#DCE3EA] dark:border-[#1E2D5A] transition-all cursor-pointer"
          >
            <MessageSquare className="w-3.5 h-3.5 text-[#087E8B] dark:text-teal-400" />
            <span>Comentar</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

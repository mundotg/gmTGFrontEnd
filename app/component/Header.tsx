"use client";
import React from "react";
import { useI18n } from "@/context/I18nContext";
import { useSession } from "@/context/SessionContext";
import { Sparkles, ShieldCheck, Activity } from "lucide-react";

export default function Header() {
  const { t } = useI18n();
  const { user } = useSession();

  const firstName = user?.nome ? user.nome.split(" ")[0] : "Utilizador";

  return (
    <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-200/80 relative overflow-hidden">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
        <div className="max-w-3xl space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/80">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              MustaInf Data Platform
            </span>
            {user?.empresa?.company && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                🏢 {user.empresa.company}
              </span>
            )}
            {user?.cargo?.position && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                💼 {user.cargo.position}
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Olá, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">{firstName}</span> 👋
          </h1>

          <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
            {t("header.desc.part1") || "Ambiente unificado para monitorizar, auditar e extrair insights das suas bases de dados com "}
            <strong className="font-semibold text-gray-900">
              {t("header.desc.highlight1") || "consultas inteligentes, análise exploratória e automação de pipelines"}
            </strong>.
          </p>
        </div>

        <div className="flex flex-row sm:flex-col items-start sm:items-end justify-between sm:justify-center gap-3 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-gray-100">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <Activity className="w-3.5 h-3.5 text-emerald-600" />
            Sistema Operacional
          </div>
          <div className="text-xs text-gray-400 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-gray-400" />
            Sessão autenticada e protegida
          </div>
        </div>
      </div>
    </div>
  );
}
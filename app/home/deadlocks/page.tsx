"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Activity,
  ArrowLeft,
  Sun,
  Moon,
  Database,
  Server,
  ShieldAlert,
  Info,
  CheckCircle2,
  RefreshCw,
  GitCommit,
  Lock,
  Workflow,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
} from "lucide-react";
import usePersistedState from "@/hook/localStoreUse";
import { useSession } from "@/context/SessionContext";
import { useI18n } from "@/context/I18nContext";
import { DeadlocksMonitor } from "./components/DeadlocksMonitor";

export default function DeadlocksPage() {
  const router = useRouter();
  const { user } = useSession();
  const { t } = useI18n();

  const [isDarkMode, setIsDarkMode] = usePersistedState("tema_menu_tabela", false);
  const [showTheory, setShowTheory] = useState(true);

  const dbName = user?.info_extra?.name_db || "Base de Dados Ativa";
  const dbType = user?.info_extra?.type || "Relacional";

  return (
    <div
      className={`min-h-screen transition-colors duration-200 ${
        isDarkMode ? "bg-[#121214] text-gray-100" : "bg-gray-50 text-gray-900"
      }`}
    >
      {/* ── TOP HEADER / BREADCRUMBS ── */}
      <div
        className={`border-b ${
          isDarkMode ? "bg-[#1C1C1E] border-gray-800" : "bg-white border-gray-200"
        } sticky top-0 z-20 backdrop-blur-md bg-opacity-95`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            {/* Left: Back button + Breadcrumb */}
            <div className="flex items-center gap-3">
              <Link
                href="/home/tabelas"
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  isDarkMode
                    ? "bg-[#2C2C2E] border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white"
                    : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-gray-900 shadow-sm"
                }`}
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Voltar para Tabelas</span>
              </Link>

              <div className={`h-4 w-px ${isDarkMode ? "bg-gray-700" : "bg-gray-200"}`} />

              <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                <Link href="/home" className="hover:text-blue-500 transition-colors">
                  Início
                </Link>
                <span>/</span>
                <Link href="/home/tabelas" className="hover:text-blue-500 transition-colors">
                  Tabelas
                </Link>
                <span>/</span>
                <span className={`font-semibold ${isDarkMode ? "text-gray-200" : "text-gray-800"}`}>
                  Deadlocks
                </span>
              </div>
            </div>

            {/* Right: DB Info & Dark Mode */}
            <div className="flex items-center gap-2.5">
              <div
                className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border ${
                  isDarkMode
                    ? "bg-gray-800/80 border-gray-700 text-gray-300"
                    : "bg-blue-50/80 border-blue-100 text-blue-700"
                }`}
              >
                <Database className="w-3.5 h-3.5 text-blue-500" />
                <span className="font-semibold">{dbName}</span>
                <span className="text-[10px] opacity-75 uppercase">({dbType})</span>
              </div>

              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className={`w-8 h-8 flex items-center justify-center rounded-lg border transition-colors ${
                  isDarkMode
                    ? "bg-[#2C2C2E] border-gray-700 text-gray-400 hover:bg-gray-700 hover:text-gray-200"
                    : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-700 shadow-sm"
                }`}
                title="Alternar tema claro/escuro"
              >
                {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-gray-600" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT CONTAINER ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Banner de Título */}
        <div
          className={`p-6 rounded-2xl border transition-all ${
            isDarkMode
              ? "bg-gradient-to-r from-red-950/40 via-purple-950/20 to-gray-900 border-red-900/40"
              : "bg-gradient-to-r from-red-50 via-white to-purple-50/50 border-red-100 shadow-sm"
          }`}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center text-white shadow-sm flex-shrink-0">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                    Estudo & Monitor de Deadlocks
                  </h1>
                  <p className={`text-xs sm:text-sm mt-0.5 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                    Observabilidade em tempo real de contenção de bloqueios, transações concorrentes e boas práticas de prevenção
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowTheory(!showTheory)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors self-start md:self-auto ${
                isDarkMode
                  ? "bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700"
                  : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50 shadow-sm"
              }`}
            >
              <Info className="w-4 h-4 text-blue-500" />
              <span>{showTheory ? "Ocultar Guia Teórico" : "Exibir Guia Teórico"}</span>
              {showTheory ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* ── GUIA DIDÁTICO / ESTUDO DE DEADLOCKS (COLLAPSIBLE) ── */}
        {showTheory && (
          <div
            className={`p-6 rounded-2xl border transition-all ${
              isDarkMode ? "bg-[#1C1C1E] border-gray-800 text-gray-200" : "bg-white border-gray-200 text-gray-800 shadow-sm"
            }`}
          >
            <div className="flex items-center justify-between mb-4 border-b pb-3 border-gray-200 dark:border-gray-800">
              <h2 className="text-base font-bold flex items-center gap-2 text-red-600 dark:text-red-400">
                <Lock className="w-4 h-4" />
                Fundamentos Teóricos: Como Funcionam os Deadlocks
              </h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300 font-medium">
                Concorrência & ACID
              </span>
            </div>

            {/* Ciclo Visual Ilustrativo */}
            <div
              className={`p-4 rounded-xl border mb-6 ${
                isDarkMode ? "bg-gray-900/80 border-gray-800" : "bg-gray-50 border-gray-200"
              }`}
            >
              <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3 text-center">
                Visualização do Grafo de Espera Circular (Wait-For Cycle)
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center max-w-3xl mx-auto">
                <div
                  className={`p-3.5 rounded-xl border flex flex-col gap-2 ${
                    isDarkMode ? "bg-red-950/30 border-red-800/50" : "bg-red-50 border-red-200"
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-bold text-red-600 dark:text-red-400">
                    <span>Transação A (PID 1024)</span>
                    <span className="px-1.5 py-0.5 rounded bg-red-200/50 dark:bg-red-900/60 text-[10px]">Bloqueado</span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-300">
                    Detém lock exclusivo na <strong className="text-gray-900 dark:text-white">Tabela Pedidos</strong> e aguarda lock na{" "}
                    <strong className="text-gray-900 dark:text-white">Tabela Clientes</strong>.
                  </p>
                </div>

                <div
                  className={`p-3.5 rounded-xl border flex flex-col gap-2 ${
                    isDarkMode ? "bg-blue-950/30 border-blue-800/50" : "bg-blue-50 border-blue-200"
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-bold text-blue-600 dark:text-blue-400">
                    <span>Transação B (PID 2048)</span>
                    <span className="px-1.5 py-0.5 rounded bg-blue-200/50 dark:bg-blue-900/60 text-[10px]">Bloqueado</span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-300">
                    Detém lock exclusivo na <strong className="text-gray-900 dark:text-white">Tabela Clientes</strong> e aguarda lock na{" "}
                    <strong className="text-gray-900 dark:text-white">Tabela Pedidos</strong>.
                  </p>
                </div>
              </div>
              <div className="mt-3 text-center text-xs text-gray-500 dark:text-gray-400">
                ⚡ Resultado: Nenhum processo consegue prosseguir. O motor do banco intervém abortando uma das transações (vitimização).
              </div>
            </div>

            {/* Grid com 3 Pilares */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div
                className={`p-4 rounded-xl border ${
                  isDarkMode ? "bg-[#252528] border-gray-800" : "bg-gray-50/70 border-gray-200"
                }`}
              >
                <div className="flex items-center gap-2 mb-2 font-semibold text-sm text-blue-600 dark:text-blue-400">
                  <Workflow className="w-4 h-4" />
                  1. Detecção Automática
                </div>
                <p className="text-xs leading-relaxed text-gray-600 dark:text-gray-300">
                  Motores como PostgreSQL, MySQL (InnoDB) e SQL Server mantêm uma lista de arestas de espera direcionadas.
                  Ao encontrar um ciclo fechado, cancelam a transação de menor custo de rollback com código de erro específico (ex: <code>40P01</code>).
                </p>
              </div>

              <div
                className={`p-4 rounded-xl border ${
                  isDarkMode ? "bg-[#252528] border-gray-800" : "bg-gray-50/70 border-gray-200"
                }`}
              >
                <div className="flex items-center gap-2 mb-2 font-semibold text-sm text-green-600 dark:text-green-400">
                  <CheckCircle2 className="w-4 h-4" />
                  2. Ordem Consistente
                </div>
                <p className="text-xs leading-relaxed text-gray-600 dark:text-gray-300">
                  A regra de ouro contra deadlocks na aplicação é padronizar a ordem de acesso: se o fluxo toca Tabela A e Tabela B,
                  <strong> todos</strong> os códigos de backend devem atualizar A e depois B, nunca o contrário.
                </p>
              </div>

              <div
                className={`p-4 rounded-xl border ${
                  isDarkMode ? "bg-[#252528] border-gray-800" : "bg-gray-50/70 border-gray-200"
                }`}
              >
                <div className="flex items-center gap-2 mb-2 font-semibold text-sm text-amber-600 dark:text-amber-400">
                  <ShieldAlert className="w-4 h-4" />
                  3. Transações Curtas & Índices
                </div>
                <p className="text-xs leading-relaxed text-gray-600 dark:text-gray-300">
                  Nunca execute operações lentas ou I/O externo (chamadas HTTP) dentro de <code>BEGIN ... COMMIT</code>.
                  Garanta índices nas chaves estrangeiras para evitar lock escalation de linhas para tabelas inteiras.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── MONITOR EM TEMPO REAL ── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Activity className="w-5 h-5 text-red-500" />
              Painel de Telemetria e Monitoramento em Tempo Real
            </h2>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Atualização contínua via Server-Sent Events (SSE)
            </span>
          </div>

          <DeadlocksMonitor
            isDarkMode={isDarkMode}
            standalone={true}
            onClose={() => router.push("/home/tabelas")}
          />
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Database,
  TableProperties,
  Terminal,
  Activity,
  ArrowRight,
  TrendingUp,
  Sparkles,
  Clock,
  Search,
  Plus,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Layers,
  Settings
} from "lucide-react";
import { useI18n } from "@/context/I18nContext";
import { useSession } from "@/context/SessionContext";

export default function HomePage() {
  const { t } = useI18n();
  const { user } = useSession();

  // Sincronização de login em background mantida
  useEffect(() => {
    if (typeof window === "undefined" || !user?.email) return;

    const alreadyLogged = sessionStorage.getItem("login_done");
    if (alreadyLogged) return;

    fetch("/api/login", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: user.email }),
    })
      .then((res) => {
        if (res.ok) {
          sessionStorage.setItem("login_done", "1");
        }
      })
      .catch(() => {});
  }, [user]);

  const firstName = user?.nome ? user.nome.split(" ")[0] : "Utilizador";
  const isDbConnected = Boolean(user?.info_extra?.name_db);
  const dbName = user?.info_extra?.name_db || "";
  const dbType = (user?.info_extra?.type || "").toUpperCase();

  // Métricas essenciais compactas e neutras
  const metrics = useMemo(() => [
    {
      label: "Tabelas no Schema",
      value: isDbConnected ? String(user?.info_extra?.num_table ?? "1+") : "—",
      subtext: isDbConnected ? "Disponíveis para consulta" : "Aguardando conexão",
      icon: TableProperties,
      href: "/home/tabelas",
    },
    {
      label: "Consultas Executadas",
      value: String(user?.info_extra?.num_consultas ?? 0),
      subtext: "Registadas nesta sessão",
      icon: Activity,
      href: "/home/historico",
    },
    {
      label: "Base de Dados Ativa",
      value: isDbConnected ? dbType || "Conectada" : "Nenhuma",
      subtext: isDbConnected ? dbName : "Configurar conexão",
      icon: Database,
      href: "/home/conexao",
    },
    {
      label: "Registos Analisados",
      value: String(user?.info_extra?.registros_analizados ?? 0),
      subtext: "Auditoria e qualidade",
      icon: TrendingUp,
      href: "/home/analizar",
    },
  ], [isDbConnected, dbName, dbType, user]);

  // Módulos principais (sem duplicados, direto ao ponto)
  const coreModules = useMemo(() => [
    {
      title: "Explorador de Tabelas",
      desc: "Navegue por schemas, consulte colunas, tipos e visualize dados paginados.",
      icon: TableProperties,
      href: "/home/tabelas",
      primary: true,
    },
    {
      title: "Editor SQL",
      desc: "Terminal avançado com autocomplete e streaming em tempo real.",
      icon: Terminal,
      href: "/home/editorsql",
      primary: true,
    },
    {
      title: "Consultas Rápidas",
      desc: "Pesquise e filtre dados por nome de tabela sem escrever código manual.",
      icon: Search,
      href: "/home/consultas",
    },
    {
      title: "Assistente IA (Nexus)",
      desc: "Gere consultas e análises de schema usando linguagem natural.",
      icon: Sparkles,
      href: "/home/ai",
    },
    {
      title: "Conexões & MustaLink",
      desc: "Gerencie bases em nuvem e instâncias locais via túnel seguro.",
      icon: Database,
      href: "/home/conexao",
    },
    {
      title: "Histórico & Auditoria",
      desc: "Registo completo de logs, métricas de tempo e consultas executadas.",
      icon: Clock,
      href: "/home/historico",
    },
  ], []);

  // Motores de banco de dados suportados (visual minimalista sóbrio)
  const engines = [
    { name: "PostgreSQL", type: "postgresql" },
    { name: "Oracle DB", type: "oracle" },
    { name: "MySQL", type: "mysql" },
    { name: "SQL Server", type: "sqlserver" },
    { name: "MongoDB", type: "mongodb" },
    { name: "SQLite", type: "sqlite" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B0F19] text-slate-800 dark:text-slate-100 p-4 sm:p-6 lg:p-8 transition-colors duration-200">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* ============================================================ */}
        {/* 1. HEADER MINIMALISTA & STATUS DA CONEXÃO                   */}
        {/* ============================================================ */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Olá, {firstName}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Painel de gestão da infraestrutura de dados e consultas.
            </p>
          </div>

          {/* Status e Ação Primária */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60">
              <span
                className={`w-2 h-2 rounded-full ${
                  isDbConnected ? "bg-emerald-500" : "bg-amber-500"
                }`}
              />
              <span className="truncate max-w-[180px]">
                {isDbConnected ? `${dbName} (${dbType})` : "Sem conexão ativa"}
              </span>
            </div>

            <Link
              href="/home/conexao"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors shrink-0"
            >
              {isDbConnected ? (
                <>
                  <Settings size={14} />
                  <span>Gerir Conexões</span>
                </>
              ) : (
                <>
                  <Plus size={14} />
                  <span>Conectar Banco</span>
                </>
              )}
            </Link>
          </div>
        </div>

        {/* ============================================================ */}
        {/* 2. MÉTRICAS ESSENCIAIS (NEUTRAS, SEM ARCO-ÍRIS)             */}
        {/* ============================================================ */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {metrics.map((item, idx) => {
            const Icon = item.icon;
            return (
              <Link
                key={idx}
                href={item.href}
                className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 hover:border-blue-500/50 dark:hover:border-blue-500/50 transition-all shadow-xs group block"
              >
                <div className="flex items-center justify-between text-slate-400 dark:text-slate-500 mb-2">
                  <span className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    {item.label}
                  </span>
                  <Icon size={16} className="text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                </div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight truncate">
                  {item.value}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">
                  {item.subtext}
                </p>
              </Link>
            );
          })}
        </div>

        {/* ============================================================ */}
        {/* 3. MÓDULOS DE TRABALHO (DIRETO AO ASSUNTO)                   */}
        {/* ============================================================ */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white tracking-tight">
              Acesso Rápido ao Workspace
            </h2>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              6 módulos disponíveis
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {coreModules.map((mod, idx) => {
              const Icon = mod.icon;
              return (
                <Link
                  key={idx}
                  href={mod.href}
                  className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-xl border border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-all shadow-xs group flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        <Icon size={17} />
                      </div>
                      <ArrowRight size={14} className="text-slate-300 dark:text-slate-600 group-hover:text-slate-600 dark:group-hover:text-slate-300 group-hover:translate-x-0.5 transition-all" />
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {mod.title}
                    </h3>

                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">
                      {mod.desc}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* ============================================================ */}
        {/* 4. MOTORES SUPORTADOS (RODAPÉ COMPACTO & DISCRETO)          */}
        {/* ============================================================ */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2 font-medium">
            <Layers size={15} className="text-slate-400" />
            <span>Motores de Banco Compatíveis:</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {engines.map((eng, i) => {
              const isCurrent = user?.info_extra?.type?.toLowerCase() === eng.type;
              return (
                <Link
                  key={i}
                  href={`/home/conexao?type=${eng.type}`}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
                    isCurrent
                      ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800 font-bold"
                      : "bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700/60 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  {eng.name}
                  {isCurrent && " (Ativo)"}
                </Link>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "@/context/SessionContext";
import { useI18n } from "@/context/I18nContext";
import { applyTheme, getStoredTheme, ThemeMode } from "@/util";
import {
  Database,
  ShieldCheck,
  Zap,
  Terminal,
  Network,
  Cpu,
  Lock,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Copy,
  Check,
  Server,
  Layers,
  Sparkles,
  Activity,
  FileCode2,
  ScanText,
  LogOut,
  Sun,
  Moon,
  Monitor,
  ExternalLink,
  Table2,
  RefreshCw,
  FolderArchive,
  BarChart3,
  Bot
} from "lucide-react";

export default function LandingPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, logout } = useSession();
  const { t } = useI18n();

  const [activeTab, setActiveTab] = useState<"connections" | "query" | "mustalink" | "ai">("connections");
  const [copiedCommand, setCopiedCommand] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<ThemeMode>("system");

  useEffect(() => {
    setCurrentTheme(getStoredTheme());
  }, []);

  const handleToggleTheme = () => {
    const nextTheme: ThemeMode =
      currentTheme === "light" ? "dark" : currentTheme === "dark" ? "system" : "light";
    setCurrentTheme(nextTheme);
    applyTheme(nextTheme);
  };

  const handleCopyCommand = () => {
    navigator.clipboard.writeText("musta-link-agent --connect --token=mtg_live_sec_token");
    setCopiedCommand(true);
    setTimeout(() => setCopiedCommand(false), 2000);
  };

  const handleLogout = async () => {
    await logout();
    router.push("/auth/login");
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B0F19] text-slate-800 dark:text-slate-100 font-sans selection:bg-blue-600 selection:text-white transition-colors duration-200">
      
      {/* ============================================================ */}
      {/* 1. NAVBAR CORPORATIVA ELEGANTE                              */}
      {/* ============================================================ */}
      <header className="sticky top-0 z-50 bg-white/90 dark:bg-[#0B0F19]/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Logo e Nome */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="relative w-9 h-9 rounded-xl overflow-hidden shadow-sm border border-slate-200/60 dark:border-slate-700/60 bg-white p-0.5 transition-transform group-hover:scale-105">
                <img
                  src="/img/logo_mustainfo.png"
                  alt="MustaInfo"
                  className="w-full h-full object-cover rounded-lg"
                />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-lg tracking-tight text-slate-900 dark:text-white leading-none">
                    MustaInfo
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60 uppercase tracking-wider">
                    Cloud v2
                  </span>
                </div>
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  Data Platform & Infrastructure
                </span>
              </div>
            </Link>
          </div>

          {/* Links Centrais de Navegação */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-semibold text-slate-600 dark:text-slate-300">
            <a href="#recursos" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Recursos
            </a>
            <a href="#motores" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Bancos Suportados
            </a>
            <a href="#mustalink" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              MustaLink Agent
            </a>
            <Link href="/nexus-cognitiva" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-1.5">
              <Sparkles size={15} className="text-blue-500" />
              Nexus IA
            </Link>
            <Link href="/docs" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Documentação
            </Link>
          </nav>

          {/* Controles da Direita (Tema + Auth) */}
          <div className="flex items-center gap-3">
            {/* Botão de Alternância de Tema */}
            <button
              onClick={handleToggleTheme}
              aria-label="Alternar tema"
              title={`Tema atual: ${currentTheme}`}
              className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors"
            >
              {currentTheme === "light" ? (
                <Sun size={18} className="text-amber-500" />
              ) : currentTheme === "dark" ? (
                <Moon size={18} className="text-blue-400" />
              ) : (
                <Monitor size={18} />
              )}
            </button>

            <div className="h-4 w-[1px] bg-slate-200 dark:bg-slate-800"></div>

            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <Link
                  href="/home"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-600/20 transition-all hover:shadow-md"
                >
                  <Server size={16} />
                  <span>Acessar Console</span>
                </Link>
                <button
                  onClick={handleLogout}
                  title="Terminar Sessão"
                  className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                >
                  <LogOut size={18} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                <Link
                  href="/auth/login"
                  className="px-3.5 py-1.5 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
                >
                  Entrar
                </Link>
                <Link
                  href="/auth/register"
                  className="px-4 py-2 rounded-lg text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-600/20 transition-all hover:shadow-md active:scale-[0.98]"
                >
                  Criar Conta
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ============================================================ */}
      {/* 2. HERO SECTION — DIRETO AO PONTO                           */}
      {/* ============================================================ */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28 border-b border-slate-200/60 dark:border-slate-800/60">
        {/* Glow de fundo sutil e profissional (azul corporativo / indigo) */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-blue-500/10 via-indigo-500/5 to-transparent blur-3xl pointer-events-none -z-10" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center space-y-7">
          
          {/* Badge de introdução */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-800/80 text-blue-700 dark:text-blue-300 text-xs font-semibold shadow-xs">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Infraestrutura Unificada de Banco de Dados & Túnel Seguro</span>
          </div>

          {/* Título Principal */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-[1.12]">
            Toda a sua infraestrutura de dados{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
              conectada e governada
            </span>{" "}
            em um só lugar.
          </h1>

          {/* Subtítulo Objetivo */}
          <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto font-normal leading-relaxed">
            Elimine a fragmentação entre DBeaver, Compass e VPNs complexas. O <strong>MustaInfo</strong> unifica{" "}
            <strong>PostgreSQL, Oracle Database, MySQL, SQL Server, MongoDB e SQLite</strong>, permitindo consultas em tempo real, túnel seguro on-premise (MustaLink) e inteligência assistida por IA.
          </p>

          {/* Ações / CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
            <Link
              href={isAuthenticated ? "/home" : "/auth/register"}
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl text-base font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-600/25 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2.5"
            >
              <span>{isAuthenticated ? "Ir para o Console" : "Começar Agora Gratuitamente"}</span>
              <ArrowRight size={18} />
            </Link>

            <Link
              href="/docs"
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl text-base font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800/90 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/80 shadow-xs transition-colors flex items-center justify-center gap-2"
            >
              <FileCode2 size={18} className="text-slate-500 dark:text-slate-400" />
              <span>Ver Documentação Técnica</span>
            </Link>
          </div>

          {/* Badges de Confiança Corporativa */}
          <div className="pt-8 flex flex-wrap items-center justify-center gap-y-2 gap-x-6 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 size={15} className="text-emerald-500" />
              <span>Conexão Zero-Trust sem IP público</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 size={15} className="text-emerald-500" />
              <span>Criptografia TLS 1.3 & AES-256</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 size={15} className="text-emerald-500" />
              <span>Streaming de Dados por SSE</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 size={15} className="text-emerald-500" />
              <span>Multi-Tenant & RBAC Corporativo</span>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* 3. SHOWCASE INTERATIVO DO PRODUTO (CONSOLE PREVIEW)         */}
        {/* ============================================================ */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 mt-14">
          <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl overflow-hidden">
            
            {/* Top Bar da Janela (Estilo Console Operacional) */}
            <div className="px-4 py-3 bg-slate-100/80 dark:bg-slate-950/70 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-slate-300 dark:bg-slate-700 inline-block" />
                <span className="w-3 h-3 rounded-full bg-slate-300 dark:bg-slate-700 inline-block" />
                <span className="w-3 h-3 rounded-full bg-slate-300 dark:bg-slate-700 inline-block" />
                <span className="ml-3 text-xs font-mono font-medium text-slate-500 dark:text-slate-400">
                  mustainfo.cloud/console
                </span>
              </div>

              {/* Status ao vivo */}
              <div className="flex items-center gap-2 text-xs font-mono">
                <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Túnel Ativo (12ms)</span>
                <span className="text-slate-400 dark:text-slate-600">•</span>
                <span className="text-slate-500 dark:text-slate-400">5 Motores Online</span>
              </div>
            </div>

            {/* Abas do Preview */}
            <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 overflow-x-auto text-xs font-medium">
              <button
                onClick={() => setActiveTab("connections")}
                className={`flex items-center gap-2 px-5 py-3 border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === "connections"
                    ? "border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900 font-bold"
                    : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <Database size={15} />
                <span>Conexões Ativas</span>
              </button>

              <button
                onClick={() => setActiveTab("query")}
                className={`flex items-center gap-2 px-5 py-3 border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === "query"
                    ? "border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900 font-bold"
                    : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <Terminal size={15} />
                <span>Query Studio & SSE</span>
              </button>

              <button
                onClick={() => setActiveTab("mustalink")}
                className={`flex items-center gap-2 px-5 py-3 border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === "mustalink"
                    ? "border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900 font-bold"
                    : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <Network size={15} />
                <span>MustaLink Zero-Trust</span>
              </button>

              <button
                onClick={() => setActiveTab("ai")}
                className={`flex items-center gap-2 px-5 py-3 border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === "ai"
                    ? "border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900 font-bold"
                    : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <Sparkles size={15} />
                <span>Nexus Cognitiva & OCR</span>
              </button>
            </div>

            {/* Conteúdo da Aba Ativa */}
            <div className="p-6 md:p-8 bg-white dark:bg-slate-900 font-sans min-h-[290px] flex flex-col justify-center">
              
              {/* TAB 1: CONEXÕES ATIVAS */}
              {activeTab === "connections" && (
                <div className="space-y-4 animate-in fade-in duration-300">
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium pb-2 border-b border-slate-100 dark:border-slate-800">
                    <span>SERVIDOR & BANCO</span>
                    <span>TIPO DE MOTOR</span>
                    <span>ORIGEM</span>
                    <span>LATÊNCIA</span>
                    <span>ESTADO</span>
                  </div>

                  {/* Linhas da Tabela */}
                  {[
                    { name: "db_producao_core", engine: "PostgreSQL 16", origin: "AWS RDS us-east-1", ping: "14ms", status: "Conectado", badge: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300" },
                    { name: "oracle_finance_prod", engine: "Oracle DB 19c", origin: "OCI / On-Premise", ping: "16ms", status: "Conectado", badge: "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300" },
                    { name: "erp_onpremise_matriz", engine: "SQL Server 2022", origin: "MustaLink Túnel Local", ping: "22ms", status: "Conectado", badge: "bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300" },
                    { name: "ecommerce_analytics", engine: "MySQL 8.0", origin: "Google Cloud SQL", ping: "18ms", status: "Conectado", badge: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300" },
                    { name: "event_logs_catalog", engine: "MongoDB 7.0", origin: "Atlas Cluster", ping: "29ms", status: "Conectado", badge: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" },
                  ].map((row, idx) => (
                    <div key={idx} className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors text-sm">
                      <div className="flex items-center gap-2.5 font-semibold text-slate-800 dark:text-slate-200">
                        <Database size={16} className="text-blue-500" />
                        <span>{row.name}</span>
                      </div>
                      <span className="text-xs font-mono text-slate-600 dark:text-slate-400">{row.engine}</span>
                      <span className={`text-[11px] font-medium px-2 py-0.5 rounded ${row.badge}`}>{row.origin}</span>
                      <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400">{row.ping}</span>
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span>{row.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* TAB 2: QUERY STUDIO */}
              {activeTab === "query" && (
                <div className="space-y-4 animate-in fade-in duration-300">
                  <div className="p-4 rounded-xl bg-slate-900 text-slate-100 font-mono text-xs leading-relaxed border border-slate-800">
                    <div className="text-slate-500 pb-2 mb-2 border-b border-slate-800 flex justify-between items-center">
                      <span>SQL QUERY BUILDER — SSE STREAMING</span>
                      <span className="text-emerald-400">Executado em 8.4ms</span>
                    </div>
                    <p><span className="text-purple-400">SELECT</span> u.id, u.email, e.razao_social, <span className="text-purple-400">COUNT</span>(c.id) <span className="text-purple-400">AS</span> conexoes_ativas</p>
                    <p><span className="text-purple-400">FROM</span> users u</p>
                    <p><span className="text-purple-400">JOIN</span> empresas e <span className="text-purple-400">ON</span> e.id = u.empresa_id</p>
                    <p><span className="text-purple-400">LEFT JOIN</span> conexoes c <span className="text-purple-400">ON</span> c.user_id = u.id</p>
                    <p><span className="text-purple-400">WHERE</span> u.is_active = <span className="text-amber-300">true</span> <span className="text-purple-400">GROUP BY</span> u.id, e.razao_social;</p>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
                    <span>Resultado retornado com paginação sob demanda e sanitização de queries contra SQL Injection.</span>
                    <span className="font-semibold text-blue-600 dark:text-blue-400">Suporte a DDL, DML & Exportação JSON/CSV</span>
                  </div>
                </div>
              )}

              {/* TAB 3: MUSTALINK */}
              {activeTab === "mustalink" && (
                <div className="space-y-5 animate-in fade-in duration-300">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2">
                      <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
                        <Lock size={16} className="text-blue-600" />
                        <span>Zero-Trust Tunnel (NAT Traversal)</span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        Conecte instâncias internas de bancos de dados locais sem precisar alterar regras de firewall no roteador, sem configurar IP fixo e sem expor portas vulneráveis à internet.
                      </p>
                    </div>

                    <div className="p-5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2">
                      <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
                        <Cpu size={16} className="text-emerald-600" />
                        <span>Agente Nativo em Go (Binário Leve)</span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        Roda em background como serviço no Windows ou Linux. Consome menos de 25MB de RAM com criptografia fim-a-fim e reconexão automática resiliente.
                      </p>
                    </div>
                  </div>

                  {/* Linha de comando para copiar */}
                  <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900 text-slate-200 font-mono text-xs border border-slate-800">
                    <span className="truncate pr-4 text-slate-300">
                      $ musta-link-agent --connect --token=mtg_live_sec_token
                    </span>
                    <button
                      onClick={handleCopyCommand}
                      className="flex items-center gap-1.5 px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors font-sans text-xs font-semibold shrink-0"
                    >
                      {copiedCommand ? (
                        <>
                          <Check size={14} className="text-emerald-400" />
                          <span>Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy size={14} />
                          <span>Copiar Comando</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 4: NEXUS COGNITIVA & OCR */}
              {activeTab === "ai" && (
                <div className="space-y-4 animate-in fade-in duration-300">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-5 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/20 space-y-2.5">
                      <div className="flex items-center gap-2 text-sm font-bold text-blue-700 dark:text-blue-300">
                        <Bot size={18} />
                        <span>Nexus Cognitiva (IA Assistente de SQL)</span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        Transforme perguntas em linguagem natural diretamente em consultas SQL validadas contra o seu schema, com sugestões automáticas de índices e otimização de joins.
                      </p>
                    </div>

                    <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-2.5">
                      <div className="flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-slate-200">
                        <ScanText size={18} className="text-indigo-500" />
                        <span>OCR Vision para Documentos & Faturas</span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        Faça upload de comprovantes, faturas ou documentos angolanos e extraia campos estruturados diretamente para as tabelas do seu banco de dados com PaddleOCR integrado.
                      </p>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 4. OS 3 PILARES FUNDAMENTAIS                                  */}
      {/* ============================================================ */}
      <section id="recursos" className="py-20 md:py-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-3.5 mb-16">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
            Simplicidade Operacional
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Construído para resolver os problemas reais de quem lida com dados
          </h2>
          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400">
            Sem firulas ou configurações impossíveis. O que você precisa para gerenciar bases de dados corporativas em minutos.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Pilar 1 */}
          <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-blue-500/50 hover:shadow-lg transition-all space-y-4">
            <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
              <Layers size={24} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              Gestão Multi-Engine Centralizada
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Conecte simultaneamente PostgreSQL, Oracle Database, MySQL, SQL Server, MongoDB e SQLite. Alterne entre schemas, inspecione chaves estrangeiras e execute queries sem trocar de aplicativo.
            </p>
          </div>

          {/* Pilar 2 */}
          <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-blue-500/50 hover:shadow-lg transition-all space-y-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <ShieldCheck size={24} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              Túnel Seguro MustaLink (Zero-Trust)
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Seus bancos de dados on-premise ficam inacessíveis a invasores públicos. O túnel estabelece conexões seguras por WebSockets TLS com criptografia ponta a ponta e auditoria completa.
            </p>
          </div>

          {/* Pilar 3 */}
          <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-blue-500/50 hover:shadow-lg transition-all space-y-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
              <Zap size={24} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              Automações & Streaming SSE
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Execução de consultas volumosas sem travar a interface graças ao streaming por Server-Sent Events, backups automatizados, migrações de dados e restaurações assistidas.
            </p>
          </div>

        </div>
      </section>

      {/* ============================================================ */}
      {/* 5. BANCOS SUPORTADOS (GRID PROFISSIONAL DE INTEGRAÇÕES)      */}
      {/* ============================================================ */}
      <section id="motores" className="py-16 bg-slate-100/60 dark:bg-slate-900/40 border-y border-slate-200/60 dark:border-slate-800/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-10">
          
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Compatibilidade Universal
            </span>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              Conectores nativos para os motores mais usados da indústria
            </h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 max-w-5xl mx-auto">
            {[
              { name: "PostgreSQL", desc: "v12 a v18+ nativo", tag: "Relacional" },
              { name: "Oracle DB", desc: "19c, 21c & 23ai", tag: "Enterprise" },
              { name: "MySQL", desc: "v5.7, v8.0 & MariaDB", tag: "Relacional" },
              { name: "SQL Server", desc: "2016 a 2022 / Azure", tag: "Enterprise" },
              { name: "MongoDB", desc: "v5 a v7+ Document", tag: "NoSQL" },
              { name: "SQLite", desc: "Bases Locais & Testes", tag: "Embarcado" },
            ].map((engine, i) => (
              <div
                key={i}
                className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-center space-y-1.5 shadow-xs"
              >
                <Database size={28} className="mx-auto text-blue-600 dark:text-blue-400" />
                <h4 className="font-bold text-slate-900 dark:text-white text-base">{engine.name}</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">{engine.desc}</p>
                <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  {engine.tag}
                </span>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ============================================================ */}
      {/* 6. GRID DE CAPACIDADES ESPECÍFICAS (BENTO STYLE)             */}
      {/* ============================================================ */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
            Recursos Completos
          </span>
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Ferramental pensado para administradores e desenvolvedores
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          
          <div className="p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
            <Table2 className="text-blue-600" size={24} />
            <h4 className="font-bold text-lg text-slate-900 dark:text-white">Editor Visual de Esquemas</h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Explore estruturas completas de tabelas, tipos de dados, chaves estrangeiras e índices sem ter de escrever queries descritivas manualmente.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
            <RefreshCw className="text-emerald-600" size={24} />
            <h4 className="font-bold text-lg text-slate-900 dark:text-white">Migração & Transferência de Dados</h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Mova registros entre bases diferentes de forma programada com mapeamento assistido de colunas e validação prévia de integridade.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
            <FolderArchive className="text-amber-600" size={24} />
            <h4 className="font-bold text-lg text-slate-900 dark:text-white">Backups Automatizados</h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Integração com utilitários oficiais (pg_dump, mysqldump) para cópias de segurança diretas no MinIO/S3 com progresso em tempo real.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
            <Activity className="text-rose-600" size={24} />
            <h4 className="font-bold text-lg text-slate-900 dark:text-white">Monitorização de Deadlocks</h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Identifique consultas travadas, locks concorrentes e conexões órfãs que afetam o desempenho do seu servidor antes de causarem indisponibilidade.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
            <BarChart3 className="text-indigo-600" size={24} />
            <h4 className="font-bold text-lg text-slate-900 dark:text-white">Métricas de Volume & Histórico</h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Histórico auditado de todas as consultas executadas por usuário, com métricas de tempo de resposta, volume de dados transferidos e logs de conformidade.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
            <ScanText className="text-purple-600" size={24} />
            <h4 className="font-bold text-lg text-slate-900 dark:text-white">OCR & Ingestão Documental</h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Extração precisa de tabelas e documentos escaneados com normalização automática para inserção direta em schemas de banco de dados.
            </p>
          </div>

        </div>
      </section>

      {/* ============================================================ */}
      {/* 7. COMO FUNCIONA EM 3 PASSOS                                */}
      {/* ============================================================ */}
      <section className="py-20 bg-slate-100/60 dark:bg-slate-900/40 border-y border-slate-200/60 dark:border-slate-800/60">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              Fluxo Simples
            </span>
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">
              Pronto em menos de 3 minutos
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
            
            <div className="space-y-3">
              <span className="text-4xl font-black text-blue-600/30 dark:text-blue-400/20 font-mono">
                01
              </span>
              <h4 className="text-lg font-bold text-slate-900 dark:text-white">Crie sua Conta</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Cadastre sua empresa em poucos segundos com login direto ou OAuth corporativo seguro (Google / GitHub).
              </p>
            </div>

            <div className="space-y-3">
              <span className="text-4xl font-black text-blue-600/30 dark:text-blue-400/20 font-mono">
                02
              </span>
              <h4 className="text-lg font-bold text-slate-900 dark:text-white">Conecte seus Bancos</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Insira as credenciais de bases na nuvem ou inicie o agente MustaLink para conectar servidores locais com segurança.
              </p>
            </div>

            <div className="space-y-3">
              <span className="text-4xl font-black text-blue-600/30 dark:text-blue-400/20 font-mono">
                03
              </span>
              <h4 className="text-lg font-bold text-slate-900 dark:text-white">Opere e Governe</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Consulte tabelas, crie queries, automatize backups e monitore conexões em um console de alta velocidade.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* ============================================================ */}
      {/* 8. CALL TO ACTION (CTA) FINAL CORPORATIVO                    */}
      {/* ============================================================ */}
      <section className="py-20 max-w-5xl mx-auto px-4 sm:px-6">
        <div className="rounded-3xl bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-900 text-white p-8 sm:p-14 text-center space-y-6 shadow-2xl relative overflow-hidden">
          
          <div className="relative z-10 max-w-2xl mx-auto space-y-4">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight">
              Pronto para centralizar e proteger seus dados?
            </h2>
            <p className="text-base text-blue-100 font-normal leading-relaxed">
              Junte-se a equipes que simplificaram a administração de banco de dados e conexões on-premise com o MustaInfo.
            </p>
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href={isAuthenticated ? "/home" : "/auth/register"}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl text-base font-bold bg-white text-blue-900 hover:bg-blue-50 shadow-lg transition-all active:scale-[0.98]"
              >
                {isAuthenticated ? "Abrir Painel Principal" : "Criar Conta Gratuita"}
              </Link>
              <Link
                href="/docs"
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl text-base font-semibold text-white/90 hover:text-white hover:bg-white/10 border border-white/20 transition-colors"
              >
                Consultar Documentação
              </Link>
            </div>
          </div>

        </div>
      </section>

      {/* ============================================================ */}
      {/* 9. FOOTER PROFISSIONAL                                       */}
      {/* ============================================================ */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/80 py-12 text-sm text-slate-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Coluna 1: Marca */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <img
                src="/img/logo_mustainfo.png"
                alt="MustaInfo"
                className="w-6 h-6 rounded-md object-cover"
              />
              <span className="font-bold text-slate-900 dark:text-white">MustaInfo</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Plataforma Corporativa Unificada de Gestão de Bancos de Dados, Conectividade Cloud e Túnel Zero-Trust.
            </p>
            <p className="text-[11px] text-slate-400 dark:text-slate-600">
              © 2026 MustaInfo Project • OrionForgeNexus Enterprise.
            </p>
          </div>

          {/* Coluna 2: Produto */}
          <div className="space-y-2.5 text-xs">
            <span className="font-bold text-slate-900 dark:text-slate-200 block uppercase tracking-wider text-[11px]">
              Plataforma
            </span>
            <ul className="space-y-2">
              <li><a href="#recursos" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Conexões Multi-Engine</a></li>
              <li><a href="#mustalink" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">MustaLink Agent</a></li>
              <li><Link href="/nexus-cognitiva" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Nexus Cognitiva (IA)</Link></li>
              <li><Link href="/home/ocr" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">OCR de Documentos</Link></li>
              <li><Link href="/task" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Tarefas & Sprints</Link></li>
            </ul>
          </div>

          {/* Coluna 3: Motores */}
          <div className="space-y-2.5 text-xs">
            <span className="font-bold text-slate-900 dark:text-slate-200 block uppercase tracking-wider text-[11px]">
              Motores & Nuvem
            </span>
            <ul className="space-y-2">
              <li><span className="text-slate-600 dark:text-slate-400">PostgreSQL (12 ao 18+)</span></li>
              <li><span className="text-slate-600 dark:text-slate-400">Oracle Database (19c / 21c / 23ai)</span></li>
              <li><span className="text-slate-600 dark:text-slate-400">MySQL & MariaDB</span></li>
              <li><span className="text-slate-600 dark:text-slate-400">Microsoft SQL Server</span></li>
              <li><span className="text-slate-600 dark:text-slate-400">MongoDB Atlas / Local</span></li>
              <li><span className="text-slate-600 dark:text-slate-400">SQLite Embarcado</span></li>
            </ul>
          </div>

          {/* Coluna 4: Recursos & Suporte */}
          <div className="space-y-2.5 text-xs">
            <span className="font-bold text-slate-900 dark:text-slate-200 block uppercase tracking-wider text-[11px]">
              Recursos
            </span>
            <ul className="space-y-2">
              <li><Link href="/docs" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Documentação Técnica</Link></li>
              <li><Link href="/auth/login" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Portal do Utilizador</Link></li>
              <li><Link href="/auth/register" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Criar Nova Conta</Link></li>
              <li><span className="text-slate-400 dark:text-slate-600">Status da API: Operacional</span></li>
            </ul>
          </div>

        </div>
      </footer>

    </div>
  );
}

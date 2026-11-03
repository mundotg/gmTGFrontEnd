"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Database, Zap, ChevronRight, Search, Cpu, Terminal,
  ScanText, Layout, Code2, Share2, Info, Menu, X,
  Shield, Activity, Layers, Lock, Server, Copy, Check,
  GitBranch, ArrowRight, ShieldCheck, CheckCircle2,
  Palette, Sliders, Play, Eye, FileText, CheckCircle,
  AlertTriangle,
  type LucideIcon,
} from "lucide-react";

import { useI18n } from "@/context/I18nContext";
import { LanguageSelector } from "@/app/home/configuracao/configuracaoTab/ComponentUsuarioTab/LanguageSelector";

// ─────────────────────────────────────────────────────────────
// TOKENS DE ESTILO UNIFICADOS (DESIGN SYSTEM 2026)
// ─────────────────────────────────────────────────────────────

const CARD =
  "rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.03]";
const HEADING = "text-gray-900 dark:text-gray-50";
const BODY = "text-sm font-medium leading-relaxed text-gray-600 dark:text-gray-300";
const EYEBROW = "text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400";
const CODE =
  "relative mt-3 overflow-auto rounded-xl bg-gray-950 p-4 font-mono text-xs text-gray-100 border border-gray-800 dark:border-white/10 shadow-inner";

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

function useTranslate() {
  const { t } = useI18n();
  return useCallback(
    (key: string, fallback: string) => {
      const value = t(key);
      return !value || value === key ? fallback : value;
    },
    [t]
  );
}

const normalize = (value: string) =>
  value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

function Card({
  icon: Icon,
  title,
  children,
  badge,
}: {
  icon: LucideIcon;
  title: string;
  children: React.ReactNode;
  badge?: string;
}) {
  return (
    <div className={CARD}>
      <div className="mb-3 flex items-center justify-between">
        <h2 className={`flex items-center gap-2 text-sm font-bold ${HEADING}`}>
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
            <Icon size={16} aria-hidden />
          </div>
          {title}
        </h2>
        {badge && (
          <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-[10px] font-bold tracking-wide text-blue-700 dark:bg-blue-500/20 dark:text-blue-300">
            {badge}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

function Callout({
  tone,
  children,
}: {
  tone: "info" | "warning" | "success";
  children: React.ReactNode;
}) {
  const tones = {
    info: "border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-200",
    warning:
      "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200",
    success:
      "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200",
  } as const;

  const icons = {
    info: Info,
    warning: AlertTriangle,
    success: ShieldCheck,
  };

  const IconComp = icons[tone];

  return (
    <div className={`flex gap-3 rounded-xl border p-4 shadow-sm ${tones[tone]}`}>
      <IconComp className="shrink-0 mt-0.5" size={18} aria-hidden />
      <div className="text-xs font-medium leading-relaxed">{children}</div>
    </div>
  );
}

function CodeSnippet({ code, label }: { code: string; label?: string }) {
  const tr = useTranslate();
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="group relative">
      {label && (
        <div className="flex items-center justify-between px-1 text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          <span>{label}</span>
        </div>
      )}
      <div className={CODE}>
        <pre className="pr-12">{code}</pre>
        <button
          type="button"
          onClick={handleCopy}
          className="absolute right-3 top-3 flex items-center gap-1 rounded-lg border border-gray-700 bg-gray-800/80 px-2.5 py-1 text-[11px] font-semibold text-gray-300 transition-colors hover:bg-gray-700 hover:text-white dark:border-white/20"
          title={copied ? tr("docs.copied", "Copiado!") : tr("docs.copy_code", "Copiar")}
        >
          {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
          <span>{copied ? tr("docs.copied", "Copiado!") : tr("docs.copy_code", "Copiar")}</span>
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// COMPONENTES DE CONTEÚDO DAS SECÇÕES
// ─────────────────────────────────────────────────────────────

/** 1. O que é o MustaInfo? */
function IntroSection() {
  const tr = useTranslate();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
        <img
          src="/img/logo_mustainfo.png"
          alt="MustaInfo Logo"
          className="h-14 w-14 rounded-2xl object-cover shadow-md border border-gray-200/60 dark:border-white/10"
        />
        <div>
          <h2 className="text-lg font-black tracking-tight text-gray-900 dark:text-white">
            MustaInfo Enterprise Platform
          </h2>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
            {tr(
              "docs.sections.intro.eyebrow",
              "A Plataforma Unificada de Engenharia e Análise de Dados"
            )}
          </p>
        </div>
      </div>
      <p className="text-base font-normal leading-relaxed text-gray-700 dark:text-gray-300">
        {tr(
          "docs.sections.intro.desc",
          "O MustaInfo é a plataforma unificada para gestão de dados, engenharia analítica, automação de fluxos, IA cognitiva e túneis seguros de banco de dados. Combina conectividade on-premise e nuvem em um ecossistema integrado."
        )}
      </p>

      {/* OS TRÊS PILARES */}
      <div className="space-y-3">
        <h3 className={`text-sm font-bold ${HEADING}`}>
          {tr("docs.sections.intro.pillars_title", "Os Três Pilares da Plataforma")}
        </h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4 dark:border-blue-500/20 dark:bg-blue-500/5">
            <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm">
              <Database size={16} />
            </div>
            <h4 className="text-xs font-bold text-gray-900 dark:text-white">
              {tr("docs.sections.intro.pillar1_title", "1. Conectividade & Engenharia Híbrida")}
            </h4>
            <p className="mt-1 text-[11px] font-medium leading-relaxed text-gray-600 dark:text-gray-300">
              {tr("docs.sections.intro.pillar1_desc", "Conecte qualquer base de dados diretamente ou através do agente reverso seguro MustaLink, sem expor portas.")}
            </p>
          </div>

          <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-4 dark:border-indigo-500/20 dark:bg-indigo-500/5">
            <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-sm">
              <Layout size={16} />
            </div>
            <h4 className="text-xs font-bold text-gray-900 dark:text-white">
              {tr("docs.sections.intro.pillar2_title", "2. Studio Analítico & Visual No-Code")}
            </h4>
            <p className="mt-1 text-[11px] font-medium leading-relaxed text-gray-600 dark:text-gray-300">
              {tr("docs.sections.intro.pillar2_desc", "Construa consultas complexas com o Query Builder, execute queries com streaming SSE e analise dados com visualização relacional.")}
            </p>
          </div>

          <div className="rounded-xl border border-purple-200 bg-purple-50/50 p-4 dark:border-purple-500/20 dark:bg-purple-500/5">
            <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-purple-600 text-white shadow-sm">
              <ScanText size={16} />
            </div>
            <h4 className="text-xs font-bold text-gray-900 dark:text-white">
              {tr("docs.sections.intro.pillar3_title", "3. Inteligência Cognitiva & IA Visionária")}
            </h4>
            <p className="mt-1 text-[11px] font-medium leading-relaxed text-gray-600 dark:text-gray-300">
              {tr("docs.sections.intro.pillar3_desc", "Extraia dados estruturados de imagens e faturas com OCR Vision AI, rastreie o ciclo com linhagem e proteja com PentestGuard.")}
            </p>
          </div>
        </div>
      </div>

      {/* ARQUITETURA */}
      <div className="grid gap-6 sm:grid-cols-2">
        <Card
          icon={Layout}
          title={tr("docs.sections.intro.card_arch_title", "Arquitetura Frontend Moderna")}
          badge="Next.js 16 + React 19"
        >
          <p className={BODY}>
            {tr(
              "docs.sections.intro.card_arch_desc",
              "Construído com Next.js 16, App Router e React 19, combinando Server Components e hidratação seletiva para tabelas virtualizadas e gráficos de alta performance."
            )}
          </p>
        </Card>

        <Card
          icon={Database}
          title={tr("docs.sections.intro.card_engines_title", "Multi-Banco & SGBDs Suportados")}
          badge="SQL & NoSQL"
        >
          <p className={BODY}>
            {tr(
              "docs.sections.intro.card_engines_desc",
              "Compatibilidade nativa com PostgreSQL, MySQL, MariaDB, Oracle Database, Microsoft SQL Server, SQLite, MongoDB e Redis."
            )}
          </p>
        </Card>

        <Card
          icon={Server}
          title={tr("docs.sections.intro.card_backend_title", "Backend Assíncrono de Alto Rendimento")}
          badge="FastAPI Async"
        >
          <p className={BODY}>
            {tr(
              "docs.sections.intro.card_backend_desc",
              "API em FastAPI com drivers assíncronos (asyncpg, aiomysql, redis-py) e pooling resiliente com validação automática de conexões."
            )}
          </p>
        </Card>

        <Card
          icon={Shield}
          title={tr("docs.sections.security.title", "Protocolos de Segurança, PentestGuard & Criptografia")}
          badge="AES-256-GCM"
        >
          <p className={BODY}>
            {tr(
              "docs.sections.security.desc",
              "Desenvolvido com foco rigoroso em segurança de dados corporativos, privacidade e conformidade com os mais altos padrões de auditoria."
            )}
          </p>
        </Card>
      </div>

      <Callout tone="info">
        <strong>MustaInfo 360:</strong> Uma solução corporativa integrada projetada para unir engenheiros de dados, analistas de BI, administradores de SGBD e cientistas de dados em uma única superfície de trabalho.
      </Callout>
    </div>
  );
}

/** 2. Design System 2026 */
function ThemeSection() {
  const tr = useTranslate();
  const [demoInput, setDemoInput] = useState("");

  return (
    <div className="space-y-6">
      <p className="text-base font-normal leading-relaxed text-gray-700 dark:text-gray-300">
        {tr(
          "docs.sections.theme.desc",
          "O design do MustaInfo é projetado para máxima eficiência e legibilidade em interfaces de dados densos. Cada componente foi lapidado com suporte nativo a temas Claro e Escuro, feedback tátil e glassmorphism suave."
        )}
      </p>

      {/* DEMO INTERATIVA DE ESTADOS */}
      <div className={`${CARD} space-y-6`}>
        <div className="flex items-center justify-between border-b border-gray-100 pb-3 dark:border-white/10">
          <h3 className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wider ${HEADING}`}>
            <Sliders size={16} className="text-blue-600 dark:text-blue-400" />
            {tr("docs.sections.theme.demo_label", "Transição de Foco & Interatividade")}
          </h3>
          <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
            Interactive Sandbox
          </span>
        </div>

        <div>
          <label
            htmlFor="theme-focus-demo"
            className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400"
          >
            Campo com Anel de Foco Reativo (focus:ring-2 focus:ring-blue-500/50)
          </label>
          <input
            id="theme-focus-demo"
            type="text"
            placeholder="Digite algo para testar o foco e o contraste..."
            value={demoInput}
            onChange={(e) => setDemoInput(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm transition-all focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 dark:border-white/10 dark:bg-white/5 dark:text-gray-100 dark:placeholder-gray-500 dark:focus:bg-white/10"
          />
        </div>

        {/* DEMO DE BOTÕES */}
        <div className="space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Hierarquia de Botões Padronizados
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition-transform hover:bg-blue-700 active:scale-95"
            >
              Primário (bg-blue-600)
            </button>
            <button
              type="button"
              className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-bold text-gray-800 shadow-sm transition-colors hover:bg-gray-50 dark:border-white/10 dark:bg-white/5 dark:text-gray-200 dark:hover:bg-white/10"
            >
              Secundário
            </button>
            <button
              type="button"
              className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-xs font-bold text-red-600 transition-colors hover:bg-red-100 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400"
            >
              Perigo (Danger)
            </button>
            <button
              type="button"
              className="rounded-xl px-4 py-2 text-xs font-bold text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5"
            >
              Fantasma (Ghost)
            </button>
          </div>
        </div>

        {/* TOKENS MÉTRICOS */}
        <div className="grid grid-cols-2 gap-4 border-t border-gray-100 pt-4 sm:grid-cols-4 dark:border-white/10">
          <div>
            <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-gray-400">
              Raio dos Cantos
            </p>
            <div className={`text-sm font-bold ${HEADING}`}>rounded-xl (12px)</div>
          </div>
          <div>
            <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-gray-400">
              Sombra Base
            </p>
            <div className={`text-sm font-bold ${HEADING}`}>shadow-sm</div>
          </div>
          <div>
            <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-gray-400">
              Bordas Escuras
            </p>
            <div className={`text-sm font-bold ${HEADING}`}>dark:border-white/10</div>
          </div>
          <div>
            <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-gray-400">
              Glassmorphism
            </p>
            <div className={`text-sm font-bold ${HEADING}`}>backdrop-blur-xl</div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <Card
          icon={Palette}
          title={tr("docs.sections.theme.colors_title", "Paleta de Cores & Identidade")}
        >
          <p className={BODY}>
            {tr(
              "docs.sections.theme.colors_desc",
              "Azul MustaInfo (#2563EB / bg-blue-600) para ações primárias e focos de destaque. Escala de cinzas neutra do gray-50 ao gray-900 para clareza visual impecável."
            )}
          </p>
        </Card>

        <Card
          icon={Layout}
          title={tr("docs.sections.theme.geometry_title", "Tokens de Geometria & Superfícies")}
        >
          <p className={BODY}>
            {tr(
              "docs.sections.theme.geometry_desc",
              "Cantos com arredondamento rounded-xl (12px), sombras sutis shadow-sm e bordas delimitadoras dark:border-white/10 que definem hierarquia sem poluição visual."
            )}
          </p>
        </Card>
      </div>

      <Callout tone="warning">
        <strong>Regra de Estilo:</strong> Todos os botões primários da aplicação devem usar <code className="rounded bg-amber-100 px-1 py-0.5 dark:bg-amber-500/20">bg-blue-600</code> e as labels informativas de suporte devem sempre ser uppercase com espaçamento entre letras (<code className="rounded bg-amber-100 px-1 py-0.5 dark:bg-amber-500/20">tracking-wider</code>).
      </Callout>
    </div>
  );
}

/** 3. Gestão de Conexões */
function ConnSection() {
  const tr = useTranslate();

  const SUPPORTED_DBS = [
    { name: "PostgreSQL", port: "5432", driver: "asyncpg", status: "Nativo" },
    { name: "MySQL / MariaDB", port: "3306", driver: "aiomysql", status: "Nativo" },
    { name: "Oracle Database", port: "1521", driver: "python-oracledb", status: "Nativo" },
    { name: "Microsoft SQL Server", port: "1433", driver: "aioodbc / pymssql", status: "Nativo" },
    { name: "SQLite", port: "Local / File", driver: "aiosqlite", status: "Nativo" },
    { name: "MongoDB", port: "27017", driver: "motor / pymongo", status: "NoSQL" },
    { name: "Redis", port: "6379", driver: "redis-py async", status: "Cache & Key-Value" },
  ];

  const CONNECTION_STEPS = [
    {
      step: "01",
      title: "Abrir o Modal de Conexão",
      desc: "No painel lateral ou no cabeçalho do estúdio, clique em '+ Nova Conexão' e selecione o motor desejado (ex: PostgreSQL, Oracle, MongoDB).",
    },
    {
      step: "02",
      title: "Definir Endereço (Direto ou Túnel)",
      desc: "Se a base for em nuvem, informe o Host/IP público. Se a base for local/on-premise, insira agent://meu-agente ou musta-agent.",
    },
    {
      step: "03",
      title: "Credenciais & Segurança SSL",
      desc: "Preencha Porta, Nome do Banco, Usuário e Senha. Escolha o modo SSL apropriado (require, verify-ca ou verify-full para produção).",
    },
    {
      step: "04",
      title: "Testar Latência & Salvar",
      desc: "Clique em 'Testar Conexão'. O sistema executa um ping SQL em tempo real exibindo a latência em milissegundos antes da persistência.",
    },
  ];

  return (
    <div className="space-y-6">
      <p className="text-base font-normal leading-relaxed text-gray-700 dark:text-gray-300">
        {tr(
          "docs.sections.connections.desc",
          "Configure, teste e compartilhe fontes de dados com segurança empresarial, pooling de conexões assíncrono e controle estrito de acessos."
        )}
      </p>

      {/* GUIA PASSO A PASSO */}
      <div className="space-y-3">
        <h3 className={`text-sm font-bold ${HEADING}`}>
          {tr("docs.sections.connections.step_guide_title", "Como Adicionar uma Nova Conexão")}
        </h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {CONNECTION_STEPS.map((s) => (
            <div key={s.step} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.02]">
              <div className="mb-1 text-xs font-black text-blue-600 dark:text-blue-400">PASSO {s.step}</div>
              <h4 className="text-xs font-bold text-gray-900 dark:text-white">{s.title}</h4>
              <p className="mt-1 text-[11px] font-medium leading-relaxed text-gray-500 dark:text-gray-400">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <Card
          icon={Activity}
          title={tr("docs.sections.connections.pooling_title", "Resiliência & Connection Pooling")}
        >
          <p className={BODY}>
            {tr(
              "docs.sections.connections.pooling_desc",
              "Health-checks automáticos (pool_pre_ping) e reciclagem programada eliminam quedas por timeouts de rede ou reinícios de instâncias remotas."
            )}
          </p>
        </Card>

        <Card
          icon={Share2}
          title={tr("docs.sections.connections.sharing_title", "Compartilhamento Corporativo & RBAC")}
        >
          <p className={BODY}>
            {tr(
              "docs.sections.connections.sharing_desc",
              "Conecte bancos à sua organização e atribua permissões granulares: Visualizador (apenas leitura), Editor (operações DML) e Administrador (gestão e DDL)."
            )}
          </p>
        </Card>

        <Card
          icon={Lock}
          title={tr("docs.sections.connections.ssl_title", "TLS/SSL e Certificados Customizados")}
        >
          <p className={BODY}>
            {tr(
              "docs.sections.connections.ssl_desc",
              "Suporte completo para conexões criptografadas com modos require, verify-ca e verify-full, garantindo conformidade com auditoria."
            )}
          </p>
        </Card>

        <Card
          icon={Server}
          title="Conexões Híbridas (Nuvem + On-Premise)"
        >
          <p className={BODY}>
            Alterne com transparência entre conexões diretas por IP/DNS ou conexões privadas tuneladas pelo MustaLink Agent sem alterar suas consultas SQL.
          </p>
        </Card>
      </div>

      {/* TABELA DE SGBDS */}
      <div className="space-y-3">
        <h3 className={`text-sm font-bold ${HEADING}`}>Motores e Conectores Homologados</h3>
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/10 dark:bg-black/30">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-gray-200 bg-gray-50 text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:border-white/10 dark:bg-white/5 dark:text-gray-400">
              <tr>
                <th className="p-3">Banco de Dados</th>
                <th className="p-3">Porta Padrão</th>
                <th className="p-3">Driver Backend</th>
                <th className="p-3">Tipo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5 font-medium text-gray-700 dark:text-gray-300">
              {SUPPORTED_DBS.map((db) => (
                <tr key={db.name} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.02]">
                  <td className="p-3 font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Database size={14} className="text-blue-500" />
                    {db.name}
                  </td>
                  <td className="p-3 font-mono">{db.port}</td>
                  <td className="p-3 font-mono text-blue-600 dark:text-blue-400">{db.driver}</td>
                  <td className="p-3">
                    <span className="rounded-md bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-700 dark:bg-white/10 dark:text-gray-300">
                      {db.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/** 4. MustaLink Agent */
function MustaLinkSection() {
  const tr = useTranslate();

  return (
    <div className="space-y-6">
      <p className="text-base font-normal leading-relaxed text-gray-700 dark:text-gray-300">
        {tr(
          "docs.sections.mustalink.desc",
          "Conecte com total segurança bases de dados locais, de escritórios ou em redes privadas à nuvem MustaInfo sem precisar abrir portas em firewalls ou expor IPs públicos."
        )}
      </p>

      {/* DIAGRAMA DO TÚNEL */}
      <div className={`${CARD} bg-gradient-to-br from-blue-50/50 to-indigo-50/30 dark:from-white/[0.02] dark:to-blue-900/[0.05]`}>
        <div className="mb-4 text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
          Fluxo do Túnel Reverso Seguro
        </div>
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 text-center">
          <div className="flex-1 rounded-xl border border-gray-200 bg-white p-3 dark:border-white/10 dark:bg-black/40">
            <Database className="mx-auto mb-1 text-blue-600 dark:text-blue-400" size={20} />
            <div className="text-xs font-bold text-gray-900 dark:text-white">Base de Dados Local</div>
            <div className="text-[11px] text-gray-500">Postgres, MySQL, Oracle (127.0.0.1)</div>
          </div>

          <ArrowRight className="hidden md:block text-blue-500 shrink-0" size={16} />

          <div className="flex-1 rounded-xl border border-blue-300 bg-blue-50/60 p-3 dark:border-blue-500/30 dark:bg-blue-500/10">
            <Server className="mx-auto mb-1 text-blue-600 dark:text-blue-400" size={20} />
            <div className="text-xs font-bold text-gray-900 dark:text-white">MustaLink Agent (Go)</div>
            <div className="text-[11px] text-blue-600 dark:text-blue-300">Binário Nativo Leve</div>
          </div>

          <ArrowRight className="hidden md:block text-blue-500 shrink-0" size={16} />

          <div className="flex-1 rounded-xl border border-gray-200 bg-white p-3 dark:border-white/10 dark:bg-black/40">
            <Lock className="mx-auto mb-1 text-emerald-600 dark:text-emerald-400" size={20} />
            <div className="text-xs font-bold text-gray-900 dark:text-white">Túnel WebSocket TLS</div>
            <div className="text-[11px] text-emerald-600 dark:text-emerald-400">wss://api.mustainfo.cloud</div>
          </div>

          <ArrowRight className="hidden md:block text-blue-500 shrink-0" size={16} />

          <div className="flex-1 rounded-xl border border-gray-200 bg-white p-3 dark:border-white/10 dark:bg-black/40">
            <Layout className="mx-auto mb-1 text-purple-600 dark:text-purple-400" size={20} />
            <div className="text-xs font-bold text-gray-900 dark:text-white">MustaInfo Studio</div>
            <div className="text-[11px] text-gray-500">Query Builder, SSE & Dashboards</div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <Card
          icon={Zap}
          title={tr("docs.sections.mustalink.how_it_works_title", "Como Funciona o Túnel Reverso")}
        >
          <p className={BODY}>
            {tr(
              "docs.sections.mustalink.how_it_works_desc",
              "O agente inicia uma conexão WebSocket segura (TLS) de dentro da sua rede para a API do MustaInfo (wss://api.mustainfo.cloud). As queries e streams trafegam de forma bidirecional e multiplexada com latência mínima."
            )}
          </p>
        </Card>

        <Card
          icon={Lock}
          title={tr("docs.sections.mustalink.pairing_title", "Emparelhamento por Código OTP (XXXX-XXXX)")}
        >
          <p className={BODY}>
            {tr(
              "docs.sections.mustalink.pairing_desc",
              "Gere um código de emparelhamento de uso único no painel. O agente consome o código, valida a sua organização e recebe um token de túnel seguro com expiração configurável."
            )}
          </p>
        </Card>

        <Card
          icon={Terminal}
          title={tr("docs.sections.mustalink.install_title", "Instalação Rápida Multiplataforma")}
        >
          <p className={BODY}>
            {tr(
              "docs.sections.mustalink.install_desc",
              "Disponível para Windows, Linux e macOS (arquiteturas amd64 e arm64). Scripts de instalação automatizada disponíveis para PowerShell e Bash."
            )}
          </p>
        </Card>

        <Card
          icon={GitBranch}
          title={tr("docs.sections.mustalink.virtual_host_title", "Endereçamento Virtual Transparente")}
        >
          <p className={BODY}>
            {tr(
              "docs.sections.mustalink.virtual_host_desc",
              "Ao criar ou gerir uma conexão no MustaInfo, basta apontar o host para agent://meu-agente ou musta-agent. O sistema roteia todo o tráfego SQL diretamente pelo túnel."
            )}
          </p>
        </Card>
      </div>

      <div className="space-y-4">
        <h3 className={`text-sm font-bold ${HEADING}`}>Instalação Automatizada do Agente</h3>
        
        <CodeSnippet
          label="Windows (PowerShell)"
          code="irm https://s3.mustainfo.cloud/meu-bucket/releases/musta-link/install.ps1 | iex"
        />

        <CodeSnippet
          label="Linux / macOS (Bash)"
          code="curl -sSL https://s3.mustainfo.cloud/meu-bucket/releases/musta-link/install.sh | bash"
        />

        <CodeSnippet
          label="Emparelhamento Manual com Código do Painel"
          code="./musta-link-agent -pair 1234-5678 -target 127.0.0.1:5432"
        />
      </div>

      <Callout tone="success">
        <strong>Segurança com Zero Port Forwarding:</strong> O agente nunca escuta em portas públicas. Ele realiza uma conexão de saída segura, contornando NAT restritivo e proxies corporativos sem necessidade de reconfiguração de roteadores.
      </Callout>
    </div>
  );
}

/** 5. Query Builder No-Code */
function QueryBuilderSection() {
  const tr = useTranslate();

  const QUERY_BUILDER_FEATURES = [
    "Múltiplos JOINS (Inner, Left, Right, Full) visuais",
    "Agregações Dinâmicas (COUNT, SUM, AVG, MIN, MAX)",
    "Filtros Condicionais Compostos (AND / OR) com Sub-queries",
    "Ordenação e Paginação Virtualizada em Memória",
    "Editor SQL Avançado com Sintaxe e IntelliSense",
    "Exportação Imediata para CSV, Excel (.xlsx) e JSON",
  ];

  const WORKFLOW_STEPS = [
    {
      step: "1",
      title: "Seleção de Tabelas",
      desc: "Escolha as tabelas do catálogo. O Query Builder detecta automaticamente relacionamentos de Foreign Keys existentes.",
    },
    {
      step: "2",
      title: "Construção de JOINs",
      desc: "Ligue visualmente campos de tabelas diferentes e selecione o tipo de junção com validação de cardinalidade.",
    },
    {
      step: "3",
      title: "Filtros & Agrupamentos",
      desc: "Adicione filtros condicionais (LIKE, BETWEEN, IN, >, <) e defina colunas de agrupamento para agregações.",
    },
    {
      step: "4",
      title: "Execução & Exportação",
      desc: "Visualize os dados em tempo real ou exporte o resultado para relatórios em um único clique.",
    },
  ];

  return (
    <div className="space-y-6">
      <p className="text-base font-normal leading-relaxed text-gray-700 dark:text-gray-300">
        {tr(
          "docs.sections.query_builder.desc",
          "Crie consultas complexas sem escrever uma única linha de SQL ou alterne para o editor avançado com realce de sintaxe e autocompletion inteligente."
        )}
      </p>

      {/* FLUXO VISUAL */}
      <div className="space-y-3">
        <h3 className={`text-sm font-bold ${HEADING}`}>
          {tr("docs.sections.query_builder.how_to_use_title", "Como Funciona o Fluxo de Construção")}
        </h3>
        <div className="grid gap-3 sm:grid-cols-4">
          {WORKFLOW_STEPS.map((w) => (
            <div key={w.step} className="rounded-xl border border-gray-200 bg-white p-3.5 shadow-sm dark:border-white/10 dark:bg-white/[0.02]">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-[11px] font-bold text-white mb-2">
                {w.step}
              </div>
              <h4 className="text-xs font-bold text-gray-900 dark:text-white">{w.title}</h4>
              <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">{w.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <h3 className={`text-sm font-bold ${HEADING}`}>
          {tr("docs.sections.query_builder.features_title", "Recursos do Construtor Visual")}
        </h3>
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {QUERY_BUILDER_FEATURES.map((feature) => (
            <li
              key={feature}
              className="flex items-center gap-2.5 rounded-xl border border-gray-200 bg-white p-3 text-xs font-bold text-gray-800 shadow-sm dark:border-white/10 dark:bg-white/[0.03] dark:text-gray-200"
            >
              <CheckCircle2 size={16} className="text-blue-600 dark:text-blue-400 shrink-0" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </div>

      <Card
        icon={Code2}
        title="SQL Gerado com Proteção Anti-Injeção"
        badge="SQL Otimizado"
      >
        <p className={BODY}>
          O Query Builder converte os blocos visuais de seleção em SQL nativo perfeitamente formatado e protegido contra injeção SQL através de bind variables:
        </p>
        <CodeSnippet
          code={`SELECT 
    c.id AS cliente_id,
    c.nome AS cliente_nome,
    COUNT(p.id) AS total_pedidos,
    COALESCE(SUM(p.valor_total), 0) AS faturamento_acumulado
FROM clientes c
LEFT JOIN pedidos p ON p.cliente_id = c.id AND p.status = 'pago'
WHERE c.ativo = true AND c.data_criacao >= '2026-01-01'
GROUP BY c.id, c.nome
HAVING COUNT(p.id) > 5
ORDER BY faturamento_acumulado DESC
LIMIT 50;`}
        />
      </Card>
    </div>
  );
}

/** 6. OCR Vision AI */
function OcrSection() {
  const tr = useTranslate();

  const PIPELINE_STEPS = [
    { title: "Ingestão & Deskew", desc: "Correção de rotação e binarização adaptativa de contraste." },
    { title: "Detecção Neural", desc: "Rede convolucional identifica regiões de texto, tabelas e cabeçalhos." },
    { title: "Tipagem Semântica", desc: "Mapeamento automático de moedas, datas, inteiros e strings." },
    { title: "Geração DDL/DML", desc: "Criação de instruções SQL prontas para inserção no banco." },
  ];

  return (
    <div className="space-y-6">
      <p className="text-base font-normal leading-relaxed text-gray-700 dark:text-gray-300">
        {tr(
          "docs.sections.ocr.desc",
          "Transforme documentos físicos, recibos, relatórios financeiros e esquemas técnicos em tabelas de bases de dados relacionais através de modelos neurais de visão."
        )}
      </p>

      {/* PIPELINE */}
      <div className="space-y-3">
        <h3 className={`text-sm font-bold ${HEADING}`}>
          {tr("docs.sections.ocr.pipeline_title", "Pipeline de Reconhecimento Neural")}
        </h3>
        <div className="grid gap-3 sm:grid-cols-4">
          {PIPELINE_STEPS.map((p, i) => (
            <div key={p.title} className="rounded-xl border border-gray-200 bg-white p-3.5 shadow-sm dark:border-white/10 dark:bg-white/[0.02]">
              <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400">FASE 0{i + 1}</span>
              <h4 className="text-xs font-bold text-gray-900 dark:text-white mt-1">{p.title}</h4>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">{p.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <Card
          icon={ScanText}
          title={tr("docs.sections.ocr.formats_title", "Suporte a Múltiplos Formatos")}
          badge="PNG, JPG, PDF"
        >
          <p className={BODY}>
            {tr(
              "docs.sections.ocr.formats_desc",
              "Processamento avançado de imagens PNG, JPG, WEBP e PDFs estruturados de múltiplas páginas com pré-processamento de ruído e alinhamento automático."
            )}
          </p>
        </Card>

        <Card
          icon={Database}
          title={tr("docs.sections.ocr.tables_title", "Detecção de Tabelas e Tipagem Automática")}
          badge="IA Visionária"
        >
          <p className={BODY}>
            {tr(
              "docs.sections.ocr.tables_desc",
              "O modelo detecta colunas, cabeçalhos e tipos de dados (datas, números monetários, texto), gerando comandos DDL e DML prontos para execução."
            )}
          </p>
        </Card>
      </div>

      <div
        className={`flex flex-col items-center justify-center gap-4 border-2 border-dashed p-10 text-center ${CARD}`}
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-white/5 dark:text-blue-400">
          <ScanText size={32} aria-hidden />
        </div>
        <div className="space-y-1">
          <h2 className={`text-base font-bold ${HEADING}`}>Motor de Extração Neural Multimodal</h2>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 max-w-md mx-auto">
            Arraste um relatório ou fatura para dentro do estúdio para que o MustaInfo digitalize a estrutura, crie a tabela relacional e popule os dados em segundos.
          </p>
        </div>
      </div>
    </div>
  );
}

/** 7. Streaming de Dados (SSE) */
function SseSection() {
  const tr = useTranslate();

  return (
    <div className="space-y-6">
      <p className="text-base font-normal leading-relaxed text-gray-700 dark:text-gray-300">
        {tr(
          "docs.sections.sse.desc",
          "Execute consultas analíticas pesadas sem bloquear o navegador. Os dados são transmitidos em fluxo contínuo via SSE com cancelamento instantâneo."
        )}
      </p>

      <div className="grid gap-6 sm:grid-cols-2">
        <Card
          icon={Zap}
          title={tr("docs.sections.sse.async_title", "Execução Não-Bloqueante")}
        >
          <p className={BODY}>
            {tr(
              "docs.sections.sse.async_desc",
              "Queries de longa duração não travam a interface: o backend processa os registros em chunks e transmite os dados à medida que chegam do banco."
            )}
          </p>
        </Card>

        <Card
          icon={Layers}
          title={tr("docs.sections.sse.virtualization_title", "Tabelas com Virtualização Extrema")}
        >
          <p className={BODY}>
            {tr(
              "docs.sections.sse.virtualization_desc",
              "Navegue por centenas de milhares de linhas com consumo mínimo de memória graças ao motor de virtualização que renderiza apenas os dados visíveis no ecrã."
            )}
          </p>
        </Card>
      </div>

      <div className="space-y-2">
        <h3 className={`text-sm font-bold ${HEADING}`}>
          {tr("docs.sections.sse.events_title", "Protocolo de Eventos SSE")}
        </h3>
        <CodeSnippet
          code={`event: progress
data: {"status": "executing", "fetched_rows": 25000, "elapsed_ms": 118}

event: chunk
data: [{"id": 101, "cliente": "Empresa Alfa", ...}, {"id": 102, ...}]

event: done
data: {"total_rows": 250000, "duration_ms": 680, "status": "completed"}`}
        />
      </div>

      <Callout tone="info">
        <strong>Cancelamento Instantâneo:</strong> Caso o usuário decida interromper a busca durante a transmissão, o MustaInfo envia um sinal TCP/socket imediato ao SGBD remoto, encerrando a query ativa e liberando memória no servidor.
      </Callout>
    </div>
  );
}

/** 8. Linhagem de Dados */
function LineageSection() {
  const tr = useTranslate();

  return (
    <div className="space-y-6">
      <p className="text-base font-normal leading-relaxed text-gray-700 dark:text-gray-300">
        {tr(
          "docs.sections.lineage.desc",
          "Rastreie o ciclo de vida completo dos dados: visualização de tabelas de origem, transformações aplicadas e tabelas de destino."
        )}
      </p>

      <div className="grid gap-6 sm:grid-cols-2">
        <Card
          icon={GitBranch}
          title={tr("docs.sections.lineage.traceability_title", "Rastreabilidade Ponta a Ponta")}
        >
          <p className={BODY}>
            {tr(
              "docs.sections.lineage.traceability_desc",
              "Entenda o impacto de qualquer alteração de esquema ou consulta em toda a pipeline analítica da empresa."
            )}
          </p>
        </Card>

        <Card
          icon={Activity}
          title={tr("docs.sections.lineage.metrics_title", "Métricas de Qualidade & Volume")}
        >
          <p className={BODY}>
            {tr(
              "docs.sections.lineage.metrics_desc",
              "Monitore contagem de linhas transferidas, duração de transformações em milissegundos e status de sucesso ou falha em tempo real."
            )}
          </p>
        </Card>
      </div>

      <CodeSnippet
        label="Estrutura de Evento de Linhagem (Data Lineage Event)"
        code={`{
  "source_table": "raw_transacoes_erp",
  "target_table": "dw_faturamento_consolidado",
  "transformation_type": "aggregate_daily_revenue",
  "rows_transferred": 45280,
  "duration_ms": 312,
  "status": "success",
  "executed_at": "2026-11-03T05:30:00Z"
}`}
      />
    </div>
  );
}

/** 9. Logs & Auditoria */
function AuditSection() {
  const tr = useTranslate();

  const AUDIT_METRICS = [
    { title: "Query Histories", table: "query_histories", desc: "Autor, banco, SQL integral, tempo em ms e linhas retornadas." },
    { title: "Acessos & Sessões", table: "logs / refresh_tokens", desc: "IP de origem, user_agent, tokens JTI e expiração." },
    { title: "Uso de Recursos", table: "request_usage", desc: "Volume de dados transferidos e consumo de requisições." },
    { title: "Storage & Cache", table: "storage_usage", desc: "Armazenamento em disco no MinIO/S3 e quotas de bucket." },
  ];

  return (
    <div className="space-y-6">
      <p className="text-base font-normal leading-relaxed text-gray-700 dark:text-gray-300">
        {tr(
          "docs.sections.audit.desc",
          "Mantenha o controle completo e a rastreabilidade total de todas as operações realizadas em suas bases de dados com trilha de auditoria imutável."
        )}
      </p>

      {/* METRICAS DE AUDITORIA */}
      <div className="space-y-3">
        <h3 className={`text-sm font-bold ${HEADING}`}>Estrutura das Trilhas de Auditoria</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {AUDIT_METRICS.map((m) => (
            <div key={m.title} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.02]">
              <div className="flex items-center justify-between mb-1">
                <h4 className="text-xs font-bold text-gray-900 dark:text-white">{m.title}</h4>
                <code className="text-[10px] font-mono text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-1.5 py-0.5 rounded">
                  {m.table}
                </code>
              </div>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">{m.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <Card
          icon={Terminal}
          title={tr("docs.sections.audit.query_history_title", "Histórico Completo de Consultas")}
        >
          <p className={BODY}>
            {tr(
              "docs.sections.audit.query_history_desc",
              "Registro de quem executou a consulta, timestamp exato, tempo de resposta, parâmetros utilizados e número de linhas retornadas."
            )}
          </p>
        </Card>

        <Card
          icon={Activity}
          title={tr("docs.sections.audit.telemetry_title", "Métricas de Performance do Sistema")}
        >
          <p className={BODY}>
            {tr(
              "docs.sections.audit.telemetry_desc",
              "Gráficos de uso de conexões, tempo de atividade do agente MustaLink, consumo de cache e tráfego de rede."
            )}
          </p>
        </Card>
      </div>

      <Callout tone="success">
        <strong>Conformidade Regulatória (LGPD & GDPR):</strong> Todos os registros de auditoria são assinados temporalmente em UTC, permitindo exportações estruturadas para auditorias externas de conformidade corporativa.
      </Callout>
    </div>
  );
}

/** 10. Protocolos de Segurança */
function SecuritySection() {
  const tr = useTranslate();

  const DEFENSE_LAYERS = [
    { title: "Criptografia em Repouso", tech: "AES-256-GCM", desc: "Senhas e segredos de conexões gravados com IV aleatório por linha." },
    { title: "Criptografia em Trânsito", tech: "TLS 1.3 / SSL", desc: "Comunicação HTTPS, WebSocket seguro e SSL enforcing para bancos." },
    { title: "Proteção Ativa", tech: "PentestGuard", desc: "Detecção em tempo real de injeções SQL, scanning e bypass malicioso." },
    { title: "Revogação Imediata", tech: "JTI Blacklisting", desc: "Invalidação instantânea de agentes ou sessões em milissegundos." },
  ];

  return (
    <div className="space-y-6">
      <p className="text-base font-normal leading-relaxed text-gray-700 dark:text-gray-300">
        {tr(
          "docs.sections.security.desc",
          "Desenvolvido com foco rigoroso em segurança de dados corporativos, privacidade e conformidade com os mais altos padrões de criptografia e auditoria."
        )}
      </p>

      {/* CAMADAS DE DEFESA */}
      <div className="space-y-3">
        <h3 className={`text-sm font-bold ${HEADING}`}>Camadas de Defesa em Profundidade</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {DEFENSE_LAYERS.map((d) => (
            <div key={d.title} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.02]">
              <div className="flex items-center justify-between mb-1">
                <h4 className="text-xs font-bold text-gray-900 dark:text-white">{d.title}</h4>
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded">
                  {d.tech}
                </span>
              </div>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">{d.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <Card
          icon={Lock}
          title={tr("docs.sections.security.encryption_title", "Criptografia AES-256-GCM em Repouso")}
        >
          <p className={BODY}>
            {tr(
              "docs.sections.security.encryption_desc",
              "Todas as senhas e strings de conexão são protegidas com cifras autenticadas AES-GCM. As chaves mestras nunca são expostas na interface."
            )}
          </p>
        </Card>

        <Card
          icon={Shield}
          title={tr("docs.sections.security.pentest_title", "PentestGuard: Proteção Ativa Contra Ataques")}
          badge="Proteção Ativa"
        >
          <p className={BODY}>
            {tr(
              "docs.sections.security.pentest_desc",
              "Proteção proativa contra injeções SQL, scanning malicioso, requisições forjadas e bloqueio preventivo de acessos não autorizados."
            )}
          </p>
        </Card>

        <Card
          icon={Layers}
          title={tr("docs.sections.security.tenant_title", "Isolamento Estrito de Tenant")}
        >
          <p className={BODY}>
            {tr(
              "docs.sections.security.tenant_desc",
              "Arquitetura com separação lógica estrita entre organizações: nenhum usuário tem visibilidade sobre sessões, agentes ou conexões alheias."
            )}
          </p>
        </Card>

        <Card
          icon={ShieldCheck}
          title={tr("docs.sections.security.jti_title", "Tokens JTI com Revogação Instantânea")}
        >
          <p className={BODY}>
            {tr(
              "docs.sections.security.jti_desc",
              "Tokens de agente utilizam identificadores criptográficos únicos (JTI). Em caso de suspeita, o acesso pode ser encerrado em milissegundos sem afetar outros túneis."
            )}
          </p>
        </Card>
      </div>

      <Callout tone="success">
        <strong>Privacidade Absoluta de Dados:</strong> O MustaInfo não armazena dados de negócio dos clientes em disco permanente; os dados trafegam exclusivamente em streaming na memória RAM protegida durante as consultas.
      </Callout>
    </div>
  );
}

/** 11. Engine de Base de Dados */
function DbEngineSection() {
  const tr = useTranslate();

  const ENGINE_TOPICS = [
    {
      icon: Code2,
      title: "Linguagens de Criação (C & C++)",
      body:
        "Motores como PostgreSQL, MySQL e Oracle são desenvolvidos em C e C++, permitindo controlo direto da memória, alta performance e comunicação de baixíssima latência com o hardware.",
    },
    {
      icon: Database,
      title: tr("docs.sections.db_engine.storage_title", "Armazenamento em Disco & Páginas"),
      body:
        tr(
          "docs.sections.db_engine.storage_desc",
          "Dados são gravados em páginas binárias de tamanho fixo (típico 8KB). O MustaInfo interage diretamente com estes esquemas mantendo integridade ACID."
        ),
      code: `/data/
 ├── base/16384/2619.dat   # Páginas binárias de dados
 ├── base/16384/2619.idx   # Índices B-Tree
 └── pg_wal/000000010000   # Registos Write-Ahead Log`,
    },
    {
      icon: Share2,
      title: tr("docs.sections.db_engine.btree_title", "Índices B-Tree & Busca O(log n)"),
      body:
        tr(
          "docs.sections.db_engine.btree_desc",
          "Aceleração exponencial de consultas por meio de estruturas balanceadas em árvore, minimizando leituras físicas de disco para centenas de milhares de linhas."
        ),
    },
    {
      icon: Cpu,
      title: "Buffer Pool em Memória RAM",
      body:
        "O Buffer Pool mantém as páginas mais requisitadas em memória volátil, utilizando algoritmos de substituição (como LRU ou Clock Sweep) para evitar acessos repetidos a SSDs/HDDs.",
    },
    {
      icon: Terminal,
      title: tr("docs.sections.db_engine.wal_title", "Write-Ahead Logging (WAL)"),
      body:
        tr(
          "docs.sections.db_engine.wal_desc",
          "Transações são salvas em log sequencial antes da gravação definitiva em disco, assegurando durabilidade e recuperação contra falhas."
        ),
    },
    {
      icon: Zap,
      title: "Pipeline de Execução de Queries",
      body:
        "O motor divide cada consulta em Parser (validação sintática), Analyzer (verificação de tipos e permissões), Optimizer/Planner (custo de plano de acesso) e Executor.",
      code: "SQL Query → Parser → AST → Optimizer (Cost-Based) → Execution Plan → Buffer Pool",
    },
  ];

  return (
    <div className="space-y-6">
      <p className="text-base font-normal leading-relaxed text-gray-700 dark:text-gray-300">
        {tr(
          "docs.sections.db_engine.desc",
          "Compreenda como os sistemas de base de dados gerenciam armazenamento em disco, buffer pool em memória, índices e execução de queries."
        )}
      </p>

      <div className="grid gap-6">
        {ENGINE_TOPICS.map((topic) => (
          <Card key={topic.title} icon={topic.icon} title={topic.title}>
            <p className={BODY}>{topic.body}</p>
            {topic.code && <pre className={CODE}>{topic.code}</pre>}
          </Card>
        ))}
      </div>

      <Callout tone="info">
        Esta arquitetura permite que o MustaInfo abstraia a complexidade interna dos SGBDs, oferecendo uma interface visual de ponta sem comprometer a integridade transacional ACID.
      </Callout>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MAPA DA DOCUMENTAÇÃO
// ─────────────────────────────────────────────────────────────

type DocItem = {
  id: string;
  labelKey: string;
  labelFallback: string;
  eyebrowKey: string;
  eyebrowFallback: string;
  titleKey: string;
  titleFallback: string;
  keywords: string[];
  Content: React.ComponentType;
};

type DocGroup = {
  id: string;
  titleKey: string;
  titleFallback: string;
  icon: LucideIcon;
  items: DocItem[];
};

const DOC_GROUPS: DocGroup[] = [
  {
    id: "getting-started",
    titleKey: "docs.menu.getting_started",
    titleFallback: "Primeiros Passos",
    icon: Zap,
    items: [
      {
        id: "intro",
        labelKey: "docs.menu.intro",
        labelFallback: "O que é o MustaInfo?",
        eyebrowKey: "docs.sections.intro.eyebrow",
        eyebrowFallback: "Visão Geral da Plataforma",
        titleKey: "docs.sections.intro.title",
        titleFallback: "O que é o MustaInfo?",
        keywords: ["visao geral", "plataforma", "nextjs", "arquitetura", "sgbd", "mustainfo", "pilares"],
        Content: IntroSection,
      },
      {
        id: "theme",
        labelKey: "docs.menu.theme",
        labelFallback: "Design System 2026",
        eyebrowKey: "docs.sections.theme.eyebrow",
        eyebrowFallback: "Design System & Interface",
        titleKey: "docs.sections.theme.title",
        titleFallback: "Design System 2026 · Padrão Oficial & Tokens",
        keywords: ["design system", "ui", "tailwind", "cores", "estilo", "tema", "tokens", "botoes", "dark mode"],
        Content: ThemeSection,
      },
      {
        id: "conn",
        labelKey: "docs.menu.connections",
        labelFallback: "Gestão de Conexões",
        eyebrowKey: "docs.sections.connections.eyebrow",
        eyebrowFallback: "Gestão de Fontes de Dados",
        titleKey: "docs.sections.connections.title",
        titleFallback: "Gestão Centralizada de Conexões",
        keywords: ["conexao", "host", "porta", "credenciais", "pooling", "postgres", "mysql", "oracle", "mongodb", "ssl"],
        Content: ConnSection,
      },
      {
        id: "mustalink",
        labelKey: "docs.menu.mustalink",
        labelFallback: "MustaLink Agent (Túnel)",
        eyebrowKey: "docs.sections.mustalink.eyebrow",
        eyebrowFallback: "Conectividade Segura On-Premise",
        titleKey: "docs.sections.mustalink.title",
        titleFallback: "MustaLink Agent · Túnel Reverso de Alto Desempenho",
        keywords: ["mustalink", "agente", "tunel", "reverso", "websocket", "pairing", "local", "on-premise", "go"],
        Content: MustaLinkSection,
      },
    ],
  },
  {
    id: "core-features",
    titleKey: "docs.menu.core_features",
    titleFallback: "Funcionalidades Core",
    icon: Cpu,
    items: [
      {
        id: "query-builder",
        labelKey: "docs.menu.query_builder",
        labelFallback: "Query Builder No-Code",
        eyebrowKey: "docs.sections.query_builder.eyebrow",
        eyebrowFallback: "Ferramentas No-Code & SQL",
        titleKey: "docs.sections.query_builder.title",
        titleFallback: "Query Builder No-Code & SQL Studio",
        keywords: ["sql", "join", "filtro", "agregacao", "no-code", "studio", "query", "exportacao"],
        Content: QueryBuilderSection,
      },
      {
        id: "ocr",
        labelKey: "docs.menu.ocr",
        labelFallback: "OCR Vision AI",
        eyebrowKey: "docs.sections.ocr.eyebrow",
        eyebrowFallback: "Inteligência Artificial & Visão Computacional",
        titleKey: "docs.sections.ocr.title",
        titleFallback: "OCR Vision AI · Extração Inteligente de Documentos",
        keywords: ["imagem", "pdf", "digitalizacao", "documento", "ia", "ocr", "visao", "tabela", "fatura"],
        Content: OcrSection,
      },
      {
        id: "sse",
        labelKey: "docs.menu.sse",
        labelFallback: "Streaming de Dados (SSE)",
        eyebrowKey: "docs.sections.sse.eyebrow",
        eyebrowFallback: "Processamento em Tempo Real",
        titleKey: "docs.sections.sse.title",
        titleFallback: "Streaming de Dados via Server-Sent Events (SSE)",
        keywords: ["server sent events", "tempo real", "stream", "virtualizacao", "async", "cancelamento"],
        Content: SseSection,
      },
      {
        id: "lineage",
        labelKey: "docs.menu.lineage",
        labelFallback: "Linhagem de Dados",
        eyebrowKey: "docs.sections.lineage.eyebrow",
        eyebrowFallback: "Governança & Engenharia de Dados",
        titleKey: "docs.sections.lineage.title",
        titleFallback: "Linhagem de Dados & Data Science",
        keywords: ["linhagem", "lineage", "pipeline", "origem", "destino", "transformacao"],
        Content: LineageSection,
      },
    ],
  },
  {
    id: "technical",
    titleKey: "docs.menu.technical",
    titleFallback: "Referência Técnica",
    icon: Terminal,
    items: [
      {
        id: "audit",
        labelKey: "docs.menu.audit",
        labelFallback: "Logs & Auditoria",
        eyebrowKey: "docs.sections.audit.eyebrow",
        eyebrowFallback: "Conformidade & Monitoramento",
        titleKey: "docs.sections.audit.title",
        titleFallback: "Logs, Auditoria & Telemetria",
        keywords: ["log", "auditoria", "historico", "rastreio", "telemetria", "queries", "compliance", "lgpd"],
        Content: AuditSection,
      },
      {
        id: "security",
        labelKey: "docs.menu.security",
        labelFallback: "Protocolos de Segurança",
        eyebrowKey: "docs.sections.security.eyebrow",
        eyebrowFallback: "Segurança Empresarial",
        titleKey: "docs.sections.security.title",
        titleFallback: "Protocolos de Segurança, PentestGuard & Criptografia",
        keywords: ["seguranca", "aes", "encriptacao", "pentestguard", "tenant", "autenticacao", "jti", "protocolos"],
        Content: SecuritySection,
      },
      {
        id: "db-engine",
        labelKey: "docs.menu.db_engine",
        labelFallback: "Engine de Base de Dados",
        eyebrowKey: "docs.sections.db_engine.eyebrow",
        eyebrowFallback: "Núcleo Técnico de SGBD",
        titleKey: "docs.sections.db_engine.title",
        titleFallback: "Arquitetura Interna de Motores de Base de Dados",
        keywords: ["b-tree", "wal", "buffer pool", "indice", "motor", "acid", "paginas", "disco"],
        Content: DbEngineSection,
      },
    ],
  },
];

const ALL_ITEMS = DOC_GROUPS.flatMap((group) => group.items);
const DEFAULT_SECTION = "intro";

// ─────────────────────────────────────────────────────────────
// PÁGINA PRINCIPAL
// ─────────────────────────────────────────────────────────────

export default function DocsPage() {
  const tr = useTranslate();

  const [activeSection, setActiveSection] = useState(DEFAULT_SECTION);
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  // Sincroniza a secção activa com o hash do URL (#intro, #theme, #conn, etc)
  useEffect(() => {
    const applyHash = () => {
      const id = window.location.hash.replace(/^#/, "");
      if (id && ALL_ITEMS.some((item) => item.id === id)) {
        setActiveSection(id);
      }
    };

    applyHash();
    window.addEventListener("hashchange", applyHash);
    return () => window.removeEventListener("hashchange", applyHash);
  }, []);

  const selectSection = useCallback((id: string) => {
    setActiveSection(id);
    setIsMobileNavOpen(false);
    if (window.location.hash !== `#${id}`) {
      window.history.pushState(null, "", `#${id}`);
    }
  }, []);

  // Filtragem da navegação por busca
  const filteredGroups = useMemo(() => {
    const query = normalize(searchQuery);
    if (!query) return DOC_GROUPS;

    return DOC_GROUPS.map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        const itemLabel = tr(item.labelKey, item.labelFallback);
        const itemTitle = tr(item.titleKey, item.titleFallback);
        return normalize([itemLabel, itemTitle, ...item.keywords].join(" ")).includes(query);
      }),
    })).filter((group) => group.items.length > 0);
  }, [searchQuery, tr]);

  const active = useMemo(
    () => ALL_ITEMS.find((item) => item.id === activeSection) ?? ALL_ITEMS[0],
    [activeSection]
  );

  const ActiveContent = active.Content;

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 antialiased selection:bg-blue-500/20 dark:bg-black dark:text-gray-100">

      {/* NAVBAR GLASSMORPHISM COM SELETOR DE IDIOMA */}
      <nav className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 px-4 md:px-8 backdrop-blur-xl dark:border-white/10 dark:bg-black/80">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4">
          <Link href="/" className="group flex items-center gap-3">
            <img
              src="/img/logo_mustainfo.png"
              alt="MustaInfo"
              className="h-9 w-9 rounded-xl object-cover shadow-sm border border-gray-200/60 dark:border-white/10 transition-transform group-hover:scale-105"
            />
            <span className="text-lg font-bold tracking-tight">
              MustaInfo <span className="text-blue-600 dark:text-blue-400">Docs</span>
            </span>
          </Link>

          <div className="flex items-center gap-3">
            {/* BARRA DE PESQUISA DESKTOP */}
            <div className="relative hidden w-72 md:block">
              <label htmlFor="docs-search" className="sr-only">
                {tr("docs.search", "Pesquisar documentação...")}
              </label>
              <Search
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                size={14}
                aria-hidden
              />
              <input
                id="docs-search"
                type="search"
                placeholder={tr("docs.search", "Pesquisar documentação...")}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-10 py-2 text-[13px] font-medium transition-all focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 dark:border-white/10 dark:bg-white/5 dark:text-gray-100 dark:placeholder-gray-500 dark:focus:bg-white/10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* SELETOR DE IDIOMA NA NAVBAR */}
            <div className="w-36 md:w-44">
              <LanguageSelector />
            </div>

            {/* BOTÃO MOBILE MENU */}
            <button
              type="button"
              onClick={() => setIsMobileNavOpen((open) => !open)}
              className="rounded-xl border border-gray-200 p-2 text-gray-500 transition-colors hover:bg-gray-100 md:hidden dark:border-white/10 dark:hover:bg-white/10"
              aria-expanded={isMobileNavOpen}
              aria-controls="docs-nav"
              aria-label={isMobileNavOpen ? "Fechar navegação" : "Abrir navegação"}
            >
              {isMobileNavOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
      </nav>

      <div className="mx-auto flex min-h-[calc(100vh-64px)] max-w-7xl flex-col md:flex-row">

        {/* SIDEBAR NAVEGAÇÃO */}
        <nav
          id="docs-nav"
          aria-label="Navegação da documentação"
          className={`w-full border-r border-gray-200 p-6 md:sticky md:top-16 md:block md:h-[calc(100vh-64px)] md:w-72 md:overflow-y-auto dark:border-white/10 ${
            isMobileNavOpen ? "block" : "hidden"
          }`}
        >
          {/* PESQUISA NO MOBILE */}
          <div className="relative mb-6 md:hidden">
            <label htmlFor="docs-search-mobile" className="sr-only">
              {tr("docs.search", "Pesquisar documentação...")}
            </label>
            <Search
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
              size={14}
              aria-hidden
            />
            <input
              id="docs-search-mobile"
              type="search"
              placeholder={tr("docs.search", "Pesquisar documentação...")}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-10 py-2.5 text-[13px] font-medium focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 dark:border-white/10 dark:bg-white/5 dark:text-gray-100"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {filteredGroups.length > 0 ? (
            <div className="space-y-8">
              {filteredGroups.map((group) => {
                const GroupIcon = group.icon;
                return (
                  <div key={group.id} className="space-y-2.5">
                    <p className="flex items-center gap-2 px-3 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                      <GroupIcon size={16} aria-hidden />
                      {tr(group.titleKey, group.titleFallback)}
                    </p>
                    <ul className="space-y-1">
                      {group.items.map((item) => {
                        const isActive = activeSection === item.id;
                        const itemLabel = tr(item.labelKey, item.labelFallback);
                        return (
                          <li key={item.id}>
                            <button
                              type="button"
                              onClick={() => selectSection(item.id)}
                              aria-current={isActive ? "page" : undefined}
                              className={`group flex w-full items-center justify-between rounded-xl px-3.5 py-2 text-left text-xs font-bold transition-all ${
                                isActive
                                  ? "bg-blue-600 text-white shadow-sm"
                                  : "text-gray-600 hover:bg-blue-50 hover:text-blue-600 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-blue-400"
                              }`}
                            >
                              <span className="truncate">{itemLabel}</span>
                              <ChevronRight
                                size={14}
                                aria-hidden
                                className={
                                  isActive ? "rotate-90 shrink-0" : "opacity-0 group-hover:opacity-100 shrink-0"
                                }
                              />
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="px-3 text-xs font-medium text-gray-500 dark:text-gray-400">
              {tr("docs.no_results", "Nenhum resultado encontrado para")}{" "}
              <strong>{searchQuery}</strong>.
            </p>
          )}
        </nav>

        {/* CONTEÚDO PRINCIPAL */}
        <main className="flex-1 p-6 md:p-12 lg:p-16">
          <article key={active.id} className="mx-auto max-w-3xl space-y-8">
            <header className="space-y-3 border-b border-gray-200 pb-6 dark:border-white/10">
              <p className={EYEBROW}>
                {tr(active.eyebrowKey, active.eyebrowFallback)}
              </p>
              <h1 className={`text-3xl md:text-4xl font-black tracking-tight ${HEADING}`}>
                {tr(active.titleKey, active.titleFallback)}
              </h1>
            </header>

            <ActiveContent />
          </article>

          {/* FOOTER DOCS */}
          <footer className="mt-20 flex flex-col items-center justify-between gap-6 border-t border-gray-200 pt-8 md:flex-row dark:border-white/10">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <img
                  src="/img/logo_mustainfo.png"
                  alt="MustaInfo"
                  className="h-8 w-8 rounded-xl object-cover border border-gray-200/60 dark:border-white/10 shadow-sm"
                />
                <div className="flex flex-col">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                    {tr("docs.version_label", "Versão do Motor")}
                  </p>
                  <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                    MustaInfo v4.2.0-stable
                  </span>
                </div>
              </div>
              <div className="h-6 w-px bg-gray-200 dark:bg-white/10" />
              <div className="w-44">
                <LanguageSelector />
              </div>
            </div>

            <Link
              href="/"
              className="flex items-center gap-2 rounded-xl bg-gray-900 px-5 py-2.5 text-[11px] font-bold uppercase tracking-wider text-white shadow-sm transition-all hover:bg-black dark:bg-white dark:text-black dark:hover:bg-gray-200"
            >
              {tr("docs.community", "Comunidade")} <Share2 size={14} aria-hidden />
            </Link>
          </footer>
        </main>
      </div>
    </div>
  );
}

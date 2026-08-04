"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Database, Zap, ChevronRight, Search, Cpu, Terminal,
  ScanText, Layout, Code2, Share2, Info, Menu, X,
  type LucideIcon,
} from "lucide-react";

import { useI18n } from "@/context/I18nContext";
import { LanguageSelector } from "@/app/home/configuracao/configuracaoTab/ComponentUsuarioTab/LanguageSelector";

// ─────────────────────────────────────────────────────────────
// TOKENS DE ESTILO
// Centralizados para o tema claro/escuro não divergir entre cartões.
// ─────────────────────────────────────────────────────────────

const CARD =
  "rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.03]";
const HEADING = "text-gray-900 dark:text-gray-50";
const BODY = "text-sm font-medium leading-relaxed text-gray-500 dark:text-gray-400";
const EYEBROW = "text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400";
const CODE =
  "mt-4 overflow-auto rounded-xl bg-gray-900 p-4 text-xs text-white dark:border dark:border-white/10 dark:bg-black";

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

/**
 * `t()` devolve a própria chave quando a tradução não existe, por isso
 * `t("x") || "fallback"` nunca cai no fallback — a chave é sempre truthy e
 * acaba a ser renderizada no ecrã. Este helper trata o eco da chave como
 * "tradução em falta".
 */
function useTranslate() {
  const { t } = useI18n();
  return useCallback(
    (key: string, fallback: string) => {
      const value = t(key);
      return value === key ? fallback : value;
    },
    [t]
  );
}

/** Minúsculas sem acentos, para a pesquisa aceitar "conexao" e "conexão". */
const normalize = (value: string) =>
  value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

function Card({
  icon: Icon,
  title,
  children,
}: {
  icon: LucideIcon;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className={CARD}>
      <h2 className={`mb-3 flex items-center gap-2 text-sm font-bold ${HEADING}`}>
        <Icon size={18} className="text-blue-600 dark:text-blue-400" aria-hidden />
        {title}
      </h2>
      {children}
    </div>
  );
}

function Callout({
  tone,
  children,
}: {
  tone: "info" | "warning";
  children: React.ReactNode;
}) {
  const tones = {
    info: "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-200",
    warning:
      "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200",
  } as const;

  return (
    <div className={`flex gap-3 rounded-xl border p-4 ${tones[tone]}`}>
      <Info className="shrink-0" size={20} aria-hidden />
      <p className="text-xs font-medium leading-relaxed">{children}</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// CONTEÚDO DAS SECÇÕES
// ─────────────────────────────────────────────────────────────

/** Tópicos de arquitetura do motor — antes eram 6 blocos JSX quase idênticos. */
const ENGINE_TOPICS: Array<{
  icon: LucideIcon;
  title: string;
  body: string;
  code?: string;
}> = [
  {
    icon: Code2,
    title: "Linguagens de Criação",
    body:
      "A maioria dos motores de bases de dados como PostgreSQL, MySQL e Oracle " +
      "são desenvolvidos em C e C++, permitindo controlo direto da memória, " +
      "alta performance e comunicação eficiente com o sistema operativo.",
  },
  {
    icon: Database,
    title: "Armazenamento em Disco",
    body:
      "Os dados são armazenados em ficheiros binários estruturados em páginas " +
      "(blocos de tamanho fixo). Cada página contém múltiplas linhas de dados e metadados.",
    code: `/data/
 ├── users.dat
 ├── users.idx
 └── wal.log`,
  },
  {
    icon: Share2,
    title: "Índices (B-Tree)",
    body:
      "Para acelerar consultas, os SGBDs utilizam estruturas como B-Trees, " +
      "permitindo buscas em tempo logarítmico (O(log n)) ao invés de percorrer toda a tabela.",
  },
  {
    icon: Cpu,
    title: "Gestão de Memória",
    body:
      "O Buffer Pool mantém dados frequentemente acedidos em memória RAM, " +
      "reduzindo acessos ao disco e melhorando significativamente a performance.",
  },
  {
    icon: Terminal,
    title: "Write-Ahead Logging (WAL)",
    body:
      "Antes de qualquer escrita em disco, as operações são registadas num log. " +
      "Isso garante recuperação de dados em caso de falhas e suporte às propriedades ACID.",
  },
  {
    icon: Zap,
    title: "Execução de Queries",
    body:
      "O processamento de queries segue três etapas principais: parsing, planeamento " +
      "e execução. O otimizador escolhe a melhor estratégia para aceder aos dados.",
    code: "SQL → Parser → Planner → Executor",
  },
];

function EngineSection() {
  return (
    <>
      <p className={BODY}>
        Esta secção descreve como os Sistemas de Gestão de Base de Dados (SGBDs) são
        construídos internamente, incluindo linguagens de baixo nível, armazenamento em
        disco, gestão de memória e execução de queries.
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
        Esta arquitetura permite que o Brain DB abstraia a complexidade dos SGBDs,
        oferecendo uma interface visual poderosa sem comprometer a performance.
      </Callout>
    </>
  );
}

function IntroSection() {
  return (
    <>
      <p className="text-lg font-medium leading-relaxed text-gray-500 dark:text-gray-400">
        Uma plataforma centralizada para engenharia de dados e análise preditiva. O Brain DB
        atua como o motor de visualização e manipulação de bases de dados, com suporte para
        PostgreSQL, MySQL, Oracle, SQL Server, SQLite, MongoDB e Redis.
      </p>

      <div className="grid gap-6">
        <Card icon={Layout} title="Arquitetura de Interface">
          <p className={BODY}>
            O projeto utiliza Next.js 16 com o App Router e React 19, garantindo máxima
            performance através de Server Components e hidratação seletiva para componentes
            interativos como tabelas virtualizadas.
          </p>
        </Card>
      </div>
    </>
  );
}

function ThemeSection() {
  return (
    <div className="space-y-6">
      <div className={`${CARD} space-y-6`}>
        <div>
          <label
            htmlFor="theme-focus-demo"
            className="mb-3 block text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400"
          >
            Transição de Estados (Exemplo)
          </label>
          <input
            id="theme-focus-demo"
            type="text"
            placeholder="Clique para ver o foco..."
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm transition-all focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 dark:border-white/10 dark:bg-white/5 dark:text-gray-100 dark:placeholder-gray-500 dark:focus:bg-white/10"
          />
        </div>

        <div className="grid grid-cols-2 gap-4 border-t border-gray-100 pt-4 dark:border-white/10">
          <div>
            <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-gray-400">
              Arredondamento
            </p>
            <div className={`text-sm font-bold ${HEADING}`}>rounded-xl (12px)</div>
          </div>
          <div>
            <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-gray-400">
              Sombra
            </p>
            <div className={`text-sm font-bold ${HEADING}`}>shadow-sm</div>
          </div>
        </div>
      </div>

      <Callout tone="warning">
        <strong>Nota de UI:</strong> todos os botões primários devem usar{" "}
        <code className="rounded bg-amber-100 px-1 py-0.5 dark:bg-amber-500/20">
          bg-blue-600
        </code>{" "}
        e as labels informativas de suporte devem sempre ser uppercase com espaçamento entre
        letras.
      </Callout>
    </div>
  );
}

function OcrSection() {
  return (
    <>
      <p className={BODY}>
        Extração inteligente de dados a partir de documentos e imagens técnicas.
      </p>

      <div
        className={`flex flex-col items-center justify-center gap-4 border-2 border-dashed p-10 text-center ${CARD}`}
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-50 text-gray-300 dark:bg-white/5 dark:text-gray-600">
          <ScanText size={32} aria-hidden />
        </div>
        <div className="space-y-1">
          <h2 className={`text-sm font-bold ${HEADING}`}>Motor de Processamento Neural</h2>
          <p className="text-xs font-medium text-gray-400 dark:text-gray-500">
            Suporte para PNG, JPG e PDF estruturado.
          </p>
        </div>
      </div>
    </>
  );
}

const QUERY_BUILDER_FEATURES = [
  "Múltiplos JOINS (Inner/Left)",
  "Agregações Dinâmicas",
  "Filtros com Sub-queries",
  "Ordenação Virtualizada",
];

function QueryBuilderSection() {
  return (
    <div className="space-y-4">
      <p className={BODY}>
        Capacidade de gerar consultas complexas via interface visual, suportando:
      </p>
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {QUERY_BUILDER_FEATURES.map((feature) => (
          <li
            key={feature}
            className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white p-3 text-xs font-bold text-gray-700 shadow-sm dark:border-white/10 dark:bg-white/[0.03] dark:text-gray-200"
          >
            <div className="h-1.5 w-1.5 rounded-full bg-blue-500" aria-hidden />
            {feature}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MAPA DA DOCUMENTAÇÃO
// Fonte única de verdade: o menu e o conteúdo saem daqui, por isso é
// impossível uma secção aparecer no menu sem conteúdo correspondente
// (ou renderizar conteúdo e placeholder ao mesmo tempo).
// ─────────────────────────────────────────────────────────────

type DocItem = {
  id: string;
  label: string;
  eyebrow: string;
  title: string;
  /** Termos extra considerados pela pesquisa, além do label e do título. */
  keywords: string[];
  /** `null` enquanto a secção não estiver escrita — rende o estado vazio. */
  Content: React.ComponentType | null;
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
    titleKey: "docs.menu.intro",
    titleFallback: "Primeiros Passos",
    icon: Zap,
    items: [
      {
        id: "intro",
        label: "O que é o Brain DB?",
        eyebrow: "Introdução ao Projeto",
        title: "OrionForgeNexus.",
        keywords: ["visao geral", "plataforma", "nextjs", "arquitetura"],
        Content: IntroSection,
      },
      {
        id: "theme",
        label: "Design System 2026",
        eyebrow: "Design System",
        title: "Padrão Oficial 2026",
        keywords: ["ui", "tailwind", "cores", "estilo", "tema"],
        Content: ThemeSection,
      },
      {
        id: "conn",
        label: "Gestão de Conexões",
        eyebrow: "Primeiros Passos",
        title: "Gestão de Conexões",
        keywords: ["conexao", "host", "porta", "credenciais"],
        Content: null,
      },
    ],
  },
  {
    id: "core-features",
    titleKey: "docs.menu.features",
    titleFallback: "Funcionalidades Core",
    icon: Cpu,
    items: [
      {
        id: "query-builder",
        label: "Query Builder No-Code",
        eyebrow: "Ferramentas SQL",
        title: "Query Builder",
        keywords: ["sql", "join", "filtro", "agregacao", "no-code"],
        Content: QueryBuilderSection,
      },
      {
        id: "ocr",
        label: "OCR Vision AI",
        eyebrow: "Módulo de Visão",
        title: "OCR Vision AI",
        keywords: ["imagem", "pdf", "digitalizacao", "documento", "ia"],
        Content: OcrSection,
      },
      {
        id: "sse",
        label: "Streaming de Dados (SSE)",
        eyebrow: "Funcionalidades Core",
        title: "Streaming de Dados (SSE)",
        keywords: ["server sent events", "tempo real", "stream"],
        Content: null,
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
        label: "Logs & Auditoria",
        eyebrow: "Referência Técnica",
        title: "Logs & Auditoria",
        keywords: ["log", "auditoria", "historico", "rastreio"],
        Content: null,
      },
      {
        id: "security",
        label: "Protocolos de Segurança",
        eyebrow: "Referência Técnica",
        title: "Protocolos de Segurança",
        keywords: ["seguranca", "aes", "encriptacao", "autenticacao"],
        Content: null,
      },
      {
        id: "db-engine",
        label: "Engine de Base de Dados",
        eyebrow: "Núcleo do Sistema",
        title: "Engine de Base de Dados",
        keywords: ["b-tree", "wal", "buffer pool", "indice", "motor", "acid"],
        Content: EngineSection,
      },
    ],
  },
];

const ALL_ITEMS = DOC_GROUPS.flatMap((group) => group.items);
const DEFAULT_SECTION = "intro";

// ─────────────────────────────────────────────────────────────
// PÁGINA
// ─────────────────────────────────────────────────────────────

export default function DocsPage() {
  const tr = useTranslate();

  const [activeSection, setActiveSection] = useState(DEFAULT_SECTION);
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  // Sincroniza a secção activa com o hash do URL, para que cada secção seja
  // partilhável, marcável nos favoritos e navegável com o botão "voltar".
  useEffect(() => {
    const applyHash = () => {
      const id = window.location.hash.replace(/^#/, "");
      if (id && ALL_ITEMS.some((item) => item.id === id)) setActiveSection(id);
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

  // A pesquisa filtra o menu por label, título e palavras-chave da secção.
  const filteredGroups = useMemo(() => {
    const query = normalize(searchQuery);
    if (!query) return DOC_GROUPS;

    return DOC_GROUPS.map((group) => ({
      ...group,
      items: group.items.filter((item) =>
        normalize([item.label, item.title, ...item.keywords].join(" ")).includes(query)
      ),
    })).filter((group) => group.items.length > 0);
  }, [searchQuery]);

  const active = useMemo(
    () => ALL_ITEMS.find((item) => item.id === activeSection) ?? ALL_ITEMS[0],
    [activeSection]
  );

  const ActiveContent = active.Content;

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 antialiased selection:bg-blue-500/20 dark:bg-black dark:text-gray-100">

      {/* NAVBAR GLASSMORPHISM */}
      <nav className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 px-6 backdrop-blur-xl dark:border-white/10 dark:bg-black/80">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4">
          <Link href="/" className="group flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm transition-transform group-hover:scale-105">
              <Database size={18} strokeWidth={2.5} aria-hidden />
            </div>
            <span className="text-lg font-bold tracking-tight">
              Brain DB <span className="text-blue-600 dark:text-blue-400">Docs</span>
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <div className="relative hidden w-80 md:block">
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
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-10 py-2.5 text-[13px] font-medium transition-all focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 dark:border-white/10 dark:bg-white/5 dark:text-gray-100 dark:placeholder-gray-500 dark:focus:bg-white/10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

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
          {/* Pesquisa também no mobile, onde a da navbar está escondida */}
          <div className="relative mb-8 md:hidden">
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
            <div className="space-y-10">
              {filteredGroups.map((group) => {
                const GroupIcon = group.icon;
                return (
                  <div key={group.id} className="space-y-3">
                    <p className="flex items-center gap-2 px-3 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                      <GroupIcon size={18} aria-hidden />
                      {tr(group.titleKey, group.titleFallback)}
                    </p>
                    <ul className="space-y-1">
                      {group.items.map((item) => {
                        const isActive = activeSection === item.id;
                        return (
                          <li key={item.id}>
                            <button
                              type="button"
                              onClick={() => selectSection(item.id)}
                              aria-current={isActive ? "page" : undefined}
                              className={`group flex w-full items-center justify-between rounded-xl px-4 py-2.5 text-left text-sm font-bold transition-all ${
                                isActive
                                  ? "bg-blue-600 text-white shadow-sm"
                                  : "text-gray-500 hover:bg-blue-50 hover:text-blue-600 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-blue-400"
                              }`}
                            >
                              {item.label}
                              <ChevronRight
                                size={14}
                                aria-hidden
                                className={
                                  isActive ? "rotate-90" : "opacity-0 group-hover:opacity-100"
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
            <p className="px-3 text-sm font-medium text-gray-400">
              Nenhum resultado para <strong>{searchQuery}</strong>.
            </p>
          )}
        </nav>

        {/* CONTEÚDO DINÂMICO */}
        <main className="flex-1 p-6 md:p-16">
          <article key={active.id} className="mx-auto max-w-3xl space-y-8">
            <header className="space-y-4">
              <p className={EYEBROW}>{active.eyebrow}</p>
              <h1 className={`text-4xl font-black tracking-tighter ${HEADING}`}>
                {active.title}
              </h1>
            </header>

            {ActiveContent ? (
              <ActiveContent />
            ) : (
              <div
                className={`space-y-4 py-20 text-center ${CARD}`}
                role="status"
              >
                <Code2 className="mx-auto text-gray-200 dark:text-gray-700" size={48} aria-hidden />
                <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400">
                  Documentação em Atualização
                </h2>
              </div>
            )}
          </article>

          {/* FOOTER DOCS */}
          <footer className="mt-24 flex flex-col items-center justify-between gap-8 border-t border-gray-200 pt-10 md:flex-row dark:border-white/10">
            <div className="flex items-center gap-6">
              <div className="flex flex-col">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                  Core Engine
                </p>
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                  v4.2.0-stable
                </span>
              </div>
              <div className="h-8 w-px bg-gray-200 dark:bg-white/10" />
              <div className="w-48">
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

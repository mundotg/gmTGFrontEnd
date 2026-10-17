"use client";

import React, { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  Brain,
  Sparkles,
  ArrowLeft,
  Search,
  CheckCircle2,
  Circle,
  ShieldCheck,
  Layers,
  Database,
  Server,
  FileText,
  Bookmark,
  Share2,
  Video,
  Image as ImageIcon,
  Link2,
  Users,
  Tag,
  ChevronDown,
  ChevronRight,
  Filter,
  Lock,
  Scale,
  ExternalLink,
  Copy,
  Printer,
  Clock,
  Info,
  AlertTriangle,
  Flame,
  BookOpen,
  FolderTree,
  Terminal,
  Activity,
  UserCheck,
  FileCheck,
  Check,
} from "lucide-react";

import { useI18n } from "@/context/I18nContext";

type SectionFilter =
  | "all"
  | "fundamentos"
  | "arquitetura"
  | "design"
  | "editor"
  | "descoberta"
  | "seguranca"
  | "roadmap";

export default function NexusPlanoPage() {
  const { t } = useI18n();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<SectionFilter>("all");
  const [copiedLink, setCopiedLink] = useState(false);
  const [selectedDemoType, setSelectedDemoType] = useState<
    "cientifico" | "curiosidade" | "experiencia"
  >("cientifico");

  const [mvpChecklist, setMvpChecklist] = useState<Record<number, boolean>>({});

  const [expandedSections, setExpandedSections] = useState<Record<number, boolean>>({
    1: true,
    2: true,
    3: true,
    7: true,
    13: true,
    15: true,
    16: true,
  });

  const toggleSection = useCallback((id: number) => {
    setExpandedSections((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const expandAll = useCallback(() => {
    const all: Record<number, boolean> = {};
    for (let i = 1; i <= 17; i++) all[i] = true;
    setExpandedSections(all);
  }, []);

  const collapseAll = useCallback(() => {
    setExpandedSections({});
  }, []);

  const toggleChecklistItem = useCallback((index: number) => {
    setMvpChecklist((prev) => ({ ...prev, [index]: !prev[index] }));
  }, []);

  const copyPageUrl = useCallback(() => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  }, []);

  const handlePrint = useCallback(() => {
    if (typeof window !== "undefined") {
      window.print();
    }
  }, []);

  const mvpCriteria = useMemo(
    () => [
      "O utilizador consegue autenticar-se.",
      "O sistema permite publicar conteúdo.",
      "A descrição Markdown é obrigatória.",
      "Os anexos são ativados apenas quando houver descrição preenchida.",
      "O limite de tamanho dos vídeos (<= 100 MiB) é rigorosamente validado.",
      "As publicações são persistidas na base de dados PostgreSQL.",
      "Os anexos são guardados no serviço de objetos MinIO/S3.",
      "O feed principal apresenta as publicações com cartões contextuais.",
      "A página individual renderiza Markdown seguro e referências.",
      "Os filtros funcionam no backend com paginação e ordenação.",
      "As permissões de acesso são validadas e aplicadas no servidor.",
      "A idade mínima de acesso é validada em todas as rotas relevantes.",
      "As publicações podem ser editadas e arquivadas pelo autor sob regras estritas.",
      "Existem mecanismos transparentes de denúncia e moderação.",
      "Os testes principais (unitários, integração e segurança) passam com 100% de sucesso.",
      "O sistema possui rotinas de cópia de segurança e procedimento de recuperação testado.",
    ],
    []
  );

  const completedCount = useMemo(
    () => Object.values(mvpChecklist).filter(Boolean).length,
    [mvpChecklist]
  );
  const progressPercent = Math.round((completedCount / mvpCriteria.length) * 100);

  const roadmapSteps = useMemo(
    () => [
      { step: 1, title: "Analisar a arquitetura do MustInfo", phase: "Fundação" },
      { step: 2, title: "Definir a integração entre os produtos", phase: "Fundação" },
      { step: 3, title: "Criar a identidade visual do Nexus Cognitiva", phase: "Design" },
      { step: 4, title: "Preparar o frontend e o backend", phase: "Estrutura" },
      { step: 5, title: "Integrar a autenticação", phase: "Segurança" },
      { step: 6, title: "Criar o modelo de dados PostgreSQL", phase: "Dados" },
      { step: 7, title: "Implementar categorias e tags", phase: "Taxonomia" },
      { step: 8, title: "Desenvolver o editor Markdown com regras de ativação", phase: "Editor" },
      { step: 9, title: "Implementar o armazenamento de anexos (MinIO/S3)", phase: "Multimédia" },
      { step: 10, title: "Criar o fluxo de publicação e persistência com estados", phase: "Core" },
      { step: 11, title: "Construir o feed principal responsivo", phase: "Descoberta" },
      { step: 12, title: "Desenvolver a página individual da publicação", phase: "Visualização" },
      { step: 13, title: "Implementar pesquisa full-text e filtros combinados", phase: "Busca" },
      { step: 14, title: "Adicionar favoritos e coleções pessoais", phase: "Social" },
      { step: 15, title: "Implementar sistema de comentários e respostas", phase: "Comunidade" },
      { step: 16, title: "Implementar moderação, permissões e denúncias", phase: "Governança" },
      { step: 17, title: "Executar bateria de testes (unitários, integração, segurança)", phase: "Qualidade" },
      { step: 18, title: "Preparar o deployment e ambientes (dev, test, prod)", phase: "Infraestrutura" },
      { step: 19, title: "Publicar versão beta para utilizadores selecionados", phase: "Lançamento" },
      { step: 20, title: "Recolher feedback e iterar melhorias contínuas", phase: "Evolução" },
    ],
    []
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-10 font-interface">
      {/* TOPO: VOLTAR AO FEED */}
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/nexus-cognitiva"
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#14283F] dark:text-slate-300 bg-white dark:bg-[#111D3D] border border-[#DCE3EA] dark:border-[#1E2D5A] hover:border-slate-400 dark:hover:border-slate-500 transition-all cursor-pointer shadow-xs"
        >
          <ArrowLeft className="w-4 h-4 text-[#087E8B] dark:text-teal-400" />
          <span>{t("nexus.backToFeed") || "Voltar ao Feed"}</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={copyPageUrl}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-[#111D3D] border border-[#DCE3EA] dark:border-[#1E2D5A] hover:border-slate-400 dark:hover:border-slate-500 text-[#14283F] dark:text-slate-300 transition-all shadow-xs cursor-pointer"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-[#087E8B] dark:text-teal-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedLink ? (t("nexus.copied") || "Copiado!") : (t("nexus.share") || "Copiar Link")}</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-[#111D3D] border border-[#DCE3EA] dark:border-[#1E2D5A] hover:border-slate-400 dark:hover:border-slate-500 text-[#14283F] dark:text-slate-300 transition-all shadow-xs cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Exportar / Imprimir</span>
          </button>
        </div>
      </div>

      {/* HERO SECTION DO PLANO */}
      <section className="relative rounded-2xl border border-[#DCE3EA] dark:border-[#1E2D5A] bg-white dark:bg-[#111D3D] p-8 sm:p-12 shadow-xs overflow-hidden">
        <div className="max-w-4xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold tracking-wide uppercase bg-[#087E8B]/10 text-[#087E8B] dark:text-teal-400 border border-[#087E8B]/20">
            <Sparkles className="w-3.5 h-3.5 text-[#087E8B] dark:text-teal-400" />
            <span>Documento Técnico e de Arquitetura</span>
          </div>

          <h1 className="font-editorial text-3xl sm:text-5xl font-bold tracking-tight text-[#14283F] dark:text-white leading-tight">
            NEXUS COGNITIVA
          </h1>
          <p className="text-lg sm:text-xl font-semibold text-[#087E8B] dark:text-teal-400">
            Plano de Implementação e Desenvolvimento
          </p>

          <p className="text-[#475569] dark:text-slate-300 text-xs sm:text-sm leading-relaxed max-w-3xl">
            Especificação oficial das 17 fases de engenharia para desenvolvimento modular e incremental do subsite no ecossistema MustInfo.
          </p>
        </div>
      </section>

      {/* FILTROS E AÇÕES DE SEÇÃO */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#475569] dark:text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Pesquisar nas seções do plano (ex: PostgreSQL, MinIO, moderação, MVP)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#F4F7FA] dark:bg-[#0B132B] border border-[#DCE3EA] dark:border-[#1E2D5A] focus:border-[#087E8B] text-xs sm:text-sm text-[#14283F] dark:text-white placeholder-[#475569]/70 dark:placeholder-slate-400 outline-none transition-all"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={expandAll}
              className="px-3 py-2 rounded-lg text-xs font-semibold bg-white dark:bg-[#111D3D] border border-[#DCE3EA] dark:border-[#1E2D5A] hover:border-slate-400 text-[#14283F] dark:text-slate-300 transition-all cursor-pointer shadow-xs"
            >
              Expandir Todas
            </button>
            <button
              onClick={collapseAll}
              className="px-3 py-2 rounded-lg text-xs font-semibold bg-white dark:bg-[#111D3D] border border-[#DCE3EA] dark:border-[#1E2D5A] hover:border-slate-400 text-[#14283F] dark:text-slate-300 transition-all cursor-pointer shadow-xs"
            >
              Recolher Todas
            </button>
          </div>
        </div>

        {/* PILLS */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {[
            { id: "all", label: "Todas as 17 Seções" },
            { id: "fundamentos", label: "1-2. Fundamentos" },
            { id: "arquitetura", label: "3, 9. Arquitetura" },
            { id: "design", label: "4-6. Identidade" },
            { id: "editor", label: "7-8. Editor" },
            { id: "descoberta", label: "10-11. Descoberta" },
            { id: "seguranca", label: "12-14. Segurança & Testes" },
            { id: "roadmap", label: "15-17. Roadmap & MVP" },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id as SectionFilter)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                activeFilter === f.id
                  ? "bg-[#087E8B] text-white shadow-xs"
                  : "bg-white dark:bg-[#111D3D] text-[#475569] dark:text-slate-300 hover:text-[#14283F] dark:hover:text-white border border-[#DCE3EA] dark:border-[#1E2D5A]"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </section>

      {/* SEÇÕES COMPLETAS 1 A 17 */}
      <div className="space-y-6">
        {/* SEÇÃO 1: VISÃO */}
        {(activeFilter === "all" || activeFilter === "fundamentos") && (
          <PlanoCard
            id={1}
            isExpanded={expandedSections[1]}
            onToggle={() => toggleSection(1)}
            icon={Brain}
            badge="Seção 1"
            title="1. Visão e posicionamento do produto"
          >
            <div className="space-y-3 text-xs sm:text-sm text-[#14283F] dark:text-slate-300 leading-relaxed">
              <p>
                O <strong>Nexus Cognitiva</strong> é uma marca do ecossistema <strong>MustInfo</strong> destinada à partilha e descoberta de conhecimento científico, curiosidades fundamentadas e vivências estruturadas.
              </p>
              <div className="p-3.5 bg-teal-50 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-800/30 rounded-xl text-[#087E8B] dark:text-teal-300 text-xs italic">
                "A plataforma distingue claramente informação científica, curiosidades, opiniões e experiências pessoais. Uma experiência individual não é apresentada automaticamente como facto científico."
              </div>
            </div>
          </PlanoCard>
        )}

        {/* SEÇÃO 2: ANÁLISE INICIAL */}
        {(activeFilter === "all" || activeFilter === "fundamentos") && (
          <PlanoCard
            id={2}
            isExpanded={expandedSections[2]}
            onToggle={() => toggleSection(2)}
            icon={Search}
            badge="Seção 2"
            title="2. Fase inicial — Análise do projeto existente"
          >
            <div className="space-y-2 text-xs text-[#14283F] dark:text-slate-300">
              <p>
                Passo 1: Inspecionar o ecossistema MustInfo para reutilizar mecanismos estáveis de autenticação e sessão.
              </p>
              <p>
                Passo 2: Modelo de integração com contratos bem definidos e isolamento de permissões e dados.
              </p>
            </div>
          </PlanoCard>
        )}

        {/* SEÇÃO 3: ARQUITETURA */}
        {(activeFilter === "all" || activeFilter === "arquitetura") && (
          <PlanoCard
            id={3}
            isExpanded={expandedSections[3]}
            onToggle={() => toggleSection(3)}
            icon={Server}
            badge="Seção 3"
            title="3. Fase de arquitetura — Stack técnica"
          >
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="p-3 rounded-lg bg-white dark:bg-[#111D3D] border border-[#DCE3EA] dark:border-[#1E2D5A]">
                <span className="font-semibold text-[#14283F] dark:text-white block">Frontend</span>
                <span className="text-[#475569] dark:text-slate-400 text-[11px]">Next.js, React 19, TypeScript, Tailwind</span>
              </div>
              <div className="p-3 rounded-lg bg-white dark:bg-[#111D3D] border border-[#DCE3EA] dark:border-[#1E2D5A]">
                <span className="font-semibold text-[#14283F] dark:text-white block">Backend</span>
                <span className="text-[#475569] dark:text-slate-400 text-[11px]">Python, FastAPI, Pydantic, SQLAlchemy</span>
              </div>
              <div className="p-3 rounded-lg bg-white dark:bg-[#111D3D] border border-[#DCE3EA] dark:border-[#1E2D5A]">
                <span className="font-semibold text-[#14283F] dark:text-white block">Database</span>
                <span className="text-[#475569] dark:text-slate-400 text-[11px]">PostgreSQL relacional com índices full-text</span>
              </div>
              <div className="p-3 rounded-lg bg-white dark:bg-[#111D3D] border border-[#DCE3EA] dark:border-[#1E2D5A]">
                <span className="font-semibold text-[#14283F] dark:text-white block">Multimédia</span>
                <span className="text-[#475569] dark:text-slate-400 text-[11px]">MinIO / S3 com streaming e URLs assinados</span>
              </div>
            </div>
          </PlanoCard>
        )}

        {/* SEÇÃO 7: EDITOR */}
        {(activeFilter === "all" || activeFilter === "editor") && (
          <PlanoCard
            id={7}
            isExpanded={expandedSections[7]}
            onToggle={() => toggleSection(7)}
            icon={FileText}
            badge="Seção 7"
            title="7. Fase de publicação — Campos do editor (A a K)"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {[
                "A. Categoria e subcategoria (Obrigatório)",
                "B. Tipo de informação: Científico, Curiosidade, Experiência...",
                "C. Título recomendado e claro",
                "D. Descrição em Markdown obrigatória",
                "E. Imagem (ativada apenas com descrição preenchida)",
                "F. Vídeo com limite rigoroso de 100 MiB",
                "G. URL externa com bloqueio de javascript:",
                "H. Referências a pessoas e cientistas",
                "I. Idade mínima (todas, 13+, 16+, 18+)",
                "J. Tags de classificação transversal",
                "K. Fontes estruturadas (DOI, autores, ano)",
              ].map((c, i) => (
                <div key={i} className="p-2.5 rounded-lg bg-white dark:bg-[#111D3D] border border-[#DCE3EA] dark:border-[#1E2D5A] text-[#14283F] dark:text-slate-300">
                  {c}
                </div>
              ))}
            </div>
          </PlanoCard>
        )}

        {/* SEÇÃO 15: TIMELINE ROADMAP */}
        {(activeFilter === "all" || activeFilter === "roadmap") && (
          <PlanoCard
            id={15}
            isExpanded={expandedSections[15]}
            onToggle={() => toggleSection(15)}
            icon={Activity}
            badge="Seção 15"
            title="15. Ordem de desenvolvimento recomendada (20 Passos)"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
              {roadmapSteps.map((s) => (
                <div key={s.step} className="p-2.5 rounded-lg bg-white dark:bg-[#111D3D] border border-[#DCE3EA] dark:border-[#1E2D5A] flex items-center justify-between">
                  <span className="font-semibold text-[#14283F] dark:text-slate-200">
                    {s.step}. {s.title}
                  </span>
                  <span className="text-[10px] font-semibold text-[#087E8B] dark:text-teal-400 bg-[#087E8B]/10 px-2 py-0.5 rounded">
                    {s.phase}
                  </span>
                </div>
              ))}
            </div>
          </PlanoCard>
        )}

        {/* SEÇÃO 16: CRITÉRIOS DE ACEITAÇÃO DO MVP */}
        {(activeFilter === "all" || activeFilter === "roadmap") && (
          <PlanoCard
            id={16}
            isExpanded={expandedSections[16]}
            onToggle={() => toggleSection(16)}
            icon={CheckCircle2}
            badge="Seção 16"
            title="16. Critérios de aceitação do MVP (Checklist Interativo)"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs font-semibold text-[#14283F] dark:text-white">
                <span>Progresso de Prontidão:</span>
                <span className="text-[#087E8B] dark:text-teal-400">{completedCount} de {mvpCriteria.length} ({progressPercent}%)</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                <div className="h-full bg-[#087E8B] transition-all" style={{ width: `${progressPercent}%` }}></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                {mvpCriteria.map((c, i) => (
                  <div
                    key={i}
                    onClick={() => toggleChecklistItem(i)}
                    className={`p-2.5 rounded-lg border cursor-pointer flex items-center gap-2 select-none transition-colors ${
                      mvpChecklist[i] ? "bg-teal-50 dark:bg-teal-950/20 border-teal-300 dark:border-teal-500/40 text-[#087E8B] dark:text-teal-200" : "bg-white dark:bg-[#111D3D] border-[#DCE3EA] dark:border-[#1E2D5A] text-[#14283F] dark:text-slate-300"
                    }`}
                  >
                    {mvpChecklist[i] ? <CheckCircle2 className="w-4 h-4 text-[#087E8B] dark:text-teal-400 shrink-0" /> : <Circle className="w-4 h-4 text-[#475569] dark:text-slate-500 shrink-0" />}
                    <span className={mvpChecklist[i] ? "line-through opacity-80" : ""}>{c}</span>
                  </div>
                ))}
              </div>
            </div>
          </PlanoCard>
        )}
      </div>
    </div>
  );
}

function PlanoCard({
  id,
  isExpanded,
  onToggle,
  icon: Icon,
  badge,
  title,
  children,
}: {
  id: number;
  isExpanded: boolean;
  onToggle: () => void;
  icon: React.ElementType;
  badge: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <article className="bg-white dark:bg-[#111D3D] border border-[#DCE3EA] dark:border-[#1E2D5A] rounded-xl overflow-hidden shadow-xs font-interface">
      <header
        onClick={onToggle}
        className="p-4 sm:p-5 cursor-pointer select-none flex items-center justify-between gap-3 bg-white dark:bg-[#111D3D] hover:bg-[#F8FAFC] dark:hover:bg-[#162447] transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#087E8B]/10 dark:bg-teal-500/20 text-[#087E8B] dark:text-teal-400 border border-[#087E8B]/20 dark:border-teal-500/30 flex items-center justify-center shrink-0">
            <Icon className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#087E8B] dark:text-teal-400 bg-[#087E8B]/10 px-2 py-0.5 rounded border border-[#087E8B]/20">
              {badge}
            </span>
            <h3 className="font-editorial text-sm sm:text-base font-semibold text-[#14283F] dark:text-white mt-1">{title}</h3>
          </div>
        </div>
        <button type="button" className="text-[#475569] hover:text-[#14283F] dark:text-slate-400 dark:hover:text-white cursor-pointer">
          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
      </header>

      {isExpanded && <div className="p-5 border-t border-[#DCE3EA] dark:border-[#1E2D5A] bg-[#F8FAFC] dark:bg-[#0B132B]/50">{children}</div>}
    </article>
  );
}

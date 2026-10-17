"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Lock,
  CheckCircle2,
  AlertTriangle,
  Link2,
  Video,
  Image as ImageIcon,
  Send,
  Clock,
  
} from "lucide-react";
import { useSession } from "@/context/SessionContext";
import { useI18n } from "@/context/I18nContext";
import { createPost } from "../services/nexusApi";
import { MarkdownRenderer } from "../components/MarkdownRenderer";
import { useNexusAuth } from "../components/NexusAuthContext";

// Componente reutilizável de Ajuda / Informação do Campo
function FieldHelp({
  text,
  title,
}: {
  text: string;
  title?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative inline-flex items-center ml-1.5 align-middle select-none">
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen((prev) => !prev);
        }}
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        aria-label={title || "Informação sobre este campo"}
        aria-expanded={isOpen}
        title={title || "Para que serve este campo?"}
        className="w-4 h-4 rounded-full bg-slate-200/90 dark:bg-slate-700/80 hover:bg-[#087E8B] dark:hover:bg-teal-500 text-slate-700 dark:text-slate-300 hover:text-white dark:hover:text-white flex items-center justify-center font-bold text-[10px] leading-none transition-colors cursor-pointer border border-slate-300 dark:border-slate-600 shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#087E8B]/40"
      >
        ?
      </button>

      {isOpen && (
        <div
          role="tooltip"
          onMouseEnter={() => setIsOpen(true)}
          onMouseLeave={() => setIsOpen(false)}
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-64 sm:w-72 max-w-[calc(100vw-2.5rem)] p-3 rounded-xl bg-[#14283F] dark:bg-[#0B132B] text-white shadow-xl border border-slate-700/80 dark:border-teal-500/30 text-xs animate-in fade-in zoom-in-95 pointer-events-auto"
        >
          <div className="flex items-start gap-2">
            <span className="w-4 h-4 rounded-full bg-[#087E8B] text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
              ?
            </span>
            <div className="space-y-1">
              <span className="font-semibold text-teal-300 block text-[11px] leading-tight">
                {title || "Para que serve este campo?"}
              </span>
              <p className="text-slate-200 dark:text-slate-300 text-[11px] leading-relaxed font-normal">
                {text}
              </p>
            </div>
          </div>
          {/* Seta do tooltip */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#14283F] dark:border-t-[#0B132B]" />
        </div>
      )}
    </div>
  );
}

export default function PublishArticlePage() {
  const router = useRouter();
  const { user, isAuthenticated } = useSession();
  const { t } = useI18n();
  const { openLoginModal } = useNexusAuth();

  // Estados dos Campos (A a K)
  const [categoria, setCategoria] = useState("Ciência e tecnologia");
  const [subcategoria, setSubcategoria] = useState("");
  const [tipoInformacao, setTipoInformacao] = useState<
    "cientifico" | "curiosidade" | "experiencia" | "opiniao" | "analise"
  >("cientifico");
  const [titulo, setTitulo] = useState("");
  const [descricaoMarkdown, setDescricaoMarkdown] = useState("");
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  // Anexos (desativados quando a descrição estiver vazia)
  const [imagemUrl, setImagemUrl] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [urlExterna, setUrlExterna] = useState("");
  const [urlError, setUrlError] = useState<string | null>(null);

  // Referências e Metadados
  const [referenciaPessoas, setReferenciaPessoas] = useState("");
  const [idadeMinima, setIdadeMinima] = useState<"all" | "13+" | "16+" | "18+">("all");
  const [tagsInput, setTagsInput] = useState("");

  // Fontes científicas (Seção K)
  const [fonteTitulo, setFonteTitulo] = useState("");
  const [fonteAutores, setFonteAutores] = useState("");
  const [fonteAno, setFonteAno] = useState("2024");
  const [fonteDoi, setFonteDoi] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successToast, setSuccessToast] = useState(false);
  const [customReadTime, setCustomReadTime] = useState<string>("");

  // Cálculo calibrado do tempo de leitura em tempo real (220 ppm + código)
  const statsLeitura = useMemo(() => {
    if (!descricaoMarkdown.trim()) {
      return { words: 0, minutes: 1 };
    }
    const clean = descricaoMarkdown
      .replace(/```[\s\S]*?```/g, "")
      .replace(/#+|[*_~`>|\[\]\(\)]/g, " ")
      .replace(/https?:\/\/\S+/g, "");
    const words = clean.trim().split(/\s+/).filter(Boolean).length;
    const codeBlocks = descricaoMarkdown.match(/```[\s\S]*?```/g) || [];
    let codeLines = 0;
    codeBlocks.forEach((cb) => {
      const lines = cb.trim().split("\n");
      if (lines.length > 2) codeLines += lines.length - 2;
    });
    const codeMinutes = (codeLines * 3) / 60;
    const minutes = Math.max(1, Math.round(words / 220 + codeMinutes));
    return { words, minutes };
  }, [descricaoMarkdown]);

  // Regra fundamental: Anexos ativados APENAS com texto na descrição
  const isAttachmentsEnabled = useMemo(() => {
    return descricaoMarkdown.trim().length > 0;
  }, [descricaoMarkdown]);

  // Validação de vídeo (limite de 100 MiB)
  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVideoError(null);
    const file = e.target.files?.[0];
    if (!file) {
      setVideoFile(null);
      return;
    }

    const maxBytes = 100 * 1024 * 1024; // 100 MiB
    if (file.size > maxBytes) {
      setVideoError("O arquivo de vídeo excede o limite máximo permitido de 100 MiB.");
      setVideoFile(null);
      return;
    }

    setVideoFile(file);
  };

  // Validação de URL segura
  const handleUrlChange = (val: string) => {
    setUrlError(null);
    setUrlExterna(val);
    if (val.trim()) {
      const lower = val.trim().toLowerCase();
      if (lower.startsWith("javascript:") || lower.startsWith("data:") || lower.startsWith("vbscript:")) {
        setUrlError("Esquema de URL perigoso bloqueado por segurança.");
      }
    }
  };

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!isAuthenticated) {
      setErrorMessage(t("nexus.errorAuthRequired") || "É necessário iniciar sessão para publicar no Nexus Cognitiva.");
      openLoginModal("/nexus-cognitiva/publicar");
      return;
    }
    if (!titulo.trim() || !descricaoMarkdown.trim()) {
      setErrorMessage(t("nexus.errorTitleAndDescRequired") || "O título e a descrição são obrigatórios.");
      return;
    }
    if (urlError || videoError) {
      return;
    }

    setIsSubmitting(true);
    try {
      // Processar tags divididas por vírgula
      const tags = tagsInput
        .split(",")
        .map((tag) => tag.trim().replace(/^#/, ""))
        .filter(Boolean);

      // Processar referências a pessoas / co-autores
      const mentions = referenciaPessoas
        .split(",")
        .map((p) => p.trim())
        .filter(Boolean)
        .map((name) => ({ name, role: "Colaborador/Citado" }));

      // Processar fonte bibliográfica
      const sources = fonteTitulo.trim()
        ? [
            {
              title: fonteTitulo.trim(),
              authors: fonteAutores.trim() || "Autor não especificado",
              year: parseInt(fonteAno, 10) || new Date().getFullYear(),
              doi: fonteDoi.trim() || undefined,
              verified: !!fonteDoi.trim(),
            },
          ]
        : undefined;

      const payload = {
        title: titulo.trim(),
        summary:
          descricaoMarkdown.trim().slice(0, 240) +
          (descricaoMarkdown.trim().length > 240 ? "..." : ""),
        body_markdown: descricaoMarkdown.trim(),
        category: categoria,
        subcategory: subcategoria.trim() || undefined,
        content_type: tipoInformacao,
        min_age: idadeMinima,
        cover_image: imagemUrl.trim() || undefined,
        external_url: urlExterna.trim() || undefined,
        read_time_minutes:
          customReadTime && parseInt(customReadTime, 10) > 0
            ? parseInt(customReadTime, 10)
            : statsLeitura.minutes,
        tags,
        mentions,
        sources,
      };

      await createPost(payload);
      setSuccessToast(true);
      setTimeout(() => {
        router.push("/nexus-cognitiva");
      }, 1200);
    } catch (err: any) {
      console.error("Erro ao criar publicação:", err);
      const detail = err?.response?.data?.detail;
      const msg = typeof detail === "string" ? detail : (detail?.[0]?.msg || "Erro ao publicar. Verifique os dados inseridos.");
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8 font-interface">
      {/* TOPO: VOLTAR */}
      <div className="flex items-center justify-between">
        <Link
          href="/nexus-cognitiva"
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#14283F] dark:text-slate-300 bg-white dark:bg-[#111D3D] border border-[#DCE3EA] dark:border-[#1E2D5A] hover:border-slate-400 dark:hover:border-slate-500 transition-all cursor-pointer shadow-xs"
        >
          <ArrowLeft className="w-4 h-4 text-[#087E8B] dark:text-teal-400" />
          <span>{t("nexus.backToFeed") || "Voltar ao Feed"}</span>
        </Link>

        <span className="text-xs text-[#087E8B] dark:text-teal-400 font-semibold bg-[#087E8B]/10 px-3 py-1 rounded-md border border-[#087E8B]/20">
          {t("nexus.publishTitle") || "Publicar Artigo"}
        </span>
      </div>

      <div className="space-y-2">
        <h1 className="font-editorial text-2xl sm:text-4xl font-bold text-[#14283F] dark:text-white tracking-tight">
          {t("nexus.publishTitle") || "Publicar Novo Artigo ou Estudo"}
        </h1>
        <p className="text-sm text-[#475569] dark:text-slate-300">
          {t("nexus.publishDesc") || "Submeta o seu conhecimento com categorização precisa e referências auditáveis."}
        </p>
      </div>

      {!isAuthenticated && (
        <div className="p-4 rounded-xl bg-[#087E8B]/10 border border-[#087E8B]/30 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <Lock className="w-4 h-4 text-[#087E8B] dark:text-teal-400 shrink-0" />
            <span className="text-[#14283F] dark:text-slate-200">
              {t("nexus.errorAuthRequired") || "É necessário iniciar sessão para submeter a publicação."}
            </span>
          </div>
          <button
            type="button"
            onClick={() => openLoginModal("/nexus-cognitiva/publicar")}
            className="px-3.5 py-1.5 rounded-lg font-semibold bg-[#087E8B] hover:bg-[#066570] text-white transition-all shrink-0 cursor-pointer shadow-xs"
          >
            {t("nexus.login") || "Iniciar Sessão"}
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-500/50 text-xs sm:text-sm text-rose-800 dark:text-rose-200 flex items-center gap-2.5 animate-in slide-in-from-top-2">
          <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
          <span className="font-medium">{errorMessage}</span>
        </div>
      )}

      {successToast && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-500/50 text-xs sm:text-sm text-emerald-800 dark:text-emerald-200 flex items-center gap-2.5 animate-in slide-in-from-top-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span className="font-semibold">{t("nexus.publishSuccess") || "Publicação criada com sucesso! Redirecionando para o feed..."}</span>
        </div>
      )}

      {/* FORMULÁRIO COMPLETO */}
      <form onSubmit={handleSubmit} className="space-y-8 bg-white dark:bg-[#111D3D] border border-[#DCE3EA] dark:border-[#1E2D5A] rounded-2xl p-6 sm:p-8 shadow-xs">
        {/* A. CATEGORIA E SUBCATEGORIA */}
        <div className="space-y-4 pb-6 border-b border-[#DCE3EA] dark:border-[#1E2D5A]">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-md bg-[#14283F]/10 dark:bg-teal-500/20 text-[#14283F] dark:text-teal-300 border border-[#14283F]/20 dark:border-teal-500/30 flex items-center justify-center font-bold text-xs">
              A
            </span>
            <label className="text-sm font-semibold text-[#14283F] dark:text-white flex items-center">
              <span>{t("nexus.fieldCategory") || "Categoria da Informação"} *</span>
              <FieldHelp text={t("nexus.helpCategory") || "Agrupa a publicação na grande área do saber (ex.: Ciência, Saúde, Tecnologia), direcionando o artigo aos leitores certos."} />
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-[#475569] dark:text-slate-400 mb-1.5 font-medium flex items-center">
                <span>{t("nexus.fieldMainCategory") || "Categoria Principal"}</span>
                <FieldHelp text={t("nexus.helpCategory") || "Grande área do saber em que a publicação se insere."} />
              </label>
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                className="w-full p-3 rounded-xl bg-[#F4F7FA] dark:bg-[#0B132B] border border-[#DCE3EA] dark:border-[#1E2D5A] text-xs sm:text-sm text-[#14283F] dark:text-white outline-none focus:border-[#087E8B] cursor-pointer"
              >
                {[
                  "Ciência e tecnologia",
                  "Psicologia e comportamento humano",
                  "Saúde e biologia",
                  "Vida pessoal",
                  "Relacionamentos",
                  "Vida profissional",
                  "História e cultura",
                  "Sociedade e comunidades",
                  "Educação e aprendizagem",
                  "Filosofia",
                  "Economia e finanças",
                  "Ambiente e natureza",
                  "Outras áreas do conhecimento",
                ].map((c) => (
                  <option key={c} value={c} className="bg-white dark:bg-slate-900 text-[#14283F] dark:text-white">
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-[#475569] dark:text-slate-400 mb-1.5 font-medium flex items-center">
                <span>{t("nexus.fieldSubcategory") || "Subcategoria (Opcional)"}</span>
                <FieldHelp text={t("nexus.helpSubcategory") || "Permite especificar o nicho, ramo ou disciplina exata (ex.: Neurociência, Inteligência Artificial), refinando a busca no feed."} />
              </label>
              <input
                type="text"
                placeholder="Ex: Neurociência, Inteligência Artificial, Liderança..."
                value={subcategoria}
                onChange={(e) => setSubcategoria(e.target.value)}
                className="w-full p-3 rounded-xl bg-[#F4F7FA] dark:bg-[#0B132B] border border-[#DCE3EA] dark:border-[#1E2D5A] text-xs sm:text-sm text-[#14283F] dark:text-white placeholder-[#475569]/70 dark:placeholder-slate-400 outline-none focus:border-[#087E8B]"
              />
            </div>
          </div>
        </div>

        {/* B. TIPO DE INFORMAÇÃO */}
        <div className="space-y-3 pb-6 border-b border-[#DCE3EA] dark:border-[#1E2D5A]">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-md bg-[#14283F]/10 dark:bg-teal-500/20 text-[#14283F] dark:text-teal-300 border border-[#14283F]/20 dark:border-teal-500/30 flex items-center justify-center font-bold text-xs">
              B
            </span>
            <label className="text-sm font-semibold text-[#14283F] dark:text-white flex items-center">
              <span>{t("nexus.fieldType") || "Tipo de Informação"} *</span>
              <FieldHelp text={t("nexus.helpType") || "Define o rigor metodológico e a natureza do conteúdo (ex.: Artigo Científico com fontes, Experiência Pessoal ou Análise Técnica)."} />
            </label>
          </div>
          <p className="text-xs text-[#475569] dark:text-slate-400">
            Define o nível de rigor e o enquadramento metodológico da publicação.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            {[
              { id: "cientifico", label: t("nexus.typeScientific") || "Artigo Científico", desc: "Baseado em estudos e evidências verificáveis com fontes." },
              { id: "curiosidade", label: t("nexus.typeCuriosity") || "Curiosidade Fundamentada", desc: "Fato fundamentado e de interesse cognitivo geral." },
              { id: "experiencia", label: t("nexus.typeExperience") || "Experiência Pessoal", desc: "Relato individual sem presunção de universalidade." },
              { id: "opiniao", label: t("nexus.typeOpinion") || "Opinião Fundamentada", desc: "Análise crítica pessoal com argumentos claros." },
              { id: "analise", label: t("nexus.typeAnalysis") || "Análise Técnica", desc: "Exame aprofundado de sistemas, processos ou dados." },
            ].map((item) => (
              <div
                key={item.id}
                onClick={() => setTipoInformacao(item.id as any)}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all space-y-1 ${
                  tipoInformacao === item.id
                    ? "bg-[#087E8B]/10 border-[#087E8B] text-[#14283F] dark:text-white shadow-xs"
                    : "bg-[#F4F7FA] dark:bg-[#0B132B] border-[#DCE3EA] dark:border-[#1E2D5A] text-[#475569] dark:text-slate-300 hover:border-slate-400"
                }`}
              >
                <span className="font-semibold text-xs block text-[#14283F] dark:text-white">{item.label}</span>
                <span className="text-[11px] text-[#475569] dark:text-slate-400 block leading-tight">{item.desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* C. TÍTULO */}
        <div className="space-y-2 pb-6 border-b border-[#DCE3EA] dark:border-[#1E2D5A]">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-md bg-[#14283F]/10 dark:bg-teal-500/20 text-[#14283F] dark:text-teal-300 border border-[#14283F]/20 dark:border-teal-500/30 flex items-center justify-center font-bold text-xs">
              C
            </span>
            <label className="text-sm font-semibold text-[#14283F] dark:text-white flex items-center">
              <span>{t("nexus.fieldTitle") || "Título da Publicação"} *</span>
              <FieldHelp text={t("nexus.helpTitle") || "O cabeçalho principal do artigo. Deve ser direto, rigoroso e refletir o conteúdo sem títulos enganadores ou sensacionalismo."} />
            </label>
          </div>
          <input
            type="text"
            required
            placeholder="Digite um título claro, objetivo e informativo..."
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            className="w-full p-3.5 rounded-xl bg-[#F4F7FA] dark:bg-[#0B132B] border border-[#DCE3EA] dark:border-[#1E2D5A] text-sm sm:text-base text-[#14283F] dark:text-white placeholder-[#475569]/70 dark:placeholder-slate-400 outline-none focus:border-[#087E8B]"
          />
        </div>

        {/* D. DESCRIÇÃO EM MARKDOWN */}
        <div className="space-y-3 pb-6 border-b border-[#DCE3EA] dark:border-[#1E2D5A]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-[#14283F]/10 dark:bg-teal-500/20 text-[#14283F] dark:text-teal-300 border border-[#14283F]/20 dark:border-teal-500/30 flex items-center justify-center font-bold text-xs">
                D
              </span>
              <label className="text-sm font-semibold text-[#14283F] dark:text-white flex items-center gap-1.5 flex-wrap">
                <span>{t("nexus.fieldMarkdown") || "Conteúdo em Markdown"} *</span>
                <FieldHelp text={t("nexus.helpMarkdown") || "O corpo completo do artigo com suporte a formatação rica em Markdown (#, **, listas, tabelas e código). É obrigatório antes de adicionar anexos."} />
                {statsLeitura.words > 0 && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-[#087E8B]/10 text-[#087E8B] dark:text-teal-300 border border-[#087E8B]/20 ml-1">
                    <Clock className="w-3 h-3" />
                    <span>~{customReadTime ? customReadTime : statsLeitura.minutes} min ({statsLeitura.words} palavras)</span>
                  </span>
                )}
              </label>
            </div>

            <div className="flex items-center gap-1.5 p-1 bg-[#F4F7FA] dark:bg-[#0B132B] border border-[#DCE3EA] dark:border-[#1E2D5A] rounded-lg text-xs">
              <button
                type="button"
                onClick={() => setIsPreviewMode(false)}
                className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                  !isPreviewMode ? "bg-[#087E8B] text-white shadow-xs" : "text-[#475569] dark:text-slate-400 hover:text-[#14283F] dark:hover:text-white"
                }`}
              >
                {t("nexus.editorTab") || "Editor"}
              </button>
              <button
                type="button"
                onClick={() => setIsPreviewMode(true)}
                className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                  isPreviewMode ? "bg-[#087E8B] text-white shadow-xs" : "text-[#475569] dark:text-slate-400 hover:text-[#14283F] dark:hover:text-white"
                }`}
              >
                {t("nexus.previewTab") || "Pré-visualização"}
              </button>
            </div>
          </div>

          {!isPreviewMode ? (
            <textarea
              required
              rows={10}
              placeholder="Escreva a descrição do seu artigo utilizando títulos (#), parágrafos, listas (- item), tabelas ou blocos de código (```)..."
              value={descricaoMarkdown}
              onChange={(e) => setDescricaoMarkdown(e.target.value)}
              className="w-full p-4 rounded-xl bg-[#F4F7FA] dark:bg-[#0B132B] border border-[#DCE3EA] dark:border-[#1E2D5A] text-sm text-[#14283F] dark:text-white placeholder-[#475569]/70 dark:placeholder-slate-400 font-technical outline-none focus:border-[#087E8B] resize-y"
            />
          ) : (
            <div className="p-6 rounded-xl bg-[#F4F7FA] dark:bg-[#0B132B] border border-[#DCE3EA] dark:border-[#1E2D5A] min-h-[240px]">
              {descricaoMarkdown.trim() ? (
                <MarkdownRenderer content={descricaoMarkdown} />
              ) : (
                <span className="text-[#475569] dark:text-slate-500 italic font-interface">Nenhum texto preenchido para pré-visualizar.</span>
              )}
            </div>
          )}

          {/* ESTATÍSTICA E AJUSTE DE TEMPO DE LEITURA */}
          <div className="flex items-center justify-between gap-3 flex-wrap text-xs text-[#475569] dark:text-slate-400 font-interface pt-1">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#087E8B] dark:text-teal-400 shrink-0" />
              <span>
                Tempo de leitura estimado: <strong>~{statsLeitura.minutes} min</strong>{" "}
                <span className="opacity-70">({statsLeitura.words} palavras reais a 220 ppm)</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="custom-read-time" className="text-[11px] text-[#475569] dark:text-slate-400">
                Ajustar minutos (opcional):
              </label>
              <input
                id="custom-read-time"
                type="number"
                min={1}
                max={180}
                placeholder={String(statsLeitura.minutes)}
                value={customReadTime}
                onChange={(e) => setCustomReadTime(e.target.value)}
                className="w-16 px-2 py-1 rounded-lg bg-white dark:bg-[#111D3D] border border-[#DCE3EA] dark:border-[#1E2D5A] text-xs text-center text-[#14283F] dark:text-white outline-none focus:border-[#087E8B]"
              />
              <span className="text-[11px]">min</span>
            </div>
          </div>
        </div>

        {/* E, F, G: ANEXOS (CONDICIONAIS) */}
        <div className="space-y-4 pb-6 border-b border-[#DCE3EA] dark:border-[#1E2D5A]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-[#14283F]/10 dark:bg-teal-500/20 text-[#14283F] dark:text-teal-300 border border-[#14283F]/20 dark:border-teal-500/30 flex items-center justify-center font-bold text-xs">
                E-G
              </span>
              <label className="text-sm font-semibold text-[#14283F] dark:text-white flex items-center">
                <span>{t("nexus.fieldAttachments") || "Anexos Multimédia e Ligações"}</span>
                <FieldHelp text={t("nexus.helpAttachments") || "Recursos complementares como imagens de capa, vídeos ou links de repositórios para enriquecer a publicação."} />
              </label>
            </div>

            {!isAttachmentsEnabled && (
              <span className="text-[11px] font-semibold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 px-2 py-0.5 rounded flex items-center gap-1">
                <Lock className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                {t("nexus.attachmentsDisabled") || "Desativados (preencha a descrição primeiro)"}
              </span>
            )}
          </div>

          <div
            className={`space-y-4 transition-opacity ${
              isAttachmentsEnabled ? "opacity-100" : "opacity-40 pointer-events-none select-none"
            }`}
          >
            {/* E. Imagem */}
            <div>
              <label className="text-xs text-[#14283F] dark:text-slate-300 mb-1 font-semibold flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-[#087E8B] dark:text-teal-400" />
                <span>E. {t("nexus.fieldImage") || "URL de Imagem de Capa"}</span>
                <FieldHelp text={t("nexus.helpImage") || "URL segura HTTPS para a imagem de capa que será exibida no cabeçalho do artigo e nos cartões de visualização do feed."} />
              </label>
              <input
                type="url"
                disabled={!isAttachmentsEnabled}
                placeholder="https://exemplo.com/imagem.jpg"
                value={imagemUrl}
                onChange={(e) => setImagemUrl(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-[#F4F7FA] dark:bg-[#0B132B] border border-[#DCE3EA] dark:border-[#1E2D5A] text-xs sm:text-sm text-[#14283F] dark:text-white placeholder-[#475569]/70 dark:placeholder-slate-400 outline-none focus:border-[#087E8B]"
              />
            </div>

            {/* F. Vídeo (<= 100 MiB) */}
            <div>
              <label className="text-xs text-[#14283F] dark:text-slate-300 mb-1 font-semibold flex items-center gap-1.5">
                <Video className="w-3.5 h-3.5 text-[#087E8B] dark:text-teal-400" />
                <span>F. {t("nexus.fieldVideo") || "Ficheiro de Vídeo (Máximo: 100 MiB)"}</span>
                <FieldHelp text={t("nexus.helpVideo") || "Vídeo demonstrativo ou explicativo complementar (MP4 ou WebM, até 100 MiB) diretamente integrado no artigo."} />
              </label>
              <input
                type="file"
                accept="video/mp4,video/webm"
                disabled={!isAttachmentsEnabled}
                onChange={handleVideoChange}
                className="w-full p-2 rounded-xl bg-[#F4F7FA] dark:bg-[#0B132B] border border-[#DCE3EA] dark:border-[#1E2D5A] text-xs text-[#475569] dark:text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#087E8B] file:text-white cursor-pointer"
              />
              {videoError && <p className="text-xs text-red-600 dark:text-red-400 mt-1">{videoError}</p>}
            </div>

            {/* G. URL Externa */}
            <div>
              <label className="text-xs text-[#14283F] dark:text-slate-300 mb-1 font-semibold flex items-center gap-1.5">
                <Link2 className="w-3.5 h-3.5 text-[#087E8B] dark:text-teal-400" />
                <span>G. {t("nexus.fieldUrl") || "Ligação Externa Segura"}</span>
                <FieldHelp text={t("nexus.helpUrl") || "Hiperligação externa de referência confiável (repositório académico, GitHub, artigo na íntegra ou documentação oficial)."} />
              </label>
              <input
                type="url"
                disabled={!isAttachmentsEnabled}
                placeholder="https://repositorio.academico.org/artigo"
                value={urlExterna}
                onChange={(e) => handleUrlChange(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-[#F4F7FA] dark:bg-[#0B132B] border border-[#DCE3EA] dark:border-[#1E2D5A] text-xs sm:text-sm text-[#14283F] dark:text-white placeholder-[#475569]/70 dark:placeholder-slate-400 outline-none focus:border-[#087E8B]"
              />
              {urlError && <p className="text-xs text-red-600 dark:text-red-400 mt-1">{urlError}</p>}
            </div>
          </div>
        </div>

        {/* H, I, J: METADADOS E CLASSIFICAÇÃO */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pb-6 border-b border-[#DCE3EA] dark:border-[#1E2D5A] text-xs">
          <div>
            <label className="text-[#14283F] dark:text-slate-300 font-semibold mb-1 flex items-center">
              <span>H. {t("nexus.fieldMentions") || "Menções a Pessoas"}</span>
              <FieldHelp text={t("nexus.helpMentions") || "Permite citar e creditar colaboradores, investigadores ou especialistas mencionados no estudo ou relato."} />
            </label>
            <input
              type="text"
              placeholder="Ex: Dr. Silva, Autora Maria..."
              value={referenciaPessoas}
              onChange={(e) => setReferenciaPessoas(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-[#F4F7FA] dark:bg-[#0B132B] border border-[#DCE3EA] dark:border-[#1E2D5A] text-[#14283F] dark:text-white placeholder-[#475569]/70 dark:placeholder-slate-400 outline-none focus:border-[#087E8B]"
            />
          </div>

          <div>
            <label className="text-[#14283F] dark:text-slate-300 font-semibold mb-1 flex items-center">
              <span>I. {t("nexus.fieldMinAge") || "Idade Mínima"} *</span>
              <FieldHelp text={t("nexus.helpMinAge") || "Classificação indicativa etária recomendada (Todas as idades, 13+, 16+ ou 18+) para temas que possam exigir maturidade."} />
            </label>
            <select
              value={idadeMinima}
              onChange={(e) => setIdadeMinima(e.target.value as any)}
              className="w-full p-2.5 rounded-xl bg-[#F4F7FA] dark:bg-[#0B132B] border border-[#DCE3EA] dark:border-[#1E2D5A] text-[#14283F] dark:text-white outline-none focus:border-[#087E8B] cursor-pointer"
            >
              <option value="all">{t("nexus.allAges") || "Todas as idades"}</option>
              <option value="13+">13+</option>
              <option value="16+">16+</option>
              <option value="18+">18+</option>
            </select>
          </div>

          <div>
            <label className="text-[#14283F] dark:text-slate-300 font-semibold mb-1 flex items-center">
              <span>J. {t("nexus.fieldTags") || "Tags (separadas por vírgula)"}</span>
              <FieldHelp text={t("nexus.helpTags") || "Palavras-chave essenciais que facilitam a indexação, filtros por tópicos e recomendações personalizadas no feed."} />
            </label>
            <input
              type="text"
              placeholder="Neurociência, Angola, Dados..."
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-[#F4F7FA] dark:bg-[#0B132B] border border-[#DCE3EA] dark:border-[#1E2D5A] text-[#14283F] dark:text-white placeholder-[#475569]/70 dark:placeholder-slate-400 outline-none focus:border-[#087E8B]"
            />
          </div>
        </div>

        {/* K. FONTES E REFERÊNCIAS CIENTÍFICAS */}
        <div className="space-y-3 pb-6 border-b border-[#DCE3EA] dark:border-[#1E2D5A]">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-md bg-[#14283F]/10 dark:bg-teal-500/20 text-[#14283F] dark:text-teal-300 border border-[#14283F]/20 dark:border-teal-500/30 flex items-center justify-center font-bold text-xs">
              K
            </span>
            <label className="text-sm font-semibold text-[#14283F] dark:text-white flex items-center">
              <span>{t("nexus.fieldSources") || "Fontes e Referências Bibliográficas"}</span>
              <FieldHelp text={t("nexus.helpSources") || "Registo formal da bibliografia utilizada. Obrigatório para artigos científicos obterem o selo de verificação de autenticidade."} />
            </label>
          </div>
          <p className="text-xs text-[#475569] dark:text-slate-400">
            {t("nexus.sourcesNotice") || "Obrigatório para artigos do tipo Científico para obtenção do selo de verificação."}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="text-[#14283F] dark:text-slate-300 font-semibold mb-1 flex items-center justify-between">
                <span>{t("nexus.sourceTitleLabel") || "Título da Fonte"}</span>
                <FieldHelp text={t("nexus.helpSourceTitle") || "Título oficial do estudo, livro, relatório ou artigo científico consultado."} />
              </label>
              <input
                type="text"
                placeholder="Título da investigação ou artigo original"
                value={fonteTitulo}
                onChange={(e) => setFonteTitulo(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-[#F4F7FA] dark:bg-[#0B132B] border border-[#DCE3EA] dark:border-[#1E2D5A] text-[#14283F] dark:text-white placeholder-[#475569]/70 dark:placeholder-slate-400 outline-none focus:border-[#087E8B]"
              />
            </div>

            <div>
              <label className="text-[#14283F] dark:text-slate-300 font-semibold mb-1 flex items-center justify-between">
                <span>{t("nexus.sourceAuthorsLabel") || "Autores"}</span>
                <FieldHelp text={t("nexus.helpSourceAuthors") || "Nome dos autores, cientistas ou equipa responsável pela investigação citada."} />
              </label>
              <input
                type="text"
                placeholder="Autores (ex: Silva, A. & Santos, M.)"
                value={fonteAutores}
                onChange={(e) => setFonteAutores(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-[#F4F7FA] dark:bg-[#0B132B] border border-[#DCE3EA] dark:border-[#1E2D5A] text-[#14283F] dark:text-white placeholder-[#475569]/70 dark:placeholder-slate-400 outline-none focus:border-[#087E8B]"
              />
            </div>

            <div>
              <label className="text-[#14283F] dark:text-slate-300 font-semibold mb-1 flex items-center justify-between">
                <span>{t("nexus.sourceYearLabel") || "Ano de Publicação"}</span>
                <FieldHelp text={t("nexus.helpSourceYear") || "Ano em que a fonte bibliográfica foi publicada originalmente."} />
              </label>
              <input
                type="number"
                placeholder="Ano de publicação"
                value={fonteAno}
                onChange={(e) => setFonteAno(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-[#F4F7FA] dark:bg-[#0B132B] border border-[#DCE3EA] dark:border-[#1E2D5A] text-[#14283F] dark:text-white placeholder-[#475569]/70 dark:placeholder-slate-400 outline-none focus:border-[#087E8B]"
              />
            </div>

            <div>
              <label className="text-[#14283F] dark:text-slate-300 font-semibold mb-1 flex items-center justify-between">
                <span>{t("nexus.sourceDoiLabel") || "DOI / Link de Verificação"}</span>
                <FieldHelp text={t("nexus.helpSourceDoi") || "Identificador DOI (ex.: 10.1038/...) ou hiperligação académica direta para verificação imediata da fonte."} />
              </label>
              <input
                type="text"
                placeholder="DOI ou link de verificação (ex: 10.1038/...)"
                value={fonteDoi}
                onChange={(e) => setFonteDoi(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-[#F4F7FA] dark:bg-[#0B132B] border border-[#DCE3EA] dark:border-[#1E2D5A] text-[#14283F] dark:text-white placeholder-[#475569]/70 dark:placeholder-slate-400 outline-none focus:border-[#087E8B]"
              />
            </div>
          </div>
        </div>

        {/* SUBMISSÃO */}
        <div className="flex items-center justify-between pt-2 flex-wrap gap-4">
          <span className="text-xs text-[#475569] dark:text-slate-400">
            A publicação será associada ao utilizador <strong className="text-[#14283F] dark:text-white">{user?.nome || user?.email || "Visitante"}</strong>.
          </span>

          <button
            type="submit"
            disabled={isSubmitting || !titulo.trim() || !descricaoMarkdown.trim()}
            className="px-6 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-[#087E8B] hover:bg-[#066570] text-white shadow-xs transition-colors active:scale-95 disabled:opacity-40 disabled:pointer-events-none flex items-center gap-2 cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>{isSubmitting ? (t("nexus.publishing") || "A publicar...") : (t("nexus.btnPublish") || "Publicar no Nexus")}</span>
          </button>
        </div>
      </form>
    </div>
  );
}

"use client";

import React, { useState, useMemo, useCallback, useEffect } from "react";
import Link from "next/link";
import {
  Search,
  Filter,
  PlusCircle,
  Sparkles,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  X,
  RefreshCw,
  Radio,
  BookOpen,
} from "lucide-react";
import { INITIAL_ARTICLES } from "./components/mockArticles";
import { ArticleCard } from "./components/ArticleCard";
import { Article } from "./components/types";
import { useSession } from "@/context/SessionContext";
import { useI18n } from "@/context/I18nContext";
import { getPosts, subscribeToFeedSSE, toggleSave } from "./services/nexusApi";
import { useNexusAuth } from "./components/NexusAuthContext";

const ITEMS_PER_PAGE = 4;

const DEFAULT_CATEGORIES = [
  "Ciência e tecnologia",
  "Saúde e biologia",
  "Psicologia e comportamento",
  "História e sociedade",
  "Filosofia e pensamento",
];

export default function NexusFeedPage() {
  const { isAuthenticated } = useSession();
  const { t } = useI18n();
  const { requireAuth, openLoginModal } = useNexusAuth();

  // Estados de dados consumidos do backend
  const [articles, setArticles] = useState<Article[]>(INITIAL_ARTICLES);
  const [totalCount, setTotalCount] = useState<number>(INITIAL_ARTICLES.length);
  const [totalPages, setTotalPages] = useState<number>(Math.ceil(INITIAL_ARTICLES.length / ITEMS_PER_PAGE));
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [newPostNotification, setNewPostNotification] = useState<{ title: string; id: string } | null>(null);

  // Estados de filtros e paginação
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [onlyVerified, setOnlyVerified] = useState(false);
  const [sortBy, setSortBy] = useState<"recent" | "views" | "bookmarks">("recent");
  const [currentPage, setCurrentPage] = useState(1);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set(["art-1"]));

  // Debounce de pesquisa para evitar requisições excessivas
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Consumir artigos do backend com todos os parâmetros de filtro e paginação
  const loadFeed = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await getPosts({
        page: currentPage,
        size: ITEMS_PER_PAGE,
        search: debouncedSearch.trim() || undefined,
        category: selectedCategory !== "all" ? selectedCategory : undefined,
        content_type: selectedType !== "all" ? selectedType : undefined,
        only_verified: onlyVerified || undefined,
        sort_by: sortBy,
      });

      if (res && Array.isArray(res.items)) {
        setArticles(res.items);
        setTotalCount(res.total ?? res.items.length);
        setTotalPages(res.pages ?? Math.max(1, Math.ceil((res.total || res.items.length) / ITEMS_PER_PAGE)));

        const saved = new Set<string>();
        res.items.forEach((item) => {
          if (item.is_saved) saved.add(item.id);
        });
        if (saved.size > 0) {
          setBookmarkedIds((prev) => new Set([...Array.from(prev), ...Array.from(saved)]));
        }
      }
    } catch (err) {
      console.warn("Falha ao consumir artigos do backend:", err);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, debouncedSearch, selectedCategory, selectedType, onlyVerified, sortBy]);

  // Disparar busca ao alterar filtros ou página
  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  // Subscrever ao SSE para notificações em tempo real de novos posts
  useEffect(() => {
    const sse = subscribeToFeedSSE((data) => {
      if (data && data.title) {
        setNewPostNotification({
          title: data.title,
          id: String(data.id),
        });
      }
    });

    return () => {
      sse?.close();
    };
  }, []);

  // Alternar favorito integrado com backend (exige login)
  const toggleBookmark = useCallback((id: string) => {
    requireAuth(async () => {
      setBookmarkedIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });

      try {
        const res = await toggleSave(id);
        setArticles((prev) =>
          (prev || []).map((a) => {
            if (a.id === id) {
              return {
                ...a,
                metrics: {
                  ...a.metrics,
                  bookmarks: res.bookmarks_count,
                },
                is_saved: res.saved,
              };
            }
            return a;
          })
        );
      } catch (err) {
        console.error("Erro ao alternar favorito:", err);
      }
    });
  }, [requireAuth]);

  // Lista de categorias únicas extraídas dos artigos + padrão
  const categories = useMemo(() => {
    const set = new Set<string>(DEFAULT_CATEGORIES);
    (articles || []).forEach((a) => {
      if (a.category) set.add(a.category);
    });
    INITIAL_ARTICLES.forEach((a) => {
      if (a.category) set.add(a.category);
    });
    return ["all", ...Array.from(set)];
  }, [articles]);

  // Tipos de conteúdo disponíveis para filtro
  const contentTypes = useMemo(
    () => [
      { id: "all", label: t("nexus.allTypes") || "Todos os Tipos" },
      { id: "cientifico", label: t("nexus.typeScientific") || "🔬 Científico" },
      { id: "curiosidade", label: t("nexus.typeCuriosity") || "💡 Curiosidade" },
      { id: "experiencia", label: t("nexus.typeExperience") || "👤 Experiência" },
      { id: "opiniao", label: t("nexus.typeOpinion") || "💭 Opinião" },
      { id: "analise", label: t("nexus.typeAnalysis") || "📊 Análise" },
    ],
    [t]
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const clearAllFilters = () => {
    setSearchQuery("");
    setDebouncedSearch("");
    setSelectedType("all");
    setSelectedCategory("all");
    setOnlyVerified(false);
    setSortBy("recent");
    setCurrentPage(1);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-8 font-interface">
      {/* ======================================================== */}
      {/* NOTIFICAÇÃO EM TEMPO REAL VIA SSE                        */}
      {/* ======================================================== */}
      {newPostNotification && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-[#087E8B]/15 via-teal-500/10 to-[#14283F]/10 border border-[#087E8B]/30 flex items-center justify-between gap-4 animate-in fade-in slide-in-from-top-3 shadow-xs">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-xl bg-[#087E8B] text-white flex items-center justify-center shrink-0">
              <Radio className="w-4 h-4 animate-pulse" />
            </span>
            <div>
              <span className="text-xs font-semibold text-[#087E8B] dark:text-teal-400 uppercase tracking-wider block">
                {t("nexus.liveUpdate") || "Atualização em tempo real"}
              </span>
              <p className="text-sm font-medium text-[#14283F] dark:text-white">
                Nova publicação: <strong>{newPostNotification.title}</strong>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setCurrentPage(1);
                loadFeed();
                setNewPostNotification(null);
              }}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#087E8B] text-white hover:bg-[#066570] transition-colors cursor-pointer shadow-xs"
            >
              {t("nexus.refreshFeed") || "Atualizar Feed"}
            </button>
            <button
              onClick={() => setNewPostNotification(null)}
              className="text-[#475569] dark:text-slate-400 hover:text-[#14283F] p-1.5 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* HEADER DA PÁGINA DO FEED COM SEARCH E FILTROS            */}
      {/* ======================================================== */}
      <section className="bg-white dark:bg-[#111D3D] border border-[#DCE3EA] dark:border-[#1E2D5A] rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-[#087E8B]/10 text-[#087E8B] dark:text-teal-400 border border-[#087E8B]/20">
              <Sparkles className="w-3.5 h-3.5 text-[#087E8B] dark:text-teal-400" />
              <span>{t("nexus.heroBadge") || "Exploração de Conhecimento Colaborativo"}</span>
            </div>
            <h1 className="font-editorial text-2xl sm:text-4xl font-bold text-[#14283F] dark:text-white tracking-tight">
              {t("nexus.feedTitle") || "Feed de Publicações e Pesquisas"}
            </h1>
            <p className="text-sm text-[#475569] dark:text-slate-300 max-w-2xl leading-relaxed">
              {t("nexus.feedDesc") || "Descubra estudos científicos revisados, curiosidades fundamentadas e experiências compartilhadas com rigor metodológico."}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={loadFeed}
              disabled={isLoading}
              title={t("nexus.reload") || "Recarregar publicações"}
              className="p-2.5 rounded-xl border border-[#DCE3EA] dark:border-[#1E2D5A] bg-[#F4F7FA] dark:bg-[#0B132B] hover:bg-slate-200 dark:hover:bg-slate-800 text-[#475569] dark:text-slate-300 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-[#087E8B]" : ""}`} />
            </button>

            <Link
              href="/nexus-cognitiva/publicar"
              onClick={(e) => {
                if (!isAuthenticated) {
                  e.preventDefault();
                  openLoginModal("/nexus-cognitiva/publicar");
                }
              }}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-[#087E8B] hover:bg-[#066570] text-white shadow-xs transition-colors active:scale-95 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{t("nexus.publishArticle") || "Publicar Artigo"}</span>
            </Link>
          </div>
        </div>

        {/* BARRA DE PESQUISA PRINCIPAL */}
        <div className="relative">
          <Search className="w-5 h-5 text-[#475569] dark:text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder={t("nexus.searchPlaceholder") || "Pesquisar por título, resumo, autor, tag ou área do saber..."}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-12 pr-12 py-3 rounded-xl bg-[#F4F7FA] dark:bg-[#0B132B] border border-[#DCE3EA] dark:border-[#1E2D5A] focus:border-[#087E8B] focus:ring-1 focus:ring-[#087E8B] text-sm text-[#14283F] dark:text-white placeholder-[#475569]/70 dark:placeholder-slate-400 outline-none transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery("");
                setDebouncedSearch("");
                setCurrentPage(1);
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[#475569] hover:text-[#14283F] dark:hover:text-white p-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* LINHA DE FILTROS COMBINADOS */}
        <div className="space-y-4 pt-3 border-t border-[#DCE3EA] dark:border-[#1E2D5A]">
          {/* TABS DE TIPO DE CONTEÚDO */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
            <span className="text-xs font-semibold text-[#475569] dark:text-slate-400 shrink-0 mr-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" />
              {t("nexus.filterType") || "Tipo:"}
            </span>
            {contentTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => {
                  setSelectedType(type.id);
                  setCurrentPage(1);
                }}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  selectedType === type.id
                    ? "bg-[#087E8B] text-white shadow-xs"
                    : "bg-[#F4F7FA] dark:bg-[#0B132B] text-[#475569] dark:text-slate-300 hover:text-[#14283F] dark:hover:text-white border border-[#DCE3EA] dark:border-[#1E2D5A]"
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>

          {/* CONTROLES SECUNDÁRIOS: CATEGORIA, VERIFICADOS E ORDENAÇÃO */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-3">
              {/* SELECT DE CATEGORIA */}
              <div className="flex items-center gap-2 bg-[#F4F7FA] dark:bg-[#0B132B] px-3 py-2 rounded-lg border border-[#DCE3EA] dark:border-[#1E2D5A]">
                <span className="text-[#475569] dark:text-slate-400 font-semibold">{t("nexus.category") || "Categoria:"}</span>
                <select
                  value={selectedCategory}
                  onChange={(e) => {
                    setSelectedCategory(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="bg-transparent text-[#14283F] dark:text-white font-medium outline-none cursor-pointer"
                >
                  <option value="all" className="bg-white dark:bg-slate-900 text-[#14283F] dark:text-white">
                    {t("nexus.allCategories") || "Todas as Categorias"}
                  </option>
                  {categories.filter((c) => c !== "all").map((cat) => (
                    <option key={cat} value={cat} className="bg-white dark:bg-slate-900 text-[#14283F] dark:text-white">
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* TOGGLE APENAS VERIFICADOS */}
              <label className="flex items-center gap-2 bg-[#F4F7FA] dark:bg-[#0B132B] px-3 py-2 rounded-lg border border-[#DCE3EA] dark:border-[#1E2D5A] cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={onlyVerified}
                  onChange={(e) => {
                    setOnlyVerified(e.target.checked);
                    setCurrentPage(1);
                  }}
                  className="w-4 h-4 rounded border-slate-300 text-[#087E8B] focus:ring-[#087E8B]"
                />
                <span className="text-[#14283F] dark:text-slate-200 font-medium flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#087E8B] dark:text-teal-400" />
                  {t("nexus.onlyVerified") || "Apenas com fontes verificadas"}
                </span>
              </label>
            </div>

            {/* ORDENAÇÃO */}
            <div className="flex items-center gap-2 bg-[#F4F7FA] dark:bg-[#0B132B] px-3 py-2 rounded-lg border border-[#DCE3EA] dark:border-[#1E2D5A]">
              <span className="text-[#475569] dark:text-slate-400 font-semibold">{t("nexus.sort") || "Ordenar:"}</span>
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value as any);
                  setCurrentPage(1);
                }}
                className="bg-transparent text-[#14283F] dark:text-white font-medium outline-none cursor-pointer"
              >
                <option value="recent" className="bg-white dark:bg-slate-900 text-[#14283F] dark:text-white">{t("nexus.sortRecent") || "Mais Recentes"}</option>
                <option value="views" className="bg-white dark:bg-slate-900 text-[#14283F] dark:text-white">{t("nexus.sortViews") || "Mais Lidos"}</option>
                <option value="bookmarks" className="bg-white dark:bg-slate-900 text-[#14283F] dark:text-white">{t("nexus.sortBookmarks") || "Mais Guardados"}</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* BARRA DE RESULTADOS ENCONTRADOS E RESET                  */}
      {/* ======================================================== */}
      <div className="flex items-center justify-between text-xs text-[#475569] dark:text-slate-400 px-1">
        <div>
          {t("nexus.showing") || "Exibindo"} <strong className="text-[#14283F] dark:text-white font-semibold">{totalCount}</strong> {t("nexus.publicationsFound") || "publicações encontradas"}
          {(debouncedSearch || selectedType !== "all" || selectedCategory !== "all" || onlyVerified) && (
            <span> {t("nexus.withActiveFilters") || "com filtros ativos"}</span>
          )}
        </div>

        {(debouncedSearch || selectedType !== "all" || selectedCategory !== "all" || onlyVerified) && (
          <button
            onClick={clearAllFilters}
            className="text-[#087E8B] dark:text-teal-400 hover:underline font-semibold cursor-pointer"
          >
            {t("nexus.clearAllFilters") || "Limpar todos os filtros"}
          </button>
        )}
      </div>

      {/* ======================================================== */}
      {/* GRID DE ARTIGOS (CONSUMO DO BACKEND)                     */}
      {/* ======================================================== */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => (
            <div
              key={i}
              className="bg-white dark:bg-[#111D3D] border border-[#DCE3EA] dark:border-[#1E2D5A] rounded-xl p-6 space-y-4 animate-pulse shadow-xs"
            >
              <div className="h-44 bg-slate-200 dark:bg-slate-800 rounded-lg" />
              <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/3" />
              <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-4/5" />
              <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-full" />
              <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : articles && articles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {articles.map((article) => (
            <ArticleCard
              key={article.id}
              article={article}
              isBookmarked={bookmarkedIds.has(article.id)}
              onBookmarkToggle={toggleBookmark}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white dark:bg-[#111D3D] border border-[#DCE3EA] dark:border-[#1E2D5A] rounded-2xl p-8 space-y-4 shadow-xs">
          <div className="w-12 h-12 rounded-xl bg-[#087E8B]/10 text-[#087E8B] dark:text-teal-400 border border-[#087E8B]/20 flex items-center justify-center mx-auto">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="font-editorial text-lg font-bold text-[#14283F] dark:text-white">
            {t("nexus.noArticlesFound") || "Nenhum artigo encontrado"}
          </h3>
          <p className="text-xs sm:text-sm text-[#475569] dark:text-slate-300 max-w-sm mx-auto leading-relaxed">
            {t("nexus.noArticlesDesc") || "Não encontramos publicações que correspondam aos filtros selecionados. Experimente ajustar a busca ou limpar os filtros."}
          </p>
          <button
            onClick={clearAllFilters}
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#14283F] text-white hover:bg-[#14283F]/90 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            {t("nexus.resetFilters") || "Redefinir filtros"}
          </button>
        </div>
      )}

      {/* ======================================================== */}
      {/* PAGINAÇÃO CONTROLADA PELO BACKEND                        */}
      {/* ======================================================== */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-[#DCE3EA] dark:border-[#1E2D5A]">
          <span className="text-xs text-[#475569] dark:text-slate-400">
            {t("nexus.page") || "Página"} <strong className="text-[#14283F] dark:text-white font-semibold">{currentPage}</strong> {t("nexus.of") || "de"} <strong className="text-[#14283F] dark:text-white font-semibold">{totalPages}</strong> ({t("nexus.total") || "Total:"} {totalCount})
          </span>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1 || isLoading}
              className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-semibold bg-white dark:bg-[#111D3D] border border-[#DCE3EA] dark:border-[#1E2D5A] hover:border-slate-400 dark:hover:border-slate-500 text-[#14283F] dark:text-slate-300 transition-all disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>{t("nexus.prev") || "Anterior"}</span>
            </button>

            {Array.from({ length: totalPages }).map((_, idx) => {
              const pageNumber = idx + 1;
              return (
                <button
                  key={pageNumber}
                  onClick={() => handlePageChange(pageNumber)}
                  disabled={isLoading}
                  className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    currentPage === pageNumber
                      ? "bg-[#087E8B] text-white shadow-xs"
                      : "bg-white dark:bg-[#111D3D] text-[#475569] dark:text-slate-300 hover:text-[#14283F] dark:hover:text-white border border-[#DCE3EA] dark:border-[#1E2D5A]"
                  }`}
                >
                  {pageNumber}
                </button>
              );
            })}

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages || isLoading}
              className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-semibold bg-white dark:bg-[#111D3D] border border-[#DCE3EA] dark:border-[#1E2D5A] hover:border-slate-400 dark:hover:border-slate-500 text-[#14283F] dark:text-slate-300 transition-all disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
            >
              <span>{t("nexus.next") || "Próxima"}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

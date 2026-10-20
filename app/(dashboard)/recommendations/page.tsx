"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Sparkles, RefreshCw, Video as VideoIcon, Youtube, Info, CheckCircle2, AlertTriangle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import SearchBar from "@/components/video/SearchBar";
import RecommendationFeed from "@/components/video/RecommendationFeed";
import { useI18n } from "@/context/I18nContext";
import {
  DEFAULT_RECOMMENDATIONS_LIMIT,
  DEFAULT_SEARCH_VIDEOS_LIMIT,
  RecommendationItem,
  VideoItem,
  getRecommendations,
  refreshRecommendations,
  searchVideos,
} from "@/lib/api/videos";

const TOAST_TIMEOUT = Number(process.env.NEXT_PUBLIC_TOAST_AUTO_DISMISS_MS) || 4500;

export default function RecommendationsPage() {
  const { t } = useI18n();
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([]);
  const [searchResults, setSearchResults] = useState<VideoItem[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  const showToast = (message: string, type: "success" | "error" | "info" = "info") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, TOAST_TIMEOUT);
  };

  // Carrega recomendações iniciais
  const loadRecommendations = useCallback(async (refresh: boolean = false) => {
    try {
      if (refresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      const data = refresh
        ? await refreshRecommendations(DEFAULT_RECOMMENDATIONS_LIMIT)
        : await getRecommendations(DEFAULT_RECOMMENDATIONS_LIMIT, false);

      setRecommendations(data);
      if (refresh) {
        showToast(t("recommendations_page.toastSuccess") || "Recomendações atualizadas com sucesso!", "success");
      }
    } catch (err: any) {
      const msg = err?.message || t("recommendations_page.toastError") || "Erro ao conectar com o serviço de recomendações.";
      setError(msg);
      showToast(msg, "error");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [t]);

  useEffect(() => {
    loadRecommendations(false);
  }, [loadRecommendations]);

  // Manipulador de Busca Debounced
  const handleSearch = async (query: string, categoryId?: string) => {
    const cleanQuery = query.trim();

    if (!cleanQuery) {
      setSearchResults(null);
      setIsSearching(false);
      return;
    }

    try {
      setIsSearching(true);
      const results = await searchVideos(cleanQuery, DEFAULT_SEARCH_VIDEOS_LIMIT, categoryId);
      setSearchResults(results);
    } catch (err: any) {
      showToast(err?.message || "Erro ao pesquisar vídeos no YouTube.", "error");
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="flex-1 w-full min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 p-4 sm:p-6 lg:p-8 transition-colors">
      {/* Toast de Notificação */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl backdrop-blur-md shadow-2xl border text-sm transition-all duration-300 animate-in slide-in-from-bottom-5 ${
            toast.type === "success"
              ? "bg-white/95 dark:bg-gray-900/95 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
              : toast.type === "error"
              ? "bg-white/95 dark:bg-gray-900/95 text-rose-600 dark:text-rose-400 border-rose-500/30"
              : "bg-white/95 dark:bg-gray-900/95 text-gray-900 dark:text-gray-100 border-gray-200 dark:border-gray-800"
          }`}
        >
          {toast.type === "success" && <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />}
          {toast.type === "error" && <AlertTriangle className="h-4 w-4 text-rose-500 shrink-0" />}
          {toast.type === "info" && <Info className="h-4 w-4 text-blue-500 shrink-0" />}
          <span className="font-medium">{toast.message}</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto flex flex-col gap-6">
        {/* Header no Padrão do Projeto MustaInf */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 sm:p-7 shadow-sm border border-gray-200/80 dark:border-gray-800 transition-colors">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/40">
                  <Youtube className="h-3.5 w-3.5" />
                  <span>YouTube Intelligence Engine</span>
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  {t("recommendations_page.badgeTech") || "Inteligência Artificial & Dados"}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
                {t("recommendations_page.title") || "Recomendador de Vídeos"}
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 max-w-2xl">
                {t("recommendations_page.subtitle") || "Conteúdos técnicos sugeridos com base no seu histórico e preferências de tecnologia."}
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => loadRecommendations(true)}
                disabled={isRefreshing || isLoading}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-100 border border-gray-200 dark:border-gray-700 shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-red-500/40"
                title="Recalcular recomendações"
              >
                <RefreshCw className={`h-4 w-4 text-red-500 ${isRefreshing ? "animate-spin" : ""}`} />
                <span>
                  {isRefreshing
                    ? t("recommendations_page.refreshing") || "A atualizar..."
                    : t("recommendations_page.refreshBtn") || "Atualizar Recomendações"}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* 🔍 Barra de Pesquisa com Debounce */}
        <div className="w-full">
          <SearchBar
            onSearch={handleSearch}
            isLoading={isSearching}
            placeholder={t("recommendations_page.searchPlaceholder") || "Buscar novos vídeos no YouTube para adicionar ao histórico..."}
          />
        </div>

        {/* Indicador de Modo de Busca */}
        {searchResults !== null && (
          <div className="flex items-center justify-between px-1">
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              {t("recommendations_page.searchResultsFor") || "Mostrando resultados da pesquisa"} ({searchResults.length} {t("recommendations_page.gamesFound") || "vídeos encontrados"})
            </p>
            <button
              onClick={() => setSearchResults(null)}
              className="text-xs text-red-600 dark:text-red-400 hover:underline font-medium"
            >
              {t("recommendations_page.clearSearch") || "Voltar às recomendações"}
            </button>
          </div>
        )}

        {/* 🎬 Feed de Vídeos */}
        <RecommendationFeed
          recommendations={recommendations}
          searchResults={searchResults || undefined}
          isLoading={isLoading}
          isRefreshing={isRefreshing}
          error={error}
          onRefresh={() => loadRecommendations(true)}
        />
      </div>
    </div>
  );
}


"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  RefreshCw,
  Sparkles,
  Youtube,
} from "lucide-react";
import SearchBar from "@/components/video/SearchBar";
import RecommendationFeed from "@/components/video/RecommendationFeed";
import { useI18n } from "@/context/I18nContext";
import {
  DEFAULT_RECOMMENDATIONS_LIMIT,
  DEFAULT_SEARCH_VIDEOS_LIMIT,
  type RecommendationItem,
  type VideoItem,
  getRecommendations,
  refreshRecommendations,
  searchVideos,
} from "@/lib/api/videos";

const TOAST_TIMEOUT =
  Number(process.env.NEXT_PUBLIC_TOAST_AUTO_DISMISS_MS) || 4500;

type ToastType = "success" | "error" | "info";
type ToastState = { message: string; type: ToastType } | null;

function getErrorMessage(error: unknown, fallback: string): string {
  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof error.message === "string" &&
    error.message.trim()
  ) {
    return error.message;
  }
  return fallback;
}

export default function RecommendationsPage() {
  const { t } = useI18n();

  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([]);
  const [searchResults, setSearchResults] = useState<VideoItem[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState>(null);

  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const recommendationsRequestRef = useRef(0);
  const searchRequestRef = useRef(0);

  const dismissToast = useCallback(() => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = null;
    setToast(null);
  }, []);

  const showToast = useCallback((message: string, type: ToastType = "info") => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);

    setToast({ message, type });
    toastTimerRef.current = setTimeout(() => {
      setToast(null);
      toastTimerRef.current = null;
    }, TOAST_TIMEOUT);
  }, []);

  const loadRecommendations = useCallback(async (refresh = false) => {
    const requestId = ++recommendationsRequestRef.current;

    if (refresh) setIsRefreshing(true);
    else setIsLoading(true);
    setError(null);

    try {
      const data = refresh
        ? await refreshRecommendations(DEFAULT_RECOMMENDATIONS_LIMIT)
        : await getRecommendations(DEFAULT_RECOMMENDATIONS_LIMIT, false);

      if (requestId !== recommendationsRequestRef.current) return;

      setRecommendations(data);
      if (refresh) {
        showToast(
          t("recommendations_page.toastSuccess") ||
            "Recomendações atualizadas com sucesso!",
          "success",
        );
      }
    } catch (err: unknown) {
      if (requestId !== recommendationsRequestRef.current) return;
      const message = getErrorMessage(
        err,
        t("recommendations_page.toastError") ||
          "Erro ao conectar com o serviço de recomendações.",
      );
      setError(message);
      showToast(message, "error");
    } finally {
      if (requestId === recommendationsRequestRef.current) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  }, [showToast, t]);

  useEffect(() => {
    void loadRecommendations();
    return () => {
      recommendationsRequestRef.current += 1;
    };
  }, [loadRecommendations]);

  const handleSearch = useCallback(async (query: string, categoryId?: string) => {
    const cleanQuery = query.trim();
    const requestId = ++searchRequestRef.current;

    if (!cleanQuery) {
      setSearchResults(null);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    try {
      const results = await searchVideos(
        cleanQuery,
        DEFAULT_SEARCH_VIDEOS_LIMIT,
        categoryId,
      );
      if (requestId !== searchRequestRef.current) return;
      setSearchResults(results);
    } catch (err: unknown) {
      if (requestId !== searchRequestRef.current) return;
      showToast(getErrorMessage(err, "Erro ao pesquisar vídeos no YouTube."), "error");
    } finally {
      if (requestId === searchRequestRef.current) setIsSearching(false);
    }
  }, [showToast]);

  const clearSearch = useCallback(() => {
    searchRequestRef.current += 1;
    setSearchResults(null);
    setIsSearching(false);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      toastTimerRef.current = null;
      recommendationsRequestRef.current += 1;
      searchRequestRef.current += 1;
    };
  }, []);

  return (
    <div className="min-h-screen w-full flex-1 bg-gray-50 p-4 text-gray-900 transition-colors dark:bg-gray-950 dark:text-gray-100 sm:p-6 lg:p-8">
      {toast && (
        <div
          role={toast.type === "error" ? "alert" : "status"}
          aria-live={toast.type === "error" ? "assertive" : "polite"}
          className={`fixed bottom-6 right-6 z-50 flex max-w-[calc(100vw-3rem)] items-center gap-3 rounded-2xl border px-4 py-3 text-sm shadow-2xl backdrop-blur-md transition-all duration-300 animate-in slide-in-from-bottom-5 ${
            toast.type === "success"
              ? "border-emerald-500/30 bg-white/95 text-emerald-600 dark:bg-gray-900/95 dark:text-emerald-400"
              : toast.type === "error"
                ? "border-rose-500/30 bg-white/95 text-rose-600 dark:bg-gray-900/95 dark:text-rose-400"
                : "border-gray-200 bg-white/95 text-gray-900 dark:border-gray-800 dark:bg-gray-900/95 dark:text-gray-100"
          }`}
        >
          {toast.type === "success" && <CheckCircle2 aria-hidden="true" className="h-4 w-4 shrink-0 text-emerald-500" />}
          {toast.type === "error" && <AlertTriangle aria-hidden="true" className="h-4 w-4 shrink-0 text-rose-500" />}
          {toast.type === "info" && <Info aria-hidden="true" className="h-4 w-4 shrink-0 text-blue-500" />}
          <span className="font-medium">{toast.message}</span>
          <button
            type="button"
            onClick={dismissToast}
            aria-label="Fechar notificação"
            className="ml-1 rounded-md px-1 text-current opacity-70 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-current/40"
          >
            ×
          </button>
        </div>
      )}

      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm transition-colors dark:border-gray-800 dark:bg-gray-900 sm:p-7">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-600 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-400">
                  <Youtube aria-hidden="true" className="h-3.5 w-3.5" />
                  <span>YouTube Intelligence Engine</span>
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                  <Sparkles aria-hidden="true" className="h-3 w-3 text-amber-500" />
                  {t("recommendations_page.badgeTech") || "Inteligência Artificial & Dados"}
                </span>
              </div>
              <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
                {t("recommendations_page.title") || "Recomendador de Vídeos"}
              </h1>
              <p className="max-w-2xl text-xs text-gray-500 dark:text-gray-400 sm:text-sm">
                {t("recommendations_page.subtitle") ||
                  "Conteúdos técnicos sugeridos com base no seu histórico e preferências de tecnologia."}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-3">
              <button
                type="button"
                onClick={() => void loadRecommendations(true)}
                disabled={isRefreshing || isLoading}
                title="Recalcular recomendações"
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-xs font-semibold text-gray-800 shadow-sm transition-all hover:scale-[1.02] hover:bg-gray-50 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-red-500/40 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700 sm:text-sm"
              >
                <RefreshCw aria-hidden="true" className={`h-4 w-4 text-red-500 ${isRefreshing ? "animate-spin" : ""}`} />
                <span>
                  {isRefreshing
                    ? t("recommendations_page.refreshing") || "A atualizar..."
                    : t("recommendations_page.refreshBtn") || "Atualizar Recomendações"}
                </span>
              </button>
            </div>
          </div>
        </header>

        <div className="w-full">
          <SearchBar
            onSearch={handleSearch}
            isLoading={isSearching}
            placeholder={
              t("recommendations_page.searchPlaceholder") ||
              "Buscar novos vídeos no YouTube para adicionar ao histórico..."
            }
          />
        </div>

        {searchResults !== null && (
          <div className="flex items-center justify-between gap-3 px-1">
            <p className="text-xs text-gray-500 dark:text-gray-400 sm:text-sm">
              {t("recommendations_page.searchResultsFor") || "Mostrando resultados da pesquisa"}{" "}
              ({searchResults.length} {t("recommendations_page.gamesFound") || "vídeos encontrados"})
            </p>
            <button
              type="button"
              onClick={clearSearch}
              className="shrink-0 text-xs font-medium text-red-600 hover:underline focus:outline-none focus:ring-2 focus:ring-red-500/40 dark:text-red-400"
            >
              {t("recommendations_page.clearSearch") || "Voltar às recomendações"}
            </button>
          </div>
        )}

        <RecommendationFeed
          recommendations={recommendations}
          searchResults={searchResults ?? undefined}
          isLoading={isLoading}
          isRefreshing={isRefreshing}
          error={error}
          onRefresh={() => void loadRecommendations(true)}
        />
      </div>
    </div>
  );
}

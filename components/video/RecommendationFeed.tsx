"use client";

import React, { useState } from "react";
import { Sparkles, RefreshCw, AlertCircle, Film, ArrowRight } from "lucide-react";
import { RecommendationItem, VideoItem } from "@/lib/api/videos";
import { useI18n } from "@/context/I18nContext";
import VideoCard from "./VideoCard";
import VideoModal from "./VideoModal";

interface RecommendationFeedProps {
  recommendations: RecommendationItem[];
  searchResults?: VideoItem[];
  isLoading: boolean;
  isRefreshing: boolean;
  error?: string | null;
  onRefresh: () => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
}

export default function RecommendationFeed({
  recommendations,
  searchResults,
  isLoading,
  isRefreshing,
  error,
  onRefresh,
  onLoadMore,
  hasMore = false,
}: RecommendationFeedProps) {
  const { t } = useI18n();
  const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(null);

  const isSearchMode = searchResults !== undefined && searchResults !== null;

  // Renderiza Esqueletos Shimmer enquanto carrega
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col overflow-hidden rounded-2xl bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 shadow-sm animate-pulse"
          >
            {/* Thumbnail Shimmer */}
            <div className="aspect-video w-full bg-gray-200 dark:bg-gray-800" />

            {/* Linhas de Texto Shimmer */}
            <div className="p-4 flex flex-col gap-3">
              <div className="h-3.5 w-1/3 rounded bg-gray-200 dark:bg-gray-800" />
              <div className="h-4 w-full rounded bg-gray-200 dark:bg-gray-800" />
              <div className="h-4 w-4/5 rounded bg-gray-200 dark:bg-gray-800" />
              <div className="pt-2 flex justify-between items-center border-t border-gray-100 dark:border-gray-800">
                <div className="h-3 w-16 rounded bg-gray-200 dark:bg-gray-800" />
                <div className="h-7 w-20 rounded-lg bg-gray-200 dark:bg-gray-800" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Estado de Erro com Botão de Tentar Novamente
  if (error) {
    return (
      <div className="p-8 rounded-2xl bg-white dark:bg-gray-900 border border-red-200 dark:border-red-900/30 text-center max-w-lg mx-auto flex flex-col items-center gap-3 shadow-sm">
        <div className="h-12 w-12 rounded-full bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center justify-center">
          <AlertCircle className="h-6 w-6" />
        </div>
        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">{t("recommendations_page.toastError")}</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400">{error}</p>
        <button
          onClick={onRefresh}
          className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-md shadow-blue-500/20"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>{t("common.tryAgain", { defaultValue: "Tentar novamente" })}</span>
        </button>
      </div>
    );
  }

  // Estado Vazio para Busca
  if (isSearchMode && searchResults.length === 0) {
    return (
      <div className="py-16 text-center flex flex-col items-center justify-center gap-3">
        <div className="h-16 w-16 rounded-2xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-400 dark:text-gray-500">
          <Film className="h-8 w-8" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{t("recommendations_page.noResults")}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md">
          {t("recommendations_page.noResultsSub")}
        </p>
      </div>
    );
  }

  // Estado Vazio para Recomendações
  if (!isSearchMode && recommendations.length === 0) {
    return (
      <div className="py-16 px-6 text-center flex flex-col items-center justify-center gap-4 rounded-3xl bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 shadow-sm max-w-xl mx-auto">
        <div className="h-16 w-16 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
          <Sparkles className="h-8 w-8" />
        </div>

        <div className="space-y-1">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {t("recommendations_page.noRecommendations")}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 max-w-md mx-auto">
            {t("recommendations_page.noRecommendationsSub")}
          </p>
        </div>

        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition-all hover:scale-105 active:scale-95"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          <span>{t("recommendations_page.refreshBtn")}</span>
        </button>
      </div>
    );
  }

  return (
    <>
      {/* 🎬 Grid Responsivo de Vídeos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {isSearchMode
          ? searchResults.map((video) => (
              <VideoCard
                key={video.id || video.youtube_id}
                video={video}
                onWatch={(v) => setSelectedVideo(v)}
              />
            ))
          : recommendations.map((rec) => (
              <VideoCard
                key={rec.id}
                video={rec.video}
                score={rec.score}
                reason={rec.reason}
                onWatch={(v) => setSelectedVideo(v)}
              />
            ))}
      </div>

      {/* Botão Carregar Mais se houver paginação */}
      {hasMore && onLoadMore && (
        <div className="mt-10 text-center">
          <button
            onClick={onLoadMore}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-semibold bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 shadow-sm transition-all hover:scale-105"
          >
            <span>{t("recommendations_page.loadMore")}</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Player Modal */}
      <VideoModal
        video={selectedVideo}
        isOpen={Boolean(selectedVideo)}
        onClose={() => setSelectedVideo(null)}
      />
    </>
  );
}

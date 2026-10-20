"use client";

import React, { useState } from "react";
import { Play, ThumbsUp, Eye, Sparkles } from "lucide-react";
import { VideoItem, logWatch } from "@/lib/api/videos";
import { useI18n } from "@/context/I18nContext";

interface VideoCardProps {
  video: VideoItem;
  score?: number;
  reason?: string | null;
  onWatch?: (video: VideoItem) => void;
  onLikeToggle?: (video: VideoItem, liked: boolean) => void;
}

export function formatViews(views: number): string {
  if (views >= 1_000_000) {
    return `${(views / 1_000_000).toFixed(1)}M`;
  }
  if (views >= 1_000) {
    return `${(views / 1_000).toFixed(1)}K`;
  }
  return views.toLocaleString();
}

export default function VideoCard({
  video,
  score,
  reason,
  onWatch,
  onLikeToggle,
}: VideoCardProps) {
  const { t } = useI18n();
  const [isLiked, setIsLiked] = useState(false);
  const [isWatching, setIsWatching] = useState(false);

  const matchPercent = score !== undefined ? Math.round(score * 100) : null;

  const handleWatchClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsWatching(true);
    try {
      // Registra no backend o histórico de visualização
      await logWatch(video.id || video.youtube_id, 30, isLiked);
    } catch (err) {
      console.warn("Aviso ao registrar histórico:", err);
    } finally {
      setIsWatching(false);
      if (onWatch) {
        onWatch(video);
      } else {
        // Fallback: abrir diretamente no YouTube
        window.open(`https://www.youtube.com/watch?v=${video.youtube_id}`, "_blank", "noopener,noreferrer");
      }
    }
  };

  const handleLikeClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextState = !isLiked;
    setIsLiked(nextState);
    try {
      await logWatch(video.id || video.youtube_id, 0, nextState);
      if (onLikeToggle) {
        onLikeToggle(video, nextState);
      }
    } catch (err) {
      console.warn("Falha ao salvar like:", err);
    }
  };

  const defaultThumbnail =
    video.thumbnail_url || `https://img.youtube.com/vi/${video.youtube_id}/hqdefault.jpg`;

  return (
    <div
      onClick={handleWatchClick}
      className="group relative flex flex-col overflow-hidden rounded-2xl bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-blue-500/40 dark:hover:border-blue-500/30 cursor-pointer text-left"
    >
      {/* 🖼️ Thumbnail 16:9 */}
      <div className="relative aspect-video w-full overflow-hidden bg-gray-100 dark:bg-gray-950">
        <img
          src={defaultThumbnail}
          alt={video.title}
          loading="lazy"
          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => {
            // Fallback caso a thumbnail oficial falhe
            (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${video.youtube_id}/mqdefault.jpg`;
          }}
        />

        {/* Overlay escuro em hover com botão de play */}
        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <div className="h-12 w-12 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
            <Play className="h-6 w-6 fill-current ml-0.5" />
          </div>
        </div>

        {/* Badge de afinidade / score */}
        {matchPercent !== null && (
          <div className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-full text-xs font-semibold backdrop-blur-md bg-gray-900/85 border border-white/20 text-white flex items-center gap-1.5 shadow-sm">
            <Sparkles className="h-3 w-3 text-blue-400" />
            <span>{matchPercent}% afinidade</span>
          </div>
        )}

        {/* Duração ou views flutuante */}
        <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md text-[11px] font-medium bg-black/75 text-gray-200 flex items-center gap-1">
          <Eye className="h-3 w-3 text-gray-400" />
          <span>{formatViews(video.view_count)} views</span>
        </div>
      </div>

      {/* 📋 Detalhes do Conteúdo */}
      <div className="p-4 flex flex-col flex-1 justify-between gap-3">
        <div>
          {/* Motivo da recomendação se existir */}
          {reason && (
            <p className="text-[11px] font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-1.5 flex items-center gap-1 truncate">
              <span>•</span> {reason}
            </p>
          )}

          {/* Título com 2 linhas e truncate */}
          <h3
            className="text-sm font-semibold text-gray-900 dark:text-gray-100 line-clamp-2 leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors"
            title={video.title}
          >
            {video.title}
          </h3>

          {/* Canal do YouTube */}
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 truncate">
            {video.channel_title || "Canal do YouTube"}
          </p>
        </div>

        {/* Ações e Botão Assistir */}
        <div className="pt-2 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={handleLikeClick}
            className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg transition-colors border ${
              isLiked
                ? "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800"
                : "text-gray-500 dark:text-gray-400 border-transparent hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200"
            }`}
            title={isLiked ? "Gostei" : "Marcar como gostei"}
          >
            <ThumbsUp className={`h-3.5 w-3.5 ${isLiked ? "fill-current" : ""}`} />
            <span>{isLiked ? (video.like_count + 1).toLocaleString() : formatViews(video.like_count)}</span>
          </button>

          <button
            type="button"
            onClick={handleWatchClick}
            disabled={isWatching}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-500/20 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <Play className="h-3 w-3 fill-current" />
            <span>{isWatching ? "Abrindo..." : t("recommendations_page.watchVideo")}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

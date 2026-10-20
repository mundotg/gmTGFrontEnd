"use client";

import React, { useEffect } from "react";
import { X, ExternalLink } from "lucide-react";
import { VideoItem } from "@/lib/api/videos";
import { useI18n } from "@/context/I18nContext";

interface VideoModalProps {
  video: VideoItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function VideoModal({ video, isOpen, onClose }: VideoModalProps) {
  const { t } = useI18n();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !video) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-4xl overflow-hidden rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header da Modal */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-950/40">
          <div className="flex items-center gap-2 overflow-hidden mr-4">
            <span className="h-2 w-2 rounded-full bg-blue-600 dark:bg-blue-400" />
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
              {video.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Player de Vídeo 16:9 */}
        <div className="relative aspect-video w-full bg-black">
          <iframe
            src={`https://www.youtube.com/embed/${video.youtube_id}?autoplay=1&rel=0`}
            title={video.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full border-0"
          />
        </div>

        {/* Footer com Metadados */}
        <div className="p-4 bg-gray-50 dark:bg-gray-950/60 border-t border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-gray-500 dark:text-gray-400">
          <div>
            <p className="font-semibold text-gray-900 dark:text-gray-100">{video.channel_title}</p>
            <p className="mt-0.5">
              {video.view_count.toLocaleString()} visualizações • {video.like_count.toLocaleString()} curtidas
            </p>
          </div>

          <a
            href={`https://www.youtube.com/watch?v=${video.youtube_id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 shadow-sm transition-colors"
          >
            <span>{t("recommendations_page.watchOnYoutube")}</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}

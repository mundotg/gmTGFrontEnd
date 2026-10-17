"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Clock,
  CheckCircle2,
  Bookmark,
  Share2,
  AlertTriangle,
  ArrowRight,
  BookOpen,
} from "lucide-react";
import { Article } from "./types";
import { useI18n } from "@/context/I18nContext";
import { getCategoryToken } from "./categoryTheme";
import { ShareModal } from "./ShareModal";
import { useNexusAuth } from "./NexusAuthContext";

interface ArticleCardProps {
  article: Article;
  onBookmarkToggle?: (id: string) => void;
  isBookmarked?: boolean;
}

export const ArticleCard: React.FC<ArticleCardProps> = ({
  article,
  onBookmarkToggle,
  isBookmarked = false,
}) => {
  const { t } = useI18n();
  const { requireAuth } = useNexusAuth();
  const [isShareOpen, setIsShareOpen] = useState(false);
  const catToken = getCategoryToken(article.category);

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    requireAuth(() => {
      setIsShareOpen(true);
    });
  };

  const handleBookmark = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    requireAuth(() => {
      onBookmarkToggle?.(article.id);
    });
  };

  // Badge de estilo por tipo de conteúdo
  const badgeConfig = {
    cientifico: {
      label: t("nexus.typeScientific") || "Artigo Científico",
      classes: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/50",
    },
    curiosidade: {
      label: t("nexus.typeCuriosity") || "Curiosidade Fundamentada",
      classes: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/50",
    },
    experiencia: {
      label: t("nexus.typeExperience") || "Relato de Experiência",
      classes: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800/50",
    },
    opiniao: {
      label: t("nexus.typeOpinion") || "Opinião Fundamentada",
      classes: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
    },
    analise: {
      label: t("nexus.typeAnalysis") || "Análise Técnica",
      classes: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/50",
    },
  }[article.content_type] || {
    label: t("nexus.typeScientific") || "Artigo",
    classes: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
  };

  const hasVerifiedSources = article.sources?.some((s) => s.verified);

  return (
    <article className="group bg-white dark:bg-[#111D3D] border border-[#DCE3EA] dark:border-[#1E2D5A] hover:border-slate-400 dark:hover:border-slate-500 rounded-xl overflow-hidden transition-all duration-200 hover:shadow-md flex flex-col justify-between">
      <div>
        {/* IMAGEM DE CAPA (SE HOUVER) */}
        {article.cover_image && (
          <div className="relative h-48 w-full overflow-hidden bg-slate-100 dark:bg-slate-900 border-b border-[#DCE3EA] dark:border-[#1E2D5A]">
            <img
              src={article.cover_image}
              alt={article.title}
              className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
              loading="lazy"
            />
            {/* BADGE FLUTUANTE */}
            <div className="absolute top-3 left-3 flex items-center gap-2">
              <span className={`text-[11px] font-semibold tracking-wide px-2.5 py-1 rounded border backdrop-blur-md shadow-xs ${badgeConfig.classes}`}>
                {badgeConfig.label}
              </span>
            </div>
          </div>
        )}

        <div className="p-6 space-y-3.5">
          {/* TOPO: CATEGORIA & DATA */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            {!article.cover_image && (
              <span className={`text-[11px] font-semibold tracking-wide px-2 py-0.5 rounded border ${badgeConfig.classes}`}>
                {badgeConfig.label}
              </span>
            )}
            
            {/* ETIQUETA DE CATEGORIA COM TOKEN EXATO */}
            <span
              className="text-[12px] font-semibold px-2.5 py-0.5 rounded-md border flex items-center gap-1.5"
              style={{
                color: catToken.color,
                borderColor: catToken.border,
                backgroundColor: catToken.bgLight,
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ backgroundColor: catToken.color }}
              />
              <span>{article.category}</span>
              {article.subcategory && (
                <span className="opacity-75 font-normal">/ {article.subcategory}</span>
              )}
            </span>

            <div className="flex items-center gap-1 text-xs text-[#475569] dark:text-slate-400 ml-auto font-interface">
              <Clock className="w-3.5 h-3.5" />
              <span>{article.read_time_minutes} {t("nexus.readTime") || "min de leitura"}</span>
            </div>
          </div>

          {/* TÍTULO EDITORIAL (Source Serif 4) */}
          <Link href={`/nexus-cognitiva/artigo/${article.id}`} className="block group-hover:text-[#087E8B] dark:group-hover:text-teal-400 transition-colors">
            <h3 className="font-editorial text-lg sm:text-[20px] font-semibold text-[#14283F] dark:text-white leading-snug">
              {article.title}
            </h3>
          </Link>

          {/* RESUMO */}
          <p className="font-interface text-[14px] sm:text-[15px] text-[#475569] dark:text-slate-300 line-clamp-3 leading-relaxed">
            {article.summary}
          </p>

          {/* SINALIZADORES ESPECIAIS CONFORME O TIPO */}
          {article.content_type === "cientifico" && hasVerifiedSources && (
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-teal-50/70 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-800/40 text-[11px] text-[#087E8B] dark:text-teal-300 font-interface">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#087E8B] dark:text-teal-400 shrink-0" />
              <span className="truncate">
                {t("nexus.verifiedSources") || "Fontes Verificadas"} ({article.sources?.length} {t("nexus.verifiedSourcesCount") || "referências científicas / DOI"})
              </span>
            </div>
          )}

          {article.content_type === "experiencia" && (
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-amber-50/80 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 text-[11px] text-amber-800 dark:text-amber-300 font-interface">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>{t("nexus.personalAccountNotice") || "Relato pessoal individual • Isenção de universalidade científica"}</span>
            </div>
          )}

          {/* TAGS */}
          {article.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {article.tags.slice(0, 4).map((tag) => (
                <span
                  key={tag}
                  className="font-interface text-[11px] font-medium text-[#475569] dark:text-slate-400 bg-[#F4F7FA] dark:bg-[#0B132B] border border-[#DCE3EA] dark:border-[#1E2D5A] px-2 py-0.5 rounded"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* RODAPÉ DO CARD */}
      <div className="px-6 py-3.5 bg-[#F8FAFC] dark:bg-[#0B132B]/50 border-t border-[#DCE3EA] dark:border-[#1E2D5A] flex items-center justify-between gap-3 text-xs font-interface">
        {/* AUTOR */}
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden shrink-0 border border-[#DCE3EA] dark:border-slate-600">
            {article.author.avatar ? (
              <img src={article.author.avatar} alt={article.author.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center font-bold text-[#14283F] dark:text-white text-[11px]">
                {article.author.name[0]}
              </div>
            )}
          </div>
          <div className="flex flex-col truncate max-w-[130px] sm:max-w-[160px]">
            <span className="font-semibold text-[#14283F] dark:text-white truncate text-xs">{article.author.name}</span>
            <span className="text-[11px] text-[#475569] dark:text-slate-400 truncate">{article.author.institution || "Autor"}</span>
          </div>
        </div>

        {/* AÇÕES */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleBookmark}
            className={`p-2 rounded-md transition-colors border ${
              isBookmarked
                ? "bg-[#087E8B]/10 text-[#087E8B] dark:text-teal-400 border-[#087E8B]/30"
                : "text-[#475569] dark:text-slate-400 hover:text-[#14283F] dark:hover:text-white hover:bg-white dark:hover:bg-slate-800 border-transparent"
            }`}
            title={isBookmarked ? (t("nexus.bookmarked") || "Guardado") : (t("nexus.bookmark") || "Guardar")}
          >
            <Bookmark className="w-3.5 h-3.5" fill={isBookmarked ? "currentColor" : "none"} />
          </button>

          <button
            onClick={handleShare}
            className="p-2 rounded-md text-[#475569] dark:text-slate-400 hover:text-[#087E8B] dark:hover:text-teal-400 hover:bg-[#087E8B]/10 border border-transparent transition-colors cursor-pointer"
            title={t("nexus.share") || "Partilhar"}
          >
            <Share2 className="w-3.5 h-3.5" />
          </button>

          <Link
            href={`/nexus-cognitiva/artigo/${article.id}`}
            className="flex items-center gap-1 pl-2 text-[#087E8B] dark:text-teal-400 hover:text-[#066570] dark:hover:text-teal-300 font-semibold group-hover:translate-x-0.5 transition-all"
          >
            <span>{t("nexus.readArticle") || "Ler"}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* MODAL DE PARTILHA */}
      <ShareModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        postId={article.id}
        title={article.title}
        summary={article.summary}
      />
    </article>
  );
};

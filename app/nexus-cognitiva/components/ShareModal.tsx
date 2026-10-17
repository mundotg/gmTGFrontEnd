"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Copy,
  Check,
  Share2,
  ExternalLink,
  MessageCircle,
} from "lucide-react";
import { useI18n } from "@/context/I18nContext";
import { registerShare } from "../services/nexusApi";
import { getArticleUrl } from "../services/nexusUrl";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  postId: string | number;
  title: string;
  summary?: string;
  url?: string;
}

export function ShareModal({
  isOpen,
  onClose,
  postId,
  title,
  summary = "",
  url: customUrl,
}: ShareModalProps) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setShareUrl(
        customUrl || getArticleUrl(postId, true)
      );
    }
  }, [postId, customUrl]);

  // Fechar com tecla Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Função resiliente de cópia de texto com fallback
  const handleCopyLink = async () => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = shareUrl;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopied(true);
      registerShare({ postId, platform: "copy_link" }).catch(() => {});
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.warn("Falha ao copiar link:", err);
    }
  };

  // Partilha Nativa (Web Share API para telemóveis e navegadores modernos)
  const handleNativeShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title,
          text: summary,
          url: shareUrl,
        });
        registerShare({ postId, platform: "native_share" }).catch(() => {});
        onClose();
      } catch (err: any) {
        if (err?.name !== "AbortError") {
          console.warn("Erro no native share:", err);
        }
      }
    } else {
      handleCopyLink();
    }
  };

  // Abertura de partilhas externas
  const handleSocialShare = (platform: "whatsapp" | "linkedin" | "twitter" | "telegram") => {
    const textEncoded = encodeURIComponent(`${title}\n\n${shareUrl}`);
    const urlEncoded = encodeURIComponent(shareUrl);
    const titleEncoded = encodeURIComponent(title);

    let targetUrl = "";
    if (platform === "whatsapp") {
      targetUrl = `https://api.whatsapp.com/send?text=${textEncoded}`;
    } else if (platform === "linkedin") {
      targetUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${urlEncoded}`;
    } else if (platform === "twitter") {
      targetUrl = `https://twitter.com/intent/tweet?text=${titleEncoded}&url=${urlEncoded}`;
    } else if (platform === "telegram") {
      targetUrl = `https://t.me/share/url?url=${urlEncoded}&text=${titleEncoded}`;
    }

    if (targetUrl) {
      window.open(targetUrl, "_blank", "noopener,noreferrer,width=600,height=500");
      registerShare({ postId, platform }).catch(() => {});
    }
  };

  const hasNativeShare = typeof navigator !== "undefined" && typeof navigator.share === "function";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      {/* Backdrop clique para fechar */}
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

      {/* Caixa do Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-modal-title"
        className="relative z-10 w-full max-w-md bg-white dark:bg-[#111D3D] rounded-2xl border border-[#DCE3EA] dark:border-[#1E2D5A] p-6 shadow-2xl space-y-6 animate-in zoom-in-95 duration-200 font-interface"
      >
        {/* Cabeçalho */}
        <div className="flex items-center justify-between pb-3 border-b border-[#DCE3EA] dark:border-[#1E2D5A]">
          <div className="flex items-center gap-2 text-[#14283F] dark:text-white">
            <div className="w-8 h-8 rounded-lg bg-[#087E8B]/10 text-[#087E8B] dark:text-teal-400 border border-[#087E8B]/20 flex items-center justify-center">
              <Share2 className="w-4 h-4" />
            </div>
            <h3 id="share-modal-title" className="font-editorial text-lg font-bold">
              {t("nexus.shareModalTitle") || "Partilhar Conhecimento"}
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Título do Artigo */}
        <div className="p-3 rounded-xl bg-[#F4F7FA] dark:bg-[#0B132B] border border-[#DCE3EA] dark:border-[#1E2D5A] text-xs">
          <span className="text-[#475569] dark:text-slate-400 block text-[11px] font-medium mb-1">
            Artigo selecionado:
          </span>
          <p className="font-semibold text-[#14283F] dark:text-white line-clamp-2">
            {title}
          </p>
        </div>

        {/* Botão de Cópia Direta de Link */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-[#14283F] dark:text-slate-200 block">
            {t("nexus.shareLink") || "Hiperligação direta"}
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={shareUrl}
              className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#F4F7FA] dark:bg-[#0B132B] border border-[#DCE3EA] dark:border-[#1E2D5A] text-xs text-[#14283F] dark:text-white font-mono outline-none select-all"
            />
            <button
              onClick={handleCopyLink}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer shadow-xs ${
                copied
                  ? "bg-emerald-600 text-white"
                  : "bg-[#087E8B] hover:bg-[#066570] text-white"
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>{t("nexus.copied") || "Copiado!"}</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>{t("nexus.copy") || "Copiar"}</span>
                </>
              )}
            </button>
          </div>
          {copied && (
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium animate-in fade-in">
              ✓ Link copiado para a área de transferência!
            </p>
          )}
        </div>

        {/* Canais Sociais Diretos */}
        <div className="space-y-2.5 pt-2 border-t border-[#DCE3EA] dark:border-[#1E2D5A]">
          <span className="text-xs font-semibold text-[#475569] dark:text-slate-400 block">
            {t("nexus.shareVia") || "Partilhar nas redes e comunidades:"}
          </span>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {/* WHATSAPP */}
            <button
              onClick={() => handleSocialShare("whatsapp")}
              className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl bg-[#F4F7FA] dark:bg-[#0B132B] border border-[#DCE3EA] dark:border-[#1E2D5A] hover:border-[#25D366] text-[#14283F] dark:text-slate-200 hover:text-[#25D366] transition-all cursor-pointer shadow-2xs group"
            >
              <div className="w-8 h-8 rounded-full bg-[#25D366]/10 flex items-center justify-center text-[#25D366] group-hover:scale-110 transition-transform">
                <MessageCircle className="w-4 h-4 fill-current" />
              </div>
              <span className="text-[11px] font-semibold">WhatsApp</span>
            </button>

            {/* LINKEDIN */}
            <button
              onClick={() => handleSocialShare("linkedin")}
              className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl bg-[#F4F7FA] dark:bg-[#0B132B] border border-[#DCE3EA] dark:border-[#1E2D5A] hover:border-[#0A66C2] text-[#14283F] dark:text-slate-200 hover:text-[#0A66C2] transition-all cursor-pointer shadow-2xs group"
            >
              <div className="w-8 h-8 rounded-full bg-[#0A66C2]/10 flex items-center justify-center text-[#0A66C2] group-hover:scale-110 transition-transform">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.45a1.64 1.64 0 1 0 0 3.28 1.64 1.64 0 0 0 0-3.28z" />
                </svg>
              </div>
              <span className="text-[11px] font-semibold">LinkedIn</span>
            </button>

            {/* X / TWITTER */}
            <button
              onClick={() => handleSocialShare("twitter")}
              className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl bg-[#F4F7FA] dark:bg-[#0B132B] border border-[#DCE3EA] dark:border-[#1E2D5A] hover:border-slate-500 text-[#14283F] dark:text-slate-200 hover:text-black dark:hover:text-white transition-all cursor-pointer shadow-2xs group"
            >
              <div className="w-8 h-8 rounded-full bg-slate-500/10 flex items-center justify-center text-slate-700 dark:text-slate-300 group-hover:scale-110 transition-transform">
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </div>
              <span className="text-[11px] font-semibold">X (Twitter)</span>
            </button>

            {/* TELEGRAM */}
            <button
              onClick={() => handleSocialShare("telegram")}
              className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl bg-[#F4F7FA] dark:bg-[#0B132B] border border-[#DCE3EA] dark:border-[#1E2D5A] hover:border-[#229ED9] text-[#14283F] dark:text-slate-200 hover:text-[#229ED9] transition-all cursor-pointer shadow-2xs group"
            >
              <div className="w-8 h-8 rounded-full bg-[#229ED9]/10 flex items-center justify-center text-[#229ED9] group-hover:scale-110 transition-transform">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.19-.08-.05-.19-.02-.27 0-.12.03-1.99 1.27-5.63 3.72-.53.36-1.02.54-1.45.53-.48-.01-1.4-.27-2.09-.49-.84-.27-1.51-.42-1.45-.88.03-.24.37-.49 1.02-.74 3.99-1.74 6.66-2.88 8.01-3.44 3.81-1.58 4.6-.1.86 4.6 1.86z" />
                </svg>
              </div>
              <span className="text-[11px] font-semibold">Telegram</span>
            </button>
          </div>

          {/* Partilha nativa do dispositivo (se disponível) */}
          {hasNativeShare && (
            <button
              onClick={handleNativeShare}
              className="w-full mt-2 py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold text-[#14283F] dark:text-white flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5 text-[#087E8B] dark:text-teal-400" />
              <span>{t("nexus.shareNativeMore") || "Outras aplicações do dispositivo..."}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

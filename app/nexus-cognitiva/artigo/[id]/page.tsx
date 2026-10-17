"use client";

import React, { useState, useMemo, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  Bookmark,
  Share2,
  Calendar,
  User,
  ExternalLink,
  AlertTriangle,
  MessageSquare,
  ThumbsUp,
  Send,
  BookOpen,
  Sparkles,
  Copy,
  Check,
  Radio,
  Loader2,
} from "lucide-react";
import { INITIAL_ARTICLES } from "../../components/mockArticles";
import { useSession } from "@/context/SessionContext";
import { useI18n } from "@/context/I18nContext";
import { getCategoryToken } from "../../components/categoryTheme";
import { Article, CommentItem } from "../../components/types";
import {
  getPostById,
  getComments,
  addComment,
  toggleLike,
  toggleCommentLike,
  toggleSave,
  registerShare,
  registerView,
  createPostWebSocket,
} from "../../services/nexusApi";
import { ShareModal } from "../../components/ShareModal";
import { MarkdownRenderer } from "../../components/MarkdownRenderer";
import { useNexusAuth } from "../../components/NexusAuthContext";

export default function ArticleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated } = useSession();
  const { t } = useI18n();
  const { requireAuth, openLoginModal } = useNexusAuth();

  const articleId = (params?.id as string) || "1";

  // Artigo base (fallback local imediato)
  const fallbackArticle = useMemo(
    () => INITIAL_ARTICLES.find((a) => a.id === articleId) || INITIAL_ARTICLES[0],
    [articleId]
  );

  const [article, setArticle] = useState<Article>(fallbackArticle);
  const [comments, setComments] = useState<any[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(true);

  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [activeReaders, setActiveReaders] = useState(1);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);

  // Formatação amigável de data relativa
  const formatCommentDate = useCallback((dateStr?: string) => {
    if (!dateStr) return "Agora mesmo";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return "Recente";
      const now = new Date();
      const diffMs = now.getTime() - d.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      if (diffMins < 1) return "Agora mesmo";
      if (diffMins < 60) return `Há ${diffMins} min`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `Há ${diffHours} h`;
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays < 7) return `Há ${diffDays} ${diffDays === 1 ? "dia" : "dias"}`;
      return d.toLocaleDateString();
    } catch {
      return "Recente";
    }
  }, []);

  // 1. Carregar artigo e comentários do backend
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        const postData = await getPostById(articleId);
        if (isMounted && postData) {
          setArticle(postData);
          setIsBookmarked(!!postData.is_saved);
          setIsLiked(!!postData.is_liked);
          setLikesCount(postData.likes_count ?? 0);
        }
      } catch (e) {
        console.warn("Usando fallback de post:", e);
      }

      try {
        setIsLoadingComments(true);
        const commentsData = await getComments(articleId);
        if (isMounted) {
          setComments(
            (commentsData || []).map((c) => ({
              id: String(c.id),
              authorName: c.author?.name || "Utilizador Nexus",
              authorRole: c.author?.title || "Membro da Comunidade",
              authorAvatar: c.author?.avatar,
              text: c.content,
              date: formatCommentDate(c.created_at),
              likes: c.likes ?? 0,
              isLiked: !!c.is_liked,
            }))
          );
        }
      } catch (e) {
        console.warn("Erro ao buscar comentários do backend:", e);
        if (isMounted) {
          setComments([]);
        }
      } finally {
        if (isMounted) {
          setIsLoadingComments(false);
        }
      }
    }

    loadData();

    // 2. Registar visita imediata (visitante anónimo ou autenticado)
    registerView(articleId, 0)
      .then((res) => {
        if (isMounted && res && typeof res.views_count === "number") {
          setArticle((prev) => ({
            ...prev,
            metrics: {
              ...prev.metrics,
              views: res.views_count,
            },
          }));
        }
      })
      .catch((err) => {
        console.warn("Aviso ao registar visita:", err);
      });

    // 3. Registar tempo de leitura aprofundada após 12 segundos
    const timer = setTimeout(() => {
      registerView(articleId, 12).catch(() => {});
    }, 12000);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [articleId]);

  // 4. Conexão WebSocket para comentários, reações e métricas em tempo real
  useEffect(() => {
    const ws = createPostWebSocket(articleId, {
      onMessage: (msg) => {
        if (!msg) return;

        const eventType = msg.event || msg.type;

        if (
          eventType === "presence" ||
          eventType === "readers_count_changed" ||
          eventType === "connected"
        ) {
          if (typeof msg.active_readers === "number") {
            setActiveReaders(msg.active_readers);
          }
        } else if (eventType === "new_comment" && msg.comment) {
          const c = msg.comment;
          setComments((prev) => {
            // Evitar duplicados
            if (prev.some((existing) => String(existing.id) === String(c.id))) return prev;
            return [
              {
                id: String(c.id),
                authorName: c.author?.nome || c.author?.name || "Utilizador Nexus",
                authorRole: c.author?.cargo || c.author?.title || "Membro da Comunidade",
                authorAvatar: c.author?.avatar_url || c.author?.avatar,
                text: c.content,
                date: "Agora mesmo",
                likes: c.likes_count ?? c.likes ?? 0,
                isLiked: false,
              },
              ...prev,
            ];
          });
        } else if (eventType === "post_likes_updated" || eventType === "reaction_update") {
          if (typeof msg.likes_count === "number") {
            setLikesCount(msg.likes_count);
          } else if (typeof msg.total === "number") {
            setLikesCount(msg.total);
          }
        } else if (eventType === "views_count_updated") {
          if (typeof msg.views_count === "number") {
            setArticle((prev) => ({
              ...prev,
              metrics: {
                ...prev.metrics,
                views: msg.views_count,
              },
            }));
          }
        } else if (eventType === "comment_likes_updated") {
          setComments((prev) =>
            prev.map((item) =>
              String(item.id) === String(msg.comment_id)
                ? { ...item, likes: msg.likes_count }
                : item
            )
          );
        }
      },
    });

    wsRef.current = ws;

    return () => {
      ws?.close();
    };
  }, [articleId]);

  const catToken = getCategoryToken(article.category);

  // Alternar Like / Gosto
  const handleToggleLike = async () => {
    // Optimistic UI
    const nextLiked = !isLiked;
    setIsLiked(nextLiked);
    setLikesCount((prev) => (nextLiked ? prev + 1 : Math.max(0, prev - 1)));

    try {
      const res = await toggleLike(articleId);
      setIsLiked(res.liked);
      setLikesCount(res.likes_count);
    } catch (err) {
      console.error("Erro ao alternar gosto:", err);
    }
  };

  // Alternar Salvo / Bookmark
  const handleToggleBookmark = async () => {
    const nextSaved = !isBookmarked;
    setIsBookmarked(nextSaved);

    try {
      const res = await toggleSave(articleId);
      setIsBookmarked(res.saved);
    } catch (err) {
      console.error("Erro ao alternar bookmark:", err);
    }
  };

  // Copiar link e registar partilha
  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
      registerShare(articleId, "copy_link").catch(() => {});
    }
  };

  // Adicionar comentário com envio para o backend
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || isSubmittingComment) return;

    const commentText = newComment.trim();
    setIsSubmittingComment(true);

    try {
      const created = await addComment(articleId, commentText);

      // Adiciona na lista local (caso o WebSocket demore a propagar)
      setComments((prev) => {
        if (created?.id && prev.some((existing) => String(existing.id) === String(created.id))) {
          return prev;
        }
        return [
          {
            id: String(created?.id || `c-${Date.now()}`),
            authorName: created?.author?.nome || user?.nome || user?.email?.split("@")[0] || "Utilizador MustInfo",
            authorRole: created?.author?.cargo || (user as any)?.cargo?.position || "Membro da Comunidade",
            authorAvatar: created?.author?.avatar_url || user?.avatar_url,
            text: commentText,
            date: "Agora mesmo",
            likes: 0,
            isLiked: false,
          },
          ...prev,
        ];
      });

      setNewComment("");
    } catch (err) {
      console.error("Erro ao publicar comentário no backend:", err);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // Alternar gosto em comentário
  const handleToggleCommentLike = (commentId: string) => {
    requireAuth(async () => {
      // Optimistic update
      setComments((prev) =>
        prev.map((c) => {
          if (String(c.id) === String(commentId)) {
            const nextLiked = !c.isLiked;
            return {
              ...c,
              isLiked: nextLiked,
              likes: nextLiked ? c.likes + 1 : Math.max(0, c.likes - 1),
            };
          }
          return c;
        })
      );

      try {
        const res = await toggleCommentLike(commentId);
        setComments((prev) =>
          prev.map((c) =>
            String(c.id) === String(commentId)
              ? { ...c, isLiked: res.liked, likes: res.likes_count }
              : c
          )
        );
      } catch (err) {
        console.error("Erro ao alternar gosto no comentário:", err);
      }
    });
  };

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
      label: t("nexus.typeExperience") || "Relato de Experiência Individual",
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

  return (
    <article className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-10 font-interface" itemScope itemType="https://schema.org/Article">
      {/* BOTÃO VOLTAR E AÇÕES */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <Link
          href="/nexus-cognitiva"
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#14283F] dark:text-slate-300 bg-white dark:bg-[#111D3D] border border-[#DCE3EA] dark:border-[#1E2D5A] hover:border-slate-400 dark:hover:border-slate-500 transition-all cursor-pointer shadow-xs"
        >
          <ArrowLeft className="w-4 h-4 text-[#087E8B] dark:text-teal-400" />
          <span>{t("nexus.backToFeed") || "Voltar ao Feed"}</span>
        </Link>

        <div className="flex items-center gap-2 flex-wrap">
          {/* PRESENÇA AO VIVO (WEBSOCKET) */}
          {activeReaders > 0 && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>
                {activeReaders} {activeReaders === 1 ? "leitor ativo" : "leitores ativos"}
              </span>
            </div>
          )}

          {/* GOSTAR / LIKE */}
          <button
            onClick={() => requireAuth(handleToggleLike)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border cursor-pointer shadow-xs ${
              isLiked
                ? "bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 border-rose-200 dark:border-rose-800"
                : "bg-white dark:bg-[#111D3D] text-[#475569] dark:text-slate-300 hover:text-[#14283F] dark:hover:text-white border-[#DCE3EA] dark:border-[#1E2D5A]"
            }`}
          >
            <ThumbsUp className="w-3.5 h-3.5" fill={isLiked ? "currentColor" : "none"} />
            <span>{likesCount} {t("nexus.likes") || "Gostos"}</span>
          </button>

          {/* GUARDAR / BOOKMARK */}
          <button
            onClick={() => requireAuth(handleToggleBookmark)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border cursor-pointer shadow-xs ${
              isBookmarked
                ? "bg-[#087E8B]/10 text-[#087E8B] dark:text-teal-400 border-[#087E8B]/30"
                : "bg-white dark:bg-[#111D3D] text-[#475569] dark:text-slate-300 hover:text-[#14283F] dark:hover:text-white border-[#DCE3EA] dark:border-[#1E2D5A]"
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" fill={isBookmarked ? "currentColor" : "none"} />
            <span>{isBookmarked ? (t("nexus.bookmarked") || "Guardado") : (t("nexus.bookmark") || "Guardar")}</span>
          </button>

          {/* PARTILHAR */}
          <button
            onClick={() => requireAuth(() => setIsShareModalOpen(true))}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-[#111D3D] text-[#475569] dark:text-slate-300 hover:text-[#087E8B] dark:hover:text-teal-400 border border-[#DCE3EA] dark:border-[#1E2D5A] hover:border-[#087E8B]/40 transition-all cursor-pointer shadow-xs"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>{t("nexus.share") || "Partilhar"}</span>
          </button>
        </div>
      </div>

      {/* CABEÇALHO DO ARTIGO */}
      <header className="space-y-5">
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className={`text-[11px] font-semibold tracking-wide px-2.5 py-1 rounded border ${badgeConfig.classes}`}>
            {badgeConfig.label}
          </span>

          <span
            className="text-[12px] font-semibold px-2.5 py-1 rounded-md border flex items-center gap-1.5"
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

          <div className="flex items-center gap-1.5 text-xs text-[#475569] dark:text-slate-400 ml-auto font-interface">
            <Clock className="w-3.5 h-3.5" />
            <span>{article.read_time_minutes} {t("nexus.readTime") || "min de leitura"}</span>
          </div>
        </div>

        {/* TÍTULO EDITORIAL: 32–42px, peso 600–700 */}
        <h1 className="font-editorial text-3xl sm:text-4xl lg:text-[40px] font-bold text-[#14283F] dark:text-white tracking-tight leading-[1.25]">
          {article.title}
        </h1>

        <p className="font-interface text-base sm:text-lg text-[#475569] dark:text-slate-300 leading-relaxed font-normal">
          {article.summary}
        </p>

        {/* METADADOS DO AUTOR E DATA */}
        <div className="flex items-center justify-between gap-4 py-4 border-y border-[#DCE3EA] dark:border-[#1E2D5A] flex-wrap font-interface text-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden border border-[#DCE3EA] dark:border-slate-600 shrink-0">
              {article.author.avatar ? (
                <img src={article.author.avatar} alt={article.author.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-bold text-[#14283F] dark:text-white text-sm">
                  {article.author.name[0]}
                </div>
              )}
            </div>
            <div>
              <span className="font-semibold text-[#14283F] dark:text-white text-sm block">{article.author.name}</span>
              <span className="text-xs text-[#475569] dark:text-slate-400 block">{article.author.title || article.author.institution}</span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs text-[#475569] dark:text-slate-400">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <time dateTime={article.published_at} itemProp="datePublished">
                {new Date(article.published_at).toLocaleDateString()}
              </time>
            </div>
            <div>•</div>
            <div>{article.metrics.views} {t("nexus.sortViews") || "visualizações"}</div>
          </div>
        </div>
      </header>

      {/* AVISO CONTEXTUAL POR TIPO */}
      {article.content_type === "experiencia" && (
        <div className="p-4 rounded-xl bg-amber-50/90 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1 font-interface">
            <span className="font-semibold block text-amber-800 dark:text-amber-300 text-sm">
              Nota Metodológica do Nexus Cognitiva:
            </span>
            <p className="leading-relaxed">
              Esta publicação representa um <strong>relato individual de experiência pessoal ou profissional</strong>.
              Não deve ser interpretada como consenso científico geral ou recomendação médica/técnica sem validação de fontes qualificadas.
            </p>
          </div>
        </div>
      )}

      {/* CORPO DO ARTIGO COM LARGURA RECOMENDADA E TIPOGRAFIA EDITORIAL */}
      <article className="space-y-6">
        {article.cover_image && (
          <div className="rounded-xl overflow-hidden border border-[#DCE3EA] dark:border-[#1E2D5A] my-6 max-h-[420px] bg-slate-100 dark:bg-slate-900">
            <img src={article.cover_image} alt={article.title} className="w-full h-full object-cover" />
          </div>
        )}

        <div className="bg-white dark:bg-[#111D3D] border border-[#DCE3EA] dark:border-[#1E2D5A] rounded-2xl p-6 sm:p-10 shadow-xs">
          <MarkdownRenderer content={article.body_markdown} />
        </div>
      </article>

      {/* BLOCO ESTRUTURADO DE FONTES E REFERÊNCIAS CIENTÍFICAS */}
      {article.sources && article.sources.length > 0 && (
        <section className="bg-[#F8FAFC] dark:bg-[#0B132B]/80 border border-[#DCE3EA] dark:border-[#1E2D5A] rounded-2xl p-6 sm:p-8 space-y-4 shadow-xs">
          <div className="flex items-center gap-2 text-[#14283F] dark:text-white font-semibold text-sm font-interface">
            <CheckCircle2 className="w-4 h-4 text-[#087E8B] dark:text-teal-400" />
            <span>{t("nexus.fieldSources") || "Fontes e Referências Bibliográficas"} ({t("nexus.verifiedSources") || "Verificadas"})</span>
          </div>

          <div className="space-y-3 font-interface">
            {article.sources.map((src, i) => (
              <div key={i} className="p-4 rounded-xl bg-white dark:bg-[#111D3D] border border-[#DCE3EA] dark:border-[#1E2D5A] text-xs space-y-1.5 shadow-2xs">
                <span className="font-semibold text-[#14283F] dark:text-white block text-sm">{src.title}</span>
                <span className="text-[#475569] dark:text-slate-400 block leading-relaxed">
                  Autores: {src.authors} • Ano: {src.year} {src.journal ? `• ${src.journal}` : ""}
                </span>
                {src.doi && (
                  <span className="text-[#087E8B] dark:text-teal-400 font-technical text-[11px] block tracking-wide">
                    DOI: {src.doi}
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* SEÇÃO DE COMENTÁRIOS E DISCUSSÕES CONSTRUTIVAS */}
      <section className="pt-6 border-t border-[#DCE3EA] dark:border-[#1E2D5A] space-y-6 font-interface">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-[#087E8B] dark:text-teal-400" />
            <h3 className="font-editorial text-lg font-bold text-[#14283F] dark:text-white">
              {t("nexus.constructiveDiscussion") || "Discussão Construtiva"} ({comments.length})
            </h3>
          </div>
          <span className="text-xs text-[#475569] dark:text-slate-400">{t("nexus.activeModeration") || "Moderação ativa do ecossistema"}</span>
        </div>

        {/* FORMULÁRIO DE COMENTÁRIO OU CONVITE PARA INICIAR SESSÃO */}
        {!isAuthenticated ? (
          <div className="p-5 rounded-2xl bg-white dark:bg-[#111D3D] border border-[#DCE3EA] dark:border-[#1E2D5A] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <span className="font-semibold text-sm text-[#14283F] dark:text-white block">
                Participe nesta discussão fundamentada
              </span>
              <p className="text-xs text-[#475569] dark:text-slate-400">
                Inicie sessão na sua conta MustInfo para comentar, reagir e guardar este artigo.
              </p>
            </div>
            <button
              type="button"
              onClick={() => openLoginModal()}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#087E8B] hover:bg-[#066570] text-white transition-all shadow-xs shrink-0 cursor-pointer"
            >
              Iniciar Sessão
            </button>
          </div>
        ) : (
          <form onSubmit={handleAddComment} className="space-y-3 bg-white dark:bg-[#111D3D] p-5 rounded-2xl border border-[#DCE3EA] dark:border-[#1E2D5A] shadow-xs">
            <textarea
              rows={3}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder={t("nexus.commentPlaceholderAuth") || "Contribua com uma observação fundamentada ou dúvida..."}
              className="w-full p-3.5 rounded-xl bg-[#F4F7FA] dark:bg-[#0B132B] border border-[#DCE3EA] dark:border-[#1E2D5A] focus:border-[#087E8B] focus:ring-1 focus:ring-[#087E8B] text-xs sm:text-sm text-[#14283F] dark:text-white placeholder-[#475569]/70 dark:placeholder-slate-400 outline-none transition-all resize-none"
            />

            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-[11px] text-[#475569] dark:text-slate-400">
                {t("nexus.guidelinesNotice") || "Discussões devem respeitar a clareza e as diretrizes do Nexus Cognitiva."}
              </span>
              <button
                type="submit"
                disabled={!newComment.trim() || isSubmittingComment}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#087E8B] hover:bg-[#066570] text-white transition-all flex items-center gap-1.5 disabled:opacity-40 disabled:pointer-events-none cursor-pointer shadow-xs"
              >
                <Send className={`w-3.5 h-3.5 ${isSubmittingComment ? "animate-pulse" : ""}`} />
                <span>{isSubmittingComment ? (t("nexus.commenting") || "A publicar...") : (t("nexus.btnComment") || "Publicar Comentário")}</span>
              </button>
            </div>
          </form>
        )}

        {/* LISTA DE COMENTÁRIOS */}
        <div className="space-y-3">
          {isLoadingComments ? (
            <div className="p-8 text-center text-[#475569] dark:text-slate-400 flex items-center justify-center gap-2 text-xs">
              <Loader2 className="w-4 h-4 animate-spin text-[#087E8B] dark:text-teal-400" />
              <span>{t("nexus.loadingComments") || "A carregar discussão..."}</span>
            </div>
          ) : comments.length === 0 ? (
            <div className="py-10 px-4 text-center rounded-2xl bg-white dark:bg-[#111D3D] border border-dashed border-[#DCE3EA] dark:border-[#1E2D5A] space-y-2">
              <MessageSquare className="w-8 h-8 text-slate-400 mx-auto opacity-40" />
              <p className="text-sm font-semibold text-[#14283F] dark:text-white">
                {t("nexus.noCommentsYet") || "Ainda não existem comentários neste artigo."}
              </p>
              <p className="text-xs text-[#475569] dark:text-slate-400 max-w-sm mx-auto">
                {t("nexus.beFirstToComment") || "Seja o primeiro a contribuir com uma observação fundamentada ou dúvida!"}
              </p>
            </div>
          ) : (
            comments.map((c) => (
              <div key={c.id} className="p-4 rounded-xl bg-white dark:bg-[#111D3D] border border-[#DCE3EA] dark:border-[#1E2D5A] space-y-2 text-xs shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    {c.authorAvatar ? (
                      <img src={c.authorAvatar} alt={c.authorName} className="w-7 h-7 rounded-full object-cover border border-[#DCE3EA] dark:border-slate-700" />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-slate-700 dark:text-slate-200 text-xs">
                        {c.authorName ? c.authorName[0] : "U"}
                      </div>
                    )}
                    <div>
                      <span className="font-semibold text-[#14283F] dark:text-white block text-sm">{c.authorName}</span>
                      <span className="text-[11px] text-[#475569] dark:text-slate-400">{c.authorRole} • {c.date}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleCommentLike(c.id)}
                    className={`flex items-center gap-1.5 px-2 py-1 rounded-md transition-all cursor-pointer ${
                      c.isLiked
                        ? "text-[#087E8B] dark:text-teal-400 font-semibold bg-teal-50 dark:bg-teal-950/30"
                        : "text-[#475569] dark:text-slate-400 hover:text-[#087E8B] dark:hover:text-teal-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                    }`}
                  >
                    <ThumbsUp className={`w-3.5 h-3.5 ${c.isLiked ? "fill-current" : ""}`} />
                    <span>{c.likes}</span>
                  </button>
                </div>
                <p className="text-[#14283F] dark:text-slate-300 leading-relaxed text-sm pt-1 whitespace-pre-wrap">{c.text}</p>
              </div>
            ))
          )}
        </div>
      </section>

      {/* MODAL DE PARTILHA */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        postId={article.id}
        title={article.title}
        summary={article.summary}
      />
    </article>
  );
}

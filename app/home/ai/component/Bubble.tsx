"use client";

import { forwardRef, useState, useCallback } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/cjs/styles/prism";
import { ChatMessage } from "../types";
import { useI18n } from "@/context/I18nContext";

type BubbleProps = {
  content: ChatMessage;
  setResponder?: (text: string) => void;
  setReplay?: (text: string) => void;
  onEdit?: (text: string) => void;
};

/* ─── Copy Button ─────────────────────────────────────────────────────────── */
function CopyButton({ text, compact = false }: { text: string; compact?: boolean }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { }
  };

  return (
    <button
      onClick={handleCopy}
      title="Copiar"
      className={`inline-flex items-center gap-1 rounded-lg text-xs font-medium transition-all duration-200
        ${compact ? "p-1.5" : "px-2.5 py-1.5"}
        ${copied
          ? "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/15"
          : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-black/5 dark:hover:bg-white/8"
        }`}
    >
      {copied ? (
        <>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          {!compact && "Copiado"}
        </>
      ) : (
        <>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
          {!compact && "Copiar"}
        </>
      )}
    </button>
  );
}

/* ─── Icon Button ─────────────────────────────────────────────────────────── */
function IconButton({
  onClick,
  title,
  active = false,
  activeClass = "",
  children,
}: {
  onClick?: () => void;
  title: string;
  active?: boolean;
  activeClass?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`p-1.5 rounded-lg transition-all duration-200 active:scale-90
        ${active
          ? activeClass
          : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-black/5 dark:hover:bg-white/8"
        }`}
    >
      {children}
    </button>
  );
}

/* ─── Typing dots ─────────────────────────────────────────────────────────── */
function TypingDots() {
  return (
    <div className="flex gap-1.5 items-center h-5 px-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-500 animate-bounce"
          style={{ animationDelay: `${i * 0.15}s`, animationDuration: "0.9s" }}
        />
      ))}
    </div>
  );
}

/* ─── Bubble ──────────────────────────────────────────────────────────────── */
const Bubble = forwardRef<HTMLDivElement, BubbleProps>(
  ({ content, setResponder, setReplay, onEdit }, ref) => {
    const isUser = content.role === "user";
    const isSystem = content.role === "system";
    const [reaction, setReaction] = useState<"like" | "unlike" | null>(null);
    const [showActions, setShowActions] = useState(false);
    const { t } = useI18n();

    const handleReaction = useCallback((type: "like" | "unlike") => {
      setReaction((prev) => (prev === type ? null : type));
    }, []);

    const timestamp = content?.timestamp
      ? content.timestamp?.toLocaleTimeString?.("pt-PT", { hour: "2-digit", minute: "2-digit" })
      : new Date().toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" });

    /* System message */
    if (isSystem) {
      return (
        <div className="flex justify-center my-3">
          <span className="text-[11px] text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-zinc-800/80 px-4 py-1.5 rounded-full border border-gray-200/60 dark:border-zinc-700/60 tracking-wide">
            {content.content}
          </span>
        </div>
      );
    }

    return (
      <div
        ref={ref}
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
        className={`flex w-full mt-5 items-end gap-2.5 ${isUser ? "flex-row-reverse justify-start" : "flex-row justify-start"
          }`}
      >
        {/* Avatar */}
        {isUser ? (
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-gray-200 to-gray-300 dark:from-zinc-600 dark:to-zinc-700 flex items-center justify-center text-gray-600 dark:text-gray-300 text-xs font-bold flex-shrink-0 mb-6 shadow-sm">
            Tu
          </div>
        ) : (
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold text-[13px] flex-shrink-0 mb-6 shadow-md shadow-blue-500/20 ring-2 ring-blue-400/20">
            F
          </div>
        )}

        {/* Column */}
        <div
          className={`flex flex-col min-w-0 max-w-[78%] md:max-w-[68%] ${isUser ? "items-end ml-auto" : "items-start mr-auto"
            }`}
        >
          {/* Bubble */}
          <div
            className={`px-5 py-3 text-sm leading-relaxed min-w-0 w-full overflow-hidden
              ${isUser
                ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl rounded-br-md shadow-md shadow-blue-500/25"
                : "bg-white dark:bg-zinc-800 text-gray-800 dark:text-gray-100 rounded-2xl rounded-bl-md border border-gray-200/70 dark:border-zinc-700/60 shadow-sm"
              }`}
          >
            {content.processing ? (
              <TypingDots />
            ) : (
              <div
                className={`prose prose-sm max-w-full break-words whitespace-pre-wrap overflow-hidden ${isUser ? "prose-invert" : "dark:prose-invert"
                  }`}
              >
                <Markdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    code({ children, className, ...props }) {
                      const match = /language-(\w+)/.exec(className || "");
                      if (match) {
                        return (
                          <div className="rounded-xl overflow-hidden my-3 text-xs shadow-lg not-prose ring-1 ring-white/10">
                            <div className="flex items-center justify-between px-3 py-2 bg-zinc-800 dark:bg-zinc-900 text-zinc-400">
                              <span className="text-[10px] font-mono uppercase tracking-widest font-semibold text-zinc-500">
                                {match[1]}
                              </span>
                              <CopyButton text={String(children)} compact />
                            </div>
                            <SyntaxHighlighter
                              {...(props as any)}
                              PreTag="div"
                              language={match[1]}
                              style={vscDarkPlus as any}
                              customStyle={{
                                margin: 0,
                                borderRadius: 0,
                                fontSize: "12px",
                                background: "#1a1a2e",
                                whiteSpace: "pre-wrap",
                                wordBreak: "break-word",
                                overflowX: "auto",
                              }}
                            >
                              {String(children).replace(/\n$/, "")}
                            </SyntaxHighlighter>
                          </div>
                        );
                      }
                      return (
                        <code
                          className={`px-1.5 py-0.5 rounded-md text-[11px] font-mono
                            ${isUser
                              ? "bg-white/20 text-white"
                              : "bg-gray-100 dark:bg-zinc-700 text-gray-800 dark:text-gray-200"
                            }`}
                        >
                          {children}
                        </code>
                      );
                    },
                    p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                    ul: ({ children }) => (
                      <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>
                    ),
                    ol: ({ children }) => (
                      <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>
                    ),
                    li: ({ children }) => <li className="text-sm">{children}</li>,
                    strong: ({ children }) => (
                      <strong className="font-semibold">{children}</strong>
                    ),
                  }}
                >
                  {content.content || "…"}
                </Markdown>
              </div>
            )}
          </div>

          {/* Timestamp */}
          <span className="text-[10px] text-gray-400 dark:text-gray-500 mt-1.5 mx-1.5 tabular-nums">
            {timestamp}
          </span>

          {/* Actions — bot */}
          {!isUser && !content.processing && (
            <div
              className={`flex items-center gap-0.5 mt-0.5 ml-0.5 transition-all duration-200
                ${showActions
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-1 pointer-events-none"
                }`}
            >
              <IconButton
                onClick={() => handleReaction("like")}
                title="Útil"
                active={reaction === "like"}
                activeClass="text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/15"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill={reaction === "like" ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
                </svg>
              </IconButton>

              <IconButton
                onClick={() => handleReaction("unlike")}
                title="Não útil"
                active={reaction === "unlike"}
                activeClass="text-red-500 bg-red-50 dark:bg-red-500/15"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill={reaction === "unlike" ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-2" />
                </svg>
              </IconButton>

              <CopyButton text={content.content || ""} />

              <IconButton
                onClick={() => setReplay?.(content.content || "")}
                title="Tentar novamente"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="1 4 1 10 7 10" />
                  <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                </svg>
              </IconButton>
            </div>
          )}

          {/* Actions — user */}
          {isUser && !content.processing && (
            <div
              className={`flex items-center gap-0.5 mt-0.5 mr-0.5 transition-all duration-200
                ${showActions
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-1 pointer-events-none"
                }`}
            >
              <button
                onClick={() => onEdit?.(content.content || "")}
                title="Editar mensagem"
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-black/5 dark:hover:bg-white/8 transition-all duration-200"
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                {t("actions.edit")}
              </button>
              <CopyButton text={content.content || ""} />
            </div>
          )}
        </div>
      </div>
    );
  }
);

Bubble.displayName = "Bubble";
export default Bubble;
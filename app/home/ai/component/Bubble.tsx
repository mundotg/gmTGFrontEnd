"use client";

import { forwardRef, useState, useCallback, useRef } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/cjs/styles/prism";

export type MessageRole = "user" | "assistant" | "system";

type BubbleProps = {
  content: {
    role: MessageRole;
    content?: string;
    processing?: boolean;
    url?: string;
    timestamp?: Date;
  };
  setResponder?: (text: string) => void;
  setReplay?: (text: string) => void;
  onEdit?: (text: string) => void;
};

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <button
      onClick={handleCopy}
      title="Copiar"
      className={`action-btn flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-all
        ${copied
          ? "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-500/10"
          : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-700"
        }`}
    >
      {copied ? (
        <>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          Copiado
        </>
      ) : (
        <>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
          Copiar
        </>
      )}
    </button>
  );
}

const Bubble = forwardRef<HTMLDivElement, BubbleProps>(
  ({ content, setResponder, setReplay, onEdit }, ref) => {
    const isUser = content.role === "user";
    const isSystem = content.role === "system";
    const [reaction, setReaction] = useState<"like" | "unlike" | null>(null);
    const [showActions, setShowActions] = useState(false);

    const handleReaction = useCallback((type: "like" | "unlike") => {
      setReaction((prev) => (prev === type ? null : type));
    }, []);

    const timestamp = content.timestamp
      ? content.timestamp.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })
      : new Date().toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" });

    if (isSystem) {
      return (
        <div className="flex justify-center my-2">
          <span className="text-xs text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-zinc-800 px-3 py-1 rounded-full">
            {content.content}
          </span>
        </div>
      );
    }

    return (
      <div
        ref={ref}
        className={`group flex w-full mt-4 ${isUser ? "justify-end" : "justify-start"} items-end gap-2`}
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
      >
        {/* Avatar do bot */}
        {!isUser && (
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0 mb-1 shadow-sm">
            F
          </div>
        )}

        <div className={`flex flex-col ${isUser ? "items-end" : "items-start"} max-w-[82%] md:max-w-[72%]`}>
          {/* Bolha */}
          <div
            className={`relative px-4 py-3 text-sm leading-relaxed shadow-sm
              ${isUser
                ? "bg-blue-600 text-white rounded-2xl rounded-br-sm"
                : "bg-gray-100 dark:bg-zinc-800 text-gray-800 dark:text-gray-100 rounded-2xl rounded-bl-sm border border-gray-200/60 dark:border-zinc-700/60"
              }`}
          >
            {content.processing ? (
              <div className="flex gap-1.5 items-center h-5 w-10">
                <span className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" />
                <span className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce [animation-delay:0.15s]" />
                <span className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce [animation-delay:0.3s]" />
              </div>
            ) : (
              <div className={`prose prose-sm max-w-none ${isUser ? "prose-invert" : "dark:prose-invert"}`}>
                <Markdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    code({ children, className, ...props }) {
                      const match = /language-(\w+)/.exec(className || "");
                      if (match) {
                        return (
                          <div className="rounded-xl overflow-hidden my-3 text-xs shadow-md not-prose">
                            <div className="flex items-center justify-between px-3 py-1.5 bg-zinc-700 text-zinc-300">
                              <span className="text-[10px] font-mono uppercase tracking-wider">{match[1]}</span>
                              <CopyButton text={String(children)} />
                            </div>
                            <SyntaxHighlighter
                              {...(props as any)}
                              PreTag="div"
                              language={match[1]}
                              style={vscDarkPlus as any}
                              customStyle={{ margin: 0, borderRadius: 0, fontSize: "12px" }}
                            >
                              {String(children).replace(/\n$/, "")}
                            </SyntaxHighlighter>
                          </div>
                        );
                      }
                      return (
                        <code
                          className={`px-1.5 py-0.5 rounded text-[11px] font-mono
                            ${isUser ? "bg-white/20 text-white" : "bg-black/8 dark:bg-white/10 text-gray-800 dark:text-gray-200"}`}
                        >
                          {children}
                        </code>
                      );
                    },
                    p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                    ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
                    li: ({ children }) => <li className="text-sm">{children}</li>,
                    strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                  }}
                >
                  {content.content || "…"}
                </Markdown>
              </div>
            )}
          </div>

          {/* Timestamp */}
          <span className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 mx-1">
            {timestamp}
          </span>

          {/* Ações — bot */}
          {!isUser && !content.processing && (
            <div
              className={`flex items-center gap-0.5 mt-0.5 ml-0.5 transition-opacity duration-150
                ${showActions ? "opacity-100" : "opacity-0"}`}
            >
              {/* Like */}
              <button
                onClick={() => handleReaction("like")}
                title="Útil"
                className={`p-1.5 rounded-md transition-all
                  ${reaction === "like"
                    ? "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-500/10"
                    : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-700"
                  }`}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill={reaction === "like" ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                  <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
                </svg>
              </button>

              {/* Dislike */}
              <button
                onClick={() => handleReaction("unlike")}
                title="Não útil"
                className={`p-1.5 rounded-md transition-all
                  ${reaction === "unlike"
                    ? "text-red-500 bg-red-50 dark:bg-red-500/10"
                    : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-700"
                  }`}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill={reaction === "unlike" ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                  <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-2" />
                </svg>
              </button>

              {/* Copiar */}
              <CopyButton text={content.content || ""} />

              {/* Retry */}
              <button
                onClick={() => setReplay?.(content.content || "")}
                title="Tentar novamente"
                className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-700 transition-all"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="1 4 1 10 7 10" />
                  <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                </svg>
              </button>
            </div>
          )}

          {/* Ações — user */}
          {isUser && !content.processing && (
            <div
              className={`flex items-center gap-0.5 mt-0.5 mr-0.5 transition-opacity duration-150
                ${showActions ? "opacity-100" : "opacity-0"}`}
            >
              <button
                onClick={() => onEdit?.(content.content || "")}
                title="Editar mensagem"
                className="flex items-center gap-1 px-2 py-1 rounded-md text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-700 transition-all"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                Editar
              </button>
              <CopyButton text={content.content || ""} />
            </div>
          )}
        </div>

        {/* Avatar do user */}
        {isUser && (
          <div className="w-7 h-7 rounded-lg bg-gray-200 dark:bg-zinc-700 flex items-center justify-center text-gray-500 dark:text-gray-400 text-xs font-semibold flex-shrink-0 mb-1">
            Tu
          </div>
        )}
      </div>
    );
  }
);

Bubble.displayName = "Bubble";
export default Bubble;
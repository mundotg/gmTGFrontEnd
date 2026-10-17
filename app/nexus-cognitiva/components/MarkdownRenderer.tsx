"use client";

import React, { useState } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/cjs/styles/prism";
import { Check, Copy } from "lucide-react";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

function CodeCopyButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(code);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = code;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.warn("Falha ao copiar código:", e);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all duration-200 cursor-pointer ${
        copied
          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
          : "bg-white/10 text-slate-300 hover:text-white hover:bg-white/15 border border-white/10"
      }`}
      title="Copiar código"
    >
      {copied ? (
        <>
          <Check className="w-3.5 h-3.5 text-emerald-400" />
          <span>Copiado</span>
        </>
      ) : (
        <>
          <Copy className="w-3.5 h-3.5" />
          <span>Copiar</span>
        </>
      )}
    </button>
  );
}

export function MarkdownRenderer({ content, className = "" }: MarkdownRendererProps) {
  if (!content || !content.trim()) {
    return null;
  }

  return (
    <div className={`nexus-markdown space-y-4 ${className}`}>
      <Markdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="font-editorial text-2xl sm:text-3xl font-bold text-[#14283F] dark:text-white mt-8 mb-4 border-b border-[#DCE3EA] dark:border-[#1E2D5A] pb-2 leading-tight">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="font-editorial text-xl sm:text-2xl font-bold text-[#14283F] dark:text-white mt-7 mb-3 leading-snug">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="font-editorial text-lg sm:text-xl font-semibold text-[#14283F] dark:text-slate-100 mt-6 mb-2 leading-snug">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="font-editorial text-base sm:text-lg font-semibold text-[#14283F] dark:text-slate-200 mt-5 mb-2">
              {children}
            </h4>
          ),
          p: ({ children }) => (
            <p className="font-editorial text-[17px] sm:text-[18px] text-[#14283F] dark:text-slate-200 leading-[1.8] mb-4 font-normal">
              {children}
            </p>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-[#14283F] dark:text-white">
              {children}
            </strong>
          ),
          em: ({ children }) => (
            <em className="italic text-[#14283F] dark:text-slate-200">
              {children}
            </em>
          ),
          ul: ({ children }) => (
            <ul className="list-disc list-outside ml-6 mb-4 space-y-2 text-[#14283F] dark:text-slate-200 font-editorial text-[16px] sm:text-[17px] leading-relaxed">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-outside ml-6 mb-4 space-y-2 text-[#14283F] dark:text-slate-200 font-editorial text-[16px] sm:text-[17px] leading-relaxed">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="pl-1">
              {children}
            </li>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-[#087E8B] dark:border-teal-400 bg-teal-50/40 dark:bg-teal-950/20 py-3 px-5 my-5 rounded-r-xl italic text-[#14283F] dark:text-slate-200 font-editorial text-[17px] leading-relaxed shadow-2xs">
              {children}
            </blockquote>
          ),
          hr: () => (
            <hr className="border-[#DCE3EA] dark:border-[#1E2D5A] my-8" />
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#087E8B] dark:text-teal-400 font-medium underline underline-offset-2 hover:text-[#066570] dark:hover:text-teal-300 transition-colors"
            >
              {children}
            </a>
          ),
          img: ({ src, alt }) => (
            <span className="block my-6 overflow-hidden rounded-xl border border-[#DCE3EA] dark:border-[#1E2D5A] shadow-xs">
              <img src={src} alt={alt || ""} className="w-full h-auto max-h-[500px] object-cover" />
              {alt && (
                <span className="block p-2 text-center text-xs text-[#475569] dark:text-slate-400 bg-slate-50 dark:bg-slate-900 border-t border-[#DCE3EA] dark:border-[#1E2D5A] font-interface">
                  {alt}
                </span>
              )}
            </span>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto my-6 rounded-xl border border-[#DCE3EA] dark:border-[#1E2D5A] shadow-2xs">
              <table className="w-full border-collapse text-sm font-interface text-left">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-[#F8FAFC] dark:bg-[#0B132B] text-[#14283F] dark:text-white font-semibold border-b border-[#DCE3EA] dark:border-[#1E2D5A]">
              {children}
            </thead>
          ),
          tbody: ({ children }) => (
            <tbody className="divide-y divide-[#DCE3EA] dark:divide-[#1E2D5A] bg-white dark:bg-[#111D3D]">
              {children}
            </tbody>
          ),
          tr: ({ children }) => (
            <tr className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
              {children}
            </tr>
          ),
          th: ({ children }) => (
            <th className="px-4 py-3 font-semibold text-xs tracking-wide text-[#14283F] dark:text-slate-200">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-4 py-3 text-sm text-[#475569] dark:text-slate-300">
              {children}
            </td>
          ),
          code({ className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || "");
            const isInline = !match && !String(children).includes("\n");

            if (isInline) {
              return (
                <code
                  className="px-1.5 py-0.5 rounded-md text-xs font-mono font-medium bg-slate-100 dark:bg-[#0B132B] text-[#087E8B] dark:text-teal-300 border border-slate-200 dark:border-slate-800"
                  {...props}
                >
                  {children}
                </code>
              );
            }

            const language = match ? match[1] : "plaintext";
            const codeString = String(children).replace(/\n$/, "");

            return (
              <div className="rounded-xl overflow-hidden my-5 text-xs shadow-lg border border-slate-800/60 font-mono">
                <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800 text-slate-400">
                  <span className="text-[11px] font-mono uppercase tracking-wider font-semibold text-slate-400">
                    {language}
                  </span>
                  <CodeCopyButton code={codeString} />
                </div>
                <SyntaxHighlighter
                  {...(props as any)}
                  PreTag="div"
                  language={language}
                  style={vscDarkPlus as any}
                  customStyle={{
                    margin: 0,
                    padding: "16px",
                    borderRadius: 0,
                    fontSize: "13px",
                    lineHeight: "1.6",
                    background: "#0c1021",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    overflowX: "auto",
                  }}
                >
                  {codeString}
                </SyntaxHighlighter>
              </div>
            );
          },
        }}
      >
        {content}
      </Markdown>
    </div>
  );
}
export default MarkdownRenderer;

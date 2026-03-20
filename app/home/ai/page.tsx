"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Bubble, { MessageRole } from "./component/Bubble";
import { processarPrompt } from "@/util/actions";
import Configure from "./component/Configure";
import PromptSuggestionRow from "./component/PromptSuggestionsRow";
import useConfiguration from "./component/useConfiguration";

type ChatMessage = {
  id: string;
  role: MessageRole;
  content: string;
  processing?: boolean;
  timestamp: Date;
};

export default function Home() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeChip, setActiveChip] = useState("");
  const [configureOpen, setConfigureOpen] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  const { useRag, llm, similarityMetric, setConfiguration, trainingMode, normalMode, criticalMode } =
    useConfiguration();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, scrollToBottom]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const onScroll = () => {
      const distFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
      setShowScrollBtn(distFromBottom > 120);
    };
    container.addEventListener("scroll", onScroll);
    return () => container.removeEventListener("scroll", onScroll);
  }, []);

  const autoResize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 128) + "px";
  }, []);

  const handleSend = useCallback(
    async (e?: React.FormEvent) => {
      if (e) e.preventDefault();
      const text = input.trim();
      if (!text || isLoading) return;

      const userMsg: ChatMessage = {
        id: crypto.randomUUID(),
        content: text,
        role: "user",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setActiveChip("");
      setIsLoading(true);

      if (textareaRef.current) textareaRef.current.style.height = "auto";

      try {
        const resultado = await processarPrompt(text);
        const aiMsg: ChatMessage = {
          id: crypto.randomUUID(),
          content: resultado.erro ? `Erro: ${resultado.erro}` : resultado.resposta,
          role: resultado.erro ? "system" : "assistant",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, aiMsg]);
      } catch (error) {
        console.error("Erro na chamada:", error);
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            content: "Ocorreu um erro ao processar a tua mensagem. Tenta novamente.",
            role: "system",
            timestamp: new Date(),
          },
        ]);
      } finally {
        setIsLoading(false);
        textareaRef.current?.focus();
      }
    },
    [input, isLoading]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const handlePromptClick = useCallback((text: string) => {
    setInput(text);
    setActiveChip(text);
    textareaRef.current?.focus();
    setTimeout(() => autoResize(), 0);
  }, [autoResize]);

  const handleEdit = useCallback((text: string) => {
    setInput(text);
    textareaRef.current?.focus();
    setTimeout(() => {
      autoResize();
      if (textareaRef.current) {
        const len = textareaRef.current.value.length;
        textareaRef.current.setSelectionRange(len, len);
      }
    }, 0);
  }, [autoResize]);

  const handleClearChat = useCallback(() => {
    if (messages.length === 0) return;
    if (!confirm("Limpar toda a conversa?")) return;
    setMessages([]);
    setActiveChip("");
    setInput("");
  }, [messages.length]);

  const isEmpty = messages.length === 0 && !isLoading;

  return (
    <main className="flex flex-col items-center w-full h-screen bg-gray-50 dark:bg-zinc-950 overflow-hidden">
      <Configure
        isOpen={configureOpen}
        onClose={() => setConfigureOpen(false)}
        useRag={useRag}
        llm={llm}
        similarityMetric={similarityMetric}
        setConfiguration={setConfiguration}
        trainingMode={trainingMode}
        normalMode={normalMode}
        criticalMode={criticalMode}
      />

      <section className="flex flex-col w-full max-w-3xl h-full relative">
        {/* Header */}
        <header className="flex justify-between items-center px-4 py-3 border-b border-gray-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md z-10 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-sm">F</div>
            <div>
              <h1 className="text-sm font-semibold text-gray-800 dark:text-gray-100 leading-tight">FrancysBot</h1>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                <span className="text-[11px] text-green-600 dark:text-green-400 font-medium">online</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {messages.length > 0 && (
              <button onClick={handleClearChat} title="Limpar conversa" className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-xl transition-colors">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
              </button>
            )}
            <button onClick={() => setConfigureOpen(true)} title="Configurações" className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-xl transition-colors">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
            </button>
          </div>
        </header>

        {/* Messages */}
        <div ref={messagesContainerRef} className="flex-1 overflow-y-auto px-4 md:px-6 pb-4 pt-4 scroll-smooth">
          {isEmpty ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 py-8 animate-in fade-in duration-500">
              <div className="w-14 h-14 bg-blue-50 dark:bg-blue-950/50 rounded-2xl flex items-center justify-center mb-1">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="1.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Como posso ajudar?</h2>
              <p className="text-sm text-gray-400 dark:text-gray-500 text-center max-w-xs leading-relaxed">
                Escreve uma mensagem ou escolhe uma sugestão abaixo para começar.
              </p>
              <div className="w-full max-w-md mt-4">
                <PromptSuggestionRow onPromptClick={handlePromptClick} />
              </div>
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <Bubble
                  key={message.id}
                  content={message}
                  setResponder={setActiveChip}
                  setReplay={(text) => { setInput(text); textareaRef.current?.focus(); }}
                  onEdit={handleEdit}
                />
              ))}
              {isLoading && (
                <Bubble content={{ role: "assistant", processing: true, timestamp: new Date() }} />
              )}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Scroll to bottom btn */}
        {showScrollBtn && (
          <button
            onClick={() => scrollToBottom()}
            className="absolute bottom-28 right-4 md:right-6 w-9 h-9 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-full shadow-md flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-zinc-700 transition-all z-10 animate-in fade-in"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
          </button>
        )}

        {/* Input */}
        <div className="flex-shrink-0 px-4 md:px-6 py-3 border-t border-gray-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md">
          {activeChip && (
            <PromptSuggestionRow comment={activeChip} clearComment={() => setActiveChip("")} />
          )}
          <div className="flex items-end gap-2 p-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-2xl shadow-sm focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => { setInput(e.target.value); autoResize(); }}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              rows={1}
              style={{ resize: "none" }}
              className="flex-1 max-h-32 min-h-[24px] bg-transparent text-sm outline-none px-2 py-1.5 disabled:opacity-50 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 leading-relaxed"
              placeholder="Escreve uma mensagem… (Enter para enviar, Shift+Enter para nova linha)"
            />
            <div className="flex items-center gap-1 pb-1 pr-1">
              {input.length > 200 && (
                <span className={`text-[11px] font-mono ${input.length > 1800 ? "text-red-500" : "text-gray-400"}`}>
                  {input.length}/2000
                </span>
              )}
              <button type="button" title="Anexar ficheiro" className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-xl transition-colors">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
              </button>
              <button
                onClick={() => handleSend()}
                disabled={isLoading || !input.trim()}
                className="p-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 dark:disabled:bg-zinc-700 disabled:text-gray-400 dark:disabled:text-zinc-500 text-white rounded-xl transition-all disabled:cursor-not-allowed flex items-center justify-center shadow-sm hover:shadow-md active:scale-95"
              >
                {isLoading ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                )}
              </button>
            </div>
          </div>
          <p className="text-center text-[11px] text-gray-400 dark:text-gray-500 mt-2">
            O FrancysBot pode cometer erros. Confirma as informações geradas.
          </p>
        </div>
      </section>
    </main>
  );
}
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Bubble from "./component/Bubble";
import Configure from "./component/Configure";
import PromptSuggestionRow from "./component/PromptSuggestionsRow";
import useConfiguration from "./component/useConfiguration";
import { useSession } from "@/context/SessionContext";
import usePersistedState from "@/hook/localStoreUse";
import { ChatMessage, MessageRole, SessionItem } from "./types";
import { useI18n } from "@/context/I18nContext";
import Script from "next/script";


export default function Home() {
  const { user, api } = useSession();
  const { t } = useI18n();
  const [input, setInput] = usePersistedState<string>("chat_input", "");
  const [messages, setMessages] = usePersistedState<ChatMessage[]>("chat_messages", []);
  const [isLoading, setIsLoading] = useState(false);
  const [activeChip, setActiveChip] = usePersistedState<string>("active_chip", "");
  const [configureOpen, setConfigureOpen] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [sidebarOpen, setSidebarOpen] = usePersistedState<boolean>("sidebar_open", true);

  const streamBufferRef = useRef<string>("");
  const streamingIdRef = useRef<string | null>(null);
  const userScrolledRef = useRef(false);
  const isStreamingRef = useRef(false);

  const { useRag, llm, similarityMetric, setConfiguration, trainingMode, normalMode, criticalMode } =
    useConfiguration();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  }, []);

  useEffect(() => {
    if (!isStreamingRef.current) scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const onScroll = () => {
      const dist = container.scrollHeight - container.scrollTop - container.clientHeight;
      setShowScrollBtn(dist > 120);
      if (isStreamingRef.current) userScrolledRef.current = dist > 80;
    };
    container.addEventListener("scroll", onScroll, { passive: true });
    return () => container.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    api.get("/chat/sessions").then((res) => setSessions(res.data)).catch(() => { });
  }, []);

  const autoResize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  }, []);

  const createSession = async (title: string) => {
    const res = await api.post("/chat/session", { title: title.substring(0, 50) });
    setSessions((prev) => [{ id: res.data.id, title: res.data.title, createdAt: new Date() }, ...prev]);
    return res.data.id;
  };

  const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

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

      streamBufferRef.current = "";
      userScrolledRef.current = false;

      const aiMessageId = crypto.randomUUID();
      streamingIdRef.current = aiMessageId;

      setMessages((prev) => [
        ...prev,
        { id: aiMessageId, content: "", role: "assistant", timestamp: new Date() },
      ]);

      setTimeout(() => scrollToBottom("smooth"), 50);

      try {
        let currentSessionId = sessionId;
        if (!currentSessionId) {
          currentSessionId = await createSession(text);
          setSessionId(currentSessionId);
        }

        const res = await fetch(`${baseUrl}chat/send-stream/${currentSessionId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ content: text }),
        });

        if (!res.body) throw new Error("Sem stream");

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        isStreamingRef.current = true;

        let rafPending = false;
        const flushToState = () => {
          const content = streamBufferRef.current;
          setMessages((prev) =>
            prev.map((msg) => (msg.id === aiMessageId ? { ...msg, content } : msg))
          );
          rafPending = false;
          if (!userScrolledRef.current) {
            messagesEndRef.current?.scrollIntoView({ behavior: "instant" });
          }
        };

        let done = false;
        while (!done) {
          const { value, done: doneReading } = await reader.read();
          done = doneReading;
          if (value) {
            streamBufferRef.current += decoder.decode(value, { stream: true });
            if (!rafPending) {
              rafPending = true;
              requestAnimationFrame(flushToState);
            }
          }
        }

        const tail = decoder.decode();
        if (tail) streamBufferRef.current += tail;

        await new Promise<void>((resolve) => {
          requestAnimationFrame(() => { flushToState(); resolve(); });
        });
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            content: t("chat.errorApi"),
            role: "system" as MessageRole,
            timestamp: new Date(),
          },
        ]);
      } finally {
        isStreamingRef.current = false;
        streamingIdRef.current = null;
        setIsLoading(false);
        setTimeout(() => scrollToBottom("smooth"), 100);
      }
    },
    [input, isLoading, sessionId, scrollToBottom]
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

  const handlePromptClick = useCallback(
    (text: string) => {
      setInput(text);
      setActiveChip(text);
      textareaRef.current?.focus();
      setTimeout(() => autoResize(), 0);
    },
    [autoResize]
  );

  const handleEdit = useCallback(
    (text: string) => {
      setInput(text);
      textareaRef.current?.focus();
      setTimeout(() => {
        autoResize();
        if (textareaRef.current) {
          const len = textareaRef.current.value.length;
          textareaRef.current.setSelectionRange(len, len);
        }
      }, 0);
    },
    [autoResize]
  );

  const handleClearChat = useCallback(async () => {
    if (messages.length === 0) return;
    if (!confirm(t("chat.clearConfirm"))) return;
    if (sessionId) {
      try {
        await api.delete(`/chat/session/${sessionId}`);
        setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      } catch { }
    }
    setMessages([]);
    setSessionId(null);
    setActiveChip("");
    setInput("");
  }, [messages.length, sessionId, api]);

  const handleSelectSession = useCallback(
    async (session: SessionItem) => {
      try {
        const res = await api.get(`/chat/session/${session.id}`);
        setSessionId(session.id);
        setMessages(
          (res.data.messages || []).map((m: any) => ({
            id: m.id,
            role: m.role,
            content: m.content,
            timestamp: new Date(m.created_at),
          }))
        );
      } catch { }
    },
    [api]
  );

  const handleNewChat = useCallback(() => {
    setMessages([]);
    setSessionId(null);
    setInput("");
    setActiveChip("");
  }, []);

  const isEmpty = messages.length === 0 && !isLoading;

  const today = new Date();
  const todaySessions = sessions.filter((s) => new Date(s.createdAt).toDateString() === today.toDateString());
  const olderSessions = sessions.filter((s) => new Date(s.createdAt).toDateString() !== today.toDateString());

  return (
    <div className="chatMain  flex h-screen overflow-hidden bg-[#faf9f7]">
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

      {/* ─── Sidebar ──────────────────────────────────────────────────────── */}
      <aside
        className={`flex flex-col flex-shrink-0 bg-white border-r border-[#e0ddd8] transition-all duration-300 overflow-hidden ${sidebarOpen ? "w-64" : "w-0"
          }`}
      >
        {/* Brand */}
        <div className="flex-shrink-0 p-4 border-b border-[#e0ddd8]">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-9 h-9 bg-zinc-900 rounded-xl flex items-center justify-center text-white font-bold text-sm font-mono">
              F
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-900 leading-tight">FrancysBot</p>
              <p className="text-[11px] text-zinc-400">{t("chat.assistant")}</p>
            </div>
          </div>
          <button
            onClick={handleNewChat}
            className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-zinc-900 hover:bg-zinc-700 active:scale-[.98] text-white text-[13px] font-medium rounded-xl transition-all"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            {t("chat.newConversation")}
          </button>
        </div>

        {/* Session list */}
        <div className="flex-1 overflow-y-auto p-2">
          {todaySessions.length > 0 && (
            <>
              <p className="text-[10px] font-semibold tracking-widest text-zinc-400 uppercase px-2 pt-3 pb-1.5">{t("chat.today")}</p>
              {todaySessions.map((s) => (
                <button
                  key={s.id}
                  onClick={() => handleSelectSession(s)}
                  className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-left transition-colors ${sessionId === s.id ? "bg-zinc-100" : "hover:bg-zinc-50"
                    }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${sessionId === s.id ? "bg-blue-500" : "bg-zinc-300"}`} />
                  <span className={`text-[13px] truncate flex-1 ${sessionId === s.id ? "text-zinc-900 font-medium" : "text-zinc-500"}`}>
                    {s.title}
                  </span>
                </button>
              ))}
            </>
          )}
          {olderSessions.length > 0 && (
            <>
              <p className="text-[10px] font-semibold tracking-widest text-zinc-400 uppercase px-2 pt-3 pb-1.5">{t("chat.previous")}</p>
              {olderSessions.map((s) => (
                <button
                  key={s.id}
                  onClick={() => handleSelectSession(s)}
                  className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-left transition-colors ${sessionId === s.id ? "bg-zinc-100" : "hover:bg-zinc-50"
                    }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${sessionId === s.id ? "bg-blue-500" : "bg-zinc-300"}`} />
                  <span className={`text-[13px] truncate flex-1 ${sessionId === s.id ? "text-zinc-900 font-medium" : "text-zinc-500"}`}>
                    {s.title}
                  </span>
                </button>
              ))}
            </>
          )}
          {sessions.length === 0 && (
            <p className="text-[13px] text-zinc-400 text-center mt-8 px-4">{t("chat.noConversations")}</p>
          )}
        </div>

        {/* User footer */}
        <div className="flex-shrink-0 p-4 border-t border-[#e0ddd8]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-[11px] font-semibold text-zinc-600">
              {user?.nome?.[0]?.toUpperCase() ?? "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium text-zinc-900 truncate">{user?.nome ?? t("chat.user")}</p>
              <p className="text-[11px] text-zinc-400">{t("chat.planPro")}</p>
            </div>
            <button
              onClick={() => setConfigureOpen(true)}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06-.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </button>
          </div>
        </div>
      </aside>

      {/* ─── Main ─────────────────────────────────────────────────────────── */}
      <main className="chatbot-section flex flex-col flex-1 overflow-hidden min-w-0">
        <Script
          id="adsense-script"
          strategy="lazyOnload"
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6543986660141855"
          crossOrigin="anonymous"
        />
        {/* Topbar */}
        <header className="flex items-center gap-3 px-5 py-3 bg-white border-b border-[#e0ddd8] flex-shrink-0">
          <button
            onClick={() => setSidebarOpen((v) => !v)}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition-colors flex-shrink-0"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>

          <p className="flex-1 text-[14px] font-semibold text-zinc-900 truncate">
            {sessionId ? sessions.find((s) => s.id === sessionId)?.title ?? t("chat.conversation") : "FrancysBot"}
          </p>

          <span className="hidden sm:inline-flex items-center px-2.5 py-1 bg-zinc-100 text-zinc-500 text-[11px] font-mono rounded-lg border border-zinc-200">
            gemini-2.5-flash
          </span>

          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 rounded-full flex-shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] text-emerald-600 font-medium">{t("chat.online")}</span>
          </div>

          {messages.length > 0 && (
            <button
              onClick={handleClearChat}
              title={t("chat.clearConversation")}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-400 hover:bg-zinc-50 hover:text-zinc-600 transition-colors flex-shrink-0"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                <path d="M10 11v6M14 11v6M9 6V4h6v2" />
              </svg>
            </button>
          )}
        </header>

        {/* Messages — scrollable, centered content */}
        <div
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto w-full"
        >
          {isEmpty ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 py-8 px-1 animate-in fade-in duration-500">
              <div className="w-14 h-14 bg-zinc-100 rounded-2xl flex items-center justify-center mb-1">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#71717a" strokeWidth="1.5">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-zinc-900">{t("chat.howCanIHelp")}</h2>
              <p className="text-sm text-zinc-500 text-center max-w-xs leading-relaxed">
                {t("chat.startMessage")}
              </p>
              <div className="flex flex-wrap gap-2 justify-center max-w-lg mt-4">
                {[
                  t("chat.prompts.ml"),
                  t("chat.prompts.summarize"),
                  t("chat.prompts.code"),
                  t("chat.prompts.email"),
                  t("chat.prompts.data"),
                  t("chat.prompts.plan"),
                ].map((chip) => (
                  <button
                    key={chip}
                    onClick={() => handlePromptClick(chip)}
                    className="px-4 py-2 bg-white border border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 text-zinc-600 text-[13px] rounded-full transition-all hover:-translate-y-px hover:shadow-sm"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            // ↓ This wrapper is what centers the messages and caps the width
            <div className='flex items-center relative  my-4 md:my-6 dark:bg-black-2 bg-white shadow-2 w-full h-full'>
              <div className='absolute w-full'>
                {messages.map((message) => (
                  <Bubble
                    key={message.id}
                    content={message}
                    setResponder={setActiveChip}
                    setReplay={(text) => { setInput(text); textareaRef.current?.focus(); }}
                    onEdit={handleEdit}
                  />
                ))}
                {isLoading && !messages.find((m) => m.id === streamingIdRef.current && m.content) && (
                  <Bubble
                    ref={messagesEndRef}
                    content={{
                      id: "loading",
                      role: "assistant",
                      processing: true,
                      timestamp: new Date(),
                      content: "",
                    } as ChatMessage}
                  />
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>
          )}
        </div>

        {/* Scroll-to-bottom button — posicionado relativo ao main */}
        {showScrollBtn && (
          <div className="relative">
            <button
              onClick={() => {
                userScrolledRef.current = false;
                scrollToBottom();
              }}
              className="absolute bottom-4 right-6 w-9 h-9 bg-white border border-zinc-200 rounded-full shadow-md flex items-center justify-center text-zinc-500 hover:bg-zinc-50 transition-all z-10 animate-in fade-in -translate-y-full"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
          </div>
        )}

        {/* Input area */}
        <div className="flex-shrink-0 px-4 py-4 bg-white border-t border-[#e0ddd8]">
          <div className="w-full max-w-3xl mx-auto">
            {activeChip && (
              <div className="mb-2">
                <PromptSuggestionRow comment={activeChip} clearComment={() => setActiveChip("")} />
              </div>
            )}

            <div className="flex flex-col bg-[#f5f4f1] border border-zinc-200 rounded-2xl overflow-hidden focus-within:border-zinc-400 focus-within:ring-2 focus-within:ring-zinc-900/10 transition-all">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => { setInput(e.target.value); autoResize(); }}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
                rows={1}
                style={{ resize: "none" }}
                className="w-full max-h-40 min-h-6 bg-transparent text-[14px] outline-none px-4 pt-3.5 pb-2 disabled:opacity-50 text-zinc-900 placeholder-zinc-400 leading-relaxed"
                placeholder={t("chat.placeholder")}
              />
              <div className="flex items-center gap-2 px-3 pb-2.5">
                <button
                  type="button"
                  title={t("chat.attachFile")}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-200 hover:text-zinc-600 transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                  </svg>
                </button>

                <div className="flex-1" />

                {input.length > 200 && (
                  <span className={`text-[11px] font-mono tabular-nums ${input.length > 4500 ? "text-red-500" : "text-zinc-400"}`}>
                    {input.length}/13000s
                  </span>
                )}

                <button
                  onClick={() => handleSend()}
                  disabled={isLoading || !input.trim()}
                  className="w-8 h-8 bg-zinc-900 hover:bg-zinc-700 disabled:bg-zinc-200 disabled:cursor-not-allowed text-white disabled:text-zinc-400 rounded-xl flex items-center justify-center transition-all active:scale-95 shadow-sm"
                >
                  {isLoading ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin">
                      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                    </svg>
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="22" y1="2" x2="11" y2="13" />
                      <polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <p className="text-center text-[11px] text-zinc-400 mt-2">
              {t("chat.warning")}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
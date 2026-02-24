"use client";
import { useEffect, useState, useCallback, useRef, useMemo } from "react";

interface UseSSEStreamOptions {
  url: string;
  params?: Record<string, any>;
  autoStart?: boolean;
  autoRetry?: boolean;
  retryDelay?: number;
}

interface SSEStreamState {
  messages: string[];
  isRunning: boolean;
  error: string | null;
}

const MAX_MESSAGES = 400; // evita explodir memória

function pushLimited(prev: string[], msg: string) {
  const next = [...prev, msg];
  if (next.length <= MAX_MESSAGES) return next;
  return next.slice(next.length - MAX_MESSAGES);
}

export function useSSEStream({
  url,
  params = {},
  autoStart = false,
  autoRetry = true,
  retryDelay = 2000,
}: UseSSEStreamOptions) {
  const [state, setState] = useState<SSEStreamState>({
    messages: [],
    isRunning: false,
    error: null,
  });

  const eventSourceRef = useRef<EventSource | null>(null);
  const retryTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // marca se o fechamento foi intencional (cancel/done) para não auto-retry
  const manuallyStoppedRef = useRef(false);
  const startedOnceRef = useRef(false);

  // params estável (evita reconectar por causa de objetos novos a cada render)
  const stableParams = useMemo(() => params, [JSON.stringify(params)]);

  const buildUrl = useCallback(() => {
    const sp = new URLSearchParams();
    Object.entries(stableParams || {}).forEach(([k, v]) => {
      if (v === undefined || v === null) return;
      sp.set(k, String(v));
    });
    const qs = sp.toString();
    return qs ? `${url}?${qs}` : url;
  }, [url, stableParams]);

  const clearRetry = useCallback(() => {
    if (retryTimeout.current) {
      clearTimeout(retryTimeout.current);
      retryTimeout.current = null;
    }
  }, []);

  const stopStream = useCallback(() => {
    manuallyStoppedRef.current = true;

    clearRetry();
    eventSourceRef.current?.close();
    eventSourceRef.current = null;

    setState((prev) => ({
      ...prev,
      isRunning: false,
    }));
  }, [clearRetry]);

  const startStream = useCallback(() => {
    // sempre que inicia manualmente, não é "stopped"
    manuallyStoppedRef.current = false;

    clearRetry();
    eventSourceRef.current?.close();
    eventSourceRef.current = null;

    const streamUrl = buildUrl();
    setState({ messages: [], isRunning: true, error: null });

    const base = process.env.NEXT_PUBLIC_BACKEND_URL || "";
    const fullUrl = base + streamUrl;

    const es = new EventSource(fullUrl, { withCredentials: true });
    eventSourceRef.current = es;

    const pushMsg = (msg: string) => {
      setState((prev) => ({
        ...prev,
        messages: pushLimited(prev.messages, msg),
      }));
    };

    const endOk = (msg?: string) => {
      if (msg) pushMsg(msg);
      es.close();
      eventSourceRef.current = null;
      manuallyStoppedRef.current = true; // evita retry depois de done
      setState((prev) => ({ ...prev, isRunning: false }));
    };

    // ✅ Mensagem default (quando backend usa só `data:` sem `event:`)
    es.onmessage = (event) => {
      pushMsg(event.data);
    };

    // ✅ Eventos nomeados (quando backend usa `event: log/status/...`)
    es.addEventListener("status", (e) => {
      const data = (e as MessageEvent).data;
      pushMsg(`STATUS: ${data}`);
    });

    es.addEventListener("log", (e) => {
      const data = (e as MessageEvent).data;
      pushMsg(data);
    });

    es.addEventListener("warning", (e) => {
      const data = (e as MessageEvent).data;
      pushMsg(`⚠️ ${data}`);
    });

    // ⚠️ "error" é especial no EventSource:
    // - Existe o es.onerror (evento de transporte)
    // - E pode existir "event: error" vindo do servidor
    es.addEventListener("error", (e) => {
      const data = (e as MessageEvent).data;
      setState((prev) => ({ ...prev, error: data || "Erro no stream", isRunning: false }));
      // não fecha aqui automaticamente, deixa o es.onerror gerir o transporte
    });

    es.addEventListener("done", (e) => {
      const data = (e as MessageEvent).data;
      endOk(data || "done");
    });

    es.addEventListener("final", (e) => {
      const data = (e as MessageEvent).data;
      endOk(data || "final");
    });

    // ❌ erro de transporte / conexão
    es.onerror = () => {
      es.close();
      eventSourceRef.current = null;

      setState((prev) => ({
        ...prev,
        isRunning: false,
        error: prev.error ?? "Erro na conexão com o servidor",
      }));

      // retry só se não foi cancelado e não terminou (done/final)
      if (autoRetry && !manuallyStoppedRef.current) {
        retryTimeout.current = setTimeout(() => {
          startStream();
        }, retryDelay);
      }
    };

    startedOnceRef.current = true;
  }, [autoRetry, retryDelay, buildUrl, clearRetry]);

  useEffect(() => {
    if (autoStart && !startedOnceRef.current) startStream();

    return () => {
      stopStream();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // mantém o comportamento: só autoStart 1x no mount

  return {
    ...state,
    startStream,
    stopStream,
  };
}
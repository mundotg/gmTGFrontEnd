"use client";
import { useEffect, useState, useCallback, useRef } from "react";

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
  const retryTimeout = useRef<NodeJS.Timeout | null>(null);

  const buildUrl = useCallback(() => {
    const searchParams = new URLSearchParams(params as any);
    return `${url}?${searchParams.toString()}`;
  }, [url, params]);

  const stopStream = useCallback(() => {
    eventSourceRef.current?.close();
    if (retryTimeout.current) clearTimeout(retryTimeout.current);

    setState(prev => ({
      ...prev,
      isRunning: false,
    }));
  }, []);

  const startStream = useCallback(() => {
    stopStream();

    const streamUrl = buildUrl();
    setState({ messages: [], isRunning: true, error: null });

    const eventSource = new EventSource(
      process.env.NEXT_PUBLIC_BACKEND_URL + streamUrl,
      { withCredentials: true }
    );
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {

      console.log("Received message:", event.data);
      setState(prev => ({
        ...prev,
        messages: [...prev.messages, event.data],
      }));
    };

    eventSource.onerror = () => {
      eventSource.close();
      setState(prev => ({
        ...prev,
        isRunning: false,
        error: "Erro na conexão com o servidor",
      }));

      if (autoRetry) {
        retryTimeout.current = setTimeout(() => {
          startStream();
        }, retryDelay);
      }
    };

    eventSource.addEventListener("status", (e) => {
      const data = (e as MessageEvent).data;
      console.log("status:", data);
    });

    eventSource.addEventListener("log", (e) => {
      const data = (e as MessageEvent).data;
      console.log("log:", data);
      setState(prev => ({ ...prev, messages: [...prev.messages, data] }));
    });

    eventSource.addEventListener("warning", (e) => {
      const data = (e as MessageEvent).data;
      console.log("warning:", data);
    });

    eventSource.addEventListener("error", (e) => {
      const data = (e as MessageEvent).data;
      console.log("error:", data);
      setState(prev => ({ ...prev, error: data, isRunning: false }));
    });

    eventSource.addEventListener("done", (e) => {
      const data = (e as MessageEvent).data;
      console.log("done:", data);
      setState(prev => ({ ...prev, messages: [...prev.messages, data], isRunning: false }));
    });

    eventSource.addEventListener("final", (e) => {
      const data = (e as MessageEvent).data;
      console.log("final:", data);
    });

  }, [buildUrl, autoRetry, retryDelay, stopStream]);

  useEffect(() => {
    if (autoStart) startStream();

    return () => {
      stopStream();
    };
  }, []);

  return {
    ...state,
    startStream,
    stopStream,
  };
}

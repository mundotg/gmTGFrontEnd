"use client";

import { useCallback, useRef, useState } from "react";
import api from "@/context/axioCuston";
import { ClientEvent, TestKind } from "../types";

/**
 * Guarda uma sessão de cliente (WebSocket/SSE) no histórico da base de dados.
 * Os clientes correm no browser; no fim, a sessão é enviada para o backend
 * para ficar junto dos restantes testes.
 */
async function persistSession(
  kind: TestKind,
  targetUrl: string,
  label: string,
  status: string,
  finding: string | null,
  startedAt: number,
  events: ClientEvent[]
): Promise<void> {
  try {
    await api.post("/pentest/sessions", {
      kind,
      label: label || null,
      target_url: targetUrl,
      status,
      finding,
      started_at: new Date(startedAt).toISOString(),
      finished_at: new Date().toISOString(),
      attempts: events.map((e) => ({
        seq: e.seq,
        outcome: e.outcome,
        status_code: e.status_code ?? null,
        latency_ms: e.latency_ms,
        detail: e.detail,
        payload: e.payload,
      })),
    });
  } catch {
    // Persistência é best-effort — não deve partir a UI do teste.
  }
}

/* =========================
   Cliente WebSocket
========================= */
export function useWsClient() {
  const [connected, setConnected] = useState(false);
  const [events, setEvents] = useState<ClientEvent[]>([]);
  const [error, setError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const seqRef = useRef(0);
  const startedRef = useRef(0);
  const lastSentRef = useRef<number>(0);
  const urlRef = useRef("");
  const labelRef = useRef("");

  const push = useCallback((e: Omit<ClientEvent, "seq" | "ts">) => {
    seqRef.current += 1;
    setEvents((prev) => [...prev, { ...e, seq: seqRef.current, ts: Date.now() }]);
  }, []);

  const connect = useCallback(
    (url: string, label: string) => {
      setError(null);
      setEvents([]);
      seqRef.current = 0;
      startedRef.current = Date.now();
      urlRef.current = url;
      labelRef.current = label;

      try {
        const ws = new WebSocket(url);
        wsRef.current = ws;

        ws.onopen = () => {
          setConnected(true);
          push({ outcome: "success", latency_ms: 0, detail: "🔌 Ligado" });
        };
        ws.onmessage = (msg) => {
          // Latência de ida-e-volta desde o último envio.
          const rtt = lastSentRef.current ? Date.now() - lastSentRef.current : 0;
          lastSentRef.current = 0;
          push({
            outcome: "message",
            latency_ms: rtt,
            detail: typeof msg.data === "string" ? msg.data : "[binário]",
          });
        };
        ws.onerror = () => {
          setError("Erro na ligação WebSocket.");
          push({ outcome: "error", latency_ms: 0, detail: "⚠️ Erro na ligação" });
        };
        ws.onclose = (ev) => {
          setConnected(false);
          push({
            outcome: ev.wasClean ? "success" : "error",
            latency_ms: 0,
            detail: `🔻 Fechado (código ${ev.code})`,
          });
        };
      } catch (err) {
        setError((err as Error).message);
      }
    },
    [push]
  );

  const send = useCallback(
    (text: string) => {
      const ws = wsRef.current;
      if (!ws || ws.readyState !== WebSocket.OPEN) return;
      lastSentRef.current = Date.now();
      ws.send(text);
      push({ outcome: "message", latency_ms: 0, detail: `➡️ ${text}` });
    },
    [push]
  );

  const disconnect = useCallback(async () => {
    wsRef.current?.close();
    wsRef.current = null;
    setConnected(false);
    // Guarda a sessão (usa o snapshot atual de eventos).
    setEvents((current) => {
      persistSession(
        "websocket",
        urlRef.current,
        labelRef.current,
        "completed",
        `${current.length} evento(s) trocados`,
        startedRef.current,
        current
      );
      return current;
    });
  }, []);

  return { connected, events, error, connect, send, disconnect };
}

/* =========================
   Cliente SSE (EventStream)
========================= */
export function useSseClient() {
  const [connected, setConnected] = useState(false);
  const [events, setEvents] = useState<ClientEvent[]>([]);
  const [error, setError] = useState<string | null>(null);

  const esRef = useRef<EventSource | null>(null);
  const seqRef = useRef(0);
  const startedRef = useRef(0);
  const lastRef = useRef(0);
  const urlRef = useRef("");
  const labelRef = useRef("");

  const push = useCallback((e: Omit<ClientEvent, "seq" | "ts">) => {
    seqRef.current += 1;
    setEvents((prev) => [...prev, { ...e, seq: seqRef.current, ts: Date.now() }]);
  }, []);

  const connect = useCallback(
    (url: string, label: string) => {
      setError(null);
      setEvents([]);
      seqRef.current = 0;
      startedRef.current = Date.now();
      lastRef.current = Date.now();
      urlRef.current = url;
      labelRef.current = label;

      try {
        // withCredentials para enviar cookies de sessão a endpoints próprios.
        const es = new EventSource(url, { withCredentials: true });
        esRef.current = es;

        es.onopen = () => {
          setConnected(true);
          push({ outcome: "success", latency_ms: 0, detail: "📡 Subscrito" });
        };
        es.onmessage = (msg) => {
          const now = Date.now();
          const gap = now - lastRef.current;
          lastRef.current = now;
          push({ outcome: "message", latency_ms: gap, detail: msg.data });
        };
        es.onerror = () => {
          // O EventSource dispara onerror também ao reconectar; só reportamos.
          push({ outcome: "error", latency_ms: 0, detail: "⚠️ Erro/desconexão no stream" });
          setConnected(false);
        };
      } catch (err) {
        setError((err as Error).message);
      }
    },
    [push]
  );

  const disconnect = useCallback(async () => {
    esRef.current?.close();
    esRef.current = null;
    setConnected(false);
    setEvents((current) => {
      persistSession(
        "sse",
        urlRef.current,
        labelRef.current,
        "completed",
        `${current.length} evento(s) recebidos`,
        startedRef.current,
        current
      );
      return current;
    });
  }, []);

  return { connected, events, error, connect, disconnect };
}

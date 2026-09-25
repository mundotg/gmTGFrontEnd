"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const BACKEND = (process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000/").replace(
  /\/+$/,
  ""
);

/** http(s):// → ws(s):// */
function wsUrl(path: string): string {
  return `${BACKEND.replace(/^http/, "ws")}${path}`;
}

const MAX_MESSAGES = 400;

export interface TransferParams {
  id_connectio_origen?: number | string;
  id_connectio_distino?: number | string;
  tables_origen?: string;
}

/**
 * Transferência de dados por WebSocket.
 *
 * Ao contrário do SSE (que metia o payload no URL e rebentava em mapeamentos
 * grandes), o payload viaja na mensagem. Também permite **cancelar** a meio
 * (envia {action:"cancel"} ao servidor).
 *
 * API compatível com o useSSEStream que o form já usava: expõe
 * `messages`, `isRunning`, `error`, `startStream`, `stopStream`.
 */
export function useTransferWs(params: TransferParams) {
  const [messages, setMessages] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  // `params` mais recentes sem forçar recriação dos callbacks.
  const paramsRef = useRef(params);
  paramsRef.current = params;

  const push = useCallback((msg: string) => {
    setMessages((prev) => {
      const next = [...prev, msg];
      return next.length > MAX_MESSAGES ? next.slice(next.length - MAX_MESSAGES) : next;
    });
  }, []);

  const close = useCallback(() => {
    wsRef.current?.close();
    wsRef.current = null;
  }, []);

  const startStream = useCallback(() => {
    close();
    setMessages([]);
    setError(null);
    setIsRunning(true);

    const ws = new WebSocket(wsUrl("/transfer/ws"));
    wsRef.current = ws;

    ws.onopen = () => {
      const p = paramsRef.current;
      ws.send(
        JSON.stringify({
          id_connectio_origen: Number(p.id_connectio_origen) || 0,
          id_connectio_distino: Number(p.id_connectio_distino) || 0,
          tables_origen: p.tables_origen || "",
        })
      );
    };

    ws.onmessage = (evt) => {
      let data: { event?: string; data?: string };
      try {
        data = JSON.parse(evt.data);
      } catch {
        push(String(evt.data));
        return;
      }

      const { event, data: text = "" } = data;
      switch (event) {
        case "status":
          push(`STATUS: ${text}`);
          break;
        case "warning":
          push(text.startsWith("⚠️") ? text : `⚠️ ${text}`);
          break;
        case "error":
          setError(text || "Erro na transferência");
          push(`❌ ${text}`);
          break;
        case "done":
          push(text || "done");
          setIsRunning(false);
          break;
        case "final":
          if (text) push(text);
          setIsRunning(false);
          break;
        default:
          push(text);
      }
    };

    ws.onerror = () => {
      setError((prev) => prev ?? "Erro na ligação WebSocket.");
    };

    ws.onclose = () => {
      setIsRunning(false);
    };
  }, [close, push]);

  const stopStream = useCallback(() => {
    // Pede cancelamento ao servidor (se ligado) e fecha.
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify({ action: "cancel" }));
      } catch {
        //
      }
    }
    close();
    setIsRunning(false);
  }, [close]);

  useEffect(() => () => close(), [close]);

  return { messages, isRunning, error, startStream, stopStream };
}

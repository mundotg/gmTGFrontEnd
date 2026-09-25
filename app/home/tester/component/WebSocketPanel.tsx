"use client";

import React, { useEffect, useRef, useState } from "react";
import { Plug, Send, Power, Radio } from "lucide-react";
import { useWsClient } from "../hook/useClients";

const outcomeColor = (o: string) => {
  if (o === "error") return "text-red-400";
  if (o === "success") return "text-emerald-400";
  return "text-slate-300";
};

export default function WebSocketPanel() {
  const { connected, events, error, connect, send, disconnect } = useWsClient();

  const [url, setUrl] = useState("ws://localhost:8000/ws/echo");
  const [label, setLabel] = useState("Sessão WebSocket");
  const [message, setMessage] = useState('{"type":"ping"}');

  const logRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [events]);

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 rounded-lg border border-violet-600/40 bg-violet-950/30 px-4 py-3 text-sm text-violet-200">
        <Radio className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold">Cliente WebSocket</p>
          <p className="text-violet-300/80 text-xs mt-0.5">
            Liga a um <code>ws://</code> / <code>wss://</code>, envia mensagens e mede a latência
            de ida-e-volta. A sessão fica no histórico ao desligar.
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-slate-700 bg-slate-800/40 p-4 space-y-3">
        <div className="flex gap-2">
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Nome"
            disabled={connected}
            className="w-40 rounded bg-slate-900 border border-slate-700 px-3 py-2 text-sm focus:border-cyan-500 outline-none disabled:opacity-50"
          />
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="ws://host/caminho"
            disabled={connected}
            className="flex-1 rounded bg-slate-900 border border-slate-700 px-3 py-2 text-sm font-mono focus:border-cyan-500 outline-none disabled:opacity-50"
          />
          {connected ? (
            <button
              onClick={disconnect}
              className="flex items-center gap-2 rounded-lg bg-red-600 hover:bg-red-700 px-4 py-2 text-sm font-semibold"
            >
              <Power className="w-4 h-4" /> Desligar
            </button>
          ) : (
            <button
              onClick={() => connect(url, label)}
              className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-violet-500 to-fuchsia-600 hover:opacity-90 px-4 py-2 text-sm font-semibold"
            >
              <Plug className="w-4 h-4" /> Ligar
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
              connected ? "text-emerald-400" : "text-slate-500"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                connected ? "bg-emerald-400 animate-pulse" : "bg-slate-600"
              }`}
            />
            {connected ? "Ligado" : "Desligado"}
          </span>
        </div>

        <div className="flex gap-2">
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && connected && send(message)}
            placeholder="Mensagem a enviar"
            disabled={!connected}
            className="flex-1 rounded bg-slate-900 border border-slate-700 px-3 py-2 text-sm font-mono focus:border-cyan-500 outline-none disabled:opacity-50"
          />
          <button
            onClick={() => send(message)}
            disabled={!connected}
            className="flex items-center gap-2 rounded-lg bg-cyan-600 hover:bg-cyan-700 px-4 py-2 text-sm font-semibold disabled:opacity-40"
          >
            <Send className="w-4 h-4" /> Enviar
          </button>
        </div>

        <div
          ref={logRef}
          className="max-h-80 overflow-y-auto space-y-1 rounded bg-slate-950/50 p-3 font-mono text-xs"
        >
          {events.length === 0 && (
            <p className="text-slate-600 text-center py-8">Sem eventos. Liga para começar.</p>
          )}
          {events.map((e) => (
            <div key={e.seq} className="flex items-start gap-2">
              <span className="text-slate-600 flex-shrink-0">
                {new Date(e.ts).toLocaleTimeString()}
              </span>
              <span className={`${outcomeColor(e.outcome)} break-all`}>{e.detail}</span>
              {e.latency_ms > 0 && (
                <span className="text-slate-600 ml-auto flex-shrink-0">
                  {e.latency_ms.toFixed(0)}ms
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-700 bg-red-950/30 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}
    </div>
  );
}

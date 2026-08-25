"use client";

import React, { useEffect, useRef, useState } from "react";
import { Antenna, Power, Play } from "lucide-react";
import { useSseClient } from "../hook/useClients";

export default function SsePanel() {
  const { connected, events, error, connect, disconnect } = useSseClient();

  const [url, setUrl] = useState("http://localhost:8000/pentest/sse/demo");
  const [label, setLabel] = useState("Sessão SSE");

  const logRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [events]);

  const messageCount = events.filter((e) => e.outcome === "message").length;
  const avgGap =
    messageCount > 1
      ? (
          events.filter((e) => e.outcome === "message" && e.latency_ms > 0).reduce((a, e) => a + e.latency_ms, 0) /
          Math.max(messageCount - 1, 1)
        ).toFixed(0)
      : "—";

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 rounded-lg border border-emerald-600/40 bg-emerald-950/30 px-4 py-3 text-sm text-emerald-200">
        <Antenna className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold">Cliente SSE / EventStream</p>
          <p className="text-emerald-300/80 text-xs mt-0.5">
            Subscreve um endpoint <code>text/event-stream</code> e mostra os eventos à medida que
            chegam, com contagem e intervalo entre eventos.
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
            placeholder="http://host/stream"
            disabled={connected}
            className="flex-1 rounded bg-slate-900 border border-slate-700 px-3 py-2 text-sm font-mono focus:border-cyan-500 outline-none disabled:opacity-50"
          />
          {connected ? (
            <button
              onClick={disconnect}
              className="flex items-center gap-2 rounded-lg bg-red-600 hover:bg-red-700 px-4 py-2 text-sm font-semibold"
            >
              <Power className="w-4 h-4" /> Parar
            </button>
          ) : (
            <button
              onClick={() => connect(url, label)}
              className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 hover:opacity-90 px-4 py-2 text-sm font-semibold"
            >
              <Play className="w-4 h-4" /> Subscrever
            </button>
          )}
        </div>

        <div className="flex items-center gap-4 text-xs">
          <span
            className={`inline-flex items-center gap-1.5 font-semibold ${
              connected ? "text-emerald-400" : "text-slate-500"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                connected ? "bg-emerald-400 animate-pulse" : "bg-slate-600"
              }`}
            />
            {connected ? "Subscrito" : "Parado"}
          </span>
          <span className="text-slate-400">
            {messageCount} evento(s) · intervalo médio {avgGap}ms
          </span>
        </div>

        <div
          ref={logRef}
          className="max-h-80 overflow-y-auto space-y-1 rounded bg-slate-950/50 p-3 font-mono text-xs"
        >
          {events.length === 0 && (
            <p className="text-slate-600 text-center py-8">Sem eventos. Subscreve para começar.</p>
          )}
          {events.map((e) => (
            <div key={e.seq} className="flex items-start gap-2">
              <span className="text-slate-600 flex-shrink-0">
                {new Date(e.ts).toLocaleTimeString()}
              </span>
              <span
                className={`break-all ${
                  e.outcome === "error" ? "text-red-400" : "text-slate-300"
                }`}
              >
                {e.detail}
              </span>
              {e.latency_ms > 0 && (
                <span className="text-slate-600 ml-auto flex-shrink-0">
                  +{e.latency_ms.toFixed(0)}ms
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

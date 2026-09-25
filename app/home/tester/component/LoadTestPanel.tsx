"use client";

import React, { useState } from "react";
import { Play, Square, Rocket, Loader2, Gauge } from "lucide-react";

import { LoadTestConfig, PentestEvent, PentestLimits, RunTotals } from "../types";
import { usePentest } from "../hook/usePentest";

const METHODS = ["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD"];

export default function LoadTestPanel({
  limits,
  onFinished,
}: {
  limits: PentestLimits | null;
  onFinished?: () => void;
}) {
  const { running, error, start, stop } = usePentest();

  const [label, setLabel] = useState("Carga no health-check");
  const [targetUrl, setTargetUrl] = useState("http://localhost:8000/health/live");
  const [method, setMethod] = useState("GET");
  const [body, setBody] = useState("");
  const [totalRequests, setTotalRequests] = useState(200);
  const [concurrency, setConcurrency] = useState(20);

  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [counters, setCounters] = useState({ success: 0, failure: 0, errors: 0, rate_limited: 0 });
  const [lastLatency, setLastLatency] = useState(0);
  const [totals, setTotals] = useState<RunTotals | null>(null);
  const [finding, setFinding] = useState<string | null>(null);

  const handleStart = async () => {
    setProgress({ done: 0, total: totalRequests });
    setCounters({ success: 0, failure: 0, errors: 0, rate_limited: 0 });
    setTotals(null);
    setFinding(null);
    setLastLatency(0);

    const config: LoadTestConfig = {
      label,
      target_url: targetUrl,
      method,
      body: method !== "GET" && method !== "HEAD" ? body : undefined,
      total_requests: totalRequests,
      concurrency,
    };

    await start("loadtest", config, (evt: PentestEvent) => {
      if (evt.event === "start") {
        setProgress({ done: 0, total: evt.total });
      } else if (evt.event === "progress") {
        setProgress({ done: evt.done, total: evt.total });
        setCounters({
          success: evt.success,
          failure: evt.failure,
          errors: evt.errors,
          rate_limited: evt.rate_limited,
        });
        setLastLatency(evt.last_latency_ms);
      } else if (evt.event === "end") {
        setTotals(evt.totals);
        setFinding(evt.finding);
        setProgress((p) => ({ ...p, done: p.total }));
        onFinished?.();
      }
    });
  };

  const pct = progress.total ? Math.round((progress.done / progress.total) * 100) : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 rounded-lg border border-blue-600/40 bg-blue-950/30 px-4 py-3 text-sm text-blue-200">
        <Rocket className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold">Teste de carga / stress</p>
          <p className="text-blue-300/80 text-xs mt-0.5">
            Dispara N pedidos concorrentes e mede latências (p50/p95/p99) e throughput. Alvos
            limitados à allowlist; máx. {limits?.max_requests ?? "—"} pedidos,{" "}
            {limits?.max_concurrency ?? "—"} em paralelo.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Config */}
        <div className="space-y-3 rounded-lg border border-slate-700 bg-slate-800/40 p-4">
          <label className="block">
            <span className="text-xs text-slate-400">Nome do teste</span>
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="mt-1 w-full rounded bg-slate-900 border border-slate-700 px-3 py-2 text-sm focus:border-cyan-500 outline-none"
            />
          </label>

          <div className="flex gap-2">
            <label className="block w-28">
              <span className="text-xs text-slate-400">Método</span>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className="mt-1 w-full rounded bg-slate-900 border border-slate-700 px-2 py-2 text-sm focus:border-cyan-500 outline-none"
              >
                {METHODS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </label>
            <label className="block flex-1">
              <span className="text-xs text-slate-400">URL alvo</span>
              <input
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                className="mt-1 w-full rounded bg-slate-900 border border-slate-700 px-3 py-2 text-sm font-mono focus:border-cyan-500 outline-none"
              />
            </label>
          </div>

          {method !== "GET" && method !== "HEAD" && (
            <label className="block">
              <span className="text-xs text-slate-400">Corpo</span>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={2}
                className="mt-1 w-full rounded bg-slate-900 border border-slate-700 px-3 py-2 text-xs font-mono focus:border-cyan-500 outline-none resize-none"
              />
            </label>
          )}

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs text-slate-400">Total de pedidos</span>
              <input
                type="number"
                value={totalRequests}
                onChange={(e) => setTotalRequests(Number(e.target.value))}
                className="mt-1 w-full rounded bg-slate-900 border border-slate-700 px-3 py-2 text-sm focus:border-cyan-500 outline-none"
              />
            </label>
            <label className="block">
              <span className="text-xs text-slate-400">Concorrência</span>
              <input
                type="number"
                value={concurrency}
                onChange={(e) => setConcurrency(Number(e.target.value))}
                className="mt-1 w-full rounded bg-slate-900 border border-slate-700 px-3 py-2 text-sm focus:border-cyan-500 outline-none"
              />
            </label>
          </div>

          <div className="flex justify-end pt-1">
            {running ? (
              <button
                onClick={stop}
                className="flex items-center gap-2 rounded-lg bg-red-600 hover:bg-red-700 px-4 py-2 text-sm font-semibold"
              >
                <Square className="w-4 h-4" /> Parar
              </button>
            ) : (
              <button
                onClick={handleStart}
                className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:opacity-90 px-4 py-2 text-sm font-semibold"
              >
                <Play className="w-4 h-4" /> Iniciar
              </button>
            )}
          </div>
        </div>

        {/* Ao vivo */}
        <div className="space-y-3 rounded-lg border border-slate-700 bg-slate-800/40 p-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-200">
            <Gauge className="w-4 h-4 text-cyan-400" /> Em tempo real
            {running && <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />}
          </h3>

          <div>
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <span>
                {progress.done} / {progress.total}
              </span>
              <span>{pct}%</span>
            </div>
            <div className="h-2 rounded-full bg-slate-900 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-blue-600 transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2 text-center text-xs">
            <Stat label="OK" value={counters.success} color="text-emerald-400" />
            <Stat label="Falhou" value={counters.failure} color="text-slate-400" />
            <Stat label="429" value={counters.rate_limited} color="text-amber-400" />
            <Stat label="Erros" value={counters.errors} color="text-red-400" />
          </div>

          <div className="rounded border border-slate-700 bg-slate-900/40 px-3 py-2 text-center">
            <div className="text-2xl font-bold text-cyan-300">{lastLatency.toFixed(0)}ms</div>
            <div className="text-[10px] text-slate-500 uppercase">última latência</div>
          </div>

          {totals && (
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <Stat label="p50" value={`${totals.p50_ms}ms`} color="text-cyan-300" />
              <Stat label="p95" value={`${totals.p95_ms}ms`} color="text-cyan-300" />
              <Stat label="p99" value={`${totals.p99_ms}ms`} color="text-cyan-300" />
              <Stat label="min" value={`${totals.min_ms}ms`} color="text-slate-300" />
              <Stat label="max" value={`${totals.max_ms}ms`} color="text-slate-300" />
              <Stat label="req/s" value={`${totals.throughput_rps}`} color="text-emerald-300" />
            </div>
          )}

          {finding && (
            <div className="rounded border border-slate-700 bg-slate-900/40 px-3 py-2 text-xs text-slate-300">
              {finding}
            </div>
          )}
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

function Stat({
  label,
  value,
  color = "text-slate-100",
}: {
  label: string;
  value: string | number;
  color?: string;
}) {
  return (
    <div className="rounded border border-slate-700 bg-slate-900/40 py-2">
      <div className={`text-sm font-bold ${color}`}>{value}</div>
      <div className="text-[10px] text-slate-500 uppercase">{label}</div>
    </div>
  );
}

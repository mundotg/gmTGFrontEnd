"use client";

import React, { useMemo, useRef, useState } from "react";
import {
  Play,
  Square,
  ShieldAlert,
  KeyRound,
  Loader2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Gauge,
} from "lucide-react";

import { BruteForceConfig, PentestEvent, PentestLimits, RunTotals } from "../types";
import { usePentest } from "../hook/usePentest";
import { getStatusColor } from "../util";

type LiveAttempt = {
  seq: number;
  payload?: string;
  status_code: number | null;
  latency_ms: number;
  outcome: string;
};

type Counters = { success: number; failure: number; errors: number; rate_limited: number };

const outcomeBadge = (outcome: string) => {
  switch (outcome) {
    case "success":
      return { text: "SUCESSO", cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" };
    case "rate_limited":
      return { text: "RATE-LIMIT", cls: "bg-amber-500/15 text-amber-400 border-amber-500/30" };
    case "error":
      return { text: "ERRO", cls: "bg-red-500/15 text-red-400 border-red-500/30" };
    default:
      return { text: "FALHOU", cls: "bg-slate-600/20 text-slate-400 border-slate-600/40" };
  }
};

export default function BruteForcePanel({
  limits,
  onFinished,
}: {
  limits: PentestLimits | null;
  onFinished?: () => void;
}) {
  const { running, error, start, stop } = usePentest();

  const [label, setLabel] = useState("Teste de rate-limit no login");
  const [targetUrl, setTargetUrl] = useState("http://localhost:8000/auth/login");
  const [method] = useState("POST");
  const [bodyTemplate, setBodyTemplate] = useState(
    '{"email":"{username}","senha":"{password}"}'
  );
  const [usernames, setUsernames] = useState("admin@okayulatech.com");
  const [passwords, setPasswords] = useState(
    "123456\nadmin\npassword\nqwerty\nletmein\nAdmin@123"
  );
  const [successCodes, setSuccessCodes] = useState("200");
  const [delayMs, setDelayMs] = useState(100);
  const [stopOnSuccess, setStopOnSuccess] = useState(true);
  const [stopAfterRate, setStopAfterRate] = useState(0);

  const [attempts, setAttempts] = useState<LiveAttempt[]>([]);
  const [counters, setCounters] = useState<Counters>({
    success: 0,
    failure: 0,
    errors: 0,
    rate_limited: 0,
  });
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [totals, setTotals] = useState<RunTotals | null>(null);
  const [finding, setFinding] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);

  const logRef = useRef<HTMLDivElement | null>(null);

  const userList = useMemo(
    () => usernames.split("\n").map((s) => s.trim()).filter(Boolean),
    [usernames]
  );
  const passList = useMemo(
    () => passwords.split("\n").map((s) => s.trim()).filter(Boolean),
    [passwords]
  );
  const totalCombos = userList.length * passList.length;

  const handleStart = async () => {
    setAttempts([]);
    setCounters({ success: 0, failure: 0, errors: 0, rate_limited: 0 });
    setProgress({ done: 0, total: totalCombos });
    setTotals(null);
    setFinding(null);
    setInfoMsg(null);

    const config: BruteForceConfig = {
      label,
      target_url: targetUrl,
      method,
      body_template: bodyTemplate,
      headers: { "Content-Type": "application/json" },
      usernames: userList,
      passwords: passList,
      success_status_codes: successCodes
        .split(",")
        .map((s) => parseInt(s.trim(), 10))
        .filter((n) => !Number.isNaN(n)),
      delay_ms: delayMs,
      stop_on_success: stopOnSuccess,
      stop_after_rate_limited: stopAfterRate,
    };

    await start("bruteforce", config, (evt: PentestEvent) => {
      if (evt.event === "start") {
        setProgress({ done: 0, total: evt.total });
      } else if (evt.event === "attempt") {
        setAttempts((prev) => [
          {
            seq: evt.seq,
            payload: evt.payload,
            status_code: evt.status_code,
            latency_ms: evt.latency_ms,
            outcome: evt.outcome,
          },
          ...prev,
        ].slice(0, 200));
        setCounters({
          success: evt.success,
          failure: evt.failure,
          errors: evt.errors,
          rate_limited: evt.rate_limited,
        });
        setProgress({ done: evt.seq, total: evt.total });
      } else if (evt.event === "info") {
        setInfoMsg(evt.message);
      } else if (evt.event === "end") {
        setTotals(evt.totals);
        setFinding(evt.finding);
        onFinished?.();
      }
    });
  };

  const pct = progress.total ? Math.round((progress.done / progress.total) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* Aviso de âmbito */}
      <div className="flex items-start gap-3 rounded-lg border border-amber-600/40 bg-amber-950/30 px-4 py-3 text-sm text-amber-200">
        <ShieldAlert className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold">Só serviços próprios</p>
          <p className="text-amber-300/80 text-xs mt-0.5">
            O alvo tem de estar na allowlist do servidor
            {limits ? `: ${limits.allowed_hosts.join(", ")}` : ""}. Máx.{" "}
            {limits?.max_attempts ?? "—"} tentativas por execução.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Config */}
        <div className="space-y-3 rounded-lg border border-slate-700 bg-slate-800/40 p-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-200">
            <KeyRound className="w-4 h-4 text-cyan-400" /> Configuração
          </h3>

          <label className="block">
            <span className="text-xs text-slate-400">Nome do teste</span>
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="mt-1 w-full rounded bg-slate-900 border border-slate-700 px-3 py-2 text-sm focus:border-cyan-500 outline-none"
            />
          </label>

          <label className="block">
            <span className="text-xs text-slate-400">URL alvo (POST)</span>
            <input
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              className="mt-1 w-full rounded bg-slate-900 border border-slate-700 px-3 py-2 text-sm font-mono focus:border-cyan-500 outline-none"
            />
          </label>

          <label className="block">
            <span className="text-xs text-slate-400">
              Corpo (use {"{username}"} e {"{password}"})
            </span>
            <textarea
              value={bodyTemplate}
              onChange={(e) => setBodyTemplate(e.target.value)}
              rows={2}
              className="mt-1 w-full rounded bg-slate-900 border border-slate-700 px-3 py-2 text-xs font-mono focus:border-cyan-500 outline-none resize-none"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs text-slate-400">Utilizadores (1/linha)</span>
              <textarea
                value={usernames}
                onChange={(e) => setUsernames(e.target.value)}
                rows={3}
                className="mt-1 w-full rounded bg-slate-900 border border-slate-700 px-3 py-2 text-xs font-mono focus:border-cyan-500 outline-none resize-none"
              />
            </label>
            <label className="block">
              <span className="text-xs text-slate-400">Passwords (1/linha)</span>
              <textarea
                value={passwords}
                onChange={(e) => setPasswords(e.target.value)}
                rows={3}
                className="mt-1 w-full rounded bg-slate-900 border border-slate-700 px-3 py-2 text-xs font-mono focus:border-cyan-500 outline-none resize-none"
              />
            </label>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <label className="block">
              <span className="text-xs text-slate-400">Sucesso (códigos)</span>
              <input
                value={successCodes}
                onChange={(e) => setSuccessCodes(e.target.value)}
                className="mt-1 w-full rounded bg-slate-900 border border-slate-700 px-2 py-2 text-sm focus:border-cyan-500 outline-none"
              />
            </label>
            <label className="block">
              <span className="text-xs text-slate-400">Atraso (ms)</span>
              <input
                type="number"
                value={delayMs}
                onChange={(e) => setDelayMs(Number(e.target.value))}
                className="mt-1 w-full rounded bg-slate-900 border border-slate-700 px-2 py-2 text-sm focus:border-cyan-500 outline-none"
              />
            </label>
            <label className="block">
              <span className="text-xs text-slate-400">Parar após N 429</span>
              <input
                type="number"
                value={stopAfterRate}
                onChange={(e) => setStopAfterRate(Number(e.target.value))}
                className="mt-1 w-full rounded bg-slate-900 border border-slate-700 px-2 py-2 text-sm focus:border-cyan-500 outline-none"
              />
            </label>
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={stopOnSuccess}
              onChange={(e) => setStopOnSuccess(e.target.checked)}
              className="accent-cyan-500"
            />
            Parar assim que encontrar credencial válida
          </label>

          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-slate-500">
              {totalCombos} combinação(ões)
            </span>
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
                disabled={totalCombos === 0}
                className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:opacity-90 px-4 py-2 text-sm font-semibold disabled:opacity-40"
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

          {/* Progresso */}
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

          {/* Contadores */}
          <div className="grid grid-cols-4 gap-2 text-center">
            <Counter icon={<CheckCircle className="w-4 h-4" />} label="Sucesso" value={counters.success} color="text-emerald-400" />
            <Counter icon={<XCircle className="w-4 h-4" />} label="Falhou" value={counters.failure} color="text-slate-400" />
            <Counter icon={<AlertTriangle className="w-4 h-4" />} label="429" value={counters.rate_limited} color="text-amber-400" />
            <Counter icon={<XCircle className="w-4 h-4" />} label="Erros" value={counters.errors} color="text-red-400" />
          </div>

          {infoMsg && (
            <div className="rounded border border-cyan-700/40 bg-cyan-950/30 px-3 py-2 text-xs text-cyan-300">
              {infoMsg}
            </div>
          )}

          {finding && (
            <div
              className={`rounded border px-3 py-2 text-xs ${
                counters.success > 0
                  ? "border-emerald-600/40 bg-emerald-950/30 text-emerald-300"
                  : "border-slate-700 bg-slate-900/40 text-slate-300"
              }`}
            >
              <p className="font-semibold mb-0.5">Resultado</p>
              {finding}
            </div>
          )}

          {totals && (
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <Stat label="p50" value={`${totals.p50_ms}ms`} />
              <Stat label="p95" value={`${totals.p95_ms}ms`} />
              <Stat label="req/s" value={`${totals.throughput_rps}`} />
            </div>
          )}

          {/* Log */}
          <div
            ref={logRef}
            className="max-h-64 overflow-y-auto space-y-1 rounded bg-slate-950/50 p-2 font-mono text-xs"
          >
            {attempts.length === 0 && (
              <p className="text-slate-600 text-center py-6">Sem tentativas ainda.</p>
            )}
            {attempts.map((a) => {
              const badge = outcomeBadge(a.outcome);
              return (
                <div
                  key={a.seq}
                  className="flex items-center justify-between gap-2 rounded border border-slate-800 bg-slate-900/40 px-2 py-1"
                >
                  <span className="text-slate-500 w-8 flex-shrink-0">#{a.seq}</span>
                  <span className="text-slate-300 truncate flex-1">{a.payload}</span>
                  <span className={`${getStatusColor(a.status_code ?? "ERROR")} w-10 text-right`}>
                    {a.status_code ?? "ERR"}
                  </span>
                  <span className="text-slate-500 w-16 text-right">
                    {a.latency_ms.toFixed(0)}ms
                  </span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded border ${badge.cls} flex-shrink-0`}>
                    {badge.text}
                  </span>
                </div>
              );
            })}
          </div>
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

function Counter({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="rounded border border-slate-700 bg-slate-900/40 py-2">
      <div className={`flex items-center justify-center ${color}`}>{icon}</div>
      <div className="text-lg font-bold text-slate-100">{value}</div>
      <div className="text-[10px] text-slate-500 uppercase">{label}</div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-slate-700 bg-slate-900/40 py-2">
      <div className="text-sm font-bold text-cyan-300">{value}</div>
      <div className="text-[10px] text-slate-500 uppercase">{label}</div>
    </div>
  );
}

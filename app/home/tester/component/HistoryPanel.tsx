"use client";

import React, { useEffect, useState } from "react";
import {
  History,
  RefreshCw,
  Trash2,
  KeyRound,
  Rocket,
  Radio,
  Antenna,
  Loader2,
  AlertTriangle,
  TrendingUp,
  ShieldCheck,
  TestTube,
  ChevronDown,
  ChevronRight,
  User,
  Clock,
} from "lucide-react";

import { PentestAttempt, PentestRun, PentestRunDetail, TestKind } from "../types";
import { usePentestHistory, fetchRunDetail } from "../hook/usePentest";
import { getStatusColor } from "../util";

const KIND_META: Record<TestKind, { label: string; icon: React.ElementType; color: string }> = {
  bruteforce: { label: "Força Bruta", icon: KeyRound, color: "text-amber-400" },
  loadtest: { label: "Carga", icon: Rocket, color: "text-blue-400" },
  websocket: { label: "WebSocket", icon: Radio, color: "text-violet-400" },
  sse: { label: "SSE", icon: Antenna, color: "text-emerald-400" },
  request: { label: "Teste Único", icon: TestTube, color: "text-cyan-400" },
};

const statusBadge = (status: string) => {
  switch (status) {
    case "completed":
      return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
    case "running":
      return "bg-cyan-500/15 text-cyan-400 border-cyan-500/30";
    case "error":
      return "bg-red-500/15 text-red-400 border-red-500/30";
    default:
      return "bg-slate-600/20 text-slate-400 border-slate-600/40";
  }
};

const fmtDate = (iso?: string | null) => {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
};

export default function HistoryPanel({ refreshSignal }: { refreshSignal?: number }) {
  const { runs, stats, loading, error, reload, remove } = usePentestHistory();

  useEffect(() => {
    reload();
  }, [reload, refreshSignal]);

  return (
    <div className="space-y-4">
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-3">
          <StatCard label="Execuções" value={stats.total_runs} icon={<History className="w-4 h-4" />} color="text-cyan-400" />
          <StatCard label="Tentativas" value={stats.total_attempts} icon={<TrendingUp className="w-4 h-4" />} color="text-slate-300" />
          <StatCard label="Sucessos" value={stats.total_success} icon={<ShieldCheck className="w-4 h-4" />} color="text-emerald-400" />
          <StatCard label="429 (rate-limit)" value={stats.total_rate_limited} icon={<AlertTriangle className="w-4 h-4" />} color="text-amber-400" />
          <StatCard label="Erros" value={stats.total_errors} icon={<AlertTriangle className="w-4 h-4" />} color="text-red-400" />
          <StatCard label="Creds. achadas" value={stats.credentials_found} icon={<KeyRound className="w-4 h-4" />} color="text-fuchsia-400" />
          <StatCard label="p95 médio" value={`${stats.avg_p95_ms}ms`} icon={<Rocket className="w-4 h-4" />} color="text-blue-400" />
        </div>
      )}

      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-200">
          <History className="w-4 h-4 text-cyan-400" /> Histórico de execuções
        </h3>
        <button
          onClick={reload}
          className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-700 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Recarregar
        </button>
      </div>

      {loading && runs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-500">
          <Loader2 className="w-6 h-6 animate-spin mb-2" />
          <span className="text-sm">A carregar histórico…</span>
        </div>
      ) : error ? (
        <div className="rounded-lg border border-red-700 bg-red-950/30 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      ) : runs.length === 0 ? (
        <div className="rounded-lg border border-slate-700 bg-slate-800/40 py-16 text-center text-slate-500">
          <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Sem execuções ainda. Corre um teste para começar.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {runs.map((run) => (
            <RunRow key={run.id} run={run} onDelete={() => remove(run.id)} />
          ))}
        </div>
      )}
    </div>
  );
}

function RunRow({ run, onDelete }: { run: PentestRun; onDelete: () => void }) {
  const meta = KIND_META[run.kind] ?? KIND_META.request;
  const Icon = meta.icon;

  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState<PentestRunDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const toggle = async () => {
    const next = !open;
    setOpen(next);
    if (next && !detail) {
      setLoadingDetail(true);
      try {
        setDetail(await fetchRunDetail(run.id));
      } catch {
        //
      } finally {
        setLoadingDetail(false);
      }
    }
  };

  return (
    <div className="rounded-lg border border-slate-700 bg-slate-800/40 hover:border-slate-600 transition">
      {/* Cabeçalho clicável */}
      <div className="flex items-start justify-between gap-3 p-4">
        <button onClick={toggle} className="flex items-start gap-3 min-w-0 text-left flex-1">
          <span className="text-slate-500 mt-1 flex-shrink-0">
            {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </span>
          <div className={`p-2 rounded-lg bg-slate-900/60 ${meta.color} flex-shrink-0`}>
            <Icon className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-slate-100 truncate">
                {run.label || meta.label}
              </span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded border ${statusBadge(run.status)}`}>
                {run.status.toUpperCase()}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-mono truncate mt-0.5">
              {run.method} {run.target_url}
            </p>
            {/* id-user + data */}
            <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-500">
              <span className="inline-flex items-center gap-1">
                <User className="w-3 h-3" />
                {run.user_email || `user #${run.user_id ?? "—"}`}
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {fmtDate(run.started_at)}
              </span>
            </div>
            {run.finding && <p className="text-xs text-slate-400 mt-1">{run.finding}</p>}
          </div>
        </button>

        <button
          onClick={onDelete}
          title="Apagar"
          className="p-1.5 rounded text-slate-500 hover:text-red-400 hover:bg-red-950/30 transition flex-shrink-0"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2 px-4 pb-3 text-center">
        <Mini label="Tentativas" value={run.total_attempts} />
        <Mini label="Sucesso" value={run.success_count} color="text-emerald-400" />
        <Mini label="429" value={run.rate_limited_count} color="text-amber-400" />
        <Mini label="Erros" value={run.error_count} color="text-red-400" />
        <Mini label="p95" value={`${run.p95_ms}ms`} color="text-blue-300" />
        <Mini label="req/s" value={run.throughput_rps} color="text-cyan-300" />
      </div>

      {/* Detalhe expandido: cada tentativa com pedido e resposta completos */}
      {open && (
        <div className="border-t border-slate-700 p-4 space-y-2">
          {loadingDetail ? (
            <div className="flex items-center gap-2 text-slate-500 text-sm py-4 justify-center">
              <Loader2 className="w-4 h-4 animate-spin" /> A carregar detalhe…
            </div>
          ) : !detail || detail.attempts.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-4">Sem tentativas registadas.</p>
          ) : (
            <>
              <p className="text-xs text-slate-500">
                {detail.attempts.length} tentativa(s) registada(s)
              </p>
              {detail.attempts.slice(0, 100).map((a) => (
                <AttemptRow key={a.id} attempt={a} />
              ))}
              {detail.attempts.length > 100 && (
                <p className="text-[11px] text-slate-600 text-center">
                  … e mais {detail.attempts.length - 100} (mostradas as primeiras 100)
                </p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function AttemptRow({ attempt }: { attempt: PentestAttempt }) {
  const [open, setOpen] = useState(false);

  const outcomeColor =
    attempt.outcome === "success"
      ? "text-emerald-400"
      : attempt.outcome === "rate_limited"
      ? "text-amber-400"
      : attempt.outcome === "error"
      ? "text-red-400"
      : "text-slate-400";

  return (
    <div className="rounded border border-slate-700/60 bg-slate-900/40">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 px-3 py-2 text-left text-xs font-mono"
      >
        <span className="text-slate-600">{open ? "▾" : "▸"}</span>
        <span className="text-slate-500 w-8">#{attempt.seq}</span>
        {attempt.payload && (
          <span className="text-slate-300 truncate max-w-[160px]">{attempt.payload}</span>
        )}
        <span className="text-slate-400 truncate flex-1">
          {attempt.method} {attempt.endpoint}
        </span>
        <span className={`${getStatusColor(attempt.status_code ?? "ERROR")} w-10 text-right`}>
          {attempt.status_code ?? "ERR"}
        </span>
        <span className="text-slate-500 w-14 text-right">{attempt.latency_ms.toFixed(0)}ms</span>
        <span className={`${outcomeColor} w-16 text-right uppercase text-[10px]`}>
          {attempt.outcome}
        </span>
      </button>

      {open && (
        <div className="border-t border-slate-800 px-3 py-2 space-y-2 text-xs">
          <Field label="Endpoint" value={`${attempt.method || ""} ${attempt.endpoint || "—"}`} mono />
          {attempt.payload && <Field label="Payload testado" value={attempt.payload} mono />}
          <JsonField label="Headers do pedido" value={attempt.request_headers} />
          {attempt.request_body && <CodeField label="Corpo do pedido" value={attempt.request_body} />}
          <JsonField label="Headers da resposta" value={attempt.response_headers} />
          {attempt.response_body && (
            <CodeField label="Resposta" value={attempt.response_body} />
          )}
          {attempt.detail && !attempt.response_body && (
            <CodeField label="Detalhe" value={attempt.detail} />
          )}
          <Field label="Data" value={fmtDate(attempt.created_at)} />
        </div>
      )}
    </div>
  );
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <span className="text-[10px] text-slate-500 uppercase">{label}</span>
      <p className={`text-slate-300 break-all ${mono ? "font-mono" : ""}`}>{value}</p>
    </div>
  );
}

function CodeField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-[10px] text-slate-500 uppercase">{label}</span>
      <pre className="mt-0.5 max-h-48 overflow-auto rounded bg-slate-950/60 p-2 text-[11px] text-slate-300 whitespace-pre-wrap break-all">
        {value}
      </pre>
    </div>
  );
}

function JsonField({
  label,
  value,
}: {
  label: string;
  value?: Record<string, string> | null;
}) {
  if (!value || Object.keys(value).length === 0) return null;
  return <CodeField label={label} value={JSON.stringify(value, null, 2)} />;
}

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-800/40 p-3">
      <div className={`flex items-center gap-1.5 ${color}`}>{icon}</div>
      <div className="text-xl font-bold text-slate-100 mt-1">{value}</div>
      <div className="text-[10px] text-slate-500 uppercase tracking-wide">{label}</div>
    </div>
  );
}

function Mini({
  label,
  value,
  color = "text-slate-200",
}: {
  label: string;
  value: string | number;
  color?: string;
}) {
  return (
    <div className="rounded border border-slate-700/60 bg-slate-900/40 py-1.5">
      <div className={`text-sm font-bold ${color}`}>{value}</div>
      <div className="text-[9px] text-slate-500 uppercase">{label}</div>
    </div>
  );
}

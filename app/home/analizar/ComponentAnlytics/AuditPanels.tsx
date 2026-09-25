"use client";

import React, { useMemo, useState } from "react";
import {
  Search,
  FileDown,
  Loader2,
  Database,
  Star,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Clock,
  User,
  Server,
  ShieldCheck,
  Filter,
} from "lucide-react";
import { QueryHistory } from "../../historico/types";

/* =======================
   HELPERS
======================= */

/** Tempo relativo em português ("há 5 min", "há 2 h", "há 3 d"). */
export function timeAgo(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso).getTime();
  if (Number.isNaN(d)) return "—";
  const diff = Math.max(0, Date.now() - d);
  const s = Math.floor(diff / 1000);
  if (s < 60) return "agora mesmo";
  const m = Math.floor(s / 60);
  if (m < 60) return `há ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `há ${h} h`;
  const dias = Math.floor(h / 24);
  if (dias < 30) return `há ${dias} d`;
  return new Date(iso).toLocaleDateString("pt-PT");
}

/** Cor/estilo do badge por tipo de operação SQL. */
function queryTypeStyle(type?: string | null): { cls: string; label: string } {
  const t = (type || "OTHER").toUpperCase();
  const map: Record<string, string> = {
    SELECT: "bg-blue-50 text-blue-700 border-blue-200",
    COUNT: "bg-blue-50 text-blue-700 border-blue-200",
    INSERT: "bg-emerald-50 text-emerald-700 border-emerald-200",
    UPDATE: "bg-amber-50 text-amber-700 border-amber-200",
    DELETE: "bg-red-50 text-red-700 border-red-200",
    DROP: "bg-red-50 text-red-700 border-red-200",
    DROPTABLE: "bg-red-50 text-red-700 border-red-200",
    CREATE: "bg-purple-50 text-purple-700 border-purple-200",
    CREATETABLE: "bg-purple-50 text-purple-700 border-purple-200",
    ALTER: "bg-indigo-50 text-indigo-700 border-indigo-200",
    ALTERTABLE: "bg-indigo-50 text-indigo-700 border-indigo-200",
  };
  return { cls: map[t] || "bg-gray-100 text-gray-600 border-gray-200", label: t };
}

/** Cor da duração: rápida (verde), normal (cinza), lenta (âmbar/vermelho). */
function durationStyle(ms?: number | null): string {
  const v = ms ?? 0;
  if (v >= 2000) return "text-red-600";
  if (v >= 800) return "text-amber-600";
  if (v > 0) return "text-emerald-600";
  return "text-gray-400";
}

const fmtMs = (ms?: number | null) => {
  const v = ms ?? 0;
  if (v >= 1000) return `${(v / 1000).toFixed(2)}s`;
  return `${v}ms`;
};

/* =======================
   CONSULTAS AUDITADAS
======================= */
export function AuditedQueries({
  queries,
  loading,
  canExport,
  onExport,
  search,
  onSearchChange,
  page,
  pageSize,
  hasNext,
  onPrev,
  onNext,
}: {
  queries: QueryHistory[];
  loading: boolean;
  canExport: boolean;
  onExport: () => void;
  search: string;
  onSearchChange: (v: string) => void;
  page: number; // 0-based
  pageSize: number;
  hasNext: boolean;
  onPrev: () => void;
  onNext: () => void;
}) {
  // "Só erros" filtra a página atual (a pesquisa é feita no servidor).
  const [onlyErrors, setOnlyErrors] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(null);

  const filtered = useMemo(
    () => (onlyErrors ? queries.filter((q) => q.error_message) : queries),
    [queries, onlyErrors]
  );

  const errorCount = useMemo(() => queries.filter((q) => q.error_message).length, [queries]);
  const rangeStart = queries.length ? page * pageSize + 1 : 0;
  const rangeEnd = page * pageSize + queries.length;

  return (
    <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm flex flex-col">
      {/* Toolbar */}
      <div className="p-4 border-b border-gray-100 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
            <ShieldCheck size={16} className="text-blue-600" /> Consultas Auditadas
            {queries.length > 0 && (
              <span className="text-xs font-medium text-gray-400">
                {rangeStart}–{rangeEnd}
              </span>
            )}
          </h3>

          {canExport && queries.length > 0 && (
            <button
              onClick={onExport}
              title="Exportar CSV"
              className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-blue-600 transition-colors"
            >
              <FileDown size={15} /> CSV
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Procurar por origem ou utilizador…"
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500/40 outline-none"
            />
          </div>
          <button
            onClick={() => setOnlyErrors((v) => !v)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition ${
              onlyErrors
                ? "bg-red-50 text-red-700 border-red-200"
                : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
            }`}
            title="Mostrar só erros"
          >
            <Filter size={13} /> Erros
            {errorCount > 0 && (
              <span className="bg-red-100 text-red-700 rounded-full px-1.5 text-[10px] font-bold">
                {errorCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Tabela */}
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="text-[10px] uppercase tracking-wider text-gray-400 border-b border-gray-100">
              <th className="px-4 py-2 font-semibold">Operação</th>
              <th className="px-4 py-2 font-semibold">Origem / Utilizador</th>
              <th className="px-4 py-2 font-semibold text-right">Duração</th>
              <th className="px-4 py-2 font-semibold text-center">Estado</th>
              <th className="px-4 py-2 font-semibold text-right">Quando</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading && (
              <tr>
                <td colSpan={5} className="p-6 text-center text-gray-400">
                  <Loader2 className="animate-spin inline mr-2" size={14} /> A carregar…
                </td>
              </tr>
            )}

            {!loading &&
              filtered.map((q) => {
                const isErr = !!q.error_message;
                const ts = queryTypeStyle(q.query_type);
                const open = expanded === q.id;
                const hasDetail = isErr || !!q.tags;

                return (
                  <React.Fragment key={q.id}>
                    <tr
                      className={`transition-colors ${
                        hasDetail ? "cursor-pointer" : ""
                      } ${isErr ? "bg-red-50/40 hover:bg-red-50" : "hover:bg-gray-50"}`}
                      onClick={() => hasDetail && setExpanded(open ? null : q.id)}
                    >
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          {hasDetail ? (
                            open ? (
                              <ChevronDown size={12} className="text-gray-400" />
                            ) : (
                              <ChevronRight size={12} className="text-gray-400" />
                            )
                          ) : (
                            <span className="w-3" />
                          )}
                          <span
                            className={`inline-flex items-center px-1.5 py-0.5 rounded border text-[10px] font-bold ${ts.cls}`}
                          >
                            {ts.label}
                          </span>
                          {q.is_favorite && (
                            <Star size={12} className="text-amber-400 fill-amber-400" />
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="font-semibold text-gray-800 truncate max-w-[180px]">
                          {q.app_source || "Desconhecido"}
                        </div>
                        <div className="text-[11px] text-gray-400 truncate max-w-[180px]">
                          {q.executed_by || "sistema"}
                        </div>
                      </td>
                      <td className={`px-4 py-2.5 text-right font-mono ${durationStyle(q.duration_ms)}`}>
                        {fmtMs(q.duration_ms)}
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        {isErr ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">
                            <AlertTriangle size={11} /> Erro
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 size={11} /> OK
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-right text-gray-500 whitespace-nowrap">
                        {timeAgo(q.executed_at)}
                      </td>
                    </tr>

                    {open && hasDetail && (
                      <tr className="bg-gray-50/60">
                        <td colSpan={5} className="px-4 py-3">
                          {isErr && (
                            <div className="mb-2">
                              <p className="text-[10px] uppercase tracking-wide text-red-500 font-bold mb-1">
                                Mensagem de erro
                              </p>
                              <pre className="text-[11px] text-red-700 bg-red-50 border border-red-100 rounded p-2 whitespace-pre-wrap break-all">
                                {q.error_message}
                              </pre>
                            </div>
                          )}
                          {q.tags && (
                            <div className="flex flex-wrap gap-1.5">
                              {q.tags.split(",").filter(Boolean).map((tag) => (
                                <span
                                  key={tag}
                                  className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100"
                                >
                                  {tag.trim()}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}

            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-gray-400">
                  <Database className="mx-auto mb-2 opacity-40" size={24} />
                  {queries.length === 0
                    ? "Sem consultas registadas"
                    : "Nada corresponde ao filtro"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Paginação */}
      <div className="flex items-center justify-between border-t border-gray-100 px-4 py-2.5 text-xs">
        <span className="text-gray-500">
          Página {page + 1}
          {onlyErrors && (
            <span className="ml-2 text-red-500">· só erros nesta página</span>
          )}
        </span>
        <div className="flex items-center gap-1.5">
          <button
            onClick={onPrev}
            disabled={page === 0 || loading}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={14} /> Anterior
          </button>
          <button
            onClick={onNext}
            disabled={!hasNext || loading}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Próxima <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

/* =======================
   TRILHA DE AUDITORIA
======================= */
export function AuditTrail({ queries, loading }: { queries: QueryHistory[]; loading: boolean }) {
  const items = queries.slice(0, 6);

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
      <h3 className="text-xs font-black uppercase tracking-widest text-blue-600 mb-6 flex items-center gap-2">
        <Clock size={14} /> Trilha de Auditoria
      </h3>

      {loading ? (
        <div className="text-center py-8 text-gray-400">
          <Loader2 className="animate-spin inline" size={18} />
        </div>
      ) : items.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-6">Sem eventos registados.</p>
      ) : (
        <div className="relative">
          {/* linha vertical da timeline */}
          <div className="absolute left-[11px] top-1 bottom-1 w-px bg-gray-100" />

          <div className="space-y-5">
            {items.map((q) => {
              const isErr = !!q.error_message;
              const ts = queryTypeStyle(q.query_type);
              return (
                <div key={q.id} className="relative flex gap-3">
                  {/* ponto */}
                  <div
                    className={`relative z-10 mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 bg-white ${
                      isErr ? "border-red-400" : "border-blue-400"
                    }`}
                  >
                    {isErr ? (
                      <AlertTriangle size={11} className="text-red-500" />
                    ) : (
                      <CheckCircle2 size={11} className="text-blue-500" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1 pb-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`inline-flex items-center px-1.5 py-0.5 rounded border text-[10px] font-bold ${ts.cls}`}
                      >
                        {ts.label}
                      </span>
                      <span className={`text-[11px] font-mono ${durationStyle(q.duration_ms)}`}>
                        {fmtMs(q.duration_ms)}
                      </span>
                    </div>

                    <p className="mt-1 text-xs text-gray-500 flex items-center gap-1.5 flex-wrap">
                      <span className="inline-flex items-center gap-1 text-gray-700 font-medium">
                        <User size={11} /> {q.executed_by || "sistema"}
                      </span>
                      {q.app_source && (
                        <span className="inline-flex items-center gap-1">
                          <Server size={11} /> {q.app_source}
                        </span>
                      )}
                    </p>

                    <p className="mt-0.5 text-[11px] text-gray-400">{timeAgo(q.executed_at)}</p>

                    {isErr && (
                      <p className="mt-1 text-[11px] text-red-600 truncate" title={q.error_message ?? ""}>
                        {q.error_message}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState, useMemo } from "react";
import { Anomalies, AnomalyRow } from "./types";
import {
  AlertCircle,
  Search,
  Sparkles,
  HelpCircle,
  ShieldAlert,
  Eye,
  CheckCircle2,
  X,
  FileText,
} from "lucide-react";
import { StudyCallout } from "./StudyCallout";

interface AnomaliesStudioProps {
  anomalies: Anomalies | null;
  studyMode: boolean;
  onOpenDictionaryTerm: (termId: string) => void;
}

export function AnomaliesStudio({
  anomalies,
  studyMode,
  onOpenDictionaryTerm,
}: AnomaliesStudioProps) {
  const [search, setSearch] = useState("");
  const [inspectedRow, setInspectedRow] = useState<AnomalyRow | null>(null);

  const rows = anomalies?.rows ?? [];

  const filteredRows = useMemo(() => {
    if (!search) return rows;
    const q = search.toLowerCase();
    return rows.filter((r) => {
      const matchIdx = String(r.index).includes(q);
      const matchContent = Object.values(r.row).some((val) =>
        String(val ?? "").toLowerCase().includes(q)
      );
      return matchIdx || matchContent;
    });
  }, [rows, search]);

  if (!anomalies || rows.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center text-slate-400">
        <CheckCircle2 size={32} className="mx-auto mb-3 text-emerald-500" />
        <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
          Nenhuma anomalia crítica detectada nesta base!
        </p>
        <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
          Todos os registros comportam-se dentro da margem de normalidade matemática esperada para suas respectivas distribuições.
        </p>
      </div>
    );
  }

  const cols = rows[0] ? Object.keys(rows[0].row).slice(0, 6) : [];

  return (
    <div className="space-y-6">
      {studyMode && (
        <StudyCallout
          badge="Guia de Auditoria & Detecção de Fraudes"
          title="O que são Anomalias Multivariadas e para que servem?"
          concept="Uma anomalia ocorre quando a combinação de atributos de um registro se distancia drasticamente do comportamento do restante da base. Ao contrário de um outlier que olha apenas uma coluna, a anomalia analisa o comportamento conjunto de múltiplos campos."
          whyItMatters="É a técnica central utilizada em detecção de fraudes com cartões, lavagem de dinheiro, falhas em sensores industriais e inconsistências cadastrais graves."
          practicalTip="Comece a auditoria pelas linhas com maior 'Score de Anomalia'. Verifique se são erros operacionais (ex: vírgula errada em valor financeiro) ou comportamentos atípicos reais."
        />
      )}

      {/* Main Section */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 flex items-center justify-center border border-rose-200 dark:border-rose-900/60 shadow-sm">
              <ShieldAlert size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 bg-rose-50 dark:bg-rose-950 px-2.5 py-0.5 rounded-full border border-rose-200 dark:border-rose-900">
                  Auditoria de Anomalias
                </span>
                {anomalies.method && (
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800">
                    Método: {anomalies.method}
                  </span>
                )}
                <span className="text-xs text-slate-400">
                  {anomalies.count} linha(s) atípicas
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                Registros Fora do Padrão & Justificativas
              </h3>
            </div>
          </div>

          <button
            onClick={() => onOpenDictionaryTerm("anomalias-multivariadas")}
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
          >
            <HelpCircle size={14} /> Como o método Z-Score identifica anomalias?
          </button>
        </div>

        {/* Filter bar */}
        <div className="relative mb-4">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquisar entre as linhas anômalas por valor, justificativa ou ID..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />
        </div>

        {/* Table of Anomalies */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase text-[10px] font-bold">
              <tr>
                <th className="p-3 text-left">Registro Afetado</th>
                <th className="p-3 text-left">Gravidade (Z-Score)</th>
                <th className="p-3 text-left min-w-[240px]">Justificativa do Desvio</th>
                {cols.map((c) => (
                  <th key={c} className="p-3 text-left max-w-[120px] truncate" title={c}>
                    {c.split(".").pop()}
                  </th>
                ))}
                <th className="p-3 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredRows.map((r) => {
                const isHigh = r.score > 3.5;
                const recDisplay = r.record_id || `Linha #${r.index}`;
                return (
                  <tr
                    key={r.index}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="p-3 font-mono font-bold text-slate-700 dark:text-slate-200 whitespace-nowrap">
                      <span className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
                        {recDisplay}
                      </span>
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-black inline-flex items-center gap-1 ${
                          isHigh
                            ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                            : "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                        }`}
                      >
                        {r.score.toFixed(2)}σ {isHigh ? "🚨 Severo" : "⚠️ Atípico"}
                      </span>
                    </td>
                    <td className="p-3 text-slate-600 dark:text-slate-300 min-w-[240px] text-[11px] leading-relaxed">
                      {r.justification ? (
                        <span>
                          <b className="text-slate-800 dark:text-slate-100">{r.culprit_column}:</b>{" "}
                          {r.justification}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Desvio multivariado além de 3 desvios padrão.</span>
                      )}
                    </td>
                    {cols.map((c) => (
                      <td
                        key={c}
                        className={`p-3 max-w-[120px] truncate ${
                          c === r.culprit_column
                            ? "font-bold text-rose-600 dark:text-rose-400 bg-rose-50/50 dark:bg-rose-950/30"
                            : "text-slate-700 dark:text-slate-300"
                        }`}
                        title={String(r.row[c] ?? "")}
                      >
                        {String(r.row[c] ?? "—")}
                      </td>
                    ))}
                    <td className="p-3 text-right whitespace-nowrap">
                      <button
                        onClick={() => setInspectedRow(r)}
                        className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 font-semibold text-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Eye size={13} /> Inspecionar
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Row Inspection Modal */}
      {inspectedRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/40">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-xs">
                  #{inspectedRow.index}
                </span>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                    Registro Afetado: {inspectedRow.record_id || `#${inspectedRow.index}`}
                  </h3>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-rose-600 font-bold">
                      Z-Score: {inspectedRow.score.toFixed(2)}σ
                    </span>
                    {anomalies.method && (
                      <span className="text-slate-400">· {anomalies.method}</span>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setInspectedRow(null)}
                className="w-8 h-8 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Justification Box */}
              {inspectedRow.justification && (
                <div className="bg-rose-50/80 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-2xl p-4 text-xs text-rose-950 dark:text-rose-200">
                  <div className="font-bold text-rose-900 dark:text-rose-100 mb-1 flex items-center gap-1.5">
                    <ShieldAlert size={15} /> Justificativa da Detecção:
                  </div>
                  <p className="leading-relaxed">
                    {inspectedRow.justification}
                  </p>
                  {inspectedRow.culprit_column && (
                    <div className="mt-2 text-[11px] font-semibold text-rose-800 dark:text-rose-300">
                      Coluna Causadora: <code>{inspectedRow.culprit_column}</code> (Valor: {String(inspectedRow.culprit_value)}, Desvio: {inspectedRow.culprit_z}σ)
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {Object.entries(inspectedRow.row).map(([k, v]) => (
                  <div
                    key={k}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800"
                  >
                    <div className="text-[10px] font-bold uppercase text-slate-400 truncate" title={k}>
                      {k}
                    </div>
                    <div className="font-semibold text-slate-800 dark:text-slate-100 mt-0.5 break-all">
                      {String(v ?? "—")}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-800 flex justify-end bg-slate-50 dark:bg-slate-800/40">
              <button
                onClick={() => setInspectedRow(null)}
                className="px-4 py-1.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-xl text-xs font-semibold"
              >
                Fechar Inspeção
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

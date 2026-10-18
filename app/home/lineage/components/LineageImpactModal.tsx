"use client";

import React, { useEffect, useState } from "react";
import api from "@/context/axioCuston";
import {
  X,
  ShieldAlert,
  ArrowRight,
  Database,
  Layers,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Sparkles,
} from "lucide-react";
import { TableImpactAnalysis } from "../types";

interface LineageImpactModalProps {
  tableName: string;
  connectionId?: number;
  isOpen: boolean;
  onClose: () => void;
}

export function LineageImpactModal({
  tableName,
  connectionId,
  isOpen,
  onClose,
}: LineageImpactModalProps) {
  const [data, setData] = useState<TableImpactAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !tableName) return;

    const fetchImpact = async () => {
      setLoading(true);
      setError(null);
      try {
        const url = `/lineage/table/${tableName}${
          connectionId ? `?connection_id=${connectionId}` : ""
        }`;
        const res = await api.get(url);
        setData(res.data);
      } catch (err: any) {
        console.error("Erro ao buscar impacto da tabela:", err);
        setError("Não foi possível carregar a análise de impacto.");
      } finally {
        setLoading(false);
      }
    };

    fetchImpact();
  }, [isOpen, tableName, connectionId]);


  if (!isOpen) return null;

  const getRiskColor = (risk?: string) => {
    switch (risk) {
      case "CRITICAL":
        return "bg-rose-500/10 border-rose-500/40 text-rose-400";
      case "HIGH":
        return "bg-amber-500/10 border-amber-500/40 text-amber-400";
      case "MEDIUM":
        return "bg-yellow-500/10 border-yellow-500/40 text-yellow-400";
      default:
        return "bg-emerald-500/10 border-emerald-500/40 text-emerald-400";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl text-slate-100 overflow-hidden">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/80">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="w-5 h-5 text-indigo-400" />
            <div>
              <h3 className="font-bold text-base text-white">
                Análise de Impacto: <span className="text-indigo-400">{tableName}</span>
              </h3>
              <p className="text-xs text-slate-400">
                Avaliação de dependência Upstream (origens) e Downstream (consumidores)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Conteúdo com Scroll */}
        <div className="p-6 overflow-y-auto space-y-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-slate-400">
              <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs">Rastreando árvore de dependências no banco...</p>
            </div>
          ) : error ? (
            <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300">
              {error}
            </div>
          ) : data ? (
            <>
              {/* Card de Avaliação de Risco */}
              <div
                className={`p-4 rounded-xl border flex items-start gap-3.5 ${getRiskColor(
                  data.risk_assessment
                )}`}
              >
                <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-sm">
                      Nível de Risco: {data.risk_assessment}
                    </span>
                    <span className="text-xs opacity-80">
                      ({data.total_dependent_tables} dependentes downstream)
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed opacity-90">
                    {data.risk_explanation}
                  </p>
                </div>
              </div>

              {/* Dependências Downstream (Quem consome esta tabela) */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2 mb-3">
                  <Layers className="w-4 h-4 text-emerald-400" />
                  Consumidores Downstream ({data.downstream_dependents.length})
                </h4>
                {data.downstream_dependents.length === 0 ? (
                  <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-800 text-xs text-slate-400 text-center">
                    Nenhuma tabela ou pipeline consome diretamente dados desta entidade. Alterações aqui possuem baixo impacto cascata.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {data.downstream_dependents.map((dep, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-slate-800/60 border border-slate-700/80 rounded-xl flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-400" />
                          <div>
                            <span className="font-bold text-white block">
                              {dep.target_table}
                            </span>
                            <span className="text-slate-400 text-[11px]">
                              {dep.target_database} ({dep.db_type})
                            </span>
                          </div>
                        </div>
                        <div className="text-right text-slate-400 text-[11px]">
                          <span>{dep.transformation || "Carga Direta"}</span>
                          {dep.last_rows && (
                            <span className="block text-slate-300 font-mono">
                              {dep.last_rows.toLocaleString()} linhas
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Origens Upstream (Quem alimenta esta tabela) */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2 mb-3">
                  <Database className="w-4 h-4 text-blue-400" />
                  Origens Upstream ({data.upstream_sources.length})
                </h4>
                {data.upstream_sources.length === 0 ? (
                  <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-800 text-xs text-slate-400 text-center">
                    Esta tabela é uma fonte primária (não foi gerada por transferências de outras tabelas cadastradas).
                  </div>
                ) : (
                  <div className="space-y-2">
                    {data.upstream_sources.map((src, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-slate-800/60 border border-slate-700/80 rounded-xl flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="w-2 h-2 rounded-full bg-blue-400" />
                          <div>
                            <span className="font-bold text-white block">
                              {src.source_table}
                            </span>
                            <span className="text-slate-400 text-[11px]">
                              {src.source_database} ({src.db_type})
                            </span>
                          </div>
                        </div>
                        <div className="text-right text-slate-400 text-[11px]">
                          <span>{src.transformation || "Extração"}</span>
                          {src.last_rows && (
                            <span className="block text-slate-300 font-mono">
                              {src.last_rows.toLocaleString()} linhas
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>

        {/* Rodapé */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/90 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition-all"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

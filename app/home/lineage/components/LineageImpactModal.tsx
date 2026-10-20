"use client";

import React, { useEffect, useState } from "react";
import api from "@/context/axioCuston";
import { useI18n } from "@/context/I18nContext";
import {
  X,
  ShieldAlert,
  Database,
  Layers,
  AlertTriangle,
} from "lucide-react";
import { TableImpactAnalysis } from "../types";

interface LineageImpactModalProps {
  tableName: string;
  connectionId?: number;
  isOpen: boolean;
  onClose: () => void;
  isDarkMode?: boolean;
}

export function LineageImpactModal({
  tableName,
  connectionId,
  isOpen,
  onClose,
  isDarkMode = true,
}: LineageImpactModalProps) {
  const { t } = useI18n();
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
        setError(t("lineage.modalError") || "Não foi possível carregar a análise de impacto.");
      } finally {
        setLoading(false);
      }
    };

    fetchImpact();
  }, [isOpen, tableName, connectionId, t]);

  if (!isOpen) return null;

  const getRiskColor = (risk?: string) => {
    switch (risk) {
      case "CRITICAL":
        return "bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400";
      case "HIGH":
        return "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400";
      case "MEDIUM":
        return "bg-yellow-500/10 border-yellow-500/30 text-yellow-600 dark:text-yellow-400";
      default:
        return "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className={`border rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden transition-colors ${
          isDarkMode
            ? "bg-[#1C1C1E] border-gray-800 text-gray-100"
            : "bg-white border-gray-200 text-gray-900 shadow-2xl"
        }`}
      >
        {/* Cabeçalho */}
        <div
          className={`flex items-center justify-between px-6 py-4 border-b ${
            isDarkMode ? "bg-[#1C1C1E] border-gray-800" : "bg-gray-50/80 border-gray-200"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="w-5 h-5 text-indigo-500" />
            <div>
              <h3 className={`font-bold text-base ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                {t("lineage.modalImpactTitle") || "Análise de Impacto:"}{" "}
                <span className="text-indigo-500">{tableName}</span>
              </h3>
              <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                {t("lineage.modalImpactSubtitle") ||
                  "Avaliação de dependência Upstream (origens) e Downstream (consumidores)"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors ${
              isDarkMode
                ? "text-gray-400 hover:text-white hover:bg-gray-800"
                : "text-gray-500 hover:text-gray-800 hover:bg-gray-100"
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Conteúdo com Scroll */}
        <div className="p-6 overflow-y-auto space-y-6">
          {loading ? (
            <div
              className={`flex flex-col items-center justify-center py-12 gap-3 ${
                isDarkMode ? "text-gray-400" : "text-gray-500"
              }`}
            >
              <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs">
                {t("lineage.modalTrackingDeps") || "Rastreando árvore de dependências no banco..."}
              </p>
            </div>
          ) : error ? (
            <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-500 dark:text-rose-300">
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
                      {t("lineage.modalRiskLevel") || "Nível de Risco:"} {data.risk_assessment}
                    </span>
                    <span className="text-xs opacity-80">
                      ({data.total_dependent_tables}{" "}
                      {t("lineage.dependentDownstream") || "dependentes downstream"})
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed opacity-90">
                    {data.risk_explanation}
                  </p>
                </div>
              </div>

              {/* Dependências Downstream (Quem consome esta tabela) */}
              <div>
                <h4
                  className={`text-xs font-semibold uppercase tracking-wider flex items-center gap-2 mb-3 ${
                    isDarkMode ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  <Layers className="w-4 h-4 text-emerald-500" />
                  {t("lineage.downstreamConsumers") || "Consumidores Downstream"} (
                  {data.downstream_dependents.length})
                </h4>
                {data.downstream_dependents.length === 0 ? (
                  <div
                    className={`p-4 rounded-xl border text-xs text-center ${
                      isDarkMode
                        ? "bg-gray-800/40 border-gray-800 text-gray-400"
                        : "bg-gray-50 border-gray-200 text-gray-500"
                    }`}
                  >
                    {t("lineage.noDownstream") ||
                      "Nenhuma tabela ou pipeline consome diretamente dados desta entidade. Alterações aqui possuem baixo impacto cascata."}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {data.downstream_dependents.map((dep, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-xl border flex items-center justify-between text-xs transition-colors ${
                          isDarkMode
                            ? "bg-[#141416] border-gray-800"
                            : "bg-gray-50/80 border-gray-200 hover:bg-gray-50"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          <div>
                            <span
                              className={`font-bold block ${
                                isDarkMode ? "text-white" : "text-gray-900"
                              }`}
                            >
                              {dep.target_table}
                            </span>
                            <span
                              className={`text-[11px] ${
                                isDarkMode ? "text-gray-400" : "text-gray-500"
                              }`}
                            >
                              {dep.target_database} ({dep.db_type})
                            </span>
                          </div>
                        </div>
                        <div
                          className={`text-right text-[11px] ${
                            isDarkMode ? "text-gray-400" : "text-gray-500"
                          }`}
                        >
                          <span>{dep.transformation || t("lineage.directTransfer") || "Carga Direta"}</span>
                          {dep.last_rows !== undefined && dep.last_rows !== null && (
                            <span
                              className={`block font-mono ${
                                isDarkMode ? "text-gray-300" : "text-gray-700"
                              }`}
                            >
                              {dep.last_rows.toLocaleString()} {t("lineage.lines") || "linhas"}
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
                <h4
                  className={`text-xs font-semibold uppercase tracking-wider flex items-center gap-2 mb-3 ${
                    isDarkMode ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  <Database className="w-4 h-4 text-blue-500" />
                  {t("lineage.modalUpstreamTitle") || "Origens Upstream"} (
                  {data.upstream_sources.length})
                </h4>
                {data.upstream_sources.length === 0 ? (
                  <div
                    className={`p-4 rounded-xl border text-xs text-center ${
                      isDarkMode
                        ? "bg-gray-800/40 border-gray-800 text-gray-400"
                        : "bg-gray-50 border-gray-200 text-gray-500"
                    }`}
                  >
                    {t("lineage.noUpstream") ||
                      "Esta tabela é uma fonte primária (não foi gerada por transferências de outras tabelas cadastradas)."}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {data.upstream_sources.map((src, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-xl border flex items-center justify-between text-xs transition-colors ${
                          isDarkMode
                            ? "bg-[#141416] border-gray-800"
                            : "bg-gray-50/80 border-gray-200 hover:bg-gray-50"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="w-2 h-2 rounded-full bg-blue-500" />
                          <div>
                            <span
                              className={`font-bold block ${
                                isDarkMode ? "text-white" : "text-gray-900"
                              }`}
                            >
                              {src.source_table}
                            </span>
                            <span
                              className={`text-[11px] ${
                                isDarkMode ? "text-gray-400" : "text-gray-500"
                              }`}
                            >
                              {src.source_database} ({src.db_type})
                            </span>
                          </div>
                        </div>
                        <div
                          className={`text-right text-[11px] ${
                            isDarkMode ? "text-gray-400" : "text-gray-500"
                          }`}
                        >
                          <span>{src.transformation || t("lineage.extraction") || "Extração"}</span>
                          {src.last_rows !== undefined && src.last_rows !== null && (
                            <span
                              className={`block font-mono ${
                                isDarkMode ? "text-gray-300" : "text-gray-700"
                              }`}
                            >
                              {src.last_rows.toLocaleString()} {t("lineage.lines") || "linhas"}
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
        <div
          className={`px-6 py-4 border-t flex justify-end ${
            isDarkMode ? "bg-[#1C1C1E] border-gray-800" : "bg-gray-50 border-gray-200"
          }`}
        >
          <button
            onClick={onClose}
            className={`px-5 py-2 rounded-xl text-xs font-semibold border transition-all ${
              isDarkMode
                ? "bg-gray-800 hover:bg-gray-700 text-gray-200 border-gray-700"
                : "bg-white hover:bg-gray-50 text-gray-700 border-gray-300 shadow-sm"
            }`}
          >
            {t("lineage.modalClose") || "Fechar"}
          </button>
        </div>
      </div>
    </div>
  );
}

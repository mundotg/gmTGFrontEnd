"use client";

import React, { useState } from "react";
import { QueryImpact } from "@/app/task/types/transfer-types";

interface ImpactPredictorCardProps {
    impact: QueryImpact | null;
    loading?: boolean;
    onClose?: () => void;
    onProceed?: () => void;
    isModal?: boolean;
}

export default function ImpactPredictorCard({
    impact,
    loading = false,
    onClose,
    onProceed,
    isModal = false,
}: ImpactPredictorCardProps) {
    const [showRawPlan, setShowRawPlan] = useState(false);
    const [copiedIndex, setCopiedIndex] = useState<string | null>(null);

    if (loading) {
        return (
            <div className="bg-slate-900/90 border border-indigo-500/30 rounded-xl p-5 shadow-2xl backdrop-blur-md animate-pulse">
                <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin" />
                    <span className="text-sm font-semibold text-slate-200">
                        Calculando Dry-Run e avaliando impacto no banco...
                    </span>
                </div>
            </div>
        );
    }

    if (!impact) return null;

    const riskConfig = {
        LOW: {
            badge: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
            border: "border-emerald-500/30",
            glow: "shadow-emerald-500/10",
            label: "Baixo Risco",
            icon: "🟢",
            desc: "Uso de índice ou volume controlado. Execução segura.",
        },
        MEDIUM: {
            badge: "bg-amber-500/20 text-amber-300 border-amber-500/40",
            border: "border-amber-500/30",
            glow: "shadow-amber-500/10",
            label: "Risco Moderado",
            icon: "🟡",
            desc: "Varredura parcial ou ausência de LIMIT. Monitore o consumo.",
        },
        HIGH: {
            badge: "bg-orange-500/20 text-orange-300 border-orange-500/40",
            border: "border-orange-500/40",
            glow: "shadow-orange-500/20",
            label: "Alto Risco",
            icon: "🟠",
            desc: "Varredura sequencial em grande volume. Pode lentificar o banco.",
        },
        CRITICAL: {
            badge: "bg-rose-500/20 text-rose-300 border-rose-500/40",
            border: "border-rose-500/50",
            glow: "shadow-rose-500/30",
            label: "Risco Crítico",
            icon: "🔴",
            desc: "Varredura massiva sem índice ou mutação sem WHERE!",
        },
    }[impact.risk_level] || {
        badge: "bg-slate-500/20 text-slate-300 border-slate-500/40",
        border: "border-slate-500/30",
        glow: "shadow-slate-500/10",
        label: "Normal",
        icon: "⚪",
        desc: "Consulta analisada.",
    };

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopiedIndex(text);
        setTimeout(() => setCopiedIndex(null), 2000);
    };

    const content = (
        <div className={`bg-slate-900/95 border ${riskConfig.border} rounded-xl p-5 shadow-2xl backdrop-blur-md transition-all ${riskConfig.glow}`}>
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                    <span className="text-xl">{riskConfig.icon}</span>
                    <div>
                        <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-white tracking-wide">
                                Diagnóstico de Impacto Pré-Execução
                            </h4>
                            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${riskConfig.badge}`}>
                                {riskConfig.label} ({impact.risk_score}%)
                            </span>
                            {impact.dialect && (
                                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                                    {impact.dialect}
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">{riskConfig.desc}</p>
                    </div>
                </div>

                {onClose && (
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded bg-slate-800/60 hover:bg-slate-800 transition"
                    >
                        ✕ Fechar
                    </button>
                )}
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 my-3.5">
                <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-2.5">
                    <span className="text-[10px] uppercase font-medium text-slate-400 block">Tipo de Varredura</span>
                    <span className="text-xs font-bold text-slate-200 mt-0.5 block truncate" title={impact.scan_type}>
                        {impact.scan_type === "INDEX_SCAN" ? "⚡ Index Scan" :
                            impact.scan_type === "SEQUENTIAL_SCAN" ? "⚠️ Sequential Scan" :
                            impact.scan_type === "COLLECTION_SCAN" ? "⚠️ Collection Scan" :
                            impact.scan_type === "FULL_TABLE_SCAN" ? "⚠️ Full Table Scan" :
                            impact.scan_type}
                    </span>
                </div>

                <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-2.5">
                    <span className="text-[10px] uppercase font-medium text-slate-400 block">Linhas Estimadas</span>
                    <span className="text-xs font-bold text-indigo-300 mt-0.5 block">
                        {impact.estimated_rows != null ? `~${impact.estimated_rows.toLocaleString()}` : "N/D"}
                    </span>
                </div>

                <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-2.5">
                    <span className="text-[10px] uppercase font-medium text-slate-400 block">Custo Estimado</span>
                    <span className="text-xs font-bold text-slate-200 mt-0.5 block">
                        {impact.estimated_cost != null ? impact.estimated_cost.toFixed(1) : "—"}
                    </span>
                </div>

                <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-2.5">
                    <span className="text-[10px] uppercase font-medium text-slate-400 block">Tabela Alvo</span>
                    <span className="text-xs font-bold text-amber-300 mt-0.5 block truncate" title={impact.table_name || ""}>
                        {impact.table_name || "Múltiplas / Subquery"}
                    </span>
                </div>
            </div>

            {/* Summary & Warning */}
            <div className="space-y-2 mb-3">
                <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/60">
                    {impact.summary}
                </p>

                {impact.warning && (
                    <div className="flex items-start gap-2 bg-rose-950/40 border border-rose-500/40 p-2.5 rounded-lg text-xs text-rose-200">
                        <span className="text-sm">⚠️</span>
                        <span className="font-medium">{impact.warning}</span>
                    </div>
                )}
            </div>

            {/* Suggestions */}
            {impact.suggestions && impact.suggestions.length > 0 && (
                <div className="bg-indigo-950/30 border border-indigo-500/20 rounded-lg p-3 mb-3">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-300 mb-1.5">
                        <span>💡</span>
                        <span>Recomendações de Otimização</span>
                    </div>
                    <ul className="space-y-1.5">
                        {impact.suggestions.map((sug, i) => {
                            const isIndexSql = sug.includes("CREATE INDEX") || sug.includes("createIndex");
                            return (
                                <li key={i} className="text-xs text-slate-300 flex items-start justify-between gap-2">
                                    <span className="leading-relaxed">• {sug}</span>
                                    {isIndexSql && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const match = sug.match(/(?:CREATE INDEX|db\..*?createIndex).*?;?/i);
                                                if (match) handleCopy(match[0]);
                                            }}
                                            className="shrink-0 px-2 py-0.5 text-[10px] bg-indigo-600 hover:bg-indigo-500 text-white rounded font-medium transition"
                                        >
                                            {copiedIndex ? "Copiado!" : "Copiar SQL"}
                                        </button>
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                </div>
            )}

            {/* Raw Plan Drawer Toggle */}
            {Boolean(impact.raw_plan) && (
                <div className="mt-2">
                    <button
                        type="button"
                        onClick={() => setShowRawPlan(!showRawPlan)}
                        className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1 transition"
                    >
                        <span>{showRawPlan ? "▼" : "▶"}</span>
                        <span>{showRawPlan ? "Ocultar Plano Otimizador Bruto" : "Ver Plano Otimizador Bruto (JSON)"}</span>
                    </button>

                    {showRawPlan && (
                        <div className="mt-2 bg-slate-950 p-3 rounded-lg border border-slate-800 max-h-48 overflow-auto text-[11px] font-mono text-emerald-400">
                            <pre>{JSON.stringify(impact.raw_plan, null, 2)}</pre>
                        </div>
                    )}
                </div>
            )}

            {/* Actions (if modal) */}
            {isModal && onProceed && (
                <div className="flex items-center justify-end gap-2.5 mt-4 pt-3 border-t border-slate-800">
                    {onClose && (
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
                        >
                            Cancelar e Ajustar
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={onProceed}
                        className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition ${
                            impact.risk_level === "CRITICAL"
                                ? "bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30"
                                : impact.risk_level === "HIGH"
                                ? "bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-600/30"
                                : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30"
                        }`}
                    >
                        Executar Mesmo Assim
                    </button>
                </div>
            )}
        </div>
    );

    if (isModal) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
                <div className="max-w-xl w-full">
                    {content}
                </div>
            </div>
        );
    }

    return content;
}

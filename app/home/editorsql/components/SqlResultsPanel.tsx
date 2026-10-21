"use client";

import React from "react";
import { useI18n } from "@/context/I18nContext";
import {
    Tab,
    ExecError,
    AnalyzeResult,
    QueryImpact,
    HistoryEntry,
    SavedQuery,
    Metrics,
} from "../types";
import ImpactPredictorCard from "./ImpactPredictorCard";

export interface SqlResultsPanelProps {
    activeTab: Tab;
    setActiveTab: (tab: Tab) => void;
    execError: ExecError;
    analyzeResult: AnalyzeResult | null;
    impactResult: QueryImpact | null;
    setImpactResult: (impact: QueryImpact | null) => void;
    explainResult: unknown[] | null;
    columns: string[];
    rows: Record<string, unknown>[];
    history: HistoryEntry[];
    saved: SavedQuery[];
    metrics: Metrics | null;
    onSelectQuery: (query: string) => void;
}

export default function SqlResultsPanel({
    activeTab,
    setActiveTab,
    execError,
    analyzeResult,
    impactResult,
    setImpactResult,
    explainResult,
    columns,
    rows,
    history,
    saved,
    metrics,
    onSelectQuery,
}: SqlResultsPanelProps) {
    const { t } = useI18n();

    return (
        <div className="results-shell">
            {/* TABS */}
            <div className="sec-tabs">
                {(["editor", "history", "saved", "metrics"] as Tab[]).map((tabKey, i) => (
                    <button
                        key={tabKey + i + "_secTab"}
                        className={`sec-tab${activeTab === tabKey ? " active" : ""}`}
                        onClick={() => setActiveTab(tabKey)}
                    >
                        {tabKey === "editor" && t("sqlEditorPage.resultsTab", "Resultados")}
                        {tabKey === "history" && t("sqlEditorPage.historyTab", "Histórico")}
                        {tabKey === "saved" && t("sqlEditorPage.savedTab", "Salvos")}
                        {tabKey === "metrics" && t("sqlEditorPage.metricsTab", "Métricas")}
                    </button>
                ))}
            </div>

            {/* RESULTADOS */}
            {activeTab === "editor" && (
                <>
                    {execError && (
                        <div className="error-box">
                            <span>⚠</span>
                            <span>
                                {typeof execError === "string"
                                    ? execError
                                    : execError?.error || "Erro desconhecido"}
                            </span>
                        </div>
                    )}

                    {analyzeResult && (
                        <div className="analyze-panel">
                            <div className="analyze-row">
                                <span className="tag">
                                    Statements: {analyzeResult.totalStatements}
                                </span>
                            </div>

                            <pre className="formatted-sql">
                                {analyzeResult.formatted}
                            </pre>

                            {analyzeResult.queries.map((q, qi) => (
                                <div key={`query-${qi}`} className="query-analysis-block">
                                    <div className="analyze-row">
                                        <span className="tag">{q.queryType}</span>
                                        <span
                                            className={`tag ${
                                                q.risk?.safe ? "ok" : "risk"
                                            }`}
                                        >
                                            {q.risk?.safe
                                                ? "✓ Seguro"
                                                : `⚠ ${q.risk?.risks?.join(", ")}`}
                                        </span>
                                        <span className="tag">
                                            Complexidade: {q.complexity}
                                        </span>
                                        {q.tables?.map((tName, i) => (
                                            <span key={`${tName}-${i}`} className="tag">
                                                📋 {tName}
                                            </span>
                                        ))}
                                    </div>
                                    <div className="query-preview">
                                        <code>{q.query}</code>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {impactResult ? (
                        <div className="my-4">
                            <ImpactPredictorCard
                                impact={impactResult}
                                onClose={() => setImpactResult(null)}
                            />
                        </div>
                    ) : explainResult ? (
                        <div className="explain-wrap">
                            <pre>{JSON.stringify(explainResult, null, 2)}</pre>
                        </div>
                    ) : null}

                    {columns.length > 0 && (
                        <div className="results-table-wrap">
                            <table>
                                <thead>
                                    <tr>
                                        {columns.map((c, i) => (
                                            <th key={`${c}-${i}`}>{c}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.length === 0 ? (
                                        <tr className="empty-row">
                                            <td colSpan={columns.length}>
                                                {t("sqlEditorPage.noResults", "Nenhum resultado retornado.")}
                                            </td>
                                        </tr>
                                    ) : (
                                        rows.map((row, ri) => (
                                            <tr key={`row-${ri}`}>
                                                {columns.map((c, ci) => {
                                                    const value =
                                                        row?.[c] ??
                                                        row?.[c.toUpperCase()] ??
                                                        row?.[c.toLowerCase()];

                                                    return (
                                                        <td key={`cell-${ri}-${ci}`}>
                                                            {value == null ? (
                                                                <span className="null-v">
                                                                    null
                                                                </span>
                                                            ) : typeof value === "object" ? (
                                                                <pre className="json-cell">
                                                                    {JSON.stringify(
                                                                        value,
                                                                        null,
                                                                        2
                                                                    )}
                                                                </pre>
                                                            ) : (
                                                                String(value)
                                                            )}
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </>
            )}

            {/* HISTÓRICO */}
            {activeTab === "history" && (
                <div>
                    {history.length === 0 ? (
                        <div className="empty-row">
                            <span>Nenhum histórico ainda.</span>
                        </div>
                    ) : (
                        history
                            .slice()
                            .reverse()
                            .map((h, i) => (
                                <div
                                    key={`${h.created_at}-${i}`}
                                    className="list-item"
                                    onClick={() => {
                                        onSelectQuery(h.query);
                                        setActiveTab("editor");
                                    }}
                                >
                                    <div className="list-item-q">{h.query}</div>
                                    <div
                                        className="list-item-meta"
                                        suppressHydrationWarning
                                    >
                                        {typeof window !== "undefined"
                                            ? new Date(h.created_at).toLocaleString("pt-BR")
                                            : ""}
                                    </div>
                                </div>
                            ))
                    )}
                </div>
            )}

            {/* SALVOS */}
            {activeTab === "saved" && (
                <div>
                    {saved.length === 0 ? (
                        <div className="empty-row">
                            <span>Nenhuma query salva.</span>
                        </div>
                    ) : (
                        saved.map((s, i) => (
                            <div
                                key={s.id + i + "_saved"}
                                className="list-item"
                                onClick={() => {
                                    onSelectQuery(s.query);
                                    setActiveTab("editor");
                                }}
                            >
                                <div
                                    className="list-item-q"
                                    style={{
                                        fontWeight: 500,
                                        fontFamily: "var(--font-sans)",
                                    }}
                                >
                                    {s.name}
                                </div>
                                <div
                                    className="list-item-meta list-item-q"
                                    style={{ marginTop: 3 }}
                                >
                                    {s.query}
                                </div>
                                <div className="list-item-meta">
                                    {new Date(s.created_at).toLocaleString("pt-BR")}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* MÉTRICAS */}
            {activeTab === "metrics" && metrics && (
                <div className="metrics-grid">
                    <div className="metric-card">
                        <div className="metric-val">{metrics.queriesExecuted}</div>
                        <div className="metric-label">Queries Executadas</div>
                    </div>
                    <div className="metric-card">
                        <div className="metric-val">{metrics.activeQueries}</div>
                        <div className="metric-label">Queries Ativas</div>
                    </div>
                    <div className="metric-card">
                        <div className="metric-val">{metrics.savedQueries}</div>
                        <div className="metric-label">Queries Salvas</div>
                    </div>
                </div>
            )}
        </div>
    );
}

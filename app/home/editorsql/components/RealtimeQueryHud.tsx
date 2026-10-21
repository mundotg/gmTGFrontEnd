"use client";

import React from "react";
import { useI18n } from "@/context/I18nContext";
import { RealtimeQueryAnalysis, LastExecutionTelemetry } from "../types";

export interface RealtimeQueryHudProps {
    analysis: RealtimeQueryAnalysis;
    isExecuting: boolean;
    lastExecution: LastExecutionTelemetry | null;
    rowsCount: number;
}

export default function RealtimeQueryHud({
    analysis,
    isExecuting,
    lastExecution,
    rowsCount,
}: RealtimeQueryHudProps) {
    const { t } = useI18n();

    return (
        <>
            <div className="realtime-hud">
                <div className="realtime-hud-left">
                    <span
                        className="rt-pulse-dot"
                        title={t("sqlEditorPage.realtimeActive", "Análise Ativa em Tempo Real")}
                    />
                    <span className="rt-badge rt-type">{analysis.statementType}</span>

                    <span className={`rt-badge rt-risk ${analysis.riskLevel}`}>
                        {analysis.riskLevel === "safe" && "🛡️ " + t("sqlEditorPage.riskSafe", "Segura")}
                        {analysis.riskLevel === "moderate" && "⚠️ " + t("sqlEditorPage.riskModerate", "Moderada")}
                        {analysis.riskLevel === "critical" && "🚨 " + t("sqlEditorPage.riskCritical", "Crítico")}
                    </span>

                    <span
                        className="rt-badge rt-complexity"
                        title="Complexidade heurística calculada em tempo real"
                    >
                        ⚙️ {t("sqlEditorPage.complexity", "Complexidade")}: {analysis.complexity}/10
                    </span>

                    {analysis.tables.length > 0 ? (
                        <span className="rt-tables">
                            <span className="rt-tbl-label">
                                {t("sqlEditorPage.tablesDetected", "Tabelas")}:
                            </span>
                            {analysis.tables.slice(0, 3).map((tbl, i) => (
                                <span key={tbl + i} className="rt-tbl-tag">
                                    📋 {tbl}
                                </span>
                            ))}
                            {analysis.tables.length > 3 && (
                                <span className="rt-tbl-tag">
                                    +{analysis.tables.length - 3}
                                </span>
                            )}
                        </span>
                    ) : (
                        <span className="rt-no-tables">
                            ({t("sqlEditorPage.noTables", "Nenhuma")})
                        </span>
                    )}
                </div>

                <div className="realtime-hud-right">
                    {isExecuting ? (
                        <span className="rt-executing-pulse">
                            <span className="rt-spinner" /> {t("sqlEditorPage.executing", "Executando...")} ({rowsCount} {t("sqlEditorPage.rows", "linhas")})
                        </span>
                    ) : lastExecution ? (
                        <span
                            className={`rt-telemetry ${lastExecution.status}`}
                            title={`${t("sqlEditorPage.lastExecution", "Última Execução")}: ${lastExecution.timestamp.toLocaleTimeString()}`}
                        >
                            <span>⏱️ {lastExecution.durationMs}ms</span>
                            <span>•</span>
                            <span>
                                📊 {lastExecution.rowsCount} {t("sqlEditorPage.rows", "linhas")}
                            </span>
                            <span>•</span>
                            <span className={`rt-status-text ${lastExecution.status}`}>
                                {lastExecution.status === "success"
                                    ? "✓ " + t("sqlEditorPage.completed", "Concluído")
                                    : lastExecution.status === "cancelled"
                                    ? "■ " + t("sqlEditorPage.cancel", "Cancelado")
                                    : "⚠ Erro"}
                            </span>
                        </span>
                    ) : (
                        <span className="rt-idle-hint">
                            ⚡ {t("sqlEditorPage.realtimeBadge", "Tempo Real")}
                        </span>
                    )}
                </div>
            </div>

            {analysis.risks.length > 0 && (
                <div className={`rt-risk-alert ${analysis.riskLevel}`}>
                    <span className="rt-alert-icon">
                        {analysis.riskLevel === "critical" ? "🚨" : "⚠️"}
                    </span>
                    <div className="rt-alert-messages">
                        {analysis.risks.map((risk, idx) => (
                            <span key={idx} className="rt-alert-item">
                                {risk}
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </>
    );
}

"use client";

import React from "react";
import { useI18n } from "@/context/I18nContext";

export interface SqlToolbarProps {
    selectionInfo: string | null;
    isExecuting: boolean;
    analyzing: boolean;
    explaining: boolean;
    canExecute: boolean;
    onAnalyze: () => void;
    onExplain: () => void;
    onOpenSave: () => void;
    onExecute: () => void;
    onCancel: () => void;
}

export default function SqlToolbar({
    selectionInfo,
    isExecuting,
    analyzing,
    explaining,
    canExecute,
    onAnalyze,
    onExplain,
    onOpenSave,
    onExecute,
    onCancel,
}: SqlToolbarProps) {
    const { t } = useI18n();

    return (
        <div className="toolbar">
            <div className="toolbar-left">
                <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#569cd6"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <ellipse cx="12" cy="5" rx="9" ry="3" />
                    <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
                    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
                </svg>
                {t("sqlEditorPage.title", "Editor SQL")}
                {selectionInfo && (
                    <span className="sel-badge">✦ {selectionInfo}</span>
                )}
            </div>

            <div className="toolbar-right">
                <span className="hint">
                    <kbd>Ctrl</kbd>+<kbd>Enter</kbd> {t("sqlEditorPage.shortcutExecute", "Executar")} &nbsp;
                    <kbd>Ctrl</kbd>+<kbd>S</kbd> {t("sqlEditorPage.shortcutSave", "Salvar")}
                </span>

                <button
                    className="icon-btn"
                    onClick={onAnalyze}
                    disabled={isExecuting || analyzing}
                    title={t("sqlEditorPage.analyze", "Analisar query")}
                >
                    {analyzing ? "…" : "⚡ " + t("sqlEditorPage.analyze", "Analisar")}
                </button>

                <button
                    className="icon-btn"
                    onClick={onExplain}
                    disabled={isExecuting || explaining}
                    title={t("sqlEditorPage.dryRunTooltip", "Executa EXPLAIN nativo e simula custo, linhas e risco sem ler páginas nem comitar dados")}
                >
                    {explaining ? "…" : "🛡️ " + t("sqlEditorPage.dryRun", "Simular Impacto (Dry-Run)")}
                </button>

                <button
                    className="icon-btn"
                    onClick={onOpenSave}
                    disabled={isExecuting}
                    title={t("sqlEditorPage.saveTitle", "Salvar query")}
                >
                    💾 {t("sqlEditorPage.save", "Salvar")}
                </button>

                {!isExecuting ? (
                    <button
                        className="icon-btn green"
                        onClick={onExecute}
                        disabled={!canExecute}
                    >
                        ▶ {t("sqlEditorPage.execute", "Executar")}
                    </button>
                ) : (
                    <button className="icon-btn red" onClick={onCancel}>
                        ■ {t("sqlEditorPage.cancel", "Cancelar")}
                    </button>
                )}
            </div>
        </div>
    );
}

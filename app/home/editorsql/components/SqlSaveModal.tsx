"use client";

import React from "react";
import { useI18n } from "@/context/I18nContext";

export interface SqlSaveModalProps {
    isOpen: boolean;
    saveName: string;
    onNameChange: (name: string) => void;
    onClose: () => void;
    onSave: () => void;
}

export default function SqlSaveModal({
    isOpen,
    saveName,
    onNameChange,
    onClose,
    onSave,
}: SqlSaveModalProps) {
    const { t } = useI18n();

    if (!isOpen) return null;

    return (
        <div
            className="modal-overlay"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div className="modal">
                <h3>{t("sqlEditorPage.saveTitle", "Salvar query")}</h3>
                <input
                    autoFocus
                    placeholder={t("sqlEditorPage.savePlaceholder", "Nome da query…")}
                    value={saveName}
                    onChange={(e) => onNameChange(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") onSave();
                    }}
                />
                <div className="modal-actions">
                    <button className="btn-ghost" onClick={onClose}>
                        {t("sqlEditorPage.cancel", "Cancelar")}
                    </button>
                    <button
                        className="btn-primary"
                        onClick={onSave}
                        disabled={!saveName.trim()}
                    >
                        {t("sqlEditorPage.save", "Salvar")}
                    </button>
                </div>
            </div>
        </div>
    );
}

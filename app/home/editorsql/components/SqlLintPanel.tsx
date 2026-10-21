"use client";

import React from "react";
import { ValidationState } from "../types";

export interface SqlLintPanelProps {
    validation: ValidationState;
    onApplyFix: (replace: string, withText: string) => void;
}

export default function SqlLintPanel({ validation, onApplyFix }: SqlLintPanelProps) {
    if (!validation?.errors?.length && !validation?.suggestions?.length) {
        return null;
    }

    return (
        <div className="lint-panel">
            {validation?.errors?.map((e, i) => (
                <div
                    key={"err" + i}
                    className={`lint-row ${e.severity === "error" ? "lint-err" : "lint-warn"}`}
                >
                    <span className="lint-ico">{e.severity === "error" ? "⛔" : "⚠️"}</span>
                    <span>{e.message}</span>
                </div>
            ))}
            {validation?.suggestions?.map((s, i) => (
                <div key={"sug" + i} className="lint-row lint-sug">
                    <span className="lint-ico">💡</span>
                    <span>{s.message}</span>
                    {s.replace && s.with && (
                        <button
                            className="lint-fix"
                            onClick={() => onApplyFix(s.replace as string, s.with as string)}
                        >
                            corrigir
                        </button>
                    )}
                </div>
            ))}
        </div>
    );
}

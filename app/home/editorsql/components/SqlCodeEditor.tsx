"use client";

import React from "react";
import { AcItem, ValidationState } from "../types";
import SqlLintPanel from "./SqlLintPanel";
import SqlStatusBar from "./SqlStatusBar";

export interface SqlCodeEditorProps {
    sql: string;
    highlighted: string;
    textareaRef: React.RefObject<HTMLTextAreaElement | null>;
    preRef: React.RefObject<HTMLPreElement | null>;
    acItems: AcItem[];
    validation: ValidationState;
    statusText: string;
    isMongo: boolean;
    wsReady: boolean;
    rowsCount: number;
    onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
    onScroll: () => void;
    onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
    onSelect: () => void;
    onApplyAcItem: (item: AcItem) => void;
    onApplyLintFix: (replace: string, withText: string) => void;
}

export default function SqlCodeEditor({
    sql,
    highlighted,
    textareaRef,
    preRef,
    acItems,
    validation,
    statusText,
    isMongo,
    wsReady,
    rowsCount,
    onChange,
    onScroll,
    onKeyDown,
    onSelect,
    onApplyAcItem,
    onApplyLintFix,
}: SqlCodeEditorProps) {
    return (
        <>
            <div className="editor-area">
                <pre
                    ref={preRef}
                    className="hl-pre"
                    dangerouslySetInnerHTML={{ __html: highlighted }}
                />
                <textarea
                    ref={textareaRef}
                    value={sql}
                    onChange={onChange}
                    onScroll={onScroll}
                    onKeyDown={onKeyDown}
                    onSelect={onSelect}
                    onMouseUp={onSelect}
                    onKeyUp={onSelect}
                    spellCheck={false}
                    className="sql-ta"
                />

                {acItems.length > 0 && (
                    <div className="ac-list">
                        {acItems.map((it, i) => (
                            <div
                                key={it.label + i + "_ac"}
                                className="ac-item"
                                onMouseDown={(e) => {
                                    e.preventDefault();
                                    onApplyAcItem(it);
                                }}
                            >
                                <span className={`ac-tag ac-${it.type}`}>
                                    {it.type[0].toUpperCase()}
                                </span>
                                <span className="ac-label">{it.label}</span>
                                {it.detail && (
                                    <span className="ac-detail">{it.detail}</span>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <SqlLintPanel validation={validation} onApplyFix={onApplyLintFix} />

            <SqlStatusBar
                statusText={statusText}
                isMongo={isMongo}
                wsReady={wsReady}
                rowsCount={rowsCount}
            />
        </>
    );
}

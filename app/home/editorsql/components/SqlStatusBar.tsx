"use client";

import React from "react";

export interface SqlStatusBarProps {
    statusText: string;
    isMongo: boolean;
    wsReady: boolean;
    rowsCount: number;
}

export default function SqlStatusBar({
    statusText,
    isMongo,
    wsReady,
    rowsCount,
}: SqlStatusBarProps) {
    return (
        <div className="status-bar">
            <span>{statusText}</span>
            <span className="status-mid">
                {isMongo && <span className="badge-mongo">🍃 MongoDB</span>}
                <span className={`badge-ws ${wsReady ? "on" : "off"}`}>
                    {wsReady ? "● tempo real" : "○ offline"}
                </span>
            </span>
            <span>
                {rowsCount} linha{rowsCount !== 1 ? "s" : ""}
            </span>
        </div>
    );
}

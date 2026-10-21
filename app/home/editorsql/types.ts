import { QueryImpact } from "@/app/task/types/transfer-types";

export type AcItem = { label: string; type: string; detail?: string; insert: string };
export type LintMsg = { severity?: string; type?: string; message: string; replace?: string; with?: string };
export type ValidationState = { errors: LintMsg[]; suggestions: LintMsg[] } | null;

/**
 * O evento "error" do stream pode chegar como texto simples ou como o payload
 * bruto do backend (`{ error, message, ... }`), por isso a união.
 */
export type ExecError = string | { error?: string; message?: string } | null;

export interface ExecutePayload {
    query: string;
    limit?: number;
    offset?: number;
    stream?: boolean;
}

export interface AnalyzeQuery {
    query: string;
    queryType: string;
    tables: string[];
    risk: {
        safe: boolean;
        risks: string[];
    };
    complexity: number;
}

export interface AnalyzeResult {
    formatted: string;
    queries: AnalyzeQuery[];
    totalStatements: number;
}

export interface AnalyzeResponse {
    success: boolean;
    message: string;
    data: AnalyzeResult;
}

export interface SavedQuery {
    id: string;
    name: string;
    query: string;
    created_at: string;
}

export interface HistoryEntry {
    query: string;
    created_at: string;
}

export interface Metrics {
    queriesExecuted: number;
    activeQueries: number;
    savedQueries: number;
}

export type Tab = "editor" | "history" | "saved" | "metrics";

export interface RealtimeQueryAnalysis {
    statementType: string;
    tables: string[];
    riskLevel: "safe" | "moderate" | "critical";
    risks: string[];
    complexity: number;
    hasWhere: boolean;
    hasLimit: boolean;
    hasJoins: boolean;
    joinsCount: number;
}

export interface LastExecutionTelemetry {
    durationMs: number;
    rowsCount: number;
    statementType?: string;
    timestamp: Date;
    status: "success" | "cancelled" | "error";
    errorMsg?: string;
}

export type { QueryImpact };

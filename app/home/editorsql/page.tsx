"use client";

import usePersistedState from "@/hook/localStoreUse";
import React, {
    useState,
    useMemo,
    useEffect,
    useRef,
    useCallback,
} from "react";

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────

interface ExecutePayload {
    query: string;
    limit?: number;
    offset?: number;
    stream?: boolean;
}

interface AnalyzeQuery {
    query: string;
    queryType: string;
    tables: string[];

    risk: {
        safe: boolean;
        risks: string[];
    };

    complexity: number;
}

interface AnalyzeResult {
    formatted: string;

    queries: AnalyzeQuery[];

    totalStatements: number;
}

interface AnalyzeResponse {
    success: boolean;
    message: string;
    data: AnalyzeResult;
}

interface SavedQuery {
    id: string;
    name: string;
    query: string;
    created_at: string;
}

interface HistoryEntry {
    query: string;
    created_at: string;
}

interface Metrics {
    queriesExecuted: number;
    activeQueries: number;
    savedQueries: number;
}

// ─────────────────────────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────────────────────────

const BASE_URL = (process.env.NEXT_PUBLIC_BACKEND_URL ?? "") + "sql-editor";

const KEYWORDS = [
    "SELECT", "FROM", "WHERE", "INSERT", "UPDATE", "DELETE", "JOIN", "INNER", "LEFT",
    "RIGHT", "OUTER", "ON", "AND", "OR", "NOT", "IN", "IS", "NULL", "GROUP BY", "ORDER BY",
    "LIMIT", "OFFSET", "HAVING", "DISTINCT", "AS", "CREATE", "ALTER", "DROP", "TABLE",
    "UNION", "ALL", "CASE", "WHEN", "THEN", "ELSE", "END", "BETWEEN", "LIKE", "EXISTS",
    "COUNT", "SUM", "AVG", "MIN", "MAX", "COALESCE", "CAST", "RETURNING", "VALUES", "SET", "INTO",
];

// ─────────────────────────────────────────────────────────────
// API CLIENT
// ─────────────────────────────────────────────────────────────

async function apiPost<T>(path: string, body: unknown): Promise<T> {
    const res = await fetch(`${BASE_URL}${path}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
        throw new Error(json.message ?? "Erro na requisição");
    }
    return json.data as T;
}

async function apiGet<T>(path: string): Promise<T> {
    const res = await fetch(`${BASE_URL}${path}`, {
        credentials: "include",
    });
    const json = await res.json();
    if (!res.ok || !json.success) throw new Error(json.message ?? "Erro");
    return json.data as T;
}

// ─────────────────────────────────────────────────────────────
// HIGHLIGHT
// ─────────────────────────────────────────────────────────────

function highlight(sql: string): string {
    const esc = (s: string) =>
        s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

    const tokens: string[] = [];
    let i = 0;

    while (i < sql.length) {
        // single-line comment
        if (sql[i] === "-" && sql[i + 1] === "-") {
            const j = sql.indexOf("\n", i);
            const end = j === -1 ? sql.length : j;
            tokens.push(`<span class="hl-cmt">${esc(sql.slice(i, end))}</span>`);
            i = end;
            continue;
        }
        // string literals
        if (sql[i] === "'" || sql[i] === '"') {
            const q = sql[i];
            let j = i + 1;
            while (j < sql.length && sql[j] !== q) {
                if (sql[j] === "\\") j++;
                j++;
            }
            j++;
            tokens.push(`<span class="hl-str">${esc(sql.slice(i, j))}</span>`);
            i = j;
            continue;
        }
        // numbers
        if (/\d/.test(sql[i]) && (i === 0 || !/\w/.test(sql[i - 1]))) {
            let j = i;
            while (j < sql.length && /[\d.]/.test(sql[j])) j++;
            tokens.push(`<span class="hl-num">${esc(sql.slice(i, j))}</span>`);
            i = j;
            continue;
        }
        // words / keywords
        if (/[a-zA-Z_*]/.test(sql[i])) {
            let j = i;
            while (j < sql.length && /[\w*]/.test(sql[j])) j++;
            const word = sql.slice(i, j);
            if (KEYWORDS.includes(word.toUpperCase())) {
                tokens.push(`<span class="hl-kw">${esc(word)}</span>`);
            } else {
                tokens.push(esc(word));
            }
            i = j;
            continue;
        }
        tokens.push(esc(sql[i]));
        i++;
    }
    return tokens.join("");
}

// ─────────────────────────────────────────────────────────────
// TABS
// ─────────────────────────────────────────────────────────────

type Tab = "editor" | "history" | "saved" | "metrics";

// ─────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────

export default function SqlEditor() {
    // ── editor state ──
    const [sql, setSql] = usePersistedState<string>("editor_sql",
        `SELECT u.id, u.name, u.email, u.created_at\nFROM users u\nWHERE u.active = 1\nORDER BY u.created_at DESC\nLIMIT 100;`
    );
    const [activeTab, setActiveTab] = useState<Tab>("editor");

    // ── execution state ──
    const [isExecuting, setIsExecuting] = useState(false);
    const [queryId, setQueryId] = useState<string | null>(null);
    const [columns, setColumns] = useState<string[]>([]);
    const [rows, setRows] = useState<Record<string, unknown>[]>([]);
    const [execError, setExecError] = useState<string | null>(null);
    const [statusText, setStatusText] = useState("Pronto");

    // ── selection badge ──
    const [selectionInfo, setSelectionInfo] = useState<string | null>(null);

    // ── sidebar panels ──
    const [analyzeResult, setAnalyzeResult] = useState<AnalyzeResult | null>(null);
    const [analyzing, setAnalyzing] = useState(false);

    const [history, setHistory] = useState<HistoryEntry[]>([]);
    const [saved, setSaved] = useState<SavedQuery[]>([]);
    const [metrics, setMetrics] = useState<Metrics | null>(null);

    const [saveModalOpen, setSaveModalOpen] = useState(false);
    const [saveName, setSaveName] = useState("");

    const [explainResult, setExplainResult] = useState<unknown[] | null>(null);
    const [explaining, setExplaining] = useState(false);

    // ── refs ──
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const preRef = useRef<HTMLPreElement>(null);
    const abortRef = useRef<AbortController | null>(null);
    const readerRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null);

    // ── highlighted SQL ──
    const highlighted = useMemo(() => highlight(sql) + "\u00a0", [sql]);

    // ─────────────────────────────────────────────────────────
    // HELPERS
    // ─────────────────────────────────────────────────────────

    function getQueryToRun(): { query: string; isPartial: boolean } {
        const ta = textareaRef.current;
        if (!ta) return { query: sql, isPartial: false };
        const sel = ta.value.slice(ta.selectionStart, ta.selectionEnd).trim();
        if (sel.length > 0) return { query: sel, isPartial: true };
        return { query: sql.trim(), isPartial: false };
    }

    function handleScroll() {
        if (textareaRef.current && preRef.current) {
            preRef.current.scrollTop = textareaRef.current.scrollTop;
            preRef.current.scrollLeft = textareaRef.current.scrollLeft;
        }
    }

    function updateSelBadge() {
        const ta = textareaRef.current;
        if (!ta) return;
        const sel = ta.value.slice(ta.selectionStart, ta.selectionEnd).trim();
        if (sel.length > 0) {
            const lines = sel.split("\n").length;
            setSelectionInfo(`${sel.length} chars · ${lines} linha${lines > 1 ? "s" : ""}`);
        } else {
            setSelectionInfo(null);
        }
    }

    function handleTab(e: React.KeyboardEvent<HTMLTextAreaElement>) {
        if (e.key === "Tab") {
            e.preventDefault();
            const ta = e.currentTarget;
            const s = ta.selectionStart;
            const en = ta.selectionEnd;
            const next = ta.value.slice(0, s) + "  " + ta.value.slice(en);
            setSql(next);
            requestAnimationFrame(() => {
                ta.selectionStart = ta.selectionEnd = s + 2;
            });
        }
    }

    const executeQuery = useCallback(async () => {
        if (isExecuting) return;

        const { query, isPartial } = getQueryToRun();

        if (!query) return;

        setIsExecuting(true);

        setExecError(null);
        setColumns([]);
        setRows([]);
        setExplainResult(null);
        setAnalyzeResult(null);

        setStatusText(
            isPartial
                ? "Executando seleção…"
                : "Executando…"
        );

        abortRef.current = new AbortController();

        try {
            const payload: ExecutePayload = {
                query,
                limit: 1000,
                stream: true,
            };

            const res = await fetch(
                `${BASE_URL}/execute`,
                {
                    method: "POST",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(payload),
                    signal: abortRef.current.signal,
                }
            );

            if (!res.ok) {
                let err: any = null;

                try {
                    err = await res.json();
                } catch {
                    //
                }

                throw new Error(
                    err?.detail?.message ??
                    err?.message ??
                    "Erro na execução"
                );
            }

            // fallback via header
            const qid = res.headers.get("X-Query-Id");

            if (qid) {
                setQueryId(qid);
            }

            const reader = res.body?.getReader();

            if (!reader) {
                throw new Error(
                    "Falha ao iniciar leitura do stream"
                );
            }

            readerRef.current = reader;

            const decoder = new TextDecoder();

            let buffer = "";

            // evita re-render excessivo
            let rowsBuffer: any[] = [];

            const flushRows = () => {
                if (rowsBuffer.length === 0) return;

                setRows((prev) => [
                    ...prev,
                    ...rowsBuffer,
                ]);

                rowsBuffer = [];
            };

            while (true) {
                const { done, value } =
                    await reader.read();

                if (done) break;

                buffer += decoder.decode(value, {
                    stream: true,
                });

                // suporta \n\n e \r\n\r\n
                const parts =
                    buffer.split(/\r?\n\r?\n/);

                buffer = parts.pop() ?? "";

                for (const part of parts) {
                    let eventType = "message";

                    let data = "";

                    const lines =
                        part.split(/\r?\n/);

                    for (const line of lines) {
                        if (
                            line.startsWith("event:")
                        ) {
                            eventType = line
                                .slice(6)
                                .trim();
                        }

                        if (
                            line.startsWith("data:")
                        ) {
                            data += line
                                .slice(5)
                                .trim();
                        }
                    }

                    if (!data) continue;

                    let parsed: any;

                    try {
                        parsed = JSON.parse(data);
                    } catch (e) {
                        console.error(
                            "Erro ao parsear SSE:",
                            e,
                            data
                        );

                        continue;
                    }

                    switch (eventType) {

                        // ─────────────────────
                        // START
                        // ─────────────────────

                        case "start": {
                            if (parsed.queryId) {
                                setQueryId(
                                    parsed.queryId
                                );
                            }

                            break;
                        }

                        // ─────────────────────
                        // PROGRESS
                        // ─────────────────────

                        case "progress": {
                            setStatusText(
                                `Executando ${parsed.current}/${parsed.total}`
                            );

                            break;
                        }

                        // ─────────────────────
                        // STATEMENT START
                        // ─────────────────────

                        case "statement_start": {
                            setStatusText(
                                `Executando ${parsed.type ?? "query"}`
                            );

                            break;
                        }

                        // ─────────────────────
                        // COLUMNS
                        // ─────────────────────

                        case "columns": {
                            setColumns(
                                parsed.columns ?? []
                            );

                            setStatusText(
                                "Lendo dados…"
                            );

                            break;
                        }

                        // ─────────────────────
                        // ROW
                        // ─────────────────────

                        case "row": {

                            if (parsed.row) {

                                setRows((prev) => [
                                    ...prev,
                                    parsed.row
                                ]);
                            }

                            break;
                        }

                        // ─────────────────────
                        // STATEMENT COMPLETE
                        // ─────────────────────

                        case "statement_complete": {
                            flushRows();

                            setStatusText(
                                `Statement concluído · ${parsed.rows ?? 0} linhas`
                            );

                            break;
                        }

                        // ─────────────────────
                        // COMPLETE
                        // ─────────────────────

                        case "complete": {
                            flushRows();

                            setStatusText(
                                "Concluído"
                            );

                            break;
                        }

                        // ─────────────────────
                        // LIMIT
                        // ─────────────────────

                        case "limit": {
                            flushRows();

                            setStatusText(
                                "Limite de linhas atingido"
                            );

                            break;
                        }

                        // ─────────────────────
                        // CANCELLED
                        // ─────────────────────

                        case "cancelled": {
                            flushRows();

                            setStatusText(
                                "Cancelado pelo usuário"
                            );

                            break;
                        }

                        // ─────────────────────
                        // ERROR
                        // ─────────────────────

                        case "error": {
                            flushRows();

                            setExecError(
                                parsed?.message ??
                                parsed ??
                                "Erro na execução"
                            );

                            setStatusText(
                                "Erro na execução"
                            );

                            break;
                        }

                        default:
                            break;
                    }
                }
            }

            // flush final
            flushRows();

        } catch (err: unknown) {

            const e = err as Error;

            if (e.name === "AbortError") {

                setStatusText(
                    "Cancelado pelo usuário"
                );

            } else {

                setExecError(
                    e.message ??
                    "Erro inesperado"
                );

                setStatusText(
                    "Falha na execução"
                );
            }

        } finally {

            setIsExecuting(false);

            abortRef.current = null;

            readerRef.current = null;
        }

    }, [isExecuting, sql]);

    // ─────────────────────────────────────────────
    // CANCEL QUERY
    // ─────────────────────────────────────────────

    const cancelQuery = useCallback(async () => {
        try {
            abortRef.current?.abort();

            await readerRef.current?.cancel();
        } catch {
            //
        }

        if (queryId) {
            try {
                await fetch(
                    `${BASE_URL}/cancel/${queryId}`,
                    {
                        method: "POST",
                        credentials: "include",
                    }
                );
            } catch {
                //
            }
        }

        setStatusText("Cancelado pelo usuário");
    }, [queryId]);

    // ─────────────────────────────────────────────────────────
    // ANALYZE
    // ─────────────────────────────────────────────────────────

    const analyzeQuery = useCallback(async () => {
        const { query } = getQueryToRun();

        if (!query) return;

        setAnalyzing(true);

        try {
            setExecError(null);

            const result = await apiPost<AnalyzeResponse>(
                "/analyze",
                { query }
            );

            console.log("Analyze result:", result);

            // se apiPost retorna JSON completo
            setAnalyzeResult(result.data);

            // se apiPost já retorna data:
            // setAnalyzeResult(result);

        } catch (e: unknown) {
            setExecError(
                (e as Error).message ?? "Erro ao analisar query"
            );
        } finally {
            setAnalyzing(false);
        }
    }, [sql]);

    // ─────────────────────────────────────────────────────────
    // EXPLAIN
    // ─────────────────────────────────────────────────────────

    const explainQuery = useCallback(async () => {
        const { query } = getQueryToRun();
        if (!query) return;
        setExplaining(true);
        try {
            const result = await apiPost<{ plan: unknown[] }>("/explain", { query });
            setExplainResult(result.plan);
            setColumns([]);
            setRows([]);
        } catch (e: unknown) {
            setExecError((e as Error).message);
        } finally {
            setExplaining(false);
        }
    }, [sql]);

    // ─────────────────────────────────────────────────────────
    // SAVE QUERY
    // ─────────────────────────────────────────────────────────

    const saveQuery = useCallback(async () => {
        if (!saveName.trim()) return;
        try {
            await apiPost<SavedQuery>("/save", { name: saveName, query: sql });
            setSaveModalOpen(false);
            setSaveName("");
            loadSaved();
        } catch (e: unknown) {
            setExecError((e as Error).message);
        }
    }, [saveName, sql]);

    // ─────────────────────────────────────────────────────────
    // LOAD SIDEBAR DATA
    // ─────────────────────────────────────────────────────────

    const loadHistory = useCallback(async () => {
        try {
            setHistory(await apiGet<HistoryEntry[]>("/history"));
        } catch {
            //
        }
    }, []);

    const loadSaved = useCallback(async () => {
        try {
            setSaved(await apiGet<SavedQuery[]>("/saved"));
        } catch {
            //
        }
    }, []);

    const loadMetrics = useCallback(async () => {
        try {
            setMetrics(await apiGet<Metrics>("/metrics"));
        } catch {
            //
        }
    }, []);

    useEffect(() => {
        if (activeTab === "history") loadHistory();
        if (activeTab === "saved") loadSaved();
        if (activeTab === "metrics") loadMetrics();
    }, [activeTab]);

    // ─────────────────────────────────────────────────────────
    // KEYBOARD SHORTCUTS
    // ─────────────────────────────────────────────────────────

    useEffect(() => {
        const handle = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.key === "Enter") {
                e.preventDefault();
                executeQuery();
            }
            if (e.ctrlKey && e.key === "s") {
                e.preventDefault();
                const blob = new Blob([sql], { type: "text/sql" });
                const a = document.createElement("a");
                a.href = URL.createObjectURL(blob);
                a.download = "query.sql";
                a.click();
                URL.revokeObjectURL(a.href);
            }
        };
        window.addEventListener("keydown", handle);
        return () => window.removeEventListener("keydown", handle);
    }, [executeQuery, sql]);

    // ─────────────────────────────────────────────────────────
    // AUTOCOMPLETE (simple prefix match via /autocomplete)
    // ─────────────────────────────────────────────────────────

    const [acSuggestions, setAcSuggestions] = useState<string[]>([]);

    const handleEditorChange = useCallback(
        async (e: React.ChangeEvent<HTMLTextAreaElement>) => {
            const val = e.target.value;
            setSql(val);

            // grab the word being typed
            const pos = e.target.selectionStart;
            const before = val.slice(0, pos);
            const match = before.match(/\b([A-Za-z_]+)$/);
            if (match && match[1].length >= 2) {
                try {
                    const res = await fetch(
                        `${BASE_URL}/autocomplete?q=${encodeURIComponent(match[1])}`,
                        { credentials: "include" }
                    );
                    const json = await res.json();
                    setAcSuggestions((json.data as string[]) ?? []);
                } catch {
                    setAcSuggestions([]);
                }
            } else {
                setAcSuggestions([]);
            }
        },
        []
    );

    // ─────────────────────────────────────────────────────────
    // RENDER
    // ─────────────────────────────────────────────────────────

    return (
        <div className="sql-root">
            <style>{`
        .sql-root { display:flex; flex-direction:column; gap:12px; width:100%; font-family:var(--font-sans,sans-serif); }

        /* ── editor shell ── */
        .editor-shell { border:0.5px solid #3a3a3a; border-radius:12px; overflow:hidden; background:#1e1e1e; }

        /* ── toolbar ── */
        .toolbar { height:52px; border-bottom:0.5px solid #333; padding:0 14px; display:flex; align-items:center; justify-content:space-between; background:#252526; gap:10px; }
        .toolbar-left { display:flex; align-items:center; gap:10px; color:#ccc; font-size:14px; font-weight:500; }
        .toolbar-right { display:flex; align-items:center; gap:8px; }

        .sel-badge { font-size:11px; background:#1a3a5c; color:#7ec8f4; padding:3px 9px; border-radius:5px; white-space:nowrap; }
        .hint { font-size:11px; color:#555; }
        .hint kbd { background:#2d2d2d; color:#888; padding:1px 4px; border-radius:3px; font-family:monospace; font-size:10px; }

        /* ── icon buttons ── */
        .icon-btn { display:flex; align-items:center; gap:5px; padding:5px 10px; border:0.5px solid #444; border-radius:6px; background:transparent; color:#aaa; cursor:pointer; font-size:12px; transition:background .12s,color .12s; white-space:nowrap; }
        .icon-btn:hover { background:#2a2a2a; color:#e0e0e0; }
        .icon-btn:disabled { opacity:0.4; cursor:not-allowed; }
        .icon-btn.green { border-color:#2d6a4f; color:#6fcf97; }
        .icon-btn.green:hover { background:#1a3d2a; color:#a8f0c2; }
        .icon-btn.red { border-color:#7b2d2d; color:#f08080; animation:pulse 1.2s infinite; }
        @keyframes pulse { 0%,100%{opacity:1}50%{opacity:.65} }

        /* ── editor area ── */
        .editor-area { position:relative; height:240px; overflow:hidden; background:#1e1e1e; }
        .hl-pre { position:absolute; inset:0; padding:13px 16px; font-family:monospace; font-size:13px; line-height:1.65; color:#d4d4d4; pointer-events:none; overflow:hidden; white-space:pre-wrap; word-break:break-word; }
        .sql-ta { position:absolute; inset:0; width:100%; height:100%; background:transparent; color:transparent; caret-color:#aeafad; resize:none; outline:none; padding:13px 16px; font-family:monospace; font-size:13px; line-height:1.65; overflow:auto; border:none; }
        .hl-kw { color:#569cd6; font-weight:600; }
        .hl-str { color:#ce9178; }
        .hl-num { color:#b5cea8; }
        .hl-cmt { color:#6a9955; font-style:italic; }

        /* ── autocomplete dropdown ── */
        .ac-list { position:absolute; bottom:0; left:16px; background:#252526; border:0.5px solid #444; border-radius:6px; z-index:10; overflow:hidden; transform:translateY(100%); }
        .ac-item { padding:5px 12px; font-family:monospace; font-size:12px; color:#ccc; cursor:pointer; }
        .ac-item:hover { background:#37373d; }

        /* ── status bar ── */
        .status-bar { height:28px; border-top:0.5px solid #2d2d2d; background:#252526; padding:0 14px; display:flex; align-items:center; justify-content:space-between; font-size:11px; color:#666; }

        /* ── secondary tabs ── */
        .sec-tabs { display:flex; gap:2px; border-bottom:0.5px solid var(--color-border-tertiary,#e0e0e0); background:var(--color-background-primary,#fff); }
        .sec-tab { padding:8px 14px; font-size:12px; cursor:pointer; color:var(--color-text-secondary,#666); border-bottom:2px solid transparent; background:none; border-top:none; border-left:none; border-right:none; transition:color .12s; }
        .sec-tab.active { color:var(--color-text-primary,#111); border-bottom-color:#3b82f6; font-weight:500; }

        /* ── results area ── */
        .results-shell { border:0.5px solid var(--color-border-secondary,#ddd); border-radius:12px; overflow:hidden; background:var(--color-background-primary,#fff); }
        .results-table-wrap { max-height:320px; overflow:auto; }
        table { width:100%; border-collapse:collapse; font-size:13px; }
        thead th { position:sticky; top:0; background:var(--color-background-secondary,#f5f5f5); padding:7px 14px; text-align:left; font-size:11px; font-weight:500; color:var(--color-text-secondary,#666); text-transform:uppercase; letter-spacing:.04em; border-bottom:0.5px solid var(--color-border-secondary,#ddd); white-space:nowrap; }
        tbody tr { border-bottom:0.5px solid var(--color-border-tertiary,#eee); }
        tbody tr:hover { background:var(--color-background-secondary,#f9f9f9); }
        td { padding:6px 14px; color:var(--color-text-primary,#111); white-space:nowrap; font-size:13px; }
        .null-v { color:var(--color-text-tertiary,#aaa); font-style:italic; }
        .empty-row td { text-align:center; padding:28px; color:var(--color-text-tertiary,#aaa); font-size:13px; }

        /* ── error box ── */
        .error-box { padding:14px 16px; display:flex; gap:10px; background:var(--color-background-danger,#fff5f5); color:var(--color-text-danger,#c0392b); font-size:13px; border-radius:12px; }

        /* ── analyze panel ── */
        .analyze-panel { padding:14px 16px; display:flex; flex-direction:column; gap:10px; }
        .analyze-row { display:flex; gap:8px; flex-wrap:wrap; }
        .tag { font-size:11px; padding:3px 8px; border-radius:5px; background:var(--color-background-secondary,#f0f0f0); color:var(--color-text-secondary,#555); }
        .tag.risk { background:#fff0f0; color:#c0392b; }
        .tag.ok { background:#f0fff4; color:#27ae60; }
        .suggestion { font-size:12px; color:#2563eb; }
        .kv { display:flex; justify-content:space-between; font-size:12px; padding:4px 0; border-bottom:0.5px solid var(--color-border-tertiary,#eee); }
        .kv:last-child { border-bottom:none; }
        .kv-label { color:var(--color-text-secondary,#666); }
        .kv-val { font-weight:500; color:var(--color-text-primary,#111); }

        /* ── history / saved ── */
        .list-item { padding:10px 14px; border-bottom:0.5px solid var(--color-border-tertiary,#eee); cursor:pointer; transition:background .1s; }
        .list-item:hover { background:var(--color-background-secondary,#f5f5f5); }
        .list-item-q { font-family:monospace; font-size:12px; color:var(--color-text-primary,#111); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .list-item-meta { font-size:11px; color:var(--color-text-tertiary,#aaa); margin-top:2px; }

        /* ── metrics ── */
        .metrics-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:10px; padding:14px; }
        .metric-card { background:var(--color-background-secondary,#f5f5f5); border-radius:8px; padding:14px; text-align:center; }
        .metric-val { font-size:28px; font-weight:500; color:var(--color-text-primary,#111); }
        .metric-label { font-size:11px; color:var(--color-text-secondary,#777); margin-top:4px; text-transform:uppercase; letter-spacing:.05em; }

        /* ── save modal ── */
        .modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,.45); display:flex; align-items:center; justify-content:center; z-index:100; }
        .modal { background:var(--color-background-primary,#fff); border-radius:12px; padding:20px; width:340px; display:flex; flex-direction:column; gap:12px; }
        .modal h3 { font-size:15px; font-weight:500; color:var(--color-text-primary,#111); }
        .modal input { width:100%; padding:8px 10px; border:0.5px solid var(--color-border-secondary,#ccc); border-radius:6px; font-size:13px; outline:none; color:var(--color-text-primary,#111); background:var(--color-background-primary,#fff); }
        .modal input:focus { border-color:#3b82f6; }
        .modal-actions { display:flex; justify-content:flex-end; gap:8px; }
        .btn-primary { padding:7px 16px; background:#2563eb; color:#fff; border:none; border-radius:6px; font-size:13px; cursor:pointer; }
        .btn-primary:hover { background:#1d4ed8; }
        .btn-ghost { padding:7px 16px; background:transparent; border:0.5px solid var(--color-border-secondary,#ccc); border-radius:6px; font-size:13px; cursor:pointer; color:var(--color-text-secondary,#666); }

        /* ── explain ── */
        .explain-wrap { padding:14px; overflow:auto; max-height:320px; }
        .explain-wrap pre { font-family:monospace; font-size:12px; color:var(--color-text-primary,#111); white-space:pre-wrap; }
      `}</style>

            {/* ── EDITOR SHELL ── */}
            <div className="editor-shell">

                {/* TOOLBAR */}
                <div className="toolbar">
                    <div className="toolbar-left">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#569cd6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" /><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" /></svg>
                        SQL Editor
                        {selectionInfo && (
                            <span className="sel-badge">✦ {selectionInfo}</span>
                        )}
                    </div>

                    <div className="toolbar-right">
                        <span className="hint">
                            <kbd>Ctrl</kbd>+<kbd>Enter</kbd> Executar &nbsp;
                            <kbd>Ctrl</kbd>+<kbd>S</kbd> Salvar
                        </span>

                        <button
                            className="icon-btn"
                            onClick={analyzeQuery}
                            disabled={isExecuting || analyzing}
                            title="Analisar query"
                        >
                            {analyzing ? "…" : "⚡ Analisar"}
                        </button>

                        <button
                            className="icon-btn"
                            onClick={explainQuery}
                            disabled={isExecuting || explaining}
                            title="EXPLAIN"
                        >
                            {explaining ? "…" : "🔍 Explain"}
                        </button>

                        <button
                            className="icon-btn"
                            onClick={() => setSaveModalOpen(true)}
                            disabled={isExecuting}
                            title="Salvar query"
                        >
                            💾 Salvar
                        </button>

                        {!isExecuting ? (
                            <button
                                className="icon-btn green"
                                onClick={executeQuery}
                                disabled={!sql.trim()}
                            >
                                ▶ Executar
                            </button>
                        ) : (
                            <button className="icon-btn red" onClick={cancelQuery}>
                                ■ Cancelar
                            </button>
                        )}
                    </div>
                </div>

                {/* EDITOR AREA */}
                <div className="editor-area">
                    <pre
                        ref={preRef}
                        className="hl-pre"
                        dangerouslySetInnerHTML={{ __html: highlighted }}
                    />
                    <textarea
                        ref={textareaRef}
                        value={sql}
                        onChange={handleEditorChange}
                        onScroll={handleScroll}
                        onKeyDown={handleTab}
                        onSelect={updateSelBadge}
                        onMouseUp={updateSelBadge}
                        onKeyUp={updateSelBadge}
                        spellCheck={false}
                        className="sql-ta"
                    />
                    {acSuggestions.length > 0 && (
                        <div className="ac-list">
                            {acSuggestions.map((s, i) => (
                                <div
                                    key={s + i + "_acSuggestions"}
                                    className="ac-item"
                                    onMouseDown={(e) => {
                                        e.preventDefault();
                                        const ta = textareaRef.current!;
                                        const pos = ta.selectionStart;
                                        const before = sql.slice(0, pos);
                                        const match = before.match(/\b([A-Za-z_]+)$/);
                                        if (match) {
                                            const start = pos - match[1].length;
                                            setSql(sql.slice(0, start) + s + " " + sql.slice(pos));
                                        }
                                        setAcSuggestions([]);
                                    }}
                                >
                                    {s}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* STATUS BAR */}
                <div className="status-bar">
                    <span>{statusText}</span>
                    <span>{rows.length} linha{rows.length !== 1 ? "s" : ""}</span>
                </div>
            </div>

            {/* ── SECONDARY TABS ── */}
            <div className="results-shell">
                <div className="sec-tabs">
                    {(["editor", "history", "saved", "metrics"] as Tab[]).map((t, i) => (
                        <button
                            key={t + i + "_secTab"}
                            className={`sec-tab${activeTab === t ? " active" : ""}`}
                            onClick={() => setActiveTab(t)}
                        >
                            {t === "editor" && "Resultados"}
                            {t === "history" && "Histórico"}
                            {t === "saved" && "Salvos"}
                            {t === "metrics" && "Métricas"}
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
                                    <div
                                        key={`query-${qi}`}
                                        className="query-analysis-block"
                                    >
                                        <div className="analyze-row">

                                            <span className="tag">
                                                {q.queryType}
                                            </span>

                                            <span
                                                className={`tag ${q.risk?.safe
                                                    ? "ok"
                                                    : "risk"
                                                    }`}
                                            >
                                                {q.risk?.safe
                                                    ? "✓ Seguro"
                                                    : `⚠ ${q.risk?.risks?.join(", ")}`}
                                            </span>

                                            <span className="tag">
                                                Complexidade: {q.complexity}
                                            </span>

                                            {q.tables?.map((t, i) => (
                                                <span
                                                    key={`${t}-${i}`}
                                                    className="tag"
                                                >
                                                    📋 {t}
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

                        {explainResult && (
                            <div className="explain-wrap">
                                <pre>{JSON.stringify(explainResult, null, 2)}</pre>
                            </div>
                        )}

                        {columns.length > 0 && (
                            <div className="results-table-wrap">
                                <table>
                                    <thead>
                                        <tr>
                                            {columns.map((c, i) => (
                                                <th key={`${c}-${i}`}>
                                                    {c}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {rows.length === 0 ? (
                                            <tr className="empty-row">
                                                <td colSpan={columns.length}>
                                                    Nenhum resultado.
                                                </td>
                                            </tr>
                                        ) : (
                                            rows.map((row, ri) => (
                                                <tr key={`row-${ri}`}>
                                                    {columns.map((c, ci) => {
                                                        // suporta lowercase/uppercase
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
                                            setSql(h.query);
                                            setActiveTab("editor");
                                        }}
                                    >
                                        <div className="list-item-q">
                                            {h.query}
                                        </div>

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
                        {saved.length === 0
                            ? <div className="empty-row"><td>Nenhuma query salva.</td></div>
                            : saved.map((s, i) => (
                                <div key={s.id + i + "_saved"} className="list-item" onClick={() => { setSql(s.query); setActiveTab("editor"); }}>
                                    <div className="list-item-q" style={{ fontWeight: 500, fontFamily: "var(--font-sans)" }}>{s.name}</div>
                                    <div className="list-item-meta list-item-q" style={{ marginTop: 3 }}>{s.query}</div>
                                    <div className="list-item-meta">{new Date(s.created_at).toLocaleString("pt-BR")}</div>
                                </div>
                            ))
                        }
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

            {/* ── SAVE MODAL ── */}
            {saveModalOpen && (
                <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setSaveModalOpen(false); }}>
                    <div className="modal">
                        <h3>Salvar query</h3>
                        <input
                            autoFocus
                            placeholder="Nome da query…"
                            value={saveName}
                            onChange={(e) => setSaveName(e.target.value)}
                            onKeyDown={(e) => { if (e.key === "Enter") saveQuery(); }}
                        />
                        <div className="modal-actions">
                            <button className="btn-ghost" onClick={() => setSaveModalOpen(false)}>Cancelar</button>
                            <button className="btn-primary" onClick={saveQuery} disabled={!saveName.trim()}>Salvar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
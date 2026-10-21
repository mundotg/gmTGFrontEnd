"use client";

import React, {
    useState,
    useMemo,
    useEffect,
    useRef,
    useCallback,
} from "react";
import usePersistedState from "@/hook/localStoreUse";
import { useSession } from "@/context/SessionContext";
import { useDatabaseMetadata } from "@/hook/useDatabaseMetadata";
import { useI18n } from "@/context/I18nContext";

// Tipos locais da rota
import {
    Tab,
    AcItem,
    ExecError,
    ExecutePayload,
    AnalyzeResponse,
    AnalyzeResult,
    SavedQuery,
    HistoryEntry,
    Metrics,
    QueryImpact,
    ValidationState,
    LastExecutionTelemetry,
} from "./types";

// Helpers locais da rota
import {
    BASE_URL,
    WS_BASE,
    highlight,
    analyzeQueryRealtime,
    apiPost,
    apiGet,
} from "./utils/sqlHelpers";

// Componentes agrupados na pasta da rota
import SqlEditorStyles from "./components/SqlEditorStyles";
import SqlToolbar from "./components/SqlToolbar";
import RealtimeQueryHud from "./components/RealtimeQueryHud";
import SqlCodeEditor from "./components/SqlCodeEditor";
import SqlResultsPanel from "./components/SqlResultsPanel";
import SqlSaveModal from "./components/SqlSaveModal";
import ImpactPredictorCard from "./components/ImpactPredictorCard";

export default function SqlEditor() {
    const { t } = useI18n();

    // ── editor state ──
    const [sql, setSql] = usePersistedState<string>(
        "editor_sql",
        `SELECT u.id, u.name, u.email, u.created_at\nFROM users u\nWHERE u.active = 1\nORDER BY u.created_at DESC\nLIMIT 100;`
    );
    const [activeTab, setActiveTab] = useState<Tab>("editor");

    // ── execution state ──
    const [isExecuting, setIsExecuting] = useState(false);
    const [queryId, setQueryId] = useState<string | null>(null);
    const [columns, setColumns] = useState<string[]>([]);
    const [rows, setRows] = useState<Record<string, unknown>[]>([]);
    const [execError, setExecError] = useState<ExecError>(null);
    const [statusText, setStatusText] = useState("Pronto");

    // ── realtime query analysis & live telemetry ──
    const [lastExecution, setLastExecution] = useState<LastExecutionTelemetry | null>(null);
    const execStartTimeRef = useRef<number>(0);

    const realtimeAnalysis = useMemo(() => {
        return analyzeQueryRealtime(sql);
    }, [sql]);

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
    const [impactResult, setImpactResult] = useState<QueryImpact | null>(null);
    const [impactModalPending, setImpactModalPending] = useState<QueryImpact | null>(null);

    // ── refs ──
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const preRef = useRef<HTMLPreElement>(null);
    const abortRef = useRef<AbortController | null>(null);
    const readerRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null);
    const receivedRowsRef = useRef(0);
    const pendingExecutionRef = useRef<{ query: string; isPartial: boolean } | null>(null);

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
            const lineWord = lines > 1 ? t("sqlEditorPage.linesCount", "linhas") : "linha";
            setSelectionInfo(
                `${sel.length} ${t("sqlEditorPage.chars", "chars")} · ${lines} ${lineWord}`
            );
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

    const _runExecute = useCallback(
        async (query: string, isPartial: boolean) => {
            setIsExecuting(true);
            execStartTimeRef.current = performance.now();

            setExecError(null);
            setColumns([]);
            setRows([]);
            receivedRowsRef.current = 0;
            setExplainResult(null);
            setAnalyzeResult(null);
            setImpactResult(null);
            setImpactModalPending(null);

            setStatusText(
                isPartial
                    ? t("sqlEditorPage.runningSelection", "Executando seleção…")
                    : t("sqlEditorPage.executing", "Executando…")
            );

            abortRef.current = new AbortController();

            try {
                const payload: ExecutePayload = {
                    query,
                    limit: 1000,
                    stream: true,
                };

                const res = await fetch(`${BASE_URL}/execute`, {
                    method: "POST",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(payload),
                    signal: abortRef.current.signal,
                });

                if (!res.ok) {
                    let err: any = null;
                    try {
                        err = await res.json();
                    } catch {
                        //
                    }
                    throw new Error(
                        err?.detail?.message ?? err?.message ?? "Erro na execução"
                    );
                }

                // fallback via header
                const qid = res.headers.get("X-Query-Id");
                if (qid) {
                    setQueryId(qid);
                }

                const reader = res.body?.getReader();
                if (!reader) {
                    throw new Error("Falha ao iniciar leitura do stream");
                }
                readerRef.current = reader;

                const decoder = new TextDecoder();
                let buffer = "";
                let rowsBuffer: Record<string, unknown>[] = [];

                const flushRows = () => {
                    if (rowsBuffer.length === 0) return;
                    const batch = rowsBuffer;
                    rowsBuffer = [];
                    setRows((prev) => [...prev, ...batch]);
                };

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    buffer += decoder.decode(value, { stream: true });
                    const parts = buffer.split(/\r?\n\r?\n/);
                    buffer = parts.pop() ?? "";

                    for (const part of parts) {
                        let eventType = "message";
                        let data = "";
                        const lines = part.split(/\r?\n/);

                        for (const line of lines) {
                            if (line.startsWith("event:")) {
                                eventType = line.slice(6).trim();
                            }
                            if (line.startsWith("data:")) {
                                data += line.slice(5).trim();
                            }
                        }

                        if (!data) continue;
                        let parsed: any;
                        try {
                            parsed = JSON.parse(data);
                        } catch (e) {
                            console.error("Erro ao parsear SSE:", e, data);
                            continue;
                        }

                        switch (eventType) {
                            case "start": {
                                if (parsed.queryId) {
                                    setQueryId(parsed.queryId);
                                }
                                break;
                            }
                            case "progress": {
                                setStatusText(
                                    `Executando ${parsed.current}/${parsed.total}`
                                );
                                break;
                            }
                            case "statement_start": {
                                setStatusText(
                                    `Executando ${parsed.type ?? "query"}`
                                );
                                break;
                            }
                            case "columns": {
                                setColumns(parsed.columns ?? []);
                                setStatusText("Lendo dados…");
                                break;
                            }
                            case "row": {
                                if (parsed.row) {
                                    rowsBuffer.push(parsed.row as Record<string, unknown>);
                                    receivedRowsRef.current += 1;
                                    if (rowsBuffer.length >= 50) flushRows();
                                }
                                break;
                            }
                            case "statement_complete": {
                                flushRows();
                                const elapsed = Math.round(
                                    performance.now() - execStartTimeRef.current
                                );
                                const count = parsed.rows ?? receivedRowsRef.current;

                                setStatusText(
                                    `Statement concluído · ${count} ${t("sqlEditorPage.rows", "linhas")}`
                                );

                                setLastExecution({
                                    durationMs: elapsed,
                                    rowsCount: count,
                                    statementType: parsed.type || realtimeAnalysis.statementType,
                                    timestamp: new Date(),
                                    status: "success",
                                });
                                break;
                            }
                            case "complete": {
                                flushRows();
                                const elapsed = Math.round(
                                    performance.now() - execStartTimeRef.current
                                );
                                setStatusText(t("sqlEditorPage.completed", "Concluído"));

                                setLastExecution((prev) => ({
                                    durationMs: elapsed,
                                    rowsCount:
                                        (prev?.rowsCount ?? 0) || receivedRowsRef.current,
                                    statementType:
                                        prev?.statementType || realtimeAnalysis.statementType,
                                    timestamp: new Date(),
                                    status: "success",
                                }));
                                break;
                            }
                            case "limit": {
                                flushRows();
                                setStatusText("Limite de linhas atingido");
                                break;
                            }
                            case "cancelled": {
                                flushRows();
                                const elapsed = Math.round(
                                    performance.now() - execStartTimeRef.current
                                );
                                setStatusText("Cancelado pelo usuário");

                                setLastExecution({
                                    durationMs: elapsed,
                                    rowsCount: receivedRowsRef.current,
                                    statementType: realtimeAnalysis.statementType,
                                    timestamp: new Date(),
                                    status: "cancelled",
                                });
                                break;
                            }
                            case "error": {
                                flushRows();
                                const elapsed = Math.round(
                                    performance.now() - execStartTimeRef.current
                                );
                                const errMsg = parsed?.message ?? parsed ?? "Erro na execução";

                                setExecError(errMsg);
                                setStatusText("Erro na execução");

                                setLastExecution({
                                    durationMs: elapsed,
                                    rowsCount: receivedRowsRef.current,
                                    statementType: realtimeAnalysis.statementType,
                                    timestamp: new Date(),
                                    status: "error",
                                    errorMsg:
                                        typeof errMsg === "string" ? errMsg : JSON.stringify(errMsg),
                                });
                                break;
                            }
                            default:
                                break;
                        }
                    }
                }

                flushRows();
            } catch (err: unknown) {
                const e = err as Error;
                const elapsed = Math.round(performance.now() - execStartTimeRef.current);

                if (e.name === "AbortError") {
                    setStatusText("Cancelado pelo usuário");
                    setLastExecution({
                        durationMs: elapsed,
                        rowsCount: receivedRowsRef.current,
                        statementType: realtimeAnalysis.statementType,
                        timestamp: new Date(),
                        status: "cancelled",
                    });
                } else {
                    setExecError(e.message ?? "Erro inesperado");
                    setStatusText("Falha na execução");
                    setLastExecution({
                        durationMs: elapsed,
                        rowsCount: receivedRowsRef.current,
                        statementType: realtimeAnalysis.statementType,
                        timestamp: new Date(),
                        status: "error",
                        errorMsg: e.message ?? "Erro inesperado",
                    });
                }
            } finally {
                setIsExecuting(false);
                abortRef.current = null;
                readerRef.current = null;
            }
        },
        [isExecuting, sql, realtimeAnalysis.statementType, t, rows.length]
    );

    const executeQuery = useCallback(
        async (bypassGuard: boolean = false) => {
            if (isExecuting) return;

            const { query, isPartial } = getQueryToRun();
            if (!query) return;

            // Guarda de Impacto Pré-Execução (Dry-Run Guard)
            if (!bypassGuard) {
                try {
                    const impact = await apiPost<QueryImpact>("/explain", { query });
                    if (impact?.requires_confirmation) {
                        pendingExecutionRef.current = { query, isPartial };
                        setImpactModalPending(impact);
                        return;
                    }
                } catch {
                    // Segue sem quebrar caso explain falhe por sintaxe
                }
            }

            await _runExecute(query, isPartial);
        },
        [_runExecute, isExecuting, sql]
    );

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
                await fetch(`${BASE_URL}/cancel/${queryId}`, {
                    method: "POST",
                    credentials: "include",
                });
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
            const result = await apiPost<AnalyzeResponse>("/analyze", { query });
            setAnalyzeResult(result.data);
        } catch (e: unknown) {
            setExecError((e as Error).message ?? "Erro ao analisar query");
        } finally {
            setAnalyzing(false);
        }
    }, [sql]);

    // ─────────────────────────────────────────────────────────
    // EXPLAIN / DRY-RUN
    // ─────────────────────────────────────────────────────────

    const explainQuery = useCallback(async () => {
        const { query } = getQueryToRun();
        if (!query) return;
        setExplaining(true);
        setExecError(null);
        try {
            const result = await apiPost<QueryImpact & { plan?: unknown[] }>("/explain", {
                query,
            });
            setImpactResult(result);
            setExplainResult(result.plan || []);
            setColumns([]);
            setRows([]);
            setActiveTab("editor");
        } catch (e: unknown) {
            setExecError((e as Error).message ?? "Erro ao executar Explain");
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
            await apiPost("/save", {
                name: saveName.trim(),
                query: sql,
            });
            setSaveModalOpen(false);
            setSaveName("");
            if (activeTab === "saved") loadSaved();
        } catch (e: unknown) {
            setExecError((e as Error).message ?? "Erro ao salvar query");
        }
    }, [saveName, sql, activeTab]);

    // ─────────────────────────────────────────────────────────
    // SIDEBAR DATA LOADERS
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
    }, [activeTab, loadHistory, loadSaved, loadMetrics]);

    // ─────────────────────────────────────────────────────────
    // KEYBOARD SHORTCUTS
    // ─────────────────────────────────────────────────────────

    useEffect(() => {
        const handle = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                e.preventDefault();
                executeQuery();
            }
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
                e.preventDefault();
                setSaveModalOpen(true);
            }
        };
        window.addEventListener("keydown", handle);
        return () => window.removeEventListener("keydown", handle);
    }, [executeQuery]);

    // ─────────────────────────────────────────────────────────
    // AUTOCOMPLETE + VALIDAÇÃO EM TEMPO REAL (WebSocket)
    // ─────────────────────────────────────────────────────────

    const { user } = useSession();
    const { metadata } = useDatabaseMetadata("light");

    const schemaTables = useMemo(
        () =>
            (metadata?.table_names ?? []).map((t) => ({
                name: t.name,
                columns: [] as string[],
            })),
        [metadata?.table_names]
    );

    const isMongo = useMemo(() => {
        const t = String(
            (user?.info_extra as Record<string, unknown> | undefined)?.type ??
                (user?.info_extra as Record<string, unknown> | undefined)?.db_type ??
                ""
        ).toLowerCase();
        return t.includes("mongo");
    }, [user?.info_extra]);

    const [acItems, setAcItems] = useState<AcItem[]>([]);
    const [validation, setValidation] = useState<ValidationState>(null);
    const [wsReady, setWsReady] = useState(false);

    const wsRef = useRef<WebSocket | null>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const cursorRef = useRef<number>(0);

    useEffect(() => {
        let closed = false;
        let retry: ReturnType<typeof setTimeout> | null = null;

        const connect = () => {
            if (closed) return;
            try {
                const ws = new WebSocket(WS_BASE);
                wsRef.current = ws;

                ws.onopen = () => setWsReady(true);
                ws.onclose = () => {
                    setWsReady(false);
                    if (!closed) retry = setTimeout(connect, 2500);
                };
                ws.onerror = () => ws.close();
                ws.onmessage = (ev) => {
                    try {
                        const msg = JSON.parse(ev.data);
                        if (msg.type === "autocomplete") setAcItems(msg.items ?? []);
                        else if (msg.type === "validate")
                            setValidation({
                                errors: msg.errors ?? [],
                                suggestions: msg.suggestions ?? [],
                            });
                    } catch {
                        //
                    }
                };
            } catch {
                retry = setTimeout(connect, 2500);
            }
        };

        connect();
        return () => {
            closed = true;
            if (retry) clearTimeout(retry);
            wsRef.current?.close();
            wsRef.current = null;
        };
    }, []);

    const pushRealtime = useCallback(
        (val: string, cursor: number) => {
            const ws = wsRef.current;
            if (!ws || ws.readyState !== WebSocket.OPEN) return;

            const tables = schemaTables;
            const before = val.slice(0, cursor);
            const typing = /([\w.]{1,})$/.exec(before)?.[1] ?? "";
            if (typing.length >= 1) {
                ws.send(
                    JSON.stringify({ type: "autocomplete", query: val, cursor, tables })
                );
            } else {
                setAcItems([]);
            }

            if (!isMongo) {
                ws.send(JSON.stringify({ type: "validate", query: val, tables }));
            } else {
                setValidation(null);
            }
        },
        [schemaTables, isMongo]
    );

    const handleEditorChange = useCallback(
        (e: React.ChangeEvent<HTMLTextAreaElement>) => {
            const val = e.target.value;
            const pos = e.target.selectionStart;
            cursorRef.current = pos;
            setSql(val);

            if (debounceRef.current) clearTimeout(debounceRef.current);
            debounceRef.current = setTimeout(() => pushRealtime(val, pos), 220);
        },
        [pushRealtime, setSql]
    );

    const applyAcItem = useCallback(
        (item: AcItem) => {
            const ta = textareaRef.current;
            if (!ta) return;
            const pos = ta.selectionStart;
            const before = sql.slice(0, pos);
            const m = before.match(/([\w.]+)$/);
            const start = m ? pos - m[1].length : pos;
            const dot =
                m && m[1].includes(".") ? m[1].slice(0, m[1].lastIndexOf(".") + 1) : "";
            const insert =
                dot && !item.insert.includes(".") ? dot + item.insert : item.insert;
            const next = sql.slice(0, start) + insert + " " + sql.slice(pos);
            setSql(next);
            setAcItems([]);
            requestAnimationFrame(() => {
                const np = start + insert.length + 1;
                ta.selectionStart = ta.selectionEnd = np;
                ta.focus();
            });
        },
        [sql, setSql]
    );

    const handleApplyLintFix = useCallback(
        (replace: string, withText: string) => {
            setSql((prev) => prev.replace(new RegExp(`\\b${replace}\\b`), withText));
        },
        [setSql]
    );

    // ─────────────────────────────────────────────────────────
    // RENDER
    // ─────────────────────────────────────────────────────────

    return (
        <div className="sql-root">
            <SqlEditorStyles />

            {/* ── EDITOR SHELL ── */}
            <div className="editor-shell">
                <SqlToolbar
                    selectionInfo={selectionInfo}
                    isExecuting={isExecuting}
                    analyzing={analyzing}
                    explaining={explaining}
                    canExecute={Boolean(sql.trim())}
                    onAnalyze={analyzeQuery}
                    onExplain={explainQuery}
                    onOpenSave={() => setSaveModalOpen(true)}
                    onExecute={() => executeQuery(false)}
                    onCancel={cancelQuery}
                />

                <RealtimeQueryHud
                    analysis={realtimeAnalysis}
                    isExecuting={isExecuting}
                    lastExecution={lastExecution}
                    rowsCount={rows.length}
                />

                <SqlCodeEditor
                    sql={sql}
                    highlighted={highlighted}
                    textareaRef={textareaRef}
                    preRef={preRef}
                    acItems={acItems}
                    validation={validation}
                    statusText={statusText}
                    isMongo={isMongo}
                    wsReady={wsReady}
                    rowsCount={rows.length}
                    onChange={handleEditorChange}
                    onScroll={handleScroll}
                    onKeyDown={handleTab}
                    onSelect={updateSelBadge}
                    onApplyAcItem={applyAcItem}
                    onApplyLintFix={handleApplyLintFix}
                />
            </div>

            {/* ── SECONDARY TABS & RESULTS ── */}
            <SqlResultsPanel
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                execError={execError}
                analyzeResult={analyzeResult}
                impactResult={impactResult}
                setImpactResult={setImpactResult}
                explainResult={explainResult}
                columns={columns}
                rows={rows}
                history={history}
                saved={saved}
                metrics={metrics}
                onSelectQuery={(q) => setSql(q)}
            />

            {/* ── SAVE MODAL ── */}
            <SqlSaveModal
                isOpen={saveModalOpen}
                saveName={saveName}
                onNameChange={setSaveName}
                onClose={() => setSaveModalOpen(false)}
                onSave={saveQuery}
            />

            {/* ── IMPACT PREDICTOR PRE-EXECUTION GUARD MODAL ── */}
            {impactModalPending && (
                <ImpactPredictorCard
                    impact={impactModalPending}
                    isModal={true}
                    onClose={() => {
                        pendingExecutionRef.current = null;
                        setImpactModalPending(null);
                    }}
                    onProceed={() => {
                        const pending = pendingExecutionRef.current;
                        pendingExecutionRef.current = null;
                        setImpactModalPending(null);
                        if (pending) void _runExecute(pending.query, pending.isPartial);
                    }}
                />
            )}
        </div>
    );
}
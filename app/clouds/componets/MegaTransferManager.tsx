"use client";

import { useState } from "react";
import {
    Activity,
    Archive,
    ArrowDownToLine,
    ArrowUpFromLine,
    CheckCircle2,
    ChevronDown,
    ChevronUp,
    Clock,
    Gauge,
    Layers,
    Pause,
    Play,
    RotateCcw,
    Trash2,
    XCircle,
    Zap,
} from "lucide-react";
import { formatBytes, formatEta, formatSpeed } from ".";

export type TransferDirection = "upload" | "download" | "zip";

export type TransferStatus =
    | "queued"
    | "compressing"
    | "active"
    | "rate_limited"
    | "paused"
    | "completed"
    | "error"
    | "cancelled";

export type TransferTask = {
    id: string;
    name: string;
    direction: TransferDirection;
    status: TransferStatus;
    totalBytes: number;
    loadedBytes: number;
    progress: number;
    speedBps: number;
    etaSeconds: number | null;
    compressed?: boolean;
    savedBytes?: number;
    compressionRatioPct?: number;
    folderId?: string | null;
    fileId?: string;
    fileObj?: File;
    zipFileIds?: string[];
    errorMsg?: string;
    retryAfterSec?: number;
    retries: number;
    abort?: () => void;
};

export function MegaTransferManager({
    tasks,
    concurrency,
    onChangeConcurrency,
    pacingMs,
    onChangePacingMs,
    compressionEnabled,
    onToggleCompression,
    queuePaused,
    onToggleQueuePaused,
    onCancelTask,
    onRetryTask,
    onClearCompleted,
}: {
    tasks: TransferTask[];
    concurrency: number;
    onChangeConcurrency: (n: number) => void;
    pacingMs: number;
    onChangePacingMs: (ms: number) => void;
    compressionEnabled: boolean;
    onToggleCompression: (val: boolean) => void;
    queuePaused: boolean;
    onToggleQueuePaused: () => void;
    onCancelTask: (id: string) => void;
    onRetryTask: (id: string) => void;
    onClearCompleted: () => void;
}) {
    const [minimized, setMinimized] = useState(false);
    const [filter, setFilter] = useState<"all" | "active" | "completed">("all");

    const activeTasks = tasks.filter(
        (t) => t.status === "active" || t.status === "compressing" || t.status === "rate_limited"
    );
    const queuedTasks = tasks.filter((t) => t.status === "queued" || t.status === "paused");
    const completedTasks = tasks.filter((t) => t.status === "completed");
    const failedTasks = tasks.filter((t) => t.status === "error" || t.status === "cancelled");

    const totalSpeedBps = activeTasks.reduce((acc, t) => acc + (t.speedBps || 0), 0);
    const totalSavedBytes = tasks.reduce((acc, t) => acc + (t.savedBytes || 0), 0);

    const overallTotalBytes = tasks.reduce((acc, t) => acc + (t.totalBytes || 0), 0);
    const overallLoadedBytes = tasks.reduce(
        (acc, t) => acc + (t.status === "completed" ? t.totalBytes : t.loadedBytes || 0),
        0
    );
    const overallProgress =
        overallTotalBytes > 0 ? Math.min(100, Math.round((overallLoadedBytes / overallTotalBytes) * 100)) : 0;

    const visibleTasks = tasks.filter((t) => {
        if (filter === "active") {
            return t.status !== "completed";
        }
        if (filter === "completed") {
            return t.status === "completed";
        }
        return true;
    });

    const statusBadge = (task: TransferTask) => {
        switch (task.status) {
            case "queued":
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 text-gray-600">
                        <Clock className="w-3 h-3" /> Em fila
                    </span>
                );
            case "compressing":
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-purple-50 text-purple-700 border border-purple-200 animate-pulse">
                        <Archive className="w-3 h-3" /> A comprimir Gzip…
                    </span>
                );
            case "active":
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                        <Activity className="w-3 h-3 animate-pulse" /> {formatSpeed(task.speedBps)}
                        {task.etaSeconds ? ` · ${formatEta(task.etaSeconds)}` : ""}
                    </span>
                );
            case "rate_limited":
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                        <Gauge className="w-3 h-3" /> Rate Limit (retoma em {task.retryAfterSec ?? 2}s)
                    </span>
                );
            case "paused":
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700">
                        <Pause className="w-3 h-3" /> Pausado
                    </span>
                );
            case "completed":
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" /> Concluído
                    </span>
                );
            case "cancelled":
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 text-gray-500">
                        Cancelado
                    </span>
                );
            case "error":
                return (
                    <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-red-50 text-red-700 border border-red-200"
                        title={task.errorMsg}
                    >
                        <XCircle className="w-3 h-3" /> {task.errorMsg || "Falha"}
                    </span>
                );
        }
    };

    return (
        <section className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden transition-all">
            {/* Cabeçalho do Gestor de Transferências estilo MEGA */}
            <div className="px-5 py-3.5 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center">
                        <Layers className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold tracking-tight">
                                Motor de Concorrência MEGA & Compressão
                            </h3>
                            <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                                {activeTasks.length}/{concurrency} Canais Ativos
                            </span>
                            {totalSpeedBps > 0 && (
                                <span className="px-2 py-0.5 text-[11px] font-mono font-semibold rounded-full bg-blue-500/20 text-blue-200 border border-blue-400/30">
                                    ⚡ {formatSpeed(totalSpeedBps)}
                                </span>
                            )}
                            {totalSavedBytes > 0 && (
                                <span className="px-2 py-0.5 text-[11px] font-semibold rounded-full bg-purple-500/20 text-purple-200 border border-purple-400/30">
                                    🗜️ Poupado {formatBytes(totalSavedBytes)}
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-slate-300 mt-0.5">
                            Fila paralela não-bloqueante · {queuedTasks.length} em espera ·{" "}
                            {completedTasks.length} concluídos
                            {failedTasks.length > 0 ? ` · ${failedTasks.length} com alerta` : ""}
                        </p>
                    </div>
                </div>

                {/* Controlos de Concorrência, Compressão e Rate Pacing */}
                <div className="flex flex-wrap items-center gap-2">
                    {/* Seletor de Canais Simultâneos */}
                    <div className="flex items-center gap-1.5 bg-white/10 border border-white/15 rounded-xl px-2.5 py-1 text-xs">
                        <Zap className="w-3.5 h-3.5 text-amber-300" />
                        <span className="text-slate-300 hidden sm:inline">Canais:</span>
                        {[1, 2, 3, 4, 6].map((n) => (
                            <button
                                key={n}
                                type="button"
                                onClick={() => onChangeConcurrency(n)}
                                className={`px-1.5 py-0.5 rounded-md font-mono font-semibold transition ${
                                    concurrency === n
                                        ? "bg-emerald-500 text-white shadow-sm"
                                        : "text-slate-300 hover:bg-white/10"
                                }`}
                                title={`${n} transferência(s) simultânea(s)`}
                            >
                                {n}x
                            </button>
                        ))}
                    </div>

                    {/* Seletor de Cadência (Rate Control) */}
                    <div className="flex items-center gap-1.5 bg-white/10 border border-white/15 rounded-xl px-2.5 py-1 text-xs">
                        <Gauge className="w-3.5 h-3.5 text-cyan-300" />
                        <span className="text-slate-300 hidden md:inline">Rate:</span>
                        {[
                            { label: "Turbo", ms: 0 },
                            { label: "Suave", ms: 250 },
                            { label: "Eco", ms: 700 },
                        ].map((opt) => (
                            <button
                                key={opt.ms}
                                type="button"
                                onClick={() => onChangePacingMs(opt.ms)}
                                className={`px-1.5 py-0.5 rounded-md font-medium transition ${
                                    pacingMs === opt.ms
                                        ? "bg-cyan-500 text-white"
                                        : "text-slate-300 hover:bg-white/10"
                                }`}
                                title={`Cadência entre envios: ${opt.ms}ms`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>

                    {/* Toggle de Compressão Gzip */}
                    <button
                        type="button"
                        onClick={() => onToggleCompression(!compressionEnabled)}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold border transition ${
                            compressionEnabled
                                ? "bg-purple-500/30 border-purple-400/50 text-purple-100"
                                : "bg-white/5 border-white/15 text-slate-300 hover:bg-white/10"
                        }`}
                        title="Comprimir ficheiros elegíveis com Gzip no browser e servidor antes de gravar no MinIO"
                    >
                        <Archive className="w-3.5 h-3.5" />
                        Gzip: {compressionEnabled ? "ON" : "OFF"}
                    </button>

                    {/* Pausar / Retomar Fila */}
                    {(activeTasks.length > 0 || queuedTasks.length > 0) && (
                        <button
                            type="button"
                            onClick={onToggleQueuePaused}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 border border-white/15 transition"
                        >
                            {queuePaused ? (
                                <>
                                    <Play className="w-3.5 h-3.5 text-emerald-300" /> Retomar
                                </>
                            ) : (
                                <>
                                    <Pause className="w-3.5 h-3.5 text-amber-300" /> Pausar
                                </>
                            )}
                        </button>
                    )}

                    <button
                        type="button"
                        onClick={() => setMinimized((m) => !m)}
                        className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 transition"
                        aria-label={minimized ? "Expandir fila" : "Minimizar fila"}
                    >
                        {minimized ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                    </button>
                </div>
            </div>

            {/* Barra de progresso global quando há tarefas */}
            {tasks.length > 0 && (
                <div className="h-1.5 w-full bg-slate-100 overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-emerald-500 via-blue-500 to-indigo-500 transition-all duration-300"
                        style={{ width: `${overallProgress}%` }}
                    />
                </div>
            )}

            {/* Corpo da Fila de Transferências */}
            {!minimized && (
                <div className="p-4 space-y-3">
                    {/* Filtros rápidos + Limpar concluídos */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-2.5">
                        <div className="flex items-center gap-1.5 text-xs">
                            <button
                                type="button"
                                onClick={() => setFilter("all")}
                                className={`px-2.5 py-1 rounded-lg font-medium transition ${
                                    filter === "all"
                                        ? "bg-gray-900 text-white"
                                        : "text-gray-600 hover:bg-gray-100"
                                }`}
                            >
                                Todas ({tasks.length})
                            </button>
                            <button
                                type="button"
                                onClick={() => setFilter("active")}
                                className={`px-2.5 py-1 rounded-lg font-medium transition ${
                                    filter === "active"
                                        ? "bg-blue-600 text-white"
                                        : "text-gray-600 hover:bg-gray-100"
                                }`}
                            >
                                Em curso / Fila ({activeTasks.length + queuedTasks.length})
                            </button>
                            <button
                                type="button"
                                onClick={() => setFilter("completed")}
                                className={`px-2.5 py-1 rounded-lg font-medium transition ${
                                    filter === "completed"
                                        ? "bg-emerald-600 text-white"
                                        : "text-gray-600 hover:bg-gray-100"
                                }`}
                            >
                                Concluídas ({completedTasks.length})
                            </button>
                        </div>

                        {completedTasks.length > 0 && (
                            <button
                                type="button"
                                onClick={onClearCompleted}
                                className="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-800 px-2 py-1 rounded-lg hover:bg-gray-100 transition"
                            >
                                <Trash2 className="w-3.5 h-3.5" /> Limpar concluídas
                            </button>
                        )}
                    </div>

                    {visibleTasks.length === 0 ? (
                        <div className="py-5 text-center text-xs text-gray-400">
                            Nenhuma transferência nesta vista. Arraste múltiplos ficheiros para a zona de upload ou selecione ficheiros para transferir em paralelo.
                        </div>
                    ) : (
                        <ul className="divide-y divide-gray-100 max-h-64 overflow-y-auto pr-1">
                            {visibleTasks.map((t) => (
                                <li
                                    key={t.id}
                                    className="py-2.5 px-2 flex flex-col sm:flex-row sm:items-center gap-2.5 hover:bg-gray-50/80 rounded-xl transition"
                                >
                                    {/* Ícone de direção */}
                                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                                        <span
                                            className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                                                t.direction === "upload"
                                                    ? "bg-emerald-50 text-emerald-600"
                                                    : t.direction === "zip"
                                                    ? "bg-purple-50 text-purple-600"
                                                    : "bg-blue-50 text-blue-600"
                                            }`}
                                        >
                                            {t.direction === "upload" ? (
                                                <ArrowUpFromLine className="w-3.5 h-3.5" />
                                            ) : t.direction === "zip" ? (
                                                <Archive className="w-3.5 h-3.5" />
                                            ) : (
                                                <ArrowDownToLine className="w-3.5 h-3.5" />
                                            )}
                                        </span>

                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span
                                                    className="text-xs font-semibold text-gray-800 truncate max-w-[240px]"
                                                    title={t.name}
                                                >
                                                    {t.name}
                                                </span>
                                                {t.compressed && (
                                                    <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded-md bg-purple-50 text-purple-700 border border-purple-200">
                                                        🗜️ Gzip {t.compressionRatioPct ? `-${t.compressionRatioPct}%` : ""}
                                                    </span>
                                                )}
                                                {statusBadge(t)}
                                            </div>

                                            {/* Barra de progresso individual */}
                                            <div className="mt-1.5 flex items-center gap-2">
                                                <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                                    <div
                                                        className={`h-1.5 rounded-full transition-all duration-200 ${
                                                            t.status === "completed"
                                                                ? "bg-emerald-500"
                                                                : t.status === "error"
                                                                ? "bg-red-500"
                                                                : t.status === "rate_limited"
                                                                ? "bg-amber-500"
                                                                : "bg-blue-500"
                                                        }`}
                                                        style={{ width: `${Math.min(100, t.progress)}%` }}
                                                    />
                                                </div>
                                                <span className="text-[11px] font-mono text-gray-500 w-28 text-right shrink-0">
                                                    {formatBytes(t.loadedBytes)} / {formatBytes(t.totalBytes)} ({t.progress}%)
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Ações por tarefa */}
                                    <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                                        {(t.status === "error" || t.status === "cancelled") && (
                                            <button
                                                type="button"
                                                onClick={() => onRetryTask(t.id)}
                                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 transition"
                                                title="Repetir transferência"
                                            >
                                                <RotateCcw className="w-3 h-3" /> Repetir
                                            </button>
                                        )}
                                        {(t.status === "active" ||
                                            t.status === "queued" ||
                                            t.status === "compressing" ||
                                            t.status === "rate_limited") && (
                                            <button
                                                type="button"
                                                onClick={() => onCancelTask(t.id)}
                                                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-red-600 hover:bg-red-50 transition"
                                                title="Cancelar transferência"
                                            >
                                                <XCircle className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
        </section>
    );
}


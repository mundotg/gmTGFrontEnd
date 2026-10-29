"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Share2, HardDrive, ShieldCheck, Gauge } from "lucide-react";
import api from "@/context/axioCuston";
import {
    ApiResponse,
    compressFileInBrowserGzip,
    FileItem,
    FilesResponseData,
    formatBytes,
    MAX_DIRECT_DOWNLOAD,
    MessageType,
    Pagination,
    StatCard,
    StatsData,
    StatsResponse,
    STYLES,
    Toast,
    validateFile,
} from "./componets";
import { ConfirmModal } from "./componets/confirmModal";
import { DropZone } from "./componets/dropZone";
import { FileList } from "./componets/FileList";
import {
    apiErrorMessage,
    CreateFolderModal,
    DeleteFolderModal,
    DragItem,
    FolderBreadcrumb,
    FolderGrid,
    FolderNode,
    hasOsFiles,
    isFechada,
    NewFolderButton,
     parseLockedError,
    PasswordModal,
    RenameFolderModal,
    UnlockModal,
} from "./componets/folders";
import { MegaTransferManager, TransferTask } from "./componets/MegaTransferManager";
import { PermissionsModal, TargetResource } from "./componets/PermissionsModal";

export default function StoragePage() {
    const [files, setFiles] = useState<FileItem[]>([]);
    const [sharedFiles, setSharedFiles] = useState<FileItem[]>([]);
    const [activeTab, setActiveTab] = useState<"mine" | "shared">("mine");
    const [stats, setStats] = useState<StatsData | null>(null);
    const [search, setSearch] = useState("");
    const [loadingFiles, setLoadingFiles] = useState(true);
    const [loadingStats, setLoadingStats] = useState(true);
    const [message, setMessage] = useState<MessageType | null>(null);
    const [confirmTarget, setConfirmTarget] = useState<string | null>(null);
    const [pagination, setPagination] = useState<Pagination>({
        page: 1,
        limit: 10,
        total: 0,
        pages: 1,
    });

    // ── Seleção múltipla para download paralelo / ZIP ──
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    // ── Motor de Concorrência MEGA & Compressão ──
    const [tasks, setTasks] = useState<TransferTask[]>([]);
    const [concurrency, setConcurrency] = useState<number>(3);
    const [pacingMs, setPacingMs] = useState<number>(0);
    const [compressionEnabled, setCompressionEnabled] = useState<boolean>(true);
    const [queuePaused, setQueuePaused] = useState<boolean>(false);
    const runningIdsRef = useRef<Set<string>>(new Set());
    const lastLaunchTimeRef = useRef<number>(0);

    // ── Modal de Controlo de Acesso & Permissões (ACL) ──
    const [permissionsTarget, setPermissionsTarget] = useState<TargetResource | null>(null);

    // ── Pastas ──
    const [folderTree, setFolderTree] = useState<FolderNode[]>([]);
    const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);

    // Modais de pastas
    const [creatingFolder, setCreatingFolder] = useState(false);
    const [unlockTarget, setUnlockTarget] = useState<{
        id: string;
        name: string;
        afterUnlock?: () => void;
    } | null>(null);
    const [unlockError, setUnlockError] = useState<string | null>(null);
    const [passwordFolder, setPasswordFolder] = useState<FolderNode | null>(null);
    const [passwordError, setPasswordError] = useState<string | null>(null);
    const [renameFolder, setRenameFolder] = useState<FolderNode | null>(null);
    const [renameError, setRenameError] = useState<string | null>(null);
    const [deleteFolder, setDeleteFolder] = useState<FolderNode | null>(null);
    const [folderBusy, setFolderBusy] = useState(false);

    // Arrastar-e-largar interno
    const [dragItem, setDragItem] = useState<DragItem | null>(null);

    const showMessage = useCallback(
        (text: string, type: MessageType["type"] = "success") => {
            setMessage({ text, type });
        },
        []
    );

    // ─── Helpers de navegação na árvore ──────────────────────────────────────

    const findPath = useCallback(
        (nodes: FolderNode[], targetId: string | null): FolderNode[] => {
            if (!targetId) return [];
            for (const n of nodes) {
                if (n.id === targetId) return [n];
                const sub = findPath(n.children, targetId);
                if (sub.length) return [n, ...sub];
            }
            return [];
        },
        []
    );

    const folderPath = findPath(folderTree, currentFolderId);
    const currentFolder = folderPath[folderPath.length - 1] ?? null;
    const childFolders = currentFolder ? currentFolder.children : folderTree;

    // ─── Fetchers ────────────────────────────────────────────────────────────

    const fetchFolders = useCallback(async () => {
        try {
            const res = await api.get("/storage/folders");
            setFolderTree(res.data?.data?.folders ?? []);
        } catch {
            showMessage("Erro ao carregar pastas", "error");
        }
    }, [showMessage]);

    const fetchFiles = useCallback(
        async (page = 1, folderId: string | null = currentFolderId) => {
            setLoadingFiles(true);
            try {
                const params: Record<string, any> = { page, limit: pagination.limit };
                if (folderId) params.folder_id = folderId;

                const res = await api.get<ApiResponse<FilesResponseData>>(
                    "/storage/filespage",
                    { params }
                );
                const { items, pagination: pag } = res.data.data;

                setFiles(items);
                setPagination(pag);
                setSelectedIds([]);
            } catch (err) {
                const locked = parseLockedError(err);
                if (locked) {
                    setUnlockError(null);
                    setUnlockTarget({
                        id: locked.id || folderId || "",
                        name: locked.name,
                        afterUnlock: () => fetchFiles(page, folderId),
                    });
                } else {
                    showMessage(apiErrorMessage(err, "Erro ao carregar ficheiros"), "error");
                }
            } finally {
                setLoadingFiles(false);
            }
        },
        [pagination.limit, currentFolderId, showMessage]
    );

    const fetchSharedWithMe = useCallback(async () => {
        setLoadingFiles(true);
        try {
            const res = await api.get("/storage/shared-with-me");
            setSharedFiles(res.data?.data?.files ?? []);
            setSelectedIds([]);
        } catch (err) {
            showMessage(apiErrorMessage(err, "Erro ao carregar ficheiros partilhados"), "error");
        } finally {
            setLoadingFiles(false);
        }
    }, [showMessage]);

    const fetchStats = useCallback(async () => {
        setLoadingStats(true);
        try {
            const res = await api.get<StatsResponse>("/storage/stats");
            setStats(res.data?.data || null);
        } catch {
            showMessage("Erro ao carregar estatísticas", "error");
        } finally {
            setLoadingStats(false);
        }
    }, [showMessage]);

    const refreshAll = useCallback(
        (page = pagination.page) => {
            if (activeTab === "shared") {
                fetchSharedWithMe();
            } else {
                fetchFiles(page, currentFolderId);
            }
            fetchFolders();
            fetchStats();
        },
        [activeTab, fetchFiles, fetchSharedWithMe, fetchFolders, fetchStats, pagination.page, currentFolderId]
    );

    useEffect(() => {
        fetchFolders();
        fetchStats();
    }, [fetchFolders, fetchStats]);

    useEffect(() => {
        if (activeTab === "shared") {
            fetchSharedWithMe();
        } else {
            fetchFiles(1, currentFolderId);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentFolderId, activeTab]);

    // ─── Motor de Concorrência MEGA (Worker Pool) ────────────────────────────

    const updateTask = useCallback((id: string, patch: Partial<TransferTask>) => {
        setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
    }, []);

    const executeUploadTask = useCallback(
        async (task: TransferTask) => {
            if (!task.fileObj) return;
            const controller = new AbortController();
            updateTask(task.id, {
                abort: () => controller.abort(),
            });

            let payloadBlob: Blob = task.fileObj;
            let clientCompressed = false;
            let savedBytes = 0;
            let ratioPct = 0;

            if (compressionEnabled) {
                updateTask(task.id, { status: "compressing" });
                const compressedResult = await compressFileInBrowserGzip(task.fileObj);
                if (compressedResult) {
                    payloadBlob = compressedResult.blob;
                    clientCompressed = true;
                    savedBytes = compressedResult.originalSize - compressedResult.compressedSize;
                    ratioPct = compressedResult.ratioPercent;
                }
            }

            const formData = new FormData();
            formData.append("file", payloadBlob, task.fileObj.name);

            const params: Record<string, any> = {};
            if (task.folderId) params.folder_id = task.folderId;
            if (compressionEnabled) params.compress = true;
            if (clientCompressed) params.client_compressed = true;

            let lastTime = performance.now();
            let lastLoaded = 0;

            updateTask(task.id, {
                status: "active",
                compressed: clientCompressed || compressionEnabled,
                savedBytes,
                compressionRatioPct: ratioPct,
            });

            try {
                const res = await api.post("/storage/upload", formData, {
                    params,
                    headers: { "Content-Type": "multipart/form-data" },
                    timeout: 0,
                    signal: controller.signal,
                    onUploadProgress: (e) => {
                        const now = performance.now();
                        const dt = (now - lastTime) / 1000;
                        const total = e.total || task.totalBytes;
                        const loaded = e.loaded;
                        const pct = Math.min(100, Math.round((loaded * 100) / Math.max(1, total)));

                        let speed = 0;
                        if (dt >= 0.12) {
                            speed = (loaded - lastLoaded) / dt;
                            lastTime = now;
                            lastLoaded = loaded;
                        }

                        const remainingBytes = Math.max(0, total - loaded);
                        const eta = speed > 0 ? remainingBytes / speed : null;

                        updateTask(task.id, {
                            loadedBytes: loaded,
                            progress: pct,
                            ...(speed > 0 ? { speedBps: speed, etaSeconds: eta } : {}),
                        });
                    },
                });

                const srvData = res.data?.data;
                updateTask(task.id, {
                    status: "completed",
                    progress: 100,
                    loadedBytes: task.totalBytes,
                    speedBps: 0,
                    etaSeconds: null,
                    compressed: Boolean(srvData?.compressed),
                    savedBytes: srvData?.saved_bytes ?? savedBytes,
                    compressionRatioPct: srvData?.compression_ratio_percent ?? ratioPct,
                });

                refreshAll(1);
            } catch (err: any) {
                if (err?.name === "CanceledError" || err?.code === "ERR_CANCELED") {
                    updateTask(task.id, { status: "cancelled", speedBps: 0, etaSeconds: null });
                    return;
                }

                // Se pasta bloqueada (423)
                const locked = parseLockedError(err);
                if (locked) {
                    updateTask(task.id, {
                        status: "paused",
                        errorMsg: `Pasta '${locked.name}' bloqueada`,
                        speedBps: 0,
                    });
                    setUnlockError(null);
                    setUnlockTarget({
                        id: locked.id || task.folderId || "",
                        name: locked.name,
                        afterUnlock: () => updateTask(task.id, { status: "queued" }),
                    });
                    return;
                }

                // Se Rate Limit (429): auto-backoff e retoma automática!
                if (err?.response?.status === 429 && task.retries < 4) {
                    const retryHeader = Number(err.response.headers?.["retry-after"]);
                    const retryDetail = Number(err.response.data?.detail?.retry_after);
                    const waitSec =
                        (isFinite(retryHeader) && retryHeader > 0
                            ? retryHeader
                            : isFinite(retryDetail) && retryDetail > 0
                            ? retryDetail
                            : Math.pow(2, task.retries + 1)) || 2;

                    updateTask(task.id, {
                        status: "rate_limited",
                        retryAfterSec: waitSec,
                        retries: task.retries + 1,
                        speedBps: 0,
                    });

                    setTimeout(() => {
                        updateTask(task.id, { status: "queued", retryAfterSec: undefined });
                    }, waitSec * 1000);
                    return;
                }

                updateTask(task.id, {
                    status: "error",
                    errorMsg: apiErrorMessage(err, "Erro no upload"),
                    speedBps: 0,
                    etaSeconds: null,
                });
            }
        },
        [compressionEnabled, refreshAll, updateTask]
    );

    const executeDownloadTask = useCallback(
        async (task: TransferTask) => {
            const controller = new AbortController();
            updateTask(task.id, {
                status: "active",
                abort: () => controller.abort(),
            });

            let lastTime = performance.now();
            let lastLoaded = 0;

            try {
                if (task.direction === "zip") {
                    // Download em lote .ZIP
                    const response = await api.post(
                        "/storage/download-zip",
                        {
                            file_ids: task.zipFileIds ?? [],
                            folder_id: task.folderId ?? null,
                            archive_name: task.name,
                        },
                        {
                            responseType: "blob",
                            timeout: 0,
                            signal: controller.signal,
                            onDownloadProgress: (e) => {
                                const now = performance.now();
                                const dt = (now - lastTime) / 1000;
                                const total = e.total || task.totalBytes || 1;
                                const loaded = e.loaded;
                                const pct = Math.min(99, Math.round((loaded * 100) / total));
                                let speed = 0;
                                if (dt >= 0.12) {
                                    speed = (loaded - lastLoaded) / dt;
                                    lastTime = now;
                                    lastLoaded = loaded;
                                }
                                updateTask(task.id, {
                                    loadedBytes: loaded,
                                    progress: pct,
                                    ...(speed > 0 ? { speedBps: speed } : {}),
                                });
                            },
                        }
                    );

                    const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
                    const link = document.createElement("a");
                    link.href = blobUrl;
                    link.setAttribute("download", task.name);
                    document.body.appendChild(link);
                    link.click();
                    link.remove();
                    window.URL.revokeObjectURL(blobUrl);

                    updateTask(task.id, {
                        status: "completed",
                        progress: 100,
                        loadedBytes: response.data.size || task.totalBytes,
                        totalBytes: response.data.size || task.totalBytes,
                        speedBps: 0,
                        etaSeconds: null,
                    });
                    fetchStats();
                    return;
                }

                // Download individual
                const params: Record<string, any> = {};
                if (task.folderId) params.folder_id = task.folderId;
                if (task.fileId) params.file_id = task.fileId;

                if (task.totalBytes <= MAX_DIRECT_DOWNLOAD) {
                    const response = await api.get(
                        `/storage/download/${encodeURIComponent(task.name)}`,
                        {
                            params,
                            responseType: "blob",
                            timeout: 0,
                            signal: controller.signal,
                            onDownloadProgress: (e) => {
                                const now = performance.now();
                                const dt = (now - lastTime) / 1000;
                                const total = e.total || task.totalBytes || 1;
                                const loaded = e.loaded;
                                const pct = Math.min(100, Math.round((loaded * 100) / total));
                                let speed = 0;
                                if (dt >= 0.12) {
                                    speed = (loaded - lastLoaded) / dt;
                                    lastTime = now;
                                    lastLoaded = loaded;
                                }
                                const eta =
                                    speed > 0 ? Math.max(0, total - loaded) / speed : null;
                                updateTask(task.id, {
                                    loadedBytes: loaded,
                                    progress: pct,
                                    ...(speed > 0 ? { speedBps: speed, etaSeconds: eta } : {}),
                                });
                            },
                        }
                    );

                    const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
                    const link = document.createElement("a");
                    link.href = blobUrl;
                    link.setAttribute("download", task.name);
                    document.body.appendChild(link);
                    link.click();
                    link.remove();
                    window.URL.revokeObjectURL(blobUrl);
                } else {
                    const res = await api.get(
                        `/storage/url/${encodeURIComponent(task.name)}`,
                        { params, signal: controller.signal }
                    );
                    const signedUrl = res.data?.data?.url;
                    if (!signedUrl) throw new Error("URL de download não disponível");
                    const link = document.createElement("a");
                    link.href = signedUrl;
                    link.setAttribute("download", task.name);
                    document.body.appendChild(link);
                    link.click();
                    link.remove();
                }

                updateTask(task.id, {
                    status: "completed",
                    progress: 100,
                    loadedBytes: task.totalBytes,
                    speedBps: 0,
                    etaSeconds: null,
                });
                fetchStats();
            } catch (err: any) {
                if (err?.name === "CanceledError" || err?.code === "ERR_CANCELED") {
                    updateTask(task.id, { status: "cancelled", speedBps: 0, etaSeconds: null });
                    return;
                }

                if (err?.response?.status === 429 && task.retries < 4) {
                    const waitSec =
                        Number(err.response.headers?.["retry-after"]) ||
                        Math.pow(2, task.retries + 1);
                    updateTask(task.id, {
                        status: "rate_limited",
                        retryAfterSec: waitSec,
                        retries: task.retries + 1,
                        speedBps: 0,
                    });
                    setTimeout(() => {
                        updateTask(task.id, { status: "queued", retryAfterSec: undefined });
                    }, waitSec * 1000);
                    return;
                }

                const msg = apiErrorMessage(err, `Erro ao baixar "${task.name}"`);
                updateTask(task.id, {
                    status: "error",
                    errorMsg: msg,
                    speedBps: 0,
                    etaSeconds: null,
                });
                showMessage(msg, "error");
            }
        },
        [fetchStats, showMessage, updateTask]
    );

    // ─── Escalonador Concorrente (MEGA Queue Dispatcher) ─────────────────────

    useEffect(() => {
        if (queuePaused) return;

        const activeCount = tasks.filter(
            (t) => t.status === "active" || t.status === "compressing"
        ).length;
        const availableSlots = Math.max(0, concurrency - activeCount);
        if (availableSlots <= 0) return;

        const nextQueued = tasks
            .filter((t) => t.status === "queued" && !runningIdsRef.current.has(t.id))
            .slice(0, availableSlots);

        if (nextQueued.length === 0) return;

        nextQueued.forEach((task, idx) => {
            runningIdsRef.current.add(task.id);
            const now = Date.now();
            const delay = Math.max(0, idx * pacingMs - (now - lastLaunchTimeRef.current));
            lastLaunchTimeRef.current = now + delay;

            setTimeout(async () => {
                try {
                    if (task.direction === "upload") {
                        await executeUploadTask(task);
                    } else {
                        await executeDownloadTask(task);
                    }
                } finally {
                    runningIdsRef.current.delete(task.id);
                }
            }, delay);
        });
    }, [tasks, concurrency, pacingMs, queuePaused, executeUploadTask, executeDownloadTask]);

    // ─── Enfileiramento de Uploads e Downloads ───────────────────────────────

    const enqueueUploads = useCallback(
        (incomingFiles: File[], targetFolderId: string | null = currentFolderId) => {
            const validTasks: TransferTask[] = [];
            for (const f of incomingFiles) {
                const err = validateFile(f);
                if (err) {
                    showMessage(`${f.name}: ${err}`, "error");
                    continue;
                }
                validTasks.push({
                    id: `up-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                    name: f.name,
                    direction: "upload",
                    status: "queued",
                    totalBytes: f.size,
                    loadedBytes: 0,
                    progress: 0,
                    speedBps: 0,
                    etaSeconds: null,
                    folderId: targetFolderId,
                    fileObj: f,
                    retries: 0,
                });
            }
            if (validTasks.length > 0) {
                setTasks((prev) => [...validTasks, ...prev]);
                showMessage(
                    `${validTasks.length} ficheiro(s) adicionado(s) à fila MEGA (${concurrency}x canais)`,
                    "success"
                );
            }
        },
        [currentFolderId, concurrency, showMessage]
    );

    const enqueueDownload = useCallback((file: FileItem) => {
        if (file.my_role === "viewer") {
            showMessage(
                `Sem permissão de download para "${file.filename}" (Apenas Leitura).`,
                "warning"
            );
            return;
        }
        const newTask: TransferTask = {
            id: `dl-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            name: file.filename,
            direction: "download",
            status: "queued",
            totalBytes: file.size_bytes,
            loadedBytes: 0,
            progress: 0,
            speedBps: 0,
            etaSeconds: null,
            fileId: file.id,
            folderId: file.folder_id ?? currentFolderId,
            retries: 0,
        };
        setTasks((prev) => [newTask, ...prev]);
    }, [currentFolderId, showMessage]);

    const enqueueBulkParallelDownloads = useCallback(
        (selectedFiles: FileItem[]) => {
            const downloadable = selectedFiles.filter((f) => f.my_role !== "viewer");
            if (downloadable.length === 0) {
                showMessage("Os ficheiros selecionados têm apenas permissão de leitura.", "warning");
                return;
            }
            const newTasks: TransferTask[] = downloadable.map((f) => ({
                id: `dl-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                name: f.filename,
                direction: "download",
                status: "queued",
                totalBytes: f.size_bytes,
                loadedBytes: 0,
                progress: 0,
                speedBps: 0,
                etaSeconds: null,
                fileId: f.id,
                folderId: f.folder_id ?? currentFolderId,
                retries: 0,
            }));
            setTasks((prev) => [...newTasks, ...prev]);
            showMessage(
                `${newTasks.length} transferências adicionadas em paralelo à fila MEGA!`,
                "success"
            );
        },
        [currentFolderId, showMessage]
    );

    const enqueueZipDownload = useCallback(
        (selectedFiles: FileItem[], folder?: FolderNode) => {
            const totalEstimated = selectedFiles.reduce((acc, f) => acc + f.size_bytes, 0);
            const archiveName = folder
                ? `${folder.name}.zip`
                : `mustainf-cloud-${selectedFiles.length}-ficheiros.zip`;

            const zipTask: TransferTask = {
                id: `zip-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                name: archiveName,
                direction: "zip",
                status: "queued",
                totalBytes: totalEstimated || 1024 * 100,
                loadedBytes: 0,
                progress: 0,
                speedBps: 0,
                etaSeconds: null,
                compressed: true,
                folderId: folder ? folder.id : null,
                zipFileIds: selectedFiles.map((f) => f.id),
                retries: 0,
            };
            setTasks((prev) => [zipTask, ...prev]);
            showMessage(`A comprimir e transferir pacote "${archiveName}"…`, "success");
        },
        [showMessage]
    );

    const handleCancelTask = useCallback((id: string) => {
        setTasks((prev) =>
            prev.map((t) => {
                if (t.id === id) {
                    t.abort?.();
                    return { ...t, status: "cancelled", speedBps: 0, etaSeconds: null };
                }
                return t;
            })
        );
    }, []);

    const handleRetryTask = useCallback((id: string) => {
        setTasks((prev) =>
            prev.map((t) =>
                t.id === id
                    ? { ...t, status: "queued", progress: 0, loadedBytes: 0, errorMsg: undefined }
                    : t
            )
        );
    }, []);

    const handleClearCompleted = useCallback(() => {
        setTasks((prev) => prev.filter((t) => t.status !== "completed" && t.status !== "cancelled"));
    }, []);

    // Mapa de progresso de download para as linhas da FileList
    const downloadingProgressById: Record<string, number> = {};
    for (const t of tasks) {
        if (t.direction === "download" && t.status === "active") {
            if (t.fileId) downloadingProgressById[t.fileId] = t.progress;
            downloadingProgressById[t.name] = t.progress;
        }
    }

    // ─── Apagar ficheiro ─────────────────────────────────────────────────────

    const handleDeleteConfirmed = async () => {
        if (!confirmTarget) return;
        const target = confirmTarget;
        setConfirmTarget(null);
        try {
            const params = currentFolderId ? { folder_id: currentFolderId } : {};
            await api.delete(`/storage/delete/${encodeURIComponent(target)}`, { params });
            showMessage(`"${target}" apagado com sucesso`, "success");
            refreshAll();
        } catch (err) {
            showMessage(apiErrorMessage(err, `Erro ao apagar "${target}"`), "error");
        }
    };

    // ─── Ações de pastas ─────────────────────────────────────────────────────

    const openFolder = (f: FolderNode) => {
        if (isFechada(f)) {
            setUnlockError(null);
            setUnlockTarget({
                id: f.id,
                name: f.name,
                afterUnlock: () => setCurrentFolderId(f.id),
            });
            return;
        }
        setCurrentFolderId(f.id);
    };

    const navigateBreadcrumb = (index: number) => {
        if (index < 0) setCurrentFolderId(null);
        else setCurrentFolderId(folderPath[index].id);
    };

    const handleCreateFolder = async (name: string, password?: string) => {
        setFolderBusy(true);
        try {
            await api.post("/storage/folders", {
                name,
                parent_id: currentFolderId,
                password: password || null,
            });
            setCreatingFolder(false);
            showMessage(`Pasta "${name}" criada`, "success");
            fetchFolders();
        } catch (err) {
            showMessage(apiErrorMessage(err, "Erro ao criar pasta"), "error");
        } finally {
            setFolderBusy(false);
        }
    };

    const handleUnlock = async (password: string) => {
        if (!unlockTarget) return;
        setFolderBusy(true);
        setUnlockError(null);
        try {
            await api.post(`/storage/folders/${unlockTarget.id}/unlock`, { password });
            const next = unlockTarget.afterUnlock;
            setUnlockTarget(null);
            await fetchFolders();
            next?.();
        } catch (err) {
            setUnlockError(apiErrorMessage(err, "Senha incorreta"));
        } finally {
            setFolderBusy(false);
        }
    };

    const handleLockNow = async (f: FolderNode) => {
        try {
            await api.post(`/storage/folders/${f.id}/lock`);
            showMessage(`Pasta "${f.name}" bloqueada`, "success");
            if (currentFolderId === f.id) setCurrentFolderId(f.parent_id);
            fetchFolders();
        } catch (err) {
            showMessage(apiErrorMessage(err, "Erro ao bloquear pasta"), "error");
        }
    };

    const handlePasswordChange = async (
        current: string | undefined,
        nova: string | undefined
    ) => {
        if (!passwordFolder) return;
        setFolderBusy(true);
        setPasswordError(null);
        try {
            await api.put(`/storage/folders/${passwordFolder.id}/password`, {
                current_password: current ?? null,
                new_password: nova ?? null,
            });
            setPasswordFolder(null);
            showMessage(nova ? "Senha atualizada" : "Senha removida", "success");
            fetchFolders();
        } catch (err) {
            setPasswordError(apiErrorMessage(err, "Erro ao alterar senha"));
        } finally {
            setFolderBusy(false);
        }
    };

    const handleRenameFolder = async (name: string) => {
        if (!renameFolder) return;
        setFolderBusy(true);
        setRenameError(null);
        try {
            await api.patch(`/storage/folders/${renameFolder.id}`, { name });
            setRenameFolder(null);
            showMessage("Pasta renomeada", "success");
            fetchFolders();
        } catch (err) {
            setRenameError(apiErrorMessage(err, "Erro ao renomear pasta"));
        } finally {
            setFolderBusy(false);
        }
    };

    const handleDeleteFolder = async () => {
        if (!deleteFolder) return;
        setFolderBusy(true);
        try {
            await api.delete(`/storage/folders/${deleteFolder.id}`);
            const nome = deleteFolder.name;
            setDeleteFolder(null);
            showMessage(`Pasta "${nome}" apagada`, "success");
            refreshAll();
        } catch (err) {
            showMessage(apiErrorMessage(err, "Erro ao apagar pasta"), "error");
        } finally {
            setFolderBusy(false);
        }
    };

    // ─── Arrastar-e-largar ───────────────────────────────────────────────────

    const moveItemToFolder = useCallback(
        async (item: DragItem, targetFolderId: string | null) => {
            try {
                if (item.kind === "file") {
                    await api.patch(`/storage/files/${item.id}/move`, {
                        folder_id: targetFolderId,
                        move_to_root: targetFolderId === null,
                    });
                } else {
                    if (item.id === targetFolderId) return;
                    await api.patch(`/storage/folders/${item.id}`, {
                        parent_id: targetFolderId,
                        move_to_root: targetFolderId === null,
                    });
                }
                showMessage(`"${item.name}" movido`, "success");
                refreshAll();
            } catch (err) {
                const locked = parseLockedError(err);
                if (locked) {
                    setUnlockError(null);
                    setUnlockTarget({
                        id: locked.id || targetFolderId || "",
                        name: locked.name,
                        afterUnlock: () => moveItemToFolder(item, targetFolderId),
                    });
                } else {
                    showMessage(apiErrorMessage(err, "Não foi possível mover"), "error");
                }
            }
        },
        [refreshAll, showMessage]
    );

    const handleDropOnFolder = (destino: FolderNode, e: React.DragEvent) => {
        const item = dragItem;
        setDragItem(null);

        if (item) {
            if (isFechada(destino)) {
                setUnlockError(null);
                setUnlockTarget({
                    id: destino.id,
                    name: destino.name,
                    afterUnlock: () => moveItemToFolder(item, destino.id),
                });
                return;
            }
            moveItemToFolder(item, destino.id);
            return;
        }

        if (hasOsFiles(e) && e.dataTransfer.files?.length) {
            const droppedFiles = Array.from(e.dataTransfer.files);
            if (isFechada(destino)) {
                setUnlockError(null);
                setUnlockTarget({
                    id: destino.id,
                    name: destino.name,
                    afterUnlock: () => enqueueUploads(droppedFiles, destino.id),
                });
                return;
            }
            enqueueUploads(droppedFiles, destino.id);
        }
    };

    const handleDropOnBreadcrumb = (folderId: string | null, e: React.DragEvent) => {
        const item = dragItem;
        setDragItem(null);

        if (item) {
            if (folderId === currentFolderId) return;
            moveItemToFolder(item, folderId);
            return;
        }

        if (hasOsFiles(e) && e.dataTransfer.files?.length) {
            enqueueUploads(Array.from(e.dataTransfer.files), folderId);
        }
    };

    // ─── Métricas e Rate Status ──────────────────────────────────────────────

    const usedBytes = stats?.usage.storage_bytes ?? 0;
    const maxBytes = (stats?.plan.max_storage_mb ?? 1) * 1024 * 1024;
    const storagePercent = Math.min(100, (usedBytes / maxBytes) * 100);

    const usedReqs = stats?.usage.requests ?? 0;
    const maxReqs = stats?.plan.max_requests ?? 1;
    const reqPercent = Math.min(100, (usedReqs / maxReqs) * 100);

    const rl = stats?.rate_limit;
    const activeUploadsCount = tasks.filter(
        (t) => t.direction === "upload" && (t.status === "active" || t.status === "compressing")
    ).length;
    const queuedUploadsCount = tasks.filter(
        (t) => t.direction === "upload" && t.status === "queued"
    ).length;

    const displayedFiles = activeTab === "shared" ? sharedFiles : files;

    return (
        <>
            <style>{STYLES}</style>

            {/* MODAIS */}
            {confirmTarget && (
                <ConfirmModal
                    filename={confirmTarget}
                    onConfirm={handleDeleteConfirmed}
                    onCancel={() => setConfirmTarget(null)}
                    isDeleting={false}
                />
            )}

            {permissionsTarget && (
                <PermissionsModal
                    target={permissionsTarget}
                    onClose={() => setPermissionsTarget(null)}
                    onMessage={showMessage}
                />
            )}

            {creatingFolder && (
                <CreateFolderModal
                    parentName={currentFolder?.name}
                    busy={folderBusy}
                    onConfirm={handleCreateFolder}
                    onCancel={() => setCreatingFolder(false)}
                />
            )}

            {unlockTarget && (
                <UnlockModal
                    folderName={unlockTarget.name}
                    busy={folderBusy}
                    error={unlockError}
                    onConfirm={handleUnlock}
                    onCancel={() => setUnlockTarget(null)}
                />
            )}

            {passwordFolder && (
                <PasswordModal
                    folder={passwordFolder}
                    busy={folderBusy}
                    error={passwordError}
                    onConfirm={handlePasswordChange}
                    onCancel={() => setPasswordFolder(null)}
                />
            )}

            {renameFolder && (
                <RenameFolderModal
                    folder={renameFolder}
                    busy={folderBusy}
                    error={renameError}
                    onConfirm={handleRenameFolder}
                    onCancel={() => setRenameFolder(null)}
                />
            )}

            {deleteFolder && (
                <DeleteFolderModal
                    folder={deleteFolder}
                    busy={folderBusy}
                    onConfirm={handleDeleteFolder}
                    onCancel={() => setDeleteFolder(null)}
                />
            )}

            <div className="min-h-screen bg-gray-50/50">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
                    {/* HEADER */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2.5">
                                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                                    MustaInf Cloud Storage
                                </h1>
                                <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                                    MEGA Engine · Gzip · ACL · Rate Control
                                </span>
                            </div>
                            <p className="text-sm text-gray-500 mt-0.5">
                                Transferência multi-canal paralela, compressão automática Gzip/ZIP, controlo de permissões e rate limiting
                            </p>
                        </div>

                        {/* Abas: O Meu Cloud vs Partilhados Comigo */}
                        <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-gray-200 shadow-sm self-start sm:self-auto">
                            <button
                                type="button"
                                onClick={() => setActiveTab("mine")}
                                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                                    activeTab === "mine"
                                        ? "bg-gray-900 text-white shadow-sm"
                                        : "text-gray-600 hover:bg-gray-100"
                                }`}
                            >
                                <HardDrive className="w-3.5 h-3.5" />O Meu Cloud
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab("shared")}
                                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                                    activeTab === "shared"
                                        ? "bg-indigo-600 text-white shadow-sm"
                                        : "text-gray-600 hover:bg-gray-100"
                                }`}
                            >
                                <Share2 className="w-3.5 h-3.5" />
                                Partilhados Comigo
                                {sharedFiles.length > 0 && (
                                    <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">
                                        {sharedFiles.length}
                                    </span>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* TOAST */}
                    {message && <Toast message={message} onClose={() => setMessage(null)} />}

                    {/* STATS + RATE LIMITING TELEMETRY */}
                    {loadingStats ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {[1, 2, 3, 4].map((i) => (
                                <div
                                    key={i}
                                    className="h-28 bg-white border border-gray-100 rounded-2xl animate-pulse"
                                />
                            ))}
                        </div>
                    ) : (
                        stats && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                <StatCard
                                    label={`Plano · ${stats.plan.name}`}
                                    value={formatBytes(usedBytes)}
                                    sub={`de ${stats.plan.max_storage_mb} MB (Gzip ativo)`}
                                    percent={storagePercent}
                                    color={
                                        storagePercent > 85
                                            ? "red"
                                            : storagePercent > 65
                                            ? "amber"
                                            : "blue"
                                    }
                                />
                                <StatCard
                                    label="Quota Diária & Rate"
                                    value={usedReqs.toLocaleString()}
                                    sub={
                                        rl
                                            ? `${rl.api_requests_per_min.used}/${rl.api_requests_per_min.limit} req/min · máx ${stats.plan.max_requests}/dia`
                                            : `de ${stats.plan.max_requests.toLocaleString()} / dia`
                                    }
                                    percent={reqPercent}
                                    color={
                                        reqPercent > 85
                                            ? "red"
                                            : reqPercent > 65
                                            ? "amber"
                                            : "emerald"
                                    }
                                />
                                <StatCard
                                    label="Concorrência MEGA"
                                    value={`${concurrency}x Canais`}
                                    sub={
                                        rl
                                            ? `Servidor: ${rl.concurrency.active_slots}/${rl.concurrency.max_slots} slots · ${rl.transfers_per_min.used}/${rl.transfers_per_min.limit} transf/min`
                                            : `Fila paralela não-bloqueante`
                                    }
                                    color="indigo"
                                />
                                <StatCard
                                    label="Tráfego de Rede"
                                    value={`↑ ${formatBytes(stats.usage.ingress)}`}
                                    sub={`↓ ${formatBytes(stats.usage.egress)} transferidos`}
                                    color="purple"
                                />
                            </div>
                        )
                    )}

                    {/* GESTOR DE TRANSFERÊNCIAS ESTILO MEGA DRIVE */}
                    <MegaTransferManager
                        tasks={tasks}
                        concurrency={concurrency}
                        onChangeConcurrency={setConcurrency}
                        pacingMs={pacingMs}
                        onChangePacingMs={setPacingMs}
                        compressionEnabled={compressionEnabled}
                        onToggleCompression={setCompressionEnabled}
                        queuePaused={queuePaused}
                        onToggleQueuePaused={() => setQueuePaused((p) => !p)}
                        onCancelTask={handleCancelTask}
                        onRetryTask={handleRetryTask}
                        onClearCompleted={handleClearCompleted}
                    />

                    {/* UPLOAD MULTI-FICHEIRO (apenas na aba O Meu Cloud) */}
                    {activeTab === "mine" && (
                        <DropZone
                            onFiles={(incoming) => enqueueUploads(incoming, currentFolderId)}
                            disabled={false}
                            activeCount={activeUploadsCount}
                            queuedCount={queuedUploadsCount}
                            compressionEnabled={compressionEnabled}
                            onToggleCompression={setCompressionEnabled}
                            concurrency={concurrency}
                        />
                    )}

                    {/* PASTAS (apenas na aba O Meu Cloud) */}
                    {activeTab === "mine" && (
                        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5 space-y-4">
                            <div className="flex items-center justify-between gap-3 flex-wrap">
                                <FolderBreadcrumb
                                    path={folderPath}
                                    onNavigate={navigateBreadcrumb}
                                    onDropOn={handleDropOnBreadcrumb}
                                    dragging={!!dragItem}
                                />
                                <div className="flex items-center gap-2">
                                    {currentFolder && (
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setPermissionsTarget({
                                                    type: "folder",
                                                    id: currentFolder.id,
                                                    name: currentFolder.name,
                                                })
                                            }
                                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 rounded-lg border border-indigo-100 transition"
                                        >
                                            <ShieldCheck className="w-4 h-4" /> Permissões da Pasta
                                        </button>
                                    )}
                                    <NewFolderButton onClick={() => setCreatingFolder(true)} />
                                </div>
                            </div>

                            <FolderGrid
                                folders={childFolders}
                                onOpen={openFolder}
                                onRename={(f) => {
                                    setRenameError(null);
                                    setRenameFolder(f);
                                }}
                                onPassword={(f) => {
                                    setPasswordError(null);
                                    setPasswordFolder(f);
                                }}
                                onDelete={(f) => setDeleteFolder(f)}
                                onLock={handleLockNow}
                                onPermissions={(f) =>
                                    setPermissionsTarget({
                                        type: "folder",
                                        id: f.id,
                                        name: f.name,
                                    })
                                }
                                onDownloadZip={(f) => enqueueZipDownload([], f)}
                                onDropOn={handleDropOnFolder}
                                onDragStart={setDragItem}
                                onDragEnd={() => setDragItem(null)}
                                dragItem={dragItem}
                            />
                        </div>
                    )}

                    {/* BANNER EXPLICATIVO NA ABA PARTILHADOS COMIGO */}
                    {activeTab === "shared" && (
                        <div className="p-4 bg-indigo-50/70 border border-indigo-100 rounded-2xl flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0" />
                                <div className="text-xs text-indigo-950">
                                    <p className="font-semibold">
                                        Ficheiros partilhados consigo (Controlo de Acesso ACL)
                                    </p>
                                    <p className="text-indigo-700 mt-0.5">
                                        As ações disponíveis respeitam o nível atribuído pelo proprietário:{" "}
                                        <strong>Editor</strong>, <strong>Download</strong> ou{" "}
                                        <strong>Apenas Leitura</strong>.
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={fetchSharedWithMe}
                                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition shrink-0"
                            >
                                Atualizar
                            </button>
                        </div>
                    )}

                    {/* LISTA DE FICHEIROS COM MULTI-SELEÇÃO, PERMISSÕES E DOWNLOAD ZIP/MEGA */}
                    <FileList
                        files={displayedFiles}
                        pagination={
                            activeTab === "shared"
                                ? {
                                      page: 1,
                                      limit: Math.max(10, sharedFiles.length),
                                      total: sharedFiles.length,
                                      pages: 1,
                                  }
                                : pagination
                        }
                        onPageChange={(page) => fetchFiles(page, currentFolderId)}
                        search={search}
                        onSearchChange={setSearch}
                        onDownload={enqueueDownload}
                        onDelete={(filename) => setConfirmTarget(filename)}
                        onPermissions={(file) =>
                            setPermissionsTarget({
                                type: "file",
                                id: file.id,
                                name: file.filename,
                            })
                        }
                        selectedIds={selectedIds}
                        onToggleSelect={(id) =>
                            setSelectedIds((prev) =>
                                prev.includes(id)
                                    ? prev.filter((x) => x !== id)
                                    : [...prev, id]
                            )
                        }
                        onSelectAll={(ids) => setSelectedIds(ids)}
                        onClearSelection={() => setSelectedIds([])}
                        onBulkParallelDownload={enqueueBulkParallelDownloads}
                        onBulkZipDownload={(sel) => enqueueZipDownload(sel)}
                        downloadingProgressById={downloadingProgressById}
                        loading={loadingFiles}
                        onDragStart={activeTab === "mine" ? setDragItem : undefined}
                        onDragEnd={() => setDragItem(null)}
                        dragItem={dragItem}
                    />
                </div>
            </div>
        </>
    );
}

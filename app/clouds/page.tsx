"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "@/context/SessionContext";
import {
    FileItem,
    formatBytes,
    MessageType,
    Pagination,
    StatCardType,
    StatsData,
    STYLES,
} from "./componets";
import { ConfirmModal } from "./componets/confirmModal";
import { DropZone } from "./componets/dropZone";
import { FileList } from "./componets/FileList";
import {
    CreateFolderModal,
    DeleteFolderModal,
    DragItem,
    FolderBreadcrumb,
    FolderGrid,
    FolderNode,
    NewFolderButton,
    PasswordModal,
    RenameFolderModal,
    UnlockModal,
    apiErrorMessage,
    hasOsFiles,
    isFechada,
    parseLockedError,
} from "./componets/folders";
import StatsCards from "../component/StatsCards";
import { HardDrive, Activity, ArrowUpDown } from "lucide-react";

export default function CloudStoragePage() {
    const { user, api } = useSession();

    const [stats, setStats] = useState<StatsData | null>(null);
    const [messages, setMessages] = useState<(MessageType & { id: number })[]>([]);
    const [uploadProgress, setUploadProgress] = useState<number | null>(null);
    const [downloadingFile, setDownloadingFile] = useState<{ name: string; progress: number } | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [files, setFiles] = useState<FileItem[]>([]);
    const [isLoadingFile, setIsLoadingFile] = useState(false);
    const [isLoadingStats, setIsLoadingStats] = useState(false);
    const [paginationFile, setPaginationFile] = useState<Pagination>({
        total: 0,
        limit: 10,
        page: 1,
        pages: 0
    });

    // ── Pastas ────────────────────────────────────────────────────────────────
    const [tree, setTree] = useState<FolderNode[]>([]);
    const [path, setPath] = useState<FolderNode[]>([]);
    const [creatingFolder, setCreatingFolder] = useState(false);
    const [unlockTarget, setUnlockTarget] = useState<{ id: string; name: string } | null>(null);
    const [passwordTarget, setPasswordTarget] = useState<FolderNode | null>(null);
    const [renameTarget, setRenameTarget] = useState<FolderNode | null>(null);
    const [deleteFolderTarget, setDeleteFolderTarget] = useState<FolderNode | null>(null);
    const [folderBusy, setFolderBusy] = useState(false);
    const [folderError, setFolderError] = useState<string | null>(null);

    // ── Arrastar e largar ─────────────────────────────────────────────────────
    // `pendingDrop` guarda a ação a executar depois de a senha ser aceite: é
    // isto que faz "pede a senha ANTES de adicionar" funcionar sem perder o
    // que estava a ser largado.
    const [dragItem, setDragItem] = useState<DragItem | null>(null);
    const pendingDrop = useRef<(() => Promise<void>) | null>(null);

    const currentFolder = path.length ? path[path.length - 1] : null;
    const currentFolderId = currentFolder?.id ?? null;
    const subFolders = currentFolder ? currentFolder.children : tree;

    const msgIdRef = useRef(0);

    // ✅ Debounce da pesquisa
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search), 300);
        return () => clearTimeout(timer);
    }, [search]);

    // ✅ Mensagens com auto-dismiss e remoção individual
    const showMessage = useCallback((text: string, type: MessageType["type"]) => {
        const id = ++msgIdRef.current;
        setMessages((prev) => {
            const next = [...prev.slice(-4), { text, type, id }];
            return next;
        });
        setTimeout(() => {
            setMessages((prev) => prev.filter((m) => m.id !== id));
        }, 4000);
    }, []);

    const resolvePath = useCallback(
        (roots: FolderNode[], ids: string[]): FolderNode[] => {
            const out: FolderNode[] = [];
            let nivel = roots;
            for (const id of ids) {
                const achado = nivel.find((f) => f.id === id);
                if (!achado) break;
                out.push(achado);
                nivel = achado.children;
            }
            return out;
        },
        []
    );

    const fetchFolders = useCallback(async () => {
        try {
            const { data } = await api.get("/storage/folders", { withCredentials: true });
            const roots: FolderNode[] = data.data?.folders ?? [];
            setTree(roots);
            setPath((prev) => resolvePath(roots, prev.map((f) => f.id)));
        } catch (err: any) {
            showMessage(apiErrorMessage(err, "Erro ao carregar pastas"), "error");
        }
    }, [api, showMessage, resolvePath]);

    const fetchFiles = useCallback(
        async (pageParam = paginationFile.page, folderId: string | null = currentFolderId) => {
            if (isLoadingFile) return; 
            try {
                setIsLoadingFile(true);

                const escopo = folderId ? `&folder_id=${folderId}` : "";
                const { data } = await api.get(
                    `/storage/filespage?page=${pageParam}&limit=${paginationFile.limit}${escopo}`,
                    { withCredentials: true }
                );
                setFiles(data.data.items);
                setPaginationFile({
                    total: data.data.pagination.total,
                    limit: data.data.pagination.limit,
                    page: data.data.pagination.page,
                    pages: data.data.pagination.pages
                });
            } catch (err: any) {
                const bloqueada = parseLockedError(err);
                if (bloqueada) {
                    setFiles([]);
                    setUnlockTarget(bloqueada);
                    return;
                }
                showMessage(apiErrorMessage(err, "Erro ao carregar ficheiros"), "error");
            } finally {
                setIsLoadingFile(false);
            }
        },
        [paginationFile.page, paginationFile.limit, currentFolderId, showMessage, api]
    );

    const fetchStats = useCallback(async () => {
        if (isLoadingStats) return;
        setIsLoadingStats(true);
        try {
            const res = await api.get("/storage/stats", { withCredentials: true });
            setStats(res.data?.data ?? res.data);
        } catch (e) {
            console.error("Erro ao carregar stats", e);
        } finally {
            setIsLoadingStats(false);
        }
    }, [api]);

    useEffect(() => {
        if (user) {
            fetchFiles(paginationFile.page);
            fetchStats();
            fetchFolders();
        }
    }, [user, fetchStats]);

    // ── Ações de pastas ───────────────────────────────────────────────────────

    const openFolder = useCallback((f: FolderNode) => {
        if (isFechada(f)) {
            setFolderError(null);
            setUnlockTarget({ id: f.id, name: f.name });
            return;
        }
        setPath((prev) => [...prev, f]);
        setPaginationFile((p) => ({ ...p, page: 1 }));
        fetchFiles(1, f.id);
    }, [fetchFiles]);

    const navigateTo = useCallback((index: number) => {
        const novo = index < 0 ? [] : path.slice(0, index + 1);
        setPath(novo);
        const destino = novo.length ? novo[novo.length - 1].id : null;
        setPaginationFile((p) => ({ ...p, page: 1 }));
        fetchFiles(1, destino);
    }, [path, fetchFiles]);

    const handleCreateFolder = useCallback(async (name: string, password?: string) => {
        setFolderBusy(true);
        try {
            await api.post("/storage/folders", {
                name,
                parent_id: currentFolderId,
                password: password || null,
            }, { withCredentials: true });

            showMessage(`Pasta "${name}" criada`, "success");
            setCreatingFolder(false);
            await fetchFolders();
        } catch (err: any) {
            showMessage(apiErrorMessage(err, "Erro ao criar pasta"), "error");
        } finally {
            setFolderBusy(false);
        }
    }, [api, currentFolderId, fetchFolders, showMessage]);

    const handleUnlock = useCallback(async (password: string) => {
        if (!unlockTarget) return;
        setFolderBusy(true);
        setFolderError(null);
        try {
            await api.post(
                `/storage/folders/${unlockTarget.id}/unlock`,
                { password },
                { withCredentials: true }
            );
            setUnlockTarget(null);
            await fetchFolders();

            // Havia algo a caminho desta pasta (arrasto ou upload): agora sim.
            const pendente = pendingDrop.current;
            pendingDrop.current = null;
            if (pendente) {
                await pendente();
            } else {
                await fetchFiles(1, currentFolderId);
                showMessage("Pasta desbloqueada", "success");
            }
        } catch (err: any) {
            setFolderError(
                err?.response?.status === 403
                    ? "Senha incorreta."
                    : apiErrorMessage(err, "Erro ao desbloquear")
            );
        } finally {
            setFolderBusy(false);
        }
    }, [api, unlockTarget, currentFolderId, fetchFolders, fetchFiles, showMessage]);

    const handleSetPassword = useCallback(async (
        current: string | undefined,
        nova: string | undefined,
    ) => {
        if (!passwordTarget) return;
        setFolderBusy(true);
        setFolderError(null);
        try {
            await api.put(
                `/storage/folders/${passwordTarget.id}/password`,
                { current_password: current ?? null, new_password: nova ?? null },
                { withCredentials: true }
            );
            showMessage(nova ? "Senha definida" : "Senha removida", "success");
            setPasswordTarget(null);
            await fetchFolders();
        } catch (err: any) {
            setFolderError(
                err?.response?.status === 403
                    ? "Senha atual incorreta."
                    : apiErrorMessage(err, "Erro ao alterar a senha")
            );
        } finally {
            setFolderBusy(false);
        }
    }, [api, passwordTarget, fetchFolders, showMessage]);

    const handleRenameFolder = useCallback(async (name: string) => {
        if (!renameTarget) return;
        setFolderBusy(true);
        setFolderError(null);
        try {
            await api.patch(
                `/storage/folders/${renameTarget.id}`,
                { name },
                { withCredentials: true }
            );
            showMessage("Pasta renomeada", "success");
            setRenameTarget(null);
            await fetchFolders();
        } catch (err: any) {
            setFolderError(apiErrorMessage(err, "Erro ao renomear"));
        } finally {
            setFolderBusy(false);
        }
    }, [api, renameTarget, fetchFolders, showMessage]);

    const handleDeleteFolder = useCallback(async () => {
        if (!deleteFolderTarget) return;
        setFolderBusy(true);
        try {
            await api.delete(`/storage/folders/${deleteFolderTarget.id}`, {
                withCredentials: true,
            });
            showMessage(`Pasta "${deleteFolderTarget.name}" removida`, "success");
            setDeleteFolderTarget(null);
            await fetchFolders();
            await fetchFiles(1, currentFolderId);
            fetchStats();
        } catch (err: any) {
            showMessage(apiErrorMessage(err, "Erro ao apagar pasta"), "error");
        } finally {
            setFolderBusy(false);
        }
    }, [api, deleteFolderTarget, currentFolderId, fetchFolders, fetchFiles, fetchStats, showMessage]);

    const handleLockNow = useCallback(async (f: FolderNode) => {
        try {
            await api.post(`/storage/folders/${f.id}/lock`, {}, { withCredentials: true });
            showMessage(`"${f.name}" bloqueada`, "success");
            await fetchFolders();
            await fetchFiles(1, currentFolderId);
        } catch (err: any) {
            showMessage(apiErrorMessage(err, "Erro ao bloquear"), "error");
        }
    }, [api, currentFolderId, fetchFolders, fetchFiles, showMessage]);

    // ✅ Upload com XHR
    const handleFile = useCallback((file: File, destinoId: string | null = currentFolderId) => {
        const formData = new FormData();
        formData.append("file", file);
        setUploadProgress(0);

        const xhr = new XMLHttpRequest();
        const escopo = destinoId ? `?folder_id=${destinoId}` : "";
        xhr.open("POST", `${api.defaults.baseURL}storage/upload${escopo}`, true);
        xhr.withCredentials = true;

        xhr.upload.onprogress = ({ lengthComputable, loaded, total }) => {
            if (lengthComputable) {
                setUploadProgress(Math.round((loaded / total) * 100));
            }
        };

        xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                showMessage("Upload concluído!", "success");
                setPaginationFile((prev) => ({ ...prev, page: 1 }));
                fetchStats();
                fetchFiles(1, currentFolderId);
                fetchFolders();
            } else {
                let detalhe = `Erro no upload (${xhr.status})`;
                try {
                    const corpo = JSON.parse(xhr.responseText);
                    const d = corpo?.detail;
                    if (typeof d === "string") detalhe = d;
                    else if (d?.message) detalhe = d.message;
                } catch { }
                showMessage(detalhe, "error");
            }
            setUploadProgress(null);
        };

        xhr.onerror = () => {
            showMessage("Erro de rede no upload", "error");
            setUploadProgress(null);
        };

        xhr.send(formData);
    }, [api, showMessage, currentFolderId, fetchStats, fetchFiles, fetchFolders]);

    // ── Arrastar e largar ─────────────────────────────────────────────────────

    /** Executa já, ou pede a senha e só executa depois de ela ser aceite. */
    const runOrUnlock = useCallback(
        (destino: FolderNode | null, acao: () => Promise<void>) => {
            if (destino && isFechada(destino)) {
                pendingDrop.current = acao;
                setFolderError(null);
                setUnlockTarget({ id: destino.id, name: destino.name });
                return;
            }
            void acao();
        },
        []
    );

    const moveFile = useCallback(async (fileId: string, destinoId: string | null) => {
        try {
            await api.patch(
                `/storage/files/${fileId}/move`,
                destinoId ? { folder_id: destinoId } : { move_to_root: true },
                { withCredentials: true }
            );
            await fetchFolders();
            await fetchFiles(1, currentFolderId);
            showMessage("Ficheiro movido", "success");
        } catch (err: any) {
            const bloqueada = parseLockedError(err);
            if (bloqueada) { setUnlockTarget(bloqueada); return; }
            showMessage(apiErrorMessage(err, "Erro ao mover ficheiro"), "error");
        }
    }, [api, currentFolderId, fetchFolders, fetchFiles, showMessage]);

    const moveFolder = useCallback(async (folderId: string, destinoId: string | null) => {
        try {
            await api.patch(
                `/storage/folders/${folderId}`,
                destinoId ? { parent_id: destinoId } : { move_to_root: true },
                { withCredentials: true }
            );
            await fetchFolders();
            showMessage("Pasta movida", "success");
        } catch (err: any) {
            const bloqueada = parseLockedError(err);
            if (bloqueada) { setUnlockTarget(bloqueada); return; }
            showMessage(apiErrorMessage(err, "Erro ao mover pasta"), "error");
        }
    }, [api, fetchFolders, showMessage]);

    /** Largada numa pasta (ou no caminho, com `destino = null` para a raiz). */
    const handleDrop = useCallback(
        (destino: FolderNode | null, e: React.DragEvent) => {
            const destinoId = destino?.id ?? null;

            // 1) Ficheiros vindos do sistema operativo → upload.
            if (hasOsFiles(e)) {
                const ficheiros = Array.from(e.dataTransfer.files);
                if (!ficheiros.length) return;
                runOrUnlock(destino, async () => {
                    ficheiros.forEach((f) => handleFile(f, destinoId));
                });
                return;
            }

            // 2) Item arrastado dentro da app → mover.
            const item = dragItem;
            setDragItem(null);
            if (!item) return;

            if (item.kind === "file") {
                runOrUnlock(destino, () => moveFile(item.id, destinoId));
            } else if (item.id !== destinoId) {
                runOrUnlock(destino, () => moveFolder(item.id, destinoId));
            }
        },
        [dragItem, handleFile, moveFile, moveFolder, runOrUnlock]
    );

    const handleDownload = useCallback(async (filename: string) => {
        setDownloadingFile({ name: filename, progress: 0 });
        try {
            const escopo = currentFolderId ? `?folder_id=${currentFolderId}` : "";
            const res = await api.get(
                `/storage/download/${encodeURIComponent(filename)}${escopo}`,
                {
                    withCredentials: true,
                    responseType: "blob",
                    timeout: 0,
                    onDownloadProgress: (e) => {
                        if (e.total) {
                            setDownloadingFile({ name: filename, progress: Math.round((e.loaded / e.total) * 100) });
                        }
                    },
                }
            );

            const blobUrl = URL.createObjectURL(res.data as Blob);
            const a = document.createElement("a");
            a.href = blobUrl;
            a.download = filename; 
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(blobUrl);
        } catch (err: any) {
            const bloqueada = parseLockedError(err);
            if (bloqueada) {
                setUnlockTarget(bloqueada);
                return;
            }
            showMessage(apiErrorMessage(err, "Erro ao baixar ficheiro"), "error");
        } finally {
            setDownloadingFile(null);
        }
    }, [api, currentFolderId, showMessage]);

    const handleDeleteConfirm = useCallback(async () => {
        if (!deleteTarget) return;
        setIsDeleting(true);
        try {
            const escopo = currentFolderId ? `?folder_id=${currentFolderId}` : "";
            await api.delete(`/storage/delete/${encodeURIComponent(deleteTarget)}${escopo}`, {
                withCredentials: true,
            });
            showMessage("Ficheiro apagado com sucesso", "success");
            setPaginationFile((prev) => ({ ...prev, page: 1 }));
            fetchStats();
            fetchFiles(1, currentFolderId);
            fetchFolders();
        } catch (err: any) {
            showMessage(apiErrorMessage(err, "Erro ao apagar ficheiro"), "error");
        } finally {
            setIsDeleting(false);
            setDeleteTarget(null);
        }
    }, [api, deleteTarget, currentFolderId, showMessage, fetchStats, fetchFiles, fetchFolders]);

    if (!user) return <div>Loading...</div>;

    const statsFormatted: StatCardType[] = stats
        ? [
            {
                label: "Armazenamento",
                value: formatBytes(stats.usage.storage_bytes),
                icon: HardDrive,
                color: "blue",
            },
            {
                label: "Requests",
                value: formatBytes(stats.usage.requests),
                icon: Activity,
                color: "purple",
            },
            {
                label: "Tráfego",
                value: `⬆ ${formatBytes(stats.usage.ingress)}`,
                icon: ArrowUpDown,
                color: "emerald",
            },
        ]
        : [];

    return (
        <>
            <style>{STYLES}</style>

            {deleteTarget && (
                <ConfirmModal
                    filename={deleteTarget}
                    onConfirm={handleDeleteConfirm}
                    onCancel={() => setDeleteTarget(null)}
                    isDeleting={isDeleting}
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
                    error={folderError}
                    onConfirm={handleUnlock}
                    onCancel={() => { setUnlockTarget(null); setFolderError(null); }}
                />
            )}

            {passwordTarget && (
                <PasswordModal
                    folder={passwordTarget}
                    busy={folderBusy}
                    error={folderError}
                    onConfirm={handleSetPassword}
                    onCancel={() => { setPasswordTarget(null); setFolderError(null); }}
                />
            )}

            {renameTarget && (
                <RenameFolderModal
                    folder={renameTarget}
                    busy={folderBusy}
                    error={folderError}
                    onConfirm={handleRenameFolder}
                    onCancel={() => { setRenameTarget(null); setFolderError(null); }}
                />
            )}

            {deleteFolderTarget && (
                <DeleteFolderModal
                    folder={deleteFolderTarget}
                    busy={folderBusy}
                    onConfirm={handleDeleteFolder}
                    onCancel={() => setDeleteFolderTarget(null)}
                />
            )}

            <div className="max-w-4xl mx-auto p-6 space-y-6">
                <StatsCards stats={statsFormatted} />

                <div className="flex items-center justify-between gap-3 flex-wrap">
                    <FolderBreadcrumb
                        path={path}
                        onNavigate={navigateTo}
                        // Largar no caminho tira o item da pasta atual.
                        onDropOn={(folderId, e) =>
                            handleDrop(
                                folderId ? path.find((f) => f.id === folderId) ?? null : null,
                                e
                            )
                        }
                        dragging={dragItem !== null}
                    />
                    <NewFolderButton onClick={() => setCreatingFolder(true)} />
                </div>

                <FolderGrid
                    folders={subFolders}
                    onOpen={openFolder}
                    onRename={setRenameTarget}
                    onPassword={setPasswordTarget}
                    onDelete={setDeleteFolderTarget}
                    onLock={handleLockNow}
                    onDropOn={handleDrop}
                    onDragStart={setDragItem}
                    onDragEnd={() => setDragItem(null)}
                    dragItem={dragItem}
                />

                <DropZone
                    onFile={handleFile}
                    uploadProgress={uploadProgress}
                    disabled={uploadProgress !== null}
                />

                <FileList
                    files={files}
                    search={debouncedSearch}
                    setSearch={setSearch}
                    isLoading={isLoadingFile}
                    downloadingFile={downloadingFile}
                    uploadProgress={uploadProgress}
                    onDownload={handleDownload}
                    onDelete={setDeleteTarget}
                    page={paginationFile.page}
                    totalPages={paginationFile.pages}
                    onPageChange={fetchFiles}
                    onFileDragStart={(f) =>
                        setDragItem({ kind: "file", id: f.id, name: f.filename })
                    }
                    onFileDragEnd={() => setDragItem(null)}
                    draggingFileId={dragItem?.kind === "file" ? dragItem.id : null}
                />
            </div>
        </>
    );
}
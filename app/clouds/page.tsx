"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "@/context/SessionContext";
import {
    FileItem,
    formatBytes,
    MessageType,
    Pagination,
    StatCard,
    StatCardType,
    StatsData,
    STYLES,
} from "./componets";
import { ConfirmModal } from "./componets/confirmModal";
import { DropZone } from "./componets/dropZone";
import { FileList } from "./componets/FileList";
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
        total: 0
        , limit: 10
        , page: 1
        , pages: 0
    });

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
            // Limite de 5 mensagens simultâneas
            const next = [...prev.slice(-4), { text, type, id }];
            return next;
        });
        setTimeout(() => {
            setMessages((prev) => prev.filter((m) => m.id !== id));
        }, 4000);
    }, []);

    const fetchFiles = useCallback(

        async (pageParam = paginationFile.page) => {
            if (isLoadingFile) return; // Evita chamadas concorrentes
            try {
                setIsLoadingFile(true);

                const { data } = await api.get(`/storage/filespage?page=${pageParam}&limit=${paginationFile.limit}`, {
                    withCredentials: true
                });
                console.log("items: ", data);
                setFiles(data.data.items);
                setPaginationFile({
                    total: data.data.pagination.total,
                    limit: data.data.pagination.limit,
                    page: data.data.pagination.page,
                    pages: data.data.pagination.pages
                });
            } catch (err: any) {
                showMessage(err.message, "error");
            } finally {
                setIsLoadingFile(false);
            }
        },
        [paginationFile.page, paginationFile.limit, showMessage]
    );

    // ✅ fetchStats usa api em vez de fetch nativo
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
        }
    }, [user, fetchStats]);

    // ✅ Upload com XHR (mantido — correto para progresso)
    const handleFile = useCallback((file: File) => {
        const formData = new FormData();
        formData.append("file", file);
        setUploadProgress(0);

        const xhr = new XMLHttpRequest();
        xhr.open("POST", `${api.defaults.baseURL}/storage/upload`, true);
        xhr.withCredentials = true;

        xhr.upload.onprogress = ({ lengthComputable, loaded, total }) => {
            if (lengthComputable) {
                setUploadProgress(Math.round((loaded / total) * 100));
            }
        };

        xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                showMessage("Upload concluído!", "success");
                setPaginationFile((prev) => ({ ...prev, page: 1 })); // Volta para a primeira página para mostrar o novo arquivo
                fetchStats();
            } else {
                showMessage(`Erro no upload (${xhr.status})`, "error");
            }
            setUploadProgress(null);
        };

        xhr.onerror = () => {
            showMessage("Erro de rede no upload", "error");
            setUploadProgress(null);
        };

        xhr.send(formData);
    }, [api, showMessage, paginationFile.page, fetchStats]);

    // ✅ Download simplificado — sem estado de progresso desnecessário
    const handleDownload = useCallback(async (filename: string) => {
        setDownloadingFile({ name: filename, progress: 0 });
        try {
            const res = await api.get(`/storage/url/${filename}`, {
                withCredentials: true,
            });
            const fileUrl = res.data?.data?.url;
            if (!fileUrl) throw new Error("URL inválida recebida do servidor");
            window.open(fileUrl, "_blank", "noopener,noreferrer");
        } catch (err: any) {
            showMessage(err.message ?? "Erro ao obter URL de download", "error");
        } finally {
            setDownloadingFile(null);
        }
    }, [api, showMessage]);

    // ✅ Delete com feedback de erro mais descritivo
    const handleDeleteConfirm = useCallback(async () => {
        if (!deleteTarget) return;
        setIsDeleting(true);
        try {
            await api.delete(`/storage/delete/${deleteTarget}`, {
                withCredentials: true,
            });
            showMessage("Ficheiro apagado com sucesso", "success");
            setPaginationFile((prev) => ({ ...prev, page: 1 })); // Volta para a primeira página para evitar problemas de paginação
            fetchStats();
        } catch (err: any) {
            const msg = err.response?.data?.message ?? "Erro ao apagar ficheiro";
            showMessage(msg, "error");
        } finally {
            setIsDeleting(false);
            setDeleteTarget(null);
        }
    }, [api, deleteTarget, showMessage, paginationFile.page, fetchStats]);

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

            <div className="max-w-4xl mx-auto p-6 space-y-6">
                <StatsCards stats={statsFormatted} />

                <DropZone
                    onFile={handleFile}
                    uploadProgress={uploadProgress}
                    disabled={uploadProgress !== null}
                />

                {/* ✅ Passa debouncedSearch para filtrar só após pausa */}
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
                />
            </div>
        </>
    );
}
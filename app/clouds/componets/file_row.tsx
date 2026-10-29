import { Shield } from "lucide-react";
import { FileItem, getFileIcon, getRoleBadgeInfo } from ".";

function formatSize(bytes: number) {
    if (!bytes || bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

function formatDate(date: string) {
    if (!date) return "";
    return new Date(date).toLocaleDateString();
}

// ─── File_Row ─────────────────────────────────────────────────────────────────
export function FileRow({
    file,
    isDownloading,
    downloadProgress,
    onDownload,
    onDelete,
    onPermissions,
    selected = false,
    onToggleSelect,
    disabled,
    onDragStart,
    onDragEnd,
    isDragging,
}: {
    file: FileItem;
    isDownloading: boolean;
    downloadProgress: number;
    onDownload: () => void;
    onDelete: () => void;
    onPermissions?: () => void;
    selected?: boolean;
    onToggleSelect?: () => void;
    disabled: boolean;
    onDragStart?: () => void;
    onDragEnd?: () => void;
    isDragging?: boolean;
}) {
    const role = file.my_role ?? "owner";
    const canDownload = role !== "viewer";
    const canDelete = role === "owner";
    const roleBadge = getRoleBadgeInfo(role);

    return (
        <li
            draggable={!!onDragStart && !disabled && role !== "viewer"}
            onDragStart={(e) => {
                e.dataTransfer.effectAllowed = "move";
                e.dataTransfer.setData("text/plain", file.filename);
                onDragStart?.();
            }}
            onDragEnd={() => onDragEnd?.()}
            className={`group px-5 py-3.5 flex flex-col sm:flex-row sm:items-center gap-3 hover:bg-gray-50 transition-colors ${
                selected ? "bg-blue-50/40" : ""
            } ${onDragStart && !disabled ? "cursor-grab active:cursor-grabbing" : ""} ${
                isDragging ? "opacity-40" : ""
            }`}
        >
            {/* LEFT */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
                {onToggleSelect && (
                    <input
                        type="checkbox"
                        checked={selected}
                        onChange={onToggleSelect}
                        onClick={(e) => e.stopPropagation()}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer shrink-0"
                        aria-label={`Selecionar ${file.filename}`}
                    />
                )}

                <span className="text-2xl shrink-0">{getFileIcon(file.filename)}</span>

                <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span
                            className="text-gray-800 font-medium truncate text-sm max-w-[260px] sm:max-w-[360px]"
                            title={file.filename}
                        >
                            {file.filename}
                        </span>

                        {file.compressed && (
                            <span
                                className="px-1.5 py-0.5 text-[10px] font-semibold rounded-md bg-purple-50 text-purple-700 border border-purple-200"
                                title={
                                    file.original_size_bytes
                                        ? `Tamanho original: ${formatSize(file.original_size_bytes)}`
                                        : "Armazenado com compressão Gzip"
                                }
                            >
                                🗜️ Gzip{" "}
                                {file.compression_ratio_percent
                                    ? `-${file.compression_ratio_percent}%`
                                    : ""}
                            </span>
                        )}

                        <span
                            className={`px-1.5 py-0.5 text-[10px] font-semibold rounded-md border ${roleBadge.cls}`}
                        >
                            {roleBadge.label}
                        </span>
                    </div>

                    <div className="text-xs text-gray-500 flex gap-2 flex-wrap mt-0.5">
                        <span>{formatSize(file.size_bytes)}</span>
                        {file.compressed &&
                            file.original_size_bytes &&
                            file.original_size_bytes > file.size_bytes && (
                                <span className="line-through text-gray-400">
                                    {formatSize(file.original_size_bytes)}
                                </span>
                            )}
                        {file.mime_type && <span>• {file.mime_type}</span>}
                        {file.created_at && <span>• {formatDate(file.created_at)}</span>}
                        {file.owner_name && role !== "owner" && (
                            <span className="text-indigo-600 font-medium">
                                • De: {file.owner_name}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* RIGHT */}
            <div className="flex items-center gap-2 shrink-0 sm:justify-end">
                {isDownloading ? (
                    <div className="flex items-center gap-2 text-blue-600 text-xs font-medium min-w-[140px]">
                        <div className="flex-1 bg-blue-100 rounded-full h-1.5 overflow-hidden">
                            <div
                                className="bg-blue-500 h-1.5 rounded-full transition-all duration-200"
                                style={{ width: `${downloadProgress}%` }}
                            />
                        </div>
                        <span className="w-8 text-right">{downloadProgress}%</span>
                    </div>
                ) : (
                    <div className="flex items-center gap-1.5 opacity-100 sm:opacity-80 sm:group-hover:opacity-100 transition">
                        {onPermissions && (
                            <button
                                type="button"
                                onClick={onPermissions}
                                className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1.5 rounded-lg transition"
                                title="Controlo de acesso, permissões e links de partilha"
                            >
                                <Shield className="w-3.5 h-3.5" />
                                <span className="hidden md:inline">Permissões</span>
                            </button>
                        )}

                        <button
                            type="button"
                            onClick={onDownload}
                            disabled={disabled || !canDownload}
                            title={
                                !canDownload
                                    ? "O seu nível de acesso ('Apenas Leitura') não permite download"
                                    : "Adicionar à fila de transferência MEGA"
                            }
                            className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2.5 py-1.5 rounded-lg transition disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            ⬇ Baixar
                        </button>

                        {canDelete && (
                            <button
                                type="button"
                                onClick={onDelete}
                                disabled={disabled}
                                className="flex items-center gap-1 text-xs font-semibold text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 px-2.5 py-1.5 rounded-lg transition disabled:opacity-40"
                            >
                                🗑 Apagar
                            </button>
                        )}
                    </div>
                )}
            </div>
        </li>
    );
}

import { FileItem, getFileIcon } from ".";



function formatSize(bytes: number) {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

function formatDate(date: string) {
    return new Date(date).toLocaleDateString();
}

// ─── File_Row ─────────────────────────────────────────────────────────────────
export function FileRow({
    file,
    isDownloading,
    downloadProgress,
    onDownload,
    onDelete,
    disabled,
}: {
    file: FileItem;
    isDownloading: boolean;
    downloadProgress: number;
    onDownload: () => void;
    onDelete: () => void;
    disabled: boolean;
}) {
    return (
        <li className="group px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3 hover:bg-gray-50 transition-colors">

            {/* LEFT */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
                <span className="text-2xl shrink-0">
                    {getFileIcon(file.filename)}
                </span>

                <div className="flex flex-col min-w-0">
                    <span
                        className="text-gray-800 font-medium truncate text-sm"
                        title={file.filename}
                    >
                        {file.filename}
                    </span>

                    <div className="text-xs text-gray-500 flex gap-2 flex-wrap">
                        <span>{formatSize(file.size_bytes)}</span>
                        {file.mime_type && <span>• {file.mime_type}</span>}
                        <span>• {formatDate(file.created_at)}</span>
                    </div>
                </div>
            </div>

            {/* RIGHT */}
            <div className="flex items-center gap-3 shrink-0 sm:justify-end">
                {isDownloading ? (
                    <div className="flex items-center gap-2 text-blue-600 text-xs font-medium min-w-[140px]">
                        <div className="flex-1 bg-blue-100 rounded-full h-1.5 overflow-hidden">
                            <div
                                className="bg-blue-500 h-1.5 rounded-full transition-all duration-200"
                                style={{ width: `${downloadProgress}%` }}
                            />
                        </div>
                        <span className="w-8 text-right">
                            {downloadProgress}%
                        </span>
                    </div>
                ) : (
                    <div className="flex items-center gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition">
                        <button
                            onClick={onDownload}
                            disabled={disabled}
                            className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition disabled:opacity-40"
                        >
                            ⬇ Baixar
                        </button>

                        <button
                            onClick={onDelete}
                            disabled={disabled}
                            className="flex items-center gap-1.5 text-xs font-semibold text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition disabled:opacity-40"
                        >
                            🗑 Apagar
                        </button>
                    </div>
                )}
            </div>
        </li>
    );
}
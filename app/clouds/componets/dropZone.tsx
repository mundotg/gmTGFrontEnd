import { useRef, useState } from "react";
import { Archive, Layers, UploadCloud } from "lucide-react";
import { ALLOWED_EXTENSIONS, MAX_FILE_SIZE_MB } from ".";

// ─── Drop Zone (Multi-Ficheiro / Fila Concorrente estilo MEGA) ────────────────
export function DropZone({
    onFiles,
    onFile,
    disabled,
    activeCount = 0,
    queuedCount = 0,
    compressionEnabled = true,
    onToggleCompression,
    concurrency = 3,
}: {
    onFiles?: (files: File[]) => void;
    onFile?: (f: File) => void;
    disabled?: boolean;
    activeCount?: number;
    queuedCount?: number;
    compressionEnabled?: boolean;
    onToggleCompression?: (enabled: boolean) => void;
    concurrency?: number;
}) {
    const [dragging, setDragging] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const dispatchFiles = (fileList: FileList | null) => {
        if (!fileList || fileList.length === 0) return;
        const arr = Array.from(fileList);
        if (onFiles) {
            onFiles(arr);
        } else if (onFile) {
            arr.forEach((f) => onFile(f));
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragging(false);
        if (disabled) return;
        dispatchFiles(e.dataTransfer.files);
    };

    return (
        <div
            onDragOver={(e) => {
                e.preventDefault();
                if (!disabled) setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => !disabled && inputRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) =>
                (e.key === "Enter" || e.key === " ") && !disabled && inputRef.current?.click()
            }
            aria-label="Zona de upload multi-ficheiro"
            className={`relative flex flex-col items-center justify-center gap-3 p-7 border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-200 select-none
                ${
                    dragging
                        ? "border-blue-500 bg-blue-50/70 scale-[1.01] shadow-md"
                        : "border-gray-200 bg-gray-50/60 hover:border-blue-400 hover:bg-blue-50/30"
                }
                ${disabled ? "opacity-50 pointer-events-none" : ""}`}
        >
            <input
                ref={inputRef}
                type="file"
                multiple
                accept={Array.from(ALLOWED_EXTENSIONS).join(",")}
                className="hidden"
                onChange={(e) => {
                    dispatchFiles(e.target.files);
                    e.target.value = "";
                }}
            />

            <div className="w-12 h-12 rounded-2xl bg-blue-100/80 text-blue-600 flex items-center justify-center shadow-sm">
                <UploadCloud className="w-6 h-6" />
            </div>

            <div className="text-center">
                <p className="text-sm font-semibold text-gray-800">
                    Arraste vários ficheiros em simultâneo ou{" "}
                    <span className="text-blue-600 underline">clique para selecionar em lote</span>
                </p>
                <p className="text-xs text-gray-400 mt-1">
                    Fila paralela MEGA ({concurrency} canais simultâneos) · Máx. {MAX_FILE_SIZE_MB} MB por ficheiro
                </p>
            </div>

            {/* Pílulas de estado de Compressão e Concorrência */}
            <div
                className="flex flex-wrap items-center justify-center gap-2 mt-1"
                onClick={(e) => e.stopPropagation()}
            >
                {onToggleCompression && (
                    <button
                        type="button"
                        onClick={() => onToggleCompression(!compressionEnabled)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition ${
                            compressionEnabled
                                ? "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100"
                                : "bg-white text-gray-500 border-gray-200 hover:bg-gray-100"
                        }`}
                    >
                        <Archive className="w-3.5 h-3.5" />
                        Compressão Gzip: {compressionEnabled ? "Ativa" : "Desativada"}
                    </button>
                )}

                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                    <Layers className="w-3.5 h-3.5" />
                    {activeCount > 0
                        ? `${activeCount} em envio paralelo (${queuedCount} em fila)`
                        : `Pronto para ${concurrency}x uploads paralelos`}
                </span>
            </div>
        </div>
    );
}

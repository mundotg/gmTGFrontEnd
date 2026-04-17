import { useRef, useState } from "react";
import { ALLOWED_EXTENSIONS, MAX_FILE_SIZE_MB, ProgressBar, validateFile } from ".";

// ─── Drop Zone ────────────────────────────────────────────────────────────────
export function DropZone({
    onFile,
    uploadProgress,
    disabled,
}: {
    onFile: (file: File) => void;
    uploadProgress: number | null;
    disabled: boolean;
}) {
    const [isDragging, setIsDragging] = useState(false);
    const [dragError, setDragError] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        if (!disabled) setIsDragging(true);
    };
    const handleDragLeave = () => { setIsDragging(false); setDragError(null); };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (disabled) return;
        const file = e.dataTransfer.files[0];
        if (!file) return;
        const err = validateFile(file);
        if (err) { setDragError(err); return; }
        setDragError(null);
        onFile(file);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const err = validateFile(file);
        if (err) { setDragError(err); return; }
        setDragError(null);
        onFile(file);
        e.target.value = "";
    };

    if (uploadProgress !== null) {
        return (
            <div className="p-10 border-2 border-blue-200 rounded-2xl bg-blue-50 flex flex-col items-center gap-4">
                <div className="w-14 h-14 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin" />
                <div className="w-full max-w-xs text-center">
                    <p className="text-blue-700 font-semibold text-sm mb-2">A enviar... {uploadProgress}%</p>
                    <ProgressBar value={uploadProgress} color="blue" />
                </div>
            </div>
        );
    }

    return (
        <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => !disabled && inputRef.current?.click()}
            className={`
                relative p-10 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-3 cursor-pointer
                transition-all duration-200 select-none
                ${isDragging
                    ? "border-blue-500 bg-blue-100 scale-[1.01]"
                    : "border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50"
                }
                ${disabled ? "opacity-50 cursor-not-allowed" : ""}
            `}
        >
            <span className="text-4xl">{isDragging ? "📥" : "☁️"}</span>
            <div className="text-center">
                <p className="font-semibold text-gray-700">
                    {isDragging ? "Larga para fazer upload" : "Arrasta um ficheiro ou clica para selecionar"}
                </p>
                <p className="text-sm text-gray-400 mt-1">
                    {Array.from(ALLOWED_EXTENSIONS).join(", ")} · Máx. {MAX_FILE_SIZE_MB}MB
                </p>
            </div>
            {dragError && (
                <p className="text-red-600 text-sm font-medium bg-red-50 px-3 py-1 rounded-lg border border-red-200">
                    {dragError}
                </p>
            )}
            <input
                ref={inputRef}
                type="file"
                className="hidden"
                onChange={handleChange}
                accept={Array.from(ALLOWED_EXTENSIONS).join(",")}
                disabled={disabled}
            />
        </div>
    );
}

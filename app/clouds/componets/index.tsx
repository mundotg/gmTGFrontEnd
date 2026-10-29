import { useEffect } from "react";

export const ALLOWED_EXTENSIONS = new Set([
    ".txt", ".pdf", ".png", ".jpg", ".jpeg", ".json", ".csv", ".doc", ".docx", ".xls",
    ".xlsx", ".ppt", ".pptx", ".zip", ".rar", ".7z", ".tar", ".gz", ".mp4", ".mp3", ".avi", ".mkv",
    ".xml", ".html", ".css", ".js", ".ts", ".tsx", ".jsx", ".py", ".java", ".c",
    ".cpp", ".h", ".hpp", ".go", ".rb", ".php", ".swift", ".kt", ".rs", ".dart", ".sh", ".bat", ".ps1",
    ".sql", ".md", ".yml", ".yaml", ".log", ".cfg", ".ini", ".env", ".dockerfile", ".k8s.yaml", ".helm.yaml",
    ".ipynb", ".r", ".sas", ".stata", ".spss", ".m", ".lua", ".groovy", ".scala", ".clj", ".cljs", ".coffee",
    ".asm", ".v", ".sv", ".vh", ".vhd", ".vhdl", ".svelte", ".vue", ".angular", ".react", ".ember", ".backbone",
    ".flutter", ".xcodeproj", ".xcworkspace", ".sln", ".csproj", ".vbproj", ".fsproj", ".fsx", ".fsi", ".fs",
    ".gradle", ".pom.xml", ".maven", ".ant", ".makefile", ".cmake", ".meson", ".ninja", ".bazel", ".buck",
    ".buildkite.yml", ".circleci.yml", ".travis.yml",
]);

export const ALREADY_COMPRESSED_EXTENSIONS = new Set([
    ".zip", ".rar", ".7z", ".gz", ".tar", ".mp4", ".mp3", ".avi", ".mkv", ".jpg", ".jpeg", ".png",
]);

export function isAllowedFile(filename: string): boolean {
    const ext = "." + filename.split(".").pop()?.toLowerCase();
    return ALLOWED_EXTENSIONS.has(ext);
}

export function isCompressibleFile(filename: string): boolean {
    const ext = "." + (filename.split(".").pop()?.toLowerCase() ?? "");
    return !ALREADY_COMPRESSED_EXTENSIONS.has(ext);
}

/**
 * Comprime um ficheiro no browser usando a API nativa `CompressionStream("gzip")`
 * (sem bibliotecas externas pesadas). Se o resultado for maior ou igual ao original,
 * ou se o browser não suportar CompressionStream, devolve `null` para o servidor decidir.
 */
export async function compressFileInBrowserGzip(
    file: File
): Promise<{ blob: Blob; originalSize: number; compressedSize: number; ratioPercent: number } | null> {
    if (typeof window === "undefined" || !("CompressionStream" in window)) {
        return null;
    }
    if (!isCompressibleFile(file.name) || file.size < 512 || file.size > 150 * 1024 * 1024) {
        return null;
    }
    try {
        const cs = new CompressionStream("gzip");
        const compressedStream = file.stream().pipeThrough(cs);
        const compressedBlob = await new Response(compressedStream).blob();
        if (compressedBlob.size >= file.size) {
            return null;
        }
        const saved = file.size - compressedBlob.size;
        const ratioPercent = Number(((saved / file.size) * 100).toFixed(1));
        return {
            blob: compressedBlob,
            originalSize: file.size,
            compressedSize: compressedBlob.size,
            ratioPercent,
        };
    } catch {
        return null;
    }
}

export type AccessRole = "owner" | "editor" | "downloader" | "viewer";

export type FileItem = {
    id: string;
    filename: string;
    size_bytes: number;
    original_size_bytes?: number;
    compressed?: boolean;
    compression_ratio_percent?: number;
    mime_type: string | null;
    created_at: string;
    my_role?: AccessRole;
    owner_name?: string;
    owner_email?: string;
    folder_id?: string | null;
};

export type Pagination = {
    page: number;
    limit: number;
    total: number;
    pages: number;
};

export type FilesResponseData = {
    items: FileItem[];
    pagination: Pagination;
};

export type ApiResponse<T> = {
    success: boolean;
    message: string;
    data: T;
};

// 📦 Plano do utilizador
export type Plan = {
    name: string;
    max_storage_mb: number;
    max_requests: number;
};

// 📊 Uso atual
export type Usage = {
    storage_bytes: number;
    requests: number;
    ingress: number;
    egress: number;
};

// ⚡ Estado do Rate Limiter e Concorrência MEGA
export type RateLimitSnapshot = {
    api_requests_per_min: { used: number; limit: number; remaining: number };
    transfers_per_min: { used: number; limit: number; remaining: number };
    concurrency: {
        active_slots: number;
        max_slots: number;
        recommended_client_parallelism: number;
    };
    bandwidth_per_min: {
        used_bytes: number;
        limit_bytes: number;
        limit_mb: number;
    };
    window_seconds: number;
};

// 📊 Stats completos
export type StatsData = {
    plan: Plan;
    usage: Usage;
    rate_limit?: RateLimitSnapshot;
};

export type Color = keyof typeof colorMap | string;

export type StatCardType = {
    label: string;
    value: string | number;
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
    color?: Color;
    trend?: {
        value: number;
        positive: boolean;
    };
    href?: string;
    description?: string;
    badge?: string;
};

// 🎯 Resposta específica de stats
export type StatsResponse = ApiResponse<StatsData>;

export const colorMap = {
    blue: true,
    emerald: true,
    red: true,
    amber: true,
    green: true,
    yellow: true,
    orange: true,
    purple: true,
    pink: true,
    indigo: true,
    gray: true,
} as const;

export const MAX_FILE_SIZE_MB = 1024; // 1GB
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export const STYLES = `
                @keyframes slide-in {
                    from { opacity: 0; transform: translateY(-8px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                @keyframes scale-in {
                    from { opacity: 0; transform: scale(0.95); }
                    to   { opacity: 1; transform: scale(1); }
                }
                .animate-slide-in { animation: slide-in 0.2s ease; }
                .animate-scale-in { animation: scale-in 0.2s ease; }
            `;

export const MAX_DIRECT_DOWNLOAD = 20 * 1024 * 1024;

export type MessageType = { text: string; type: "success" | "error" | "warning" };

export function validateFile(file: File): string | null {
    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(ext)) {
        return `Tipo de ficheiro (${ext}) não permitido.`;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
        return `O ficheiro excede o limite de ${MAX_FILE_SIZE_MB}MB (tamanho: ${(file.size / 1024 / 1024).toFixed(2)}MB)`;
    }
    if (file.size === 0) {
        return "O ficheiro está vazio.";
    }
    return null;
}

export function formatBytes(bytes: number): string {
    if (!bytes || bytes <= 0) return "0 B";
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.min(sizes.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
    return (bytes / Math.pow(1024, i)).toFixed(2) + " " + sizes[i];
}

export function formatSpeed(bytesPerSec: number): string {
    if (!bytesPerSec || bytesPerSec <= 0) return "0 KB/s";
    if (bytesPerSec >= 1024 * 1024) {
        return `${(bytesPerSec / (1024 * 1024)).toFixed(2)} MB/s`;
    }
    return `${Math.max(1, Math.round(bytesPerSec / 1024))} KB/s`;
}

export function formatEta(seconds: number | null): string {
    if (seconds === null || !isFinite(seconds) || seconds <= 0) return "";
    if (seconds < 60) return `~${Math.ceil(seconds)}s`;
    const mins = Math.floor(seconds / 60);
    const secs = Math.ceil(seconds % 60);
    return `~${mins}m ${secs}s`;
}

export function getRoleBadgeInfo(role?: AccessRole): { label: string; cls: string } {
    switch (role) {
        case "owner":
            return { label: "Proprietário", cls: "bg-indigo-50 text-indigo-700 border-indigo-200" };
        case "editor":
            return { label: "Editor", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" };
        case "downloader":
            return { label: "Download", cls: "bg-blue-50 text-blue-700 border-blue-200" };
        case "viewer":
            return { label: "Apenas Leitura", cls: "bg-amber-50 text-amber-700 border-amber-200" };
        default:
            return { label: "Proprietário", cls: "bg-gray-50 text-gray-600 border-gray-200" };
    }
}

export function getFileIcon(filename: string): string {
    const ext = filename.split(".").pop()?.toLowerCase();

    const map: Record<string, string> = {
        pdf: "📕",
        doc: "📘",
        docx: "📘",
        txt: "📄",
        md: "📝",
        json: "🧠",
        csv: "📊",
        xml: "📰",
        sql: "🗄️",
        html: "🌐",
        css: "🎨",
        js: "⚡",
        ts: "🟦",
        jsx: "⚛️",
        tsx: "⚛️",
        png: "🖼️",
        jpg: "🖼️",
        jpeg: "🖼️",
        mp4: "🎬",
        mp3: "🎵",
        avi: "🎥",
        mkv: "🎥",
        zip: "📦",
        rar: "📦",
        "7z": "📦",
        gz: "🗜️",
        py: "🐍",
        java: "☕",
        go: "🐹",
        php: "🐘",
        rb: "💎",
        rs: "🦀",
        yml: "⚙️",
        yaml: "⚙️",
        env: "🔐",
    };

    return map[ext ?? ""] ?? "📁";
}

// ─── Toast Component ─────────────────────────────────────────────────────────
export function Toast({ message, onClose }: { message: MessageType; onClose: () => void }) {
    useEffect(() => {
        const t = setTimeout(onClose, 5000);
        return () => clearTimeout(t);
    }, [onClose]);

    const styles: Record<string, string> = {
        success: "bg-emerald-50 border-emerald-400 text-emerald-800",
        error: "bg-red-50 border-red-400 text-red-800",
        warning: "bg-amber-50 border-amber-400 text-amber-800",
    };
    const icons: Record<string, string> = { success: "✓", error: "✕", warning: "⚠" };

    return (
        <div
            className={`flex items-start gap-3 p-4 rounded-xl border shadow-lg text-sm animate-slide-in ${styles[message.type]}`}
            role="alert"
        >
            <span className="text-lg leading-none mt-0.5">{icons[message.type]}</span>
            <p className="flex-1 leading-snug">{message.text}</p>
            <button onClick={onClose} className="opacity-60 hover:opacity-100 text-lg leading-none transition-opacity">
                ×
            </button>
        </div>
    );
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────
export function ProgressBar({ value, color = "blue" }: { value: number; color?: string }) {
    const barColorMap: Record<string, string> = {
        blue: "bg-blue-500",
        emerald: "bg-emerald-500",
        amber: "bg-amber-500",
        red: "bg-red-500",
        purple: "bg-purple-500",
        indigo: "bg-indigo-500",
    };
    const barCls = barColorMap[color] ?? "bg-blue-500";
    return (
        <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
            <div
                className={`h-2 rounded-full transition-all duration-200 ${barCls}`}
                style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
            />
        </div>
    );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
export function StatCard({
    label, value, sub, percent, color,
}: { label: string; value: string; sub?: string; percent?: number; color: string }) {
    return (
        <div className="p-5 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">{label}</p>
            <p className="text-xl font-bold text-gray-800 leading-tight">{value}</p>
            {sub && <p className="text-sm text-gray-500 mt-0.5">{sub}</p>}
            {percent !== undefined && (
                <div className="mt-3">
                    <ProgressBar value={percent} color={color} />
                    <p className="text-xs text-gray-400 mt-1">{percent.toFixed(1)}% utilizado</p>
                </div>
            )}
        </div>
    );
}

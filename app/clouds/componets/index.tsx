import { useEffect } from "react";

export const ALLOWED_EXTENSIONS = new Set([".txt", ".pdf", ".png", ".jpg", ".jpeg", ".json", ".csv", ".doc", ".docx", ".xls",
    ".xlsx", ".ppt", ".pptx", ".zip", ".rar", ".7z", ".tar", ".gz", ".mp4", ".mp3", ".avi", ".mkv", ".csv", ".json", ".xml", ".html", ".css", ".js", ".ts", ".tsx", ".jsx", ".py", ".java", ".c",
    , ".cpp", ".h", ".hpp", ".go", ".rb", ".php", ".swift", ".kt", ".rs", ".dart", ".sh", ".bat", ".ps1",
    ".sql", ".md", ".yml", ".yaml", ".log", ".cfg", ".ini", ".env", ".dockerfile", ".k8s.yaml", ".helm.yaml", ".ipynb", ".r", ".sas", ".stata", ".spss", ".m", ".lua", ".groovy", ".scala", ".clj", ".cljs", ".coffee",
    ".asm", ".v", ".sv", ".vh", ".vhd", ".vhdl", ".svelte", ".vue", ".angular", ".react", ".ember", ".backbone", ".flutter", ".dart", ".xcodeproj", ".xcworkspace", ".sln", ".csproj", ".vbproj", ".fsproj", ".fsx", ".fsi", ".fs", ".fsproj", ".fsx", ".fsi", ".fs", ".gradle", ".pom.xml", ".maven", ".ant", ".makefile",
    ".cmake", ".meson", ".ninja", ".bazel", ".buck", ".buildkite.yml", ".circleci.yml", ".travis.yml",
    // Adicione mais extensões conforme necessário
]);


export function isAllowedFile(filename: string): boolean {
    const ext = "." + filename.split(".").pop()?.toLowerCase();
    return ALLOWED_EXTENSIONS.has(ext);
}

export type FileItem = {
    id: string;
    filename: string;
    size_bytes: number;
    mime_type: string | null;
    created_at: string;
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

// 📊 Stats completos
export type StatsData = {
    plan: Plan;
    usage: Usage;
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
            `

export const MAX_DIRECT_DOWNLOAD = 20 * 1024 * 1024;

export type MessageType = { text: string; type: "success" | "error" | "warning" };

export function validateFile(file: File): string | null {
    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(ext)) {
        return `Tipo de ficheiro não permitido. Permitidos: ${Array.from(ALLOWED_EXTENSIONS).join(", ")}`;
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
    if (!bytes) return "0 B";
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return (bytes / Math.pow(1024, i)).toFixed(2) + " " + sizes[i];
}

export function getFileIcon(filename: string): string {
    const ext = filename.split(".").pop()?.toLowerCase();

    const map: Record<string, string> = {
        // 📄 documentos
        pdf: "📕",
        doc: "📘",
        docx: "📘",
        txt: "📄",
        md: "📝",

        // 📊 dados
        json: "🧠",
        csv: "📊",
        xml: "📰",
        sql: "🗄️",

        // 🌐 web
        html: "🌐",
        css: "🎨",
        js: "⚡",
        ts: "🟦",
        jsx: "⚛️",
        tsx: "⚛️",

        // 🖼️ imagens
        png: "🖼️",
        jpg: "🖼️",
        jpeg: "🖼️",

        // 🎬 media
        mp4: "🎬",
        mp3: "🎵",
        avi: "🎥",
        mkv: "🎥",

        // 📦 arquivos
        zip: "📦",
        rar: "📦",
        "7z": "📦",

        // 💻 código
        py: "🐍",
        java: "☕",
        go: "🐹",
        php: "🐘",
        rb: "💎",
        rs: "🦀",

        // ⚙️ config
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
    return (
        <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
            <div
                className={`h-2 rounded-full transition-all duration-200 bg-${color}-500`}
                style={{ width: `${Math.min(100, value)}%` }}
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


"use client";

import { useEffect, useRef, useState } from "react";
import {
    ChevronRight,
    Folder,
    FolderPlus,
    HardDrive,
    Lock,
    LockOpen,
    MoreVertical,
    Pencil,
    Trash2,
    Unlock,
} from "lucide-react";

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type FolderNode = {
    id: string;
    name: string;
    parent_id: string | null;
    /** Tem senha definida. */
    is_locked: boolean;
    /** Está aberta nesta sessão (o desbloqueio dura 30 min). */
    is_unlocked: boolean;
    created_at?: string | null;
    /** Vem vazio enquanto a pasta estiver fechada — o backend não revela o conteúdo. */
    children: FolderNode[];
    file_count: number;
};

/** Tem senha e ainda não foi aberta nesta sessão. */
export function isFechada(f: FolderNode): boolean {
    return f.is_locked && !f.is_unlocked;
}

/** O que está a ser arrastado dentro da app (ficheiro da lista ou pasta). */
export type DragItem =
    | { kind: "file"; id: string; name: string }
    | { kind: "folder"; id: string; name: string };

/** Um drop traz ficheiros do sistema operativo? */
export function hasOsFiles(e: React.DragEvent): boolean {
    return Array.from(e.dataTransfer.types).includes("Files");
}

/**
 * O 423 traz a pasta que falta desbloquear. O handler de erros do backend
 * embrulha o `detail`, por isso aceita-se objeto ou string.
 */
export function parseLockedError(err: any): { id: string; name: string } | null {
    if (err?.response?.status !== 423) return null;
    const d = err.response.data?.detail;
    if (d && typeof d === "object" && d.folder_id) {
        return { id: String(d.folder_id), name: String(d.folder_name ?? "pasta") };
    }
    return { id: "", name: "pasta" };
}

export function apiErrorMessage(err: any, fallback: string): string {
    const d = err?.response?.data?.detail;
    if (typeof d === "string") return d;
    if (d && typeof d === "object" && d.message) return String(d.message);
    return err?.message ?? fallback;
}

// ─── Breadcrumb ───────────────────────────────────────────────────────────────

export function FolderBreadcrumb({
    path,
    onNavigate,
    onDropOn,
    dragging,
}: {
    path: FolderNode[];
    onNavigate: (index: number) => void;
    /** Largar aqui move para essa pasta; `null` = raiz. */
    onDropOn?: (folderId: string | null, e: React.DragEvent) => void;
    dragging?: boolean;
}) {
    // O caminho também aceita drops: é assim que se tira algo de uma pasta.
    const [alvo, setAlvo] = useState<string | "root" | null>(null);

    const dropProps = (id: string | null) =>
        onDropOn
            ? {
                onDragOver: (e: React.DragEvent) => {
                    e.preventDefault();
                    setAlvo(id ?? "root");
                },
                onDragLeave: () => setAlvo(null),
                onDrop: (e: React.DragEvent) => {
                    e.preventDefault();
                    setAlvo(null);
                    onDropOn(id, e);
                },
            }
            : {};

    const realce = (id: string | "root") =>
        alvo === id ? "bg-blue-100 text-blue-700 ring-2 ring-blue-300" : "";

    return (
        <nav className="flex items-center gap-1 text-sm flex-wrap" aria-label="Caminho">
            <button
                onClick={() => onNavigate(-1)}
                {...dropProps(null)}
                className={`flex items-center gap-1.5 px-2 py-1 rounded-lg transition-colors ${realce("root") ||
                    (path.length === 0
                        ? "text-gray-800 font-semibold"
                        : "text-gray-500 hover:text-gray-800 hover:bg-gray-100")
                    } ${dragging ? "ring-1 ring-dashed ring-blue-200" : ""}`}
            >
                <HardDrive className="w-4 h-4" />
                Início
            </button>

            {path.map((f, i) => (
                <span key={f.id} className="flex items-center gap-1">
                    <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
                    <button
                        onClick={() => onNavigate(i)}
                        {...dropProps(f.id)}
                        className={`flex items-center gap-1.5 px-2 py-1 rounded-lg transition-colors ${realce(f.id) ||
                            (i === path.length - 1
                                ? "text-gray-800 font-semibold"
                                : "text-gray-500 hover:text-gray-800 hover:bg-gray-100")
                            } ${dragging ? "ring-1 ring-dashed ring-blue-200" : ""}`}
                    >
                        {/* Estamos lá dentro, logo a pasta com senha está aberta. */}
                        {f.is_locked && <Unlock className="w-3.5 h-3.5 text-emerald-500" />}
                        {f.name}
                    </button>
                </span>
            ))}
        </nav>
    );
}

// ─── Grelha de pastas ─────────────────────────────────────────────────────────

export function FolderGrid({
    folders,
    onOpen,
    onRename,
    onPassword,
    onDelete,
    onLock,
    onDropOn,
    onDragStart,
    onDragEnd,
    dragItem,
}: {
    folders: FolderNode[];
    onOpen: (f: FolderNode) => void;
    onRename: (f: FolderNode) => void;
    onPassword: (f: FolderNode) => void;
    onDelete: (f: FolderNode) => void;
    onLock: (f: FolderNode) => void;
    onDropOn?: (destino: FolderNode, e: React.DragEvent) => void;
    onDragStart?: (item: DragItem) => void;
    onDragEnd?: () => void;
    dragItem?: DragItem | null;
}) {
    const [menu, setMenu] = useState<string | null>(null);
    const [alvo, setAlvo] = useState<string | null>(null);
    const wrapRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!menu) return;
        const fechar = (e: MouseEvent) => {
            if (!wrapRef.current?.contains(e.target as Node)) setMenu(null);
        };
        document.addEventListener("mousedown", fechar);
        return () => document.removeEventListener("mousedown", fechar);
    }, [menu]);

    if (folders.length === 0) return null;

    return (
        <div ref={wrapRef} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {folders.map((f) => {
                // Não faz sentido largar uma pasta em cima de si própria.
                const proprio = dragItem?.kind === "folder" && dragItem.id === f.id;
                const realcada = alvo === f.id && !proprio;

                return (
                <div
                    key={f.id}
                    draggable={!!onDragStart}
                    onDragStart={(e) => {
                        e.dataTransfer.effectAllowed = "move";
                        onDragStart?.({ kind: "folder", id: f.id, name: f.name });
                    }}
                    onDragEnd={() => { setAlvo(null); onDragEnd?.(); }}
                    onDragOver={(e) => {
                        if (!onDropOn || proprio) return;
                        e.preventDefault();
                        e.dataTransfer.dropEffect = "move";
                        setAlvo(f.id);
                    }}
                    onDragLeave={() => setAlvo((a) => (a === f.id ? null : a))}
                    onDrop={(e) => {
                        if (!onDropOn || proprio) return;
                        e.preventDefault();
                        setAlvo(null);
                        onDropOn(f, e);
                    }}
                    className={`group relative p-3 bg-white border rounded-xl transition-all ${realcada
                        ? "border-blue-400 ring-2 ring-blue-200 shadow-md scale-[1.02]"
                        : "border-gray-100 hover:border-blue-200 hover:shadow-sm"
                        } ${proprio ? "opacity-40" : ""}`}
                >
                    <button
                        onClick={() => onOpen(f)}
                        className="w-full flex items-center gap-2.5 text-left min-w-0"
                        title={isFechada(f) ? `${f.name} (protegida)` : f.name}
                    >
                        <span className="relative shrink-0">
                            <Folder
                                className={`w-8 h-8 ${isFechada(f) ? "text-amber-400" : "text-blue-400"}`}
                                fill="currentColor"
                                fillOpacity={0.15}
                            />
                            {f.is_locked && (
                                isFechada(f) ? (
                                    <Lock className="w-3.5 h-3.5 absolute -bottom-0.5 -right-0.5 text-amber-600 bg-white rounded-full p-[1px]" />
                                ) : (
                                    <LockOpen className="w-3.5 h-3.5 absolute -bottom-0.5 -right-0.5 text-emerald-600 bg-white rounded-full p-[1px]" />
                                )
                            )}
                        </span>

                        <span className="min-w-0 flex-1">
                            <span className="block text-sm font-medium text-gray-800 truncate">
                                {f.name}
                            </span>
                            <span className="block text-xs text-gray-400">
                                {isFechada(f)
                                    ? "protegida"
                                    : `${f.file_count} ficheiro${f.file_count === 1 ? "" : "s"}`}
                            </span>
                        </span>
                    </button>

                    <button
                        onClick={() => setMenu(menu === f.id ? null : f.id)}
                        className="absolute top-2 right-1.5 p-1 rounded-md text-gray-300 hover:text-gray-600 hover:bg-gray-100 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                        aria-label={`Opções de ${f.name}`}
                    >
                        <MoreVertical className="w-4 h-4" />
                    </button>

                    {menu === f.id && (
                        <div className="absolute z-20 top-8 right-1 w-44 bg-white border border-gray-100 rounded-xl shadow-lg py-1 animate-scale-in">
                            <MenuItem
                                icon={<Pencil className="w-3.5 h-3.5" />}
                                onClick={() => { setMenu(null); onRename(f); }}
                            >
                                Renomear
                            </MenuItem>
                            <MenuItem
                                icon={<Lock className="w-3.5 h-3.5" />}
                                onClick={() => { setMenu(null); onPassword(f); }}
                            >
                                {f.is_locked ? "Alterar senha" : "Proteger com senha"}
                            </MenuItem>
                            {f.is_locked && !isFechada(f) && (
                                <MenuItem
                                    icon={<LockOpen className="w-3.5 h-3.5" />}
                                    onClick={() => { setMenu(null); onLock(f); }}
                                >
                                    Bloquear agora
                                </MenuItem>
                            )}
                            <MenuItem
                                icon={<Trash2 className="w-3.5 h-3.5" />}
                                danger
                                onClick={() => { setMenu(null); onDelete(f); }}
                            >
                                Apagar
                            </MenuItem>
                        </div>
                    )}

                    {/* Pista visual durante o arrasto: o cadeado avisa que vai
                        pedir a senha antes de deixar largar. */}
                    {realcada && (
                        <div className="absolute inset-0 rounded-xl bg-blue-50/70 flex items-center justify-center pointer-events-none">
                            <span className="flex items-center gap-1.5 text-xs font-semibold text-blue-700">
                                {isFechada(f) ? (
                                    <><Lock className="w-3.5 h-3.5" /> Pede senha</>
                                ) : (
                                    <>Mover para aqui</>
                                )}
                            </span>
                        </div>
                    )}
                </div>
                );
            })}
        </div>
    );
}

function MenuItem({
    children, icon, onClick, danger,
}: {
    children: React.ReactNode;
    icon: React.ReactNode;
    onClick: () => void;
    danger?: boolean;
}) {
    return (
        <button
            onClick={onClick}
            className={`w-full flex items-center gap-2 px-3 py-1.5 text-sm text-left transition-colors ${danger
                ? "text-red-600 hover:bg-red-50"
                : "text-gray-600 hover:bg-gray-50"
                }`}
        >
            {icon}
            {children}
        </button>
    );
}

// ─── Botão "nova pasta" ───────────────────────────────────────────────────────

export function NewFolderButton({ onClick }: { onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
        >
            <FolderPlus className="w-4 h-4" />
            Nova pasta
        </button>
    );
}

// ─── Modal base ───────────────────────────────────────────────────────────────

function Modal({
    title, subtitle, children, onCancel,
}: {
    title: string;
    subtitle?: string;
    children: React.ReactNode;
    onCancel: () => void;
}) {
    useEffect(() => {
        const esc = (e: KeyboardEvent) => e.key === "Escape" && onCancel();
        document.addEventListener("keydown", esc);
        return () => document.removeEventListener("keydown", esc);
    }, [onCancel]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-5 animate-scale-in">
                <h3 className="text-base font-semibold text-gray-800">{title}</h3>
                {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
                <div className="mt-4">{children}</div>
            </div>
        </div>
    );
}

const inputCls =
    "w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent";

function Actions({
    onCancel, submitLabel, busy, danger,
}: {
    onCancel: () => void;
    submitLabel: string;
    busy?: boolean;
    danger?: boolean;
}) {
    return (
        <div className="flex justify-end gap-2 mt-5">
            <button
                type="button"
                onClick={onCancel}
                className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
                Cancelar
            </button>
            <button
                type="submit"
                disabled={busy}
                className={`px-4 py-1.5 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50 ${danger ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700"
                    }`}
            >
                {busy ? "Aguarde…" : submitLabel}
            </button>
        </div>
    );
}

// ─── Criar pasta ──────────────────────────────────────────────────────────────

export function CreateFolderModal({
    parentName, busy, onConfirm, onCancel,
}: {
    parentName?: string;
    busy?: boolean;
    onConfirm: (name: string, password?: string) => void;
    onCancel: () => void;
}) {
    const [name, setName] = useState("");
    const [protegida, setProtegida] = useState(false);
    const [password, setPassword] = useState("");

    const invalida = protegida && password.length > 0 && password.length < 4;

    return (
        <Modal
            title="Nova pasta"
            subtitle={parentName ? `Dentro de "${parentName}"` : "Na raiz"}
            onCancel={onCancel}
        >
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    if (!name.trim() || invalida) return;
                    onConfirm(name.trim(), protegida ? password : undefined);
                }}
            >
                <input
                    autoFocus
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nome da pasta"
                    className={inputCls}
                />

                <label className="flex items-center gap-2 mt-3 text-sm text-gray-600 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={protegida}
                        onChange={(e) => setProtegida(e.target.checked)}
                        className="rounded border-gray-300"
                    />
                    Proteger com senha
                </label>

                {protegida && (
                    <>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Senha (mín. 4 caracteres)"
                            className={`${inputCls} mt-2`}
                        />
                        <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">
                            A senha bloqueia o acesso a esta pasta e a tudo dentro dela. Os
                            ficheiros não são cifrados — podes sempre redefinir a senha.
                        </p>
                    </>
                )}

                <Actions
                    onCancel={onCancel}
                    submitLabel="Criar"
                    busy={busy || !name.trim() || invalida}
                />
            </form>
        </Modal>
    );
}

// ─── Desbloquear ──────────────────────────────────────────────────────────────

export function UnlockModal({
    folderName, busy, error, onConfirm, onCancel,
}: {
    folderName: string;
    busy?: boolean;
    error?: string | null;
    onConfirm: (password: string) => void;
    onCancel: () => void;
}) {
    const [password, setPassword] = useState("");

    return (
        <Modal
            title="Pasta protegida"
            subtitle={`Introduz a senha para abrir "${folderName}".`}
            onCancel={onCancel}
        >
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    if (password) onConfirm(password);
                }}
            >
                <input
                    autoFocus
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Senha"
                    className={inputCls}
                />
                {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
                <p className="text-xs text-gray-400 mt-2">
                    O acesso mantém-se aberto durante 30 minutos.
                </p>
                <Actions onCancel={onCancel} submitLabel="Abrir" busy={busy || !password} />
            </form>
        </Modal>
    );
}

// ─── Definir/alterar/remover senha ────────────────────────────────────────────

export function PasswordModal({
    folder, busy, error, onConfirm, onCancel,
}: {
    folder: FolderNode;
    busy?: boolean;
    error?: string | null;
    onConfirm: (current: string | undefined, nova: string | undefined) => void;
    onCancel: () => void;
}) {
    const [current, setCurrent] = useState("");
    const [nova, setNova] = useState("");
    const [remover, setRemover] = useState(false);

    const invalida = !remover && nova.length > 0 && nova.length < 4;

    return (
        <Modal
            title={folder.is_locked ? "Alterar senha" : "Proteger com senha"}
            subtitle={`Pasta "${folder.name}"`}
            onCancel={onCancel}
        >
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    if (invalida) return;
                    onConfirm(
                        folder.is_locked ? current : undefined,
                        remover ? undefined : nova
                    );
                }}
            >
                {folder.is_locked && (
                    <input
                        autoFocus
                        type="password"
                        value={current}
                        onChange={(e) => setCurrent(e.target.value)}
                        placeholder="Senha atual"
                        className={inputCls}
                    />
                )}

                {!remover && (
                    <input
                        autoFocus={!folder.is_locked}
                        type="password"
                        value={nova}
                        onChange={(e) => setNova(e.target.value)}
                        placeholder="Nova senha (mín. 4 caracteres)"
                        className={`${inputCls} ${folder.is_locked ? "mt-2" : ""}`}
                    />
                )}

                {folder.is_locked && (
                    <label className="flex items-center gap-2 mt-3 text-sm text-gray-600 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={remover}
                            onChange={(e) => setRemover(e.target.checked)}
                            className="rounded border-gray-300"
                        />
                        Remover a senha desta pasta
                    </label>
                )}

                {error && <p className="text-xs text-red-600 mt-2">{error}</p>}

                <Actions
                    onCancel={onCancel}
                    submitLabel={remover ? "Remover senha" : "Guardar"}
                    busy={busy || invalida || (!remover && !nova)}
                    danger={remover}
                />
            </form>
        </Modal>
    );
}

// ─── Renomear ─────────────────────────────────────────────────────────────────

export function RenameFolderModal({
    folder, busy, error, onConfirm, onCancel,
}: {
    folder: FolderNode;
    busy?: boolean;
    error?: string | null;
    onConfirm: (name: string) => void;
    onCancel: () => void;
}) {
    const [name, setName] = useState(folder.name);

    return (
        <Modal title="Renomear pasta" onCancel={onCancel}>
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    if (name.trim()) onConfirm(name.trim());
                }}
            >
                <input
                    autoFocus
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={inputCls}
                />
                {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
                <Actions onCancel={onCancel} submitLabel="Guardar" busy={busy || !name.trim()} />
            </form>
        </Modal>
    );
}

// ─── Apagar pasta ─────────────────────────────────────────────────────────────

export function DeleteFolderModal({
    folder, busy, onConfirm, onCancel,
}: {
    folder: FolderNode;
    busy?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}) {
    return (
        <Modal
            title={`Apagar "${folder.name}"?`}
            subtitle="As subpastas e os ficheiros lá dentro também saem da lista."
            onCancel={onCancel}
        >
            <form onSubmit={(e) => { e.preventDefault(); onConfirm(); }}>
                <Actions onCancel={onCancel} submitLabel="Apagar" busy={busy} danger />
            </form>
        </Modal>
    );
}

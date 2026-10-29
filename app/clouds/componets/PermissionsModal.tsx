"use client";

import { useCallback, useEffect, useState } from "react";
import {
    Building2,
    Check,
    Copy,
    Globe,
    KeyRound,
    Link2,
    Lock,
    Shield,
    Trash2,
    UserPlus,
    Users,
    X,
} from "lucide-react";
import api from "@/context/axioCuston";
import { apiErrorMessage } from "./folders";

export type TargetResource = {
    type: "file" | "folder";
    id: string;
    name: string;
};

type GrantEntry = {
    user_id: number;
    email: string;
    nome: string;
    role: "viewer" | "downloader" | "editor";
    role_label?: string;
    granted_at: string;
};

type ShareLinkEntry = {
    token: string;
    role: "viewer" | "downloader";
    expires_at: string | null;
    max_downloads: number | null;
    downloads_count: number;
    has_password: boolean;
    created_at: string;
};

type PermissionsData = {
    target_type: "file" | "folder";
    target_id: string;
    target_name: string;
    owner_id: number;
    my_role: "owner" | "editor" | "downloader" | "viewer";
    visibility: "private" | "company";
    company_role: "viewer" | "downloader" | "editor";
    grants: GrantEntry[];
    share_links: ShareLinkEntry[];
};

const ROLE_OPTIONS: { value: "viewer" | "downloader" | "editor"; label: string; desc: string }[] = [
    {
        value: "viewer",
        label: "Leitor (Apenas Ver)",
        desc: "Visualiza metadados na lista, sem permissão de download ou edição.",
    },
    {
        value: "downloader",
        label: "Transferência (Ver e Baixar)",
        desc: "Pode visualizar e transferir o ficheiro/pasta, sem modificar.",
    },
    {
        value: "editor",
        label: "Editor (Upload e Organizar)",
        desc: "Pode transferir, enviar ficheiros para a pasta e mover/renomear.",
    },
];

export function PermissionsModal({
    target,
    onClose,
    onMessage,
}: {
    target: TargetResource;
    onClose: () => void;
    onMessage: (text: string, type: "success" | "error" | "warning") => void;
}) {
    const [tab, setTab] = useState<"users" | "links">("users");
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [data, setData] = useState<PermissionsData | null>(null);

    // Form de concessão a utilizador
    const [email, setEmail] = useState("");
    const [role, setRole] = useState<"viewer" | "downloader" | "editor">("downloader");

    // Form de criação de link de partilha
    const [linkRole, setLinkRole] = useState<"viewer" | "downloader">("downloader");
    const [expiresHours, setExpiresHours] = useState<number>(72);
    const [maxDownloads, setMaxDownloads] = useState<string>("");
    const [linkPassword, setLinkPassword] = useState("");
    const [copiedToken, setCopiedToken] = useState<string | null>(null);

    const loadPermissions = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get(`/storage/permissions/${target.type}/${target.id}`);
            setData(res.data?.data ?? null);
        } catch (err) {
            onMessage(apiErrorMessage(err, "Erro ao carregar permissões"), "error");
        } finally {
            setLoading(false);
        }
    }, [target.type, target.id, onMessage]);

    useEffect(() => {
        loadPermissions();
    }, [loadPermissions]);

    useEffect(() => {
        const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
        document.addEventListener("keydown", esc);
        return () => document.removeEventListener("keydown", esc);
    }, [onClose]);

    const isOwner = data?.my_role === "owner";

    const handleGrantUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim() || !isOwner) return;
        setBusy(true);
        try {
            const res = await api.post(`/storage/permissions/${target.type}/${target.id}/grant`, {
                email: email.trim(),
                role,
            });
            setData(res.data?.data ?? null);
            setEmail("");
            onMessage(`Permissão '${role}' concedida a ${email.trim()}`, "success");
        } catch (err) {
            onMessage(apiErrorMessage(err, "Não foi possível conceder permissão"), "error");
        } finally {
            setBusy(false);
        }
    };

    const handleUpdateVisibility = async (
        newVisibility: "private" | "company",
        newCompanyRole?: "viewer" | "downloader" | "editor"
    ) => {
        if (!isOwner) return;
        setBusy(true);
        try {
            const res = await api.post(`/storage/permissions/${target.type}/${target.id}/grant`, {
                role: data?.company_role ?? "downloader",
                visibility: newVisibility,
                company_role: newCompanyRole ?? data?.company_role ?? "downloader",
            });
            setData(res.data?.data ?? null);
            onMessage(
                newVisibility === "company"
                    ? "Acesso ativado para membros da sua empresa"
                    : "Recurso definido como Privado",
                "success"
            );
        } catch (err) {
            onMessage(apiErrorMessage(err, "Erro ao alterar visibilidade"), "error");
        } finally {
            setBusy(false);
        }
    };

    const handleRevokeUser = async (userId: number, userEmail: string) => {
        if (!isOwner) return;
        setBusy(true);
        try {
            const res = await api.delete(
                `/storage/permissions/${target.type}/${target.id}/revoke/${userId}`
            );
            setData(res.data?.data ?? null);
            onMessage(`Acesso revogado para ${userEmail}`, "success");
        } catch (err) {
            onMessage(apiErrorMessage(err, "Erro ao revogar acesso"), "error");
        } finally {
            setBusy(false);
        }
    };

    const handleCreateShareLink = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isOwner) return;
        setBusy(true);
        try {
            await api.post(`/storage/permissions/${target.type}/${target.id}/share-link`, {
                role: linkRole,
                expires_in_hours: expiresHours > 0 ? expiresHours : null,
                max_downloads: maxDownloads ? Number(maxDownloads) : null,
                password: linkPassword.trim() || null,
            });
            setLinkPassword("");
            setMaxDownloads("");
            await loadPermissions();
            onMessage("Link de partilha seguro criado!", "success");
        } catch (err) {
            onMessage(apiErrorMessage(err, "Erro ao gerar link de partilha"), "error");
        } finally {
            setBusy(false);
        }
    };

    const handleDeleteShareLink = async (token: string) => {
        if (!isOwner) return;
        setBusy(true);
        try {
            const res = await api.delete(
                `/storage/permissions/${target.type}/${target.id}/share-link/${token}`
            );
            setData(res.data?.data ?? null);
            onMessage("Link de partilha revogado", "success");
        } catch (err) {
            onMessage(apiErrorMessage(err, "Erro ao revogar link"), "error");
        } finally {
            setBusy(false);
        }
    };

    const copyShareUrl = (token: string) => {
        const baseUrl = api.defaults.baseURL || window.location.origin;
        const shareUrl = `${baseUrl.replace(/\/$/, "")}/storage/shared-link/${token}/download`;
        navigator.clipboard.writeText(shareUrl);
        setCopiedToken(token);
        setTimeout(() => setCopiedToken(null), 2000);
        onMessage("Link de transferência copiado para a área de transferência", "success");
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-[1px]">
            <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-scale-in">
                {/* Cabeçalho */}
                <div className="px-6 py-4 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center shrink-0">
                            <Shield className="w-4 h-4 text-emerald-400" />
                        </div>
                        <div className="min-w-0">
                            <h3 className="text-sm font-bold truncate">
                                Controlo de Acesso & Permissões
                            </h3>
                            <p className="text-xs text-slate-300 truncate">
                                {target.type === "folder" ? "📁 Pasta:" : "📄 Ficheiro:"} {target.name}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 transition"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Abas */}
                <div className="px-6 pt-3 border-b border-gray-100 flex items-center gap-2 bg-gray-50/60">
                    <button
                        type="button"
                        onClick={() => setTab("users")}
                        className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-t-xl border-b-2 transition ${
                            tab === "users"
                                ? "border-indigo-600 text-indigo-700 bg-white"
                                : "border-transparent text-gray-500 hover:text-gray-800"
                        }`}
                    >
                        <Users className="w-3.5 h-3.5" /> Utilizadores & Visibilidade (
                        {data?.grants.length ?? 0})
                    </button>
                    <button
                        type="button"
                        onClick={() => setTab("links")}
                        className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-t-xl border-b-2 transition ${
                            tab === "links"
                                ? "border-indigo-600 text-indigo-700 bg-white"
                                : "border-transparent text-gray-500 hover:text-gray-800"
                        }`}
                    >
                        <Link2 className="w-3.5 h-3.5" /> Links de Partilha (
                        {data?.share_links.length ?? 0})
                    </button>
                </div>

                {/* Conteúdo */}
                <div className="p-6 max-h-[75vh] overflow-y-auto space-y-5">
                    {loading ? (
                        <div className="py-10 text-center text-sm text-gray-400">
                            A carregar política de segurança…
                        </div>
                    ) : tab === "users" ? (
                        <>
                            {/* Escopo de Visibilidade (Privado vs Empresa) */}
                            <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200/80 space-y-2.5">
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                                        {data?.visibility === "company" ? (
                                            <Building2 className="w-4 h-4 text-indigo-600" />
                                        ) : (
                                            <Lock className="w-4 h-4 text-amber-600" />
                                        )}
                                        Escopo de Visibilidade
                                    </span>

                                    <div className="flex items-center gap-1.5">
                                        <button
                                            type="button"
                                            disabled={!isOwner || busy}
                                            onClick={() => handleUpdateVisibility("private")}
                                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                                                data?.visibility === "private"
                                                    ? "bg-gray-900 text-white"
                                                    : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-100"
                                            }`}
                                        >
                                            🔒 Privado
                                        </button>
                                        <button
                                            type="button"
                                            disabled={!isOwner || busy}
                                            onClick={() => handleUpdateVisibility("company")}
                                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                                                data?.visibility === "company"
                                                    ? "bg-indigo-600 text-white"
                                                    : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-100"
                                            }`}
                                        >
                                            🏢 Membros da Empresa
                                        </button>
                                    </div>
                                </div>

                                {data?.visibility === "company" && (
                                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-200/60 text-xs">
                                        <span className="text-gray-600">
                                            Permissão padrão para colegas da empresa:
                                        </span>
                                        <select
                                            disabled={!isOwner || busy}
                                            value={data.company_role}
                                            onChange={(e) =>
                                                handleUpdateVisibility(
                                                    "company",
                                                    e.target.value as "viewer" | "downloader" | "editor"
                                                )
                                            }
                                            className="px-2.5 py-1 rounded-lg border border-gray-200 bg-white text-gray-800 font-medium"
                                        >
                                            {ROLE_OPTIONS.map((r) => (
                                                <option key={r.value} value={r.value}>
                                                    {r.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                            </div>

                            {/* Conceder Permissão a Utilizador */}
                            {isOwner && (
                                <form onSubmit={handleGrantUser} className="space-y-3">
                                    <label className="block text-xs font-semibold text-gray-700">
                                        Conceder acesso a utilizador específico
                                    </label>
                                    <div className="flex flex-col sm:flex-row gap-2">
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="email@empresa.ao"
                                            className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        />
                                        <select
                                            value={role}
                                            onChange={(e) =>
                                                setRole(
                                                    e.target.value as "viewer" | "downloader" | "editor"
                                                )
                                            }
                                            className="px-3 py-2 text-xs font-semibold border border-gray-200 rounded-xl bg-white text-gray-700"
                                        >
                                            {ROLE_OPTIONS.map((r) => (
                                                <option key={r.value} value={r.value}>
                                                    {r.label}
                                                </option>
                                            ))}
                                        </select>
                                        <button
                                            type="submit"
                                            disabled={busy || !email.trim()}
                                            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition disabled:opacity-50"
                                        >
                                            <UserPlus className="w-3.5 h-3.5" /> Autorizar
                                        </button>
                                    </div>
                                    <p className="text-[11px] text-gray-400">
                                        {ROLE_OPTIONS.find((r) => r.value === role)?.desc}
                                    </p>
                                </form>
                            )}

                            {/* Lista de Utilizadores com Acesso */}
                            <div className="space-y-2">
                                <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                                    Utilizadores Autorizados ({data?.grants.length ?? 0})
                                </h4>
                                {!data?.grants || data.grants.length === 0 ? (
                                    <div className="py-5 text-center text-xs text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                        Nenhum utilizador externo adicionado individualmente.
                                    </div>
                                ) : (
                                    <ul className="divide-y divide-gray-100 border border-gray-100 rounded-xl overflow-hidden">
                                        {data.grants.map((g) => (
                                            <li
                                                key={g.user_id}
                                                className="px-4 py-2.5 flex items-center justify-between gap-2 bg-white hover:bg-gray-50"
                                            >
                                                <div className="min-w-0">
                                                    <p className="text-xs font-semibold text-gray-800 truncate">
                                                        {g.nome || g.email}
                                                    </p>
                                                    <p className="text-[11px] text-gray-500 truncate">
                                                        {g.email}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-2 shrink-0">
                                                    <span className="px-2 py-0.5 text-[11px] font-semibold rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                                                        {g.role_label || g.role}
                                                    </span>
                                                    {isOwner && (
                                                        <button
                                                            type="button"
                                                            disabled={busy}
                                                            onClick={() =>
                                                                handleRevokeUser(g.user_id, g.email)
                                                            }
                                                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition"
                                                            title="Revogar permissão"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    )}
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </>
                    ) : (
                        <>
                            {/* Criador de Links de Partilha */}
                            {isOwner && (
                                <form
                                    onSubmit={handleCreateShareLink}
                                    className="p-4 rounded-xl bg-gray-50 border border-gray-200/80 space-y-3"
                                >
                                    <div className="flex items-center gap-2 text-xs font-semibold text-gray-800">
                                        <Globe className="w-4 h-4 text-indigo-600" />
                                        Gerar novo link de partilha com controlo de taxa/expiração
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                                        <div>
                                            <label className="block text-[11px] font-medium text-gray-500 mb-1">
                                                Permissão do Link
                                            </label>
                                            <select
                                                value={linkRole}
                                                onChange={(e) =>
                                                    setLinkRole(
                                                        e.target.value as "viewer" | "downloader"
                                                    )
                                                }
                                                className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg bg-white"
                                            >
                                                <option value="downloader">Permitir Download</option>
                                                <option value="viewer">Apenas Visualização</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-[11px] font-medium text-gray-500 mb-1">
                                                Validade
                                            </label>
                                            <select
                                                value={expiresHours}
                                                onChange={(e) => setExpiresHours(Number(e.target.value))}
                                                className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg bg-white"
                                            >
                                                <option value={24}>24 horas</option>
                                                <option value={72}>3 dias (72h)</option>
                                                <option value={168}>7 dias</option>
                                                <option value={0}>Sem expiração</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-[11px] font-medium text-gray-500 mb-1">
                                                Máx. Downloads (Rate)
                                            </label>
                                            <input
                                                type="number"
                                                min={1}
                                                value={maxDownloads}
                                                onChange={(e) => setMaxDownloads(e.target.value)}
                                                placeholder="Ilimitado"
                                                className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg bg-white"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex flex-col sm:flex-row gap-2">
                                        <div className="relative flex-1">
                                            <KeyRound className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
                                            <input
                                                type="password"
                                                value={linkPassword}
                                                onChange={(e) => setLinkPassword(e.target.value)}
                                                placeholder="Senha opcional para o link"
                                                className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg bg-white"
                                            />
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={busy}
                                            className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition disabled:opacity-50"
                                        >
                                            Criar Link Seguro
                                        </button>
                                    </div>
                                </form>
                            )}

                            {/* Links Ativos */}
                            <div className="space-y-2">
                                <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                                    Links Ativos ({data?.share_links.length ?? 0})
                                </h4>
                                {!data?.share_links || data.share_links.length === 0 ? (
                                    <div className="py-5 text-center text-xs text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                        Nenhum link de partilha ativo para este recurso.
                                    </div>
                                ) : (
                                    <ul className="divide-y divide-gray-100 border border-gray-100 rounded-xl overflow-hidden">
                                        {data.share_links.map((lk) => (
                                            <li
                                                key={lk.token}
                                                className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white hover:bg-gray-50"
                                            >
                                                <div className="min-w-0 space-y-0.5">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="font-mono text-xs font-semibold text-gray-800">
                                                            …{lk.token.slice(-10)}
                                                        </span>
                                                        <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-blue-50 text-blue-700">
                                                            {lk.role === "downloader"
                                                                ? "Download"
                                                                : "Apenas Ver"}
                                                        </span>
                                                        {lk.has_password && (
                                                            <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-amber-50 text-amber-700">
                                                                🔑 Com senha
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-[11px] text-gray-500">
                                                        Downloads: {lk.downloads_count}
                                                        {lk.max_downloads ? ` / ${lk.max_downloads}` : " (ilimitado)"}
                                                        {lk.expires_at
                                                            ? ` · Expira: ${new Date(lk.expires_at).toLocaleDateString()}`
                                                            : " · Sem expiração"}
                                                    </p>
                                                </div>

                                                <div className="flex items-center gap-1.5 shrink-0">
                                                    <button
                                                        type="button"
                                                        onClick={() => copyShareUrl(lk.token)}
                                                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition"
                                                    >
                                                        {copiedToken === lk.token ? (
                                                            <>
                                                                <Check className="w-3.5 h-3.5" /> Copiado
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Copy className="w-3.5 h-3.5" /> Copiar URL
                                                            </>
                                                        )}
                                                    </button>
                                                    {isOwner && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleDeleteShareLink(lk.token)}
                                                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition"
                                                            title="Revogar link"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    )}
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}


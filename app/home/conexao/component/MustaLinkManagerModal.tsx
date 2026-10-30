"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity,
  BookOpen,
  Check,
  Copy,
  Cpu,
  Download,
  KeyRound,
  Laptop,
  Plus,
  RefreshCw,
  Server,
  ShieldCheck,
  Terminal,
  Trash2,
  X,
} from "lucide-react";
import { useSession } from "@/context/SessionContext";
import {
  createMustaLinkPairingCode,
  createMustaLinkToken,
  downloadMustaLinkPackage,
  getMustaLinkMinioUrl,
  getMustaLinkReleases,
  getMustaLinkStatus,
  MustaLinkAgent,
  MustaLinkArch,
  MustaLinkOS,
  MustaLinkPairingCodeResponse,
  MustaLinkRelease,
  MustaLinkTokenResponse,
  revokeMustaLinkAgent,
} from "@/service/mustalink";

interface MustaLinkManagerProps {
  isOpen?: boolean;
  inline?: boolean;
  onClose?: () => void;
  onSelectAgent?: (agentId: string, virtualHost: string) => void;
  onAgentsUpdated?: (agents: MustaLinkAgent[]) => void;
}

const OS_LABELS: Record<MustaLinkOS, string> = {
  windows: "Windows 10/11",
  linux: "Linux",
  darwin: "macOS",
};

const OS_SHORT_LABELS: Record<MustaLinkOS, string> = {
  windows: "Windows",
  linux: "Linux",
  darwin: "macOS",
};

function detectClientPlatform(): { os: MustaLinkOS; arch: MustaLinkArch } {
  if (typeof window === "undefined") {
    return { os: "windows", arch: "amd64" };
  }
  const ua = window.navigator.userAgent.toLowerCase();
  let os: MustaLinkOS = "windows";
  if (ua.includes("mac os") || ua.includes("macintosh")) {
    os = "darwin";
  } else if (ua.includes("linux") && !ua.includes("android")) {
    os = "linux";
  }

  let arch: MustaLinkArch = "amd64";
  if (
    ua.includes("arm64") ||
    ua.includes("aarch64") ||
    (os === "darwin" && !ua.includes("intel"))
  ) {
    arch = "arm64";
  }
  return { os, arch };
}

export const MustaLinkManagerModal: React.FC<MustaLinkManagerProps> = ({
  isOpen = true,
  inline = false,
  onClose,
  onSelectAgent,
  onAgentsUpdated,
}) => {
  const { api } = useSession();

  const [agents, setAgents] = useState<MustaLinkAgent[]>([]);
  const [serverEnv, setServerEnv] = useState<string>("development");
  const [releases, setReleases] = useState<MustaLinkRelease[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Deteção de SO e Arquitetura para download direto do MustaLink Agent
  const [selectedOs, setSelectedOs] = useState<MustaLinkOS>("windows");
  const [selectedArch, setSelectedArch] = useState<MustaLinkArch>("amd64");
  const [downloading, setDownloading] = useState<boolean>(false);

  // Estado de emissão de código de emparelhamento / credencial (apenas em memória, nunca em localStorage)
  const [authMode, setAuthMode] = useState<"pairing" | "token">("pairing");
  const [newAgentId, setNewAgentId] = useState<string>("luanda-pg-01");
  const [targetDbHint, setTargetDbHint] = useState<string>("127.0.0.1:5432");
  const [expiresDays, setExpiresDays] = useState<number>(30);
  const [creatingCredential, setCreatingCredential] = useState<boolean>(false);
  const [pairingCode, setPairingCode] =
    useState<MustaLinkPairingCodeResponse | null>(null);
  const [issuedCredential, setIssuedCredential] =
    useState<MustaLinkTokenResponse | null>(null);
  const [osTab, setOsTab] = useState<"windows" | "linux" | "docker">("windows");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  useEffect(() => {
    const detected = detectClientPlatform();
    setSelectedOs(detected.os);
    setSelectedArch(detected.arch);
    setOsTab(detected.os === "windows" ? "windows" : "linux");
  }, []);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await getMustaLinkStatus(api);
      if (res.environment) {
        setServerEnv(res.environment);
      }
      const list = res.agents || [];
      setAgents(list);
      onAgentsUpdated?.(list);
      setError(null);
    } catch {
      setError("Não foi possível consultar o estado dos agentes MustaLink.");
    } finally {
      setLoading(false);
    }
  }, [api, onAgentsUpdated]);

  const fetchReleases = useCallback(async () => {
    try {
      const res = await getMustaLinkReleases(api);
      setReleases(res.releases || []);
    } catch {
      // ignore if releases metadata not loaded yet
    }
  }, [api]);

  useEffect(() => {
    if (!inline && !isOpen) return;
    fetchStatus();
    fetchReleases();

    const timer = setInterval(() => {
      if (document.visibilityState === "visible") {
        fetchStatus();
      }
    }, 8000);

    return () => clearInterval(timer);
  }, [fetchReleases, fetchStatus, inline, isOpen]);

  const totalActiveStreams = useMemo(
    () => agents.reduce((acc, item) => acc + (item.active_streams || 0), 0),
    [agents]
  );

  const selectedRelease = useMemo(
    () =>
      releases.find(
        (r) => r.os === selectedOs && r.arch === selectedArch
      ) || null,
    [releases, selectedArch, selectedOs]
  );

  const copyText = useCallback(async (key: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedKey(key);
      setTimeout(() => {
        setCopiedKey((prev) => (prev === key ? null : prev));
      }, 2000);
    } catch {
      // ignore clipboard errors
    }
  }, []);

  const minioDownloadUrl = useMemo(
    () => getMustaLinkMinioUrl(selectedOs, selectedArch, selectedRelease),
    [selectedArch, selectedOs, selectedRelease]
  );

  const handleDownloadPackage = useCallback(async () => {
    if (downloading) return;
    try {
      setDownloading(true);
      setError(null);
      await downloadMustaLinkPackage(
        api,
        selectedOs,
        selectedArch,
        selectedRelease
      );
    } catch {
      setError(
        `Não foi possível descarregar o pacote musta-link-${selectedOs}-${selectedArch}.zip.`
      );
    } finally {
      setDownloading(false);
    }
  }, [api, downloading, selectedArch, selectedOs, selectedRelease]);

  const handleCreateCredential = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (creatingCredential) return;
      try {
        setCreatingCredential(true);
        setError(null);
        if (authMode === "pairing") {
          const res = await createMustaLinkPairingCode(
            api,
            newAgentId,
            targetDbHint,
            expiresDays
          );
          setPairingCode(res);
          setIssuedCredential(null);
        } else {
          const res = await createMustaLinkToken(api, newAgentId, expiresDays);
          setIssuedCredential(res);
          setPairingCode(null);
        }
        await fetchStatus();
      } catch {
        setError("Falha ao emitir credencial para o agente.");
      } finally {
        setCreatingCredential(false);
      }
    },
    [
      api,
      authMode,
      creatingCredential,
      expiresDays,
      fetchStatus,
      newAgentId,
      targetDbHint,
    ]
  );

  const handleRevoke = useCallback(
    async (agentId: string) => {
      const ok = window.confirm(
        `Tem a certeza que deseja revogar o agente '${agentId}'? Qualquer túnel ativo será encerrado imediatamente.`
      );
      if (!ok) return;

      try {
        setRevokingId(agentId);
        await revokeMustaLinkAgent(api, agentId);
        if (issuedCredential?.agent_id === agentId) {
          setIssuedCredential(null);
        }
        if (pairingCode?.agent_id === agentId) {
          setPairingCode(null);
        }
        await fetchStatus();
      } catch {
        setError(`Não foi possível revogar o agente '${agentId}'.`);
      } finally {
        setRevokingId(null);
      }
    },
    [api, fetchStatus, issuedCredential, pairingCode]
  );

  const httpServerUrl = useMemo(() => {
    if (typeof window === "undefined") return "http://127.0.0.1:8000";
    const envUrl = process.env.NEXT_PUBLIC_API_URL;
    if (envUrl) return envUrl.replace(/\/+$/, "");
    return `${window.location.protocol}//${window.location.hostname}:8000`;
  }, []);

  const wsServerUrl = useMemo(() => {
    return httpServerUrl.replace(/^https:/i, "wss:").replace(/^http:/i, "ws:");
  }, [httpServerUrl]);

  const pairingInstallCommand = useMemo(() => {
    if (!pairingCode) return "";
    const db = pairingCode.target_db || targetDbHint.trim() || "127.0.0.1:5432";
    if (selectedOs === "windows") {
      return `.\\install.ps1 -PairCode ${pairingCode.code} -Server ${httpServerUrl} -Db ${db}`;
    }
    return `bash install.sh --pair ${pairingCode.code} --server ${httpServerUrl} --db ${db}`;
  }, [httpServerUrl, pairingCode, selectedOs, targetDbHint]);

  const installCommand = useMemo(() => {
    if (!issuedCredential) return "";
    const agId = issuedCredential.agent_id;
    const tk = issuedCredential.token;
    const db = targetDbHint.trim() || "127.0.0.1:5432";

    if (osTab === "windows") {
      return `$env:MUSTA_AGENT_TOKEN="${tk}"\n.\\musta-link-agent.exe -server ${wsServerUrl} -db ${db} -agent-id ${agId}`;
    }
    if (osTab === "linux") {
      return `MUSTA_AGENT_TOKEN="${tk}" ./musta-link-agent \\\n  -server ${wsServerUrl} \\\n  -db ${db} \\\n  -agent-id ${agId}`;
    }
    return `docker run -d --name mustalink-${agId} --network host \\\n  -e MUSTA_AGENT_TOKEN="${tk}" \\\n  mustainf/musta-link-agent:latest \\\n  -server ${wsServerUrl} -db ${db} -agent-id ${agId}`;
  }, [issuedCredential, osTab, targetDbHint, wsServerUrl]);

  if (!inline && !isOpen) return null;

  const packageFilename =
    selectedRelease?.filename ||
    `musta-link-${selectedOs}-${selectedArch}.zip`;
  const packageDescription =
    selectedOs === "windows"
      ? "Agente compilado (.exe) + instalador .ps1"
      : "Agente compilado + instalador .sh";
  const packageSizeMb = selectedRelease
    ? `${(selectedRelease.size_bytes / (1024 * 1024)).toFixed(2)} MB`
    : "Pronto para transferência";

  const content = (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-gray-100 pb-5">
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-600 shadow-sm">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl font-bold text-gray-900">MustaLink</h2>
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Ligação segura
              </span>
              {serverEnv === "development" || httpServerUrl.includes("localhost") || httpServerUrl.includes("127.0.0.1") ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold text-amber-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                  Dev Local
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-[11px] font-bold text-blue-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                  Produção
                </span>
              )}
            </div>
            <p className="mt-0.5 text-xs font-medium text-gray-500">
              Conectores de dados privados · Ligue bases de dados locais sem expor portas na Internet
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          
          <button
            type="button"
            onClick={fetchStatus}
            className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-700 transition hover:bg-gray-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Atualizar
          </button>
          {!inline && onClose && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
              aria-label="Fechar"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-4">
          <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
            Agentes ligados
          </span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-gray-900">
              {String(agents.length).padStart(2, "0")}
            </span>
            <span className="text-xs font-semibold text-emerald-600">Online</span>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-4">
          <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
            Sessões simultâneas
          </span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-gray-900">
              {String(totalActiveStreams).padStart(2, "0")}
            </span>
            <span className="text-xs font-semibold text-blue-600">Streams TCP</span>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-4">
          <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
            Capacidade / agente
          </span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-gray-900">64</span>
            <span className="text-xs font-semibold text-gray-500">Limite/agente</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-700">
          {error}
        </div>
      )}

      {/* Secção: Instalar MustaLink (Download Direto por Sistema Operativo) */}
      <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50/60 via-white to-emerald-50/40 p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Laptop className="h-4 w-4 text-blue-600" />
              <h3 className="text-sm font-bold text-gray-900">
                Instalar MustaLink
              </h3>
              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-800">
                Sem necessidade de Go ou compiladores
              </span>
            </div>
            <p className="mt-0.5 text-xs text-gray-500">
              Descarregue o executável nativo e o instalador automático para o sistema operativo da máquina onde corre a sua base de dados.
            </p>
          </div>

          {/* Seletor de Arquitetura */}
          <div className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white p-1">
            {(
              [
                { id: "amd64", label: "x64 (AMD64 / Intel)" },
                { id: "arm64", label: "ARM64 (Apple Silicon / ARM)" },
              ] as const
            ).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedArch(item.id)}
                className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-bold transition ${
                  selectedArch === item.id
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <Cpu className="h-3 w-3" />
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Botões de Sistema Operativo + Cartão do Pacote */}
        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-12">
          <div className="grid grid-cols-3 gap-2.5 lg:col-span-5">
            {(["windows", "linux", "darwin"] as const).map((osKey) => {
              const active = selectedOs === osKey;
              return (
                <button
                  key={osKey}
                  type="button"
                  onClick={() => {
                    setSelectedOs(osKey);
                    setOsTab(osKey === "windows" ? "windows" : "linux");
                  }}
                  className={`flex flex-col items-center justify-center rounded-xl border p-3 text-center transition ${
                    active
                      ? "border-blue-600 bg-blue-600 text-white shadow-sm"
                      : "border-gray-200 bg-white text-gray-700 hover:border-blue-300 hover:bg-blue-50/40"
                  }`}
                >
                  <span className="text-xs font-extrabold">
                    {OS_LABELS[osKey]}
                  </span>
                  <span
                    className={`mt-0.5 text-[10px] font-medium ${
                      active ? "text-blue-100" : "text-gray-400"
                    }`}
                  >
                    {selectedArch.toUpperCase()}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-gray-200 bg-white px-4 py-3 lg:col-span-7">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Pacote MustaLink
                </span>
                <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold text-gray-600">
                  {packageSizeMb}
                </span>
              </div>
              <p className="mt-0.5 truncate font-mono text-xs font-bold text-gray-900">
                {packageFilename}
              </p>
              <p className="text-[11px] text-gray-500">{packageDescription}</p>
              <p
                className="mt-0.5 truncate font-mono text-[10px] text-blue-600"
                title={minioDownloadUrl}
              >
                MinIO: {minioDownloadUrl}
              </p>
              {selectedRelease?.sha256 && (
                <p
                  className="mt-0.5 truncate font-mono text-[10px] text-gray-400"
                  title={`SHA-256: ${selectedRelease.sha256}`}
                >
                  SHA-256: {selectedRelease.sha256.slice(0, 24)}…
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={handleDownloadPackage}
              disabled={downloading}
              className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              {downloading
                ? "A transferir..."
                : `Descarregar para ${OS_SHORT_LABELS[selectedOs]}`}
            </button>
          </div>
        </div>
      </div>

      {/* Grelha: Lista de Agentes + Emparelhar / Emitir Novo Agente */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Coluna Esquerda: Agentes Online */}
        <div className="space-y-4 lg:col-span-7">
          <h3 className="flex items-center gap-2 text-sm font-bold text-gray-900">
            <Activity className="h-4 w-4 text-emerald-600" />
            Agentes ativos na sua conta
          </h3>

          {loading ? (
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-8 text-center text-sm text-gray-500">
              A consultar estado dos agentes MustaLink...
            </div>
          ) : agents.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/50 p-8 text-center">
              <Server className="mx-auto mb-2 h-8 w-8 text-gray-300" />
              <p className="text-sm font-bold text-gray-700">
                Nenhum agente está ligado neste momento
              </p>
              <p className="mt-1 text-xs text-gray-500">
                1. Descarregue o pacote acima · 2. Gere um código de emparelhamento ao lado · 3. Execute o instalador.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {agents.map((agent) => (
                <div
                  key={agent.agent_id}
                  className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:border-blue-300"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-bold text-gray-900">
                          {agent.agent_id}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-700">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          Online
                        </span>
                        {agent.platform && (
                          <span className="rounded-md bg-gray-100 px-2 py-0.5 font-mono text-[10px] font-semibold text-gray-600">
                            {agent.platform}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs font-medium text-gray-500">
                        Destino local:{" "}
                        <code className="font-mono text-gray-700">
                          {agent.target_db}
                        </code>{" "}
                        · Sessões ativas: <strong>{agent.active_streams}</strong>{" "}
                        (Total: {agent.total_connections_handled})
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {onSelectAgent && (
                        <button
                          type="button"
                          onClick={() => {
                            onSelectAgent(agent.agent_id, agent.virtual_host);
                            onClose?.();
                          }}
                          className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-blue-700"
                        >
                          Usar conexão
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={revokingId === agent.agent_id}
                        onClick={() => handleRevoke(agent.agent_id)}
                        className="rounded-lg border border-red-200 bg-red-50 p-1.5 text-red-600 transition hover:bg-red-100 disabled:opacity-50"
                        title="Revogar credencial e desligar agente"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Host virtual */}
                  <div className="mt-3 flex items-center justify-between gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                    <div className="min-w-0">
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">
                        Host virtual
                      </span>
                      <code className="truncate font-mono text-xs font-bold text-blue-700">
                        {agent.virtual_host}
                      </code>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        copyText(`vh_${agent.agent_id}`, agent.virtual_host)
                      }
                      className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2.5 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-100"
                    >
                      {copiedKey === `vh_${agent.agent_id}` ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-600" />
                          Copiado
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          Copiar
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Coluna Direita: Emparelhamento Rápido (XXXX-XXXX) / Credencial */}
        <div className="space-y-4 rounded-xl border border-gray-200 bg-gray-50/60 p-5 lg:col-span-5">
          <div className="flex items-center justify-between gap-2">
            <h3 className="flex items-center gap-2 text-sm font-bold text-gray-900">
              <KeyRound className="h-4 w-4 text-blue-600" />
              Associar Novo Agente
            </h3>

            <div className="flex rounded-lg bg-gray-200/80 p-0.5 text-[11px] font-bold">
              <button
                type="button"
                onClick={() => setAuthMode("pairing")}
                className={`rounded-md px-2.5 py-1 transition ${
                  authMode === "pairing"
                    ? "bg-white text-gray-900 shadow-xs"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Código Rápido
              </button>
              <button
                type="button"
                onClick={() => setAuthMode("token")}
                className={`rounded-md px-2.5 py-1 transition ${
                  authMode === "token"
                    ? "bg-white text-gray-900 shadow-xs"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Token CLI/Docker
              </button>
            </div>
          </div>

          <form onSubmit={handleCreateCredential} className="space-y-3">
            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase text-gray-700">
                Identificador do Agente
              </label>
              <input
                type="text"
                value={newAgentId}
                onChange={(e) => setNewAgentId(e.target.value)}
                placeholder="Ex: luanda-pg-01"
                required
                className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-[11px] font-bold uppercase text-gray-700">
                  BD Local (Host:Porta)
                </label>
                <input
                  type="text"
                  value={targetDbHint}
                  onChange={(e) => setTargetDbHint(e.target.value)}
                  placeholder="127.0.0.1:5432"
                  className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-sm font-mono text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-bold uppercase text-gray-700">
                  Validade (dias)
                </label>
                <input
                  type="number"
                  min={1}
                  max={365}
                  value={expiresDays}
                  onChange={(e) => setExpiresDays(Number(e.target.value) || 30)}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={creatingCredential || !newAgentId.trim()}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              {creatingCredential
                ? "A gerar..."
                : authMode === "pairing"
                ? "Gerar Código de Emparelhamento (XXXX-XXXX)"
                : "Gerar Token JWT de Agente"}
            </button>
          </form>

          {/* Resultado: Código de Emparelhamento de Uso Único (XXXX-XXXX) */}
          {pairingCode && (
            <div className="mt-4 space-y-3 rounded-xl border border-emerald-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-900">
                  Código para <code>{pairingCode.agent_id}</code>
                </span>
                <span className="rounded bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                  Válido por 10 min · Uso único
                </span>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50/70 px-4 py-3">
                <span className="font-mono text-2xl font-extrabold tracking-widest text-emerald-800">
                  {pairingCode.code}
                </span>
                <button
                  type="button"
                  onClick={() => copyText("pair_code", pairingCode.code)}
                  className="inline-flex items-center gap-1 rounded-lg border border-emerald-300 bg-white px-3 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100"
                >
                  {copiedKey === "pair_code" ? (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      Copiado
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      Copiar código
                    </>
                  )}
                </button>
              </div>

              <p className="text-[11px] text-gray-600">
                Extraia o pacote descarregado e execute o instalador (ou cole o código quando solicitado):
              </p>

              <div className="relative">
                <pre className="overflow-x-auto rounded-lg bg-gray-900 p-3 font-mono text-[11px] leading-relaxed text-emerald-300">
                  {pairingInstallCommand}
                </pre>
                <button
                  type="button"
                  onClick={() => copyText("pair_cmd", pairingInstallCommand)}
                  className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-md bg-gray-800 px-2 py-1 text-[10px] font-bold text-gray-200 hover:bg-gray-700"
                >
                  {copiedKey === "pair_cmd" ? (
                    <>
                      <Check className="h-3 w-3 text-emerald-400" />
                      Copiado
                    </>
                  ) : (
                    <>
                      <Terminal className="h-3 w-3" />
                      Copiar
                    </>
                  )}
                </button>
              </div>

              {onSelectAgent && (
                <button
                  type="button"
                  onClick={() => {
                    onSelectAgent(
                      pairingCode.agent_id,
                      pairingCode.virtual_host
                    );
                    onClose?.();
                  }}
                  className="w-full rounded-lg border border-blue-200 bg-blue-50 py-2 text-xs font-bold text-blue-700 transition hover:bg-blue-100"
                >
                  Preencher {pairingCode.virtual_host} no formulário
                </button>
              )}
            </div>
          )}

          {/* Resultado Alternativo: Token JWT Avançado */}
          {issuedCredential && (
            <div className="mt-4 space-y-3 rounded-xl border border-blue-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-900">
                  Credencial emitida para <code>{issuedCredential.agent_id}</code>
                </span>
                <span className="rounded bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                  Exibida apenas uma vez
                </span>
              </div>

              <div className="flex items-center gap-1 rounded-lg bg-gray-100 p-1">
                {(["windows", "linux", "docker"] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setOsTab(tab)}
                    className={`flex-1 rounded-md py-1 text-[11px] font-bold capitalize transition ${
                      osTab === tab
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div className="relative">
                <pre className="overflow-x-auto rounded-lg bg-gray-900 p-3 text-[11px] leading-relaxed text-emerald-300 font-mono">
                  {installCommand}
                </pre>
                <button
                  type="button"
                  onClick={() => copyText("cmd", installCommand)}
                  className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-md bg-gray-800 px-2 py-1 text-[10px] font-bold text-gray-200 hover:bg-gray-700"
                >
                  {copiedKey === "cmd" ? (
                    <>
                      <Check className="h-3 w-3 text-emerald-400" />
                      Copiado
                    </>
                  ) : (
                    <>
                      <Terminal className="h-3 w-3" />
                      Copiar comando
                    </>
                  )}
                </button>
              </div>

              {onSelectAgent && (
                <button
                  type="button"
                  onClick={() => {
                    onSelectAgent(
                      issuedCredential.agent_id,
                      issuedCredential.virtual_host
                    );
                    onClose?.();
                  }}
                  className="w-full rounded-lg border border-blue-200 bg-blue-50 py-2 text-xs font-bold text-blue-700 transition hover:bg-blue-100"
                >
                  Preencher {issuedCredential.virtual_host} no formulário
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (inline) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        {content}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl">
        {content}
      </div>
    </div>
  );
};

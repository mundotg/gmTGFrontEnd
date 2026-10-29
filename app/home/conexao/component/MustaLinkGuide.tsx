"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  BookOpen,
  Check,
  CheckCircle2,
  Copy,
  Cpu,
  Database,
  Download,
  HelpCircle,
  KeyRound,
  Laptop,
  Lock,
  Play,
  RefreshCw,
  Server,
  ShieldCheck,
  Sparkles,
  Terminal,
  Wifi,
} from "lucide-react";
import { useSession } from "@/context/SessionContext";
import {
  createMustaLinkPairingCode,
  downloadMustaLinkPackage,
  getMustaLinkMinioUrl,
  getMustaLinkReleases,
  MustaLinkArch,
  MustaLinkOS,
  MustaLinkPairingCodeResponse,
  MustaLinkRelease,
} from "@/service/mustalink";

interface MustaLinkGuideProps {
  onOpenManager?: () => void;
}

const OS_META: Record<
  MustaLinkOS,
  { title: string; subtitle: string; badge: string }
> = {
  windows: {
    title: "Windows 10 / 11 / Server",
    subtitle: "Executável .exe + Instalador PowerShell (.ps1)",
    badge: "Windows",
  },
  linux: {
    title: "Linux (Ubuntu, Debian, RHEL)",
    subtitle: "Binário estático ELF + Instalador Bash (.sh)",
    badge: "Linux",
  },
  darwin: {
    title: "macOS (Intel & Apple Silicon)",
    subtitle: "Binário Mach-O + Instalador Bash (.sh)",
    badge: "macOS",
  },
};

export const MustaLinkGuide: React.FC<MustaLinkGuideProps> = ({
  onOpenManager,
}) => {
  const { api } = useSession();

  const [selectedOs, setSelectedOs] = useState<MustaLinkOS>("windows");
  const [selectedArch, setSelectedArch] = useState<MustaLinkArch>("amd64");
  const [prodTab, setProdTab] = useState<
    "windows" | "linux" | "docker" | "nginx"
  >("windows");

  const [releases, setReleases] = useState<MustaLinkRelease[]>([]);
  const [downloading, setDownloading] = useState<boolean>(false);

  const [agentIdInput, setAgentIdInput] = useState<string>("luanda-pg-01");
  const [targetDbInput, setTargetDbInput] = useState<string>("127.0.0.1:5432");
  const [generatingCode, setGeneratingCode] = useState<boolean>(false);
  const [pairingResult, setPairingResult] =
    useState<MustaLinkPairingCodeResponse | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const ua = window.navigator.userAgent.toLowerCase();
    if (ua.includes("mac os") || ua.includes("macintosh")) {
      setSelectedOs("darwin");
      setProdTab("linux");
    } else if (ua.includes("linux") && !ua.includes("android")) {
      setSelectedOs("linux");
      setProdTab("linux");
    } else {
      setSelectedOs("windows");
      setProdTab("windows");
    }

    if (
      ua.includes("arm64") ||
      ua.includes("aarch64") ||
      (ua.includes("mac") && !ua.includes("intel"))
    ) {
      setSelectedArch("arm64");
    }
  }, []);

  useEffect(() => {
    getMustaLinkReleases(api)
      .then((res) => setReleases(res.releases || []))
      .catch(() => {
        // ignora caso ainda não carregado
      });
  }, [api]);

  const activeRelease = releases.find(
    (r) => r.os === selectedOs && r.arch === selectedArch
  );

  const httpServerUrl =
    typeof window !== "undefined"
      ? (
          process.env.NEXT_PUBLIC_API_URL ||
          `${window.location.protocol}//${window.location.hostname}:8000`
        ).replace(/\/+$/, "")
      : "https://api.mustainfo.cloud";

  const wsServerUrl = httpServerUrl
    .replace(/^https:/i, "wss:")
    .replace(/^http:/i, "ws:");

  const copyToClipboard = useCallback(async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => {
        setCopiedId((prev) => (prev === id ? null : prev));
      }, 2000);
    } catch {
      // ignore
    }
  }, []);

  const minioDownloadUrl = getMustaLinkMinioUrl(
    selectedOs,
    selectedArch,
    activeRelease
  );

  const handleDownload = useCallback(async () => {
    if (downloading) return;
    try {
      setDownloading(true);
      await downloadMustaLinkPackage(
        api,
        selectedOs,
        selectedArch,
        activeRelease
      );
    } finally {
      setDownloading(false);
    }
  }, [activeRelease, api, downloading, selectedArch, selectedOs]);

  const handleGeneratePairing = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (generatingCode) return;
      try {
        setGeneratingCode(true);
        const res = await createMustaLinkPairingCode(
          api,
          agentIdInput,
          targetDbInput,
          30
        );
        setPairingResult(res);
      } finally {
        setGeneratingCode(false);
      }
    },
    [agentIdInput, api, generatingCode, targetDbInput]
  );

  const activeCode = pairingResult?.code || "ABCD-1234";
  const activeAgent = pairingResult?.agent_id || agentIdInput || "luanda-pg-01";
  const activeDb = pairingResult?.target_db || targetDbInput || "127.0.0.1:5432";

  const step3Command =
    selectedOs === "windows"
      ? `# 1. Transfira do MinIO (ou extraia o .zip descarregado no Passo 01):\nInvoke-WebRequest -Uri "${minioDownloadUrl}" -OutFile "musta-link-windows-${selectedArch}.zip"\nExpand-Archive -Path "musta-link-windows-${selectedArch}.zip" -DestinationPath ".\\musta-link" -Force\nSet-Location ".\\musta-link"\n\n# 2. Execute o instalador automático com o código de emparelhamento:\n.\\install.ps1 -PairCode ${activeCode} -Server ${httpServerUrl} -Db ${activeDb} -AgentId ${activeAgent}`
      : `# 1. Transfira do MinIO (ou extraia o pacote descarregado no Passo 01):\ncurl -fLO "${minioDownloadUrl}"\nunzip -o musta-link-${selectedOs}-${selectedArch}.zip -d musta-link && cd musta-link\n\n# 2. Execute o instalador automático:\nbash install.sh --pair ${activeCode} --server ${httpServerUrl} --db ${activeDb} --agent-id ${activeAgent}`;

  const prodCommand = (() => {
    if (prodTab === "windows") {
      return `# Execute no PowerShell (como Administrador) para iniciar automaticamente com o Windows Server:\npowershell -ExecutionPolicy Bypass -File .\\deploy\\install-windows-service.ps1 \`\n  -AgentId "${activeAgent}" \`\n  -ServerUrl "${wsServerUrl}" \`\n  -DbHost "${activeDb}"`;
    }
    if (prodTab === "linux") {
      return `# 1. Copie o binário para /usr/local/bin\nsudo cp ~/.local/bin/musta-link-agent /usr/local/bin/musta-link-agent\nsudo chmod +x /usr/local/bin/musta-link-agent\n\n# 2. Registe e inicie o serviço systemd (arranque automático 24/7)\nsudo cp deploy/musta-link.service /etc/systemd/system/musta-link.service\nsudo systemctl daemon-reload\nsudo systemctl enable --now musta-link.service\n\n# 3. Consulte os logs do túnel em tempo real\nsudo journalctl -u musta-link.service -f`;
    }
    if (prodTab === "docker") {
      return `# Subir em produção com Docker Compose (reinício automático + credencial persistente):\nMUSTA_SERVER_URL=${wsServerUrl} \\\nMUSTA_DB_HOST=${activeDb} \\\nMUSTA_AGENT_ID=${activeAgent} \\\nMUSTA_PAIR_CODE=${activeCode} \\\ndocker compose up -d --build`;
    }
    return `# Bloco Nginx no Servidor MustaInf Cloud para suportar WebSocket (wss://):\nlocation /conn/agent-tunnel {\n    proxy_pass http://127.0.0.1:8000;\n    proxy_http_version 1.1;\n    proxy_set_header Upgrade $http_upgrade;\n    proxy_set_header Connection "upgrade";\n    proxy_set_header Host $host;\n    proxy_read_timeout 3600s;\n    proxy_send_timeout 3600s;\n    proxy_buffering off;\n}`;
  })();

  return (
    <div className="font-interface space-y-6 text-gray-900">
      {/* Banner Principal */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-600 shadow-sm">
              <BookOpen className="h-6 w-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                  Guia de Instalação e Produção — MustaLink Agent
                </h1>
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Túnel Reverso Seguro
                </span>
              </div>
              <p className="mt-1 text-sm font-medium text-gray-500">
                Ligue bases de dados privadas (PostgreSQL, MySQL, SQL Server, Oracle) ao MustaInf Cloud em 5 passos, sem abrir portas no router e sem configurar VPN.
              </p>
            </div>
          </div>

          {onOpenManager && (
            <button
              type="button"
              onClick={onOpenManager}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-blue-700"
            >
              <Server className="h-4 w-4" />
              Abrir Gestor de Agentes
            </button>
          )}
        </div>

        {/* Esquema Visual da Arquitetura */}
        <div className="mt-6 grid grid-cols-1 gap-3 rounded-xl border border-gray-100 bg-gray-50/80 p-4 sm:grid-cols-3">
          <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3.5 shadow-2xs">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <Database className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">
                1. Rede Interna do Cliente
              </span>
              <p className="truncate text-xs font-bold text-gray-900">
                Base de Dados Privada
              </p>
              <code className="font-technical text-[11px] text-gray-500">
                127.0.0.1:5432 (Sem porta pública)
              </code>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50/50 p-3.5 shadow-2xs">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white">
              <Lock className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                2. Túnel de Saída Multiplexado
              </span>
              <p className="truncate text-xs font-bold text-gray-900">
                MustaLink Agent (WSS / TLS 1.2+)
              </p>
              <code className="font-technical text-[11px] text-emerald-700">
                Até 64 sessões simultâneas
              </code>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3.5 shadow-2xs">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">
                3. MustaInf Cloud
              </span>
              <p className="truncate text-xs font-bold text-gray-900">
                Consultas SQL, IA & Relatórios
              </p>
              <code className="font-technical text-[11px] text-indigo-600">
                agent://{activeAgent}
              </code>
            </div>
          </div>
        </div>
      </div>

      {/* PASSO 1 & PASSO 2 lado a lado */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* PASSO 1 */}
        <div className="flex flex-col justify-between rounded-2xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-7">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-xs font-extrabold text-white">
                  01
                </span>
                <h2 className="text-base font-bold text-gray-900">
                  Descarregar o Agente para o seu Sistema Operativo
                </h2>
              </div>

              <div className="flex items-center gap-1 rounded-xl border border-gray-200 bg-gray-50 p-1">
                {(
                  [
                    { id: "amd64", label: "x64 (AMD64 / Intel)" },
                    { id: "arm64", label: "ARM64 (Apple M / ARM)" },
                  ] as const
                ).map((arch) => (
                  <button
                    key={arch.id}
                    type="button"
                    onClick={() => setSelectedArch(arch.id)}
                    className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-bold transition ${
                      selectedArch === arch.id
                        ? "bg-white text-blue-700 shadow-2xs"
                        : "text-gray-500 hover:text-gray-800"
                    }`}
                  >
                    <Cpu className="h-3 w-3" />
                    {arch.label}
                  </button>
                ))}
              </div>
            </div>

            <p className="text-xs font-medium leading-relaxed text-gray-500">
              Escolha o sistema operativo da máquina ou servidor que tem acesso à base de dados local. Não é necessário instalar Go nem qualquer compilador.
            </p>

            {/* Cartões de Seleção de SO */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {(["windows", "linux", "darwin"] as const).map((osKey) => {
                const isSelected = selectedOs === osKey;
                const info = OS_META[osKey];
                return (
                  <button
                    key={osKey}
                    type="button"
                    onClick={() => setSelectedOs(osKey)}
                    className={`flex flex-col items-start rounded-xl border p-3.5 text-left transition ${
                      isSelected
                        ? "border-blue-600 bg-blue-50/50 ring-2 ring-blue-500/20"
                        : "border-gray-200 bg-white hover:border-blue-300"
                    }`}
                  >
                    <div className="flex w-full items-center justify-between">
                      <Laptop
                        className={`h-4 w-4 ${
                          isSelected ? "text-blue-600" : "text-gray-400"
                        }`}
                      />
                      <span
                        className={`font-technical rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                          isSelected
                            ? "bg-blue-600 text-white"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {selectedArch}
                      </span>
                    </div>
                    <span className="mt-2 text-xs font-bold text-gray-900">
                      {info.title}
                    </span>
                    <span className="mt-0.5 text-[11px] text-gray-500">
                      {info.subtitle}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Barra de Download do Pacote */}
          <div className="mt-5 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
            <div className="min-w-0">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">
                Pacote Selecionado
              </span>
              <code className="font-technical text-xs font-bold text-gray-900">
                {activeRelease?.filename ||
                  `musta-link-${selectedOs}-${selectedArch}.zip`}
              </code>
              <p
                className="font-technical mt-0.5 truncate text-[10px] text-blue-600"
                title={minioDownloadUrl}
              >
                MinIO: {minioDownloadUrl}
              </p>
              {activeRelease && (
                <p className="font-technical mt-0.5 truncate text-[10px] text-gray-500">
                  {(activeRelease.size_bytes / (1024 * 1024)).toFixed(2)} MB · SHA-256:{" "}
                  {activeRelease.sha256.slice(0, 20)}…
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={handleDownload}
              disabled={downloading}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              {downloading
                ? "A transferir pacote..."
                : `Descarregar para ${OS_META[selectedOs].badge}`}
            </button>
          </div>
        </div>

        {/* PASSO 2 */}
        <div className="flex flex-col justify-between rounded-2xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-5">
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-xs font-extrabold text-white">
                02
              </span>
              <h2 className="text-base font-bold text-gray-900">
                Gerar Código de Emparelhamento Único
              </h2>
            </div>

            <p className="text-xs font-medium leading-relaxed text-gray-500">
              Defina um nome para identificar o seu agente (ex.:{" "}
              <code className="font-technical text-gray-700">luanda-pg-01</code>) e a porta local da base de dados. O código gerado expira em 10 minutos e só pode ser usado uma vez.
            </p>

            <form onSubmit={handleGeneratePairing} className="space-y-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-gray-600">
                    ID do Agente
                  </label>
                  <input
                    type="text"
                    value={agentIdInput}
                    onChange={(e) => setAgentIdInput(e.target.value)}
                    placeholder="luanda-pg-01"
                    required
                    className="font-technical w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-bold text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-gray-600">
                    BD Local (Host:Porta)
                  </label>
                  <input
                    type="text"
                    value={targetDbInput}
                    onChange={(e) => setTargetDbInput(e.target.value)}
                    placeholder="127.0.0.1:5432"
                    required
                    className="font-technical w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-bold text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={generatingCode || !agentIdInput.trim()}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50"
              >
                <KeyRound className="h-4 w-4" />
                {generatingCode
                  ? "A gerar código..."
                  : "Gerar Código Rápido (XXXX-XXXX)"}
              </button>
            </form>
          </div>

          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50/60 p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                {pairingResult
                  ? "Código Ativo (Uso Único · 10 min)"
                  : "Exemplo de Código de Emparelhamento"}
              </span>
              <button
                type="button"
                onClick={() => copyToClipboard("pair_code", activeCode)}
                className="inline-flex items-center gap-1 rounded-md border border-emerald-300 bg-white px-2 py-0.5 text-[11px] font-bold text-emerald-700 hover:bg-emerald-100"
              >
                {copiedId === "pair_code" ? (
                  <>
                    <Check className="h-3 w-3" />
                    Copiado
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" />
                    Copiar
                  </>
                )}
              </button>
            </div>
            <div className="font-technical mt-1 text-xl font-extrabold tracking-widest text-emerald-900">
              {activeCode}
            </div>
          </div>
        </div>
      </div>

      {/* PASSO 3 & PASSO 4 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* PASSO 3 */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-7">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-xs font-extrabold text-white">
                03
              </span>
              <h2 className="text-base font-bold text-gray-900">
                Executar o Instalador na Máquina da Base de Dados
              </h2>
            </div>
            <span className="rounded-lg bg-gray-100 px-2.5 py-1 text-[11px] font-bold text-gray-700">
              {OS_META[selectedOs].badge} ({selectedArch})
            </span>
          </div>

          <p className="mt-2 text-xs font-medium leading-relaxed text-gray-500">
            Extraia o ficheiro <code>.zip</code> descarregado no Passo 01 e execute o comando abaixo. O instalador troca o código{" "}
            <code className="font-technical font-bold text-emerald-700">
              {activeCode}
            </code>{" "}
            por uma credencial criptográfica que fica guardada localmente com permissões restritas (<code>0600</code>).
          </p>

          <div className="relative mt-4">
            <pre className="font-technical overflow-x-auto rounded-xl bg-gray-900 p-4 text-xs leading-relaxed text-emerald-300">
              {step3Command}
            </pre>
            <button
              type="button"
              onClick={() => copyToClipboard("step3_cmd", step3Command)}
              className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-lg bg-gray-800 px-2.5 py-1.5 text-[11px] font-bold text-gray-200 transition hover:bg-gray-700"
            >
              {copiedId === "step3_cmd" ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                  Copiado
                </>
              ) : (
                <>
                  <Terminal className="h-3.5 w-3.5" />
                  Copiar comando
                </>
              )}
            </button>
          </div>

          <div className="mt-4 flex items-center gap-2 rounded-xl border border-gray-100 bg-gray-50 px-3.5 py-2.5 text-xs text-gray-600">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>
              Assim que aparecer{" "}
              <code className="font-technical font-bold text-gray-800">
                ✅ Túnel autenticado e ativo!
              </code>
              , o agente surge imediatamente como <strong>Online</strong> no MustaInf.
            </span>
          </div>
        </div>

        {/* PASSO 4 */}
        <div className="flex flex-col justify-between rounded-2xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-5">
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-xs font-extrabold text-white">
                04
              </span>
              <h2 className="text-base font-bold text-gray-900">
                Criar a Conexão no MustaInf
              </h2>
            </div>

            <p className="text-xs font-medium leading-relaxed text-gray-500">
              Na página de <strong>Conexões de Base de Dados</strong>, siga esta sequência no formulário:
            </p>

            <ol className="space-y-2.5 text-xs font-medium text-gray-700">
              <li className="flex items-start gap-2.5 rounded-xl border border-gray-100 bg-gray-50 p-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[11px] font-bold text-blue-700">
                  1
                </span>
                <span>
                  Escolha o motor da base de dados (ex.: <strong>PostgreSQL</strong>, <strong>MySQL</strong>, <strong>SQL Server</strong> ou <strong>Oracle</strong>).
                </span>
              </li>
              <li className="flex items-start gap-2.5 rounded-xl border border-gray-100 bg-gray-50 p-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[11px] font-bold text-emerald-700">
                  2
                </span>
                <span>
                  Em <strong>Modo de conectividade</strong>, selecione{" "}
                  <strong className="text-emerald-800">
                    Ligação privada — MustaLink Agent
                  </strong>
                  .
                </span>
              </li>
              <li className="flex items-start gap-2.5 rounded-xl border border-gray-100 bg-gray-50 p-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[11px] font-bold text-blue-700">
                  3
                </span>
                <div>
                  <span>
                    Selecione o agente online. O host virtual será preenchido automaticamente como:
                  </span>
                  <div className="mt-1">
                    <code className="font-technical rounded bg-white px-2 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-200">
                      agent://{activeAgent}
                    </code>
                  </div>
                </div>
              </li>
              <li className="flex items-start gap-2.5 rounded-xl border border-gray-100 bg-gray-50 p-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[11px] font-bold text-blue-700">
                  4
                </span>
                <span>
                  Introduza o nome da base de dados, utilizador e palavra-passe locais e clique em <strong>Testar</strong> → <strong>Conectar</strong>.
                </span>
              </li>
            </ol>
          </div>
        </div>
      </div>

      {/* PASSO 5: Subir em Produção 24/7 */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 pb-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600 text-xs font-extrabold text-white">
              05
            </span>
            <div>
              <h2 className="text-base font-bold text-gray-900">
                Subir em Produção 24/7 (Serviço Automático em Background)
              </h2>
              <p className="text-xs font-medium text-gray-500">
                Configure o agente para iniciar sozinho no arranque do servidor sem precisar de sessão ou janela aberta.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-gray-200 bg-gray-50 p-1">
            {(
              [
                { id: "windows", label: "Windows Server (Task)" },
                { id: "linux", label: "Linux (systemd)" },
                { id: "docker", label: "Docker Compose" },
                { id: "nginx", label: "Cloud Nginx (WSS)" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setProdTab(tab.id)}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                  prodTab === tab.id
                    ? "bg-white text-blue-700 shadow-2xs"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="relative mt-4">
          <pre className="font-technical overflow-x-auto rounded-xl bg-gray-900 p-4 text-xs leading-relaxed text-emerald-300">
            {prodCommand}
          </pre>
          <button
            type="button"
            onClick={() => copyToClipboard("prod_cmd", prodCommand)}
            className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-lg bg-gray-800 px-2.5 py-1.5 text-[11px] font-bold text-gray-200 transition hover:bg-gray-700"
          >
            {copiedId === "prod_cmd" ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                Copiado
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                Copiar configuração
              </>
            )}
          </button>
        </div>
      </div>

      {/* Perguntas Frequentes e Garantias de Segurança */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-bold text-gray-900">
            <Wifi className="h-4 w-4 text-emerald-600" />
            Preciso de abrir portas no router?
          </div>
          <p className="mt-2 text-xs leading-relaxed text-gray-500">
            <strong>Não.</strong> O agente inicia uma ligação de saída HTTPS/WSS (porta 443) de dentro da sua rede para o MustaInf Cloud. Nenhuma porta de entrada precisa de ser exposta na Internet.
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-bold text-gray-900">
            <RefreshCw className="h-4 w-4 text-blue-600" />
            E se a ligação à Internet falhar?
          </div>
          <p className="mt-2 text-xs leading-relaxed text-gray-500">
            O agente deteta falhas através de <em>heartbeats</em> (Ping/Pong a cada 20s) e reconecta automaticamente com <em>backoff</em> exponencial (2s até 30s) assim que a rede estabilizar.
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-bold text-gray-900">
            <HelpCircle className="h-4 w-4 text-indigo-600" />
            Isolamento e Revogação Imediata
          </div>
          <p className="mt-2 text-xs leading-relaxed text-gray-500">
            Cada túnel é estritamente isolado à sua conta. Se clicar no botão de revogar agente no painel, a credencial é bloqueada e o túnel é desligado no mesmo instante.
          </p>
        </div>
      </div>
    </div>
  );
};


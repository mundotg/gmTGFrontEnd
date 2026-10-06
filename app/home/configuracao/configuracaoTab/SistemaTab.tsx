import React, { useState } from "react";
import {
  Shield,
  Activity,
  Server,
  Download,
  AlertTriangle,
  Terminal,
  Cpu,
  HardDrive,
  MemoryStick,
  Clock,
  Database,
  Trash2,
  Loader2,
  RefreshCw,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "@/context/SessionContext";
import { CacheGestaoPanel } from "./CacheGestaoPanel";
import {
  DefinicaoSistema,
  Recurso,
  formatarBytes,
  formatarUptime,
  useSystemStatus,
} from "@/hook/useSystemStatus";

/* =======================
   COMPONENTES UI REUTILIZÁVEIS
======================= */

const Switch = ({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
}) => (
  <button
    onClick={onChange}
    disabled={disabled}
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
      checked ? "bg-blue-600" : "bg-gray-200"
    } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
  >
    <span
      className={`${
        checked ? "translate-x-6" : "translate-x-1"
      } inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200`}
    />
  </button>
);

const StatusCard = ({
  label,
  value,
  icon: Icon,
  color,
  subtext,
  percent,
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ size?: number }>;
  color: string;
  subtext?: string;
  /** Quando presente, desenha a barra e fica âmbar/vermelha em carga alta. */
  percent?: number | null;
}) => {
  const barra =
    percent === null || percent === undefined
      ? null
      : percent >= 90
      ? "bg-red-500"
      : percent >= 75
      ? "bg-amber-500"
      : "bg-green-500";

  return (
    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
            {label}
          </p>
          <h4 className="text-2xl font-bold text-gray-900 mt-1">{value}</h4>
          {subtext && <p className="text-xs text-gray-400 mt-1 truncate">{subtext}</p>}
        </div>
        <span
          className={`p-2 rounded-lg ${color} bg-opacity-10 flex items-center justify-center shrink-0`}
        >
          <Icon size={20} />
        </span>
      </div>
      {barra && (
        <div className="w-full bg-gray-100 rounded-full h-1.5 mt-3">
          <div
            className={`${barra} h-1.5 rounded-full transition-all`}
            style={{ width: `${Math.min(100, Math.max(0, percent as number))}%` }}
          />
        </div>
      )}
    </div>
  );
};

const InfoRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="flex justify-between items-center gap-3 text-sm border-b border-gray-50 last:border-0 pb-2 last:pb-0">
    <span className="text-gray-500 shrink-0">{label}</span>
    <span className="font-medium text-gray-900 bg-gray-50 px-2 py-0.5 rounded text-xs truncate max-w-[60%] text-right">
      {value}
    </span>
  </div>
);

const percentualOuTraco = (r: Recurso | undefined) =>
  r?.percent === null || r?.percent === undefined ? "—" : `${Math.round(r.percent)}%`;

/* =======================
   COMPONENTE PRINCIPAL
======================= */
export const SistemaTab = () => {
  const { user } = useSession();
  const router = useRouter();
  const permissions = user?.permissions ?? [];

  const can = (p: string) => permissions.includes(p) || permissions.includes("admin:*");

  const {
    estado,
    definicoes,
    logs,
    loading,
    erro,
    aGuardar,
    carregar,
    alterarDefinicao,
    limparTodoOCache,
    exportarLogs,
  } = useSystemStatus();

  const [mensagemCache, setMensagemCache] = useState<string | null>(null);
  const [aLimpar, setALimpar] = useState(false);

  const aoLimparTudo = async () => {
    setALimpar(true);
    const resultado = await limparTodoOCache();
    setALimpar(false);
    if (resultado) {
      setMensagemCache(
        `${resultado.mensagem} (${resultado.removidos_redis} no Redis, ${resultado.removidos_memoria} em memória)`
      );
      setTimeout(() => setMensagemCache(null), 5000);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Server className="text-blue-600" size={24} />
            Monitoramento &amp; Sistema
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Gerencie o comportamento global da aplicação e infraestrutura.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* O estado vem do backend: verde só quando a base de dados responde. */}
          {loading && !estado ? (
            <span className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-full text-sm text-gray-500">
              <Loader2 size={14} className="animate-spin" /> A verificar…
            </span>
          ) : estado?.saudavel ? (
            <span className="flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-full">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
              </span>
              <span className="text-sm font-medium text-green-700">
                Serviços operacionais
              </span>
            </span>
          ) : (
            <span className="flex items-center gap-2 px-3 py-1.5 bg-red-50 border border-red-200 rounded-full text-sm font-medium text-red-700">
              <XCircle size={14} /> Serviço degradado
            </span>
          )}

          <button
            onClick={() => carregar()}
            disabled={loading}
            title="Atualizar"
            className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {erro && (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <span>{erro}</span>
        </div>
      )}

      {estado?.codigo_desatualizado && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <span>
            Há ficheiros mais recentes do que o arranque deste processo. O código em
            execução não é o que está no disco — reinicie o serviço.
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* COLUNA ESQUERDA */}
        <div className="lg:col-span-2 space-y-6">
          {/* Métricas reais */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <StatusCard
              label="Uptime"
              value={estado ? formatarUptime(estado.uptime_segundos) : "—"}
              subtext={
                estado
                  ? `Desde ${new Date(estado.arrancou_em).toLocaleString("pt-PT")}`
                  : undefined
              }
              icon={Clock}
              color="text-green-600 bg-green-50"
            />
            <StatusCard
              label="CPU"
              value={percentualOuTraco(estado?.cpu)}
              subtext={estado?.cpu.detalhe ?? undefined}
              percent={estado?.cpu.percent}
              icon={Cpu}
              color="text-blue-600 bg-blue-50"
            />
            <StatusCard
              label="Memória"
              value={percentualOuTraco(estado?.memoria)}
              subtext={
                estado
                  ? `${formatarBytes(estado.memoria.usado)} de ${formatarBytes(
                      estado.memoria.total
                    )}`
                  : undefined
              }
              percent={estado?.memoria.percent}
              icon={MemoryStick}
              color="text-amber-600 bg-amber-50"
            />
            <StatusCard
              label="Disco"
              value={percentualOuTraco(estado?.disco)}
              subtext={
                estado
                  ? `${formatarBytes(
                      (estado.disco.total ?? 0) - (estado.disco.usado ?? 0)
                    )} livres`
                  : undefined
              }
              percent={estado?.disco.percent}
              icon={HardDrive}
              color="text-purple-600 bg-purple-50"
            />
          </div>

          {/* Controles do sistema — catálogo vindo do backend */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b bg-gray-50">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Activity size={18} /> Controles do Sistema
              </h3>
            </div>

            {definicoes.length === 0 ? (
              <div className="p-8 text-center text-sm text-gray-400">
                {loading ? "A carregar definições…" : "Nenhuma definição disponível."}
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {definicoes
                  .filter((d) => can(d.permissao))
                  .map((d) => (
                    <ControloSistema
                      key={d.key}
                      definicao={d}
                      aGuardar={aGuardar === d.key}
                      podeAlterar={can("settings:system")}
                      onChange={(valor) => alterarDefinicao(d.key, valor)}
                    />
                  ))}
              </div>
            )}
          </div>

          {/* Painel Unificado de Gestão de Cache & Dados Locais */}
          {can("settings:system") && <CacheGestaoPanel />}

          {/* Log real do processo */}
          {can("logs:view") && (
            <div className="bg-slate-900 rounded-xl overflow-hidden shadow-lg border border-slate-800">
              <div className="flex items-center justify-between px-4 py-2 bg-slate-800 border-b border-slate-700">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Terminal size={14} /> Últimas linhas do log
                </div>
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500/50" />
                </div>
              </div>
              <div className="p-4 font-mono text-xs space-y-1 max-h-56 overflow-auto">
                {logs.length === 0 ? (
                  <p className="text-slate-500">Sem linhas de log para mostrar.</p>
                ) : (
                  logs.map((linha, i) => (
                    <p
                      key={i}
                      className={
                        linha.nivel === "error" || linha.nivel === "critical"
                          ? "text-red-400"
                          : linha.nivel === "warning"
                          ? "text-yellow-400"
                          : linha.nivel === "success"
                          ? "text-green-400"
                          : "text-slate-300"
                      }
                    >
                      {linha.texto}
                    </p>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* COLUNA DIREITA */}
        <div className="space-y-6">
          {/* Ambiente real */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-4 text-sm uppercase tracking-wide">
              Ambiente
            </h3>
            <div className="space-y-3">
              <InfoRow label="Ambiente" value={estado?.ambiente ?? "—"} />
              <InfoRow label="Commit" value={estado?.commit ?? "—"} />
              <InfoRow label="Python" value={estado?.python ?? "—"} />
              <InfoRow label="Plataforma" value={estado?.plataforma ?? "—"} />
              <InfoRow
                label="Base de dados"
                value={estado?.base_dados.versao ?? estado?.base_dados.dialeto ?? "—"}
              />
              <InfoRow
                label="Redis"
                value={
                  estado ? (
                    <span
                      className={
                        estado.redis.alcancavel ? "text-green-700" : "text-red-600"
                      }
                    >
                      {estado.redis.alcancavel
                        ? `ok · ${estado.redis.latencia_ms ?? "?"} ms`
                        : "indisponível"}
                    </span>
                  ) : (
                    "—"
                  )
                }
              />

              <div className="pt-2 mt-2 border-t">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-500">Latência da BD</span>
                  <span className="text-gray-900 font-medium">
                    {estado?.base_dados.latencia_ms != null
                      ? `${estado.base_dados.latencia_ms} ms`
                      : "—"}
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full ${
                      (estado?.base_dados.latencia_ms ?? 0) > 200
                        ? "bg-red-500"
                        : (estado?.base_dados.latencia_ms ?? 0) > 50
                        ? "bg-amber-500"
                        : "bg-green-500"
                    }`}
                    style={{
                      // 200 ms como escala cheia: acima disso o problema já é
                      // visível sem precisar de barra.
                      width: `${Math.min(
                        100,
                        ((estado?.base_dados.latencia_ms ?? 0) / 200) * 100
                      )}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Ações rápidas */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-4 text-sm uppercase tracking-wide">
              Ações Rápidas
            </h3>
            <div className="space-y-2">
              {can("logs:export") && (
                <button
                  onClick={exportarLogs}
                  className="w-full flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 text-gray-700 transition-all group"
                >
                  <span className="flex items-center gap-2 font-medium text-sm">
                    <Download
                      size={16}
                      className="text-gray-400 group-hover:text-blue-600"
                    />{" "}
                    Exportar Logs
                  </span>
                </button>
              )}
              {can("logs:view") && (
                <button
                  onClick={() => router.push("/home/historico")}
                  className="w-full flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 text-gray-700 transition-all group"
                >
                  <span className="flex items-center gap-2 font-medium text-sm">
                    <Shield
                      size={16}
                      className="text-gray-400 group-hover:text-blue-600"
                    />{" "}
                    Histórico e auditoria
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* Zona de perigo */}
          {can("settings:system") && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-5">
              <div className="flex items-start gap-3">
                <AlertTriangle className="text-red-600 shrink-0 mt-0.5" size={20} />
                <div className="min-w-0 w-full">
                  <h4 className="font-bold text-red-900 text-sm">Zona de Perigo</h4>
                  <p className="text-xs text-red-700 mt-1 mb-3">
                    Limpar todo o cache não perde dados — tudo é recalculável — mas os
                    pedidos ficam mais lentos enquanto volta a encher.
                  </p>

                  {mensagemCache && (
                    <p className="text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-2 py-1.5 mb-2">
                      {mensagemCache}
                    </p>
                  )}

                  <button
                    onClick={aoLimparTudo}
                    disabled={aLimpar}
                    className="w-full bg-white border border-red-200 text-red-600 hover:bg-red-600 hover:text-white transition-all text-sm font-medium py-2 rounded-lg shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {aLimpar ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Trash2 size={14} />
                    )}
                    Limpar todo o cache
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* =======================
   CONTROLO INDIVIDUAL
======================= */
const ControloSistema = ({
  definicao,
  aGuardar,
  podeAlterar,
  onChange,
}: {
  definicao: DefinicaoSistema;
  aGuardar: boolean;
  podeAlterar: boolean;
  onChange: (valor: boolean) => void;
}) => (
  <div className="p-4 flex items-center justify-between gap-4 hover:bg-gray-50 transition-colors">
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2 flex-wrap">
        <p className="font-medium text-gray-900">{definicao.titulo}</p>
        {definicao.criticidade === "high" && (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-600 uppercase">
            Crítico
          </span>
        )}
        {/* O backend diz quais as opções que ainda não têm consumidor. Marcá-las
            é preferível a deixar um interruptor a fingir que age. */}
        {!definicao.ativa && (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-500 uppercase">
            Sem efeito
          </span>
        )}
      </div>
      <p className="text-sm text-gray-500 mt-0.5">{definicao.descricao}</p>
    </div>

    <div className="flex items-center gap-2 shrink-0">
      {aGuardar && <Loader2 size={14} className="animate-spin text-gray-400" />}
      <Switch
        checked={definicao.valor}
        disabled={aGuardar || !podeAlterar}
        onChange={() => onChange(!definicao.valor)}
      />
    </div>
  </div>
);



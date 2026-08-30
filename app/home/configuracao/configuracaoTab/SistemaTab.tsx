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
  Power,
  Database,
  Trash2,
  Loader2,
  RefreshCw
} from "lucide-react";
import { useSession } from "@/context/SessionContext";
import { useCachePolicy } from "@/hook/useCachePolicy";

/* =======================
   TYPES & MOCK DATA
======================= */
type SystemSetting = {
  id: string;
  title: string;
  description: string;
  enabled: boolean;
  permission: string;
  criticality?: "low" | "medium" | "high";
};

/* =======================
   COMPONENTES UI REUTILIZÁVEIS
======================= */

// Toggle Switch com Animação
const Switch = ({ checked, onChange, disabled }: { checked: boolean; onChange: () => void; disabled?: boolean }) => (
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

// Card de Estatística Pequeno
const StatusCard = ({ label, value, icon: Icon, color, subtext }: { label: string, value: string | number, icon: React.ComponentType<{ size?: number }>, color: string, subtext?: string }) => (
  <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-start justify-between">
    <div>
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</p>
      <h4 className="text-2xl font-bold text-gray-900 mt-1">{value}</h4>
      {subtext && <p className="text-xs text-gray-400 mt-1">{subtext}</p>}
    </div>
    <span className={`p-2 rounded-lg ${color} bg-opacity-10 flex items-center justify-center`}>
      <Icon size={20} />
    </span>
  </div>
);

/* =======================
   COMPONENTE PRINCIPAL
======================= */
export const SistemaTab = () => {
  const { user } = useSession();
  const permissions = user?.permissions ?? [];

  // Helper de permissão
  const can = (p: string) => permissions.includes(p) || permissions.includes("admin:*");

  const [settings, setSettings] = useState<SystemSetting[]>([
    {
      id: "audit",
      title: "Modo de Auditoria Rigorosa",
      description: "Registra todos os payloads de requisições POST/PUT.",
      enabled: true,
      permission: "audit:configure",
      criticality: "medium"
    },
    {
      id: "maintenance",
      title: "Modo Manutenção",
      description: "Bloqueia acesso de usuários não-admin.",
      enabled: false,
      permission: "system:maintenance",
      criticality: "high"
    },
    {
      id: "debug",
      title: "Debug Logs",
      description: "Aumenta a verbosidade dos logs para 'Debug'.",
      enabled: false,
      permission: "logs:configure",
      criticality: "low"
    },
    {
      id: "backup_auto",
      title: "Backup Incremental",
      description: "Realiza backup a cada 6 horas.",
      enabled: true,
      permission: "backup:configure",
      criticality: "medium"
    },
  ]);

  const toggleSetting = (id: string) => {
    setSettings((prev) =>
      prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s))
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Server className="text-blue-600" size={24} />
            Monitoramento & Sistema
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Gerencie o comportamento global da aplicação e infraestrutura.
          </p>
        </div>
        
        {/* Status Badge Global */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-full">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
            </span>
            <span className="text-sm font-medium text-green-700">Todos serviços operacionais</span>
        </div>
      </div>

      {/* DASHBOARD GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* COLUNA ESQUERDA (2/3): Métricas e Configurações */}
        <div className="lg:col-span-2 space-y-6">
            
            {/* Cards de Métricas */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatusCard 
                    label="Uptime" 
                    value="99.9%" 
                    subtext="Última queda: 45 dias atrás"
                    icon={Activity} 
                    color="text-green-600 bg-green-50" 
                />
                <StatusCard 
                    label="CPU Load" 
                    value="34%" 
                    subtext="8 Cores / 16 Threads"
                    icon={Cpu} 
                    color="text-blue-600 bg-blue-50" 
                />
                <StatusCard 
                    label="Storage" 
                    value="1.2 TB" 
                    subtext="450 GB Livres (SSD)"
                    icon={HardDrive} 
                    color="text-purple-600 bg-purple-50" 
                />
            </div>

            {/* Painel de Configurações */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                        <Activity size={18} /> Controles do Sistema
                    </h3>
                </div>
                <div className="divide-y divide-gray-100">
                    {settings.filter(s => can(s.permission)).map((setting) => (
                        <div key={setting.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                            <div className="flex-1 pr-4">
                                <div className="flex items-center gap-2">
                                    <p className="font-medium text-gray-900">{setting.title}</p>
                                    {setting.criticality === 'high' && (
                                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-600 uppercase">Crítico</span>
                                    )}
                                </div>
                                <p className="text-sm text-gray-500 mt-0.5">{setting.description}</p>
                            </div>
                            <Switch 
                                checked={setting.enabled} 
                                onChange={() => toggleSetting(setting.id)} 
                            />
                        </div>
                    ))}
                </div>
            </div>

            {/* Cache & Dados Locais */}
            {can("settings:system") && <CacheDadosLocaisPanel />}

             {/* Terminal Mock (Visual Fluff) */}
             {can("logs:read") && (
                <div className="bg-slate-900 rounded-xl overflow-hidden shadow-lg border border-slate-800">
                    <div className="flex items-center justify-between px-4 py-2 bg-slate-800 border-b border-slate-700">
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                            <Terminal size={14} /> system_output.log
                        </div>
                        <div className="flex gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
                            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50" />
                            <div className="w-2.5 h-2.5 rounded-full bg-green-500/50" />
                        </div>
                    </div>
                    <div className="p-4 font-mono text-xs text-slate-300 space-y-1 h-32 overflow-hidden opacity-80">
                        <p><span className="text-green-400">✓</span> Service [auth-module] started successfully</p>
                        <p><span className="text-green-400">✓</span> Database connection established (pool: 10/50)</p>
                        <p className="text-slate-500">10:42:01 - Running routine health check...</p>
                        <p className="text-yellow-400">⚠ Warning: Memory usage spike detected in worker-04</p>
                        <p className="text-slate-500">10:45:00 - Scheduled backup completed (2.4s)</p>
                    </div>
                </div>
             )}
        </div>

        {/* COLUNA DIREITA (1/3): Ações Rápidas e Informações */}
        <div className="space-y-6">
            
            {/* Informações Técnicas */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-4 text-sm uppercase tracking-wide">Ambiente</h3>
                <div className="space-y-3">
                    <InfoRow label="Versão do App" value="v2.4.1 (Build 402)" />
                    <InfoRow label="Node Version" value="v18.16.0" />
                    <InfoRow label="Database" value="PostgreSQL 15" />
                    <InfoRow label="Region" value="aws-sa-east-1" />
                    <div className="pt-2 mt-2 border-t">
                        <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-500">API Latency</span>
                            <span className="text-gray-900 font-medium">45ms</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5">
                            <div className="bg-green-500 h-1.5 rounded-full" style={{ width: '15%' }}></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Ações Rápidas */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                 <h3 className="font-semibold text-gray-900 mb-4 text-sm uppercase tracking-wide">Ações Rápidas</h3>
                 <div className="space-y-2">
                    {can("logs:export") && (
                        <button className="w-full flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 text-gray-700 transition-all group">
                            <span className="flex items-center gap-2 font-medium text-sm">
                                <Download size={16} className="text-gray-400 group-hover:text-blue-600" /> Exportar Logs
                            </span>
                        </button>
                    )}
                    {can("audit:read") && (
                        <button className="w-full flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 text-gray-700 transition-all group">
                            <span className="flex items-center gap-2 font-medium text-sm">
                                <Shield size={16} className="text-gray-400 group-hover:text-blue-600" /> Auditoria
                            </span>
                        </button>
                    )}
                 </div>
            </div>

            {/* ZONA DE PERIGO */}
            {can("system:restart") && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-5">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="text-red-600 shrink-0 mt-0.5" size={20} />
                        <div>
                            <h4 className="font-bold text-red-900 text-sm">Zona de Perigo</h4>
                            <p className="text-xs text-red-700 mt-1 mb-3">
                                Ações aqui podem causar indisponibilidade temporária.
                            </p>
                            <button className="w-full bg-white border border-red-200 text-red-600 hover:bg-red-600 hover:text-white transition-all text-sm font-medium py-2 rounded-lg shadow-sm flex items-center justify-center gap-2">
                                <Power size={14} /> Reiniciar Serviços
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

// Componente Auxiliar Simples
const InfoRow = ({ label, value }: { label: string; value: string }) => (
    <div className="flex justify-between items-center text-sm border-b border-gray-50 last:border-0 pb-2 last:pb-0">
        <span className="text-gray-500">{label}</span>
        <span className="font-medium text-gray-900 bg-gray-50 px-2 py-0.5 rounded text-xs">{value}</span>
    </div>
);
/* =======================
   CACHE & DADOS LOCAIS
======================= */

/**
 * Há metadados que a aplicação consulta uma vez e reutiliza: nomes de tabelas,
 * colunas, enums, contagens. É rápido, mas fica desatualizado assim que alguém
 * mexe no schema por fora — e quem está a trabalhar na estrutura quer ver o
 * estado real, não uma fotografia.
 *
 * Por isso a definição é por utilizador: um programador desliga-a sem penalizar
 * o desempenho de toda a gente.
 */
const CacheDadosLocaisPanel = () => {
  const {
    utilizadores,
    loading,
    erro,
    emCurso,
    carregar,
    alterarDadosLocais,
    limparCache,
  } = useCachePolicy(true);

  const [limpou, setLimpou] = useState<number | null>(null);

  const aoLimpar = async (userId: number) => {
    if (await limparCache(userId)) {
      setLimpou(userId);
      // Confirmação discreta: some sozinha em vez de exigir um clique.
      setTimeout(() => setLimpou((atual) => (atual === userId ? null : atual)), 2500);
    }
  };

  const semDadosLocais = utilizadores.filter((u) => !u.usar_dados_locais).length;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="p-4 border-b bg-gray-50 flex justify-between items-center gap-3">
        <div>
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <Database size={18} /> Cache &amp; Dados Locais
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Nomes de tabelas, colunas e enums são consultados uma vez e reutilizados.
            Desligar faz esse utilizador ler sempre da origem.
          </p>
        </div>
        <button
          onClick={carregar}
          disabled={loading}
          title="Recarregar"
          className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-50 shrink-0"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {erro && (
        <div className="px-4 py-3 bg-red-50 border-b border-red-100 text-sm text-red-700 flex items-start gap-2">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <span>{erro}</span>
        </div>
      )}

      {semDadosLocais > 0 && (
        <div className="px-4 py-2 bg-amber-50 border-b border-amber-100 text-xs text-amber-800">
          {semDadosLocais}{" "}
          {semDadosLocais === 1
            ? "utilizador está a ler sempre da origem"
            : "utilizadores estão a ler sempre da origem"}
          . Os pedidos deles são mais lentos, por opção.
        </div>
      )}

      {loading && utilizadores.length === 0 ? (
        <div className="p-8 flex items-center justify-center text-gray-400 text-sm gap-2">
          <Loader2 size={16} className="animate-spin" /> A carregar utilizadores…
        </div>
      ) : utilizadores.length === 0 ? (
        <div className="p-8 text-center text-sm text-gray-400">
          Nenhum utilizador encontrado.
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {utilizadores.map((u) => {
            const ocupado = emCurso === u.user_id;

            return (
              <div
                key={u.user_id}
                className="p-4 flex items-center justify-between gap-4 hover:bg-gray-50 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-gray-900 truncate">{u.nome}</p>
                    {!u.usar_dados_locais && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700 uppercase shrink-0">
                        Sempre da origem
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 truncate">{u.email}</p>
                  {limpou === u.user_id && (
                    <p className="text-xs text-green-600 mt-1">
                      Cache limpo — os próximos pedidos vão à origem.
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  {/* A opção entra no fluxo da linha, ao lado do utilizador a
                      que diz respeito, e não num formulário à parte. */}
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <span className="text-sm text-gray-600 hidden sm:inline">
                      Não consultar dados locais
                    </span>
                    <Switch
                      checked={!u.usar_dados_locais}
                      disabled={ocupado}
                      // O switch mostra "não consultar", logo é o inverso da
                      // definição guardada — alternar é gravar o inverso do
                      // valor atual.
                      onChange={() =>
                        alterarDadosLocais(u.user_id, !u.usar_dados_locais)
                      }
                    />
                  </label>

                  <button
                    onClick={() => aoLimpar(u.user_id)}
                    disabled={ocupado}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-700 hover:border-red-300 hover:bg-red-50 hover:text-red-600 transition-all disabled:opacity-50"
                  >
                    {ocupado ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Trash2 size={14} />
                    )}
                    Limpar cache
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

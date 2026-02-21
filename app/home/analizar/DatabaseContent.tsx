"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "@/context/SessionContext";
import { hasPermission } from "@/permissions_val";
import { HardDrive, Activity, AlertOctagon, ShieldCheck, Zap, ArrowRightLeft, FileDown, FileSpreadsheet, Loader2 } from "lucide-react";
import { AuditTrailItem, MetricCard, QueryRowItem } from "./ComponentAnlytics/AnalyticsUI";

export function DatabaseModule() {
  const { user } = useSession();
  const [metrics, setMetrics] = useState<Record<string, string | number> | null>(null);
  const [loading, setLoading] = useState(false);
  
  const canExport = hasPermission(user?.permissions ?? [], "analytics:db:export");

  useEffect(() => {
    loadMustaMetrics();
  }, []);

  async function loadMustaMetrics() {
    setLoading(true);
    // Simulação de chamada ao backend FastAPI do MustaInf
    setTimeout(() => {
      setMetrics({
        tableSizeTotal: "4.2 GB",
        rowCountTotal: 850430,
        activeTransactions: 3,
        deadlocks: 0
      });
      setLoading(false);
    }, 600);
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 space-y-8">
      {loading && (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Loader2 className="animate-spin" size={16} />
          Carregando métricas...
        </div>
      )}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
            <span className="bg-blue-600/20 text-blue-400 text-[10px] font-black px-2 py-0.5 rounded border border-blue-500/30 uppercase">Engine Status</span>
            <span className="text-emerald-500 text-[10px] font-bold animate-pulse">● LIVE</span>
        </div>
        <button className="text-xs font-bold text-blue-400 flex items-center gap-2 hover:underline">
            <ArrowRightLeft size={14} /> Iniciar Nova Transferência de Dados
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Volume Total" value={metrics?.tableSizeTotal} subLabel="Storage Engine" icon={<HardDrive />} />
        <MetricCard label="Transações" value={metrics?.activeTransactions} subLabel="Transaction-safe" icon={<Activity className="text-emerald-400" />} />
        <MetricCard label="Deadlocks" value={metrics?.deadlocks} subLabel="Integridade" icon={<AlertOctagon className="text-red-500" />} />
        <MetricCard label="Auditoria" value="Ativo" subLabel="MustaInf Protected" icon={<ShieldCheck className="text-blue-500" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
          <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
            <h3 className="font-bold text-sm flex items-center gap-2"><Zap size={16} className="text-amber-400" /> Consultas Auditadas</h3>
            <div className="flex gap-2 text-slate-500">
               {canExport && <><FileDown size={16} className="cursor-pointer hover:text-white" /><FileSpreadsheet size={16} className="cursor-pointer hover:text-white" /></>}
            </div>
          </div>
          <table className="w-full text-left text-xs">
            <tbody className="divide-y divide-white/5 font-mono">
              <QueryRowItem target="PostgreSQL / Prod" trail="musta_exec_992" duration="12ms" status="Success" />
              <QueryRowItem target="MySQL / Analytics" trail="musta_exec_991" duration="450ms" status="Warning" />
            </tbody>
          </table>
        </div>

        <div className="bg-gradient-to-br from-blue-900/20 to-transparent border border-blue-500/10 rounded-2xl p-6">
          <h3 className="text-xs font-black uppercase tracking-widest text-blue-400 mb-6">Trilha de Auditoria</h3>
          <div className="space-y-6">
             <AuditTrailItem user="admin@mustainf.io" action="SCHEMA_UPDATE" time="10m atrás" />
             <AuditTrailItem user="system_worker" action="DATA_PIPELINE" time="1h atrás" />
          </div>
        </div>
      </div>
    </div>
  );
}
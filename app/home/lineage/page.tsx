"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Workflow,
  Database,
  ArrowRight,
  RefreshCw,
  Search,
  Sparkles,
  Layers,
  Clock,
  ShieldCheck,
  ShieldAlert,
  ArrowLeftRight,
  Activity,
  History,
  FileText,
  Sliders,
  PlusCircle,
  ExternalLink,
  ChevronRight,
} from "lucide-react";
import api from "@/context/axioCuston";
import usePersistedState from "@/hook/localStoreUse";
import { LineageGraphResponse, LineageEvent } from "./types";
import { LineageFlowViewer } from "./components/LineageFlowViewer";
import { LineageImpactModal } from "./components/LineageImpactModal";

export default function LineagePage() {
  const [isDarkMode] = usePersistedState("tema_menu_tabela", true);
  const [graphData, setGraphData] = useState<LineageGraphResponse | null>(null);
  const [historyEvents, setHistoryEvents] = useState<LineageEvent[]>([]);
  const [activeTab, setActiveTab] = useState<"flow" | "audit" | "impact">("flow");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [impactTable, setImpactTable] = useState<string | null>(null);
  const [impactConnId, setImpactConnId] = useState<number | undefined>(undefined);
  const [historySearch, setHistorySearch] = useState("");
  const [impactSearch, setImpactSearch] = useState("");

  const loadData = useCallback(async () => {
    try {
      setRefreshing(true);
      const [graphRes, historyRes] = await Promise.all([
        api.get("/lineage/graph"),
        api.get("/lineage/history?limit=50"),
      ]);
      setGraphData(graphRes.data);
      setHistoryEvents(historyRes.data || []);
    } catch (err) {
      console.error("Erro ao carregar dados de linhagem:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSeedDemo = async () => {
    try {
      setRefreshing(true);
      await api.post("/lineage/seed-demo");
      await loadData();
    } catch (err) {
      console.error("Erro ao semear demonstração:", err);
    } finally {
      setRefreshing(false);
    }
  };

  const filteredHistory = historyEvents.filter((ev) => {
    if (!historySearch) return true;
    const s = historySearch.toLowerCase();
    return (
      ev.source_table.toLowerCase().includes(s) ||
      ev.target_table.toLowerCase().includes(s) ||
      (ev.source_connection_name || "").toLowerCase().includes(s) ||
      (ev.target_connection_name || "").toLowerCase().includes(s) ||
      (ev.transformation_rule || "").toLowerCase().includes(s)
    );
  });

  return (
    <div
      className={`min-h-screen transition-colors duration-200 ${
        isDarkMode ? "bg-[#0b0f19] text-slate-100" : "bg-slate-50 text-slate-900"
      }`}
    >
      {/* ── BARRA SUPERIOR E BREADCRUMBS ── */}
      <div
        className={`border-b sticky top-0 z-30 backdrop-blur-md bg-opacity-90 ${
          isDarkMode ? "bg-[#0b0f19]/90 border-slate-800" : "bg-white/90 border-slate-200"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <Link
                href="/home"
                className={`text-xs px-2.5 py-1 rounded-md border ${
                  isDarkMode
                    ? "bg-slate-800 border-slate-700 text-slate-300 hover:text-white"
                    : "bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900"
                }`}
              >
                ← Visão Geral
              </Link>
              <span className="text-slate-500">/</span>
              <div className="flex items-center gap-2 text-sm font-semibold text-indigo-400">
                <Workflow className="w-4 h-4" />
                Linhagem Visual de Dados (Data Lineage & Flow)
              </div>
            </div>

            {/* Ações Rápidas */}
            <div className="flex items-center gap-2.5">
              <button
                onClick={handleSeedDemo}
                disabled={refreshing}
                className="px-3 py-1.5 rounded-lg text-xs font-medium border border-purple-500/30 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 transition-all flex items-center gap-1.5"
                title="Gera exemplos de fluxo realistas para teste"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Semear Demo
              </button>

              <button
                onClick={loadData}
                disabled={refreshing}
                className="px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 transition-all flex items-center gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
                Atualizar
              </button>

              <Link
                href="/home/transacoes"
                className="px-3.5 py-1.5 rounded-lg text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 transition-all flex items-center gap-1.5"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                Nova Transferência
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* ── CABEÇALHO DO MÓDULO ── */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-400 mb-1.5">
              <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/30">
                Governança & Rastreabilidade de Dados
              </span>
              <span>•</span>
              <span>DAG Heterogêneo</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Linhagem Visual de Dados (Data Lineage & Flow)
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              Rastreamento ponta a ponta de proveniência (Upstream), regras de transformação
              e consumidores (Downstream) em bases PostgreSQL, MySQL, MongoDB e SQLite.
            </p>
          </div>
        </div>

        {/* ── CARDS DE KPIS E RESUMO EXECUTIVO ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
              <span className="font-medium">Bases Envolvidas</span>
              <Database className="w-4 h-4 text-sky-400" />
            </div>
            <div className="text-2xl font-black text-white">
              {graphData?.summary.databases_involved.length || 0}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 truncate">
              {graphData?.summary.databases_involved.join(", ") || "Nenhuma conectada"}
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
              <span className="font-medium">Fluxos Mapeados</span>
              <Workflow className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl font-black text-white">
              {graphData?.summary.active_flows_count || 0}
            </div>
            <div className="text-[11px] text-purple-400 mt-1 flex items-center gap-1">
              <span>{graphData?.summary.total_transformations || 0} transformações ativas</span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
              <span className="font-medium">Volume Total Rastreado</span>
              <Layers className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-white">
              {graphData?.summary.total_volume_records.toLocaleString() || 0}
            </div>
            <div className="text-[11px] text-emerald-400 mt-1">Registros migrados com sucesso</div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
              <span className="font-medium">Latência Média</span>
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-black text-white">
              {graphData?.summary.average_duration_ms || 0} <span className="text-sm font-normal text-slate-400">ms</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Por lote de sincronização</div>
          </div>
        </div>

        {/* ── ABAS DE NAVEGAÇÃO ── */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
          <button
            onClick={() => setActiveTab("flow")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
              activeTab === "flow"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "text-slate-400 hover:text-white hover:bg-slate-800/60"
            }`}
          >
            <Workflow className="w-4 h-4" />
            Mapa Interativo de Fluxo (DAG)
          </button>

          <button
            onClick={() => setActiveTab("audit")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
              activeTab === "audit"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "text-slate-400 hover:text-white hover:bg-slate-800/60"
            }`}
          >
            <History className="w-4 h-4" />
            Trilha de Auditoria & Histórico ({historyEvents.length})
          </button>

          <button
            onClick={() => setActiveTab("impact")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
              activeTab === "impact"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "text-slate-400 hover:text-white hover:bg-slate-800/60"
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            Análise de Impacto de Tabelas
          </button>
        </div>

        {/* ── CONTEÚDO DA ABA ATIVA ── */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-slate-400">
            <div className="w-10 h-10 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-medium">Sintetizando grafo de linhagem no NetworkX...</p>
          </div>
        ) : activeTab === "flow" ? (
          <div className="space-y-4">
            {graphData && (
              <LineageFlowViewer
                nodes={graphData.nodes}
                edges={graphData.edges}
                onAnalyzeImpact={(tbl, connId) => {
                  setImpactTable(tbl);
                  setImpactConnId(connId);
                }}
              />
            )}
          </div>
        ) : activeTab === "audit" ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  placeholder="Pesquisar por tabela, conexão ou regra de transferência..."
                  className="pl-9 pr-4 py-2 text-xs bg-slate-900 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full"
                />
              </div>
              <span className="text-xs text-slate-400">
                Exibindo {filteredHistory.length} evento(s)
              </span>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950/80 text-slate-400 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="px-5 py-3">Origem</th>
                      <th className="px-5 py-3">Destino</th>
                      <th className="px-5 py-3">Transformação / Regra</th>
                      <th className="px-5 py-3">Volume</th>
                      <th className="px-5 py-3">Duração</th>
                      <th className="px-5 py-3">Data / Hora</th>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredHistory.map((ev) => (
                      <tr key={ev.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="font-semibold text-white flex items-center gap-1.5">
                            <Database className="w-3.5 h-3.5 text-blue-400" />
                            {ev.source_table}
                          </div>
                          <span className="text-[11px] text-slate-400">
                            {ev.source_connection_name} ({ev.source_db_type})
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="font-semibold text-white flex items-center gap-1.5">
                            <Layers className="w-3.5 h-3.5 text-emerald-400" />
                            {ev.target_table}
                          </div>
                          <span className="text-[11px] text-slate-400">
                            {ev.target_connection_name} ({ev.target_db_type})
                          </span>
                        </td>
                        <td className="px-5 py-3.5 max-w-xs">
                          <span className="font-mono text-[11px] text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/30 line-clamp-1">
                            {ev.transformation_rule || "Transferência direta"}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 font-mono text-slate-200">
                          {ev.rows_transferred.toLocaleString()} lins
                        </td>
                        <td className="px-5 py-3.5 text-slate-400 font-mono">
                          {ev.duration_ms} ms
                        </td>
                        <td className="px-5 py-3.5 text-slate-400">
                          {new Date(ev.created_at).toLocaleString()}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                            {ev.status}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <button
                            onClick={() => {
                              setImpactTable(ev.source_table);
                              setImpactConnId(ev.source_connection_id);
                            }}
                            className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
                          >
                            Impacto
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl max-w-xl">
              <h3 className="text-sm font-bold text-white mb-1.5 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-indigo-400" />
                Consultar Risco de Alteração / Exclusão
              </h3>
              <p className="text-xs text-slate-400 mb-4">
                Digite o nome de uma tabela para verificar quais bancos de dados, relatórios e tabelas analíticas dependem dela antes de realizar um `ALTER TABLE` ou `DROP`.
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={impactSearch}
                  onChange={(e) => setImpactSearch(e.target.value)}
                  placeholder="Ex: pedidos, clientes, pagamentos..."
                  className="flex-1 px-4 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  onClick={() => {
                    if (impactSearch.trim()) {
                      setImpactTable(impactSearch.trim());
                    }
                  }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition-all"
                >
                  Analisar
                </button>
              </div>
            </div>

            {/* Tabelas Disponíveis para Análise Rápida */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                Tabelas Mapeadas no Ecossistema
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {graphData?.nodes
                  .filter((n) => n.type === "table")
                  .map((node) => (
                    <div
                      key={node.id}
                      onClick={() => {
                        setImpactTable(node.label);
                        setImpactConnId(node.connection_id);
                      }}
                      className="p-4 bg-slate-900/40 hover:bg-slate-900 border border-slate-800 hover:border-indigo-500/50 rounded-xl cursor-pointer transition-all flex items-center justify-between group"
                    >
                      <div>
                        <span className="font-semibold text-white text-xs block group-hover:text-indigo-400 transition-colors">
                          {node.label}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {node.database_name}
                        </span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all" />
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 🛡️ Modal de Análise de Impacto Upstream/Downstream */}
      {impactTable && (
        <LineageImpactModal
          tableName={impactTable}
          connectionId={impactConnId}
          isOpen={Boolean(impactTable)}
          onClose={() => setImpactTable(null)}
        />
      )}
    </div>
  );
}

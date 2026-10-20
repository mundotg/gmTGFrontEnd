"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Workflow,
  Database,
  RefreshCw,
  Search,
  Sparkles,
  Layers,
  Clock,
  ShieldAlert,
  History,
  PlusCircle,
  ChevronRight,
  ArrowLeft,
  Sun,
  Moon,
} from "lucide-react";
import api from "@/context/axioCuston";
import usePersistedState from "@/hook/localStoreUse";
import { useSession } from "@/context/SessionContext";
import { useI18n } from "@/context/I18nContext";
import { LineageGraphResponse, LineageEvent } from "./types";
import { LineageFlowViewer } from "./components/LineageFlowViewer";
import { LineageImpactModal } from "./components/LineageImpactModal";

export default function LineagePage() {
  const [isDarkMode, setIsDarkMode] = usePersistedState("tema_menu_tabela", false);
  const { user } = useSession();
  const { t } = useI18n();

  const [graphData, setGraphData] = useState<LineageGraphResponse | null>(null);
  const [historyEvents, setHistoryEvents] = useState<LineageEvent[]>([]);
  const [activeTab, setActiveTab] = useState<"flow" | "audit" | "impact">("flow");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [impactTable, setImpactTable] = useState<string | null>(null);
  const [impactConnId, setImpactConnId] = useState<number | undefined>(undefined);
  const [historySearch, setHistorySearch] = useState("");
  const [impactSearch, setImpactSearch] = useState("");

  const dbName = user?.info_extra?.name_db || t("lineage.activeDb") || "Base de Dados Ativa";
  const dbType = user?.info_extra?.type || "Relacional";

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
        isDarkMode ? "bg-[#121214] text-gray-100" : "bg-gray-50 text-gray-900"
      }`}
    >
      {/* ── BARRA SUPERIOR E BREADCRUMBS ── */}
      <div
        className={`border-b sticky top-0 z-30 backdrop-blur-md bg-opacity-95 transition-colors ${
          isDarkMode ? "bg-[#1C1C1E] border-gray-800" : "bg-white border-gray-200"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            {/* Left: Back button + Breadcrumb */}
            <div className="flex items-center gap-3">
              <Link
                href="/home"
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  isDarkMode
                    ? "bg-[#2C2C2E] border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white"
                    : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-gray-900 shadow-sm"
                }`}
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{t("lineage.backToHome") || "Voltar para Início"}</span>
              </Link>

              <div className={`h-4 w-px ${isDarkMode ? "bg-gray-700" : "bg-gray-200"}`} />

              <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                <Link href="/home" className="hover:text-indigo-500 transition-colors">
                  {t("lineage.overview") || "Início"}
                </Link>
                <span>/</span>
                <span
                  className={`font-semibold flex items-center gap-1.5 ${
                    isDarkMode ? "text-gray-200" : "text-gray-800"
                  }`}
                >
                  <Workflow className="w-3.5 h-3.5 text-indigo-500" />
                  {t("lineage.breadcrumbTitle") || "Linhagem de Dados"}
                </span>
              </div>
            </div>

            {/* Right: Active DB badge + Theme Toggle + Quick Actions */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <div
                className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border ${
                  isDarkMode
                    ? "bg-gray-800/80 border-gray-700 text-gray-300"
                    : "bg-blue-50/80 border-blue-100 text-blue-700"
                }`}
              >
                <Database className="w-3.5 h-3.5 text-blue-500" />
                <span className="font-semibold">{dbName}</span>
                <span className="text-[10px] opacity-75 uppercase">({dbType})</span>
              </div>

              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className={`w-8 h-8 flex items-center justify-center rounded-lg border transition-colors ${
                  isDarkMode
                    ? "bg-[#2C2C2E] border-gray-700 text-gray-400 hover:bg-gray-700 hover:text-gray-200"
                    : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-700 shadow-sm"
                }`}
                title={
                  isDarkMode
                    ? t("lineage.themeToggleLight") || "Alternar para tema claro"
                    : t("lineage.themeToggleDark") || "Alternar para tema escuro"
                }
              >
                {isDarkMode ? (
                  <Sun className="w-4 h-4 text-amber-400" />
                ) : (
                  <Moon className="w-4 h-4 text-gray-600" />
                )}
              </button>

              <button
                onClick={handleSeedDemo}
                disabled={refreshing}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all flex items-center gap-1.5 ${
                  isDarkMode
                    ? "border-purple-500/30 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20"
                    : "border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100 shadow-sm"
                }`}
                title={t("lineage.seedDemoTooltip") || "Gera exemplos de fluxo realistas para teste"}
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                {t("lineage.seedDemo") || "Semear Demo"}
              </button>

              <button
                onClick={loadData}
                disabled={refreshing}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all flex items-center gap-1.5 ${
                  isDarkMode
                    ? "border-gray-700 bg-gray-800 text-gray-200 hover:bg-gray-700"
                    : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50 shadow-sm"
                }`}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
                {t("lineage.refresh") || "Atualizar"}
              </button>

              <Link
                href="/home/transacoes"
                className="px-3.5 py-1.5 rounded-lg text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/25 transition-all flex items-center gap-1.5"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                {t("lineage.newTransfer") || "Nova Transferência"}
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* ── CABEÇALHO DO MÓDULO ── */}
        <div
          className={`p-6 rounded-2xl border transition-all ${
            isDarkMode
              ? "bg-gradient-to-r from-indigo-950/40 via-purple-950/20 to-gray-900 border-indigo-900/40"
              : "bg-gradient-to-r from-indigo-50/80 via-white to-purple-50/50 border-indigo-100 shadow-sm"
          }`}
        >
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-500 mb-1.5">
                <span
                  className={`px-2 py-0.5 rounded-full border ${
                    isDarkMode
                      ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-400"
                      : "bg-indigo-50 border-indigo-200 text-indigo-700"
                  }`}
                >
                  {t("lineage.governanceBadge") || "Governança & Rastreabilidade de Dados"}
                </span>
                <span>•</span>
                <span>{t("lineage.dagBadge") || "DAG Heterogêneo"}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                {t("lineage.title") || "Linhagem Visual de Dados (Data Lineage & Flow)"}
              </h1>
              <p
                className={`text-sm mt-1 max-w-2xl ${
                  isDarkMode ? "text-gray-400" : "text-gray-600"
                }`}
              >
                {t("lineage.subtitle") ||
                  "Rastreamento ponta a ponta de proveniência (Upstream), regras de transformação e consumidores (Downstream) em bases heterogêneas."}
              </p>
            </div>
          </div>
        </div>

        {/* ── CARDS DE KPIS E RESUMO EXECUTIVO ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div
            className={`p-5 rounded-2xl border shadow-sm relative overflow-hidden transition-colors ${
              isDarkMode ? "bg-[#1C1C1E] border-gray-800" : "bg-white border-gray-200"
            }`}
          >
            <div
              className={`flex items-center justify-between text-xs mb-2 font-medium ${
                isDarkMode ? "text-gray-400" : "text-gray-500"
              }`}
            >
              <span>{t("lineage.kpiDatabases") || "Bases Envolvidas"}</span>
              <Database className="w-4 h-4 text-sky-500" />
            </div>
            <div
              className={`text-2xl font-black ${
                isDarkMode ? "text-white" : "text-gray-900"
              }`}
            >
              {graphData?.summary.databases_involved.length || 0}
            </div>
            <div
              className={`text-[11px] mt-1 truncate ${
                isDarkMode ? "text-gray-400" : "text-gray-500"
              }`}
            >
              {graphData?.summary.databases_involved.join(", ") ||
                t("lineage.kpiNoDb") ||
                "Nenhuma conectada"}
            </div>
          </div>

          <div
            className={`p-5 rounded-2xl border shadow-sm relative overflow-hidden transition-colors ${
              isDarkMode ? "bg-[#1C1C1E] border-gray-800" : "bg-white border-gray-200"
            }`}
          >
            <div
              className={`flex items-center justify-between text-xs mb-2 font-medium ${
                isDarkMode ? "text-gray-400" : "text-gray-500"
              }`}
            >
              <span>{t("lineage.kpiMappedFlows") || "Fluxos Mapeados"}</span>
              <Workflow className="w-4 h-4 text-purple-500" />
            </div>
            <div
              className={`text-2xl font-black ${
                isDarkMode ? "text-white" : "text-gray-900"
              }`}
            >
              {graphData?.summary.active_flows_count || 0}
            </div>
            <div className="text-[11px] text-purple-600 dark:text-purple-400 mt-1 flex items-center gap-1 font-medium">
              <span>
                {graphData?.summary.total_transformations || 0}{" "}
                {t("lineage.kpiActiveTransformations") || "transformações ativas"}
              </span>
            </div>
          </div>

          <div
            className={`p-5 rounded-2xl border shadow-sm relative overflow-hidden transition-colors ${
              isDarkMode ? "bg-[#1C1C1E] border-gray-800" : "bg-white border-gray-200"
            }`}
          >
            <div
              className={`flex items-center justify-between text-xs mb-2 font-medium ${
                isDarkMode ? "text-gray-400" : "text-gray-500"
              }`}
            >
              <span>{t("lineage.kpiTrackedVolume") || "Volume Total Rastreado"}</span>
              <Layers className="w-4 h-4 text-emerald-500" />
            </div>
            <div
              className={`text-2xl font-black ${
                isDarkMode ? "text-white" : "text-gray-900"
              }`}
            >
              {graphData?.summary.total_volume_records.toLocaleString() || 0}
            </div>
            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-medium">
              {t("lineage.kpiMigratedRecords") || "Registros migrados com sucesso"}
            </div>
          </div>

          <div
            className={`p-5 rounded-2xl border shadow-sm relative overflow-hidden transition-colors ${
              isDarkMode ? "bg-[#1C1C1E] border-gray-800" : "bg-white border-gray-200"
            }`}
          >
            <div
              className={`flex items-center justify-between text-xs mb-2 font-medium ${
                isDarkMode ? "text-gray-400" : "text-gray-500"
              }`}
            >
              <span>{t("lineage.kpiAvgLatency") || "Latência Média"}</span>
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <div
              className={`text-2xl font-black ${
                isDarkMode ? "text-white" : "text-gray-900"
              }`}
            >
              {graphData?.summary.average_duration_ms || 0}{" "}
              <span
                className={`text-sm font-normal ${
                  isDarkMode ? "text-gray-400" : "text-gray-500"
                }`}
              >
                ms
              </span>
            </div>
            <div
              className={`text-[11px] mt-1 ${
                isDarkMode ? "text-gray-400" : "text-gray-500"
              }`}
            >
              {t("lineage.kpiPerBatch") || "Por lote de sincronização"}
            </div>
          </div>
        </div>

        {/* ── ABAS DE NAVEGAÇÃO ── */}
        <div
          className={`flex items-center gap-2 border-b pb-2 flex-wrap transition-colors ${
            isDarkMode ? "border-gray-800" : "border-gray-200"
          }`}
        >
          <button
            onClick={() => setActiveTab("flow")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
              activeTab === "flow"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/25"
                : isDarkMode
                ? "text-gray-400 hover:text-white hover:bg-gray-800/60"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            }`}
          >
            <Workflow className="w-4 h-4" />
            {t("lineage.tabFlow") || "Mapa Interativo de Fluxo (DAG)"}
          </button>

          <button
            onClick={() => setActiveTab("audit")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
              activeTab === "audit"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/25"
                : isDarkMode
                ? "text-gray-400 hover:text-white hover:bg-gray-800/60"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            }`}
          >
            <History className="w-4 h-4" />
            {t("lineage.tabAudit") || "Trilha de Auditoria & Histórico"} (
            {historyEvents.length})
          </button>

          <button
            onClick={() => setActiveTab("impact")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
              activeTab === "impact"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/25"
                : isDarkMode
                ? "text-gray-400 hover:text-white hover:bg-gray-800/60"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            {t("lineage.tabImpact") || "Análise de Impacto de Tabelas"}
          </button>
        </div>

        {/* ── CONTEÚDO DA ABA ATIVA ── */}
        {loading ? (
          <div
            className={`flex flex-col items-center justify-center py-24 gap-3 ${
              isDarkMode ? "text-gray-400" : "text-gray-500"
            }`}
          >
            <div className="w-10 h-10 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-medium">
              {t("lineage.loadingGraph") || "Sintetizando grafo de linhagem no NetworkX..."}
            </p>
          </div>
        ) : activeTab === "flow" ? (
          <div className="space-y-4">
            {graphData && (
              <LineageFlowViewer
                nodes={graphData.nodes}
                edges={graphData.edges}
                isDarkMode={isDarkMode}
                onAnalyzeImpact={(tbl, connId) => {
                  setImpactTable(tbl);
                  setImpactConnId(connId);
                }}
              />
            )}
          </div>
        ) : activeTab === "audit" ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="relative flex-1 max-w-md">
                <Search
                  className={`w-4 h-4 absolute left-3 top-2.5 ${
                    isDarkMode ? "text-gray-400" : "text-gray-500"
                  }`}
                />
                <input
                  type="text"
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  placeholder={
                    t("lineage.searchAuditPlaceholder") ||
                    "Pesquisar por tabela, conexão ou regra de transferência..."
                  }
                  className={`pl-9 pr-4 py-2 text-xs rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full transition-colors ${
                    isDarkMode
                      ? "bg-[#1C1C1E] border-gray-700 text-gray-100 placeholder-gray-500"
                      : "bg-white border-gray-300 text-gray-900 placeholder-gray-400 shadow-sm"
                  }`}
                />
              </div>
              <span
                className={`text-xs ${
                  isDarkMode ? "text-gray-400" : "text-gray-500"
                }`}
              >
                {t("lineage.showingEvents") || "Exibindo"} {filteredHistory.length}{" "}
                {t("lineage.events") || "evento(s)"}
              </span>
            </div>

            <div
              className={`border rounded-2xl overflow-hidden shadow-sm transition-colors ${
                isDarkMode ? "bg-[#1C1C1E] border-gray-800" : "bg-white border-gray-200"
              }`}
            >
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead
                    className={`font-semibold uppercase text-[10px] tracking-wider border-b ${
                      isDarkMode
                        ? "bg-[#141416] text-gray-400 border-gray-800"
                        : "bg-gray-50 text-gray-500 border-gray-200"
                    }`}
                  >
                    <tr>
                      <th className="px-5 py-3">{t("lineage.thSource") || "Origem"}</th>
                      <th className="px-5 py-3">{t("lineage.thTarget") || "Destino"}</th>
                      <th className="px-5 py-3">
                        {t("lineage.thTransformation") || "Transformação / Regra"}
                      </th>
                      <th className="px-5 py-3">{t("lineage.thVolume") || "Volume"}</th>
                      <th className="px-5 py-3">{t("lineage.thDuration") || "Duração"}</th>
                      <th className="px-5 py-3">{t("lineage.thDate") || "Data / Hora"}</th>
                      <th className="px-5 py-3">{t("lineage.thStatus") || "Status"}</th>
                      <th className="px-5 py-3 text-right">
                        {t("lineage.thAction") || "Ação"}
                      </th>
                    </tr>
                  </thead>
                  <tbody
                    className={`divide-y ${
                      isDarkMode ? "divide-gray-800/60" : "divide-gray-100"
                    }`}
                  >
                    {filteredHistory.map((ev) => (
                      <tr
                        key={ev.id}
                        className={`transition-colors ${
                          isDarkMode ? "hover:bg-gray-800/40" : "hover:bg-gray-50/80"
                        }`}
                      >
                        <td className="px-5 py-3.5">
                          <div
                            className={`font-semibold flex items-center gap-1.5 ${
                              isDarkMode ? "text-white" : "text-gray-900"
                            }`}
                          >
                            <Database className="w-3.5 h-3.5 text-blue-500" />
                            {ev.source_table}
                          </div>
                          <span
                            className={`text-[11px] ${
                              isDarkMode ? "text-gray-400" : "text-gray-500"
                            }`}
                          >
                            {ev.source_connection_name} ({ev.source_db_type})
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <div
                            className={`font-semibold flex items-center gap-1.5 ${
                              isDarkMode ? "text-white" : "text-gray-900"
                            }`}
                          >
                            <Layers className="w-3.5 h-3.5 text-emerald-500" />
                            {ev.target_table}
                          </div>
                          <span
                            className={`text-[11px] ${
                              isDarkMode ? "text-gray-400" : "text-gray-500"
                            }`}
                          >
                            {ev.target_connection_name} ({ev.target_db_type})
                          </span>
                        </td>
                        <td className="px-5 py-3.5 max-w-xs">
                          <span
                            className={`font-mono text-[11px] px-2 py-0.5 rounded border line-clamp-1 ${
                              isDarkMode
                                ? "text-purple-300 bg-purple-500/10 border-purple-500/30"
                                : "text-purple-700 bg-purple-50 border-purple-200"
                            }`}
                          >
                            {ev.transformation_rule ||
                              t("lineage.directTransfer") ||
                              "Transferência direta"}
                          </span>
                        </td>
                        <td
                          className={`px-5 py-3.5 font-mono ${
                            isDarkMode ? "text-gray-200" : "text-gray-800"
                          }`}
                        >
                          {ev.rows_transferred.toLocaleString()}{" "}
                          {t("lineage.lines") || "lins"}
                        </td>
                        <td
                          className={`px-5 py-3.5 font-mono ${
                            isDarkMode ? "text-gray-400" : "text-gray-500"
                          }`}
                        >
                          {ev.duration_ms} ms
                        </td>
                        <td
                          className={`px-5 py-3.5 ${
                            isDarkMode ? "text-gray-400" : "text-gray-500"
                          }`}
                        >
                          {new Date(ev.created_at).toLocaleString()}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                            {ev.status}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <button
                            onClick={() => {
                              setImpactTable(ev.source_table);
                              setImpactConnId(ev.source_connection_id);
                            }}
                            className="text-xs text-indigo-500 hover:text-indigo-400 font-medium"
                          >
                            {t("lineage.btnAnalyzeImpact") || "Impacto"}
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
            <div
              className={`border p-6 rounded-2xl max-w-xl transition-colors ${
                isDarkMode
                  ? "bg-[#1C1C1E] border-gray-800"
                  : "bg-white border-gray-200 shadow-sm"
              }`}
            >
              <h3
                className={`text-sm font-bold mb-1.5 flex items-center gap-2 ${
                  isDarkMode ? "text-white" : "text-gray-900"
                }`}
              >
                <ShieldAlert className="w-4 h-4 text-indigo-500" />
                {t("lineage.impactRiskTitle") || "Consultar Risco de Alteração / Exclusão"}
              </h3>
              <p
                className={`text-xs mb-4 ${
                  isDarkMode ? "text-gray-400" : "text-gray-600"
                }`}
              >
                {t("lineage.impactRiskDesc") ||
                  "Digite o nome de uma tabela para verificar quais bancos de dados, relatórios e tabelas analíticas dependem dela antes de realizar um ALTER TABLE ou DROP."}
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={impactSearch}
                  onChange={(e) => setImpactSearch(e.target.value)}
                  placeholder={
                    t("lineage.searchTablePlaceholder") ||
                    "Ex: pedidos, clientes, pagamentos..."
                  }
                  className={`flex-1 px-4 py-2 text-xs rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors ${
                    isDarkMode
                      ? "bg-[#141416] border-gray-700 text-gray-100 placeholder-gray-500"
                      : "bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400"
                  }`}
                />
                <button
                  onClick={() => {
                    if (impactSearch.trim()) {
                      setImpactTable(impactSearch.trim());
                    }
                  }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition-all shadow-sm"
                >
                  {t("lineage.btnAnalyze") || "Analisar"}
                </button>
              </div>
            </div>

            {/* Tabelas Disponíveis para Análise Rápida */}
            <div>
              <h4
                className={`text-xs font-semibold uppercase tracking-wider mb-3 ${
                  isDarkMode ? "text-gray-400" : "text-gray-500"
                }`}
              >
                {t("lineage.mappedTablesTitle") || "Tabelas Mapeadas no Ecossistema"}
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
                      className={`p-4 border rounded-xl cursor-pointer transition-all flex items-center justify-between group ${
                        isDarkMode
                          ? "bg-[#1C1C1E] hover:bg-gray-800/80 border-gray-800 hover:border-indigo-500/50"
                          : "bg-white hover:bg-gray-50 border-gray-200 hover:border-indigo-300 shadow-sm"
                      }`}
                    >
                      <div>
                        <span
                          className={`font-semibold text-xs block transition-colors ${
                            isDarkMode
                              ? "text-white group-hover:text-indigo-400"
                              : "text-gray-900 group-hover:text-indigo-600"
                          }`}
                        >
                          {node.label}
                        </span>
                        <span
                          className={`text-[11px] ${
                            isDarkMode ? "text-gray-400" : "text-gray-500"
                          }`}
                        >
                          {node.database_name}
                        </span>
                      </div>
                      <ChevronRight
                        className={`w-4 h-4 transition-all ${
                          isDarkMode
                            ? "text-gray-600 group-hover:text-indigo-400 group-hover:translate-x-0.5"
                            : "text-gray-400 group-hover:text-indigo-600 group-hover:translate-x-0.5"
                        }`}
                      />
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
          isDarkMode={isDarkMode}
        />
      )}
    </div>
  );
}

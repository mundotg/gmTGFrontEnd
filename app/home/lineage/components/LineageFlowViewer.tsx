"use client";

import React, { useState, useMemo } from "react";
import {
  Database,
  ArrowRight,
  Filter,
  Sparkles,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  CheckCircle2,
  Clock,
  Layers,
  Code2,
  Copy,
  Check,
  Search,
  Info,
  ShieldAlert,
} from "lucide-react";
import { useI18n } from "@/context/I18nContext";
import { LineageNode, LineageEdge } from "../types";

interface LineageFlowViewerProps {
  nodes: LineageNode[];
  edges: LineageEdge[];
  onAnalyzeImpact?: (tableName: string, connectionId?: number) => void;
  isDarkMode?: boolean;
}

export function LineageFlowViewer({
  nodes,
  edges,
  onAnalyzeImpact,
  isDarkMode = true,
}: LineageFlowViewerProps) {
  const { t } = useI18n();
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [zoomLevel, setZoomLevel] = useState(1);
  const [copiedQuery, setCopiedQuery] = useState(false);

  // Agrupa os nós por nível topológico (0 = Origem, 1 = Transformação, 2 = Destino)
  const columns = useMemo(() => {
    const cols: Record<number, LineageNode[]> = { 0: [], 1: [], 2: [] };
    nodes.forEach((node) => {
      const lvl = node.level ?? (node.type === "transformation" ? 1 : 0);
      const safeLevel = Math.min(Math.max(lvl, 0), 2);
      if (!cols[safeLevel]) cols[safeLevel] = [];
      cols[safeLevel].push(node);
    });
    return cols;
  }, [nodes]);

  const selectedNode = useMemo(
    () => nodes.find((n) => n.id === selectedNodeId) || null,
    [selectedNodeId, nodes]
  );

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedQuery(true);
    setTimeout(() => setCopiedQuery(false), 2000);
  };

  const getDbBadge = (dbType?: string) => {
    const typeStr = (dbType || "").toLowerCase();
    if (typeStr.includes("postg")) {
      return {
        bg: isDarkMode
          ? "bg-sky-950/40 border-sky-800 text-sky-300"
          : "bg-sky-50 border-sky-200 text-sky-700",
        dot: "bg-sky-500",
        label: "PostgreSQL",
      };
    }
    if (typeStr.includes("mongo")) {
      return {
        bg: isDarkMode
          ? "bg-emerald-950/40 border-emerald-800 text-emerald-300"
          : "bg-emerald-50 border-emerald-200 text-emerald-700",
        dot: "bg-emerald-500",
        label: "MongoDB",
      };
    }
    if (typeStr.includes("mysql") || typeStr.includes("maria")) {
      return {
        bg: isDarkMode
          ? "bg-amber-950/40 border-amber-800 text-amber-300"
          : "bg-amber-50 border-amber-200 text-amber-700",
        dot: "bg-amber-500",
        label: "MySQL",
      };
    }
    if (typeStr.includes("sqlite")) {
      return {
        bg: isDarkMode
          ? "bg-indigo-950/40 border-indigo-800 text-indigo-300"
          : "bg-indigo-50 border-indigo-200 text-indigo-700",
        dot: "bg-indigo-500",
        label: "SQLite",
      };
    }
    return {
      bg: isDarkMode
        ? "bg-violet-950/40 border-violet-800 text-violet-300"
        : "bg-violet-50 border-violet-200 text-violet-700",
      dot: "bg-violet-500",
      label: dbType || "Database",
    };
  };

  return (
    <div
      className={`flex flex-col xl:flex-row gap-6 w-full h-[720px] rounded-2xl overflow-hidden relative font-sans transition-colors border shadow-sm ${isDarkMode
          ? "bg-[#141416] border-gray-800 text-gray-100 shadow-2xl"
          : "bg-white border-gray-200 text-gray-900"
        }`}
    >
      {/* 🧭 Área Principal do Grafo Interativo */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Barra Superior de Controles e Filtros */}
        <div
          className={`flex items-center justify-between px-6 py-4 border-b z-20 backdrop-blur-md ${isDarkMode
              ? "bg-[#1C1C1E]/95 border-gray-800"
              : "bg-white/95 border-gray-200"
            }`}
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search
                className={`w-4 h-4 absolute left-3 top-2.5 ${isDarkMode ? "text-gray-400" : "text-gray-500"
                  }`}
              />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={
                  t("lineage.filterPlaceholder") || "Filtrar tabela, banco ou regra..."
                }
                className={`pl-9 pr-4 py-1.5 text-xs rounded-lg border focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64 transition-colors ${isDarkMode
                    ? "bg-[#141416] border-gray-700 text-gray-100 placeholder-gray-500"
                    : "bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400"
                  }`}
              />
            </div>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className={`text-xs font-medium transition-colors ${isDarkMode
                    ? "text-gray-400 hover:text-white"
                    : "text-gray-500 hover:text-gray-900"
                  }`}
              >
                {t("lineage.clear") || "Limpar"}
              </button>
            )}
          </div>

          {/* Indicadores de Camadas */}
          <div
            className={`hidden md:flex items-center gap-6 text-xs font-medium ${isDarkMode ? "text-gray-400" : "text-gray-500"
              }`}
          >
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              {t("lineage.stageSources") || "1. Tabelas de Origem"}
            </span>
            <ArrowRight
              className={`w-3.5 h-3.5 ${isDarkMode ? "text-gray-600" : "text-gray-400"}`}
            />
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-purple-500" />
              {t("lineage.stageTransformation") || "2. Filtro & Transformação"}
            </span>
            <ArrowRight
              className={`w-3.5 h-3.5 ${isDarkMode ? "text-gray-600" : "text-gray-400"}`}
            />
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              {t("lineage.stageDestinations") || "3. Tabelas de Destino"}
            </span>
          </div>

          {/* Botões de Zoom */}
          <div
            className={`flex items-center gap-1.5 border rounded-lg p-1 ${isDarkMode
                ? "bg-[#141416] border-gray-700"
                : "bg-gray-100 border-gray-200"
              }`}
          >
            <button
              onClick={() => setZoomLevel((z) => Math.min(z + 0.15, 1.6))}
              className={`p-1.5 rounded transition-colors ${isDarkMode
                  ? "hover:bg-gray-800 text-gray-300 hover:text-white"
                  : "hover:bg-white text-gray-600 hover:text-gray-900"
                }`}
              title={t("lineage.zoomIn") || "Aumentar Zoom"}
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <span
              className={`text-xs px-2 font-mono ${isDarkMode ? "text-gray-300" : "text-gray-700"
                }`}
            >
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              onClick={() => setZoomLevel((z) => Math.max(z - 0.15, 0.6))}
              className={`p-1.5 rounded transition-colors ${isDarkMode
                  ? "hover:bg-gray-800 text-gray-300 hover:text-white"
                  : "hover:bg-white text-gray-600 hover:text-gray-900"
                }`}
              title={t("lineage.zoomOut") || "Diminuir Zoom"}
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={() => setZoomLevel(1)}
              className={`p-1.5 rounded transition-colors ${isDarkMode
                  ? "hover:bg-gray-800 text-gray-300 hover:text-white"
                  : "hover:bg-white text-gray-600 hover:text-gray-900"
                }`}
              title={t("lineage.zoomReset") || "Resetar Zoom"}
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 🗺️ Canvas com Efeito Grid e Fluxo de Colunas */}
        <div
          className={`flex-1 overflow-auto p-8 relative flex items-center justify-center [background-size:24px_24px] ${isDarkMode
              ? "bg-[#0b0f19] bg-[radial-gradient(#1e293b_1px,transparent_1px)]"
              : "bg-slate-50/70 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)]"
            }`}
        >
          <div
            style={{
              transform: `scale(${zoomLevel})`,
              transformOrigin: "center center",
              transition: "transform 0.2s ease-out",
            }}
            className="flex items-stretch justify-between gap-12 w-full max-w-5xl min-w-[780px] my-auto"
          >
            {/* Coluna 0: Origens */}
            <div className="flex-1 flex flex-col gap-5">
              <div
                className={`text-xs font-semibold uppercase tracking-wider flex items-center gap-2 mb-1 ${isDarkMode ? "text-gray-400" : "text-gray-500"
                  }`}
              >
                <Database className="w-3.5 h-3.5 text-blue-500" />
                {t("lineage.sourcesColumn") || "Origem (Sources)"}
              </div>
              {columns[0]?.map((node) => {
                const isSelected = selectedNodeId === node.id;
                const matches =
                  !searchTerm ||
                  node.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  (node.database_name || "")
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase());
                const badge = getDbBadge(node.db_type);

                return (
                  <div
                    key={node.id}
                    onClick={() => {
                      setSelectedNodeId(node.id);
                      setSelectedEdgeId(null);
                    }}
                    className={`cursor-pointer rounded-xl border p-4 transition-all duration-200 relative group ${isSelected
                        ? isDarkMode
                          ? "bg-[#1C1C1E] border-blue-500 shadow-lg shadow-blue-500/20 ring-2 ring-blue-500/40"
                          : "bg-white border-blue-500 shadow-md ring-2 ring-blue-500/30"
                        : matches
                          ? isDarkMode
                            ? "bg-[#1C1C1E]/80 border-gray-800 hover:bg-[#1C1C1E] hover:border-gray-700"
                            : "bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm"
                          : `opacity-30 ${isDarkMode
                            ? "bg-gray-800/20 border-gray-800"
                            : "bg-gray-100 border-gray-200"
                          }`
                      }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-medium border flex items-center gap-1.5 ${badge.bg}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                        {badge.label}
                      </span>
                      <span
                        className={`text-[11px] ${isDarkMode ? "text-gray-400" : "text-gray-500"
                          }`}
                      >
                        {node.database_name}
                      </span>
                    </div>
                    <div
                      className={`font-semibold text-sm flex items-center gap-2 ${isDarkMode ? "text-white" : "text-gray-900"
                        }`}
                    >
                      <Database className="w-4 h-4 text-blue-500" />
                      {node.label}
                    </div>
                    {node.columns && node.columns.length > 0 && (
                      <div className="mt-2.5 flex flex-wrap gap-1">
                        {node.columns.map((col, idx) => (
                          <span
                            key={idx}
                            className={`text-[10px] px-1.5 py-0.5 rounded font-mono border ${isDarkMode
                                ? "bg-gray-900 text-gray-300 border-gray-700/50"
                                : "bg-gray-100 text-gray-700 border-gray-200"
                              }`}
                          >
                            {col}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Coluna 1: Transformações / Pipelines */}
            <div className="flex-1 flex flex-col gap-5 justify-center">
              <div
                className={`text-xs font-semibold uppercase tracking-wider flex items-center gap-2 mb-1 ${isDarkMode ? "text-gray-400" : "text-gray-500"
                  }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                {t("lineage.transformationsColumn") || "Transformação & Filtro"}
              </div>
              {columns[1]?.map((node) => {
                const isSelected = selectedNodeId === node.id;
                const matches =
                  !searchTerm ||
                  node.label.toLowerCase().includes(searchTerm.toLowerCase());
                const meta = node.metadata || {};

                return (
                  <div
                    key={node.id}
                    onClick={() => {
                      setSelectedNodeId(node.id);
                      setSelectedEdgeId(null);
                    }}
                    className={`cursor-pointer rounded-xl border p-4 transition-all duration-200 relative group ${isSelected
                        ? isDarkMode
                          ? "bg-[#1C1C1E] border-purple-500 shadow-lg shadow-purple-500/20 ring-2 ring-purple-500/40"
                          : "bg-white border-purple-500 shadow-md ring-2 ring-purple-500/30"
                        : matches
                          ? isDarkMode
                            ? "bg-[#1C1C1E]/80 border-gray-800 hover:bg-[#1C1C1E] hover:border-purple-500/40"
                            : "bg-white border-gray-200 hover:border-purple-300 hover:shadow-sm"
                          : `opacity-30 ${isDarkMode
                            ? "bg-gray-800/20 border-gray-800"
                            : "bg-gray-100 border-gray-200"
                          }`
                      }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-purple-500/10 border border-purple-500/30 text-purple-600 dark:text-purple-300 flex items-center gap-1">
                        <Filter className="w-3 h-3 text-purple-500" />
                        {meta.transformation_type || t("lineage.filter") || "Filtro"}
                      </span>
                      <span className="text-[11px] text-emerald-500 flex items-center gap-1 font-medium">
                        <CheckCircle2 className="w-3 h-3" />
                        {t("lineage.success") || "Sucesso"}
                      </span>
                    </div>
                    <div
                      className={`font-semibold text-sm mb-1 line-clamp-1 ${isDarkMode ? "text-white" : "text-gray-900"
                        }`}
                    >
                      {node.label}
                    </div>
                    <div
                      className={`flex items-center justify-between text-xs mt-2 pt-2 border-t ${isDarkMode
                          ? "text-gray-400 border-gray-800"
                          : "text-gray-500 border-gray-100"
                        }`}
                    >
                      <span>
                        {meta.rows_transferred?.toLocaleString() || 0}{" "}
                        {t("lineage.lines") || "linhas"}
                      </span>
                      <span>{meta.duration_ms || 0} ms</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Coluna 2: Destinos */}
            <div className="flex-1 flex flex-col gap-5">
              <div
                className={`text-xs font-semibold uppercase tracking-wider flex items-center gap-2 mb-1 ${isDarkMode ? "text-gray-400" : "text-gray-500"
                  }`}
              >
                <Layers className="w-3.5 h-3.5 text-emerald-500" />
                {t("lineage.targetsColumn") || "Destino (Sinks)"}
              </div>
              {columns[2]?.map((node) => {
                const isSelected = selectedNodeId === node.id;
                const matches =
                  !searchTerm ||
                  node.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  (node.database_name || "")
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase());
                const badge = getDbBadge(node.db_type);

                return (
                  <div
                    key={node.id}
                    onClick={() => {
                      setSelectedNodeId(node.id);
                      setSelectedEdgeId(null);
                    }}
                    className={`cursor-pointer rounded-xl border p-4 transition-all duration-200 relative group ${isSelected
                        ? isDarkMode
                          ? "bg-[#1C1C1E] border-emerald-500 shadow-lg shadow-emerald-500/20 ring-2 ring-emerald-500/40"
                          : "bg-white border-emerald-500 shadow-md ring-2 ring-emerald-500/30"
                        : matches
                          ? isDarkMode
                            ? "bg-[#1C1C1E]/80 border-gray-800 hover:bg-[#1C1C1E] hover:border-gray-700"
                            : "bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm"
                          : `opacity-30 ${isDarkMode
                            ? "bg-gray-800/20 border-gray-800"
                            : "bg-gray-100 border-gray-200"
                          }`
                      }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-medium border flex items-center gap-1.5 ${badge.bg}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                        {badge.label}
                      </span>
                      <span
                        className={`text-[11px] ${isDarkMode ? "text-gray-400" : "text-gray-500"
                          }`}
                      >
                        {node.database_name}
                      </span>
                    </div>
                    <div
                      className={`font-semibold text-sm flex items-center gap-2 ${isDarkMode ? "text-white" : "text-gray-900"
                        }`}
                    >
                      <Layers className="w-4 h-4 text-emerald-500" />
                      {node.label}
                    </div>
                    {node.columns && node.columns.length > 0 && (
                      <div className="mt-2.5 flex flex-wrap gap-1">
                        {node.columns.map((col, idx) => (
                          <span
                            key={idx}
                            className={`text-[10px] px-1.5 py-0.5 rounded font-mono border ${isDarkMode
                                ? "bg-gray-900 text-gray-300 border-gray-700/50"
                                : "bg-gray-100 text-gray-700 border-gray-200"
                              }`}
                          >
                            {col}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 📋 Painel Lateral Inspetor (Node & Edge Details) */}
      <div
        className={`w-full xl:w-96 border-t xl:border-t-0 xl:border-l p-6 flex flex-col justify-between overflow-y-auto transition-colors ${isDarkMode
            ? "bg-[#121214] border-gray-800 text-gray-100"
            : "bg-gray-50/70 border-gray-200 text-gray-900"
          }`}
      >
        {selectedNode ? (
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span
                  className={`text-xs uppercase tracking-wider font-semibold ${isDarkMode ? "text-gray-400" : "text-gray-500"
                    }`}
                >
                  {selectedNode.type === "table"
                    ? t("lineage.dataEntity") || "Entidade de Dados"
                    : t("lineage.transformationPipeline") || "Transformação / Pipeline"}
                </span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full border ${isDarkMode
                      ? "bg-gray-800 text-gray-300 border-gray-700"
                      : "bg-white text-gray-700 border-gray-200 shadow-xs"
                    }`}
                >
                  {t("lineage.level") || "Nível"} {selectedNode.level}
                </span>
              </div>
              <h3
                className={`text-xl font-bold flex items-center gap-2 ${isDarkMode ? "text-white" : "text-gray-900"
                  }`}
              >
                {selectedNode.type === "table" ? (
                  <Database className="w-5 h-5 text-indigo-500" />
                ) : (
                  <Sparkles className="w-5 h-5 text-purple-500" />
                )}
                {selectedNode.label}
              </h3>
              <p
                className={`text-xs mt-1 ${isDarkMode ? "text-gray-400" : "text-gray-500"
                  }`}
              >
                {selectedNode.database_name}
              </p>
            </div>

            {selectedNode.type === "transformation" ? (
              <div className="space-y-4">
                <div
                  className={`rounded-xl p-4 border ${isDarkMode
                      ? "bg-[#1C1C1E] border-gray-800"
                      : "bg-white border-gray-200 shadow-sm"
                    }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
                      <Code2 className="w-3.5 h-3.5" />
                      {t("lineage.appliedQuery") || "Consulta / Regra Aplicada"}
                    </span>
                    {selectedNode.metadata?.query && (
                      <button
                        onClick={() => handleCopy(selectedNode.metadata?.query || "")}
                        className={`text-[11px] flex items-center gap-1 transition-colors ${isDarkMode
                            ? "text-gray-400 hover:text-white"
                            : "text-gray-500 hover:text-gray-900"
                          }`}
                      >
                        {copiedQuery ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-500" />{" "}
                            {t("lineage.copied") || "Copiado"}
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />{" "}
                            {t("lineage.copySql") || "Copiar SQL"}
                          </>
                        )}
                      </button>
                    )}
                  </div>
                  <pre
                    className={`text-xs font-mono p-3 rounded-lg overflow-x-auto border max-h-48 leading-relaxed whitespace-pre-wrap ${isDarkMode
                        ? "bg-[#141416] text-gray-300 border-gray-800"
                        : "bg-gray-50 text-gray-800 border-gray-200"
                      }`}
                  >
                    {selectedNode.metadata?.query ||
                      selectedNode.metadata?.rule ||
                      t("lineage.directTransferNoQuery") ||
                      "Transferência direta sem transformação de consulta."}
                  </pre>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div
                    className={`p-3 rounded-xl border ${isDarkMode
                        ? "bg-[#1C1C1E] border-gray-800"
                        : "bg-white border-gray-200 shadow-sm"
                      }`}
                  >
                    <span
                      className={`block mb-1 ${isDarkMode ? "text-gray-400" : "text-gray-500"
                        }`}
                    >
                      {t("lineage.volumeTransferred") || "Volume Transferido"}
                    </span>
                    <span
                      className={`text-base font-bold ${isDarkMode ? "text-white" : "text-gray-900"
                        }`}
                    >
                      {selectedNode.metadata?.rows_transferred?.toLocaleString() || 0}{" "}
                      {t("lineage.lines") || "lins"}
                    </span>
                  </div>
                  <div
                    className={`p-3 rounded-xl border ${isDarkMode
                        ? "bg-[#1C1C1E] border-gray-800"
                        : "bg-white border-gray-200 shadow-sm"
                      }`}
                  >
                    <span
                      className={`block mb-1 ${isDarkMode ? "text-gray-400" : "text-gray-500"
                        }`}
                    >
                      {t("lineage.totalLatency") || "Latência Total"}
                    </span>
                    <span
                      className={`text-base font-bold ${isDarkMode ? "text-white" : "text-gray-900"
                        }`}
                    >
                      {selectedNode.metadata?.duration_ms || 0} ms
                    </span>
                  </div>
                </div>

                {selectedNode.metadata?.created_at && (
                  <div
                    className={`text-xs flex items-center gap-1.5 ${isDarkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                  >
                    <Clock className="w-3.5 h-3.5 opacity-70" />
                    {t("lineage.executedAt") || "Executado em:"}{" "}
                    {new Date(selectedNode.metadata.created_at).toLocaleString()}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div
                  className={`rounded-xl p-4 border ${isDarkMode
                      ? "bg-[#1C1C1E] border-gray-800"
                      : "bg-white border-gray-200 shadow-sm"
                    }`}
                >
                  <h4
                    className={`text-xs font-semibold uppercase tracking-wider mb-2.5 ${isDarkMode ? "text-gray-300" : "text-gray-700"
                      }`}
                  >
                    {t("lineage.mappedColumns") || "Colunas Mapeadas na Linhagem"}
                  </h4>
                  {selectedNode.columns && selectedNode.columns.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {selectedNode.columns.map((c, i) => (
                        <span
                          key={i}
                          className={`text-xs px-2.5 py-1 rounded-md font-mono border ${isDarkMode
                              ? "bg-gray-800 text-gray-200 border-gray-700"
                              : "bg-gray-100 text-gray-800 border-gray-200"
                            }`}
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p
                      className={`text-xs ${isDarkMode ? "text-gray-500" : "text-gray-400"
                        }`}
                    >
                      {t("lineage.dynamicColumns") ||
                        "Mapeamento dinâmico de todas as colunas."}
                    </p>
                  )}
                </div>

                {onAnalyzeImpact && selectedNode.table_name && (
                  <button
                    onClick={() =>
                      onAnalyzeImpact(selectedNode.table_name!, selectedNode.connection_id)
                    }
                    className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-md shadow-indigo-600/25"
                  >
                    <ShieldAlert className="w-4 h-4" />
                    {t("lineage.btnAnalyzeImpact") || "Analisar Impacto Upstream/Downstream"}
                  </button>
                )}
              </div>
            )}
          </div>
        ) : (
          <div
            className={`h-full flex flex-col items-center justify-center text-center p-6 ${isDarkMode ? "text-gray-500" : "text-gray-400"
              }`}
          >
            <Info
              className={`w-10 h-10 mb-3 ${isDarkMode ? "text-gray-600" : "text-gray-300"
                }`}
            />
            <h4
              className={`text-sm font-semibold mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"
                }`}
            >
              {t("lineage.selectNodePrompt") || "Selecione um Nó ou Fluxo"}
            </h4>
            <p
              className={`text-xs max-w-xs ${isDarkMode ? "text-gray-500" : "text-gray-500"
                }`}
            >
              {t("lineage.selectPrompt") ||
                "Clique em qualquer tabela ou caixa de transformação para inspecionar os detalhes da consulta, colunas e impacto."}
            </p>
          </div>
        )}

        <div
          className={`pt-4 border-t text-[11px] flex items-center justify-between ${isDarkMode ? "border-gray-800 text-gray-500" : "border-gray-200 text-gray-400"
            }`}
        >
          <span>MustaInfo Data Flow Engine</span>
          <span className="flex items-center gap-1 text-emerald-500 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            {t("lineage.activeDag") || "DAG Ativo"}
          </span>
        </div>
      </div>
    </div>
  );
}

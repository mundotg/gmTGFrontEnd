"use client";

import React, { useState, useMemo, useRef } from "react";
import {
  Database,
  ArrowRight,
  Filter,
  Sparkles,
  Maximize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Layers,
  Code2,
  Copy,
  Check,
  Search,
  Info,
  ShieldAlert,
} from "lucide-react";
import { LineageNode, LineageEdge } from "../types";

interface LineageFlowViewerProps {
  nodes: LineageNode[];
  edges: LineageEdge[];
  onAnalyzeImpact?: (tableName: string, connectionId?: number) => void;
}

export function LineageFlowViewer({
  nodes,
  edges,
  onAnalyzeImpact,
}: LineageFlowViewerProps) {
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

  // Identifica conexões ativas do nó selecionado para destacar o caminho (highlight path)
  const highlightedEdges = useMemo(() => {
    if (!selectedNodeId) return new Set<string>();
    const set = new Set<string>();
    edges.forEach((edge) => {
      if (edge.source === selectedNodeId || edge.target === selectedNodeId) {
        set.add(edge.id);
      }
    });
    return set;
  }, [selectedNodeId, edges]);

  const selectedNode = useMemo(
    () => nodes.find((n) => n.id === selectedNodeId) || null,
    [selectedNodeId, nodes]
  );

  const selectedEdge = useMemo(
    () => edges.find((e) => e.id === selectedEdgeId) || null,
    [selectedEdgeId, edges]
  );

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedQuery(true);
    setTimeout(() => setCopiedQuery(false), 2000);
  };

  const getDbBadge = (dbType?: string) => {
    const t = (dbType || "").toLowerCase();
    if (t.includes("postg")) {
      return {
        bg: "bg-sky-50 dark:bg-sky-950/40 border-sky-300 dark:border-sky-800 text-sky-700 dark:text-sky-300",
        dot: "bg-sky-500",
        label: "PostgreSQL",
      };
    }
    if (t.includes("mongo")) {
      return {
        bg: "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300",
        dot: "bg-emerald-500",
        label: "MongoDB",
      };
    }
    if (t.includes("mysql") || t.includes("maria")) {
      return {
        bg: "bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-300",
        dot: "bg-amber-500",
        label: "MySQL",
      };
    }
    if (t.includes("sqlite")) {
      return {
        bg: "bg-indigo-50 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300",
        dot: "bg-indigo-500",
        label: "SQLite",
      };
    }
    return {
      bg: "bg-violet-50 dark:bg-violet-950/40 border-violet-300 dark:border-violet-800 text-violet-700 dark:text-violet-300",
      dot: "bg-violet-500",
      label: dbType || "Database",
    };
  };

  return (
    <div className="flex flex-col xl:flex-row gap-6 w-full h-[720px] bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl relative text-slate-100 font-sans">
      {/* 🧭 Área Principal do Grafo Interativo */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Barra Superior de Controles e Filtros */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900/90 backdrop-blur-md border-b border-slate-800/80 z-20">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Filtrar tabela, banco ou regra..."
                className="pl-9 pr-4 py-1.5 text-xs bg-slate-800/80 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64"
              />
            </div>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="text-xs text-slate-400 hover:text-white"
              >
                Limpar
              </button>
            )}
          </div>

          {/* Indicadores de Camadas */}
          <div className="hidden md:flex items-center gap-6 text-xs text-slate-400 font-medium">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              1. Tabelas de Origem
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-purple-500" />
              2. Filtro & Transformação
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              3. Tabelas de Destino
            </span>
          </div>

          {/* Botões de Zoom */}
          <div className="flex items-center gap-1.5 bg-slate-800/90 border border-slate-700 rounded-lg p-1">
            <button
              onClick={() => setZoomLevel((z) => Math.min(z + 0.15, 1.6))}
              className="p-1.5 hover:bg-slate-700 rounded text-slate-300 hover:text-white"
              title="Aumentar Zoom"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <span className="text-xs px-2 text-slate-300 font-mono">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              onClick={() => setZoomLevel((z) => Math.max(z - 0.15, 0.6))}
              className="p-1.5 hover:bg-slate-700 rounded text-slate-300 hover:text-white"
              title="Diminuir Zoom"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={() => setZoomLevel(1)}
              className="p-1.5 hover:bg-slate-700 rounded text-slate-300 hover:text-white"
              title="Resetar Zoom"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 🗺️ Canvas com Efeito Grid e Fluxo de Colunas */}
        <div className="flex-1 overflow-auto p-8 relative flex items-center justify-center bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px]">
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
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2 mb-1">
                <Database className="w-3.5 h-3.5 text-blue-400" />
                Origem (Sources)
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
                    className={`cursor-pointer rounded-xl border p-4 transition-all duration-200 relative group ${
                      isSelected
                        ? "bg-slate-800/95 border-blue-500 shadow-lg shadow-blue-500/20 ring-2 ring-blue-500/40"
                        : matches
                        ? "bg-slate-800/60 border-slate-700/80 hover:bg-slate-800/90 hover:border-slate-600"
                        : "opacity-30 bg-slate-800/30 border-slate-800"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-medium border flex items-center gap-1.5 ${badge.bg}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                        {badge.label}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {node.database_name}
                      </span>
                    </div>
                    <div className="font-semibold text-white text-sm flex items-center gap-2">
                      <Database className="w-4 h-4 text-blue-400" />
                      {node.label}
                    </div>
                    {node.columns && node.columns.length > 0 && (
                      <div className="mt-2.5 flex flex-wrap gap-1">
                        {node.columns.map((col, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] bg-slate-900/80 text-slate-300 px-1.5 py-0.5 rounded font-mono border border-slate-700/50"
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
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2 mb-1">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                Transformação & Filtro
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
                    className={`cursor-pointer rounded-xl border p-4 transition-all duration-200 relative group ${
                      isSelected
                        ? "bg-slate-800/95 border-purple-500 shadow-lg shadow-purple-500/20 ring-2 ring-purple-500/40"
                        : matches
                        ? "bg-slate-800/60 border-slate-700/80 hover:bg-slate-800/90 hover:border-purple-500/40"
                        : "opacity-30 bg-slate-800/30 border-slate-800"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-purple-500/10 border border-purple-500/30 text-purple-300 flex items-center gap-1">
                        <Filter className="w-3 h-3 text-purple-400" />
                        {meta.transformation_type || "Filtro"}
                      </span>
                      <span className="text-[11px] text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Sucesso
                      </span>
                    </div>
                    <div className="font-semibold text-white text-sm mb-1 line-clamp-1">
                      {node.label}
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-400 mt-2 pt-2 border-t border-slate-700/50">
                      <span>{meta.rows_transferred?.toLocaleString() || 0} linhas</span>
                      <span>{meta.duration_ms || 0} ms</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Coluna 2: Destinos */}
            <div className="flex-1 flex flex-col gap-5">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2 mb-1">
                <Layers className="w-3.5 h-3.5 text-emerald-400" />
                Destino (Sinks)
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
                    className={`cursor-pointer rounded-xl border p-4 transition-all duration-200 relative group ${
                      isSelected
                        ? "bg-slate-800/95 border-emerald-500 shadow-lg shadow-emerald-500/20 ring-2 ring-emerald-500/40"
                        : matches
                        ? "bg-slate-800/60 border-slate-700/80 hover:bg-slate-800/90 hover:border-slate-600"
                        : "opacity-30 bg-slate-800/30 border-slate-800"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-medium border flex items-center gap-1.5 ${badge.bg}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                        {badge.label}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {node.database_name}
                      </span>
                    </div>
                    <div className="font-semibold text-white text-sm flex items-center gap-2">
                      <Layers className="w-4 h-4 text-emerald-400" />
                      {node.label}
                    </div>
                    {node.columns && node.columns.length > 0 && (
                      <div className="mt-2.5 flex flex-wrap gap-1">
                        {node.columns.map((col, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] bg-slate-900/80 text-slate-300 px-1.5 py-0.5 rounded font-mono border border-slate-700/50"
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
      <div className="w-full xl:w-96 bg-slate-950 border-t xl:border-t-0 xl:border-l border-slate-800 p-6 flex flex-col justify-between overflow-y-auto">
        {selectedNode ? (
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">
                  {selectedNode.type === "table" ? "Entidade de Dados" : "Transformação / Pipeline"}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  Nível {selectedNode.level}
                </span>
              </div>
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                {selectedNode.type === "table" ? (
                  <Database className="w-5 h-5 text-indigo-400" />
                ) : (
                  <Sparkles className="w-5 h-5 text-purple-400" />
                )}
                {selectedNode.label}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                {selectedNode.database_name}
              </p>
            </div>

            {selectedNode.type === "transformation" ? (
              <div className="space-y-4">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-purple-400 flex items-center gap-1.5">
                      <Code2 className="w-3.5 h-3.5" />
                      Consulta / Regra Aplicada
                    </span>
                    {selectedNode.metadata?.query && (
                      <button
                        onClick={() => handleCopy(selectedNode.metadata?.query || "")}
                        className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1"
                      >
                        {copiedQuery ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" /> Copiado
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" /> Copiar SQL
                          </>
                        )}
                      </button>
                    )}
                  </div>
                  <pre className="text-xs text-slate-300 font-mono bg-slate-950 p-3 rounded-lg overflow-x-auto border border-slate-800 max-h-48 leading-relaxed whitespace-pre-wrap">
                    {selectedNode.metadata?.query || selectedNode.metadata?.rule || "Transferência direta sem transformação de consulta."}
                  </pre>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl">
                    <span className="text-slate-400 block mb-1">Volume Transferido</span>
                    <span className="text-base font-bold text-white">
                      {selectedNode.metadata?.rows_transferred?.toLocaleString() || 0} lins
                    </span>
                  </div>
                  <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl">
                    <span className="text-slate-400 block mb-1">Latência Total</span>
                    <span className="text-base font-bold text-white">
                      {selectedNode.metadata?.duration_ms || 0} ms
                    </span>
                  </div>
                </div>

                {selectedNode.metadata?.created_at && (
                  <div className="text-xs text-slate-400 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    Executado em: {new Date(selectedNode.metadata.created_at).toLocaleString()}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                  <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2.5">
                    Colunas Mapeadas na Linhagem
                  </h4>
                  {selectedNode.columns && selectedNode.columns.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {selectedNode.columns.map((c, i) => (
                        <span
                          key={i}
                          className="text-xs bg-slate-800 text-slate-200 px-2.5 py-1 rounded-md font-mono border border-slate-700"
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500">Mapeamento dinâmico de todas as colunas.</p>
                  )}
                </div>

                {onAnalyzeImpact && selectedNode.table_name && (
                  <button
                    onClick={() =>
                      onAnalyzeImpact(selectedNode.table_name!, selectedNode.connection_id)
                    }
                    className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-md shadow-indigo-600/30"
                  >
                    <ShieldAlert className="w-4 h-4" />
                    Analisar Impacto Upstream/Downstream
                  </button>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
            <Info className="w-10 h-10 text-slate-600 mb-3" />
            <h4 className="text-sm font-semibold text-slate-300 mb-1">
              Selecione um Nó ou Fluxo
            </h4>
            <p className="text-xs text-slate-500 max-w-xs">
              Clique em qualquer tabela ou caixa de transformação para inspecionar os detalhes da consulta, colunas e impacto.
            </p>
          </div>
        )}

        <div className="pt-4 border-t border-slate-800/80 text-[11px] text-slate-500 flex items-center justify-between">
          <span>MustaInf Data Flow Engine</span>
          <span className="flex items-center gap-1 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            DAG Ativo
          </span>
        </div>
      </div>
    </div>
  );
}

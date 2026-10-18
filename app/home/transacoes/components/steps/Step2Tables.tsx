"use client";

import React, { useState, useMemo, Dispatch, SetStateAction, useEffect, useRef, useCallback } from "react";
import {
  Table,
  CheckCircle2,
  Database,
  Search,
  CheckSquare,
  Square,
  RefreshCw,
  Loader2,
  Sparkles,
} from "lucide-react";
import type { DBConnection, DBStructure } from "@/types/db-structure";
import { JoinSelect } from "@/app/component/BuildQueryComponent/JoinSelect";
import { Step2QueryTables } from "../transacao_query_component";
import api from "@/context/axioCuston";
import type { ResponseWrapper } from "@/app/services/metadata_DB";
import { getDatabaseIcon } from "./utils";
import type { TableMapping } from "@/app/task/types/transfer-types";

interface Step2TablesProps {
  sourceConnection?: DBConnection;
  setSourceConnection: Dispatch<SetStateAction<DBConnection | undefined>>;
  setTargetConnection: Dispatch<SetStateAction<DBConnection | undefined>>;
  targetConnection?: DBConnection;
  selectedTables: Record<string, string>; // { sourceTableId: targetTableId }
  setSelectedTables: Dispatch<SetStateAction<Record<string, string>>>;
  tableMappings?: Record<string, TableMapping>;
  setTableMappings?: Dispatch<SetStateAction<Record<string, TableMapping>>>;
  onSelectAll: (all: Record<string, string>) => void;
  onClearSelection: () => void;
}

function safeArray<T>(v: unknown): T[] | null {
  return Array.isArray(v) ? (v as T[]) : null;
}

export const Step2Tables: React.FC<Step2TablesProps> = ({
  setSourceConnection,
  setTargetConnection,
  sourceConnection,
  targetConnection,
  selectedTables,
  setSelectedTables,
  tableMappings = {},
  setTableMappings,
  onSelectAll,
  onClearSelection,
}) => {
  const [searchTable, setSearchTable] = useState("");
  const [useQueryMode, setUseQueryMode] = useState(false);
  const [isLoadingStructures, setIsLoadingStructures] = useState(false);
  const [editingFilterTableId, setEditingFilterTableId] = useState<string | null>(null);
  const [tempWhereClause, setTempWhereClause] = useState<string>("");

  // Guards anti-race condition
  const reqTokenRef = useRef<{ src?: string; tgt?: string }>({});

  const srcId = sourceConnection?.id;
  const tgtId = targetConnection?.id;

  const srcHasStructures = !!sourceConnection?.structures?.length;
  const tgtHasStructures = !!targetConnection?.structures?.length;

  const fetchStructures = useCallback(async () => {
    if (!srcId && !tgtId) return;

    const needsSource = !srcHasStructures;
    const needsTarget = !tgtHasStructures;

    if (!needsSource && !needsTarget) return;

    setIsLoadingStructures(true);
    const controller = new AbortController();

    const makeToken = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const srcToken = needsSource ? makeToken() : undefined;
    const tgtToken = needsTarget ? makeToken() : undefined;

    if (srcToken) reqTokenRef.current.src = srcToken;
    if (tgtToken) reqTokenRef.current.tgt = tgtToken;

    async function fetchOne(connectionId: number) {
      return api.get<ResponseWrapper<DBStructure[]>>(`/consu/all/structures/${connectionId}`, {
        timeout: 20000,
        signal: controller.signal,
      });
    }

    try {
      const [srcRes, tgtRes] = await Promise.allSettled([
        needsSource && srcId ? fetchOne(srcId) : Promise.resolve(null),
        needsTarget && tgtId ? fetchOne(tgtId) : Promise.resolve(null),
      ]);

      if (needsSource && srcRes.status === "fulfilled" && srcRes.value) {
        if (!srcToken || reqTokenRef.current.src === srcToken) {
          const data = safeArray<DBStructure>(srcRes.value?.data?.data);
          if (data && data.length) {
            setSourceConnection((prev) => {
              if (!prev || prev.structures?.length) return prev;
              return { ...prev, structures: data };
            });
          }
        }
      }

      if (needsTarget && tgtRes.status === "fulfilled" && tgtRes.value) {
        if (!tgtToken || reqTokenRef.current.tgt === tgtToken) {
          const data = safeArray<DBStructure>(tgtRes.value?.data?.data);
          if (data && data.length) {
            setTargetConnection((prev) => {
              if (!prev || prev.structures?.length) return prev;
              return { ...prev, structures: data };
            });
          }
        }
      }
    } catch (err) {
      console.error("Erro ao carregar estruturas:", err);
    } finally {
      setIsLoadingStructures(false);
    }

    return () => controller.abort();
  }, [srcId, tgtId, srcHasStructures, tgtHasStructures, setSourceConnection, setTargetConnection]);

  useEffect(() => {
    fetchStructures();
  }, [fetchStructures]);

  // Mapa de destino: nome da tabela -> ID da tabela no destino (para auto-mapear se já existir)
  const targetTableMap = useMemo(() => {
    const map = new Map<string, string>();
    targetConnection?.structures?.forEach((t) => {
      map.set(t.table_name.toLowerCase(), String(t.id));
    });
    return map;
  }, [targetConnection?.structures]);

  // Alternar seleção de tabela
  const toggleTable = useCallback(
    (sourceId: string, tableName: string) => {
      setSelectedTables((prev) => {
        if (prev[sourceId] !== undefined) {
          const { [sourceId]: _, ...rest } = prev;
          return rest;
        }

        // Tenta sugerir o ID da tabela de destino se já existir, ou vazio se for criar nova
        const suggestedTargetId = targetTableMap.get(tableName.toLowerCase()) || "";
        return { ...prev, [sourceId]: suggestedTargetId };
      });
    },
    [setSelectedTables, targetTableMap]
  );

  // Mapear tabela para outra existente no destino
  const handleMappingChange = useCallback(
    (sourceId: string, targetTableId: string) => {
      setSelectedTables((prev) => ({ ...prev, [sourceId]: targetTableId }));
    },
    [setSelectedTables]
  );

  // Tabelas de origem filtradas pela pesquisa
  const filteredTables = useMemo(() => {
    const structures = sourceConnection?.structures || [];
    const term = searchTable.trim().toLowerCase();
    if (!term) return structures;
    return structures.filter((table) => table.table_name.toLowerCase().includes(term));
  }, [searchTable, sourceConnection?.structures]);

  // Selecionar todas as tabelas visíveis
  const handleSelectAllVisible = useCallback(() => {
    const all: Record<string, string> = { ...selectedTables };
    filteredTables.forEach((table) => {
      const sId = String(table.id);
      if (all[sId] === undefined) {
        all[sId] = targetTableMap.get(table.table_name.toLowerCase()) || "";
      }
    });
    setSelectedTables(all);
  }, [filteredTables, selectedTables, targetTableMap, setSelectedTables]);

  // Desmarcar todas as tabelas visíveis
  const handleDeselectAllVisible = useCallback(() => {
    const next = { ...selectedTables };
    filteredTables.forEach((table) => {
      delete next[String(table.id)];
    });
    setSelectedTables(next);
  }, [filteredTables, selectedTables, setSelectedTables]);

  // Modo alternativo de consulta personalizada
  if (useQueryMode) {
    return (
      <Step2QueryTables
        sourceConnection={sourceConnection}
        targetConnection={targetConnection}
        selectedTables={selectedTables}
        setSelectedTables={setSelectedTables}
        tableMappings={tableMappings}
        setTableMappings={setTableMappings}
        onSelectAll={onSelectAll}
        onClearSelection={onClearSelection}
        listTarget={targetTableMap}
        onCloseQueryMode={() => setUseQueryMode(false)}
      />
    );
  }

  const totalSourceTables = sourceConnection?.structures?.length || 0;
  const selectedCount = Object.keys(selectedTables).length;

  return (
    <div className="space-y-6">
      {/* Cabeçalho explicativo e contadores */}
      <div className="bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-white rounded-2xl p-5 border border-blue-100 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs flex-shrink-0">
              <Table className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-gray-900">
                Selecione as Tabelas para Transferir
              </h3>
              <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                Escolha as coleções ou tabelas da origem que serão migradas para o destino.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-gray-200 shadow-2xs">
              <CheckCircle2 className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-semibold text-gray-800">
                {selectedCount} de {totalSourceTables} selecionadas
              </span>
            </div>

            <button
              onClick={() => setUseQueryMode(true)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200 rounded-xl hover:bg-purple-100 transition-colors"
              title="Modo avançado de query SQL"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Query Personalizada</span>
            </button>
          </div>
        </div>
      </div>

      {/* Barra de Ações e Filtro */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Campo de pesquisa */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Pesquisar tabela por nome..."
            value={searchTable}
            onChange={(e) => setSearchTable(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-2xs text-gray-900"
          />
        </div>

        {/* Botões de Ação Rápida */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleSelectAllVisible}
            disabled={filteredTables.length === 0}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-2xs"
          >
            <CheckSquare className="w-3.5 h-3.5" />
            <span>Selecionar Todas</span>
          </button>

          <button
            type="button"
            onClick={handleDeselectAllVisible}
            disabled={selectedCount === 0}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 border border-gray-200 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-2xs"
          >
            <Square className="w-3.5 h-3.5" />
            <span>Limpar Seleção</span>
          </button>

          <button
            type="button"
            onClick={() => fetchStructures()}
            disabled={isLoadingStructures}
            className="p-2 text-gray-500 hover:text-gray-800 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors shadow-2xs"
            title="Recarregar estruturas"
          >
            <RefreshCw className={`w-4 h-4 ${isLoadingStructures ? "animate-spin text-blue-600" : ""}`} />
          </button>
        </div>
      </div>

      {/* Lista de Tabelas em Cards Modernos */}
      {isLoadingStructures && totalSourceTables === 0 ? (
        <div className="text-center py-16 bg-white border border-gray-100 rounded-2xl shadow-xs">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
          <p className="text-sm font-semibold text-gray-700">Carregando tabelas e coleções do banco...</p>
          <p className="text-xs text-gray-400 mt-1">Conectando a {sourceConnection?.name}...</p>
        </div>
      ) : filteredTables.length > 0 ? (
        <div className="max-h-[500px] overflow-y-auto pr-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {filteredTables.map((table) => {
              const tableId = String(table.id);
              const isSelected = tableId in selectedTables;
              const hasMatchingTarget = targetTableMap.has(table.table_name.toLowerCase());
              const currentTargetId = selectedTables[tableId];

              return (
                <div
                  key={table.id}
                  className={`p-4 rounded-2xl border-2 transition-all relative ${
                    isSelected
                      ? "bg-blue-50/70 border-blue-400 shadow-sm"
                      : "bg-white border-gray-200 hover:border-gray-300 hover:shadow-xs"
                  }`}
                >
                  <div
                    className="flex items-start gap-3 cursor-pointer select-none"
                    onClick={() => toggleTable(tableId, table.table_name)}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleTable(tableId, table.table_name)}
                      className="w-5 h-5 mt-0.5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold font-mono text-gray-900 truncate">
                          {table.table_name}
                        </span>
                        {isSelected && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">
                            Selecionada
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mt-1.5 text-xs text-gray-500">
                        <span>{table.fields?.length ?? 0} campos detectados</span>
                        <span>•</span>
                        <span className={hasMatchingTarget ? "text-emerald-600 font-medium" : "text-gray-400"}>
                          {hasMatchingTarget ? "Tabela existe no destino" : "Nova tabela no destino"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Seletor de Tabela de Destino quando a tabela estiver selecionada */}
                  {isSelected && targetConnection && (
                    <div className="mt-3.5 pt-3 border-t border-blue-200/80 space-y-2.5">
                      <div>
                        <label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5 mb-1.5">
                          <Database className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Destino em {targetConnection.name}:</span>
                        </label>

                        {targetTableMap.size > 0 ? (
                          <JoinSelect
                            options={targetTableMap}
                            value={currentTargetId || ""}
                            onChange={(value) => handleMappingChange(tableId, value)}
                          />
                        ) : (
                          <div className="text-xs text-gray-600 bg-white/80 p-2.5 rounded-xl border border-gray-200 font-mono">
                            Será criada como: <strong className="text-blue-700">{table.table_name}</strong>
                          </div>
                        )}
                      </div>

                      {/* Exibição de Query ou Filtro Ativo */}
                      {tableMappings?.[tableId]?.custom_query ? (
                        <div className="p-2.5 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-between gap-2 text-xs">
                          <div className="min-w-0 flex-1">
                            <span className="font-bold text-purple-900 block text-[10px] uppercase tracking-wider">
                              ⚡ Query Personalizada Ativa
                            </span>
                            <span className="font-mono text-purple-700 truncate block text-[11px]">
                              {tableMappings[tableId].custom_query}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setUseQueryMode(true)}
                            className="px-2 py-1 text-[11px] font-semibold text-purple-800 hover:bg-purple-100 rounded-lg transition-colors flex-shrink-0"
                          >
                            Editar
                          </button>
                        </div>
                      ) : tableMappings?.[tableId]?.where_clause ? (
                        <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between gap-2 text-xs">
                          <div className="min-w-0 flex-1">
                            <span className="font-bold text-amber-900 block text-[10px] uppercase tracking-wider">
                              🔍 Filtro WHERE Ativo
                            </span>
                            <span className="font-mono text-amber-800 truncate block text-[11px]">
                              WHERE {tableMappings[tableId].where_clause}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingFilterTableId(tableId);
                              setTempWhereClause(tableMappings[tableId].where_clause || "");
                            }}
                            className="px-2 py-1 text-[11px] font-semibold text-amber-800 hover:bg-amber-100 rounded-lg transition-colors flex-shrink-0"
                          >
                            Alterar
                          </button>
                        </div>
                      ) : null}

                      {/* Editor Rápido de Filtro WHERE */}
                      {editingFilterTableId === tableId ? (
                        <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-200 text-xs space-y-2">
                          <label className="font-bold text-blue-900 block text-[11px]">
                            Condição WHERE (SQL para filtrar registros):
                          </label>
                          <input
                            type="text"
                            value={tempWhereClause}
                            onChange={(e) => setTempWhereClause(e.target.value)}
                            placeholder="ex: ativo = 1 AND created_at >= '2026-01-01'"
                            className="w-full p-2 bg-white border border-gray-300 rounded-lg font-mono text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            autoFocus
                          />
                          <div className="flex items-center justify-between pt-1">
                            <button
                              type="button"
                              onClick={() => setUseQueryMode(true)}
                              className="text-[11px] text-purple-700 hover:text-purple-900 font-semibold underline"
                            >
                              Abrir no Editor SQL Completo →
                            </button>

                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => setEditingFilterTableId(null)}
                                className="px-2.5 py-1 text-gray-600 hover:bg-gray-100 rounded-lg text-[11px]"
                              >
                                Cancelar
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (setTableMappings) {
                                    setTableMappings((prev) => {
                                      const existing = prev[tableId] || {
                                        tabela_name_origem: table.table_name,
                                        tabela_name_destino: table.table_name,
                                        id_tabela_origen: table.id,
                                        id_tabela_destino: Number(currentTargetId) || 0,
                                        colunas_relacionados_para_transacao: [],
                                      };
                                      return {
                                        ...prev,
                                        [tableId]: {
                                          ...existing,
                                          where_clause: tempWhereClause.trim() || undefined,
                                        },
                                      };
                                    });
                                  }
                                  setEditingFilterTableId(null);
                                }}
                                className="px-3 py-1 bg-blue-600 text-white rounded-lg text-[11px] font-bold hover:bg-blue-700 shadow-2xs"
                              >
                                Salvar Filtro
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between pt-1 text-[11px]">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingFilterTableId(tableId);
                              setTempWhereClause(tableMappings?.[tableId]?.where_clause || "");
                            }}
                            className="text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 transition-colors"
                          >
                            <Sparkles className="w-3 h-3" />
                            <span>
                              {tableMappings?.[tableId]?.where_clause ? "Editar Filtro" : "+ Filtro WHERE"}
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setUseQueryMode(true)}
                            className="text-purple-600 hover:text-purple-800 font-medium flex items-center gap-1 transition-colors"
                          >
                            <span>Query SQL Completa</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="text-center py-16 bg-white border border-gray-100 rounded-2xl shadow-xs">
          <Table className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h4 className="text-sm font-semibold text-gray-700">Nenhuma tabela encontrada</h4>
          <p className="text-xs text-gray-400 mt-1">
            {searchTable
              ? `Nenhum resultado para "${searchTable}". Tente outro termo.`
              : "Não foram encontradas estruturas na conexão selecionada."}
          </p>
        </div>
      )}
    </div>
  );
};
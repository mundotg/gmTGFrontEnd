"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
  Dispatch,
  SetStateAction,
} from "react";
import {
  Columns,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Search,
  CheckSquare,
  Square,
  Sparkles,
  RefreshCw,
} from "lucide-react";

import type { DBConnection, DBStructure } from "@/types/db-structure";
import type { ColumnMapping, TableMapping } from "@/app/task/types/transfer-types";

import { useFetchColumns } from "./utils/useFetchFields";
import { TableMappingCard } from "./component/TableMappingCard";
import { JoinSelect } from "@/app/component/BuildQueryComponent/JoinSelect";

interface Step3MappingProps {
  setSourceConnection: Dispatch<SetStateAction<DBConnection | undefined>>;
  setTargetConnection: Dispatch<SetStateAction<DBConnection | undefined>>;
  sourceConnection?: DBConnection;
  targetConnection?: DBConnection;
  selectedTables: Record<string, string>; // { sourceTableId: targetTableId }
  tableMappings: Record<string, TableMapping>;
  onTableMappingsChange: (mappings: Record<string, TableMapping>) => void;
}

const norm = (s: string) => (s ?? "").trim().toLowerCase();

export const Step3Mapping: React.FC<Step3MappingProps> = ({
  setSourceConnection,
  setTargetConnection,
  sourceConnection,
  targetConnection,
  selectedTables,
  tableMappings,
  onTableMappingsChange,
}) => {
  // --- UI States ---
  const [searchTable, setSearchTable] = useState("");
  const [expandedTables, setExpandedTables] = useState<Set<string>>(() => {
    // Abre todas por padrão se forem até 4 tabelas para conveniência
    const ids = Object.keys(selectedTables ?? {});
    return ids.length <= 4 ? new Set(ids) : new Set();
  });
  const [isLoading, setIsLoading] = useState(false);

  // --- 0) Índices memoizados ---
  const srcById = useMemo(() => {
    const m = new Map<string, DBStructure>();
    sourceConnection?.structures?.forEach((t) => m.set(String(t.id), t));
    return m;
  }, [sourceConnection?.structures]);

  const tgtById = useMemo(() => {
    const m = new Map<string, DBStructure>();
    targetConnection?.structures?.forEach((t) => m.set(String(t.id), t));
    return m;
  }, [targetConnection?.structures]);

  const getStructureById = useCallback(
    (connSide: "src" | "tgt", id: string): DBStructure | undefined => {
      return connSide === "src" ? srcById.get(String(id)) : tgtById.get(String(id));
    },
    [srcById, tgtById]
  );

  // --- 1) Hook de Sincronização de campos de tabela ---
  useFetchColumns({
    selectedTables,
    sourceConnection,
    targetConnection,
    setSourceConnection,
    setTargetConnection,
    tableMappings,
    onTableMappingsChange,
    setIsLoading,
  });

  // --- 2) Auto-Mapping (COM ENABLED: TRUE POR PADRÃO!) ---
  useEffect(() => {
    if (!Object.keys(selectedTables ?? {}).length || !sourceConnection?.structures?.length) {
      return;
    }

    let changed = false;
    const next: Record<string, TableMapping> = { ...tableMappings };

    for (const [sourceId, targetId] of Object.entries(selectedTables)) {
      const current = next[sourceId];
      // Se já tem colunas geradas, preserva
      if (current && (current.colunas_relacionados_para_transacao?.length ?? 0) > 0) continue;

      const srcStruct = getStructureById("src", sourceId);
      const tgtStruct = targetId ? getStructureById("tgt", targetId) : undefined;

      const srcFields = srcStruct?.fields ?? [];
      if (!srcFields.length) continue;

      const tgtFields = tgtStruct?.fields ?? [];
      const tgtByName = new Map(tgtFields.map((f) => [norm(f.name), f]));

      const cols: ColumnMapping[] = srcFields.map((sf) => {
        const sfName = norm(sf.name);

        // 1) Match exato por nome; 2) Fallback fuzzy
        const tf =
          tgtByName.get(sfName) ||
          (tgtFields.length
            ? tgtFields.find((x) => {
                const tn = norm(x.name);
                return tn && sfName && (tn === sfName || tn.includes(sfName) || sfName.includes(tn));
              })
            : undefined);

        return {
          coluna_origen_name: sf.name,
          coluna_distino_name: tf?.name || sf.name,
          type_coluna_origem: sf.type || "VARCHAR",
          type_coluna_destino: tf?.type || sf.type || "VARCHAR",
          id_coluna_origem: sf.id,
          id_coluna_destino: tf?.id || 0,
          enabled: true, // ✅ Ativado por padrão para o usuário não precisar clicar dezenas de vezes!
        };
      });

      if (cols.length) {
        next[sourceId] = {
          tabela_name_origem: srcStruct?.table_name || current?.tabela_name_origem || "",
          tabela_name_destino: tgtStruct?.table_name || current?.tabela_name_destino || srcStruct?.table_name || "",
          id_tabela_origen: srcStruct?.id || Number(sourceId),
          id_tabela_destino: tgtStruct?.id || (targetId ? Number(targetId) : 0),
          colunas_relacionados_para_transacao: cols,
        };
        changed = true;
      }
    }

    if (changed) {
      onTableMappingsChange(next);
    }
  }, [selectedTables, sourceConnection?.structures, tableMappings, onTableMappingsChange, getStructureById]);

  // --- 3) Ações Individuais e em Lote ---
  // Alternar checkbox de uma coluna
  const toggleColumnMapping = useCallback(
    (tableId: string, columnIndex: number) => {
      const current = tableMappings[tableId];
      if (!current) return;

      const cols = [...(current.colunas_relacionados_para_transacao ?? [])];
      if (!cols[columnIndex]) return;

      cols[columnIndex] = { ...cols[columnIndex], enabled: !cols[columnIndex].enabled };
      onTableMappingsChange({
        ...tableMappings,
        [tableId]: { ...current, colunas_relacionados_para_transacao: cols },
      });
    },
    [tableMappings, onTableMappingsChange]
  );

  // Ativar ou desativar todas as colunas de UMA tabela específica
  const setAllColumnsForTable = useCallback(
    (tableId: string, enabled: boolean) => {
      const current = tableMappings[tableId];
      if (!current) return;

      const cols = (current.colunas_relacionados_para_transacao ?? []).map((col) => ({
        ...col,
        enabled,
      }));

      onTableMappingsChange({
        ...tableMappings,
        [tableId]: { ...current, colunas_relacionados_para_transacao: cols },
      });
    },
    [tableMappings, onTableMappingsChange]
  );

  // Ativar ou desativar todas as colunas de TODAS as tabelas selecionadas
  const setAllColumnsGlobal = useCallback(
    (enabled: boolean) => {
      const next: Record<string, TableMapping> = {};
      for (const [tId, mapping] of Object.entries(tableMappings)) {
        const cols = (mapping.colunas_relacionados_para_transacao ?? []).map((col) => ({
          ...col,
          enabled,
        }));
        next[tId] = { ...mapping, colunas_relacionados_para_transacao: cols };
      }
      onTableMappingsChange(next);
    },
    [tableMappings, onTableMappingsChange]
  );

  // Atualizar mapeamento de coluna (alvo selecionado no dropdown ou digitado)
  const updateColumnMapping = useCallback(
    (
      tableId: string,
      columnIndex: number,
      targetFieldId: string,
      targetFieldName?: string,
      targetFieldType?: string
    ) => {
      const current = tableMappings[tableId];
      if (!current) return;

      const cols = [...(current.colunas_relacionados_para_transacao ?? [])];
      if (!cols[columnIndex]) return;

      const targetTableId = selectedTables[tableId];
      const targetStruct = targetTableId ? getStructureById("tgt", targetTableId) : undefined;
      const targetField = targetStruct?.fields?.find((f) => String(f.id) === String(targetFieldId));

      const finalName = targetFieldName || targetField?.name || cols[columnIndex].coluna_distino_name;
      const finalType = targetFieldType || targetField?.type || cols[columnIndex].type_coluna_destino;

      cols[columnIndex] = {
        ...cols[columnIndex],
        id_coluna_destino: targetField?.id || (Number(targetFieldId) || 0),
        coluna_distino_name: finalName,
        type_coluna_destino: finalType,
      };

      onTableMappingsChange({
        ...tableMappings,
        [tableId]: { ...current, colunas_relacionados_para_transacao: cols },
      });
    },
    [tableMappings, onTableMappingsChange, selectedTables, getStructureById]
  );

  // Expansão de cards
  const toggleTableExpansion = useCallback((tableId: string) => {
    setExpandedTables((prev) => {
      const next = new Set(prev);
      next.has(tableId) ? next.delete(tableId) : next.add(tableId);
      return next;
    });
  }, []);

  const expandAllTables = useCallback(() => {
    setExpandedTables(new Set(Object.keys(tableMappings)));
  }, [tableMappings]);

  const collapseAllTables = useCallback(() => {
    setExpandedTables(new Set());
  }, []);

  // --- 4) Métricas e Filtros ---
  const filteredTableMappings = useMemo(() => {
    const term = searchTable.trim().toLowerCase();
    const entries = Object.entries(tableMappings);

    if (!term) return entries;

    return entries.filter(
      ([, mapping]) =>
        mapping.tabela_name_origem.toLowerCase().includes(term) ||
        mapping.tabela_name_destino.toLowerCase().includes(term)
    );
  }, [tableMappings, searchTable]);

  const { totalColumns, enabledColumns } = useMemo(() => {
    return Object.values(tableMappings).reduce(
      (acc, mapping) => {
        const cols = mapping.colunas_relacionados_para_transacao ?? [];
        acc.totalColumns += cols.length;
        acc.enabledColumns += cols.filter((c) => c.enabled).length;
        return acc;
      },
      { totalColumns: 0, enabledColumns: 0 }
    );
  }, [tableMappings]);

  if (Object.keys(selectedTables).length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="bg-yellow-50 rounded-2xl p-4 mb-4 border border-yellow-200">
          <AlertCircle className="w-10 h-10 text-yellow-600" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-1">Nenhuma tabela selecionada</h3>
        <p className="text-gray-500 max-w-md text-xs sm:text-sm">
          Volte para o Passo 2 e selecione pelo menos uma tabela para configurar o mapeamento de campos.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Banner Didático */}
      <div className="bg-gradient-to-r from-blue-50/80 via-indigo-50/50 to-white rounded-2xl p-5 border border-blue-100 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs flex-shrink-0">
              <Columns className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-gray-900">
                Mapeamento Refinado de Colunas
              </h3>
              <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                {isLoading
                  ? "Sincronizando tipos e colunas com as bases de dados..."
                  : "Por padrão, todos os campos detectados estão ativos para migração. Desmarque o que não desejar transferir."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-center">
            <div className="flex items-center gap-2 bg-white rounded-xl px-4 py-2 border border-gray-200 shadow-2xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <div className="text-right">
                <div className="text-base font-bold text-gray-900 leading-tight">
                  {enabledColumns} / {totalColumns}
                </div>
                <div className="text-[11px] text-gray-500">colunas ativas</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Barra de Filtros e Ações Globais */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Pesquisa */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Pesquisar por tabela de origem ou destino..."
            value={searchTable}
            onChange={(e) => setSearchTable(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-2xs text-gray-900"
          />
        </div>

        {/* Botões de Ações Globais */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setAllColumnsGlobal(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition-colors shadow-2xs"
            title="Ativar todas as colunas de todas as tabelas"
          >
            <CheckSquare className="w-3.5 h-3.5" />
            <span>Ativar Todas</span>
          </button>

          <button
            type="button"
            onClick={() => setAllColumnsGlobal(false)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 border border-gray-200 rounded-xl transition-colors shadow-2xs"
            title="Desativar todas as colunas de todas as tabelas"
          >
            <Square className="w-3.5 h-3.5" />
            <span>Desativar Todas</span>
          </button>

          <div className="h-5 w-px bg-gray-300 mx-1 hidden sm:block" />

          <button
            type="button"
            onClick={expandAllTables}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl transition-colors shadow-2xs"
          >
            <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
            <span>Expandir Tudo</span>
          </button>

          <button
            type="button"
            onClick={collapseAllTables}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl transition-colors shadow-2xs"
          >
            <ChevronUp className="w-3.5 h-3.5 text-gray-500" />
            <span>Recolher Tudo</span>
          </button>
        </div>
      </div>

      {/* Lista de Cards de Mapeamento por Tabela */}
      <div className="space-y-4">
        {filteredTableMappings.map(([tableId, mapping]) => {
          const isExpanded = expandedTables.has(tableId);
          const targetTableId = selectedTables[tableId];
          const targetStruct = targetTableId ? getStructureById("tgt", targetTableId) : undefined;
          const targetCols = targetStruct?.fields ?? [];

          return (
            <TableMappingCard
              key={tableId}
              tableId={tableId}
              mapping={mapping}
              isExpanded={isExpanded}
              onToggleExpanded={toggleTableExpansion}
              targetColumns={targetCols}
              isLoading={isLoading}
              error={undefined}
              onToggleColumn={toggleColumnMapping}
              onSetAllColumnsEnabled={setAllColumnsForTable}
              onUpdateColumnMapping={updateColumnMapping}
              JoinSelect={JoinSelect}
            />
          );
        })}
      </div>

      {/* Empty State */}
      {filteredTableMappings.length === 0 && (
        <div className="text-center py-16 bg-white border border-gray-100 rounded-2xl shadow-xs">
          <Columns className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h4 className="text-sm font-semibold text-gray-700">Nenhum mapeamento encontrado</h4>
          <p className="text-xs text-gray-400 mt-1">
            {searchTable
              ? `Nenhum resultado para "${searchTable}". Tente pesquisar outro termo.`
              : "Aguardando sincronização de estruturas..."}
          </p>
        </div>
      )}
    </div>
  );
};
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
  const [expandedTables, setExpandedTables] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);

  // --- 0) Índices memoizados ---
  const srcById = useMemo(() => {
    const m = new Map<string, DBStructure>();
    sourceConnection?.structures?.forEach(t => m.set(String(t.id), t));
    return m;
  }, [sourceConnection?.structures]);

  const tgtById = useMemo(() => {
    const m = new Map<string, DBStructure>();
    targetConnection?.structures?.forEach(t => m.set(String(t.id), t));
    return m;
  }, [targetConnection?.structures]);

  const getStructureById = useCallback(
    (connSide: "src" | "tgt", id: string): DBStructure | undefined => {
      return connSide === "src" ? srcById.get(String(id)) : tgtById.get(String(id));
    },
    [srcById, tgtById]
  );

  // --- 1) Hook de Sincronização ---
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

  // --- 2) Auto-Mapping ---
  useEffect(() => {
    if (isLoading || !Object.keys(selectedTables ?? {}).length || !sourceConnection?.structures?.length) {
      return;
    }

    let changed = false;
    const next: Record<string, TableMapping> = { ...tableMappings };

    for (const [sourceId, targetId] of Object.entries(selectedTables)) {
      const current = next[sourceId];
      if (!current || (current.colunas_relacionados_para_transacao?.length ?? 0) > 0) continue;

      const srcStruct = getStructureById("src", sourceId);
      const tgtStruct = targetId ? getStructureById("tgt", targetId) : undefined;

      const srcFields = srcStruct?.fields ?? [];
      if (!srcFields.length) continue;

      const tgtFields = tgtStruct?.fields ?? [];
      const tgtByName = new Map(tgtFields.map(f => [norm(f.name), f]));

      const cols: ColumnMapping[] = srcFields.map((sf) => {
        const sfName = norm(sf.name);

        // 1) match exato, 2) fallback fuzzy
        const tf = tgtByName.get(sfName) || (tgtFields.length ? tgtFields.find(x => {
          const tn = norm(x.name);
          return tn && sfName && (tn === sfName || tn.includes(sfName) || sfName.includes(tn));
        }) : undefined);

        return {
          coluna_origen_name: sf.name,
          coluna_distino_name: tf?.name || sf.name,
          type_coluna_origem: sf.type,
          type_coluna_destino: tf?.type || "",
          id_coluna_origem: sf.id,
          id_coluna_destino: tf?.id || 0,
          enabled: false,
        };
      });

      if (cols.length) {
        next[sourceId] = { ...current, colunas_relacionados_para_transacao: cols };
        changed = true;
      }
    }

    if (changed) onTableMappingsChange(next);
  }, [isLoading, selectedTables, sourceConnection?.structures?.length, tableMappings, onTableMappingsChange, getStructureById]);

  // --- 3) UI Actions ---
  const toggleColumnMapping = useCallback((tableId: string, columnIndex: number) => {
    const current = tableMappings[tableId];
    if (!current) return;

    const cols = [...(current.colunas_relacionados_para_transacao ?? [])];
    if (!cols[columnIndex]) return;

    cols[columnIndex] = { ...cols[columnIndex], enabled: !cols[columnIndex].enabled };
    onTableMappingsChange({ ...tableMappings, [tableId]: { ...current, colunas_relacionados_para_transacao: cols } });
  }, [tableMappings, onTableMappingsChange]);

  const updateColumnMapping = useCallback((tableId: string, columnIndex: number, targetFieldId: string) => {
    const current = tableMappings[tableId];
    if (!current) return;

    const cols = [...(current.colunas_relacionados_para_transacao ?? [])];
    if (!cols[columnIndex]) return;

    const targetTableId = selectedTables[tableId];
    const targetStruct = targetTableId ? getStructureById("tgt", targetTableId) : undefined;
    const targetField = targetStruct?.fields?.find((f) => String(f.id) === String(targetFieldId));

    if (!targetField) return;

    cols[columnIndex] = {
      ...cols[columnIndex],
      coluna_distino_name: targetField.name,
      id_coluna_destino: targetField.id,
      type_coluna_destino: targetField.type || "",
    };

    onTableMappingsChange({ ...tableMappings, [tableId]: { ...current, colunas_relacionados_para_transacao: cols } });
  }, [tableMappings, onTableMappingsChange, selectedTables, getStructureById]);

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

  // --- 4) Derived & Filters ---
  const filteredTableMappings = useMemo(() => {
    const term = searchTable.trim().toLowerCase();
    const entries = Object.entries(tableMappings);

    if (!term) return entries;

    return entries.filter(([, mapping]) =>
      mapping.tabela_name_origem.toLowerCase().includes(term) ||
      mapping.tabela_name_destino.toLowerCase().includes(term)
    );
  }, [tableMappings, searchTable]);

  const { totalColumns, enabledColumns } = useMemo(() => {
    return Object.values(tableMappings).reduce((acc, mapping) => {
      const cols = mapping.colunas_relacionados_para_transacao ?? [];
      acc.totalColumns += cols.length;
      acc.enabledColumns += cols.filter(c => c.enabled).length;
      return acc;
    }, { totalColumns: 0, enabledColumns: 0 });
  }, [tableMappings]);

  // Controles de estado para botões
  const hasTables = Object.keys(tableMappings).length > 0;
  const isControlsDisabled = isLoading || !hasTables;

  // --- Render ---
  if (Object.keys(selectedTables).length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="bg-yellow-50 rounded-full p-4 mb-4">
          <AlertCircle className="w-12 h-12 text-yellow-500" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Nenhuma tabela selecionada</h3>
        <p className="text-gray-600 max-w-md text-sm">
          Volte ao passo anterior e selecione pelo menos uma tabela para configurar o mapeamento.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-4 sm:p-6 border border-blue-100 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-white rounded-xl p-3 shadow-sm">
              <Columns className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Mapeamento de Colunas</h3>
              <p className="text-sm text-gray-600">
                {isLoading ? "Sincronizando metadados..." : "Ative e mapeie colunas por tabela"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-white rounded-xl px-4 py-3 shadow-sm">
            <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">{enabledColumns}</div>
              <div className="text-xs text-gray-500">de {totalColumns} colunas ativas</div>
            </div>
          </div>
        </div>
      </div>

      {/* Search + Actions */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Pesquisar tabela..."
            value={searchTable}
            onChange={(e) => setSearchTable(e.target.value)}
            disabled={isControlsDisabled}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed"
          />
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={expandAllTables}
            disabled={isControlsDisabled}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-50"
          >
            <ChevronDown className="w-4 h-4" />
            <span className="hidden sm:inline">Expandir tudo</span>
          </button>

          <button
            type="button"
            onClick={collapseAllTables}
            disabled={isControlsDisabled}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-gray-100"
          >
            <ChevronUp className="w-4 h-4" />
            <span className="hidden sm:inline">Recolher tudo</span>
          </button>
        </div>
      </div>

      {/* Cards */}
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
              onUpdateColumnMapping={updateColumnMapping}
              JoinSelect={JoinSelect}
            />
          );
        })}
      </div>

      {/* Empty State / Loading State */}
      {filteredTableMappings.length === 0 && (
        <div className="text-center py-12">
          <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">
            {isLoading
              ? "Carregando tabelas e mapeando colunas..."
              : !hasTables
                ? "Nenhuma tabela carregada."
                : `Nenhuma tabela encontrada com o termo "${searchTable}"`}
          </p>
        </div>
      )}
    </div>
  );
};
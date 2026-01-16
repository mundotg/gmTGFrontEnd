// components/steps/Step3Mapping.tsx
import { useState, useEffect, useCallback, useMemo } from "react";
import { Table, Columns, ArrowRight, CheckCircle2, AlertCircle, ChevronDown, ChevronUp, Search } from "lucide-react";
import type { DBConnection, DBField } from "@/types/db-structure";
import { ColumnMapping, TableMapping } from "@/app/task/types/transfer-types";
import { JoinSelect } from "@/app/component/BuildQueryComponent/JoinSelect";

interface Step3MappingProps {
  sourceConnection?: DBConnection;
  targetConnection?: DBConnection;
  selectedTables: Record<string, string>;
  tableMappings: Record<string, TableMapping>;
  onTableMappingsChange: (mappings: Record<string, TableMapping>) => void;
}

export const Step3Mapping: React.FC<Step3MappingProps> = ({
  sourceConnection,
  targetConnection,
  selectedTables,
  tableMappings,
  onTableMappingsChange,
}) => {
  const [searchTable, setSearchTable] = useState("");
  const [expandedTables, setExpandedTables] = useState<Set<string>>(new Set());
  const [targetColumn, setTargetColumn] = useState<Record<string, DBField[]>>({});

  // 🔁 Inicializa os mapeamentos das tabelas
  useEffect(() => {
    if (Object.keys(selectedTables).length === 0 || !sourceConnection?.structures) return;

    const newMappings: Record<string, TableMapping> = {};
    const newTargetColumns: Record<string, DBField[]> = {};

    Object.entries(selectedTables).forEach(([tableIdSource, tableIdTarget]) => {
      const sourceTable = sourceConnection.structures?.find(
        (t) => String(t.id) === tableIdSource
      );
      const targetTable = targetConnection?.structures?.find(
        (t) => String(t.id) === tableIdTarget
      );

      if (sourceTable && !tableMappings[tableIdSource]) {
        newMappings[tableIdSource] = {
          tabela_name_origem: sourceTable.table_name,
          tabela_name_destino: targetTable?.table_name || sourceTable.table_name,
          id_tabela_origen: sourceTable.id,
          id_tabela_destino: targetTable?.id || 0,
          colunas_relacionados_para_transacao:
            sourceTable.fields?.map((sourceField) => {
              const targetField = targetTable?.fields?.find(
                (tf) => tf.name.toLowerCase() === sourceField.name.toLowerCase() || tf.name.toLowerCase().includes(sourceField.name.toLowerCase())
              );
              return {
                coluna_origen_name: sourceField.name,
                coluna_distino_name: targetField?.name || sourceField.name,
                type_coluna_origem: sourceField.type,
                type_coluna_destino: targetField?.type || sourceField.type,
                id_coluna_origem: sourceField.id,
                id_coluna_destino: targetField?.id || 0,
                enabled: true,
              };
            }) || [],
        };
      }

      if (targetTable) {
        newTargetColumns[tableIdSource] = targetTable.fields || [];
      }
    });

    if (Object.keys(newMappings).length > 0) {
      onTableMappingsChange({ ...tableMappings, ...newMappings });
    }

    setTargetColumn((prev) => ({ ...prev, ...newTargetColumns }));
  }, [selectedTables, sourceConnection, targetConnection]);

  // 🧠 Atualiza colunas
  const toggleColumnMapping = useCallback(
    (tableId: string, columnIndex: number) => {
      const updatedMappings = { ...tableMappings };
      if (updatedMappings[tableId]) {
        const cols = updatedMappings[tableId].colunas_relacionados_para_transacao;
        cols[columnIndex].enabled = !cols[columnIndex].enabled;
        updatedMappings[tableId] = { ...updatedMappings[tableId], colunas_relacionados_para_transacao: [...cols] };
        onTableMappingsChange(updatedMappings);
      }
    },
    [tableMappings, onTableMappingsChange]
  );

  const updateColumnMapping = useCallback(
    (tableId: string, columnIndex: number, updatesFieldId: string) => {
      const updatedMappings = { ...tableMappings };
      if (updatedMappings[tableId]) {
        const cols = updatedMappings[tableId].colunas_relacionados_para_transacao;
        const columnInfoDistino = targetColumn[tableId].find(c => String(c.id) === updatesFieldId);
        const columnMapping: ColumnMapping = {
          coluna_distino_name: columnInfoDistino?.name || "",
          coluna_origen_name: cols[columnIndex].coluna_origen_name,
          enabled: cols[columnIndex].enabled,
          id_coluna_destino: columnInfoDistino?.id || 0,
          id_coluna_origem: cols[columnIndex].id_coluna_origem,
          type_coluna_destino: columnInfoDistino?.type || "",
          type_coluna_origem: cols[columnIndex].type_coluna_origem,
        };
        cols[columnIndex] = columnMapping;
        updatedMappings[tableId] = { ...updatedMappings[tableId], colunas_relacionados_para_transacao: [...cols] };
        onTableMappingsChange(updatedMappings);
      }
    },
    [tableMappings, onTableMappingsChange, targetColumn]
  );

  // 🧩 Expansão
  const toggleTableExpansion = useCallback(
    (tableId: string) => {
      setExpandedTables((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(tableId)) newSet.delete(tableId);
        else newSet.add(tableId);
        return newSet;
      });
    },
    []
  );

  const expandAllTables = useCallback(() => {
    setExpandedTables(new Set(Object.keys(tableMappings)));
  }, [tableMappings]);

  const collapseAllTables = useCallback(() => {
    setExpandedTables(new Set());
  }, []);

  // 🔍 Filtro de pesquisa
  const filteredTableMappings = Object.entries(tableMappings).filter(([, mapping]) => {
    
    if (!searchTable) return true;
    return (
      mapping.tabela_name_origem.toLowerCase().includes(searchTable.toLowerCase()) ||
      mapping.tabela_name_destino.toLowerCase().includes(searchTable.toLowerCase())
    );
  });

  // 📊 Estatísticas com useMemo
  const { totalColumns, enabledColumns } = useMemo(() => {
    let total = 0, enabled = 0;
    Object.values(tableMappings).forEach((mapping) => {
      total += mapping.colunas_relacionados_para_transacao.length;
      enabled += mapping.colunas_relacionados_para_transacao.filter((c) => c.enabled).length;
    });
    return { totalColumns: total, enabledColumns: enabled };
  }, [tableMappings]);

  if (!sourceConnection || Object.keys(selectedTables).length === 0) {
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

  // 🧱 Renderização principal
  return (
    <div className="space-y-6">
      {/* Header Card com estatísticas */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-4 sm:p-6 border border-blue-100 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-white rounded-xl p-3 shadow-sm">
              <Columns className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Mapeamento de Colunas</h3>
              <p className="text-sm text-gray-600">Configure as correspondências entre as tabelas</p>
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

      {/* Barra de controles */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Pesquisar tabela..."
            value={searchTable}
            onChange={(e) => setSearchTable(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>
        
        <div className="flex gap-2">
          <button 
            onClick={expandAllTables} 
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
          >
            <ChevronDown className="w-4 h-4" />
            <span className="hidden sm:inline">Expandir tudo</span>
          </button>
          <button 
            onClick={collapseAllTables} 
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <ChevronUp className="w-4 h-4" />
            <span className="hidden sm:inline">Recolher tudo</span>
          </button>
        </div>
      </div>

      {/* Lista de tabelas */}
      <div className="space-y-4">
        {filteredTableMappings.map(([tableId, mapping]) => {
          const isExpanded = expandedTables.has(tableId);
          const enabledCount = mapping.colunas_relacionados_para_transacao.filter(c => c.enabled).length;
          const totalCount = mapping.colunas_relacionados_para_transacao.length;
          
          return (
            <div 
              key={tableId} 
              className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden"
            >
              <button
                onClick={() => toggleTableExpansion(tableId)}
                className="w-full flex items-center justify-between px-4 sm:px-6 py-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <ArrowRight
                    className={`w-5 h-5 text-gray-400 transition-transform flex-shrink-0 ${
                      isExpanded ? "rotate-90" : ""
                    }`}
                  />
                  <Table className="w-5 h-5 text-blue-600 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-gray-800 text-left truncate">
                      {mapping.tabela_name_origem}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500 mt-0.5">
                      <span className="truncate">{mapping.tabela_name_destino}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 ml-4">
                  <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-green-50 rounded-lg">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                    <span className="text-xs font-medium text-green-700">
                      {enabledCount}/{totalCount}
                    </span>
                  </div>
                </div>
              </button>

              {isExpanded && (
                <div className="border-t border-gray-100">
                  {/* Versão Desktop */}
                  <div className="hidden lg:block overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-16">
                            Ativo
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Coluna Origem
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Coluna Destino
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Tipo Origem
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Tipo Destino
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {(mapping.colunas_relacionados_para_transacao ?? []).map((column, columnIndex) => (
                          <tr 
                            key={`${tableId}-${column.id_coluna_origem}`}
                            className={`hover:bg-gray-50 transition-colors ${!column.enabled ? 'opacity-50' : ''}`}
                          >
                            <td className="px-6 py-4">
                              <input
                                type="checkbox"
                                checked={column.enabled}
                                onChange={() => toggleColumnMapping(tableId, columnIndex)}
                                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                              />
                            </td>
                            <td className="px-6 py-4 font-medium text-gray-900">
                              {column.coluna_origen_name}column
                            </td>
                            <td className="px-6 py-4">
                              <JoinSelect
                                options={(targetColumn[tableId] ?? []).map((t) => ({
                                  label: `${t.name}${!t.is_nullable && "*"}`,
                                  value: String(t.id),
                                }))}
                                value={String(column.id_coluna_destino)}
                                onChange={(value) => updateColumnMapping(tableId, columnIndex, value)}
                              />
                            </td>
                            <td className="px-6 py-4">
                              <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-md text-xs font-medium">
                                {column.type_coluna_origem}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="px-2.5 py-1 bg-purple-50 text-purple-700 rounded-md text-xs font-medium">
                                {column.type_coluna_destino}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Versão Mobile/Tablet */}
                  <div className="lg:hidden divide-y divide-gray-100">
                    {(mapping.colunas_relacionados_para_transacao ?? []).map((column, columnIndex) => (
                      <div 
                        key={`${tableId}-${column.id_coluna_origem}`}
                        className={`p-4 space-y-3 ${!column.enabled ? 'opacity-50 bg-gray-50' : ''}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <input
                              type="checkbox"
                              checked={column.enabled}
                              onChange={() => toggleColumnMapping(tableId, columnIndex)}
                              className="mt-1 w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-2 focus:ring-blue-500 cursor-pointer flex-shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-gray-900 mb-1 break-words">
                                {column.coluna_origen_name}
                              </div>
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-medium">
                                  {column.type_coluna_origem}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-2 pl-7 text-blue-800">
                          <div className="text-xs text-gray-500 font-medium">COLUNA DESTINO</div>
                          <JoinSelect
                            options={(targetColumn[tableId] ?? []).map((t) => ({
                              label: `${t.name}${!t.is_nullable && "*"}`,
                              value: String(t.id),
                            }))}
                            value={String(column.id_coluna_destino)}
                            onChange={(value) => updateColumnMapping(tableId, columnIndex, value)}
                          />
                          <span className="inline-block px-2 py-0.5 bg-purple-50 text-purple-700 rounded text-xs font-medium">
                            {column.type_coluna_destino}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filteredTableMappings.length === 0 && (
        <div className="text-center py-12">
          <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Nenhuma tabela encontrada com o termo &ldquo;{searchTable}&rdquo;</p>
        </div>
      )}
    </div>
  );
};

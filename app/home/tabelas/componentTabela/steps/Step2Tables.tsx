"use client";
import { useState, useMemo, Dispatch, SetStateAction } from "react";
import { Table, CheckCircle2, Loader2, Database } from "lucide-react";
import type { DBConnection } from "@/types/db-structure";
import { JoinSelect } from "@/app/component/BuildQueryComponent/JoinSelect";
import { Option } from "@/app/task/components/select_Component";
import { Step2QueryTables } from "../transacao_query_component";

interface Step2TablesProps {
  sourceConnection?: DBConnection;
  targetConnection?: DBConnection;
  selectedTables: Record<string, string>;
  setSelectedTables: Dispatch<SetStateAction<Record<string, string>>>;
  onSelectAll: (all: Record<string, string>) => void;
  onClearSelection: () => void;
}

export const Step2Tables: React.FC<Step2TablesProps> = ({
  sourceConnection,
  targetConnection,
  selectedTables,
  setSelectedTables,
  onSelectAll,
  onClearSelection,
}) => {
  const [searchTable, setSearchTable] = useState("");
  const [optionsTarget, setOptionsTarget] = useState(false);

  // 🔹 Gerar lista de tabelas do banco de destino
  const listTarget = useMemo<Option[]>(
    () =>
      targetConnection?.structures?.map((t) => ({
        value: String(t.id),
        label: t.table_name,
      })) || [],
    [targetConnection]
  );

  // 🔹 Alternar seleção de uma tabela de origem
  const toggleTable = (tableIdSource: string, tabelaName: string) => {
    setSelectedTables((prev) => {
      const updated = { ...prev };
      if (updated[tableIdSource]) {
        delete updated[tableIdSource];
      } else {
        const target =
          targetConnection?.structures?.find(
            (str) =>
              str.table_name.toLowerCase() === tabelaName.toLowerCase()
          ) ||
          targetConnection?.structures?.find((str) =>
            str.table_name.toLowerCase().includes(tabelaName.toLowerCase())
          );

        updated[tableIdSource] = String(target?.id || "");
      }
      return updated;
    });
  };

  // 🔹 Atualizar tabela de destino mapeada
  const handleMappingChange = (sourceId: string, targetTable: string) => {
    setSelectedTables((prev) => ({
      ...prev,
      [sourceId]: targetTable,
    }));
  };

  // 🔹 Filtrar tabelas de origem
  const filteredTables = useMemo(() => {
    const structures = sourceConnection?.structures || [];
    if (!searchTable) return structures;
    return structures.filter((table) =>
      table.table_name.toLowerCase().includes(searchTable.toLowerCase())
    );
  }, [searchTable, sourceConnection?.structures]);

  // 🔹 Carregando
  if (!sourceConnection) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400 mr-2" />
        <span className="text-sm text-gray-500">Carregando tabelas...</span>
      </div>
    );
  }

  // 🔥 SE O USUÁRIO ATIVAR O MODO DE QUERY SELECT
  if (optionsTarget)
    return (
      <div className="space-y-4">
        <div className="flex justify-between">
          <h3 className="text-lg font-semibold">Query Select</h3>
          <button
            onClick={() => setOptionsTarget(false)}
            className="px-4 py-1.5 text-sm bg-gray-200 rounded-lg hover:bg-gray-300"
          >
            Voltar
          </button>
        </div>

        <Step2QueryTables
          sourceConnection={sourceConnection}
          targetConnection={targetConnection}
          selectedTables={selectedTables}
          setSelectedTables={setSelectedTables}
          onSelectAll={onSelectAll}
          onClearSelection={onClearSelection}
          listTarget={listTarget}
        />
      </div>
    );

  return (
    <div className="space-y-6">
      <div>
        {/* Cabeçalho */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Selecione as tabelas para transferir
          </h3>

          <button
            className="px-3 py-1.5 text-xs bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
            onClick={() => setOptionsTarget(true)}
          >
            🔄 Usar Query Select
          </button>
        </div>

        {/* Busca */}
        <input
          type="text"
          placeholder="🔍 Pesquisar tabelas..."
          value={searchTable}
          onChange={(e) => setSearchTable(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-amber-950"
        />

        {/* Lista */}
        <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
          {filteredTables.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4">
              {filteredTables.map((table) => {
                const tableId = String(table.id);
                const isSelected = tableId in selectedTables;

                return (
                  <div
                    key={table.id}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      isSelected
                        ? "bg-blue-50 border-blue-300 shadow-sm"
                        : "bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm"
                    }`}
                  >
                    <div
                      className="flex items-center gap-3 cursor-pointer"
                      onClick={() => toggleTable(tableId, table.table_name)}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        readOnly
                        className="w-5 h-5 text-blue-600 rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold font-mono text-gray-900 truncate flex items-center gap-2">
                          <Table className="w-4 h-4 text-gray-400" />
                          {table.table_name}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {table?.fields?.length || 0} campos
                        </div>
                      </div>
                      {isSelected && (
                        <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0" />
                      )}
                    </div>

                    {/* Mapeamento destino */}
                    {isSelected && targetConnection && (
                      <div className="mt-3 text-black">
                        <label className="text-xs font-medium text-gray-700 flex items-center gap-2">
                          <Database className="w-3.5 h-3.5 text-gray-500" />
                          Selecionar tabela de destino:
                        </label>

                        <JoinSelect
                          onChange={(value) =>
                            handleMappingChange(tableId, value)
                          }
                          options={listTarget}
                          value={selectedTables[tableId] || ""}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500 text-sm">
              {searchTable
                ? "Nenhuma tabela encontrada."
                : "Nenhuma tabela disponível."}
            </div>
          )}
        </div>

        {/* Rodapé */}
        <div className="flex justify-between items-center text-sm mt-4 px-1">
          <span className="text-gray-600 font-medium">
            {Object.keys(selectedTables).length} de{" "}
            {sourceConnection.structures?.length || 0} tabela(s) selecionada(s)
          </span>
        </div>
      </div>
    </div>
  );
};

import React from "react";
import { ArrowRight, Table, CheckCircle2 } from "lucide-react";
import { DBField } from "@/types/db-structure";
import { TableMapping } from "@/app/task/types/transfer-types";

type Props = {
  tableId: string;
  mapping: TableMapping;

  // UI state
  isExpanded: boolean;
  onToggleExpanded: (tableId: string) => void;

  // data state (somente colunas da tabela atual)
  targetColumns: DBField[]; // targetColumn[tableId] ?? []
  isLoading: boolean;
  error?: string;

  // actions
  onToggleColumn: (tableId: string, columnIndex: number) => void;
  onUpdateColumnMapping: (
    tableId: string,
    columnIndex: number,
    targetFieldId: string
  ) => void;

  // UI component injection
  JoinSelect: React.ComponentType<{
    options: { label: string; value: string }[];
    value: string;
    onChange: (value: string) => void;
  }>;
};

function buildJoinSelectOptions(
  targetColumns: DBField[],
  isLoading: boolean,
  error?: string
) {
  if (isLoading) return [{ label: "Carregando colunas...", value: "" }];
  if (error) return [{ label: `Erro: ${error}`, value: "" }];

  return (targetColumns ?? []).map((t) => ({
    label: `${t.name}${t.is_nullable === false ? "*" : ""}`,
    value: String(t.id),
  }));
}

export function TableMappingCard({
  tableId,
  mapping,
  isExpanded,
  onToggleExpanded,
  targetColumns,
  isLoading,
  error,
  onToggleColumn,
  onUpdateColumnMapping,
  JoinSelect,
}: Props) {
  const enabledCount =
    mapping.colunas_relacionados_para_transacao?.filter((c) => c.enabled).length ??
    0;
  const totalCount =
    mapping.colunas_relacionados_para_transacao?.length ?? 0;

  const options = React.useMemo(
    () => buildJoinSelectOptions(targetColumns ?? [], isLoading, error),
    [targetColumns, isLoading, error]
  );

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      <button
        type="button"
        onClick={() => onToggleExpanded(tableId)}
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
          {error && (
            <div className="px-6 py-3 text-sm text-red-700 bg-red-50 border-b border-red-100">
              Erro ao carregar colunas: {error}
            </div>
          )}

          {/* Desktop table */}
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
                {(mapping.colunas_relacionados_para_transacao ?? []).map(
                  (column, columnIndex) => (
                    <tr
                      key={`${tableId}-${column.id_coluna_origem}`}
                      className={`hover:bg-gray-50 transition-colors ${
                        !column.enabled ? "opacity-50" : ""
                      }`}
                    >
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={column.enabled}
                          onChange={() => onToggleColumn(tableId, columnIndex)}
                          className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                        />
                      </td>

                      <td className="px-6 py-4 font-medium text-gray-900">
                        {column.coluna_origen_name}
                      </td>

                      <td className="px-6 py-4">
                        <JoinSelect
                          options={options}
                          value={String(column.id_coluna_destino)}
                          onChange={(value) => {
                            if (!value) return;
                            onUpdateColumnMapping(tableId, columnIndex, value);
                          }}
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
                  )
                )}
              </tbody>
            </table>

            {totalCount === 0 && (
              <div className="px-6 py-5 text-sm text-gray-500">
                {isLoading
                  ? "Carregando colunas da tabela..."
                  : "Nenhuma coluna disponível (ou ainda não carregada)."}
              </div>
            )}
          </div>

          {/* Mobile cards */}
          <div className="lg:hidden divide-y divide-gray-100">
            {(mapping.colunas_relacionados_para_transacao ?? []).map(
              (column, columnIndex) => (
                <div
                  key={`${tableId}-${column.id_coluna_origem}`}
                  className={`p-4 space-y-3 ${
                    !column.enabled ? "opacity-50 bg-gray-50" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <input
                        type="checkbox"
                        checked={column.enabled}
                        onChange={() => onToggleColumn(tableId, columnIndex)}
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
                    <div className="text-xs text-gray-500 font-medium">
                      COLUNA DESTINO
                    </div>

                    <JoinSelect
                      options={options}
                      value={String(column.id_coluna_destino)}
                      onChange={(value) => {
                        if (!value) return;
                        onUpdateColumnMapping(tableId, columnIndex, value);
                      }}
                    />

                    <span className="inline-block px-2 py-0.5 bg-purple-50 text-purple-700 rounded text-xs font-medium">
                      {column.type_coluna_destino}
                    </span>
                  </div>
                </div>
              )
            )}

            {totalCount === 0 && (
              <div className="px-4 py-5 text-sm text-gray-500">
                {isLoading
                  ? "Carregando colunas da tabela..."
                  : "Nenhuma coluna disponível (ou ainda não carregada)."}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

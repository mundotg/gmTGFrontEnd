import React, { useMemo } from "react";
import {
  ArrowRight,
  Table as TableIcon,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CheckSquare,
  Square,
  Sparkles,
  Edit2,
} from "lucide-react";
import { DBField } from "@/types/db-structure";
import { TableMapping } from "@/app/task/types/transfer-types";

type Props = {
  tableId: string;
  mapping: TableMapping;

  // UI state
  isExpanded: boolean;
  onToggleExpanded: (tableId: string) => void;

  // data state
  targetColumns: DBField[];
  isLoading: boolean;
  error?: string;

  // actions
  onToggleColumn: (tableId: string, columnIndex: number) => void;
  onSetAllColumnsEnabled: (tableId: string, enabled: boolean) => void;
  onUpdateColumnMapping: (
    tableId: string,
    columnIndex: number,
    targetFieldId: string,
    targetFieldName?: string,
    targetFieldType?: string
  ) => void;

  // UI component injection
  JoinSelect: React.ComponentType<{
    options: { label: string; value: string }[];
    value: string;
    onChange: (value: string) => void;
  }>;
};

function buildJoinSelectOptions(targetColumns: DBField[], isLoading: boolean, error?: string) {
  if (isLoading) return [{ label: "Carregando colunas...", value: "" }];
  if (error) return [{ label: `Erro: ${error}`, value: "" }];

  return (targetColumns ?? []).map((t) => ({
    label: `${t.name}${t.is_nullable === false ? " *" : ""} (${t.type || "dado"})`,
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
  onSetAllColumnsEnabled,
  onUpdateColumnMapping,
  JoinSelect,
}: Props) {
  const columns = mapping.colunas_relacionados_para_transacao ?? [];
  const enabledCount = columns.filter((c) => c.enabled).length;
  const totalCount = columns.length;

  const selectOptions = useMemo(
    () => buildJoinSelectOptions(targetColumns ?? [], isLoading, error),
    [targetColumns, isLoading, error]
  );

  const hasTargetCols = targetColumns && targetColumns.length > 0;
  const isRenamedTable = mapping.tabela_name_origem !== mapping.tabela_name_destino;

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-2xs hover:shadow-xs transition-all overflow-hidden">
      {/* Cabeçalho do Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between px-5 py-4 bg-gray-50/50 hover:bg-gray-50 border-b border-gray-100 transition-colors gap-3">
        {/* Lado Esquerdo: Expansão + Nome da Tabela */}
        <div
          onClick={() => onToggleExpanded(tableId)}
          className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer select-none"
        >
          <button
            type="button"
            className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-200/60 transition-colors"
          >
            {isExpanded ? (
              <ChevronDown className="w-5 h-5 text-blue-600" />
            ) : (
              <ChevronRight className="w-5 h-5" />
            )}
          </button>

          <div className="w-9 h-9 rounded-xl bg-blue-100/80 text-blue-700 flex items-center justify-center flex-shrink-0">
            <TableIcon className="w-4 h-4" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-gray-900 font-mono text-sm sm:text-base">
                {mapping.tabela_name_origem}
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
              <span
                className={`font-bold font-mono text-sm sm:text-base ${
                  isRenamedTable ? "text-purple-700" : "text-emerald-700"
                }`}
              >
                {mapping.tabela_name_destino}
              </span>
              {mapping.custom_query && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700 border border-purple-200">
                  ⚡ Query Personalizada
                </span>
              )}
              {mapping.where_clause && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 border border-amber-200">
                  🔍 WHERE: {mapping.where_clause}
                </span>
              )}
            </div>
            <div className="text-xs text-gray-500 mt-0.5">
              {hasTargetCols
                ? `Mapeando para tabela existente no destino (${targetColumns.length} colunas disponíveis)`
                : "Tabela nova no destino / Documento flexível"}
            </div>
          </div>
        </div>

        {/* Lado Direito: Ações rápidas e contador */}
        <div className="flex items-center gap-2.5 flex-wrap self-end sm:self-center">
          {/* Botões Ativar/Desativar todas nesta tabela */}
          <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl p-1 shadow-2xs">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSetAllColumnsEnabled(tableId, true);
              }}
              title="Ativar todas as colunas desta tabela"
              className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <CheckSquare className="w-3 h-3" />
              <span>Ativar Todas</span>
            </button>
            <div className="w-px h-3.5 bg-gray-200" />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSetAllColumnsEnabled(tableId, false);
              }}
              title="Desativar todas as colunas desta tabela"
              className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Square className="w-3 h-3" />
              <span>Desativar</span>
            </button>
          </div>

          {/* Badge de status */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold ${
              enabledCount > 0
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : "bg-amber-50 border-amber-200 text-amber-800"
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>
              {enabledCount}/{totalCount} colunas ativas
            </span>
          </div>
        </div>
      </div>

      {/* Conteúdo Expandido (Mapeamento de Linhas/Colunas) */}
      {isExpanded && (
        <div className="p-4 sm:p-5">
          {mapping.custom_query && (
            <div className="mb-4 p-3 bg-gray-950 text-emerald-400 font-mono text-xs rounded-xl border border-gray-800">
              <div className="text-[10px] text-gray-400 font-sans font-bold uppercase tracking-wider mb-1">
                ⚡ Consulta SQL / Filtro da Migração:
              </div>
              <pre className="whitespace-pre-wrap">{mapping.custom_query}</pre>
            </div>
          )}

          {mapping.where_clause && !mapping.custom_query && (
            <div className="mb-4 p-3 bg-amber-50 text-amber-900 font-mono text-xs rounded-xl border border-amber-200">
              <div className="text-[10px] text-amber-800 font-sans font-bold uppercase tracking-wider mb-1">
                🔍 Filtro WHERE da Migração:
              </div>
              <div>WHERE {mapping.where_clause}</div>
            </div>
          )}

          {error && (
            <div className="mb-4 px-4 py-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl">
              Erro ao sincronizar colunas: {error}
            </div>
          )}

          {/* Versão Desktop: Tabela limpa */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-gray-200 text-gray-500 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-2.5 px-3 w-12 text-center">Ativo</th>
                  <th className="py-2.5 px-3">Campo Origem</th>
                  <th className="py-2.5 px-3 w-28">Tipo Origem</th>
                  <th className="py-2.5 px-3 w-8 text-center"></th>
                  <th className="py-2.5 px-3">Campo Destino</th>
                  <th className="py-2.5 px-3 w-28">Tipo Destino</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {columns.map((column, colIdx) => {
                  const isEnabled = Boolean(column.enabled);

                  return (
                    <tr
                      key={`${tableId}-${column.coluna_origen_name}-${colIdx}`}
                      className={`hover:bg-blue-50/40 transition-colors ${
                        !isEnabled ? "opacity-40 bg-gray-50/50" : ""
                      }`}
                    >
                      {/* Checkbox Ativo */}
                      <td className="py-3 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={isEnabled}
                          onChange={() => onToggleColumn(tableId, colIdx)}
                          className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                        />
                      </td>

                      {/* Nome Origem */}
                      <td className="py-3 px-3 font-mono font-semibold text-gray-900">
                        {column.coluna_origen_name}
                      </td>

                      {/* Tipo Origem */}
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide bg-blue-50 text-blue-700 border border-blue-200">
                          {column.type_coluna_origem || "indefinido"}
                        </span>
                      </td>

                      {/* Seta */}
                      <td className="py-3 px-3 text-center text-gray-400">
                        <ArrowRight className="w-3.5 h-3.5 mx-auto" />
                      </td>

                      {/* Nome Destino: Select se tiver colunas no destino, input se for tabela nova/mongo */}
                      <td className="py-3 px-3">
                        {hasTargetCols ? (
                          <div className="max-w-xs">
                            <JoinSelect
                              options={selectOptions}
                              value={String(column.id_coluna_destino || "")}
                              onChange={(val) => {
                                const selectedField = targetColumns.find(
                                  (f) => String(f.id) === val
                                );
                                onUpdateColumnMapping(
                                  tableId,
                                  colIdx,
                                  val,
                                  selectedField?.name,
                                  selectedField?.type
                                );
                              }}
                            />
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 max-w-xs">
                            <input
                              type="text"
                              value={column.coluna_distino_name || ""}
                              onChange={(e) =>
                                onUpdateColumnMapping(
                                  tableId,
                                  colIdx,
                                  "0",
                                  e.target.value,
                                  column.type_coluna_origem
                                )
                              }
                              placeholder="Nome do campo destino..."
                              className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-mono font-medium focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-900"
                            />
                            <Edit2 className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                          </div>
                        )}
                      </td>

                      {/* Tipo Destino */}
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {column.type_coluna_destino || column.type_coluna_origem || "auto"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Versão Mobile */}
          <div className="md:hidden space-y-3">
            {columns.map((column, colIdx) => {
              const isEnabled = Boolean(column.enabled);

              return (
                <div
                  key={`mobile-${tableId}-${column.coluna_origen_name}-${colIdx}`}
                  className={`p-3.5 rounded-xl border transition-all space-y-2.5 ${
                    isEnabled
                      ? "bg-white border-gray-200 shadow-2xs"
                      : "bg-gray-50 border-gray-200 opacity-50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isEnabled}
                        onChange={() => onToggleColumn(tableId, colIdx)}
                        className="w-4 h-4 text-blue-600 rounded border-gray-300"
                      />
                      <span className="font-mono font-bold text-gray-900 text-xs">
                        {column.coluna_origen_name}
                      </span>
                    </label>

                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700">
                      {column.type_coluna_origem || "indefinido"}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-gray-100 flex items-center gap-2">
                    <ArrowRight className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      {hasTargetCols ? (
                        <JoinSelect
                          options={selectOptions}
                          value={String(column.id_coluna_destino || "")}
                          onChange={(val) => {
                            const selectedField = targetColumns.find(
                              (f) => String(f.id) === val
                            );
                            onUpdateColumnMapping(
                              tableId,
                              colIdx,
                              val,
                              selectedField?.name,
                              selectedField?.type
                            );
                          }}
                        />
                      ) : (
                        <input
                          type="text"
                          value={column.coluna_distino_name || ""}
                          onChange={(e) =>
                            onUpdateColumnMapping(
                              tableId,
                              colIdx,
                              "0",
                              e.target.value,
                              column.type_coluna_origem
                            )
                          }
                          className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-mono text-gray-900"
                        />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {totalCount === 0 && (
            <div className="text-center py-8 text-gray-400 text-xs">
              {isLoading
                ? "Sincronizando campos da tabela com o servidor..."
                : "Nenhuma coluna detectada nesta tabela."}
            </div>
          )}
        </div>
      )}
    </div>
  );
}


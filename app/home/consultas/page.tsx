"use client";
import { useState, useCallback, useEffect } from "react";
import {
  Table, FilePlus2, Shield, Database,
  Hash, FileText, Trash2
} from "lucide-react";

import api from "@/context/axioCuston";
import { LabeledSelect2 } from "@/app/component/improved-labeled-select";
import QueryBuilder from "@/app/component/query-builder-component";
import ResultTable from "@/app/component/InteractiveResultTable";
import RowDetailsModal from "@/app/component/MetadataModal";

import {
  CampoDetalhado,
  defaultNameCachesValue,
  EditedFieldForQuery,
  MetadataTableResponse,
  PayloadDeleteRow,
  SelectedRow,
  Tables_primary_keys_values
} from "@/types";

import { InfoCard } from "@/app/component/InfoCard";
import { LabeledSelect } from "@/app/component/LabeledSelect";
import TableColumnsDisplay from "@/app/component/table-columns-display";
import { findIdentifierField, parseErrorMessage } from "@/util/func";
import { useDatabaseMetadata } from "@/hook/useDatabaseMetadata";
import { useSession } from "@/context/SessionContext";
import { useI18n } from "@/context/I18nContext";
import { ErrorScreen, LoadingScreen } from "@/app/component/Loading_and_error-component";
import { useQuerySSE } from "@/hook/useQuerySSE";
import QueryStatusIndicator from "@/app/component/ResultadosQueryComponent/QueryStatusIndicator ";
import { useFormSelectConsulta } from "@/hook/useFormSelectConsultas";
import { fetchRowData } from "@/util/linhaCompletaBusca";

const ConsultaPage = () => {
  const { user } = useSession();
  const { t } = useI18n();
  const { metadata, loading: loadingMetadata, error: errorFetch } = useDatabaseMetadata();
  const {
    executeQuery, cancelQuery,
    executingQuery, queryResults,
    setQueryResults,
    error: errorQuery, progress,
    sseState, hasError
  } = useQuerySSE();

  const {
    selectedTables, aliasTables,
    columnsInfo, selectColumns,
    queryLimit, selectedRow,
    modalOpenEdit, loadingFields,
    isEditingRow, error,
    setSelectedTables, setAliasTables,
    setColumnsInfo, setSelectColumns,
    setQueryLimit, setSelectedRow,
    setModalOpenEdit, setLoadingFields,
    setIsEditingRow, setError,
    removerCacheLocalStorage,
  } = useFormSelectConsulta(errorFetch || errorQuery);

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (errorFetch) {
      setError(errorFetch);
    } else if (errorQuery) {
      setError(errorQuery);
    }
  }, [errorFetch, errorQuery, setError]);

  const handleSelectTables = useCallback(
    async (newTable: string) => {
      const normalized = newTable.trim().toLowerCase();

      if (normalized.length === 0) {
        setSelectColumns([]);
        setSelectedTables([]);
        setColumnsInfo([]);
        setAliasTables({});
        return;
      }

      try {
        if (!selectedTables.includes(newTable)) {
          setSelectedTables(prev => [...prev, newTable]);

          const rs = await api.get<MetadataTableResponse>(
            `/consu/metadata_fieds/${encodeURIComponent(newTable)}`,
            { withCredentials: true, timeout: 45000 }
          );

          setColumnsInfo(prev => [...prev, rs.data]);
        } else {
          const remainingTables = selectedTables.filter(
            t => t.toLowerCase() !== normalized
          );
          setSelectedTables(remainingTables);

          const filteredColumns = columnsInfo.filter(ci =>
            remainingTables.some(
              t => t.toLowerCase() === ci.table_name.toLowerCase()
            )
          );
          setColumnsInfo(filteredColumns);

          setSelectColumns(prev =>
            prev.filter(s => {
              const [table] = s.split(".");
              return remainingTables.some(
                t => t.toLowerCase() === table.toLowerCase()
              );
            })
          );
        }
      } catch (err) {
        const errorMsg = parseErrorMessage(err);
        setError(errorMsg);
        console.error("❌ Erro ao buscar metadados da tabela:", errorMsg);
      }
    },
    [columnsInfo, setAliasTables, setColumnsInfo, setError, setSelectColumns, setSelectedTables, selectedTables]
  );

  const openRowModal = useCallback((row: SelectedRow) => {
    setSelectedRow(row);
    setModalOpenEdit(true);
  },[setSelectedRow,setModalOpenEdit]);

  const handleRowClick = useCallback(async (row: SelectedRow) => {
    if (!row || row.index === undefined) return;
    
    const selectedTablesArray = Array.isArray(row.tableName) ? row.tableName : [row.tableName];
    if (selectedTablesArray.length > 1) return openRowModal(row);

    const tableName = selectedTablesArray[0];
    if (!tableName) return;

    const isColumnComplete = queryResults?.tabela_coluna?.[tableName]?.length === row.nameColumns.length;
    if (isColumnComplete) return openRowModal(row);

    const primaryKeyField = findIdentifierField(tableName, columnsInfo);
    if (!primaryKeyField) return openRowModal(row);

    try {
      setLoadingFields(true);

      const pkIndex = row.nameColumns.findIndex(
        col => col === tableName + "." + primaryKeyField.nome
      );

      const primaryKeyValue = pkIndex !== -1 ? Object.values(row.row || {})[pkIndex] : null;

      const fullRow = await fetchRowData(row, tableName, primaryKeyField.nome, primaryKeyField.tipo, primaryKeyValue);

      if (!fullRow) return openRowModal(row);

      openRowModal({
        ...row,
        row: fullRow
      });

    } catch (err) {
      setError(parseErrorMessage(err));
    } finally {
      setLoadingFields(false);
    }
  }, [setLoadingFields,columnsInfo, openRowModal, setError, queryResults]);


  const handleRowUpdate = useCallback(async (
    updatedRow: EditedFieldForQuery,
    tables_primary_keys_values: Tables_primary_keys_values
  ) => {
    if (!updatedRow || isEditingRow || !tables_primary_keys_values) {
      console.warn("⚠️ Dados inválidos para atualização da linha");
      return;
    }

    setIsEditingRow(true);
    setError(null);

    try {
      await api.post(
        "/exe/update_row",
        { updatedRow, tables_primary_keys_values },
        { withCredentials: true }
      );

      const updatedValues = Object.entries(updatedRow).reduce<Record<string, string>>(
        (acc, [, columns]) => {
          Object.entries(columns).forEach(([col, { value }]) => {
            acc[col] = value;
          });
          return acc;
        },
        {}
      );

      if (selectedRow) {
        const updatedSelectedRow = {
          ...selectedRow,
          row: { ...selectedRow.row, ...updatedValues }
        };

        setSelectedRow(updatedSelectedRow);
      }

    } catch (error) {
      const errorMsg = parseErrorMessage(error);
      setError(errorMsg);
      console.error("❌ Erro ao atualizar linha:", errorMsg);
    } finally {
      setIsEditingRow(false);
    }
  }, [isEditingRow, selectedRow, setError, setIsEditingRow, setSelectedRow]);

  const handleDelete = useCallback( async (payload: PayloadDeleteRow, index: number) => {
    try {
      payload.payloadSelectedRow = queryResults?.QueryPayload;

      await api.delete("/delete/records", {
        data: {
          registros: [payload],
        },
        withCredentials: true,
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (queryResults) {
        const newPreview = queryResults.preview.filter((_, i) => i !== index);
        setQueryResults({
          ...queryResults,
          preview: newPreview,
          totalResults: Math.max(0, (queryResults.totalResults || 0) - 1),
        });
      }
    } catch (error: unknown) {
      console.error("❌ Erro ao eliminar registro:", error);
      // Fix: safely access error.response using type assertion, sem usar 'any'
      type ErrorWithResponse = { response?: { data?: { detail?: string } } };
      const err = error as ErrorWithResponse;
      const detail = err.response?.data?.detail;
      throw new Error(
        detail ||
        t("query.deleteError") || "Erro inesperado ao tentar eliminar o registro."
      );
    }
  },[queryResults, setQueryResults, t]);

  // ----------------- Render -----------------
  if (loadingMetadata || !mounted) {
    return <LoadingScreen message={t("query.loadingMetadata") || "Carregando metadados do banco de dados..."} />;
  }

  if (error && !metadata) {
    return <ErrorScreen message={error || errorFetch || t("common.unknownError") || "Erro desconhecido"} />;
  }

  return (
    <div className="relative bg-gray-50 min-h-screen">
      
      {/* HEADER PADRÃO OFICIAL */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-6">

            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                  {t("query.title") || "Consulta de Dados"}
                </h1>
                <div className="flex items-center gap-2 mt-1.5">
                  <p className="text-sm text-gray-600 truncate">
                    <span className="font-medium text-gray-800">
                      {metadata?.connection_name}
                    </span>
                    {user?.info_extra?.name_db && (
                      <>
                        <span className="mx-2 text-gray-300">•</span>
                        <span>{user.info_extra.name_db}</span>
                      </>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Grid de Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              <InfoCard icon={<Table className="w-4 h-4" />} label={t("stats.tables") || "Tabelas"} count={metadata?.table_count} color="blue"  />
              <InfoCard icon={<Database className="w-4 h-4" />} label={t("stats.views") || "Views"} count={metadata?.view_count} color="green" />
              <InfoCard icon={<FilePlus2 className="w-4 h-4" />} label={t("stats.procedures") || "Procedures"} count={metadata?.procedure_count} color="purple"  />
              <InfoCard icon={<FileText className="w-4 h-4" />} label={t("stats.functions") || "Functions"} count={metadata?.function_count} color="orange"  />
              <InfoCard icon={<Shield className="w-4 h-4" />} label={t("stats.triggers") || "Triggers"} count={metadata?.trigger_count} color="red"  />
              <InfoCard icon={<Hash className="w-4 h-4" />} label={t("stats.indexes") || "Indexes"} count={metadata?.index_count} color="gray" />
            </div>
            
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        
        {/* Error Display */}
        {(error || hasError) && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-2 text-red-700">
              <span className="text-sm font-bold">{t("common.error") || "Erro"}:</span>
              <span className="text-sm font-medium">{error || errorQuery || t("common.unknownError") || "Erro desconhecido"}</span>
            </div>
          </div>
        )}

        {/* Table Selection - Padrão Card Branco */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-gray-900">
              {t("query.selectTables") || "Selecionar Tabelas"}
            </h2>
            {selectedTables.length > 0 && (
              <button
                onClick={removerCacheLocalStorage}
                className="text-sm font-semibold text-gray-500 hover:text-red-600 flex items-center gap-1.5 transition-colors"
              >
                <Trash2 size={16}/>
                {t("actions.clearSelection") || "Limpar Seleção"}
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {metadata && (
              <LabeledSelect
                label={t("common.tables") || "Tabelas"}
                value={selectedTables}
                onChange={handleSelectTables}
                options={metadata.table_names.map(t => ({
                  value: t.name,
                  label: `${t.name} (${t.rowcount} registros)`,
                })) || []}
                maxSelections={16}
              />
            )}

            <LabeledSelect2
              label={t("query.recordLimit") || "Limite de Registros"}
              value={queryLimit}
              onChange={setQueryLimit}
              options={["1", "10", "50", "100", "500", "1000", "5000"].map(v => ({
                value: v,
                label: `${v} ${t("common.records") || "registros"}`
              }))}
            />
          </div>

          {selectedTables.length > 0 && (
            <div className="mt-5 p-3 bg-gray-50 rounded-lg border border-gray-100 text-sm text-gray-700">
              <span className="font-bold">{t("query.selectedTables") || "Tabelas selecionadas"}:</span> {selectedTables.join(", ")}
            </div>
          )}
        </div>

        {/* Table Columns Display */}
        {selectedTables.length > 0 && (
          <TableColumnsDisplay
            names_caches_value={defaultNameCachesValue}
            tableNames={selectedTables.join(", ")}
            columns={columnsInfo}
            setColumns={setColumnsInfo}
            isLoading={loadingFields}
            setIsLoading={setLoadingFields}
            error={error}
            theme="light"
            tabelaExistenteNaDB={metadata?.table_names.map(t => t.name) || []}
            showSearch
            showFilter
            showSort
            showExport
            itemsPerPage={8}
            select={selectColumns}
            setSelect={setSelectColumns}
          />
        )}

        {/* Query Builder */}
        {selectedTables.length > 0 && columnsInfo.length > 0 && (
          <QueryBuilder
            columns={columnsInfo}
            table_list={selectedTables}
            setTable_list={setSelectedTables}
            onExecuteQuery={(query) => {
              query.limit = parseInt(queryLimit, 10);

              return executeQuery(query).then(() => {
                const tabelaCountColuna: Record<string, CampoDetalhado[]> = {};

                query.table_list?.forEach(t => {
                  tabelaCountColuna[t] = columnsInfo.find(inf => inf.table_name === t)?.colunas || [];
                });

                setQueryResults((prev) => {
                  if (!prev) {
                    return {
                      success: false,
                      query: "", params: {},
                      totalResults: null, duration_ms: 0,
                      columns: [], preview: [],
                      tabela_coluna: tabelaCountColuna,
                    };
                  }
                  return {
                    ...prev,
                    tabela_coluna: tabelaCountColuna,
                  };
                });
              });
            }}
            removerCacheLocalStorage={removerCacheLocalStorage}
            title={`${t("query.titleConsulta") || "Consulta"}: ${selectedTables.join(", ")}`}
            isExecuting={executingQuery}
            maxConditions={25}
            showLogicalOperators
            setSelect={setSelectColumns}
            select={selectColumns}
            setAliasTables={setAliasTables}
            aliasTables={aliasTables}
          />
        )}

        <QueryStatusIndicator
          sseState={sseState}
          progress={progress}
          onCancel={cancelQuery}
          executingQuery={executingQuery}
        />

        {/* Results Table */}
        {queryResults && (
          <ResultTable
            queryResults={queryResults}
            setQueryResults={setQueryResults}
            columnsInfo={columnsInfo}
            setSelectedRow={handleRowClick}
            selectedRow={selectedRow}
          />
        )}

        {/* Row Details Modal */}
        {modalOpenEdit && <RowDetailsModal
          isOpen={modalOpenEdit}
          onClose={() => setModalOpenEdit(false)}
          row={selectedRow}
          informacaosOftables={queryResults?.tabela_coluna}
          onSave={handleRowUpdate}
          onDelete={handleDelete}
        />}
      </main>
    </div>
  );
};

export default ConsultaPage;
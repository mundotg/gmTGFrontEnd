"use client";
import { useState, useEffect, useCallback } from "react";
import {
  Table, FilePlus2, Shield, Database,
  Hash, FileText, Loader2, AlertCircle,
} from "lucide-react";

import api from "@/context/axioCuston";
import { LabeledSelect2 } from "@/app/component/improved-labeled-select";
import QueryBuilder from "@/app/component/query-builder-component";
import ResultTable from "@/app/component/InteractiveResultTable";
import RowDetailsModal from "@/app/component/MetadataModal";

import {
  DatabaseMetadata,
  EditedFieldForQuery,
  LinhaCompletaResponse,
  MetadataTableResponse,
  QueryCountResultType,
  QueryPayload,
  QueryResultType,
  SelectedRow,
  Tables_primary_keys_values
} from "@/types";

import { InfoCard } from "@/app/component/InfoCard";
import usePersistedState from "@/hook/localStoreUse";
import { LabeledSelect } from "@/app/component/LabeledSelect";
import TableColumnsDisplay from "@/app/component/table-columns-display";
import { findIdentifierField } from "@/util/func";


const ConsultaPage = () => {
  const [metadata, setMetadata] = useState<DatabaseMetadata | null>(null);
  const [queryResults, setQueryResults] = useState<QueryResultType | null>(null);
  const [selectedRow, setSelectedRow] = useState<SelectedRow | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const [loadingMetadata, setLoadingMetadata] = useState(false);
  const [loadingFields, setLoadingFields] = useState(false);
  const [executingQuery, setExecutingQuery] = useState(false);
  const [isEditingRow, setIsEditingRow] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Persistência
  const [selectedTables, setSelectedTables] = usePersistedState<string[]>("consulta_selectedTables", []);
  const [columnsInfo, setColumnsInfo] = usePersistedState<MetadataTableResponse[]>("consulta_columnsInfo", []);
  const [selectColumns, setSelectColumns] = usePersistedState<string[]>("consulta_selectColumns", []);
  const [queryLimit, setQueryLimit] = usePersistedState<string>("consulta_queryLimit", "100");


  // ----------------- Helpers -----------------
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const parseErrorMessage = (err: any): string =>
    err?.response?.data?.detail ||
    err?.response?.data?.detail?.[0]?.msg ||
    err?.response?.data?.detail?.[0]||
    err?.response?.data?.message ||
    err?.response?.data ||
    err?.message ||
    "Erro inesperado. Tente novamente.";

  // ----------------- Effects -----------------
  useEffect(() => {
    const fetchMetadata = async () => {
      setLoadingMetadata(true);
      try {

        console.log("Buscando metadados...");
        const response = await api.get("/consu/metadata_db/", { withCredentials: true });
        const data = response.data.data || null;
        setMetadata(data);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err:any) {
        setError(parseErrorMessage(err?.response?.data || error));
      } finally {
        setLoadingMetadata(false);
      }
    };

    if (!loadingMetadata) {
      fetchMetadata();
    }
  }, []);

  const removerCacheLocalStorage = useCallback(() => {
    
    localStorage.removeItem("consulta_selectedTables");
    localStorage.removeItem("consulta_columnsInfo");
    localStorage.removeItem("consulta_selectColumns");
    localStorage.removeItem("query_conditions");
    localStorage.removeItem("query_select");
    localStorage.removeItem("query_distinct");
    localStorage.removeItem("query_joins");
    setSelectColumns([]);
    setSelectedTables([]);
    setColumnsInfo([]);

  }, []);

  const handleSelectTables = useCallback(
    async (newTables: string[]) => {
      const normalized = newTables.map(t => t.trim().toLowerCase());

      // Reset caso não tenha seleção
      if (normalized.length === 0) {
        setSelectColumns([]);
        setSelectedTables([]);
        setColumnsInfo([]);
        return;
      }

      setSelectedTables(newTables);

      try {
        // Buscar apenas as tabelas novas (não já carregadas)
        const missing = newTables.filter(
          t => !columnsInfo.some(ci => ci.table_name.toLowerCase() === t.toLowerCase())
        );

        if (missing.length > 0) {
          const responses = await Promise.all(
            missing.map(t =>
              api.get<MetadataTableResponse>(
                `/consu/metadata_fieds/${encodeURIComponent(t)}`,
                { withCredentials: true }
              )
            )
          );

          setColumnsInfo(prev => [...prev, ...responses.map(r => r.data)]);
        }
        else {

          setColumnsInfo(columnsInfo.filter(ci => newTables.some(nt => nt.toLowerCase() === ci.table_name.toLowerCase())));
          setSelectColumns(prev =>
            prev.filter(s => {
              const [table] = s.split("."); // pega só o nome da tabela
              console.log("ss ", table)
              return selectedTables.includes(table);
            })
          );
        }

      } catch (err) {
        setError(parseErrorMessage( error));
      }
    },
    [columnsInfo, setColumnsInfo, selectColumns,setSelectColumns,setSelectedTables]
  );


  const handleRowClick = useCallback(async (selectedRow: SelectedRow) => {
    // console.log("Linha clicada:", selectedRow); // Verificação básica
    if (!selectedRow || selectedRow.index === undefined) {
      console.warn("⚠️ Índice da linha inválido ou linha não selecionada.");
      return;
    } // Garante que tableName seja tratado como array
    const selectedTables = Array.isArray(selectedRow.tableName) ? selectedRow.tableName : [selectedRow.tableName];
    // Se houver campos de múltiplas tabelas, apenas abre o modal
    if (selectedTables.length > 1) {
      console.warn("⚠️ A linha possui campos de múltiplas tabelas:", selectedTables);
      setSelectedRow(selectedRow);
      setModalOpen(true);
      return;
    }
    const tableName = selectedTables[0];
    if (!tableName) {
      console.warn("⚠️ Nome da tabela não identificado.");
      return;
    }
    // Tenta encontrar o campo mais confiável para buscar a linha completa
    const primaryKeyField = findIdentifierField(tableName, columnsInfo);
    if (!primaryKeyField) {
      console.warn("⚠️ Nenhum campo identificador encontrado para a tabela:", tableName);
      return;
    }
    // Verifica se a linha já possui todas as colunas
    const isColumnComplete = columnsInfo.some(col => col.table_name === tableName && col.colunas.length === selectedRow.nameColumns.length);
    if (isColumnComplete) {
      setSelectedRow(selectedRow);
      setModalOpen(true);
      return;
    }
    try {
      const response = await api.get<LinhaCompletaResponse>(`/consu/linha-completa/${encodeURIComponent(selectedRow.index)}`, {
        params: { primary_key_field: primaryKeyField, table_name: tableName },
        withCredentials: true,
      });
      if (!response.data || !response.data.data) {
        console.warn("⚠️ Nenhum dado encontrado para a linha completa.");
        return;
      }
      selectedRow.row = response.data.data.__root__; //
      console.log("Dados da linha completa:", selectedRow.row);
      setSelectedRow(selectedRow); 
      setModalOpen(true);
    }
    catch (error) { 
      const msnErr = parseErrorMessage( error)
      setError(msnErr);
     }
  }, [columnsInfo, setSelectedRow]);

  const handleExecuteQuery = useCallback(async (query: QueryPayload) => {
    // if (!selectedTables.length) return;

    setExecutingQuery(true);
    setQueryResults(null);
    const select = selectColumns.filter(c=> selectedTables.includes(c.split(".")[0] || c))
    query.limit = parseInt(queryLimit);
    query.select = selectColumns.length > 0
      ? select
      : columnsInfo.flatMap(col => col.colunas.map(c => `${col.table_name}.${c.nome}`));

    try {
      const { data } = await api.post<QueryResultType>("/exe/execute_query/", query, { withCredentials: true });

      // buscar count total
      query.isCountQuery = true;
      // console.log("Buscando total de resultados para a query:", query);
      const { data: codata } = await api.post<QueryCountResultType>("/exe/execute_query/", query, { withCredentials: true });
      console.log(codata)
      setQueryResults({ ...data, totalResults: codata.count , QueryPayload: query } );
    } catch (err) {
      
      const msnErr = parseErrorMessage(err)
      if(msnErr.includes("exceptions must derive from BaseException"))
          removerCacheLocalStorage()
      setError(msnErr);
    } finally {
      setExecutingQuery(false);
      setSelectColumns(query.select || []);
    }
  }, [selectedTables, queryLimit, selectColumns, setSelectColumns,columnsInfo]);

  const handleRowUpdate = useCallback(async (
    updatedRow: EditedFieldForQuery,
    tables_primary_keys_values: Tables_primary_keys_values
  ) => {
    if (!updatedRow || isEditingRow || !tables_primary_keys_values) return;
    setIsEditingRow(true);

    try {
      await api.post("/exe/update_row", { updatedRow, tables_primary_keys_values }, { withCredentials: true });

      // Mapeia valores atualizados
      const value = Object.entries(updatedRow).reduce<Record<string, string>>(
        (acc, [, columns]) => {
          Object.entries(columns).forEach(([col, { value }]) => {
            acc[col] = value;
          });
          return acc;
        },
        {}
      );

      console.log("Valor para atualização na tabela:", value);

      // Cria a nova linha
      const newLine = selectedRow ? {
        ...selectedRow,
        row: { ...selectedRow.row, ...value },
        index: selectedRow.index,
        nameColumns: selectedRow.nameColumns ?? [],
        tableName: selectedRow.tableName ?? [],
      } : null;

      if (newLine) {
        setSelectedRow(newLine);

        setQueryResults(prev => {
          if (!prev) return prev;
          if(!newLine.index) return prev;
          // Cria cópia imutável
          const newPreview = [...prev.preview];
          newPreview[newLine.index] = newLine.row;
          return { ...prev, preview: newPreview };
        });

        console.log("Linha atualizada:", newLine);
      }
    } catch (error) {
      setError(parseErrorMessage(error));
    } finally {
      setIsEditingRow(false);
    }
  }, [isEditingRow, selectedRow]);



  // ----------------- Render -----------------
  if (loadingMetadata) return <LoadingScreen message="Carregando metadados..." />;
  if (error) return <ErrorScreen message={error} />;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b shadow-sm p-6">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Consulta de Dados</h1>
            <p className="text-sm text-gray-600">
              {metadata?.connectionName} - {metadata?.databaseName} ({metadata?.serverVersion})
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 text-sm">
            <InfoCard icon={<Table />} label="Tabelas" count={metadata?.tableCount} color="blue" />
            <InfoCard icon={<Database />} label="Views" count={metadata?.viewCount} color="green" />
            <InfoCard icon={<FilePlus2 />} label="Procedures" count={metadata?.procedureCount} color="purple" />
            <InfoCard icon={<FileText />} label="Functions" count={metadata?.functionCount} color="orange" />
            <InfoCard icon={<Shield />} label="Triggers" count={metadata?.triggerCount} color="red" />
            <InfoCard icon={<Hash />} label="Indexes" count={metadata?.indexCount} color="gray" />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 space-y-6">
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Selecionar Tabela</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {metadata && <LabeledSelect
              label="Tabela"
              value={selectedTables}
              onChange={handleSelectTables}
              options={metadata.tableNames.map(t => ({
                value: t.name,
                label: `${t.name} (${t.rowcount} registros)`,
              })) || []}
              maxSelections={10}
            />}
            <LabeledSelect2
              label="Limite de Registros"
              value={queryLimit}
              onChange={setQueryLimit}
              options={["10", "50", "100", "500", "1000"].map(v => ({ value: v, label: `${v} registros` }))}
            />
          </div>
        </div>

        <TableColumnsDisplay
          tableNames={selectedTables.join(", ")}
          columns={columnsInfo}
          isLoading={loadingFields}
          setIsLoading={setLoadingFields}
          error={error}
          theme="light"
          tabelaExistenteNaDB={metadata?.tableNames.map(t => t.name) || []}
          showSearch
          showFilter
          showSort
          showExport
          itemsPerPage={8}
          select={selectColumns}
          setSelect={setSelectColumns}
        />

        {selectedTables.length > 0 && (
          <QueryBuilder
            columns={columnsInfo}
            table_list={selectedTables}
            onExecuteQuery={handleExecuteQuery}
            removerCacheLocalStorage={removerCacheLocalStorage}
            title={`Consulta de ${selectedTables.join(",")}`}
            isExecuting={executingQuery}
            maxConditions={25}
            showLogicalOperators
            setSelect={setSelectColumns}
            select={selectColumns}
          />
        )}

        {queryResults && (
          <ResultTable
            queryResults={queryResults}
            setQueryResults={setQueryResults}
            columnsInfo={columnsInfo}
            setSelectedRow={handleRowClick}
            selectedRow={selectedRow}

          />
        )}

        <RowDetailsModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          row={selectedRow}
          selectColumns={selectColumns}
          informacaosOftables={columnsInfo}
          onSave={handleRowUpdate}
        />
      </main>
    </div>
  );
};

// ----------------- UI Helpers -----------------
const LoadingScreen = ({ message }: { message: string }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
      <p className="text-gray-600">{message}</p>
    </div>
  </div>
);

const ErrorScreen = ({ message }: { message: string }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-4" />
      <p className="text-red-600 mb-4">{message}</p>
      <button
        onClick={() => window.location.reload()}
        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
      >
        Tentar Novamente
      </button>
    </div>
  </div>
);


export default ConsultaPage;
"use client";
import { useState, useEffect } from "react";
import {
  Table, FilePlus2, Shield, Database,
  Hash, FileText, Loader2, AlertCircle,
} from "lucide-react";

import api from "@/context/axioCuston";
import { LabeledSelect2 } from "@/app/component";
import LabeledSelect from "@/app/component/improved-labeled-select";
import TableColumnsDisplay from "@/app/component/table-columns-display";
import QueryBuilder from "@/app/component/query-builder-component";
import ResultTable from "@/app/component/InteractiveResultTable";
import RowDetailsModal from "@/app/component/MetadataModal";

import { LinhaCompletaResponse, MetadataTableResponse, QueryPayload, QueryResultType, SelectedRow } from "@/types";
import { InfoCard } from "@/app/component/InfoCard";

interface DatabaseMetadata {
  connectionName: string;
  databaseName: string;
  serverVersion: string;
  tableCount: number;
  viewCount: number;
  procedureCount: number;
  functionCount: number;
  triggerCount: number;
  indexCount: number;
  tableNames: { name: string; rowcount: number }[];
}

const ConsultaPage = () => {
  const [metadata, setMetadata] = useState<DatabaseMetadata | null>(null);
  const [columnsInfo, setColumnsInfo] = useState<MetadataTableResponse[]>([]);
  const [selectedTables, setSelectedTables] = useState<string[]>([]);
  const [queryResults, setQueryResults] = useState<QueryResultType | null>(null);
  const [queryLimit, setQueryLimit] = useState("100");
  const [selectedRow, setSelectedRow] = useState<SelectedRow | null>(null);
  const [selectColumns, setSelectColumns] = useState<Array<string>>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [loadingMetadata, setLoadingMetadata] = useState(true);
  const [loadingFields, setLoadingFields] = useState(false);
  const [executingQuery, setExecutingQuery] = useState(false);
  const [isEditingRow, setIsEditingRow] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const response = await api.get("/consu/metadata_db/", { withCredentials: true });
        setMetadata(response.data.data || null);
      } catch {
        setError("Erro ao carregar metadados da base de dados");
      } finally {
        setLoadingMetadata(false);
      }
    };

    fetchMetadata();
  }, []);

  useEffect(() => {
    const cachedTables = localStorage.getItem("consulta_selectedTables");
    const cachedColumns = localStorage.getItem("consulta_columnsInfo");
    const cachedSelect = localStorage.getItem("consulta_selectColumns");
    const cachedLimit = localStorage.getItem("consulta_queryLimit");

    if (cachedTables) setSelectedTables(JSON.parse(cachedTables));
    if (cachedColumns) setColumnsInfo(JSON.parse(cachedColumns));
    if (cachedSelect) setSelectColumns(JSON.parse(cachedSelect));
    if (cachedLimit) setQueryLimit(cachedLimit);
  }, []);

  useEffect(() => {
    if (selectedTables.length > 0) {
      localStorage.setItem("consulta_selectedTables", JSON.stringify(selectedTables));
    }
  }, [selectedTables]);

  useEffect(() => {
    if (columnsInfo.length > 0) 
      localStorage.setItem("consulta_columnsInfo", JSON.stringify(columnsInfo));
    }, [columnsInfo]);

  useEffect(() => {
    if (selectColumns.length > 0) {
      localStorage.setItem("consulta_selectColumns", JSON.stringify(selectColumns));
    }
  }, [selectColumns]);

  useEffect(() => {
    if (queryLimit) {
      localStorage.setItem("consulta_queryLimit", queryLimit);
    }
  }, [queryLimit]);


  const fetchTableColumns = async (tableName: string): Promise<boolean> => {
    if (loadingFields || columnsInfo.some(col => col.table_name === tableName)) return true;

    setLoadingFields(true);

    try {
      const { data } = await api.get<MetadataTableResponse>(
        `/consu/metadata_fieds/${encodeURIComponent(tableName)}`, { withCredentials: true }
      );
      setColumnsInfo(prev => [...prev, data]);
      return true;
    } catch (err) {
      console.warn("Erro ao buscar colunas:", tableName, err);
      return false;
    } finally {
      setLoadingFields(false);
    }
  };

  const removeTableColumns = (tableName: string) => {
    const norm = tableName.trim().toLowerCase();
    setColumnsInfo(prev => prev.filter(item => item.table_name.trim().toLowerCase() !== norm));
    setSelectColumns(prev => prev.filter(col => !col.startsWith(`${tableName}.`)));
  };

  const handleTableToggle = async (tableName: string) => {
    const norm = tableName.trim().toLowerCase();
    const exists = selectedTables.some(t => t.trim().toLowerCase() === norm);

    if (exists) {
      setSelectedTables(prev => prev.filter(t => t.trim().toLowerCase() !== norm));
      removeTableColumns(tableName);
    } else {
      setSelectedTables(prev => [...prev, tableName]);
      const success = await fetchTableColumns(tableName);
      if (!success) {
        setSelectedTables(prev => prev.filter(t => t.trim().toLowerCase() !== norm));
      }
    }
  };

  const handleExecuteQuery = async (query: QueryPayload) => {
    if (!selectedTables.length) return;

    setExecutingQuery(true);
    setQueryResults(null);
    query.limit = parseInt(queryLimit);
    query.select = (selectColumns && selectColumns.length > 0)
      ? selectColumns
      : columnsInfo.flatMap(col => col.colunas.map(c => `${col.table_name}.${c.nome}`));

    try {
      const { data } = await api.post<QueryResultType>("/exe/execute_query/", query, {
        withCredentials: true,
      });
      setQueryResults(data);
      // localStorage.setItem("consulta_lastQueryPayload", JSON.stringify(query));
    } catch (err: any) {
      setError(err.response?.data?.detail?.[0]?.msg || "Erro ao executar consulta.");
    } finally {
      setExecutingQuery(false);
      setSelectColumns(query.select || []);
    }
  };
  const handleRowClick = async (selectedRow: SelectedRow) => {
    // console.log("Linha clicada:", selectedRow);
    // Verificação básica
    if (!selectedRow || selectedRow.index === undefined) {
      console.warn("⚠️ Índice da linha inválido ou linha não selecionada.");
      return;
    }

    // Garante que tableName seja tratado como array
    const selectedTables = Array.isArray(selectedRow.tableName)
      ? selectedRow.tableName
      : [selectedRow.tableName];

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

    // Função auxiliar para localizar um campo específico
    const getFieldBy = (predicate: (c: any) => boolean): string | undefined => {
      return columnsInfo
        .find(col => col.table_name === tableName)
        ?.colunas.find(predicate)?.nome;
    };

    // Tenta encontrar o campo mais confiável para buscar a linha completa
    const primaryKeyField =
      getFieldBy(c => c.is_primary_key) ||
      getFieldBy(c => c.is_unique) ||
      getFieldBy(c => !c.is_nullable) ||
      columnsInfo.find(col => col.table_name === tableName)?.colunas[0]?.nome;

    if (!primaryKeyField) {
      console.warn("⚠️ Nenhum campo identificador encontrado para a tabela:", tableName);
      return;
    }
    // Verifica se a linha já possui todas as colunas
    const isColumnComplete = columnsInfo.some(col =>
      col.table_name === tableName &&
      col.colunas.length === selectedRow.nameColumns.length
    );

    if (isColumnComplete) {
      setSelectedRow(selectedRow);
      setModalOpen(true);
      return;
    }

    try {
      const response = await api.get<LinhaCompletaResponse>(
        `/consu/linha-completa/${encodeURIComponent(selectedRow.index)}`,
        {
          params: {
            primary_key_field: primaryKeyField,
            table_name: tableName,
          },
          withCredentials: true,
        }
      );
      if (!response.data || !response.data.data) {
        console.warn("⚠️ Nenhum dado encontrado para a linha completa.");
        return;
      }
      selectedRow.row = response.data.data.__root__;
      // console.log("Dados da linha completa:", selectedRow.row);
      setSelectedRow(selectedRow);
      setModalOpen(true);

    } catch (error) {
      console.error("❌ Erro ao recuperar dados da linha completa:", error);
    }
  };




  const handleRowUpdate = (updatedRow: Record<string, any>) => {
    if (isEditingRow) return;
    setIsEditingRow(true);
    setSelectedRow({ row: updatedRow, nameColumns: selectedRow?.nameColumns || [] });
    console.log("Linha atualizada:", updatedRow);
    setIsEditingRow(false);

  
  };

  if (loadingMetadata) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Carregando metadados...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

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
            <LabeledSelect
              label="Tabela"
              value={selectedTables}
              onChange={handleTableToggle}
              options={
                metadata?.tableNames.map((t) => ({
                  value: t.name,
                  label: `${t.name} (${t.rowcount} registros)`,
                })) || []
              }
              maxSelections={10}
            />
            <LabeledSelect2
              label="Limite de Registros"
              value={queryLimit}
              onChange={setQueryLimit}
              options={["10", "50", "100", "500", "1000"].map(v => ({
                value: v,
                label: `${v} registros`
              }))}
            />
          </div>
        </div>

        <TableColumnsDisplay
          tableName="usuarios"
          columns={columnsInfo}
          isLoading={loadingFields}
          error={error}
          theme="light"
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
            title="Consulta de Usuários"
            isExecuting={executingQuery}
            maxConditions={25}
            showLogicalOperators
            setSelect={setSelectColumns}
            select={selectColumns}
          />
        )}

       {queryResults && <ResultTable
          queryResults={queryResults}
          setQueryResults={setQueryResults}
          columnsInfo={columnsInfo}
          setSelectedRow={handleRowClick}
          selectedRow={selectedRow}
        />}

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


export default ConsultaPage;

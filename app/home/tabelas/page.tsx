"use client";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Database, AlertCircle, ShieldAlert } from "lucide-react";
import Link from "next/link";

import { DatabaseMetadata, MetadataTableResponse, TableInfoCreate } from "@/types";
import { parseErrorMessage, separatedSelectedTablesNameAndSchema } from "@/util/func";
import { useSession } from "@/context/SessionContext";
import { clearCache, fetchHealthCheck, fetchStructures } from "@/app/services/metadata_DB";
import { useDatabaseMetadata } from "@/hook/useDatabaseMetadata";
import usePersistedState from "@/hook/localStoreUse";

import DatabaseHeader, { HealthStatus } from "./componentTabela/HeaderComponent";
import EmptyStateSection from "./componentTabela/EmptyStateSection";
import { TableCard } from "./componentTabela/TabelaCard";
import { Modal } from "@/app/component";
import Pagination from "@/app/component/pagination-component";

import { DataTransactionForm } from "./componentTabela/DataTransactionForm";
import { BackupRestoreForm } from "./componentTabela/BackupRestoreForm";
import { DeadlocksMonitor } from "./componentTabela/DeadlocksMonitor";

import { DBStructure } from "@/types/db-structure";
import TableModal from "./componentTabela/CreateTableForm";
import { getDefaultSchemas, isSystemTable } from "./componentTabela/util";

const ITEMS_PER_PAGE = 6;

const DatabaseTablesPage: React.FC = () => {
  const { metadata, setMetadata, loading: loadingMetadata, error: errorFetch } = useDatabaseMetadata();
  const { api, user } = useSession();

  const [structures, setStructures] = useState<DBStructure[]>([]);
  const [expandedTables, setExpandedTables] = useState<Set<string>>(new Set());
  const [loadingColumns, setLoadingColumns] = useState<Set<string>>(new Set());
  const [seletColunaForTable, setSeleColunaForTable] = useState<Record<string, Set<string>> | undefined>({});
  const [colunasShow, setColunaShow] = usePersistedState<Record<string, MetadataTableResponse | undefined>>(
    "colunasShow_menu_tabela",
    {}
  );

  const [isLoading, setIsLoading] = useState(loadingMetadata);
  const [loadingFields, setLoadingFields] = useState(false);
  const [error, setError] = useState<string | null>(errorFetch);

  const [searchTerm, setSearchTerm] = useState("");
  const [isDarkMode, setIsDarkMode] = usePersistedState("tema_menu_tabela", false);
  const [desableTablesSystem, setDesableTablesSystem] = usePersistedState("desable_tables_menu_tabela", false);

  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [filterSchema, setFilterSchema] = useState("all");
  const [sortBy, setSortBy] = useState<"name" | "rows" | "schema">("name");

  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null);

  const [selectedTables, setSelectedTables] = useState<Set<string>>(new Set());

  // ✅ Modal único para tabela
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [tableModalMode, setTableModalMode] = useState<"create" | "edit">("create");
  const [editingTable, setEditingTable] = useState<string | null>(null);
  const [menosTableSytem, setMenosTableSystem] = useState<number>(0);

  const [isTransactionOpen, setIsTransactionOpen] = usePersistedState("openisTransactionOpen", false);
  const [isBackupOpen, setIsBackupOpen] = useState(false);
  const [isDeadlocksOpen, setIsDeadlocksOpen] = usePersistedState("isDeadlocksOpen", false);

  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => setCurrentPage(1), [searchTerm, filterSchema, sortBy]);

  const loadInitialData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [structuresData, healthData] = await Promise.all([fetchStructures(), fetchHealthCheck()]);
      // console.log("structuresData:", structuresData)
      setStructures(structuresData);
      setHealthStatus(healthData);
    } catch (err) {
      const msg = parseErrorMessage(err);
      setError(msg);
      console.error("❌ Erro ao carregar dados:", msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleRefresh = useCallback(async () => {
    try {
      setIsLoading(true);
      await clearCache();
      await loadInitialData();
    } catch (err) {
      setError(parseErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [loadInitialData]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Sincroniza erro de metadados iniciais se ocorrer
  useEffect(() => {
    if (errorFetch) {
      setError(errorFetch);
    }
  }, [errorFetch]);

  // 🔄 Ao mudar de conexão, limpa o estado dependente dela. Sem isto, as
  // colunas expandidas (persistidas no localStorage por NOME de tabela) de
  // uma conexão apareciam noutra com tabelas de nome igual — colunas erradas
  // a renderizar. Só limpa numa MUDANÇA real (não na 1ª montagem), preservando
  // a persistência dentro da mesma conexão.
  const prevConnRef = React.useRef<number | string | undefined>(
    user?.info_extra?.id_connection
  );
  useEffect(() => {
    const cur = user?.info_extra?.id_connection;
    if (prevConnRef.current !== undefined && cur !== prevConnRef.current) {
      setColunaShow({});
      setExpandedTables(new Set());
      setLoadingColumns(new Set());
      setSelectedTables(new Set());
      setSeleColunaForTable({});
    }
    prevConnRef.current = cur;
  }, [user?.info_extra?.id_connection, setColunaShow]);

  const getTableStructure = useCallback(
    (tableName: string): DBStructure | undefined =>
      structures.find((s) => s.table_name.toLowerCase() === tableName.toLowerCase()),
    [structures]
  );

  const schemas = useMemo(() => {
    const set = new Set<string>();
    structures.forEach((s) => s.schema_name && set.add(s.schema_name));
    if (user?.info_extra?.type)
      set.add(getDefaultSchemas(user?.info_extra?.type))
    return Array.from(set);
  }, [structures, user?.info_extra?.type]);

  const handleSelectTables = useCallback(
    async (tableName: string) => {
      if (colunasShow[tableName]) return;

      try {
        setLoadingColumns((prev) => new Set(prev).add(tableName));
        const rs = await api.get<MetadataTableResponse>(`/consu/metadata_fieds/${encodeURIComponent(tableName)}`, {
          withCredentials: true,
          timeout: 65000,
        });
        setColunaShow((prev) => ({ ...prev, [tableName]: rs.data }));
      } catch (err) {
        setError(parseErrorMessage(err));
      } finally {
        setLoadingColumns((prev) => {
          const n = new Set(prev);
          n.delete(tableName);
          return n;
        });
      }
    },
    [api, colunasShow, setColunaShow]
  );

  const toggleTable = useCallback(
    (tableName: string) => {
      // Usa o nome EXATO recebido (o mesmo `table.name` usado no render e nas
      // chaves de `expandedTables`/`colunasShow`). Antes fazia split(".") e
      // guardava só o nome sem schema, mas o render verificava `table.name` —
      // e o TableCard chegava a enviar "undefined.tabela" quando não havia
      // estrutura, deixando expansão/colunas/seleção dessincronizados.
      setExpandedTables((prev) => {
        const n = new Set(prev);
        if (n.has(tableName)) n.delete(tableName);
        else {
          n.add(tableName);
          handleSelectTables(tableName);
        }
        return n;
      });
    },
    [handleSelectTables]
  );

  const filteredAndSortedTables = useMemo(() => {
    const list =
      metadata?.table_names.filter((table) => {
        const st = getTableStructure(table.name);
        const matchesSearch =
          table.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (st?.schema_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
          (st?.description || "").toLowerCase().includes(searchTerm.toLowerCase());

        const matchesSchema = filterSchema === "all" || st?.schema_name === filterSchema;
        const { isSystem, reason: systemReason } = isSystemTable(table.name, st?.schema_name, user?.info_extra?.type);
        if (desableTablesSystem && isSystem) return false;
        return matchesSearch && matchesSchema;
      }) || [];

    list.sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "rows") return (b.rowcount || 0) - (a.rowcount || 0);
      if (sortBy === "schema") {
        const sa = getTableStructure(a.name)?.schema_name || "";
        const sb = getTableStructure(b.name)?.schema_name || "";
        return sa.localeCompare(sb);
      }
      return 0;
    });

    return list;
  }, [metadata, searchTerm, filterSchema, sortBy, getTableStructure, desableTablesSystem]);

  const totalPages = Math.ceil(filteredAndSortedTables.length / ITEMS_PER_PAGE);

  const paginatedTables = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredAndSortedTables.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredAndSortedTables, currentPage]);

  const toggleSelectTable = useCallback((tableName: string) => {
    setSelectedTables((prev) => {
      const n = new Set(prev);
      n.has(tableName) ? n.delete(tableName) : n.add(tableName);
      return n;
    });
  }, []);

  const selectAllVisible = useCallback(() => {
    setSelectedTables(new Set(filteredAndSortedTables.map((t) => t.name)));
  }, [filteredAndSortedTables]);

  const clearSelection = useCallback(() => setSelectedTables(new Set()), []);

  const handleDeleteTable = useCallback(
    async (tableName: string) => {
      if (!confirm(`Eliminar tabela "${tableName}"? Essa ação é irreversível.`)) return;
      try {
        setIsLoading(true);
        await api.delete(`/database/table/${encodeURIComponent(tableName)}`, { withCredentials: true });
        await loadInitialData();
        setSelectedTables((prev) => {
          const s = new Set(prev);
          s.delete(tableName);
          return s;
        });
      } catch (err) {
        setError(parseErrorMessage(err));
      } finally {
        setIsLoading(false);
      }
    },
    [api, loadInitialData]
  );

  const handleDeleteSelectedTables = useCallback(async () => {
    const list = Array.from(selectedTables);
    if (list.length === 0) return alert("Nenhuma tabela selecionada.");

    if (!confirm(`Eliminar ${list.length} tabelas selecionadas? Essa ação é irreversível.`)) return;

    // 1. Get the separated data
    const { tables, schema_name } = separatedSelectedTablesNameAndSchema(list, getTableStructure);

    // 2. Flatten the object. 
    // IMPORTANT: Ensure 'schema_name' matches what your Python backend expects.
    const payload = {
      tables,
      schema_name, // Renaming 'schema' to 'schema_name' based on your previous error log
      connection_id: user?.info_extra?.id_connection,
      if_exists: true,
      cascade: false,
    };

    try {
      setIsLoading(true);
      await api.request({
        method: "DELETE",
        url: "/database/table/bulk",
        // 3. PASS PAYLOAD DIRECTLY
        // Don't use { payload }, or it nests it under a "payload" key again.
        data: payload,
        withCredentials: true,
      });

      setMetadata((prev: DatabaseMetadata | null) => {
        if (!prev) return null;
        const filteredTables = prev.table_names.filter(t => !(tables.includes(t.name)));
        return { ...prev, tables: filteredTables };
      });
      await loadInitialData();
      setSelectedTables(new Set());
    } catch (err) {
      setError(parseErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [selectedTables, api, loadInitialData]);

  // ✅ modal open/close
  const openCreateModal = useCallback(() => {
    setTableModalMode("create");
    setEditingTable(null);
    setIsTableModalOpen(true);
  }, []);

  const openEditModal = useCallback((tableName: string) => {
    setTableModalMode("edit");
    setEditingTable(tableName);
    setIsTableModalOpen(true);
  }, []);

  const closeTableModal = useCallback(() => {
    setIsTableModalOpen(false);
    setEditingTable(null);
  }, []);

  const editingTableInfo: TableInfoCreate | null = useMemo(() => {
    if (!editingTable) return null;
    const st = getTableStructure(editingTable);
    return {
      name: editingTable,
      schema: st?.schema_name || undefined,
      comment: st?.description || undefined,
      engine: (st as any)?.Engine || undefined,
      charset: (st as any)?.Charset || undefined,
      collation: (st as any)?.Collation || undefined,
      temporary: false,
    };
  }, [editingTable, getTableStructure]);

  const handleCreateTableFromModal = useCallback(
    async (payload: TableInfoCreate & { ifNotExists?: boolean }) => {
      try {
        setIsLoading(true);

        if (!user?.info_extra?.id_connection) {
          setError("connection_id não encontrado. Selecione uma conexão antes de criar a tabela.");
          return;
        }

        console.log("Payload para criação de tabela:", payload);

        await api.post(
          "/database/table",
          {
            connection_id: user?.info_extra?.id_connection,                 // ✅ REQUIRED (body)
            table_name: payload.name,                    // ✅ REQUIRED (body)
            newSchema: payload.newSchema,
            schema_name: payload.schema || undefined,    // ✅ se teu backend usa schema_name
            description: payload.comment || undefined,   // ✅ description (teu backend aceita)
            if_not_exists: payload.ifNotExists ?? true,  // ⚠️ depende do teu schema (snake_case vs camelCase)
            temporary: payload.temporary ?? false,
            engine: payload.engine || undefined,
            charset: payload.charset || undefined,
            collation: payload.collation || undefined,
          },
          { withCredentials: true }
        );

        closeTableModal();
        await loadInitialData();
      } catch (err) {
        setError(parseErrorMessage(err));
      } finally {
        setIsLoading(false);
      }
    },
    [api, loadInitialData, closeTableModal, user]
  );

  const handleUpdateTableFromModal = useCallback(
    async (payload: { oldName: string; oldSchema?: string } & TableInfoCreate) => {
      if (loadingFields) return;
      setLoadingFields(true);
      if (!user?.info_extra?.id_connection) {
        setError("connection_id não encontrado. Selecione uma conexão antes de atualizar a tabela.");
        return;
      }

      try {
        setIsLoading(true);
        await api.put(
          `/database/table/${encodeURIComponent(payload.oldName)}`,
          {
            connection_id: user?.info_extra?.id_connection,                 // ✅ REQUIRED (body)
            table_name: payload.name,
            schema: payload.schema || undefined,
            description: payload.comment || undefined,
            temporary: payload.temporary ?? false,
            engine: payload.engine || undefined,
            charset: payload.charset || undefined,
            collation: payload.collation || undefined,
            original_schema_name: payload.oldSchema || undefined, // se teu backend suportar
          },
          { withCredentials: true }
        );

        closeTableModal();
        await loadInitialData();
      } catch (err) {
        setError(parseErrorMessage(err));
      } finally {
        setIsLoading(false);
        setLoadingFields(false);
      }
    },
    [api, loadInitialData, loadingFields, closeTableModal]
  );

  const handleDeleteTableFromModal = useCallback(
    async (ctx: { name: string; schema?: string }) => {
      if (!confirm(`Eliminar tabela "${ctx.name}"? Essa ação é irreversível.`)) return;

      try {
        setIsLoading(true);
        await api.delete(`/database/table/${encodeURIComponent(ctx.name)}`, {
          params: {
            connection_id: user?.info_extra?.id_connection,
            schema_name: ctx.schema || undefined,
          },
          withCredentials: true,
        });
        setMetadata((prev: DatabaseMetadata | null) => {
          if (!prev) return null;
          const filteredTables = prev.table_names.filter(t => t.name !== ctx.name);

          return { ...prev, table_names: filteredTables };
        });
        closeTableModal();
        await loadInitialData();

        setSelectedTables((prev) => {
          const s = new Set(prev);
          s.delete(ctx.name);
          return s;
        });
      } catch (err) {
        setError(parseErrorMessage(err));
      } finally {
        setIsLoading(false);
      }
    },
    [api, loadInitialData, closeTableModal]
  );

  const handleDeleteSelectedColumns = useCallback(
    async (tableName: string, columns: string[]) => {
      if (!columns?.length) return alert("Nenhuma coluna selecionada.");
      if (!confirm(`Remover ${columns.length} coluna(s) da tabela "${tableName}"?`)) return;

      try {
        setIsLoading(true);
        await api.request({
          method: "DELETE",
          url: `/database/columns/${encodeURIComponent(tableName)}`,
          data: { columns },
          withCredentials: true,
        });

        setSeleColunaForTable((prev) => ({ ...(prev ?? {}), [tableName]: new Set<string>() }));
        if (expandedTables.has(tableName)) await handleSelectTables(tableName);
      } catch (err) {
        setError(parseErrorMessage(err));
      } finally {
        setIsLoading(false);
      }
    },
    [expandedTables, handleSelectTables, api]
  );

  const themeClasses = isDarkMode ? "bg-[#0A0A0A] text-gray-100" : "bg-gray-50 text-gray-900";
  const cardClasses = isDarkMode ? "bg-[#1C1C1E] border-gray-800 shadow-sm" : "bg-white border-gray-200 shadow-sm";

  if (isLoading && (!metadata || metadata.table_names.length === 0)) {
    return (
      <div className={`min-h-screen ${themeClasses} flex items-center justify-center`}>
        <div className="text-center">
          <div className="relative mb-6">
            <div className="w-16 h-16 border-4 border-gray-200 dark:border-gray-800 border-t-blue-600 rounded-full animate-spin mx-auto" />
            <Database className="w-6 h-6 text-blue-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="text-xl font-bold mb-2">Carregando Database Explorer</p>
          <p className="text-sm text-gray-500">Preparando informações do banco de dados...</p>
        </div>
      </div>
    );
  }

  const isForbiddenError = Boolean(
    error &&
      (error.toLowerCase().includes("permissão") ||
        error.toLowerCase().includes("não autorizado") ||
        error.toLowerCase().includes("proibido") ||
        error.toLowerCase().includes("forbidden") ||
        error.toLowerCase().includes("403"))
  );

  if (error && (!metadata || metadata.table_names.length === 0)) {
    if (isForbiddenError) {
      return (
        <div className={`min-h-screen ${themeClasses} flex items-center justify-center p-4`}>
          <div className="max-w-md w-full">
            <div className={`${cardClasses} border rounded-2xl p-8 text-center shadow-lg border-amber-300 dark:border-amber-800`}>
              <div className="w-16 h-16 bg-amber-100 dark:bg-amber-950/50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-amber-600 dark:text-amber-400">
                <ShieldAlert className="w-9 h-9" />
              </div>
              <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 uppercase tracking-wider">
                Acesso Restrito
              </span>
              <h2 className="text-xl font-bold mt-2 mb-2 text-gray-900 dark:text-white">
                Permissão Insuficiente
              </h2>
              <p className="mb-5 text-sm text-gray-600 dark:text-gray-300 leading-relaxed font-medium">
                {error}
              </p>
              <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-xl p-3.5 text-xs text-amber-800 dark:text-amber-200 mb-6 text-left space-y-1">
                <p className="font-semibold">Requisitos de acesso:</p>
                <p className="text-gray-600 dark:text-gray-400">
                  Para visualizar as tabelas e estatísticas desta conexão, a sua conta precisa de pelo menos uma das permissões:
                </p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span className="bg-amber-200/80 dark:bg-amber-900/60 font-mono px-2 py-0.5 rounded text-[11px] font-bold">
                    table:read
                  </span>
                  <span className="bg-amber-200/80 dark:bg-amber-900/60 font-mono px-2 py-0.5 rounded text-[11px] font-bold">
                    table:stats
                  </span>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/home/conexao"
                  className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors font-medium text-sm text-center shadow-sm"
                >
                  Trocar Conexão
                </Link>
                <Link
                  href="/home"
                  className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-xl transition-colors font-medium text-sm text-center"
                >
                  Visão Geral
                </Link>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className={`min-h-screen ${themeClasses} flex items-center justify-center p-4`}>
        <div className="max-w-md w-full">
          <div className={`${cardClasses} border rounded-xl p-8 text-center`}>
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-5">
              <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Erro ao Carregar Dados</h2>
            <p className="mb-6 text-gray-600 dark:text-gray-400">{error}</p>
            <button
              onClick={handleRefresh}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium w-full"
            >
              Tentar Novamente
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${themeClasses} transition-colors duration-200`}>
      <DatabaseHeader
        handleRefresh={handleRefresh}
        isDarkMode={isDarkMode}
        isLoading={isLoading}
        setIsDarkMode={setIsDarkMode}
        healthStatus={healthStatus}
        metadata={metadata}
        desableTablesSystem={desableTablesSystem}
        setDesableTablesSystem={setDesableTablesSystem}
        user={user}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        filterSchema={filterSchema}
        setFilterSchema={setFilterSchema}
        sortBy={sortBy}
        setSortBy={setSortBy}
        viewMode={viewMode}
        setViewMode={setViewMode}
        schemas={schemas}
        selectAllVisible={selectAllVisible}
        clearSelection={clearSelection}
        // ✅ aqui é o ideal: em vez de setIsCreateOpen, usa "onCreateTable"
        setIsCreateOpen={openCreateModal}
        handleDeleteSelectedTables={handleDeleteSelectedTables}
        setIsTransactionOpen={setIsTransactionOpen}
        setIsBackupOpen={setIsBackupOpen}
        setIsDeadlocksOpen={setIsDeadlocksOpen}
        filteredAndSortedTables={filteredAndSortedTables}
      />

      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-xl p-4 flex items-center justify-between gap-3 text-amber-900 dark:text-amber-200 shadow-sm animate-in fade-in">
            <div className="flex items-center gap-3">
              <ShieldAlert className="w-5 h-5 flex-shrink-0 text-amber-600 dark:text-amber-400" />
              <div className="text-sm">
                <span className="font-bold">Aviso de Permissão: </span>
                <span>{error}</span>
              </div>
            </div>
            <button
              onClick={() => setError(null)}
              className="p-1 hover:bg-amber-100 dark:hover:bg-amber-900 rounded-md transition-colors text-amber-700 dark:text-amber-300"
              aria-label="Fechar"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className={`mt-4 ${viewMode === "grid" ? "grid grid-cols-1 lg:grid-cols-2 gap-6" : "space-y-4"}`}>
          {paginatedTables.map((table, idx) => {
            const isExpanded = expandedTables.has(table.name);
            const isLoadingCols = loadingColumns.has(table.name);
            const tableStructure = getTableStructure(table.name);
            return (
              <TableCard
                key={`${table.name}-${idx}`}
                table={table}
                tableStructure={tableStructure}
                table_lista={metadata?.table_names || []}
                isExpanded={isExpanded}
                isLoadingCols={isLoadingCols}
                toggleTable={toggleTable}
                colunasShow={colunasShow[table.name]}
                setColunasShow={setColunaShow}
                loadingFields={loadingFields}
                isDarkMode={isDarkMode}
                seletColunaForTable={seletColunaForTable}
                setSeleColunaForTable={setSeleColunaForTable}
                selected={selectedTables.has(table.name)}
                onToggleSelect={toggleSelectTable}
                onRequestEdit={openEditModal}
                onRequestDelete={handleDeleteTable}
                onRequestDeleteSelectedColumns={handleDeleteSelectedColumns}
              />
            );
          })}
        </div>

        {filteredAndSortedTables.length > 0 && (
          <div className="mt-8 flex justify-center">
            <Pagination
              page={currentPage}
              totalPages={totalPages}
              size="md"
              onPageChange={setCurrentPage}
              maxVisiblePages={5}
              showPageNumbers
            />
          </div>
        )}

        <EmptyStateSection
          isDarkMode={isDarkMode}
          searchTerm={searchTerm}
          filteredAndSortedTables={filteredAndSortedTables}
          setSearchTerm={setSearchTerm}
          setFilterSchema={setFilterSchema}
        />
        {/* ✅ Modal ÚNICO */}
        {isTableModalOpen && <TableModal
          isOpen={isTableModalOpen}
          mode={tableModalMode}
          table={tableModalMode === "edit" ? editingTableInfo : null}
          schemas={schemas}
          isBusy={isLoading || loadingFields}
          // 👇 TableModal tem de mandar oldName quando for edit
          oldName={editingTable ?? undefined}
          oldSchema={editingTableInfo?.schema}
          onClose={closeTableModal}
          onCreate={handleCreateTableFromModal}
          onUpdate={handleUpdateTableFromModal}
          onDelete={handleDeleteTableFromModal}
        />}

        {isTransactionOpen && <DataTransactionForm onClose={() => setIsTransactionOpen(false)} />}

        <Modal isOpen={isBackupOpen} onClose={() => setIsBackupOpen(false)} title="Backup e Restore" size="lg">
          <BackupRestoreForm connectionId="" onCancel={() => setIsBackupOpen(false)} />
        </Modal>

        {isDeadlocksOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-9999 flex items-center justify-center p-4">
            <div
              className={`${isDarkMode ? "bg-[#1C1C1E] border-gray-800" : "bg-white border-gray-200"
                } rounded-xl shadow-xl w-full max-w-6xl max-h-[90vh] overflow-auto border`}
            >
              <DeadlocksMonitor onClose={() => setIsDeadlocksOpen(false)} isDarkMode={isDarkMode} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DatabaseTablesPage;
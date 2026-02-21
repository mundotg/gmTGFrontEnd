"use client";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Database,
  AlertCircle,
} from "lucide-react";
import { MetadataTableResponse } from "@/types";
import { parseErrorMessage } from "@/util/func";
import { useSession } from "@/context/SessionContext";
import { clearCache, fetchHealthCheck, fetchStructures } from "@/app/services/metadata_DB";
import { useDatabaseMetadata } from "@/hook/useDatabaseMetadata";
import DatabaseHeader, { HealthStatus } from "./componentTabela/HeaderComponent";
import EmptyStateSection from "./componentTabela/EmptyStateSection";
import { TableCard } from "./componentTabela/TabelaCard";
import { Modal } from "@/app/component";
import { CreateTableForm } from "./componentTabela/CreateTableForm";
import { EditTableForm } from "./componentTabela/EditTableForm";
import { DataTransactionForm } from "./componentTabela/DataTransactionForm";
import { BackupRestoreForm } from "./componentTabela/BackupRestoreForm";
import { DeadlocksMonitor } from "./componentTabela/DeadlocksMonitor";
import { DBStructure } from "@/types/db-structure";
import usePersistedState from "@/hook/localStoreUse";

// IMPORTANTE: Importe o seu componente de paginação. Ajuste o caminho se necessário.
import Pagination from "@/app/component/pagination-component"; 

const ITEMS_PER_PAGE = 6; // <-- Definindo o limite de 6 linhas por página

const DatabaseTablesPage: React.FC = () => {
  const { metadata, loading: loadingMetadata, error: errorFetch } = useDatabaseMetadata();
  const [structures, setStructures] = useState<DBStructure[]>([]);
  const [expandedTables, setExpandedTables] = useState<Set<string>>(new Set());
  const [loadingColumns, setLoadingColumns] = useState<Set<string>>(new Set());
  const [seletColunaForTable, setSeleColunaForTable] = useState<Record<string, Set<string>> | undefined>({});
  const [isLoading, setIsLoading] = useState(loadingMetadata);
  const [loadingFields, setLoadingFields] = useState(false);
  const [error, setError] = useState<string | null>(errorFetch);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [isDarkMode, setIsDarkMode] = usePersistedState("tema_menu_tabela", false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [filterSchema, setFilterSchema] = useState("all");
  const [sortBy, setSortBy] = useState<"name" | "rows" | "schema">("name");
  const { api, user } = useSession();
  const [colunasShow, setColunaShow] = usePersistedState<Record<string, MetadataTableResponse | undefined>>("colunasShow_menu_tabela", {});
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null);

  const [selectedTables, setSelectedTables] = useState<Set<string>>(new Set());

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<string | null>(null);

  const [isTransactionOpen, setIsTransactionOpen] = usePersistedState("openisTransactionOpen", false);
  const [isBackupOpen, setIsBackupOpen] = useState(false);
  const [isDeadlocksOpen, setIsDeadlocksOpen] = usePersistedState("isDeadlocksOpen", false);

  // --- Estado da Paginação ---
  const [currentPage, setCurrentPage] = useState(1);

  // Toda vez que a busca ou os filtros mudam, resetamos para a página 1
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterSchema, sortBy]);

  const loadInitialData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [structuresData, healthData] = await Promise.all([fetchStructures(), fetchHealthCheck()]);
      setStructures(structuresData);
      setHealthStatus(healthData);
    } catch (err) {
      const errorMsg = parseErrorMessage(err);
      setError(errorMsg);
      console.error("❌ Erro ao carregar dados:", errorMsg);
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
      const errorMsg = parseErrorMessage(err);
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, [loadInitialData]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  const handleSelectTables = useCallback(async (tableName: string) => {
    if (colunasShow[tableName]) {
      setLoadingColumns(prev => {
        const newSet = new Set(prev);
        newSet.delete(tableName);
        return newSet;
      });
      return;
    }
    try {
      setLoadingColumns(prev => new Set(prev).add(tableName));
      const rs = await api.get<MetadataTableResponse>(`/consu/metadata_fieds/${encodeURIComponent(tableName)}`, { withCredentials: true, timeout: 65000 });
      setColunaShow(prev => ({ ...prev, [tableName]: rs.data }));
    } catch (err) {
      const errorMsg = parseErrorMessage(err);
      setError(errorMsg);
    } finally {
      setLoadingColumns(prev => {
        const newSet = new Set(prev);
        newSet.delete(tableName);
        return newSet;
      });
    }
  }, [colunasShow, api, setColunaShow]);

  const toggleTable = useCallback((tableName: string) => {
    setExpandedTables(prev => {
      const newSet = new Set(prev);
      if (newSet.has(tableName)) newSet.delete(tableName);
      else {
        newSet.add(tableName);
        handleSelectTables(tableName);
      }
      return newSet;
    });
  }, [handleSelectTables]);

  const getTableStructure = useCallback((tableName: string): DBStructure | undefined => {
    return structures.find(s => s.table_name.toLowerCase() === tableName.toLowerCase());
  }, [structures]);

  const schemas = useMemo(() => {
    const schemaSet = new Set<string>();
    structures.forEach(s => { if (s.schema_name) schemaSet.add(s.schema_name); });
    return Array.from(schemaSet);
  }, [structures]);

  // Lista COMPLETA, filtrada e ordenada (Base de dados para a paginação)
  const filteredAndSortedTables = useMemo(() => {
    const filtered = metadata?.table_names.filter(table => {
      const tableStructure = getTableStructure(table.name);
      const matchesSearch =
        table.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (tableStructure?.schema_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (tableStructure?.description || "").toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSchema = filterSchema === "all" || tableStructure?.schema_name === filterSchema;
      return matchesSearch && matchesSchema;
    }) || [];

    filtered.sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "rows") return (b.rowcount || 0) - (a.rowcount || 0);
      if (sortBy === "schema") {
        const sa = getTableStructure(a.name)?.schema_name || "";
        const sb = getTableStructure(b.name)?.schema_name || "";
        return sa.localeCompare(sb);
      }
      return 0;
    });

    return filtered;
  }, [metadata, searchTerm, filterSchema, sortBy, getTableStructure]);

  // --- Lógica Matemática da Paginação ---
  const totalPages = Math.ceil(filteredAndSortedTables.length / ITEMS_PER_PAGE);
  
  // Lista FATIADA contendo apenas os 6 itens da página atual
  const paginatedTables = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredAndSortedTables.slice(startIndex, endIndex);
  }, [filteredAndSortedTables, currentPage]);


  const toggleSelectTable = useCallback((tableName: string) => {
    setSelectedTables(prev => {
      const newSet = new Set(prev);
      if (newSet.has(tableName)) newSet.delete(tableName);
      else newSet.add(tableName);
      return newSet;
    });
  }, []);

  const selectAllVisible = useCallback(() => {
    setSelectedTables(new Set(filteredAndSortedTables.map(t => t.name)));
  }, [filteredAndSortedTables]);

  const clearSelection = useCallback(() => {
    setSelectedTables(new Set());
  }, []);

  const handleDeleteTable = useCallback(async (tableName: string) => {
    if (!confirm(`Eliminar tabela "${tableName}"? Essa ação é irreversível.`)) return;
    try {
      setIsLoading(true);
      await api.delete(`/consu/table/${encodeURIComponent(tableName)}`, { withCredentials: true });
      await loadInitialData();
      setSelectedTables(prev => { const s = new Set(prev); s.delete(tableName); return s; });
    } catch (err) {
      setError(parseErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [api, loadInitialData]);

  const handleDeleteSelectedTables = useCallback(async () => {
    const list = Array.from(selectedTables);
    if (list.length === 0) { alert("Nenhuma tabela selecionada."); return; }
    if (!confirm(`Eliminar ${list.length} tabelas selecionadas? Essa ação é irreversível.`)) return;
    try {
      setIsLoading(true);
      await api.request({ method: "DELETE", url: "/consu/tables", data: { tables: list }, withCredentials: true });
      await loadInitialData();
      setSelectedTables(new Set());
    } catch (err) {
      setError(parseErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [selectedTables, api, loadInitialData]);

  const openEditModal = useCallback((tableName: string) => {
    setEditingTable(tableName);
    setIsEditOpen(true);
  }, []);

  const handleSaveEdit = useCallback(async (newName: string, newDescription: string) => {
    if (!editingTable || loadingFields) return;
    setLoadingFields(true);
    try {
      setIsLoading(true);
      await api.put(`/consu/table/${encodeURIComponent(editingTable)}`, { name: newName, description: newDescription }, { withCredentials: true });
      setIsEditOpen(false);
      setEditingTable(null);
      await loadInitialData();
    } catch (err) {
      setError(parseErrorMessage(err));
    } finally {
      setIsLoading(false);
      setLoadingFields(false);
    }
  }, [editingTable, loadingFields, api, loadInitialData]);

  const handleCreateTable = useCallback(async (name: string, schema?: string) => {
    if (!name) { alert("Nome da tabela é obrigatório."); return; }
    try {
      setIsLoading(true);
      await api.post("/consu/table", { name, schema: schema || undefined }, { withCredentials: true });
      setIsCreateOpen(false);
      await loadInitialData();
    } catch (err) {
      setError(parseErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [api, loadInitialData]);

  const handleDeleteSelectedColumns = useCallback(async (tableName: string, columns: string[]) => {
    if (!columns || columns.length === 0) { alert("Nenhuma coluna selecionada."); return; }
    if (!confirm(`Remover ${columns.length} coluna(s) da tabela "${tableName}"?`)) return;
    try {
      setIsLoading(true);
      await api.request({ method: "DELETE", url: `/consu/columns/${encodeURIComponent(tableName)}`, data: { columns }, withCredentials: true });
      setSeleColunaForTable(prev => ({ ...(prev ?? {}), [tableName]: new Set<string>() }));
      if (expandedTables.has(tableName)) await handleSelectTables(tableName);
    } catch (err) {
      setError(parseErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [expandedTables, handleSelectTables, api]);

  // Estilos padronizados baseados no seu "Tema Oficial"
  const themeClasses = isDarkMode 
    ? "bg-[#0A0A0A] text-gray-100" 
    : "bg-gray-50 text-gray-900";
  
  const cardClasses = isDarkMode 
    ? "bg-[#1C1C1E] border-gray-800 shadow-sm" 
    : "bg-white border-gray-200 shadow-sm";

  if (isLoading && (!metadata || metadata.table_names.length === 0)) {
    return (
      <div className={`min-h-screen ${themeClasses} flex items-center justify-center`}>
        <div className="text-center">
          <div className="relative mb-6">
            <div className="w-16 h-16 border-4 border-gray-200 dark:border-gray-800 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
            <Database className="w-6 h-6 text-blue-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="text-xl font-bold mb-2">
            Carregando Database Explorer
          </p>
          <p className="text-sm text-gray-500">
            Preparando informações do banco de dados...
          </p>
        </div>
      </div>
    );
  }

  if (error && (!metadata || metadata.table_names.length === 0)) {
    return (
      <div className={`min-h-screen ${themeClasses} flex items-center justify-center p-4`}>
        <div className="max-w-md w-full">
          <div className={`${cardClasses} border rounded-xl p-8 text-center`}>
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-5">
              <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">
              Erro ao Carregar Dados
            </h2>
            <p className="mb-6 text-gray-600 dark:text-gray-400">
              {error}
            </p>
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
        cardClasses={cardClasses}
        healthStatus={healthStatus} 
        metadata={metadata} 
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
        setIsCreateOpen={setIsCreateOpen}
        handleDeleteSelectedTables={handleDeleteSelectedTables}
        setIsTransactionOpen={setIsTransactionOpen}
        setIsBackupOpen={setIsBackupOpen}
        setIsDeadlocksOpen={setIsDeadlocksOpen}
        filteredAndSortedTables={filteredAndSortedTables} 
      />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Renderiza apenas a lista paginada (os 6 itens) */}
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
                isExpanded={isExpanded}
                isLoadingCols={isLoadingCols}
                toggleTable={toggleTable}
                colunasShow={colunasShow[table.name]}
                loadingFields={loadingFields}
                isDarkMode={isDarkMode}
                seletColunaForTable={seletColunaForTable}
                setSeleColunaForTable={setSeleColunaForTable}
                selected={selectedTables?.has(table.name)}
                onToggleSelect={toggleSelectTable}
                onRequestEdit={(name) => openEditModal(name)}
                onRequestDelete={(name) => handleDeleteTable(name)}
                onRequestDeleteSelectedColumns={(name, cols) => handleDeleteSelectedColumns(name, cols)}
              />
            );
          })}
        </div>

        {/* Componente de Paginação (Mostra apenas se houver tabelas) */}
        {filteredAndSortedTables.length > 0 && (
          <div className="mt-8 flex justify-center">
            <Pagination 
              page={currentPage} 
              totalPages={totalPages} 
              size="md" 
              onPageChange={setCurrentPage} 
              maxVisiblePages={5} 
              showPageNumbers={true} 
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

        {/* Modals */}
        <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Criar nova tabela">
          <CreateTableForm onCreate={handleCreateTable} onCancel={() => setIsCreateOpen(false)} schemas={schemas} />
        </Modal>

        <Modal isOpen={isEditOpen} onClose={() => { setIsEditOpen(false); setEditingTable(null); }} title={`Editar tabela ${editingTable ?? ""}`}>
          <EditTableForm tableName={editingTable} onSave={handleSaveEdit} onCancel={() => { setIsEditOpen(false); setEditingTable(null); }} getStructure={getTableStructure} />
        </Modal>

        {isTransactionOpen && <DataTransactionForm onClose={() => setIsTransactionOpen(false)} />}

        <Modal isOpen={isBackupOpen} onClose={() => setIsBackupOpen(false)} title="Backup e Restore">
          <BackupRestoreForm
            connectionId=""
            onCancel={() => setIsBackupOpen(false)}
          />
        </Modal>

        {isDeadlocksOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
            <div className={`${isDarkMode ? 'bg-[#1C1C1E] border-gray-800' : 'bg-white border-gray-200'} rounded-xl shadow-xl w-full max-w-6xl max-h-[90vh] overflow-auto border`}>
              <DeadlocksMonitor
                onClose={() => setIsDeadlocksOpen(false)}
                isDarkMode={isDarkMode}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DatabaseTablesPage;
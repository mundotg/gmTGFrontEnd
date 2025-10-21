// DatabaseTablesPage.tsx
"use client";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Database,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { MetadataTableResponse } from "@/types";
import { parseErrorMessage } from "@/util/func";
import { useSession } from "@/context/SessionContext";
import { DBStructureOut } from "@/types/db-structure";
import { clearCache, fetchHealthCheck, fetchStructures } from "@/app/services/metadata_DB";
import { useDatabaseMetadata } from "@/hook/useDatabaseMetadata";
import DatabaseHeader from "./componentTabela/HeaderComponent";
import { FilterPanel } from "./componentTabela/FilterPanel";
import EmptyStateSection from "./componentTabela/EmptyStateSection";
import { TableCard } from "./componentTabela/TabelaCard";
import { Modal } from "@/app/component";

const DatabaseTablesPage: React.FC = () => {
  const { metadata, loading: loadingMetadata, error: errorFetch } = useDatabaseMetadata();
  const [structures, setStructures] = useState<DBStructureOut[]>([]);
  const [expandedTables, setExpandedTables] = useState<Set<string>>(new Set());
  const [loadingColumns, setLoadingColumns] = useState<Set<string>>(new Set());
  const [seletColunaForTable, setSeleColunaForTable] = useState<Record<string, Set<string>> | undefined>({});
  const [isLoading, setIsLoading] = useState(loadingMetadata);
  const [loadingFields, setLoadingFields] = useState(false);
  const [error, setError] = useState<string | null>(errorFetch);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [filterSchema, setFilterSchema] = useState("all");
  const [sortBy, setSortBy] = useState<"name" | "rows" | "schema">("name");
  const { api, user } = useSession();
  const [colunasShow, setColunaShow] = useState<MetadataTableResponse | undefined>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [healthStatus, setHealthStatus] = useState<any>(null);

  // seleção de linhas / tabelas
  const [selectedTables, setSelectedTables] = useState<Set<string>>(new Set());

  // modais: criar e editar
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<string | null>(null);

  // --- Carregar dados iniciais
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

  // --- buscar colunas de uma tabela
  const handleSelectTables = useCallback(async (tableName: string) => {
    try {
      setLoadingColumns(prev => new Set(prev).add(tableName));
      const rs = await api.get<MetadataTableResponse>(`/consu/metadata_fieds/${encodeURIComponent(tableName)}`, { withCredentials: true, timeout: 45000 });
      setColunaShow(rs.data);
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
  }, [api]);

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

  const getTableStructure = useCallback((tableName: string): DBStructureOut | undefined => {
    return structures.find(s => s.table_name.toLowerCase() === tableName.toLowerCase());
  }, [structures]);

  // schemas
  const schemas = useMemo(() => {
    const schemaSet = new Set<string>();
    structures.forEach(s => { if (s.schema_name) schemaSet.add(s.schema_name); });
    return Array.from(schemaSet);
  }, [structures]);

  // filtrar / ordenar
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

  // --- Seleção de tabelas
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

  // --- Deletar tabela (individual)
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

  // --- Deletar múltiplas tabelas selecionadas
  const handleDeleteSelectedTables = useCallback(async () => {
    const list = Array.from(selectedTables);
    if (list.length === 0) { alert("Nenhuma tabela selecionada."); return; }
    if (!confirm(`Eliminar ${list.length} tabelas selecionadas? Essa ação é irreversível.`)) return;
    try {
      setIsLoading(true);
      // supondo endpoint que aceita body com array de tabelas
      await api.request({ method: "DELETE", url: "/consu/tables", data: { tables: list }, withCredentials: true });
      await loadInitialData();
      setSelectedTables(new Set());
    } catch (err) {
      setError(parseErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [api, selectedTables, loadInitialData]);

  // --- Editar Tabela (abre modal)
  const openEditModal = useCallback((tableName: string) => {
    setEditingTable(tableName);
    setIsEditOpen(true);
  }, []);

  const handleSaveEdit = useCallback(async (newName: string, newDescription: string) => {
    if (!editingTable ||  loadingFields) return;
    setLoadingFields(true)
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
      setLoadingFields(false)
    }
  }, [api, editingTable, loadInitialData]);

  // --- Criar nova tabela
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

  // --- Deletar colunas selecionadas (de uma tabela)
  const handleDeleteSelectedColumns = useCallback(async (tableName: string, columns: string[]) => {
    if (!columns || columns.length === 0) { alert("Nenhuma coluna selecionada."); return; }
    if (!confirm(`Remover ${columns.length} coluna(s) da tabela "${tableName}"?`)) return;
    try {
      setIsLoading(true);
      await api.request({ method: "DELETE", url: `/consu/columns/${encodeURIComponent(tableName)}`, data: { columns }, withCredentials: true });
      // limpar seleção local para a tabela
      setSeleColunaForTable(prev => ({ ...(prev ?? {}), [tableName]: new Set<string>() }));
      // recarregar colunas abertas
      if (expandedTables.has(tableName)) await handleSelectTables(tableName);
    } catch (err) {
      setError(parseErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [api, expandedTables, handleSelectTables]);

  const themeClasses = isDarkMode ? "bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 text-white" : "bg-gradient-to-br from-gray-50 via-white to-gray-50 text-gray-900";
  const cardClasses = isDarkMode ? "bg-gray-800/50 backdrop-blur-sm border-gray-700" : "bg-white/80 backdrop-blur-sm border-gray-200";

  if (isLoading && (!metadata || metadata.table_names.length === 0)) {
    return (
      <div className={`min-h-screen ${themeClasses} flex items-center justify-center`}>
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-6"></div>
            <Database className="w-8 h-8 text-blue-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="text-xl font-semibold">Carregando Database Explorer...</p>
          <p className={`text-sm mt-2 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>Preparando informações do banco de dados</p>
        </div>
      </div>
    );
  }

  if (error && (!metadata || metadata.table_names.length === 0)) {
    return (
      <div className={`min-h-screen ${themeClasses} flex items-center justify-center p-4`}>
        <div className="max-w-md w-full">
          <div className={`${cardClasses} border rounded-2xl p-8 text-center shadow-xl`}>
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Erro ao Carregar Dados</h2>
            <p className={`mb-6 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>{error}</p>
            <button onClick={handleRefresh} className="px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all font-medium shadow-lg hover:shadow-xl">Tentar Novamente</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${themeClasses} transition-all duration-300`}>
      <DatabaseHeader handleRefresh={handleRefresh} isDarkMode={isDarkMode} isLoading={isLoading} setIsDarkMode={setIsDarkMode} cardClasses={cardClasses} healthStatus={healthStatus} metadata={metadata} user={user} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <FilterPanel
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          filterSchema={filterSchema}
          setFilterSchema={setFilterSchema}
          sortBy={sortBy}
          setSortBy={setSortBy}
          viewMode={viewMode}
          setViewMode={setViewMode}
          schemas={schemas}
          isDarkMode={isDarkMode}
        />

        {/* Barra de ações (seleção em massa) */}
        <div className="mt-4 mb-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button onClick={selectAllVisible} className="px-3 py-1 rounded-md bg-blue-50 text-blue-600">Selecionar todos</button>
            <button onClick={clearSelection} className="px-3 py-1 rounded-md bg-gray-50">Limpar seleção</button>
            <button onClick={() => setIsCreateOpen(true)} className="px-3 py-1 rounded-md bg-green-50 text-green-700">Nova tabela</button>
            <button onClick={handleDeleteSelectedTables} className="px-3 py-1 rounded-md bg-red-50 text-red-600">Eliminar selecionadas</button>
          </div>

          <div>
            <span className="text-sm">{filteredAndSortedTables.length} {filteredAndSortedTables.length === 1 ? "tabela" : "tabelas"}</span>
            {isLoading && <span className="ml-3 text-sm text-blue-500"><Loader2 className="inline w-4 h-4 animate-spin" /> Atualizando...</span>}
          </div>
        </div>

        {/* Listagem */}
        <div className={`mt-6 ${viewMode === "grid" ? "grid grid-cols-1 lg:grid-cols-2 gap-4" : "space-y-4"}`}>
          {filteredAndSortedTables.map((table, idx) => {
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
                colunasShow={colunasShow}
                loadingFields={loadingFields}
                isDarkMode={isDarkMode}
                seletColunaForTable={seletColunaForTable}
                setSeleColunaForTable={setSeleColunaForTable}
                selected={selectedTables.has(table.name)}
                onToggleSelect={toggleSelectTable}
                onRequestEdit={(name) => openEditModal(name)}
                onRequestDelete={(name) => handleDeleteTable(name)}
                onRequestDeleteSelectedColumns={(name, cols) => handleDeleteSelectedColumns(name, cols)}
              />
            );
          })}
        </div>

        <EmptyStateSection isDarkMode={isDarkMode} searchTerm={searchTerm} filteredAndSortedTables={filteredAndSortedTables} setSearchTerm={setSearchTerm} setFilterSchema={setFilterSchema} />

        {/* Modal Criar */}
        <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Criar nova tabela">
          <CreateTableForm onCreate={handleCreateTable} onCancel={() => setIsCreateOpen(false)} schemas={schemas} />
        </Modal>

        {/* Modal Editar */}
        <Modal isOpen={isEditOpen} onClose={() => { setIsEditOpen(false); setEditingTable(null); }} title={`Editar tabela ${editingTable ?? ""}`}>
          <EditTableForm tableName={editingTable} onSave={handleSaveEdit} onCancel={() => { setIsEditOpen(false); setEditingTable(null); }} getStructure={getTableStructure} />
        </Modal>
      </div>
    </div>
  );
};

export default DatabaseTablesPage;

/* ---------- Formulários simples usados pelos modais ---------- */

const CreateTableForm: React.FC<{ onCreate: (name: string, schema?: string) => void; onCancel: () => void; schemas: string[] }> = ({ onCreate, onCancel, schemas }) => {
  const [name, setName] = useState("");
  const [schema, setSchema] = useState<string | undefined>(schemas?.[0]);
  return (
    <div>
      <label className="block text-sm mb-1">Nome da tabela</label>
      <input value={name} onChange={(e) => setName(e.target.value)} className="w-full p-2 rounded border mb-3" />
      <label className="block text-sm mb-1">Schema (opcional)</label>
      <select value={schema} onChange={(e) => setSchema(e.target.value)} className="w-full p-2 rounded mb-4">
        <option value="">(padrão)</option>
        {schemas.map(s => <option key={s} value={s}>{s}</option>)}
      </select>
      <div className="flex justify-end gap-2">
        <button onClick={onCancel} className="px-3 py-1">Cancelar</button>
        <button onClick={() => onCreate(name, schema)} className="px-3 py-1 bg-blue-500 text-white rounded">Criar</button>
      </div>
    </div>
  );
};

const EditTableForm: React.FC<{ tableName: string | null; onSave: (newName: string, newDesc: string) => void; onCancel: () => void; getStructure: (name: string) => DBStructureOut | undefined }> = ({ tableName, onSave, onCancel, getStructure }) => {
  const structure = tableName ? getStructure(tableName) : undefined;
  const [name, setName] = useState(tableName ?? "");
  const [desc, setDesc] = useState(structure?.description ?? "");

  useEffect(() => {
    setName(tableName ?? "");
    setDesc(structure?.description ?? "");
  }, [tableName, structure]);

  return (
    <div>
      <label className="block text-sm mb-1">Nome</label>
      <input value={name} onChange={(e) => setName(e.target.value)} className="w-full p-2 rounded border mb-3" />
      <label className="block text-sm mb-1">Descrição</label>
      <textarea value={desc} onChange={(e) => setDesc(e.target.value)} className="w-full p-2 rounded border mb-4" />
      <div className="flex justify-end gap-2">
        <button onClick={onCancel} className="px-3 py-1">Cancelar</button>
        <button onClick={() => onSave(name, desc)} className="px-3 py-1 bg-blue-500 text-white rounded">Salvar</button>
      </div>
    </div>
  );
};

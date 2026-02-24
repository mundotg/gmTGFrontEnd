"use client";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Moon, Sun, Loader2, Plus, Filter } from "lucide-react";
import {
  CampoDetalhado,
  EditedFieldForQuery,
  FieldDDLRequestPayload,
  MetadataTableResponse,
  TableColumnsDisplayProps,
} from "@/types";
import { useTableColumns } from "@/hook/useTable";
import { ColumnSkeleton, ErrorDisplay } from "@/util";
import CriarRegistroNovo from "./criar-registro";
import ModalAutoCreate from "./ModalIntermediario";
import usePersistedState from "@/hook/localStoreUse";
import { FilterableGrid } from "./columns-displayComponent/FilterableGrid";
import { FormatoRelatorio, useRelatorioAvancado } from "../services/useRelatorio";
import { RelatorioPayload } from "@/hook/useRelatorio";
import { FORMATS, ReportButton } from "../services/ReportButton";
import { useI18n } from "@/context/I18nContext";
import { themeClassesMap } from "@/constant";
import { useSession } from "@/context/SessionContext";
import FieldModal from "./EditFieldModal";

type TypesAlert = "success" | "error" | "info";
type AlertState = { type: TypesAlert; message: string } | null;

function extractApiErrorMessage(err: any): string {
  const axiosMsg =
    err?.response?.data?.detail ||
    err?.response?.data?.message ||
    err?.response?.data?.error ||
    err?.message;

  if (typeof axiosMsg === "string" && axiosMsg.trim()) return axiosMsg;

  try {
    return JSON.stringify(err?.response?.data || err);
  } catch {
    return "Erro inesperado ao comunicar com a API.";
  }
}

const TableColumnsDisplay: React.FC<TableColumnsDisplayProps> = ({
  names_caches_value,
  tableNames,
  columns,
  setColumns,
  className = "",
  isLoading = false,
  setIsLoading,
  tabelaExistenteNaDB,
  error,
  theme = "light",
  itemsPerPage = 12,
  onColumnClick,
  setSelect,
  select,
}) => {
  const { t } = useI18n();
  const { api } = useSession();

  // ✅ garante select sempre como array
  const safeSelect = useMemo(() => (Array.isArray(select) ? select : []), [select]);

  // Dark Mode
  const [isDarkMode, setIsDarkMode] = usePersistedState<boolean>(names_caches_value._thema, theme === "dark");
  const currentTheme = isDarkMode ? "dark" : "light";

  useEffect(() => {
    if (isDarkMode) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }, [isDarkMode]);

  const [openIntermediario, setOpenIntermediario] = useState(false);
  const [modalCreateOpen, setModalCreateOpen] = usePersistedState<boolean>(names_caches_value._modal_Create_Open, false);

  // ✅ coluna atualmente selecionada/ativa
  const [selectedColumn, setSelectedColumn] = useState<(CampoDetalhado & { tableName: string }) | null>(null);

  const [showFilters, setShowFilters] = usePersistedState<boolean>(names_caches_value.consulta_showFilterColunas, false);
  const [hydrated, setHydrated] = useState(false);

  // ✅ ALERTAS INLINE
  const [alert, setAlert] = useState<AlertState>(null);
  const alertTimerRef = useRef<number | null>(null);

  const showAlert = useCallback((type: TypesAlert, message: string) => {
    setAlert({ type, message });

    if (alertTimerRef.current) {
      window.clearTimeout(alertTimerRef.current);
      alertTimerRef.current = null;
    }

    alertTimerRef.current = window.setTimeout(() => setAlert(null), 4500);
  }, []);

  useEffect(() => {
    return () => {
      if (alertTimerRef.current) window.clearTimeout(alertTimerRef.current);
    };
  }, []);

  // Relatório
  const {
    gerarRelatorio,
    cancelarGeracao,
    isLoading: isLoadingRelatorio,
    error: errorRelatorio,
    success: successRelatorio,
    progress: progressRelatorio,
    tempoEstimado,
    dadosRelatorio,
    reset: resetRelatorio,
  } = useRelatorioAvancado<MetadataTableResponse[]>();

  useEffect(() => setHydrated(true), []);

  const {
    searchTerm,
    setSearchTerm,
    filterType,
    setFilterType,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    currentPage,
    setCurrentPage,
    filteredAndSortedColumns,
  } = useTableColumns(columns);

  // ✅ modal 3-em-1
  const [fieldModalOpen, setFieldModalOpen] = useState(false);
  const [fieldModalMode, setFieldModalMode] = useState<"create" | "edit">("edit");
  const [selectedTableForCreate, setSelectedTableForCreate] = useState<string>("");

  const totalPages = useMemo(
    () => Math.ceil(filteredAndSortedColumns.length / itemsPerPage),
    [filteredAndSortedColumns, itemsPerPage]
  );

  const themeClasses = themeClassesMap[currentTheme === "dark" ? "dark" : "light"];

  const getColumnCount = useMemo(() => filteredAndSortedColumns.length, [filteredAndSortedColumns.length]);

  const paginatedColumns = useMemo(
    () => filteredAndSortedColumns.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage),
    [filteredAndSortedColumns, currentPage, itemsPerPage]
  );

  const totalCols = useMemo(
    () => columns?.reduce((acc, c) => acc + (c.total_colunas || 0), 0) || 0,
    [columns]
  );

  // ✅ clicar numa coluna abre EDIT na modal
  const handleColumnClick = useCallback(
    (col: CampoDetalhado & { tableName: string }) => {
      setSelectedColumn(col);
      setFieldModalMode("edit");
      setFieldModalOpen(true);
      onColumnClick?.(col);
    },
    [onColumnClick]
  );

  const handleColumnSelect = useCallback(
    (col: CampoDetalhado & { tableName: string }, event: React.MouseEvent) => {
      event.stopPropagation();
      const columnKey = `${col.tableName}.${col.nome}`;
      const newSelected = new Set(safeSelect);

      if (newSelected.has(columnKey)) newSelected.delete(columnKey);
      else newSelected.add(columnKey);

      setSelect?.(Array.from(newSelected));
    },
    [safeSelect, setSelect]
  );

  const isColumnSelected = useCallback(
    (col: CampoDetalhado & { tableName: string }) => safeSelect.includes(`${col.tableName}.${col.nome}`),
    [safeSelect]
  );

  const handleSelectAll = useCallback(() => {
    const allKeys = filteredAndSortedColumns.map((col) => `${col.tableName}.${col.nome}`);
    const allSelected = allKeys.every((key) => safeSelect.includes(key));
    setSelect?.(allSelected ? [] : allKeys);
  }, [filteredAndSortedColumns, safeSelect, setSelect]);

  // ============================================================
  // ✅ Helpers de metadata / tabela
  // ============================================================

  const resolveTableInfo = useCallback(
    (tableName: string) => {
      const tn = (tableName || "").trim();
      if (!tn) return null;

      const lastPart = tn.includes(".") ? tn.split(".").pop()! : tn;

      const found =
        columns?.find((t) => t.table_name === tn) ||
        columns?.find((t) => `${t.schema_name}.${t.table_name}` === tn) ||
        columns?.find((t) => t.table_name === lastPart);

      return found || null;
    },
    [columns]
  );

  const buildDDLRequestFromField = useCallback(
    (f: CampoDetalhado & { tableName: string }, opts?: { original_name?: string }): FieldDDLRequestPayload => {
      const tableInf = resolveTableInfo(f.tableName);
      if (!tableInf?.table_name) throw new Error(`Tabela não encontrada no metadata: '${f.tableName}'`);
      if (!tableInf?.connection_id) throw new Error("connection_id não encontrado para esta tabela.");

      const payload: FieldDDLRequestPayload = {
        connection_id: tableInf.connection_id,
        schema_name: tableInf.schema_name || null,
        table_name: tableInf.table_name,
        name: f.nome,
        type: String(f.tipo || "").toUpperCase(),

        length: (f as any).length ?? null,
        precision: (f as any).precision ?? null,
        scale: (f as any).scale ?? null,

        is_nullable: !!f.is_nullable,
        is_unique: !!f.is_unique,
        is_primary_key: !!f.is_primary_key,
        is_auto_increment: !!f.is_auto_increment,

        default_value: (f as any).default ?? null,
        comment: (f as any).comentario ?? null,

        referenced_table: (f as any).referenced_table || null,
        referenced_field: (f as any).field_references || null,
        is_foreign_key: !!((f as any).referenced_table && (f as any).field_references),
        fk_on_delete: (f as any).on_delete_action || "NO ACTION",
        fk_on_update: (f as any).on_update_action || "NO ACTION",
      };

      if (opts?.original_name) payload.original_name = opts.original_name;
      return payload;
    },
    [resolveTableInfo]
  );

  // ============================================================
  // ✅ CRUD DDL com tratamento de erros
  // ============================================================

  const withLoading = useCallback(
    async <T,>(fn: () => Promise<T>) => {
      setIsLoading?.(true);
      try {
        return await fn();
      } finally {
        setIsLoading?.(false);
      }
    },
    [setIsLoading]
  );

  const createColumn = useCallback(
    async (field: CampoDetalhado & { tableName: string }) => {
      await withLoading(async () => {
        const payload = buildDDLRequestFromField(field);
        await api.post(`/database/field/`, payload);

        showAlert("success", `Coluna '${payload.name}' criada em ${payload.table_name}.`);
        window.dispatchEvent(new CustomEvent("schema:changed", { detail: { table: field.tableName } }));
        setColumns?.(columns?.map((c) => (c.table_name === field.tableName ? { ...c, colunas: [...c.colunas, field] } : c)) || []);
      }).catch((err) => {
        const msg = extractApiErrorMessage(err);
        showAlert("error", msg);
        console.error("createColumn error:", err);
        throw err;
      });
    },
    [api, buildDDLRequestFromField, showAlert, withLoading]
  );

  const updateColumn = useCallback(
    async (originalName: string, updated: CampoDetalhado & { tableName: string }) => {
      await withLoading(async () => {
        const payload = buildDDLRequestFromField(updated, { original_name: originalName });
        await api.put(`/database/field/${encodeURIComponent(originalName)}`, payload);

        const renamed = originalName !== payload.name;
        showAlert(
          "success",
          renamed
            ? `Coluna '${originalName}' renomeada para '${payload.name}'.`
            : `Coluna '${payload.name}' atualizada com sucesso.`
        );

        window.dispatchEvent(new CustomEvent("schema:changed", { detail: { table: updated.tableName } }));
        setColumns?.(columns?.map((c) => {
          if (c.table_name === updated.tableName) {
            return {
              ...c,
              colunas: c.colunas.map((col) => col.nome === originalName ? { ...col, ...updated } : col)
            };
          }
          return c;
        }) || []);
      }).catch((err) => {
        const msg = extractApiErrorMessage(err);
        showAlert("error", msg);
        console.error("updateColumn error:", err);
        throw err;
      });
    },
    [api, buildDDLRequestFromField, showAlert, withLoading]
  );

  const deleteColumn = useCallback(
    async (tableName: string, columnName: string) => {
      await withLoading(async () => {
        const tableInf = resolveTableInfo(tableName);
        if (!tableInf?.connection_id) throw new Error("connection_id não encontrado para esta tabela.");
        if (!tableInf?.table_name) throw new Error("table_name não encontrado para esta tabela.");

        const qs = new URLSearchParams();
        qs.set("connection_id", String(tableInf.connection_id));
        if (tableInf.schema_name) qs.set("schema_name", tableInf.schema_name);

        await api.delete(
          `/database/field/${encodeURIComponent(tableInf.table_name)}/${encodeURIComponent(columnName)}?${qs.toString()}`
        );

        showAlert("success", `Coluna '${columnName}' removida de ${tableInf.table_name}.`);
        window.dispatchEvent(new CustomEvent("schema:changed", { detail: { table: tableName } }));
        setColumns?.(columns?.map((c) => {
          if (c.table_name === tableName) {
            return {
              ...c,
              colunas: c.colunas.filter((col) => col.nome !== columnName)
            };
          }          return c;
         }) || []);
      }).catch((err) => {
        const msg = extractApiErrorMessage(err);
        showAlert("error", msg);
        console.error("deleteColumn error:", err);
        throw err;
      });
    },
    [api, resolveTableInfo, showAlert, withLoading]
  );

  // ============================================================
  // ✅ Abrir modais Create/Edit
  // ============================================================

  const openCreateColumnModal = useCallback(() => {
    const firstTable =
      columns?.[0]?.table_name
        ? columns[0].schema_name
          ? `${columns[0].schema_name}.${columns[0].table_name}`
          : columns[0].table_name
        : "";

    if (!firstTable) {
      showAlert("error", "Não encontrei tabela para criar coluna (metadata vazio).");
      return;
    }

    setSelectedTableForCreate(firstTable);
    setSelectedColumn(null);
    setFieldModalMode("create");
    setFieldModalOpen(true);
  }, [columns, showAlert]);

  const openEditSelectedColumnModal = useCallback(() => {
    if (!selectedColumn) {
      showAlert("info", "Selecione uma coluna primeiro.");
      return;
    }
    setFieldModalMode("edit");
    setFieldModalOpen(true);
  }, [selectedColumn, showAlert]);

  const handleDeleteSelectedColumn = useCallback(async () => {
    if (!selectedColumn) return;

    const ok = window.confirm(`Eliminar a coluna '${selectedColumn.nome}'? Isso é destrutivo.`);
    if (!ok) return;

    await deleteColumn(selectedColumn.tableName, selectedColumn.nome);
    setSelectedColumn(null);
  }, [selectedColumn, deleteColumn]);

  // ============================================================

  const handleGerarRelatorio = useCallback(
    async (format: FormatoRelatorio) => {
      if (!columns || columns.length === 0) return;

      const payload: RelatorioPayload<MetadataTableResponse[]> = {
        tipo: "metadados",
        body: columns,
        filtros: {
          tabelas: tableNames,
          totalColunas: totalCols,
        },
        parametros: {
          formato: format,
          incluirDetalhes: true,
        },
      };

      await gerarRelatorio(payload);
    },
    [columns, tableNames, totalCols, gerarRelatorio]
  );

  if (!hydrated) {
    return (
      <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 ${className}`}>
        <div className="text-sm text-gray-500">{t("common.loadingColumns") || "Carregando colunas..."}</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 ${className}`}>
        <ErrorDisplay error={error} theme={currentTheme} />
      </div>
    );
  }

  function handleRowUpdate(updatedRow: EditedFieldForQuery): void {
    console.log(updatedRow);
  }

  const handleConfirm = () => setModalCreateOpen(true);

  return (
    <div
      className={`bg-white dark:bg-[#1C1C1E] rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-5 sm:p-6 transition-colors duration-300 ${className}`}
      aria-label="Exibição_de_Colunas_da_Tabela"
    >
      {/* ✅ ALERTA INLINE */}
      {alert && (
        <div
          className={`mb-5 p-3 rounded-xl border text-sm font-semibold flex items-center justify-between gap-3 ${alert.type === "success"
              ? "bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300"
              : alert.type === "error"
                ? "bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300"
                : "bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300"
            }`}
        >
          <span className="truncate">{alert.message}</span>
          <button
            onClick={() => setAlert(null)}
            className="text-[11px] uppercase tracking-wider font-bold hover:underline shrink-0"
          >
            {t("actions.close") || "Fechar"}
          </button>
        </div>
      )}

      {/* Cabeçalho */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 gap-4 border-b border-gray-100 dark:border-gray-800 pb-4">
        {/* Nome + Tema */}
        <div className="flex items-center gap-3 min-w-0">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate max-w-[60vw] sm:max-w-[70vw] lg:max-w-[40vw] flex items-center gap-2 transition-colors">
            {t("common.columns") || "Colunas"}:
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-md whitespace-nowrap overflow-hidden text-ellipsis transition-colors">
              {tableNames}
            </span>
          </h3>

          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors shrink-0 outline-none focus:ring-2 focus:ring-blue-500/50"
            title={t("actions.toggleTheme") || "Alternar tema"}
          >
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>

        {/* ✅ Modal 3-em-1 */}
        <FieldModal
          key={`${fieldModalMode}-${fieldModalMode === "create" ? selectedTableForCreate : selectedColumn?.tableName}-${selectedColumn?.nome || "new"}`}
          isOpen={fieldModalOpen}
          mode={fieldModalMode}
          field={selectedColumn}
          tableName={fieldModalMode === "create" ? selectedTableForCreate : selectedColumn?.tableName}
          tabelaExistenteNaDB={tabelaExistenteNaDB}
          onClose={() => setFieldModalOpen(false)}
          onCreate={async (newField) => {
            await createColumn(newField);
          }}
          onUpdate={async (updated) => {
            if (!selectedColumn) throw new Error("Coluna original não definida.");
            await updateColumn(selectedColumn.nome, updated);
          }}
          onDelete={async ({ tableName, columnName }) => {
            await deleteColumn(tableName, columnName);
          }}
        />

        {/* Modais existentes */}
        <ModalAutoCreate
          isOpen={openIntermediario}
          setModelDeCriacaoDeRegistro={handleConfirm}
          onClose={() => setOpenIntermediario(false)}
          onConfirm={(configs) => console.log("Config recebida do intermediário:", configs)}
          metadataList={columns || []}
        />

        <CriarRegistroNovo
          isOpen={modalCreateOpen}
          onClose={() => setModalCreateOpen(false)}
          informacaosOftables={columns || []}
          onSave={handleRowUpdate}
        />

        {/* Controles */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 font-medium bg-gray-50 dark:bg-gray-800 px-3 py-1.5 rounded-lg border border-gray-100 dark:border-gray-700 transition-colors">
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-blue-600 dark:text-blue-400" />
                {t("common.loading") || "Carregando..."}
              </>
            ) : (
              `${getColumnCount} ${t("common.of") || "de"} ${totalCols} ${t("common.columns") || "colunas"}`
            )}

            {safeSelect.length > 0 && (
              <span className="text-blue-600 dark:text-blue-400 ml-1 border-l border-gray-300 dark:border-gray-600 pl-2">
                {safeSelect.length} {t("common.selected") || "selecionadas"}
              </span>
            )}
          </div>

          {columns && columns.length > 0 && (
            <ReportButton
              onGenerate={handleGerarRelatorio}
              formats={FORMATS}
              hasResults={true}
              isLoading={isLoadingRelatorio}
            />
          )}

          {columns && columns.length > 0 && (
            <button
              onClick={() => setOpenIntermediario(true)}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              title={t("actions.newRecord") || "Criar novo registro"}
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">{t("actions.newRecord") || "Novo Registro"}</span>
              <span className="sm:hidden">{t("actions.new") || "Novo"}</span>
            </button>
          )}

          {/* ✅ Criar coluna */}
          <button
            onClick={openCreateColumnModal}
            className="px-4 py-2 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-700 transition-colors flex items-center gap-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            title="Criar nova coluna"
          >
            <Plus className="w-4 h-4" />
            Nova Coluna
          </button>

          {/* ✅ Eliminar selecionada */}
          {selectedColumn && (
            <button
              onClick={handleDeleteSelectedColumn}
              className="px-4 py-2 bg-red-600 text-white text-sm font-bold rounded-xl hover:bg-red-700 transition-colors flex items-center gap-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500/50"
              title="Eliminar coluna selecionada"
            >
              {t("actions.delete") || "Eliminar"}
            </button>
          )}

          {/* ✅ Editar selecionada */}
          {selectedColumn && (
            <button
              onClick={openEditSelectedColumnModal}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              title="Editar coluna selecionada"
            >
              {t("actions.edit") || "Editar"}
            </button>
          )}

          <button
            onClick={() => setShowFilters((prev) => !prev)}
            className={`px-4 py-2 text-sm font-bold rounded-xl flex items-center gap-2 transition-colors border focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${showFilters
                ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800"
                : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-700"
              }`}
          >
            <Filter size={16} />
            <span className="hidden sm:inline">
              {showFilters
                ? t("actions.hideFilters") || "Esconder filtros"
                : t("actions.showFilters") || "Mostrar filtros"}
            </span>
          </button>
        </div>
      </div>

      {/* Alertas do Relatório */}
      {isLoadingRelatorio && (
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl transition-colors">
          <div className="flex justify-between text-sm font-bold text-blue-800 dark:text-blue-300 mb-3">
            <span>
              {t("reports.generating") || "Gerando relatório PDF..."} ({progressRelatorio}%)
            </span>
            <span>
              {t("reports.estimatedTime") || "Tempo estimado"}: {tempoEstimado}s
            </span>
          </div>
          <div className="w-full bg-blue-200 dark:bg-blue-950 rounded-full h-2">
            <div
              className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressRelatorio}%` }}
            />
          </div>
          <button
            onClick={cancelarGeracao}
            className="mt-3 text-[11px] uppercase tracking-wider font-bold text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 transition-colors focus:outline-none"
          >
            {t("actions.cancel") || "Cancelar"}
          </button>
        </div>
      )}

      {successRelatorio && (
        <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl flex justify-between items-center transition-colors">
          <span className="text-green-800 dark:text-green-300 text-sm font-bold">
            ✅ {t("reports.success") || "Relatório gerado com sucesso!"}
            {dadosRelatorio?.geradoEm && ` em ${dadosRelatorio.geradoEm.toLocaleString()}`}
          </span>
          <button
            onClick={resetRelatorio}
            className="text-green-800 dark:text-green-300 text-[11px] uppercase tracking-wider font-bold hover:underline focus:outline-none"
          >
            {t("actions.close") || "Fechar"}
          </button>
        </div>
      )}

      {errorRelatorio && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex justify-between items-center transition-colors">
          <span className="text-red-800 dark:text-red-300 text-sm font-bold">
            ❌ {t("reports.error") || "Erro ao gerar relatório"}: {errorRelatorio}
          </span>
          <button
            onClick={resetRelatorio}
            className="text-red-800 dark:text-red-300 text-[11px] uppercase tracking-wider font-bold hover:underline focus:outline-none"
          >
            {t("actions.tryAgain") || "Tentar novamente"}
          </button>
        </div>
      )}

      {/* Grid */}
      {showFilters && (
        <FilterableGrid
          data={paginatedColumns}
          isColumnSelected={isColumnSelected}
          handleColumnClick={handleColumnClick}
          handleColumnSelect={handleColumnSelect}
          onColumnClick={onColumnClick}
          currentTheme={currentTheme}
          showSearch
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          showFilter
          filterType={filterType}
          onFilterChange={setFilterType}
          showSort
          sortBy={sortBy}
          onSortByChange={setSortBy}
          sortOrder={sortOrder}
          onSortOrderChange={setSortOrder}
          selectable
          selectedKeys={safeSelect}
          onSelectAll={handleSelectAll}
          page={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          themeClasses={themeClasses}
          isLoading={isLoading}
          skeleton={<ColumnSkeleton theme={currentTheme} />}
          emptyState={
            <p className="text-center text-gray-500 dark:text-gray-400 py-8 font-medium">
              {t("common.noColumnsFound") || "Nenhuma coluna encontrada"}
            </p>
          }
        />
      )}
    </div>
  );
};

export default React.memo(TableColumnsDisplay);
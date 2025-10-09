"use client";
import React, { useMemo, useCallback, useState, useRef } from "react";
import { MetadataTableResponse, QueryResultType, SelectedRow } from "@/types";
import ScrollableTable from "./ScrollableTable";
import ConfirmDeleteModal from "./ConfirmDeleteModal";
import ResultsHeader from "./ResultadosQueryComponent/ResultsHeader";
import { ConfirmDeleteModalType } from "./ResultadosQueryComponent/types";
import api from "@/context/axioCuston";
import { useDeleteOperations } from "@/hook/useDeleteOperations";
import {createLogger} from "@/util/logger";

const logger = createLogger({ component: 'InteractiveResultTable' });

interface ResultTableProps {
  queryResults: QueryResultType;
  columnsInfo?: MetadataTableResponse[];
  setQueryResults: (value: QueryResultType | null) => void;
  setSelectedRow?: (row: SelectedRow) => void;
  selectedRow?: SelectedRow | null;
}

function ResultTable({
  queryResults,
  setQueryResults,
  columnsInfo = [],
  setSelectedRow,
}: ResultTableProps) {
  const [confirmDelete, setConfirmDelete] = useState<ConfirmDeleteModalType>({
    isOpen: false,
    type: "single",
    lista: []
  });
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  const mobileMenuRef = useRef<HTMLDivElement>(null);

  // Usa o hook de operações de delete
  const {
    eliminarRegistro,
    eliminarRegistrosSelecionados,
    eliminarTodosRegistros,
    state: { isDeleting, deleteProgress },
    setDeleteProgress,
    setIsDeleting
  } = useDeleteOperations();

  // Colunas e Headers com redirectUrl
  const columns = useMemo<string[]>(() => {
    return Object.keys(queryResults.preview[0] || {});
  }, [queryResults.preview]);

  const headers = useMemo<{ name: string; type: string; redirectUrl?: string }[]>(() => {
    const columnLookup = new Map<string, { tipo: string; table: string }>();

    columnsInfo.forEach((info) => {
      info.colunas.forEach((col) => {
        columnLookup.set(col.nome, { tipo: col.tipo, table: info.table_name });
      });
    });

    const headersResult = columns.map((col, index) => {
      const nameColOriginal =
        queryResults.columns[index]?.split(".")[1] ||
        queryResults.columns[index] ||
        col;

      const info = columnLookup.get(nameColOriginal);
      const tipo = info?.tipo || "unknown";

      // Adiciona redirectUrl para colunas que são foreign keys ou IDs
      const redirectUrl = (tipo === "id" || col.toLowerCase().includes("_id"))
        ? `/detalhes/${info?.table}/${col}`
        : undefined;

      return {
        name: col,
        type: tipo,
        redirectUrl
      };
    });

    columnLookup.clear();
    return headersResult;
  }, [columns, columnsInfo, queryResults.columns]);

  // Handler para confirmar e executar delete
  const handleConfirmDelete = useCallback(async () => {
    try {
      console.log("Iniciando operação de delete:", confirmDelete);
      if (confirmDelete.type === "all") {
        await eliminarTodosRegistros(queryResults, setQueryResults, columnsInfo);
      } else if (confirmDelete.type === "select") {
        await eliminarRegistrosSelecionados(confirmDelete.lista, queryResults, setQueryResults);
        setSelectedItems(new Set());
        setIsSelectionMode(false);
      } else if (
        confirmDelete.type === "single" &&
        confirmDelete.lista[0]?.row &&
        confirmDelete.lista[0]?.index !== undefined
      ) {
        await eliminarRegistro(
          confirmDelete.lista[0].row,
          confirmDelete.lista[0].table || columnsInfo.map((c) => c.table_name),
          confirmDelete.lista[0].index
        );

        // Reindexar selecionados
        const deletedIndex = confirmDelete.lista[0].index;
        if (selectedItems.has(deletedIndex)) {
          const newSelected = new Set<number>();
          selectedItems.forEach((oldIndex) => {
            if (oldIndex > deletedIndex) {
              newSelected.add(oldIndex - 1);
            } else if (oldIndex < deletedIndex) {
              newSelected.add(oldIndex);
            }
          });
          setSelectedItems(newSelected);
        }
      }

      // Fecha o modal após sucesso
      setTimeout(() => {
        setConfirmDelete((prev) => ({ ...prev, isOpen: false }));
        setDeleteProgress(0);
      }, 300);

    } catch (error) {
      console.error("Erro na operação de delete:", error);
      alert(
        `Erro ao eliminar registro(s): ${error instanceof Error ? error.message : "Erro desconhecido"}`
      );
    }
  }, [
    confirmDelete,
    eliminarRegistro,
    eliminarRegistrosSelecionados,
    eliminarTodosRegistros,
    queryResults,
    setQueryResults,
    columnsInfo,
    selectedItems,
    setDeleteProgress
  ]);

  // Handle row click
  const handleRowClick = useCallback( (row: Record<string, unknown>, index: number) => 
    {
      if (isSelectionMode) {
        setSelectedItems((prev) => {
          const newSelected = new Set(prev);
          if (newSelected.has(index)) {
            newSelected.delete(index);
          } else {
            newSelected.add(index);
          }
          return newSelected;
        });
        return;
      }

      if (!row || typeof index !== "number") return;

      const tabelasAssociadas: Set<string> = new Set();
      Object.keys(row).forEach((campo, idx) => {
        const tableName = queryResults.columns[idx]?.split(".")[0] || campo.split(".")[0];
        if (tableName && tableName.trim() !== "") {
          // console.log("Campo:", campo, "-> Tabela:", tableName);
          tabelasAssociadas.add(tableName.trim());
        }
      });

      const tabelas = Array.from(tabelasAssociadas);
      // console.log("Tabelas associadas à linha clicada:", tabelas);
      setSelectedRow?.({
        row,
        nameColumns: tabelas.length <= 1 ?  columns : queryResults.columns,
        index,
        orderBy: queryResults.QueryPayload?.orderBy,
        tableName: tabelas,
      });
      tabelasAssociadas.clear();
    },
    [setSelectedRow, columns, isSelectionMode, queryResults.QueryPayload, queryResults.columns]
  );

  // Carregar mais com virtualização
  const carregarMaisLinhas = useCallback(async () => {
    const query = queryResults.QueryPayload;
    if (!query) return;

    query.offset = queryResults.preview.length;
    query.isCountQuery = false;

    try {
      const { data } = await api.post<QueryResultType>(
        "/exe/execute_query/",
        query,
        { withCredentials: true }
      );

      if (data.success) {
        setQueryResults({
          ...queryResults,
          preview: [...queryResults.preview, ...data.preview],
        });
      }
    } catch (error) {
      console.error("Erro ao carregar mais linhas:", error);
    }
  }, [queryResults, setQueryResults]);

  // Funções de seleção
  const toggleSelectionMode = useCallback(() => {
    setIsSelectionMode((prev) => !prev);
    setSelectedItems(new Set());
  }, []);

  const selectAll = useCallback(() => {
    setSelectedItems((prev) => {
      const allSelected = prev.size === queryResults.preview.length;
      return allSelected
        ? new Set()
        : new Set(queryResults.preview.map((_, index) => index));
    });
  }, [queryResults.preview.length]);

  const clearSelection = useCallback(() => {
    setSelectedItems(new Set());
  }, []);

  // Estado de seleção
  const selectionState = useMemo(() => {
    const totalItems = queryResults.preview.length;
    const selectedCount = selectedItems.size;

    return {
      selectedCount,
      isAllSelected: selectedCount > 0 && selectedCount === totalItems,
      isSomeSelected: selectedCount > 0 && selectedCount < totalItems,
      isEmpty: selectedCount === 0,
      selectedRecords: Array.from(selectedItems).map((index) => ({
        row: queryResults.preview[index],
        index: index,
      })),
    };
  }, [selectedItems, queryResults.preview]);

  const handleDeleteSelection = useCallback(() => {
    const selectedLista = selectionState.selectedRecords.map((item) => ({
      row: item.row as Record<string, string>,
      index: item.index,
      table: columnsInfo.map((c) => c.table_name),
    }));

    setConfirmDelete({
      isOpen: true,
      type: "select",
      total: selectionState.selectedCount,
      lista: selectedLista,
    });
  }, [selectionState, columnsInfo]);

  const { selectedCount, isAllSelected, isSomeSelected } = selectionState;

  const tableData = useMemo(
    () => ({
      preview: queryResults.preview,
      totalResults: queryResults.totalResults || 0,
      columns: queryResults.columns,
      QueryPayload: queryResults.QueryPayload,
    }),
    [queryResults]
  );

  return (
    <div
      className="bg-white rounded-xl shadow-lg border border-gray-200 animate-fade-in"
      aria-label="Tabela-de-Resultados"
    >
      <ResultsHeader
        queryResults={queryResults}
        isSelectionMode={isSelectionMode}
        isDeleting={isDeleting}
        deleteProgress={deleteProgress}
        selectedItems={selectedItems}
        selectedCount={selectedCount}
        isAllSelected={isAllSelected}
        isSomeSelected={isSomeSelected}
        showMobileMenu={showMobileMenu}
        mobileMenuRef={mobileMenuRef}
        setQueryResults={setQueryResults}
        toggleSelectionMode={toggleSelectionMode}
        selectAll={selectAll}
        clearSelection={clearSelection}
        handleDeleteSelection={handleDeleteSelection}
        setConfirmDelete={setConfirmDelete}
        setShowMobileMenu={setShowMobileMenu}
        columns={columns}
        headers={headers}
      />

      {isSelectionMode && selectedCount > 0 && (
        <div className="sm:hidden mt-3 flex items-center justify-between bg-blue-50 px-3 py-2 rounded-lg border border-blue-200">
          <span className="text-sm text-blue-700 font-medium">
            {selectedCount} registro{selectedCount > 1 ? "s" : ""} selecionado
            {selectedCount > 1 ? "s" : ""}
          </span>
          <button
            onClick={selectAll}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
          >
            {selectedCount === queryResults.preview.length ? "Desmarcar" : "Selecionar"} Todos
          </button>
        </div>
      )}

      <div className="relative">
        <ScrollableTable
          columns={columns}
          headers={headers}
          queryResults={tableData.preview}
          totalFromDb={tableData.totalResults}
          onLoadMore={carregarMaisLinhas}
          handleRowClick={handleRowClick}
          selectedItems={isSelectionMode ? selectedItems : undefined}
          isSelectionMode={isSelectionMode}
          selectAll={selectAll}
        />
      </div>

      <ConfirmDeleteModal
        isOpen={confirmDelete.isOpen}
        type={confirmDelete.type}
        total={confirmDelete.total}
        lista={confirmDelete.lista}
        isDeleting={isDeleting}
        onClose={() => setConfirmDelete((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}

export default React.memo(ResultTable);
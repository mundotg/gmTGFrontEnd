"use client";

import React, {
  useMemo,
  useCallback,
  useState,
  useRef,
  useEffect,
} from "react";
import { MetadataTableResponse, QueryResultType, SelectedRow } from "@/types";
import ScrollableTable from "./ScrollableTable";
import ConfirmDeleteModal from "./ConfirmDeleteModal";
import ResultsHeader from "./ResultadosQueryComponent/ResultsHeader";
import {
  ConfirmDeleteModalType,
  PayloadDeleteRow,
} from "./ResultadosQueryComponent/types";
import api from "@/context/axioCuston";
import { useDeleteOperations } from "@/hook/useDeleteOperations";
import { createLogger } from "@/util/logger";
import { useI18n } from "@/context/I18nContext";
import { usePrimaryKeyExtractor } from "@/hook/getPrimarykeyValorOfRow";

const logger = createLogger({ component: "InteractiveResultTable" });

interface ResultTableProps {
  queryResults: QueryResultType;
  columnsInfo?: MetadataTableResponse[];
  setQueryResults: (value: QueryResultType | null) => void;
  setSelectedRow?: (row: SelectedRow) => void;
  selectedRow?: SelectedRow | null;
  setModalFetchOpen: (t: boolean) => void;
  optionModalTable?: string;
  setOptionModalTable: (s: string) => void;
  modalFetchOpen: boolean;
  responseModal?: string[];
  setResponseModal: (r?: string[]) => void;
}

function ResultTable({
  queryResults,
  responseModal,
  modalFetchOpen,
  setOptionModalTable,
  setModalFetchOpen,
  setQueryResults,
  columnsInfo = [],
  setSelectedRow,
}: ResultTableProps) {
  const { t } = useI18n();

  const [confirmDelete, setConfirmDelete] = useState<ConfirmDeleteModalType>({
    isOpen: false,
    type: "single",
    lista: [],
    payloadSelectedRow: undefined,
  });

  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [openModalConfirmeDelete, setOpenModalConfirmeDele] = useState(false);

  const mobileMenuRef = useRef<HTMLDivElement>(null);

  const { getPrimaryKeysInfo } = usePrimaryKeyExtractor(columnsInfo);

  const {
    eliminarRegistrosSelecionados,
    eliminarTodosRegistros,
    state: { isDeleting, deleteProgress },
    setDeleteProgress,
    setIsDeleting,
  } = useDeleteOperations();

  const columns = useMemo(
    () => Object.keys(queryResults.preview[0] || {}),
    [queryResults.preview]
  );

  const headers = useMemo(() => {
    return logger.measureSync("Formatar cabeçalhos da tabela", () => {
      const columnLookup = new Map<string, { tipo: string; table: string }>();

      columnsInfo.forEach((info) =>
        info.colunas.forEach((col) =>
          columnLookup.set(col.nome, {
            tipo: col.tipo,
            table: info.table_name,
          })
        )
      );

      return columns.map((col, index) => {
        const currentColumn = queryResults.columns?.[index];
        const nameColOriginal =
          currentColumn?.split(".")[2] ||
          currentColumn?.split(".")[1] ||
          currentColumn ||
          col;

        const info = columnLookup.get(nameColOriginal);
        const tipo = info?.tipo || "unknown";

        const redirectUrl =
          tipo === "id" || col.toLowerCase().includes("_id")
            ? `/detalhes/${info?.table}/${col}`
            : undefined;

        return {
          name: col?.substring?.(col?.indexOf?.(".") + 1) || col,
          type: tipo,
          redirectUrl,
        };
      });
    });
  }, [columns, columnsInfo, queryResults.columns]);

  const handleConfirmDelete = useCallback(async () => {
    return logger.measure("Operação de exclusão confirmada", async () => {
      setIsDeleting(true);

      try {
        if (confirmDelete.type === "all") {
          await eliminarTodosRegistros(queryResults, setQueryResults);
        } else if (confirmDelete.type === "select") {
          await eliminarRegistrosSelecionados(
            confirmDelete.lista,
            queryResults,
            setQueryResults
          );

          setSelectedItems(new Set());
          setIsSelectionMode(false);
        }

        setDeleteProgress(100);
      } catch (error) {
        logger.error("Erro na operação de exclusão", error);
        throw error;
      } finally {
        setTimeout(() => {
          setConfirmDelete((prev) => ({ ...prev, isOpen: false }));
          setIsDeleting(false);
          setDeleteProgress(0);
          setOpenModalConfirmeDele(false);
        }, 300);
      }
    });
  }, [
    confirmDelete,
    eliminarRegistrosSelecionados,
    eliminarTodosRegistros,
    queryResults,
    setQueryResults,
    setDeleteProgress,
    setIsDeleting,
  ]);

  const handleRowClick = useCallback(
    (row: Record<string, unknown>, index: number) => {
      if (isSelectionMode) {
        setSelectedItems((prev) => {
          const next = new Set(prev);
          if (next.has(index)) next.delete(index);
          else next.add(index);
          return next;
        });
        return;
      }

      const tabelasAssociadas = new Set<string>();

      Object.keys(row).forEach((campo, idx) => {
        const fullColumnName = queryResults.columns[idx] || campo;
        if (!fullColumnName) return;

        const parts = fullColumnName.split(".");
        const tableName =
          parts.length >= 3 ? parts.slice(0, -1).join(".") : parts[0];

        if (tableName?.trim()) {
          tabelasAssociadas.add(tableName.trim());
        }
      });

      const tabelas = Array.from(tabelasAssociadas);

      setSelectedRow?.({
        row,
        nameColumns: tabelas.length <= 1 ? columns : queryResults.columns,
        index,
        orderBy: queryResults.QueryPayload?.orderBy,
        tableName: tabelas,
      });
    },
    [
      isSelectionMode,
      queryResults.columns,
      queryResults.QueryPayload,
      setSelectedRow,
      columns,
    ]
  );

  const carregarMaisLinhas = useCallback(async () => {
    const query = queryResults.QueryPayload;
    if (!query) return;

    return logger.measure("Carregar mais linhas", async () => {
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
        logger.error("Erro ao carregar mais linhas", error);
      }
    });
  }, [queryResults, setQueryResults]);

  const toggleSelectionMode = useCallback(() => {
    setIsSelectionMode((prev) => !prev);
    setSelectedItems(new Set());
  }, []);

  const selectAll = useCallback(() => {
    const allSelected = selectedItems.size === queryResults.preview.length;
    setSelectedItems(
      allSelected ? new Set() : new Set(queryResults.preview.map((_, i) => i))
    );
  }, [selectedItems.size, queryResults.preview]);

  const clearSelection = useCallback(() => {
    setSelectedItems(new Set());
  }, []);

  const selectionState = useMemo(() => {
    const totalItems = queryResults.preview.length;
    const selectedCount = selectedItems.size;

    return {
      selectedCount,
      isAllSelected: selectedCount > 0 && selectedCount === totalItems,
      isSomeSelected: selectedCount > 0 && selectedCount < totalItems,
      isEmpty: selectedCount === 0,
      selectedRecords: Array.from(selectedItems).map((index) => ({
        row: queryResults.preview[index] as Record<string, unknown>,
        index,
        tableName: [],
        nameColumns: [],
        orderBy: queryResults.QueryPayload?.orderBy,
      })),
    };
  }, [selectedItems, queryResults.preview, queryResults.QueryPayload]);

 

  const confirmeDelet_open_modal_for_selection_table = useCallback(() => {
    setOptionModalTable("oneDelet");
    setModalFetchOpen(true);
    setOpenModalConfirmeDele(true);
  }, [setOptionModalTable, setModalFetchOpen]);

  const handleDeleteSelection = useCallback(() => {
    const tablesForDelete = responseModal || [];

    if (!tablesForDelete.length) {
      logger.warn("Nenhuma tabela foi selecionada para exclusão.");
      return;
    }

    const selectedLista: PayloadDeleteRow[] = getPrimaryKeysInfo(
      selectionState.selectedRecords,
      tablesForDelete
    );

    if (!selectedLista.length) {
      logger.warn("Nenhum registro válido foi montado para exclusão.");
      return;
    }

    logger.info("Solicitando confirmação para eliminar seleção em lote", {
      selectedCount: selectionState.selectedCount,
      indices: selectedLista.map((item) => item.rowDeletes),
      tablesForDelete,
    });

    setConfirmDelete({
      isOpen: true,
      type: "select",
      total: selectionState.selectedCount,
      lista: selectedLista,
      payloadSelectedRow: queryResults.QueryPayload,
    });
  }, [
    responseModal,
    getPrimaryKeysInfo,
    selectionState.selectedRecords,
    selectionState.selectedCount,
    queryResults.QueryPayload,
  ]);

   useEffect(() => {
    if (openModalConfirmeDelete && !modalFetchOpen) {
      handleDeleteSelection();
      setOpenModalConfirmeDele(false);
    }
  }, [openModalConfirmeDelete, modalFetchOpen, handleDeleteSelection]);

  const { selectedCount, isAllSelected, isSomeSelected } = selectionState;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 animate-in fade-in zoom-in-95 duration-200">
      <ResultsHeader
        queryResults={queryResults}
        isSelectionMode={isSelectionMode}
        isDeleting={isDeleting}
        deleteProgress={deleteProgress}
        selectedCount={selectedCount}
        isAllSelected={isAllSelected}
        isSomeSelected={isSomeSelected}
        showMobileMenu={showMobileMenu}
        mobileMenuRef={mobileMenuRef}
        setQueryResults={setQueryResults}
        toggleSelectionMode={toggleSelectionMode}
        selectAll={selectAll}
        clearSelection={clearSelection}
        handleDeleteSelection={confirmeDelet_open_modal_for_selection_table}
        setConfirmDelete={setConfirmDelete}
        setShowMobileMenu={setShowMobileMenu}
        columns={columns}
        headers={headers}
      />

      {isSelectionMode && selectedCount > 0 && (
        <div className="sm:hidden mt-2 mx-3 flex items-center justify-between bg-blue-50/50 px-4 py-2.5 rounded-lg border border-blue-100">
          <span className="text-sm font-bold text-blue-700">
            {selectedCount}{" "}
            {selectedCount > 1
              ? t("common.recordsSelected") || "registros selecionados"
              : t("common.recordSelected") || "registro selecionado"}
          </span>
          <button
            onClick={selectAll}
            className="text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors focus:outline-none"
          >
            {selectedCount === queryResults.preview.length
              ? t("actions.deselectAll") || "Desmarcar Todos"
              : t("actions.selectAll") || "Selecionar Todos"}
          </button>
        </div>
      )}

      <div className="relative">
        <ScrollableTable
          columns={columns}
          headers={headers}
          queryResults={queryResults.preview}
          totalFromDb={queryResults.totalResults || 0}
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
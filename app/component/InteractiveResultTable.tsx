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
  const loadingMoreRef = useRef(false); // evita "carregar mais" concorrente (duplicados)
  const hasMoreRef = useRef(true);       // false quando a paginação por cursor esgota

  // Nova query → reinicia o estado da paginação por cursor.
  useEffect(() => {
    hasMoreRef.current = true;
  }, [queryResults.QueryPayload]);

  const { getPrimaryKeysInfo } = usePrimaryKeyExtractor(columnsInfo);

  // Tabelas envolvidas na query (derivadas das colunas qualificadas
  // schema.tabela.coluna). Serve de fallback para a eliminação quando não se
  // escolhe manualmente, e permite saltar o modal em queries de 1 só tabela.
  const derivedTables = useMemo(() => {
    const set = new Set<string>();
    (queryResults.columns || []).forEach((c) => {
      const parts = String(c).split(".").filter(Boolean);
      if (parts.length >= 2) set.add(parts.slice(0, -1).join("."));
    });
    return Array.from(set);
  }, [queryResults.columns]);

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

  // Lê o valor de uma coluna (de ordem) numa linha, tolerando chaves
  // qualificadas (schema.tabela.coluna) ou só o nome da coluna.
  const valueOfRow = useCallback((row: Record<string, unknown> | undefined, col: string) => {
    if (!row || !col) return undefined;
    if (col in row) return row[col];
    const leaf = String(col).split(".").pop() as string;
    if (leaf in row) return row[leaf];
    const k = Object.keys(row).find((k) => String(k).split(".").pop() === leaf);
    return k ? row[k] : undefined;
  }, []);

  const carregarMaisLinhas = useCallback(async () => {
    const base = queryResults.QueryPayload;
    // Guarda: chamadas concorrentes (scroll dispara várias vezes) usariam o
    // mesmo cursor e apenderiam DUPLICADOS; e para quando esgota.
    if (!base || loadingMoreRef.current || hasMoreRef.current === false) return;
    loadingMoreRef.current = true;

    return logger.measure("Carregar mais linhas (cursor)", async () => {
      try {
        const preview = queryResults.preview;
        // Coluna de ordem (para o cursor keyset). O backend usa a que enviamos.
        const orderByArr = Array.isArray(base.orderBy)
          ? base.orderBy
          : base.orderBy
            ? [base.orderBy]
            : [];
        const firstOrder = orderByArr[0];
        const orderCol = firstOrder?.column || base.select?.[0] || columns[0];
        const direction = firstOrder?.direction || "ASC";

        // Cursor = valor da coluna de ordem na ÚLTIMA linha já carregada.
        const lastRow = preview[preview.length - 1] as Record<string, unknown> | undefined;
        const cursorVal = valueOfRow(lastRow, orderCol);
        const cursor = cursorVal != null ? String(cursorVal) : null;

        const { data } = await api.post(
          "/exe/query-more",
          {
            payload: base,
            order_column: orderCol,
            direction,
            cursor,
            limit: base.limit || 50,
          },
          { withCredentials: true }
        );

        if (data?.success && Array.isArray(data.preview) && data.preview.length > 0) {
          setQueryResults({
            ...queryResults,
            preview: [...queryResults.preview, ...data.preview],
          });
          hasMoreRef.current = !!data.has_more;
        } else {
          hasMoreRef.current = false; // sem mais linhas
        }
      } catch (error) {
        logger.error("Erro ao carregar mais linhas", error);
      } finally {
        loadingMoreRef.current = false;
      }
    });
  }, [queryResults, setQueryResults, columns, valueOfRow]);

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
    // Query de 1 só tabela → não precisa do modal de escolha; elimina direto.
    if (derivedTables.length <= 1) {
      setOpenModalConfirmeDele(true);
      setModalFetchOpen(false); // dispara o useEffect que chama handleDeleteSelection
      return;
    }
    setOptionModalTable("oneDelet");
    setModalFetchOpen(true);
    setOpenModalConfirmeDele(true);
  }, [setOptionModalTable, setModalFetchOpen, derivedTables.length]);

  const handleDeleteSelection = useCallback(() => {
    // Usa as tabelas escolhidas no modal; se vierem vazias, cai nas tabelas
    // derivadas da própria query (evita o delete falhar em silêncio).
    const tablesForDelete = (responseModal && responseModal.length ? responseModal : derivedTables);

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
    derivedTables,
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
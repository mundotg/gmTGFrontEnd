"use client";
import React, { useMemo, useCallback, useState, useRef } from "react";
import { MetadataTableResponse, QueryResultType, SelectedRow } from "@/types";
import ScrollableTable from "./ScrollableTable";
import ConfirmDeleteModal from "./ConfirmDeleteModal";
import ResultsHeader from "./ResultadosQueryComponent/ResultsHeader";
import { ConfirmDeleteModalType } from "./ResultadosQueryComponent/types";
import api from "@/context/axioCuston";
import { useDeleteOperations } from "@/hook/useDeleteOperations";
import { createLogger } from "@/util/logger";

const logger = createLogger({ component: "InteractiveResultTable" });

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
    lista: [],
  });

  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  const {
    eliminarRegistrosSelecionados,
    eliminarTodosRegistros,
    state: { isDeleting, deleteProgress },
    setDeleteProgress,
    setIsDeleting,
  } = useDeleteOperations();

  /** 🔹 Colunas da tabela */
  const columns = useMemo(
    () => Object.keys(queryResults.preview[0] || {}),
    [queryResults.preview]
  );

  /** 🔹 Cabeçalhos formatados */
  const headers = useMemo(() => {
    return logger.measureSync('Formatar cabeçalhos da tabela', () => {
      logger.debug("Iniciando formatação de cabeçalhos", {
        columnsCount: columns.length,
        columnsInfoCount: columnsInfo.length,
        queryResultsColumnsCount: queryResults.columns?.length
      });

      const columnLookup = new Map<string, { tipo: string; table: string }>();

      columnsInfo.forEach((info) =>
        info.colunas.forEach((col) =>
          columnLookup.set(col.nome, { tipo: col.tipo, table: info.table_name })
        )
      );

      const headersResult = columns.map((col, index) => {
        const nameColOriginal =
          queryResults.columns[index]?.split(".")[1] ||
          queryResults.columns[index] ||
          col;

        const info = columnLookup.get(nameColOriginal);
        const tipo = info?.tipo || "unknown";

        const redirectUrl =
          tipo === "id" || col.toLowerCase().includes("_id")
            ? `/detalhes/${info?.table}/${col}`
            : undefined;

        logger.trace(`Coluna processada`, {
          coluna: col,
          nameColOriginal,
          tipo,
          hasRedirect: !!redirectUrl
        });

        return { name: col, type: tipo, redirectUrl };
      });

      columnLookup.clear();
      
      logger.debug("Cabeçalhos formatados com sucesso", {
        totalHeaders: headersResult.length,
        headersWithRedirect: headersResult.filter(h => h.redirectUrl).length
      });

      return headersResult;
    });
  }, [columns, columnsInfo, queryResults.columns]);

  /** 🔹 Confirmação de exclusão */
  const handleConfirmDelete = useCallback(async () => {
    return logger.measure('Operação de exclusão confirmada', async () => {
      logger.info("Iniciando operação de exclusão", {
        type: confirmDelete.type,
        total: confirmDelete.total,
        listaCount: confirmDelete.lista.length
      });

      setIsDeleting(true);

      try {
        if (confirmDelete.type === "all") {
          logger.debug("Executando eliminação de todos os registros");
          await eliminarTodosRegistros(queryResults, setQueryResults);
        } else if (confirmDelete.type === "select") {
          logger.debug("Executando eliminação de registros selecionados", {
            selectedCount: confirmDelete.lista.length,
            indices: confirmDelete.lista.map(item => item.index)
          });
          await eliminarRegistrosSelecionados(confirmDelete.lista, queryResults, setQueryResults);
          setSelectedItems(new Set());
          setIsSelectionMode(false);
        }

        setDeleteProgress(100);
        logger.success("Operação de exclusão concluída com sucesso", {
          type: confirmDelete.type,
          registrosAfetados: confirmDelete.total
        });

      } catch (error) {
        logger.error("Erro na operação de exclusão", error, {
          type: confirmDelete.type,
          total: confirmDelete.total
        });
        
        // Re-lançar o erro para tratamento adicional se necessário
        throw error;
      } finally {
        setTimeout(() => {
          setConfirmDelete((prev) => ({ ...prev, isOpen: false }));
          setIsDeleting(false);
          setDeleteProgress(0);
          logger.debug("Estado da modal de confirmação resetado");
        }, 300);
      }
    }, {
      operation: 'confirmed_delete',
      deleteType: confirmDelete.type
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

  /** 🔹 Clique na linha */
  const handleRowClick = useCallback(
    (row: Record<string, unknown>, index: number) => {
      logger.trace("Clique na linha da tabela", {
        index,
        isSelectionMode,
        rowKeys: Object.keys(row || {})
      });

      if (isSelectionMode) {
        setSelectedItems((prev) => {
          const newSelected = new Set(prev);
          const wasSelected = newSelected.has(index);
          
          if (wasSelected) {
            newSelected.delete(index);
            logger.debug("Linha desmarcada", { index });
          } else {
            newSelected.add(index);
            logger.debug("Linha selecionada", { index });
          }
          
          return newSelected;
        });
        return;
      }

      // Processamento para seleção normal (não em modo de seleção)
      const tabelasAssociadas = new Set<string>();
      Object.keys(row).forEach((campo, idx) => {
        const tableName = queryResults.columns[idx]?.split(".")[0] || campo.split(".")[0];
        if (tableName && tableName.trim() !== "") {
          tabelasAssociadas.add(tableName.trim());
        }
      });

      const tabelas = Array.from(tabelasAssociadas);
      
      logger.debug("Linha selecionada para detalhes", {
        index,
        tabelas,
        tabelasCount: tabelas.length
      });

      setSelectedRow?.({
        row,
        nameColumns: tabelas.length <= 1 ? columns : queryResults.columns,
        index,
        orderBy: queryResults.QueryPayload?.orderBy,
        tableName: tabelas,
      });
    },
    [isSelectionMode, queryResults.columns, queryResults.QueryPayload, setSelectedRow, columns]
  );

  /** 🔹 Carregar mais linhas */
  const carregarMaisLinhas = useCallback(async () => {
    const query = queryResults.QueryPayload;
    if (!query) {
      logger.warn("Tentativa de carregar mais linhas sem query payload");
      return;
    }

    return logger.measure('Carregar mais linhas', async () => {
      logger.info("Carregando mais linhas", {
        offsetAtual: queryResults.preview.length,
        totalAtual: queryResults.totalResults
      });

      query.offset = queryResults.preview.length;
      query.isCountQuery = false;

      try {
        const { data } = await api.post<QueryResultType>("/exe/execute_query/", query, {
          withCredentials: true,
        });

        if (data.success) {
          const newPreview = [...queryResults.preview, ...data.preview];
          setQueryResults({
            ...queryResults,
            preview: newPreview,
          });
          
          logger.success("Mais linhas carregadas com sucesso", {
            linhasAdicionadas: data.preview.length,
            totalAgora: newPreview.length
          });
        } else {
          logger.warn("Resposta da API sem sucesso ao carregar mais linhas", {
            success: data.success,
            message: data?.query || "No message provided"
          });
        }
      } catch (error) {
        logger.error("Erro ao carregar mais linhas", error, {
          offset: query.offset,
          endpoint: "/exe/execute_query/"
        });
      }
    }, {
      operation: 'load_more_rows',
      currentOffset: queryResults.preview.length
    });
  }, [queryResults, setQueryResults]);

  /** 🔹 Controle de seleção */
  const toggleSelectionMode = useCallback(() => {
    const newMode = !isSelectionMode;
    logger.info("Alternando modo de seleção", {
      modoAnterior: isSelectionMode,
      modoNovo: newMode
    });
    
    setIsSelectionMode(newMode);
    setSelectedItems(new Set());
  }, [isSelectionMode]);

  const selectAll = useCallback(() => {
    const allSelected = selectedItems.size === queryResults.preview.length;
    const newSelection = allSelected 
      ? new Set<number>() 
      : new Set(queryResults.preview.map((_, i) => i));

    logger.debug("Ação selecionar/desselecionar todos", {
      acao: allSelected ? "Desselecionar todos" : "Selecionar todos",
      totalItens: queryResults.preview.length,
      itensSelecionados: newSelection.size
    });

    setSelectedItems(newSelection);
  }, [ selectedItems.size,queryResults.preview]);

  const clearSelection = useCallback(() => {
    logger.debug("Limpando seleção", {
      itensSelecionadosAnteriormente: selectedItems.size
    });
    setSelectedItems(new Set());
  }, [selectedItems.size]);

  /** 🔹 Estado de seleção */
  const selectionState = useMemo(() => {
    return logger.measureSync('Calcular estado de seleção', () => {
      const totalItems = queryResults.preview.length;
      const selectedCount = selectedItems.size;

      const state = {
        selectedCount,
        isAllSelected: selectedCount > 0 && selectedCount === totalItems,
        isSomeSelected: selectedCount > 0 && selectedCount < totalItems,
        isEmpty: selectedCount === 0,
        selectedRecords: Array.from(selectedItems).map((index) => ({
          row: queryResults.preview[index],
          index,
        })),
      };

      logger.trace("Estado de seleção calculado", state);
      return state;
    });
  }, [selectedItems, queryResults.preview]);

  const handleDeleteSelection = useCallback(() => {
    const selectedLista = selectionState.selectedRecords.map((item) => ({
      row: item.row as Record<string, string>,
      index: item.index,
      table: columnsInfo.map((c) => c.table_name),
    }));

    logger.info("Solicitando confirmação para eliminar seleção", {
      selectedCount: selectionState.selectedCount,
      indices: selectedLista.map(item => item.index)
    });

    setConfirmDelete({
      isOpen: true,
      type: "select",
      total: selectionState.selectedCount,
      lista: selectedLista,
    });
  }, [selectionState, columnsInfo]);

  const { selectedCount, isAllSelected, isSomeSelected } = selectionState;

  // Log quando o componente renderiza
  logger.debug("Componente ResultTable renderizado", {
    previewCount: queryResults.preview?.length,
    selectedCount,
    isSelectionMode,
    isDeleting
  });

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 animate-fade-in">
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
            {selectedCount} registro{selectedCount > 1 ? "s" : ""} selecionado{selectedCount > 1 ? "s" : ""}
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
        onClose={() => {
          logger.debug("Modal de confirmação fechado pelo usuário");
          setConfirmDelete((prev) => ({ ...prev, isOpen: false }));
        }}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}

export default React.memo(ResultTable);
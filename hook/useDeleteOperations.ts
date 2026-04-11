import { useCallback, useRef, useState } from "react";
import { QueryResultType } from "@/types";
import api from "@/context/axioCuston";
import { createLogger } from "@/util/logger";
import {
  BatchDeleteRequest,
  PayloadDeleteRow,
} from "@/app/component/ResultadosQueryComponent/types";

const logger = createLogger({ hook: "useDeleteOperations" });

interface DeleteOperationState {
  isDeleting: boolean;
  deleteProgress: number;
}

interface DeleteOperations {
  eliminarRegistrosSelecionados: (
    lista: PayloadDeleteRow[],
    queryResults: QueryResultType,
    setQueryResults: (value: QueryResultType | null) => void
  ) => Promise<void>;

  eliminarTodosRegistros: (
    queryResults: QueryResultType,
    setQueryResults: (value: QueryResultType | null) => void
  ) => Promise<void>;

  state: DeleteOperationState;
  setDeleteProgress: (progress: number) => void;
  setIsDeleting: (deleting: boolean) => void;
}

export const useDeleteOperations = (): DeleteOperations => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteProgress, setDeleteProgress] = useState(0);
  const deleteInProgressRef = useRef(false);
  const progressResetTimeoutRef = useRef<number | null>(null);

  const resetProgressLater = useCallback(() => {
    if (progressResetTimeoutRef.current) {
      window.clearTimeout(progressResetTimeoutRef.current);
    }

    progressResetTimeoutRef.current = window.setTimeout(() => {
      setDeleteProgress(0);
      progressResetTimeoutRef.current = null;
    }, 300);
  }, []);

  const eliminarRegistrosSelecionados = useCallback(
    async (
      lista: PayloadDeleteRow[],
      queryResults: QueryResultType,
      setQueryResults: (value: QueryResultType | null) => void
    ): Promise<void> => {
      if (deleteInProgressRef.current) {
        logger.warn("Operação de exclusão já em andamento");
        return;
      }

      if (!lista?.length) {
        logger.warn("Nenhum registro selecionado para exclusão");
        return;
      }

      return logger.measure(
        "Eliminação em lote de registros",
        async () => {
          logger.info("Iniciando exclusão em lote", {
            totalRegistros: lista.length,
            totalPreviewAtual: queryResults.preview?.length ?? 0,
          });

          deleteInProgressRef.current = true;
          setIsDeleting(true);
          setDeleteProgress(0);

          try {
            setDeleteProgress(20);

            const payloadsValidos = lista.filter(
              (item) =>
                item &&
                Array.isArray(item.tableForDelete) &&
                item.tableForDelete.length > 0 &&
                item.rowDeletes &&
                Object.keys(item.rowDeletes).length > 0
            );

            if (!payloadsValidos.length) {
              throw new Error("Nenhum payload válido para exclusão foi gerado.");
            }

            logger.debug("Payloads validados com sucesso", {
              totalPayloads: payloadsValidos.length,
              payloadsSummary: payloadsValidos.map((p) => ({
                tables: Object.keys(p.rowDeletes || {}),
                tablesWithValues: Object.entries(p.rowDeletes || {})
                  .filter(([_, config]) => config.primaryKeyValue != null)
                  .map(([tableName]) => tableName),
                tablesWithoutValues: Object.entries(p.rowDeletes || {})
                  .filter(([_, config]) => config.primaryKeyValue == null)
                  .map(([tableName]) => tableName),
              })),
              hasQueryPayload: !!queryResults.QueryPayload,
            });

            setDeleteProgress(50);

            const requestPayload: BatchDeleteRequest = {
              registros: payloadsValidos,
              payloadSelectedRow: queryResults.QueryPayload,
            };

            logger.debug("Enviando payload para API", {
              endpoint: "/delete/records",
              registrosCount: payloadsValidos.length,
              payloadSize: JSON.stringify(requestPayload).length,
            });

            const response = await api.delete("/delete/records", {
              data: requestPayload,
              withCredentials: true,
            });

            if (!response.data) {
              throw new Error("Resposta da API vazia");
            }

            logger.debug("Resposta da API recebida", {
              status: response.status,
            });

            setDeleteProgress(80);

            const indicesParaRemover = new Set<number>();

            for (const item of payloadsValidos) {
              for (const rowDelete of Object.values(item.rowDeletes || {})) {
                if (typeof rowDelete.index === "number" && rowDelete.index >= 0) {
                  indicesParaRemover.add(rowDelete.index);
                }
              }
            }

            const previewAtual = Array.isArray(queryResults.preview)
              ? queryResults.preview
              : [];

            const newPreview = previewAtual.filter(
              (_, idx) => !indicesParaRemover.has(idx)
            );

            const totalRemovido = indicesParaRemover.size;
            const novoTotal = Math.max(
              0,
              (queryResults.totalResults || 0) - totalRemovido
            );

            setQueryResults({
              ...queryResults,
              preview: newPreview,
              totalResults: novoTotal,
            });

            setDeleteProgress(100);

            logger.success("Exclusão em lote concluída com sucesso", {
              registrosEliminados: totalRemovido,
              previewAtualizado: newPreview.length,
              totalResultsAtualizado: novoTotal,
            });
          } catch (error) {
            logger.error("Erro durante exclusão em lote", error, {
              listaCount: lista.length,
              queryResultsPreviewCount: queryResults.preview?.length,
              hasQueryPayload: !!queryResults.QueryPayload,
            });
            throw error;
          } finally {
            deleteInProgressRef.current = false;
            setIsDeleting(false);
            resetProgressLater();
          }
        },
        {
          operation: "batch_delete",
          batchSize: lista.length,
        }
      );
    },
    [resetProgressLater]
  );

  const eliminarTodosRegistros = useCallback(
    async (
      queryResults: QueryResultType,
      setQueryResults: (value: QueryResultType | null) => void
    ): Promise<void> => {
      if (deleteInProgressRef.current) {
        logger.warn("Operação de exclusão já em andamento");
        return;
      }

      return logger.measure(
        "Eliminação de todos os registros",
        async () => {
          deleteInProgressRef.current = true;
          setIsDeleting(true);
          setDeleteProgress(0);

          try {
            if (!queryResults.QueryPayload) {
              throw new Error(
                "QueryPayload não encontrado para eliminar todos os registros."
              );
            }

            setDeleteProgress(30);

            const response = await api.delete("/delete/delete_all", {
              data: queryResults.QueryPayload,

              withCredentials: true,
            });

            if (!response.data) {
              throw new Error("Resposta da API vazia");
            }

            setDeleteProgress(70);

            setQueryResults({
              ...queryResults,
              preview: [],
              totalResults: 0,
            });

            setDeleteProgress(100);

            logger.success("Todos os registros eliminados com sucesso", {
              totalResultsAnterior: queryResults.totalResults,
            });
          } catch (error) {
            logger.error("Erro ao eliminar todos os registros", error, {
              previewCount: queryResults.preview?.length,
              hasQueryPayload: !!queryResults.QueryPayload,
            });
            throw error;
          } finally {
            deleteInProgressRef.current = false;
            setIsDeleting(false);
            resetProgressLater();
          }
        },
        {
          operation: "delete_all_records",
        }
      );
    },
    [resetProgressLater]
  );

  const setDeleteProgressWrapper = useCallback((progress: number) => {
    setDeleteProgress(progress);
  }, []);

  const setIsDeletingWrapper = useCallback((deleting: boolean) => {
    setIsDeleting(deleting);
  }, []);

  return {
    eliminarRegistrosSelecionados,
    eliminarTodosRegistros,
    state: { isDeleting, deleteProgress },
    setDeleteProgress: setDeleteProgressWrapper,
    setIsDeleting: setIsDeletingWrapper,
  };
};
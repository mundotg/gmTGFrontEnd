import { useCallback, useMemo, useState } from "react";
import { MetadataTableResponse, SelectedRow } from "@/types";
import { createLogger } from "@/util/logger";
import { usePrimaryKeyExtractor } from "./getPrimarykeyValorOfRow";
import { PayloadDeleteRow } from "@/app/component/ResultadosQueryComponent/types";

const logger = createLogger({ hook: "useRowDelete" });

interface UseRowDeleteProps {
  row: SelectedRow | null;
  responseModal?: string[];
  setResponseModal?: (r?: string[]) => void;
  selectedTables: MetadataTableResponse[];
  onDelete?: (payload: PayloadDeleteRow, rowIndex: number) => Promise<void>;
  onClose: () => void;
}

interface UseRowDeleteReturn {
  handleDelete: () => Promise<void>;
  showDeleteConfirm: boolean;
  setShowDeleteConfirm: (show: boolean) => void;
  isDeleting: boolean;
}

export const useRowDelete = ({
  row,
  responseModal,
  selectedTables,
  onDelete,
  onClose,
}: UseRowDeleteProps): UseRowDeleteReturn => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const { getPrimaryKeyInfo } = usePrimaryKeyExtractor(selectedTables);

  const tablesForDelete = useMemo(() => responseModal ?? [], [responseModal]);

  const handleDelete = useCallback(async () => {
    if (!onDelete || !row) {
      logger.warn("Operação de delete cancelada - condições não atendidas", {
        hasOnDelete: !!onDelete,
        hasRow: !!row,
        rowIndex: row?.index,
      });
      return;
    }

    const confirmed = window.confirm(
      "Tens a certeza que queres ELIMINAR este registro? Esta ação não pode ser desfeita."
    );

    if (!confirmed) {
      logger.debug("Usuário cancelou a eliminação na confirmação", {
        rowIndex: row.index,
      });
      return;
    }

    return logger.measure(
      "Eliminação de registro via modal",
      async () => {
        logger.info("Iniciando processo de eliminação", {
          rowIndex: row.index,
          tableNames: row.tableName,
          selectedTablesCount: selectedTables.length,
          tablesForDelete,
        });

        setIsDeleting(true);

        try {
          const primaryKeyInfo = getPrimaryKeyInfo(row, tablesForDelete);

          logger.debug("Payload de delete montado", {
            payloadStructure: {
              tables: Object.keys(primaryKeyInfo.rowDeletes),
              tablesWithIdentifier: Object.entries(primaryKeyInfo.rowDeletes).map(
                ([tableName, config]) => ({
                  tableName,
                  primaryKey: config.primaryKey,
                  primaryKeyValue: config.primaryKeyValue,
                  isPrimarykeyOrUnique: config.isPrimarykeyOrUnique,
                  index: config.index,
                })
              ),
            },
          });

          await onDelete(primaryKeyInfo, row.index ?? -1);

          logger.success("Registro eliminado com sucesso", {
            rowIndex: row.index,
            tables: Object.keys(primaryKeyInfo.rowDeletes),
            tablesWithValues: Object.entries(primaryKeyInfo.rowDeletes)
              .filter(([_, config]) => config.primaryKeyValue !== undefined)
              .map(([tableName]) => tableName),
          });

          onClose();
        } catch (error) {
          let errorMessage = "Erro desconhecido ao eliminar registro";
          let logLevel: "warn" | "error" = "error";
          const errorContext: Record<string, unknown> = {
            rowIndex: row.index,
            tablesForDelete,
          };

          if (error instanceof Error) {
            if (error.message.includes("chave única")) {
              errorMessage =
                "Não foi possível identificar unicamente este registro para eliminação. O registro pode ter campos insuficientes para identificação única.";
              logLevel = "warn";
              errorContext.issue = "missing_unique_identifier";
            } else if (error.message.includes("Dados insuficientes")) {
              errorMessage =
                "Dados insuficientes para realizar a eliminação. Verifique se o registro está completo.";
              logLevel = "warn";
              errorContext.issue = "insufficient_data";
            } else {
              errorMessage = error.message;
              errorContext.originalError = error.message;
            }
          }

          if (logLevel === "warn") {
            logger.warn("Falha na eliminação do registro", {
              error,
              errorContext,
            });
          } else {
            logger.error("Falha na eliminação do registro", error, {
              errorContext,
            });
          }

          alert(`Erro ao eliminar registro: ${errorMessage}`);
        } finally {
          setIsDeleting(false);
          setShowDeleteConfirm(false);

          logger.debug("Estado de deleção resetado", {
            isDeleting: false,
            showDeleteConfirm: false,
          });
        }
      },
      {
        operation: "modal_row_delete",
        rowIndex: row.index,
      }
    );
  }, [onDelete, row, getPrimaryKeyInfo, onClose, selectedTables.length, tablesForDelete]);

  const setShowDeleteConfirmWrapper = useCallback((show: boolean) => {
    logger.debug("Alterando estado de confirmação de delete", {
      show,
      rowIndex: row?.index,
    });

    setShowDeleteConfirm(show);
  }, [row?.index]);

  return {
    handleDelete,
    showDeleteConfirm,
    setShowDeleteConfirm: setShowDeleteConfirmWrapper,
    isDeleting,
  };
};
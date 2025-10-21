import { useCallback } from "react";
import { MetadataTableResponse, PayloadDeleteRow, SelectedRow } from "@/types";
import { findIdentifierField } from "@/util/func";
import { createLogger } from '@/util/logger';
const logger = createLogger({ hook: 'usePrimaryKeyExtractor' });

/**
 * Hook reutilizável que extrai informações da chave primária
 * de um registro, garantindo que não haja sobrescrita e
 * que todas as tabelas envolvidas sejam corretamente mapeadas.
 */
export const usePrimaryKeyExtractor = (
  row: SelectedRow | null,
  selectedTables: MetadataTableResponse[]
) => {
  const getPrimaryKeyInfo = useCallback((): PayloadDeleteRow => {
    return logger.measureSync("Extrair informações da chave primária", () => {
      logger.debug("Iniciando extração de chaves primárias", {
        hasRow: !!row,
        selectedTablesCount: selectedTables.length,
        rowIndex: row?.index,
        tableNames: row?.tableName,
      });

      if (!row || selectedTables.length === 0) {
        const error = new Error("Dados insuficientes para identificar o registro");
        logger.error("Falha na validação inicial", error, {
          row: row ? Object.keys(row) : null,
          selectedTablesCount: selectedTables.length,
        });
        throw error;
      }

      const payload: PayloadDeleteRow = {
        index: row.index ?? -1,
        rowDeletes: {},
      };

      const rowEntries = Object.entries(row.row || {});
      const nameColumns = row.nameColumns || [];
      const mainTableName = row.tableName?.[0] || "unknown_table";

      rowEntries.forEach(([key, value], index) => {
        let columnName = key;
        let tableName = mainTableName;

        if (index < nameColumns.length && nameColumns[index]) {
          columnName = nameColumns[index];
          if (columnName.includes(".")) {
            const [tbl, col] = columnName.split(".");
            tableName = tbl;
            columnName = col;
          }
        }

        if (!payload.rowDeletes[tableName]) {
          const primaryKeyField = findIdentifierField(tableName, selectedTables);
          payload.rowDeletes[tableName] = primaryKeyField
            ? {
              primaryKey: primaryKeyField.nome,
              primaryKeyValue: "",
              keyType: primaryKeyField.tipo || "text",
            }
            : {
              primaryKey: "",
              primaryKeyValue: "",
              keyType: "text",
            };
        }

        const tableConfig = payload.rowDeletes[tableName];
        const primaryKeyField = findIdentifierField(tableName, selectedTables);

        if (!tableConfig.primaryKey && primaryKeyField) {
          tableConfig.primaryKey = primaryKeyField.nome;
          tableConfig.keyType = primaryKeyField.tipo || "text";
          tableConfig.isPrimarykeyOrUnique = primaryKeyField.is_primary_key || primaryKeyField.is_unique;
        }

        if (
          primaryKeyField &&
          columnName === primaryKeyField.nome &&
          !tableConfig.primaryKeyValue
        ) {
          tableConfig.primaryKeyValue = value !== null && value !== undefined ? String(value) : "";
          tableConfig.isPrimarykeyOrUnique = primaryKeyField.is_primary_key || primaryKeyField.is_unique;
        }
      });

      const validTables = Object.entries(payload.rowDeletes)
        .filter(([_, cfg]) => cfg.primaryKey && cfg.primaryKeyValue)
        .map(([t]) => t);

      if (validTables.length === 0) {
        throw new Error("Não foi possível identificar uma chave única para eliminação");
      }

      return payload;
    });
  }, [row, selectedTables]);

  return { getPrimaryKeyInfo };
};

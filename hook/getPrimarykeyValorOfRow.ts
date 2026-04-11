import { useCallback } from "react";
import { MetadataTableResponse, SelectedRow, tipo_db_Options } from "@/types";
import { findIdentifierField } from "@/util/func";
import { createLogger } from "@/util/logger";
import { PayloadDeleteRow, RowDelete } from "@/app/component/ResultadosQueryComponent/types";

const logger = createLogger({ hook: "usePrimaryKeyExtractor" });

export const usePrimaryKeyExtractor = (
  selectedTables: MetadataTableResponse[]
) => {
  const buildPayloadFromRow = useCallback(
  (row: SelectedRow, tablesForDelete: string[]): PayloadDeleteRow => {
    return logger.measureSync("Extrair informações da chave primária", () => {
      logger.debug("Iniciando extração de chaves primárias", {
        hasRow: !!row,
        selectedTablesCount: selectedTables.length,
        rowIndex: row?.index,
        tableNames: row?.tableName,
        tablesForDelete,
      });

      if (!row || !row.row || selectedTables.length === 0) {
        const error = new Error("Dados insuficientes para identificar o registro");
        logger.error("Falha na validação inicial", error, {
          row: row ? Object.keys(row.row || {}) : null,
          selectedTablesCount: selectedTables.length,
        });
        throw error;
      }

      const payload: PayloadDeleteRow = {
        tableForDelete: tablesForDelete,
        rowDeletes: {},
      };

      const rowData = row.row || {};

      tablesForDelete.forEach((targetTable) => {
        const defaultDelete: RowDelete = {
          index: row.index ?? -1,
        };

        const tableMeta = selectedTables.find(
          (t) =>
            t.table_name === targetTable ||
            t.table_name.split(".").pop() === targetTable.split(".").pop()
        );

        if (!tableMeta) {
          payload.rowDeletes[targetTable] = defaultDelete;
          logger.warn(
            `Metadados não encontrados para a tabela ${targetTable}. Usando fallback.`
          );
          return;
        }

        const pkField = findIdentifierField(tableMeta.table_name, selectedTables);

        if (!pkField) {
          payload.rowDeletes[targetTable] = {
            ...defaultDelete,
            primaryKey: "id",
            primaryKeyValue: undefined,
            isPrimarykeyOrUnique: false,
          };

          logger.warn(
            `Não foi encontrada PK/Unique para a tabela ${targetTable}. Retornando fallback com primaryKey='id'.`
          );
          return;
        }

        const justTable = tableMeta.table_name.includes(".")
          ? tableMeta.table_name.split(".").pop()!
          : tableMeta.table_name;

        const targetTableJustName = targetTable.includes(".")
          ? targetTable.split(".").pop()!
          : targetTable;

        const keyWithSchema = `${tableMeta.table_name}.${pkField.nome}`;
        const keyWithTargetTable = `${targetTable}.${pkField.nome}`;
        const keyWithTable = `${justTable}.${pkField.nome}`;
        const keyWithTargetJustTable = `${targetTableJustName}.${pkField.nome}`;
        const keyJustColumn = pkField.nome;

        const possibleKeys = [
          keyWithSchema,
          keyWithTargetTable,
          keyWithTable,
          keyWithTargetJustTable,
          keyJustColumn,
        ];

        let correctKey =
          possibleKeys.find((key) =>
            Object.prototype.hasOwnProperty.call(rowData, key)
          ) ?? null;

        if (!correctKey) {
          const rowKeys = Object.keys(rowData);

          correctKey =
            rowKeys.find((key) => key === `${targetTable}.${pkField.nome}`) ||
            rowKeys.find((key) => key === `${tableMeta.table_name}.${pkField.nome}`) ||
            rowKeys.find(
              (key) =>
                key.endsWith(`.${pkField.nome}`) && key.includes(justTable)
            ) ||
            rowKeys.find(
              (key) =>
                key.endsWith(`.${pkField.nome}`) &&
                key.includes(targetTableJustName)
            ) ||
            rowKeys.find((key) => key.split(".").pop() === pkField.nome) ||
            null;
        }

        console.log("rowData:", rowData);
        console.log("possibleKeys:", possibleKeys);
        console.log("correctKey:", correctKey);

        const isPrimarykeyOrUnique = !!(
          pkField.is_primary_key || pkField.is_unique
        );

        if (!correctKey) {
          payload.rowDeletes[targetTable] = {
            ...defaultDelete,
            primaryKey: pkField.nome,
            primaryKeyValue: undefined,
            keyType: pkField.tipo as tipo_db_Options,
            isPrimarykeyOrUnique,
          };

          logger.warn(
            `Campo identificador '${pkField.nome}' não encontrado na row para a tabela ${targetTable}.`
          );
          return;
        }

        const pkValue = rowData[correctKey];

        payload.rowDeletes[targetTable] = {
          ...defaultDelete,
          primaryKey: pkField.nome,
          primaryKeyValue:
            pkValue !== null && pkValue !== undefined
              ? String(pkValue)
              : undefined,
          keyType: pkField.tipo as tipo_db_Options,
          isPrimarykeyOrUnique,
        };
      });

      logger.debug("Extração concluída com sucesso", { payload });
      return payload;
    });
  },
  [selectedTables]
);

  const getPrimaryKeyInfo = useCallback(
    (row: SelectedRow | null, tablesForDelete: string[]): PayloadDeleteRow => {
      if (!row) {
        throw new Error("Nenhum registro selecionado.");
      }

      return buildPayloadFromRow(row, tablesForDelete);
    },
    [buildPayloadFromRow]
  );

  const getPrimaryKeysInfo = useCallback(
    (rows: SelectedRow[], tablesForDelete: string[]): PayloadDeleteRow[] => {
      if (!rows || rows.length === 0) {
        return [];
      }

      return rows.map((row) => buildPayloadFromRow(row, tablesForDelete));
    },
    [buildPayloadFromRow]
  );

  return {
    getPrimaryKeyInfo,
    getPrimaryKeysInfo,
  };
};